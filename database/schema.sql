-- ============================================================================
--  Estação de Trabalho — Esquema do banco de dados (SQLite)
--  Criado automaticamente na primeira execução. Idempotente (IF NOT EXISTS).
-- ============================================================================

PRAGMA journal_mode = WAL;      -- melhor concorrência de leitura/escrita
PRAGMA foreign_keys = ON;       -- integridade referencial
PRAGMA synchronous = NORMAL;    -- bom equilíbrio durabilidade/desempenho

-- ---------------------------------------------------------------------------
--  Usuários e sessões
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  login         TEXT NOT NULL UNIQUE,
  senha_hash    TEXT NOT NULL,
  salt          TEXT NOT NULL,
  nome          TEXT,
  ativo         INTEGER NOT NULL DEFAULT 1,
  criado_em     TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  ultimo_login  TEXT
);

CREATE TABLE IF NOT EXISTS sessoes (
  id            TEXT PRIMARY KEY,             -- token aleatório
  usuario_id    INTEGER NOT NULL,
  criado_em     TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  expira_em     TEXT NOT NULL,
  user_agent    TEXT,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON sessoes(usuario_id);

-- ---------------------------------------------------------------------------
--  Clientes Fixos (clientes conquistados)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  nome           TEXT NOT NULL,
  telefone       TEXT,
  whatsapp       TEXT,
  cidade         TEXT,
  instagram      TEXT,
  site           TEXT,
  email          TEXT,
  observacoes    TEXT,
  data_cadastro  TEXT NOT NULL DEFAULT (date('now','localtime')),
  ultimo_contato TEXT,
  hash_dedupe    TEXT,
  criado_em      TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  atualizado_em  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_clientes_nome   ON clientes(nome);
CREATE INDEX IF NOT EXISTS idx_clientes_cidade ON clientes(cidade);
CREATE INDEX IF NOT EXISTS idx_clientes_hash   ON clientes(hash_dedupe);

CREATE TRIGGER IF NOT EXISTS trg_clientes_atualizado
AFTER UPDATE ON clientes
FOR EACH ROW BEGIN
  UPDATE clientes SET atualizado_em = datetime('now','localtime') WHERE id = OLD.id;
END;

-- ---------------------------------------------------------------------------
--  Prospecção (empresas em negociação)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prospeccao (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa        TEXT NOT NULL,
  cidade         TEXT,
  estado         TEXT,
  nicho          TEXT,
  telefone       TEXT,
  whatsapp       TEXT,
  instagram      TEXT,
  site           TEXT,
  email          TEXT,
  responsavel    TEXT,
  status         TEXT NOT NULL DEFAULT 'Novo',
  origem         TEXT,
  data           TEXT NOT NULL DEFAULT (date('now','localtime')),
  ultimo_contato TEXT,
  probabilidade  INTEGER NOT NULL DEFAULT 0,   -- 0..100
  observacoes    TEXT,
  hash_dedupe    TEXT,
  criado_em      TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  atualizado_em  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_prospeccao_empresa ON prospeccao(empresa);
CREATE INDEX IF NOT EXISTS idx_prospeccao_cidade  ON prospeccao(cidade);
CREATE INDEX IF NOT EXISTS idx_prospeccao_estado  ON prospeccao(estado);
CREATE INDEX IF NOT EXISTS idx_prospeccao_nicho   ON prospeccao(nicho);
CREATE INDEX IF NOT EXISTS idx_prospeccao_status  ON prospeccao(status);
CREATE INDEX IF NOT EXISTS idx_prospeccao_hash    ON prospeccao(hash_dedupe);

CREATE TRIGGER IF NOT EXISTS trg_prospeccao_atualizado
AFTER UPDATE ON prospeccao
FOR EACH ROW BEGIN
  UPDATE prospeccao SET atualizado_em = datetime('now','localtime') WHERE id = OLD.id;
END;

-- ---------------------------------------------------------------------------
--  Pesquisas automáticas + resultados (Revisão)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pesquisas (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  cidade          TEXT,
  estado          TEXT,
  nicho           TEXT,
  max_qtd         INTEGER,
  total_encontrado INTEGER NOT NULL DEFAULT 0,
  total_novo      INTEGER NOT NULL DEFAULT 0,
  fonte           TEXT,
  status          TEXT NOT NULL DEFAULT 'concluida',
  mensagem        TEXT,
  criado_em       TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_pesquisas_criado ON pesquisas(criado_em);

CREATE TABLE IF NOT EXISTS pesquisa_resultados (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  pesquisa_id    INTEGER NOT NULL,
  nome           TEXT NOT NULL,
  telefone       TEXT,
  whatsapp       TEXT,
  instagram      TEXT,
  site           TEXT,
  email          TEXT,
  cidade         TEXT,
  estado         TEXT,
  endereco       TEXT,
  latitude       REAL,
  longitude      REAL,
  categoria      TEXT,
  horario        TEXT,
  avaliacao      REAL,
  qtd_avaliacoes INTEGER,
  origem         TEXT,
  url_origem     TEXT,
  data_coleta    TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  status         TEXT NOT NULL DEFAULT 'novo',   -- novo | movido | descartado
  hash_dedupe    TEXT,
  FOREIGN KEY (pesquisa_id) REFERENCES pesquisas(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_resultados_pesquisa ON pesquisa_resultados(pesquisa_id);
CREATE INDEX IF NOT EXISTS idx_resultados_status   ON pesquisa_resultados(status);
CREATE INDEX IF NOT EXISTS idx_resultados_hash     ON pesquisa_resultados(hash_dedupe);

-- ---------------------------------------------------------------------------
--  Nichos (base pesquisável)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nichos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nome       TEXT NOT NULL UNIQUE,
  categoria  TEXT,
  termos     TEXT,      -- JSON array de palavras-chave
  osm        TEXT       -- JSON array de filtros OSM
);
CREATE INDEX IF NOT EXISTS idx_nichos_categoria ON nichos(categoria);

-- ---------------------------------------------------------------------------
--  Histórico (auditoria de todas as operações)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historico (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo       TEXT NOT NULL,     -- login, pesquisa, importacao, exclusao, alteracao, movimentacao, erro...
  descricao  TEXT,
  detalhes   TEXT,              -- JSON
  usuario_id INTEGER,
  criado_em  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_historico_tipo   ON historico(tipo);
CREATE INDEX IF NOT EXISTS idx_historico_criado ON historico(criado_em);

-- ---------------------------------------------------------------------------
--  Controle de tentativas de login (rate limiting)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tentativas_login (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  login     TEXT,
  sucesso   INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_tentativas_login ON tentativas_login(login, criado_em);
