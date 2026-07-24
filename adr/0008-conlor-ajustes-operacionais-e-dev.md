# ADR-0008 — Conlor: baixa na aprovação, visibilidade do técnico, fornecedor e login DEV

**Status:** Aceito · **Data:** 23 de julho de 2026
**Relacionado:** ADR-0006, ADR-0007

## Contexto
Testes de uso revelaram ajustes: (1) um chamado aberto pelo ADM **não aparecia
para o técnico** iniciar o orçamento; (2) a baixa de estoque deveria ocorrer na
**aprovação** do orçamento (não na conclusão); (3) faltava fornecedor/lembrete de
pedido no estoque; (4) era preciso um **quarto login de desenvolvedor** que gera
um PDF das alterações desejadas; além de melhorias de UX (ícones vetoriais, menu
com relevo, fonte maior, lista completa de modelos).

## Decisão
1. **Visibilidade do técnico (correção do bug).** A listagem do técnico passa a
   incluir as OS atribuídas a ele **e as ainda não distribuídas** (fila) —
   `findParaTecnico` (`tecnicoId = :tec OR tecnicoId IS NULL`). Assim, todo
   chamado novo aparece de imediato. O frontend faz **polling** (~12 s) em Ordens
   e no Painel, deixando ADM/Técnico/Cliente em sincronia próxima do tempo real.
2. **Baixa na aprovação.** As peças dão baixa quando o administrativo **aprova**
   o orçamento (estágio 1 em `aprovar`, adicionais em `aprovarEstagio2`), gerando
   movimentação. `OrdemServicoItem.baixado` evita baixa dupla; `concluir` só
   baixa pendências residuais. Saldo insuficiente faz a aprovação falhar (rollback).
3. **Fornecedor + lembrete de pedido.** `ItemEstoque.fornecedor`; a tela de
   Estoque destaca as peças abaixo do mínimo com o fornecedor a quem pedir, e
   ganha uma seção **Alimentar estoque** (entrada de peças recebidas).
4. **Login DEV.** Novo `Perfil.DEV`; no token, DEV recebe também o papel `ADMIN`
   (acesso total). Tela **Desenvolvedor**: lista de alterações (tela, campo,
   mudança) que, ao salvar, gera um **PDF** para download.
5. **UX.** Ícones **SVG** desenhados (substituem emojis) + ilustração de técnico
   ajustando o drone; **menu lateral interativo com alto relevo** (elevação no
   hover, estado ativo embossado); fonte-base maior; **lista completa** de
   modelos DJI Agras (T10, T20, T20P, T25, T25P, T30, T40, T50, T70P, T100). A
   aba **Aeronaves** foi removida (as aeronaves são cadastradas via chamado).

## Consequências
- (+) O fluxo funciona ponta a ponta: chamado do ADM chega ao técnico na hora.
- (+) Estoque reflete o custo real no momento certo (aprovação), não na conclusão.
- (+) Canal formal de mudanças pelo DEV (PDF), pronto para virar tarefa de dev.
- (−) Migração `V12` (colunas `baixado`, `fornecedor`). OSs concluídas antes da
  versão são marcadas como já baixadas para não baixar em dobro.

## Migração
`V12__conlor_baixa_e_fornecedor.sql`: `ordem_servico_item.baixado`,
`item_estoque.fornecedor`; marca itens de OS já concluídas como baixados.
