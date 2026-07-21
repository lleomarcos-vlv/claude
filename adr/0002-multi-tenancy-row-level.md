# ADR-0002 — Multi-tenancy row-level com contexto de tenant

**Status:** Aceito · **Data:** 21 de julho de 2026 · **Fase:** 3 (início)
**Relacionado:** docs 07 (Arquitetura), 08 (Banco de Dados), 14 (KCD)

## Contexto
A plataforma é multiempresa. Cada agregado pertence a uma empresa (tenant) e o
isolamento é requisito de primeira classe (Constituição, Artigo IV).

## Decisão
Adotar **isolamento row-level**: cada tabela de agregado carrega `tenant_id`.
Uma requisição resolve o tenant a partir do header (`X-Tenant-Id`) via
`TenantFilter`, que valida a empresa (existente e ativa) e popula o
`TenantContext`. Todos os repositórios filtram por `tenant_id`.

Na evolução para produção, reforçar com **Row-Level Security (RLS)** no
PostgreSQL e promover tenants premium a schema/banco dedicado quando
justificado (ver doc 08).

## Alternativas consideradas
- **Schema/banco por tenant desde já:** rejeitado pelo custo de provisionamento
  para a maioria dos tenants nesta fase.
- **Sem coluna de tenant (só filtro de app):** rejeitado por não permitir RLS.

## Consequências
- (+) Simples, escalável para muitos tenants, pronto para RLS.
- (−) Isolamento depende de disciplina de filtro na aplicação até o RLS entrar —
  mitigado centralizando o acesso em repositórios por tenant e por testes de
  isolamento (doc 20).

## Nota de segurança (pendência conhecida)
O header de tenant no skeleton **ainda não** está atrelado a autenticação
(OIDC/JWT). A vinculação tenant↔identidade autenticada é tratada no ADR-0003
e na etapa de segurança (doc 14). Não usar o skeleton em produção sem isso.
