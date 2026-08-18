-- =============================================================================
-- 0011 · PDV em produção (Fase 5, itens 4–6)
--
-- A venda que persiste: sobrevive ao F5, à queda de energia e aparece no
-- caixa. Regras:
--   · Escrita só pelas funções — a soma dos pagamentos tem de bater com o
--     total antes de fechar (pagamento dividido: R$40 Pix + R$60 cartão).
--   · Fechar venda exige caixa aberto na filial; o fechamento do caixa
--     confere dinheiro esperado × contado.
--   · Fechar venda baixa estoque em cascata (Fase 4). Cancelar estorna.
--   · Fluxo de status do pedido: aberta → enviada → preparando → pronta →
--     entregue → fechada, com cancelamento controlado (KDS usa isso).
-- =============================================================================

-- Configuração operacional do tenant (limite de desconto etc.)
alter table public.tenants
  add column config jsonb not null default '{}';

comment on column public.tenants.config is
  'Configuração operacional: {"limite_desconto_pct": 10, ...}. Chaves documentadas em docs/.';

create type app.status_venda as enum
  ('aberta', 'enviada', 'preparando', 'pronta', 'entregue', 'fechada', 'cancelada');
create type app.forma_pagamento as enum
  ('dinheiro', 'pix', 'credito', 'debito', 'vale', 'transferencia', 'prazo');
create type app.status_caixa as enum ('aberto', 'fechado');
create type app.tipo_mov_caixa as enum ('sangria', 'suprimento');

-- -----------------------------------------------------------------------------
-- Numeração sequencial por tenant (venda nº 1, 2, 3… de cada empresa)
-- -----------------------------------------------------------------------------
create table public.tenant_counters (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  chave     text not null,
  valor     bigint not null default 0,
  primary key (tenant_id, chave)
);

alter table public.tenant_counters enable row level security;
-- Sem policies: só funções security definer tocam.

create or replace function app.proximo_numero(p_tenant uuid, p_chave text)
returns bigint
language sql
security definer
set search_path = public, pg_catalog
as $$
  insert into public.tenant_counters as c (tenant_id, chave, valor)
  values (p_tenant, p_chave, 1)
  on conflict (tenant_id, chave) do update set valor = c.valor + 1
  returning valor;
$$;

-- -----------------------------------------------------------------------------
-- Mesas (nicho com modo de serviço: restaurante, salão…)
-- -----------------------------------------------------------------------------
create table public.dining_tables (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id)  on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  numero    smallint not null,
  nome      text,
  ativa     boolean not null default true,
  unique (branch_id, numero)
);

-- -----------------------------------------------------------------------------
-- Sessões de caixa
-- -----------------------------------------------------------------------------
create table public.register_sessions (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id)  on delete cascade,
  branch_id          uuid not null references public.branches(id) on delete cascade,
  status             app.status_caixa not null default 'aberto',
  saldo_abertura     numeric(12,2) not null default 0 check (saldo_abertura >= 0),
  saldo_esperado     numeric(12,2),      -- calculado no fechamento
  saldo_contado      numeric(12,2),      -- informado por quem fecha
  diferenca          numeric(12,2),
  aberto_por         uuid references public.profiles(id) on delete set null,
  fechado_por        uuid references public.profiles(id) on delete set null,
  aberto_em          timestamptz not null default now(),
  fechado_em         timestamptz,
  observacoes        text
);

-- Um caixa aberto por filial.
create unique index register_aberto_unico on public.register_sessions (branch_id)
  where status = 'aberto';

create table public.register_movements (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  session_id uuid not null references public.register_sessions(id) on delete cascade,
  tipo       app.tipo_mov_caixa not null,
  valor      numeric(12,2) not null check (valor > 0),
  observacao text,
  criado_por uuid references public.profiles(id) on delete set null,
  criado_em  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Vendas / comandas / pedidos
-- -----------------------------------------------------------------------------
create table public.sales (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id)  on delete cascade,
  branch_id     uuid not null references public.branches(id) on delete cascade,
  numero        bigint not null,
  modo          text not null default 'Balcão',       -- vem de vertical_modes
  status        app.status_venda not null default 'aberta',
  mesa_id       uuid references public.dining_tables(id) on delete set null,
  customer_id   uuid references public.customers(id)     on delete set null,
  vendedor_id   uuid references public.profiles(id)      on delete set null,
  session_id    uuid references public.register_sessions(id) on delete set null,
  subtotal      numeric(12,2) not null default 0,
  desconto      numeric(12,2) not null default 0 check (desconto >= 0),
  acrescimo     numeric(12,2) not null default 0 check (acrescimo >= 0),
  taxa_entrega  numeric(12,2) not null default 0 check (taxa_entrega >= 0),
  total         numeric(12,2) not null default 0,
  observacao    text,
  motivo_cancelamento text,
  aberta_em     timestamptz not null default now(),
  fechada_em    timestamptz,
  atualizado_em timestamptz not null default now(),
  unique (tenant_id, numero)
);

