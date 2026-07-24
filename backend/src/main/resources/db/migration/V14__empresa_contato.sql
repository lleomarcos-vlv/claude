-- V14 — Dados de contato da empresa (tenant)
-- Integra os dados reais do cliente (endereço, telefone, e-mail, site) ao
-- registro da empresa. Colunas opcionais: empresas antigas seguem válidas.

ALTER TABLE empresa ADD COLUMN email     VARCHAR(160);
ALTER TABLE empresa ADD COLUMN telefone  VARCHAR(40);
ALTER TABLE empresa ADD COLUMN endereco  VARCHAR(300);
ALTER TABLE empresa ADD COLUMN site      VARCHAR(200);
