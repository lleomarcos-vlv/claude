# O que falta — mapa completo

**Data:** 18/08/2026 · **Branch:** `claude/system-review-edit-4rdm8i`
**Base:** os 62 itens do briefing, conferidos um a um contra o código existente.

---

## Resumo

| | Itens | % |
|---|---|---|
| Concluídos e testados | 4 | 6% |
| Parciais (existe base, falta o resto) | 7 | 11% |
| Não iniciados | 51 | 82% |
| **Total** | **62** | |

**Traduzindo:** a fundação de segurança está pronta e testada. A operação do dia a dia
(vender, comprar, controlar estoque, emitir nota) **ainda não existe** conectada a banco.

Estimativa de esforço restante: **10 das 11 fases**. A Fase 1 levou o equivalente a uma
sessão de trabalho; as fases 4, 5, 7 e 9 são individualmente maiores que ela.

---

## 1. O que está pronto

Só entra nesta lista o que roda e tem prova.

| Entrega | Evidência |
|---|---|
| Banco multi-tenant | 4 migrations aplicadas em Postgres 16 limpo, em ordem |
| Isolamento por RLS | 10 tabelas com RLS ativa, 21 policies |
| 41 permissões granulares | `supabase/migrations/...0002_rbac.sql` |
| 13 perfis de acesso | Proprietário → Somente leitura, com recortes distintos |
| Trilha de auditoria | Gatilho genérico com valor anterior, novo e campos alterados |
| Provisionamento de empresa | Uma chamada cria empresa + matriz + 13 papéis + proprietário |
| Testes de isolamento | 9/9 asserções, rodando como usuário comum (sem superusuário) |
| Design system e kits de nicho | Protótipos com 9 nichos, tema claro/escuro, responsivo |
| Decisão de arquitetura | `docs/ADR-001-arquitetura.md` |

**O que isso significa na prática:** hoje é possível criar duas empresas no banco e
provar que uma não enxerga a outra, que um garçom não abre o financeiro e que toda
alteração fica registrada. Nada disso depende do frontend se comportar bem.

---

## 2. O que falta, por fase

### FASE 2 · Autenticação e usuários — **não iniciada**

O RBAC existe no banco, mas ninguém consegue fazer login ainda.

- Tela de login, cadastro e recuperação de senha
- Fluxo de convite: enviar, aceitar, expirar convite
- MFA (item 34)
- Sessões seguras, refresh token, logout de todos os dispositivos
- Troca de empresa (usuário que atende mais de um tenant)
- Rate limiting no login
- Tela de gestão de usuários e edição de permissões (o banco já suporta; falta interface)

### FASE 3 · Cadastros e configuração de nicho — **parcial**

Os 9 kits de nicho existem **no protótipo, em JavaScript**. Precisam virar tabela.

- Tabelas `verticals`, `vertical_fields`, `vertical_terminology`
- Migração dos 9 kits do protótipo para o banco
- Cadastro de produtos e serviços com foto, SKU, código de barras
- Unidades de medida e tabela de conversão (item 8): kg, g, mg, L, ml, unidade, caixa, fardo, pacote, saco, garrafa, lata, porção
- Cadastro de clientes completo (item 21): CPF/CNPJ, endereço, aniversário, preferências
- Cadastro de fornecedores completo (item 12)
- Onboarding em 10 etapas com percentual (item 44)
- Importador de Excel/CSV com mapeamento de colunas e preview (item 45)
- Multi-filial operacional (item 55) — as tabelas existem, falta a operação

### FASE 4 · Estoque inteligente — **não iniciada** ⚠️

Você marcou como uma das partes mais importantes. Nada disso existe.

- Ficha técnica / receita: produto composto por insumos (item 7)
- Baixa em cascata: vender 1 Soda Italiana baixa xarope 50 ml, água 150 ml, gelo 100 g, copo, tampa, canudo
- Conversão automática de unidades: fornecedor entrega 5 L, sistema controla 5.000 ml
- Rendimento, perdas e desperdício
- Estoque mínimo, máximo e ponto de reposição
- Histórico de movimentação com 9 tipos (venda, compra, perda, desperdício, ajuste, devolução, transferência, produção, consumo interno)
- Alertas de estoque com consumo médio e fornecedor sugerido (item 10)
- Previsão de ruptura: "acaba em ~4 dias" (item 11)
- Custo real do produto a partir da ficha técnica (item 38)
- Precificação inteligente: "quanto devo cobrar?" (item 39)
- Relatório de consumo de insumos (item 37)

