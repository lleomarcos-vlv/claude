-- V7 — CRM: clientes e funil de oportunidades (doc 17)
-- Portável entre H2 (modo PostgreSQL) e PostgreSQL.

CREATE TABLE cliente (
    id         VARCHAR(36)  NOT NULL PRIMARY KEY,
    tenant_id  VARCHAR(36)  NOT NULL,
    nome       VARCHAR(200) NOT NULL,
    tipo       VARCHAR(10)  NOT NULL,           -- PF / PJ
    documento  VARCHAR(40),
    email      VARCHAR(200),
    telefone   VARCHAR(40),
    criado_em  TIMESTAMP    NOT NULL
);
CREATE INDEX ix_cliente_tenant ON cliente (tenant_id);

CREATE TABLE oportunidade (
    id             VARCHAR(36)    NOT NULL PRIMARY KEY,
    tenant_id      VARCHAR(36)    NOT NULL,
    cliente_id     VARCHAR(36)    NOT NULL,
    titulo         VARCHAR(200)   NOT NULL,
    valor_estimado DECIMAL(18,2)  NOT NULL DEFAULT 0,
    estagio        VARCHAR(20)    NOT NULL,      -- LEAD/QUALIFICADO/PROPOSTA/GANHO/PERDIDO
    criado_em      TIMESTAMP      NOT NULL,
    atualizado_em  TIMESTAMP      NOT NULL,
    CONSTRAINT fk_oportunidade_cliente FOREIGN KEY (cliente_id) REFERENCES cliente (id)
);
CREATE INDEX ix_oportunidade_tenant ON oportunidade (tenant_id);
