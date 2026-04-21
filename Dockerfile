# Stage 1: Base image
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++

# Stage 2: Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 3: Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 4: Production runner
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat dos2unix

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV DATABASE_URL=/data/construction.db

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Drizzle migration files and config for runtime migrations
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/src/db ./src/db

# Copy drizzle-kit and its dependencies from node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy startup and seed scripts
COPY --from=builder /app/start.sh ./start.sh
COPY --from=builder /app/seed-users.mjs ./seed-users.mjs
RUN dos2unix start.sh && chmod +x start.sh

# Create data directory for local fallback
RUN mkdir -p /data && chown nextjs:nodejs /data

USER nextjs

EXPOSE 3000

CMD ["./start.sh"]
