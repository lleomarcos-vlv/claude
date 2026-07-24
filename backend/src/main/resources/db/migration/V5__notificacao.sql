-- V5 — Notificações in-app (etapa 051)
-- Avisos por tenant gerados por eventos do domínio (OS concluída, estoque baixo,
-- transferência). Portável entre H2 (modo PostgreSQL) e PostgreSQL.

CREATE TABLE notificacao (
    id         VARCHAR(36)  NOT NULL PRIMARY KEY,
    tenant_id  VARCHAR(36)  NOT NULL,
    tipo       VARCHAR(40)  NOT NULL,
    mensagem   VARCHAR(300) NOT NULL,
    lida       BOOLEAN      NOT NULL DEFAULT FALSE,
    criado_em  TIMESTAMP    NOT NULL
);
CREATE INDEX ix_notificacao_tenant ON notificacao (tenant_id, criado_em);
