-- =============================================================================
-- Teste da Fase 4: ficha técnica, baixa em cascata, custo real e alertas
--
-- Roda após 0001–0003 no mesmo banco (reusa a Pizzaria do Diego).
--   psql -f supabase/tests/0004_estoque_inteligente.sql
-- =============================================================================

\set ON_ERROR_STOP on
\set QUIET 1

set role authenticated;
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';  -- Diego, proprietário

select id as t_pizza from public.tenants where slug = 'pizzaria-diego' \gset
select set_config('test.t_pizza', :'t_pizza', false) \g /dev/null
select b.id as b_matriz from public.branches b where b.tenant_id = :'t_pizza'::uuid and b.matriz \gset
select set_config('test.b_matriz', :'b_matriz', false) \g /dev/null

-- ---------------------------------------------------------------------------
-- Massa: insumos e composto "Soda Italiana" (exemplo literal do briefing)
-- ---------------------------------------------------------------------------
insert into public.products (tenant_id, nome, tipo, unidade, custo, preco_venda) values
  (:'t_pizza'::uuid, 'Xarope de Morango', 'insumo', 'ml', 0,     0),
  (:'t_pizza'::uuid, 'Água com Gás',      'insumo', 'ml', 0.001, 0),
  (:'t_pizza'::uuid, 'Gelo',              'insumo', 'g',  0.002, 0),
  (:'t_pizza'::uuid, 'Copo 300ml',        'insumo', 'un', 0.50,  0),
  (:'t_pizza'::uuid, 'Tampa',             'insumo', 'un', 0.20,  0),
  (:'t_pizza'::uuid, 'Canudo',            'insumo', 'un', 0.10,  0),
  (:'t_pizza'::uuid, 'Batata Palito Congelada', 'insumo', 'g', 0.015, 0),
  (:'t_pizza'::uuid, 'Farinha de Trigo',  'insumo', 'g',  0.008, 0),
  (:'t_pizza'::uuid, 'Soda Italiana',     'composto', 'un', 0, 14.00),
  (:'t_pizza'::uuid, 'Porção de Batata',  'composto', 'un', 0, 22.00),
  (:'t_pizza'::uuid, 'Combo Soda + Batata', 'composto', 'un', 0, 32.00);

-- ids que o \gset consegue guardar de forma legível
select id as p_xarope  from public.products where tenant_id = :'t_pizza'::uuid and nome = 'Xarope de Morango' \gset
select id as p_agua    from public.products where tenant_id = :'t_pizza'::uuid and nome = 'Água com Gás' \gset
select id as p_gelo    from public.products where tenant_id = :'t_pizza'::uuid and nome = 'Gelo' \gset
select id as p_copo    from public.products where tenant_id = :'t_pizza'::uuid and nome = 'Copo 300ml' \gset
select id as p_tampa   from public.products where tenant_id = :'t_pizza'::uuid and nome = 'Tampa' \gset
select id as p_canudo  from public.products where tenant_id = :'t_pizza'::uuid and nome = 'Canudo' \gset
select id as p_batata  from public.products where tenant_id = :'t_pizza'::uuid and nome = 'Batata Palito Congelada' \gset
select id as p_farinha from public.products where tenant_id = :'t_pizza'::uuid and nome = 'Farinha de Trigo' \gset
select id as p_soda    from public.products where tenant_id = :'t_pizza'::uuid and nome = 'Soda Italiana' \gset
select id as p_porcao  from public.products where tenant_id = :'t_pizza'::uuid and nome = 'Porção de Batata' \gset
select id as p_combo   from public.products where tenant_id = :'t_pizza'::uuid and nome = 'Combo Soda + Batata' \gset

select set_config('test.p_xarope', :'p_xarope', false),
       set_config('test.p_agua',   :'p_agua',   false),
       set_config('test.p_gelo',   :'p_gelo',   false),
       set_config('test.p_copo',   :'p_copo',   false),
       set_config('test.p_soda',   :'p_soda',   false),
       set_config('test.p_farinha',:'p_farinha',false),
       set_config('test.p_combo',  :'p_combo',  false) \g /dev/null

-- ===========================================================================
-- 1. Entrada com conversão: fornecedor entrega 5 L, controle fica em ml
-- ===========================================================================
do $$
declare
  v_saldo numeric;
  v_custo numeric;
begin
  v_saldo := app.movimentar_estoque(
    current_setting('test.t_pizza')::uuid, current_setting('test.b_matriz')::uuid,
    current_setting('test.p_xarope')::uuid, 'compra', 5, 'l', 40.00, 'NF-001');

  if v_saldo <> 5000 then raise exception '5 L deveriam virar 5000 ml, saldo %', v_saldo; end if;

  select custo into v_custo from public.products where id = current_setting('test.p_xarope')::uuid;
  if v_custo <> 0.04 then raise exception 'Custo por ml deveria ser 0.04 (R$40/L), é %', v_custo; end if;

  raise notice 'OK  1 · compra de 5 L entra como 5000 ml e custo vira R$/ml';
