-- =============================================================================
-- 0001 · Núcleo multi-tenant
-- Fase 1 do plano de evolução (docs/AUDITORIA.md).
--
-- Cria a base de isolamento entre clientes: tenants, filiais, perfis de usuário
-- e vínculos. Nenhuma tabela de negócio existe fora de um tenant.
--
-- Compatível com Supabase (usa auth.users / auth.uid) e com Postgres puro,
-- onde um shim de auth é criado para permitir testes locais de RLS.
-- =============================================================================

create extension if not exists "pgcrypto";      -- gen_random_uuid
create extension if not exists "citext";        -- e-mail sem distinção de caixa

-- -----------------------------------------------------------------------------
-- Shim de autenticação para ambiente local.
-- No Supabase o schema auth já existe e nada aqui é sobrescrito.
-- -----------------------------------------------------------------------------
create schema if not exists auth;

do $$
begin
  if not exists (select 1 from information_schema.tables
                 where table_schema = 'auth' and table_name = 'users') then
    create table auth.users (
      id    uuid primary key default gen_random_uuid(),
      email citext unique
    );
  end if;

  if not exists (select 1 from pg_proc p
                 join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'auth' and p.proname = 'uid') then
    -- Em ambiente local o usuário corrente vem de uma variável de sessão.
    -- No Supabase esta função já existe e deriva do JWT — não é substituída.
    execute $fn$
      create function auth.uid() returns uuid
      language sql stable
      as 'select nullif(current_setting(''request.jwt.claim.sub'', true), '''')::uuid';
    $fn$;
  end if;
end $$;

-- Schema de funções de apoio do aplicativo.
create schema if not exists app;

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
create type app.status_tenant   as enum ('trial', 'ativo', 'suspenso', 'cancelado');
create type app.plano_tenant    as enum ('basico', 'profissional', 'empresarial');
create type app.regime_trib     as enum ('simples_nacional', 'lucro_presumido', 'lucro_real', 'mei');
create type app.status_vinculo  as enum ('convidado', 'ativo', 'suspenso', 'removido');

-- -----------------------------------------------------------------------------
-- tenants · uma empresa cliente do SaaS
-- -----------------------------------------------------------------------------
create table public.tenants (
  id                uuid primary key default gen_random_uuid(),
  slug              citext not null unique,
  razao_social      text   not null,
  nome_fantasia     text,
  cnpj              text,
  regime_tributario app.regime_trib,
  uf                char(2),
  municipio         text,
  codigo_municipio  text,                      -- IBGE, exigido na emissão fiscal
  -- Chave do nicho (Food, Mercado, Moda...). Os kits são criados na migration
  -- de verticais (Fase 3); aqui fica apenas a referência escolhida no onboarding.
  vertical_chave    text,
  plano             app.plano_tenant  not null default 'basico',
  status            app.status_tenant not null default 'trial',
  onboarding_etapa  smallint not null default 0,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now(),
  constraint tenants_cnpj_formato check (cnpj is null or cnpj ~ '^[0-9]{14}$'),
  constraint tenants_slug_formato check (slug ~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$')
);

comment on table  public.tenants is 'Empresa cliente. Raiz do isolamento multi-tenant.';
comment on column public.tenants.cnpj is 'Somente dígitos. Validação de dígito verificador é feita na aplicação.';

-- -----------------------------------------------------------------------------
-- branches · filiais de um tenant
-- -----------------------------------------------------------------------------
create table public.branches (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  codigo         text not null,
  nome           text not null,
  cnpj           text,
  uf             char(2),
  municipio      text,
  matriz         boolean not null default false,
  ativa          boolean not null default true,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),
  unique (tenant_id, codigo)
);

create index on public.branches (tenant_id) where ativa;

-- Uma única matriz por tenant.
create unique index branches_matriz_unica on public.branches (tenant_id) where matriz;

comment on table public.branches is 'Filial. Estoque, caixa e vendas são segregados por filial.';

-- -----------------------------------------------------------------------------
-- profiles · identidade global do usuário (1:1 com auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  nome           text not null,
  email          citext not null,
  telefone       text,
  avatar_url     text,
  ultimo_acesso  timestamptz,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

comment on table public.profiles is
  'Dados do usuário. Um mesmo usuário pode pertencer a vários tenants via memberships.';

-- -----------------------------------------------------------------------------
-- Gatilho genérico de atualizado_em
-- -----------------------------------------------------------------------------
create or replace function app.fn_atualizado_em() returns trigger
language plpgsql as $$
begin
  new.atualizado_em := now();
  return new;
end $$;

create trigger trg_tenants_atualizado  before update on public.tenants
  for each row execute function app.fn_atualizado_em();
create trigger trg_branches_atualizado before update on public.branches
  for each row execute function app.fn_atualizado_em();
create trigger trg_profiles_atualizado before update on public.profiles
  for each row execute function app.fn_atualizado_em();
