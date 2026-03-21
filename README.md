# CottonPay - Documentation Technique

CottonPay est une plateforme numérique destinée aux producteurs de coton. Son objectif est d'enregistrer les ventes de récoltes et de générer des reçus vérifiables (Verifiable Credentials) au format JSON-LD.

Le système s'appuie sur l'écosystème open-source d'identité numérique MOSIP :
- eSignet : Pour l'authentification sécurisée des agriculteurs (via le protocole OIDC).
- Inji Certify : Pour l'émission cryptographique des reçus vérifiables.

## Architecture du système

L'application est composée de quatre blocs principaux :
1. Infrastructure (Docker) : Hébergement des bases de données (PostgreSQL, Redis) et des conteneurs MOSIP (eSignet, Mock Identity System, Inji Certify).
2. Backend CottonPay (Node.js) : API centrale gérant la logique métier, les transactions et la communication avec l'API Inji Certify.
3. Frontend CottonPay (Python / HTML / JS) : Interface utilisateur statique permettant à l'agriculteur de saisir ses ventes et de consulter son historique.
4. Plugin Inji Certify (Java Spring Boot) : Module personnalisé (cottonpay-certify-plugin) chargé par Inji Certify pour extraire les données de vente depuis PostgreSQL et formater le reçu vérifiable.

---

## Prérequis

Avant de procéder à l'installation, les outils suivants doivent être installés et configurés sur la machine hôte :
- Docker et Docker Compose (Docker Desktop est recommandé sous Windows et macOS).
- Node.js (version 16 ou supérieure).
- Python 3 (nécessaire pour servir le frontend statique).
- Un terminal compatible Bash (Git Bash est recommandé sous Windows).

---

## Processus d'Installation

L'initialisation de CottonPay nécessite la création des schémas de base de données, la compilation du plugin Java et l'enregistrement du client OIDC. Le script d'installation automatise ces étapes.

1. Rendre les scripts d'administration exécutables :
   ```bash
   chmod +x install.sh start.sh stop.sh
   ```

2. Lancer le script d'installation :
   Note : Ce script réinitialise l'environnement Docker et recrée les schémas de base de données.
   ```bash
   ./install.sh
   ```

   Actions effectuées par le script :
   - Nettoyage des conteneurs Docker existants.
   - Démarrage de PostgreSQL et Redis.
   - Création du schéma "certify" et des tables nécessaires à Inji Certify (incluant la table "cottonpay_sales").
   - Démarrage des modules eSignet et Inji Certify.
   - Enregistrement du client OIDC CottonPay auprès d'eSignet.
   - Création de l'utilisateur de test.

3. Compiler le plugin Java (si non effectué par le script) :
   La compilation s'effectue via une image Docker Maven, ce qui évite d'installer le JDK sur la machine hôte.
   ```bash
   MSYS_NO_PATHCONV=1 docker run --rm --network host \
     -v "$(pwd)/cottonpay-certify-plugin:/app" \
     -w /app maven:3.9-eclipse-temurin-21 \
     mvn clean package -DskipTests
   ```

---

## Exécution du système

Pour les lancements ultérieurs, l'utilisation du script de démarrage standard est suffisante. Il vérifie l'état des services et s'assure de l'auto-configuration si nécessaire.

1. Démarrer les services :
   ```bash
   ./start.sh
   ```

2. Ports alloués par défaut :
   - PostgreSQL : 5455
   - eSignet Backend : 8088
   - eSignet UI : 3000
   - Inji Certify : 8090 (Backend) / 8091 (Proxy Nginx)
   - CottonPay Backend : 3002
   - CottonPay Frontend : 3001

---

## Guide d'utilisation

Une fois le script de démarrage exécuté et les services stabilisés, vous pouvez tester le flux de transaction complet :

1. Accéder à l'application web :
   Ouvrez un navigateur et rendez-vous sur l'adresse : http://localhost:3001

2. Authentification :
   Cliquez sur le bouton de connexion. Vous serez redirigé vers l'interface eSignet.
   Utilisez les identifiants de test préconfigurés :
   - Identifiant (NPI / UIN) : 1234567890123456
   - Code de vérification (OTP) : 111111

3. Enregistrement d'une vente :
   Sur le tableau de bord de l'agriculteur, renseignez le poids de la récolte en kilogrammes et soumettez le formulaire.

4. Validation technique :
   Le Backend Node.js va inscrire la transaction dans PostgreSQL et requérir la génération du reçu auprès d'Inji Certify. Inji Certify validera le jeton d'accès et utilisera le plugin Java pour signer les données. Le reçu vérifiable sera ensuite retourné et affiché sur l'interface.

---

## Arrêt du système

Pour interrompre proprement tous les processus locaux (Node.js, Python) et les conteneurs Docker, utilisez la commande suivante :

```bash
./stop.sh
```