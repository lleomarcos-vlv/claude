-- V8 — Financeiro: contas a receber/pagar (doc 18)
-- Lançamentos financeiros por tenant, com origem rastreável (ex.: faturamento de OS).

CREATE TABLE lancamento_financeiro (
    id          VARCHAR(36)    NOT NULL PRIMARY KEY,
    tenant_id   VARCHAR(36)    NOT NULL,
    tipo        VARCHAR(10)    NOT NULL,        -- RECEBER / PAGAR
    descricao   VARCHAR(300)   NOT NULL,
    valor       DECIMAL(18,2)  NOT NULL,
    vencimento  DATE           NOT NULL,
    status      VARCHAR(12)    NOT NULL,        -- ABERTO / PAGO / CANCELADO
    origem      VARCHAR(80),
    cliente_id  VARCHAR(36),
    criado_em   TIMESTAMP      NOT NULL,
    pago_em     TIMESTAMP
);
CREATE INDEX ix_lancamento_tenant ON lancamento_financeiro (tenant_id, status);
