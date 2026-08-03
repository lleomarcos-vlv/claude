# BOYD TURISMO TOUR — ERP PREMIUM
## Especificação Técnica e Funcional Completa

**Documento:** Especificação de Produto e Arquitetura (SRS + SAD + UX Spec)
**Versão:** 1.0
**Data:** 2026-08-03
**Autores (papéis):** Arquiteto de Software Sênior · Analista de Negócios · UX Designer · CTO
**Produto:** Plataforma de gestão para operadoras e agências de turismo (padrão internacional)
**Idiomas do produto:** Português (pt-BR) e Inglês (en-US), com arquitetura pronta para es-ES e outras

---

## SUMÁRIO

1. Visão Geral
2. Arquitetura
3. Catálogo Completo de Módulos
4. Especificação Funcional por Módulo
5. Sistema Bilíngue / Internacionalização
6. Banco de Dados
7. Dashboard e BI
8. UX/UI e Design System
9. Segurança, LGPD e Compliance
10. Integrações
11. Roadmap, Times, Custos e Critérios de Aceite

---

# 1. VISÃO GERAL

## 1.1 O que é o sistema

O **Boyd ERP** é uma plataforma SaaS multiempresa (multi-tenant) para gestão ponta a ponta de operadoras de turismo, agências de viagens, empresas de fretamento e excursões. Cobre desde a captação do lead até a prestação de contas da viagem, incluindo operação em campo (embarque, check-in, ocorrências) e portais externos para cliente, fornecedor e guia.

O produto é entregue em três superfícies:

| Superfície | Tecnologia | Público | Modo offline |
|---|---|---|---|
| **Web App (back-office)** | React + TypeScript (SPA/PWA) | Equipe interna | Parcial (cache + fila) |
| **App Mobile / PWA de campo** | PWA instalável + Capacitor (iOS/Android) | Guias, motoristas, vendedores externos | **Total** (IndexedDB + sync) |
| **Portais públicos** | Next.js SSR (SEO) | Clientes, fornecedores, parceiros | Não |

Diferencial arquitetural: **offline-first real** na operação de campo. Ônibus em estrada, parque aquático sem sinal ou hotel em zona rural não podem parar o embarque. O app de campo opera 100% local e sincroniza quando a rede volta, com resolução determinística de conflitos.

## 1.2 Quem utiliza (personas e perfis)

**Perfis internos**

| Perfil | Persona | Principais tarefas | Acesso |
|---|---|---|---|
| **Owner / Diretor** | Dono da operadora | KPIs, margem por partida, fluxo de caixa, metas | Total, incluindo faturamento e configuração |
| **Gerente Comercial** | Coordena vendedores | Funil, metas, comissões, tabelas de preço | Comercial + relatórios; sem financeiro sensível |
| **Vendedor / Consultor** | Atende WhatsApp e balcão | Leads, cotações, reservas, cobrança | Só seus clientes e reservas |
| **Operações / Tráfego** | Escala veículos e equipe | Partidas, alocação de frota, manifesto, ocorrências | Operacional; leitura de reservas |
| **Financeiro** | Contas a pagar/receber | Baixas, conciliação, comissões, DRE | Financeiro completo; sem editar operação |
| **Guia / Líder de excursão** | Em campo | Check-in de embarque, lista de passageiros, ocorrências, despesas de viagem | App de campo, só suas partidas |
| **Motorista** | Em campo | Escala, checklist do veículo, rota, despesas | App de campo, só suas escalas |
| **Backoffice / Emissor** | Documentos | Vouchers, seguros, vistos, emissão de bilhetes | Documental |
| **Admin de TI** | Sistema | Usuários, papéis, integrações, auditoria | Configuração e logs; sem dados financeiros por padrão |

**Perfis externos (portais)**

| Perfil | Portal | O que faz |
|---|---|---|
| **Cliente / Passageiro** | Portal do Cliente | Vê reservas, paga saldo, envia documentos, escolhe assento, avalia |
| **Fornecedor** (ônibus, hotel, receptivo) | Portal do Fornecedor | Recebe solicitações, confirma disponibilidade, envia fatura, acompanha pagamentos |
| **Guia autônomo / Parceiro** | Portal do Guia | Vê escala, aceita/recusa, presta contas de despesas |
| **Agente parceiro / Sub-agência** | Portal B2B | Consulta disponibilidade, vende com markup próprio, acompanha comissão |

## 1.3 Objetivos do produto

**Objetivos de negócio**
1. Aumentar a **taxa de ocupação** média das saídas (meta: +15 p.p. em 12 meses) via alertas de ocupação baixa, listas de espera e campanhas automáticas.
2. Elevar a **margem por partida** com custeio real (veículo, pedágio, alimentação, hospedagem, guia) e ponto de equilíbrio calculado antes da venda.
3. Reduzir **inadimplência** com régua de cobrança automática (WhatsApp/e-mail), links de pagamento e bloqueio de embarque para saldo em aberto.
4. Encurtar o **tempo de resposta ao lead** (meta: < 5 min) com CRM integrado ao WhatsApp e respostas assistidas por IA.
5. Eliminar retrabalho: manifesto, voucher, seguro e checklist gerados de uma única fonte de verdade.

**Objetivos técnicos**
1. Disponibilidade 99,9% no back-office; **100% de operabilidade em campo** mesmo sem rede.
2. p95 < 300 ms nas rotas de leitura mais usadas; < 800 ms nas de escrita.
3. Multi-tenant com isolamento lógico rígido (RLS) e possibilidade de isolamento físico para contas enterprise.
4. Internacionalização completa: idioma, moeda, fuso, formato de data, impostos e documentos por país.
5. Auditoria imutável de tudo que toca dinheiro, passageiro ou documento.

## 1.4 Fluxo geral do negócio

```
CAPTAÇÃO            VENDA                 OPERAÇÃO              PÓS-VENDA
─────────           ─────────             ──────────            ──────────
Anúncio/Indicação   Cotação/Proposta      Escala de frota       Prestação de contas
   │                   │                     │                     │
   ▼                   ▼                     ▼                     ▼
 Lead ──► Qualificação ──► Reserva ──► Pagamento ──► Manifesto ──► Embarque ──► Viagem ──► Retorno
   │          │              │            │             │             │            │          │
   │          │              │            │             │             │            │          ├─► Avaliação (NPS)
   │          │              │            │             │             │            │          ├─► Fechamento financeiro
   │          │              │            │             │             │            │          └─► Recompra / fidelidade
   │          │              │            │             │             │            │
   │          │              │            │             │             │            └─► Ocorrências, despesas de viagem
   │          │              │            │             │             └─► Check-in por QR Code (offline)
   │          │              │            │             └─► Lista de passageiros, seguro, voucher
   │          │              │            └─► PIX / cartão / link / parcelamento / comissão
   │          │              └─► Bloqueio de assento (TTL), lista de espera
   │          └─► Follow-up automático, proposta em PDF bilíngue
   └─► Origem rastreada (UTM, WhatsApp, indicação)
```

**Fluxo paralelo — Suprimentos (fornecedores):**
Necessidade da partida → cotação a N fornecedores → confirmação de disponibilidade → contrato/ordem de serviço → execução → fatura → conciliação → pagamento.

**Fluxo paralelo — Financeiro:**
Reserva gera contas a receber (parcelas) → baixas automáticas (webhook do PSP) ou manuais → partida gera contas a pagar (custos previstos) → realização → DRE por partida, por roteiro e consolidado.

## 1.5 Benefícios

| Dimensão | Antes (planilha/WhatsApp) | Com o ERP |
|---|---|---|
| Controle de assentos | Lista manual, overbooking frequente | Bloqueio transacional, mapa de assentos, lista de espera |
| Cobrança | Manual, esquecida | Régua automática, link de pagamento, baixa por webhook |
| Custo da viagem | Estimado no fim | Orçado antes, realizado depois, margem por partida |
| Documentos | Word colado à mão | Voucher/manifesto/contrato gerados, bilíngues, com QR |
| Equipe em campo | Papel e ligação | App offline com check-in, ocorrências e despesas |
| Decisão | Intuição | Dashboard com KPIs, ponto de equilíbrio e projeção |
| Escala | 1 pessoa é gargalo | Papéis, permissões, portais self-service |
| Auditoria | Inexistente | Log imutável de cada alteração |

**ROI típico estimado** para uma operadora de porte médio (≈ 300 partidas/ano): redução de 6 h/semana de trabalho administrativo, queda de 40% na inadimplência e +10 p.p. de ocupação — payback do investimento em 4–7 meses.
---

# 2. ARQUITETURA

## 2.1 Visão macro

```
┌─────────────────────────────────────────────────────────────────────────┐
│  CLIENTES                                                               │
│  Web App (React SPA/PWA) │ App Campo (PWA/Capacitor) │ Portais (Next.js)│
└───────────────┬─────────────────────┬───────────────────────┬───────────┘
                │ HTTPS/TLS 1.3       │ HTTPS + fila offline  │
┌───────────────▼─────────────────────▼───────────────────────▼───────────┐
│  EDGE — CDN (CloudFront/Cloudflare) + WAF + Rate limit + DDoS           │
└───────────────────────────────┬─────────────────────────────────────────┘
┌───────────────────────────────▼─────────────────────────────────────────┐
│  API GATEWAY  (Kong / AWS API GW)  — authN/authZ, quotas, versionamento │
└───┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────────┘
    │          │          │          │          │          │
┌───▼───┐ ┌────▼────┐ ┌───▼────┐ ┌───▼─────┐ ┌──▼─────┐ ┌──▼──────────┐
│ Auth  │ │ Booking │ │ Ops    │ │ Finance │ │ CRM    │ │ Integration │
│ &IAM  │ │ Service │ │Service │ │ Service │ │Service │ │ Hub         │
└───┬───┘ └────┬────┘ └───┬────┘ └───┬─────┘ └──┬─────┘ └──┬──────────┘
    │          │          │          │          │          │
┌───▼──────────▼──────────▼──────────▼──────────▼──────────▼──────────────┐
│  MENSAGERIA — RabbitMQ / AWS SQS+SNS  ·  Event Bus (outbox pattern)     │
└───┬─────────────────────────┬───────────────────────┬───────────────────┘
┌───▼──────────┐ ┌────────────▼─────────┐ ┌───────────▼───────────────────┐
│ PostgreSQL   │ │ Redis (cache, lock,  │ │ S3 (documentos, fotos, PDFs)  │
│ (primária +  │ │ sessão, rate limit)  │ │ + OpenSearch (busca)          │
│ réplicas RO) │ └──────────────────────┘ └───────────────────────────────┘
│ + PostGIS    │ ┌──────────────────────┐ ┌───────────────────────────────┐
│ + RLS        │ │ ClickHouse / DW      │ │ Workers (Sidekiq/BullMQ):     │
└──────────────┘ │ (analytics, BI)      │ │ cobrança, e-mail, sync, PDF   │
                 └──────────────────────┘ └───────────────────────────────┘
```

**Estilo arquitetural:** *modular monolith* no dia 1, com fronteiras de domínio explícitas (DDD) e contratos de evento já definidos, permitindo extrair microsserviços (Booking, Finance, Integration Hub) sem reescrita quando o volume justificar. Essa é uma decisão de CTO consciente: microsserviços prematuros custam velocidade sem entregar valor a uma operadora com 20 usuários internos.

## 2.2 Frontend

| Item | Escolha | Justificativa |
|---|---|---|
| Framework | **React 18 + TypeScript** | Ecossistema, contratação, maturidade |
| Build | Vite | HMR rápido, bundle enxuto |
| Estado servidor | TanStack Query | Cache, revalidação, offline mutations |
| Estado local | Zustand | Simples, sem boilerplate |
| Formulários | React Hook Form + Zod | Validação isomórfica (mesmo schema no back) |
| UI | Design System próprio sobre Radix UI + Tailwind | Acessível (WAI-ARIA) e customizável |
| Tabelas | TanStack Table (virtualizada) | Listas de 50k+ linhas |
| Gráficos | Recharts / visx | Leve, responsivo, temas |
| Datas | Luxon | Fuso horário e i18n corretos |
| i18n | i18next + ICU MessageFormat | Plural, gênero, interpolação, lazy-load |
| PWA | Workbox + IndexedDB (Dexie) | Offline-first |
| Mobile | Capacitor sobre o mesmo PWA | Câmera/QR, push nativo, biometria |
| Testes | Vitest + Testing Library + Playwright | Unit, integração e E2E |

**Padrões de frontend**
- *Feature-sliced design*: `src/features/booking/{api,ui,model,lib}`.
- Roteamento com *code splitting* por módulo (bundle inicial < 200 KB gzip).
- Todo texto vem de `t()`; nenhum literal em componente (regra de lint que quebra o build).
- *Optimistic UI* em ações de campo; rollback automático se o servidor recusar.

## 2.3 Backend

| Item | Escolha | Justificativa |
|---|---|---|
| Runtime | **Node.js 22 + TypeScript** (NestJS) | Mesmo idioma do front, tipos compartilhados |
| Alternativa enterprise | Java/Spring Boot ou .NET 8 | Se o cliente exigir stack corporativa |
| ORM | Prisma (leitura/escrita) + SQL puro em relatórios | Produtividade + performance onde importa |
| Validação | Zod compartilhado com o front | Contrato único |
| Jobs | BullMQ (Redis) | Cobrança, e-mails, PDFs, sync, reprocessamento |
| PDF | Puppeteer + templates HTML bilíngues | Voucher, manifesto, contrato, fatura |
| Busca | OpenSearch | Busca global de clientes/reservas/documentos |
| Observabilidade | OpenTelemetry → Grafana (Loki/Tempo/Prometheus) + Sentry | Trace distribuído, log estruturado, erro |
| Feature flags | Unleash | Rollout gradual por tenant |

**Organização por domínio (bounded contexts)**
`identity` · `catalog` (roteiros/produtos) · `inventory` (assentos/disponibilidade) · `booking` · `crm` · `operations` · `procurement` (fornecedores) · `finance` · `documents` · `messaging` · `analytics` · `integration`.

**Contratos de eventos (exemplos)**
`booking.created` · `booking.cancelled` · `payment.confirmed` · `departure.confirmed` · `departure.closed` · `passenger.checked_in` · `invoice.issued` · `lead.created`.
Publicação via **transactional outbox** (grava evento na mesma transação do dado; um worker publica) — garante consistência sem 2PC.

