# JardimJá — Kubernetes manifests (alternative to ECS)

Plain manifests to run the API on any Kubernetes cluster (EKS, GKE, k3s…) as an
alternative to the ECS Fargate service in `../terraform`. Managed data stores
(Postgres+PostGIS, Redis, S3) are still expected to come from Terraform — these
manifests deploy the **stateless API** only.

## Contents

| File                  | Purpose |
| --------------------- | ------- |
| `namespace.yaml`      | `jardimja` namespace with restricted Pod Security |
| `configmap.yaml`      | Non-secret runtime config |
| `secret.example.yaml` | **Example** secret keys (use External Secrets / Sealed Secrets for real values) |
| `api-deployment.yaml` | API Deployment + an initContainer running `prisma migrate deploy`; non-root, read-only rootfs, probes |
| `api-service.yaml`    | ClusterIP Service on port 80 → container 3333 |
| `api-hpa.yaml`        | HorizontalPodAutoscaler (CPU 60% / mem 75%, 2–6 replicas) |
| `ingress.yaml`        | Ingress (AWS Load Balancer Controller annotations; adjust per cluster) |

## Image

All manifests reference `ghcr.io/OWNER/jardimja-api:latest`, built by
`infra/docker/api.Dockerfile` and pushed by `.github/workflows/cd-staging.yml`.
Replace `OWNER` with your GitHub org/user (and pin to an immutable SHA tag in
production instead of `latest`).

## Apply

```bash
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
# Create the real secret out-of-band; do NOT apply secret.example.yaml as-is.
kubectl apply -f api-deployment.yaml
kubectl apply -f api-service.yaml
kubectl apply -f api-hpa.yaml
kubectl apply -f ingress.yaml
```

Or, with Kustomize/Argo CD/Flux, point the tool at this directory.

## Secrets — do not commit real values

`secret.example.yaml` documents the required keys only. In a real cluster use
one of:

- **External Secrets Operator** → syncs from AWS Secrets Manager / SSM (the same
  secrets Terraform provisions).
- **Sealed Secrets** (encrypted, safe to commit).
- **SOPS + age**.

## Notes

- The migration runs as an initContainer so schema changes apply before rollout;
  for large migrations prefer a separate `Job`/Argo hook to avoid blocking every
  pod start.
- Set `PodDisruptionBudget` and `topologySpreadConstraints` for production HA.
- The HPA needs `metrics-server` installed in the cluster.
