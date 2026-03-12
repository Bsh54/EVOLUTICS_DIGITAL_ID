/**
 * Service d'intégration avec Inji Certify
 * Génère des Verifiable Credentials pour les reçus de vente de coton
 */

const axios = require('axios');
const crypto = require('crypto');
const { Pool } = require('pg');

// Connexion à la base de données PostgreSQL d'Inji Certify
const pool = new Pool({
  host: 'localhost',
  port: 5455,
  database: 'mosip_esignet',
  user: 'postgres',
  password: 'postgres'
});

// Stockage en mémoire des credentials (fallback si DB non disponible)
const credentialsStore = new Map();
// Stockage en mémoire des ventes par utilisateur (fallback si DB non disponible)
const salesByUser = new Map();

class InjiCertifyService {
  constructor() {
    this.certifyBaseUrl = process.env.INJI_CERTIFY_URL || 'http://localhost:8090/v1/certify';
    this.scope = 'cottonpay_sale_receipt';
    this.credentialType = 'CottonPaySaleReceipt';
  }

  /**
   * Générer un Verifiable Credential pour une vente de coton
   */
  async generateSaleReceipt(saleData) {
    try {
      console.log('🎫 Génération du Verifiable Credential pour la vente:', saleData.transactionId);

      // 1. Préparer les données du credential
      const credentialData = {
        farmerName: saleData.farmerName,
        farmerNPI: saleData.farmerNPI,
        farmerPhone: saleData.farmerPhone,
        saleDate: saleData.saleDate,
        saleTime: saleData.saleTime,
        cottonWeightKg: saleData.cottonWeightKg.toString(),
        unitPriceFCFA: saleData.unitPriceFCFA.toString(),
        totalAmountFCFA: saleData.totalAmountFCFA.toString(),
        paymentReference: saleData.paymentReference,
        paymentStatus: saleData.paymentStatus,
        paymentMethod: saleData.paymentMethod,
        transactionId: saleData.transactionId,
        issuedBy: 'CottonPay ID - Bénin',
        issuedAt: new Date().toISOString()
      };

      // 2. Obtenir un access token (simulation pour le moment)
      const accessToken = await this.getAccessToken();

      // 3. Appeler l'API Inji Certify pour générer le credential
      const credential = await this.issueCredential(accessToken, credentialData);

      console.log('✅ Verifiable Credential généré avec succès');
      return {
        success: true,
        credentialId: credential.credential_id || crypto.randomUUID(),
        credential: credential,
        downloadUrl: `${this.certifyBaseUrl}/credentials/${credential.credential_id}`
      };

    } catch (error) {
      console.error('❌ Erreur lors de la génération du credential:', error.message);
      throw new Error('Failed to generate verifiable credential');
    }
  }

  /**
   * Obtenir un access token pour Inji Certify
   * TODO: Implémenter l'authentification OAuth réelle avec eSignet
   */
  async getAccessToken() {
    // Pour le moment, on simule un token
    // En production, il faudra faire un flow OAuth avec eSignet
    return 'mock_access_token_' + Date.now();
  }

