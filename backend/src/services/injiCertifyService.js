/**
 * Service d'intégration avec Inji Certify
 * Génère des Verifiable Credentials pour les reçus de vente de coton
 */

const axios = require('axios');
const crypto = require('crypto');

// Stockage en mémoire des credentials (en production, utiliser une base de données)
const credentialsStore = new Map();
// Stockage en mémoire des ventes par utilisateur
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

    // Récupérer l'historique existant ou créer un nouveau
    let userSales = salesByUser.get(userSub) || [];

    // Ajouter la nouvelle vente
    userSales.unshift({
      ...saleData,
      createdAt: new Date().toISOString()
    });

    // Stocker l'historique mis à jour
    salesByUser.set(userSub, userSales);

    return {
      stored: true,
      totalSales: userSales.length
    };
  }

  /**
   * Récupérer l'historique des ventes d'un utilisateur
   */
  async getUserSalesHistory(userSub) {
    console.log('📋 Récupération de l\'historique pour:', userSub);

    const userSales = salesByUser.get(userSub) || [];

    return userSales;
  }
}

module.exports = new InjiCertifyService();
