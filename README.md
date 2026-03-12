# CottonPay ID - Identité Numérique pour Agriculteurs de Coton

## 🌾 Vue d'ensemble

CottonPay ID est une solution d'infrastructure publique numérique qui transforme l'identité nationale d'un agriculteur en une passerelle de paiement sécurisée et instantanée, intégrée avec eSignet (MOSIP).

## 🎯 Objectif

Permettre aux 300,000 agriculteurs de coton du Bénin d'accéder à des paiements directs et sécurisés via leur identité nationale, éliminant les intermédiaires et créant un historique de crédit vérifiable.

## ✨ Fonctionnalités Implémentées

### 🔐 Authentification et Sécurité
- ✅ Authentification OAuth 2.0 avec PKCE (Proof Key for Code Exchange)
- ✅ Intégration complète avec eSignet (MOSIP Identity Provider)
- ✅ Validation JWT des tokens d'identité
- ✅ Authentification OTP (One-Time Password)
- ✅ Gestion de sessions sécurisées avec express-session
- ✅ Protection CSRF

### 👤 Gestion des Utilisateurs
- ✅ Inscription complète avec formulaire détaillé
- ✅ Création automatique dans Mock Identity System
- ✅ Validation des données (NPI 16 chiffres, téléphone +229, email)
- ✅ Support multilingue (français/anglais) pour les données utilisateur
- ✅ Profil utilisateur avec informations complètes

### 🖥️ Interface Utilisateur
- ✅ Page d'accueil avec connexion/inscription
- ✅ Formulaire d'inscription complet et validé
- ✅ Dashboard utilisateur avec statistiques
- ✅ Design responsive et moderne
- ✅ Messages d'erreur et de succès clairs
- ✅ Indicateurs de chargement

### 🔧 Backend API
- ✅ Routes d'authentification (/auth/login, /auth/register, /auth/callback)
- ✅ Routes utilisateur (/user/profile, /user/dashboard)
- ✅ Route d'inscription (/register/create)
- ✅ Middleware d'authentification
- ✅ Gestion d'erreurs centralisée
- ✅ Support CORS pour le frontend

