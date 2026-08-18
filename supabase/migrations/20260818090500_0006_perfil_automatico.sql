-- =============================================================================
-- 0006 · Perfil automático no cadastro (Fase 2)
--
-- Quando o Supabase Auth cria um usuário (signUp), o perfil em public.profiles
-- nasce junto, com o nome vindo dos metadados do cadastro. Sem isso, aceitar
-- convite e provisionar empresa falhariam por falta de perfil.
--
-- Padrão documentado pelo Supabase: função + gatilho em auth.users.
-- =============================================================================

-- O shim local de auth.users (migration 0001) não tem a coluna de metadados.
-- No Supabase ela existe e este bloco não executa (ALTER em auth.users lá
-- falharia por dono — por isso o guard, em vez de "add column if not exists").
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'auth' and table_name = 'users'
                   and column_name = 'raw_user_meta_data') then
    alter table auth.users add column raw_user_meta_data jsonb;
  end if;
end $$;

create or replace function app.fn_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  insert into public.profiles (id, nome, email)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'nome', ''),
      split_part(new.email, '@', 1)
    ),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end $$;

comment on function app.fn_novo_usuario is
  'Cria o perfil público junto com o usuário do Auth. Gatilho em auth.users.';

drop trigger if exists trg_novo_usuario on auth.users;
create trigger trg_novo_usuario
  after insert on auth.users
  for each row execute function app.fn_novo_usuario();
