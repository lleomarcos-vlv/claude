-- =============================================================================
-- 0008 · Unidades de medida e conversão (Fase 3, item 8 do briefing)
--
-- Duas camadas de conversão:
--   1. Física (global): kg ↔ g ↔ mg, L ↔ ml — fator fixo por unidade-base.
--   2. De embalagem (por produto): caixa, fardo, pacote… valem o que o produto
--      definir (caixa de 12, fardo de 6). Fica em product_units (migration 0009).
--
-- O estoque é sempre gravado na unidade-base do tipo (g, ml, un) — a Fase 4
-- depende disso para a baixa em cascata não acumular erro de arredondamento.
-- =============================================================================

create type app.tipo_unidade as enum ('massa', 'volume', 'contagem');

create table public.units (
  chave      text primary key,
  nome       text not null,
  tipo       app.tipo_unidade not null,
  -- Quantas unidades-base (g, ml, un) valem 1 desta unidade.
  -- NULL = embalagem: o fator é definido por produto, em product_units.
  fator_base numeric(18,6),
  fracionada boolean not null default false   -- aceita quantidade quebrada (1,5 kg)
);

comment on table public.units is
  'Catálogo global de unidades. Embalagens (fator_base nulo) valem o que cada produto definir.';

insert into public.units (chave, nome, tipo, fator_base, fracionada) values
  -- massa (base: g)
  ('kg',      'Quilograma',   'massa',    1000,     true),
  ('g',       'Grama',        'massa',    1,        true),
  ('mg',      'Miligrama',    'massa',    0.001,    true),
  -- volume (base: ml)
  ('l',       'Litro',        'volume',   1000,     true),
  ('ml',      'Mililitro',    'volume',   1,        true),
  -- contagem (base: un)
  ('un',      'Unidade',      'contagem', 1,        false),
  ('porcao',  'Porção',       'contagem', 1,        false),
  -- embalagens: fator por produto
  ('cx',      'Caixa',        'contagem', null,     false),
  ('fardo',   'Fardo',        'contagem', null,     false),
  ('pacote',  'Pacote',       'contagem', null,     false),
  ('saco',    'Saco',         'contagem', null,     false),
  ('garrafa', 'Garrafa',      'contagem', null,     false),
  ('lata',    'Lata',         'contagem', null,     false);

alter table public.units enable row level security;
create policy leitura_units on public.units
  for select using (auth.uid() is not null);

-- -----------------------------------------------------------------------------
-- Conversão física entre unidades do mesmo tipo
-- -----------------------------------------------------------------------------
create or replace function app.converter(p_qtd numeric, p_de text, p_para text)
returns numeric
language plpgsql
stable
set search_path = public, pg_catalog
as $$
declare
  v_de   public.units%rowtype;
  v_para public.units%rowtype;
begin
  select * into v_de   from public.units where chave = p_de;
  select * into v_para from public.units where chave = p_para;

  if v_de.chave is null or v_para.chave is null then
    raise exception 'Unidade desconhecida: %', coalesce(nullif(p_de, v_de.chave), p_para)
      using errcode = 'P0002';
  end if;
  if v_de.tipo <> v_para.tipo then
    raise exception 'Não converto % (%) em % (%): tipos diferentes.',
      p_de, v_de.tipo, p_para, v_para.tipo using errcode = '22023';
  end if;
  if v_de.fator_base is null or v_para.fator_base is null then
    raise exception 'A embalagem "%" só converte com o fator do produto (product_units).',
      case when v_de.fator_base is null then p_de else p_para end using errcode = '22023';
  end if;

  return p_qtd * v_de.fator_base / v_para.fator_base;
end $$;

comment on function app.converter is
  'Conversão física (2 kg → 2000 g). Embalagens convertem via app.converter_produto.';

grant execute on function app.converter(numeric, text, text) to public;
