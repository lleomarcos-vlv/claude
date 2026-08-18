-- =============================================================================
-- 0007 · Verticais (kits de nicho) — Fase 3
--
-- Os 9 kits que viviam em JavaScript no protótipo (prototipos/nucleo.html)
-- passam a ser dados versionados. Um nicho novo é um conjunto de registros
-- nestas tabelas — nenhum código muda.
--
-- Catálogo global, como permissions: leitura para qualquer autenticado,
-- escrita apenas por migration.
-- =============================================================================

create table public.verticals (
  chave     text primary key,
  nome      text not null,
  descricao text not null,
  cor       text not null,            -- accent da identidade white-label
  sigla     char(2) not null,
  ordem     smallint not null,
  -- Comportamentos do nicho (ex.: taxa de entrega padrão, comissão, venda a
  -- prazo, observação por item). Chaves documentadas em docs/; a interface
  -- ignora chaves que não conhece.
  config    jsonb not null default '{}'
);

comment on table public.verticals is
  'Kit de nicho. Nicho novo = linhas novas aqui e nas tabelas satélites, sem código novo.';

-- Terminologia: como o nicho chama a venda, o documento e a ação de fechar.
create table public.vertical_terminology (
  vertical_chave text not null references public.verticals(chave) on delete cascade,
  termo          text not null,        -- 'venda' | 'documento' | 'acao_fechar'
  valor          text not null,
  primary key (vertical_chave, termo)
);

-- Modos de venda do nicho (Balcão, Mesa, Delivery, Orçamento…).
create table public.vertical_modes (
  vertical_chave text not null references public.verticals(chave) on delete cascade,
  nome           text not null,
  ordem          smallint not null,
  servico        boolean not null default false,  -- modo com mesa/comanda aberta
  entrega        boolean not null default false,  -- modo com endereço e taxa
  primary key (vertical_chave, nome)
);

-- Campos extras que o nicho acrescenta ao produto (grade, lote, veículo…).
create table public.vertical_fields (
  vertical_chave text not null references public.verticals(chave) on delete cascade,
  chave          text not null,        -- 'peso','grade','lote','veiculo','pet','prof','area'
  rotulo         text not null,
  primary key (vertical_chave, chave)
);

-- Catálogo inicial sugerido no onboarding (dados de demonstração do kit).
create table public.vertical_seed_products (
  id             bigserial primary key,
  vertical_chave text not null references public.verticals(chave) on delete cascade,
  categoria      text not null,
  nome           text not null,
  preco          numeric(12,2) not null,
  campo_extra    text                       -- referencia vertical_fields.chave
);

alter table public.verticals             enable row level security;
alter table public.vertical_terminology  enable row level security;
alter table public.vertical_modes        enable row level security;
alter table public.vertical_fields       enable row level security;
alter table public.vertical_seed_products enable row level security;

create policy leitura_verticals on public.verticals
  for select using (auth.uid() is not null);
create policy leitura_vertical_term on public.vertical_terminology
  for select using (auth.uid() is not null);
create policy leitura_vertical_modes on public.vertical_modes
  for select using (auth.uid() is not null);
create policy leitura_vertical_fields on public.vertical_fields
  for select using (auth.uid() is not null);
create policy leitura_vertical_seeds on public.vertical_seed_products
  for select using (auth.uid() is not null);

-- A escolha do nicho no onboarding passa a validar contra o catálogo.
alter table public.tenants
  add constraint tenants_vertical_fk
  foreign key (vertical_chave) references public.verticals(chave);

-- -----------------------------------------------------------------------------
-- Escolher o nicho da empresa (onboarding, etapa 2)
-- -----------------------------------------------------------------------------
create or replace function app.definir_vertical(p_tenant uuid, p_vertical text)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if not app.pode(p_tenant, 'empresa.editar') then
    raise exception 'Sem permissão para configurar a empresa.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.verticals where chave = p_vertical) then
    raise exception 'Nicho "%" não existe.', p_vertical using errcode = 'P0002';
  end if;

  update public.tenants
  set vertical_chave = p_vertical,
      onboarding_etapa = greatest(onboarding_etapa, 2)
  where id = p_tenant;
end $$;

revoke all on function app.definir_vertical(uuid, text) from public;
grant execute on function app.definir_vertical(uuid, text) to public;

