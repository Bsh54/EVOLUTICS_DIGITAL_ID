#!/bin/bash

###############################################################################
# CottonPay - Script d'Installation Complet
# Ce script configure tout le système CottonPay avec eSignet et Inji Certify
###############################################################################

set -e  # Arrêter en cas d'erreur

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║          🌾 COTTONPAY - INSTALLATION COMPLÈTE             ║"
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

echo -e "${YELLOW}📋 Étape 1/8 : Nettoyage Docker${NC}"
echo "Arrêt et suppression de tous les conteneurs existants..."
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
docker volume prune -f
docker network prune -f
echo -e "${GREEN}✅ Nettoyage terminé${NC}"
echo ""

echo -e "${YELLOW}📋 Étape 2/8 : Démarrage PostgreSQL et Redis${NC}"
cd "$ESIGNET_DIR"
docker compose up -d database redis
echo "Attente du démarrage de PostgreSQL (30 secondes)..."
sleep 30
echo -e "${GREEN}✅ PostgreSQL et Redis démarrés${NC}"
echo ""

echo -e "${YELLOW}📋 Étape 3/8 : Initialisation des schémas de base de données${NC}"
# Créer le schéma certify dans mosip_esignet
docker exec docker-compose-database-1 psql -U postgres -d mosip_esignet -c "CREATE SCHEMA IF NOT EXISTS certify; ALTER SCHEMA certify OWNER TO postgres;" 2>/dev/null || true
echo -e "${GREEN}✅ Schémas créés${NC}"
echo ""

echo -e "${YELLOW}📋 Étape 4/8 : Création des tables Inji Certify${NC}"
cd ../../inji-certify-master/db_scripts/inji_certify
# Créer les tables dans le schéma certify
for file in ddl/*.sql; do
    echo "  - Création de $(basename $file)..."
    docker exec -i docker-compose-database-1 psql -U postgres -d mosip_esignet <<EOF
SET search_path TO certify;
$(cat "$file")
EOF
done

# Insérer les données de key_policy_def
echo "  - Insertion des données key_policy_def..."
docker exec -i docker-compose-database-1 psql -U postgres -d mosip_esignet <<EOF
SET search_path TO certify;
INSERT INTO key_policy_def (app_id, key_validity_duration, pre_expire_days, access_allowed, is_active, cr_by, cr_dtimes) VALUES
('ROOT', 2920, 1125, 'NA', TRUE, 'mosipadmin', now()),
('CERTIFY_SERVICE', 1095, 60, 'NA', TRUE, 'mosipadmin', now()),
('CERTIFY_PARTNER', 1095, 60, 'NA', TRUE, 'mosipadmin', now()),
('CERTIFY_VC_SIGN_RSA', 1095, 60, 'NA', TRUE, 'mosipadmin', now()),
('BASE', 730, 60, 'NA', TRUE, 'mosipadmin', now()),
('CERTIFY_VC_SIGN_ED25519', 1095, 60, 'NA', TRUE, 'mosipadmin', now()),
('CERTIFY_VC_SIGN_EC_K1', 1095, 60, 'NA', TRUE, 'mosipadmin', now()),
('CERTIFY_VC_SIGN_EC_R1', 1095, 60, 'NA', TRUE, 'mosipadmin', now())
ON CONFLICT DO NOTHING;
EOF

# Créer la table cottonpay_sales
echo "  - Création de la table cottonpay_sales..."
docker exec -i docker-compose-database-1 psql -U postgres -d mosip_esignet <<EOF
SET search_path TO certify;
CREATE TABLE IF NOT EXISTS cottonpay_sales (
    id SERIAL PRIMARY KEY,
    farmer_name VARCHAR(256) NOT NULL,
    farmer_npi VARCHAR(256) NOT NULL,
    farmer_phone VARCHAR(50),
    sale_date DATE NOT NULL,
    sale_time TIME NOT NULL,
    cotton_weight_kg NUMERIC(10,2) NOT NULL,
    unit_price_fcfa NUMERIC(10,2) NOT NULL,
    total_amount_fcfa NUMERIC(10,2) NOT NULL,
    payment_reference VARCHAR(100),
    payment_status VARCHAR(50),
    payment_method VARCHAR(100),
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    credential_id VARCHAR(100),
    credential_issued BOOLEAN DEFAULT FALSE,
    cr_dtimes TIMESTAMP DEFAULT NOW(),
    upd_dtimes TIMESTAMP
);
EOF
echo -e "${GREEN}✅ Tables créées${NC}"
echo ""

echo -e "${YELLOW}📋 Étape 5/8 : Démarrage des services eSignet${NC}"
cd ../../../esignet-master/docker-compose
docker compose up -d mock-identity-system esignet
echo "Attente du démarrage d'eSignet (90 secondes)..."
sleep 90
docker compose up -d esignet-ui
sleep 10
echo -e "${GREEN}✅ eSignet démarré${NC}"
echo ""

echo -e "${YELLOW}📋 Étape 6/8 : Démarrage d'Inji Certify${NC}"
cd ../../inji-certify-master/docker-compose/docker-compose-injistack
# Créer le réseau mosip_network s'il n'existe pas
docker network create mosip_network 2>/dev/null || true
docker compose up -d certify
echo "Attente du démarrage d'Inji Certify (120 secondes)..."
sleep 120
docker compose up -d certify-nginx
sleep 5
echo -e "${GREEN}✅ Inji Certify démarré${NC}"
echo ""

echo -e "${YELLOW}📋 Étape 7/8 : Configuration du client OIDC CottonPay${NC}"
cd ../../../CottonPay
# Enregistrer le client OIDC
node scripts/register-client.js
echo -e "${GREEN}✅ Client OIDC enregistré${NC}"
echo ""

echo -e "${YELLOW}📋 Étape 8/8 : Création de l'utilisateur de test${NC}"
node scripts/create-test-user.js
echo -e "${GREEN}✅ Utilisateur de test créé${NC}"
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║          ✅ INSTALLATION TERMINÉE AVEC SUCCÈS !           ║"
echo "║                                                            ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║                                                            ║"
echo "║  Services installés :                                      ║"
echo "║  ✅ PostgreSQL (port 5455)                                ║"
echo "║  ✅ Redis (port 6379)                                     ║"
echo "║  ✅ eSignet Backend (port 8088)                           ║"
echo "║  ✅ eSignet UI (port 3000)                                ║"
echo "║  ✅ Mock Identity (port 8082)                             ║"
echo "║  ✅ Inji Certify (port 8090/8091)                         ║"
echo "║                                                            ║"
echo "║  Utilisateur de test :                                     ║"
echo "║  UIN/VID : 1234567890123456                                ║"
echo "║  OTP     : 111111                                          ║"
echo "║                                                            ║"
echo "║  Pour démarrer l'application :                             ║"
echo "║  ./start.sh                                                ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
