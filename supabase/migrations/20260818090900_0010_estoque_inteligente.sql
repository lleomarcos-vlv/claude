-- =============================================================================
-- 0010 · Estoque inteligente (Fase 4, itens 7–11, 37–39)
--
-- Regras de ouro:
--   · O saldo vive SEMPRE na unidade-base do tipo (g, ml, un) — a conversão
--     acontece na borda, nunca no acumulador. 5 L entram como 5000 ml.
--   · Movimentação só pelas funções (security definer). A tabela de movimentos
--     é imutável: sem policy de update/delete, histórico não se reescreve.
--   · Ficha técnica em cascata: vender 1 Soda Italiana baixa xarope 50 ml,
--     água 150 ml, gelo 100 g, copo, tampa e canudo — recursivo para
--     compostos dentro de compostos.
-- =============================================================================

create type app.tipo_movimento as enum (
  'venda', 'compra', 'perda', 'desperdicio', 'ajuste',
  'devolucao', 'transferencia', 'producao', 'consumo_interno'
);

-- -----------------------------------------------------------------------------
-- Ficha técnica (receita) — item 7
-- -----------------------------------------------------------------------------
create table public.recipes (
  product_id  uuid primary key references public.products(id) on delete cascade,
  -- Quantas unidades do produto a receita rende (bolo rende 12 fatias).
  rendimento  numeric(12,4) not null default 1 check (rendimento > 0),
  observacoes text,
  atualizado_em timestamptz not null default now()
);

create table public.recipe_items (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.recipes(product_id) on delete cascade,
  insumo_id  uuid not null references public.products(id) on delete restrict,
  qtd        numeric(14,4) not null check (qtd > 0),
  unidade    text not null references public.units(chave),
  -- Perda de preparo do insumo (5 = 5% a mais consumido do que a receita diz).
  perda_pct  numeric(5,2) not null default 0 check (perda_pct >= 0 and perda_pct < 100),
  unique (product_id, insumo_id),
  constraint recipe_sem_autorreferencia check (product_id <> insumo_id)
);

comment on table public.recipe_items is
  'Composição do produto. A baixa em cascata percorre esta tabela recursivamente.';

-- -----------------------------------------------------------------------------
-- Fornecedor por produto (alimenta o alerta de reposição — item 10)
-- -----------------------------------------------------------------------------
create table public.product_suppliers (
  product_id  uuid not null references public.products(id)  on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  preferencial boolean not null default false,
  ultimo_preco numeric(14,4),
  primary key (product_id, supplier_id)
);

create unique index product_suppliers_preferencial_unico
  on public.product_suppliers (product_id) where preferencial;

-- -----------------------------------------------------------------------------
-- Saldos e parâmetros de reposição — por filial
-- -----------------------------------------------------------------------------
create table public.stock_levels (
  tenant_id       uuid not null references public.tenants(id)  on delete cascade,
  branch_id       uuid not null references public.branches(id) on delete cascade,
  product_id      uuid not null references public.products(id) on delete cascade,
  saldo           numeric(18,6) not null default 0,   -- na unidade-base (g/ml/un)
  minimo          numeric(18,6),
  maximo          numeric(18,6),
  ponto_reposicao numeric(18,6),
  atualizado_em   timestamptz not null default now(),
  primary key (tenant_id, branch_id, product_id)
);

-- -----------------------------------------------------------------------------
-- Movimentações — os 9 tipos do briefing; qtd_base com sinal (saída negativa)
-- -----------------------------------------------------------------------------
create table public.stock_moves (
  id             bigserial primary key,
  tenant_id      uuid not null references public.tenants(id)  on delete cascade,
  branch_id      uuid not null references public.branches(id) on delete cascade,
  product_id     uuid not null references public.products(id) on delete cascade,
  tipo           app.tipo_movimento not null,
  qtd_informada  numeric(18,6) not null,
  unidade_informada text not null references public.units(chave),
  qtd_base       numeric(18,6) not null check (qtd_base <> 0),
  custo_unitario numeric(16,6),          -- por unidade-base, quando entrada
  referencia     text,                   -- id da venda/compra que originou
  observacao     text,
  criado_por     uuid references public.profiles(id) on delete set null,
  criado_em      timestamptz not null default now()
);

create index on public.stock_moves (tenant_id, branch_id, product_id, criado_em desc);
create index on public.stock_moves (tenant_id, tipo, criado_em desc);

