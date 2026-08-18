-- =============================================================================
-- 0013 · Estrutura fiscal (Fase 7, itens 16–17)
--
-- O que esta migration entrega — e o que ela se recusa a entregar:
--   · ENTREGA: regras tributárias versionadas com vigência, fonte e marcação
--     de "validação do contador necessária"; motor de cálculo configurável
--     (nenhuma alíquota fixa em código); estrutura pronta para a Reforma
--     Tributária (IBS, CBS, IS, cClassTrib); fila de documentos fiscais para
--     o agente local (ACBr) consumir.
--   · NÃO ENTREGA: nenhuma regra fiscal pré-cadastrada (isso é papel do
--     contador — bloqueio B3) e nenhuma transmissão à SEFAZ (exige agente
--     local Windows com certificado A1 — bloqueios B2/B10). Sem regra
--     cadastrada o motor devolve vazio; a interface diz isso com todas as
--     letras em vez de inventar imposto.
-- =============================================================================

-- Campos fiscais do produto
alter table public.products
  add column ncm        text check (ncm is null or ncm ~ '^[0-9]{8}$'),
  add column cest       text check (cest is null or cest ~ '^[0-9]{7}$'),
  add column origem     smallint check (origem between 0 and 8),
  add column cfop_padrao text,
  add column cclasstrib text;          -- classificação tributária da Reforma (IBS/CBS)

create type app.tipo_imposto as enum ('icms', 'ipi', 'pis', 'cofins', 'iss', 'ibs', 'cbs', 'is');

-- -----------------------------------------------------------------------------
-- tax_rules · versionadas: regra nunca é editada, ganha versão nova com
-- vigência; a anterior é encerrada. Histórico de cálculo permanece auditável.
-- -----------------------------------------------------------------------------
create table public.tax_rules (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  tipo_imposto       app.tipo_imposto not null,
  -- Escopo de aplicação (null = qualquer):
  uf                 char(2),
  regime             app.regime_trib,
  ncm_padrao         text,             -- '21069090' exato ou prefixo '2106'
  cfop               text,
  -- Tributação:
  cst                text,             -- CST/CSOSN conforme o imposto
  cclasstrib         text,             -- Reforma Tributária
  aliquota_pct       numeric(7,4) not null check (aliquota_pct >= 0),
  reducao_base_pct   numeric(6,3) not null default 0 check (reducao_base_pct >= 0 and reducao_base_pct <= 100),
  -- Versionamento (item 17):
  versao             int not null default 1,
  vigencia_inicio    date not null,
  vigencia_fim       date,             -- null = vigente
  fonte              text not null,    -- lei, convênio, Nota Técnica que embasa
  validacao_contador boolean not null default true,
  observacoes        text,
  criado_por         uuid references public.profiles(id) on delete set null,
  criado_em          timestamptz not null default now(),
  constraint tax_rules_vigencia check (vigencia_fim is null or vigencia_fim >= vigencia_inicio)
);

create index on public.tax_rules (tenant_id, tipo_imposto, vigencia_inicio);

comment on table public.tax_rules is
  'Regras tributárias versionadas. Atualizar = inserir versão nova; nada é editado no lugar.';

create trigger trg_audit_tax_rules after insert or update or delete on public.tax_rules
  for each row execute function app.fn_auditoria();

-- -----------------------------------------------------------------------------
-- fiscal_documents · fila para o agente local (ACBr) — estrutura da emissão
-- -----------------------------------------------------------------------------
create type app.tipo_doc_fiscal   as enum ('nfe', 'nfce', 'nfse', 'sat');
create type app.status_doc_fiscal as enum
  ('pendente', 'transmitindo', 'autorizada', 'rejeitada', 'cancelada', 'contingencia');

create table public.fiscal_documents (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id)  on delete cascade,
  branch_id        uuid not null references public.branches(id) on delete cascade,
  sale_id          uuid references public.sales(id) on delete set null,
  tipo             app.tipo_doc_fiscal not null,
  status           app.status_doc_fiscal not null default 'pendente',
  ambiente         text not null default 'homologacao'
                   check (ambiente in ('homologacao', 'producao')),
  numero           bigint,
  serie            smallint,
  chave            text,
  protocolo        text,
  xml_autorizado   text,
  motivo_rejeicao  text,
  impostos         jsonb not null default '[]',   -- retrato do cálculo no momento
  criado_por       uuid references public.profiles(id) on delete set null,
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now()
);

create index on public.fiscal_documents (tenant_id, status, criado_em);

comment on table public.fiscal_documents is
  'Fila de emissão. O agente local (Windows + ACBr + certificado A1) consome "pendente" e devolve o resultado; sem agente conectado nada é transmitido — e a interface mostra exatamente isso.';

