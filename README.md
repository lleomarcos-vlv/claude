# Grafista — ERP SaaS multi-nicho

Núcleo único de gestão comercial, com o nicho carregado por configuração.
Um mesmo sistema atende restaurante, mercado, loja, farmácia, autopeças, petshop,
salão, distribuidora e materiais de construção — sem código separado por segmento.

## Estado atual

| Fase | Entrega | Situação |
|---|---|---|
| — | Auditoria do projeto | Concluída · [docs/AUDITORIA.md](docs/AUDITORIA.md) |
| 0 | Decisões de arquitetura | Concluída · [docs/ADR-001](docs/ADR-001-arquitetura.md) |
| 1 | Banco, multi-tenant, RBAC e auditoria | Concluída · 9/9 testes |
| 2 | Autenticação, convites e usuários | Concluída · 9/9 testes + app |
| 3 | Kits de nicho no banco, catálogo, clientes, fornecedores | Concluída · 8/8 testes + app |
| 4 | Estoque inteligente (ficha técnica, baixa em cascata) | Concluída · 10/10 testes + app |
| 5 | PDV persistente (caixa, mesas, pagamento dividido, offline) | Concluída · 10/10 testes + app |
| 6 | Compras (XML NFe) e financeiro (DRE, fluxo) | Concluída · 10/10 testes + app |
| 7 | Estrutura fiscal (regras versionadas, motor, fila de emissão) | Estrutura concluída · 8/8 testes — emissão real bloqueada (certificado, contador, SEFAZ, agente local) |
| 8–10 | Contador, relatórios, integrações, API, webhooks, planos, LGPD | Estrutura e telas concluídas · 12/12 testes — conexões externas bloqueadas (credenciais) |

**Total: 76/76 asserções de banco + 23/23 testes de app.**
O que falta e por quê: [docs/PENDENCIAS.md](docs/PENDENCIAS.md).

> **Para operar de verdade falta uma coisa: a conta Supabase (bloqueio B1).**
> Sem ela o app abre na tela "não configurado" — honesto por decisão de projeto.

## Estrutura

```
docs/
  AUDITORIA.md              relatório técnico da 1ª sessão
  ADR-001-arquitetura.md    decisão de stack: nuvem + agente local
  PENDENCIAS.md             o que falta, por dependência (leia este)
supabase/
  migrations/               schema versionado, 16 migrations (aplicar em ordem)
  tests/                    8 suítes · 76 asserções de isolamento e regra de negócio
  testar.sh                 recria banco limpo, aplica tudo e roda os testes
app/
  src/lib/                  supabase, auth, CSV, fila offline, leitor de NFe
  src/paginas/              login, empresas, catálogo, estoque, PDV, compras,
                            financeiro, fiscal, relatórios, integrações,
                            usuários, auditoria
demo/
  demonstracao.html         demonstração comercial: 9 nichos interativos em um
                            arquivo único (pendrive/WhatsApp) — nada é gravado
docs/GUIA-DE-INSTALACAO.pdf instalação do zero, passo a passo (8 páginas)
prototipos/
  nucleo.html               protótipo original (fonte dos 9 kits, já migrados)
  comanda-pdv.html          protótipo original do PDV (fluxo já reimplementado)
.env.example                variáveis necessárias
```

## Rodar os testes do banco

```bash
# requer Postgres 16 local (ver supabase/README.md)
PGHOST=localhost PGPORT=55432 PGUSER=grafista ./supabase/testar.sh
```

## Rodar o app

```bash
cd app
npm install
cp .env.example .env.local   # preencher com o projeto Supabase (B1)
npm run dev                  # sem credenciais: tela "não configurado"
npm test                     # 23 testes unitários
npm run build                # typecheck + build de produção (PWA)
```

## Conceito

| Camada | Conteúdo | Varia por nicho |
|---|---|---|
| **Núcleo** | Produto, estoque, cliente, venda, caixa, financeiro, fiscal | Não |
| **Kit do nicho** | Terminologia, campos, regras, catálogo inicial | Sim |
| **Identidade** | Cor, nome, logo (white-label) | Sim |

Um nicho novo é um registro de configuração (tabelas `verticals*`), não um
sistema novo.

## Compromisso de honestidade (seção 50 do briefing)

Nenhuma tela finge funcionar: integração sem credencial mostra "não conectado",
documento fiscal sem agente local mostra "aguardando agente", relatório não
implementado aparece como "em breve" e o motor fiscal não calcula imposto que o
contador não cadastrou.