comment on table public.stock_moves is
  'Histórico imutável de movimentação. qtd_base na unidade-base do produto, com sinal.';

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.recipes           enable row level security;
alter table public.recipe_items      enable row level security;
alter table public.product_suppliers enable row level security;
alter table public.stock_levels      enable row level security;
alter table public.stock_moves       enable row level security;

create policy recipes_leitura on public.recipes
  for select using (
    exists (select 1 from public.products p
            where p.id = recipes.product_id and app.pode(p.tenant_id, 'catalogo.ver'))
  );
create policy recipes_escrita on public.recipes
  for all using (
    exists (select 1 from public.products p
            where p.id = recipes.product_id and app.pode(p.tenant_id, 'catalogo.editar'))
  )
  with check (
    exists (select 1 from public.products p
            where p.id = recipes.product_id and app.pode(p.tenant_id, 'catalogo.editar'))
  );

create policy recipe_items_leitura on public.recipe_items
  for select using (
    exists (select 1 from public.products p
            where p.id = recipe_items.product_id and app.pode(p.tenant_id, 'catalogo.ver'))
  );
create policy recipe_items_escrita on public.recipe_items
  for all using (
    exists (select 1 from public.products p
            where p.id = recipe_items.product_id and app.pode(p.tenant_id, 'catalogo.editar'))
  )
  with check (
    exists (select 1 from public.products p
            where p.id = recipe_items.product_id and app.pode(p.tenant_id, 'catalogo.editar'))
  );

create policy product_suppliers_leitura on public.product_suppliers
  for select using (
    exists (select 1 from public.products p
            where p.id = product_suppliers.product_id and app.pode(p.tenant_id, 'catalogo.ver'))
  );
create policy product_suppliers_escrita on public.product_suppliers
  for all using (
    exists (select 1 from public.products p
            where p.id = product_suppliers.product_id and app.pode(p.tenant_id, 'catalogo.editar'))
  )
  with check (
    exists (select 1 from public.products p
            where p.id = product_suppliers.product_id and app.pode(p.tenant_id, 'catalogo.editar'))
  );

create policy stock_levels_leitura on public.stock_levels
  for select using (app.pode(tenant_id, 'estoque.ver'));
create policy stock_levels_parametros on public.stock_levels
  for update using (app.pode(tenant_id, 'estoque.ajustar'))
  with check     (app.pode(tenant_id, 'estoque.ajustar'));
-- Saldo muda apenas pelas funções; insert direto não tem policy.

create policy stock_moves_leitura on public.stock_moves
  for select using (app.pode(tenant_id, 'estoque.ver'));
-- Sem insert/update/delete: só as funções security definer escrevem.

-- -----------------------------------------------------------------------------
-- Unidade-base do produto
-- -----------------------------------------------------------------------------
create or replace function app.unidade_base(p_unidade text)
returns text
language sql
stable
set search_path = public, pg_catalog
as $$
  select case u.tipo
    when 'massa'    then 'g'
    when 'volume'   then 'ml'
    when 'contagem' then 'un'
  end
  from public.units u where u.chave = p_unidade;
$$;

grant execute on function app.unidade_base(text) to public;

-- -----------------------------------------------------------------------------
-- Movimentar estoque (entrada, saída, perda, ajuste…)
-- p_qtd sempre positiva; o sinal vem do tipo (ou de p_saida para ajuste).
-- -----------------------------------------------------------------------------
create or replace function app.movimentar_estoque(
  p_tenant   uuid,
  p_branch   uuid,
  p_produto  uuid,
  p_tipo     app.tipo_movimento,
  p_qtd      numeric,
  p_unidade  text default null,        -- null = unidade do produto
  p_custo_unitario numeric default null,  -- por unidade INFORMADA, em entradas
  p_referencia text default null,
  p_observacao text default null,
  p_saida    boolean default null      -- só para 'ajuste' e 'transferencia'
)
returns numeric                        -- novo saldo na unidade-base
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_prod        public.products%rowtype;
  v_unidade     text;
  v_base        text;
  v_qtd_base    numeric;
  v_sinal       int;
  v_saldo_atual numeric;
  v_custo_base  numeric;
  v_novo_saldo  numeric;
