#!/usr/bin/env bash
# ==============================================================================
# 🚀 LLP Server (lolpaon) - Script d'installation automatique pour Serveur Linux / VPS
# ==============================================================================
# Dépôt Officiel : https://github.com/lolpaoncreation/LLP-Server.git
# ==============================================================================
# Usage en 1 seule ligne de commande :
#   curl -fsSL https://raw.githubusercontent.com/lolpaoncreation/LLP-Server/main/install-vps.sh | sudo bash
# Ou si vous avez cloné le dépôt localement :
#   sudo bash install-vps.sh
# ==============================================================================

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "================================================================================"
echo "    🦚 INSTALLATION OFFICIELLE DU SERVEUR LLP (lolpaon) SOUS LINUX / VPS       "
echo "    Dépôt : https://github.com/lolpaoncreation/LLP-Server.git                   "
echo "    Serveur Web Backend • Chef d'Orchestre • RPC • Base .cllpdb Chiffrée        "
echo "================================================================================"
echo -e "${NC}"

# 1. Vérification des droits administrateur (root)
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[Erreur] Ce script doit être exécuté avec les privilèges root :${NC}"
  echo -e "   ${YELLOW}sudo bash install-vps.sh${NC} ou via curl avec ${YELLOW}| sudo bash${NC}"
  exit 1
fi

# 2. Détection de la distribution Linux et du gestionnaire de paquets
echo -e "${BLUE}[1/7] Détection de la distribution Linux et des outils de base...${NC}"
PKG_MANAGER=""
if command -v apt-get &> /dev/null; then
    PKG_MANAGER="apt"
elif command -v dnf &> /dev/null; then
    PKG_MANAGER="dnf"
elif command -v yum &> /dev/null; then
    PKG_MANAGER="yum"
elif command -v pacman &> /dev/null; then
    PKG_MANAGER="pacman"
elif command -v zypper &> /dev/null; then
    PKG_MANAGER="zypper"
else
    echo -e "${YELLOW}[Attention] Gestionnaire de paquets inconnu. Vérification manuelle de Node.js...${NC}"
fi

# Installation des outils indispensables (curl, git, build-essential)
if [ "$PKG_MANAGER" = "apt" ]; then
    apt-get update -y -q
    apt-get install -y -q curl git ca-certificates gnupg build-essential
elif [ "$PKG_MANAGER" = "dnf" ] || [ "$PKG_MANAGER" = "yum" ]; then
    $PKG_MANAGER install -y -q curl git make gcc-c++
elif [ "$PKG_MANAGER" = "pacman" ]; then
    pacman -Sy --noconfirm curl git base-devel
fi

# 3. Installation / Mise à niveau de Node.js (v20 LTS recommandé)
echo -e "${BLUE}[2/7] Vérification du runtime Node.js (v20+ LTS requis)...${NC}"
NEED_NODE=false

if ! command -v node &> /dev/null; then
    NEED_NODE=true
else
    NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VER" -lt 18 ]; then
        echo -e "${YELLOW}Version Node.js détectée ($NODE_VER) obsolète. Mise à niveau vers v20 LTS...${NC}"
        NEED_NODE=true
    else
        echo -e "${GREEN}✓ Node.js $(node -v) est déjà prêt.${NC}"
    fi
fi

if [ "$NEED_NODE" = true ]; then
    echo -e "${CYAN}Installation automatique de Node.js v20 LTS...${NC}"
    if [ "$PKG_MANAGER" = "apt" ]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    elif [ "$PKG_MANAGER" = "dnf" ] || [ "$PKG_MANAGER" = "yum" ]; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
        $PKG_MANAGER install -y nodejs
    elif [ "$PKG_MANAGER" = "pacman" ]; then
        pacman -Sy --noconfirm nodejs npm
    else
        echo -e "${RED}[Erreur] Impossible d'installer automatiquement Node.js sur votre distribution.${NC}"
        echo -e "Installez Node.js 20 manuellement puis relancez ce script."
        exit 1
    fi
    echo -e "${GREEN}✓ Node.js $(node -v) et npm $(npm -v) installés avec succès !${NC}"
fi

# 4. Récupération des sources du serveur LLP
echo -e "${BLUE}[3/7] Récupération et déploiement des sources du serveur...${NC}"
LLP_INSTALL_DIR="/opt/llp-server"
REPO_URL="https://github.com/lolpaoncreation/LLP-Server.git"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Si exécuté depuis un clone local existant
if [ -f "$SCRIPT_DIR/package.json" ] && [ -f "$SCRIPT_DIR/bin/llp.js" ]; then
    echo -e "${CYAN}Déploiement depuis le répertoire source local : $SCRIPT_DIR${NC}"
    cd "$SCRIPT_DIR"
elif [ -f "$SCRIPT_DIR/../package.json" ] && [ -f "$SCRIPT_DIR/../bin/llp.js" ]; then
    echo -e "${CYAN}Déploiement depuis le répertoire parent : $(dirname "$SCRIPT_DIR")${NC}"
    cd "$(dirname "$SCRIPT_DIR")"
else
    # Exécution distante via curl / bash
    echo -e "${CYAN}Clonage du dépôt serveur depuis : $REPO_URL${NC}"
    if [ -d "$LLP_INSTALL_DIR" ]; then
        cd "$LLP_INSTALL_DIR"
        git pull origin main || true
    else
        git clone "$REPO_URL" "$LLP_INSTALL_DIR" || mkdir -p "$LLP_INSTALL_DIR"
        cd "$LLP_INSTALL_DIR"
    fi
