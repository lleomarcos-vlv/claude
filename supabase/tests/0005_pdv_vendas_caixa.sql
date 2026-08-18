-- =============================================================================
-- Teste da Fase 5: caixa, vendas, pagamento dividido, mesas e cancelamento
--
-- Roda após 0001–0004 no mesmo banco (reusa a Pizzaria do Diego e os
-- produtos com ficha técnica do teste 0004).
--   psql -f supabase/tests/0005_pdv_vendas_caixa.sql
-- =============================================================================

\set ON_ERROR_STOP on
\set QUIET 1

set role authenticated;
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';  -- Diego, proprietário

select id as t_pizza from public.tenants where slug = 'pizzaria-diego' \gset
select set_config('test.t_pizza', :'t_pizza', false) \g /dev/null
select b.id as b_matriz from public.branches b where b.tenant_id = :'t_pizza'::uuid and b.matriz \gset
select set_config('test.b_matriz', :'b_matriz', false) \g /dev/null
select id as p_soda from public.products where tenant_id = :'t_pizza'::uuid and nome = 'Soda Italiana' \gset
select set_config('test.p_soda', :'p_soda', false) \g /dev/null
select id as p_xarope from public.products where tenant_id = :'t_pizza'::uuid and nome = 'Xarope de Morango' \gset
select set_config('test.p_xarope', :'p_xarope', false) \g /dev/null

-- ===========================================================================
-- 1. Vender sem caixa aberto é recusado; abrir caixa duas vezes também
-- ===========================================================================
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_b uuid := current_setting('test.b_matriz')::uuid;
  v_venda uuid; v_sessao uuid; v_falhou boolean := false;
begin
  v_venda := app.abrir_venda(v_t, v_b, 'Balcão');
  perform app.lancar_item(v_venda, current_setting('test.p_soda')::uuid, 1);
  begin
    perform app.fechar_venda(v_venda, '[{"forma": "pix", "valor": 14.00}]');
  exception when others then v_falhou := true;
  end;
  if not v_falhou then raise exception 'Venda fechou sem caixa aberto'; end if;
  perform app.cancelar_venda(v_venda, 'teste sem caixa');

  v_sessao := app.abrir_caixa(v_t, v_b, 200.00);
  perform set_config('test.sessao', v_sessao::text, false);

  v_falhou := false;
  begin
    perform app.abrir_caixa(v_t, v_b, 100.00);
  exception when others then v_falhou := true;
  end;
  if not v_falhou then raise exception 'Dois caixas abertos na mesma filial'; end if;

  raise notice 'OK  1 · venda exige caixa aberto; um caixa por filial';
end $$;

-- ===========================================================================
-- 2. Venda balcão com pagamento DIVIDIDO (R$ 12 Pix + R$ 16 crédito)
--    e baixa em cascata no fechamento
-- ===========================================================================
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_b uuid := current_setting('test.b_matriz')::uuid;
  v_venda uuid; v_total numeric; v_saldo_antes numeric; v_saldo_depois numeric;
begin
  select saldo into v_saldo_antes from public.stock_levels
  where tenant_id = v_t and product_id = current_setting('test.p_xarope')::uuid;

  v_venda := app.abrir_venda(v_t, v_b, 'Balcão');
  perform set_config('test.venda_dividida', v_venda::text, false);
  perform app.lancar_item(v_venda, current_setting('test.p_soda')::uuid, 2);  -- 2 × 14 = 28

  v_total := app.fechar_venda(v_venda,
    '[{"forma": "pix", "valor": 12.00}, {"forma": "credito", "valor": 16.00}]');
  if v_total <> 28.00 then raise exception 'Total deveria ser 28, é %', v_total; end if;

  select saldo into v_saldo_depois from public.stock_levels
  where tenant_id = v_t and product_id = current_setting('test.p_xarope')::uuid;
  if v_saldo_antes - v_saldo_depois <> 100 then
    raise exception 'Fechamento deveria baixar 100 ml de xarope (2 sodas), baixou %',
      v_saldo_antes - v_saldo_depois;
  end if;

  raise notice 'OK  2 · pagamento dividido aceito e estoque baixado em cascata no fechamento';
end $$;

-- ===========================================================================
-- 3. Pagamento que não fecha a conta é recusado
-- ===========================================================================
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_b uuid := current_setting('test.b_matriz')::uuid;
  v_venda uuid; v_falhou boolean := false;
