-- =============================================================================
-- 0002 · Papéis, permissões e vínculos (RBAC)
--
-- Catálogo global de permissões + 13 perfis-modelo. Cada tenant recebe sua
-- própria cópia dos papéis no provisionamento, podendo editá-los sem afetar
-- os demais clientes.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- permissions · catálogo global (não pertence a tenant)
-- chave no formato "modulo.acao"
-- -----------------------------------------------------------------------------
create table public.permissions (
  chave     text primary key,
  modulo    text not null,
  acao      text not null,
  descricao text not null
);

comment on table public.permissions is
  'Catálogo fixo de permissões. Novas permissões entram por migration, nunca por dado de tenant.';

insert into public.permissions (chave, modulo, acao, descricao) values
  ('empresa.ver',        'empresa',    'ver',      'Ver dados da empresa e filiais'),
  ('empresa.editar',     'empresa',    'editar',   'Editar dados da empresa e filiais'),
  ('usuarios.ver',       'usuarios',   'ver',      'Ver usuários e permissões'),
  ('usuarios.convidar',  'usuarios',   'criar',    'Convidar novos usuários'),
  ('usuarios.editar',    'usuarios',   'editar',   'Alterar papel e permissões de usuários'),
  ('usuarios.remover',   'usuarios',   'excluir',  'Remover usuários do tenant'),

  ('catalogo.ver',       'catalogo',   'ver',      'Ver produtos e serviços'),
  ('catalogo.criar',     'catalogo',   'criar',    'Cadastrar produtos e serviços'),
  ('catalogo.editar',    'catalogo',   'editar',   'Editar produtos, preços e fichas técnicas'),
  ('catalogo.excluir',   'catalogo',   'excluir',  'Excluir produtos e serviços'),

  ('estoque.ver',        'estoque',    'ver',      'Ver saldos e movimentações'),
  ('estoque.movimentar', 'estoque',    'criar',    'Lançar entradas, baixas e perdas'),
  ('estoque.ajustar',    'estoque',    'aprovar',  'Ajustar saldo de estoque (inventário)'),

  ('vendas.ver',         'vendas',     'ver',      'Ver vendas e pedidos'),
  ('vendas.criar',       'vendas',     'criar',    'Registrar venda no PDV'),
  ('vendas.cancelar',    'vendas',     'cancelar', 'Cancelar venda ou item'),
  ('vendas.desconto',    'vendas',     'aprovar',  'Conceder desconto acima do limite'),

  ('pedidos.ver',        'pedidos',    'ver',      'Ver comandas, mesas e pedidos'),
  ('pedidos.gerenciar',  'pedidos',    'editar',   'Abrir, transferir e fechar comandas'),
  ('pedidos.cozinha',    'pedidos',    'editar',   'Operar o painel de cozinha (KDS)'),

  ('compras.ver',        'compras',    'ver',      'Ver pedidos de compra e fornecedores'),
  ('compras.criar',      'compras',    'criar',    'Criar pedidos de compra'),
  ('compras.aprovar',    'compras',    'aprovar',  'Aprovar e receber pedidos de compra'),

  ('clientes.ver',       'clientes',   'ver',      'Ver clientes e histórico'),
  ('clientes.criar',     'clientes',   'criar',    'Cadastrar clientes'),
  ('clientes.editar',    'clientes',   'editar',   'Editar dados de clientes'),
  ('clientes.exportar',  'clientes',   'exportar', 'Exportar base de clientes'),

  ('financeiro.ver',     'financeiro', 'ver',      'Ver contas a pagar, receber e fluxo de caixa'),
  ('financeiro.criar',   'financeiro', 'criar',    'Lançar contas e movimentações'),
  ('financeiro.baixar',  'financeiro', 'aprovar',  'Dar baixa em contas'),

  ('fiscal.ver',         'fiscal',     'ver',      'Ver documentos fiscais e regras'),
  ('fiscal.emitir',      'fiscal',     'emitir',   'Emitir NFe, NFCe e NFSe'),
  ('fiscal.cancelar',    'fiscal',     'cancelar', 'Cancelar documento fiscal'),
  ('fiscal.regras',      'fiscal',     'editar',   'Editar regras tributárias'),

  ('marketing.ver',      'marketing',  'ver',      'Ver campanhas e métricas'),
  ('marketing.gerenciar','marketing',  'editar',   'Criar e editar campanhas'),

  ('relatorios.ver',     'relatorios', 'ver',      'Ver relatórios'),
  ('relatorios.exportar','relatorios', 'exportar', 'Exportar relatórios'),

  ('integracoes.ver',    'integracoes','ver',      'Ver status das integrações'),
  ('integracoes.gerenciar','integracoes','editar', 'Conectar e configurar integrações'),

  ('auditoria.ver',      'auditoria',  'ver',      'Consultar trilha de auditoria');

