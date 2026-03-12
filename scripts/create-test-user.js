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
    requestTime: new Date().toISOString(),
    request: {
      individualId: '1234567890123456',
      pin: '111111',
      email: 'koffi.mensah@example.com',
      phone: '+22997123456',
      fullName: [
        { language: 'eng', value: 'Koffi Mensah' },
        { language: 'fra', value: 'Koffi Mensah' }
      ],
      givenName: [
        { language: 'eng', value: 'Koffi' },
        { language: 'fra', value: 'Koffi' }
      ],
      familyName: [
        { language: 'eng', value: 'Mensah' },
        { language: 'fra', value: 'Mensah' }
      ],
      dateOfBirth: '1985/05/15',
      gender: [
        { language: 'eng', value: 'Male' },
        { language: 'fra', value: 'Masculin' }
      ],
      encodedPhoto: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      streetAddress: [
        { language: 'eng', value: 'Banikoara' },
        { language: 'fra', value: 'Banikoara' }
      ],
      locality: [
        { language: 'eng', value: 'Alibori' },
        { language: 'fra', value: 'Alibori' }
      ],
      region: [
        { language: 'eng', value: 'Alibori' },
        { language: 'fra', value: 'Alibori' }
      ],
      postalCode: '00229',
      country: [
        { language: 'eng', value: 'BEN' },
        { language: 'fra', value: 'BEN' }
      ]
    }
  };

  try {
    console.log('📝 Création de l\'utilisateur test...');
    console.log('Données:', JSON.stringify(testUser, null, 2));

    const response = await axios.post(
      `${MOCK_IDENTITY_URL}/v1/mock-identity-system/identity`,
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
    console.log(`NPI (Individual ID): ${testUser.request.individualId}`);
    console.log(`Nom: ${testUser.request.fullName[0].value}`);
    console.log(`Téléphone: ${testUser.request.phone}`);
    console.log(`Email: ${testUser.request.email}`);
    console.log(`PIN/OTP: ${testUser.request.pin}`);
    console.log('─────────────────────────────────────────');
    console.log('\n💡 Utilisez ces informations pour tester la connexion');
    console.log('   L\'OTP par défaut est: 111111');

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.response?.data || error.message);
    console.error('\nAssurez-vous que Mock Identity System est démarré');
    process.exit(1);
  }
}

createTestUser();
