# Drone Kairós ERP — Backend (Fase 3 · Walking Skeleton)

Núcleo executável do ERP, em **Java 21 + Spring Boot 3.3** (conforme doc 10),
como **monólito modular (DDD)**. Implementa a primeira fatia vertical de ponta a
ponta e serve de base para as próximas etapas do roadmap.

## O que já funciona (verificado por testes)

- **Multiempresa (tenancy):** provisionamento de empresa e isolamento por tenant
  via header `X-Tenant-Id` (`TenantFilter` + `TenantContext`).
- **Equipamento por Serial Number:** registro com SN único global.
- **Histórico vitalício:** trilha append-only de eventos por equipamento.
- **Ordem de Serviço:** abrir, adicionar peças, concluir.
- **Estoque inteligente (KSI):** item com saldo/ponto de reposição e **baixa
  automática** na conclusão da OS, com **rollback transacional** se faltar saldo.

Contextos (bounded contexts): `tenancy`, `equipment`, `inventory` (KSI),
`workorder`, mais `shared` (tenant, erros RFC 7807).

## Como rodar

```bash
cd backend

# Testes (H2 em memória, modo PostgreSQL) — não precisa de banco externo
mvn test

# Subir a aplicação (perfil padrão, H2)
mvn spring-boot:run
# → http://localhost:8080/api/v1/health

# Produção (PostgreSQL): perfil "postgres" + variáveis DB_URL/DB_USER/DB_PASSWORD
mvn spring-boot:run -Dspring-boot.run.profiles=postgres
```

Resultado atual dos testes: **4 testes, 0 falhas** (fluxo completo, saldo
insuficiente com rollback, rejeição sem tenant, tenant inválido).

## API (v1)

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/v1/empresas` | Cria empresa (tenant) — rota pública |
| `POST` | `/api/v1/equipamentos` | Registra equipamento por Serial Number |
| `GET`  | `/api/v1/equipamentos/{id}` | Consulta equipamento |
| `GET`  | `/api/v1/equipamentos/{id}/historico` | Histórico vitalício |
| `POST` | `/api/v1/estoque/itens` | Cria item de estoque (KSI) |
| `GET`  | `/api/v1/estoque/itens/{id}` | Consulta item/saldo |
| `POST` | `/api/v1/ordens-servico` | Abre OS |
| `POST` | `/api/v1/ordens-servico/{id}/itens` | Adiciona peça à OS |
| `POST` | `/api/v1/ordens-servico/{id}/concluir` | Conclui OS (baixa + evento) |
| `GET`  | `/api/v1/ordens-servico/{id}` | Consulta OS |

Todas as rotas (exceto criar empresa e health) exigem o header `X-Tenant-Id`.

### Exemplo (curl)
```bash
# 1) cria empresa e captura o id como TENANT
TENANT=$(curl -s -XPOST localhost:8080/api/v1/empresas \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Drones Kairós","documento":"11.111.111/0001-11"}' | jq -r .id)

# 2) registra equipamento por Serial Number
curl -s -XPOST localhost:8080/api/v1/equipamentos \
  -H "X-Tenant-Id: $TENANT" -H 'Content-Type: application/json' \
  -d '{"serialNumber":"SN-DRONE-0001","modelo":"KX-10","fabricante":"Kairós"}'
```

## Pendências conhecidas (próximas etapas)

Ver `adr/0003-walking-skeleton-persistencia-e-auth.md`. Em resumo: autenticação
OIDC/JWT + RBAC, Row-Level Security no PostgreSQL, testes com Postgres real
(Testcontainers) e coordenação por eventos de domínio + outbox.

> ⚠️ **Não usar em produção** enquanto a autenticação e o RLS não estiverem
> implementados: hoje o tenant vem apenas do header, sem vínculo com identidade.