## 2.4 Banco de dados

- **PostgreSQL 16** como fonte de verdade (ACID; assento vendido duas vezes é inaceitável).
- **Row Level Security** com `tenant_id` em todas as tabelas — isolamento aplicado no banco, não só na aplicação.
- **PostGIS** para pontos de embarque, raio de atendimento e roteirização.
- **Particionamento** por período em `audit_logs`, `notifications` e `webhook_events`.
- **Réplicas de leitura** para relatórios pesados; **ClickHouse** como DW quando o volume analítico crescer.
- **Redis** para cache de disponibilidade, *locks* distribuídos de assento e rate limiting.
- Migrations versionadas e reversíveis (Prisma Migrate); *seed* por ambiente.

Detalhamento completo de tabelas na seção 6.

## 2.5 API

- **REST + JSON** versionada em `/api/v1`, seguindo maturidade Richardson nível 2, com **OpenAPI 3.1** gerada do código e SDK TypeScript publicado para o front.
- **GraphQL (BFF opcional)** apenas para o dashboard, evitando *over-fetching* em telas com 12 widgets.
- **Webhooks de saída** para parceiros (`booking.created`, `payment.confirmed`) com assinatura HMAC-SHA256, *retry* exponencial e *dead letter*.
- Padrões: paginação por cursor, `If-Match`/ETag para escrita concorrente, `Idempotency-Key` obrigatório em pagamentos e reservas, `Prefer: return=representation`.
- Erros no formato **RFC 9457 (Problem Details)** com `code` estável e mensagem já traduzida conforme `Accept-Language`.

```
POST /api/v1/bookings
Headers: Authorization: Bearer <jwt> · Idempotency-Key: <uuid> · Accept-Language: pt-BR
{
  "departureId":"dep_01H…","customerId":"cus_01H…",
  "passengers":[{"fullName":"Maria Silva","documentId":"...","paxType":"ADULT","seat":"12A"}],
  "priceListId":"pl_01H…","discount":{"type":"PERCENT","value":5},
  "payment":{"method":"PIX","installments":1}
}
→ 201 Created  { "id":"bkg_01H…","code":"BT-2026-0184","status":"PENDING_PAYMENT",
                 "total":{"amount":50000,"currency":"BRL"},"pixQrCode":"000201…" }
```
Valores monetários trafegam em **inteiros na menor unidade** (centavos) + código ISO 4217 — nunca `float`.

## 2.6 Autenticação

- **OAuth 2.1 / OIDC** (Keycloak self-hosted ou Auth0/Cognito gerenciado).
- **JWT de acesso** curto (15 min, RS256, claims: `sub`, `tenant_id`, `roles`, `scopes`, `jti`) + **refresh token rotativo** com detecção de reuso (revoga a família inteira).
- **2FA obrigatório** para papéis Owner, Financeiro e Admin: TOTP (RFC 6238) e/ou WebAuthn/Passkey; SMS apenas como fallback.
- **SSO corporativo** (SAML 2.0 / Google Workspace / Microsoft Entra) para contas enterprise.
- **Magic link** para portais externos (cliente, guia, fornecedor) — sem senha para reduzir atrito e superfície de ataque.
- **Sessões**: listagem de dispositivos, revogação individual, expiração por inatividade configurável.
- **Impersonation** auditada para suporte (registra quem, quando, por quê, com consentimento).

## 2.7 Segurança (visão arquitetural; detalhe na seção 9)

Defesa em profundidade: WAF/CDN → rate limiting por IP+tenant+rota → validação de schema → autorização por política → RLS no banco → criptografia em repouso → auditoria imutável. Segredos em AWS Secrets Manager/Vault com rotação. Dependências varridas (Dependabot + Snyk); SAST no CI; DAST e pentest anual; SBOM assinado a cada release.

## 2.8 Permissões (RBAC + ABAC)

Modelo híbrido: **papéis** definem o conjunto base de permissões; **atributos** restringem o escopo dos dados.

```
Permissão   = recurso:ação            → booking:read, booking:refund, finance:export
Escopo      = own | team | branch | tenant | all
Política    = papel + permissão + escopo + condições
```

| Papel | Exemplos de permissão | Escopo padrão |
|---|---|---|
| OWNER | `*:*` | tenant |
| SALES_MANAGER | `booking:*`, `lead:*`, `report:read` | team |
| SALES_AGENT | `booking:create/read/update`, `lead:*` | own |
| OPS | `departure:*`, `vehicle:*`, `manifest:*` | branch |
| FINANCE | `payment:*`, `payable:*`, `report:export` | tenant |
| GUIDE | `checkin:*`, `incident:create`, `expense:create` | own (partidas atribuídas) |
| CUSTOMER | `own_booking:read`, `payment:create` | own |

Autorização em três camadas: *guard* na API (papel) + *policy* no serviço (regra de negócio: "vendedor só cancela reserva sem pagamento confirmado") + RLS no banco (dado de outro tenant é invisível, ponto). Campos sensíveis (custo de fornecedor, margem, comissão) têm máscara por permissão — a API nem os serializa para quem não pode ver.

## 2.9 Escalabilidade

| Camada | Estratégia |
|---|---|
| Frontend | CDN, cache imutável com hash, SSR só nos portais públicos |
| API | Stateless, autoscaling horizontal por CPU/RPS (HPA no Kubernetes/ECS) |
| Banco | Réplicas de leitura, *connection pooling* (PgBouncer), índices revisados por `pg_stat_statements` |
| Cache | Redis para disponibilidade e catálogo; invalidação por evento |
| Jobs | Filas por prioridade (pagamento > e-mail > relatório), workers dedicados |
| Analytics | DW separado; nenhum relatório pesado toca a base transacional |
| Multi-região | Réplica em outra região para DR; roteamento por latência no futuro |

Metas: 500 tenants, 2M reservas/ano, picos de 10× em datas comemorativas (Réveillon, alta temporada, Festa do Peão). Testes de carga trimestrais com k6 (cenário: 300 usuários simultâneos comprando a mesma saída).

## 2.10 Backup e Disaster Recovery

- **RPO ≤ 5 min · RTO ≤ 1 h.**
- PostgreSQL: *snapshot* diário + **WAL contínuo** (PITR de qualquer segundo dos últimos 35 dias).
- S3: versionamento + *Object Lock* (WORM) + replicação cross-region.
- Backup lógico semanal criptografado (GPG) em provedor secundário — protege contra falha do provedor primário.
- **Teste de restauração mensal automatizado**: restaura em ambiente efêmero, roda suíte de verificação, publica relatório. Backup não testado não é backup.
- Exportação self-service pelo tenant: JSON/CSV completo (portabilidade LGPD Art. 18).

## 2.11 Cloud e Infraestrutura

- **AWS** (referência): ECS Fargate ou EKS, RDS Multi-AZ, ElastiCache, S3, CloudFront, SQS/SNS, Secrets Manager, CloudWatch. Equivalentes em GCP/Azure documentados.
- **IaC** com Terraform; ambientes `dev`, `staging`, `prod` idênticos e efêmeros por PR.
- **CI/CD** GitHub Actions: lint → test → build → SAST → migração → deploy *blue/green* com *canary* de 10% e rollback automático por métrica de erro.
- Custo estimado inicial: **US$ 350–600/mês** (até 50 tenants), escalando de forma aproximadamente linear.
- Alternativa de baixo custo para o piloto: Vercel + Supabase + Cloudflare R2 (~US$ 80/mês), com caminho de migração documentado.

## 2.12 Offline

Requisito de negócio: **embarque e check-in não podem depender de rede.**

| Recurso | Offline |
|---|---|
| Manifesto, lista de passageiros, contatos de emergência | ✅ Total |
| Check-in por QR Code / manual, marcação de assento | ✅ Total (fila) |
| Registro de ocorrência com foto e geolocalização | ✅ Total (fila) |
| Despesas de viagem com foto do comprovante | ✅ Total (fila) |
| Consulta de roteiro, hotel, telefones de fornecedor | ✅ Cache |
| Criar reserva / cobrar cartão | ⚠️ Rascunho local, confirma ao sincronizar |
| Relatórios e dashboard | ❌ Requer conexão |

**Implementação:** Service Worker (Workbox) com *stale-while-revalidate* para catálogo, **IndexedDB (Dexie)** para dados da partida, fila de mutações persistente com `Idempotency-Key` por operação, *background sync* quando a rede volta, indicador visual permanente de estado (`Online` / `Offline — 7 pendentes`). O pacote da partida é pré-carregado automaticamente 24 h antes da saída.

## 2.13 Sincronização e conflitos

- Cada registro carrega `updated_at`, `version` (inteiro) e `device_id`.
- Envio em lote (`POST /sync/batch`) com *delta* desde o último `sync_cursor`.
- **Resolução de conflito por tipo de dado:**
  - Check-in / ocorrência / despesa → *append-only*, nunca conflita (log de eventos).
  - Reserva e pagamento → **servidor vence** (autoridade financeira central); cliente recebe o estado canônico e notifica o usuário.
  - Notas e observações de campo → *merge* CRDT (LWW por campo com desempate por `device_id`).
  - Assento → alocação é sempre transacional no servidor; offline registra *intenção*, servidor confirma ou devolve alternativa.
- Conflitos irreconciliáveis geram um item na fila de revisão manual, com diff lado a lado.
- Sincronização incremental comprimida (gzip) e limitada a 5 MB por lote, com retomada.
---

# 3. CATÁLOGO COMPLETO DE MÓDULOS

62 módulos organizados em 14 domínios. A coluna **Fase** indica o release-alvo (ver roadmap na seção 11): **F1** = MVP, **F2** = consolidação, **F3** = premium/escala.

## D1 — Núcleo e Inteligência
| # | Módulo | Descrição | Fase |
|---|---|---|---|
| 1 | **Dashboard** | Painel executivo com KPIs, gráficos e alertas por perfil | F1 |
| 2 | **Analytics / BI** | Cubo analítico, relatórios customizáveis, exportação | F2 |
| 3 | **Central de Notificações** | Sino, push, e-mail, WhatsApp, preferências por usuário | F1 |
| 4 | **Busca Global** | Busca unificada (cliente, reserva, partida, documento) com atalho ⌘K | F2 |
| 5 | **Automações / Workflow** | Regras "quando X então Y" sem código | F2 |
| 6 | **Assistente IA** | Copiloto: resumo de conversa, resposta sugerida, precificação, previsão de demanda | F3 |

## D2 — Comercial e CRM
| # | Módulo | Descrição | Fase |
|---|---|---|---|
| 7 | **Leads** | Captação multicanal, atribuição, SLA de primeira resposta | F1 |
| 8 | **CRM / Funil** | Kanban de oportunidades, atividades, histórico 360° | F1 |
| 9 | **Clientes** | Cadastro PF/PJ, documentos, preferências, LGPD | F1 |
| 10 | **Cotações / Propostas** | Orçamento multi-item, PDF bilíngue, validade, aceite online | F2 |
| 11 | **Metas e Comissões** | Meta por vendedor/equipe, régua de comissão, apuração | F2 |
| 12 | **Fidelidade / Indicações** | Pontos, cupons, programa "indique e ganhe" | F3 |
| 13 | **Grupos e Corporativo** | Contratos B2B, faturamento consolidado, tabela negociada | F2 |

## D3 — Produtos Turísticos
| # | Módulo | Descrição | Fase |
|---|---|---|---|
| 14 | **Roteiros / Destinos** | Catálogo de destinos, atrativos, sazonalidade | F1 |
| 15 | **Pacotes Turísticos** | Produto composto (transporte + hotel + passeios + seguro) | F1 |
| 16 | **Excursões / Bate-volta** | Saídas de um dia, ingressos inclusos | F1 |
| 17 | **Passeios / Atividades** | Itens vendáveis à parte, com horários próprios | F2 |
| 18 | **Fretamento / Charter** | Locação de veículo fechado, contrato e orçamento | F1 |
| 19 | **Transfers** | Traslado ponto a ponto, aeroporto/hotel | F2 |
| 20 | **Cruzeiros e Aéreo** | Intermediação, PNR, bilhetes | F3 |
| 21 | **Tabela de Preços** | Preço por temporada, faixa etária, ocupação, canal, moeda | F2 |
| 22 | **Disponibilidade / Inventário** | Estoque de assentos, quartos e ingressos; lista de espera | F1 |

## D4 — Reservas
| # | Módulo | Descrição | Fase |
|---|---|---|---|
| 23 | **Reservas** | Núcleo transacional: passageiros, itens, preço, status | F1 |
| 24 | **Mapa de Assentos** | Escolha visual por layout de veículo | F1 |
| 25 | **Check-in / Embarque** | QR Code, lista, offline, no-show | F1 |
| 26 | **Alterações e Cancelamentos** | Política de multa, remarcação, crédito em carteira | F2 |
| 27 | **Lista de Espera** | Fila automática com promoção ao liberar assento | F2 |

## D5 — Operação
| # | Módulo | Descrição | Fase |
|---|---|---|---|
| 28 | **Partidas / Saídas** | Instância operável de um produto em uma data | F1 |
| 29 | **Escala de Frota** | Alocação de veículo, conflito de agenda, manutenção | F1 |
| 30 | **Veículos** | Cadastro, layout de assentos, documentação, manutenção | F1 |
| 31 | **Motoristas** | Cadastro, CNH, jornada, escala | F1 |
| 32 | **Guias Turísticos** | Cadastro, Cadastur, idiomas, disponibilidade, avaliação | F1 |
| 33 | **Roteirização / Mapas** | Pontos de embarque, rota, ETA, rastreio ao vivo | F2 |
| 34 | **Checklists** | Pré-viagem, veículo, embarque, retorno | F2 |
| 35 | **Ocorrências** | Incidentes com foto, gravidade, tratativa | F2 |
| 36 | **Agenda / Calendário** | Visão mês/semana/dia de tudo que acontece | F1 |

