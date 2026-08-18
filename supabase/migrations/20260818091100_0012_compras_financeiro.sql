-- =============================================================================
-- 0012 · Compras e financeiro (Fase 6, itens 13, 15, 36–38)
--
-- Compras: pedido com 6 status (rascunho → recebido) e recebimento que dá
-- entrada no estoque com custo — o custo médio da Fase 4 acontece aqui.
--
-- Financeiro: contas a pagar/receber (com parcelamento), categorias, centros
-- de custo, contas bancárias, fluxo de caixa e DRE gerencial. O CMV do DRE
-- usa o custo CONGELADO no fechamento da venda (sale_items.custo_unitario),
-- não o custo atual do produto — DRE não muda quando o custo de reposição
-- muda depois.
-- =============================================================================

create type app.status_compra as enum
  ('rascunho', 'enviado', 'confirmado', 'em_transito', 'recebido_parcial', 'recebido', 'cancelado');
create type app.tipo_conta as enum ('pagar', 'receber');
create type app.status_conta as enum ('aberta', 'paga', 'cancelada');

-- CMV honesto: custo do momento da venda, congelado no item.
alter table public.sale_items
  add column custo_unitario numeric(16,6) not null default 0;

-- -----------------------------------------------------------------------------
-- Compras
-- -----------------------------------------------------------------------------
create table public.purchase_orders (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id)   on delete cascade,
  branch_id     uuid not null references public.branches(id)  on delete cascade,
  supplier_id   uuid not null references public.suppliers(id) on delete restrict,
  numero        bigint not null,
  status        app.status_compra not null default 'rascunho',
  total         numeric(14,2) not null default 0,
  observacao    text,
  chave_nfe     text,                 -- preenchida quando o pedido nasce de um XML
  criado_por    uuid references public.profiles(id) on delete set null,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (tenant_id, numero)
);

create table public.purchase_order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.purchase_orders(id) on delete cascade,
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  product_id     uuid not null references public.products(id),
  qtd            numeric(14,4) not null check (qtd > 0),
  unidade        text not null references public.units(chave),
  custo_unitario numeric(16,6) not null check (custo_unitario >= 0),
  qtd_recebida   numeric(14,4) not null default 0 check (qtd_recebida >= 0)
);

create index on public.purchase_orders (tenant_id, status);
create index on public.purchase_order_items (order_id);

create trigger trg_po_atualizado before update on public.purchase_orders
  for each row execute function app.fn_atualizado_em();
create trigger trg_audit_po after insert or update or delete on public.purchase_orders
  for each row execute function app.fn_auditoria();

-- -----------------------------------------------------------------------------
-- Financeiro: categorias, centros de custo, contas bancárias, taxas
-- -----------------------------------------------------------------------------
create table public.finance_categories (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nome      text not null,
  tipo      app.tipo_conta not null,      -- pagar = despesa, receber = receita
  unique (tenant_id, nome, tipo)
);

create table public.cost_centers (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nome      text not null,
  unique (tenant_id, nome)
);

create table public.bank_accounts (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  nome          text not null,
  tipo          text not null default 'corrente'
                check (tipo in ('caixa', 'corrente', 'poupanca', 'digital')),
  saldo_inicial numeric(14,2) not null default 0,
  ativa         boolean not null default true,
  unique (tenant_id, nome)
);

-- Taxa por forma de pagamento (cartão etc.) — usada no DRE.
create table public.payment_fees (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  forma     app.forma_pagamento not null,
  taxa_pct  numeric(5,2) not null check (taxa_pct >= 0 and taxa_pct < 100),
  primary key (tenant_id, forma)
);

