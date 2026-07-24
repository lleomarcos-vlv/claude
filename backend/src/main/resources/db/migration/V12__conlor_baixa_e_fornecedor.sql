-- V12 — Baixa de estoque na aprovação + fornecedor para reposição + login DEV
-- 1) Item da OS marca se já deu baixa no estoque (a baixa ocorre na aprovação)
-- 2) Peça de estoque ganha fornecedor sugerido para o pedido de reposição

ALTER TABLE ordem_servico_item ADD COLUMN baixado BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE item_estoque ADD COLUMN fornecedor VARCHAR(200);

-- OSs concluídas antes desta versão já baixaram o estoque na conclusão
UPDATE ordem_servico_item SET baixado = TRUE
 WHERE ordem_servico_id IN (SELECT id FROM ordem_servico WHERE status = 'CONCLUIDA');
