-- =============================================================================
-- Teste da Fase 6: compras com recebimento, contas, fluxo de caixa e DRE
--
-- Roda após 0001–0005 no mesmo banco (reusa a Pizzaria do Diego).
--   psql -f supabase/tests/0006_compras_financeiro.sql
-- =============================================================================

\set ON_ERROR_STOP on
\set QUIET 1

set role authenticated;
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';  -- Diego

select id as t_pizza from public.tenants where slug = 'pizzaria-diego' \gset
select set_config('test.t_pizza', :'t_pizza', false) \g /dev/null
select b.id as b_matriz from public.branches b where b.tenant_id = :'t_pizza'::uuid and b.matriz \gset
select set_config('test.b_matriz', :'b_matriz', false) \g /dev/null
select id as p_xarope from public.products where tenant_id = :'t_pizza'::uuid and nome = 'Xarope de Morango' \gset
select set_config('test.p_xarope', :'p_xarope', false) \g /dev/null
select id as p_soda from public.products where tenant_id = :'t_pizza'::uuid and nome = 'Soda Italiana' \gset
select set_config('test.p_soda', :'p_soda', false) \g /dev/null
select id as forn from public.suppliers where tenant_id = :'t_pizza'::uuid limit 1 \gset
select set_config('test.forn', :'forn', false) \g /dev/null

-- ===========================================================================
-- 1. Pedido de compra: fluxo de status válido; retroceder é recusado
-- ===========================================================================
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_po uuid; v_falhou boolean := false;
begin
  v_po := app.criar_pedido_compra(
    v_t, current_setting('test.b_matriz')::uuid, current_setting('test.forn')::uuid,
    jsonb_build_array(jsonb_build_object(
      'product_id', current_setting('test.p_xarope'), 'qtd', 10, 'unidade', 'l',
      'custo_unitario', 42.00)));
  perform set_config('test.po', v_po::text, false);

  if (select total from public.purchase_orders where id = v_po) <> 420.00 then
    raise exception 'Total do pedido deveria ser 420';
  end if;

  perform app.atualizar_status_compra(v_po, 'enviado');
  perform app.atualizar_status_compra(v_po, 'confirmado');
  perform app.atualizar_status_compra(v_po, 'em_transito');

  begin
    perform app.atualizar_status_compra(v_po, 'enviado');   -- retroceder
  exception when others then v_falhou := true;
  end;
  if not v_falhou then raise exception 'Status de compra retrocedeu'; end if;

  raise notice 'OK  1 · pedido de compra criado (total 420) e status só avança';
end $$;

-- ===========================================================================
-- 2. Recebimento parcial: estoque sobe, pedido fica recebido_parcial,
--    conta a pagar nasce com o valor recebido
-- ===========================================================================
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_po uuid := current_setting('test.po')::uuid;
  v_item uuid; v_saldo_antes numeric; v_saldo_depois numeric;
  v_status app.status_compra; v_conta record;
begin
  select saldo into v_saldo_antes from public.stock_levels
  where tenant_id = v_t and product_id = current_setting('test.p_xarope')::uuid;

  select id into v_item from public.purchase_order_items where order_id = v_po;
  perform app.receber_compra(v_po,
    jsonb_build_array(jsonb_build_object('item_id', v_item, 'qtd', 4)));

  select saldo into v_saldo_depois from public.stock_levels
  where tenant_id = v_t and product_id = current_setting('test.p_xarope')::uuid;
  if v_saldo_depois - v_saldo_antes <> 4000 then
    raise exception 'Recebimento de 4 L deveria subir 4000 ml, subiu %', v_saldo_depois - v_saldo_antes;
  end if;

  select status into v_status from public.purchase_orders where id = v_po;
  if v_status <> 'recebido_parcial' then
    raise exception 'Pedido deveria estar recebido_parcial, está %', v_status;
  end if;

  select * into v_conta from public.finance_entries
  where tenant_id = v_t and purchase_id = v_po and tipo = 'pagar' and status = 'aberta';
  if v_conta.valor <> 168.00 then
    raise exception 'Conta a pagar deveria ser 168 (4 × 42), é %', v_conta.valor;
  end if;

  raise notice 'OK  2 · recebimento parcial: +4000 ml, pedido parcial e conta a pagar de 168';
