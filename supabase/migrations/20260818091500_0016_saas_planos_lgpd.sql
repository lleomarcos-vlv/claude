-- =============================================================================
-- 0016 · SaaS comercial (Fase 10, itens 32, 35, 40, 54)
--
-- · Planos Básico / Profissional / Empresarial com feature flags e limites,
--   consultáveis por app.recurso_habilitado / app.limite_do_plano.
-- · Central de alertas inteligentes: catálogo declara os 14 tipos e marca
--   honestamente quais já produzem alerta hoje; app.alertas(tenant) unifica.
-- · LGPD: exportação completa dos dados de um cliente e anonimização que
--   apaga o dado pessoal preservando o histórico contábil.
-- · Tela de auditoria (item 32) usa audit_log que já grava desde a Fase 1 —
--   entrega da interface, sem tabela nova.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Planos e feature flags (item 54)
-- -----------------------------------------------------------------------------
create table public.plan_features (
  plano   app.plano_tenant not null,
  recurso text not null,
  habilitado boolean not null default true,
  limite  int,                          -- null = ilimitado
  primary key (plano, recurso)
);

insert into public.plan_features (plano, recurso, habilitado, limite) values
  -- Básico: 1 filial, 3 usuários, sem integrações nem API
  ('basico',       'usuarios',        true,  3),
  ('basico',       'filiais',         true,  1),
  ('basico',       'pdv',             true,  null),
  ('basico',       'estoque',         true,  null),
  ('basico',       'financeiro',      true,  null),
  ('basico',       'fiscal_emissao',  false, null),
  ('basico',       'integracoes',     false, 0),
  ('basico',       'api_publica',     false, 0),
  ('basico',       'relatorios',      true,  5),
  -- Profissional: 3 filiais, 10 usuários, fiscal e integrações
  ('profissional', 'usuarios',        true,  10),
  ('profissional', 'filiais',         true,  3),
  ('profissional', 'pdv',             true,  null),
  ('profissional', 'estoque',         true,  null),
  ('profissional', 'financeiro',      true,  null),
  ('profissional', 'fiscal_emissao',  true,  null),
  ('profissional', 'integracoes',     true,  3),
  ('profissional', 'api_publica',     false, 0),
  ('profissional', 'relatorios',      true,  null),
  -- Empresarial: sem limites, API liberada
  ('empresarial',  'usuarios',        true,  null),
  ('empresarial',  'filiais',         true,  null),
  ('empresarial',  'pdv',             true,  null),
  ('empresarial',  'estoque',         true,  null),
  ('empresarial',  'financeiro',      true,  null),
  ('empresarial',  'fiscal_emissao',  true,  null),
  ('empresarial',  'integracoes',     true,  null),
  ('empresarial',  'api_publica',     true,  null),
  ('empresarial',  'relatorios',      true,  null);

alter table public.plan_features enable row level security;
create policy planos_leitura on public.plan_features
  for select using (auth.uid() is not null);