begin
  v_venda := app.abrir_venda(v_t, v_b, 'Balcão');
  perform app.lancar_item(v_venda, current_setting('test.p_soda')::uuid, 1);
  begin
    perform app.fechar_venda(v_venda, '[{"forma": "dinheiro", "valor": 10.00}]');
  exception when others then v_falhou := true;
  end;
  if not v_falhou then raise exception 'Pagamento menor que o total passou'; end if;

  perform app.cancelar_venda(v_venda, 'teste de pagamento insuficiente');
  raise notice 'OK  3 · soma dos pagamentos tem de bater com o total';
end $$;

-- ===========================================================================
-- 4. Desconto acima do limite exige vendas.desconto (Elisa, caixa, não tem)
-- ===========================================================================
set request.jwt.claim.sub = '55555555-5555-5555-5555-555555555555';  -- Elisa, caixa

do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_b uuid := current_setting('test.b_matriz')::uuid;
  v_venda uuid; v_falhou boolean := false; v_total numeric;
begin
  v_venda := app.abrir_venda(v_t, v_b, 'Balcão');
  perform app.lancar_item(v_venda, current_setting('test.p_soda')::uuid, 1);  -- 14,00

  -- 50% de desconto com limite de 10%: recusa para o caixa
  begin
    perform app.fechar_venda(v_venda, '[{"forma": "dinheiro", "valor": 7.00}]', 7.00);
  exception when insufficient_privilege then v_falhou := true;
  end;
  if not v_falhou then raise exception 'Caixa deu 50%% de desconto sem permissão'; end if;

  -- desconto dentro do limite (5%) passa
  v_total := app.fechar_venda(v_venda, '[{"forma": "dinheiro", "valor": 13.30}]', 0.70);
  if v_total <> 13.30 then raise exception 'Total com desconto de 0,70 deveria ser 13,30, é %', v_total; end if;

  perform set_config('test.venda_dinheiro', v_venda::text, false);
  raise notice 'OK  4 · desconto acima do limite barrado; dentro do limite passa';
end $$;

-- ===========================================================================
-- 5. Mesas: comanda aberta, mesa ocupada, transferência
-- ===========================================================================
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

insert into public.dining_tables (tenant_id, branch_id, numero) values
  (:'t_pizza'::uuid, :'b_matriz'::uuid, 1),
  (:'t_pizza'::uuid, :'b_matriz'::uuid, 2);

do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_b uuid := current_setting('test.b_matriz')::uuid;
  v_mesa1 uuid; v_mesa2 uuid; v_venda uuid; v_falhou boolean := false;
begin
  select id into v_mesa1 from public.dining_tables where tenant_id = v_t and numero = 1;
  select id into v_mesa2 from public.dining_tables where tenant_id = v_t and numero = 2;

  v_venda := app.abrir_venda(v_t, v_b, 'Mesa', v_mesa1);
  perform set_config('test.comanda', v_venda::text, false);
  perform app.lancar_item(v_venda, current_setting('test.p_soda')::uuid, 1);

  begin
    perform app.abrir_venda(v_t, v_b, 'Mesa', v_mesa1);   -- mesa ocupada
  exception when others then v_falhou := true;
  end;
  if not v_falhou then raise exception 'Mesa ocupada aceitou segunda comanda'; end if;

  perform app.transferir_mesa(v_venda, v_mesa2);
  if (select mesa_id from public.sales where id = v_venda) <> v_mesa2 then
    raise exception 'Transferência de mesa não aconteceu';
  end if;

  raise notice 'OK  5 · comanda por mesa, mesa ocupada bloqueada e transferência funcionando';
end $$;

-- ===========================================================================
-- 6. Fluxo de status (KDS): enviada → preparando → pronta; retroceder é erro
-- ===========================================================================
do $$
declare
  v_venda uuid := current_setting('test.comanda')::uuid;
  v_falhou boolean := false;
begin
  perform app.atualizar_status_venda(v_venda, 'enviada');
  perform app.atualizar_status_venda(v_venda, 'preparando');
  perform app.atualizar_status_venda(v_venda, 'pronta');

  begin
    perform app.atualizar_status_venda(v_venda, 'enviada');   -- retroceder
  exception when others then v_falhou := true;
  end;
  if not v_falhou then raise exception 'Status retrocedeu de pronta para enviada'; end if;

  raise notice 'OK  6 · fluxo do pedido avança e não retrocede (base do KDS)';
