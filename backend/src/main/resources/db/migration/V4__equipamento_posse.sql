-- V4 — Posse/custódia do equipamento (RF-022)
-- Detentor atual da posse (fabricante → revenda → cliente). O histórico de
-- transferências vive no histórico vitalício (equipamento_evento, tipo TRANSFERENCIA).

ALTER TABLE equipamento ADD COLUMN posse_tipo VARCHAR(30);
ALTER TABLE equipamento ADD COLUMN posse_nome VARCHAR(200);
