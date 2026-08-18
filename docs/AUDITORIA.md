# Auditoria do projeto atual

**Data:** 18/08/2026 · **Branch:** `claude/system-review-edit-4rdm8i`
**Escopo:** levantamento factual anterior a qualquer alteração de código, conforme seção 58 do briefing.

Versão navegável (tabelas e status coloridos): `docs/auditoria.html`.

---

## Conclusão principal

Não existe hoje um sistema a ser evoluído. O repositório continha **um único arquivo** (`README.md`,
2 linhas). O que foi apresentado são **dois protótipos de interface** — arquivos HTML autocontidos,
sem backend, sem banco, sem autenticação e sem nenhuma chamada de rede.

A instrução "não recriar o projeto do zero" se aplica ao **design system** e ao **modelo de kits de
nicho**, que devem ser preservados. A aplicação em si precisa ser **construída**, não refatorada.

| Métrica | Valor |
|---|---|
| Arquivos versionados antes desta auditoria | 1 (`README.md`) |
| Linhas de aplicação (protótipo do núcleo) | 2.322 (HTML + CSS + JS) |
| Chamadas de rede (`fetch`/XHR/WebSocket) | 0 |
| Mecanismos de persistência | 0 |

## 1. Arquitetura atual

| Camada | Situação | Status |
|---|---|---|
| Stack | HTML + CSS + JavaScript ES5, arquivo único, sem build | Protótipo |
| Backend | Inexistente | Ausente |
| Banco de dados | Inexistente — estado em memória | Ausente |
| Rotas | Sem roteamento; troca de módulo via `innerHTML` | Ausente |
| Autenticação | Inexistente | Ausente |
| Multi-tenant | Inexistente | Ausente |
| APIs | Nenhuma própria, nenhuma externa | Ausente |
| Integrações | Nenhuma | Ausente |
| Design system | Tokens, tipografia, tema claro/escuro, acessibilidade | Sólido |
| Responsividade | Quebras reais em 1080px e 900px | Sólido |
| Modelo multi-nicho | `VERTICAIS[]` + `PEDE{}` — nicho como configuração | Boa base |

### Sistema legado (G3 SmallBusiness Food)

Não auditável: só há binários .NET (`.dll`, `.exe`, `.config`), sem código-fonte (`.cs`, `.sln`,
`.csproj`). Permanece relevante como **fonte de requisitos** e porque sua **base MySQL contém os
dados históricos** a migrar. Tratar como somente-leitura.

## 2. Problemas encontrados

| # | Problema | Gravidade |
|---|---|---|
| P1 | Perda total de dados a cada recarga da página | Crítico |
| P2 | Ausência de isolamento entre clientes (sem `tenant_id`/RLS) | Crítico |
| P3 | Nenhum controle de acesso | Crítico |
| P4 | 100% dos dados fixos no código | Crítico |
| P5 | Renderização por `innerHTML` (19 pontos) — padrão de XSS | Alto |
| P6 | Ausência total de testes | Alto |
| P7 | Estado global mutável com re-render manual | Alto |
| P8 | Estoque por unidade simples, sem ficha técnica nem insumos | Alto |
| P9 | Zero tratamento fiscal | Alto |
| P10 | Sem auditoria, log ou backup | Alto |
| P11 | Sem estados de carregamento, erro ou reconexão | Médio |
| P12 | Sem PWA nem modo offline | Médio |

Ponto a favor: nenhum segredo exposto, porque não há integração. A regra "nunca colocar `API_KEY`
no frontend" começa sem dívida acumulada.

## 3. Funcionalidades existentes

Verificadas em execução, operando sobre dados em memória:

- Núcleo único com 9 kits de nicho, trocáveis em tempo real, com identidade visual por nicho
- PDV adaptativo: busca sem acento, categorias, modos por nicho, desconto, taxa de serviço/entrega, comissão
- Campos especiais por nicho: grade tamanho/cor, peso (kg), metragem (m²), lote/validade,
  aplicação veicular, dados do pet, profissional, observação de cozinha
- Fechamento de venda: dinheiro, cartão, Pix, a prazo, com cálculo de troco
- Baixa de estoque na venda e destaque de nível de reposição
- Painel com indicadores, gráfico de 7 dias (com tabela alternativa) e ranking
- Catálogo, Estoque, Clientes e Financeiro navegáveis
- Acessibilidade e responsividade reais

## 4. Funcionalidades faltantes