create trigger trg_fiscal_docs_atualizado before update on public.fiscal_documents
  for each row execute function app.fn_atualizado_em();
create trigger trg_audit_fiscal_docs after insert or update or delete on public.fiscal_documents
  for each row execute function app.fn_auditoria();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.tax_rules        enable row level security;
alter table public.fiscal_documents enable row level security;

create policy regras_leitura on public.tax_rules
  for select using (app.pode(tenant_id, 'fiscal.ver'));
-- Escrita de regra só pela função (versionamento obrigatório).

create policy docs_leitura on public.fiscal_documents
  for select using (app.pode(tenant_id, 'fiscal.ver'));
-- Escrita só por função / agente local (service role).

-- -----------------------------------------------------------------------------
-- Criar regra fiscal (versiona e encerra a anterior do mesmo escopo)
-- -----------------------------------------------------------------------------
create or replace function app.criar_regra_fiscal(
  p_tenant uuid,
  p_tipo app.tipo_imposto,
  p_aliquota numeric,
  p_vigencia_inicio date,
  p_fonte text,
  p_uf char(2) default null,
  p_regime app.regime_trib default null,
  p_ncm_padrao text default null,
  p_cfop text default null,
  p_cst text default null,
  p_cclasstrib text default null,
  p_reducao_base numeric default 0,
  p_validacao_contador boolean default true,
  p_observacoes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_versao int;
  v_id uuid;
begin
  if not app.pode(p_tenant, 'fiscal.regras') then
    raise exception 'Editar regras tributárias exige fiscal.regras.' using errcode = '42501';
  end if;
  if nullif(trim(p_fonte), '') is null then
    raise exception 'Toda regra precisa da fonte legal (lei, convênio, NT).' using errcode = '22023';
  end if;

  -- Encerra a versão vigente do mesmo escopo no dia anterior à nova vigência.
  update public.tax_rules
  set vigencia_fim = p_vigencia_inicio - 1
  where tenant_id = p_tenant
    and tipo_imposto = p_tipo
    and uf         is not distinct from p_uf
    and regime     is not distinct from p_regime
    and ncm_padrao is not distinct from p_ncm_padrao
    and cfop       is not distinct from p_cfop
    and vigencia_fim is null
    and vigencia_inicio < p_vigencia_inicio;

  select coalesce(max(versao), 0) + 1 into v_versao
  from public.tax_rules
  where tenant_id = p_tenant
    and tipo_imposto = p_tipo
    and uf         is not distinct from p_uf
    and regime     is not distinct from p_regime
    and ncm_padrao is not distinct from p_ncm_padrao
    and cfop       is not distinct from p_cfop;

  insert into public.tax_rules
    (tenant_id, tipo_imposto, uf, regime, ncm_padrao, cfop, cst, cclasstrib,
     aliquota_pct, reducao_base_pct, versao, vigencia_inicio, fonte,
     validacao_contador, observacoes, criado_por)
  values
    (p_tenant, p_tipo, p_uf, p_regime, p_ncm_padrao, p_cfop, p_cst, p_cclasstrib,
     p_aliquota, coalesce(p_reducao_base, 0), v_versao, p_vigencia_inicio, p_fonte,
     p_validacao_contador, p_observacoes, auth.uid())
  returning id into v_id;

  return v_id;
end $$;

comment on function app.criar_regra_fiscal is
  'Única porta de escrita de regra: versiona e encerra a anterior do mesmo escopo.';

-- -----------------------------------------------------------------------------
-- Motor de cálculo (item 16) — nenhuma regra fixa em código.
-- Para cada imposto, escolhe a regra vigente mais específica:
--   NCM exato > NCM prefixo > sem NCM; UF casada > sem UF; regime casado > sem.
-- Sem regra cadastrada → sem linha no retorno (a interface avisa; não inventa).
-- -----------------------------------------------------------------------------
create or replace function app.calcular_impostos(
  p_tenant uuid,
  p_produto uuid,
  p_valor numeric,
  p_uf char(2) default null,
  p_data date default null
)
returns table (
  tipo_imposto app.tipo_imposto,
  regra_id uuid,
  cst text,
  cclasstrib text,
  aliquota_pct numeric,
  base numeric,
  valor numeric,
  validacao_contador boolean,
  fonte text
)
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  with produto as (
    select p.ncm, t.regime_tributario as regime, coalesce(p_uf, t.uf) as uf
    from public.products p
    join public.tenants t on t.id = p.tenant_id
    where p.id = p_produto and p.tenant_id = p_tenant
  ),
  candidatas as (
    select r.*,
      -- especificidade: NCM exato (4) > prefixo (3) > genérica (0); +2 UF; +1 regime
      (case
         when r.ncm_padrao is null then 0
         when (select ncm from produto) = r.ncm_padrao then 4
         when (select ncm from produto) like r.ncm_padrao || '%' then 3
         else -1000   -- NCM da regra não casa: descarta
       end
       + case when r.uf is null then 0
              when r.uf = (select uf from produto) then 2
              else -1000 end
       + case when r.regime is null then 0
              when r.regime = (select regime from produto) then 1
              else -1000 end) as pontos
    from public.tax_rules r
    where r.tenant_id = p_tenant
      and coalesce(p_data, current_date) >= r.vigencia_inicio
      and (r.vigencia_fim is null or coalesce(p_data, current_date) <= r.vigencia_fim)
  ),
  escolhidas as (
    select distinct on (c.tipo_imposto) c.*
    from candidatas c
    where c.pontos >= 0
    order by c.tipo_imposto, c.pontos desc, c.versao desc
  )
  select
    e.tipo_imposto,
    e.id,
    e.cst,
    e.cclasstrib,
    e.aliquota_pct,
    round(p_valor * (1 - e.reducao_base_pct / 100), 2),
    round(p_valor * (1 - e.reducao_base_pct / 100) * e.aliquota_pct / 100, 2),
    e.validacao_contador,
    e.fonte
  from escolhidas e
  where app.pode(p_tenant, 'fiscal.ver')
  order by e.tipo_imposto;
$$;

comment on function app.calcular_impostos is
  'Motor configurável: regra vigente mais específica por imposto. Sem regra = sem linha.';

-- -----------------------------------------------------------------------------
-- Solicitar emissão (entra na fila do agente local)
-- -----------------------------------------------------------------------------
create or replace function app.solicitar_emissao(
  p_venda uuid,
  p_tipo app.tipo_doc_fiscal default 'nfce'
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_venda public.sales%rowtype;
  v_id uuid;
  v_impostos jsonb;
begin
  select * into v_venda from public.sales where id = p_venda;
  if v_venda.id is null then
    raise exception 'Venda não encontrada.' using errcode = 'P0002';
  end if;
  if not app.pode(v_venda.tenant_id, 'fiscal.emitir') then
    raise exception 'Emitir documento fiscal exige fiscal.emitir.' using errcode = '42501';
  end if;
  if v_venda.status <> 'fechada' then
    raise exception 'Só se emite documento de venda fechada.' using errcode = '55000';
  end if;
  if exists (select 1 from public.fiscal_documents
             where sale_id = p_venda and status in ('pendente', 'transmitindo', 'autorizada')) then
    raise exception 'Esta venda já tem documento fiscal em andamento ou autorizado.' using errcode = '55000';
  end if;

  -- Retrato do cálculo por item no momento da solicitação.
  select coalesce(jsonb_agg(jsonb_build_object(
           'item', si.nome_produto,
           'valor', round(si.qtd * si.preco_unitario - si.desconto, 2),
           'impostos', (select coalesce(jsonb_agg(to_jsonb(c)), '[]')
                        from app.calcular_impostos(
                          v_venda.tenant_id, si.product_id,
                          round(si.qtd * si.preco_unitario - si.desconto, 2)) c)
         )), '[]')
  into v_impostos
  from public.sale_items si
  where si.sale_id = p_venda and not si.cancelado;

  insert into public.fiscal_documents
    (tenant_id, branch_id, sale_id, tipo, impostos, criado_por)
  values
    (v_venda.tenant_id, v_venda.branch_id, p_venda, p_tipo, v_impostos, auth.uid())
  returning id into v_id;

  return v_id;
end $$;

comment on function app.solicitar_emissao is
  'Enfileira o documento para o agente local. Sem agente conectado, fica "pendente" — visível como tal.';

revoke all on function app.criar_regra_fiscal(uuid, app.tipo_imposto, numeric, date, text, char, app.regime_trib, text, text, text, text, numeric, boolean, text) from public;
revoke all on function app.calcular_impostos(uuid, uuid, numeric, char, date) from public;
revoke all on function app.solicitar_emissao(uuid, app.tipo_doc_fiscal) from public;
grant execute on function app.criar_regra_fiscal(uuid, app.tipo_imposto, numeric, date, text, char, app.regime_trib, text, text, text, text, numeric, boolean, text) to public;
grant execute on function app.calcular_impostos(uuid, uuid, numeric, char, date) to public;
grant execute on function app.solicitar_emissao(uuid, app.tipo_doc_fiscal) to public;
