-- =============================================================================
-- 0009 · Catálogo, clientes e fornecedores (Fase 3, itens 12, 21, 44, 45)
--
-- Primeiras tabelas de operação do dia a dia. Tudo por tenant, tudo sob RLS,
-- preço e cadastro auditados. Exclusão de cadastro é desativação (flag ativo);
-- histórico não se apaga.
-- =============================================================================

create type app.tipo_item as enum ('produto', 'servico', 'insumo', 'composto');

-- -----------------------------------------------------------------------------
-- product_categories
-- -----------------------------------------------------------------------------
create table public.product_categories (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  nome          text not null,
  ordem         smallint not null default 0,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (tenant_id, nome)
);

-- -----------------------------------------------------------------------------
-- products · produto, serviço, insumo ou composto (ficha técnica na Fase 4)
-- -----------------------------------------------------------------------------
create table public.products (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  categoria_id    uuid references public.product_categories(id) on delete set null,
  tipo            app.tipo_item not null default 'produto',
  nome            text not null,
  sku             text,
  codigo_barras   text,
  foto_url        text,
  unidade         text not null default 'un' references public.units(chave),
  preco_venda     numeric(12,2) not null default 0 check (preco_venda >= 0),
  -- Custo médio na unidade-base do tipo da unidade (g, ml, un). A Fase 4
  -- recalcula a cada entrada; para compostos, deriva da ficha técnica.
  custo           numeric(16,6) not null default 0 check (custo >= 0),
  controla_estoque boolean not null default true,
  -- Campos do nicho (grade, lote, veículo, porte…), validados pela interface
  -- conforme vertical_fields do nicho do tenant.
  dados_nicho     jsonb not null default '{}',
  ativo           boolean not null default true,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

create unique index products_sku_unico on public.products (tenant_id, sku)
  where sku is not null;
create unique index products_ean_unico on public.products (tenant_id, codigo_barras)
  where codigo_barras is not null;
create index on public.products (tenant_id) where ativo;
create index on public.products (tenant_id, categoria_id);

comment on table public.products is
  'Catálogo. Serviços não controlam estoque; compostos ganham ficha técnica na Fase 4.';

-- -----------------------------------------------------------------------------
-- product_units · embalagens do produto (caixa de 12, fardo de 6, saco de 5 kg)
-- fator = quantidade NA UNIDADE DO PRODUTO que 1 embalagem contém.
-- -----------------------------------------------------------------------------
create table public.product_units (
  product_id    uuid not null references public.products(id) on delete cascade,
  unit_chave    text not null references public.units(chave),
  fator         numeric(18,6) not null check (fator > 0),
  codigo_barras text,                        -- EAN próprio da embalagem (DUN-14)
  primary key (product_id, unit_chave)
);

-- -----------------------------------------------------------------------------
-- customers · item 21 do briefing
-- -----------------------------------------------------------------------------
create table public.customers (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  nome              text not null,
  apelido           text,
  cpf_cnpj          text,
  email             citext,
  telefone          text,
  whatsapp          text,
  endereco          jsonb not null default '{}',   -- {logradouro, numero, bairro, cidade, uf, cep, complemento}
  aniversario       date,
  preferencias      text,
  observacoes       text,
  -- LGPD: base para o item 35 (consentimento, anonimização, exportação)
  consentimento_lgpd boolean not null default false,
  consentimento_em  timestamptz,
  ativo             boolean not null default true,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now(),
  constraint customers_doc_formato
    check (cpf_cnpj is null or cpf_cnpj ~ '^[0-9]{11}$' or cpf_cnpj ~ '^[0-9]{14}$')
);

create unique index customers_doc_unico on public.customers (tenant_id, cpf_cnpj)
  where cpf_cnpj is not null;
create index on public.customers (tenant_id) where ativo;

-- -----------------------------------------------------------------------------
-- suppliers · item 12 do briefing
-- -----------------------------------------------------------------------------
create table public.suppliers (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  razao_social       text not null,
  nome_fantasia      text,
  cnpj               text,
  inscricao_estadual text,
  email              citext,
  telefone           text,
  whatsapp           text,
  endereco           jsonb not null default '{}',
  prazo_entrega_dias smallint,
  condicao_pagamento text,                     -- ex.: "28 dias", "30/60/90"
  observacoes        text,
  ativo              boolean not null default true,
  criado_em          timestamptz not null default now(),
  atualizado_em      timestamptz not null default now(),
  constraint suppliers_cnpj_formato
    check (cnpj is null or cnpj ~ '^[0-9]{14}$')
);

create unique index suppliers_cnpj_unico on public.suppliers (tenant_id, cnpj)
  where cnpj is not null;
create index on public.suppliers (tenant_id) where ativo;

-- -----------------------------------------------------------------------------
-- Gatilhos de atualizado_em e auditoria
-- -----------------------------------------------------------------------------
create trigger trg_product_categories_atualizado before update on public.product_categories
  for each row execute function app.fn_atualizado_em();
create trigger trg_products_atualizado before update on public.products
  for each row execute function app.fn_atualizado_em();
create trigger trg_customers_atualizado before update on public.customers
  for each row execute function app.fn_atualizado_em();
create trigger trg_suppliers_atualizado before update on public.suppliers
  for each row execute function app.fn_atualizado_em();

create trigger trg_audit_products after insert or update or delete on public.products
  for each row execute function app.fn_auditoria();
create trigger trg_audit_customers after insert or update or delete on public.customers
  for each row execute function app.fn_auditoria();
create trigger trg_audit_suppliers after insert or update or delete on public.suppliers
  for each row execute function app.fn_auditoria();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.product_categories enable row level security;
alter table public.products           enable row level security;
alter table public.product_units      enable row level security;
alter table public.customers          enable row level security;
alter table public.suppliers          enable row level security;

create policy categorias_leitura on public.product_categories
  for select using (app.pode(tenant_id, 'catalogo.ver'));
create policy categorias_criacao on public.product_categories
  for insert with check (app.pode(tenant_id, 'catalogo.criar'));
create policy categorias_edicao on public.product_categories
  for update using (app.pode(tenant_id, 'catalogo.editar'))
  with check     (app.pode(tenant_id, 'catalogo.editar'));
create policy categorias_exclusao on public.product_categories
  for delete using (app.pode(tenant_id, 'catalogo.excluir'));

create policy products_leitura on public.products
  for select using (app.pode(tenant_id, 'catalogo.ver'));
create policy products_criacao on public.products
  for insert with check (app.pode(tenant_id, 'catalogo.criar'));
create policy products_edicao on public.products
  for update using (app.pode(tenant_id, 'catalogo.editar'))
  with check     (app.pode(tenant_id, 'catalogo.editar'));
create policy products_exclusao on public.products
  for delete using (app.pode(tenant_id, 'catalogo.excluir'));

-- product_units segue o tenant do produto
create policy product_units_leitura on public.product_units
  for select using (
    exists (select 1 from public.products p
            where p.id = product_units.product_id
              and app.pode(p.tenant_id, 'catalogo.ver'))
  );
create policy product_units_escrita on public.product_units
  for all using (
    exists (select 1 from public.products p
            where p.id = product_units.product_id
              and app.pode(p.tenant_id, 'catalogo.editar'))
  )
  with check (
    exists (select 1 from public.products p
            where p.id = product_units.product_id
              and app.pode(p.tenant_id, 'catalogo.editar'))
  );

create policy customers_leitura on public.customers
  for select using (app.pode(tenant_id, 'clientes.ver'));
create policy customers_criacao on public.customers
  for insert with check (app.pode(tenant_id, 'clientes.criar'));
create policy customers_edicao on public.customers
  for update using (app.pode(tenant_id, 'clientes.editar'))
  with check     (app.pode(tenant_id, 'clientes.editar'));
-- Sem policy de delete: cliente se desativa, histórico não se apaga.

create policy suppliers_leitura on public.suppliers
  for select using (app.pode(tenant_id, 'compras.ver'));
create policy suppliers_criacao on public.suppliers
  for insert with check (app.pode(tenant_id, 'compras.criar'));
create policy suppliers_edicao on public.suppliers
  for update using (app.pode(tenant_id, 'compras.criar'))
  with check     (app.pode(tenant_id, 'compras.criar'));

-- -----------------------------------------------------------------------------
-- Conversão com embalagem do produto (complemento do app.converter)
-- -----------------------------------------------------------------------------
create or replace function app.converter_produto(
  p_produto uuid, p_qtd numeric, p_de text, p_para text
)
returns numeric
language plpgsql
stable
set search_path = public, pg_catalog
as $$
declare
  v_unid_prod text;
  v_na_unidade_prod numeric;
  v_fator numeric;
begin
  select unidade into v_unid_prod from public.products where id = p_produto;
  if v_unid_prod is null then
    raise exception 'Produto não encontrado.' using errcode = 'P0002';
  end if;

  -- 1. leva a quantidade para a unidade do produto
  if p_de = v_unid_prod then
    v_na_unidade_prod := p_qtd;
  else
    select fator into v_fator from public.product_units
    where product_id = p_produto and unit_chave = p_de;
    if v_fator is not null then
      v_na_unidade_prod := p_qtd * v_fator;
    else
      v_na_unidade_prod := app.converter(p_qtd, p_de, v_unid_prod);
    end if;
  end if;

  -- 2. da unidade do produto para o destino
  if p_para = v_unid_prod then
    return v_na_unidade_prod;
  end if;

  select fator into v_fator from public.product_units
  where product_id = p_produto and unit_chave = p_para;
  if v_fator is not null then
    return v_na_unidade_prod / v_fator;
  end if;

  return app.converter(v_na_unidade_prod, v_unid_prod, p_para);
end $$;

comment on function app.converter_produto is
  'Converte usando as embalagens do produto (caixa de 12 → 12 un) e as físicas (kg → g).';

grant execute on function app.converter_produto(uuid, numeric, text, text) to public;

-- -----------------------------------------------------------------------------
-- Kit inicial do nicho (onboarding, etapa 3) — catálogo de demonstração
-- -----------------------------------------------------------------------------
create or replace function app.aplicar_kit_inicial(p_tenant uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_vertical text;
  v_qtd      integer;
begin
  if not app.pode(p_tenant, 'catalogo.criar') then
    raise exception 'Sem permissão para criar o catálogo.' using errcode = '42501';
  end if;

  select vertical_chave into v_vertical from public.tenants where id = p_tenant;
  if v_vertical is null then
    raise exception 'Escolha o nicho da empresa antes de aplicar o kit.' using errcode = '55000';
  end if;
  if exists (select 1 from public.products where tenant_id = p_tenant) then
    raise exception 'O catálogo já tem produtos; o kit inicial não sobrescreve nada.'
      using errcode = '55000';
  end if;

  insert into public.product_categories (tenant_id, nome, ordem)
  select p_tenant, s.categoria, min(s.id)
  from public.vertical_seed_products s
  where s.vertical_chave = v_vertical
  group by s.categoria;

  insert into public.products
    (tenant_id, categoria_id, tipo, nome, unidade, preco_venda, controla_estoque, dados_nicho)
  select
    p_tenant,
    c.id,
    case when s.campo_extra = 'prof' then 'servico'::app.tipo_item else 'produto' end,
    s.nome,
    case when s.campo_extra = 'peso' then 'kg' else 'un' end,
    s.preco,
    s.campo_extra is distinct from 'prof',
    case when s.campo_extra is not null
         then jsonb_build_object(s.campo_extra, true) else '{}'::jsonb end
  from public.vertical_seed_products s
  join public.product_categories c on c.tenant_id = p_tenant and c.nome = s.categoria
  where s.vertical_chave = v_vertical;

  get diagnostics v_qtd = row_count;

  update public.tenants
  set onboarding_etapa = greatest(onboarding_etapa, 3)
  where id = p_tenant;

  return v_qtd;
end $$;

comment on function app.aplicar_kit_inicial is
  'Copia o catálogo de demonstração do nicho para o tenant. Recusa se já houver produtos.';

-- -----------------------------------------------------------------------------
-- Importador de produtos (item 45) — recebe linhas já mapeadas pelo frontend
-- e devolve relatório por linha; nada é gravado em caso de erro estrutural.
-- -----------------------------------------------------------------------------
create or replace function app.importar_produtos(p_tenant uuid, p_itens jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_item      jsonb;
  v_linha     integer := 0;
  v_inseridos integer := 0;
  v_atualizados integer := 0;
  v_erros     jsonb := '[]';
  v_nome      text;
  v_preco     numeric;
  v_unidade   text;
  v_sku       text;
  v_cat_id    uuid;
begin
  if not app.pode(p_tenant, 'catalogo.criar') then
    raise exception 'Sem permissão para importar produtos.' using errcode = '42501';
  end if;
  if jsonb_typeof(p_itens) <> 'array' then
    raise exception 'Esperada uma lista de itens.' using errcode = '22023';
  end if;

  for v_item in select * from jsonb_array_elements(p_itens) loop
    v_linha := v_linha + 1;
    begin
      v_nome  := nullif(trim(v_item ->> 'nome'), '');
      v_preco := coalesce((v_item ->> 'preco')::numeric, 0);
      v_unidade := coalesce(nullif(v_item ->> 'unidade', ''), 'un');
      v_sku   := nullif(trim(v_item ->> 'sku'), '');

      if v_nome is null then
        raise exception 'nome vazio';
      end if;
      if v_preco < 0 then
        raise exception 'preço negativo';
      end if;
      if not exists (select 1 from public.units where chave = v_unidade) then
        raise exception 'unidade "%" desconhecida', v_unidade;
      end if;

      v_cat_id := null;
      if nullif(trim(v_item ->> 'categoria'), '') is not null then
        insert into public.product_categories (tenant_id, nome)
        values (p_tenant, trim(v_item ->> 'categoria'))
        on conflict (tenant_id, nome) do update set nome = excluded.nome
        returning id into v_cat_id;
      end if;

      if v_sku is not null and exists (
        select 1 from public.products where tenant_id = p_tenant and sku = v_sku
      ) then
        update public.products
        set nome = v_nome,
            preco_venda = v_preco,
            unidade = v_unidade,
            categoria_id = coalesce(v_cat_id, categoria_id),
            codigo_barras = coalesce(nullif(v_item ->> 'codigo_barras', ''), codigo_barras),
            custo = coalesce((v_item ->> 'custo')::numeric, custo)
        where tenant_id = p_tenant and sku = v_sku;
        v_atualizados := v_atualizados + 1;
      else
        insert into public.products
          (tenant_id, categoria_id, nome, sku, codigo_barras, unidade, preco_venda, custo)
        values
          (p_tenant, v_cat_id, v_nome, v_sku,
           nullif(v_item ->> 'codigo_barras', ''), v_unidade, v_preco,
           coalesce((v_item ->> 'custo')::numeric, 0));
        v_inseridos := v_inseridos + 1;
      end if;
    exception when others then
      v_erros := v_erros || jsonb_build_object('linha', v_linha, 'erro', sqlerrm);
    end;
  end loop;

  return jsonb_build_object(
    'inseridos', v_inseridos,
    'atualizados', v_atualizados,
    'erros', v_erros
  );
end $$;

comment on function app.importar_produtos is
  'Importação em lote (CSV/Excel mapeado no frontend). Upsert por SKU; erros linha a linha.';

revoke all on function app.aplicar_kit_inicial(uuid) from public;
revoke all on function app.importar_produtos(uuid, jsonb) from public;
grant execute on function app.aplicar_kit_inicial(uuid) to public;
grant execute on function app.importar_produtos(uuid, jsonb) to public;