## D6 — Suprimentos
| # | Módulo | Descrição | Fase |
|---|---|---|---|
| 37 | **Fornecedores** | Cadastro, categoria, contrato, avaliação, documentos | F1 |
| 38 | **Hotéis / Hospedagem** | Acordos, tipos de apto, rooming list | F2 |
| 39 | **Cotação de Compra** | RFQ para N fornecedores, comparativo, aprovação | F2 |
| 40 | **Contratos e OS** | Ordem de serviço, assinatura eletrônica | F2 |
| 41 | **Parceiros / Sub-agências** | Rede B2B com markup e comissão próprios | F3 |

## D7 — Financeiro
| # | Módulo | Descrição | Fase |
|---|---|---|---|
| 42 | **Contas a Receber** | Parcelas, régua de cobrança, inadimplência | F1 |
| 43 | **Contas a Pagar** | Fornecedores, despesas, aprovação, agendamento | F1 |
| 44 | **Pagamentos / PSP** | PIX, cartão, link, boleto, split, estorno | F1 |
| 45 | **Caixa e Bancos** | Contas, conciliação (OFX/Open Finance), transferências | F2 |
| 46 | **Comissões** | Vendedor, guia, parceiro; apuração e pagamento | F2 |
| 47 | **DRE e Centro de Custo** | Resultado por partida, roteiro, filial, período | F2 |
| 48 | **Fiscal** | NF-e de serviço, ISS, impostos por país | F3 |
| 49 | **Multimoeda / Câmbio** | Cotação diária, ganho/perda cambial | F3 |

## D8 — Documentos
| # | Módulo | Descrição | Fase |
|---|---|---|---|
| 50 | **Gestão Documental** | Upload, OCR, validade, alertas de vencimento | F2 |
| 51 | **Passaportes e Vistos** | Controle por passageiro, prazos, requisitos por destino | F3 |
| 52 | **Seguro Viagem** | Emissão/integração, apólice por passageiro | F2 |
| 53 | **Emissão de Documentos** | Voucher, manifesto, contrato, etiqueta, crachá | F1 |
| 54 | **Assinatura Eletrônica** | Contrato assinado com validade jurídica | F3 |

## D9 — Marketing e Comunicação
| # | Módulo | Descrição | Fase |
|---|---|---|---|
| 55 | **Campanhas** | Segmentação, disparo, UTM, atribuição de receita | F3 |
| 56 | **WhatsApp Business** | Caixa única, templates, chatbot, disparo autorizado | F2 |
| 57 | **E-mail Marketing** | Templates bilíngues, automação, métricas | F3 |
| 58 | **Chat Interno** | Conversas por partida/reserva, menções | F3 |
| 59 | **Central de Atendimento** | Tickets, SLA, base de conhecimento | F3 |

## D10 — Portais Externos
| # | Módulo | Descrição | Fase |
|---|---|---|---|
| 60 | **Portal do Cliente** | Reservas, pagamento, documentos, check-in, avaliação | F2 |
| 61 | **Portal do Fornecedor** | Solicitações, confirmação, faturas | F3 |
| 62 | **Portal do Guia/Motorista** | Escala, aceite, prestação de contas | F2 |
| 63 | **Site / Loja Online (B2C)** | Vitrine com pagamento e disponibilidade em tempo real | F3 |

## D11 — Mobilidade
| # | Módulo | Descrição | Fase |
|---|---|---|---|
| 64 | **App de Campo (PWA/Nativo)** | Guia e motorista, offline-first | F2 |
| 65 | **App do Passageiro** | Voucher digital, QR, notificações da viagem | F3 |

## D12 — Administração
| # | Módulo | Descrição | Fase |
|---|---|---|---|
| 66 | **Usuários** | Convite, papéis, 2FA, sessões | F1 |
| 67 | **Papéis e Permissões** | Editor visual de políticas | F1 |
| 68 | **Configurações da Empresa** | Dados, filiais, marca, políticas, numeração | F1 |
| 69 | **Auditoria / Logs** | Trilha imutável, filtro por entidade e usuário | F1 |
| 70 | **Integrações** | Conectores, chaves, webhooks, sandbox | F2 |
| 71 | **Importação/Exportação** | Migração de planilhas, exportação total | F1 |
| 72 | **Multi-filial / Multiempresa** | Unidades com estoque e financeiro próprios | F3 |

## D13 — Qualidade
| # | Módulo | Descrição | Fase |
|---|---|---|---|
| 73 | **Avaliações / NPS** | Pesquisa pós-viagem, nota por serviço e fornecedor | F2 |
| 74 | **Reclamações / SAC** | Registro, tratativa, reembolso | F3 |

## D14 — Plataforma
| # | Módulo | Descrição | Fase |
|---|---|---|---|
| 75 | **Multi-tenant e Billing SaaS** | Planos, limites, cobrança recorrente | F3 |
| 76 | **API Pública e Marketplace** | Chaves, quotas, documentação, apps de terceiros | F3 |

---

# 4. ESPECIFICAÇÃO FUNCIONAL POR MÓDULO

> Cada módulo é descrito com: **Objetivo · Funcionalidades · Fluxos · Campos · Botões · Filtros · Relatórios · Permissões · Automações · Integrações.**
> Módulos de Fase 1 e 2 recebem detalhamento completo; os de Fase 3 recebem detalhamento essencial, a ser aprofundado no refinamento do respectivo release.

## 4.1 Dashboard

**Objetivo.** Responder em 10 segundos: vendi bem? vou lotar as próximas saídas? tem dinheiro entrando? algo está pegando fogo?

**Funcionalidades.** Painel por perfil (o dono vê margem, o vendedor vê a própria meta, o operacional vê escala); período comparável (mês atual × anterior × mesmo mês do ano anterior); widgets reordenáveis e persistidos por usuário; *drill-down* de qualquer número até a lista de origem; exportação do painel em PDF; modo TV para telão da agência.

**Fluxos.** Login → carrega layout do perfil → busca agregados do DW (cache 5 min) → clique no KPI abre a lista filtrada correspondente → clique na linha abre o registro.

**Campos (widgets).** Receita do período · Resultado (receita − custo) · A receber / vencido · Reservas e passageiros · Ocupação média das próximas saídas · Ticket médio · Taxa de conversão de leads · Custo por assento · Ponto de equilíbrio por partida · NPS.

**Botões.** Alterar período · Comparar · Filtrar por filial/vendedor/roteiro · Reorganizar widgets · Exportar PDF · Atualizar.

**Filtros.** Período, filial, canal de venda, vendedor, roteiro, tipo de produto, moeda.

**Relatórios.** Resumo executivo (PDF), Receita x Despesa, Ocupação por saída, Funil, Ranking de roteiros.

**Permissões.** `dashboard:read` com máscara por escopo — vendedor não vê margem nem custo de fornecedor.

**Automações.** Resumo diário às 8h no WhatsApp do gestor; alerta quando ocupação < 50% com 7 dias para a saída; alerta de meta atingida.

**Integrações.** DW interno; Google Analytics 4 (origem de venda); Meta Ads (custo por lead).

## 4.2 Leads e CRM

**Objetivo.** Nenhum contato interessado pode se perder, e o primeiro retorno tem que sair em minutos.

**Funcionalidades.** Captação automática de WhatsApp, Instagram, site, telefone e indicação; distribuição por rodízio ou regra (roteiro, região, idioma); funil kanban com etapas configuráveis; timeline 360° (mensagens, ligações, propostas, reservas); atividades com lembrete; motivo de perda; reativação de leads frios; *lead scoring*; conversão em cliente + reserva em um clique.

**Fluxos.**
1. *Entrada*: mensagem no WhatsApp → identifica telefone → cria lead ou vincula a cliente existente → atribui vendedor → dispara SLA de 5 min.
2. *Qualificação*: vendedor registra destino, datas, nº de passageiros, orçamento → gera cotação.
3. *Conversão*: proposta aceita → cria reserva → lead vira `GANHO` e cliente é criado/atualizado.
4. *Perda*: motivo obrigatório → entra em cadência de reativação (30/90 dias).

**Campos.** Nome · telefone (E.164) · e-mail · idioma preferido · origem/UTM · campanha · roteiro de interesse · datas pretendidas · nº de passageiros · orçamento estimado · etapa · vendedor · score · próxima ação (data/hora) · motivo de perda · observações · consentimento LGPD.

**Botões.** Novo lead · Abrir WhatsApp · Ligar · Registrar atividade · Criar cotação · Converter em cliente · Marcar ganho/perdido · Transferir vendedor · Agendar follow-up.

**Filtros.** Etapa, vendedor, origem, período, roteiro, score, com/sem follow-up atrasado, idioma.

**Relatórios.** Funil por etapa e por vendedor · Taxa de conversão · Tempo médio de resposta · Motivos de perda · ROI por canal · Previsão de vendas (pipeline ponderado).

**Permissões.** `lead:*` escopo `own` para vendedor, `team` para gerente. Transferência exige `lead:assign`.

**Automações.** SLA de primeira resposta com escalonamento; follow-up automático em D+1, D+3, D+7; mensagem de aniversário; recuperação de carrinho abandonado; alerta de lead parado há 5 dias.

**Integrações.** WhatsApp Cloud API, Instagram/Messenger, formulário do site, Google Ads/Meta Ads, telefonia VoIP, OpenAI/Claude (resumo da conversa e sugestão de resposta).
## 4.3 Clientes

**Objetivo.** Cadastro único e confiável de quem viaja e de quem paga, com histórico completo e conformidade LGPD/GDPR.

**Funcionalidades.** PF e PJ; múltiplos contatos e endereços; documentos com validade (RG, CPF, passaporte, visto); preferências (assento, alimentação, acessibilidade, idioma); histórico de viagens e financeiro; carteira de créditos; mesclagem de duplicados; anonimização sob solicitação; segmentação por tags.

**Fluxos.** Cadastro manual, conversão de lead ou autocadastro no portal → validação de documento e telefone → deduplicação (telefone/e-mail/documento) → enriquecimento (CEP → endereço) → uso em reservas.

**Campos.** Tipo (PF/PJ) · nome/razão social · nome social · documento (CPF/CNPJ/passaporte + país emissor + validade) · data de nascimento · gênero (opcional, autodeclarado) · telefone · e-mail · idioma · endereço completo · contato de emergência · restrições alimentares · necessidades de acessibilidade · consentimentos (marketing, imagem, dados) · tags · vendedor responsável · observações.

**Botões.** Novo · Editar · Mesclar duplicados · Nova reserva · Ver histórico · Enviar WhatsApp · Exportar dados (LGPD) · Anonimizar · Adicionar documento.

**Filtros.** Nome/documento/telefone, cidade, tag, vendedor, com saldo em aberto, aniversariantes do mês, sem compra há N meses, idioma.

**Relatórios.** Curva ABC de clientes · Recompra e recência (RFM) · Aniversariantes · Clientes inadimplentes · LTV · Origem de aquisição.

**Permissões.** `customer:read` por escopo; `customer:export` e `customer:anonymize` restritos a Owner/DPO. Documentos e data de nascimento mascarados para perfis operacionais.

**Automações.** Aniversário com cupom; alerta de documento vencendo antes da viagem; pós-viagem com pesquisa NPS; reativação de inativos.

**Integrações.** ViaCEP/Google Places, Receita Federal (validação CNPJ), Serpro/CPF (opcional), WhatsApp, Google Contacts.

## 4.4 Produtos: Roteiros, Pacotes, Excursões, Passeios, Transfers e Fretamento

**Objetivo.** Modelar o que a empresa vende de forma que preço, custo e disponibilidade sejam calculáveis automaticamente.

**Modelo conceitual.** `Produto` (o que se vende) → `Componentes` (transporte, hospedagem, ingresso, alimentação, guia, seguro) → `Partida` (instância com data) → `Inventário` (assentos/quartos) → `Tabela de preço` (por temporada, faixa etária, canal, moeda).

**Funcionalidades.** Tipos: excursão bate-volta, pacote com hospedagem, transfer, fretamento, city tour, passeio avulso, cruzeiro/aéreo (F3). Itinerário dia a dia com horários e atrativos; galeria de fotos; textos em PT e EN; políticas de cancelamento e alteração por produto; regras de idade e documentação exigida; produto composto (pacote que embute passeios); *upsell* e adicionais (assento premium, quarto individual, seguro ampliado); versionamento (alterar preço não afeta reservas já feitas).

**Fluxos.**
1. *Criação*: dados básicos → componentes e custos previstos → itinerário → preços por temporada e faixa etária → políticas → publicar (fica visível para venda e portais).
2. *Precificação*: custo total previsto ÷ assentos-alvo × (1 + markup) → sugere preço; sistema mostra **ponto de equilíbrio** (quantos assentos pagam a viagem).
3. *Manutenção*: nova temporada duplica o produto com reajuste percentual.

**Campos.** Código · nome (PT/EN) · tipo · destino(s) · origem · duração (dias/horas) · distância · descrição curta e longa (PT/EN) · o que inclui / não inclui · itinerário · imagens · idade mínima/máxima · documentos exigidos · política de cancelamento · antecedência mínima de reserva · ocupação mínima para operar · componentes com fornecedor e custo · preço base por faixa etária · comissão padrão · status (rascunho/ativo/inativo) · tags e sazonalidade.

**Botões.** Novo · Duplicar · Publicar/Despublicar · Simular preço · Criar partida · Gerar link de venda · Visualizar como cliente · Exportar catálogo.

**Filtros.** Tipo, destino, status, faixa de preço, duração, temporada, com saídas futuras.

**Relatórios.** Ranking por receita, margem e ocupação · Elasticidade de preço · Sazonalidade · Produtos sem saída programada · Comparativo previsto × realizado de custo.

**Permissões.** `product:*` para Gerente Comercial e Owner; vendedor apenas leitura. Custo e margem visíveis somente com `product:read_cost`.

**Automações.** Sugerir nova partida quando as próximas atingirem 80% de ocupação; alertar produto sem saída futura; reajuste programado por temporada.

**Integrações.** Google Maps (distância, mapa, Street View), Google Drive (mídia), Booking/Expedia (F3, comparação de tarifa hoteleira), IA (geração de descrição bilíngue).

## 4.5 Disponibilidade e Inventário

**Objetivo.** Nunca vender o mesmo assento duas vezes; nunca deixar assento livre por falha de controle.

