FROM node:26-alpine
RUN apk upgrade --no-cache && npm install -g npm@latest
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
USER node
EXPOSE 5000
CMD ["node", "src/index.js"]