### FASE 5 · PDV em produção — **parcial**

O protótipo tem o fluxo certo, mas **não grava nada**. Falta:

- Conectar ao banco: venda que persiste, sobrevive ao F5 e à queda de energia
- Código de barras e leitor
- Foto do produto
- Acréscimo (só há desconto)
- Vincular cliente e vendedor à venda
- **Pagamento dividido** (R$ 40 Pix + R$ 60 cartão) — item 5
- Vale e transferência como formas de pagamento
- Abertura, sangria, suprimento e fechamento de caixa
- Mesas e comandas persistentes, transferência entre mesas (item 6)
- Status do pedido: aberto → recebido → preparando → pronto → entregue → cancelado
- **KDS, painel de cozinha** (item 6)
- Impressão de cupom e de pedido na cozinha
- **PWA instalável** com manifest e service worker (item 41)
- **Modo offline** com fila de sincronização e resolução de conflito (item 42)
- Cancelamento e devolução com estorno de estoque

### FASE 6 · Compras e financeiro — **parcial**

Existe listagem estática no protótipo. Falta tudo que é real:

- Pedido de compra com 6 status (rascunho → recebido) — item 13
- Entrada de mercadoria aumentando estoque automaticamente
- **Upload e leitura de XML de NFe do fornecedor** (item 14)
- OCR de DANFE/PDF com tela de conferência antes de lançar (itens 14–15)
- Contas a pagar e a receber de verdade
- Fluxo de caixa, categorias, centros de custo
- Contas bancárias, taxas de cartão, parcelamento, recorrência
- Conciliação bancária
- DRE gerencial, CMV, margem, lucro, custos fixos e variáveis

### FASE 7 · Fiscal — **não iniciada** ⚠️

O maior risco do projeto. Nenhuma linha existe.

- Tabela `tax_rules` versionada com vigência, fonte e versão (item 17)
- NCM, CEST, CFOP, CST/CSOSN, origem, regime por produto
- Motor de cálculo configurável — sem regra fixa em tela (item 16)
- Estrutura para **IBS, CBS, Imposto Seletivo e cClassTrib** (Reforma Tributária)
- Marcação "validação pelo contador necessária" onde a regra depender de interpretação
- **Agente local Windows** com ACBr, certificado A1, impressora fiscal
- Emissão de NFe, NFCe, NFSe e SAT
- Homologação por estado junto à SEFAZ
- Cancelamento, carta de correção, inutilização
- Contingência quando a SEFAZ cair

### FASE 8 · Contador e relatórios — **não iniciada**

- Central do Contador com envio por API, XML, PDF, Excel, CSV, ZIP ou e-mail (item 18)
- Pacote mensal "CONTABILIDADE — AGOSTO/2026"
- Histórico: enviado, recebido, erro, pendente, processado
- Camada de integração com plataforma contábil (item 19)
- Convite do contador como usuário restrito (item 52) — o **perfil já existe no banco**, falta o fluxo
- Central de relatórios com 18 relatórios e exportação PDF/Excel/CSV (item 36)

### FASE 9 · Integrações — **não iniciada**

Nenhuma linha. Todas dependem de credenciais suas (ver bloqueios).

- Camada de adapters: `IFoodAdapter`, `MercadoLivreAdapter`, `ShopeeAdapter`, `UberEatsAdapter`, `Uber`, `99`
- Central de Integrações com conectar / testar / desconectar / logs (item 53)
- WhatsApp Business Platform: conversas, templates, avisos automáticos de pedido (item 26)
- Meta / Instagram / Facebook: conectar conta, campanhas, métricas (item 24)
- Google Ads: campanhas, custo, ROAS (item 25)
- Marketing: calendário, campanhas, público, ROAS, CAC (item 23)
- CRM com funil Lead → VIP, tarefas, lembretes (item 22)
- Segmentação automática de clientes (item 21)
- Central de pedidos omnichannel (item 28)
- Estoque omnichannel com reserva para pedidos pendentes (item 29)
- API pública `/api/v1/...` com chaves, rate limit e OpenAPI (item 46)
- Webhooks com 12 eventos (item 47)
- Sistema de jobs com retry e backoff (item 48)

