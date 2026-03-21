/**
 * Service d'intégration avec Inji Certify
 */
const axios = require('axios');
const crypto = require('crypto');
const { Pool } = require('pg');
const { SignJWT, exportJWK } = require('jose');

const pool = new Pool({
  host: 'localhost',
  port: 5455,
  database: 'mosip_esignet',
  user: 'postgres',
  password: 'postgres'
});

class InjiCertifyService {
  constructor() {
    this.certifyBaseUrl = process.env.INJI_CERTIFY_URL || 'http://localhost:8090/v1/certify';
    this.credentialType = 'CottonPaySaleReceipt';
    this.clientId = 'cottonpay-client';
    
    // Génération de la paire de clés pour la preuve (Proof of Possession)
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'P-256',
    });
    this.privateKey = crypto.createPrivateKey(privateKey);
    this.publicKey = crypto.createPublicKey(publicKey);
  }

  async generateProofToken(audience, nonce) {
    const jwk = await exportJWK(this.publicKey);
    // On doit ajouter kty manuellement car la librairie jose peut loublier selon les versions
    jwk.alg = 'ES256';
    jwk.use = 'sig';

    return await new SignJWT({
        aud: audience,
        iss: this.clientId, // Émetteur = client ID
        nonce: nonce
      })
      .setProtectedHeader({ 
        alg: 'ES256', 
        typ: 'openid4vci-proof+jwt', // Le type ultra-strict exigé par Inji
        jwk: jwk // La clé publique embarquée
      })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(this.privateKey);
  }

  async generateSaleReceipt(saleData, userAccessToken) {
    try {
      console.log('🎫 Génération du Verifiable Credential pour la vente:', saleData.transactionId);

      // 1. Générer le Proof Token chirurgicalement valide pour Inji
      // L'audience d'Inji est souvent l'URL de base du serveur (sans /issuance/credential)
      // On va utiliser certifyBaseUrl
      const proofToken = await this.generateProofToken(
        this.certifyBaseUrl,
        crypto.randomBytes(16).toString('hex')
      );

      // 2. Préparer la requête OpenID4VCI
      const requestBody = {
        format: 'ldp_vc',
        credential_definition: {
          '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://cottonpay.io/context/v1'
          ],
          type: ['VerifiableCredential', this.credentialType]
        },
        proof: {
          proof_type: 'jwt',
          jwt: proofToken
        }
      };

      console.log('📤 Envoi de la requête à Inji Certify:', `${this.certifyBaseUrl}/issuance/credential`);

      const response = await axios.post(`${this.certifyBaseUrl}/issuance/credential`, requestBody, {
        headers: {
          'Content-Type': 'application/json'
          // Pas d'Authorization car on utilise le mode bypass local d'Inji
        },
        timeout: 60000 
      });

      console.log('✅ Réponse d\'Inji Certify reçue');
      return {
        success: true,
        credentialId: response.data.credential_id || crypto.randomUUID(),
        credential: response.data.credential || response.data,
        downloadUrl: `${this.certifyBaseUrl}/credentials/${response.data.credential_id || 'new'}`
      };

    } catch (error) {
      console.error('❌ Erreur API Inji Certify:', error.response ? error.response.status : '');
      console.error('📄 Détails:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
      throw new Error('Failed to issue credential from Inji Certify API: ' + (error.response ? JSON.stringify(error.response.data) : error.message));
    }
  }

  async storeCredential(saleId, credentialData) { return { stored: true }; }
  async getCredential(credentialId) { return null; }

  async storeSale(userSub, saleData) {
    try {
      const query = `
        INSERT INTO certify.cottonpay_sales (
          farmer_name, farmer_npi, farmer_phone,
          sale_date, sale_time,
          cotton_weight_kg, unit_price_fcfa, total_amount_fcfa,
          payment_reference, payment_status, payment_method,
          transaction_id, credential_id, credential_issued
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id
      `;

      const values = [
        saleData.farmerName, saleData.farmerNPI, saleData.farmerPhone,
        saleData.saleDate, saleData.saleTime, saleData.weight, saleData.unitPrice, saleData.totalAmount,
        saleData.paymentReference, saleData.paymentStatus, 'Mobile Money MTN',
        saleData.transactionId, saleData.credentialId || null, false
      ];
      const result = await pool.query(query, values);
      return { stored: true, dbId: result.rows[0].id };
    } catch (error) {
      throw new Error('Erreur base de données: ' + error.message);
    }
  }

  async getUserSalesHistory(userSub) {
    try {
      const query = `
        SELECT
          transaction_id as "transactionId", farmer_name as "farmerName", farmer_npi as "farmerNPI",
          farmer_phone as "farmerPhone", cotton_weight_kg as weight, unit_price_fcfa as "unitPrice",
          total_amount_fcfa as "totalAmount", payment_reference as "paymentReference",
          payment_status as "paymentStatus", TO_CHAR(sale_date, 'YYYY-MM-DD') as "saleDate",
          TO_CHAR(sale_time, 'HH24:MI:SS') as "saleTime", credential_id as "credentialId",
          cr_dtimes as "createdAt"
        FROM certify.cottonpay_sales
        WHERE farmer_npi = $1 ORDER BY cr_dtimes DESC
      `;
      const result = await pool.query(query, [userSub]);
      return result.rows;
    } catch (error) {
      throw new Error('Erreur de récupération de l\'historique: ' + error.message);
    }
  }

  async getSaleByTransactionId(transactionId) {
    try {
      const query = `
        SELECT
          transaction_id as "transactionId", farmer_name as "farmerName", farmer_npi as "farmerNPI",
          farmer_phone as "farmerPhone", cotton_weight_kg as weight, unit_price_fcfa as "unitPrice",
          total_amount_fcfa as "totalAmount", payment_reference as "paymentReference",
          payment_status as "paymentStatus", TO_CHAR(sale_date, 'YYYY-MM-DD') as "saleDate",
          TO_CHAR(sale_time, 'HH24:MI:SS') as "saleTime", credential_id as "credentialId"
        FROM certify.cottonpay_sales WHERE transaction_id = $1
      `;
      const result = await pool.query(query, [transactionId]);
      if (result.rows.length > 0) return result.rows[0];
      return null;
    } catch (error) {
      throw new Error('Erreur de recherche de transaction: ' + error.message);
    }
  }
}

module.exports = new InjiCertifyService();