create or replace function app.recurso_habilitado(p_tenant uuid, p_recurso text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select coalesce((
    select pf.habilitado
    from public.plan_features pf
    join public.tenants t on t.plano = pf.plano
    where t.id = p_tenant and pf.recurso = p_recurso
  ), false);
$$;

create or replace function app.limite_do_plano(p_tenant uuid, p_recurso text)
returns int                              -- null = ilimitado
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select pf.limite
  from public.plan_features pf
  join public.tenants t on t.plano = pf.plano
  where t.id = p_tenant and pf.recurso = p_recurso and pf.habilitado;
$$;

-- O limite de usuários do plano vale na hora do convite.
create or replace function app.fn_limite_usuarios()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare v_limite int; v_atuais int;
begin
  v_limite := app.limite_do_plano(new.tenant_id, 'usuarios');
  if v_limite is not null then
    select count(*) into v_atuais from public.memberships
    where tenant_id = new.tenant_id and status = 'ativo';
    if v_atuais >= v_limite then
      raise exception using
        message = format('O plano atual permite %s usuário(s) ativo(s). Faça upgrade para convidar mais.', v_limite),
        errcode = '54000';
    end if;
  end if;
  return new;
end $$;

create trigger trg_limite_usuarios before insert on public.memberships
  for each row when (new.status = 'ativo') execute function app.fn_limite_usuarios();

-- -----------------------------------------------------------------------------
-- Central de alertas (item 40): catálogo dos 14 tipos, com o estado real
-- -----------------------------------------------------------------------------
create table public.alert_catalog (
  chave        text primary key,
  nome         text not null,
  ordem        smallint not null,
  implementado boolean not null default true
);

insert into public.alert_catalog (chave, nome, ordem, implementado) values
  ('estoque_ruptura',      'Estoque em ruptura',                       1, true),
  ('estoque_minimo',       'Estoque abaixo do mínimo',                 2, true),
  ('estoque_acabando',     'Previsão de acabar em até 7 dias',         3, true),
  ('conta_vencida',        'Conta vencida sem baixa',                  4, true),
  ('conta_vencendo',       'Conta vencendo em 3 dias',                 5, true),
  ('caixa_aberto_24h',     'Caixa aberto há mais de 24 h',             6, true),
  ('caixa_diferenca',      'Fechamento de caixa com diferença',        7, true),
  ('venda_parada',         'Comanda aberta há mais de 4 h',            8, true),
  ('doc_fiscal_pendente',  'Documento fiscal aguardando agente local', 9, true),
  ('doc_fiscal_rejeitado', 'Documento fiscal rejeitado',              10, true),
  ('webhook_abandonado',   'Entrega de webhook abandonada',           11, true),
  ('cliente_aniversario',  'Aniversário de cliente hoje',             12, true),
  ('margem_negativa',      'Produto vendido abaixo do custo',         13, true),
  ('integracao_erro',      'Integração com erro de sincronização',    14, false);

alter table public.alert_catalog enable row level security;
create policy alertas_catalogo_leitura on public.alert_catalog
  for select using (auth.uid() is not null);

create or replace function app.alertas(p_tenant uuid)
returns table (tipo text, severidade text, mensagem text, referencia text)
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  -- estoque (reaproveita a Fase 4)
  select case a.situacao
           when 'ruptura' then 'estoque_ruptura'
           when 'abaixo_do_minimo' then 'estoque_minimo'
           else 'estoque_acabando' end,
         case a.situacao when 'ruptura' then 'critica' else 'atencao' end,
         a.produto || ': ' || case a.situacao
           when 'ruptura' then 'sem estoque'
           when 'abaixo_do_minimo' then 'abaixo do mínimo'
           else 'acaba em ~' || a.dias_restantes || ' dias' end,
         a.product_id::text
  from app.alertas_estoque(p_tenant) a
  where app.pode(p_tenant, 'estoque.ver')

  union all
  select case when f.vencimento < current_date then 'conta_vencida' else 'conta_vencendo' end,
         case when f.vencimento < current_date then 'critica' else 'atencao' end,
         f.descricao || ' (' || f.tipo || ') vence ' ||
           to_char(f.vencimento, 'DD/MM') || ' — R$ ' || f.valor,
         f.id::text
  from public.finance_entries f
  where f.tenant_id = p_tenant and f.status = 'aberta'
    and f.vencimento <= current_date + 3
    and app.pode(p_tenant, 'financeiro.ver')

  union all
  select 'caixa_aberto_24h', 'atencao',
         'Caixa aberto desde ' || to_char(rs.aberto_em, 'DD/MM HH24:MI'),
         rs.id::text
  from public.register_sessions rs
  where rs.tenant_id = p_tenant and rs.status = 'aberto'
    and rs.aberto_em < now() - interval '24 hours'
    and app.pode(p_tenant, 'vendas.ver')

  union all
  select 'caixa_diferenca', 'atencao',
         'Fechamento de ' || to_char(rs.fechado_em, 'DD/MM') ||
           ' com diferença de R$ ' || rs.diferenca,
         rs.id::text
  from public.register_sessions rs
  where rs.tenant_id = p_tenant and rs.status = 'fechado'
    and rs.diferenca <> 0 and rs.fechado_em > now() - interval '7 days'
    and app.pode(p_tenant, 'vendas.ver')

  union all
  select 'venda_parada', 'atencao',
         'Pedido #' || s.numero || ' aberto desde ' || to_char(s.aberta_em, 'HH24:MI'),
         s.id::text
  from public.sales s
  where s.tenant_id = p_tenant
    and s.status not in ('fechada', 'cancelada', 'entregue')
    and s.aberta_em < now() - interval '4 hours'
    and app.pode(p_tenant, 'vendas.ver')

  union all
  select 'doc_fiscal_pendente', 'atencao',
         'Documento ' || upper(d.tipo::text) || ' pendente — agente local não conectado',
         d.id::text
  from public.fiscal_documents d
  where d.tenant_id = p_tenant and d.status = 'pendente'
    and app.pode(p_tenant, 'fiscal.ver')

  union all
  select 'doc_fiscal_rejeitado', 'critica',
         'Documento ' || upper(d.tipo::text) || ' rejeitado: ' || coalesce(d.motivo_rejeicao, 'sem motivo'),
         d.id::text
  from public.fiscal_documents d
  where d.tenant_id = p_tenant and d.status = 'rejeitada'
    and app.pode(p_tenant, 'fiscal.ver')

  union all
  select 'webhook_abandonado', 'atencao',
         'Webhook "' || wd.evento || '" abandonado após ' || wd.tentativas || ' tentativas',
         wd.id::text
  from public.webhook_deliveries wd
  where wd.tenant_id = p_tenant and wd.status = 'abandonada'
    and wd.criado_em > now() - interval '7 days'
    and app.pode(p_tenant, 'integracoes.ver')

  union all
  select 'cliente_aniversario', 'info',
         'Aniversário de ' || c.nome || ' hoje',
         c.id::text
  from public.customers c
  where c.tenant_id = p_tenant and c.ativo
    and c.aniversario is not null
    and to_char(c.aniversario, 'MM-DD') = to_char(current_date, 'MM-DD')
    and app.pode(p_tenant, 'clientes.ver')

  union all
  select 'margem_negativa', 'critica',
         p.nome || ' vendido abaixo do custo (preço R$ ' || p.preco_venda ||
           ', custo R$ ' || round(app.custo_produto(p.id), 2) || ')',
         p.id::text
  from public.products p
  where p.tenant_id = p_tenant and p.ativo and p.tipo <> 'insumo'
    and p.preco_venda > 0
    and app.custo_produto(p.id) > p.preco_venda
    and app.pode(p_tenant, 'catalogo.ver');
$$;

comment on function app.alertas is
  'Central de alertas: 13 dos 14 tipos ativos; integracao_erro aguarda a Fase 9 externa.';

-- -----------------------------------------------------------------------------
-- LGPD (item 35): exportação e anonimização de cliente
-- -----------------------------------------------------------------------------
create or replace function app.exportar_dados_cliente(p_cliente uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare
  v_cliente public.customers%rowtype;
  v jsonb;
begin
  select * into v_cliente from public.customers where id = p_cliente;
  if v_cliente.id is null then
    raise exception 'Cliente não encontrado.' using errcode = 'P0002';
  end if;
  if not app.pode(v_cliente.tenant_id, 'clientes.exportar') then
    raise exception 'Exportar dados exige clientes.exportar.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'cadastro', to_jsonb(v_cliente),
    'vendas', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'numero', s.numero, 'data', s.fechada_em, 'total', s.total, 'status', s.status)), '[]')
      from public.sales s where s.customer_id = p_cliente),
    'contas', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'descricao', f.descricao, 'valor', f.valor, 'status', f.status)), '[]')
      from public.finance_entries f where f.customer_id = p_cliente),
    'exportado_em', now()
  ) into v;

  return v;
