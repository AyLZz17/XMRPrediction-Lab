FROM node:24-alpine AS build

WORKDIR /app/shared-observability
COPY shared-observability/package*.json ./
RUN npm ci
COPY shared-observability/index.js shared-observability/index.d.ts ./

WORKDIR /app/market-service
COPY market-service/package*.json ./
RUN npm ci
COPY market-service/tsconfig.json ./tsconfig.json
COPY market-service/src ./src
RUN npm run build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app/shared-observability
COPY shared-observability/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY shared-observability/index.js shared-observability/index.d.ts ./

WORKDIR /app/market-service
COPY market-service/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/market-service/dist ./dist
USER node
EXPOSE 8090
CMD ["node", "dist/server.js"]
