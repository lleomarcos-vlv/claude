-- V13 — Nome do usuário na auditoria + base de conhecimento da IA
-- 1) Auditoria registra também o nome do usuário (além do e-mail)
-- 2) Base de conhecimento importável da IA (problema, causa, solução, sugestão)

ALTER TABLE evento_auditoria ADD COLUMN usuario_nome VARCHAR(200);

CREATE TABLE conhecimento_ia (
    id            VARCHAR(36)   NOT NULL PRIMARY KEY,
    tenant_id     VARCHAR(36)   NOT NULL,
    problema      VARCHAR(500)  NOT NULL,
    causa         VARCHAR(1000),
    solucao       VARCHAR(1000),
    sugestao      VARCHAR(1000),
    criado_em     TIMESTAMP     NOT NULL
);
CREATE INDEX ix_conhecimento_ia_tenant ON conhecimento_ia (tenant_id);
