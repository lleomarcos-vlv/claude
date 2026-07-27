<div align="center">

# 🌿 JardimJá

### O "Uber da Jardinagem" — orçamento por IA a partir de fotos, marketplace de jardineiros e acompanhamento em tempo real.

_Plataforma modular, escalável e pronta para evoluir a produção._

</div>

---

> **Sobre o nome.** `JardimJá` é o nome provisório e funciona bem (memorável, "faça já"). Alternativas
> avaliadas pela equipe de produto, caso queira registrar algo mais curto/brandável:
> **Verdo**, **Podô**, **Raizz**, **Jardo**, **GreenGo** e **Capim**. Recomendação: manter **JardimJá**
> como marca de produto e registrar **`jardimja.com.br`** + as variações defensivas. Ver
> [`docs/10-monetization.md`](docs/10-monetization.md) para posicionamento de marca.

## O que é

O cliente fotografa o jardim → uma **IA multimodal** analisa as imagens/vídeo/localização →
gera um **relatório técnico** e um **orçamento estimado** em segundos → o serviço entra num
**marketplace** onde jardineiros próximos recebem, aceitam, negociam ou recusam → o cliente
escolhe o profissional → acompanha o serviço **em tempo real** (a caminho / chegou / iniciou /
concluiu) → paga com **split automático** → avalia.

Três aplicações, um backend:

| App | Público | Stack |
| --- | --- | --- |
| **Cliente** | quem contrata | Flutter |
| **Profissional** | jardineiros/empresas | Flutter |
| **Admin / BI** | operação da plataforma | React + Vite |

## Diferenciais implementados neste repositório

Este repositório não é um MVP superficial: os **dois componentes que dão vantagem competitiva**
estão implementados de verdade, com testes:

- 🧠 **[`packages/ai-vision`](packages/ai-vision)** — orquestração multimodal com **consenso** entre
  OpenAI Vision, Gemini Vision e Claude Vision. Providers plugáveis, _fan-out_, reconciliação de
  divergências e faixa de confiança calculada. Ver [`docs/04-ai-pipeline.md`](docs/04-ai-pipeline.md).
- 💰 **[`packages/pricing-engine`](packages/pricing-engine)** — motor de precificação determinístico e
  auditável (mão de obra, equipamentos, deslocamento, descarte, urgência, dificuldade, oferta/demanda)
  com _price bands_ e gancho para **aprendizado contínuo**. Ver [`docs/05-pricing-engine.md`](docs/05-pricing-engine.md).

## Estrutura do monorepo

```
jardimja/
├── apps/
│   ├── api/            # Backend NestJS (REST + GraphQL) + Prisma + BullMQ
│   ├── web-admin/      # Painel administrativo React + Vite + Tailwind
│   └── mobile/         # Apps Flutter (cliente + profissional, feature-first)
├── packages/
│   ├── shared/         # Contratos de domínio: enums, DTOs, tipos, Zod schemas
│   ├── ai-vision/      # Orquestração multimodal com consenso (o "cérebro" visual)
│   ├── pricing-engine/ # Motor de orçamento determinístico + ML hook
│   └── knowledge-base/ # Base de conhecimento (espécies, pragas, custos, produtividade)
├── infra/              # docker-compose, Dockerfiles, Terraform (AWS), k8s
├── docs/               # Documentação técnica e de negócio (15 entregáveis)
└── .github/workflows/  # CI/CD
```

## Início rápido (desenvolvimento)

```bash
# 1. Pré-requisitos: Node 22+, pnpm 10+, Docker
corepack enable && corepack prepare pnpm@10.33.0 --activate

# 2. Instalar dependências do monorepo
pnpm install

# 3. Subir infraestrutura local (Postgres+PostGIS, Redis, MinIO)
cp .env.example .env
pnpm infra:up

# 4. Banco de dados: migrações + seed (inclui base de conhecimento)
pnpm db:migrate
pnpm db:seed

# 5. Rodar tudo em modo dev
pnpm dev
#   API      → http://localhost:3333        (REST) / http://localhost:3333/graphql
#   Admin    → http://localhost:5173
#   Swagger  → http://localhost:3333/docs
```

> Sem chaves de IA? O `ai-vision` cai automaticamente para um **provider de simulação
> determinístico** (`mock`), então todo o fluxo de orçamento funciona offline em desenvolvimento.

## Documentação (os 15 entregáveis)

| # | Documento | |
| --- | --- | --- |
| 1 | Arquitetura de software | [`docs/01-architecture.md`](docs/01-architecture.md) |
| 2 | Modelagem do banco de dados | [`docs/02-database.md`](docs/02-database.md) |
| 3 | APIs REST e GraphQL | [`docs/03-api.md`](docs/03-api.md) |
| 4 | Pipeline de IA multimodal | [`docs/04-ai-pipeline.md`](docs/04-ai-pipeline.md) |
| 5 | Motor inteligente de precificação | [`docs/05-pricing-engine.md`](docs/05-pricing-engine.md) |
| 6 | Segurança & LGPD | [`docs/06-security-lgpd.md`](docs/06-security-lgpd.md) |
| 7 | Estratégia de implantação em nuvem | [`docs/07-deployment.md`](docs/07-deployment.md) |
| 8 | Pipeline CI/CD | [`docs/08-cicd.md`](docs/08-cicd.md) |
| 9 | Plano de testes automatizados | [`docs/09-testing.md`](docs/09-testing.md) |
| 10 | Plano de monetização | [`docs/10-monetization.md`](docs/10-monetization.md) |
| 11 | Plano financeiro | [`docs/11-financial-plan.md`](docs/11-financial-plan.md) |
| 12 | Estratégia de aquisição de usuários | [`docs/12-user-acquisition.md`](docs/12-user-acquisition.md) |
| 13 | Roadmap de evolução | [`docs/13-roadmap.md`](docs/13-roadmap.md) |
| 14 | Protótipos de alta fidelidade (UX/UI) | [`docs/design/README.md`](docs/design/README.md) |
| 15 | Documentação funcional / fluxos | [`docs/14-functional-spec.md`](docs/14-functional-spec.md) |

## Estado de implementação

Este é um trabalho de arquitetura + fundação executável de grande porte. Uma plataforma "Uber"
completa é um esforço de meses de um time; aqui a coerência estrutural está toda de pé e os
componentes de maior valor estão implementados e testados. Ver
[`docs/STATUS.md`](docs/STATUS.md) para o mapa honesto de "pronto / esqueleto / a fazer" por módulo.

## Licença

Proprietária — ver [`LICENSE`](LICENSE).
