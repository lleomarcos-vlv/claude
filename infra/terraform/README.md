# JardimJá — Terraform (AWS reference infrastructure)

A clean, environment-parameterised AWS reference for running the JardimJá API in
production. It is intentionally **module-free and readable** so it doubles as
documentation of the target topology. It is designed to plan/validate cleanly;
applying it creates real, billable resources.

## What it provisions

| File           | Resources |
| -------------- | --------- |
| `versions.tf`  | Terraform + AWS provider (`~> 5`), two providers (app region + `us-east-1` for CloudFront ACM), optional S3 backend |
| `variables.tf` | All knobs: region, environment, sizes, counts |
| `main.tf`      | AZ/identity data sources, naming `locals`, the app **Secrets Manager** container (values populated out-of-band) |
| `network.tf`   | VPC, public + private subnets across `az_count` AZs, IGW, NAT, route tables |
| `rds.tf`       | RDS **PostgreSQL 16** (+ PostGIS, see below), parameter group, SG, RDS-managed master password |
| `redis.tf`     | ElastiCache **Redis 7** replication group, encrypted in transit + at rest |
| `s3.tf`        | Private **media bucket** + **CloudFront** (OAC) delivery, versioning, lifecycle, CORS |
| `ecs.tf`       | **ECS Fargate** API service behind an **ALB** + target group + **autoscaling** (EKS documented as the alternative) |
| `iam.tf`       | Least-privilege execution + task roles |
| `outputs.tf`   | Endpoints and names other tooling needs |

## PostGIS

RDS PostgreSQL ships PostGIS with the engine — no custom parameter group entry
installs it. It is enabled **per database** with a one-time statement:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

The Prisma schema declares `extensions = [postgis]`, so the first
`prisma migrate deploy` (run by `cd-staging.yml`) creates it automatically.

## Secrets

No secret material is stored in Terraform or its state:

- **Database password** — generated and rotated by RDS into Secrets Manager
  (`manage_master_user_password = true`).
- **App secrets** (`JWT_SECRET`, `OPENAI_API_KEY`, `GEMINI_API_KEY`,
  `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `MERCADOPAGO_ACCESS_TOKEN`,
  `FCM_*`, …) — Terraform creates the secret *container* with an empty JSON
  skeleton and `ignore_changes`; operators populate the value once:

  ```bash
  aws secretsmanager put-secret-value \
    --secret-id jardimja-staging/app \
    --secret-string file://app-secrets.staging.json
  ```

ECS injects these into the task via the container `secrets` block (`valueFrom`),
so they surface as env vars **inside** the container only.

## Usage

```bash
cd infra/terraform

# 1. Configure remote state (recommended) — see the backend block in versions.tf
terraform init -backend-config=backend.staging.hcl

# 2. Review
cp terraform.tfvars.example terraform.tfvars   # then edit
terraform fmt -check
terraform validate
terraform plan -var-file=terraform.tfvars

# 3. Apply
terraform apply -var-file=terraform.tfvars
```

Use **separate state + tfvars per environment** (staging vs production); the
same code produces both. Production overrides are listed at the bottom of
`terraform.tfvars.example` (Multi-AZ RDS, per-AZ NAT, larger instances, more
tasks).

## ECS vs EKS

The default is **ECS Fargate** — no nodes or control plane to manage for a
service this size. If the team standardises on Kubernetes, delete `ecs.tf`,
stand up an EKS cluster (e.g. `terraform-aws-modules/eks/aws`) + AWS Load
Balancer Controller, and deploy `../k8s`. Run **one** of the two, never both.

## Notes / next steps

- Wire DNS (Route 53 alias → `api_alb_dns_name`) and an ACM cert
  (`acm_certificate_arn`) to enable the HTTPS listener.
- Add a WAF web ACL on the ALB before going public.
- Consider RDS Proxy if connection counts from many API tasks grow.
- This reference favours clarity over completeness; a production rollout would
  typically wrap these in reusable modules and add monitoring/alerting.
