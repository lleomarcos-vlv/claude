# Grafista — ERP SaaS multi-nicho

Núcleo único de gestão comercial, com o nicho carregado por configuração.
Um mesmo sistema atende restaurante, mercado, loja, farmácia, autopeças, petshop,
salão, distribuidora e materiais de construção — sem código separado por segmento.

## Estado atual

| Fase | Entrega | Situação |
|---|---|---|
| — | Auditoria do projeto | Concluída · [docs/AUDITORIA.md](docs/AUDITORIA.md) |
| 0 | Decisões de arquitetura | Concluída · [docs/ADR-001](docs/ADR-001-arquitetura.md) |
| 1 | Banco, multi-tenant, RBAC e auditoria | Concluída · 9/9 testes passando |
| 2 | Autenticação e convite de usuários | Próxima |
| 3+ | Cadastros, estoque, PDV, financeiro, fiscal | Planejadas |

Ainda **não há interface conectada ao banco**. O que existe de interface são
protótipos que operam em memória — veja o aviso no fim deste arquivo.

## Estrutura

```
docs/
  AUDITORIA.md              relatório técnico (seção 58 do briefing)
  auditoria.html            mesma auditoria, versão navegável
  ADR-001-arquitetura.md    decisão de stack: nuvem + agente local
supabase/
  migrations/               schema versionado (aplicar em ordem)
  tests/                    testes de isolamento e permissões
  README.md                 como aplicar e testar
prototipos/
  nucleo.html               protótipo do núcleo com 9 kits de nicho
  comanda-pdv.html          protótipo inicial do PDV (nicho food)
.env.example                variáveis necessárias
```

Os protótipos são arquivos autocontidos: abra direto no navegador, sem instalação.

## Conceito

| Camada | Conteúdo | Varia por nicho |
|---|---|---|
| **Núcleo** | Produto, estoque, cliente, venda, caixa, financeiro, fiscal | Não |
| **Kit do nicho** | Terminologia, campos, regras, catálogo inicial | Sim |
| **Identidade** | Cor, nome, logo (white-label) | Sim |

Um nicho novo é um registro de configuração, não um sistema novo.

## Aviso sobre os protótipos

Os arquivos em `prototipos/` operam **em memória**: nada é gravado e tudo se perde ao
recarregar a página. Os catálogos, clientes e valores são dados de demonstração fixos no
código. Não use em operação real — servem para validar fluxo e interface.