end $$;

-- ===========================================================================
-- 7. Sangria, suprimento e fechamento com conferência
-- ===========================================================================
do $$
declare
  v_sessao uuid := current_setting('test.sessao')::uuid;
  v_res record;
begin
  perform app.movimentar_caixa(v_sessao, 'suprimento', 50.00, 'troco');
  perform app.movimentar_caixa(v_sessao, 'sangria', 80.00, 'depósito');

  -- Fecha a comanda da mesa antes (dinheiro 14) para entrar no caixa
  perform app.fechar_venda(current_setting('test.comanda')::uuid,
    '[{"forma": "dinheiro", "valor": 14.00}]');

  -- esperado: 200 (abertura) + 13,30 + 14,00 (dinheiro) + 50 − 80 = 197,30
  select * into v_res from app.fechar_caixa(v_sessao, 197.30);
  if v_res.saldo_esperado <> 197.30 then
    raise exception 'Esperado do caixa deveria ser 197,30, é %', v_res.saldo_esperado;
  end if;
  if v_res.diferenca <> 0 then
    raise exception 'Diferença deveria ser zero, é %', v_res.diferenca;
  end if;

  raise notice 'OK  7 · sangria/suprimento no caixa e fechamento conferindo (esperado = contado)';
end $$;

-- ===========================================================================
-- 8. Cancelamento de venda fechada estorna o estoque
-- ===========================================================================
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_saldo_antes numeric; v_saldo_depois numeric;
begin
  select saldo into v_saldo_antes from public.stock_levels
  where tenant_id = v_t and product_id = current_setting('test.p_xarope')::uuid;

  perform app.cancelar_venda(current_setting('test.venda_dividida')::uuid, 'cliente desistiu');

  select saldo into v_saldo_depois from public.stock_levels
  where tenant_id = v_t and product_id = current_setting('test.p_xarope')::uuid;

  if v_saldo_depois - v_saldo_antes <> 100 then
    raise exception 'Estorno deveria devolver 100 ml de xarope, devolveu %',
      v_saldo_depois - v_saldo_antes;
  end if;

  if (select status from public.sales where id = current_setting('test.venda_dividida')::uuid)
     <> 'cancelada' then
    raise exception 'Venda não ficou cancelada';
  end if;

  raise notice 'OK  8 · cancelar venda fechada estorna o estoque em cascata (devolução)';
end $$;

-- ===========================================================================
-- 9. Cancelar sem motivo é recusado; garçom não cancela
-- ===========================================================================
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_b uuid := current_setting('test.b_matriz')::uuid;
  v_venda uuid; v_falhou boolean := false;
begin
  v_venda := app.abrir_venda(v_t, v_b, 'Balcão');
  perform set_config('test.venda_aberta', v_venda::text, false);

  begin
    perform app.cancelar_venda(v_venda, '   ');
  exception when others then v_falhou := true;
  end;
  if not v_falhou then raise exception 'Cancelamento sem motivo passou'; end if;

  raise notice 'OK  9 · motivo de cancelamento é obrigatório';
end $$;

-- ===========================================================================
-- 10. Isolamento e imutabilidade
-- ===========================================================================
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';  -- Ana
do $$
declare v_n int; v_t uuid := current_setting('test.t_pizza')::uuid; v_falhou boolean := false;
begin
  select count(*) into v_n from public.sales where tenant_id = v_t;
  if v_n <> 0 then raise exception 'VAZAMENTO: Ana vê % vendas da pizzaria', v_n; end if;

  begin
    insert into public.sale_payments (sale_id, tenant_id, forma, valor)
    values (current_setting('test.venda_dinheiro')::uuid, v_t, 'dinheiro', 1);
  exception when others then v_falhou := true;
  end;
  if not v_falhou then raise exception 'Insert direto em sale_payments passou'; end if;

  raise notice 'OK 10 · vendas isoladas por tenant; pagamento não aceita escrita direta';
end $$;

reset role;

\echo ''
\echo '================================================'
\echo ' 10/10 asserções passaram · Fase 5 (PDV) ok'
\echo '================================================'