  /**
   * Émettre un credential via l'API Inji Certify
   */
  async issueCredential(accessToken, credentialData) {
    try {
      // Endpoint pour l'émission de credentials
      const endpoint = `${this.certifyBaseUrl}/credential`;

      const requestBody = {
        credential_type: this.credentialType,
        format: 'ldp_vc',
        proof: {
          proof_type: 'jwt',
          jwt: accessToken
        },
        credential_subject: credentialData
      };

      console.log('📤 Envoi de la requête à Inji Certify:', endpoint);

      const response = await axios.post(endpoint, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        timeout: 10000
      });

      return response.data;

    } catch (error) {
      if (error.response) {
        console.error('❌ Erreur API Inji Certify:', error.response.status, error.response.data);
      } else {
        console.error('❌ Erreur réseau:', error.message);
      }

      // Pour le développement, on retourne un credential simulé
      console.log('⚠️ Mode simulation activé - génération d\'un credential mock');
      return this.generateMockCredential(credentialData);
    }
  }

  /**
   * Générer un credential simulé pour le développement
   */
  generateMockCredential(credentialData) {
    const credentialId = crypto.randomUUID();

    return {
      credential_id: credentialId,
      format: 'ldp_vc',
      credential: {
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://cottonpay.io/context/v1'
        ],
        type: ['VerifiableCredential', 'CottonPaySaleReceipt'],
        issuer: 'did:web:cottonpay.io',
        issuanceDate: new Date().toISOString(),
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        credentialSubject: {
          id: `did:cottonpay:${credentialData.farmerNPI}`,
          ...credentialData
        },
        proof: {
          type: 'Ed25519Signature2020',
          created: new Date().toISOString(),
          proofPurpose: 'assertionMethod',
          verificationMethod: 'did:web:cottonpay.io#key-1',
          jws: 'mock_signature_' + crypto.randomBytes(32).toString('base64')
        }
      }
    };
  }

  /**
   * Stocker le credential dans la base de données
   */
  async storeCredential(saleId, credentialData) {
    console.log('💾 Stockage du credential pour la vente:', saleId);

    // Stocker en mémoire (en production, utiliser une vraie DB)
    credentialsStore.set(credentialData.credentialId, {
      saleId: saleId,
      credentialId: credentialData.credentialId,
      credential: credentialData.credential,
      createdAt: new Date().toISOString()
    });

    return {
      stored: true,
      credentialId: credentialData.credentialId
    };
  }

  /**
   * Récupérer un credential par son ID
   */
  async getCredential(credentialId) {
    try {
      console.log('🔍 Récupération du credential:', credentialId);

      // Récupérer depuis le stockage en mémoire
      const storedCredential = credentialsStore.get(credentialId);

      if (storedCredential) {
        console.log('✅ Credential trouvé dans le stockage');
        return storedCredential;
      }

      // Si pas trouvé en mémoire, essayer l'API Inji Certify
      const endpoint = `${this.certifyBaseUrl}/credentials/${credentialId}`;

      const response = await axios.get(endpoint, {
        timeout: 5000
      });

      return response.data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du credential:', error.message);
      return null;
    }
  }

  /**
   * Stocker une vente dans l'historique de l'utilisateur
   */
  async storeSale(userSub, saleData) {
    console.log('💾 Stockage de la vente pour l\'utilisateur:', userSub);

    try {
      // Stocker dans la base de données PostgreSQL d'Inji Certify
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
        saleData.farmerName,
        saleData.farmerNPI,
        saleData.farmerPhone,
        saleData.saleDate,
        saleData.saleTime,
        saleData.weight,
        saleData.unitPrice,
        saleData.totalAmount,
        saleData.paymentReference,
        saleData.paymentStatus,
        'Mobile Money MTN',
        saleData.transactionId,
        saleData.credentialId || null,
        false
      ];

      const result = await pool.query(query, values);
      console.log('✅ Vente stockée dans PostgreSQL avec ID:', result.rows[0].id);

      return {
        stored: true,
        dbId: result.rows[0].id
      };

    } catch (error) {
      console.error('❌ Erreur lors du stockage dans PostgreSQL:', error.message);
      console.log('⚠️ Fallback vers stockage en mémoire');

      // Fallback vers stockage en mémoire
      let userSales = salesByUser.get(userSub) || [];
      userSales.unshift({
        ...saleData,
        createdAt: new Date().toISOString()
      });
      salesByUser.set(userSub, userSales);

      return {
        stored: true,
        totalSales: userSales.length
      };
    }
  }

  /**
   * Récupérer l'historique des ventes d'un utilisateur
   */
  async getUserSalesHistory(userSub) {
    console.log('📋 Récupération de l\'historique pour:', userSub);

    try {
      // Récupérer depuis PostgreSQL
      const query = `
        SELECT
          transaction_id as "transactionId",
          farmer_name as "farmerName",
          farmer_npi as "farmerNPI",
          farmer_phone as "farmerPhone",
          cotton_weight_kg as weight,
          unit_price_fcfa as "unitPrice",
          total_amount_fcfa as "totalAmount",
          payment_reference as "paymentReference",
          payment_status as "paymentStatus",
          TO_CHAR(sale_date, 'YYYY-MM-DD') as "saleDate",
          TO_CHAR(sale_time, 'HH24:MI:SS') as "saleTime",
          credential_id as "credentialId",
          cr_dtimes as "createdAt"
        FROM certify.cottonpay_sales
        WHERE farmer_npi = $1
        ORDER BY cr_dtimes DESC
      `;

      const result = await pool.query(query, [userSub]);
      console.log(`✅ ${result.rows.length} ventes trouvées dans PostgreSQL`);

      return result.rows;

    } catch (error) {
      console.error('❌ Erreur lors de la récupération depuis PostgreSQL:', error.message);
      console.log('⚠️ Fallback vers stockage en mémoire');

      // Fallback vers stockage en mémoire
      const userSales = salesByUser.get(userSub) || [];
      return userSales;
    }
  }

  /**
   * Récupérer une vente par son ID de transaction
   */
  async getSaleByTransactionId(transactionId) {
    console.log('🔍 Recherche de la vente:', transactionId);

    try {
      // Récupérer depuis PostgreSQL
      const query = `
        SELECT
          transaction_id as "transactionId",
          farmer_name as "farmerName",
          farmer_npi as "farmerNPI",
          farmer_phone as "farmerPhone",
          cotton_weight_kg as weight,
          unit_price_fcfa as "unitPrice",
          total_amount_fcfa as "totalAmount",
          payment_reference as "paymentReference",
          payment_status as "paymentStatus",
          TO_CHAR(sale_date, 'YYYY-MM-DD') as "saleDate",
          TO_CHAR(sale_time, 'HH24:MI:SS') as "saleTime",
          credential_id as "credentialId"
        FROM certify.cottonpay_sales
        WHERE transaction_id = $1
      `;

      const result = await pool.query(query, [transactionId]);

      if (result.rows.length > 0) {
        console.log('✅ Vente trouvée dans PostgreSQL');
        return result.rows[0];
      }

      console.log('❌ Vente introuvable dans PostgreSQL');
      return null;

    } catch (error) {
      console.error('❌ Erreur lors de la recherche dans PostgreSQL:', error.message);
      console.log('⚠️ Fallback vers stockage en mémoire');

      // Fallback vers stockage en mémoire
      for (const [userSub, sales] of salesByUser.entries()) {
        const sale = sales.find(s => s.transactionId === transactionId);
        if (sale) {
          console.log('✅ Vente trouvée en mémoire pour l\'utilisateur:', userSub);
          return sale;
        }
      }

      console.log('❌ Vente introuvable');
      return null;
    }
  }
}

module.exports = new InjiCertifyService();
