-- =============================================================================
-- Teste da Fase 3: verticais, unidades, catálogo, clientes e fornecedores
--
-- Roda após os testes 0001 e 0002 no mesmo banco (reusa a Pizzaria do Diego).
--   psql -f supabase/tests/0003_cadastros_e_kits.sql
-- =============================================================================

\set ON_ERROR_STOP on
\set QUIET 1

set role authenticated;
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';  -- Diego, proprietário

select id as t_pizza from public.tenants where slug = 'pizzaria-diego' \gset
select set_config('test.t_pizza', :'t_pizza', false) \g /dev/null

-- ===========================================================================
-- 1. Os 9 kits estão no banco, com terminologia, modos e campos
-- ===========================================================================
do $$
declare v_kits int; v_termos int; v_modos int; v_seeds int;
begin
  select count(*) into v_kits from public.verticals;
  if v_kits <> 9 then raise exception 'Esperados 9 kits, há %', v_kits; end if;

  select count(*) into v_termos from public.vertical_terminology;
  if v_termos <> 27 then raise exception 'Esperados 27 termos (3 por kit), há %', v_termos; end if;

  select count(*) into v_modos from public.vertical_modes where vertical_chave = 'food';
  if v_modos <> 3 then raise exception 'Food deveria ter 3 modos, tem %', v_modos; end if;

  select count(*) into v_seeds from public.vertical_seed_products;
  if v_seeds < 130 then raise exception 'Catálogo de demonstração incompleto: % itens', v_seeds; end if;

  raise notice 'OK  1 · 9 kits migrados do protótipo, com termos, modos e catálogo inicial';
end $$;

-- ===========================================================================
-- 2. Conversão física de unidades
-- ===========================================================================
do $$
declare v numeric; v_falhou boolean := false;
begin
  v := app.converter(2, 'kg', 'g');
  if v <> 2000 then raise exception '2 kg deveriam ser 2000 g, deu %', v; end if;

  v := app.converter(5, 'l', 'ml');
  if v <> 5000 then raise exception '5 L deveriam ser 5000 ml, deu %', v; end if;

  v := app.converter(1500, 'mg', 'g');
  if v <> 1.5 then raise exception '1500 mg deveriam ser 1,5 g, deu %', v; end if;

  begin
    v := app.converter(1, 'kg', 'ml');           -- massa → volume: proibido
  exception when others then v_falhou := true;
  end;
  if not v_falhou then raise exception 'Conversão massa→volume passou'; end if;

  raise notice 'OK  2 · conversão física: kg↔g, L↔ml, e tipo incompatível é recusado';
end $$;

-- ===========================================================================
-- 3. Nicho escolhido no onboarding; kit inicial aplicado uma única vez
-- ===========================================================================
select app.definir_vertical(:'t_pizza'::uuid, 'food') \g /dev/null

do $$
declare v_qtd int; v_etapa int; v_falhou boolean := false; v_t uuid := current_setting('test.t_pizza')::uuid;
begin
  v_qtd := app.aplicar_kit_inicial(v_t);
  if v_qtd <> 23 then raise exception 'Kit food tem 23 itens, aplicou %', v_qtd; end if;

  select onboarding_etapa into v_etapa from public.tenants where id = v_t;
  if v_etapa < 3 then raise exception 'Onboarding deveria estar na etapa 3+, está %', v_etapa; end if;

  begin
    perform app.aplicar_kit_inicial(v_t);        -- segunda vez: recusa
  exception when others then v_falhou := true;
  end;
  if not v_falhou then raise exception 'Kit inicial sobrescreveu catálogo existente'; end if;

  raise notice 'OK  3 · nicho definido e kit inicial aplicado só em catálogo vazio';
end $$;

-- ===========================================================================
-- 4. Isolamento e permissão no catálogo
-- ===========================================================================
do $$
declare v_n int; v_t uuid := current_setting('test.t_pizza')::uuid;
begin
  -- Ana (outro tenant) não vê o catálogo do Diego
  perform set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
  select count(*) into v_n from public.products where tenant_id = v_t;
  if v_n <> 0 then raise exception 'VAZAMENTO: Ana vê % produtos da pizzaria', v_n; end if;

  -- Elisa é caixa: vê catálogo, mas não cria produto
  perform set_config('request.jwt.claim.sub', '55555555-5555-5555-5555-555555555555', false);
  select count(*) into v_n from public.products where tenant_id = v_t;
  if v_n = 0 then raise exception 'Caixa deveria ver o catálogo'; end if;

  begin
    insert into public.products (tenant_id, nome) values (v_t, 'Produto do caixa');
    raise exception 'FALHA: caixa criou produto sem catalogo.criar';
  exception when insufficient_privilege then null;
  end;

  raise notice 'OK  4 · catálogo isolado por tenant e escrita conforme permissão';
