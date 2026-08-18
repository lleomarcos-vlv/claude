-- =============================================================================
-- 0004 · Provisionamento de tenant
--
-- Cria empresa + matriz + os 13 papéis (copiados dos templates) + vincula o
-- usuário autenticado como Proprietário. Tudo em uma transação: ou a empresa
-- nasce completa e utilizável, ou não nasce.
-- =============================================================================

create or replace function app.provisionar_tenant(
  p_razao_social  text,
  p_slug          text,
  p_nome_fantasia text default null,
  p_cnpj          text default null,
  p_uf            char(2) default null,
  p_municipio     text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_tenant_id uuid;
  v_role_id   uuid;
  v_user_id   uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Nenhum usuário autenticado.' using errcode = '28000';
  end if;

  if not exists (select 1 from public.profiles where id = v_user_id) then
    raise exception 'Perfil do usuário não encontrado. Conclua o cadastro antes de criar a empresa.'
      using errcode = 'P0002';
  end if;

  insert into public.tenants (slug, razao_social, nome_fantasia, cnpj, uf, municipio)
  values (p_slug, p_razao_social, p_nome_fantasia, p_cnpj, p_uf, p_municipio)
  returning id into v_tenant_id;

  -- Filial matriz
  insert into public.branches (tenant_id, codigo, nome, cnpj, uf, municipio, matriz)
  values (v_tenant_id, '001', coalesce(p_nome_fantasia, p_razao_social), p_cnpj, p_uf, p_municipio, true);

  -- Copia os 13 perfis-modelo para o tenant
  insert into public.roles (tenant_id, chave, nome, descricao, sistema)
  select v_tenant_id, t.chave, t.nome, t.descricao, true
  from public.role_templates t;

  -- Copia as permissões de cada perfil
  insert into public.role_permissions (role_id, permission_chave)
  select r.id, tp.permission_chave
  from public.roles r
  join public.role_template_permissions tp on tp.role_template_chave = r.chave
  where r.tenant_id = v_tenant_id;

  -- Vincula quem criou como Proprietário
  select id into v_role_id
  from public.roles
  where tenant_id = v_tenant_id and chave = 'proprietario';

  insert into public.memberships (tenant_id, user_id, role_id, status, aceito_em)
  values (v_tenant_id, v_user_id, v_role_id, 'ativo', now());

  return v_tenant_id;
end $$;

comment on function app.provisionar_tenant is
  'Cria empresa completa e vincula o usuário autenticado como Proprietário. Transacional.';

revoke all on function app.provisionar_tenant(text, text, text, text, char, text) from public;
grant execute on function app.provisionar_tenant(text, text, text, text, char, text) to public;