create index on public.sales (tenant_id, branch_id, status);
create index on public.sales (tenant_id, aberta_em desc);
create index sales_mesa_aberta on public.sales (mesa_id) where status not in ('fechada', 'cancelada');

create table public.sale_items (
  id             uuid primary key default gen_random_uuid(),
  sale_id        uuid not null references public.sales(id) on delete cascade,
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  product_id     uuid not null references public.products(id),
  nome_produto   text not null,                -- congelado no momento da venda
  qtd            numeric(14,4) not null check (qtd > 0),
  preco_unitario numeric(12,4) not null check (preco_unitario >= 0),
  desconto       numeric(12,2) not null default 0 check (desconto >= 0),
  observacao     text,
  cancelado      boolean not null default false,
  criado_em      timestamptz not null default now()
);

create index on public.sale_items (sale_id);

create table public.sale_payments (
  id        uuid primary key default gen_random_uuid(),
  sale_id   uuid not null references public.sales(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  forma     app.forma_pagamento not null,
  valor     numeric(12,2) not null check (valor > 0),
  criado_em timestamptz not null default now()
);

create index on public.sale_payments (sale_id);

create trigger trg_sales_atualizado before update on public.sales
  for each row execute function app.fn_atualizado_em();

create trigger trg_audit_sales after insert or update or delete on public.sales
  for each row execute function app.fn_auditoria();
create trigger trg_audit_register_sessions after insert or update or delete on public.register_sessions
  for each row execute function app.fn_auditoria();

-- -----------------------------------------------------------------------------
-- RLS: leitura por permissão; escrita só pelas funções
-- -----------------------------------------------------------------------------
alter table public.dining_tables      enable row level security;
alter table public.register_sessions  enable row level security;
alter table public.register_movements enable row level security;
alter table public.sales              enable row level security;
alter table public.sale_items         enable row level security;
alter table public.sale_payments      enable row level security;

create policy mesas_leitura on public.dining_tables
  for select using (app.pode(tenant_id, 'pedidos.ver') or app.pode(tenant_id, 'vendas.ver'));
create policy mesas_escrita on public.dining_tables
  for all using (app.pode(tenant_id, 'pedidos.gerenciar'))
  with check    (app.pode(tenant_id, 'pedidos.gerenciar'));

create policy caixa_leitura on public.register_sessions
  for select using (app.pode(tenant_id, 'vendas.ver'));
create policy caixa_mov_leitura on public.register_movements
  for select using (app.pode(tenant_id, 'vendas.ver'));

create policy vendas_leitura on public.sales
  for select using (app.pode(tenant_id, 'vendas.ver') or app.pode(tenant_id, 'pedidos.ver'));
create policy itens_leitura on public.sale_items
  for select using (app.pode(tenant_id, 'vendas.ver') or app.pode(tenant_id, 'pedidos.ver'));
create policy pagamentos_leitura on public.sale_payments
  for select using (app.pode(tenant_id, 'vendas.ver'));

-- -----------------------------------------------------------------------------
-- Caixa: abrir, sangria/suprimento, fechar
-- -----------------------------------------------------------------------------
create or replace function app.abrir_caixa(p_tenant uuid, p_branch uuid, p_saldo_abertura numeric)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare v_id uuid;
begin
  if not app.pode(p_tenant, 'vendas.criar') then
    raise exception 'Sem permissão para operar o caixa.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.branches where id = p_branch and tenant_id = p_tenant) then
    raise exception 'Filial não pertence ao tenant.' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.register_sessions
             where branch_id = p_branch and status = 'aberto') then
    raise exception 'Já existe caixa aberto nesta filial. Feche-o antes.' using errcode = '55000';
  end if;

  insert into public.register_sessions (tenant_id, branch_id, saldo_abertura, aberto_por)
  values (p_tenant, p_branch, coalesce(p_saldo_abertura, 0), auth.uid())
  returning id into v_id;
  return v_id;
