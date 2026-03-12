/**
 * Script de création d'utilisateur test dans Mock Identity System
 */

require('dotenv').config();
const axios = require('axios');

const MOCK_IDENTITY_URL = process.env.MOCK_IDENTITY_URL || 'http://localhost:8082';

async function createTestUser() {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🌾 CottonPay - Création Utilisateur Test          ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);

  const testUser = {
    individualId: 'TEST123456',
    fullName: 'Koffi Mensah',
    phone: '+22997123456',
    email: 'koffi.mensah@example.com',
    dateOfBirth: '1985-05-15',
    gender: 'Male',
    address: 'Banikoara, Alibori, Benin',
    pin: '123456'
  };

  try {
    console.log('📝 Création de l\'utilisateur test...');
    console.log('Données:', JSON.stringify(testUser, null, 2));

    const response = await axios.post(
      `${MOCK_IDENTITY_URL}/identity`,
      testUser,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Utilisateur créé avec succès!');
    console.log('\n📋 Informations de connexion:');
    console.log('─────────────────────────────────────────');
    console.log(`NPI (Individual ID): ${testUser.individualId}`);
    console.log(`Nom: ${testUser.fullName}`);
    console.log(`Téléphone: ${testUser.phone}`);
    console.log(`Email: ${testUser.email}`);
    console.log(`PIN: ${testUser.pin}`);
    console.log('─────────────────────────────────────────');
    console.log('\n💡 Utilisez ces informations pour tester la connexion');
    console.log('   L\'OTP sera envoyé au numéro de téléphone ci-dessus');

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.response?.data || error.message);
    console.error('\nAssurez-vous que Mock Identity System est démarré');
    process.exit(1);
  }
}

createTestUser();
