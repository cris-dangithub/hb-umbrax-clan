# ============================================
# DOCKERFILE MULTI-STAGE PARA NEXT.JS 15+
# UMBRAX CLAN - Producción Optimizada
# ============================================

# -----------------------------
# Etapa 1: Dependencias
# -----------------------------
FROM node:20-alpine AS deps
WORKDIR /app

# Instalar dependencias del sistema necesarias para Prisma y ffmpeg
RUN apk add --no-cache libc6-compat openssl ffmpeg

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instalar TODAS las dependencias (incluyendo dev para el build)
RUN npm ci

# Generar Prisma Client
RUN npx prisma generate

# -----------------------------
# Etapa 2: Builder
# -----------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar dependencias instaladas
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de entorno para el build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DOCKER_BUILD=true

# Build con output standalone
RUN npm run build

# -----------------------------
# Etapa 3: Runner (Producción)
# -----------------------------
FROM node:20-alpine AS runner
WORKDIR /app

# Instalar OpenSSL para Prisma
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos públicos
COPY --from=builder /app/public ./public

# Copiar build standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar Prisma schema y client generado
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Comando de inicio
CMD ["node", "server.js"]
