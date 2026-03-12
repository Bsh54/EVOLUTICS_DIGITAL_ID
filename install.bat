@echo off
echo 🌾 CottonPay - Installation et Démarrage
echo ========================================
echo.

REM Vérifier Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js n'est pas installé
    exit /b 1
)

echo ✅ Node.js installé
echo.

REM Installer les dépendances
echo 📦 Installation des dépendances...
call npm install

echo.
echo ✅ Installation terminée!
echo.
echo 📋 Prochaines étapes:
echo.
echo 1. Démarrer eSignet:
echo    cd ..\esignet-master\docker-compose
echo    docker compose up -d
echo.
echo 2. Enregistrer le client OIDC:
echo    npm run register-client
echo.
echo 3. Créer un utilisateur test:
echo    npm run create-test-user
echo.
echo 4. Démarrer le backend:
echo    npm run start:backend
echo.
echo 5. Démarrer le frontend (nouveau terminal):
echo    cd frontend ^&^& python -m http.server 3001
echo.
echo 6. Ouvrir http://localhost:3001
echo.
pause
