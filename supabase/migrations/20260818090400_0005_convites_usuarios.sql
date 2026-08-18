-- =============================================================================
-- 0005 · Convites e ciclo de vida de usuários (Fase 2)
--
-- O login em si é do Supabase Auth (e-mail/senha, recuperação, MFA, rate limit
-- — ver supabase/README.md). O que pertence ao banco é o que o Auth não cobre:
-- convidar alguém para um tenant, aceitar o convite com segurança e listar as
-- empresas do usuário para a troca de contexto.
--
-- Segurança do token: o banco guarda apenas o hash SHA-256. O token em claro
-- aparece uma única vez, no retorno de app.convidar_usuario, para ser enviado
-- por e-mail. Vazamento da tabela não compromete convites.
-- =============================================================================

create type app.status_convite as enum ('pendente', 'aceito', 'expirado', 'revogado');

-- -----------------------------------------------------------------------------
-- invitations · convite de usuário para um tenant
-- -----------------------------------------------------------------------------
create table public.invitations (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  email         citext not null,
  role_id       uuid not null references public.roles(id) on delete cascade,
  -- null = acesso a todas as filiais
  branch_id     uuid references public.branches(id) on delete set null,
  token_hash    text not null unique,
  status        app.status_convite not null default 'pendente',
  expira_em     timestamptz not null,
  convidado_por uuid references public.profiles(id) on delete set null,
  aceito_por    uuid references public.profiles(id) on delete set null,
  aceito_em     timestamptz,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- No máximo um convite pendente por e-mail em cada tenant.
create unique index invitations_pendente_unico
  on public.invitations (tenant_id, email) where status = 'pendente';

create index on public.invitations (tenant_id, status);

comment on table public.invitations is
  'Convite de usuário. Só o hash do token é armazenado; o claro sai uma vez para o e-mail.';

create trigger trg_invitations_atualizado before update on public.invitations
  for each row execute function app.fn_atualizado_em();

create trigger trg_audit_invitations after insert or update or delete on public.invitations
  for each row execute function app.fn_auditoria();

-- -----------------------------------------------------------------------------
-- RLS: leitura para quem gerencia usuários; escrita SÓ pelas funções abaixo
-- (security definer). Sem policy de insert/update/delete, escrita direta do
-- cliente é negada — o fluxo passa obrigatoriamente pela validação da função.
-- -----------------------------------------------------------------------------
alter table public.invitations enable row level security;

create policy invitations_leitura on public.invitations
  for select using (app.pode(tenant_id, 'usuarios.ver'));

-- -----------------------------------------------------------------------------
-- Convidar
-- -----------------------------------------------------------------------------
create or replace function app.convidar_usuario(
  p_tenant     uuid,
  p_email      citext,
  p_role_chave text,
  p_branch     uuid default null,
  p_validade   interval default interval '7 days'
)
returns table (convite_id uuid, token text)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_role_id  uuid;
  v_token    text;
  v_convite  uuid;
begin
  if not app.pode(p_tenant, 'usuarios.convidar') then
    raise exception 'Sem permissão para convidar usuários.' using errcode = '42501';
  end if;

  select r.id into v_role_id
  from public.roles r
  where r.tenant_id = p_tenant and r.chave = p_role_chave;
  if v_role_id is null then
    raise exception 'Papel "%" não existe neste tenant.', p_role_chave using errcode = 'P0002';
  end if;

  if p_branch is not null and not exists (
    select 1 from public.branches b where b.id = p_branch and b.tenant_id = p_tenant
  ) then
    raise exception 'Filial não pertence ao tenant.' using errcode = 'P0002';
  end if;

  -- Já é membro ativo? Convite não faz sentido.
  if exists (
    select 1
    from public.memberships m
    join public.profiles p on p.id = m.user_id
    where m.tenant_id = p_tenant and m.status = 'ativo' and p.email = p_email
  ) then
    raise exception 'Este e-mail já pertence a um usuário ativo da empresa.' using errcode = '23505';
  end if;

  -- Reconvidar substitui o convite pendente anterior.
  update public.invitations
  set status = 'revogado'
  where tenant_id = p_tenant and email = p_email and status = 'pendente';

  -- 256 bits de aleatoriedade; só o hash vai para o banco.
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');

  insert into public.invitations (tenant_id, email, role_id, branch_id, token_hash, expira_em, convidado_por)
  values (p_tenant, p_email, v_role_id, p_branch,
          encode(sha256(v_token::bytea), 'hex'),
          now() + p_validade, auth.uid())
  returning id into v_convite;

  return query select v_convite, v_token;
end $$;

comment on function app.convidar_usuario is
  'Cria convite e retorna o token em claro uma única vez, para envio por e-mail.';

-- -----------------------------------------------------------------------------
-- Aceitar
-- -----------------------------------------------------------------------------
create or replace function app.aceitar_convite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_convite public.invitations%rowtype;
  v_user    uuid := auth.uid();
  v_email   citext;
begin
  if v_user is null then
    raise exception 'Nenhum usuário autenticado.' using errcode = '28000';
  end if;

  select p.email into v_email from public.profiles p where p.id = v_user;
  if v_email is null then
    raise exception 'Perfil do usuário não encontrado. Conclua o cadastro antes de aceitar o convite.'
      using errcode = 'P0002';
  end if;

  select * into v_convite
  from public.invitations
  where token_hash = encode(sha256(p_token::bytea), 'hex')
  for update;

  if v_convite.id is null then
    raise exception 'Convite inválido.' using errcode = 'P0002';
  end if;
  if v_convite.status <> 'pendente' then
    raise exception 'Convite não está mais disponível (status: %).', v_convite.status using errcode = '55000';
  end if;
  if v_convite.expira_em < now() then
    -- A marcação fica para app.expirar_convites(): um update aqui seria
    -- desfeito pelo rollback da própria exceção.
    raise exception 'Convite expirado.' using errcode = '55000';
  end if;
  -- O convite é nominal: só o dono do e-mail convidado pode usá-lo.
  if v_convite.email <> v_email then
    raise exception 'Este convite foi emitido para outro e-mail.' using errcode = '42501';
  end if;

  -- Vínculo anterior removido/suspenso é reativado com o papel do convite.
  insert into public.memberships (tenant_id, user_id, role_id, branch_id, status, convidado_por, aceito_em)
  values (v_convite.tenant_id, v_user, v_convite.role_id, v_convite.branch_id,
          'ativo', v_convite.convidado_por, now())
  on conflict (tenant_id, user_id) do update
    set role_id   = excluded.role_id,
        branch_id = excluded.branch_id,
        status    = 'ativo',
        aceito_em = now();

  update public.invitations
  set status = 'aceito', aceito_por = v_user, aceito_em = now()
  where id = v_convite.id;

  return v_convite.tenant_id;
end $$;

comment on function app.aceitar_convite is
  'Valida token, e-mail e validade; cria (ou reativa) o vínculo e retorna o tenant_id.';

-- -----------------------------------------------------------------------------
-- Revogar
-- -----------------------------------------------------------------------------
create or replace function app.revogar_convite(p_convite uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_tenant uuid;
begin
  select tenant_id into v_tenant from public.invitations where id = p_convite;
  if v_tenant is null then
    raise exception 'Convite não encontrado.' using errcode = 'P0002';
  end if;
  if not app.pode(v_tenant, 'usuarios.editar') then
    raise exception 'Sem permissão para revogar convites.' using errcode = '42501';
  end if;

  update public.invitations
  set status = 'revogado'
  where id = p_convite and status = 'pendente';
end $$;

-- -----------------------------------------------------------------------------
-- Expirar em lote (agendar no Supabase: cron diário)
-- -----------------------------------------------------------------------------
create or replace function app.expirar_convites()
returns integer
language sql
security definer
set search_path = public, pg_catalog
as $$
  with expirados as (
    update public.invitations
    set status = 'expirado'
    where status = 'pendente' and expira_em < now()
    returning 1
  )
  select count(*)::integer from expirados;
$$;

comment on function app.expirar_convites is
  'Marca convites vencidos. Agendar via pg_cron ou Edge Function diária.';

-- -----------------------------------------------------------------------------
-- Troca de empresa: lista as empresas do usuário com o papel em cada uma
-- -----------------------------------------------------------------------------
create or replace function app.minhas_empresas()
returns table (
  tenant_id     uuid,
  slug          citext,
  razao_social  text,
  nome_fantasia text,
  vertical_chave text,
  papel_chave   text,
  papel_nome    text,
  branch_id     uuid
)
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select t.id, t.slug, t.razao_social, t.nome_fantasia, t.vertical_chave,
         r.chave, r.nome, m.branch_id
  from public.memberships m
  join public.tenants t on t.id = m.tenant_id
  join public.roles   r on r.id = m.role_id
  where m.user_id = auth.uid()
    and m.status  = 'ativo'
    and t.status in ('trial', 'ativo')
  order by t.razao_social;
$$;

comment on function app.minhas_empresas is
  'Empresas do usuário logado, para o seletor de troca de empresa.';

revoke all on function app.convidar_usuario(uuid, citext, text, uuid, interval) from public;
revoke all on function app.aceitar_convite(text)  from public;
revoke all on function app.revogar_convite(uuid)  from public;
revoke all on function app.expirar_convites()     from public;
revoke all on function app.minhas_empresas()      from public;
grant execute on function app.convidar_usuario(uuid, citext, text, uuid, interval) to public;
grant execute on function app.aceitar_convite(text) to public;
grant execute on function app.revogar_convite(uuid) to public;
grant execute on function app.minhas_empresas()     to public;
-- expirar_convites fica sem grant: só o agendador (service role) executa.
