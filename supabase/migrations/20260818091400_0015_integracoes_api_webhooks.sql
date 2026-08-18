-- =============================================================================
-- 0015 · Integrações, API pública e webhooks (Fase 9, itens 21–22, 46–48, 53)
--
-- Regra de honestidade (seção 50 do briefing): sem credencial real, cada
-- integração aparece como "não conectado" — o adapter existe, a tela de
-- configuração existe, e o teste de conexão retorna o erro verdadeiro.
-- Nenhum status "conectado" sem conexão real.
--
-- · Central de integrações: conectar / testar / desconectar / logs.
-- · API pública: chaves com hash + escopos (o endpoint REST em si é uma
--   Edge Function — pendência declarada; a validação da chave já vive aqui).
-- · Webhooks: 12 eventos, fila de entrega com retry e backoff exponencial
--   (o worker que faz o POST é Edge Function agendada — pendência declarada;
--   a fila, o payload e o cálculo de backoff são reais e testados).
-- · Segmentação automática de clientes por recência/frequência/valor.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Central de integrações (item 53)
-- -----------------------------------------------------------------------------
create table public.integration_catalog (
  provedor  text primary key,
  nome      text not null,
  categoria text not null,      -- marketplace | delivery | mensageria | anuncios | transporte
  ordem     smallint not null
);

insert into public.integration_catalog (provedor, nome, categoria, ordem) values
  ('ifood',        'iFood',              'delivery',    1),
  ('mercadolivre', 'Mercado Livre',      'marketplace', 2),
  ('shopee',       'Shopee',             'marketplace', 3),
  ('ubereats',     'Uber Eats',          'delivery',    4),
  ('whatsapp',     'WhatsApp Business',  'mensageria',  5),
  ('meta',         'Meta (Instagram/Facebook)', 'anuncios', 6),
  ('google_ads',   'Google Ads',         'anuncios',    7),
  ('uber',         'Uber (entregas)',    'transporte',  8),
  ('t99',          '99 (entregas)',      'transporte',  9);

create type app.status_integracao as enum ('nao_conectado', 'conectado', 'erro');

create table public.integrations (
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  provedor     text not null references public.integration_catalog(provedor),
  status       app.status_integracao not null default 'nao_conectado',
  -- Credenciais ficam em Vault/segredos do projeto em produção; aqui só
  -- referências não sensíveis (ex.: id da conta, phone_number_id).
  config       jsonb not null default '{}',
  conectado_em timestamptz,
  ultimo_teste timestamptz,
  ultimo_erro  text,
  primary key (tenant_id, provedor)
);

create table public.integration_logs (
  id        bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provedor  text not null,
  evento    text not null,             -- conectar | testar | desconectar | sync
  sucesso   boolean not null,
  detalhe   text,
  criado_em timestamptz not null default now()
);

create index on public.integration_logs (tenant_id, provedor, criado_em desc);

alter table public.integration_catalog enable row level security;
alter table public.integrations       enable row level security;
alter table public.integration_logs   enable row level security;

create policy cat_integracoes_leitura on public.integration_catalog
  for select using (auth.uid() is not null);
create policy integracoes_leitura on public.integrations
  for select using (app.pode(tenant_id, 'integracoes.ver'));
create policy integracoes_logs_leitura on public.integration_logs
  for select using (app.pode(tenant_id, 'integracoes.ver'));

create or replace function app.testar_integracao(p_tenant uuid, p_provedor text)
returns text                                  -- mensagem honesta do resultado
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_int public.integrations%rowtype;
  v_msg text;
