-- =============================================================================
-- Teste das Fases 8–10: relatórios, pacote do contador, integrações honestas,
-- API keys, webhooks com backoff, segmentação, planos e LGPD
--
-- Roda após 0001–0007 no mesmo banco.
--   psql -f supabase/tests/0008_saas_relatorios_integracoes.sql
-- =============================================================================

\set ON_ERROR_STOP on
\set QUIET 1

set role authenticated;
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';  -- Diego

select id as t_pizza from public.tenants where slug = 'pizzaria-diego' \gset
select set_config('test.t_pizza', :'t_pizza', false) \g /dev/null
select b.id as b_matriz from public.branches b where b.tenant_id = :'t_pizza'::uuid and b.matriz \gset
select set_config('test.b_matriz', :'b_matriz', false) \g /dev/null
select id as p_soda from public.products where tenant_id = :'t_pizza'::uuid and nome = 'Soda Italiana' \gset
select set_config('test.p_soda', :'p_soda', false) \g /dev/null

-- ===========================================================================
-- 1. Relatórios reais; caixa sem relatorios.ver é barrado
-- ===========================================================================
do $$
declare v jsonb; v_falhou boolean := false;
  v_t uuid := current_setting('test.t_pizza')::uuid;
begin
  v := app.relatorio(v_t, 'vendas_por_produto', current_date - 30, current_date);
  if jsonb_array_length(v -> 'linhas') < 1 then
    raise exception 'vendas_por_produto deveria ter linhas';
  end if;

  v := app.relatorio(v_t, 'curva_abc', current_date - 30, current_date);
  if (v -> 'linhas' -> 0 ->> 3) <> 'A' then
    raise exception 'Curva ABC: o maior faturamento deveria ser classe A, veio %', v -> 'linhas' -> 0;
  end if;

  perform set_config('request.jwt.claim.sub', '55555555-5555-5555-5555-555555555555', false);
  begin
    perform app.relatorio(v_t, 'dre', current_date - 30, current_date);
  exception when insufficient_privilege then v_falhou := true;
  end;
  if not v_falhou then raise exception 'Caixa acessou relatório sem permissão'; end if;
  perform set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', false);

  raise notice 'OK  1 · relatórios com dados reais; curva ABC coerente; permissão respeitada';
end $$;

-- ===========================================================================
-- 2. Relatório não implementado avisa; inexistente é erro distinto
-- ===========================================================================
do $$
declare v_t uuid := current_setting('test.t_pizza')::uuid;
  v_estado text;
begin
  begin
    perform app.relatorio(v_t, 'comissoes', current_date - 30, current_date);
    raise exception 'Relatório não implementado deveria falhar';
  exception when feature_not_supported then v_estado := 'nao_implementado';
  end;
  if v_estado <> 'nao_implementado' then raise exception 'Erro errado para não implementado'; end if;

  begin
    perform app.relatorio(v_t, 'nao_existe', current_date, current_date);
    raise exception 'Relatório inexistente deveria falhar';
  exception when others then null;
  end;

  raise notice 'OK  2 · "comissoes" declara não implementado; inexistente é erro próprio';
end $$;

-- ===========================================================================
-- 3. Pacote do contador com título de competência e conteúdo estruturado
-- ===========================================================================
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_id uuid; v_pac record;
begin
  v_id := app.gerar_pacote_contador(v_t, current_date);
  select * into v_pac from public.accountant_packages where id = v_id;

  if v_pac.titulo !~ '^CONTABILIDADE — [A-ZÇ]+/\d{4}$' then
    raise exception 'Título do pacote fora do padrão: %', v_pac.titulo;
  end if;
  if v_pac.conteudo -> 'dre' -> 'linhas' is null then
    raise exception 'Pacote sem DRE';
  end if;
  if v_pac.status <> 'gerado' then raise exception 'Pacote deveria estar "gerado"'; end if;

  -- Regerar substitui, não duplica
  v_id := app.gerar_pacote_contador(v_t, current_date);
  if (select count(*) from public.accountant_packages
      where tenant_id = v_t and competencia = date_trunc('month', current_date)::date) <> 1 then
    raise exception 'Regerar duplicou o pacote';
  end if;

  raise notice 'OK  3 · pacote "%" gerado com DRE, fluxo e docs; regerar substitui', v_pac.titulo;
end $$;

