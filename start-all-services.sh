#!/bin/bash

# Script de démarrage complet pour CottonPay avec Inji Certify
# Ce script démarre tous les services nécessaires pour le hackathon

echo "🚀 Démarrage de CottonPay avec Inji Certify..."
echo ""

# Couleurs pour les logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Vérifier que Docker est en cours d'exécution
echo -e "${BLUE}📦 Vérification de Docker...${NC}"
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker n'est pas en cours d'exécution. Veuillez démarrer Docker."
    exit 1
fi
echo -e "${GREEN}✅ Docker est actif${NC}"
echo ""

# 2. Démarrer les services eSignet (s'ils ne sont pas déjà démarrés)
echo -e "${BLUE}🔐 Vérification des services eSignet...${NC}"
if ! docker ps | grep -q "esignet"; then
    echo "Démarrage des services eSignet..."
    cd ../esignet-master/docker-compose
    docker-compose up -d
    cd ../../CottonPay
    echo -e "${GREEN}✅ Services eSignet démarrés${NC}"
else
    echo -e "${GREEN}✅ Services eSignet déjà actifs${NC}"
fi
echo ""

# 3. Démarrer Inji Certify (s'il n'est pas déjà démarré)
echo -e "${BLUE}🎫 Vérification d'Inji Certify...${NC}"
if ! docker ps | grep -q "certify"; then
    echo "Démarrage d'Inji Certify..."
    cd ../inji-certify-master/docker-compose/docker-compose-injistack
    docker-compose up -d
    cd ../../../CottonPay
    echo -e "${YELLOW}⏳ Attente du démarrage d'Inji Certify (30 secondes)...${NC}"
    sleep 30
    echo -e "${GREEN}✅ Inji Certify démarré${NC}"
else
    echo -e "${GREEN}✅ Inji Certify déjà actif${NC}"
fi
echo ""

# 4. Démarrer le backend CottonPay
echo -e "${BLUE}🌾 Démarrage du backend CottonPay...${NC}"
cd backend
npm start > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
cd ..
sleep 3
echo -e "${GREEN}✅ Backend CottonPay démarré (PID: $BACKEND_PID)${NC}"
echo ""

# 5. Démarrer le frontend CottonPay
echo -e "${BLUE}🖥️  Démarrage du frontend CottonPay...${NC}"
cd frontend
python -m http.server 3001 > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
cd ..
sleep 2
echo -e "${GREEN}✅ Frontend CottonPay démarré (PID: $FRONTEND_PID)${NC}"
echo ""

# 6. Démarrer le Credential Worker
echo -e "${BLUE}⚙️  Démarrage du Credential Worker...${NC}"
cd credential-worker
npm start > ../logs/worker.log 2>&1 &
WORKER_PID=$!
echo $WORKER_PID > ../logs/worker.pid
cd ..
sleep 2
echo -e "${GREEN}✅ Credential Worker démarré (PID: $WORKER_PID)${NC}"
echo ""

# 7. Afficher le résumé
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Tous les services sont démarrés !${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Services disponibles :"
echo ""
echo "   🔐 eSignet UI:           http://localhost:3000"
echo "   🔐 eSignet IDP:          http://localhost:8088"
echo "   🎫 Inji Certify:         http://localhost:8090"
echo "   🌾 CottonPay Backend:    http://localhost:3002"
echo "   🖥️  CottonPay Frontend:   http://localhost:3001"
echo "   💾 PostgreSQL:           localhost:5455"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Logs disponibles dans le dossier logs/"
echo "   - backend.log"
echo "   - frontend.log"
echo "   - worker.log"
echo ""
echo "🛑 Pour arrêter tous les services : ./stop-all-services.sh"
echo ""
echo "🎯 Accédez à l'application : http://localhost:3001"
echo ""