begin
  if not app.pode(p_tenant, 'integracoes.gerenciar') then
    raise exception 'Sem permissão para gerenciar integrações.' using errcode = '42501';
  end if;

  insert into public.integrations (tenant_id, provedor)
  values (p_tenant, p_provedor)
  on conflict (tenant_id, provedor) do nothing;

  select * into v_int from public.integrations
  where tenant_id = p_tenant and provedor = p_provedor for update;

  -- Sem credencial cadastrada não há o que testar — e é isso que se responde.
  if v_int.config = '{}'::jsonb or v_int.config is null then
    v_msg := 'Não conectado: nenhuma credencial configurada. Cadastre as credenciais do provedor (bloqueios B5–B8).';
    update public.integrations
    set status = 'nao_conectado', ultimo_teste = now(), ultimo_erro = v_msg
    where tenant_id = p_tenant and provedor = p_provedor;
  else
    -- A chamada externa real é papel da Edge Function do adapter (precisa de
    -- rede e segredo). Até ela existir, o teste declara a limitação.
    v_msg := 'Credenciais registradas, mas o adapter externo (Edge Function) ainda não está publicado — status permanece não conectado.';
    update public.integrations
    set status = 'nao_conectado', ultimo_teste = now(), ultimo_erro = v_msg
    where tenant_id = p_tenant and provedor = p_provedor;
  end if;

  insert into public.integration_logs (tenant_id, provedor, evento, sucesso, detalhe)
  values (p_tenant, p_provedor, 'testar', false, v_msg);

  return v_msg;
end $$;

comment on function app.testar_integracao is
  'Testa e responde a verdade: sem credencial/adapter, o status é não conectado.';

-- -----------------------------------------------------------------------------
-- API pública (item 46): chaves com hash, prefixo visível e escopos
-- -----------------------------------------------------------------------------
create table public.api_keys (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  nome       text not null,
  prefixo    text not null,             -- "grf_ab12" — identificação visual
  chave_hash text not null unique,
  escopos    text[] not null default '{leitura}',
  rate_limit_por_min int not null default 60,
  criada_por uuid references public.profiles(id) on delete set null,
  criada_em  timestamptz not null default now(),
  revogada_em timestamptz
);

alter table public.api_keys enable row level security;
create policy api_keys_leitura on public.api_keys
  for select using (app.pode(tenant_id, 'integracoes.ver'));

create or replace function app.criar_api_key(
  p_tenant uuid, p_nome text, p_escopos text[] default '{leitura}'
)
returns table (key_id uuid, chave text)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_chave text;
  v_id uuid;
begin
  if not app.pode(p_tenant, 'integracoes.gerenciar') then
    raise exception 'Sem permissão para gerenciar chaves de API.' using errcode = '42501';
  end if;

  v_chave := 'grf_' || replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');

  insert into public.api_keys (tenant_id, nome, prefixo, chave_hash, escopos, criada_por)
  values (p_tenant, p_nome, left(v_chave, 8),
          encode(sha256(v_chave::bytea), 'hex'), p_escopos, auth.uid())
  returning id into v_id;

  return query select v_id, v_chave;   -- o claro sai UMA vez
end $$;

