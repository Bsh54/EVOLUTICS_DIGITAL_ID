/**
 * Authentication Routes
 * Gestion du flux OIDC avec eSignet
 */

const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { generatePKCE } = require('../utils/pkce');

/**
 * GET /auth/login
 * Initie le flux de connexion OIDC
 */
router.get('/login', async (req, res, next) => {
  try {
    console.log('🔐 Initiating login flow...');

    // Générer PKCE
    const { codeVerifier, codeChallenge } = generatePKCE();

    // Stocker code_verifier en session
    req.session.codeVerifier = codeVerifier;

    // Construire l'URL d'autorisation
    const authUrl = authService.buildAuthorizationUrl({
      codeChallenge,
      state: req.session.id,
      nonce: Math.random().toString(36).substring(7)
    });

    console.log('✅ Redirecting to eSignet:', authUrl);
    res.json({ authUrl });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/callback
 * Callback après authentification eSignet
 */
router.get('/callback', async (req, res, next) => {
  try {
    const { code, state, error, error_description } = req.query;

    console.log('🔄 Callback received:', { code: !!code, state, error });

    // Vérifier les erreurs
    if (error) {
      console.error('❌ Authentication error:', error, error_description);
      return res.redirect(`${process.env.FRONTEND_URL}?error=${error}&error_description=${error_description}`);
    }

    // Vérifier le state (protection CSRF)
    if (state !== req.session.id) {
      console.error('❌ Invalid state parameter');
      return res.redirect(`${process.env.FRONTEND_URL}?error=invalid_state`);
    }

    // Vérifier le code
    if (!code) {
      console.error('❌ Missing authorization code');
      return res.redirect(`${process.env.FRONTEND_URL}?error=missing_code`);
    }

    // Récupérer le code_verifier
    const codeVerifier = req.session.codeVerifier;
    if (!codeVerifier) {
      console.error('❌ Missing code_verifier in session');
      return res.redirect(`${process.env.FRONTEND_URL}?error=missing_verifier`);
    }

    // Échanger le code contre des tokens
    console.log('🔄 Exchanging code for tokens...');
    const tokens = await authService.exchangeCodeForTokens(code, codeVerifier);

    console.log('✅ Tokens received:', {
      access_token: !!tokens.access_token,
      id_token: !!tokens.id_token
    });

    // Décoder et valider l'ID token
    const userInfo = await authService.validateAndDecodeIdToken(tokens.id_token);

    console.log('✅ User authenticated:', userInfo.sub);

    // Récupérer les informations utilisateur complètes depuis /userinfo
    const userDetails = await authService.getUserInfo(tokens.access_token);

    console.log('✅ User details from userinfo:', userDetails);

    // Stocker les informations en session
    req.session.user = {
      sub: userInfo.sub,
      name: userDetails.name || userDetails.given_name || 'Utilisateur',
      phone_number: userDetails.phone_number || userDetails.phone || '-',
      email: userDetails.email || '-'
    };
    req.session.accessToken = tokens.access_token;

    // Nettoyer la session
    delete req.session.codeVerifier;

    // Rediriger vers le dashboard
    const redirectUrl = `${process.env.FRONTEND_URL}/dashboard.html`;

    console.log('✅ Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ Callback error:', error);
    next(error);
  }
});

/**
 * POST /auth/logout
 * Déconnexion
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }

    console.log('✅ User logged out');
    res.json({ success: true });
  });
});

/**
 * GET /auth/status
 * Vérifier le statut d'authentification
 */
router.get('/status', (req, res) => {
  if (req.session.user) {
    res.json({
      authenticated: true,
      user: req.session.user
    });
  } else {
    res.json({
      authenticated: false
    });
  }
});

module.exports = router;
