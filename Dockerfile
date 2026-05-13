# syntax=docker/dockerfile:1.7

# --- Base : Node 24 alpine (aligné sur le runtime Vercel) + pnpm via corepack
FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

# --- Deps : install reproductible depuis le lockfile, mis en cache
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile

# --- Dev : image utilisée par docker-compose pour `pnpm dev` (HMR)
FROM deps AS dev
ENV PORT=3000 \
    HOSTNAME=0.0.0.0
EXPOSE 3000
CMD ["pnpm", "exec", "next", "dev", "-H", "0.0.0.0", "-p", "3000"]

# --- Builder : build de prod Next.js (output standalone)
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# --- Runner : image finale minimale, non-root, standalone server
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && \
    adduser  -u 1001 -S nextjs -G nodejs

# Standalone : server.js + node_modules minimal généré par Next.
# Static et public sont copiés à part (ils ne sont pas embarqués dans /standalone).
COPY --from=builder --chown=nextjs:nodejs /app/public      ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