-- -----------------------------------------------------------------------------
-- role_templates · os 13 perfis do briefing
-- -----------------------------------------------------------------------------
create table public.role_templates (
  chave     text primary key,
  nome      text not null,
  descricao text not null,
  ordem     smallint not null
);

create table public.role_template_permissions (
  role_template_chave text not null references public.role_templates(chave) on delete cascade,
  permission_chave    text not null references public.permissions(chave)    on delete cascade,
  primary key (role_template_chave, permission_chave)
);

insert into public.role_templates (chave, nome, descricao, ordem) values
  ('proprietario',  'Proprietário',  'Acesso total, inclusive faturamento do plano',    1),
  ('administrador', 'Administrador', 'Acesso total à operação, sem faturamento',        2),
  ('gerente',       'Gerente',       'Operação, equipe e relatórios',                   3),
  ('financeiro',    'Financeiro',    'Contas, fluxo de caixa e conciliação',            4),
  ('fiscal',        'Fiscal',        'Documentos fiscais e regras tributárias',         5),
  ('estoquista',    'Estoquista',    'Estoque, compras e recebimento',                  6),
  ('vendedor',      'Vendedor',      'Vendas e clientes',                               7),
  ('caixa',         'Caixa',         'Operação de caixa e recebimento',                 8),
  ('garcom',        'Garçom',        'Comandas, mesas e lançamento de pedidos',         9),
  ('cozinha',       'Cozinha',       'Painel de cozinha e status de preparo',          10),
  ('marketing',     'Marketing',     'Campanhas e métricas',                           11),
  ('contador',      'Contador',      'Fiscal, contábil e relatórios — somente leitura', 12),
  ('somente_leitura','Somente leitura','Visualiza sem alterar nada',                   13);

-- Proprietário e Administrador recebem tudo.
insert into public.role_template_permissions (role_template_chave, permission_chave)
select r.chave, p.chave
from public.role_templates r
cross join public.permissions p
where r.chave in ('proprietario', 'administrador');

-- Somente leitura: todas as permissões de visualização.
insert into public.role_template_permissions (role_template_chave, permission_chave)
select 'somente_leitura', chave from public.permissions where acao = 'ver';