-- =============================================================================
-- Seed dos 9 kits (gerado de prototipos/nucleo.html — fonte única até aqui)
-- =============================================================================
insert into public.verticals (chave, nome, descricao, cor, sigla, ordem, config) values
  ('food', 'Food & Delivery', 'Restaurante, lanchonete, pizzaria, food truck', '#1B7A4B', 'FD', 1, '{"taxa_entrega":8,"observacao_por_item":true}'::jsonb),
  ('mercado', 'Mercado & Mercearia', 'Supermercado, hortifruti, açougue, padaria', '#0E6E75', 'MC', 2, '{"taxa_entrega":12}'::jsonb),
  ('moda', 'Moda & Calçados', 'Boutique, loja de roupas, sapataria', '#A02B62', 'MD', 3, '{"venda_a_prazo":true,"vendedor_obrigatorio":true}'::jsonb),
  ('farmacia', 'Farmácia & Saúde', 'Drogaria, farmácia de manipulação, suplementos', '#17548C', 'FM', 4, '{"taxa_entrega":6,"venda_a_prazo":true}'::jsonb),
  ('autopecas', 'Autopeças & Oficina', 'Peças, acessórios, oficina mecânica', '#2F4858', 'AP', 5, '{"venda_a_prazo":true}'::jsonb),
  ('petshop', 'Petshop & Agro', 'Pet shop, banho e tosa, agropecuária', '#4F6B22', 'PT', 6, '{"taxa_entrega":10}'::jsonb),
  ('beleza', 'Beleza & Barbearia', 'Salão, barbearia, estética, manicure', '#6D3AA3', 'BL', 7, '{"comissao_padrao":0.4}'::jsonb),
  ('distribuidora', 'Distribuidora & Atacado', 'Atacadista, representante, venda externa', '#3B3F8F', 'DT', 8, '{"venda_a_prazo":true,"vendedor_obrigatorio":true}'::jsonb),
  ('construcao', 'Construção & Materiais', 'Depósito, material de construção, ferragem', '#7A5C3A', 'CT', 9, '{"taxa_entrega":45,"venda_a_prazo":true}'::jsonb);

insert into public.vertical_terminology (vertical_chave, termo, valor) values
  ('food', 'venda', 'Comanda'),
  ('food', 'documento', 'Comanda'),
  ('food', 'acao_fechar', 'Finalizar venda'),
  ('mercado', 'venda', 'Frente de Caixa'),
  ('mercado', 'documento', 'Cupom'),
  ('mercado', 'acao_fechar', 'Fechar cupom'),
  ('moda', 'venda', 'Venda'),
  ('moda', 'documento', 'Venda'),
  ('moda', 'acao_fechar', 'Fechar venda'),
  ('farmacia', 'venda', 'Balcão'),
  ('farmacia', 'documento', 'Venda'),
  ('farmacia', 'acao_fechar', 'Fechar venda'),
  ('autopecas', 'venda', 'Balcão'),
  ('autopecas', 'documento', 'Orçamento'),
  ('autopecas', 'acao_fechar', 'Fechar pedido'),
  ('petshop', 'venda', 'Atendimento'),
  ('petshop', 'documento', 'Venda'),
  ('petshop', 'acao_fechar', 'Fechar atendimento'),
  ('beleza', 'venda', 'Atendimento'),
  ('beleza', 'documento', 'Comanda'),
  ('beleza', 'acao_fechar', 'Fechar comanda'),
  ('distribuidora', 'venda', 'Pedido'),
  ('distribuidora', 'documento', 'Pedido'),
  ('distribuidora', 'acao_fechar', 'Gravar pedido'),
  ('construcao', 'venda', 'Balcão'),
  ('construcao', 'documento', 'Orçamento'),
  ('construcao', 'acao_fechar', 'Fechar pedido');

insert into public.vertical_modes (vertical_chave, nome, ordem, servico, entrega) values
  ('food', 'Balcão', 1, false, false),
  ('food', 'Mesa', 2, true, false),
  ('food', 'Delivery', 3, false, true),
  ('mercado', 'Caixa', 1, false, false),
  ('mercado', 'Delivery', 2, false, true),
  ('moda', 'Loja', 1, false, false),
  ('moda', 'Troca', 2, false, false),
  ('moda', 'Encomenda', 3, false, false),
  ('farmacia', 'Balcão', 1, false, false),
  ('farmacia', 'Convênio', 2, false, false),
  ('farmacia', 'Delivery', 3, false, true),
  ('autopecas', 'Balcão', 1, false, false),
  ('autopecas', 'Orçamento', 2, false, false),
  ('autopecas', 'Ordem de Serviço', 3, false, false),
  ('petshop', 'Loja', 1, false, false),
  ('petshop', 'Banho & Tosa', 2, false, false),
  ('petshop', 'Delivery', 3, false, true),
  ('beleza', 'Agenda', 1, false, false),
  ('beleza', 'Balcão', 2, false, false),
  ('distribuidora', 'Pedido', 1, false, false),
  ('distribuidora', 'Romaneio', 2, false, false),
  ('construcao', 'Balcão', 1, false, false),
  ('construcao', 'Orçamento', 2, false, false),
  ('construcao', 'Entrega', 3, false, true);

