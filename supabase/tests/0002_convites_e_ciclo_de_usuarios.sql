-- =============================================================================
-- Teste do fluxo de convites e ciclo de vida de usuários (Fase 2)
--
-- Executa como o papel "authenticated", igual ao teste 0001. Assume que as
-- migrations 0001–0005 já foram aplicadas e roda no mesmo banco APÓS o 0001
-- (reusa a Lanchonete da Ana no passo 8).
--
--   psql -f supabase/tests/0002_convites_e_ciclo_de_usuarios.sql
--
-- Variáveis psql não interpolam dentro de blocos DO; valores dinâmicos
-- (tokens, ids) passam por set_config/current_setting no prefixo "test.".
-- =============================================================================

\set ON_ERROR_STOP on
\set QUIET 1

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
-- Massa: Diego (dono da pizzaria), Elisa (convidada), Fábio (intruso)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('44444444-4444-4444-4444-444444444444', 'diego@pizzaria.test'),
  ('55555555-5555-5555-5555-555555555555', 'elisa@pizzaria.test'),
  ('66666666-6666-6666-6666-666666666666', 'fabio@intruso.test');

insert into public.profiles (id, nome, email) values
  ('44444444-4444-4444-4444-444444444444', 'Diego', 'diego@pizzaria.test'),
  ('55555555-5555-5555-5555-555555555555', 'Elisa', 'elisa@pizzaria.test'),
  ('66666666-6666-6666-6666-666666666666', 'Fábio', 'fabio@intruso.test')
on conflict (id) do update set nome = excluded.nome;  -- 0006 já criou via gatilho

set role authenticated;
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
select app.provisionar_tenant('Pizzaria do Diego LTDA', 'pizzaria-diego', 'Pizzaria do Diego') as t_pizza \gset
select set_config('test.t_pizza', :'t_pizza', false) \g /dev/null

-- ===========================================================================
-- 1. Proprietário convida; token sai em claro, banco guarda só o hash
-- ===========================================================================
select token as tok_elisa from app.convidar_usuario(:'t_pizza'::uuid, 'elisa@pizzaria.test', 'caixa') \gset
select set_config('test.tok_elisa', :'tok_elisa', false) \g /dev/null

do $$
declare v_hash text; v_status app.status_convite; v_token text := current_setting('test.tok_elisa');
begin
  select token_hash, status into v_hash, v_status
  from public.invitations
  where tenant_id = current_setting('test.t_pizza')::uuid and email = 'elisa@pizzaria.test';

  if v_status <> 'pendente' then raise exception 'Convite deveria estar pendente, está %', v_status; end if;
  if v_hash = v_token then raise exception 'Token em claro foi parar no banco'; end if;
  if v_hash <> encode(sha256(v_token::bytea), 'hex') then
    raise exception 'Hash não corresponde ao token emitido';
  end if;

  raise notice 'OK  1 · convite criado: status pendente e somente o hash armazenado';
end $$;

-- ===========================================================================
-- 2. Sem permissão não convida, nem por função nem por insert direto
-- ===========================================================================
set request.jwt.claim.sub = '66666666-6666-6666-6666-666666666666';

do $$
declare v_falhou boolean := false; v_tenant uuid := current_setting('test.t_pizza')::uuid;
begin
  begin
    perform app.convidar_usuario(v_tenant, 'alguem@x.test', 'caixa');
  exception when insufficient_privilege then v_falhou := true;
  end;
  if not v_falhou then raise exception 'Intruso conseguiu convidar'; end if;

  v_falhou := false;
  begin
    insert into public.invitations (tenant_id, email, role_id, token_hash, expira_em)
    values (v_tenant, 'x@x.test', gen_random_uuid(), 'hash-forjado', now() + interval '1 day');
  exception when others then v_falhou := true;
  end;
  if not v_falhou then raise exception 'Insert direto em invitations passou pela RLS'; end if;

  raise notice 'OK  2 · sem permissão: função nega e insert direto é barrado pela RLS';
end $$;

-- ===========================================================================
-- 3. Convite é nominal: Fábio não aceita convite da Elisa
-- ===========================================================================
do $$
declare v_falhou boolean := false;
begin
  begin
    perform app.aceitar_convite(current_setting('test.tok_elisa'));
  exception when insufficient_privilege then v_falhou := true;
  end;
  if not v_falhou then raise exception 'Convite aceito por e-mail diferente do convidado'; end if;
  raise notice 'OK  3 · convite nominal: outro usuário não consegue usá-lo';
end $$;

-- ===========================================================================
-- 4. Elisa aceita: vínculo ativo com o papel do convite
-- ===========================================================================
set request.jwt.claim.sub = '55555555-5555-5555-5555-555555555555';

do $$
declare v_tenant uuid; v_papel text; v_status app.status_vinculo;
begin
  v_tenant := app.aceitar_convite(current_setting('test.tok_elisa'));
  if v_tenant <> current_setting('test.t_pizza')::uuid then
    raise exception 'Tenant retornado incorreto';
  end if;

  select r.chave, m.status into v_papel, v_status
  from public.memberships m join public.roles r on r.id = m.role_id
  where m.tenant_id = v_tenant and m.user_id = '55555555-5555-5555-5555-555555555555';

  if v_status <> 'ativo' then raise exception 'Vínculo deveria estar ativo, está %', v_status; end if;
  if v_papel  <> 'caixa' then raise exception 'Papel deveria ser caixa, é %', v_papel;  end if;

  raise notice 'OK  4 · aceite: vínculo ativo com o papel do convite';
