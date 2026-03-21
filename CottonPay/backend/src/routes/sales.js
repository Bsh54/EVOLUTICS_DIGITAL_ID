/**
 * Routes pour les ventes de coton
 * Gestion des transactions et génération de Verifiable Credentials
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const injiCertifyService = require('../services/injiCertifyService');
const crypto = require('crypto');

/**
 * POST /sales/create
 * Créer une nouvelle vente de coton et générer un Verifiable Credential
 */
router.post('/create', requireAuth, async (req, res, next) => {
  try {
    const { weight, unitPrice } = req.body;
    const user = req.session.user;

    console.log('🌾 Nouvelle vente de coton:', { weight, unitPrice, farmer: user.name });

    // Validation
    if (!weight || weight <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Le poids doit être supérieur à 0'
      });
    }

    if (!unitPrice || unitPrice <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Le prix unitaire doit être supérieur à 0'
      });
    }

    // Calculer le montant total
    const totalAmount = weight * unitPrice;

    // Générer un ID de transaction unique
    const transactionId = 'TXN-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    // Simuler le paiement (en production, intégrer avec Mobile Money API)
    const paymentReference = 'PAY-' + Date.now();
    const paymentStatus = 'completed'; // 'pending', 'completed', 'failed'

    // Préparer les données de la vente
    const saleData = {
      farmerName: user.name,
      farmerNPI: user.sub,
      farmerPhone: user.phone_number,
      saleDate: new Date().toISOString().split('T')[0],
      saleTime: new Date().toISOString().split('T')[1].split('.')[0],
      cottonWeightKg: weight,
      unitPriceFCFA: unitPrice,
      totalAmountFCFA: totalAmount,
      paymentReference: paymentReference,
      paymentStatus: paymentStatus,
      paymentMethod: 'Mobile Money MTN',
      transactionId: transactionId
    };

    console.log('💰 Traitement du paiement:', paymentReference);

    // Générer le Verifiable Credential via Inji Certify
    console.log('🎫 Génération du reçu vérifiable...');
    const userAccessToken = req.session.accessToken;
    const credentialResult = await injiCertifyService.generateSaleReceipt(saleData, userAccessToken);

    // Stocker le credential
    await injiCertifyService.storeCredential(transactionId, credentialResult);

    // Stocker la vente dans l'historique
    await injiCertifyService.storeSale(user.sub, {
      transactionId: transactionId,
      farmerName: saleData.farmerName,
      farmerNPI: saleData.farmerNPI,
      farmerPhone: saleData.farmerPhone,
      weight: weight,
      unitPrice: unitPrice,
      totalAmount: totalAmount,
      paymentReference: paymentReference,
      paymentStatus: paymentStatus,
      saleDate: saleData.saleDate,
      saleTime: saleData.saleTime,
      credentialId: credentialResult.credentialId
    });

    console.log('✅ Vente enregistrée avec succès:', transactionId);

    // Retourner la réponse
    res.json({
      success: true,
      message: 'Vente enregistrée avec succès',
      sale: {
        transactionId: transactionId,
        farmerName: saleData.farmerName,
        farmerNPI: saleData.farmerNPI,
        farmerPhone: saleData.farmerPhone,
        weight: weight,
        unitPrice: unitPrice,
        totalAmount: totalAmount,
        paymentReference: paymentReference,
        paymentStatus: paymentStatus,
        saleDate: saleData.saleDate,
        saleTime: saleData.saleTime
      },
      credential: {
        id: credentialResult.credentialId,
        issued: true,
        downloadUrl: credentialResult.downloadUrl,
        viewInWallet: `${process.env.APP_URL}/sales/credential/${credentialResult.credentialId}`
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création de la vente:', error);
    next(error);
  }
});

/**
 * GET /sales/history
 * Récupérer l'historique des ventes de l'utilisateur
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const user = req.session.user;

    // Récupérer l'historique depuis le service
    const history = await injiCertifyService.getUserSalesHistory(user.sub);

    res.json({
      success: true,
      sales: history
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'historique'
    });
  }
});

/**
 * GET /sales/:transactionId
 * Récupérer les détails d'une vente spécifique
 */
router.get('/:transactionId', requireAuth, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const user = req.session.user;

    // Récupérer l'historique de l'utilisateur
    const history = await injiCertifyService.getUserSalesHistory(user.sub);

    // Trouver la vente spécifique
    const sale = history.find(s => s.transactionId === transactionId);

    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Vente introuvable'
      });
    }

    res.json({
      success: true,
      sale: sale
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la vente:', error);
    res.status(500).json({
      success: false,
      error: 'Vente introuvable'
    });
  }
});

/**
 * GET /sales/credential/:credentialId
 * Récupérer un Verifiable Credential
 */
router.get('/credential/:credentialId', requireAuth, async (req, res) => {
  try {
    const { credentialId } = req.params;

    const credential = await injiCertifyService.getCredential(credentialId);

    if (!credential) {
      return res.status(404).json({
        success: false,
        error: 'Credential introuvable'
      });
    }

    res.json({
      success: true,
      credential: credential
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération du credential:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du credential'
    });
  }
});

/**
 * GET /sales/verify/:transactionId
 * Vérifier un reçu et récupérer l'historique de l'agriculteur (pour agents bancaires)
 * Endpoint public sans authentification
 */
router.get('/verify/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    console.log('🔍 Vérification du reçu:', transactionId);

    // Récupérer la vente depuis le service
    const sale = await injiCertifyService.getSaleByTransactionId(transactionId);

    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Transaction introuvable'
      });
    }

    // Récupérer l'historique complet de l'agriculteur
    const farmerHistory = await injiCertifyService.getUserSalesHistory(sale.farmerNPI);

    // Calculer les statistiques pour évaluation de crédit
    const totalRevenue = farmerHistory.reduce((sum, s) => sum + s.totalAmount, 0);
    const averageRevenue = farmerHistory.length > 0 ? Math.round(totalRevenue / farmerHistory.length) : 0;

    res.json({
      success: true,
      verified: true,
      sale: sale,
      farmerHistory: farmerHistory,
      summary: {
        totalSales: farmerHistory.length,
        totalRevenue: totalRevenue,
        averageRevenue: averageRevenue
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification'
    });
  }
});

/**
 * POST /sales/webhook
 * Webhook pour recevoir les notifications d'Inji Certify
 */
router.post('/webhook', async (req, res) => {
  try {
    console.log('📨 Webhook reçu d\'Inji Certify:', req.body);

    // TODO: Traiter la notification
    // Mettre à jour le statut du credential en base de données

    res.json({
      success: true,
      message: 'Webhook traité'
    });

  } catch (error) {
    console.error('❌ Erreur lors du traitement du webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement du webhook'
    });
  }
});

module.exports = router;
