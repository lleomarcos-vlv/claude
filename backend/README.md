# Drone Kairós ERP — Backend (Fase 3 · Walking Skeleton + Identidade)

Núcleo executável do ERP, em **Java 21 + Spring Boot 3.3** (conforme doc 10),
como **monólito modular (DDD)**. Implementa a primeira fatia vertical de ponta a
ponta, já **autenticada** (etapa 036), e serve de base para as próximas etapas do
roadmap.

## O que já funciona (verificado por testes)

- **Identidade e Acesso (etapa 036):** login por e-mail/senha → **JWT**; perfis
  **RBAC** (`ADMIN/FABRICANTE/REVENDA/TECNICO/CLIENTE`); autorização
  deny-by-default. O **tenant vem do claim `tenant_id` do token** — não de header
  (doc 10, R-T01). Ver `adr/0004-*`.
- **Multiempresa (tenancy):** isolamento por tenant resolvido do token
  (`TenantContextFilter` + `TenantContext`).
- **Equipamento por Serial Number:** registro com SN único global.
- **Histórico vitalício:** trilha append-only de eventos por equipamento.
- **Ordem de Serviço:** abrir, adicionar peças, concluir.
- **Estoque inteligente (KSI):** item com saldo/ponto de reposição e **baixa
  automática** na conclusão da OS, com **rollback transacional** se faltar saldo;
  **movimentações** por item e **Curva ABC** por consumo.
- **Transferência de posse (RF-022):** custódia fabricante→revenda→cliente no
  histórico vitalício.
- **KCI — diagnóstico offline:** sistema especialista por regras (sintomas →
  causa provável, ações, peças), integrado à OS.
- **Notificações (051):** central por tenant (OS concluída, estoque baixo,
  transferência) com contador de não lidas.
- **Documentos (052):** anexos por Serial Number (upload/lista/download).
- **Auditoria (KCD):** trilha imutável por tenant, incl. **login falho**
  (consulta restrita ao ADMIN). Cabeçalhos de segurança em toda resposta.
- **BI (076):** indicadores agregados (ABC, OS por status, saldo por item).
- **CRM (077):** clientes (PF/PJ) e funil de oportunidades.
- **Financeiro (077):** contas a receber/pagar, faturamento da OS, resumo.
- **Webhooks (055):** assinaturas por tenant + entrega dos eventos (com anti-SSRF).
- **Produção:** refresh tokens, anti-brute-force no login (429), health probes,
  CORS por env.
- **API documentada:** OpenAPI 3 em `/v3/api-docs` e **Swagger UI** em
  `/swagger-ui.html` (com auth Bearer).

Contextos (bounded contexts): `identity`, `tenancy`, `equipment`, `inventory`
(KSI), `workorder`, `kci`, `crm`, `finance`, `audit`, `notification`, `webhook`,
`bi`, `document`, mais `shared` (segurança, tenant, erros RFC 7807).

## Como rodar

```bash
cd backend

# Testes (H2 em memória, modo PostgreSQL) — não precisa de banco externo
mvn test

# Subir a aplicação (perfil padrão, H2)
mvn spring-boot:run
# → http://localhost:8080/api/v1/health

# Produção (PostgreSQL): perfil "postgres" + variáveis DB_URL/DB_USER/DB_PASSWORD
# e um segredo JWT forte (nunca versionado):
KAIROS_JWT_SECRET='<segredo-com-32+-bytes>' \
  mvn spring-boot:run -Dspring-boot.run.profiles=postgres
```

Resultado atual dos testes: **11 testes, 0 falhas** (fluxo completo com baixa e
histórico; saldo insuficiente com rollback; identidade e acesso: login inválido,
`/me`, RBAC 403 e isolamento por tenant; rejeição sem token / token inválido).

## API (v1)