end $$;

create or replace function app.movimentar_caixa(
  p_session uuid, p_tipo app.tipo_mov_caixa, p_valor numeric, p_observacao text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare v_sessao public.register_sessions%rowtype;
begin
  select * into v_sessao from public.register_sessions where id = p_session for update;
  if v_sessao.id is null then
    raise exception 'Sessão de caixa não encontrada.' using errcode = 'P0002';
  end if;
  if not app.pode(v_sessao.tenant_id, 'vendas.criar') then
    raise exception 'Sem permissão para operar o caixa.' using errcode = '42501';
  end if;
  if v_sessao.status <> 'aberto' then
    raise exception 'Caixa já está fechado.' using errcode = '55000';
  end if;

  insert into public.register_movements (tenant_id, session_id, tipo, valor, observacao, criado_por)
  values (v_sessao.tenant_id, p_session, p_tipo, p_valor, p_observacao, auth.uid());
end $$;

create or replace function app.fechar_caixa(p_session uuid, p_saldo_contado numeric)
returns table (saldo_esperado numeric, saldo_contado numeric, diferenca numeric)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_sessao    public.register_sessions%rowtype;
  v_dinheiro  numeric;
  v_sangrias  numeric;
  v_supriment numeric;
  v_esperado  numeric;
begin
  select * into v_sessao from public.register_sessions where id = p_session for update;
  if v_sessao.id is null then
    raise exception 'Sessão de caixa não encontrada.' using errcode = 'P0002';
  end if;
  if not app.pode(v_sessao.tenant_id, 'vendas.criar') then
    raise exception 'Sem permissão para operar o caixa.' using errcode = '42501';
  end if;
  if v_sessao.status <> 'aberto' then
    raise exception 'Caixa já está fechado.' using errcode = '55000';
  end if;
  if exists (select 1 from public.sales
             where session_id = p_session and status not in ('fechada', 'cancelada', 'entregue')) then
    raise exception 'Há vendas abertas nesta sessão. Feche ou cancele antes.' using errcode = '55000';
  end if;

  select coalesce(sum(p.valor), 0) into v_dinheiro
  from public.sale_payments p
  join public.sales s on s.id = p.sale_id
  where s.session_id = p_session and s.status = 'fechada' and p.forma = 'dinheiro';

  select coalesce(sum(valor) filter (where tipo = 'sangria'), 0),
         coalesce(sum(valor) filter (where tipo = 'suprimento'), 0)
  into v_sangrias, v_supriment
  from public.register_movements where session_id = p_session;

  v_esperado := v_sessao.saldo_abertura + v_dinheiro + v_supriment - v_sangrias;

  update public.register_sessions
  set status = 'fechado',
      saldo_esperado = v_esperado,
      saldo_contado  = p_saldo_contado,
      diferenca      = p_saldo_contado - v_esperado,
      fechado_por    = auth.uid(),
      fechado_em     = now()
  where id = p_session;

  return query select v_esperado, p_saldo_contado, p_saldo_contado - v_esperado;
end $$;

comment on function app.fechar_caixa is
  'Fecha a sessão: esperado = abertura + dinheiro das vendas + suprimentos − sangrias.';

-- -----------------------------------------------------------------------------
-- Venda: abrir, lançar item, status, transferir mesa, fechar, cancelar
-- -----------------------------------------------------------------------------
create or replace function app.abrir_venda(
  p_tenant uuid, p_branch uuid,
  p_modo text default 'Balcão',
  p_mesa uuid default null,
  p_cliente uuid default null,
  p_vendedor uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare v_id uuid;
begin
  if not (app.pode(p_tenant, 'vendas.criar') or app.pode(p_tenant, 'pedidos.gerenciar')) then
    raise exception 'Sem permissão para abrir venda.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.branches where id = p_branch and tenant_id = p_tenant) then
    raise exception 'Filial não pertence ao tenant.' using errcode = 'P0002';
  end if;
  if p_mesa is not null then
    if not exists (select 1 from public.dining_tables
                   where id = p_mesa and tenant_id = p_tenant and ativa) then
      raise exception 'Mesa inexistente ou inativa.' using errcode = 'P0002';
    end if;
    if exists (select 1 from public.sales
               where mesa_id = p_mesa and status not in ('fechada', 'cancelada')) then
      raise exception 'A mesa já tem comanda aberta.' using errcode = '55000';
    end if;
  end if;

  insert into public.sales (tenant_id, branch_id, numero, modo, mesa_id, customer_id, vendedor_id)
  values (p_tenant, p_branch, app.proximo_numero(p_tenant, 'venda'), p_modo, p_mesa,
          p_cliente, coalesce(p_vendedor, auth.uid()))
  returning id into v_id;
  return v_id;
end $$;

create or replace function app.lancar_item(
  p_venda uuid, p_produto uuid, p_qtd numeric,
  p_preco numeric default null,        -- null = preço do catálogo
  p_desconto numeric default 0,
  p_observacao text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_venda public.sales%rowtype;
  v_prod  public.products%rowtype;
  v_id    uuid;
begin
  select * into v_venda from public.sales where id = p_venda for update;
  if v_venda.id is null then
    raise exception 'Venda não encontrada.' using errcode = 'P0002';
  end if;
  if not (app.pode(v_venda.tenant_id, 'vendas.criar') or app.pode(v_venda.tenant_id, 'pedidos.gerenciar')) then
    raise exception 'Sem permissão para lançar itens.' using errcode = '42501';
  end if;
  if v_venda.status in ('fechada', 'cancelada') then
    raise exception 'Venda já encerrada.' using errcode = '55000';
  end if;

  select * into v_prod from public.products
  where id = p_produto and tenant_id = v_venda.tenant_id and ativo;
  if v_prod.id is null then
    raise exception 'Produto inexistente ou inativo.' using errcode = 'P0002';
  end if;

  insert into public.sale_items
    (sale_id, tenant_id, product_id, nome_produto, qtd, preco_unitario, desconto, observacao)
  values
    (p_venda, v_venda.tenant_id, p_produto, v_prod.nome, p_qtd,
     coalesce(p_preco, v_prod.preco_venda), coalesce(p_desconto, 0), p_observacao)
  returning id into v_id;

  update public.sales
  set subtotal = (select coalesce(sum(qtd * preco_unitario - desconto), 0)
                  from public.sale_items where sale_id = p_venda and not cancelado),
      total = 0
  where id = p_venda;
  update public.sales
  set total = subtotal - desconto + acrescimo + taxa_entrega
  where id = p_venda;

  return v_id;
end $$;

create or replace function app.atualizar_status_venda(p_venda uuid, p_status app.status_venda)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_venda public.sales%rowtype;
  v_ordem_atual int;
  v_ordem_nova  int;
begin
  select * into v_venda from public.sales where id = p_venda for update;
  if v_venda.id is null then
    raise exception 'Venda não encontrada.' using errcode = 'P0002';
  end if;
  if not (app.pode(v_venda.tenant_id, 'pedidos.gerenciar')
          or app.pode(v_venda.tenant_id, 'pedidos.cozinha')) then
    raise exception 'Sem permissão para mudar o status do pedido.' using errcode = '42501';
  end if;
  if p_status in ('fechada', 'cancelada') then
    raise exception 'Fechamento e cancelamento têm função própria.' using errcode = '22023';
  end if;
  if v_venda.status in ('fechada', 'cancelada') then
    raise exception 'Venda já encerrada.' using errcode = '55000';
  end if;

  v_ordem_atual := array_position(array['aberta','enviada','preparando','pronta','entregue'], v_venda.status::text);
  v_ordem_nova  := array_position(array['aberta','enviada','preparando','pronta','entregue'], p_status::text);
  if v_ordem_nova is null or v_ordem_nova < v_ordem_atual then
    raise exception 'Transição inválida: % → %.', v_venda.status, p_status using errcode = '22023';
  end if;

  update public.sales set status = p_status where id = p_venda;
end $$;

create or replace function app.transferir_mesa(p_venda uuid, p_mesa_nova uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare v_venda public.sales%rowtype;
begin
  select * into v_venda from public.sales where id = p_venda for update;
  if v_venda.id is null then
    raise exception 'Venda não encontrada.' using errcode = 'P0002';
  end if;
  if not app.pode(v_venda.tenant_id, 'pedidos.gerenciar') then
    raise exception 'Sem permissão para transferir comandas.' using errcode = '42501';
  end if;
  if v_venda.status in ('fechada', 'cancelada') then
    raise exception 'Venda já encerrada.' using errcode = '55000';
  end if;
  if not exists (select 1 from public.dining_tables
                 where id = p_mesa_nova and tenant_id = v_venda.tenant_id and ativa) then
    raise exception 'Mesa de destino inexistente ou inativa.' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.sales
             where mesa_id = p_mesa_nova and status not in ('fechada', 'cancelada')
               and id <> p_venda) then
    raise exception 'A mesa de destino já tem comanda aberta.' using errcode = '55000';
  end if;

  update public.sales set mesa_id = p_mesa_nova where id = p_venda;
end $$;

create or replace function app.fechar_venda(
  p_venda uuid,
  p_pagamentos jsonb,                  -- [{"forma": "pix", "valor": 40}, ...]
  p_desconto numeric default 0,
  p_acrescimo numeric default 0,
  p_taxa_entrega numeric default null  -- null = mantém a da venda
)
returns numeric                        -- total fechado
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_venda   public.sales%rowtype;
  v_sessao  uuid;
  v_total   numeric;
  v_soma    numeric := 0;
  v_pg      jsonb;
  v_limite  numeric;
  v_item    record;
begin
  select * into v_venda from public.sales where id = p_venda for update;
  if v_venda.id is null then
    raise exception 'Venda não encontrada.' using errcode = 'P0002';
  end if;
  if not app.pode(v_venda.tenant_id, 'vendas.criar') then
    raise exception 'Sem permissão para fechar venda.' using errcode = '42501';
  end if;
  if v_venda.status in ('fechada', 'cancelada') then
    raise exception 'Venda já encerrada.' using errcode = '55000';
  end if;
  if not exists (select 1 from public.sale_items
                 where sale_id = p_venda and not cancelado) then
    raise exception 'Venda sem itens.' using errcode = '55000';
  end if;

  -- Caixa aberto na filial é obrigatório.
  select id into v_sessao from public.register_sessions
  where branch_id = v_venda.branch_id and status = 'aberto';
  if v_sessao is null then
    raise exception 'Nenhum caixa aberto nesta filial. Abra o caixa antes de vender.'
      using errcode = '55000';
  end if;

  -- Desconto acima do limite exige permissão específica (vendas.desconto).
  select coalesce((t.config ->> 'limite_desconto_pct')::numeric, 10)
  into v_limite from public.tenants t where t.id = v_venda.tenant_id;

  if coalesce(p_desconto, 0) > v_venda.subtotal * v_limite / 100
     and not app.pode(v_venda.tenant_id, 'vendas.desconto') then
    raise exception using
      message = format('Desconto acima do limite de %s%% exige aprovação (vendas.desconto).', v_limite),
      errcode = '42501';
  end if;

  v_total := v_venda.subtotal - coalesce(p_desconto, 0) + coalesce(p_acrescimo, 0)
             + coalesce(p_taxa_entrega, v_venda.taxa_entrega);
  if v_total < 0 then
    raise exception 'Total negativo.' using errcode = '22023';
  end if;

  if p_pagamentos is null or jsonb_typeof(p_pagamentos) <> 'array'
     or jsonb_array_length(p_pagamentos) = 0 then
    raise exception 'Informe ao menos uma forma de pagamento.' using errcode = '22023';
  end if;

  for v_pg in select * from jsonb_array_elements(p_pagamentos) loop
    insert into public.sale_payments (sale_id, tenant_id, forma, valor)
    values (p_venda, v_venda.tenant_id,
            (v_pg ->> 'forma')::app.forma_pagamento,
            (v_pg ->> 'valor')::numeric);
    v_soma := v_soma + (v_pg ->> 'valor')::numeric;
  end loop;

  if round(v_soma, 2) <> round(v_total, 2) then
    raise exception 'Pagamentos somam %, mas o total é %.', v_soma, v_total
      using errcode = '22023';
  end if;

  -- Baixa de estoque em cascata, item a item.
  for v_item in
    select si.product_id, si.qtd
    from public.sale_items si
    join public.products p on p.id = si.product_id
    where si.sale_id = p_venda and not si.cancelado
      and (p.controla_estoque or exists (
        select 1 from public.recipe_items ri where ri.product_id = p.id))
  loop
    perform app.baixar_em_cascata(
      v_venda.tenant_id, v_venda.branch_id, v_item.product_id, v_item.qtd,
      'venda', 'venda:' || v_venda.numero);
  end loop;

  update public.sales
  set status = 'fechada',
      desconto = coalesce(p_desconto, 0),
      acrescimo = coalesce(p_acrescimo, 0),
      taxa_entrega = coalesce(p_taxa_entrega, taxa_entrega),
      total = v_total,
      session_id = v_sessao,
      fechada_em = now()
  where id = p_venda;

  return v_total;
end $$;

comment on function app.fechar_venda is
  'Valida pagamento dividido contra o total, exige caixa aberto e baixa o estoque em cascata.';

create or replace function app.cancelar_venda(p_venda uuid, p_motivo text)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_venda public.sales%rowtype;
  v_item  record;
begin
  select * into v_venda from public.sales where id = p_venda for update;
  if v_venda.id is null then
    raise exception 'Venda não encontrada.' using errcode = 'P0002';
  end if;
  if not app.pode(v_venda.tenant_id, 'vendas.cancelar') then
    raise exception 'Sem permissão para cancelar vendas.' using errcode = '42501';
  end if;
  if v_venda.status = 'cancelada' then
    raise exception 'Venda já cancelada.' using errcode = '55000';
  end if;
  if nullif(trim(p_motivo), '') is null then
    raise exception 'Informe o motivo do cancelamento.' using errcode = '22023';
  end if;

  -- Venda fechada já baixou estoque: estorna com devolução.
  if v_venda.status = 'fechada' then
    for v_item in
      select si.product_id, si.qtd
      from public.sale_items si
      join public.products p on p.id = si.product_id
      where si.sale_id = p_venda and not si.cancelado
        and (p.controla_estoque or exists (
          select 1 from public.recipe_items ri where ri.product_id = p.id))
    loop
      perform app.baixar_em_cascata(
        v_venda.tenant_id, v_venda.branch_id, v_item.product_id, v_item.qtd,
        'devolucao', 'cancelamento:' || v_venda.numero);
    end loop;
  end if;

  update public.sales
  set status = 'cancelada', motivo_cancelamento = trim(p_motivo)
  where id = p_venda;
end $$;

comment on function app.cancelar_venda is
  'Cancela com motivo obrigatório; venda fechada tem o estoque estornado (devolução).';

-- Grants
revoke all on function app.proximo_numero(uuid, text) from public;
revoke all on function app.abrir_caixa(uuid, uuid, numeric) from public;
revoke all on function app.movimentar_caixa(uuid, app.tipo_mov_caixa, numeric, text) from public;
revoke all on function app.fechar_caixa(uuid, numeric) from public;
revoke all on function app.abrir_venda(uuid, uuid, text, uuid, uuid, uuid) from public;
revoke all on function app.lancar_item(uuid, uuid, numeric, numeric, numeric, text) from public;
revoke all on function app.atualizar_status_venda(uuid, app.status_venda) from public;
revoke all on function app.transferir_mesa(uuid, uuid) from public;
revoke all on function app.fechar_venda(uuid, jsonb, numeric, numeric, numeric) from public;
revoke all on function app.cancelar_venda(uuid, text) from public;
grant execute on function app.abrir_caixa(uuid, uuid, numeric) to public;
grant execute on function app.movimentar_caixa(uuid, app.tipo_mov_caixa, numeric, text) to public;
grant execute on function app.fechar_caixa(uuid, numeric) to public;
grant execute on function app.abrir_venda(uuid, uuid, text, uuid, uuid, uuid) to public;
grant execute on function app.lancar_item(uuid, uuid, numeric, numeric, numeric, text) to public;
grant execute on function app.atualizar_status_venda(uuid, app.status_venda) to public;
grant execute on function app.transferir_mesa(uuid, uuid) to public;
grant execute on function app.fechar_venda(uuid, jsonb, numeric, numeric, numeric) to public;
grant execute on function app.cancelar_venda(uuid, text) to public;
