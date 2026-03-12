# CottonPay - Système de Paiement avec Verifiable Credentials

## 🎯 Projet Hackathon - Intégration Inji Certify

Système de paiement pour les ventes de coton avec génération automatique de Verifiable Credentials (reçus vérifiables) pour faciliter l'accès au crédit bancaire des agriculteurs.

## 🌟 Fonctionnalités

### Pour les Agriculteurs
- ✅ Authentification sécurisée via eSignet (OpenID Connect)
- ✅ Enregistrement des ventes de coton
- ✅ Génération automatique de reçus vérifiables (Verifiable Credentials)
- ✅ Historique complet des ventes
- ✅ Reçus avec QR code pour vérification
- ✅ Stockage persistant dans PostgreSQL

### Pour les Agents Bancaires
- ✅ Vérification des reçus via QR code
- ✅ Consultation de l'historique des revenus de l'agriculteur
- ✅ Statistiques pour évaluation de crédit (total ventes, revenus moyens)
- ✅ Authentification des documents via signature cryptographique

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    COTTONPAY SYSTEM                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (Port 3001)                                        │
│  ├── dashboard.html    - Tableau de bord agriculteur        │
│  ├── history.html      - Historique des ventes              │
│  ├── receipt.html      - Détail reçu avec QR code           │
│  └── verify.html       - Vérification pour banques          │
│                                                               │
│  Backend (Port 3002)                                         │
│  ├── /auth/*          - Authentification OAuth/OIDC         │
│  ├── /sales/*         - Gestion des ventes                  │
│  └── /sales/verify/*  - Vérification des reçus              │
│                                                               │
│  Credential Worker                                           │
│  └── Génération automatique des Verifiable Credentials      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    INJI STACK                                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  eSignet (Ports 3000, 8088, 8082)                           │
│  └── Fournisseur d'identité OAuth/OIDC                      │
│                                                               │
│  Inji Certify (Port 8090)                                   │
│  └── Émission de Verifiable Credentials                     │
│                                                               │
│  PostgreSQL (Port 5455)                                      │
│  └── Base de données (schéma certify)                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Démarrage Rapide

### Prérequis
- Docker et Docker Compose
- Node.js 18+
- Python 3 (pour le serveur frontend)
- Git Bash (Windows)

### Installation

1. **Cloner le projet**
```bash
git clone https://github.com/Bsh54/EVOLUTICS_DIGITAL_ID.git
cd EVOLUTICS_DIGITAL_ID/CottonPay
```

2. **Installer les dépendances**
```bash
# Backend
cd backend
npm install
cd ..

# Credential Worker
cd credential-worker
npm install
cd ..
```

3. **Démarrer tous les services**
```bash
./start-all-services.sh
```

Cela démarre automatiquement :
- ✅ Services eSignet (authentification)
- ✅ Inji Certify (émission de credentials)
- ✅ Backend CottonPay
- ✅ Frontend CottonPay
- ✅ Credential Worker

### Accès à l'application

🎯 **Application principale** : http://localhost:3001

📊 **Services disponibles** :
- eSignet UI : http://localhost:3000
- Backend API : http://localhost:3002
- Inji Certify : http://localhost:8090

## 📖 Workflow Complet

### 1. Connexion de l'Agriculteur
```
Agriculteur → CottonPay → eSignet → Authentification OTP → Session créée
```

### 2. Enregistrement d'une Vente
```
Agriculteur saisit :
  - Poids de coton (kg)
  - Prix unitaire (FCFA/kg)

↓

Backend calcule le montant total
↓

Vente enregistrée dans PostgreSQL (certify.cottonpay_sales)
↓

Credential Worker détecte la nouvelle vente
↓

Verifiable Credential généré automatiquement
↓

Vente marquée comme traitée (credential_issued = true)
```

### 3. Consultation de l'Historique
```
Agriculteur → Historique → Liste des ventes → Détail du reçu
                                                    ↓
                                            QR Code généré
```

### 4. Vérification par la Banque
```
Agent bancaire scanne le QR code
↓

Page de vérification s'ouvre (verify.html)
↓

Affichage :
  - Authenticité du reçu
  - Détails de la transaction
  - Historique complet des revenus
  - Statistiques (total ventes, revenus moyens)
```

## 🗄️ Base de Données

### Table : certify.cottonpay_sales

```sql
CREATE TABLE certify.cottonpay_sales (
    id VARCHAR(36) PRIMARY KEY,
    farmer_name VARCHAR(255) NOT NULL,
    farmer_npi VARCHAR(16) NOT NULL,
    farmer_phone VARCHAR(20) NOT NULL,
    sale_date DATE NOT NULL,
    sale_time TIME NOT NULL,
    cotton_weight_kg DECIMAL(10,2) NOT NULL,
    unit_price_fcfa DECIMAL(10,2) NOT NULL,
    total_amount_fcfa DECIMAL(10,2) NOT NULL,
    payment_reference VARCHAR(100),
    payment_status VARCHAR(50) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    credential_id VARCHAR(255),
    credential_issued BOOLEAN DEFAULT FALSE,
    cr_dtimes TIMESTAMP NOT NULL DEFAULT NOW(),
    upd_dtimes TIMESTAMP
);
```

## 🎫 Verifiable Credential

### Format du Credential CottonPaySaleReceipt

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://cottonpay.io/context/v1"
  ],
  "type": ["VerifiableCredential", "CottonPaySaleReceipt"],
  "issuer": "did:web:cottonpay.io",
  "issuanceDate": "2026-03-12T21:30:00Z",
  "credentialSubject": {
    "id": "did:cottonpay:NPI-12345",
    "farmerName": "Koffi Mensah",
    "farmerNPI": "NPI-12345",
    "farmerPhone": "+22997123456",
    "saleDate": "2026-03-12",
    "saleTime": "21:30:00",
    "cottonWeightKg": "150.5",
    "unitPriceFCFA": "500",
    "totalAmountFCFA": "75250",
    "paymentReference": "PAY-1710277800000",
    "paymentStatus": "completed",
    "transactionId": "TXN-TEST-DEMO-001"
  },
  "proof": {
    "type": "Ed25519Signature2020",
    "created": "2026-03-12T21:30:00Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:web:cottonpay.io#key-1",
    "jws": "eyJhbGc..."
  }
}
```

## 🔧 Configuration

### Variables d'environnement (.env)

```env
# Application
APP_PORT=3002
APP_URL=http://localhost:3002
FRONTEND_URL=http://localhost:3001

# eSignet
ESIGNET_BASE_URL=http://localhost:8088/v1/esignet
CLIENT_ID=cottonpay-1773338156117

# Inji Certify
INJI_CERTIFY_URL=http://localhost:8090/v1/certify
INJI_CERTIFY_ENABLED=true

# Session
SESSION_SECRET=change-this-to-a-random-secret-in-production
```

## 📊 Monitoring

### Logs disponibles

```bash
# Backend
tail -f logs/backend.log

# Frontend
tail -f logs/frontend.log

# Credential Worker
tail -f logs/worker.log
```

### Vérifier l'état des services

```bash
# Services Docker
docker ps

# Vérifier PostgreSQL
docker exec -i docker-compose-database-1 psql -U postgres -d mosip_esignet -c "SELECT COUNT(*) FROM certify.cottonpay_sales;"

# Vérifier Inji Certify
curl http://localhost:8090/v1/certify/.well-known/openid-credential-issuer
```

## 🛑 Arrêt des Services

```bash
./stop-all-services.sh
```

## 🎬 Démo pour le Hackathon

### Scénario de Démonstration

1. **Connexion** (30 secondes)
   - Ouvrir http://localhost:3001
   - Cliquer sur "Se connecter avec eSignet"
   - Utiliser l'OTP : 111111

2. **Enregistrement d'une vente** (1 minute)
   - Saisir : 200 kg à 500 FCFA/kg
   - Montant calculé : 100 000 FCFA
   - Vente enregistrée avec succès

3. **Vérification automatique** (30 secondes)
   - Le Credential Worker génère le VC automatiquement
   - Visible dans les logs : `✅ Credential généré: VC-TXN-...`

4. **Consultation de l'historique** (30 secondes)
   - Cliquer sur "Historique"
   - Voir toutes les ventes
   - Cliquer sur une vente pour voir le détail

5. **QR Code et Vérification** (1 minute)
   - Sur le reçu détaillé, voir le QR code
   - Scanner avec un téléphone ou copier l'URL
   - Page de vérification s'ouvre
   - Affiche l'authenticité + historique complet

## 🏆 Points Forts pour le Hackathon

✅ **Vraie intégration** - Pas de simulation, utilise Inji Certify réel
✅ **Stockage persistant** - PostgreSQL, pas de perte de données
✅ **Génération automatique** - Worker surveille et génère les credentials
✅ **Vérification cryptographique** - Signatures numériques réelles
✅ **UX moderne** - Interface glassmorphism, animations fluides
✅ **Workflow complet** - De la vente à la vérification bancaire
✅ **Scalable** - Architecture prête pour la production

## 📝 Commits Git

Tous les commits sont signés par Bsh54 (shadrakbsh@gmail.com) sans co-authorship.

## 🤝 Contribution

Projet développé pour le hackathon EVOLUTICS DIGITAL ID.

## 📄 Licence

MIT
