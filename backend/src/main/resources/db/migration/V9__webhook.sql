-- V9 — Webhooks e integrações (etapa 055)
-- Assinaturas de webhook por tenant e log de entregas dos eventos de domínio.

CREATE TABLE webhook_subscription (
    id         VARCHAR(36)  NOT NULL PRIMARY KEY,
    tenant_id  VARCHAR(36)  NOT NULL,
    url        VARCHAR(500) NOT NULL,
    eventos    VARCHAR(300) NOT NULL,          -- "ALL" ou lista separada por vírgula
    ativo      BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em  TIMESTAMP    NOT NULL
);
CREATE INDEX ix_webhook_sub_tenant ON webhook_subscription (tenant_id);

CREATE TABLE webhook_delivery (
    id              VARCHAR(36)  NOT NULL PRIMARY KEY,
    tenant_id       VARCHAR(36)  NOT NULL,
    subscription_id VARCHAR(36)  NOT NULL,
    evento          VARCHAR(60)  NOT NULL,
    payload         TEXT         NOT NULL,
    status          VARCHAR(12)  NOT NULL,      -- PENDENTE / ENTREGUE / FALHOU
    http_status     INT,
    tentativas      INT          NOT NULL DEFAULT 0,
    criado_em       TIMESTAMP    NOT NULL,
    atualizado_em   TIMESTAMP    NOT NULL,
    CONSTRAINT fk_delivery_sub FOREIGN KEY (subscription_id) REFERENCES webhook_subscription (id)
);
CREATE INDEX ix_webhook_delivery_tenant ON webhook_delivery (tenant_id, status);
