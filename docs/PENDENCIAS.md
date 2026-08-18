# O que falta — mapa completo

**Data:** 18/08/2026 (2ª sessão) · **Branch:** `claude/html-error-kry78y`
**Base:** os 62 itens do briefing, conferidos contra o código após as Fases 1–10.

---

## Resumo

| | Situação |
|---|---|
| Fases 1–6 (fundação, auth, cadastros, estoque, PDV, financeiro) | **Concluídas e testadas** |
| Fase 7 (fiscal) | Estrutura concluída e testada; **emissão real bloqueada** (B2–B4, B10) |
| Fases 8–10 (contador, integrações, SaaS) | Estrutura e telas concluídas; **conexões externas bloqueadas** (B5–B8) |
| Testes de banco | **76/76 asserções** em 8 suítes (`./supabase/testar.sh`) |
| Testes de app | **23/23** (CSV, fila offline, leitor de NFe) |

**Traduzindo:** o sistema opera de ponta a ponta contra um Postgres —
cadastro, estoque com ficha técnica, venda com pagamento dividido, caixa,
compras com XML de NFe, financeiro com DRE, relatórios e auditoria. O que
**não** existe é tudo que depende de credencial ou infraestrutura externa,
listado abaixo — nada disso aparece na interface como se funcionasse.

---

## 1. O que está pronto e provado

Só entra aqui o que roda e tem teste automatizado.

| Entrega | Prova |
|---|---|
| Multi-tenant com RLS, 41 permissões, 13 papéis, auditoria imutável | testes 0001 (9) |
| Convites com hash SHA-256, aceite nominal, expiração, troca de empresa | testes 0002 (9) |
| 9 kits de nicho no banco (terminologia, modos, campos, catálogo inicial), unidades com conversão, produtos/clientes/fornecedores, importador CSV | testes 0003 (8) |
| Ficha técnica recursiva, baixa em cascata (Soda Italiana → 6 insumos), custo médio, custo real, precificação, alertas e previsão de ruptura | testes 0004 (10) |
| Caixa (abrir/sangria/suprimento/fechar com conferência), venda numerada, pagamento dividido validado, desconto com limite, mesas, KDS, cancelamento com estorno | testes 0005 (10) |
| Compras 6 status, recebimento parcial/total com custo, contas com parcelamento, venda a prazo → conta a receber, fluxo de caixa, DRE com CMV congelado | testes 0006 (10) |
| Regras fiscais versionadas com vigência e fonte, motor que não inventa imposto, IBS/CBS/cClassTrib, fila de emissão | testes 0007 (8) |
| 16 relatórios + curva ABC, pacote do contador, integrações honestas, API keys, webhooks com backoff, segmentação RFV, planos com limites, LGPD | testes 0008 (12) |
| App React PWA: login/convite/troca de empresa, catálogo com kit e CSV, estoque, PDV com fila offline, compras com XML NFe, financeiro, fiscal, relatórios com exportação, integrações, auditoria, alertas | build + 23 testes unitários |

---

## 2. O que falta, por dependência

### A. Depende só de trabalho (nenhum bloqueio externo)

- **Tela de cozinha dedicada (KDS em tela cheia)** — o fluxo de status já
  funciona no PDV; falta a tela própria para o monitor da cozinha.
- **Impressão** de cupom não fiscal e de pedido na cozinha (window.print
  básico dá o primeiro passo; impressora térmica exige o agente local).
- **Multi-filial na interface** — o banco segrega tudo por filial; a UI
  hoje opera na matriz. Falta o seletor de filial e transferência entre filiais.
- **Conciliação bancária (tela)** — o campo existe em finance_entries;
  falta a tela de conferência com extrato importado (OFX).
- **MFA (tela)** — o Supabase Auth já suporta TOTP; falta o fluxo de
  inscrição no app (Configurações → Segurança).
- **Onboarding guiado em 10 etapas** — as etapas gravam em
  `tenants.onboarding_etapa`; falta o passo-a-passo visual completo.
- **Foto de produto** (upload para o Supabase Storage).
- **Acréscimo no PDV** (o banco já aceita; falta o campo na tela).
- **Testes E2E** (Playwright) dos fluxos críticos contra um Supabase real.
- **Manuais** do administrador, proprietário e contador.

### B. Depende de credencial / infraestrutura SUA (bloqueios)

