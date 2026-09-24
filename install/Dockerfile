# ==============================================================================
# Dockerfile officiel pour Serveur LLP (lolpaon language)
# ==============================================================================
FROM node:20-alpine

LABEL maintainer="lolpaon <https://github.com/lolpaoncreation>"
LABEL description="Official Linux Container for LLP Dedicated Server"

WORKDIR /app

# Dépendances système pour compilation native éventuelle
RUN apk add --no-cache bash git python3 make g++ curl

# Installation des paquets npm
COPY package*.json ./
RUN npm install

# Copie du code source complet
COPY . .

# Compilation TypeScript vers JavaScript (dist/)
RUN npm run build

# Rendre exécutable le binaire CLI llp
RUN chmod +x bin/llp.js && ln -s /app/bin/llp.js /usr/local/bin/llp

# Répertoire de données persistant pour le serveur
WORKDIR /var/www/llp-server

# Exposition du port standard serveur LLP
EXPOSE 8080

# Démarrage automatique du serveur
CMD ["llp", "server", "server.llp", "--port", "8080"]
