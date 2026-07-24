-- V2 — Identidade e Acesso (etapa 036)
-- Usuários por tenant com perfil (RBAC). Portável entre H2 (modo PostgreSQL) e
-- PostgreSQL. A senha é guardada apenas como hash (BCrypt) — nunca em claro.

CREATE TABLE usuario (
    id         VARCHAR(36)  NOT NULL PRIMARY KEY,
    tenant_id  VARCHAR(36)  NOT NULL,
    nome       VARCHAR(200) NOT NULL,
    email      VARCHAR(200) NOT NULL,
    senha_hash VARCHAR(100) NOT NULL,
    perfil     VARCHAR(30)  NOT NULL,
    ativo      BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em  TIMESTAMP    NOT NULL,
    CONSTRAINT fk_usuario_tenant FOREIGN KEY (tenant_id) REFERENCES empresa (id)
);
-- E-mail é a identidade de login (único na plataforma, no walking skeleton).
CREATE UNIQUE INDEX ux_usuario_email ON usuario (email);
CREATE INDEX ix_usuario_tenant ON usuario (tenant_id);
