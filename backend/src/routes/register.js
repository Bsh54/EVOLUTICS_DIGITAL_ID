/**
 * Registration Routes
 * Gestion de l'inscription des utilisateurs dans Mock Identity System
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

const MOCK_IDENTITY_URL = process.env.MOCK_IDENTITY_URL || 'http://localhost:8082';

/**
 * POST /register/create
 * Créer un nouvel utilisateur dans Mock Identity System
 */
router.post('/create', async (req, res, next) => {
  try {
    const { individualId, givenName, familyName, dateOfBirth, gender, phone, email, streetAddress, locality, region, pin } = req.body;

    console.log('📝 Creating new user:', individualId);

    // Construire les données utilisateur
    const userData = {
      requestTime: new Date().toISOString(),
      request: {
        individualId,
        pin: pin || '111111',
        email,
        phone,
        fullName: [
          { language: 'eng', value: `${givenName} ${familyName}` },
          { language: 'fra', value: `${givenName} ${familyName}` }
        ],
        givenName: [
          { language: 'eng', value: givenName },
          { language: 'fra', value: givenName }
        ],
        familyName: [
          { language: 'eng', value: familyName },
          { language: 'fra', value: familyName }
        ],
        dateOfBirth,
        gender: [
          { language: 'eng', value: gender },
          { language: 'fra', value: gender === 'Male' ? 'Masculin' : 'Féminin' }
        ],
        encodedPhoto: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        streetAddress: [
          { language: 'eng', value: streetAddress || 'N/A' },
          { language: 'fra', value: streetAddress || 'N/A' }
        ],
        locality: [
          { language: 'eng', value: locality || 'N/A' },
          { language: 'fra', value: locality || 'N/A' }
        ],
        region: [
          { language: 'eng', value: region || 'N/A' },
          { language: 'fra', value: region || 'N/A' }
        ],
        postalCode: '00229',
        country: [
          { language: 'eng', value: 'BEN' },
          { language: 'fra', value: 'BEN' }
        ]
      }
    };

    // Envoyer la requête à Mock Identity System
    const response = await axios.post(
      `${MOCK_IDENTITY_URL}/v1/mock-identity-system/identity`,
      userData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.errors && response.data.errors.length > 0) {
      console.error('❌ Registration failed:', response.data.errors);
      return res.status(400).json({
        success: false,
        error: response.data.errors[0].message
      });
    }

    console.log('✅ User created successfully:', individualId);
    res.json({
      success: true,
      message: 'Compte créé avec succès',
      individualId
    });

  } catch (error) {
    console.error('❌ Registration error:', error.response?.data || error.message);

    if (error.response?.data?.errors) {
      return res.status(400).json({
        success: false,
        error: error.response.data.errors[0]?.message || 'Erreur lors de la création du compte'
      });
    }

    next(error);
  }
});

module.exports = router;
