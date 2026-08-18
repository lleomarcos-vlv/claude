-- =============================================================================
-- 0014 · Central do Contador e relatórios (Fase 8, itens 18, 36–37, 52)
--
-- · Pacote mensal do contador ("CONTABILIDADE — AGOSTO/2026"): gerado no
--   banco com vendas, compras, documentos fiscais e DRE da competência, com
--   histórico de status. O ENVIO por e-mail/API depende de credencial
--   (pendência declarada); a exportação por download é real.
-- · Relatórios: catálogo + uma função por relatório, todas sob a permissão
--   relatorios.ver. Exportação CSV/Excel acontece no cliente, dos dados
--   reais retornados aqui.
-- · Convite do contador (item 52): já funciona — é o fluxo de convite da
--   Fase 2 com o papel "contador" (somente leitura contábil, testado no 0001).
-- =============================================================================

create type app.status_pacote as enum ('gerado', 'enviado', 'erro');

create table public.accountant_packages (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  competencia   date not null,                 -- primeiro dia do mês
  titulo        text not null,                 -- "CONTABILIDADE — AGOSTO/2026"
  status        app.status_pacote not null default 'gerado',
  conteudo      jsonb not null,                -- resumo estruturado da competência
  enviado_para  text,                          -- e-mail do contador, quando enviado
  enviado_em    timestamptz,
  erro          text,
  criado_por    uuid references public.profiles(id) on delete set null,
  criado_em     timestamptz not null default now(),
  unique (tenant_id, competencia)
);

alter table public.accountant_packages enable row level security;
create policy pacotes_leitura on public.accountant_packages
  for select using (app.pode(tenant_id, 'relatorios.ver'));

-- -----------------------------------------------------------------------------
-- Catálogo de relatórios (item 36) — o que existe e o que ainda não existe
-- fica declarado como dado, não escondido.
-- -----------------------------------------------------------------------------
create table public.report_catalog (
  chave        text primary key,
  nome         text not null,
  descricao    text not null,
  ordem        smallint not null,
  implementado boolean not null default true
);

insert into public.report_catalog (chave, nome, descricao, ordem, implementado) values
  ('vendas_por_dia',       'Vendas por dia',            'Total e quantidade de vendas fechadas por dia',            1, true),
  ('vendas_por_produto',   'Vendas por produto',        'Ranking de produtos por faturamento e quantidade',         2, true),
  ('vendas_por_categoria', 'Vendas por categoria',      'Faturamento agrupado por categoria do catálogo',           3, true),
  ('vendas_por_pagamento', 'Vendas por forma de pagamento', 'Recebimentos por forma (dinheiro, Pix, cartão…)',      4, true),
  ('consumo_insumos',      'Consumo de insumos',        'Saídas de estoque por insumo no período (item 37)',        5, true),
  ('estoque_atual',        'Posição de estoque',        'Saldo, mínimo e custo por produto',                        6, true),
  ('contas_a_pagar',       'Contas a pagar',            'Abertas e vencidas, por vencimento',                       7, true),
  ('contas_a_receber',     'Contas a receber',          'Abertas e vencidas, por vencimento',                       8, true),
  ('dre',                  'DRE gerencial',             'Receita, CMV congelado, taxas, despesas e resultado',      9, true),
  ('fluxo_caixa',          'Fluxo de caixa',            'Entradas e saídas realizadas por dia',                    10, true),
  ('clientes_top',         'Melhores clientes',         'Clientes por valor comprado no período',                  11, true),
  ('cancelamentos',        'Cancelamentos',             'Vendas canceladas com motivo',                            12, true),
  ('margem_por_produto',   'Margem por produto',        'Preço, custo real e margem de cada produto',              13, true),
  ('caixa_sessoes',        'Sessões de caixa',          'Aberturas, fechamentos e diferenças',                     14, true),
  ('curva_abc',            'Curva ABC',                 'Classificação ABC por faturamento',                       15, true),
  ('comissoes',            'Comissões de vendedores',   'Depende de regra de comissão por vendedor (Fase 9+)',     16, false),
  ('ruptura_estoque',      'Rupturas e quase-rupturas', 'Alertas de reposição e previsão de ruptura',              17, true),
  ('auditoria_precos',     'Alterações de preço',       'Trilha de mudanças de preço via auditoria',               18, true);

alter table public.report_catalog enable row level security;
create policy catalogo_relatorios_leitura on public.report_catalog
  for select using (auth.uid() is not null);