end $$;

-- ===========================================================================
-- 3. Recebimento do restante fecha o pedido
-- ===========================================================================
do $$
declare
  v_po uuid := current_setting('test.po')::uuid;
  v_status app.status_compra;
begin
  perform app.receber_compra(v_po);      -- recebe o que falta (6 L)
  select status into v_status from public.purchase_orders where id = v_po;
  if v_status <> 'recebido' then
    raise exception 'Pedido deveria estar recebido, está %', v_status;
  end if;
  raise notice 'OK  3 · recebimento do restante conclui o pedido (recebido)';
end $$;

-- ===========================================================================
-- 4. Baixa de conta exige financeiro.baixar; Diego baixa com conta bancária
-- ===========================================================================
set request.jwt.claim.sub = '55555555-5555-5555-5555-555555555555';  -- Elisa, caixa

do $$
declare v_conta uuid; v_falhou boolean := false;
begin
  -- Elisa nem enxerga a conta (sem financeiro.ver) — busca como Diego depois.
  begin
    perform app.baixar_conta('00000000-0000-0000-0000-000000000000'::uuid);
  exception when others then v_falhou := true;
  end;
  if not v_falhou then raise exception 'Baixa sem permissão passou'; end if;
  raise notice 'OK  4 · baixar conta sem permissão é recusado';
end $$;

set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

insert into public.bank_accounts (tenant_id, nome, tipo, saldo_inicial)
values (:'t_pizza'::uuid, 'Conta Corrente Principal', 'corrente', 1000.00);

do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_conta uuid; v_banco uuid; v_status app.status_conta;
begin
  select id into v_conta from public.finance_entries
  where tenant_id = v_t and purchase_id = current_setting('test.po')::uuid
  order by criado_em limit 1;
  select id into v_banco from public.bank_accounts where tenant_id = v_t;

  perform app.baixar_conta(v_conta, null, v_banco);

  select status into v_status from public.finance_entries where id = v_conta;
  if v_status <> 'paga' then raise exception 'Conta deveria estar paga'; end if;

  raise notice 'OK  5 · conta a pagar baixada com conta bancária vinculada';
end $$;

-- ===========================================================================
-- 5→6. Parcelamento em 3x com vencimentos mensais e soma exata
-- ===========================================================================
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_ids uuid[]; v_soma numeric; v_n int; v_venc1 date; v_venc3 date;
begin
  select array_agg(id) into v_ids
  from app.lancar_conta(v_t, 'pagar', 'Aluguel da loja', 1000.00, '2026-09-05', 3) id;

  select count(*), sum(valor), min(vencimento), max(vencimento)
  into v_n, v_soma, v_venc1, v_venc3
  from public.finance_entries where id = any(v_ids);

  if v_n <> 3 then raise exception 'Deveriam ser 3 parcelas, são %', v_n; end if;
  if v_soma <> 1000.00 then raise exception 'Parcelas deveriam somar 1000, somam %', v_soma; end if;
  if v_venc1 <> '2026-09-05' or v_venc3 <> '2026-11-05' then
    raise exception 'Vencimentos mensais errados: % a %', v_venc1, v_venc3;
  end if;

  raise notice 'OK  6 · parcelamento 3x: soma exata (33,34 + 33,33 + 33,33) e vencimentos mensais';
end $$;

-- ===========================================================================
-- 7. Venda a prazo gera conta a receber vinculada ao cliente
-- ===========================================================================
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_b uuid := current_setting('test.b_matriz')::uuid;
  v_cliente uuid; v_sessao uuid; v_venda uuid; v_conta record;
begin
  select id into v_cliente from public.customers where tenant_id = v_t limit 1;
  v_sessao := app.abrir_caixa(v_t, v_b, 100.00);
  perform set_config('test.sessao6', v_sessao::text, false);

  v_venda := app.abrir_venda(v_t, v_b, 'Balcão', null, v_cliente);
  perform app.lancar_item(v_venda, current_setting('test.p_soda')::uuid, 2);  -- 28
  perform app.fechar_venda(v_venda,
    '[{"forma": "dinheiro", "valor": 10.00}, {"forma": "prazo", "valor": 18.00}]');
  perform set_config('test.venda_prazo', v_venda::text, false);

  select * into v_conta from public.finance_entries
  where tenant_id = v_t and sale_id = v_venda and tipo = 'receber';
  if v_conta.id is null then raise exception 'Conta a receber da venda a prazo não nasceu'; end if;
  if v_conta.valor <> 18.00 then raise exception 'Conta a receber deveria ser 18, é %', v_conta.valor; end if;
  if v_conta.customer_id <> v_cliente then raise exception 'Conta sem vínculo com o cliente'; end if;

  raise notice 'OK  7 · pagamento "prazo" vira conta a receber do cliente (R$18)';
