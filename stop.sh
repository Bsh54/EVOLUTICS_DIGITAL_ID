#!/bin/bash

###############################################################################
# CottonPay - Script d'Arrêt Complet
# Ce script arrête tous les services CottonPay proprement
###############################################################################

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║          🌾 COTTONPAY - ARRÊT DU SYSTÈME                  ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Répertoires
ESIGNET_DIR="esignet-master/docker-compose"
INJI_DIR="inji-certify-master/docker-compose/docker-compose-injistack"
COTTONPAY_DIR="CottonPay"

echo -e "${YELLOW}📋 Étape 1/4 : Arrêt du Frontend CottonPay${NC}"
cd "$COTTONPAY_DIR"
if [ -f frontend.pid ]; then
    FRONTEND_PID=$(cat frontend.pid)
    echo "  Arrêt du frontend (PID: $FRONTEND_PID)..."
    taskkill //PID $FRONTEND_PID //F 2>/dev/null || true
    rm frontend.pid
    echo -e "${GREEN}✅ Frontend arrêté${NC}"
else
    echo "  Aucun PID trouvé, recherche du processus sur le port 3001..."
    if netstat -ano | grep -q ":3001.*LISTENING"; then
        PID=$(netstat -ano | grep ":3001.*LISTENING" | awk '{print $5}' | head -1)
        taskkill //PID $PID //F 2>/dev/null || true
        echo -e "${GREEN}✅ Frontend arrêté${NC}"
    else
        echo "  Frontend déjà arrêté"
    fi
fi
echo ""

echo -e "${YELLOW}📋 Étape 2/4 : Arrêt du Backend CottonPay${NC}"
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    echo "  Arrêt du backend (PID: $BACKEND_PID)..."
    taskkill //PID $BACKEND_PID //F 2>/dev/null || true
    rm backend.pid
    echo -e "${GREEN}✅ Backend arrêté${NC}"
else
    echo "  Aucun PID trouvé, recherche du processus sur le port 3002..."
    if netstat -ano | grep -q ":3002.*LISTENING"; then
        PID=$(netstat -ano | grep ":3002.*LISTENING" | awk '{print $5}' | head -1)
        taskkill //PID $PID //F 2>/dev/null || true
        echo -e "${GREEN}✅ Backend arrêté${NC}"
    else
        echo "  Backend déjà arrêté"
    fi
fi
echo ""

echo -e "${YELLOW}📋 Étape 3/4 : Arrêt d'Inji Certify${NC}"
cd ../inji-certify-master/docker-compose/docker-compose-injistack
docker compose down
echo -e "${GREEN}✅ Inji Certify arrêté${NC}"
echo ""

echo -e "${YELLOW}📋 Étape 4/4 : Arrêt d'eSignet${NC}"
cd ../../../esignet-master/docker-compose
docker compose down
echo -e "${GREEN}✅ eSignet arrêté${NC}"
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║          ✅ COTTONPAY ARRÊTÉ AVEC SUCCÈS !                ║"
echo "║                                                            ║"
echo "║  Tous les services ont été arrêtés proprement.             ║"
echo "║                                                            ║"
echo "║  Pour redémarrer : ./start.sh                              ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
