# CottonPay ID - Digital Identity for Cotton Farmers

## 🌾 Vue d'ensemble

CottonPay ID est une solution d'infrastructure publique numérique qui transforme l'identité nationale d'un agriculteur en une passerelle de paiement sécurisée et instantanée, intégrée avec eSignet (MOSIP).

## 🎯 Objectif

Permettre aux 300,000 agriculteurs de coton du Bénin d'accéder à des paiements directs et sécurisés via leur identité nationale, éliminant les intermédiaires et créant un historique de crédit vérifiable.

## 🏗️ Architecture

```
┌─────────────────┐
│  CottonPay UI   │ (React/HTML)
│  Port: 3001     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Backend API    │ (Node.js/Express)
│  Port: 3002     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  eSignet IdP    │ (MOSIP)
│  Port: 8088     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Mock Identity   │
│  Port: 8082     │
└─────────────────┘
```

## 🚀 Démarrage rapide

### Prérequis
- Docker & Docker Compose
- Node.js 18+
- Git

### 1. Démarrer eSignet (environnement local)

```bash
cd esignet-master/docker-compose
docker compose up -d
```

Vérifier que les services sont actifs:
- eSignet UI: http://localhost:3000
- eSignet API: http://localhost:8088/v1/esignet/swagger-ui.html
- Mock Identity: http://localhost:8082

### 2. Installer CottonPay

```bash
cd CottonPay
npm install
```

### 3. Configurer l'environnement

```bash
cp .env.example .env
# Éditer .env avec vos configurations
```

### 4. Enregistrer CottonPay comme Relying Party

```bash
npm run register-client
```

### 5. Lancer l'application

```bash
# Backend
npm run start:backend

# Frontend (nouveau terminal)
npm run start:frontend
```

Accéder à CottonPay: http://localhost:3001

## 📋 Flux d'authentification

### Connexion
1. Utilisateur clique "Se connecter avec eSignet"
2. Redirection vers eSignet avec PKCE
3. Utilisateur entre son NPI (Numéro Personnel d'Identification)
4. eSignet envoie un OTP au téléphone enregistré
5. Utilisateur valide l'OTP
6. Redirection vers CottonPay avec authorization_code
7. Backend échange le code contre access_token et id_token
8. Session utilisateur créée

### Inscription
1. Utilisateur clique "S'inscrire avec eSignet"
2. Même flux que connexion
3. Création du profil CottonPay après authentification
4. Stockage des informations de base (NPI, nom, téléphone)

## 🔐 Sécurité

- PKCE (Proof Key for Code Exchange)
- JWT signature validation
- HTTPS en production
- Pas de stockage de mots de passe
- Authentification déléguée à eSignet

## 📦 Structure du projet

```
CottonPay/
├── backend/           # API Node.js/Express
│   ├── src/
│   │   ├── routes/    # Routes API
│   │   ├── services/  # Logique métier
│   │   └── utils/     # Utilitaires
│   └── server.js
├── frontend/          # Interface utilisateur
│   ├── public/
│   └── src/
│       ├── components/
│       └── pages/
├── docs/              # Documentation
└── scripts/           # Scripts utilitaires
```

## 🧪 Tests

```bash
# Créer un utilisateur test
npm run create-test-user

# Tester le flux complet
npm run test:e2e
```

## 📚 Guide de Démarrage Rapide

### Installation et Configuration

#### Étape 1: Démarrer eSignet (environnement local)

```bash
cd esignet-master/docker-compose
docker compose up -d
```

Vérifiez que les services sont actifs:
- eSignet UI: http://localhost:3000
- eSignet API: http://localhost:8088/v1/esignet/swagger-ui.html
- Mock Identity: http://localhost:8082

#### Étape 2: Installer les dépendances

```bash
cd CottonPay
npm install
```

#### Étape 3: Enregistrer CottonPay comme Relying Party

```bash
npm run register-client
```

Cette commande génère les clés RSA et enregistre le client OIDC dans eSignet.

#### Étape 4: Créer un utilisateur test

```bash
npm run create-test-user
```

**Informations de test:**
- NPI: TEST123456
- Téléphone: +22997123456
- OTP par défaut: 111111

#### Étape 5: Démarrer l'application

```bash
# Terminal 1 - Backend
npm run start:backend

# Terminal 2 - Frontend
cd frontend && python -m http.server 3001
```

Accéder à: http://localhost:3001

### Test du flux complet

1. Cliquez sur "Se connecter avec eSignet"
2. Entrez le NPI: `TEST123456`
3. Sélectionnez "OTP" comme méthode
4. Entrez le téléphone: `+22997123456`
5. Entrez l'OTP: `111111`
6. Vous serez redirigé vers le dashboard

## 🔧 Dépannage

**Problème: "CLIENT_ID not configured"**
```bash
npm run register-client
```

**Problème: "Connection refused"**
```bash
cd esignet-master/docker-compose
docker compose ps
docker compose up -d
```

## 👥 Équipe EVOLUTICS

- BESSANH Shadrak
- BOUKARI Marlyse
- KPEGBE Mahougnon Uriel
- HOUEYETONGNON Christelle Divinia
- KAGBAHINTO Dédji Jules Claurèce

## 📄 Licence

MIT License - Digital ID for Africa Hackathon 2026