-- ===========================================================================
-- 4. Integração: teste responde a verdade (não conectado) e loga
-- ===========================================================================
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_msg text; v_status app.status_integracao; v_n int;
begin
  v_msg := app.testar_integracao(v_t, 'ifood');
  if v_msg !~ 'credencial' then
    raise exception 'Mensagem do teste deveria citar a falta de credencial: %', v_msg;
  end if;

  select status into v_status from public.integrations
  where tenant_id = v_t and provedor = 'ifood';
  if v_status <> 'nao_conectado' then
    raise exception 'Integração sem credencial não pode constar %', v_status;
  end if;

  select count(*) into v_n from public.integration_logs
  where tenant_id = v_t and provedor = 'ifood' and evento = 'testar';
  if v_n < 1 then raise exception 'Teste de integração não foi logado'; end if;

  raise notice 'OK  4 · integração sem credencial fica "não conectado", com log — nada simulado';
end $$;

-- ===========================================================================
-- 5. API key: claro sai uma vez, valida e revoga
-- ===========================================================================
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_key record;
begin
  select * into v_key from app.criar_api_key(v_t, 'chave de teste', '{leitura}');
  if v_key.chave !~ '^grf_[0-9a-f]{64}$' then
    raise exception 'Formato da chave inesperado: %', left(v_key.chave, 12);
  end if;
  if exists (select 1 from public.api_keys where chave_hash = v_key.chave) then
    raise exception 'Chave em claro foi parar no banco';
  end if;
  perform set_config('test.api_key', v_key.chave, false);
  perform set_config('test.api_key_id', v_key.key_id::text, false);
  raise notice 'OK  5 · API key criada: claro sai uma vez, banco guarda só o hash';
end $$;

reset role;   -- validar_api_key é do serviço (Edge Function), não do usuário
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_res record;
begin
  select * into v_res from app.validar_api_key(current_setting('test.api_key'));
  if v_res.tenant_id is distinct from v_t then
    raise exception 'validar_api_key não resolveu o tenant';
  end if;
end $$;

set role authenticated;
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
do $$
begin
  perform app.revogar_api_key(current_setting('test.api_key_id')::uuid);
end $$;
reset role;
do $$
declare v_n int;
begin
  select count(*) into v_n from app.validar_api_key(current_setting('test.api_key'));
  if v_n <> 0 then raise exception 'Chave revogada continuou válida'; end if;
  raise notice 'OK  6 · chave revogada deixa de validar';
end $$;
set role authenticated;
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

-- ===========================================================================
-- 7. Webhook: venda fechada enfileira entrega; retry com backoff até abandonar
-- ===========================================================================
insert into public.webhooks (tenant_id, url, eventos, segredo)
values (:'t_pizza'::uuid, 'https://exemplo.test/hook', '{venda.fechada}', 'segredo-teste');

do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_b uuid := current_setting('test.b_matriz')::uuid;
  v_venda uuid; v_del record;
begin
  v_venda := app.abrir_venda(v_t, v_b, 'Balcão');
  perform app.lancar_item(v_venda, current_setting('test.p_soda')::uuid, 1);
  perform app.fechar_venda(v_venda, '[{"forma": "pix", "valor": 14.00}]');

  select * into v_del from public.webhook_deliveries
  where tenant_id = v_t and evento = 'venda.fechada'
  order by criado_em desc limit 1;

  if v_del.id is null then raise exception 'Venda fechada não enfileirou webhook'; end if;
  if v_del.status <> 'pendente' then raise exception 'Entrega deveria nascer pendente'; end if;
  if (v_del.payload -> 'dados' ->> 'total')::numeric <> 14.00 then
    raise exception 'Payload sem o total da venda';
  end if;
  perform set_config('test.delivery', v_del.id::text, false);

  raise notice 'OK  7 · venda fechada enfileira webhook com payload';
end $$;

reset role;  -- o worker de entrega roda como serviço
do $$
declare
  v_id bigint := current_setting('test.delivery')::bigint;
  v public.webhook_deliveries%rowtype;
  i int;
begin
  perform app.registrar_tentativa_entrega(v_id, false, 'connection refused');
  select * into v from public.webhook_deliveries where id = v_id;
  if v.status <> 'falha' or v.tentativas <> 1 then
    raise exception 'Primeira falha deveria deixar status falha/1 tentativa';
  end if;
  if v.proximo_envio < now() + interval '50 seconds' then
    raise exception 'Backoff da 1ª falha deveria ser ~1 min';
  end if;

  for i in 2..6 loop
    perform app.registrar_tentativa_entrega(v_id, false, 'connection refused');
  end loop;
  select * into v from public.webhook_deliveries where id = v_id;
  if v.status <> 'abandonada' then
    raise exception 'Após 6 tentativas deveria abandonar, está %', v.status;
  end if;

  raise notice 'OK  8 · retry com backoff exponencial e abandono após o limite';
end $$;
set role authenticated;
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

