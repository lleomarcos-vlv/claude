# ─────────────────────────────────────────────────────────────────────────────
# JardimJá Admin (React + Vite) — build the static SPA and serve it with nginx.
#
# Build from the REPO ROOT:
#   docker build -f infra/docker/web-admin.Dockerfile \
#     --build-arg VITE_API_BASE_URL=https://api.jardimja.com.br \
#     -t jardimja/web-admin:local .
#
# Vite inlines VITE_* variables at BUILD time, so the API URL is an ARG, not a
# runtime env var. Rebuild (cheap, cached) to point the admin at another API.
# ─────────────────────────────────────────────────────────────────────────────

# ── base ─────────────────────────────────────────────────────────────────────
FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# ── deps ─────────────────────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./
COPY apps/api/package.json                    apps/api/package.json
COPY apps/web-admin/package.json              apps/web-admin/package.json
COPY packages/shared/package.json             packages/shared/package.json
COPY packages/ai-vision/package.json          packages/ai-vision/package.json
COPY packages/pricing-engine/package.json     packages/pricing-engine/package.json
COPY packages/knowledge-base/package.json     packages/knowledge-base/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ── build ────────────────────────────────────────────────────────────────────
FROM deps AS build
ARG VITE_API_BASE_URL=http://localhost:3333
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
COPY . .
RUN pnpm turbo run build --filter=@jardimja/web-admin

# ── runtime: nginx serving the static bundle ─────────────────────────────────
FROM nginx:1.27-alpine AS runtime
# Drop the default config and add our SPA-aware one.
RUN rm -f /etc/nginx/conf.d/default.conf
COPY infra/docker/nginx.conf /etc/nginx/conf.d/web-admin.conf
COPY --from=build /app/apps/web-admin/dist /usr/share/nginx/html

# nginx:alpine already runs worker processes as the unprivileged `nginx` user.
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://localhost:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
