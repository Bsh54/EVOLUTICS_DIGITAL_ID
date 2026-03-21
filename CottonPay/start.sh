#!/bin/bash

###############################################################################
# CottonPay - Script de Démarrage Complet
# Ce script démarre tous les services CottonPay et s'auto-configure si besoin
###############################################################################

set -e  # Arrêter en cas d'erreur

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║          🌾 COTTONPAY - DÉMARRAGE DU SYSTÈME              ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Répertoires
ESIGNET_DIR="esignet-master/docker-compose"
INJI_DIR="inji-certify-master/docker-compose/docker-compose-injistack"
COTTONPAY_DIR="CottonPay"

# Fonction pour vérifier si un service répond
check_service() {
    local url=$1
    local name=$2
    local max_attempts=120
    local attempt=1

    echo -n "  Vérification de $name..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e " ${GREEN}✅${NC}"
            return 0
        fi
        sleep 2
        attempt=$((attempt + 1))
    done
    echo -e " ${RED}❌ (timeout)${NC}"
    return 1
}

echo -e "${YELLOW}📋 Étape 1/7 : Vérification de Docker${NC}"
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker n'est pas démarré. Veuillez démarrer Docker Desktop.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker est actif${NC}"
echo ""

echo -e "${YELLOW}📋 Étape 2/7 : Démarrage de PostgreSQL et Redis${NC}"
cd "$ESIGNET_DIR"
docker compose up -d database redis
sleep 5
echo -e "${GREEN}✅ PostgreSQL et Redis démarrés${NC}"
echo ""

echo -e "${YELLOW}📋 Étape 3/7 : Démarrage d'eSignet${NC}"
docker compose up -d mock-identity-system esignet
echo "  Attente du démarrage du backend eSignet (cela peut prendre jusqu'à 3-4 minutes)..."
check_service "http://localhost:8088/v1/esignet/actuator/health" "eSignet Backend"

echo "  Démarrage de l'interface utilisateur eSignet..."
docker compose up -d esignet-ui
sleep 10
check_service "http://localhost:3000/" "eSignet UI"
check_service "http://localhost:8082/v1/mock-identity-system/actuator/health" "Mock Identity"
echo ""

echo -e "${YELLOW}📋 Étape 4/7 : Démarrage d'Inji Certify${NC}"
cd ../../inji-certify-master/docker-compose/docker-compose-injistack
docker compose up -d certify certify-nginx
echo "  Attente du démarrage d'Inji Certify (90 secondes)..."
sleep 90
check_service "http://localhost:8090/actuator/health" "Inji Certify Backend" || true
echo -e "${GREEN}✅ Inji Certify démarré${NC}"
echo ""

echo -e "${YELLOW}📋 Étape 5/7 : Configuration Automatique CottonPay${NC}"
cd ../../../CottonPay

# Vérifier si CottonPay est enregistré en regardant si CLIENT_ID a encore sa valeur par défaut
# ou s'il n'existe pas
ENV_FILE=".env"
DEFAULT_CLIENT="cottonpay-1773864595531"

if grep -q "CLIENT_ID=$DEFAULT_CLIENT" "$ENV_FILE" || ! grep -q "CLIENT_ID" "$ENV_FILE"; then
    echo "  ⚠️ CottonPay n'est pas enregistré dans eSignet. Lancement de l'auto-configuration..."
    
    echo "  - Enregistrement du client OIDC..."
    node scripts/register-client.js || echo -e "  ${RED}❌ Erreur lors de l'enregistrement du client${NC}"
    
    echo "  - Création de l'utilisateur de test..."
    node scripts/create-test-user.js || echo -e "  ${RED}❌ Erreur lors de la création de l'utilisateur${NC}"
    
    echo -e "  ${GREEN}✅ Auto-configuration terminée${NC}"
else
    echo -e "  ${GREEN}✅ CottonPay est déjà configuré dans eSignet${NC}"
fi
echo ""

echo -e "${YELLOW}📋 Étape 6/7 : Démarrage du Backend CottonPay${NC}"
# Arrêter tout processus existant sur le port 3002
if netstat -ano | grep -q ":3002.*LISTENING"; then
    echo "  Arrêt du processus existant sur le port 3002..."
    PID=$(netstat -ano | grep ":3002.*LISTENING" | awk '{print $5}' | head -1)
    taskkill //PID $PID //F 2>/dev/null || true
    sleep 2
fi

# Démarrer le backend en arrière-plan
echo "  Démarrage du backend..."
nohup node backend/server.js > backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > backend.pid
sleep 5
check_service "http://localhost:3002/health" "Backend CottonPay"
echo ""

echo -e "${YELLOW}📋 Étape 7/7 : Démarrage du Frontend CottonPay${NC}"
# Arrêter tout processus existant sur le port 3001
if netstat -ano | grep -q ":3001.*LISTENING"; then
    echo "  Arrêt du processus existant sur le port 3001..."
    PID=$(netstat -ano | grep ":3001.*LISTENING" | awk '{print $5}' | head -1)
    taskkill //PID $PID //F 2>/dev/null || true
    sleep 2
fi

# Démarrer le frontend en arrière-plan
echo "  Démarrage du frontend..."
cd frontend
nohup python -m http.server 3001 > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../frontend.pid
cd ..
sleep 3
check_service "http://localhost:3001/" "Frontend CottonPay"
echo ""

# Afficher l'état final
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║          ✅ COTTONPAY DÉMARRÉ AVEC SUCCÈS !               ║"
echo "║                                                            ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║                                                            ║"
echo "║  Services actifs :                                         ║"
echo "║                                                            ║"
echo "║  🗄️  PostgreSQL          → Port 5455                      ║"
echo "║  🗄️  Redis               → Port 6379                      ║"
echo "║  🔐 eSignet Backend      → Port 8088                      ║"
echo "║  🔐 eSignet UI           → Port 3000                      ║"
echo "║  👤 Mock Identity        → Port 8082                      ║"
echo "║  🎫 Inji Certify         → Port 8090/8091                 ║"
echo "║  🌾 CottonPay Backend    → Port 3002                      ║"
echo "║  🌾 CottonPay Frontend   → Port 3001                      ║"
echo "║                                                            ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║                                                            ║"
echo "║  🌐 Application : http://localhost:3001                    ║"
echo "║                                                            ║"
echo "║  👤 Utilisateur de test :                                  ║"
echo "║     UIN/VID : 1234567890123456                             ║"
echo "║     OTP     : 111111                                       ║"
echo "║                                                            ║"
echo "║  📝 Logs :                                                 ║"
echo "║     Backend  : CottonPay/backend.log                       ║"
echo "║     Frontend : CottonPay/frontend.log                      ║"
echo "║                                                            ║"
echo "║  🛑 Pour arrêter : ./stop.sh                               ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${BLUE}💡 Conseil : Ouvrez http://localhost:3001 dans votre navigateur${NC}"
