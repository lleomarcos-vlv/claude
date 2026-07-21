-- V1 — Esquema inicial do núcleo do Drone Kairós ERP (Fase 3, walking skeleton)
-- Portável entre H2 (modo PostgreSQL) e PostgreSQL. IDs são UUID (VARCHAR(36))
-- gerados no domínio. Multiempresa via coluna tenant_id em cada agregado.

-- Tenancy -------------------------------------------------------------------
CREATE TABLE empresa (
    id         VARCHAR(36)  NOT NULL PRIMARY KEY,
    nome       VARCHAR(200) NOT NULL,
    documento  VARCHAR(40)  NOT NULL,
    ativo      BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em  TIMESTAMP    NOT NULL
);
CREATE UNIQUE INDEX ux_empresa_documento ON empresa (documento);

-- Equipamento (âncora: Serial Number) --------------------------------------
CREATE TABLE equipamento (
    id            VARCHAR(36)  NOT NULL PRIMARY KEY,
    tenant_id     VARCHAR(36)  NOT NULL,
    serial_number VARCHAR(100) NOT NULL,
    modelo        VARCHAR(120) NOT NULL,
    fabricante    VARCHAR(120),
    status        VARCHAR(30)  NOT NULL,
    criado_em     TIMESTAMP    NOT NULL,
    CONSTRAINT fk_equipamento_tenant FOREIGN KEY (tenant_id) REFERENCES empresa (id)
);
-- Serial Number é identidade UNIVERSAL do equipamento (único globalmente).
CREATE UNIQUE INDEX ux_equipamento_serial ON equipamento (serial_number);
CREATE INDEX ix_equipamento_tenant ON equipamento (tenant_id);

-- Histórico vitalício por equipamento (append-only) ------------------------
CREATE TABLE equipamento_evento (
    id             VARCHAR(36)   NOT NULL PRIMARY KEY,
    equipamento_id VARCHAR(36)   NOT NULL,
    tenant_id      VARCHAR(36)   NOT NULL,
    sequencia      BIGINT        NOT NULL,
    tipo           VARCHAR(50)   NOT NULL,
    descricao      VARCHAR(500),
    dados          VARCHAR(2000),
    ocorrido_em    TIMESTAMP     NOT NULL,
    CONSTRAINT fk_evento_equipamento FOREIGN KEY (equipamento_id) REFERENCES equipamento (id)
);
CREATE INDEX ix_evento_equipamento ON equipamento_evento (equipamento_id);

-- Estoque inteligente (KSI) -------------------------------------------------
CREATE TABLE item_estoque (
    id              VARCHAR(36)    NOT NULL PRIMARY KEY,
    tenant_id       VARCHAR(36)    NOT NULL,
    sku             VARCHAR(60)    NOT NULL,
    descricao       VARCHAR(200)   NOT NULL,
    saldo           DECIMAL(18,4)  NOT NULL DEFAULT 0,
    ponto_reposicao DECIMAL(18,4)  NOT NULL DEFAULT 0,
    criado_em       TIMESTAMP      NOT NULL,
    CONSTRAINT fk_item_tenant FOREIGN KEY (tenant_id) REFERENCES empresa (id)
);
CREATE UNIQUE INDEX ux_item_sku ON item_estoque (tenant_id, sku);

CREATE TABLE movimentacao_estoque (
    id          VARCHAR(36)    NOT NULL PRIMARY KEY,
    tenant_id   VARCHAR(36)    NOT NULL,
    item_id     VARCHAR(36)    NOT NULL,
    tipo        VARCHAR(20)    NOT NULL,
    quantidade  DECIMAL(18,4)  NOT NULL,
    origem      VARCHAR(80),
    criado_em   TIMESTAMP      NOT NULL,
    CONSTRAINT fk_mov_item FOREIGN KEY (item_id) REFERENCES item_estoque (id)
);
CREATE INDEX ix_mov_item ON movimentacao_estoque (item_id);

-- Ordem de Serviço ----------------------------------------------------------
CREATE TABLE ordem_servico (
    id             VARCHAR(36)  NOT NULL PRIMARY KEY,
    tenant_id      VARCHAR(36)  NOT NULL,
    numero         VARCHAR(30)  NOT NULL,
    equipamento_id VARCHAR(36)  NOT NULL,
    status         VARCHAR(30)  NOT NULL,
    descricao      VARCHAR(500),
    aberta_em      TIMESTAMP    NOT NULL,
    concluida_em   TIMESTAMP,
    CONSTRAINT fk_os_equipamento FOREIGN KEY (equipamento_id) REFERENCES equipamento (id)
);
CREATE UNIQUE INDEX ux_os_numero ON ordem_servico (tenant_id, numero);
CREATE INDEX ix_os_equipamento ON ordem_servico (equipamento_id);

CREATE TABLE ordem_servico_item (
    id                VARCHAR(36)    NOT NULL PRIMARY KEY,
    ordem_servico_id  VARCHAR(36)    NOT NULL,
    item_id           VARCHAR(36)    NOT NULL,
    quantidade        DECIMAL(18,4)  NOT NULL,
    CONSTRAINT fk_osi_os   FOREIGN KEY (ordem_servico_id) REFERENCES ordem_servico (id),
    CONSTRAINT fk_osi_item FOREIGN KEY (item_id)          REFERENCES item_estoque (id)
);
CREATE INDEX ix_osi_os ON ordem_servico_item (ordem_servico_id);
