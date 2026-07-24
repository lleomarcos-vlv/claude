-- V3 — Auditoria de eventos (etapa 053 · base do KCD)
-- Trilha append-only de ações relevantes por tenant: quem fez, o quê, quando.
-- Portável entre H2 (modo PostgreSQL) e PostgreSQL.

CREATE TABLE evento_auditoria (
    id            VARCHAR(36)  NOT NULL PRIMARY KEY,
    tenant_id     VARCHAR(36)  NOT NULL,
    usuario_id    VARCHAR(36),
    usuario_email VARCHAR(200),
    acao          VARCHAR(60)  NOT NULL,
    recurso_tipo  VARCHAR(60),
    recurso_id    VARCHAR(80),
    detalhe       VARCHAR(500),
    ocorrido_em   TIMESTAMP    NOT NULL
);
CREATE INDEX ix_auditoria_tenant ON evento_auditoria (tenant_id, ocorrido_em);
