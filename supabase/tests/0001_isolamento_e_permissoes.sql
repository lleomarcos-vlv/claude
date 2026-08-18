-- =============================================================================
-- Teste de isolamento multi-tenant, permissões e auditoria
--
-- Executa como o papel "authenticated" (sem privilégios de superusuário), que é
-- o papel que o Supabase usa para requisições de usuário logado. Rodar como
-- superusuário invalidaria o teste, porque superusuário ignora RLS.
--
--   psql -f supabase/tests/0001_isolamento_e_permissoes.sql
-- Falha em qualquer asserção aborta com erro.
-- =============================================================================

\set ON_ERROR_STOP on
\set QUIET 1

-- ---------------------------------------------------------------------------
-- Papel de aplicação (no Supabase já existe)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end $$;

grant usage on schema public, app, auth to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ---------------------------------------------------------------------------
-- Massa de teste: dois usuários independentes (papel do Supabase Auth)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ana@lanchonete.test'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@farmacia.test'),
  ('33333333-3333-3333-3333-333333333333', 'carla@lanchonete.test');

insert into public.profiles (id, nome, email) values
  ('11111111-1111-1111-1111-111111111111', 'Ana',   'ana@lanchonete.test'),
  ('22222222-2222-2222-2222-222222222222', 'Bruno', 'bruno@farmacia.test'),
  ('33333333-3333-3333-3333-333333333333', 'Carla', 'carla@lanchonete.test');

-- ===========================================================================
-- 1. Cada usuário cria sua empresa
-- ===========================================================================
set role authenticated;

set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select app.provisionar_tenant('Lanchonete da Ana LTDA', 'lanchonete-ana', 'Lanchonete da Ana') as t_ana \gset

set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select app.provisionar_tenant('Drogaria Bruno LTDA', 'drogaria-bruno', 'Drogaria Bruno') as t_bruno \gset

reset role;

do $$
declare v_n int;
begin
  select count(*) into v_n from public.tenants;
  if v_n <> 2 then raise exception 'Esperado 2 tenants, encontrado %', v_n; end if;

  select count(*) into v_n from public.roles;
  if v_n <> 26 then raise exception 'Esperado 26 papéis (13 por tenant), encontrado %', v_n; end if;

  select count(*) into v_n from public.branches where matriz;
  if v_n <> 2 then raise exception 'Esperado 2 matrizes, encontrado %', v_n; end if;

  raise notice 'OK  1 · provisionamento: 2 tenants, 26 papéis, 2 matrizes';
end $$;

-- ===========================================================================
-- 2. Isolamento: Ana não enxerga nada do Bruno
-- ===========================================================================
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

do $$
declare
  v_tenants   int;
  v_slug      text;
  v_branches  int;
  v_roles     int;
  v_members   int;
begin
  select count(*) into v_tenants from public.tenants;
  if v_tenants <> 1 then
    raise exception 'VAZAMENTO: Ana enxerga % tenants, deveria enxergar 1', v_tenants;
  end if;

  select slug into v_slug from public.tenants;
  if v_slug <> 'lanchonete-ana' then
    raise exception 'VAZAMENTO: Ana enxerga o tenant "%"', v_slug;
  end if;

  select count(*) into v_branches from public.branches;
  if v_branches <> 1 then
    raise exception 'VAZAMENTO: Ana enxerga % filiais, deveria enxergar 1', v_branches;
  end if;

  select count(*) into v_roles from public.roles;
  if v_roles <> 13 then
    raise exception 'VAZAMENTO: Ana enxerga % papéis, deveria enxergar 13', v_roles;
  end if;

  select count(*) into v_members from public.memberships;
  if v_members <> 1 then
    raise exception 'VAZAMENTO: Ana enxerga % vínculos, deveria enxergar 1', v_members;
  end if;

  raise notice 'OK  2 · isolamento de leitura: Ana só vê o próprio tenant';
end $$;

-- ===========================================================================
-- 3. Isolamento de escrita: Ana não consegue gravar no tenant do Bruno
-- ===========================================================================
do $$
declare
  v_tenant_bruno uuid;
  v_falhou       boolean := false;
begin
  reset role;
  select id into v_tenant_bruno from public.tenants where slug = 'drogaria-bruno';
  set role authenticated;
  perform set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);

  begin
    insert into public.branches (tenant_id, codigo, nome)
    values (v_tenant_bruno, '999', 'Filial invasora');
  exception when insufficient_privilege or check_violation then
    v_falhou := true;
  end;

  if not v_falhou then
    raise exception 'FALHA CRÍTICA: Ana conseguiu inserir filial no tenant do Bruno';
  end if;

  raise notice 'OK  3 · isolamento de escrita: inserção cruzada bloqueada pela RLS';
end $$;

-- ===========================================================================
-- 4. Permissões granulares por papel
-- ===========================================================================
reset role;

-- Carla entra na lanchonete como Garçom
insert into public.memberships (tenant_id, user_id, role_id, status, aceito_em)
select t.id, '33333333-3333-3333-3333-333333333333', r.id, 'ativo', now()
from public.tenants t
join public.roles r on r.tenant_id = t.id and r.chave = 'garcom'
where t.slug = 'lanchonete-ana';

set role authenticated;
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