end $$;

-- ===========================================================================
-- 2. Custo médio ponderado na segunda compra
-- ===========================================================================
do $$
declare v_custo numeric;
begin
  perform app.movimentar_estoque(
    current_setting('test.t_pizza')::uuid, current_setting('test.b_matriz')::uuid,
    current_setting('test.p_xarope')::uuid, 'compra', 5, 'l', 60.00, 'NF-002');

  select custo into v_custo from public.products where id = current_setting('test.p_xarope')::uuid;
  if v_custo <> 0.05 then
    raise exception 'Custo médio deveria ser 0.05 ((5000×0,04 + 5000×0,06)/10000), é %', v_custo;
  end if;
  raise notice 'OK  2 · custo médio ponderado: R$0,04 + R$0,06 → R$0,05/ml';
end $$;

-- ===========================================================================
-- 3. Ficha técnica e baixa em cascata (exemplo literal do briefing)
-- ===========================================================================
-- Estoques iniciais dos demais insumos
select app.movimentar_estoque(:'t_pizza'::uuid, :'b_matriz'::uuid, :'p_agua'::uuid,   'compra', 20, 'l')  \g /dev/null
select app.movimentar_estoque(:'t_pizza'::uuid, :'b_matriz'::uuid, :'p_gelo'::uuid,   'compra', 10, 'kg') \g /dev/null
select app.movimentar_estoque(:'t_pizza'::uuid, :'b_matriz'::uuid, :'p_copo'::uuid,   'compra', 200, 'un') \g /dev/null
select app.movimentar_estoque(:'t_pizza'::uuid, :'b_matriz'::uuid, :'p_tampa'::uuid,  'compra', 200, 'un') \g /dev/null
select app.movimentar_estoque(:'t_pizza'::uuid, :'b_matriz'::uuid, :'p_canudo'::uuid, 'compra', 200, 'un') \g /dev/null
select app.movimentar_estoque(:'t_pizza'::uuid, :'b_matriz'::uuid, :'p_batata'::uuid, 'compra', 12, 'kg') \g /dev/null

-- Ficha técnica da Soda Italiana
insert into public.recipes (product_id) values (:'p_soda'::uuid);
insert into public.recipe_items (product_id, insumo_id, qtd, unidade) values
  (:'p_soda'::uuid, :'p_xarope'::uuid,  50, 'ml'),
  (:'p_soda'::uuid, :'p_agua'::uuid,   150, 'ml'),
  (:'p_soda'::uuid, :'p_gelo'::uuid,   100, 'g'),
  (:'p_soda'::uuid, :'p_copo'::uuid,     1, 'un'),
  (:'p_soda'::uuid, :'p_tampa'::uuid,    1, 'un'),
  (:'p_soda'::uuid, :'p_canudo'::uuid,   1, 'un');

-- Porção de Batata: 400 g de batata congelada
insert into public.recipes (product_id) values (:'p_porcao'::uuid);
insert into public.recipe_items (product_id, insumo_id, qtd, unidade) values
  (:'p_porcao'::uuid, :'p_batata'::uuid, 400, 'g');

-- Combo: 1 soda + 1 porção (composto de compostos)
insert into public.recipes (product_id) values (:'p_combo'::uuid);
insert into public.recipe_items (product_id, insumo_id, qtd, unidade) values
  (:'p_combo'::uuid, :'p_soda'::uuid,   1, 'un'),
  (:'p_combo'::uuid, :'p_porcao'::uuid, 1, 'un');

select app.baixar_em_cascata(:'t_pizza'::uuid, :'b_matriz'::uuid, :'p_soda'::uuid, 1, 'venda', 'VENDA-TESTE-1') \g /dev/null

do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_saldo numeric;
begin
  select saldo into v_saldo from public.stock_levels
  where tenant_id = v_t and product_id = current_setting('test.p_xarope')::uuid;
  if v_saldo <> 9950 then raise exception 'Xarope deveria ter 9950 ml, tem %', v_saldo; end if;

  select saldo into v_saldo from public.stock_levels
  where tenant_id = v_t and product_id = current_setting('test.p_agua')::uuid;
  if v_saldo <> 19850 then raise exception 'Água deveria ter 19850 ml, tem %', v_saldo; end if;

  select saldo into v_saldo from public.stock_levels
  where tenant_id = v_t and product_id = current_setting('test.p_gelo')::uuid;
  if v_saldo <> 9900 then raise exception 'Gelo deveria ter 9900 g, tem %', v_saldo; end if;

  select saldo into v_saldo from public.stock_levels
  where tenant_id = v_t and product_id = current_setting('test.p_copo')::uuid;
  if v_saldo <> 199 then raise exception 'Copo deveria ter 199 un, tem %', v_saldo; end if;

  raise notice 'OK  3 · vender 1 Soda baixou xarope 50 ml, água 150 ml, gelo 100 g e copo/tampa/canudo';