begin
  if p_qtd is null or p_qtd <= 0 then
    raise exception 'Quantidade deve ser positiva; o sentido vem do tipo.' using errcode = '22023';
  end if;

  -- Permissão acompanha o ato de negócio, não a mecânica:
  --   venda/devolução  → quem vende ou cancela venda
  --   ajuste           → inventário (estoque.ajustar)
  --   demais           → estoque.movimentar
  if p_tipo = 'ajuste' then
    if not app.pode(p_tenant, 'estoque.ajustar') then
      raise exception 'Ajuste de inventário exige a permissão estoque.ajustar.' using errcode = '42501';
    end if;
  elsif p_tipo = 'venda' then
    if not (app.pode(p_tenant, 'vendas.criar') or app.pode(p_tenant, 'estoque.movimentar')) then
      raise exception 'Sem permissão para baixar estoque por venda.' using errcode = '42501';
    end if;
  elsif p_tipo = 'devolucao' then
    if not (app.pode(p_tenant, 'vendas.cancelar') or app.pode(p_tenant, 'estoque.movimentar')) then
      raise exception 'Sem permissão para estornar estoque.' using errcode = '42501';
    end if;
  elsif not app.pode(p_tenant, 'estoque.movimentar') then
    raise exception 'Sem permissão para movimentar estoque.' using errcode = '42501';
  end if;

  select * into v_prod from public.products
  where id = p_produto and tenant_id = p_tenant;
  if v_prod.id is null then
    raise exception 'Produto não pertence ao tenant.' using errcode = 'P0002';
  end if;
  if not v_prod.controla_estoque then
    raise exception 'O item "%" não controla estoque.', v_prod.nome using errcode = '55000';
  end if;
  if not exists (select 1 from public.branches b
                 where b.id = p_branch and b.tenant_id = p_tenant) then
    raise exception 'Filial não pertence ao tenant.' using errcode = 'P0002';
  end if;

  v_unidade  := coalesce(p_unidade, v_prod.unidade);
  v_base     := app.unidade_base(v_prod.unidade);
  v_qtd_base := app.converter_produto(p_produto, p_qtd, v_unidade, v_base);

  v_sinal := case p_tipo
    when 'compra'          then  1
    when 'devolucao'       then  1
    when 'producao'        then  1
    when 'venda'           then -1
    when 'perda'           then -1
    when 'desperdicio'     then -1
    when 'consumo_interno' then -1
    else case
      when p_saida is null then
        null
      when p_saida then -1 else 1
    end
  end;
  if v_sinal is null then
    raise exception 'Para % informe p_saida (true = saída).', p_tipo using errcode = '22023';
  end if;

  -- Custo médio ponderado nas entradas com custo informado (item 38).
  if v_sinal > 0 and p_custo_unitario is not null then
    select coalesce(saldo, 0) into v_saldo_atual
    from public.stock_levels
    where tenant_id = p_tenant and branch_id = p_branch and product_id = p_produto;
    v_saldo_atual := coalesce(v_saldo_atual, 0);

    -- custo por unidade-base: preço da unidade informada / fator de conversão
    v_custo_base := p_custo_unitario / (v_qtd_base / p_qtd);

    update public.products
    set custo = case
      when v_saldo_atual <= 0 then v_custo_base
      else (v_saldo_atual * custo + v_qtd_base * v_custo_base) / (v_saldo_atual + v_qtd_base)
    end
    where id = p_produto;
  end if;

  insert into public.stock_levels as sl (tenant_id, branch_id, product_id, saldo, atualizado_em)
  values (p_tenant, p_branch, p_produto, v_sinal * v_qtd_base, now())
  on conflict (tenant_id, branch_id, product_id) do update
    set saldo = sl.saldo + excluded.saldo,
        atualizado_em = now()
  returning saldo into v_novo_saldo;

  insert into public.stock_moves
    (tenant_id, branch_id, product_id, tipo, qtd_informada, unidade_informada,
     qtd_base, custo_unitario, referencia, observacao, criado_por)
  values
    (p_tenant, p_branch, p_produto, p_tipo, p_qtd, v_unidade,
     v_sinal * v_qtd_base,
     case when v_sinal > 0 then v_custo_base end,
     p_referencia, p_observacao, auth.uid());

  return v_novo_saldo;
end $$;

comment on function app.movimentar_estoque is
  'Única porta de escrita do estoque. Converte para a unidade-base e mantém custo médio.';

