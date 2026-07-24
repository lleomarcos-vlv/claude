-- V11 — Correções Conlor (fluxo com aprovações, chamados, financeiro de peças, auditoria)
-- 1) OS: protocolo, diagnóstico, mão de obra e origem do chamado
-- 2) Peça: custo de compra (base de margem/lucro no financeiro de peças)
-- 3) Observações/Sugestões da OS
-- 4) Auditoria: IP e tela/menu de origem da ação

-- OS: campos do novo fluxo
ALTER TABLE ordem_servico ADD COLUMN protocolo VARCHAR(30);
ALTER TABLE ordem_servico ADD COLUMN diagnostico VARCHAR(2000);
ALTER TABLE ordem_servico ADD COLUMN mao_de_obra DECIMAL(18,2) NOT NULL DEFAULT 0;
ALTER TABLE ordem_servico ADD COLUMN origem VARCHAR(30);
UPDATE ordem_servico SET protocolo = numero WHERE protocolo IS NULL;

-- Peça: custo de compra
ALTER TABLE item_estoque ADD COLUMN custo DECIMAL(18,2) NOT NULL DEFAULT 0;

-- Observações / Sugestões da OS (comentários internos; visíveis ao cliente quando marcadas)
CREATE TABLE ordem_servico_observacao (
    id               VARCHAR(36)   NOT NULL PRIMARY KEY,
    tenant_id        VARCHAR(36)   NOT NULL,
    ordem_servico_id VARCHAR(36)   NOT NULL,
    autor_id         VARCHAR(36),
    autor_nome       VARCHAR(200),
    texto            VARCHAR(2000) NOT NULL,
    visivel_cliente  BOOLEAN       NOT NULL DEFAULT FALSE,
    criado_em        TIMESTAMP     NOT NULL
);
CREATE INDEX ix_os_observacao_os ON ordem_servico_observacao (ordem_servico_id, criado_em);

-- Auditoria: IP e tela/menu de origem
ALTER TABLE evento_auditoria ADD COLUMN ip VARCHAR(60);
ALTER TABLE evento_auditoria ADD COLUMN tela VARCHAR(120);