### 🛠️ Scripts Utilitaires
- ✅ Script d'enregistrement client OIDC (register-client.js)
- ✅ Script de création d'utilisateur test (create-test-user.js)
- ✅ Génération automatique de clés RSA
- ✅ Configuration automatique du .env

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CottonPay Frontend                   │
│                   (HTML/CSS/JavaScript)                 │
│                      Port: 3001                         │
│  - index.html (Accueil)                                │
│  - register.html (Inscription)                         │
│  - dashboard.html (Tableau de bord)                    │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/HTTPS
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  CottonPay Backend API                  │
│                  (Node.js/Express)                      │
│                      Port: 3002                         │
│  Routes:                                               │
│  - /auth/* (Authentification)                          │
│  - /user/* (Profil utilisateur)                        │
│  - /register/* (Inscription)                           │
│  - /callback (OAuth callback)                          │
└────────────────────┬────────────────────────────────────┘
                     │ OAuth 2.0 + PKCE
                     ▼
┌─────────────────────────────────────────────────────────┐
│              eSignet Identity Provider                  │
│                    (MOSIP)                              │
│                   Port: 8088                            │
│  - Authorization endpoint                              │
│  - Token endpoint                                      │
│  - JWKS endpoint                                       │
│  - Client management                                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Mock Identity System                       │
│                   Port: 8082                            │
│  - Stockage des identités                             │
│  - Validation OTP                                      │
│  - Gestion des utilisateurs                            │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Installation et Démarrage

### Prérequis
- **Docker & Docker Compose** (pour eSignet)
- **Node.js 18+** et npm
- **Python 3** (pour le serveur frontend)
- **Git**

### ⚡ Méthode Rapide (Recommandée)

Utilisez le script de démarrage automatique qui configure tout pour vous :

```bash
cd CottonPay
./start-all.sh
```

Ce script :
- Démarre tous les services Docker eSignet
- Installe les dépendances npm si nécessaire
- Enregistre le client OIDC automatiquement
- Démarre le backend et le frontend
- Vérifie la santé de tous les services

Pour arrêter tous les services :
```bash
./stop-all.sh
```

### 📝 Méthode Manuelle (Étape par étape)

#### Étape 1: Cloner le projet

```bash
git clone https://github.com/Bsh54/EVOLUTICS_DIGITAL_ID.git
cd EVOLUTICS_DIGITAL_ID
```

#### Étape 2: Démarrer eSignet (environnement Docker)

```bash
cd esignet-master/docker-compose
docker compose up -d
```

**⚠️ IMPORTANT:** Attendez **30-60 secondes** que tous les services démarrent complètement, notamment l'UI eSignet.

**Vérifier que les services sont actifs:**
- eSignet UI: http://localhost:3000
- eSignet API: http://localhost:8088/v1/esignet/actuator/health
- Mock Identity: http://localhost:8082/v1/mock-identity-system/actuator/health

#### Étape 3: Installer les dépendances CottonPay

```bash
cd ../../CottonPay
npm install
```

#### Étape 4: Enregistrer CottonPay comme Relying Party

```bash
npm run register-client
```

Cette commande:
- Génère une paire de clés RSA (2048 bits)
- Enregistre le client OIDC dans eSignet
- Crée le fichier `.env` avec le CLIENT_ID
- Sauvegarde les clés dans `./keys/`

**⚠️ IMPORTANT:** Si vous obtenez l'erreur "Client ID is invalid", réexécutez cette commande.

#### Étape 5: Créer un utilisateur test (optionnel)

```bash
npm run create-test-user
```

**Informations de test créées:**
- NPI: 1234567890123456
- Nom: Koffi Mensah
- Téléphone: +22997123456
- Email: koffi.mensah@example.com
- OTP: 111111

#### Étape 6: Démarrer l'application

**Terminal 1 - Backend:**
```bash
node backend/server.js
```

**Terminal 2 - Frontend:**
```bash
cd frontend && python -m http.server 3001
```

#### Étape 7: Accéder à l'application

Ouvrez votre navigateur: **http://localhost:3001**

## 📋 Guide d'utilisation

### Créer un nouveau compte

1. Accédez à http://localhost:3001
2. Cliquez sur **"Créer un compte"**
3. Remplissez le formulaire:
   - **NPI**: 16 chiffres (ex: 9876543210123456)
   - **Prénom et Nom**: Votre identité
   - **Date de naissance**: Format YYYY-MM-DD
   - **Genre**: Masculin/Féminin
   - **Téléphone**: Format +229XXXXXXXX
   - **Email**: Votre email
   - **Adresse**: Optionnel
   - **PIN**: 111111 (OTP par défaut)
4. Cliquez sur **"Créer mon compte"**
5. Attendez la confirmation

### Se connecter

1. Sur la page d'accueil, cliquez sur **"Se connecter avec eSignet"**
2. Vous serez redirigé vers eSignet
3. Entrez votre **NPI** (16 chiffres)
4. Sélectionnez **"OTP"** comme méthode d'authentification
5. Entrez votre **numéro de téléphone**
6. Entrez l'**OTP**: 111111
7. Vous serez redirigé vers votre **dashboard**

### Dashboard

Le dashboard affiche:
- Nom de l'utilisateur
- Statistiques (revenus, transactions, dernier paiement)
- Historique des transactions (à venir)
- Bouton de déconnexion

## 🔧 Configuration

### Variables d'environnement (.env)

```env
# eSignet Configuration
ESIGNET_BASE_URL=http://localhost:8088/v1/esignet
MOCK_IDENTITY_URL=http://localhost:8082

# Client OIDC (généré automatiquement)
CLIENT_ID=cottonpay-XXXXXXXXXX
CLIENT_REDIRECT_URI=http://localhost:3002/callback
CLIENT_PRIVATE_KEY_PATH=./keys/private-key.pem
CLIENT_PUBLIC_KEY_PATH=./keys/public-key.pem

# Application
APP_PORT=3002
FRONTEND_URL=http://localhost:3001
SESSION_SECRET=cottonpay-secret-change-in-production
NODE_ENV=development
```

## 📦 Structure du Projet

```
CottonPay/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js          # Routes d'authentification
│   │   │   ├── user.js          # Routes utilisateur
│   │   │   └── register.js      # Routes d'inscription
│   │   ├── services/
│   │   │   └── authService.js   # Service OAuth/OIDC
│   │   ├── middleware/
│   │   │   └── auth.js          # Middleware d'authentification
│   │   └── utils/
│   │       └── pkce.js          # Génération PKCE
│   └── server.js                # Serveur Express
├── frontend/
│   ├── index.html               # Page d'accueil
│   ├── register.html            # Formulaire d'inscription
│   ├── dashboard.html           # Tableau de bord
│   └── welcome.html             # Page de bienvenue
├── scripts/
│   ├── register-client.js       # Enregistrement OIDC
│   └── create-test-user.js      # Création utilisateur test
├── keys/                        # Clés RSA (généré)
│   ├── private-key.pem
│   └── public-key.pem
├── .env                         # Configuration (généré)
├── .env.example                 # Exemple de configuration
├── package.json
└── README.md
```

## 🔐 Flux d'Authentification Détaillé

### 1. Initiation de la connexion
```
Frontend → Backend: GET /auth/login
Backend génère:
  - code_verifier (random 32 bytes)
  - code_challenge (SHA256 du verifier)
  - state (session ID)
  - nonce (random)
Backend → Frontend: authUrl avec paramètres
```

### 2. Autorisation eSignet
```
Frontend → eSignet: Redirection vers /authorize
Utilisateur entre NPI et OTP
eSignet valide l'identité
eSignet → Frontend: Redirection vers /callback avec code
```

### 3. Échange de tokens
```
Frontend → Backend: GET /callback?code=XXX&state=YYY
Backend vérifie state
Backend génère client_assertion (JWT signé)
Backend → eSignet: POST /token avec:
  - code
  - code_verifier
  - client_assertion
eSignet → Backend: access_token + id_token
```

### 4. Validation et session
```
Backend valide id_token (signature JWT)
Backend extrait les claims utilisateur
Backend crée session avec user info
Backend → Frontend: Redirection vers dashboard
```

## 🧪 Tests

### Tester avec l'utilisateur par défaut

```bash
# 1. Créer l'utilisateur test
npm run create-test-user

# 2. Se connecter sur http://localhost:3001
# NPI: 1234567890123456
# OTP: 111111
```

### Tester la création de compte

```bash
# 1. Accéder à http://localhost:3001/register.html
# 2. Remplir le formulaire avec vos données
# 3. Se connecter avec le NPI créé
```

## 🔧 Dépannage

### Problème: "CLIENT_ID not configured"
```bash
npm run register-client
```

### Problème: "Connection refused" (eSignet)
```bash
cd esignet-master/docker-compose
docker compose ps
docker compose up -d
# Attendre 2-3 minutes
```

### Problème: "Port already in use"
```bash
# Backend (port 3002)
netstat -ano | findstr :3002
taskkill //F //PID <PID>

# Frontend (port 3001)
netstat -ano | findstr :3001
taskkill //F //PID <PID>
```

### Problème: "Route not found" pour /callback
Le backend doit être redémarré après modification du code.

### Problème: Dashboard 404
Accéder à http://localhost:3001/dashboard.html (avec .html)

## 🛡️ Sécurité

### Mesures implémentées
- ✅ **PKCE**: Protection contre les attaques d'interception de code
- ✅ **State parameter**: Protection CSRF
- ✅ **JWT validation**: Vérification de signature avec JWKS
- ✅ **Session cookies**: HttpOnly, Secure en production
- ✅ **CORS**: Configuration stricte
- ✅ **No password storage**: Authentification déléguée à eSignet

### Recommandations pour la production
- [ ] Utiliser HTTPS partout
- [ ] Changer SESSION_SECRET
- [ ] Configurer un vrai système de stockage de sessions (Redis)
- [ ] Implémenter rate limiting
- [ ] Ajouter logging et monitoring
- [ ] Configurer des secrets management (Vault, AWS Secrets Manager)

## 📊 Technologies Utilisées

### Backend
- **Node.js** 18+
- **Express.js** - Framework web
- **axios** - Client HTTP
- **jose** - JWT/JWK/JWS/JWE
- **express-session** - Gestion de sessions
- **cors** - Cross-Origin Resource Sharing
- **dotenv** - Variables d'environnement

### Frontend
- **HTML5/CSS3** - Interface utilisateur
- **JavaScript Vanilla** - Logique frontend
- **Python HTTP Server** - Serveur de développement

### Infrastructure
- **Docker & Docker Compose** - Conteneurisation
- **eSignet (MOSIP)** - Identity Provider
- **Mock Identity System** - Stockage d'identités

## 🎯 Roadmap

### Phase 1 - MVP (Complété ✅)
- [x] Authentification OAuth 2.0 + PKCE
- [x] Inscription utilisateur
- [x] Dashboard basique
- [x] Intégration eSignet

### Phase 2 - Paiements (À venir)
- [ ] Intégration API de paiement mobile money
- [ ] Historique des transactions
- [ ] Notifications de paiement
- [ ] QR Code pour paiements

### Phase 3 - Crédit (À venir)
- [ ] Score de crédit basé sur l'historique
- [ ] Demande de micro-crédit
- [ ] Validation par les coopératives
- [ ] Remboursement automatique

### Phase 4 - Écosystème (À venir)
- [ ] Marketplace pour intrants agricoles
- [ ] Assurance récolte
- [ ] Formation et conseils agricoles
- [ ] Communauté d'agriculteurs

## 👥 Équipe EVOLUTICS

**Université d'Abomey-Calavi (UAC) - Bénin**

- **BESSANH Shadrak** - Lead Developer
- **BOUKARI Marlyse** - Business Analyst
- **KPEGBE Mahougnon Uriel** - Frontend Developer
- **HOUEYETONGNON Christelle Divinia** - UX/UI Designer
- **KAGBAHINTO Dédji Jules Claurèce** - Backend Developer

## 🏆 Hackathon

**Digital ID for Africa Hackathon 2026**

CottonPay ID est développé dans le cadre du hackathon Digital ID for Africa, visant à créer des solutions d'identité numérique pour l'inclusion financière en Afrique.

## 📄 Licence

MIT License - 2026

## 🔗 Liens Utiles

- **GitHub**: https://github.com/Bsh54/EVOLUTICS_DIGITAL_ID
- **eSignet Documentation**: https://docs.esignet.io
- **MOSIP**: https://mosip.io

## 📞 Support

Pour toute question ou problème:
- Ouvrir une issue sur GitHub
- Contacter l'équipe EVOLUTICS

---

**Fait avec ❤️ par l'équipe EVOLUTICS - UAC 2026**