**Funcionalidades.** Inventário por partida (assentos do veículo, quartos por tipo, ingressos contratados); reserva temporária com TTL (15 min no checkout, configurável); *overbooking* controlado com percentual permitido por produto; bloqueio manual (assento do guia, assento quebrado); lista de espera com promoção automática; realocação em massa ao trocar de veículo.

**Fluxos.** Cliente escolhe assento → `HOLD` transacional no Redis + banco (TTL) → pagamento confirmado → `ALLOCATED` → cancelamento libera e promove o primeiro da lista de espera, notificando por WhatsApp com prazo de 2 h.

**Campos.** Partida · tipo de recurso (assento/quarto/ingresso) · identificador (12A, apto duplo) · status (livre/bloqueado/reservado/ocupado) · reserva vinculada · motivo do bloqueio · expiração do hold.

**Botões.** Bloquear/desbloquear · Realocar · Trocar veículo · Ver mapa · Adicionar à lista de espera · Promover da lista.

**Filtros.** Status, partida, tipo de recurso, com/sem passageiro.

**Relatórios.** Ocupação por saída e por roteiro · Assentos bloqueados e motivo · Conversão da lista de espera · Curva de venda (dias antes da saída).

**Permissões.** `inventory:manage` para Operações e Comercial; `inventory:override` (overbooking, desbloqueio) restrito a gestor.

**Automações.** Liberar holds vencidos; promover lista de espera; alertar quando restarem 5 assentos; sugerir veículo maior quando a demanda superar a capacidade.

**Integrações.** Redis (lock distribuído); channel manager de hotel (F3).

## 4.6 Reservas

**Objetivo.** Núcleo transacional do sistema — onde cliente, produto, passageiros, preço e pagamento se encontram.

**Funcionalidades.** Multi-passageiro com dados individuais; multi-item (transporte + passeio + seguro na mesma reserva); preço por faixa etária; descontos com política de alçada (acima de X% exige aprovação); cupons; parcelamento com datas; múltiplas formas de pagamento na mesma reserva; alteração de titular; remarcação com regra de multa; cancelamento com cálculo automático de reembolso; crédito em carteira; observações operacionais (cadeirante, aniversariante, alérgico); anexos; histórico completo de alterações; voucher e contrato gerados automaticamente.

**Fluxos.**
1. *Venda*: escolher partida → verificar disponibilidade → cadastrar/selecionar cliente → adicionar passageiros e assentos → aplicar preço e desconto → definir pagamento → confirmar (`PENDING_PAYMENT`) → pagamento aprovado (`CONFIRMED`) → dispara voucher.
2. *Cancelamento*: solicita → sistema calcula multa pela política e dias de antecedência → aprova → gera reembolso ou crédito → libera assentos → notifica.
3. *Remarcação*: seleciona nova partida → calcula diferença de tarifa + taxa → cobra ou gera crédito → transfere passageiros.
4. *No-show*: check-in não realizado até o horário → status `NO_SHOW` → regra financeira aplicada.

**Campos.** Código (BT-AAAA-NNNN) · cliente/titular · partida · canal de venda · vendedor · lista de passageiros (nome completo, documento, nascimento, tipo, assento, necessidades especiais, contato de emergência) · itens adicionais · subtotal, desconto, taxas, total · parcelas · status da reserva · status de pagamento · política aplicada · origem (lead/campanha) · observações internas e do cliente · anexos · datas (criação, confirmação, cancelamento).

**Botões.** Nova reserva · Adicionar passageiro · Escolher assentos · Aplicar cupom · Registrar pagamento · Enviar link de pagamento · Gerar voucher · Enviar por WhatsApp/e-mail · Remarcar · Cancelar · Duplicar · Imprimir contrato · Ver histórico.

**Filtros.** Código, cliente, passageiro, partida, roteiro, período de venda ou de viagem, status, status de pagamento, canal, vendedor, com saldo, com pendência documental.

**Relatórios.** Vendas por período/canal/vendedor · Ticket médio · Reservas com saldo em aberto · Cancelamentos e motivos · Antecedência média de compra · Passageiros por partida · Curva de venda.

**Permissões.** `booking:create/read/update` conforme escopo; `booking:cancel` e `booking:discount_above_limit` exigem alçada; `booking:refund` restrito ao Financeiro.

**Automações.** Confirmação por WhatsApp/e-mail; lembrete D-7, D-2 e D-1 com ponto e horário de embarque; cobrança de saldo D-10 e D-3; voucher automático ao quitar; pesquisa NPS em D+1; expiração de reserva não paga.

**Integrações.** PSP (PIX/cartão/link), WhatsApp, e-mail transacional, seguradora, Google Calendar (evento na agenda do cliente), assinatura eletrônica.

## 4.7 Check-in e Embarque

**Objetivo.** Embarcar rápido, sem papel, mesmo sem internet, sabendo exatamente quem subiu no veículo.

**Funcionalidades.** QR Code no voucher lido pelo app do guia; busca por nome/documento como alternativa; marcação de presença, atraso e no-show; contagem em tempo real (embarcados/total); bloqueio configurável para saldo em aberto (com liberação por gestor e registro do motivo); embarque por ponto de parada; assinatura do responsável para menores; lista de contatos de emergência sempre acessível offline; encerramento do embarque congela o manifesto.

**Fluxos.** App baixa o pacote da partida 24 h antes → guia abre a partida → lê QR ou busca → sistema valida (reserva ativa? pagamento ok? partida correta?) → registra check-in local com timestamp e GPS → sincroniza quando houver rede → ao fechar, gera relatório de embarque e notifica a base.

**Campos.** Partida · passageiro · reserva · assento · ponto de embarque · horário previsto e realizado · status (aguardando/embarcado/atrasado/no-show) · responsável pelo check-in · geolocalização · observação.

**Botões.** Ler QR · Buscar passageiro · Marcar embarcado · Marcar no-show · Liberar com pendência · Encerrar embarque · Ver contatos de emergência · Sincronizar agora.

**Filtros.** Status, ponto de embarque, com pendência financeira, com necessidade especial.

**Relatórios.** Relatório de embarque · Taxa de no-show por roteiro e por período · Pontualidade dos pontos de embarque.

**Permissões.** `checkin:*` para guia/motorista da partida; `checkin:override` para gestor.

**Automações.** Push ao passageiro 2 h antes com ponto e horário; alerta à base se, faltando 15 min, houver menos de 80% embarcado; aviso automático de no-show ao vendedor.

**Integrações.** Câmera do dispositivo (QR), GPS, push notification, WhatsApp.

## 4.8 Partidas e Operação

**Objetivo.** Transformar produto vendido em viagem executada, com recurso alocado, custo controlado e equipe informada.

**Funcionalidades.** Criação avulsa ou em série (recorrência: todo sábado, 1º domingo do mês); alocação de veículo, motorista e guia com **detecção de conflito de agenda** e de jornada legal; custos previstos × realizados; ponto de equilíbrio e ocupação em tempo real; checklists pré e pós-viagem; ocorrências; despesas de viagem com comprovante; status operacional (planejada → confirmada → em viagem → concluída → fechada); cancelamento com cascata para reservas; troca de veículo com realocação de assentos; briefing operacional em PDF.

**Fluxos.**
1. *Planejamento*: escolher produto e data → definir capacidade e ponto de embarque → cotar/alocar fornecedor → publicar para venda.
2. *Confirmação*: ao atingir ocupação mínima (ou em D-X) → confirmar → emitir OS ao fornecedor → escalar equipe → notificar passageiros.
3. *Execução*: checklist do veículo → embarque → viagem (rastreio, ocorrências, despesas) → retorno → checklist final.
4. *Fechamento*: lançar custos realizados → conciliar despesas do guia → calcular resultado → status `FECHADA` (bloqueia edição).

**Campos.** Produto · data/hora de ida e volta · pontos e horários de embarque · veículo · fornecedor de transporte · motorista(s) · guia(s) · capacidade · ocupação mínima para operar · custos previstos (veículo, pedágio, combustível, hospedagem, alimentação, ingressos, guia, extras) · custos realizados · status · observações · anexos (contrato, autorização ANTT).

**Botões.** Nova partida · Criar série · Confirmar · Cancelar · Trocar veículo · Escalar equipe · Gerar manifesto · Gerar OS do fornecedor · Lançar custo · Fechar partida · Duplicar · Imprimir briefing.

**Filtros.** Período, produto, status, veículo, fornecedor, guia/motorista, ocupação (faixa), com prejuízo previsto, filial.

**Relatórios.** Rentabilidade por partida · Previsto × realizado de custo · Ocupação · Ranking de fornecedores por custo e pontualidade · Escala da equipe · Quilometragem.

**Permissões.** `departure:*` para Operações; `departure:cost` para Financeiro e Owner; guia vê apenas as suas.

**Automações.** Alerta de ocupação abaixo do mínimo em D-10 (sugere cancelar ou trocar por veículo menor); lembrete de checklist; aviso de documento do veículo/motorista vencendo; encerramento automático 7 dias após o retorno se não houver pendência.

**Integrações.** Google Maps/Waze (rota e ETA), rastreador veicular, ANTT (autorização de viagem), WhatsApp (grupo da viagem), Google Calendar.
## 4.9 Frota, Motoristas e Guias

**Objetivo.** Garantir que exista veículo legal e equipe habilitada para cada saída vendida.

**Funcionalidades.** Cadastro de veículos próprios e de terceiros; **layout de assentos configurável** (editor visual: 46 lugares 2+2, van 15, leito 42) que alimenta o mapa de assentos; documentação com validade (CRLV, seguro, vistoria, ANTT) e bloqueio de alocação com documento vencido; manutenção preventiva por km/data; abastecimentos e custo por km; cadastro de motoristas (CNH, categoria, EAR, exame toxicológico, validade) e guias (Cadastur, idiomas, especialidades, avaliação média); disponibilidade e conflito de escala; controle de jornada (Lei 13.103) com alerta de intervalo obrigatório; custo/diária por profissional.

**Fluxos.** Cadastro → upload de documentos → sistema calcula alertas de vencimento → alocação em partida valida documentos, disponibilidade e jornada → após a viagem, registra km, abastecimento, avaliação e despesas.

**Campos (veículo).** Placa · renavam · tipo (ônibus/micro/van/carro) · marca/modelo/ano · capacidade · layout de assentos · próprio/terceiro · fornecedor · documentos com validade · km atual · plano de manutenção · custo/km · status (ativo/manutenção/inativo).
**Campos (pessoa).** Nome · CPF · telefone · e-mail · função · CNH (número, categoria, validade, EAR) · Cadastur · idiomas · especialidades · diária/comissão · disponibilidade · avaliação · documentos · status.

**Botões.** Novo · Editar layout de assentos · Anexar documento · Registrar manutenção · Registrar abastecimento · Ver escala · Bloquear/desbloquear · Avaliar.

**Filtros.** Tipo, capacidade, status, documento vencendo em N dias, disponível em data, idioma (guia), filial.

**Relatórios.** Escala consolidada · Documentos a vencer · Custo por km e por viagem · Manutenções · Utilização da frota (%) · Avaliação de guias e motoristas.

**Permissões.** `fleet:*` e `staff:*` para Operações; documentos pessoais visíveis apenas a RH/Operações (dado sensível LGPD).

**Automações.** Alerta 30/15/7 dias antes de cada vencimento; bloqueio automático de alocação com documento vencido; lembrete de manutenção por km; convite de escala por WhatsApp com aceite/recusa.

**Integrações.** Detran/CNH (consulta), rastreamento veicular, Google Maps, WhatsApp.

## 4.10 Fornecedores, Compras e Parceiros

**Objetivo.** Comprar melhor, com histórico, comparação e contrato — não por memória de WhatsApp.

**Funcionalidades.** Cadastro por categoria (ônibus, van, hotel, receptivo, guia, restaurante, parque, seguradora); múltiplos contatos; tabela de preços negociada; contratos com vigência; **RFQ** (cotação simultânea para N fornecedores com comparativo lado a lado); ordem de serviço; avaliação pós-viagem (pontualidade, conservação, atendimento) com nota que ordena futuras cotações; documentos (contrato social, seguro RC, alvará) com validade; conta a pagar gerada da OS; portal do fornecedor; rede de parceiros/sub-agências com markup e comissão.

**Fluxos.** Necessidade da partida → RFQ → respostas → comparativo (preço, nota, prazo) → escolha e justificativa → OS/contrato → execução → avaliação → fatura → conciliação → pagamento.

**Campos.** Razão social/nome · CNPJ/CPF · categoria · contatos · telefones · e-mail · endereço (com geolocalização) · área de atuação · frota/serviços oferecidos · tabela de preços · condições de pagamento · dados bancários/chave PIX · contrato e vigência · documentos · nota média · status.

**Botões.** Novo · Solicitar cotação · Comparar propostas · Emitir OS · Registrar fatura · Avaliar · Anexar contrato · Ver histórico · Abrir no mapa · WhatsApp.

**Filtros.** Categoria, cidade/região, nota, com contrato vigente, com documento vencido, faixa de preço.

**Relatórios.** Gasto por fornecedor e categoria · Comparativo de preço histórico · Ranking por nota · Economia obtida em RFQ · Contratos a vencer.

**Permissões.** `supplier:read` amplo; `supplier:price` e `supplier:payment` restritos a Compras/Financeiro.

**Automações.** RFQ automática ao criar partida sem transporte definido; cobrança de resposta em 24 h; solicitação de avaliação após o retorno; alerta de contrato a vencer.

**Integrações.** WhatsApp/e-mail (envio de RFQ e OS), Receita Federal (CNPJ), assinatura eletrônica, ERP contábil.

## 4.11 Financeiro

**Objetivo.** Saber exatamente quanto entra, quanto sai, quando, de quem — e qual viagem deu lucro.

### 4.11.1 Contas a Receber
Parcelas geradas na reserva; baixa automática por webhook do PSP ou manual; baixa parcial; juros/multa por atraso configuráveis; **régua de cobrança** (D-5 lembrete, D0 vencimento, D+1/D+3/D+7 cobrança com escalonamento de tom e canal); negociação e parcelamento de dívida; protesto/negativação (F3); crédito em carteira; estorno e reembolso com aprovação.

