<p align="center">
  <img src="../assets/logo.png" alt="LLP Logo - lolpaon" width="160" />
</p>

# 🌐 GUIDE COMPLET D'INSTALLATION : SERVEURS WEB (VPS) & EXTENSION VS CODE
> **Déploiement en 1 seule commande sur VPS Linux et guide d'installation de l'extension de développement LLP (lolpaon).**

---

## 📑 Sommaire
1. [⚡ Résumé Ultra-Rapide (TL;DR)](#1--résumé-ultra-rapide-tldr)
2. [🖥️ Déploiement en 1 Seule Commande sur VPS / Serveur Web (Linux)](#2-️-déploiement-en-1-seule-commande-sur-vps--serveur-web-linux)
3. [🚀 Mettre en Ligne son Serveur LLP (server.llp)](#3--mettre-en-ligne-son-serveur-llp-serverllp)
4. [🔒 Sécuriser avec Nom de Domaine & HTTPS (Nginx Reverse Proxy)](#4--sécuriser-avec-nom-de-domaine--https-nginx-reverse-proxy)
5. [🎨 Guide Développeur : Installer l'Extension VS Code (.vsix)](#5--guide-développeur--installer-lextension-vs-code-vsix)
6. [🛠️ Fonctionnalités Clés de l'Extension VS Code](#6-️-fonctionnalités-clés-de-lextension-vs-code)
7. [🔄 Workflow Complet : Du Code Local au VPS en Production](#7--workflow-complet--du-code-local-au-vps-en-production)

---

## 1. ⚡ Résumé Ultra-Rapide (TL;DR)

* **Sur votre VPS / Serveur Web (Linux)** :
  ```bash
  curl -fsSL https://raw.githubusercontent.com/lolpaoncreation/LLP-Server/main/install-vps.sh | sudo bash
  ```
  *Installe automatiquement Node.js 20 LTS, compile LLP, crée la commande globale `/usr/local/bin/llp` et configure le service 24h/24.*

* **Sur votre PC de Développement (VS Code)** :
  Installez le fichier `vscode-extension/llp-language-1.4.3.vsix` directement dans VS Code via :
  `Extensions (Ctrl+Shift+X)` ➔ Menu `...` ➔ **Installer depuis VSIX...**
  *(Ou en terminal : `code --install-extension vscode-extension/llp-language-1.4.3.vsix`)*.

---

## 2. 🖥️ Déploiement en 1 Seule Commande sur VPS / Serveur Web (Linux)

Dépôt officiel du serveur : **[https://github.com/lolpaoncreation/LLP-Server.git](https://github.com/lolpaoncreation/LLP-Server.git)**

Ce script fonctionne sur **Ubuntu, Debian, CentOS, RedHat, AlmaLinux, Rocky Linux et Arch Linux**.

### Option A : Commande Directe en Ligne Unique (Recommandée)
Connectez-vous en SSH à votre VPS et collez simplement cette commande :

```bash
curl -fsSL https://raw.githubusercontent.com/lolpaoncreation/LLP-Server/main/install-vps.sh | sudo bash
```

*(Ou via l'alias court : `curl -fsSL https://raw.githubusercontent.com/lolpaoncreation/LLP-Server/main/install-server.sh | sudo bash`)*

### Option B : Via Git Clone
Si vous clonez le dépôt manuellement sur votre VPS :

```bash
git clone https://github.com/lolpaoncreation/LLP-Server.git
cd LLP-Server
sudo bash install-vps.sh
```

### Option C : Déploiement Conteneurisé avec Docker & Docker Compose
Si vous utilisez Docker sur votre serveur Linux :

```bash
git clone https://github.com/lolpaoncreation/LLP-Server.git
cd LLP-Server
docker compose up -d
```

### ⚙️ Ce que fait automatiquement le script :
1. ✅ **Détecte votre distribution Linux** (`apt`, `dnf`, `yum`, `pacman`).
2. ✅ **Installe automatiquement Node.js v20+ LTS et npm** si la machine ne les possède pas encore.
3. ✅ **Installe les dépendances et compile TypeScript** (`npm run build`).
4. ✅ **Enregistre la commande globale `llp`** dans le système (`/usr/local/bin/llp`).
5. ✅ **Configure un service d'arrière-plan Systemd (`llp-server.service`)** pour que votre serveur tourne 24h/24 et redémarre automatiquement en cas de reboot ou de coupure.
6. ✅ **Crée le dossier prêt à l'emploi** : `/var/www/llp-server/`.

---

## 3. 🚀 Mettre en Ligne son Serveur LLP (server.llp)

### 3.1. Structure des Fichiers Recommandée sur le VPS
Placez vos fichiers backend dans `/var/www/llp-server/` :

```text
/var/www/llp-server/
├── server.llp         # Votre script serveur principal
├── database.cllpdb    # Votre base de données cryptée (optionnelle)
└── project.config     # Clé de configuration du projet
```

### 3.2. Exemple de Fichier `server.llp` Minimal
Créez `/var/www/llp-server/server.llp` :

```llp
visibility: All

print("===================================================")
print("     🚀 SERVEUR OFFICIEL LLP EN PRODUCTION         ")
print("===================================================")

/- 1. Activer la vérification matérielle anti-usurpation \
Server.RequireDevice(true)

/- 2. Définir les gestionnaires de routes \
func handleStatus(req) {
    return "{\"status\": \"online\", \"orchestrator\": \"active\", \"version\": \"1.4\"}"
}

func handleLogin(req) {
    print("Connexion demandée par l'appareil :", req.DeviceId)
    Session.Start()
    Session.Set("authenticated", true)
    Session.Set("deviceId", req.DeviceId)
    Session.Save()

    return "{\"success\": true, \"sessionId\": \"" + Session.Id() + "\"}"
}

func handleCatalog(req) {
    /- Données envoyées au client \
    return "{\"products\": [\"Serveur Pro\", \"Stockage Cloud\", \"Licence Entreprise\"]}"
}

/- 3. Enregistrer les routes HTTP / RPC \
Server.Get("/api/status", handleStatus)
Server.Post("/api/login", handleLogin)
Server.Get("/api/catalog", handleCatalog)

/- 4. Écouter sur toutes les interfaces (0.0.0.0) sur le port 8080 \
Server.Listen(8080, "0.0.0.0")
print("Serveur LLP à l'écoute sur le port 8080...")
```

### 3.3. Comment Démarrer le Serveur

#### Méthode 1 : Test Direct en Console (Pour tester)
```bash
llp server /var/www/llp-server/server.llp --port 8080
```

#### Méthode 2 : Service 24h/24 en Arrière-Plan (Production Recommandée)
Le script d'installation a déjà préconfiguré `systemd` pour vous :

```bash
# 1. Démarrer le serveur
sudo systemctl start llp-server

# 2. Activer le démarrage automatique à chaque redémarrage du VPS
sudo systemctl enable llp-server

# 3. Vérifier que tout tourne parfaitement
sudo systemctl status llp-server

# 4. Consulter les logs en temps réel
sudo journalctl -u llp-server -f
```

#### Méthode 3 : Avec PM2 (Alternative populaire)
Si vous préférez utiliser PM2 :
```bash
sudo npm install -g pm2
pm2 start "llp server /var/www/llp-server/server.llp --port 8080" --name "llp-api"
pm2 save
pm2 startup
```

### 3.4. Ouvrir le Pare-Feu du VPS
Si votre VPS utilise UFW (Ubuntu/Debian) :
```bash
sudo ufw allow 8080/tcp
sudo ufw reload
```

---

## 4. 🔒 Sécuriser avec Nom de Domaine & HTTPS (Nginx Reverse Proxy)

Pour que vos clients se connectent via une URL sécurisée (ex: `https://api.mondomaine.com`) sans spécifier le port `:8080` :

### Étape 1 : Installer Nginx & Certbot
```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
```

### Étape 2 : Créer la Configuration Nginx
Créez `/etc/nginx/sites-available/llp-server` :
```nginx
server {
    server_name api.mondomaine.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activez le site et rechargez Nginx :
```bash
sudo ln -s /etc/nginx/sites-available/llp-server /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Étape 3 : Activer le Certificat SSL Gratuit (HTTPS)
```bash
sudo certbot --nginx -d api.mondomaine.com
```
*Votre serveur LLP est maintenant chiffré de bout en bout en HTTPS sur le port 443 standard !*

---

## 5. 🎨 Guide Développeur : Installer l'Extension VS Code (.vsix)
> **Nouveauté v1.4.3 :** Intègre le logo officiel paon (*lolpaon*) en icône de marketplace et dans tous les webviews interactifs, ainsi que l'intégration native avec le serveur dédié Linux `LLP-Server` !

L'extension officielle se trouve dans le projet sous :
📁 **`vscode-extension/llp-language-1.4.3.vsix`**

### Méthode A : Installation Graphique en 3 Clics (Le plus simple)
1. Ouvrez **Visual Studio Code**.
2. Cliquez sur l'onglet **Extensions** dans la barre latérale gauche *(ou faites `Ctrl + Shift + X`)*.
3. Cliquez sur le menu avec les trois petits points **`...`** (en haut à droite du volet Extensions).
4. Cliquez sur **"Installer depuis VSIX..."** (*Install from VSIX...*).
5. Naviguez jusqu'au dossier `vscode-extension/` et sélectionnez **`llp-language-1.4.3.vsix`**.
6. Une notification apparaît en bas à droite : `Extension 'LLP Programming Language' installée avec succès !` 🎉.

```text
 ┌─────────────────────────────────────────────────────────┐
 │ Extensions: Marketplace                          [ ... ]│ ◄── Cliquer ici
 ├────────────────────────────────────────────────────┬────┤
 │                                                    │    │
 │   Rechercher des extensions...                     │ 1. "Installer depuis VSIX..."
 │                                                    │ 2. Sélectionner llp-language-1.4.3.vsix
```

### Méthode B : Installation en 1 Ligne de Commande dans le Terminal
Ouvrez votre terminal dans le dossier du projet et exécutez :

```bash
code --install-extension vscode-extension/llp-language-1.4.3.vsix
```

---

## 6. 🛠️ Fonctionnalités Clés de l'Extension VS Code

Dès l'extension installée, vous disposez d'un environnement de travail complet pour créer vos outils et interfaces :

### 1. 🌍 Documentation Interactive Bilingue (Français / Anglais)
* Faites **`Ctrl + Shift + P`**
* Tapez : **`LLP: Change Documentation Language`**
* Choisissez **`🇫🇷 Français`** ou **`🇬🇧 English`**
* **Survol de souris (Hover Tooltips)** : Dès que vous passez le curseur sur `App.Launch`, `DevMode`, `Orchestrator`, `module`, `namespace`, `class`, `General`, `int`, la boîte d'explication s'affiche intégralement dans la langue sélectionnée avec paramètres, syntaxe et exemples !
* Ouvrez le manuel complet : **`LLP: Documentation de référence interactive`**.

### 2. 🎨 UI Designer Visuel en Glisser-Déposer (.illp & .illps)
* Ouvrez n'importe quel fichier `.illp` (ex: `views/main.illp`).
* Faites un clic droit dans l'éditeur et sélectionnez **`LLP: Ouvrir le Designer UI Visuel`**.
* Déplacez vos composants, éditez les titres en double-cliquant, liez vos formulaires aux méthodes RPC de votre VPS.
* Les modifications faites dans le fichier de style `.illps` se synchronisent **en direct sans rechargement** !

### 3. 🗄️ Gestionnaire de Base de Données Cryptée (.cllpdb)
* Créez une nouvelle base chiffrée : **`Ctrl + Shift + P`** ➔ **`LLP: Créer une base de données cryptée (.cllpdb)`**.
* Double-cliquez sur un fichier `.cllpdb` pour l'explorer visuellement avec session sécurisée automatique.

### 4. 🚀 Générateur de Projet en 1 Clic
* Faites **`Ctrl + Shift + P`** ➔ **`LLP: Create New Empty Project`**
* Choisissez l'architecture voulue :
  - **Client / Serveur Séparé** : Crée un dossier `client/` (avec UI `.illp` et token matériel) et un dossier `server/` (avec backend BDD).
  - **Monolithique Tout-en-Un** : Application autonome complète.

---

## 7. 🔄 Workflow Complet : Du Code Local au VPS en Production

Voici comment un développeur crée et déploie un outil complet avec LLP :

```text
 ┌───────────────────────────────────────────────────────────┐
 │ SUR VOTRE PC (Développeur)                                │
 │                                                           │
 │  1. Vous créez l'UI dans VS Code (.illp & .illps)         │
 │  2. Vous programmez vos fonctionnalités en LLP            │
 │  3. Vous configurez l'adresse de votre VPS :              │
 │     Client.Connect("api.mondomaine.com", 443)             │
 └─────────────────────────────┬─────────────────────────────┘
                               │ Appel RPC Sécurisé
                               │ (Token Matériel HWID + Ed25519)
                               ▼
 ┌───────────────────────────────────────────────────────────┐
 │ SUR VOTRE VPS (Serveur Web LLP)                           │
 │                                                           │
 │  1. Reçoit la requête sur Nginx HTTPS                     │
 │  2. Le Chef d'Orchestre LLP gère la priorité sans bloquer │
 │  3. Traite les données / interroge la BDD .cllpdb         │
 │  4. Renvoie le résultat au logiciel client                │
 └───────────────────────────────────────────────────────────┘
```

### Le Code Côté Client (`client/main.llp`) :
```llp
visibility: All

/- Connexion directe au VPS distant \
Client.Connect("api.mondomaine.com", 443)

/- Authentification automatique avec identité matérielle scellée \
General auth = Client.Login("mon_login", "mon_mot_de_passe")

if auth.success == True then
    print("Connexion au VPS réussie !")
    General donnees = Client.Get("/api/catalog")
    print("Catalogue reçu du serveur :", donnees)
end

/- Lancer la fenêtre d'interface \
App.Launch(WindowSize: 800 : 600, DevMode: False)
```

---

## 📞 Support & Commandes Utiles de Dépannage

| Action voulue | Commande à exécuter |
| :--- | :--- |
| **Vérifier l'état du serveur VPS** | `sudo systemctl status llp-server` |
| **Redémarrer le serveur VPS** | `sudo systemctl restart llp-server` |
| **Voir les logs du serveur en direct** | `sudo journalctl -u llp-server -f` |
| **Tester la syntaxe d'un script** | `llp check mon_script.llp` |
| **Compiler le client en `.exe`** | `llp build --client` |
| **Lancer le designer UI** | `llp builder views/fenetre.illp` |
