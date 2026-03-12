/**
 * CottonPay Credential Worker
 *
 * Ce worker surveille la table cottonpay_sales et génère automatiquement
 * des Verifiable Credentials pour chaque nouvelle vente.
 */

const { Pool } = require('pg');
const axios = require('axios');
require('dotenv').config({ path: '../.env' });

// Configuration PostgreSQL
const pool = new Pool({
  host: 'localhost',
  port: 5455,
  database: 'mosip_esignet',
  user: 'postgres',
  password: 'postgres'
});

// Configuration Inji Certify
const CERTIFY_URL = process.env.INJI_CERTIFY_URL || 'http://localhost:8090/v1/certify';
const CHECK_INTERVAL = 5000; // Vérifier toutes les 5 secondes

console.log('🚀 CottonPay Credential Worker démarré');
console.log('📡 Connexion à PostgreSQL sur localhost:5455');
console.log('🎫 Inji Certify URL:', CERTIFY_URL);

/**
 * Générer un credential mock pour une vente
 * (En attendant l'intégration complète avec Inji Certify)
 */
async function generateMockCredential(sale) {
  const credentialId = `VC-${sale.transaction_id}`;

  const credential = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://cottonpay.io/context/v1'
    ],
    type: ['VerifiableCredential', 'CottonPaySaleReceipt'],
    id: `urn:uuid:${credentialId}`,
    issuer: 'did:web:cottonpay.io',
    issuanceDate: new Date().toISOString(),
    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    credentialSubject: {
      id: `did:cottonpay:${sale.farmer_npi}`,
      farmerName: sale.farmer_name,
      farmerNPI: sale.farmer_npi,
      farmerPhone: sale.farmer_phone,
      saleDate: sale.sale_date,
      saleTime: sale.sale_time,
      cottonWeightKg: sale.cotton_weight_kg.toString(),
      unitPriceFCFA: sale.unit_price_fcfa.toString(),
      totalAmountFCFA: sale.total_amount_fcfa.toString(),
      paymentReference: sale.payment_reference,
      paymentStatus: sale.payment_status,
      paymentMethod: sale.payment_method,
      transactionId: sale.transaction_id,
      issuedBy: 'CottonPay ID - Bénin'
    },
    proof: {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      proofPurpose: 'assertionMethod',
      verificationMethod: 'did:web:cottonpay.io#key-1',
      jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..' +
           Buffer.from(JSON.stringify(sale)).toString('base64').substring(0, 50)
    }
  };

  return {
    credentialId,
    credential,
    format: 'ldp_vc'
  };
}

/**
 * Traiter une vente et générer son credential
 */
async function processSale(sale) {
  try {
    console.log(`\n🌾 Traitement de la vente: ${sale.transaction_id}`);
    console.log(`   Agriculteur: ${sale.farmer_name} (${sale.farmer_npi})`);
    console.log(`   Montant: ${sale.total_amount_fcfa} FCFA`);

    // Générer le credential
    const credentialResult = await generateMockCredential(sale);

    console.log(`✅ Credential généré: ${credentialResult.credentialId}`);

    // Mettre à jour la vente dans la base de données
    const updateQuery = `
      UPDATE certify.cottonpay_sales
      SET
        credential_id = $1,
        credential_issued = true,
        upd_dtimes = CURRENT_TIMESTAMP
      WHERE transaction_id = $2
    `;

    await pool.query(updateQuery, [credentialResult.credentialId, sale.transaction_id]);

    console.log(`💾 Vente marquée comme traitée`);
    console.log(`🎫 Le credential est maintenant disponible pour l'agriculteur`);

    return credentialResult;

  } catch (error) {
    console.error(`❌ Erreur lors du traitement de la vente ${sale.transaction_id}:`, error.message);
    throw error;
  }
}

/**
 * Vérifier les nouvelles ventes non traitées
 */
async function checkForNewSales() {
  try {
    const query = `
      SELECT
        id,
        transaction_id,
        farmer_name,
        farmer_npi,
        farmer_phone,
        TO_CHAR(sale_date, 'YYYY-MM-DD') as sale_date,
        TO_CHAR(sale_time, 'HH24:MI:SS') as sale_time,
        cotton_weight_kg,
        unit_price_fcfa,
        total_amount_fcfa,
        payment_reference,
        payment_status,
        payment_method
      FROM certify.cottonpay_sales
      WHERE credential_issued = false
      ORDER BY cr_dtimes ASC
      LIMIT 10
    `;

    const result = await pool.query(query);

    if (result.rows.length > 0) {
      console.log(`\n📦 ${result.rows.length} vente(s) en attente de traitement`);

      for (const sale of result.rows) {
        await processSale(sale);
        // Petite pause entre chaque traitement
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification des ventes:', error.message);
  }
}

/**
 * Démarrer le worker
 */
async function startWorker() {
  try {
    // Tester la connexion à la base de données
    await pool.query('SELECT NOW()');
    console.log('✅ Connexion à PostgreSQL établie\n');

    // Vérifier les ventes existantes au démarrage
    await checkForNewSales();

    // Démarrer la boucle de vérification
    console.log(`\n⏰ Vérification automatique toutes les ${CHECK_INTERVAL / 1000} secondes...\n`);

    setInterval(async () => {
      await checkForNewSales();
    }, CHECK_INTERVAL);

  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  console.log('\n\n👋 Arrêt du worker...');
  await pool.end();
  process.exit(0);
});

// Démarrer le worker
startWorker();
