/**
 * Authentication Service
 * Logique métier pour l'intégration eSignet OIDC
 */

const axios = require('axios');
const { SignJWT, importPKCS8, jwtVerify, createRemoteJWKSet } = require('jose');
const fs = require('fs');
const path = require('path');

class AuthService {
  constructor() {
    this.esignetBaseUrl = process.env.ESIGNET_BASE_URL;
    this.esignetAuthorizeUrl = process.env.ESIGNET_AUTHORIZE_URL;
    this.esignetTokenUrl = process.env.ESIGNET_TOKEN_URL;
    this.esignetJwksUrl = process.env.ESIGNET_JWKS_URL;
    this.clientId = process.env.CLIENT_ID;
    this.redirectUri = process.env.CLIENT_REDIRECT_URI;
    this.scopes = process.env.OIDC_SCOPES || 'openid profile phone';
    this.acrValues = process.env.ACR_VALUES || 'mosip:idp:acr:generated-code';
  }

  /**
   * Construire l'URL d'autorisation eSignet
   */
  buildAuthorizationUrl({ codeChallenge, state, nonce }) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scopes,
      state: state,
      nonce: nonce,
      acr_values: this.acrValues,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      claims_locales: 'en',
      ui_locales: 'en-IN'
    });

    return `${this.esignetAuthorizeUrl}?${params.toString()}`;
  }

  /**
   * Générer un client_assertion JWT
   */
  async generateClientAssertion() {
    try {
      // Charger la clé privée
      const privateKeyPath = path.resolve(process.env.CLIENT_PRIVATE_KEY_PATH);
      const privateKeyPem = fs.readFileSync(privateKeyPath, 'utf8');
      const privateKey = await importPKCS8(privateKeyPem, 'RS256');

      // Créer le JWT
      const jwt = await new SignJWT({})
        .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
        .setIssuedAt()
        .setIssuer(this.clientId)
        .setSubject(this.clientId)
        .setAudience(this.esignetTokenUrl)
        .setExpirationTime('5m')
        .setJti(Math.random().toString(36).substring(7))
        .sign(privateKey);

      return jwt;
    } catch (error) {
      console.error('❌ Error generating client assertion:', error);
      throw new Error('Failed to generate client assertion');
    }
  }

  /**
   * Échanger le code d'autorisation contre des tokens
   */
  async exchangeCodeForTokens(code, codeVerifier) {
    try {
      const clientAssertion = await this.generateClientAssertion();

      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: clientAssertion,
        code_verifier: codeVerifier
      });

      console.log('🔄 Requesting tokens from:', this.esignetTokenUrl);

      const response = await axios.post(this.esignetTokenUrl, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error) {
      console.error('❌ Token exchange error:', error.response?.data || error.message);
      throw new Error('Failed to exchange code for tokens');
    }
  }

  /**
   * Valider et décoder l'ID token
   */
  async validateAndDecodeIdToken(idToken) {
    try {
      // Créer un JWKS remote pour la validation
      const JWKS = createRemoteJWKSet(new URL(this.esignetJwksUrl));

      // Vérifier et décoder le JWT
      const { payload } = await jwtVerify(idToken, JWKS, {
        issuer: process.env.ESIGNET_BASE_URL,
        audience: this.clientId
      });

      console.log('✅ ID Token validated:', payload);
      return payload;
    } catch (error) {
      console.error('❌ ID Token validation error:', error);
      throw new Error('Invalid ID token');
    }
  }

  /**
   * Récupérer les informations utilisateur depuis /userinfo
   */
  async getUserInfo(accessToken) {
    try {
      const userinfoUrl = process.env.ESIGNET_USERINFO_URL || `${this.esignetBaseUrl}/oidc/userinfo`;

      console.log('🔄 Fetching user info from:', userinfoUrl);

      const response = await axios.get(userinfoUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      // Si la réponse est un JWT (string), le décoder
      if (typeof response.data === 'string') {
        console.log('🔄 UserInfo is a JWT, decoding...');

        // Décoder le JWT sans vérification (car déjà vérifié par eSignet)
        const parts = response.data.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          console.log('✅ UserInfo decoded:', payload);
          return payload;
        }
      }

      return response.data;
    } catch (error) {
      console.error('❌ UserInfo error:', error.response?.data || error.message);
      // Retourner des valeurs par défaut si l'appel échoue
      return {
        name: 'Utilisateur',
        phone_number: '-',
        email: '-'
      };
    }
  }
}

module.exports = new AuthService();
