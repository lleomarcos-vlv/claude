-- =============================================================================
-- 0003 · Isolamento (RLS), autorização e auditoria
--
-- Regra central: o isolamento NÃO depende de nenhum parâmetro enviado pelo
-- cliente. As policies derivam de auth.uid() e da tabela memberships, que o
-- usuário não consegue forjar. Um tenant_id passado na requisição só restringe
-- ainda mais o resultado; nunca amplia.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Funções de autorização
-- SECURITY DEFINER para poder ler memberships sem cair na RLS da própria
-- tabela (evitando recursão infinita de policy).
-- -----------------------------------------------------------------------------

create or replace function app.tenants_do_usuario()
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select m.tenant_id
  from public.memberships m
  where m.user_id = auth.uid()
    and m.status  = 'ativo';
$$;

comment on function app.tenants_do_usuario() is
  'Tenants em que o usuário autenticado tem vínculo ativo. Base de toda policy de leitura.';

create or replace function app.pode(p_tenant uuid, p_permissao text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.memberships m
    join public.role_permissions rp on rp.role_id = m.role_id
    where m.user_id          = auth.uid()
      and m.status           = 'ativo'
      and m.tenant_id        = p_tenant
      and rp.permission_chave = p_permissao
  );
$$;

comment on function app.pode(uuid, text) is
  'Verdadeiro se o usuário autenticado tem a permissão informada dentro do tenant.';

-- Impede que qualquer papel de aplicação execute as funções com outro usuário.
revoke all on function app.tenants_do_usuario() from public;
revoke all on function app.pode(uuid, text)     from public;
grant execute on function app.tenants_do_usuario() to public;
grant execute on function app.pode(uuid, text)     to public;

-- -----------------------------------------------------------------------------
-- Auditoria
-- -----------------------------------------------------------------------------
create table public.audit_log (
  id              bigserial primary key,
  tenant_id       uuid references public.tenants(id) on delete cascade,
  user_id         uuid references public.profiles(id) on delete set null,
  tabela          text not null,
  registro_id     text,
  acao            text not null check (acao in ('INSERT', 'UPDATE', 'DELETE')),
  valor_anterior  jsonb,
  valor_novo      jsonb,
  campos_alterados text[],
  ip              inet,
  user_agent      text,
  criado_em       timestamptz not null default now()
);

create index on public.audit_log (tenant_id, criado_em desc);
create index on public.audit_log (tabela, registro_id);

comment on table public.audit_log is
  'Trilha de auditoria. Somente inserção: ninguém edita nem apaga registros por policy.';

create or replace function app.fn_auditoria()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_tenant   uuid;
  v_antes    jsonb;
  v_depois   jsonb;
  v_campos   text[];
  v_registro text;
begin
  v_antes  := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_depois := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;

  -- tenant_id da linha, quando a tabela tiver a coluna
  v_tenant := coalesce(
    nullif(v_depois ->> 'tenant_id', ''),
    nullif(v_antes  ->> 'tenant_id', '')
  )::uuid;

  v_registro := coalesce(v_depois ->> 'id', v_antes ->> 'id');

  if tg_op = 'UPDATE' then
    select array_agg(chave order by chave) into v_campos
    from (
      select key as chave
      from jsonb_each(v_depois)
      where v_antes -> key is distinct from v_depois -> key
        and key <> 'atualizado_em'
    ) diff;

    -- Nada mudou de fato: não polui a trilha.
    if v_campos is null then
      return new;
    end if;
  end if;

  insert into public.audit_log
    (tenant_id, user_id, tabela, registro_id, acao,
     valor_anterior, valor_novo, campos_alterados, ip, user_agent)
  values
    (v_tenant, auth.uid(), tg_table_name, v_registro, tg_op,
     v_antes, v_depois, v_campos,
     nullif(current_setting('request.headers.x-forwarded-for', true), '')::inet,
     nullif(current_setting('request.headers.user-agent',      true), ''));

  return coalesce(new, old);
end $$;

