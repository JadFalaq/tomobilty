FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV ALLOW_HEALTH_NO_DB=true

# Installer uniquement les dépendances de production
COPY package*.json ./
RUN npm install --omit=dev \
    && npm cache clean --force \
    && apk add --no-cache curl \
    && mkdir -p /app/lang-data \
    && curl -L -o /app/lang-data/eng.traineddata https://tessdata.projectnaptha.com/4.0.0/eng.traineddata \
    && curl -L -o /app/lang-data/fra.traineddata https://tessdata.projectnaptha.com/4.0.0/fra.traineddata \
    && apk del curl

# Copier le code avec les bons droits pour l'utilisateur non-root
COPY --chown=node:node src ./src

# Exposer le port du service
EXPOSE 8004

# Healthcheck HTTP sans dépendances externes
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8004/health', r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# Exécuter en non-root pour la sécurité
USER node

CMD ["node", "src/server.js"]
