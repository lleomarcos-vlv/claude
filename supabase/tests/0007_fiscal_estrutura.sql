-- =============================================================================
-- Teste da Fase 7: regras versionadas, motor de cálculo e fila de emissão
--
-- As regras usadas aqui são DADOS DE TESTE, não orientação tributária —
-- exatamente como o sistema trata: regra real entra pelo contador.
--   psql -f supabase/tests/0007_fiscal_estrutura.sql
-- =============================================================================

\set ON_ERROR_STOP on
\set QUIET 1

set role authenticated;
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';  -- Diego

select id as t_pizza from public.tenants where slug = 'pizzaria-diego' \gset
select set_config('test.t_pizza', :'t_pizza', false) \g /dev/null
select id as p_soda from public.products where tenant_id = :'t_pizza'::uuid and nome = 'Soda Italiana' \gset
select set_config('test.p_soda', :'p_soda', false) \g /dev/null

-- Venda fechada a prazo criada no teste 0006 (sessões de psql não compartilham GUC)
select s.id as venda_prazo
from public.sales s
join public.sale_payments p on p.sale_id = s.id and p.forma = 'prazo'
where s.tenant_id = :'t_pizza'::uuid and s.status = 'fechada'
limit 1 \gset
select set_config('test.venda_prazo', :'venda_prazo', false) \g /dev/null

-- Produto ganha NCM para o motor casar regras
update public.products set ncm = '22021000' where id = :'p_soda'::uuid;
update public.tenants set uf = 'SP', regime_tributario = 'simples_nacional' where id = :'t_pizza'::uuid;

-- ===========================================================================
-- 1. Sem regra cadastrada o motor NÃO inventa imposto
-- ===========================================================================
do $$
declare v_n int;
begin
  select count(*) into v_n from app.calcular_impostos(
    current_setting('test.t_pizza')::uuid, current_setting('test.p_soda')::uuid, 100.00);
  if v_n <> 0 then raise exception 'Motor inventou % imposto(s) sem regra cadastrada', v_n; end if;
  raise notice 'OK  1 · sem regra cadastrada, o motor devolve vazio — nada de alíquota fixa';
end $$;

-- ===========================================================================
-- 2. Regra criada com fonte obrigatória; sem fonte é recusada
-- ===========================================================================
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_falhou boolean := false; v_id uuid;
begin
  begin
    v_id := app.criar_regra_fiscal(v_t, 'icms', 18.0, '2026-01-01', '   ');
  exception when others then v_falhou := true;
  end;
  if not v_falhou then raise exception 'Regra sem fonte legal foi aceita'; end if;

  v_id := app.criar_regra_fiscal(
    v_t, 'icms', 18.0, '2026-01-01', 'TESTE: RICMS-SP art. X (dado de teste)',
    'SP', null, null, null, '00');
  if v_id is null then raise exception 'Regra não foi criada'; end if;

  raise notice 'OK  2 · regra exige fonte legal; criada com UF e CST';
end $$;

-- ===========================================================================
-- 3. Versionamento: regra nova encerra a anterior e assume a vigência
-- ===========================================================================
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_id uuid; v_versao int; v_fim date; v_ini date;
begin
  v_id := app.criar_regra_fiscal(
    v_t, 'icms', 19.5, '2026-07-01', 'TESTE: majoração hipotética (dado de teste)',
    'SP', null, null, null, '00');

  select versao into v_versao from public.tax_rules where id = v_id;
  if v_versao <> 2 then raise exception 'Nova regra deveria ser versão 2, é %', v_versao; end if;

  select vigencia_fim into v_fim from public.tax_rules
  where tenant_id = v_t and tipo_imposto = 'icms' and versao = 1;
  if v_fim <> '2026-06-30' then
    raise exception 'Versão 1 deveria encerrar em 30/06, encerrou em %', v_fim;
  end if;

  raise notice 'OK  3 · versão 2 criada; versão 1 encerrada automaticamente na véspera';
end $$;

-- ===========================================================================
-- 4. O motor escolhe a regra vigente NA DATA do cálculo
-- ===========================================================================
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_p uuid := current_setting('test.p_soda')::uuid;
  v_antiga numeric; v_atual numeric;
begin
  select aliquota_pct into v_antiga
  from app.calcular_impostos(v_t, v_p, 100.00, null, '2026-03-15');
  if v_antiga <> 18.0 then raise exception 'Em março deveria valer 18%%, veio %', v_antiga; end if;

  select aliquota_pct into v_atual
  from app.calcular_impostos(v_t, v_p, 100.00, null, '2026-08-15');
  if v_atual <> 19.5 then raise exception 'Em agosto deveria valer 19,5%%, veio %', v_atual; end if;

  raise notice 'OK  4 · vigência respeitada: março usa 18%%, agosto usa 19,5%%';
end $$;

-- ===========================================================================
-- 5. Especificidade: NCM exato vence a regra genérica; redução de base aplica
-- ===========================================================================
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_p uuid := current_setting('test.p_soda')::uuid;
  r record;