Não iniciado: multi-tenant e perfis (2–3), mesas/comandas/KDS (6), ficha técnica e insumos (7–11),
fornecedores e compras (12–13), XML/OCR (14–15), motor fiscal (16–17), contador (18–19, 52),
marketing e Meta/Google/WhatsApp (23–26), marketplaces e omnichannel (27–29), monitoramento e
auditoria (30–33), segurança e LGPD (34–35), relatórios (36–39), PWA e offline (41–42), API e
webhooks (46–48), planos e multi-filial (54–55), testes (57).

Parcial: dashboard (4 de ~25 indicadores), PDV (sem código de barras, foto, acréscimo, cliente,
pagamento dividido), financeiro e clientes (apenas listagem), onboarding (só troca de nicho).

## 5. Banco de dados

**Não existe.** Sem schema, migration, ORM ou `.sql`. O "banco" são três objetos JavaScript.

Consequência: a regra "não alterar schema sem migration" não se aplica — não há schema a preservar.
O modelo de dados pode nascer multi-tenant, auditado e versionado desde a origem.

O banco real é o **MySQL do G3 legado**, em produção — fonte da migração, não banco deste projeto.

## 6. Integrações

Nenhuma existe, está configurada ou simulada. Varredura confirmou zero ocorrências de `fetch`,
`XMLHttpRequest`, WebSocket ou service worker.

Compromisso assumido: nenhuma tela exibirá "conectado" sem conexão real. Faltando credencial, a
entrega é o **adapter real + tela de configuração**, com estado honesto de "não conectado".

## 7. Preservar / refatorar / criar

**Preservar:** design system completo; modelo de kits de nicho (deve virar tabela no banco);
fluxos de PDV já validados; catálogos por nicho como dados de *seed* (nunca de produção).

**Refatorar:** `innerHTML` → componentes com escape automático; estado global → store tipado;
arquivo único → módulos, build e TypeScript.

**Criar:** backend, banco, autenticação, multi-tenant, permissões, ficha técnica, compras, fiscal,
financeiro real, integrações, API, webhooks, jobs, auditoria, PWA e testes.

## 8. Plano de implementação

| Fase | Entrega |
|---|---|
| 0 | Decisões de stack/infra, repositório estruturado, CI, ambientes |
| 1 | Banco, multi-tenant (`tenant_id` + RLS), migrations, auditoria, backup |
| 2 | Autenticação, 13 perfis, permissões granulares, MFA |
| 3 | Cadastros, filiais, kits de nicho no banco, onboarding, importação |
| 4 | Estoque inteligente: ficha técnica, insumos, conversão de unidades, alertas, custo real |
| 5 | PDV em produção: pagamento dividido, comandas, mesas, KDS, PWA, fila offline |
| 6 | Compras, fornecedores, entrada por XML, financeiro, fluxo de caixa, DRE, CMV |
| 7 | Motor fiscal versionado, NCM/CFOP/CST, preparo IBS/CBS/IS, emissão via provedor |
| 8 | Central do contador, pacote mensal, relatórios com exportação |
| 9 | Adapters, jobs, webhooks, API pública, WhatsApp, Meta, Google, marketplaces |
| 10 | Planos, feature flags, monitoramento, LGPD, manuais e checklists |

**Corte para o primeiro produto vendável:** fases 0 a 6. A fase 7 (fiscal) é o que separa
"vendável" de "obrigatório no Brasil" e exige um contador ao lado.

## 9. Riscos declarados

- **Dimensão do escopo** — os 62 itens equivalem a um ERP de porte com equipe dedicada.
  Mitigação: fases independentes, cada uma utilizável em produção.
- **Regras fiscais** — errar tributação gera passivo legal ao cliente final.
  Mitigação: nenhuma regra inventada; fonte oficial registrada; marcação de validação pelo contador.
- **Reforma Tributária** — 2026 em transição, leiautes em atualização.
  Mitigação: regras versionadas com vigência; atualizar é inserir linha, não reprogramar.
- **APIs de terceiros** — exigem aprovação e credenciais do titular.
  Mitigação: adapter e tela primeiro; conexão real só com credenciais fornecidas.
- **Migração do legado** — MySQL de produção.
  Mitigação: somente-leitura, validação em homologação, conferência item a item.

## 10. Estado

Auditoria fechada. **Nenhuma linha do projeto foi alterada.** A Fase 0 depende de três decisões
do proprietário (stack/infraestrutura, provedor fiscal, hospedagem), por envolverem custo
recorrente e propriedade da infraestrutura.
