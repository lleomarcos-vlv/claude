# ADR-0007 — Conlor: fluxo com aprovação do administrativo, chamados e reorganização por papel

**Status:** Aceito · **Data:** 23 de julho de 2026
**Relacionado:** ADR-0006 (OS por estágios), especificação Conlor (áudios de correção)

## Contexto
Após a primeira adaptação (ADR-0006), a operação pediu correções que mudam o
modelo de aprovação, a jornada de cada papel e o escopo de módulos. O ponto
central: **a manutenção não pode andar sem aprovação do administrativo**, e o
técnico não deve ter poderes de gestão.

## Decisão

### 1. Ciclo da OS com aprovação (substitui o fluxo do ADR-0006)
Novos estados intermediários de aprovação, guardados no domínio:

```
FILA_DE_ESPERA → ORCAMENTO → AGUARDANDO_APROVACAO → APROVADO → ESTAGIO_1
   → (Concluir) CONCLUIDA
   → (novos defeitos) AGUARDANDO_APROVACAO_E2 → APROVADO_E2 → ESTAGIO_2 → CONCLUIDA
   (+ CANCELADA, e reabertura pelo administrativo)
```

O técnico **monta e envia** o orçamento; o **administrativo aprova/reprova**; só
então o técnico **inicia a manutenção**. O Estágio 2 repete o ciclo de aprovação
(o administrativo fala com o cliente). Enquanto não aprovado, a manutenção fica
**bloqueada** e uma notificação é gerada (“a aeronave X entrou no Estágio 2 e
aguarda aprovação”). Diagnóstico e **mão de obra** entram no orçamento.

### 2. Abertura de chamados (provisionamento automático)
Um endpoint do administrativo (`POST /chamados`) cria, numa transação: **cliente
(usuário + senha)**, **aeronave**, **OS na fila**, **protocolo** e libera o painel
do cliente — a partir de um contato (WhatsApp/Instagram/Facebook/Telefone/Site).

### 3. Três camadas de permissão (reduz o RBAC)
`Perfil` passa a ter só **ADMIN, TECNICO, CLIENTE** (removidos FABRICANTE/REVENDA).
Gestão de usuários ganha **bloquear/reativar/redefinir senha/alterar perfil/excluir**.
Menu e telas são montados por papel: técnico perde Aeronaves/Estoque e vê as OS em
**dois painéis** (Acesso Geral, leitura + observações; e as suas ordens); cliente
vê só o próprio chamado com **linha do tempo** e mensagens amigáveis.

### 4. Observações/Sugestões
Nova entidade `ordem_servico_observacao` (comentário interno da OS). Observações
podem ser **visíveis ao cliente** (viram mensagens na linha do tempo). O cliente
só enxerga as marcadas como visíveis.

### 5. Financeiro focado em peças
Substitui o financeiro genérico no painel: `ItemEstoque` ganha **custo**; um
serviço calcula **custo, venda, margem, lucro, volume vendido, giro, estoque
mínimo/recomendado e previsão** por peça, a partir das movimentações.

### 6. IA preditiva como relatório inteligente
Consolida drones com mais problemas, peças mais trocadas, falhas recorrentes,
causas e recomendações, com **exportação em PDF, Excel e CSV**.

### 7. Auditoria imutável com IP e tela
`evento_auditoria` ganha **ip** (via `X-Forwarded-For`/remote) e **tela** (cabeçalho
`X-Tela` do frontend). **Relatório PDF por período/semana**. Sem endpoints de
edição/exclusão — a trilha é append-only por design.

### 8. Remoção de módulos
**CRM** e **Webhooks** removidos por completo (código, testes, telas e menu),
por não fazerem parte do escopo da assistência técnica.

## Alternativas consideradas
- **Aprovação só na UI:** rejeitada — a trava de manutenção é regra de negócio e
  precisa viver no domínio (invariantes de transição).
- **Excel via Apache POI:** dispensado — a exportação usa tabela HTML com
  `application/vnd.ms-excel` (aberta nativamente pelo Excel), sem nova dependência.
- **Manter 5 perfis:** rejeitada — a especificação define exatamente três camadas.

## Consequências
- (+) O produto reflete a operação real: nada anda sem aprovação; o técnico é
  focado na execução; o cliente acompanha sem ver dados de terceiros.
- (+) Preço/custo por peça dá visão de rentabilidade sem um ERP financeiro completo.
- (−) Migração `V11` altera o esquema (protocolo/diagnóstico/mão de obra/custo,
  observações, IP/tela) e o `Perfil` perde valores — dados de FABRICANTE/REVENDA
  não são suportados (não havia base de produção).

## Migração
`V11__conlor_correcoes.sql`: colunas de OS (protocolo, diagnóstico, mão de obra,
origem), `item_estoque.custo`, tabela `ordem_servico_observacao`,
`evento_auditoria` (ip, tela). Tabelas de CRM/webhook de migrações anteriores
permanecem (inertes) para não quebrar checksums do Flyway.

## Pendências que este ADR cria
- [ ] App mobile do cliente (push além do WhatsApp) e upload de fotos na OS.
- [ ] Agenda visual (calendário) com bloqueio por capacidade.
- [ ] Integração oficial WhatsApp Business API (hoje via `wa.me`).
- [ ] Previsão de consumo baseada em série temporal real (hoje heurística).
