# ADR-0003 — Persistência e autenticação do walking skeleton

**Status:** Aceito (provisório, Fase 3) · **Data:** 21 de julho de 2026
**Relacionado:** docs 08 (Banco), 10 (Backend), 14 (KCD), 19 (DevOps)

## Contexto
A Fase 3 começa por um walking skeleton que precisa **rodar e ser testável em
qualquer ambiente** (inclusive CI sem serviços externos), sem abrir mão do
alvo de produção (PostgreSQL) nem da fidelidade das migrações.

## Decisão
1. **Banco:** schema único mantido pelo **Flyway** (`V1__init.sql`, SQL portável).
   - Dev/testes: **H2 em modo PostgreSQL**, in-memory.
   - Produção: **PostgreSQL** (perfil `postgres`).
   - JPA com `ddl-auto=validate` — as entidades são validadas contra o schema
     criado pelo Flyway em ambos os ambientes.
2. **Autenticação:** **adiada** para uma etapa dedicada. No skeleton, o tenant
   vem do header `X-Tenant-Id` (validado). OIDC/JWT + RBAC/ABAC entram conforme
   docs 10/14 antes de qualquer uso real.
3. **Coordenação entre contextos:** chamada direta de serviços de aplicação na
   mesma transação (ex.: conclusão de OS → baixa no KSI + evento no histórico).
   Evolução para **eventos de domínio + outbox** conforme doc 09.

## Alternativas consideradas
- **PostgreSQL via Testcontainers já nos testes:** adiado para não depender de
  pull de imagem/rede nesta fase; será adotado nos testes de integração (doc 20).
- **Hibernate `ddl-auto=update` sem Flyway:** rejeitado — perde controle e
  fidelidade de migrações.

## Consequências
- (+) `mvn test` roda offline e verde; migrações reais versionadas.
- (+) Caminho claro para produção (trocar perfil, adicionar RLS e auth).
- (−) Pequeno risco de divergência de dialeto H2/Postgres — mitigado por SQL
  portável e, na sequência, testes com Postgres real (Testcontainers).

## Pendências que este ADR cria
- [ ] Testes de integração com PostgreSQL (Testcontainers).
- [ ] Autenticação OIDC/JWT + RBAC e vínculo tenant↔identidade.
- [ ] Row-Level Security no PostgreSQL.
- [ ] Migrar coordenação para eventos de domínio + outbox.