insert into public.vertical_fields (vertical_chave, chave, rotulo) values
  ('mercado', 'peso', 'Venda por peso'),
  ('moda', 'grade', 'Grade (tamanho/cor)'),
  ('farmacia', 'lote', 'Lote e validade'),
  ('autopecas', 'veiculo', 'Compatibilidade veicular'),
  ('petshop', 'peso', 'Venda por peso'),
  ('petshop', 'pet', 'Porte do animal'),
  ('beleza', 'prof', 'Profissional / comissão'),
  ('construcao', 'area', 'Cálculo por área');

insert into public.vertical_seed_products (vertical_chave, categoria, nome, preco, campo_extra) values
  ('food', 'Lanches', 'X-Burger', 18.90, null),
  ('food', 'Lanches', 'X-Salada', 21.90, null),
  ('food', 'Lanches', 'X-Bacon', 24.90, null),
  ('food', 'Lanches', 'X-Tudo', 29.90, null),
  ('food', 'Lanches', 'Misto Quente', 12.00, null),
  ('food', 'Porções', 'Batata Frita P', 22.00, null),
  ('food', 'Porções', 'Batata Frita G', 34.00, null),
  ('food', 'Porções', 'Frango a Passarinho', 42.00, null),
  ('food', 'Porções', 'Calabresa Acebolada', 38.00, null),
  ('food', 'Pratos', 'Executivo de Frango', 32.00, null),
  ('food', 'Pratos', 'Executivo de Carne', 36.00, null),
  ('food', 'Pratos', 'Filé à Parmegiana', 54.90, null),
  ('food', 'Pratos', 'Marmitex Grande', 28.00, null),
  ('food', 'Bebidas', 'Refrigerante Lata', 7.00, null),
  ('food', 'Bebidas', 'Água Mineral 500ml', 4.00, null),
  ('food', 'Bebidas', 'Suco Natural 300ml', 9.50, null),
  ('food', 'Bebidas', 'Cerveja Long Neck', 11.00, null),
  ('food', 'Sobremesas', 'Pudim de Leite', 12.00, null),
  ('food', 'Sobremesas', 'Açaí 300ml', 16.00, null),
  ('food', 'Sobremesas', 'Petit Gateau', 19.90, null),
  ('food', 'Cafeteria', 'Café Expresso', 5.00, null),
  ('food', 'Cafeteria', 'Cappuccino', 9.00, null),
  ('food', 'Cafeteria', 'Pão de Queijo', 6.50, null),
  ('mercado', 'Hortifruti', 'Banana Prata', 6.99, 'peso'),
  ('mercado', 'Hortifruti', 'Tomate', 8.49, 'peso'),
  ('mercado', 'Hortifruti', 'Batata Inglesa', 5.99, 'peso'),
  ('mercado', 'Hortifruti', 'Cebola', 4.79, 'peso'),
  ('mercado', 'Açougue', 'Patinho Bovino', 42.90, 'peso'),
  ('mercado', 'Açougue', 'Frango Inteiro', 12.90, 'peso'),
  ('mercado', 'Açougue', 'Linguiça Toscana', 24.90, 'peso'),
  ('mercado', 'Mercearia', 'Arroz Tipo 1 5kg', 27.90, null),
  ('mercado', 'Mercearia', 'Feijão Carioca 1kg', 8.49, null),
  ('mercado', 'Mercearia', 'Açúcar Refinado 1kg', 4.29, null),
  ('mercado', 'Mercearia', 'Óleo de Soja 900ml', 7.19, null),
  ('mercado', 'Mercearia', 'Café Torrado 500g', 18.90, null),
  ('mercado', 'Bebidas', 'Refrigerante 2L', 9.49, null),
  ('mercado', 'Bebidas', 'Cerveja Lata 350ml', 3.99, null),
  ('mercado', 'Bebidas', 'Água 1,5L', 3.29, null),
  ('mercado', 'Bebidas', 'Leite Integral 1L', 5.49, null),
  ('mercado', 'Limpeza', 'Detergente 500ml', 2.79, null),
  ('mercado', 'Limpeza', 'Sabão em Pó 1kg', 12.90, null),
  ('mercado', 'Limpeza', 'Água Sanitária 1L', 4.59, null),
  ('mercado', 'Padaria', 'Pão Francês', 16.90, 'peso'),
  ('mercado', 'Padaria', 'Bolo Caseiro Fatia', 6.50, null),
  ('moda', 'Feminino', 'Vestido Midi', 189.90, 'grade'),
  ('moda', 'Feminino', 'Blusa Cropped', 79.90, 'grade'),
  ('moda', 'Feminino', 'Calça Jeans Skinny', 159.90, 'grade'),
  ('moda', 'Feminino', 'Saia Plissada', 119.90, 'grade'),
  ('moda', 'Masculino', 'Camisa Social', 149.90, 'grade'),
  ('moda', 'Masculino', 'Camiseta Básica', 59.90, 'grade'),
  ('moda', 'Masculino', 'Bermuda Sarja', 109.90, 'grade'),
  ('moda', 'Masculino', 'Calça Jeans Reta', 169.90, 'grade'),
  ('moda', 'Calçados', 'Tênis Casual', 249.90, 'grade'),
  ('moda', 'Calçados', 'Sandália Rasteira', 89.90, 'grade'),
  ('moda', 'Calçados', 'Bota Coturno', 299.90, 'grade'),
  ('moda', 'Acessórios', 'Cinto de Couro', 79.90, null),
  ('moda', 'Acessórios', 'Bolsa Transversal', 189.90, null),
  ('moda', 'Acessórios', 'Boné Aba Reta', 69.90, null),
  ('farmacia', 'Medicamentos', 'Dipirona 500mg', 12.90, 'lote'),
  ('farmacia', 'Medicamentos', 'Amoxicilina 500mg', 38.90, 'lote'),
  ('farmacia', 'Medicamentos', 'Losartana 50mg', 24.50, 'lote'),
  ('farmacia', 'Medicamentos', 'Omeprazol 20mg', 19.90, 'lote'),
  ('farmacia', 'Genéricos', 'Paracetamol 750mg', 9.90, 'lote'),
  ('farmacia', 'Genéricos', 'Ibuprofeno 600mg', 16.40, 'lote'),
  ('farmacia', 'Higiene', 'Shampoo Anticaspa', 29.90, null),
  ('farmacia', 'Higiene', 'Creme Dental 90g', 8.90, null),
  ('farmacia', 'Higiene', 'Sabonete Antibacteriano', 4.50, null),
  ('farmacia', 'Dermocosméticos', 'Protetor Solar FPS 50', 74.90, null),
  ('farmacia', 'Dermocosméticos', 'Hidratante Corporal', 49.90, null),
  ('farmacia', 'Infantil', 'Fralda Tam M 60un', 79.90, null),
  ('farmacia', 'Infantil', 'Lenço Umedecido', 14.90, null),
  ('autopecas', 'Motor', 'Filtro de Óleo', 38.90, 'veiculo'),
  ('autopecas', 'Motor', 'Filtro de Ar', 52.00, 'veiculo'),
  ('autopecas', 'Motor', 'Vela de Ignição', 29.90, 'veiculo'),
  ('autopecas', 'Motor', 'Correia Dentada', 189.00, 'veiculo'),
  ('autopecas', 'Freios', 'Pastilha Dianteira', 149.90, 'veiculo'),
  ('autopecas', 'Freios', 'Disco de Freio', 219.00, 'veiculo'),
  ('autopecas', 'Freios', 'Fluido de Freio DOT4', 34.90, null),
  ('autopecas', 'Suspensão', 'Amortecedor Dianteiro', 329.00, 'veiculo'),
  ('autopecas', 'Suspensão', 'Batente e Coifa', 45.00, null),
  ('autopecas', 'Elétrica', 'Bateria 60Ah', 429.00, null),
  ('autopecas', 'Elétrica', 'Lâmpada H4', 24.90, null),
  ('autopecas', 'Elétrica', 'Alternador', 689.00, 'veiculo'),
  ('autopecas', 'Lubrificantes', 'Óleo 5W30 1L', 54.90, null),
  ('autopecas', 'Lubrificantes', 'Aditivo Radiador', 29.90, null),
  ('autopecas', 'Serviços', 'Troca de Óleo', 60.00, null),
  ('autopecas', 'Serviços', 'Alinhamento e Balanceamento', 90.00, null),
  ('autopecas', 'Serviços', 'Revisão Completa', 280.00, null),
  ('petshop', 'Rações', 'Ração Cão Adulto 15kg', 189.90, null),
  ('petshop', 'Rações', 'Ração Gato Castrado 10kg', 219.90, null),
  ('petshop', 'Rações', 'Ração a Granel', 12.90, 'peso'),
  ('petshop', 'Serviços', 'Banho Porte Pequeno', 55.00, 'pet'),
  ('petshop', 'Serviços', 'Banho + Tosa Porte Médio', 95.00, 'pet'),
  ('petshop', 'Serviços', 'Tosa Higiênica', 45.00, 'pet'),
  ('petshop', 'Serviços', 'Consulta Veterinária', 120.00, 'pet'),
  ('petshop', 'Medicamentos', 'Antipulgas', 89.90, null),
  ('petshop', 'Medicamentos', 'Vermífugo', 42.00, null),
  ('petshop', 'Acessórios', 'Coleira Ajustável', 39.90, null),
  ('petshop', 'Acessórios', 'Comedouro Inox', 34.90, null),
  ('petshop', 'Acessórios', 'Brinquedo Mordedor', 24.90, null),
  ('petshop', 'Agro', 'Milho em Grão', 3.49, 'peso'),
  ('petshop', 'Agro', 'Sal Mineral 25kg', 89.00, null),
  ('beleza', 'Cabelo', 'Corte Feminino', 80.00, 'prof'),
  ('beleza', 'Cabelo', 'Corte Masculino', 45.00, 'prof'),
  ('beleza', 'Cabelo', 'Escova', 60.00, 'prof'),
  ('beleza', 'Cabelo', 'Coloração', 190.00, 'prof'),
  ('beleza', 'Barba', 'Barba Completa', 40.00, 'prof'),
  ('beleza', 'Barba', 'Barba + Corte', 75.00, 'prof'),
  ('beleza', 'Estética', 'Design de Sobrancelha', 45.00, 'prof'),
  ('beleza', 'Estética', 'Limpeza de Pele', 130.00, 'prof'),
  ('beleza', 'Estética', 'Manicure', 40.00, 'prof'),
  ('beleza', 'Estética', 'Pedicure', 45.00, 'prof'),
  ('beleza', 'Produtos', 'Shampoo Profissional', 89.90, null),
  ('beleza', 'Produtos', 'Máscara Capilar', 119.90, null),
  ('beleza', 'Produtos', 'Pomada Modeladora', 49.90, null),
  ('distribuidora', 'Bebidas', 'Refrigerante 2L · fardo 6', 54.00, null),
  ('distribuidora', 'Bebidas', 'Cerveja Lata · fardo 12', 46.80, null),
  ('distribuidora', 'Bebidas', 'Água 500ml · fardo 12', 21.60, null),
  ('distribuidora', 'Alimentos', 'Arroz 5kg · fardo 6', 159.00, null),
  ('distribuidora', 'Alimentos', 'Óleo 900ml · cx 20', 138.00, null),
  ('distribuidora', 'Alimentos', 'Macarrão 500g · fardo 20', 78.00, null),
  ('distribuidora', 'Limpeza', 'Detergente · cx 24', 62.40, null),
  ('distribuidora', 'Limpeza', 'Sabão em Pó 1kg · cx 12', 142.80, null),
  ('distribuidora', 'Descartáveis', 'Copo 200ml · cx 5000', 210.00, null),
  ('distribuidora', 'Descartáveis', 'Guardanapo · fardo 30', 89.00, null),
  ('construcao', 'Básicos', 'Cimento CP-II 50kg', 42.90, null),
  ('construcao', 'Básicos', 'Areia Média m³', 120.00, null),
  ('construcao', 'Básicos', 'Brita 1 m³', 145.00, null),
  ('construcao', 'Básicos', 'Cal Hidratada 20kg', 24.90, null),
  ('construcao', 'Acabamento', 'Porcelanato 60x60', 79.90, 'area'),
  ('construcao', 'Acabamento', 'Rejunte 5kg', 28.90, null),
  ('construcao', 'Acabamento', 'Argamassa AC-II 20kg', 32.90, null),
  ('construcao', 'Hidráulica', 'Tubo PVC 100mm 6m', 89.90, null),
  ('construcao', 'Hidráulica', 'Joelho 100mm', 12.90, null),
  ('construcao', 'Hidráulica', 'Registro Gaveta 3/4', 49.90, null),
  ('construcao', 'Elétrica', 'Cabo Flexível 2,5mm 100m', 289.00, null),
  ('construcao', 'Elétrica', 'Disjuntor 20A', 24.90, null),
  ('construcao', 'Elétrica', 'Tomada 2P+T', 18.90, null),
  ('construcao', 'Ferramentas', 'Furadeira de Impacto', 289.00, null),
  ('construcao', 'Ferramentas', 'Trena 5m', 32.90, null);
