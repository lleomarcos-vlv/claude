# Verde Fixo — Seu jardim sempre impecável.

Plataforma completa de agendamento de serviços de jardinagem e assinatura de
planos de manutenção da **Verde Fixo**. Site institucional de alta conversão +
área do cliente + painel administrativo, tudo em um único projeto Next.js.

O objetivo central do produto é **vender os planos de assinatura** (Clube Verde
Fixo), com o agendamento avulso e o orçamento como portas de entrada.

---

## Stack

| Camada | Escolha | Por quê |
| --- | --- | --- |
| Framework | **Next.js 16** (App Router, Server Components) | SSR/SSG para SEO, Server Actions para o admin |
| Linguagem | **TypeScript** estrito | segurança de tipos de ponta a ponta |
| Estilo | **Tailwind CSS v4** | design system próprio, sem CSS morto |
| Banco | **Prisma + SQLite** (troca para Postgres em produção) | zero setup local, migração trivial |
| Auth | Sessão própria (HMAC-SHA256 via Web Crypto) + scrypt | sem dependência externa, roda no Edge |
| Pagamentos | Mercado Pago · Stripe · PIX (BR Code) | por HTTP puro, sem SDK no bundle |
| Gráficos | SVG renderizado no servidor | painel abre instantâneo, zero JS de chart |
| Imagens | SVG gerado por script | < 650 KB no total, nota alta de PageSpeed |

Nenhuma dependência de runtime além de `next`, `react`, `@prisma/client` e `zod`.

---

## Começando

```bash
npm install          # instala e roda `prisma generate`
npm run dev          # cria o .env, o banco SQLite, popula o seed e sobe em :3000
```

O `predev`/`prebuild` (`scripts/ensure-db.mjs`) cuida de criar o `.env` com um
`AUTH_SECRET` aleatório, aplicar o schema e rodar o seed na primeira execução.

### Acessos de demonstração (criados pelo seed)

| Perfil | E-mail | Senha |
| --- | --- | --- |
| **Administrador** | `admin@verdefixo.com.br` | `VerdeFixo@2026` |
| Equipe | `equipe@verdefixo.com.br` | `verdefixo123` |
| Cliente | `cliente@exemplo.com` | `verdefixo123` |

> Troque a senha do admin em **Admin → Segurança** antes de publicar, e defina um
> `AUTH_SECRET` aleatório no ambiente de produção.

### Scripts

```bash
npm run dev          # desenvolvimento
npm run build        # build de produção
npm run start        # sobe o build
npm run typecheck    # tsc --noEmit
npm run db:seed      # popula dados de demonstração
npm run db:reset     # apaga e recria o banco
npm run images:build # regenera as imagens SVG
npm run og:build     # regenera as imagens Open Graph (PNG) — requer Chromium
```

---

## Estrutura

```
prisma/schema.prisma       Modelo de dados (usuários, agendamentos, assinaturas, faturas…)
prisma/seed.ts             Catálogo oficial + base operacional de demonstração
scripts/                   Geração de banco, imagens e Open Graph
src/
  app/
    (site)/                Site público (home, serviços, planos, blog, legal…)
    admin/                 Painel administrativo (layout, dashboard, CRUDs)
    area-cliente/          Painel do cliente
    entrar, cadastro       Autenticação
    api/                   Rotas (auth, bookings, quotes, subscriptions, webhooks, cron…)
  components/              UI, seções, formulários, gráficos, layout
  content/                 Conteúdo estático (serviços, planos, blog, FAQ, cidades…)
  lib/                     Regras de negócio (pricing, auth, pagamentos, settings, SEO…)
```

O cabeçalho/rodapé do site vivem no grupo de rotas `(site)`. As áreas logadas e
de autenticação ficam fora dele e têm layout próprio — por isso o "chrome"
público nunca aparece no admin nem na área do cliente.

---

## Preços (do catálogo oficial)

As faixas por m² e os planos vêm do **Catálogo de Serviços da Verde Fixo** e
ficam em `src/content`. O painel administrativo (`Admin → Serviços e preços` e
`Admin → Planos`) sobrescreve esses valores no banco, com precedência sobre o
conteúdo estático — e as páginas públicas revalidam sozinhas.

- **Serviços avulsos por m²:** Corte R$ 2,50–4,50 · Adubação R$ 3,00–6,00 ·
  Limpeza pesada R$ 8,00–12,00 · **mínimo de visita R$ 200,00**
- **Clube Verde Fixo:** Essencial (a partir de R$ 450) · Verde (a partir de
  R$ 650) · Premium — valor por porte do terreno.

---

## Integrações e automações

Tudo é configurável pelo painel em **Admin → Integrações**, sem novo deploy:

- **Pagamentos:** Mercado Pago (PIX, cartão, assinatura recorrente), Stripe, PIX
  direto (BR Code copia-e-cola).
- **Notificações:** WhatsApp Cloud API, e-mail (Resend), aviso à equipe (webhook).
- **Medição:** Google Tag Manager, GA4, Meta Pixel — carregados só após o
  consentimento de cookies (LGPD).
- **Automações** (`/api/cron`, agendado de hora em hora): confirmação, lembrete
  24 h antes e pesquisa de satisfação após o serviço.

As credenciais secretas são **cifradas em AES-256-GCM** no banco e cada gravação
exige a senha do administrador (step-up auth). Sem credenciais, o sistema opera
em **modo demonstração** — todo o fluxo funciona e os disparos ficam marcados
como `SIMULADO` no painel.

Precedência de leitura: **banco (painel) → variável de ambiente → vazio**. Veja
`.env.example` para a lista completa de variáveis.

---

## Segurança

- HTTPS forçado, HSTS e CSP restritiva (só os hosts das integrações).
- Senhas com scrypt + sal por usuário; sessão assinada por HMAC.
- Rate limiting, honeypot, time-trap e captcha próprio em todos os formulários.
- Uploads validados por assinatura de arquivo (magic numbers), não por extensão.
- Webhooks de pagamento com verificação de assinatura.
- Conformidade LGPD: banner de consentimento, política de privacidade e cookies.

---

## Deploy em produção

1. Troque o `datasource` do Prisma para `postgresql` e aponte `DATABASE_URL`
   para o banco gerenciado; rode `prisma migrate deploy`.
2. Defina `AUTH_SECRET` (32+ caracteres aleatórios) e `NEXT_PUBLIC_SITE_URL`.
3. Configure as integrações pelo painel ou por variáveis de ambiente.
4. O `vercel.json` já agenda o cron horário de `/api/cron` (proteja com
   `CRON_SECRET`).

---

_Verde Fixo — Profissionalismo, comodidade e jardim impecável._
