#!/bin/bash

echo "🌾 CottonPay - Installation et Démarrage"
echo "========================================"
echo ""

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

echo ""
echo "✅ Installation terminée!"
echo ""
echo "📋 Prochaines étapes:"
echo ""
echo "1. Démarrer eSignet:"
echo "   cd ../esignet-master/docker-compose"
echo "   docker compose up -d"
echo ""
echo "2. Enregistrer le client OIDC:"
echo "   npm run register-client"
echo ""
echo "3. Créer un utilisateur test:"
echo "   npm run create-test-user"
echo ""
echo "4. Démarrer le backend:"
echo "   npm run start:backend"
echo ""
echo "5. Démarrer le frontend (nouveau terminal):"
echo "   cd frontend && python -m http.server 3001"
echo ""
echo "6. Ouvrir http://localhost:3001"
echo ""
