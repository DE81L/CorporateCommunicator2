# Use Node 20 LTS
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install --production

FROM node:20-alpine AS build
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
# If you need to compile TS for production, do it here:
# RUN npm run build:server
CMD ["npx", "tsx", "server/index.ts"]
