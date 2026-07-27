FROM node:20-slim

WORKDIR /app

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci

COPY . .

ENV NODE_ENV=production

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]