-- -----------------------------------------------------------------------------
-- Baixa em cascata pela ficha técnica (venda / produção / consumo)
-- -----------------------------------------------------------------------------
create or replace function app.baixar_em_cascata(
  p_tenant     uuid,
  p_branch     uuid,
  p_produto    uuid,
  p_qtd        numeric,
  p_tipo       app.tipo_movimento default 'venda',
  p_referencia text default null,
  p_nivel      int default 0
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_item record;
  v_qtd_insumo numeric;
  v_controla boolean;
begin
  if p_nivel > 8 then
    raise exception 'Ficha técnica com profundidade acima de 8 níveis — ciclo provável.'
      using errcode = '54001';
  end if;

  if exists (select 1 from public.recipe_items where product_id = p_produto) then
    -- Composto: consome os insumos, proporcional ao rendimento da receita.
    for v_item in
      select ri.insumo_id, ri.qtd, ri.unidade, ri.perda_pct, r.rendimento
      from public.recipe_items ri
      join public.recipes r on r.product_id = ri.product_id
      where ri.product_id = p_produto
    loop
      v_qtd_insumo := p_qtd * v_item.qtd * (1 + v_item.perda_pct / 100) / v_item.rendimento;

      perform app.baixar_em_cascata(
        p_tenant, p_branch, v_item.insumo_id,
        app.converter_produto(
          v_item.insumo_id, v_qtd_insumo, v_item.unidade,
          (select unidade from public.products where id = v_item.insumo_id)
        ),
        p_tipo, p_referencia, p_nivel + 1
      );
    end loop;

    -- Se o próprio composto mantém saldo (produzido em lote), baixa também.
    select controla_estoque into v_controla from public.products where id = p_produto;
    if v_controla and exists (
      select 1 from public.stock_levels
      where tenant_id = p_tenant and branch_id = p_branch
        and product_id = p_produto and saldo > 0
    ) then
      perform app.movimentar_estoque(
        p_tenant, p_branch, p_produto, p_tipo, p_qtd, null, null, p_referencia,
        'baixa do composto em lote');
    end if;
  else
    perform app.movimentar_estoque(
      p_tenant, p_branch, p_produto, p_tipo, p_qtd, null, null, p_referencia,
      case when p_nivel > 0 then 'baixa em cascata (ficha técnica)' end);
  end if;
end $$;

comment on function app.baixar_em_cascata is
  'Vender 1 Soda Italiana baixa xarope 50 ml, água 150 ml, gelo 100 g, copo, tampa e canudo.';

-- -----------------------------------------------------------------------------
-- Custo real recursivo (item 38) e precificação (item 39)
-- -----------------------------------------------------------------------------
create or replace function app.custo_produto(p_produto uuid, p_nivel int default 0)
returns numeric
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare
  v_total numeric := 0;
  v_item  record;
  v_base  text;
begin
  if p_nivel > 8 then
    raise exception 'Ficha técnica com profundidade acima de 8 níveis.' using errcode = '54001';
  end if;

  if not exists (select 1 from public.recipe_items where product_id = p_produto) then
    -- custo é por unidade-base; devolve por unidade DO PRODUTO
    select p.custo * app.converter_produto(p.id, 1, p.unidade, app.unidade_base(p.unidade))
    into v_total
    from public.products p where p.id = p_produto;
    return coalesce(v_total, 0);
  end if;

  for v_item in
    select ri.insumo_id, ri.qtd, ri.unidade, ri.perda_pct, r.rendimento
    from public.recipe_items ri
    join public.recipes r on r.product_id = ri.product_id
    where ri.product_id = p_produto
  loop
    select app.unidade_base(p.unidade) into v_base
    from public.products p where p.id = v_item.insumo_id;

    v_total := v_total +
      app.custo_produto(v_item.insumo_id, p_nivel + 1)
      / app.converter_produto(v_item.insumo_id, 1,
          (select unidade from public.products where id = v_item.insumo_id), v_base)
      * app.converter_produto(v_item.insumo_id, v_item.qtd, v_item.unidade, v_base)
      * (1 + v_item.perda_pct / 100)
      / v_item.rendimento;
  end loop;

  return v_total;
end $$;

comment on function app.custo_produto is
  'Custo real por unidade do produto: recursivo pela ficha técnica, com perdas e rendimento.';

create or replace function app.sugerir_preco(p_produto uuid, p_margem_pct numeric)
returns table (custo numeric, preco_sugerido numeric, preco_atual numeric, margem_atual_pct numeric)
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare
  v_custo numeric;
  v_preco numeric;
begin
  if p_margem_pct is null or p_margem_pct < 0 or p_margem_pct >= 100 then
    raise exception 'Margem deve estar entre 0 e 99,9%%.' using errcode = '22023';
  end if;

  v_custo := app.custo_produto(p_produto);
  select preco_venda into v_preco from public.products where id = p_produto;

  return query select
    round(v_custo, 4),
    round(v_custo / (1 - p_margem_pct / 100), 2),
    v_preco,
    case when v_preco > 0 then round((v_preco - v_custo) / v_preco * 100, 2) end;
end $$;

comment on function app.sugerir_preco is
  'Quanto cobrar: preço para a margem desejada sobre o preço de venda, e a margem atual.';

-- -----------------------------------------------------------------------------
-- Alertas de reposição (item 10) e previsão de ruptura (item 11)
-- Consumo médio: saídas de venda/produção/consumo dos últimos 30 dias.
-- -----------------------------------------------------------------------------
create or replace function app.alertas_estoque(p_tenant uuid, p_branch uuid default null)
returns table (
  product_id        uuid,
  produto           text,
  branch_id         uuid,
  saldo             numeric,
  minimo            numeric,
  ponto_reposicao   numeric,
  consumo_dia       numeric,
  dias_restantes    numeric,
  fornecedor_id     uuid,
  fornecedor        text,
  situacao          text
)
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  with consumo as (
    select m.product_id, m.branch_id,
           sum(-m.qtd_base) filter (where m.qtd_base < 0
             and m.tipo in ('venda', 'producao', 'consumo_interno')) / 30.0 as consumo_dia
    from public.stock_moves m
    where m.tenant_id = p_tenant
      and m.criado_em > now() - interval '30 days'
    group by m.product_id, m.branch_id
  )
  select
    sl.product_id,
    p.nome,
    sl.branch_id,
    sl.saldo,
    sl.minimo,
    sl.ponto_reposicao,
    round(coalesce(c.consumo_dia, 0), 4),
    case when coalesce(c.consumo_dia, 0) > 0
         then round(sl.saldo / c.consumo_dia, 1) end,
    f.supplier_id,
    s.razao_social,
    case
      when sl.saldo <= 0 then 'ruptura'
      when sl.minimo is not null and sl.saldo < sl.minimo then 'abaixo_do_minimo'
      when sl.ponto_reposicao is not null and sl.saldo <= sl.ponto_reposicao then 'repor'
      when coalesce(c.consumo_dia, 0) > 0 and sl.saldo / c.consumo_dia <= 7 then 'acaba_em_7_dias'
    end
  from public.stock_levels sl
  join public.products p on p.id = sl.product_id
  left join consumo c on c.product_id = sl.product_id and c.branch_id = sl.branch_id
  left join public.product_suppliers f on f.product_id = sl.product_id and f.preferencial
  left join public.suppliers s on s.id = f.supplier_id
  where sl.tenant_id = p_tenant
    and app.pode(p_tenant, 'estoque.ver')
    and (p_branch is null or sl.branch_id = p_branch)
    and (
      sl.saldo <= 0
      or (sl.minimo is not null and sl.saldo < sl.minimo)
      or (sl.ponto_reposicao is not null and sl.saldo <= sl.ponto_reposicao)
      or (coalesce(c.consumo_dia, 0) > 0 and sl.saldo / c.consumo_dia <= 7)
    )
  order by case
    when sl.saldo <= 0 then 0
    when sl.minimo is not null and sl.saldo < sl.minimo then 1
    else 2 end, p.nome;
$$;

comment on function app.alertas_estoque is
  'Itens em ruptura, abaixo do mínimo ou com previsão de acabar em até 7 dias.';

revoke all on function app.movimentar_estoque(uuid, uuid, uuid, app.tipo_movimento, numeric, text, numeric, text, text, boolean) from public;
revoke all on function app.baixar_em_cascata(uuid, uuid, uuid, numeric, app.tipo_movimento, text, int) from public;
revoke all on function app.custo_produto(uuid, int) from public;
revoke all on function app.sugerir_preco(uuid, numeric) from public;
revoke all on function app.alertas_estoque(uuid, uuid) from public;
grant execute on function app.movimentar_estoque(uuid, uuid, uuid, app.tipo_movimento, numeric, text, numeric, text, text, boolean) to public;
grant execute on function app.baixar_em_cascata(uuid, uuid, uuid, numeric, app.tipo_movimento, text, int) to public;
grant execute on function app.custo_produto(uuid, int) to public;
grant execute on function app.sugerir_preco(uuid, numeric) to public;
grant execute on function app.alertas_estoque(uuid, uuid) to public;
