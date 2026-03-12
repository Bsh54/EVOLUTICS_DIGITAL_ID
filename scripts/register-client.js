/**
 * Script d'enregistrement du client OIDC dans eSignet
 * À exécuter une seule fois pour configurer CottonPay comme Relying Party
 */

require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { generateKeyPairSync } = require('crypto');

const ESIGNET_BASE_URL = process.env.ESIGNET_BASE_URL || 'http://localhost:8088/v1/esignet';
const CLIENT_NAME = 'CottonPay ID';
const REDIRECT_URI = process.env.CLIENT_REDIRECT_URI || 'http://localhost:3002/callback';

async function generateRSAKeyPair() {
  console.log('🔑 Génération de la paire de clés RSA...');

  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  // Créer le dossier keys s'il n'existe pas
  const keysDir = path.resolve(__dirname, '../keys');
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
  }

  // Sauvegarder les clés
  fs.writeFileSync(path.join(keysDir, 'private-key.pem'), privateKey);
  fs.writeFileSync(path.join(keysDir, 'public-key.pem'), publicKey);

  console.log('✅ Clés générées et sauvegardées dans ./keys/');

  return { publicKey, privateKey };
}

function pemToJWK(publicKeyPem) {
  // Extraire le modulus (n) et l'exposant (e) de la clé publique
  const publicKey = crypto.createPublicKey(publicKeyPem);
  const jwk = publicKey.export({ format: 'jwk' });

  return {
    kty: 'RSA',
    e: jwk.e,
    n: jwk.n,
    alg: 'RS256',
    use: 'sig'
  };
}

async function getCsrfToken() {
  console.log('🔄 Récupération du token CSRF...');

  try {
    const response = await axios.get(`${ESIGNET_BASE_URL}/csrf/token`);
    const csrfToken = response.data.token || response.data.response?.csrfToken;
    console.log('✅ Token CSRF obtenu');
    return csrfToken;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du token CSRF:', error.message);
    throw error;
  }
}

async function registerClient(publicKeyJWK, csrfToken) {
  console.log('📝 Enregistrement du client OIDC...');

  const clientData = {
    requestTime: new Date().toISOString(),
    request: {
      clientName: {
        '@none': CLIENT_NAME
      },
      logoUri: 'https://via.placeholder.com/150',
      redirectUris: [REDIRECT_URI],
      grantTypes: ['authorization_code'],
      clientAuthMethods: ['private_key_jwt'],
      publicKey: publicKeyJWK,
      authContextRefs: ['mosip:idp:acr:generated-code', 'mosip:idp:acr:biometrics'],
      userClaims: ['name', 'phone_number', 'email', 'picture'],
      status: 'ACTIVE'
    }
  };

  try {
    const response = await axios.post(
      `${ESIGNET_BASE_URL}/client-mgmt/oidc-client`,
      clientData,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': csrfToken
        }
      }
    );

    const clientId = response.data.response.clientId;
    console.log('✅ Client enregistré avec succès!');
    console.log('📋 Client ID:', clientId);

    return clientId;
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement:', error.response?.data || error.message);
    throw error;
  }
}

function updateEnvFile(clientId) {
  console.log('📝 Mise à jour du fichier .env...');

  const envPath = path.resolve(__dirname, '../.env');
  let envContent = '';

  // Lire le fichier .env.example si .env n'existe pas
  if (!fs.existsSync(envPath)) {
    const examplePath = path.resolve(__dirname, '../.env.example');
    envContent = fs.readFileSync(examplePath, 'utf8');
  } else {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Mettre à jour CLIENT_ID
  if (envContent.includes('CLIENT_ID=')) {
    envContent = envContent.replace(/CLIENT_ID=.*/, `CLIENT_ID=${clientId}`);
  } else {
    envContent += `\nCLIENT_ID=${clientId}\n`;
  }

  // Mettre à jour les chemins des clés
  envContent = envContent.replace(
    /CLIENT_PRIVATE_KEY_PATH=.*/,
    'CLIENT_PRIVATE_KEY_PATH=./keys/private-key.pem'
  );
  envContent = envContent.replace(
    /CLIENT_PUBLIC_KEY_PATH=.*/,
    'CLIENT_PUBLIC_KEY_PATH=./keys/public-key.pem'
  );

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Fichier .env mis à jour');
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🌾 CottonPay - Enregistrement Client OIDC         ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);

  try {
    // 1. Générer la paire de clés RSA
    const { publicKey } = await generateRSAKeyPair();

    // 2. Convertir la clé publique en JWK
    const publicKeyJWK = pemToJWK(publicKey);
    console.log('🔑 Clé publique convertie en JWK');

    // 3. Obtenir le token CSRF
    const csrfToken = await getCsrfToken();

    // 4. Enregistrer le client
    const clientId = await registerClient(publicKeyJWK, csrfToken);

    // 5. Mettre à jour le fichier .env
    updateEnvFile(clientId);

    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   ✅ Configuration terminée avec succès!             ║
║                                                       ║
║   Client ID: ${clientId.padEnd(37)}║
║   Redirect URI: ${REDIRECT_URI.padEnd(33)}║
║                                                       ║
║   Vous pouvez maintenant démarrer l'application:     ║
║   npm run start:backend                              ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);

  } catch (error) {
    console.error('\n❌ Erreur lors de l\'enregistrement:', error.message);
    console.error('\nAssurez-vous que:');
    console.error('1. eSignet est démarré (docker-compose up)');
    console.error('2. L\'URL eSignet est correcte dans .env');
    console.error('3. Le service est accessible');
    process.exit(1);
  }
}

main();