-- -----------------------------------------------------------------------------
-- Contas a pagar e a receber
-- -----------------------------------------------------------------------------
create table public.finance_entries (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  tipo            app.tipo_conta not null,
  descricao       text not null,
  valor           numeric(14,2) not null check (valor > 0),
  vencimento      date not null,
  status          app.status_conta not null default 'aberta',
  categoria_id    uuid references public.finance_categories(id) on delete set null,
  cost_center_id  uuid references public.cost_centers(id)       on delete set null,
  supplier_id     uuid references public.suppliers(id)          on delete set null,
  customer_id     uuid references public.customers(id)          on delete set null,
  sale_id         uuid references public.sales(id)              on delete set null,
  purchase_id     uuid references public.purchase_orders(id)    on delete set null,
  -- Parcelamento: 2/5 = parcela 2 de 5, mesmo grupo.
  parcela         smallint not null default 1,
  total_parcelas  smallint not null default 1,
  grupo_parcelas  uuid,
  valor_pago      numeric(14,2),
  pago_em         date,
  bank_account_id uuid references public.bank_accounts(id) on delete set null,
  conciliada      boolean not null default false,
  criado_por      uuid references public.profiles(id) on delete set null,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

create index on public.finance_entries (tenant_id, tipo, status, vencimento);
create index on public.finance_entries (tenant_id, pago_em);

create trigger trg_fin_atualizado before update on public.finance_entries
  for each row execute function app.fn_atualizado_em();
create trigger trg_audit_fin after insert or update or delete on public.finance_entries
  for each row execute function app.fn_auditoria();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.purchase_orders      enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.finance_categories   enable row level security;
alter table public.cost_centers         enable row level security;
alter table public.bank_accounts        enable row level security;
alter table public.payment_fees         enable row level security;
alter table public.finance_entries      enable row level security;

create policy po_leitura on public.purchase_orders
  for select using (app.pode(tenant_id, 'compras.ver'));
create policy po_itens_leitura on public.purchase_order_items
  for select using (app.pode(tenant_id, 'compras.ver'));
-- Escrita de compras só pelas funções.

create policy fin_cat_leitura on public.finance_categories
  for select using (app.pode(tenant_id, 'financeiro.ver'));
create policy fin_cat_escrita on public.finance_categories
  for all using (app.pode(tenant_id, 'financeiro.criar'))
  with check    (app.pode(tenant_id, 'financeiro.criar'));

create policy cc_leitura on public.cost_centers
  for select using (app.pode(tenant_id, 'financeiro.ver'));
create policy cc_escrita on public.cost_centers
  for all using (app.pode(tenant_id, 'financeiro.criar'))
  with check    (app.pode(tenant_id, 'financeiro.criar'));

create policy banco_leitura on public.bank_accounts
  for select using (app.pode(tenant_id, 'financeiro.ver'));
create policy banco_escrita on public.bank_accounts
  for all using (app.pode(tenant_id, 'financeiro.criar'))
  with check    (app.pode(tenant_id, 'financeiro.criar'));

create policy taxas_leitura on public.payment_fees
  for select using (app.pode(tenant_id, 'financeiro.ver'));
create policy taxas_escrita on public.payment_fees
  for all using (app.pode(tenant_id, 'financeiro.criar'))
  with check    (app.pode(tenant_id, 'financeiro.criar'));

create policy contas_leitura on public.finance_entries
  for select using (app.pode(tenant_id, 'financeiro.ver'));
-- Lançar e baixar contas só pelas funções (regras de parcela e permissão).

-- -----------------------------------------------------------------------------
-- Compras: criar, mudar status, receber (entrada de estoque + conta a pagar)
-- -----------------------------------------------------------------------------
create or replace function app.criar_pedido_compra(
  p_tenant uuid, p_branch uuid, p_supplier uuid,
  p_itens jsonb,            -- [{"product_id": ..., "qtd": 10, "unidade": "cx", "custo_unitario": 55.0}]
  p_observacao text default null,
  p_chave_nfe text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_id    uuid;
  v_item  jsonb;
  v_total numeric := 0;
begin
  if not app.pode(p_tenant, 'compras.criar') then
    raise exception 'Sem permissão para criar pedido de compra.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.suppliers where id = p_supplier and tenant_id = p_tenant) then
    raise exception 'Fornecedor não pertence ao tenant.' using errcode = 'P0002';
  end if;
  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Pedido sem itens.' using errcode = '22023';
  end if;

  insert into public.purchase_orders (tenant_id, branch_id, supplier_id, numero, observacao, chave_nfe, criado_por)
  values (p_tenant, p_branch, p_supplier, app.proximo_numero(p_tenant, 'compra'),
          p_observacao, p_chave_nfe, auth.uid())
  returning id into v_id;

  for v_item in select * from jsonb_array_elements(p_itens) loop
    if not exists (select 1 from public.products
                   where id = (v_item ->> 'product_id')::uuid and tenant_id = p_tenant) then
      raise exception 'Produto do item não pertence ao tenant.' using errcode = 'P0002';
    end if;
    insert into public.purchase_order_items (order_id, tenant_id, product_id, qtd, unidade, custo_unitario)
    values (v_id, p_tenant,
            (v_item ->> 'product_id')::uuid,
            (v_item ->> 'qtd')::numeric,
            coalesce(v_item ->> 'unidade', 'un'),
            (v_item ->> 'custo_unitario')::numeric);
    v_total := v_total + (v_item ->> 'qtd')::numeric * (v_item ->> 'custo_unitario')::numeric;
  end loop;

  update public.purchase_orders set total = v_total where id = v_id;
  return v_id;
end $$;

create or replace function app.atualizar_status_compra(p_pedido uuid, p_status app.status_compra)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_po public.purchase_orders%rowtype;
  v_ordem constant text[] :=
    array['rascunho', 'enviado', 'confirmado', 'em_transito', 'recebido_parcial', 'recebido'];
begin
  select * into v_po from public.purchase_orders where id = p_pedido for update;
  if v_po.id is null then
    raise exception 'Pedido não encontrado.' using errcode = 'P0002';
  end if;
  if not app.pode(v_po.tenant_id, 'compras.criar') then
    raise exception 'Sem permissão em compras.' using errcode = '42501';
  end if;
  if p_status in ('recebido', 'recebido_parcial') then
    raise exception 'Recebimento passa por app.receber_compra.' using errcode = '22023';
  end if;
  if v_po.status in ('recebido', 'cancelado') then
    raise exception 'Pedido já encerrado.' using errcode = '55000';
  end if;
  if p_status <> 'cancelado'
     and array_position(v_ordem, p_status::text) < array_position(v_ordem, v_po.status::text) then
    raise exception 'Transição inválida: % → %.', v_po.status, p_status using errcode = '22023';
  end if;

  update public.purchase_orders set status = p_status where id = p_pedido;
end $$;

create or replace function app.receber_compra(
  p_pedido uuid,
  p_itens jsonb default null,          -- null = recebe tudo; senão [{"item_id": ..., "qtd": 5}]
  p_vencimento date default null       -- da conta a pagar; null = hoje + 28 dias
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_po      public.purchase_orders%rowtype;
  v_item    record;
  v_qtd     numeric;
  v_map     jsonb := '{}';
  v_e       jsonb;
  v_pendente boolean := false;
  v_valor_recebido numeric := 0;
begin
  select * into v_po from public.purchase_orders where id = p_pedido for update;
  if v_po.id is null then
    raise exception 'Pedido não encontrado.' using errcode = 'P0002';
  end if;
  if not app.pode(v_po.tenant_id, 'compras.aprovar') then
    raise exception 'Receber mercadoria exige compras.aprovar.' using errcode = '42501';
  end if;
  if v_po.status in ('recebido', 'cancelado', 'rascunho') then
    raise exception 'Pedido em status % não pode ser recebido.', v_po.status using errcode = '55000';
  end if;

  if p_itens is not null then
    for v_e in select * from jsonb_array_elements(p_itens) loop
      v_map := v_map || jsonb_build_object(v_e ->> 'item_id', v_e ->> 'qtd');
    end loop;
  end if;

  for v_item in
    select * from public.purchase_order_items where order_id = p_pedido for update
  loop
    v_qtd := case
      when p_itens is null then v_item.qtd - v_item.qtd_recebida
      else least(coalesce((v_map ->> v_item.id::text)::numeric, 0),
                 v_item.qtd - v_item.qtd_recebida)
    end;
    if v_qtd > 0 then
      perform app.movimentar_estoque(
        v_po.tenant_id, v_po.branch_id, v_item.product_id, 'compra',
        v_qtd, v_item.unidade, v_item.custo_unitario,
        'compra:' || v_po.numero, 'recebimento de mercadoria');
      update public.purchase_order_items
      set qtd_recebida = qtd_recebida + v_qtd where id = v_item.id;
      v_valor_recebido := v_valor_recebido + v_qtd * v_item.custo_unitario;
    end if;
    if v_item.qtd_recebida + greatest(v_qtd, 0) < v_item.qtd then
      v_pendente := true;
    end if;
  end loop;

  if v_valor_recebido = 0 then
    raise exception 'Nada a receber neste pedido.' using errcode = '55000';
  end if;

  update public.purchase_orders
  set status = case when v_pendente
                    then 'recebido_parcial'::app.status_compra
                    else 'recebido'::app.status_compra end
  where id = p_pedido;

  -- Conta a pagar do valor recebido.
  insert into public.finance_entries
    (tenant_id, tipo, descricao, valor, vencimento, supplier_id, purchase_id, criado_por)
  values
    (v_po.tenant_id, 'pagar',
     'Compra #' || v_po.numero || ' — ' ||
       (select coalesce(nome_fantasia, razao_social) from public.suppliers where id = v_po.supplier_id),
     round(v_valor_recebido, 2),
     coalesce(p_vencimento, current_date + 28),
     v_po.supplier_id, p_pedido, auth.uid());
end $$;

comment on function app.receber_compra is
  'Entrada de mercadoria: estoque sobe com custo (média ponderada) e nasce a conta a pagar.';

-- -----------------------------------------------------------------------------
-- Contas: lançar (com parcelamento) e baixar
-- -----------------------------------------------------------------------------
create or replace function app.lancar_conta(
  p_tenant uuid,
  p_tipo app.tipo_conta,
  p_descricao text,
  p_valor numeric,
  p_vencimento date,
  p_parcelas int default 1,
  p_categoria uuid default null,
  p_cost_center uuid default null,
  p_supplier uuid default null,
  p_customer uuid default null
)
returns setof uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_grupo uuid;
  v_valor_parcela numeric;
  v_resto numeric;
  i int;
  v_id uuid;
begin
  if not app.pode(p_tenant, 'financeiro.criar') then
    raise exception 'Sem permissão para lançar contas.' using errcode = '42501';
  end if;
  if p_valor is null or p_valor <= 0 then
    raise exception 'Valor deve ser positivo.' using errcode = '22023';
  end if;
  if p_parcelas < 1 or p_parcelas > 120 then
    raise exception 'Parcelas entre 1 e 120.' using errcode = '22023';
  end if;

  v_grupo := case when p_parcelas > 1 then gen_random_uuid() end;
  v_valor_parcela := trunc(p_valor / p_parcelas, 2);
  v_resto := p_valor - v_valor_parcela * p_parcelas;   -- vai na primeira parcela

  for i in 1..p_parcelas loop
    insert into public.finance_entries
      (tenant_id, tipo, descricao, valor, vencimento, parcela, total_parcelas,
       grupo_parcelas, categoria_id, cost_center_id, supplier_id, customer_id, criado_por)
    values
      (p_tenant, p_tipo,
       p_descricao || case when p_parcelas > 1 then format(' (%s/%s)', i, p_parcelas) else '' end,
       v_valor_parcela + case when i = 1 then v_resto else 0 end,
       (p_vencimento + make_interval(months => i - 1))::date,   -- vencimentos mensais
       i, p_parcelas, v_grupo, p_categoria, p_cost_center, p_supplier, p_customer, auth.uid())
    returning id into v_id;
    return next v_id;
  end loop;
end $$;

create or replace function app.baixar_conta(
  p_conta uuid,
  p_valor_pago numeric default null,    -- null = valor da conta
  p_bank_account uuid default null,
  p_data date default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare v_conta public.finance_entries%rowtype;
begin
  select * into v_conta from public.finance_entries where id = p_conta for update;
  if v_conta.id is null then
    raise exception 'Conta não encontrada.' using errcode = 'P0002';
  end if;
  if not app.pode(v_conta.tenant_id, 'financeiro.baixar') then
    raise exception 'Dar baixa exige financeiro.baixar.' using errcode = '42501';
  end if;
  if v_conta.status <> 'aberta' then
    raise exception 'Conta já está %.', v_conta.status using errcode = '55000';
  end if;
  if p_bank_account is not null and not exists (
    select 1 from public.bank_accounts
    where id = p_bank_account and tenant_id = v_conta.tenant_id
  ) then
    raise exception 'Conta bancária não pertence ao tenant.' using errcode = 'P0002';
  end if;

  update public.finance_entries
  set status = 'paga',
      valor_pago = coalesce(p_valor_pago, valor),
      pago_em = coalesce(p_data, current_date),
      bank_account_id = p_bank_account
  where id = p_conta;
end $$;

-- -----------------------------------------------------------------------------
-- Venda a prazo → conta a receber (complementa fechar_venda da Fase 5)
-- e custo congelado no item (CMV)
-- -----------------------------------------------------------------------------
create or replace function app.fn_venda_fechada()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare v_prazo numeric;
begin
  if new.status = 'fechada' and old.status <> 'fechada' then
    -- congela o custo de cada item no momento do fechamento
    update public.sale_items si
    set custo_unitario = app.custo_produto(si.product_id)
    where si.sale_id = new.id;

    -- pagamentos "prazo" viram conta a receber
    select coalesce(sum(valor), 0) into v_prazo
    from public.sale_payments where sale_id = new.id and forma = 'prazo';

    if v_prazo > 0 then
      insert into public.finance_entries
        (tenant_id, tipo, descricao, valor, vencimento, customer_id, sale_id, criado_por)
      values
        (new.tenant_id, 'receber', 'Venda #' || new.numero || ' (a prazo)',
         v_prazo, current_date + 28, new.customer_id, new.id, auth.uid());
    end if;
  end if;
  return new;
end $$;

create trigger trg_venda_fechada after update on public.sales
  for each row execute function app.fn_venda_fechada();

-- -----------------------------------------------------------------------------
-- Fluxo de caixa (item 36) — realizado por dia no período
-- -----------------------------------------------------------------------------
create or replace function app.fluxo_caixa(p_tenant uuid, p_de date, p_ate date)
returns table (dia date, entradas numeric, saidas numeric, saldo_dia numeric)
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  with mov as (
    -- vendas fechadas: pagamentos à vista entram no dia do fechamento
    select s.fechada_em::date as dia, p.valor as entrada, 0::numeric as saida
    from public.sale_payments p
    join public.sales s on s.id = p.sale_id
    where s.tenant_id = p_tenant and s.status = 'fechada'
      and p.forma <> 'prazo'
      and s.fechada_em::date between p_de and p_ate
    union all
    -- contas baixadas
    select f.pago_em, case when f.tipo = 'receber' then f.valor_pago else 0 end,
           case when f.tipo = 'pagar' then f.valor_pago else 0 end
    from public.finance_entries f
    where f.tenant_id = p_tenant and f.status = 'paga'
      and f.pago_em between p_de and p_ate
  )
  select dia, round(sum(entrada), 2), round(sum(saida), 2),
         round(sum(entrada) - sum(saida), 2)
  from mov
  where app.pode(p_tenant, 'financeiro.ver')
  group by dia
  order by dia;
$$;

-- -----------------------------------------------------------------------------
-- DRE gerencial (itens 36–38): receita, CMV congelado, taxas, despesas
-- -----------------------------------------------------------------------------
create or replace function app.dre(p_tenant uuid, p_de date, p_ate date)
returns table (linha text, valor numeric, ordem int)
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  with vendas as (
    select s.id, s.subtotal, s.desconto, s.acrescimo, s.taxa_entrega, s.total
    from public.sales s
    where s.tenant_id = p_tenant and s.status = 'fechada'
      and s.fechada_em::date between p_de and p_ate
  ),
  cmv as (
    select coalesce(sum(si.qtd * si.custo_unitario), 0) as v
    from public.sale_items si
    join vendas s on s.id = si.sale_id
    where not si.cancelado
  ),
  taxas as (
    select coalesce(sum(p.valor * f.taxa_pct / 100), 0) as v
    from public.sale_payments p
    join vendas s on s.id = p.sale_id
    join public.payment_fees f on f.tenant_id = p_tenant and f.forma = p.forma
  ),
  despesas as (
    select coalesce(sum(f.valor_pago), 0) as v
    from public.finance_entries f
    where f.tenant_id = p_tenant and f.tipo = 'pagar' and f.status = 'paga'
      and f.pago_em between p_de and p_ate
      and f.purchase_id is null      -- compra de estoque já está no CMV
  ),
  base as (
    select
      coalesce((select sum(subtotal) from vendas), 0)  as receita_bruta,
      coalesce((select sum(desconto) from vendas), 0)  as descontos,
      coalesce((select sum(total) from vendas), 0)     as receita_liquida,
      (select v from cmv)      as cmv,
      (select v from taxas)    as taxas,
      (select v from despesas) as despesas
  )
  select * from (
    select 'receita_bruta',  round(receita_bruta, 2),  1 from base
    union all select 'descontos',       round(descontos, 2),      2 from base
    union all select 'receita_liquida', round(receita_liquida, 2), 3 from base
    union all select 'cmv',             round(cmv, 2),            4 from base
    union all select 'margem_bruta',    round(receita_liquida - cmv, 2), 5 from base
    union all select 'taxas_cartao',    round(taxas, 2),          6 from base
    union all select 'despesas',        round(despesas, 2),       7 from base
    union all select 'resultado',
      round(receita_liquida - cmv - taxas - despesas, 2), 8 from base
  ) l (linha, valor, ordem)
  where app.pode(p_tenant, 'financeiro.ver')
  order by ordem;
$$;

comment on function app.dre is
  'DRE gerencial do período. CMV usa o custo congelado no fechamento de cada venda.';

-- Grants
revoke all on function app.criar_pedido_compra(uuid, uuid, uuid, jsonb, text, text) from public;
revoke all on function app.atualizar_status_compra(uuid, app.status_compra) from public;
revoke all on function app.receber_compra(uuid, jsonb, date) from public;
revoke all on function app.lancar_conta(uuid, app.tipo_conta, text, numeric, date, int, uuid, uuid, uuid, uuid) from public;
revoke all on function app.baixar_conta(uuid, numeric, uuid, date) from public;
revoke all on function app.fluxo_caixa(uuid, date, date) from public;
revoke all on function app.dre(uuid, date, date) from public;
grant execute on function app.criar_pedido_compra(uuid, uuid, uuid, jsonb, text, text) to public;
grant execute on function app.atualizar_status_compra(uuid, app.status_compra) to public;
grant execute on function app.receber_compra(uuid, jsonb, date) to public;
grant execute on function app.lancar_conta(uuid, app.tipo_conta, text, numeric, date, int, uuid, uuid, uuid, uuid) to public;
grant execute on function app.baixar_conta(uuid, numeric, uuid, date) to public;
grant execute on function app.fluxo_caixa(uuid, date, date) to public;
grant execute on function app.dre(uuid, date, date) to public;
