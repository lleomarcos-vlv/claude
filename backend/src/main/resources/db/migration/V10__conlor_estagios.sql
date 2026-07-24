-- V10 — Adaptação Conlor Drones (especificação oficial)
-- 1) Preço nas peças (gerador de orçamentos integrado ao estoque)
-- 2) OS por estágios: FILA_DE_ESPERA → ORCAMENTO → ESTAGIO_1 → ESTAGIO_2 → CONCLUIDA,
--    com técnico responsável, cliente vinculado e aprovações de orçamento
-- 3) Itens da OS com estágio (adicionais destacados) e preço congelado
-- 4) Agendamento autônomo do cliente (leads da gerência)

-- Preço de venda da peça (usado no orçamento)
ALTER TABLE item_estoque ADD COLUMN preco DECIMAL(18,2) NOT NULL DEFAULT 0;

-- OS: técnico responsável, cliente e aprovações
ALTER TABLE ordem_servico ADD COLUMN tecnico_id VARCHAR(36);
ALTER TABLE ordem_servico ADD COLUMN cliente_id VARCHAR(36);
ALTER TABLE ordem_servico ADD COLUMN orcamento_aprovado_em TIMESTAMP;
ALTER TABLE ordem_servico ADD COLUMN adicionais_aprovados_em TIMESTAMP;

-- Migra os status antigos para o novo fluxo
UPDATE ordem_servico SET status = 'FILA_DE_ESPERA' WHERE status IN ('ABERTA', 'EM_ANDAMENTO');

-- Itens da OS: estágio (1 = orçamento inicial; 2 = adicional pós-diagnóstico,
-- destacado para segunda aprovação) e preço unitário congelado no momento
ALTER TABLE ordem_servico_item ADD COLUMN estagio INT NOT NULL DEFAULT 1;
ALTER TABLE ordem_servico_item ADD COLUMN preco_unitario DECIMAL(18,2) NOT NULL DEFAULT 0;

-- Agendamento autônomo (jornada do cliente) / lead (jornada da gerência)
CREATE TABLE agendamento (
    id            VARCHAR(36)  NOT NULL PRIMARY KEY,
    tenant_id     VARCHAR(36)  NOT NULL,
    cliente_id    VARCHAR(36),
    nome_cliente  VARCHAR(200) NOT NULL,
    telefone      VARCHAR(40),
    serial_number VARCHAR(100) NOT NULL,
    modelo        VARCHAR(120) NOT NULL,
    data_hora     TIMESTAMP    NOT NULL,
    observacao    VARCHAR(500),
    status        VARCHAR(20)  NOT NULL,          -- SOLICITADO / CONFIRMADO / RECUSADO
    ordem_servico_id VARCHAR(36),
    criado_em     TIMESTAMP    NOT NULL
);
CREATE INDEX ix_agendamento_tenant ON agendamento (tenant_id, data_hora);