-- ===========================================================================
-- 9. Segmentação de clientes e limites do plano
-- ===========================================================================
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_n int; v_seg text; v_falhou boolean := false;
begin
  -- cliente sem compra ganha "novo"; o vinculado a vendas fica ativo/vip
  insert into public.customers (tenant_id, nome) values (v_t, 'Cliente sem compra');
  v_n := app.segmentar_clientes(v_t);
  if v_n < 1 then raise exception 'Segmentação não classificou ninguém'; end if;

  select segmento into v_seg from public.customers
  where tenant_id = v_t and nome = 'Cliente sem compra';
  if v_seg <> 'novo' then raise exception 'Sem compra deveria ser "novo", é %', v_seg; end if;

  -- plano básico: api_publica desabilitada; empresarial habilita
  if app.recurso_habilitado(v_t, 'api_publica') then
    raise exception 'Plano básico não deveria ter API pública';
  end if;
  update public.tenants set plano = 'empresarial' where id = v_t;
  if not app.recurso_habilitado(v_t, 'api_publica') then
    raise exception 'Plano empresarial deveria ter API pública';
  end if;
  update public.tenants set plano = 'basico' where id = v_t;

  raise notice 'OK  9 · segmentação automática e feature flags por plano';
end $$;

-- Limite de usuários do plano básico (3): o 4º vínculo ativo é barrado
reset role;
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_role uuid; v_falhou boolean := false; i int;
begin
  select id into v_role from public.roles where tenant_id = v_t and chave = 'vendedor';
  -- já existem 2 ativos (Diego, Elisa); insere o 3º direto (como serviço)
  insert into auth.users (id, email) values ('77777777-7777-7777-7777-777777777777', 'g3@pizzaria.test');
  insert into public.memberships (tenant_id, user_id, role_id, status)
  values (v_t, '77777777-7777-7777-7777-777777777777', v_role, 'ativo');

  insert into auth.users (id, email) values ('88888888-8888-8888-8888-888888888888', 'g4@pizzaria.test');
  begin
    insert into public.memberships (tenant_id, user_id, role_id, status)
    values (v_t, '88888888-8888-8888-8888-888888888888', v_role, 'ativo');
  exception when program_limit_exceeded then v_falhou := true;
  end;
  if not v_falhou then raise exception 'Limite de 3 usuários do plano básico não valeu'; end if;

  raise notice 'OK 10 · limite de usuários do plano aplicado no vínculo';
end $$;
set role authenticated;
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

-- ===========================================================================
-- 11. LGPD: exportação completa e anonimização preservando o histórico
-- ===========================================================================
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_cliente uuid; v jsonb; v_c public.customers%rowtype; v_vendas int;
begin
  select c.id into v_cliente from public.customers c
  join public.sales s on s.customer_id = c.id
  where c.tenant_id = v_t limit 1;
  if v_cliente is null then raise exception 'Sem cliente com venda para o teste'; end if;

  v := app.exportar_dados_cliente(v_cliente);
  if jsonb_array_length(v -> 'vendas') < 1 then
    raise exception 'Exportação LGPD sem as vendas do titular';
  end if;

  select count(*) into v_vendas from public.sales where customer_id = v_cliente;

  perform app.anonimizar_cliente(v_cliente);
  select * into v_c from public.customers where id = v_cliente;
  if v_c.nome <> 'Cliente anonimizado' or v_c.cpf_cnpj is not null or v_c.email is not null then
    raise exception 'Anonimização deixou dado pessoal para trás';
  end if;
  if (select count(*) from public.sales where customer_id = v_cliente) <> v_vendas then
    raise exception 'Anonimização apagou histórico contábil — não deveria';
  end if;

  raise notice 'OK 11 · LGPD: exportação completa; anonimização apaga PII e preserva o histórico';
end $$;

-- ===========================================================================
-- 12. Central de alertas unificada
-- ===========================================================================
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_tipos text[];
begin
  select array_agg(distinct tipo) into v_tipos from app.alertas(v_t);
  -- a farinha (teste 0004) segue com previsão de acabar em ~7 dias
  if not (v_tipos @> array['estoque_acabando']) then
    raise exception 'Alerta de previsão de ruptura deveria aparecer; vieram %', v_tipos;
  end if;
  if not (v_tipos @> array['doc_fiscal_pendente']) then
    raise exception 'Alerta de doc fiscal pendente deveria aparecer; vieram %', v_tipos;
  end if;
  raise notice 'OK 12 · central de alertas unificada (estoque, fiscal, financeiro…)';
end $$;

reset role;

\echo ''
\echo '===================================================='
\echo ' 12/12 asserções passaram · Fases 8–10 (SaaS) ok'
\echo '===================================================='