fi

# 5. Compilation du moteur LLP
echo -e "${BLUE}[4/7] Installation des dépendances npm et compilation du runtime...${NC}"
npm install --silent
npm run build --silent

# 6. Liaison globale du binaire CLI 'llp'
echo -e "${BLUE}[5/7] Enregistrement de la commande système globale 'llp'...${NC}"
chmod +x bin/llp.js
npm link --silent 2>/dev/null || ln -sf "$(pwd)/bin/llp.js" /usr/local/bin/llp

# 7. Initialisation de l'espace de production /var/www/llp-server
echo -e "${BLUE}[6/7] Initialisation de l'environnement de production (/var/www/llp-server)...${NC}"
mkdir -p /var/www/llp-server/data
mkdir -p /var/www/llp-server/assets

# Copie du logo officiel paon si disponible
if [ -f "$(pwd)/assets/logo.png" ]; then
    cp -f "$(pwd)/assets/logo.png" /var/www/llp-server/assets/logo.png
fi

# Déploiement de server.llp si non présent
if [ ! -f "/var/www/llp-server/server.llp" ]; then
    if [ -f "$(pwd)/install/server.llp" ]; then
        cp -f "$(pwd)/install/server.llp" /var/www/llp-server/server.llp
    elif [ -f "$(pwd)/server.llp" ]; then
        cp -f "$(pwd)/server.llp" /var/www/llp-server/server.llp
    else
        cat << 'EOF' > /var/www/llp-server/server.llp
// Serveur de production LLP
visibility: All
print("===================================================")
print("     🦚 SERVEUR PRODUCTION LLP (lolpaon) ACTIF     ")
print("===================================================")
Server.RequireDevice(true)

func handleStatus(req) {
    return "{\"server\": \"LLP Server Engine (lolpaon)\", \"status\": \"online\", \"version\": \"1.4.1\", \"orchestrator\": \"ready\"}"
}

func handleLogin(req) {
    Session.Start()
    Session.Set("authenticated", true)
    Session.Set("deviceId", req.DeviceId)
    Session.Save()
    return "{\"success\": true, \"sessionId\": \"" + Session.Id() + "\", \"message\": \"Appareil authentifié avec succès.\"}"
}

Server.Get("/", handleStatus)
Server.Get("/health", handleStatus)
Server.Get("/api/status", handleStatus)
Server.Post("/api/login", handleLogin)

Server.Listen(8080, "0.0.0.0")
print("🌐 Serveur LLP en écoute sur 0.0.0.0:8080")
EOF
    fi
fi

# 8. Configuration du service d'arrière-plan Systemd (24h/24)
echo -e "${BLUE}[7/7] Configuration et activation du service Systemd 24h/24...${NC}"
cat << 'EOF' > /etc/systemd/system/llp-server.service
[Unit]
Description=LLP Dedicated Backend Server (lolpaon)
Documentation=https://github.com/lolpaoncreation/LLP-Server.git
After=network.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/llp-server
ExecStart=/usr/local/bin/llp server server.llp --port 8080
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=llp-server
Environment=NODE_ENV=production
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable llp-server.service
systemctl restart llp-server.service

# Ouverture automatique du pare-feu pour le port 8080 si actif
if command -v ufw &> /dev/null && ufw status | grep -q "Status: active"; then
    echo -e "${CYAN}Pare-feu UFW détecté actif : Ouverture du port 8080/tcp...${NC}"
    ufw allow 8080/tcp || true
elif command -v firewall-cmd &> /dev/null && systemctl is-active --quiet firewalld; then
    echo -e "${CYAN}Pare-feu Firewalld détecté actif : Ouverture du port 8080/tcp...${NC}"
    firewall-cmd --permanent --add-port=8080/tcp || true
    firewall-cmd --reload || true
fi

echo -e "${GREEN}"
echo "================================================================================"
echo "    🎉 INSTALLATION RÉUSSIE DU SERVEUR LLP SOUS LINUX AVEC SUCCÈS !           "
echo "================================================================================"
echo -e "${NC}"
echo -e "✓ Version installée      : ${CYAN}$(llp --version)${NC}"
echo -e "✓ Binaire global          : ${CYAN}/usr/local/bin/llp${NC}"
echo -e "✓ Répertoire de travail   : ${CYAN}/var/www/llp-server/${NC}"
echo -e "✓ Script serveur actif    : ${CYAN}/var/www/llp-server/server.llp${NC}"
echo -e "✓ Service Systemd actif   : ${CYAN}llp-server.service (Démarrage auto au reboot)${NC}"
echo -e "✓ Port d'écoute           : ${CYAN}http://0.0.0.0:8080${NC}"
echo ""
echo -e "${BOLD}${YELLOW}📋 Commandes utiles pour administrer votre serveur LLP :${NC}"
echo -e "  • Voir le statut du service   : ${CYAN}sudo systemctl status llp-server${NC}"
echo -e "  • Redémarrer le serveur       : ${CYAN}sudo systemctl restart llp-server${NC}"
echo -e "  • Stopper le serveur          : ${CYAN}sudo systemctl stop llp-server${NC}"
echo -e "  • Consulter les logs en direct: ${CYAN}sudo journalctl -u llp-server -f${NC}"
echo -e "  • Tester localement l'API     : ${CYAN}curl http://127.0.0.1:8080/health${NC}"
echo "================================================================================"
