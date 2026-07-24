-- V6 — Documentos anexados a equipamentos (etapa 052)
-- Notas fiscais, fotos e manuais vinculados ao Serial Number. O conteúdo é
-- guardado em base64 (coluna TEXT) para portabilidade total entre H2 e
-- PostgreSQL (evita as diferenças de tipos binários bytea/oid).

CREATE TABLE documento (
    id             VARCHAR(36)  NOT NULL PRIMARY KEY,
    tenant_id      VARCHAR(36)  NOT NULL,
    equipamento_id VARCHAR(36)  NOT NULL,
    nome           VARCHAR(255) NOT NULL,
    tipo_conteudo  VARCHAR(120) NOT NULL,
    tamanho        BIGINT       NOT NULL,
    conteudo_b64   TEXT         NOT NULL,
    criado_em      TIMESTAMP    NOT NULL,
    CONSTRAINT fk_documento_equipamento FOREIGN KEY (equipamento_id) REFERENCES equipamento (id)
);
CREATE INDEX ix_documento_equipamento ON documento (equipamento_id);