### 4.11.2 Contas a Pagar
Lançamento manual, por OS de fornecedor ou por rateio de custo da partida; aprovação por alçada; agendamento de pagamento; pagamento em lote; comprovante anexado; recorrência (aluguel, folha, seguro); rateio por centro de custo e por partida.

### 4.11.3 Pagamentos e PSP
PIX (QR estático/dinâmico, com conciliação por txid), cartão de crédito e débito (tokenizado, sem tocar PAN — escopo PCI SAQ-A), link de pagamento, boleto, dinheiro, transferência, **split** para parceiros, parcelamento com/sem juros, antecipação de recebíveis, estorno total/parcial, tentativa automática de recobrança, *3-D Secure* e antifraude.

### 4.11.4 Caixa, Bancos e Conciliação
Contas bancárias e caixas físicos; transferências internas; importação OFX e Open Finance; conciliação automática por valor+data+identificador com sugestão de correspondência; fechamento de caixa por operador e turno.

### 4.11.5 Comissões
Regra por vendedor, guia, parceiro e canal (percentual, fixo, escalonado por meta, sobre receita ou sobre margem); apuração no evento configurado (venda, quitação ou retorno da viagem); estorno proporcional em cancelamento; relatório de fechamento e pagamento em lote.

### 4.11.6 DRE, Centro de Custo e Multimoeda
Plano de contas configurável; centros de custo (filial, roteiro, partida, veículo); **DRE por partida** (receita de passagens + extras − custos diretos − comissões = margem de contribuição) e consolidado com rateio de despesas fixas; regime de caixa e de competência; fluxo de caixa projetado 90 dias; multimoeda com cotação diária e ganho/perda cambial; fiscal (NF-e de serviço, ISS, retenções) na F3.

**Campos (lançamento).** Data de competência · data de vencimento · data de pagamento · tipo (receita/despesa) · categoria/conta contábil · centro de custo · partida/reserva vinculada · cliente/fornecedor · descrição · valor · moeda · forma de pagamento · conta bancária · status (previsto/vencido/pago/cancelado) · anexos · usuário responsável.

**Botões.** Novo lançamento · Baixar · Baixa em lote · Estornar · Conciliar · Importar OFX · Gerar link de cobrança · Enviar cobrança · Aprovar · Agendar · Exportar (CSV/Excel/contábil).

**Filtros.** Período (competência ou caixa), tipo, status, categoria, centro de custo, conta bancária, cliente/fornecedor, faixa de valor, atrasados, forma de pagamento.

**Relatórios.** DRE gerencial · Fluxo de caixa realizado e projetado · Inadimplência e aging (30/60/90) · Receita por roteiro/canal/vendedor · Margem por partida · Comissões a pagar · Conciliação bancária · Livro caixa · Relatório contábil (exportação para o contador).

**Permissões.** `finance:*` para Financeiro e Owner; aprovação por alçada de valor; `finance:export` auditado. Segregação de funções: quem cadastra o pagamento não é quem aprova.

**Automações.** Régua de cobrança; baixa automática por webhook; alerta de saldo projetado negativo; fechamento mensal com checklist; cálculo e provisionamento de comissão.

**Integrações.** Mercado Pago, Stripe, PayPal, PagSeguro, Asaas, PIX (banco ou PSP), Open Finance, Omie/Conta Azul/Bling (contábil), NF-e (Focus/eNotas), câmbio (exchangerate API).

## 4.12 Documentos, Seguros, Passaportes e Vistos

**Objetivo.** Ninguém pode ser barrado no embarque — nem a empresa autuada — por documento faltando ou vencido.

**Funcionalidades.** Repositório por entidade (cliente, passageiro, veículo, motorista, guia, fornecedor, partida); OCR para extrair número e validade automaticamente; checklist de documentos exigidos por destino (RG para nacional; passaporte com 6 meses de validade e visto para internacional; autorização judicial para menor desacompanhado; certificado de vacinação); alertas de vencimento; **geração de documentos** (voucher com QR, manifesto de passageiros, contrato de prestação de serviço, autorização de viagem de menor, etiquetas de bagagem, crachás, lista de rooming, relatório de embarque) em PT e EN; assinatura eletrônica com validade jurídica; seguro-viagem emitido por passageiro com apólice anexada.

**Fluxos.** Reserva internacional criada → sistema monta checklist por destino e por passageiro → portal do cliente solicita upload → OCR valida → pendências aparecem no painel de embarque → tudo ok libera o voucher final.

**Campos.** Tipo de documento · entidade vinculada · número · emissor · país · data de emissão · validade · arquivo · status (pendente/enviado/aprovado/rejeitado/vencido) · verificado por · observação.

**Botões.** Enviar documento · Aprovar/Rejeitar · Solicitar ao cliente · Gerar voucher/manifesto/contrato · Assinar eletronicamente · Emitir seguro · Baixar tudo (ZIP).

**Filtros.** Tipo, status, validade, partida, passageiro, pendentes.

**Relatórios.** Pendências documentais por partida · Documentos a vencer · Apólices emitidas · Auditoria de acesso a documentos.

**Permissões.** `document:read` restrito por escopo; download de documento pessoal é auditado individualmente (LGPD).

**Automações.** Solicitação automática ao criar reserva; lembretes em D-30/D-15/D-7; bloqueio de emissão de voucher com pendência crítica; alerta ao guia sobre passageiro com documento irregular.

**Integrações.** OCR (AWS Textract/Google Vision), seguradoras (Assist Card, Travel Ace, Coris), DocuSign/Clicksign/ZapSign, S3, Google Drive/Dropbox/OneDrive.

## 4.13 Marketing, WhatsApp e Comunicação

**Objetivo.** Vender mais para quem já é cliente e responder rápido para quem ainda não é.

**Funcionalidades.** **Caixa de entrada única de WhatsApp** (múltiplos atendentes, atribuição, notas internas, templates aprovados, respostas rápidas, chatbot de triagem e horário de atendimento); campanhas segmentadas (por roteiro comprado, cidade, RFM, aniversário) com disparo respeitando opt-out; e-mail marketing com templates bilíngues; SMS; notificações push; UTM e atribuição de receita por campanha; landing pages de saída específica; chat interno por partida/reserva; central de atendimento com tickets e SLA; base de conhecimento.

**Fluxos.** Segmento → mensagem (com variáveis e idioma do contato) → aprovação → agendamento → disparo em lotes com limite de taxa → métricas (entregue, lido, respondido, convertido) → leads gerados entram no CRM com origem preenchida.

**Campos.** Campanha: nome, objetivo, segmento, canal, template, agendamento, orçamento, UTM, status. Mensagem: contato, canal, direção, conteúdo, anexos, status de entrega, atendente, tempo de resposta.

**Botões.** Nova campanha · Testar envio · Agendar · Pausar · Duplicar · Criar segmento · Responder · Transferir atendimento · Encerrar conversa · Criar template.

**Filtros.** Canal, período, campanha, segmento, status de entrega, atendente, conversas não respondidas.

**Relatórios.** Desempenho por campanha (entrega, leitura, conversão, receita, ROI) · Tempo médio de resposta · Volume por atendente e por horário · Opt-outs · Receita por canal.

**Permissões.** `campaign:*` para Marketing; disparo em massa exige aprovação de gestor; `inbox:read` restrito à conversa atribuída, salvo supervisão.

**Automações.** Boas-vindas; carrinho abandonado; aniversário; pós-viagem; reativação de inativos; resposta automática fora do horário; escalonamento por SLA.

**Integrações.** WhatsApp Cloud API (Meta), Telegram, Instagram Direct, SendGrid/Resend/Amazon SES, Twilio (SMS), Firebase (push), Meta Ads, Google Ads, GA4, OpenAI/Claude/Gemini (redação, resumo, classificação de intenção).

## 4.14 Portais Externos

**Portal do Cliente.** Login por magic link ou senha; minhas viagens (futuras e passadas); detalhes com itinerário, ponto de embarque e mapa; pagar saldo (PIX/cartão); baixar voucher e contrato; enviar documentos; escolher assento; adicionar passageiro; solicitar alteração ou cancelamento (com política visível); avaliar a viagem; carteira de créditos e cupons; indicar amigos. Bilíngue, mobile-first, PWA instalável.

**Portal do Fornecedor.** Solicitações de cotação com prazo; responder com preço e disponibilidade; ordens de serviço aceitas; agenda de serviços contratados; envio de fatura com anexo; acompanhamento de pagamentos; atualização de dados e documentos; avaliação recebida.

**Portal do Guia / Motorista.** Escala do mês; aceitar/recusar convite; detalhes da partida e do grupo; lista de passageiros e contatos de emergência; check-in; ocorrências; prestação de contas de despesas com foto do comprovante; histórico de diárias e comissões; documentos pessoais e validade.

**Loja Online B2C (F3).** Vitrine com filtro por destino e data; disponibilidade em tempo real; carrinho e checkout com PIX/cartão; cupom; conta do cliente; SEO e sitemap; pixel de conversão; multi-idioma e multimoeda.

**Permissões e segurança dos portais.** Sessão isolada do back-office, escopo `own` estrito, rate limit agressivo, MFA opcional, nenhum dado de custo/margem exposto, logs de acesso completos.

## 4.15 Aplicativo Mobile, PWA e Sistema Offline

**Objetivo.** Levar a operação para dentro do ônibus, do hotel e do parque — com ou sem sinal.

**Funcionalidades.** Instalação como PWA (iOS/Android/desktop) e build nativa via Capacitor para push, câmera e biometria; download automático do pacote da partida em D-1; check-in por QR offline; ocorrências com foto e GPS; despesas com foto do comprovante; lista de passageiros e contatos de emergência offline; checklists; mensagens ao grupo; indicador de sincronização com contador de pendências; login biométrico; modo de baixo consumo de dados.

**Fluxos offline.** Ação do usuário → grava em IndexedDB + fila com `Idempotency-Key` → UI otimista → *background sync* ao recuperar rede → servidor aplica e devolve estado canônico → conflito vai para revisão manual (raro por desenho: eventos de campo são *append-only*).

**Relatórios (no app).** Resumo da partida (embarcados, pendências, despesas), fechamento do guia.

**Permissões.** Perfis de campo veem apenas as partidas atribuídas, sem valores de venda de terceiros nem margem.

**Integrações.** Câmera/QR, GPS, push (FCM/APNs), biometria, Google Maps/Waze, WhatsApp.
## 4.16 Administração: Usuários, Permissões, Configurações, Auditoria e Integrações

**Usuários.** Convite por e-mail com expiração; perfil e foto; papéis múltiplos; escopo por filial/equipe; 2FA obrigatório por papel; sessões ativas com revogação; bloqueio por tentativas; desativação preservando o histórico (nunca exclusão física); *impersonation* auditada.

**Papéis e Permissões.** Editor visual (matriz papel × recurso × ação × escopo); papéis prontos (Owner, Gerente, Vendedor, Operações, Financeiro, Guia, Motorista, Leitura); papéis customizados; alçadas (desconto máximo, valor máximo de pagamento, limite de estorno); campos sensíveis mascarados por permissão; simulador "ver como este papel".

**Configurações da Empresa.** Dados cadastrais e fiscais; logo, cores e domínio próprio (white-label); filiais; fuso, idioma, moeda e formatos padrão; numeração de documentos; políticas de cancelamento padrão; templates de mensagem e documento; horário de atendimento; feriados; parâmetros operacionais (TTL de reserva, ocupação mínima, antecedência de lembretes).

**Auditoria e Logs.** Registro imutável (append-only, hash encadeado) de toda operação de escrita: quem, quando, de onde (IP/dispositivo), o quê (entidade e id), antes → depois (diff em JSON), motivo quando aplicável. Log de acesso a dado pessoal e financeiro. Log de login, falha de login, troca de senha, exportação e impersonation. Retenção mínima de 5 anos, exportável, com filtro por entidade, usuário, período e tipo de ação. Alerta automático de comportamento anômalo (exportação em massa, acesso fora do horário, muitos cancelamentos).

**Integrações.** Catálogo de conectores com status, chaves em cofre, teste de conexão, ambiente sandbox, logs de chamada, reprocessamento de webhook falhado, quotas e alerta de erro.

**Importação/Exportação.** Assistente de importação de planilha (mapeamento de colunas, validação linha a linha, pré-visualização, importação parcial com relatório de erros) para clientes, roteiros, fornecedores, reservas históricas e financeiro. Exportação completa do tenant (JSON/CSV) — portabilidade LGPD e ausência de aprisionamento.

**Automações / Workflow (no-code).** Construtor "quando **gatilho** e **condição**, então **ação**". Gatilhos: criação/alteração de registro, mudança de status, data relativa (D-7 da partida), meta atingida, pagamento recebido, ocupação abaixo de X. Condições: qualquer campo, com operadores. Ações: enviar WhatsApp/e-mail/push, criar tarefa, atribuir responsável, mudar status, gerar documento, chamar webhook, lançar financeiro. Com histórico de execução, teste a seco e limite anti-loop.

**Agenda / Calendário.** Visões mês/semana/dia/timeline; camadas (partidas, retornos, manutenções, follow-ups, tarefas, aniversários, vencimentos); arrastar para reagendar (com validação); filtro por recurso (veículo, guia); exportação iCal e sincronização bidirecional com Google Calendar.

**Notificações.** Central única com preferência por evento e canal (in-app, e-mail, push, WhatsApp); agrupamento; "não perturbe"; níveis (informativo, alerta, crítico); histórico.

**Avaliações / NPS.** Pesquisa automática pós-viagem (nota geral + por serviço: transporte, guia, hotel, roteiro); NPS calculado por período, roteiro e fornecedor; comentários com moderação; publicação seletiva como depoimento; alerta imediato para nota ≤ 6 (detrator) com abertura de ticket.

---

# 5. SISTEMA BILÍNGUE E INTERNACIONALIZAÇÃO

## 5.1 Princípio

Bilíngue não é traduzir a interface — é o sistema inteiro operar em duas culturas ao mesmo tempo: **um passageiro americano recebe o voucher em inglês com data MM/DD/YYYY e valor em USD, enquanto o manifesto do mesmo ônibus sai em português para o motorista.** A decisão de idioma pertence ao destinatário, não ao servidor.

## 5.2 Camadas de idioma

