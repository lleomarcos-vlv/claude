# ADR-0006 — Conlor Drones: OS por estágios, orçamento automatizado e IA preditiva

**Status:** Aceito · **Data:** 23 de julho de 2026
**Relacionado:** Apresentação Conlor Drones (especificação oficial), docs 06 (requisitos),
13 (KCI), 15 (KSI), ADR-0004 (auth/RBAC), ADR-0005 (KCI offline)

## Contexto
A especificação Conlor Drones define um SaaS de **manutenção de drones DJI Agras**
com três camadas de permissão (ADM, Técnico, Cliente) e um fluxo de serviço em
**estágios** com **orçamento automatizado** e **dupla aprovação**. O núcleo já
existente (multi-tenant, RBAC, KSI, KCI, histórico vitalício por Serial Number)
foi **adaptado** — não recriado — para atender à especificação exatamente.

## Decisão

### 1. Ciclo de vida da OS por estágios
O status da OS deixou de ser `ABERTA → EM_ANDAMENTO → CONCLUIDA` e passou a
modelar o método Conlor:

```
FILA_DE_ESPERA → ORCAMENTO → ESTAGIO_1 → ESTAGIO_2 → CONCLUIDA
```

- **Fila de Espera:** lead confirmado / OS aberta, aguardando o técnico.
- **Orçamento:** montagem do orçamento (peças do estoque, preço congelado).
- **Estágio 1** (diagnóstico primário): aprovado o orçamento inicial; problemas
  eletrônicos secundários viram **peças adicionais** (estágio 2), destacadas.
- **Estágio 2** (finalização): 2ª aprovação (adicionais) e conclusão.
- **Conclusão:** baixa automática no estoque + evento no histórico vitalício,
  tudo na mesma transação (rollback se faltar saldo).

As transições são **guardadas no domínio** (`OrdemServico`), não nos serviços,
garantindo invariantes (ex.: só conclui a partir do Estágio 2).

### 2. Estoque precificado ligado ao gerador de orçamento
`ItemEstoque` ganhou **preço**; a linha da OS (`OrdemServicoItem`) **congela** o
preço no momento da inclusão e marca o **estágio** (1 = inicial, 2 = adicional).
O `OrcamentoService` consolida as linhas, separa escopo inicial de adicionais,
calcula os totais e gera o **PDF automático** (OpenPDF) e o **link de WhatsApp**
(`wa.me` com a mensagem pronta) — atendendo ao "orçamento automatizado enviado
via WhatsApp" da especificação.

### 3. Agendamento autônomo + gestão de leads
Novo bounded context `scheduling`: o **cliente** solicita horário informando
Serial Number, modelo e nome (vendo a agenda em tempo real); a **gerência**
confirma o lead, o que registra a aeronave (se nova), abre a OS na Fila de
Espera, vincula o cliente e distribui ao técnico.

### 4. IA preditiva (offline, por regras)
Estende o KCI (ADR-0005) mantendo o princípio offline-first:
- **Problemas crônicos por modelo** (`ProblemasCronicosService`): agrega as
  manutenções concluídas por modelo de aeronave e aponta a peça mais recorrente.
- **Sugestões ativas por correlação** (`SugestaoService`): correlaciona as peças
  do orçamento e infere o padrão (ex.: hélices + eixos → "Queda" → verificar
  radares e sistema aviônico).

### 5. Papéis (RBAC) alinhados às três camadas
`ADMIN` (gerência: leads, estoque/preço, financeiro, BI), `TECNICO` (execução
focada: vê só as OS atribuídas) e `CLIENTE` (agendamento autônomo + tracking das
próprias OS). A listagem de OS e agendamentos é **filtrada por papel** no serviço.

## Alternativas consideradas
- **Manter o fluxo simples e mapear "estágios" só na UI:** rejeitada — a dupla
  aprovação e os adicionais são regras de negócio, precisam viver no domínio.
- **Orçamento como documento separado:** dispensado — as linhas da OS já são a
  fonte da verdade; o orçamento é uma *projeção* (read model) delas.
- **IA externa/ML para preditiva:** adiada (mesma razão do ADR-0005); as regras
  determinísticas entregam o valor da especificação sem conectividade nem custo.

## Consequências
- (+) O aplicativo reflete **exatamente** o método Conlor (estágios, orçamento
  automatizado, dupla aprovação, IA preditiva, três camadas de permissão).
- (+) Preço congelado por linha garante que reprecificar o estoque **não** altera
  orçamentos já montados/aprovados (auditabilidade).
- (+) Reaproveita todo o núcleo (multi-tenant, KSI, histórico, auditoria).
- (−) Migração de dados: OSs antigas (`ABERTA`/`EM_ANDAMENTO`) foram migradas
  para `FILA_DE_ESPERA` (V10); relatórios que fixavam os status antigos mudam.

## Migração
`V10__conlor_estagios.sql`: adiciona `preco` a `item_estoque`; `tecnico_id`,
`cliente_id`, `orcamento_aprovado_em`, `adicionais_aprovados_em` a
`ordem_servico`; `estagio` e `preco_unitario` a `ordem_servico_item`; cria a
tabela `agendamento`; migra os status antigos para `FILA_DE_ESPERA`.

## Pendências que este ADR cria
- [ ] App mobile do cliente (aprovação via push, além do WhatsApp).
- [ ] Agenda visual (calendário) com bloqueio de horários por capacidade.
- [ ] Realimentar as sugestões preditivas com o desfecho real das OS.
- [ ] Integração oficial com a API do WhatsApp Business (hoje via `wa.me`).