| # | O que preciso | Destrava | Urgência |
|---|---|---|---|
| B1 | **Conta Supabase** (projeto, URL, chaves) | O app sair do "não configurado" e operar de verdade | **Alta — destrava tudo** |
| B2 | Certificado digital A1 + CNPJ | Emissão fiscal | Alta na emissão |
| B3 | **Contador parceiro** | Regras tributárias reais (o sistema não traz alíquota pré-pronta) | Alta na emissão |
| B4 | Homologação SEFAZ do estado | Emissão fiscal | Iniciar cedo — demora semanas |
| B5 | Credenciais WhatsApp Business (Meta) | Adapter WhatsApp | Média |
| B6 | Conta Meta Business + app aprovado | Instagram/Facebook | Média |
| B7 | Google Ads API | Google Ads | Média |
| B8 | Credenciais iFood / Mercado Livre / Shopee | Marketplaces | Média |
| B9 | Acesso ao MySQL do G3 legado (leitura) | Migração de dados históricos | Média |
| B10 | Máquina Windows para o agente ACBr | Emissão fiscal + impressora | Alta na emissão |
| B11 | Nome comercial e logo | White-label final | Baixa |

### C. Depende de B1 + publicação de Edge Functions (trabalho após a conta existir)

- **E-mail transacional** (convite de usuário, pacote do contador, recuperação
  customizada) — Edge Function + Resend/SMTP.
- **Endpoint REST público `/api/v1`** — a validação de chave (`app.validar_api_key`)
  já está no banco; falta a Edge Function do endpoint com rate limit.
- **Worker de webhooks** — a fila, o payload e o backoff já estão no banco e
  testados; falta a Edge Function agendada que faz o POST e chama
  `app.registrar_tentativa_entrega`.
- **Adapters de integração** (iFood, Mercado Livre, Shopee, WhatsApp, Meta,
  Google) — a central, os logs e o estado honesto existem; cada adapter é uma
  Edge Function com a credencial correspondente (B5–B8).
- **OCR de DANFE/PDF** (item 15) — serviço externo de OCR; o caminho pelo XML
  já funciona sem OCR.
- **Agendamentos** (`app.expirar_convites`, segmentação diária, alerta de
  contas) — pg_cron ou Edge Function agendada.
- **Backup/restauração e monitoramento** — PITR e métricas do próprio Supabase;
  documentar runbook.

### D. Escopo maior, planejável depois do primeiro cliente

- CRM com funil completo, tarefas e lembretes (a segmentação RFV já roda).
- Marketing: calendário, campanhas, ROAS/CAC (dependem de B6/B7).
- Central de pedidos omnichannel + estoque com reserva (dependem de B8).
- Comissões de vendedores (relatório já declarado como "em breve" no catálogo).
- Agente local Windows (ACBr): projeto próprio — serviço, auto-update,
  impressora fiscal, gaveta, balança (B10).
- Camada de IA sobre os dados do tenant.

---

## 3. Ordem recomendada a partir daqui

1. **B1 — criar o projeto Supabase** e apontar o app (`app/.env.local`).
   Aplicar migrations, expor o schema `app`, testar o fluxo completo online.
2. **E-mail transacional** (convites param de ser link manual).
3. **KDS dedicado + impressão básica** — fecha a operação de salão.
4. **Multi-filial na UI e conciliação bancária** — fecha o financeiro.
5. **Fiscal em paralelo:** contador (B3) cadastrando regras + homologação (B4)
   + agente local (B10). É o caminho mais longo — começar cedo.
6. Integrações conforme credencial aparecer (B5–B8), uma por vez.

**Corte para o primeiro cliente pagando:** itens 1–4 desta lista, com o 5
correndo em paralelo.

---

## 4. Compromissos mantidos (seção 50 do briefing)

- Nenhuma tela finge funcionar: integração sem credencial diz "não conectado",
  documento fiscal sem agente diz "aguardando agente local", relatório não
  implementado aparece como "em breve" e recusa execução.
- Nenhuma regra fiscal inventada: o motor calcula só o que o contador
  cadastrar, com fonte legal obrigatória e marcação de validação.
- Todo número tem prova: 76 asserções de banco + 23 de app, todas rodando
  em ambiente limpo via `./supabase/testar.sh` e `npm test`.