| Camada | Fonte do idioma | Exemplo |
|---|---|---|
| **Interface** | Preferência do usuário (perfil) → `localStorage` → idioma do navegador → padrão do tenant | Menus, botões, mensagens |
| **Conteúdo cadastrado** | Campos traduzíveis por registro (JSONB) | Nome e descrição do roteiro, o que inclui |
| **Documentos** | Idioma do destinatário (cliente/fornecedor) | Voucher, contrato, fatura |
| **Comunicação** | Idioma do contato | WhatsApp, e-mail, push |
| **Dados do sistema** | Chave estável + rótulo traduzido | Status `CONFIRMED` → "Confirmada" / "Confirmed" |

Regra de ouro: **enum no banco é sempre em inglês e imutável**; a tradução vive na camada de apresentação. Nunca se persiste texto traduzido como identificador.

## 5.3 Arquitetura de tradução

```
/locales
  /pt-BR/{common,booking,finance,operations,errors,emails,documents}.json
  /en-US/{common,booking,finance,operations,errors,emails,documents}.json
  /es-ES/…            ← preparado, ativado por configuração
```

- **i18next + ICU MessageFormat**: plural, gênero, ordinal e interpolação corretos por idioma.
  `"seatsLeft": "{count, plural, =0{Esgotado} one{Resta # lugar} other{Restam # lugares}}"`
- **Namespaces com lazy-load** por módulo: o usuário só baixa o que a tela usa.
- **Chaves hierárquicas e semânticas**: `booking.action.cancel`, nunca `botao1`.
- **Fallback em cadeia**: `pt-BR → pt → en-US`; chave ausente aparece marcada em desenvolvimento e é reportada em produção.
- **Lint no CI**: quebra o build se houver literal de texto em componente, chave órfã ou chave faltando em algum idioma.
- **Painel de tradução** no admin: exportar/importar XLIFF ou CSV, tradutor externo edita sem tocar em código, publicação sem novo deploy (as traduções ficam em CDN versionada).

## 5.4 Troca instantânea

Seletor no topo e no perfil. Ao trocar: `i18n.changeLanguage()` re-renderiza a árvore React sem recarregar a página (< 100 ms, sem perder o formulário em edição), grava a preferência no perfil (sincroniza entre dispositivos) e no `localStorage`, atualiza `<html lang>` e `dir`, reformata datas, números e moedas via `Intl`, e passa a enviar `Accept-Language` nas próximas chamadas — o backend responde mensagens de erro e e-mails já no idioma escolhido.

## 5.5 Conteúdo multilíngue no banco

```sql
-- campo traduzível como JSONB
name  jsonb NOT NULL  -- {"pt-BR":"Ribeirão Preto → Olímpia","en-US":"Ribeirão Preto → Olímpia Water Park"}
CREATE INDEX idx_product_name_pt ON products USING gin ((name -> 'pt-BR') jsonb_path_ops);
```
Editor lado a lado (PT | EN) com indicador de tradução pendente e botão de tradução assistida por IA (DeepL/Claude) que gera um rascunho para revisão humana — nunca publica automaticamente.

## 5.6 Além do idioma (i18n completo)

| Dimensão | Tratamento |
|---|---|
| **Moeda** | Preço por moeda com cotação e arredondamento por regra local; exibição via `Intl.NumberFormat` |
| **Data e hora** | Armazenamento sempre em UTC (`timestamptz`); exibição no fuso do usuário; formato local (DD/MM vs MM/DD) |
| **Fuso** | Partida guarda o fuso do ponto de embarque — 06:00 em Ribeirão Preto continua 06:00 para quem consulta de Lisboa |
| **Telefone** | E.164 com máscara por país |
| **Endereço** | Formulário por país (CEP/ZIP, estado/província) |
| **Documento** | CPF (BR), SSN/Passport (US), NIF (PT) — validação por país |
| **Nome** | Suporte a nome único, sobrenomes múltiplos e nome social |
| **Imposto** | Regra fiscal por país/estado aplicada ao produto |
| **Unidades** | km/mi conforme locale |
| **Feriados** | Calendário por país/região influenciando alta temporada |
| **RTL** | CSS lógico (`margin-inline-start`) — pronto para árabe/hebraico sem refatoração |
| **Textos legais** | Contrato e política de privacidade versionados por idioma e jurisdição |

---

# 6. BANCO DE DADOS

## 6.1 Convenções

- PostgreSQL 16; nomes em `snake_case` plural; PK `id` do tipo **ULID** (ordenável no tempo, seguro para expor).
- Toda tabela de negócio: `tenant_id`, `created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at` (soft delete), `version` (lock otimista).
- Dinheiro: `amount_cents BIGINT` + `currency CHAR(3)`. Nunca `float`.
- Datas com fuso: `timestamptz`. Datas puras (data da viagem): `date`.
- Textos traduzíveis: `jsonb`. Enums: `text` + `CHECK` (evolui sem `ALTER TYPE` custoso).
- **RLS habilitada em todas as tabelas**: `USING (tenant_id = current_setting('app.tenant_id')::uuid)`.

## 6.2 Tabelas principais (resumo por domínio)

### Identidade e plataforma
| Tabela | Campos-chave | Relacionamentos |
|---|---|---|
| `tenants` | id, name, slug, plan, locale_default, currency_default, timezone, status, settings jsonb | 1:N com tudo |
| `branches` | id, tenant_id, name, address, timezone, is_default | N:1 tenant |
| `users` | id, tenant_id, email (uniq/tenant), name, phone, locale, avatar_url, mfa_enabled, mfa_secret_enc, last_login_at, status | N:N roles |
| `roles` | id, tenant_id, key, name jsonb, is_system | N:N permissions |
| `permissions` | id, resource, action, description | — |
| `role_permissions` | role_id, permission_id, scope | N:N |
| `user_roles` | user_id, role_id, branch_id | N:N |
| `sessions` | id, user_id, refresh_token_hash, device, ip, user_agent, expires_at, revoked_at | N:1 user |
| `audit_logs` | id, tenant_id, user_id, entity, entity_id, action, before jsonb, after jsonb, ip, ua, reason, hash_prev, hash, created_at | particionada por mês |

### Comercial
| Tabela | Campos-chave | Relacionamentos |
|---|---|---|
| `customers` | id, tenant_id, type(PF/PJ), name, social_name, doc_type, doc_number, birth_date, email, phone_e164, locale, address jsonb, preferences jsonb, consents jsonb, tags[], owner_user_id, status | 1:N bookings, documents |
| `leads` | id, tenant_id, name, phone, email, source, utm jsonb, product_id, travel_date, pax_count, budget_cents, stage, score, owner_user_id, next_action_at, lost_reason, customer_id | N:1 product/user |
| `activities` | id, tenant_id, entity, entity_id, type(call/msg/note/task), content, due_at, done_at, user_id | polimórfica |
| `quotes` | id, tenant_id, lead_id, customer_id, items jsonb, total_cents, currency, valid_until, status, accepted_at | N:1 lead |
| `commission_rules` / `commissions` | regra (base, percent, tiers) / apuração (booking_id, user_id, amount_cents, status) | N:1 booking/user |

### Produtos e inventário
| Tabela | Campos-chave | Relacionamentos |
|---|---|---|
| `products` | id, tenant_id, code, type, name jsonb, description jsonb, includes jsonb, origin, destinations[], duration_days, min_pax, max_pax, images[], policies jsonb, status | 1:N departures, price_lists |
| `product_components` | id, product_id, kind(transport/hotel/ticket/meal/guide/insurance), supplier_id, unit_cost_cents, qty_rule | N:1 product/supplier |
| `itineraries` | id, product_id, day_number, time, title jsonb, description jsonb, geo point | N:1 product |
| `price_lists` | id, product_id, season_start, season_end, channel, currency, adult_cents, child_cents, senior_cents, infant_cents, single_supplement_cents | N:1 product |
| `departures` | id, tenant_id, product_id, departure_date, departure_time, return_date, timezone, vehicle_id, supplier_id, capacity, min_occupancy, boarding_points jsonb, cost_planned_cents, cost_actual_cents, status | N:1 product; 1:N bookings |
| `inventory_items` | id, departure_id, kind(seat/room/ticket), label, status, booking_id, hold_expires_at, block_reason | N:1 departure |
| `waitlist` | id, departure_id, customer_id, pax_count, created_at, notified_at, expires_at | N:1 departure |

### Reservas
| Tabela | Campos-chave | Relacionamentos |
|---|---|---|
| `bookings` | id, tenant_id, code (uniq/tenant), customer_id, departure_id, channel, seller_user_id, subtotal_cents, discount_cents, fees_cents, total_cents, currency, status, payment_status, policy_snapshot jsonb, source_lead_id, notes, confirmed_at, cancelled_at | N:1 customer/departure |
| `booking_passengers` | id, booking_id, full_name, doc_type, doc_number, birth_date, pax_type, seat_label, special_needs, emergency_contact jsonb, price_cents | N:1 booking |
| `booking_items` | id, booking_id, kind, description jsonb, qty, unit_price_cents, supplier_id | N:1 booking |
| `check_ins` | id, departure_id, passenger_id, status, checked_at, checked_by, geo, device_id, synced_at | append-only |
| `booking_changes` | id, booking_id, type(reschedule/cancel/transfer), from jsonb, to jsonb, fee_cents, approved_by | N:1 booking |

### Operação e suprimentos
| Tabela | Campos-chave |
|---|---|
| `vehicles` | id, tenant_id, plate, type, brand_model, year, capacity, seat_layout jsonb, owner(own/third), supplier_id, odometer_km, status |
| `vehicle_documents` / `staff_documents` | entity_id, doc_type, number, issued_at, expires_at, file_key, status |
| `maintenances` | id, vehicle_id, type, due_km, due_date, done_at, cost_cents, notes |
| `staff` | id, tenant_id, user_id, name, role(driver/guide/seller), cpf, license jsonb, languages[], daily_rate_cents, rating_avg, status |
| `assignments` | id, departure_id, staff_id, role, status(invited/accepted/declined), fee_cents |
| `suppliers` | id, tenant_id, name, category, tax_id, contacts jsonb, address jsonb, geo, bank jsonb, rating_avg, contract jsonb, status |
| `rfqs` / `rfq_responses` | necessidade, prazo / supplier_id, price_cents, available, notes |
| `service_orders` | id, departure_id, supplier_id, description, amount_cents, status, signed_at |
| `incidents` | id, departure_id, severity, category, description, photos[], geo, reported_by, resolved_at |
| `checklists` / `checklist_items` | template e execução por partida/veículo |
| `travel_expenses` | id, departure_id, staff_id, category, amount_cents, receipt_key, status(pending/approved/reimbursed) |

### Financeiro
| Tabela | Campos-chave |
|---|---|
| `accounts` | id, tenant_id, name, type(bank/cash), bank_code, balance_cents |
| `chart_of_accounts` | id, tenant_id, code, name jsonb, kind(revenue/expense), parent_id |
| `cost_centers` | id, tenant_id, name, kind(branch/product/departure) |
| `receivables` | id, tenant_id, booking_id, customer_id, due_date, amount_cents, paid_cents, status, installment_no, interest_rule jsonb |
| `payables` | id, tenant_id, supplier_id, departure_id, service_order_id, due_date, amount_cents, status, approved_by, cost_center_id, account_id |
| `payments` | id, tenant_id, receivable_id/payable_id, method, psp, psp_transaction_id, amount_cents, currency, fx_rate, status, paid_at, receipt_key, idempotency_key (uniq) |
| `ledger_entries` | id, tenant_id, date, account_id, chart_account_id, cost_center_id, departure_id, debit_cents, credit_cents, description, ref |
| `bank_statements` / `reconciliations` | importação OFX e vínculo com `payments` |

### Comunicação, documentos e sistema
| Tabela | Campos-chave |
|---|---|
| `documents` | id, tenant_id, entity, entity_id, doc_type, number, expires_at, file_key, mime, size, ocr jsonb, status, verified_by |
| `messages` | id, tenant_id, channel, direction, contact_id, thread_id, body, template, media[], status, agent_user_id, sent_at, read_at |
| `campaigns` / `campaign_targets` | segmento, template, agendamento / contato, status, métricas |
| `notifications` | id, tenant_id, user_id, type, title jsonb, body jsonb, entity, read_at |
| `automations` / `automation_runs` | regra (trigger, conditions, actions jsonb) / execução (status, log) |
| `reviews` | id, booking_id, departure_id, nps, ratings jsonb, comment, published |
| `integrations` | id, tenant_id, provider, credentials_enc, config jsonb, status, last_sync_at |
| `webhook_events` | id, provider, event_type, payload jsonb, signature_ok, processed_at, retries |
| `sync_queue` | id, device_id, user_id, operation, entity, payload jsonb, idempotency_key, status, conflict jsonb |
| `translations` | id, tenant_id, namespace, key, locale, value, updated_by |

## 6.3 Relacionamentos centrais

```
tenants 1─N users, branches, customers, products, suppliers, vehicles, staff
products 1─N departures 1─N bookings 1─N booking_passengers
departures 1─N inventory_items ──1 bookings   (assento alocado)
departures 1─N assignments N─1 staff
departures 1─N payables ; bookings 1─N receivables 1─N payments
customers 1─N bookings ; customers 1─N documents
suppliers 1─N service_orders ; suppliers 1─N product_components
leads 1─1 customers (conversão) ; leads 1─N activities
bookings 1─N check_ins (via passengers)
```

## 6.4 Índices e performance

```sql
-- multi-tenant: tenant_id sempre primeiro
CREATE INDEX idx_bookings_tenant_status_date ON bookings (tenant_id, status, created_at DESC);
CREATE UNIQUE INDEX uq_bookings_code ON bookings (tenant_id, code);
CREATE INDEX idx_departures_tenant_date ON departures (tenant_id, departure_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_departures_product_date ON departures (product_id, departure_date DESC);
CREATE UNIQUE INDEX uq_inventory_seat ON inventory_items (departure_id, label);
CREATE INDEX idx_inventory_free ON inventory_items (departure_id) WHERE status = 'FREE';
CREATE INDEX idx_receivables_due ON receivables (tenant_id, status, due_date) WHERE status <> 'PAID';
CREATE INDEX idx_customers_search ON customers USING gin (to_tsvector('portuguese', name || ' ' || coalesce(doc_number,'') || ' ' || coalesce(email,'')));
CREATE INDEX idx_customers_phone ON customers (tenant_id, phone_e164);
CREATE INDEX idx_audit_entity ON audit_logs (tenant_id, entity, entity_id, created_at DESC);
CREATE UNIQUE INDEX uq_payments_idem ON payments (idempotency_key);
CREATE INDEX idx_suppliers_geo ON suppliers USING gist (geo);
```