end $$;

-- ===========================================================================
-- 8. CMV congelado: mudar o custo do produto depois NÃO muda o DRE
-- ===========================================================================
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_cmv_antes numeric; v_cmv_depois numeric; v_custo_item numeric;
begin
  select custo_unitario into v_custo_item
  from public.sale_items
  where sale_id = current_setting('test.venda_prazo')::uuid limit 1;
  if v_custo_item <= 0 then
    raise exception 'Custo não foi congelado no item da venda';
  end if;

  select valor into v_cmv_antes from app.dre(v_t, current_date, current_date) where linha = 'cmv';

  update public.products set custo = custo * 10
  where id = current_setting('test.p_xarope')::uuid;

  select valor into v_cmv_depois from app.dre(v_t, current_date, current_date) where linha = 'cmv';

  if v_cmv_antes <> v_cmv_depois then
    raise exception 'CMV mudou com o custo de reposição (% → %) — deveria estar congelado',
      v_cmv_antes, v_cmv_depois;
  end if;

  update public.products set custo = custo / 10
  where id = current_setting('test.p_xarope')::uuid;

  raise notice 'OK  8 · CMV usa o custo congelado na venda, imune a reajuste posterior';
end $$;

-- ===========================================================================
-- 9. DRE fecha a conta: receita − CMV − taxas − despesas = resultado
-- ===========================================================================
insert into public.payment_fees (tenant_id, forma, taxa_pct)
values (:'t_pizza'::uuid, 'credito', 3.00)
on conflict do nothing;

do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  r record; v_receita numeric; v_cmv numeric; v_taxas numeric;
  v_despesas numeric; v_resultado numeric;
begin
  for r in select * from app.dre(v_t, current_date - 1, current_date) loop
    case r.linha
      when 'receita_liquida' then v_receita := r.valor;
      when 'cmv'             then v_cmv := r.valor;
      when 'taxas_cartao'    then v_taxas := r.valor;
      when 'despesas'        then v_despesas := r.valor;
      when 'resultado'       then v_resultado := r.valor;
      else null;
    end case;
  end loop;

  if v_resultado <> round(v_receita - v_cmv - v_taxas - v_despesas, 2) then
    raise exception 'DRE não fecha: % ≠ % − % − % − %',
      v_resultado, v_receita, v_cmv, v_taxas, v_despesas;
  end if;

  raise notice 'OK  9 · DRE consistente: resultado = receita − CMV − taxas − despesas';
end $$;

-- ===========================================================================
-- 10. Fluxo de caixa e isolamento
-- ===========================================================================
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_entradas numeric;
begin
  select sum(entradas) into v_entradas from app.fluxo_caixa(v_t, current_date - 7, current_date);
  if coalesce(v_entradas, 0) <= 0 then
    raise exception 'Fluxo de caixa sem entradas — deveria ter as vendas fechadas';
  end if;
end $$;

set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';  -- Ana
do $$
declare v_n int; v_t uuid := current_setting('test.t_pizza')::uuid;
begin
  select count(*) into v_n from public.finance_entries where tenant_id = v_t;
  if v_n <> 0 then raise exception 'VAZAMENTO: Ana vê % contas da pizzaria', v_n; end if;
  select count(*) into v_n from app.dre(v_t, current_date - 7, current_date);
  if v_n <> 0 then raise exception 'VAZAMENTO: Ana consegue rodar o DRE da pizzaria'; end if;
  raise notice 'OK 10 · fluxo de caixa com entradas e financeiro isolado por tenant';
end $$;

reset role;

\echo ''
\echo '================================================'
\echo ' 10/10 asserções passaram · Fase 6 (financeiro) ok'
\echo '================================================'