end $$;

-- ===========================================================================
-- 4. Venda de 3 unidades: proporcional
-- ===========================================================================
select app.baixar_em_cascata(:'t_pizza'::uuid, :'b_matriz'::uuid, :'p_soda'::uuid, 3, 'venda', 'VENDA-TESTE-2') \g /dev/null

do $$
declare v_saldo numeric;
begin
  select saldo into v_saldo from public.stock_levels
  where tenant_id = current_setting('test.t_pizza')::uuid
    and product_id = current_setting('test.p_xarope')::uuid;
  if v_saldo <> 9800 then raise exception 'Xarope deveria ter 9800 ml após 4 sodas, tem %', v_saldo; end if;
  raise notice 'OK  4 · vender 3 sodas baixa 150 ml de xarope (proporcional)';
end $$;

-- ===========================================================================
-- 5. Composto de composto: combo baixa a cadeia inteira
-- ===========================================================================
do $$
declare v_saldo numeric; v_t uuid := current_setting('test.t_pizza')::uuid;
begin
  perform app.baixar_em_cascata(v_t, current_setting('test.b_matriz')::uuid,
    current_setting('test.p_combo')::uuid, 1, 'venda', 'VENDA-TESTE-3');

  select saldo into v_saldo from public.stock_levels
  where tenant_id = v_t and product_id = current_setting('test.p_xarope')::uuid;
  if v_saldo <> 9750 then raise exception 'Combo não baixou o xarope da soda (%)', v_saldo; end if;

  select sl.saldo into v_saldo from public.stock_levels sl
  join public.products p on p.id = sl.product_id
  where sl.tenant_id = v_t and p.nome = 'Batata Palito Congelada';
  if v_saldo <> 11600 then raise exception 'Combo não baixou 400 g de batata (%)', v_saldo; end if;

  raise notice 'OK  5 · combo (composto de compostos) baixa a cadeia inteira';
end $$;

-- ===========================================================================
-- 6. Custo real da ficha e precificação inteligente
-- ===========================================================================
do $$
declare
  v_custo numeric;
  v_sug record;
begin
  -- xarope 50×0,05 + água 150×0,001 + gelo 100×0,002 + copo 0,50 + tampa 0,20 + canudo 0,10
  v_custo := app.custo_produto(current_setting('test.p_soda')::uuid);
  if round(v_custo, 4) <> 3.6500 then
    raise exception 'Custo real da soda deveria ser 3.65, é %', v_custo;
  end if;

  select * into v_sug from app.sugerir_preco(current_setting('test.p_soda')::uuid, 70);
  if v_sug.preco_sugerido <> round(3.65 / 0.30, 2) then
    raise exception 'Preço para margem de 70%% deveria ser %, é %', round(3.65/0.30, 2), v_sug.preco_sugerido;
  end if;
  if v_sug.margem_atual_pct <> round((14.00 - 3.65) / 14.00 * 100, 2) then
    raise exception 'Margem atual incorreta: %', v_sug.margem_atual_pct;
  end if;

  raise notice 'OK  6 · custo real R$3,65 pela ficha; preço sugerido e margem atual corretos';
end $$;

-- ===========================================================================
-- 7. Permissões: caixa não movimenta; ajuste exige estoque.ajustar;
--    escrita direta em stock_moves é barrada
-- ===========================================================================
set request.jwt.claim.sub = '55555555-5555-5555-5555-555555555555';  -- Elisa, caixa

do $$
declare
  v_falhou boolean := false;
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_b uuid := current_setting('test.b_matriz')::uuid;
  v_p uuid := current_setting('test.p_gelo')::uuid;
begin
  begin
    perform app.movimentar_estoque(v_t, v_b, v_p, 'perda', 100, 'g');
  exception when insufficient_privilege then v_falhou := true;
  end;
  if not v_falhou then raise exception 'Caixa movimentou estoque sem permissão'; end if;

  v_falhou := false;
  begin
    insert into public.stock_moves (tenant_id, branch_id, product_id, tipo, qtd_informada, unidade_informada, qtd_base)
    values (v_t, v_b, v_p, 'ajuste', 1, 'g', 1);
  exception when others then v_falhou := true;
  end;
  if not v_falhou then raise exception 'Insert direto em stock_moves passou'; end if;

  raise notice 'OK  7 · caixa não movimenta estoque e o histórico não aceita escrita direta';
end $$;

set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