**Regras de integridade críticas**
- `UNIQUE (departure_id, label)` em `inventory_items` + transação `SELECT … FOR UPDATE` na alocação → impossível vender o mesmo assento duas vezes.
- `CHECK (paid_cents <= amount_cents)` em `receivables`.
- `CHECK (total_cents = subtotal_cents - discount_cents + fees_cents)` em `bookings`.
- Trigger que impede alteração em partida com status `CLOSED`.
- Trigger de auditoria (`AFTER INSERT/UPDATE/DELETE`) gravando o diff em `audit_logs` com hash encadeado.
- Views materializadas para o dashboard (`mv_departure_pnl`, `mv_sales_daily`), atualizadas por evento e por cron.
---

# 7. DASHBOARD E BI

## 7.1 Princípios

Todo número é clicável e leva à lista que o originou. Todo número tem período, comparação e meta. Nenhum widget carrega mais de 400 ms (agregados pré-calculados em views materializadas e cache de 5 min). O painel é diferente por perfil — o dono não precisa ver a mesma tela do vendedor.

## 7.2 KPIs por categoria

**Comerciais**
| KPI | Fórmula | Meta de referência |
|---|---|---|
| Receita do período | Σ valor das reservas confirmadas (competência) | crescimento MoM |
| Ticket médio | receita ÷ nº de passageiros | ↑ |
| Reservas / passageiros | contagem | ↑ |
| Taxa de conversão | reservas ÷ leads | 20–35% |
| Tempo médio de 1ª resposta | média(primeira resposta − criação do lead) | < 5 min |
| Antecedência média de compra | média(data da viagem − data da venda) | referência de campanha |
| Receita por vendedor / canal | agrupamento | ranking |
| CAC | investimento em mídia ÷ novos clientes | ↓ |
| LTV | receita acumulada por cliente | ↑ |
| Recompra | % de clientes com ≥ 2 viagens | > 30% |

**Operacionais**
| KPI | Fórmula |
|---|---|
| Ocupação média | assentos vendidos ÷ assentos disponíveis |
| Ocupação das próximas 30 saídas | idem, janela futura |
| Saídas abaixo do ponto de equilíbrio | contagem com alerta |
| No-show | não embarcados ÷ confirmados |
| Pontualidade | % de partidas no horário |
| Utilização da frota | dias em operação ÷ dias disponíveis |
| Ocorrências por viagem | contagem por gravidade |
| Custo por assento | custo total ÷ capacidade |

**Financeiros**
| KPI | Fórmula |
|---|---|
| Margem de contribuição por partida | receita − custos diretos |
| Margem % | margem ÷ receita |
| Resultado do período | receitas − despesas |
| Inadimplência | vencido não pago ÷ total a receber |
| Aging de recebíveis | faixas 0–30 / 31–60 / 61–90 / 90+ |
| Fluxo de caixa projetado (90 dias) | saldo + a receber − a pagar |
| DSO | prazo médio de recebimento |
| Comissões provisionadas | Σ por regra |

**Qualidade**
NPS · nota média por serviço (transporte, guia, hotel, roteiro) · nota por fornecedor · % de detratores tratados em 24 h · reclamações abertas.

## 7.3 Gráficos e visualizações

| # | Visual | Tipo | Interação |
|---|---|---|---|
| 1 | Receita × Despesa (12 meses) | Barras agrupadas + linha de resultado | clique no mês → extrato |
| 2 | Evolução de vendas | Linha com comparação ano anterior | zoom por período |
| 3 | Funil de vendas | Funil por etapa com taxa de passagem | clique → lista de leads |
| 4 | Ocupação das próximas saídas | Barras horizontais com meta e cor por faixa | clique → partida |
| 5 | Curva de venda (dias antes da saída) | Linha acumulada, comparando roteiros | escolher roteiro |
| 6 | Mix de produtos | Rosca por tipo/roteiro | clique → filtra o painel |
| 7 | Origem dos leads | Barras + tabela de ROI | clique → campanha |
| 8 | Formas de pagamento | Barras empilhadas | — |
| 9 | Aging de recebíveis | Barras por faixa, cor semafórica | clique → cobranças |
| 10 | Fluxo de caixa projetado | Área com linha zero destacada | hover diário |
| 11 | Mapa de destinos | Mapa com bolhas proporcionais à receita | clique → destino |
| 12 | Heatmap de saídas | Calendário-heatmap (dia × ocupação) | clique → dia |
| 13 | Margem por partida | Scatter (ocupação × margem) | identifica outliers |
| 14 | Ranking de roteiros | Barras + variação vs. período anterior | clique → produto |
| 15 | NPS | Gauge + série temporal | clique → comentários |
| 16 | Metas por vendedor | Barras de progresso | clique → vendedor |

## 7.4 Cartões (widgets) e alertas

Cartões de KPI com: rótulo, valor, variação vs. período anterior (verde/vermelho), *sparkline* de 12 pontos, meta com barra de progresso e ação rápida. Estados de carregamento em *skeleton*, estado vazio explicativo e estado de erro com "tentar novamente".

**Central de alertas (regras de negócio)**
- Saída em ≤ 7 dias com ocupação < 50% → sugerir campanha ou cancelamento.
- Saída abaixo da ocupação mínima em D-10 → decisão obrigatória do gestor.
- Reserva com saldo em aberto e embarque em ≤ 3 dias.
- Documento de veículo, motorista ou passageiro vencendo.
- Lead sem contato há mais de 48 h.
- Meta mensal com ritmo insuficiente (projeção < 90%).
- Fluxo de caixa projetado negativo nos próximos 30 dias.
- Avaliação ≤ 6 sem tratativa em 24 h.
- Fornecedor com contrato ou documento vencido alocado em partida futura.

## 7.5 Relatórios (catálogo)

Comercial (vendas por período/canal/vendedor, funil, conversão, curva de venda, clientes ABC/RFM) · Operacional (ocupação, manifesto, escala, no-show, ocorrências, utilização da frota, km rodado) · Financeiro (DRE gerencial, DRE por partida, fluxo de caixa, aging, comissões, conciliação, livro caixa, exportação contábil) · Fornecedores (gasto, comparativo, ranking) · Qualidade (NPS, avaliações, reclamações) · Compliance (auditoria, acessos, exportações).

Todos com: filtros salvos, agendamento por e-mail (diário/semanal/mensal), exportação PDF/Excel/CSV, versão bilíngue e marca da empresa. **Construtor de relatórios** (F2) permite escolher entidade, colunas, filtros, agrupamento e gráfico, salvando como relatório próprio compartilhável por papel.

---

# 8. UX/UI E DESIGN SYSTEM

## 8.1 Identidade visual

**Personalidade:** confiável, ágil e brasileiro sem ser informal. O sistema é usado às 4h30 da manhã na rodoviária, na tela do celular, com pressa — legibilidade e alvos grandes vencem a sofisticação decorativa.

**Paleta (tokens semânticos, não cores literais)**

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--brand-primary` | `#0E9E7C` | `#5FE3BD` | Ação principal, marca |
| `--brand-secondary` | `#0B7F63` | `#7EF0D0` | Realce, gráficos |
| `--bg-canvas` | `#F2F7F5` | `#0B1410` | Fundo da página |
| `--bg-surface` | `#FFFFFF` | `#132720` | Cartões, tabelas |
| `--border` | `#D5E6E0` | `#1F4438` | Divisórias |
| `--text-primary` | `#0D2B22` | `#E6FFF6` | Texto |
| `--text-muted` | `#5C7C72` | `#8FB3A6` | Secundário |
| `--success` | `#1E9E6A` | `#3DDC97` | Confirmado, pago |
| `--warning` | `#B8860B` | `#FFC857` | Pendente, atenção |
| `--danger` | `#C0392B` | `#FF6B6B` | Cancelado, vencido |
| `--info` | `#2A7FA8` | `#5BC0EB` | Em viagem, informativo |

O verde-água da identidade vem do mapa mental original da Boyd. Cores nunca carregam significado sozinhas: status sempre combina **cor + ícone + rótulo** (daltonismo).

**Tipografia.** Inter (interface) e JetBrains Mono (códigos e valores). Escala 12/14/16/20/24/32/40 px. Corpo 14 px no desktop, 16 px no mobile (evita zoom automático no iOS). Números com `font-variant-numeric: tabular-nums` para alinhar colunas.

**Espaçamento e forma.** Grade de 4 px; raio 8/12/16 px; sombras sutis em 3 níveis; ícones Lucide 20/24 px, sempre acompanhados de rótulo em navegação.

## 8.2 Modo claro e escuro

Ambos são *first-class*, com contraste verificado (AA mínimo, AAA no texto de corpo). Seleção: automático (segue o SO), claro ou escuro, persistida no perfil e sincronizada entre dispositivos. Implementação por variáveis CSS trocadas no `:root[data-theme]` — sem *flash* na carga (script inline resolve o tema antes da primeira pintura). Gráficos, mapas e PDFs têm paletas próprias por tema. Modo escuro é o padrão para o app de campo (menos bateria em OLED e menos ofuscamento no ônibus de madrugada).

## 8.3 Responsividade

| Breakpoint | Largura | Layout |
|---|---|---|
| Mobile | < 640 px | Coluna única, navegação inferior, tabelas viram cartões, ações em bottom sheet |
| Tablet | 640–1024 px | Duas colunas, sidebar recolhida em ícones, formulários em 2 campos por linha |
| Desktop | 1024–1536 px | Sidebar fixa, tabelas completas, painel lateral de detalhe |
| Wide / TV | > 1536 px | Grade de até 4 colunas, modo telão para o dashboard |

Mobile-first no código. Alvos de toque ≥ 44 px. Gestos: puxar para atualizar, deslizar para ações rápidas na lista. Formulários longos viram *wizard* com progresso salvo. Impressão tem folha de estilo própria (A4, sem navegação, quebras controladas).

## 8.4 Padrões de interação

Busca global com `⌘K` / `Ctrl+K`; atalhos (`N` novo, `/` buscar, `Esc` fechar, `⌘S` salvar); *inline edit* em campos simples; salvamento automático de rascunho; desfazer em ações destrutivas (janela de 10 s) em vez de diálogos de confirmação em série; confirmação explícita apenas para operações irreversíveis com impacto financeiro; feedback otimista com reversão; estados vazios que ensinam ("nenhuma partida programada — criar a primeira"); mensagens de erro que dizem o que fazer, não o código do erro.

## 8.5 Acessibilidade (WCAG 2.2 AA)

Navegação completa por teclado com foco visível de 2 px; ordem de foco lógica; *skip links*; HTML semântico e ARIA apenas onde necessário; formulários com `<label>` associado, `aria-describedby` para ajuda e `aria-invalid` + texto no erro; regiões `aria-live` para toasts e atualizações assíncronas; contraste ≥ 4,5:1 (texto) e ≥ 3:1 (componentes); respeito a `prefers-reduced-motion`; suporte a zoom de 200% sem perda de função; imagens com `alt` significativo; gráficos com tabela de dados alternativa e resumo textual; leitores de tela testados (NVDA, VoiceOver); modo alto contraste; tamanho de fonte ajustável (100–150%) sem quebra de layout. Auditoria automatizada (axe-core no CI) e revisão manual a cada release.
---

# 9. SEGURANÇA, LGPD E COMPLIANCE

## 9.1 LGPD / GDPR

**Bases legais mapeadas por finalidade:** execução de contrato (dados do passageiro necessários à viagem), obrigação legal (documentos fiscais e de transporte), legítimo interesse (prevenção a fraude), consentimento (marketing, uso de imagem) — coletado de forma granular, com registro de data, IP, versão do texto e canal, e revogável em um clique.

**Direitos do titular implementados em produto:**
| Direito | Implementação |
|---|---|
| Acesso | Portal do cliente + exportação completa (JSON/PDF) em até 15 dias |
| Correção | Autoatendimento no portal, com auditoria |
| Eliminação | Anonimização irreversível preservando obrigações legais (nota fiscal fica, PII vira hash) |
| Portabilidade | Exportação estruturada e legível por máquina |
| Revogação | Opt-out em 1 clique em todo e-mail/WhatsApp, efeito imediato |
| Oposição | Bloqueio de uso para marketing mantendo o operacional |
| Informação sobre compartilhamento | Lista de terceiros (PSP, seguradora, hotel) por reserva |

**Governança:** registro de operações de tratamento (ROPA) mantido no sistema; DPO configurável com canal de contato; **retenção por política** (lead sem conversão: 24 meses; dados de viagem: 5 anos por obrigação fiscal; log de acesso: 6 meses; documento de identidade: até 90 dias após a viagem, salvo exigência legal) com expurgo automatizado; DPIA para tratamentos de risco (biometria, geolocalização de equipe); plano de resposta a incidente com notificação à ANPD e aos titulares em até 72 h; contratos de operador com todos os subprocessadores; **privacidade por padrão** (campos sensíveis mascarados, coleta mínima, geolocalização de equipe só durante a jornada e com aviso).

**Dados de menores:** consentimento do responsável obrigatório, com autorização de viagem anexada e verificação no embarque.

## 9.2 Controle de acesso

RBAC + ABAC (seção 2.8) aplicado em três camadas independentes (API guard → policy de domínio → RLS no banco), princípio do menor privilégio, segregação de funções no financeiro (cadastro ≠ aprovação ≠ pagamento), alçadas por valor, revisão trimestral de acessos com relatório, expiração automática de acesso de terceirizados, e negação por padrão (o que não está explicitamente permitido, é proibido).

## 9.3 Autenticação, JWT e 2FA

