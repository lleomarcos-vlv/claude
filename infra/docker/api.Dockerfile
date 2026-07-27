# ─────────────────────────────────────────────────────────────────────────────
# JardimJá API (NestJS) — multi-stage image
#
# Build from the REPO ROOT so the whole pnpm workspace is in the context:
#   docker build -f infra/docker/api.Dockerfile -t jardimja/api:local .
#
# Stages:
#   base    → node:22-slim + corepack/pnpm + OS deps Prisma needs (openssl)
#   deps    → full workspace install (cached on the lockfile)
#   build   → compile @jardimja/api and its workspace deps, `prisma generate`
#   prune   → produce a self-contained production node_modules (pnpm deploy)
#   runtime → slim, non-root, `node dist/main.js`
# ─────────────────────────────────────────────────────────────────────────────

# ── base ─────────────────────────────────────────────────────────────────────
FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# openssl + ca-certificates are required by Prisma's query engine at build & run.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

# ── deps: install the whole workspace (best layer cache on lockfile) ─────────
FROM base AS deps
# Copy only the files that affect dependency resolution first.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./
COPY apps/api/package.json                    apps/api/package.json
COPY apps/web-admin/package.json              apps/web-admin/package.json
COPY packages/shared/package.json             packages/shared/package.json
COPY packages/ai-vision/package.json          packages/ai-vision/package.json
COPY packages/pricing-engine/package.json     packages/pricing-engine/package.json
COPY packages/knowledge-base/package.json     packages/knowledge-base/package.json
# BuildKit cache mount keeps the pnpm store warm across builds.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ── build: compile the API + its workspace dependencies ──────────────────────
FROM deps AS build
# Now bring in the full source tree.
COPY . .
# Generate the Prisma client (schema declares the `postgis` extension).
RUN pnpm --filter @jardimja/api prisma:generate
# Turbo builds @jardimja/api and everything it depends on (dependsOn: ["^build"]).
RUN pnpm turbo run build --filter=@jardimja/api

# ── prune: self-contained production deployment for the API only ─────────────
# `pnpm deploy` resolves workspace:* deps into a real (non-symlinked)
# node_modules, and --prod drops devDependencies.
FROM build AS prune
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm --filter @jardimja/api deploy --prod --legacy /prod/api

# ── runtime: minimal image, non-root ─────────────────────────────────────────
FROM node:22-slim AS runtime
ENV NODE_ENV=production
ENV API_PORT=3333
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates dumb-init \
  && rm -rf /var/lib/apt/lists/*

# Run as the built-in unprivileged `node` user.
WORKDIR /app
COPY --from=prune --chown=node:node /prod/api/node_modules ./node_modules
COPY --from=prune --chown=node:node /prod/api/dist          ./dist
COPY --from=prune --chown=node:node /prod/api/package.json  ./package.json
# Prisma schema + migrations travel with the image so `migrate deploy` can run.
COPY --from=build  --chown=node:node /app/apps/api/prisma    ./prisma

USER node
EXPOSE 3333

# dumb-init gives us correct PID-1 signal handling for graceful shutdowns.
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