-- Demais perfis: recorte por responsabilidade.
insert into public.role_template_permissions (role_template_chave, permission_chave) values
  ('gerente','empresa.ver'),('gerente','usuarios.ver'),
  ('gerente','catalogo.ver'),('gerente','catalogo.criar'),('gerente','catalogo.editar'),
  ('gerente','estoque.ver'),('gerente','estoque.movimentar'),('gerente','estoque.ajustar'),
  ('gerente','vendas.ver'),('gerente','vendas.criar'),('gerente','vendas.cancelar'),('gerente','vendas.desconto'),
  ('gerente','pedidos.ver'),('gerente','pedidos.gerenciar'),
  ('gerente','compras.ver'),('gerente','compras.criar'),('gerente','compras.aprovar'),
  ('gerente','clientes.ver'),('gerente','clientes.criar'),('gerente','clientes.editar'),
  ('gerente','financeiro.ver'),('gerente','relatorios.ver'),('gerente','relatorios.exportar'),

  ('financeiro','financeiro.ver'),('financeiro','financeiro.criar'),('financeiro','financeiro.baixar'),
  ('financeiro','clientes.ver'),('financeiro','compras.ver'),('financeiro','vendas.ver'),
  ('financeiro','relatorios.ver'),('financeiro','relatorios.exportar'),

  ('fiscal','fiscal.ver'),('fiscal','fiscal.emitir'),('fiscal','fiscal.cancelar'),('fiscal','fiscal.regras'),
  ('fiscal','vendas.ver'),('fiscal','compras.ver'),('fiscal','catalogo.ver'),
  ('fiscal','relatorios.ver'),('fiscal','relatorios.exportar'),

  ('estoquista','estoque.ver'),('estoquista','estoque.movimentar'),('estoquista','estoque.ajustar'),
  ('estoquista','catalogo.ver'),('estoquista','compras.ver'),('estoquista','compras.criar'),
  ('estoquista','relatorios.ver'),

  ('vendedor','vendas.ver'),('vendedor','vendas.criar'),
  ('vendedor','catalogo.ver'),('vendedor','clientes.ver'),('vendedor','clientes.criar'),
  ('vendedor','pedidos.ver'),

  ('caixa','vendas.ver'),('caixa','vendas.criar'),('caixa','catalogo.ver'),
  ('caixa','clientes.ver'),('caixa','pedidos.ver'),('caixa','pedidos.gerenciar'),

  ('garcom','pedidos.ver'),('garcom','pedidos.gerenciar'),
  ('garcom','catalogo.ver'),('garcom','vendas.criar'),

  ('cozinha','pedidos.ver'),('cozinha','pedidos.cozinha'),('cozinha','catalogo.ver'),

  ('marketing','marketing.ver'),('marketing','marketing.gerenciar'),
  ('marketing','clientes.ver'),('marketing','relatorios.ver'),
  ('marketing','integracoes.ver'),

  -- Contador: leitura do que é contábil. Sem marketing, sem usuários, sem integrações.
  ('contador','fiscal.ver'),('contador','financeiro.ver'),('contador','compras.ver'),
  ('contador','vendas.ver'),('contador','estoque.ver'),('contador','empresa.ver'),
  ('contador','relatorios.ver'),('contador','relatorios.exportar');

-- -----------------------------------------------------------------------------
-- roles · cópia por tenant, editável
-- -----------------------------------------------------------------------------
create table public.roles (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  chave         text not null,
  nome          text not null,
  descricao     text,
  -- Papéis de sistema não podem ser excluídos; suas permissões podem ser ajustadas.
  sistema       boolean not null default false,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (tenant_id, chave)
);

create table public.role_permissions (
  role_id          uuid not null references public.roles(id) on delete cascade,
  permission_chave text not null references public.permissions(chave) on delete cascade,
  primary key (role_id, permission_chave)
);

-- -----------------------------------------------------------------------------
-- memberships · vínculo usuário ↔ tenant
-- -----------------------------------------------------------------------------
create table public.memberships (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id)  on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  role_id       uuid not null references public.roles(id)    on delete restrict,
  -- null = acesso a todas as filiais do tenant
  branch_id     uuid references public.branches(id) on delete set null,
  status        app.status_vinculo not null default 'convidado',
  convidado_por uuid references public.profiles(id) on delete set null,
  aceito_em     timestamptz,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index on public.memberships (user_id) where status = 'ativo';
create index on public.memberships (tenant_id, role_id);

comment on table public.memberships is
  'Vínculo do usuário com o tenant. É a única fonte de verdade do isolamento — as policies RLS derivam desta tabela.';

create trigger trg_roles_atualizado       before update on public.roles
  for each row execute function app.fn_atualizado_em();
create trigger trg_memberships_atualizado before update on public.memberships
  for each row execute function app.fn_atualizado_em();
