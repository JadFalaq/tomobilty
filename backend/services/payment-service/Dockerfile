FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY src ./src
EXPOSE 8006
ENV NODE_ENV=production
CMD ["node", "src/server.js"]