| Método | Rota | Descrição | Acesso |
|---|---|---|---|
| `POST` | `/api/v1/empresas` | Onboarding: cria empresa (tenant) + usuário ADMIN | público |
| `POST` | `/api/v1/auth/login` | Autentica; devolve access + refresh token | público |
| `POST` | `/api/v1/auth/refresh` | Troca o refresh por um novo access token | público |
| `GET`  | `/api/v1/usuarios/me` | Dados do usuário autenticado | autenticado |
| `POST` | `/api/v1/usuarios` · `GET` | Cria/lista usuários do tenant | **ADMIN** |
| `POST` | `/api/v1/equipamentos` | Registra equipamento por Serial Number | autenticado |
| `GET`  | `/api/v1/equipamentos/{id}` | Consulta equipamento (posse atual) | autenticado |
| `GET`  | `/api/v1/equipamentos/{id}/historico` | Histórico vitalício | autenticado |
| `POST` | `/api/v1/equipamentos/{id}/transferencias` | Transfere a posse/custódia | autenticado |
| `POST` | `/api/v1/equipamentos/{id}/documentos` · `GET` | Anexa/lista documentos | autenticado |
| `GET`  | `/api/v1/documentos/{id}/download` | Baixa um documento | autenticado |
| `POST` | `/api/v1/estoque/itens` · `GET` | Cria/lista itens (KSI) | autenticado |
| `GET`  | `/api/v1/estoque/itens/{id}/movimentacoes` | Movimentações do item | autenticado |
| `GET`  | `/api/v1/estoque/itens/abc` | Curva ABC por consumo | autenticado |
| `POST` | `/api/v1/ordens-servico` | Abre OS | autenticado |
| `POST` | `/api/v1/ordens-servico/{id}/itens` | Adiciona peça à OS | autenticado |
| `POST` | `/api/v1/ordens-servico/{id}/concluir` | Conclui OS (baixa + evento) | autenticado |
| `POST` | `/api/v1/ordens-servico/{id}/diagnostico` | Diagnóstico KCI (por sintomas) | autenticado |
| `GET`  | `/api/v1/kci/sintomas` · `POST /kci/diagnostico` | Catálogo e motor de diagnóstico | autenticado |
| `GET`  | `/api/v1/bi/indicadores` | Indicadores agregados (BI) | autenticado |
| `POST` | `/api/v1/clientes` · `GET` | Clientes do CRM | autenticado |
| `POST` | `/api/v1/oportunidades` · `GET` · `POST /{id}/estagio` | Funil de oportunidades | autenticado |
| `POST` | `/api/v1/financeiro/lancamentos` · `GET` · `POST /{id}/pagar` | Contas a receber/pagar | autenticado |
| `POST` | `/api/v1/financeiro/faturar-os` · `GET /resumo` | Faturamento da OS e resumo | autenticado |
| `GET`  | `/api/v1/notificacoes` · `POST /{id}/lida` · `POST /marcar-todas-lidas` | Central de notificações | autenticado |
| `GET`  | `/api/v1/auditoria` | Trilha de auditoria do tenant | **ADMIN** |
| `POST` | `/api/v1/webhooks` · `GET` · `DELETE /{id}` · `GET /deliveries` | Webhooks e entregas | **ADMIN** |

Rotas autenticadas exigem o header `Authorization: Bearer <token>`. O `health`, o
`actuator` e a documentação (`/swagger-ui.html`, `/v3/api-docs`) são públicos.

### Exemplo (curl)
```bash
# 1) onboarding: cria empresa + admin
curl -s -XPOST localhost:8080/api/v1/empresas \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Drones Kairós","documento":"11.111.111/0001-11",
       "admin":{"nome":"Alexandre","email":"admin@kairos.com","senha":"senha-forte-123"}}'

# 2) login -> captura o token
TOKEN=$(curl -s -XPOST localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@kairos.com","senha":"senha-forte-123"}' | jq -r .token)

# 3) registra equipamento (o tenant vem do token, não de header)
curl -s -XPOST localhost:8080/api/v1/equipamentos \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"serialNumber":"SN-DRONE-0001","modelo":"KX-10","fabricante":"Kairós"}'
```

## Pendências conhecidas (próximas etapas)

Ver `adr/0004-autenticacao-e-autorizacao.md` e `adr/0003-*`. Em resumo:
migração para **OIDC/JWKS** (IdP externo, RS256) + **MFA**, **ABAC/PDP**
contextual, **refresh tokens**, **Row-Level Security** no PostgreSQL e testes com
Postgres real (Testcontainers).

> ⚠️ **Antes de produção:** definir `KAIROS_JWT_SECRET` forte, ligar RLS e
> migrar para OIDC/MFA conforme docs 10/14. A senha é guardada só como hash
> (BCrypt); segredos/tokens nunca são logados.
