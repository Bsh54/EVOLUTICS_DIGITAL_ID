/**
 * User Routes
 * Gestion des informations utilisateur
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

/**
 * GET /user/profile
 * Récupérer le profil utilisateur
 */
router.get('/profile', requireAuth, (req, res) => {
  res.json({
    user: req.session.user
  });
});

/**
 * GET /user/dashboard
 * Données du tableau de bord
 */
router.get('/dashboard', requireAuth, (req, res) => {
  // TODO: Récupérer les données réelles depuis la base de données
  res.json({
    user: req.session.user,
    stats: {
      totalTransactions: 0,
      totalEarnings: 0,
      lastPayment: null
    },
    recentTransactions: []
  });
});

module.exports = router;