begin
  perform app.criar_regra_fiscal(
    v_t, 'icms', 12.0, '2026-07-01', 'TESTE: benefício por NCM (dado de teste)',
    'SP', null, '22021000', null, '20', null, 40.0);   -- 40% de redução de base

  select * into r from app.calcular_impostos(v_t, v_p, 100.00) where tipo_imposto = 'icms';
  if r.aliquota_pct <> 12.0 then
    raise exception 'NCM exato deveria vencer a genérica (12%%), veio %', r.aliquota_pct;
  end if;
  if r.base <> 60.00 then raise exception 'Base com redução de 40%% deveria ser 60, é %', r.base; end if;
  if r.valor <> 7.20 then raise exception 'Imposto deveria ser 7,20, é %', r.valor; end if;

  raise notice 'OK  5 · NCM exato vence genérica; redução de base: 100 → base 60 → ICMS 7,20';
end $$;

-- ===========================================================================
-- 6. Reforma Tributária: CBS com cClassTrib entra pela mesma máquina,
--    marcada para validação do contador
-- ===========================================================================
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_p uuid := current_setting('test.p_soda')::uuid;
  r record; v_n int;
begin
  perform app.criar_regra_fiscal(
    v_t, 'cbs', 0.9, '2026-01-01', 'TESTE: LC 214/2025 fase de transição (dado de teste)',
    null, null, null, null, null, '000001', 0, true);

  select count(*) into v_n from app.calcular_impostos(v_t, v_p, 100.00);
  if v_n <> 2 then raise exception 'Deveriam vir 2 impostos (ICMS e CBS), vieram %', v_n; end if;

  select * into r from app.calcular_impostos(v_t, v_p, 100.00) where tipo_imposto = 'cbs';
  if r.cclasstrib <> '000001' then raise exception 'cClassTrib não veio na CBS'; end if;
  if not r.validacao_contador then raise exception 'CBS deveria estar marcada para validação'; end if;

  raise notice 'OK  6 · CBS/cClassTrib na mesma máquina, marcada "validação do contador"';
end $$;

-- ===========================================================================
-- 7. Fila de emissão: venda fechada gera doc pendente com retrato do cálculo;
--    caixa (sem fiscal.emitir) é barrado; duplicidade é barrada
-- ===========================================================================
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_venda uuid := current_setting('test.venda_prazo')::uuid;
  v_doc uuid; v_status app.status_doc_fiscal; v_falhou boolean := false;
begin
  v_doc := app.solicitar_emissao(v_venda, 'nfce');
  select status into v_status from public.fiscal_documents where id = v_doc;
  if v_status <> 'pendente' then
    raise exception 'Documento deveria nascer pendente (aguardando agente local), está %', v_status;
  end if;

  begin
    perform app.solicitar_emissao(v_venda, 'nfce');   -- duplicado
  exception when others then v_falhou := true;
  end;
  if not v_falhou then raise exception 'Emissão duplicada da mesma venda passou'; end if;

  raise notice 'OK  7 · doc fiscal pendente na fila do agente local; duplicidade barrada';
end $$;

set request.jwt.claim.sub = '55555555-5555-5555-5555-555555555555';  -- Elisa, caixa
do $$
declare v_falhou boolean := false;
begin
  begin
    perform app.solicitar_emissao(current_setting('test.venda_prazo')::uuid, 'nfce');
  exception when insufficient_privilege or others then v_falhou := true;
  end;
  if not v_falhou then raise exception 'Caixa emitiu documento fiscal sem permissão'; end if;
end $$;

-- ===========================================================================
-- 8. Isolamento: regras e docs invisíveis a outro tenant; escrita direta barrada
-- ===========================================================================
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';  -- Ana
do $$
declare v_n int; v_t uuid := current_setting('test.t_pizza')::uuid; v_falhou boolean := false;
begin
  select count(*) into v_n from public.tax_rules where tenant_id = v_t;
  if v_n <> 0 then raise exception 'VAZAMENTO: Ana vê % regras da pizzaria', v_n; end if;

  select count(*) into v_n from public.fiscal_documents where tenant_id = v_t;
  if v_n <> 0 then raise exception 'VAZAMENTO: Ana vê % docs fiscais da pizzaria', v_n; end if;

  begin
    insert into public.tax_rules (tenant_id, tipo_imposto, aliquota_pct, vigencia_inicio, fonte)
    values (v_t, 'icms', 99, current_date, 'forjada');
  exception when others then v_falhou := true;
  end;
  if not v_falhou then raise exception 'Insert direto em tax_rules passou'; end if;

  raise notice 'OK  8 · fiscal isolado por tenant e sem escrita direta';
end $$;

reset role;

\echo ''
\echo '================================================'
\echo ' 8/8 asserções passaram · Fase 7 (fiscal) ok'
\echo '================================================'