-- ===========================================================================
-- 8. Perda, desperdício e ajuste registrados com o tipo certo
-- ===========================================================================
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_b uuid := current_setting('test.b_matriz')::uuid;
  v_gelo uuid := current_setting('test.p_gelo')::uuid;
  v_saldo numeric; v_n int;
begin
  perform app.movimentar_estoque(v_t, v_b, v_gelo, 'perda', 500, 'g', null, null, 'degelo do freezer');
  perform app.movimentar_estoque(v_t, v_b, v_gelo, 'desperdicio', 100, 'g');
  v_saldo := app.movimentar_estoque(v_t, v_b, v_gelo, 'ajuste', 200, 'g', null, null, 'inventário', true);

  -- 10000 − 500 (5 sodas vendidas, incluindo a do combo) − 500 − 100 − 200
  if v_saldo <> 8700 then raise exception 'Saldo do gelo deveria ser 8700 g, é %', v_saldo; end if;

  select count(distinct tipo) into v_n from public.stock_moves
  where tenant_id = v_t and product_id = v_gelo;
  if v_n < 4 then raise exception 'Esperados 4+ tipos de movimento no gelo, há %', v_n; end if;

  raise notice 'OK  8 · perda, desperdício e ajuste de inventário no histórico, com saldo correto';
end $$;

-- ===========================================================================
-- 9. Alertas: mínimo, fornecedor sugerido e previsão de ruptura
-- ===========================================================================
-- Fornecedor preferencial do xarope
insert into public.product_suppliers (product_id, supplier_id, preferencial, ultimo_preco)
select :'p_xarope'::uuid, s.id, true, 40.00
from public.suppliers s
where s.tenant_id = :'t_pizza'::uuid and s.razao_social = 'Distribuidora de Bebidas SA';

-- Mínimo do xarope acima do saldo atual (9750): alerta de mínimo
update public.stock_levels
set minimo = 12000
where tenant_id = :'t_pizza'::uuid and product_id = :'p_xarope'::uuid;

-- Farinha: 3.7 kg comprados, 3 kg consumidos em 30 dias → acaba em ~7 dias
select app.movimentar_estoque(:'t_pizza'::uuid, :'b_matriz'::uuid, :'p_farinha'::uuid, 'compra', 3.7, 'kg') \g /dev/null
select app.movimentar_estoque(:'t_pizza'::uuid, :'b_matriz'::uuid, :'p_farinha'::uuid, 'consumo_interno', 3, 'kg') \g /dev/null

do $$
declare v_alerta record; v_ok_minimo boolean := false; v_ok_ruptura boolean := false;
begin
  for v_alerta in
    select * from app.alertas_estoque(current_setting('test.t_pizza')::uuid)
  loop
    if v_alerta.product_id = current_setting('test.p_xarope')::uuid then
      if v_alerta.situacao <> 'abaixo_do_minimo' then
        raise exception 'Xarope deveria estar abaixo do mínimo, está %', v_alerta.situacao;
      end if;
      if v_alerta.fornecedor is distinct from 'Distribuidora de Bebidas SA' then
        raise exception 'Fornecedor sugerido do xarope errado: %', v_alerta.fornecedor;
      end if;
      v_ok_minimo := true;
    elsif v_alerta.product_id = current_setting('test.p_farinha')::uuid then
      if v_alerta.dias_restantes is null or v_alerta.dias_restantes > 7.5 then
        raise exception 'Farinha deveria acabar em ~7 dias, deu %', v_alerta.dias_restantes;
      end if;
      v_ok_ruptura := true;
    end if;
  end loop;

  if not v_ok_minimo  then raise exception 'Alerta de mínimo do xarope não apareceu'; end if;
  if not v_ok_ruptura then raise exception 'Previsão de ruptura da farinha não apareceu'; end if;

  raise notice 'OK  9 · alertas: abaixo do mínimo com fornecedor sugerido e "acaba em ~7 dias"';
end $$;

-- ===========================================================================
-- 10. Isolamento: outro tenant não vê estoque nem movimentos
-- ===========================================================================
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';  -- Ana
do $$
declare v_n int; v_t uuid := current_setting('test.t_pizza')::uuid;
begin
  select count(*) into v_n from public.stock_moves where tenant_id = v_t;
  if v_n <> 0 then raise exception 'VAZAMENTO: Ana vê % movimentos da pizzaria', v_n; end if;
  select count(*) into v_n from public.stock_levels where tenant_id = v_t;
  if v_n <> 0 then raise exception 'VAZAMENTO: Ana vê % saldos da pizzaria', v_n; end if;
  raise notice 'OK 10 · estoque isolado por tenant';
end $$;

reset role;

\echo ''
\echo '================================================'
\echo ' 10/10 asserções passaram · Fase 4 (estoque) ok'
\echo '================================================'
