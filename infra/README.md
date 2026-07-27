# JardimJá — Infrastructure

Everything needed to run JardimJá locally and in the cloud lives here: the local
Docker dev stack, production Dockerfiles, an AWS Terraform reference, and
Kubernetes manifests.

```
infra/
├── docker-compose.yml        # local dev stack (Postgres+PostGIS, Redis, MinIO)
├── docker/
│   ├── api.Dockerfile        # NestJS API image (multi-stage, non-root)
│   ├── web-admin.Dockerfile  # Vite build → nginx static serve
│   ├── nginx.conf            # SPA fallback + gzip + security headers
│   └── .dockerignore
├── terraform/                # AWS reference (VPC, RDS, ElastiCache, S3/CDN, ECS)
├── k8s/                      # Kubernetes manifests (alternative to ECS)
└── README.md                 # ← you are here
```

---

## Local development

Prerequisites: **Docker**, **Node 22+**, **pnpm 10+** (`corepack enable`).

```bash
cp .env.example .env      # from the repo root
pnpm install
pnpm infra:up             # docker compose -f infra/docker-compose.yml up -d
pnpm db:migrate           # apply Prisma migrations (creates the postgis extension)
pnpm db:seed              # seed reference data (knowledge base, etc.)
pnpm dev                  # run API + web-admin via turbo
```

| Service        | URL / port                                   | Notes |
| -------------- | -------------------------------------------- | ----- |
| Postgres+PostGIS | `localhost:5432` (db/user/pass `jardimja`) | `postgis/postgis:16-3.4`, named volume |
| Redis          | `localhost:6379`                             | cache + BullMQ queues |
| MinIO API      | `localhost:9000`                             | S3-compatible; bucket `jardimja-media` auto-created |
| MinIO Console  | `localhost:9001`                             | login = `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` |
| API            | `localhost:3333` (`/docs`, `/graphql`)       | `pnpm dev` or the commented `api` compose service |
| Web Admin      | `localhost:5173`                             | Vite dev server |

Tear down with `pnpm infra:down` (add `-v` to also drop the data volumes).

### Running the API in a container instead of `pnpm dev`

Uncomment the `api` service in `docker-compose.yml` (it builds from
`docker/api.Dockerfile`, waits for healthy Postgres/Redis/MinIO, and reads
`../.env`). Handy for reproducing the production image locally.

---

## Building the production images

Build from the **repo root** so the whole pnpm workspace is in the context:

```bash
# API (NestJS)
docker build -f infra/docker/api.Dockerfile -t jardimja/api:local .

# Web Admin (Vite → nginx)
docker build -f infra/docker/web-admin.Dockerfile \
  --build-arg VITE_API_BASE_URL=https://api.jardimja.com.br \
  -t jardimja/web-admin:local .
```

Both are multi-stage (pnpm install → turbo build → slim runtime), run as a
non-root user, and the API image bundles the Prisma schema/migrations so
`prisma migrate deploy` can run at release time.

---

## Production topology (AWS)

```
                              Internet
                                 │
                     ┌───────────┴───────────┐
             CloudFront (media CDN)      Route 53  (api.jardimja.com.br)
                     │                        │
                     ▼                        ▼
             ┌───────────────┐        ┌───────────────────┐
             │  S3 (private) │        │  ALB  (HTTPS/ACM) │   public subnets, 2 AZs
             │  jardimja-    │        └─────────┬─────────┘
             │  media        │                  │ target group :3333
             └───────────────┘                  ▼
                                      ┌────────────────────────┐
                                      │  ECS Fargate: API      │  private subnets, 2 AZs
                                      │  (NestJS, autoscaled)  │  desired 2 → max 6
                                      └───────┬──────────┬─────┘
                                              │          │
                                    ┌─────────▼───┐  ┌───▼──────────────┐
                                    │ RDS         │  │ ElastiCache      │  private subnets
                                    │ PostgreSQL  │  │ Redis 7          │  (no public access)
                                    │ 16 + PostGIS│  │ (cache + queues) │
                                    └─────────────┘  └──────────────────┘

  Secrets:  AWS Secrets Manager (DB master password managed by RDS; app keys
            JWT/OpenAI/Gemini/Anthropic/Stripe/MercadoPago/FCM injected into
            the task at runtime — never in images, env files, or TF state).

  Egress:   NAT gateway(s) for private subnets → AI providers, payment APIs, FCM.
  Mobile:   Flutter clients talk to the ALB over HTTPS; media served via CloudFront.
```

Kubernetes is available as a drop-in alternative to ECS — see `k8s/`. Run **one**
of {ECS, EKS}, not both.

---

## Deployment story: staging vs production

Both environments share the **same** Terraform code and image build; they differ
only by `-var-file` (see `terraform/terraform.tfvars.example`) and GitHub
Environment protection rules.

| Aspect          | Staging                          | Production |
| --------------- | -------------------------------- | ---------- |
| Trigger         | push to `main` (auto)            | manual promotion / release tag |
| RDS             | single-AZ, `db.t4g.medium`       | Multi-AZ, larger class, 14-day backups, deletion protection |
| Redis           | single node                      | ≥2 nodes, automatic failover |
| NAT             | one shared gateway               | one per AZ (HA) |
| API tasks       | 2 → 6                            | 3 → 12 |
| Approvals       | none                             | required reviewers on the GitHub Environment |

**Release flow (CI/CD):**

1. `ci.yml` — lint, typecheck, test, build on every push/PR (with Postgres+Redis
   service containers for integration tests).
2. `cd-staging.yml` — on push to `main`: build & push the `api` + `web-admin`
   images to GHCR, run `prisma migrate deploy`, then trigger the ECS
   (or Kubernetes) rollout. Guarded by the `staging` GitHub Environment.
3. Promote to production by re-running the deploy job against the `production`
   Environment (protected with required approvals) and the prod `-var-file`.
4. `security.yml` (CodeQL + dependency review + gitleaks) and `mobile.yml`
   (Flutter analyze/test) run alongside.

See the workflow files in `../.github/workflows/` and the per-directory READMEs
(`terraform/README.md`, `k8s/README.md`) for details.
