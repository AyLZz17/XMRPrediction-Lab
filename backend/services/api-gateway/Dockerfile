FROM node:24-alpine AS build

WORKDIR /app/shared-observability
COPY shared-observability/package*.json ./
RUN npm ci
COPY shared-observability/index.js shared-observability/index.d.ts ./

WORKDIR /app/api-gateway
COPY api-gateway/package*.json ./
RUN npm ci
COPY api-gateway/tsconfig.json ./tsconfig.json
COPY api-gateway/src ./src
RUN npm run build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app/shared-observability
COPY shared-observability/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY shared-observability/index.js shared-observability/index.d.ts ./

WORKDIR /app/api-gateway
COPY api-gateway/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/api-gateway/dist ./dist
USER node
EXPOSE 8080
CMD ["node", "dist/server.js"]
