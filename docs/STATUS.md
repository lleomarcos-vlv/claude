# STATUS — mapa honesto de implementação

Este repositório é uma **fundação de arquitetura executável de grande porte**,
não um produto finalizado. Uma plataforma "Uber" completa (3 apps + backend +
IA + pagamentos + operação) é um esforço de meses de um time. Aqui, a **coerência
estrutural está inteira de pé**, e os **componentes de maior valor competitivo
estão implementados de verdade e testados**.

Legenda: ✅ pronto e testado · 🟩 implementado (compila/typecheck) · 🟨 esqueleto
coerente · ⬜ especificado (doc), não codado.

## Pacotes de domínio (o "cérebro")

| Componente | Estado | Evidência |
| --- | --- | --- |
| `packages/shared` (contratos, enums, Zod) | ✅ | 10 testes |
| `packages/pricing-engine` (motor determinístico + calibração) | ✅ | 12 testes |
| `packages/ai-vision` (consenso multimodal OpenAI/Gemini/Claude) | ✅ | 15 testes |
| `packages/knowledge-base` (espécies, pragas, produtividade) | ✅ | 5 testes |

**42 testes passando.** Rode: `pnpm -r test`.

## Backend (`apps/api`, NestJS + Prisma)

| Módulo | Estado | Nota |
| --- | --- | --- |
| Modelagem de dados (Prisma schema) | ✅ | 25+ modelos, enums, índices, PostGIS |
| Auth (JWT + argon2, roles, refresh) | 🟩 | typecheck ok; falta testes e2e |
| Jobs / lifecycle | 🟩 | `analyze` integra IA→pricing→persistência (o coração) |
| Estimation (AiService + PricingService + calibração) | 🟩 | wrappers dos pacotes ✅ |
| Marketplace / offers (feed geo, escolher) | 🟩 | haversine; produção usa PostGIS `ST_DWithin` |
| Chat (REST + WebSocket) | 🟩 | gateway socket.io |
| Tracking em tempo real (GPS) | 🟩 | gateway socket.io |
| Payments (abstração + split + webhook) | 🟨 | provider `sandbox` funcional; Mercado Pago/Stripe = outline |
| Reviews / Gardeners / Admin+BI (REST + GraphQL) | 🟩 | — |
| Seed | ✅ | admin/cliente/jardineiro + base de conhecimento |

O backend **passa no `tsc --noEmit`**. Ainda faltam: testes de integração
(Testcontainers), upload S3 real (presign), filas BullMQ ligadas, FCM, 2FA.

## Front-ends

| App | Estado | Nota |
| --- | --- | --- |
| `apps/web-admin` (React + Vite + Tailwind) | 🟩 | dashboard, tabelas, detalhe com relatório da IA; fallback mock |
| `apps/mobile` (Flutter — cliente + profissional) | 🟩 | estrutura feature-first + telas-chave; requer Flutter SDK |

## Infra & Operação

| Item | Estado |
| --- | --- |
| `docker-compose` (Postgres/PostGIS, Redis, MinIO) | 🟩 |
| Dockerfiles (api, web-admin) | 🟩 |
| Terraform AWS (VPC, RDS, ElastiCache, S3/CloudFront, ECS) | 🟩 (referência, não `apply`) |
| K8s manifests | 🟩 |
| CI/CD (GitHub Actions: ci, cd, security, mobile) | 🟩 |

## Documentação (15 entregáveis)

Todos os 15 documentos escritos em `docs/` (arquitetura, banco, API, pipeline de
IA, precificação, segurança/LGPD, deploy, CI/CD, testes, monetização, financeiro,
aquisição, roadmap, design/protótipos, spec funcional).

## O que falta para produção (resumo priorizado)

1. Testes de integração/e2e do backend + cobertura ≥ 70%.
2. Upload de mídia via S3 presign + antivírus/validação.
3. Integração real Mercado Pago (PIX/split) e Stripe; conciliação.
4. Filas BullMQ para IA e notificações (FCM), com retry/idempotência.
5. Verificação de documentos do jardineiro (KYC) + antifraude.
6. Observabilidade completa (OpenTelemetry, Sentry, dashboards).
7. App mobile: telas restantes, integração de mapas/câmera reais, publicação nas lojas.
8. Base de conhecimento: expandir de amostra para 2.000+ espécies (pipeline de import).
9. Hardening LGPD (fluxos de exclusão, DPO, RIPD) e pentest.

## Como validar agora

```bash
pnpm install
pnpm -r test          # 42 testes verdes (pacotes de domínio)
pnpm --filter @jardimja/api prisma:generate
pnpm --filter @jardimja/api typecheck   # backend compila
pnpm infra:up && pnpm --filter @jardimja/api prisma:migrate && pnpm db:seed
```
