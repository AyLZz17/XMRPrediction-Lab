FROM node:24-alpine AS build

WORKDIR /app/shared-observability
COPY shared-observability/package*.json ./
RUN npm ci
COPY shared-observability/index.js shared-observability/index.d.ts ./

WORKDIR /app/prediction-service
COPY prediction-service/package*.json ./
RUN npm ci
COPY prediction-service/tsconfig.json ./tsconfig.json
COPY prediction-service/src ./src
RUN npm run build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app/shared-observability
COPY shared-observability/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY shared-observability/index.js shared-observability/index.d.ts ./

WORKDIR /app/prediction-service
COPY prediction-service/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/prediction-service/dist ./dist
USER node
EXPOSE 8092
CMD ["node", "dist/server.js"]
