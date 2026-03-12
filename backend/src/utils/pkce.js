/**
 * PKCE Utilities
 * Proof Key for Code Exchange (RFC 7636)
 */

const crypto = require('crypto');

/**
 * Générer un code_verifier aléatoire
 */
function generateCodeVerifier() {
  return base64URLEncode(crypto.randomBytes(32));
}

/**
 * Générer le code_challenge à partir du code_verifier
 */
function generateCodeChallenge(verifier) {
  return base64URLEncode(
    crypto.createHash('sha256').update(verifier).digest()
  );
}

/**
 * Encoder en Base64URL (sans padding)
 */
function base64URLEncode(buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Générer PKCE complet
 */
function generatePKCE() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  return {
    codeVerifier,
    codeChallenge
  };
}

module.exports = {
  generateCodeVerifier,
  generateCodeChallenge,
  base64URLEncode,
  generatePKCE
};