end $$;
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

-- ===========================================================================
-- 5. SKU e código de barras únicos por tenant; embalagem converte por produto
-- ===========================================================================
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_prod uuid; v_qtd numeric; v_falhou boolean := false;
begin
  insert into public.products (tenant_id, nome, sku, codigo_barras, unidade, preco_venda)
  values (v_t, 'Refrigerante 2L', 'REF-2L', '7891000000001', 'un', 9.90)
  returning id into v_prod;

  begin
    insert into public.products (tenant_id, nome, sku)
    values (v_t, 'Duplicado', 'REF-2L');
  exception when unique_violation then v_falhou := true;
  end;
  if not v_falhou then raise exception 'SKU duplicado passou'; end if;

  -- caixa com 6 garrafas
  insert into public.product_units (product_id, unit_chave, fator) values (v_prod, 'cx', 6);

  v_qtd := app.converter_produto(v_prod, 2, 'cx', 'un');
  if v_qtd <> 12 then raise exception '2 caixas deveriam ser 12 un, deu %', v_qtd; end if;

  raise notice 'OK  5 · SKU único por tenant e embalagem convertendo (2 cx → 12 un)';
end $$;

-- ===========================================================================
-- 6. Cliente completo com validação de documento; fornecedor idem
-- ===========================================================================
do $$
declare v_t uuid := current_setting('test.t_pizza')::uuid; v_falhou boolean := false;
begin
  insert into public.customers (tenant_id, nome, cpf_cnpj, aniversario, endereco, consentimento_lgpd, consentimento_em)
  values (v_t, 'Cliente Fiel', '52998224725', '1990-03-14',
          '{"cidade": "Ribeirão Preto", "uf": "SP"}', true, now());

  begin
    insert into public.customers (tenant_id, nome, cpf_cnpj)
    values (v_t, 'Documento inválido', '123');
  exception when check_violation then v_falhou := true;
  end;
  if not v_falhou then raise exception 'CPF de 3 dígitos passou'; end if;

  insert into public.suppliers (tenant_id, razao_social, cnpj, prazo_entrega_dias, condicao_pagamento)
  values (v_t, 'Distribuidora de Bebidas SA', '45997418000153', 2, '28 dias');

  raise notice 'OK  6 · cliente e fornecedor gravados; documento fora do formato é recusado';
end $$;

-- ===========================================================================
-- 7. Importador em lote: upsert por SKU e relatório de erros por linha
-- ===========================================================================
do $$
declare
  v_t uuid := current_setting('test.t_pizza')::uuid;
  v_rel jsonb; v_preco numeric;
begin
  v_rel := app.importar_produtos(v_t, '[
    {"nome": "Água com Gás 500ml", "categoria": "Bebidas", "sku": "AGUA-GAS", "preco": "4.50"},
    {"nome": "Refrigerante 2L novo preço", "sku": "REF-2L", "preco": "10.90"},
    {"nome": "", "preco": "5.00"},
    {"nome": "Unidade errada", "preco": "1.00", "unidade": "xyz"}
  ]');

  if (v_rel ->> 'inseridos')::int <> 1 then
    raise exception 'Esperado 1 inserido, veio %', v_rel ->> 'inseridos';
  end if;
  if (v_rel ->> 'atualizados')::int <> 1 then
    raise exception 'Esperado 1 atualizado, veio %', v_rel ->> 'atualizados';
  end if;
  if jsonb_array_length(v_rel -> 'erros') <> 2 then
    raise exception 'Esperados 2 erros, vieram %', jsonb_array_length(v_rel -> 'erros');
  end if;

  select preco_venda into v_preco from public.products
  where tenant_id = v_t and sku = 'REF-2L';
  if v_preco <> 10.90 then raise exception 'Upsert por SKU não atualizou o preço'; end if;

  raise notice 'OK  7 · importador: 1 inserido, 1 atualizado por SKU, 2 erros relatados';
end $$;

-- ===========================================================================
-- 8. Mudança de preço fica na auditoria
-- ===========================================================================
reset role;
do $$
declare v_n int; v_t uuid := current_setting('test.t_pizza')::uuid;
begin
  select count(*) into v_n
  from public.audit_log
  where tenant_id = v_t
    and tabela = 'products'
    and acao = 'UPDATE'
    and 'preco_venda' = any(campos_alterados);
  if v_n < 1 then raise exception 'Alteração de preço sem trilha de auditoria'; end if;
  raise notice 'OK  8 · alteração de preço registrada na auditoria com o campo alterado';
end $$;

\echo ''
\echo '================================================'
\echo ' 8/8 asserções passaram · Fase 3 (cadastros) ok'
\echo '================================================'