### FASE 10 · SaaS comercial — **não iniciada**

- Planos Básico / Profissional / Empresarial com feature flags (item 54)
- Monitoramento de saúde: API, banco, integrações, filas (itens 30–31)
- Central de alertas inteligentes com 14 tipos (item 40)
- Backup automático, exportação, restauração, retenção (item 33)
- LGPD: consentimento, anonimização, exportação, política de retenção (item 35)
- Tela de auditoria (o **banco já grava**; falta a interface) — item 32
- Camada de IA sobre dados reais do tenant (item 56)
- Testes de ponta a ponta dos fluxos críticos (item 57)
- Manuais do administrador, proprietário e contador
- Checklists de produção, homologação, segurança e integração
- Instruções de deploy e de instalação para cliente

---

## 3. Bloqueios que dependem de você

Nada disso eu consigo resolver sozinho. Alguns bloqueiam fases inteiras.

| # | O que preciso | Bloqueia | Urgência |
|---|---|---|---|
| B1 | **Conta Supabase** (projeto criado, URL e chaves) | Fase 2 em diante — sem isso nada sai do banco local | Alta |
| B2 | **Certificado digital A1** e CNPJ da empresa | Fase 7, emissão fiscal | Alta quando chegar a fase 7 |
| B3 | **Contador parceiro** para validar regras tributárias | Fase 7 — não vou inventar regra fiscal | Alta |
| B4 | **Homologação na SEFAZ** do seu estado | Fase 7 — processo externo, demora | Iniciar cedo |
| B5 | Credenciais WhatsApp Business (Meta) | Fase 9, WhatsApp | Média |
| B6 | Conta Meta Business + app aprovado | Fase 9, Instagram/Facebook | Média |
| B7 | Conta Google Ads + acesso de API | Fase 9, Google | Média |
| B8 | Credenciais iFood / Mercado Livre / Shopee | Fase 9, marketplaces | Média |
| B9 | **Acesso ao MySQL do G3 legado** (somente leitura) | Migração dos dados históricos | Média |
| B10 | Máquina Windows para desenvolver e testar o agente ACBr | Fase 7 | Alta na fase 7 |
| B11 | Definição do nome comercial e logo do produto | Cosmético, mas trava o white-label | Baixa |

> **Sobre B3 e B4:** homologação de NFCe costuma levar semanas e é processo externo.
> Se a emissão própria for para frente, vale iniciar isso em paralelo, não no fim.

---

## 4. Ordem recomendada

1. **Fase 2 — autenticação.** Destrava tudo: sem login, nenhuma tela pode existir de verdade.
2. **Fase 3 — cadastros.** Produtos e clientes reais no banco, kits de nicho migrados.
3. **Fase 4 — estoque com ficha técnica.** É a parte que você marcou como mais importante e é o que diferencia o produto de um PDV comum.
4. **Fase 5 — PDV em produção.** Aqui o protótipo vira sistema: venda que grava, PWA, offline.
5. **Fase 6 — compras e financeiro.** A partir daqui já é um ERP vendável.
6. **Fase 7 — fiscal.** Começar a homologação em paralelo à Fase 5.
7. **Fases 8 a 10** conforme a demanda comercial aparecer.

**Corte para o primeiro cliente pagando:** fases 2 a 6, com a 7 em paralelo.

---

## 5. Uma observação honesta sobre prazo

Os 62 itens equivalem a um ERP com equipe dedicada e anos de estrada. Não existe caminho
em que isso fique pronto rápido — existe caminho em que **cada fase entregue já é usável**,
e é esse o plano.

O que **não** vai acontecer, conforme sua seção 50: nenhuma tela que finge funcionar,
nenhuma integração marcada como "conectada" sem conexão real, nenhuma regra fiscal
inventada. Onde faltar credencial, a entrega será o adapter real mais a tela de
configuração, exibindo honestamente "não conectado".
