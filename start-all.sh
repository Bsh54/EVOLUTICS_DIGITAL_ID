#!/bin/bash

# Script de démarrage complet de l'infrastructure CottonPay
# Ce script démarre tous les services dans le bon ordre

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║   🌾 CottonPay - Démarrage de l'infrastructure               ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Vérifier que Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
    echo "❌ Erreur: Docker n'est pas en cours d'exécution"
    echo "   Veuillez démarrer Docker Desktop et réessayer"
    exit 1
fi

# Étape 1: Démarrer les services eSignet
echo "📦 Étape 1/4: Démarrage des services eSignet..."
cd ../esignet-master/docker-compose

# Démarrer tous les services
docker compose up -d

echo "   ⏳ Attente du démarrage des services (30 secondes)..."
sleep 30

echo "   ✅ Services eSignet démarrés"
echo ""

# Étape 2: Vérifier la santé des services
echo "🏥 Étape 2/4: Vérification de la santé des services..."

# Attendre que eSignet API soit prêt
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8088/v1/esignet/actuator/health > /dev/null 2>&1; then
        echo "   ✅ eSignet API: OK"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "   ❌ Erreur: eSignet API n'a pas démarré dans les temps"
    exit 1
fi

# Vérifier Mock Identity
if curl -s http://localhost:8082/v1/mock-identity-system/actuator/health > /dev/null 2>&1; then
    echo "   ✅ Mock Identity: OK"
fi

# Vérifier eSignet UI
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   ✅ eSignet UI: OK"
fi

echo ""

# Étape 3: Démarrer le backend CottonPay
echo "🚀 Étape 3/4: Démarrage du backend CottonPay..."
cd ../../CottonPay

# Vérifier que les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "   📦 Installation des dépendances npm..."
    npm install
fi

# Vérifier que le client est enregistré
if [ ! -f ".env" ] || ! grep -q "CLIENT_ID" .env; then
    echo "   🔑 Enregistrement du client OIDC..."
    npm run register-client
fi

# Démarrer le backend en arrière-plan
echo "   🔄 Démarrage du serveur backend..."
node backend/server.js > backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > .backend.pid

# Attendre que le backend soit prêt
sleep 5
if curl -s http://localhost:3002/health > /dev/null 2>&1; then
    echo "   ✅ Backend CottonPay démarré (PID: $BACKEND_PID)"
else
    echo "   ❌ Erreur: Le backend n'a pas démarré correctement"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""

# Étape 4: Démarrer le frontend CottonPay
echo "🌐 Étape 4/4: Démarrage du frontend CottonPay..."
cd frontend
python -m http.server 3001 > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../.frontend.pid

sleep 3
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "   ✅ Frontend CottonPay démarré (PID: $FRONTEND_PID)"
else
    echo "   ❌ Erreur: Le frontend n'a pas démarré correctement"
    kill $FRONTEND_PID 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

cd ..

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║   ✅ INFRASTRUCTURE COTTONPAY - OPÉRATIONNELLE                ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Services disponibles:"
echo "   • Frontend CottonPay:  http://localhost:3001"
echo "   • Backend CottonPay:   http://localhost:3002"
echo "   • eSignet UI:          http://localhost:3000"
echo "   • eSignet API:         http://localhost:8088"
echo "   • Mock Identity:       http://localhost:8082"
echo ""
echo "👤 Utilisateur de test:"
echo "   • NPI:        1234567890123456"
echo "   • Téléphone:  +22997123456"
echo "   • OTP:        111111"
echo ""
echo "🚀 Ouvrez http://localhost:3001 dans votre navigateur pour commencer"
echo ""
echo "📝 Logs disponibles:"
echo "   • Backend:  tail -f backend.log"
echo "   • Frontend: tail -f frontend.log"
echo ""
echo "⚠️  Pour arrêter tous les services, exécutez: ./stop-all.sh"
echo ""
