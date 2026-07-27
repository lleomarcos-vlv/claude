# @jardimja/web-admin

Painel administrativo / BI do **JardimJá** — o "Uber da jardinagem". Interface para
a operação acompanhar indicadores, serviços (orçamentos por IA), jardineiros e
finanças.

Stack: **Vite + React 18 + TypeScript + React Router v6 + TanStack Query v5 +
Tailwind CSS v3 + Recharts + axios**. Consome os contratos de domínio de
[`@jardimja/shared`](../../packages/shared) (enums, `Quote`, `GardenAnalysis`,
helper `money`) via `workspace:*`.

## Como rodar

Pré-requisitos: Node 22+ e pnpm 10+ (na raiz do monorepo).

```bash
# a partir da raiz do monorepo
pnpm install

# subir apenas o painel admin (Vite em http://localhost:5173)
pnpm --filter @jardimja/web-admin dev
```

Outros scripts:

```bash
pnpm --filter @jardimja/web-admin build      # tsc + build de produção
pnpm --filter @jardimja/web-admin preview    # servir o build
pnpm --filter @jardimja/web-admin lint       # eslint
pnpm --filter @jardimja/web-admin typecheck  # tsc --noEmit
```

## Configuração

Copie `.env.example` para `.env` e ajuste se necessário:

```
VITE_API_URL=http://localhost:3333
```

O cliente HTTP usa `import.meta.env.VITE_API_URL` + `/api/v1` como base
(ex.: `http://localhost:3333/api/v1`).

## Autenticação

`POST /auth/login` retorna `{ accessToken, refreshToken, user }`. O token é
guardado no `localStorage` e injetado no header `Authorization: Bearer <token>`
por um interceptor do axios (`src/lib/api.ts`). Em caso de `401`, a sessão é
descartada e o guard de rotas (`src/components/Protected.tsx`) redireciona para
`/login`.

## Comportamento de fallback com dados MOCK

Para que a interface continue navegável **mesmo sem o backend rodando**, cada
chamada de API é encapsulada por `withMockFallback` em `src/lib/api.ts`. Quando a
requisição falha por indisponibilidade (erro de rede/timeout ou `5xx`), o cliente
resolve com **fixtures tipadas** de `src/lib/fixtures.ts` (claramente rotuladas
como `MOCK_*`), conformando aos contratos de `@jardimja/shared`.

- Erros `4xx` reais (exceto `401`) continuam sendo propagados.
- No modo de desenvolvimento, um aviso é logado no console indicando que dados
  simulados estão sendo servidos.
- No `Login`, com a API offline, qualquer credencial autentica com um usuário
  administrador simulado.

Isso é apenas um recurso de desenvolvimento — nunca deve ser usado como fonte de
dados em produção.

## Contrato de API consumido

Base: `VITE_API_URL` + `/api/v1`.

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/auth/login` | Autenticação; retorna tokens + usuário |
| `GET` | `/admin/stats` | KPIs, série de receita, serviços por status, heatmap |
| `GET` | `/admin/jobs?status=&page=` | Lista paginada de serviços |
| `GET` | `/admin/jobs/:id` | Detalhe do serviço (análise IA, orçamento, ofertas, mídia) |
| `GET` | `/admin/gardeners?status=&page=` | Lista paginada de jardineiros |
| `POST` | `/admin/gardeners/:id/verify` | Verificação de jardineiro (ação stub) |

## Estrutura

```
src/
├── main.tsx, App.tsx        # bootstrap + router + QueryClientProvider
├── index.css                # Tailwind + design system (acento verde #16a34a)
├── lib/
│   ├── api.ts               # axios + interceptors + fallback mock
│   ├── queries.ts           # hooks TanStack Query (useStats, useJobs, ...)
│   ├── auth.ts              # storage de token + contexto de auth
│   ├── format.ts            # money/date/pt-BR (reutiliza `money` do shared)
│   ├── labels.ts            # rótulos pt-BR + tons para enums de domínio
│   ├── types.ts             # DTOs do admin (usa tipos de @jardimja/shared)
│   └── fixtures.ts          # dados MOCK de desenvolvimento
├── components/              # Layout, StatCard, StatusBadge, DataTable,
│                            # ConfidenceBar, Protected, charts, HeatmapPanel...
└── pages/                   # Login, Dashboard, Jobs, JobDetail,
                             # Gardeners, Financeiro, Configuracoes, NotFound
```

## Notas de UI

- Copy 100% em **pt-BR**.
- Marca verde `#16a34a`, cinzas neutros, cards arredondados, sombras suaves.
- **Dark mode** via classe `dark` no `<html>` (alterna e persiste no
  `localStorage`), respeitando `prefers-color-scheme` na primeira visita.
- Sem SDK de mapa: o "mapa de calor" de demanda é um painel estilizado que agrega
  os pontos geográficos em uma grade com intensidade.