- Senhas com **Argon2id**, política mínima de 12 caracteres, verificação contra vazamentos (HaveIBeenPwned k-anonymity), bloqueio progressivo e CAPTCHA após falhas.
- **JWT** RS256, TTL de 15 min, claims mínimas, `jti` para revogação, chaves rotacionadas trimestralmente via JWKS; refresh rotativo com detecção de reuso.
- **2FA obrigatório** (TOTP/WebAuthn) para Owner, Financeiro e Admin; opcional e incentivado para os demais; códigos de recuperação de uso único; passkeys como caminho preferencial de longo prazo.
- Sessões visíveis e revogáveis; alerta por e-mail em login de novo dispositivo ou localização atípica.

## 9.4 Criptografia

| Estado | Mecanismo |
|---|---|
| Em trânsito | TLS 1.3 obrigatório, HSTS com preload, certificate pinning no app móvel |
| Em repouso | AES-256 no disco (RDS/S3, chaves em KMS com rotação anual) |
| Campos sensíveis | Criptografia em nível de coluna (pgcrypto/envelope) para documento, chave PIX, credenciais de integração, segredo 2FA |
| Senhas | Argon2id (nunca reversível) |
| Cartão | **Nunca armazenado** — tokenização no PSP; escopo PCI-DSS SAQ-A |
| Backups | Criptografados com chave distinta da produção |
| Arquivos | URLs pré-assinadas de curta duração; bucket privado; verificação de propriedade a cada acesso |

## 9.5 Logs e auditoria

Trilha imutável com hash encadeado (adulteração detectável) cobrindo: toda escrita de negócio com diff antes/depois, autenticação e falhas, mudanças de permissão, acessos a dados pessoais e financeiros, exportações, impersonation, chamadas de integração e webhooks. Logs de aplicação estruturados em JSON com `trace_id`, **sem PII**, retidos 90 dias quentes e 1 ano em arquivo frio; auditoria de negócio retida 5 anos. Alertas automáticos (SIEM) para exportação em massa, acesso fora do horário, escalada de privilégio, picos de erro 4xx/5xx e login de geografia improvável.

## 9.6 Segurança de aplicação

Validação de entrada por schema (Zod) em todas as bordas; *prepared statements* (sem concatenação de SQL); saída escapada por padrão (React) + sanitização de HTML rico (DOMPurify); CSP restritiva, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`; CSRF por SameSite + token em fluxos de formulário; rate limiting por IP, usuário e rota, com *backoff*; upload validado por *magic number*, limite de tamanho, varredura antivírus (ClamAV) e armazenamento fora da raiz web; proteção contra IDOR por checagem de propriedade em todo acesso por id; *dependency scanning* (Dependabot + Snyk), SAST (CodeQL) e DAST (OWASP ZAP) no pipeline; SBOM assinado; pentest externo anual e *bug bounty* privado a partir da F3. Cobertura explícita do **OWASP Top 10** e do **OWASP API Security Top 10** documentada por controle.

## 9.7 Continuidade e resiliência

Backup e DR conforme 2.10 (RPO 5 min / RTO 1 h) com teste mensal; *circuit breaker* e *fallback* em toda integração externa (PSP fora do ar não pode impedir a venda — registra pendência e reprocessa); *graceful degradation* (sem dashboard, a operação continua); *health checks* e *readiness probes*; *runbooks* de incidente; *status page* pública; SLA contratual de 99,9% com crédito por descumprimento.

---

# 10. INTEGRAÇÕES

Arquitetura: **Integration Hub** com adaptadores por provedor, credenciais em cofre, *retry* exponencial com *dead letter*, idempotência por evento, sandbox por integração, log de chamadas e reprocessamento manual. Toda integração é opcional e configurável por tenant.

## 10.1 Mapas e localização
| Provedor | Uso |
|---|---|
| **Google Maps Platform** | Geocoding de pontos de embarque, distância e tempo entre paradas, mapa estático no voucher, Street View do ponto, autocomplete de endereço |
| **Waze / deep links** | Navegação do motorista |
| **Rastreadores veiculares** (Sascar, Onixsat, Positron) | Posição ao vivo, ETA e cerca virtual |
| **OpenStreetMap/Mapbox** | Alternativa de menor custo |

## 10.2 Calendário e produtividade
**Google Calendar** (bidirecional: partidas, escala e follow-ups; convite ao cliente), **Outlook/Microsoft 365**, **iCal** (feed público por guia/veículo), **Google Drive / Dropbox / OneDrive** (backup de documentos, pastas por partida, sincronização de contratos).

## 10.3 Distribuição e conteúdo de viagem
| Provedor | Uso | Fase |
|---|---|---|
| **Booking.com / Expedia (Rapid API)** | Consulta de tarifa e disponibilidade hoteleira | F3 |
| **Airbnb** | Sem API pública de reservas; integração por importação de calendário (iCal) | F3 |
| **Amadeus / Sabre / Duffel** | Aéreo: busca, tarifa, emissão (substitui "Google Flights", que não tem API de reserva) | F3 |
| **Google Flights (dado público)** | Apenas referência de preço via SerpAPI, sem emissão | F3 |
| **Viator / GetYourGuide / Civitatis** | Distribuição de passeios e receptivos | F3 |
| **Channel manager** | Sincronização de inventário com OTAs | F3 |

## 10.4 Mensageria
**WhatsApp Business Cloud API** (Meta) — templates aprovados, janela de 24 h, mídia, botões interativos, webhooks de status; **Telegram Bot API**; **Instagram/Messenger**; **SMS** (Twilio/Zenvia); **E-mail transacional** (SendGrid/Resend/Amazon SES) com DKIM/SPF/DMARC; **Push** (Firebase/APNs). Todos com fila, limite de taxa, opt-out unificado e escolha automática de idioma do destinatário.

## 10.5 Pagamentos
| Provedor | Recursos |
|---|---|
| **PIX** (via PSP ou banco: Banco do Brasil, Itaú, Bradesco, Sicredi) | QR dinâmico com txid, conciliação automática, devolução |
| **Mercado Pago** | PIX, cartão, boleto, link, split, assinaturas |
| **Stripe** | Cartão internacional, multimoeda, 3-D Secure, Connect (split), assinaturas |
| **PayPal** | Cliente internacional |
| **PagSeguro / Asaas / Pagar.me** | Alternativas nacionais com boleto e recorrência |
| **Open Finance** | Extrato e conciliação bancária |

Padrões: tokenização (nunca guardar PAN), `Idempotency-Key` em toda cobrança, webhook assinado (HMAC) e verificado, reconciliação diária automática, política de estorno e *chargeback* com trilha, antifraude, e *fallback* entre PSPs se um estiver indisponível.

## 10.6 Inteligência artificial
| Provedor | Uso |
|---|---|
| **Claude (Anthropic)** | Resumo de conversas longas, redação de proposta comercial bilíngue, classificação de intenção do lead, análise de avaliações |
| **OpenAI** | Alternativa/redundância; embeddings para busca semântica |
| **Gemini** | Alternativa; processamento multimodal de documentos |
| **Whisper / Speech-to-Text** | Transcrição de áudios de WhatsApp (canal dominante no Brasil) |
| **Modelos internos** | Previsão de demanda e ocupação, precificação dinâmica sugerida, escore de propensão a compra |

Governança de IA: dados pessoais minimizados antes do envio, opt-out por tenant, **nenhuma decisão automatizada de impacto financeiro sem revisão humana**, prompts e saídas auditados, custo por chamada monitorado, e aviso claro ao usuário quando um texto foi gerado por IA.

## 10.7 Fiscal, contábil e cadastral
NF-e/NFS-e (Focus NFe, eNotas, PlugNotas) · Contabilidade (Omie, Conta Azul, Bling, Sankhya) · Receita Federal (validação CNPJ/CPF) · ViaCEP/Google Places (endereço) · Serasa/Boa Vista (análise de crédito para faturamento a prazo, F3).

## 10.8 Turismo e regulatório (Brasil)
**Cadastur** (registro obrigatório de agência e guias), **ANTT** (autorização de viagem de fretamento — geração e controle do documento), **Ministério do Turismo** (obrigações estatísticas), seguradoras de viagem (Assist Card, Travel Ace, Coris, Universal Assistance), **Sistema de Autorização Eletrônica de Viagem de Menores** conforme resolução do CNJ.

## 10.9 Assinatura eletrônica e documentos
DocuSign · Clicksign · ZapSign · D4Sign — contrato de prestação de serviço, autorização de menor, contrato de fretamento e ordem de serviço com validade jurídica (ICP-Brasil quando exigido).

## 10.10 Infra e observabilidade
AWS (S3, SES, KMS, Secrets Manager) · Sentry (erros) · Grafana Cloud/Datadog (métricas e traces) · Metabase (BI self-service para o cliente) · Zapier/Make e **API pública com webhooks** para integrações que ainda não existam nativamente.

---

# 11. ROADMAP, TIME, CUSTOS E ACEITE

## 11.1 Estratégia de entrega

Entrega incremental com valor em produção desde o primeiro mês. A ordem foi definida pelo que **para a operação hoje**: controlar assento vendido, cobrar quem deve e levar a lista de passageiros para o ônibus.

| Fase | Duração | Escopo | Resultado para o cliente |
|---|---|---|---|
| **F0 — Protótipo** | *entregue* | `index.html` bilíngue, offline, com roteiros, partidas, reservas, financeiro e relatórios | A empresa sai da planilha **hoje**, sem servidor e sem custo |
| **F1 — MVP SaaS** | 10–12 semanas | Multi-tenant, auth+2FA, clientes, produtos, partidas, inventário/assentos, reservas, pagamentos PIX/cartão, contas a receber/pagar, dashboard, manifesto/voucher, i18n PT/EN, auditoria | Operação inteira online, multiusuário, com cobrança automatizada |
| **F2 — Consolidação** | 10–14 semanas | CRM completo, WhatsApp oficial, cotações, comissões, DRE por partida, app de campo offline, portal do cliente, documentos/seguros, automações, conciliação bancária, construtor de relatórios | Vendas e operação de campo integradas; margem visível por viagem |
| **F3 — Premium** | 12–16 semanas | Portais de fornecedor e guia, loja B2C, marketplace B2B, multimoeda e fiscal, aéreo/hotelaria via API, IA aplicada, multi-filial, billing SaaS, API pública | Produto vendável a outras operadoras; expansão internacional |

## 11.2 Time recomendado

| Papel | F1 | F2 | F3 |
|---|---|---|---|
| Tech Lead / Arquiteto | 1 | 1 | 1 |
| Desenvolvedor Full-stack sênior | 2 | 2 | 3 |
| Desenvolvedor Full-stack pleno | 1 | 2 | 2 |
| UX/UI Designer | 0,5 | 1 | 1 |
| QA / Automação | 0,5 | 1 | 1 |
| Product Owner (do negócio) | 0,5 | 0,5 | 0,5 |
| DevOps/SRE (compartilhado) | 0,3 | 0,5 | 0,5 |

Custo de infraestrutura: ~US$ 120/mês na F1, ~US$ 350/mês na F2, ~US$ 600–1.200/mês na F3 (até 500 tenants).

## 11.3 Requisitos não funcionais (mensuráveis)

| Requisito | Alvo |
|---|---|
| Disponibilidade | 99,9% mensal (back-office) |
| Latência | p95 < 300 ms leitura · < 800 ms escrita |
| Carga inicial | < 2 s em 4G; bundle inicial < 200 KB gzip |
| Capacidade | 500 tenants · 2M reservas/ano · pico de 10× |
| Offline | 100% das funções de campo por até 72 h sem rede |
| Backup | RPO ≤ 5 min · RTO ≤ 1 h · teste mensal |
| Acessibilidade | WCAG 2.2 AA verificado por release |
| Cobertura de testes | ≥ 80% no domínio; 100% nas regras de assento, preço e pagamento |
| Segurança | Zero vulnerabilidade crítica/alta em produção; pentest anual |
| i18n | 100% das strings externalizadas; zero chave faltante no build |

## 11.4 Critérios de aceite (exemplos verificáveis)

1. Duas pessoas comprando o **mesmo assento** simultaneamente: uma conclui, a outra recebe erro tratado com sugestão de assento alternativo. Nunca duas reservas para o mesmo lugar.
2. Guia com o celular em **modo avião** realiza 46 check-ins; ao reconectar, todos aparecem no servidor uma única vez, com o horário real do check-in.
3. Trocar o idioma para inglês reformata **interface, datas, moeda e o próximo e-mail enviado**, sem recarregar a página nem perder o formulário aberto.
4. Pagamento PIX confirmado no PSP baixa a parcela e dispara o voucher em **menos de 60 segundos**, sem intervenção humana.
5. Cancelar uma reserva em D-5 aplica a multa da política vigente **no momento da compra** (snapshot), libera os assentos e promove a lista de espera.
6. Vendedor não consegue ver, em nenhuma tela, exportação ou resposta de API, o **custo do fornecedor**.
7. Restaurar o backup de 24 h atrás em ambiente limpo reproduz o sistema íntegro em menos de 1 hora.
8. Solicitação de exclusão de dados anonimiza o cliente mantendo os registros fiscais obrigatórios e a integridade contábil.

## 11.5 Riscos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| Resistência da equipe à mudança | Alto | F0 já em uso; treinamento; importação da planilha atual; interface simples |
| Dependência de PSP único | Alto | Dois PSPs configuráveis com *fallback* |
| Meta/WhatsApp mudar regras de API | Médio | Camada de abstração de canal; Telegram e SMS como alternativa |
| Concorrência de assento em pico | Alto | Lock transacional testado em carga (k6) desde a F1 |
| Vazamento de dados pessoais | Crítico | Criptografia, RLS, auditoria, pentest, plano de resposta |
| Escopo inflado | Médio | Fases com corte claro; F3 só após validação comercial da F2 |
| Perda de dados do protótipo (localStorage) | Médio | Backup JSON incentivado no produto; migração automática para a F1 |

## 11.6 Do protótipo ao ERP

O arquivo `index.html` entregue nesta mesma branch **não é maquete**: é a Fase 0 em produção. Seu modelo de dados (roteiros → partidas → reservas → passageiros → pagamentos → fornecedores) é intencionalmente o mesmo desenhado na seção 6, com nomes equivalentes. Quando a Fase 1 subir, o backup JSON exportado pelo protótipo é importado por um script de migração — nenhum dado cadastrado agora será perdido, e a empresa opera sem interrupção durante toda a transição.
