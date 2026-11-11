FROM node:24-alpine AS builder

WORKDIR /workspace/frontend/next-app
COPY frontend/next-app/package.json frontend/next-app/package-lock.json ./
RUN npm ci
COPY frontend/next-app/ ./
COPY frontend/css/style.css /workspace/frontend/css/style.css
COPY services-frontend /workspace/services-frontend
RUN npm run build

FROM nginx:1.27-alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /workspace/frontend/next-app/out /usr/share/nginx/html
COPY frontend/assets /usr/share/nginx/html/legacy/assets
COPY frontend/css /usr/share/nginx/html/legacy/css
COPY frontend/js /usr/share/nginx/html/legacy/js
COPY frontend/pages /usr/share/nginx/html/legacy/pages

EXPOSE 80