-- -----------------------------------------------------------------------------
-- Relatórios: uma função só, saída jsonb tabular {colunas: [], linhas: [[]]}
-- -----------------------------------------------------------------------------
create or replace function app.relatorio(
  p_tenant uuid, p_chave text, p_de date, p_ate date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare
  v jsonb;
begin
  if not app.pode(p_tenant, 'relatorios.ver') then
    raise exception 'Sem permissão para relatórios.' using errcode = '42501';
  end if;

  case p_chave

  when 'vendas_por_dia' then
    select jsonb_build_object('colunas', jsonb_build_array('dia', 'vendas', 'total'),
      'linhas', coalesce(jsonb_agg(jsonb_build_array(dia, n, total) order by dia), '[]'))
    into v from (
      select fechada_em::date as dia, count(*) as n, round(sum(total), 2) as total
      from public.sales
      where tenant_id = p_tenant and status = 'fechada'
        and fechada_em::date between p_de and p_ate
      group by 1) t;

  when 'vendas_por_produto' then
    select jsonb_build_object('colunas', jsonb_build_array('produto', 'qtd', 'faturamento'),
      'linhas', coalesce(jsonb_agg(jsonb_build_array(nome, qtd, fat) order by fat desc), '[]'))
    into v from (
      select si.nome_produto as nome, sum(si.qtd) as qtd,
             round(sum(si.qtd * si.preco_unitario - si.desconto), 2) as fat
      from public.sale_items si
      join public.sales s on s.id = si.sale_id
      where s.tenant_id = p_tenant and s.status = 'fechada'
        and s.fechada_em::date between p_de and p_ate and not si.cancelado
      group by 1) t;

  when 'vendas_por_categoria' then
    select jsonb_build_object('colunas', jsonb_build_array('categoria', 'faturamento'),
      'linhas', coalesce(jsonb_agg(jsonb_build_array(categoria, fat) order by fat desc), '[]'))
    into v from (
      select coalesce(c.nome, 'Sem categoria') as categoria,
             round(sum(si.qtd * si.preco_unitario - si.desconto), 2) as fat
      from public.sale_items si
      join public.sales s on s.id = si.sale_id
      left join public.products p on p.id = si.product_id
      left join public.product_categories c on c.id = p.categoria_id
      where s.tenant_id = p_tenant and s.status = 'fechada'
        and s.fechada_em::date between p_de and p_ate and not si.cancelado
      group by 1) t;

  when 'vendas_por_pagamento' then
    select jsonb_build_object('colunas', jsonb_build_array('forma', 'total'),
      'linhas', coalesce(jsonb_agg(jsonb_build_array(forma, total) order by total desc), '[]'))
    into v from (
      select sp.forma::text, round(sum(sp.valor), 2) as total
      from public.sale_payments sp
      join public.sales s on s.id = sp.sale_id
      where s.tenant_id = p_tenant and s.status = 'fechada'
        and s.fechada_em::date between p_de and p_ate
      group by 1) t;

  when 'consumo_insumos' then
    select jsonb_build_object('colunas', jsonb_build_array('insumo', 'consumo', 'unidade_base'),
      'linhas', coalesce(jsonb_agg(jsonb_build_array(nome, consumo, ub) order by consumo desc), '[]'))
    into v from (
      select p.nome, round(sum(-m.qtd_base), 3) as consumo, app.unidade_base(p.unidade) as ub
      from public.stock_moves m
      join public.products p on p.id = m.product_id
      where m.tenant_id = p_tenant and m.qtd_base < 0
        and m.tipo in ('venda', 'producao', 'consumo_interno')
        and m.criado_em::date between p_de and p_ate
      group by p.nome, p.unidade) t;

  when 'estoque_atual' then
    select jsonb_build_object('colunas', jsonb_build_array('produto', 'saldo', 'unidade_base', 'minimo', 'custo_unitario'),
      'linhas', coalesce(jsonb_agg(jsonb_build_array(nome, saldo, ub, minimo, custo) order by nome), '[]'))
    into v from (
      select p.nome, sl.saldo, app.unidade_base(p.unidade) as ub, sl.minimo,
             round(p.custo, 6) as custo
      from public.stock_levels sl
      join public.products p on p.id = sl.product_id
      where sl.tenant_id = p_tenant) t;

  when 'contas_a_pagar', 'contas_a_receber' then
    select jsonb_build_object('colunas', jsonb_build_array('descricao', 'vencimento', 'valor', 'vencida'),
      'linhas', coalesce(jsonb_agg(jsonb_build_array(descricao, vencimento, valor, vencida) order by vencimento), '[]'))
    into v from (
      select f.descricao, f.vencimento, f.valor, (f.vencimento < current_date) as vencida
      from public.finance_entries f
      where f.tenant_id = p_tenant and f.status = 'aberta'
        and f.tipo = case when p_chave = 'contas_a_pagar' then 'pagar'::app.tipo_conta
                          else 'receber'::app.tipo_conta end) t;

  when 'dre' then
    select jsonb_build_object('colunas', jsonb_build_array('linha', 'valor'),
      'linhas', coalesce(jsonb_agg(jsonb_build_array(linha, valor) order by ordem), '[]'))
    into v from app.dre(p_tenant, p_de, p_ate);

  when 'fluxo_caixa' then
    select jsonb_build_object('colunas', jsonb_build_array('dia', 'entradas', 'saidas', 'saldo'),
      'linhas', coalesce(jsonb_agg(jsonb_build_array(dia, entradas, saidas, saldo_dia) order by dia), '[]'))
    into v from app.fluxo_caixa(p_tenant, p_de, p_ate);

  when 'clientes_top' then
    select jsonb_build_object('colunas', jsonb_build_array('cliente', 'compras', 'total'),
      'linhas', coalesce(jsonb_agg(jsonb_build_array(nome, n, total) order by total desc), '[]'))
    into v from (
      select c.nome, count(*) as n, round(sum(s.total), 2) as total
      from public.sales s
      join public.customers c on c.id = s.customer_id
      where s.tenant_id = p_tenant and s.status = 'fechada'
        and s.fechada_em::date between p_de and p_ate
      group by c.nome) t;

  when 'cancelamentos' then
    select jsonb_build_object('colunas', jsonb_build_array('venda', 'motivo', 'valor', 'quando'),
      'linhas', coalesce(jsonb_agg(jsonb_build_array(numero, motivo, total, quando) order by quando desc), '[]'))
    into v from (
      select s.numero, s.motivo_cancelamento as motivo, s.total,
             s.atualizado_em::date as quando
      from public.sales s
      where s.tenant_id = p_tenant and s.status = 'cancelada'
        and s.atualizado_em::date between p_de and p_ate) t;

  when 'margem_por_produto' then
    select jsonb_build_object('colunas', jsonb_build_array('produto', 'preco', 'custo_real', 'margem_pct'),
      'linhas', coalesce(jsonb_agg(jsonb_build_array(nome, preco, custo, margem) order by margem), '[]'))
    into v from (
      select p.nome, p.preco_venda as preco,
             round(app.custo_produto(p.id), 4) as custo,
             case when p.preco_venda > 0
               then round((p.preco_venda - app.custo_produto(p.id)) / p.preco_venda * 100, 2) end as margem
      from public.products p
      where p.tenant_id = p_tenant and p.ativo and p.tipo <> 'insumo'
        and p.preco_venda > 0) t;

  when 'caixa_sessoes' then
    select jsonb_build_object('colunas', jsonb_build_array('aberto_em', 'fechado_em', 'abertura', 'esperado', 'contado', 'diferenca'),
      'linhas', coalesce(jsonb_agg(jsonb_build_array(a, f, ab, e, c, d) order by a desc), '[]'))
    into v from (
      select rs.aberto_em::date as a, rs.fechado_em::date as f, rs.saldo_abertura as ab,
             rs.saldo_esperado as e, rs.saldo_contado as c, rs.diferenca as d
      from public.register_sessions rs
      where rs.tenant_id = p_tenant
        and rs.aberto_em::date between p_de and p_ate) t;

  when 'curva_abc' then
    select jsonb_build_object('colunas', jsonb_build_array('produto', 'faturamento', 'participacao_pct', 'classe'),
      'linhas', coalesce(jsonb_agg(jsonb_build_array(nome, fat, pct, classe) order by fat desc), '[]'))
    into v from (
      -- classe pelo acumulado ANTERIOR ao item: um produto com 100% do
      -- faturamento é classe A, não C
      select nome, fat, pct,
             case when acumulado - pct < 80 then 'A'
                  when acumulado - pct < 95 then 'B'
                  else 'C' end as classe
      from (
        select nome, fat,
               round(fat / nullif(sum(fat) over (), 0) * 100, 2) as pct,
               round(sum(fat) over (order by fat desc)
                     / nullif(sum(fat) over (), 0) * 100, 2) as acumulado
        from (
          select si.nome_produto as nome,
                 sum(si.qtd * si.preco_unitario - si.desconto) as fat
          from public.sale_items si
          join public.sales s on s.id = si.sale_id
          where s.tenant_id = p_tenant and s.status = 'fechada'
            and s.fechada_em::date between p_de and p_ate and not si.cancelado
          group by 1) base
      ) classificada) t;

  when 'ruptura_estoque' then
    select jsonb_build_object('colunas', jsonb_build_array('produto', 'situacao', 'saldo', 'dias_restantes', 'fornecedor'),
      'linhas', coalesce(jsonb_agg(jsonb_build_array(produto, situacao, saldo, dias_restantes, fornecedor)), '[]'))
    into v from app.alertas_estoque(p_tenant);

  when 'auditoria_precos' then
    select jsonb_build_object('colunas', jsonb_build_array('quando', 'produto', 'de', 'para', 'quem'),
      'linhas', coalesce(jsonb_agg(jsonb_build_array(quando, produto, de, para, quem) order by quando desc), '[]'))
    into v from (
      select a.criado_em::date as quando,
             a.valor_novo ->> 'nome' as produto,
             a.valor_anterior ->> 'preco_venda' as de,
             a.valor_novo ->> 'preco_venda' as para,
             pr.nome as quem
      from public.audit_log a
      left join public.profiles pr on pr.id = a.user_id
      where a.tenant_id = p_tenant and a.tabela = 'products' and a.acao = 'UPDATE'
        and 'preco_venda' = any(a.campos_alterados)
        and a.criado_em::date between p_de and p_ate) t;

  else
    if exists (select 1 from public.report_catalog where chave = p_chave and not implementado) then
      raise exception 'Relatório "%" ainda não implementado (depende de fase futura).', p_chave
        using errcode = '0A000';
    end if;
    raise exception 'Relatório "%" não existe.', p_chave using errcode = 'P0002';
  end case;

  return coalesce(v, jsonb_build_object('colunas', '[]'::jsonb, 'linhas', '[]'::jsonb));
end $$;

comment on function app.relatorio is
  'Relatórios tabulares em jsonb {colunas, linhas}. Exportação CSV/Excel é feita no cliente.';

-- -----------------------------------------------------------------------------
-- Pacote mensal do contador (item 18)
-- -----------------------------------------------------------------------------
create or replace function app.gerar_pacote_contador(p_tenant uuid, p_competencia date)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_ini date := date_trunc('month', p_competencia)::date;
  v_fim date := (date_trunc('month', p_competencia) + interval '1 month - 1 day')::date;
  v_meses constant text[] := array['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO',
                                   'JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
  v_titulo text;
  v_conteudo jsonb;
  v_id uuid;
begin
  if not app.pode(p_tenant, 'relatorios.exportar') then
    raise exception 'Gerar pacote do contador exige relatorios.exportar.' using errcode = '42501';
  end if;

  v_titulo := 'CONTABILIDADE — ' || v_meses[extract(month from v_ini)] || '/' || extract(year from v_ini);

  v_conteudo := jsonb_build_object(
    'competencia', to_char(v_ini, 'YYYY-MM'),
    'gerado_em', now(),
    'vendas', app.relatorio(p_tenant, 'vendas_por_dia', v_ini, v_fim),
    'vendas_por_pagamento', app.relatorio(p_tenant, 'vendas_por_pagamento', v_ini, v_fim),
    'dre', app.relatorio(p_tenant, 'dre', v_ini, v_fim),
    'fluxo_caixa', app.relatorio(p_tenant, 'fluxo_caixa', v_ini, v_fim),
    'cancelamentos', app.relatorio(p_tenant, 'cancelamentos', v_ini, v_fim),
    'documentos_fiscais', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'tipo', d.tipo, 'status', d.status, 'numero', d.numero,
        'chave', d.chave, 'criado_em', d.criado_em)), '[]')
      from public.fiscal_documents d
      where d.tenant_id = p_tenant and d.criado_em::date between v_ini and v_fim),
    'compras_recebidas', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'numero', po.numero, 'total', po.total, 'chave_nfe', po.chave_nfe)), '[]')
      from public.purchase_orders po
      where po.tenant_id = p_tenant and po.status in ('recebido', 'recebido_parcial')
        and po.atualizado_em::date between v_ini and v_fim)
  );

  insert into public.accountant_packages (tenant_id, competencia, titulo, conteudo, criado_por)
  values (p_tenant, v_ini, v_titulo, v_conteudo, auth.uid())
  on conflict (tenant_id, competencia) do update
    set conteudo = excluded.conteudo,
        titulo = excluded.titulo,
        status = 'gerado',
        criado_em = now()
  returning id into v_id;

  return v_id;
end $$;

comment on function app.gerar_pacote_contador is
  'Pacote mensal "CONTABILIDADE — MÊS/ANO". Regerar a mesma competência substitui o conteúdo.';

revoke all on function app.relatorio(uuid, text, date, date) from public;
revoke all on function app.gerar_pacote_contador(uuid, date) from public;
grant execute on function app.relatorio(uuid, text, date, date) to public;
grant execute on function app.gerar_pacote_contador(uuid, date) to public;
