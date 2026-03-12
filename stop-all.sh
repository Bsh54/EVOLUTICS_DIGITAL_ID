#!/bin/bash

# Script d'arrêt de l'infrastructure CottonPay

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║   🛑 CottonPay - Arrêt de l'infrastructure                   ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Arrêter le backend CottonPay
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "🛑 Arrêt du backend CottonPay (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        rm .backend.pid
        echo "   ✅ Backend arrêté"
    fi
fi

# Arrêter le frontend CottonPay
if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "🛑 Arrêt du frontend CottonPay (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        rm .frontend.pid
        echo "   ✅ Frontend arrêté"
    fi
fi

# Arrêter les services Docker eSignet
echo "🛑 Arrêt des services eSignet..."
cd ../esignet-master/docker-compose
docker compose down

echo ""
echo "✅ Tous les services ont été arrêtés avec succès"
echo ""