comment on function app.fn_auditoria() is
  'Gatilho genérico de auditoria. Aplicar em toda tabela com dado sensível ou financeiro.';

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.tenants          enable row level security;
alter table public.branches         enable row level security;
alter table public.profiles         enable row level security;
alter table public.roles            enable row level security;
alter table public.role_permissions enable row level security;
alter table public.memberships      enable row level security;
alter table public.audit_log        enable row level security;

-- Catálogos globais: leitura para qualquer autenticado, escrita só por migration.
alter table public.permissions               enable row level security;
alter table public.role_templates            enable row level security;
alter table public.role_template_permissions enable row level security;

create policy leitura_catalogo on public.permissions
  for select using (auth.uid() is not null);
create policy leitura_templates on public.role_templates
  for select using (auth.uid() is not null);
create policy leitura_templates_perm on public.role_template_permissions
  for select using (auth.uid() is not null);

-- tenants
create policy tenants_leitura on public.tenants
  for select using (id in (select app.tenants_do_usuario()));
create policy tenants_edicao on public.tenants
  for update using (app.pode(id, 'empresa.editar'))
  with check     (app.pode(id, 'empresa.editar'));

-- branches
create policy branches_leitura on public.branches
  for select using (tenant_id in (select app.tenants_do_usuario()));
create policy branches_criacao on public.branches
  for insert with check (app.pode(tenant_id, 'empresa.editar'));
create policy branches_edicao on public.branches
  for update using (app.pode(tenant_id, 'empresa.editar'))
  with check     (app.pode(tenant_id, 'empresa.editar'));
create policy branches_exclusao on public.branches
  for delete using (app.pode(tenant_id, 'empresa.editar'));

-- profiles: o próprio usuário, e quem divide tenant com ele
create policy profiles_proprio on public.profiles
  for select using (id = auth.uid());
create policy profiles_colegas on public.profiles
  for select using (
    exists (
      select 1 from public.memberships m
      where m.user_id = public.profiles.id
        and m.tenant_id in (select app.tenants_do_usuario())
    )
  );
create policy profiles_edicao_propria on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- roles
create policy roles_leitura on public.roles
  for select using (tenant_id in (select app.tenants_do_usuario()));
create policy roles_escrita on public.roles
  for all using (app.pode(tenant_id, 'usuarios.editar'))
  with check    (app.pode(tenant_id, 'usuarios.editar'));

-- role_permissions: segue o tenant do papel
create policy role_permissions_leitura on public.role_permissions
  for select using (
    exists (select 1 from public.roles r
            where r.id = role_permissions.role_id
              and r.tenant_id in (select app.tenants_do_usuario()))
  );
create policy role_permissions_escrita on public.role_permissions
  for all using (
    exists (select 1 from public.roles r
            where r.id = role_permissions.role_id
              and app.pode(r.tenant_id, 'usuarios.editar'))
  )
  with check (
    exists (select 1 from public.roles r
            where r.id = role_permissions.role_id
              and app.pode(r.tenant_id, 'usuarios.editar'))
  );

-- memberships
create policy memberships_leitura on public.memberships
  for select using (tenant_id in (select app.tenants_do_usuario()));
create policy memberships_convite on public.memberships
  for insert with check (app.pode(tenant_id, 'usuarios.convidar'));
create policy memberships_edicao on public.memberships
  for update using (app.pode(tenant_id, 'usuarios.editar'))
  with check     (app.pode(tenant_id, 'usuarios.editar'));
create policy memberships_remocao on public.memberships
  for delete using (app.pode(tenant_id, 'usuarios.remover'));

-- audit_log: leitura restrita, sem update nem delete para ninguém
create policy audit_leitura on public.audit_log
  for select using (app.pode(tenant_id, 'auditoria.ver'));

-- -----------------------------------------------------------------------------
-- Gatilhos de auditoria nas tabelas sensíveis desta fase
-- -----------------------------------------------------------------------------
create trigger trg_audit_tenants after insert or update or delete on public.tenants
  for each row execute function app.fn_auditoria();
create trigger trg_audit_branches after insert or update or delete on public.branches
  for each row execute function app.fn_auditoria();
create trigger trg_audit_memberships after insert or update or delete on public.memberships
  for each row execute function app.fn_auditoria();
create trigger trg_audit_roles after insert or update or delete on public.roles
  for each row execute function app.fn_auditoria();