end $$;

-- Convite consta como aceito (checado fora da RLS, que a Elisa não lê convites)
reset role;
do $$
declare v_conv app.status_convite;
begin
  select status into v_conv
  from public.invitations
  where tenant_id = current_setting('test.t_pizza')::uuid and email = 'elisa@pizzaria.test';
  if v_conv <> 'aceito' then raise exception 'Convite deveria constar aceito, está %', v_conv; end if;
end $$;
set role authenticated;
set request.jwt.claim.sub = '55555555-5555-5555-5555-555555555555';

-- ===========================================================================
-- 5. Token inválido e reuso de token aceito são recusados
-- ===========================================================================
do $$
declare v_falhou boolean := false;
begin
  begin
    perform app.aceitar_convite('token-que-nao-existe');
  exception when others then v_falhou := true;
  end;
  if not v_falhou then raise exception 'Token inexistente foi aceito'; end if;

  v_falhou := false;
  begin
    perform app.aceitar_convite(current_setting('test.tok_elisa'));   -- já usado no passo 4
  exception when others then v_falhou := true;
  end;
  if not v_falhou then raise exception 'Token já usado foi aceito de novo'; end if;

  raise notice 'OK  5 · token inválido ou já usado é recusado';
end $$;

-- ===========================================================================
-- 6. Convite vencido não entra; app.expirar_convites() marca em lote
-- ===========================================================================
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
select token as tok_vencido
from app.convidar_usuario(:'t_pizza'::uuid, 'fabio@intruso.test', 'garcom', null, interval '-1 hour') \gset
select set_config('test.tok_vencido', :'tok_vencido', false) \g /dev/null

set request.jwt.claim.sub = '66666666-6666-6666-6666-666666666666';
do $$
declare v_falhou boolean := false;
begin
  begin
    perform app.aceitar_convite(current_setting('test.tok_vencido'));
  exception when others then v_falhou := true;
  end;
  if not v_falhou then raise exception 'Convite vencido foi aceito'; end if;
end $$;

reset role;  -- expirar_convites é do agendador, não do usuário
do $$
declare v_n int; v_status app.status_convite;
begin
  v_n := app.expirar_convites();
  if v_n < 1 then raise exception 'Nenhum convite expirado pelo lote'; end if;

  select status into v_status
  from public.invitations
  where tenant_id = current_setting('test.t_pizza')::uuid and email = 'fabio@intruso.test';
  if v_status <> 'expirado' then raise exception 'Convite deveria estar expirado, está %', v_status; end if;

  raise notice 'OK  6 · convite vencido recusado e marcado expirado pelo lote';
end $$;
set role authenticated;

-- ===========================================================================
-- 7. Reconvidar substitui o pendente; o token antigo deixa de valer
-- ===========================================================================
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

select token as tok_v1 from app.convidar_usuario(:'t_pizza'::uuid, 'novo@pizzaria.test', 'garcom') \gset
select set_config('test.tok_v1', :'tok_v1', false) \g /dev/null
select token as tok_v2 from app.convidar_usuario(:'t_pizza'::uuid, 'novo@pizzaria.test', 'vendedor') \gset

do $$
declare v_pendentes int; v_falhou boolean := false;
begin
  select count(*) into v_pendentes
  from public.invitations
  where tenant_id = current_setting('test.t_pizza')::uuid
    and email = 'novo@pizzaria.test' and status = 'pendente';
  if v_pendentes <> 1 then raise exception 'Esperado 1 convite pendente, há %', v_pendentes; end if;

  begin
    perform app.aceitar_convite(current_setting('test.tok_v1'));
  exception when others then v_falhou := true;
  end;
  if not v_falhou then raise exception 'Token revogado continuou válido'; end if;

  raise notice 'OK  7 · reconvite substitui o pendente e invalida o token antigo';
end $$;

-- ===========================================================================
-- 8. Troca de empresa: quem tem dois vínculos vê as duas empresas
-- ===========================================================================
-- Elisa entra também na Lanchonete da Ana (tenant do teste 0001).
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select t.id as t_ana from public.tenants t where t.slug = 'lanchonete-ana' \gset
select token as tok_elisa2 from app.convidar_usuario(:'t_ana'::uuid, 'elisa@pizzaria.test', 'vendedor') \gset
select set_config('test.tok_elisa2', :'tok_elisa2', false) \g /dev/null

set request.jwt.claim.sub = '55555555-5555-5555-5555-555555555555';
do $$
declare v_n int; v_ignora uuid;
begin
  v_ignora := app.aceitar_convite(current_setting('test.tok_elisa2'));
  select count(*) into v_n from app.minhas_empresas();
  if v_n <> 2 then raise exception 'Elisa deveria ver 2 empresas, vê %', v_n; end if;
  raise notice 'OK  8 · minhas_empresas lista os dois vínculos para a troca de empresa';
end $$;

-- ===========================================================================
-- 9. Convites deixam trilha de auditoria
-- ===========================================================================
reset role;
do $$
declare v_n int;
begin
  select count(*) into v_n
  from public.audit_log
  where tabela = 'invitations'
    and tenant_id = current_setting('test.t_pizza')::uuid;
  if v_n < 3 then raise exception 'Auditoria de convites insuficiente: % registros', v_n; end if;
  raise notice 'OK  9 · trilha de auditoria registra o ciclo dos convites';
end $$;

\echo ''
\echo '================================================'
\echo ' 9/9 asserções passaram · Fase 2 (convites) ok'
\echo '================================================'