end $$;

create or replace function app.anonimizar_cliente(p_cliente uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare v_cliente public.customers%rowtype;
begin
  select * into v_cliente from public.customers where id = p_cliente for update;
  if v_cliente.id is null then
    raise exception 'Cliente não encontrado.' using errcode = 'P0002';
  end if;
  -- Anonimizar apaga dado pessoal: exige poder editar E exportar (decisão grave).
  if not (app.pode(v_cliente.tenant_id, 'clientes.editar')
          and app.pode(v_cliente.tenant_id, 'clientes.exportar')) then
    raise exception 'Anonimizar exige clientes.editar e clientes.exportar.' using errcode = '42501';
  end if;

  update public.customers
  set nome = 'Cliente anonimizado',
      apelido = null,
      cpf_cnpj = null,
      email = null,
      telefone = null,
      whatsapp = null,
      endereco = '{}',
      aniversario = null,
      preferencias = null,
      observacoes = 'Dados removidos a pedido do titular (LGPD) em ' || current_date,
      consentimento_lgpd = false,
      consentimento_em = null,
      segmento = null,
      ativo = false
  where id = p_cliente;
  -- Vendas e contas permanecem: são registro contábil, sem dado pessoal.
end $$;

comment on function app.anonimizar_cliente is
  'LGPD: apaga o dado pessoal e desativa o cliente; o histórico contábil permanece anônimo.';

revoke all on function app.recurso_habilitado(uuid, text) from public;
revoke all on function app.limite_do_plano(uuid, text) from public;
revoke all on function app.alertas(uuid) from public;
revoke all on function app.exportar_dados_cliente(uuid) from public;
revoke all on function app.anonimizar_cliente(uuid) from public;
grant execute on function app.recurso_habilitado(uuid, text) to public;
grant execute on function app.limite_do_plano(uuid, text) to public;
grant execute on function app.alertas(uuid) to public;
grant execute on function app.exportar_dados_cliente(uuid) to public;
grant execute on function app.anonimizar_cliente(uuid) to public;
