# ─── Stage 1 : Build Angular ─────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copier les manifestes avant le code source (cache Docker)
COPY package*.json ./
RUN npm ci --prefer-offline

COPY . .
RUN npm run build -- --configuration production

# ─── Stage 2 : Serve avec Nginx ──────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

ARG BUILD_DATE
ARG VCS_REF
LABEL org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.title="hr-frontend" \
      org.opencontainers.image.description="HR Project Frontend — Angular 21"

# Remplacer la config nginx par défaut
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier le build Angular (Angular 21 : dist/{nom}/browser)
COPY --from=builder /app/dist/hr-project-frontend/browser /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
