# packages/api/Dockerfile
FROM node:20-slim AS builder

WORKDIR /app

# Copy root configurations
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Install all dependencies (required for Nx build)
RUN npm install

# Copy source code
COPY packages/api ./packages/api

# Build the API
RUN npx nx build @speed-sniper/api --production

# ---

FROM node:20-slim

WORKDIR /app

# Copy built assets and production dependencies
COPY --from=builder /app/dist/packages/api ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/api/package.json ./package.json

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "dist/main.js"]