do $$
declare v_tenant uuid;
begin
  select id into v_tenant from public.tenants;   -- RLS já restringe ao tenant da Carla

  if not app.pode(v_tenant, 'pedidos.gerenciar') then
    raise exception 'Garçom deveria poder gerenciar comandas';
  end if;
  if not app.pode(v_tenant, 'catalogo.ver') then
    raise exception 'Garçom deveria poder ver o catálogo';
  end if;
  if app.pode(v_tenant, 'financeiro.ver') then
    raise exception 'FALHA: Garçom NÃO deveria acessar o financeiro';
  end if;
  if app.pode(v_tenant, 'fiscal.emitir') then
    raise exception 'FALHA: Garçom NÃO deveria emitir documento fiscal';
  end if;
  if app.pode(v_tenant, 'usuarios.remover') then
    raise exception 'FALHA: Garçom NÃO deveria remover usuários';
  end if;

  raise notice 'OK  4 · permissões por papel: garçom tem comandas, não tem financeiro nem fiscal';
end $$;

-- Garçom não consegue editar os dados da empresa
do $$
declare
  v_tenant uuid;
  v_afetadas int;
begin
  select id into v_tenant from public.tenants;
  update public.tenants set nome_fantasia = 'Alterado pelo garçom' where id = v_tenant;
  get diagnostics v_afetadas = row_count;
  if v_afetadas <> 0 then
    raise exception 'FALHA: garçom alterou dados da empresa (% linhas)', v_afetadas;
  end if;
  raise notice 'OK  5 · escrita sem permissão: update do garçom não afetou nenhuma linha';
end $$;

-- ===========================================================================
-- 5. Contador: acesso contábil, sem marketing e sem usuários
-- ===========================================================================
reset role;
do $$
declare v_role uuid; v_tenant uuid;
begin
  select t.id, r.id into v_tenant, v_role
  from public.tenants t
  join public.roles r on r.tenant_id = t.id and r.chave = 'contador'
  where t.slug = 'lanchonete-ana';

  update public.memberships
     set role_id = v_role
   where user_id = '33333333-3333-3333-3333-333333333333';
end $$;

set role authenticated;
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

do $$
declare v_tenant uuid;
begin
  select id into v_tenant from public.tenants;

  if not app.pode(v_tenant, 'fiscal.ver')           then raise exception 'Contador precisa ver o fiscal'; end if;
  if not app.pode(v_tenant, 'financeiro.ver')       then raise exception 'Contador precisa ver o financeiro'; end if;
  if not app.pode(v_tenant, 'relatorios.exportar')  then raise exception 'Contador precisa exportar relatórios'; end if;
  if app.pode(v_tenant, 'marketing.ver')            then raise exception 'FALHA: contador NÃO deve ver marketing'; end if;
  if app.pode(v_tenant, 'usuarios.ver')             then raise exception 'FALHA: contador NÃO deve ver usuários'; end if;
  if app.pode(v_tenant, 'fiscal.emitir')            then raise exception 'FALHA: contador NÃO deve emitir nota'; end if;

  raise notice 'OK  6 · perfil contador: leitura contábil, sem marketing, usuários ou emissão';
end $$;

-- ===========================================================================
-- 6. Auditoria: registra alteração com valor anterior e novo
-- ===========================================================================
reset role;
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

update public.tenants set nome_fantasia = 'Lanchonete da Ana — Centro'
where slug = 'lanchonete-ana';

do $$
declare
  v_reg record;
begin
  reset role;
  select * into v_reg
  from public.audit_log
  where tabela = 'tenants' and acao = 'UPDATE'
  order by criado_em desc limit 1;

  if v_reg is null then
    raise exception 'FALHA: alteração não gerou registro de auditoria';
  end if;
  if v_reg.user_id <> '11111111-1111-1111-1111-111111111111' then
    raise exception 'FALHA: auditoria registrou o usuário errado (%)', v_reg.user_id;
  end if;
  if v_reg.valor_anterior ->> 'nome_fantasia' <> 'Lanchonete da Ana' then
    raise exception 'FALHA: valor anterior incorreto (%)', v_reg.valor_anterior ->> 'nome_fantasia';
  end if;
  if v_reg.valor_novo ->> 'nome_fantasia' <> 'Lanchonete da Ana — Centro' then
    raise exception 'FALHA: valor novo incorreto (%)', v_reg.valor_novo ->> 'nome_fantasia';
  end if;
  if not ('nome_fantasia' = any (v_reg.campos_alterados)) then
    raise exception 'FALHA: campo alterado não registrado (%)', v_reg.campos_alterados;
  end if;

  raise notice 'OK  7 · auditoria: usuário, valor anterior, valor novo e campo alterado gravados';
end $$;

-- Auditoria é imutável para o usuário da aplicação
do $$
declare v_afetadas int; v_falhou boolean := false;
begin
  set role authenticated;
  perform set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
  begin
    update public.audit_log set acao = 'INSERT' where id > 0;
    get diagnostics v_afetadas = row_count;
    if v_afetadas > 0 then
      raise exception 'FALHA CRÍTICA: trilha de auditoria foi alterada (% linhas)', v_afetadas;
    end if;
    v_falhou := true;
  exception when insufficient_privilege then
    v_falhou := true;
  end;
  if not v_falhou then raise exception 'FALHA: auditoria não protegida'; end if;
  raise notice 'OK  8 · auditoria imutável: update do usuário da aplicação não altera a trilha';
end $$;

-- ===========================================================================
-- 7. Vínculo suspenso perde o acesso imediatamente
-- ===========================================================================
reset role;
update public.memberships set status = 'suspenso'
where user_id = '33333333-3333-3333-3333-333333333333';

set role authenticated;
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

do $$
declare v_n int;
begin
  select count(*) into v_n from public.tenants;
  if v_n <> 0 then
    raise exception 'FALHA: usuário suspenso ainda enxerga % tenants', v_n;
  end if;
  raise notice 'OK  9 · vínculo suspenso: acesso revogado na hora, sem depender do frontend';
end $$;

reset role;
\echo ''
\echo '================================================'
\echo ' 9/9 asserções passaram · Fase 1 validada'
\echo '================================================'
