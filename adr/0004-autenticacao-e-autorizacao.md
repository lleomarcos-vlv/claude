# ADR-0004 — Autenticação e autorização (identidade e acesso)

**Status:** Aceito (provisório, Fase 3 · etapa 036) · **Data:** 21 de julho de 2026
**Relacionado:** docs 06 (Requisitos, RF-001…019), 10 (Backend, R-S/R-T), 14 (KCD, IAM)
**Substitui parcialmente:** ADR-0003 §2 (autenticação adiada; tenant via header)

## Contexto
O walking skeleton (ADR-0003) adiou a autenticação: o tenant vinha do header
`X-Tenant-Id`, sem vínculo com identidade — inaceitável para uso real e
explicitamente marcado como pendência nº 1. A etapa 036 do roadmap ("Núcleo de
identidade e acesso") fecha essa lacuna, alinhada ao alvo dos docs 10/14: **OIDC/JWT,
autorização RBAC/ABAC, `tenant_id` resolvido do token (nunca de parâmetro do
cliente), deny-by-default**.

## Decisão
1. **Identidade.** Novo bounded context `identity`: `Usuario` (vinculado a uma
   empresa/tenant) com um `Perfil` (RBAC): `ADMIN`, `FABRICANTE`, `REVENDA`,
   `TECNICO`, `CLIENTE` (doc 06, RF-002). Senha guardada só como hash **BCrypt**.
2. **Autenticação.** Login por e-mail/senha em `POST /api/v1/auth/login` emite um
   **JWT HS256** assinado por segredo simétrico configurável
   (`kairos.security.jwt.secret`). O token carrega `sub`, `tenant_id`, `email`,
   `nome` e `roles`. Validação como **OAuth2 Resource Server** (Spring Security)
   em toda requisição.
3. **Tenant a partir do token.** O `TenantContextFilter` lê o claim `tenant_id`
   do JWT autenticado e alimenta o `TenantContext` (doc 10, R-T01). O header
   `X-Tenant-Id` e o antigo `TenantFilter` foram **removidos**. Os serviços de
   domínio não mudaram — continuam usando `TenantContext`.
4. **Autorização.** RBAC via `@PreAuthorize("hasRole('…')")`; o `Perfil` vira
   `ROLE_<PERFIL>`. Deny-by-default: tudo autenticado, exceto onboarding de
   empresa, login, health e actuator.
5. **Onboarding.** `POST /api/v1/empresas` passa a criar, numa única transação,
   a empresa **e** o seu primeiro usuário `ADMIN` (que provisiona os demais em
   `POST /api/v1/usuarios`).

## Alternativas consideradas
- **OIDC com IdP externo (Keycloak/JWKS) já agora:** é o alvo de produção
  (doc 14), mas adiciona dependência de infraestrutura que trava o
  desenvolvimento/testes offline nesta fase. Adotado o JWT auto-emitido como
  ponte, com o mesmo modelo de validação (resource server) para a migração ser
  transparente.
- **Sessão com cookie/estado no servidor:** rejeitado — a plataforma é
  multi-cliente (web + apps de campo) e stateless por token escala melhor e
  combina com Zero Trust.
- **E-mail único por tenant (login com seleção de empresa):** adiado; no
  skeleton o e-mail é único na plataforma, simplificando o login para
  `{email, senha}`.

## Consequências
- (+) API fechada por padrão; tenant e papéis vêm de um token assinado, não de
  headers arbitrários. `mvn test` continua verde e offline (11 testes).
- (+) Caminho claro para produção: trocar o `JwtDecoder` para OIDC/JWKS e ligar
  MFA sem tocar nos serviços de domínio.
- (−) Segredo HS256 simétrico precisa de gestão (rotação, cofre) — só o default
  de DEV é versionado; produção usa `KAIROS_JWT_SECRET`.

## Pendências que este ADR cria
- [ ] Migração para **OIDC/JWKS** com IdP externo (assinatura assimétrica RS256).
- [ ] **MFA** resistente a phishing para perfis administrativos (doc 14, R3/R45).
- [ ] **ABAC/PDP** contextual (propriedade do recurso, alçada) além do RBAC base.
- [ ] **Refresh tokens** e políticas de sessão por tenant (doc 06, RF-009).
- [ ] Row-Level Security no PostgreSQL reforçando o `tenant_id` do token (ADR-0003).
- [ ] E-mail por tenant + seleção de empresa no login (multi-tenant por usuário).
