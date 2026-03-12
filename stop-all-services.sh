#!/bin/bash

# Script d'arrêt complet pour CottonPay avec Inji Certify

echo "🛑 Arrêt de tous les services CottonPay..."
echo ""

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# 1. Arrêter le Credential Worker
if [ -f logs/worker.pid ]; then
    WORKER_PID=$(cat logs/worker.pid)
    echo "⚙️  Arrêt du Credential Worker (PID: $WORKER_PID)..."
    kill $WORKER_PID 2>/dev/null
    rm logs/worker.pid
    echo -e "${GREEN}✅ Credential Worker arrêté${NC}"
else
    echo "⚠️  Credential Worker n'est pas en cours d'exécution"
fi
echo ""

# 2. Arrêter le frontend
if [ -f logs/frontend.pid ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    echo "🖥️  Arrêt du frontend CottonPay (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID 2>/dev/null
    rm logs/frontend.pid
    echo -e "${GREEN}✅ Frontend arrêté${NC}"
else
    echo "⚠️  Frontend n'est pas en cours d'exécution"
fi
echo ""

# 3. Arrêter le backend
if [ -f logs/backend.pid ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    echo "🌾 Arrêt du backend CottonPay (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null
    rm logs/backend.pid
    echo -e "${GREEN}✅ Backend arrêté${NC}"
else
    echo "⚠️  Backend n'est pas en cours d'exécution"
fi
echo ""

# 4. Optionnel : Arrêter les services Docker
read -p "Voulez-vous aussi arrêter les services Docker (eSignet, Inji Certify) ? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🐳 Arrêt des services Docker..."

    # Arrêter Inji Certify
    cd ../inji-certify-master/docker-compose/docker-compose-injistack
    docker-compose stop
    cd ../../../CottonPay

    # Arrêter eSignet
    cd ../esignet-master/docker-compose
    docker-compose stop
    cd ../../CottonPay

    echo -e "${GREEN}✅ Services Docker arrêtés${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Tous les services CottonPay sont arrêtés${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