create or replace function app.revogar_api_key(p_key uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare v_tenant uuid;
begin
  select tenant_id into v_tenant from public.api_keys where id = p_key;
  if v_tenant is null then
    raise exception 'Chave não encontrada.' using errcode = 'P0002';
  end if;
  if not app.pode(v_tenant, 'integracoes.gerenciar') then
    raise exception 'Sem permissão.' using errcode = '42501';
  end if;
  update public.api_keys set revogada_em = now() where id = p_key and revogada_em is null;
end $$;

-- Usada pela Edge Function /api/v1 para autenticar a chave recebida.
create or replace function app.validar_api_key(p_chave text)
returns table (tenant_id uuid, escopos text[], rate_limit_por_min int)
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select k.tenant_id, k.escopos, k.rate_limit_por_min
  from public.api_keys k
  where k.chave_hash = encode(sha256(p_chave::bytea), 'hex')
    and k.revogada_em is null;
$$;

-- -----------------------------------------------------------------------------
-- Webhooks (itens 47–48): 12 eventos, fila com retry e backoff exponencial
-- -----------------------------------------------------------------------------
create table public.webhook_events (
  chave     text primary key,
  descricao text not null
);

insert into public.webhook_events (chave, descricao) values
  ('venda.fechada',        'Venda fechada no PDV'),
  ('venda.cancelada',      'Venda cancelada'),
  ('pedido.status',        'Status do pedido mudou (KDS)'),
  ('estoque.baixo',        'Produto atingiu o mínimo ou ponto de reposição'),
  ('estoque.movimentado',  'Movimentação de estoque registrada'),
  ('compra.recebida',      'Pedido de compra recebido'),
  ('conta.vencendo',       'Conta a pagar/receber vence em breve'),
  ('conta.baixada',        'Conta paga ou recebida'),
  ('cliente.criado',       'Cliente cadastrado'),
  ('caixa.fechado',        'Sessão de caixa fechada'),
  ('doc_fiscal.autorizado','Documento fiscal autorizado pela SEFAZ'),
  ('doc_fiscal.rejeitado', 'Documento fiscal rejeitado');

create table public.webhooks (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  url        text not null check (url ~ '^https://'),
  eventos    text[] not null,
  segredo    text not null,             -- assina o payload (HMAC na entrega)
  ativa      boolean not null default true,
  criado_em  timestamptz not null default now()
);

create type app.status_entrega as enum ('pendente', 'entregue', 'falha', 'abandonada');

create table public.webhook_deliveries (
  id            bigserial primary key,
  webhook_id    uuid not null references public.webhooks(id) on delete cascade,
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  evento        text not null,
  payload       jsonb not null,
  status        app.status_entrega not null default 'pendente',
  tentativas    int not null default 0,
  max_tentativas int not null default 6,
  proximo_envio timestamptz not null default now(),
  ultimo_erro   text,
  criado_em     timestamptz not null default now(),
  entregue_em   timestamptz
);

create index on public.webhook_deliveries (status, proximo_envio);
create index on public.webhook_deliveries (tenant_id, criado_em desc);

alter table public.webhook_events     enable row level security;
alter table public.webhooks           enable row level security;
alter table public.webhook_deliveries enable row level security;

create policy webhook_events_leitura on public.webhook_events
  for select using (auth.uid() is not null);
create policy webhooks_leitura on public.webhooks
  for select using (app.pode(tenant_id, 'integracoes.ver'));
create policy webhooks_escrita on public.webhooks
  for all using (app.pode(tenant_id, 'integracoes.gerenciar'))
  with check    (app.pode(tenant_id, 'integracoes.gerenciar'));
create policy deliveries_leitura on public.webhook_deliveries
  for select using (app.pode(tenant_id, 'integracoes.ver'));

-- Enfileira um evento para todos os webhooks inscritos do tenant.
create or replace function app.emitir_evento(p_tenant uuid, p_evento text, p_payload jsonb)
returns integer
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare v_n int;
begin
  if not exists (select 1 from public.webhook_events where chave = p_evento) then
    raise exception 'Evento "%" não existe no catálogo.', p_evento using errcode = 'P0002';
  end if;

  insert into public.webhook_deliveries (webhook_id, tenant_id, evento, payload)
  select w.id, p_tenant, p_evento,
         jsonb_build_object('evento', p_evento, 'emitido_em', now(), 'dados', p_payload)
  from public.webhooks w
  where w.tenant_id = p_tenant and w.ativa and p_evento = any(w.eventos);

  get diagnostics v_n = row_count;
  return v_n;
end $$;

-- Worker (Edge Function agendada) chama após cada tentativa de POST.
create or replace function app.registrar_tentativa_entrega(
  p_delivery bigint, p_sucesso boolean, p_erro text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare v public.webhook_deliveries%rowtype;
begin
  select * into v from public.webhook_deliveries where id = p_delivery for update;
  if v.id is null then
    raise exception 'Entrega não encontrada.' using errcode = 'P0002';
  end if;

  if p_sucesso then
    update public.webhook_deliveries
    set status = 'entregue', entregue_em = now(), tentativas = v.tentativas + 1
    where id = p_delivery;
  else
    update public.webhook_deliveries
    set tentativas = v.tentativas + 1,
        ultimo_erro = p_erro,
        status = case when v.tentativas + 1 >= v.max_tentativas
                      then 'abandonada'::app.status_entrega
                      else 'falha'::app.status_entrega end,
        -- backoff exponencial: 1, 2, 4, 8, 16… minutos
        proximo_envio = now() + make_interval(mins => power(2, v.tentativas)::int)
    where id = p_delivery;
  end if;
end $$;

comment on function app.registrar_tentativa_entrega is
  'Retry com backoff exponencial (1, 2, 4, 8… min) até max_tentativas; depois abandona com o erro.';

-- Vendas fechadas e canceladas emitem eventos automaticamente.
create or replace function app.fn_eventos_venda()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if new.status = 'fechada' and old.status <> 'fechada' then
    perform app.emitir_evento(new.tenant_id, 'venda.fechada',
      jsonb_build_object('venda', new.numero, 'total', new.total, 'modo', new.modo));
  elsif new.status = 'cancelada' and old.status <> 'cancelada' then
    perform app.emitir_evento(new.tenant_id, 'venda.cancelada',
      jsonb_build_object('venda', new.numero, 'motivo', new.motivo_cancelamento));
  elsif new.status <> old.status then
    perform app.emitir_evento(new.tenant_id, 'pedido.status',
      jsonb_build_object('venda', new.numero, 'de', old.status, 'para', new.status));
  end if;
  return new;
end $$;

create trigger trg_eventos_venda after update on public.sales
  for each row execute function app.fn_eventos_venda();

-- -----------------------------------------------------------------------------
-- Segmentação automática de clientes (item 21)
-- Recência/frequência/valor sobre os últimos 180 dias.
-- -----------------------------------------------------------------------------
alter table public.customers add column segmento text;

create or replace function app.segmentar_clientes(p_tenant uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare v_n int;
begin
  if not app.pode(p_tenant, 'clientes.editar') then
    raise exception 'Segmentar clientes exige clientes.editar.' using errcode = '42501';
  end if;

  with metricas as (
    select c.id,
           max(s.fechada_em)::date as ultima,
           count(s.id) as compras,
           coalesce(sum(s.total), 0) as valor
    from public.customers c
    left join public.sales s on s.customer_id = c.id and s.status = 'fechada'
      and s.fechada_em > now() - interval '180 days'
    where c.tenant_id = p_tenant
    group by c.id
  ),
  classificados as (
    select id,
      case
        when compras = 0 and ultima is null then 'novo'
        when ultima < current_date - 90 then 'inativo'
        when ultima < current_date - 45 then 'em_risco'
        when valor >= 1000 or compras >= 10 then 'vip'
        else 'ativo'
      end as segmento
    from metricas
  )
  update public.customers c
  set segmento = cl.segmento
  from classificados cl
  where c.id = cl.id and c.segmento is distinct from cl.segmento;

  get diagnostics v_n = row_count;
  return v_n;
end $$;

comment on function app.segmentar_clientes is
  'Novo, ativo, VIP, em risco (45d sem comprar) ou inativo (90d), pelos últimos 180 dias.';

-- Grants
revoke all on function app.testar_integracao(uuid, text) from public;
revoke all on function app.criar_api_key(uuid, text, text[]) from public;
revoke all on function app.revogar_api_key(uuid) from public;
revoke all on function app.validar_api_key(text) from public;
revoke all on function app.emitir_evento(uuid, text, jsonb) from public;
revoke all on function app.registrar_tentativa_entrega(bigint, boolean, text) from public;
revoke all on function app.segmentar_clientes(uuid) from public;
grant execute on function app.testar_integracao(uuid, text) to public;
grant execute on function app.criar_api_key(uuid, text, text[]) to public;
grant execute on function app.revogar_api_key(uuid) to public;
grant execute on function app.segmentar_clientes(uuid) to public;
-- validar_api_key / emitir_evento / registrar_tentativa_entrega: service role
-- (Edge Functions) — sem grant para authenticated.
