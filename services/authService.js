'use strict';

/**
 * Serviço de autenticação.
 *
 * - Senhas armazenadas com scrypt (crypto nativo do Node) + salt aleatório.
 * - Sessões persistidas em banco (login sobrevive a reinícios do app).
 * - Rate limiting de tentativas de login por usuário.
 *
 * Não usa dependências externas para hashing/sessão (mais portátil e seguro).
 */

const crypto = require('crypto');
const db = require('../database/db');
const config = require('../config/config');
const logger = require('../utils/logger');
const historico = require('./historyService');

const KEYLEN = config.seguranca.scryptKeylen;
const COST = config.seguranca.scryptCost;

// --- Hash de senha ---------------------------------------------------------
function gerarSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function hashSenha(senha, salt) {
  return crypto.scryptSync(String(senha), salt, KEYLEN, { N: COST }).toString('hex');
}

/** Comparação em tempo constante. */
function comparar(hashA, hashB) {
  const a = Buffer.from(hashA, 'hex');
  const b = Buffer.from(hashB, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// --- Usuários --------------------------------------------------------------
function criarUsuario({ login, senha, nome }) {
  const salt = gerarSalt();
  const senha_hash = hashSenha(senha, salt);
  const info = db
    .get()
    .prepare(
      `INSERT INTO usuarios (login, senha_hash, salt, nome) VALUES (?, ?, ?, ?)`
    )
    .run(String(login).trim().toLowerCase(), senha_hash, salt, nome || login);
  return info.lastInsertRowid;
}

function buscarPorLogin(login) {
  return db
    .get()
    .prepare('SELECT * FROM usuarios WHERE login = ? AND ativo = 1')
    .get(String(login || '').trim().toLowerCase());
}

function contarUsuarios() {
  return db.get().prepare('SELECT COUNT(*) AS n FROM usuarios').get().n;
}

/** Cria o usuário administrador padrão caso não exista nenhum usuário. */
function garantirAdminPadrao() {
  if (contarUsuarios() > 0) return false;
  criarUsuario({
    login: config.admin.loginPadrao,
    senha: config.admin.senhaPadrao,
    nome: 'Administrador',
  });
  logger.info(
    `[auth] Usuário administrador padrão criado: "${config.admin.loginPadrao}" / senha "${config.admin.senhaPadrao}" — altere após o primeiro acesso.`
  );
  return true;
}

// --- Rate limiting ---------------------------------------------------------
function tentativasRecentes(login) {
  const janelaMin = config.seguranca.janelaTentativasMin;
  return db
    .get()
    .prepare(
      `SELECT COUNT(*) AS n FROM tentativas_login
        WHERE login = ? AND sucesso = 0
          AND criado_em >= datetime('now','localtime', ?)`
    )
    .get(String(login || '').toLowerCase(), `-${janelaMin} minutes`).n;
}

function registrarTentativa(login, sucesso) {
  db.get()
    .prepare('INSERT INTO tentativas_login (login, sucesso) VALUES (?, ?)')
    .run(String(login || '').toLowerCase(), sucesso ? 1 : 0);
}

// --- Login / Sessão --------------------------------------------------------
/**
 * Autentica usuário/senha. Retorna { ok, usuario? , erro? }.
 */
function autenticar(login, senha, userAgent) {
  login = String(login || '').trim().toLowerCase();

  if (tentativasRecentes(login) >= config.seguranca.maxTentativasLogin) {
    return {
      ok: false,
      erro: 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.',
    };
  }

  const usuario = buscarPorLogin(login);
  if (!usuario) {
    registrarTentativa(login, false);
    return { ok: false, erro: 'Usuário ou senha inválidos.' };
  }

  const hash = hashSenha(senha, usuario.salt);
  if (!comparar(hash, usuario.senha_hash)) {
    registrarTentativa(login, false);
    historico.registrar('login', `Falha de login: ${login}`, null, usuario.id);
    return { ok: false, erro: 'Usuário ou senha inválidos.' };
  }

  registrarTentativa(login, true);
  db.get()
    .prepare(`UPDATE usuarios SET ultimo_login = datetime('now','localtime') WHERE id = ?`)
    .run(usuario.id);

  const sessao = criarSessao(usuario.id, userAgent);
  historico.registrar('login', `Login realizado: ${login}`, null, usuario.id);

  return {
    ok: true,
    usuario: { id: usuario.id, login: usuario.login, nome: usuario.nome },
    token: sessao.id,
    expira_em: sessao.expira_em,
  };
}

function criarSessao(usuarioId, userAgent) {
  const id = crypto.randomBytes(32).toString('hex');
  const dias = config.session.duracaoDias;
  const expira = new Date(Date.now() + dias * 86400000).toISOString();
  db.get()
    .prepare(
      `INSERT INTO sessoes (id, usuario_id, expira_em, user_agent) VALUES (?, ?, ?, ?)`
    )
    .run(id, usuarioId, expira, userAgent || '');
  return { id, expira_em: expira };
}

/** Retorna o usuário de uma sessão válida ou null. */
function usuarioDaSessao(token) {
  if (!token) return null;
  const row = db
    .get()
    .prepare(
      `SELECT u.id, u.login, u.nome, s.expira_em
         FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id
        WHERE s.id = ? AND u.ativo = 1`
    )
    .get(token);
  if (!row) return null;
  if (new Date(row.expira_em).getTime() < Date.now()) {
    encerrarSessao(token);
    return null;
  }
  return { id: row.id, login: row.login, nome: row.nome };
}

function encerrarSessao(token) {
  if (!token) return;
  db.get().prepare('DELETE FROM sessoes WHERE id = ?').run(token);
}

/** Remove sessões expiradas (manutenção). */
function limparSessoesExpiradas() {
  db.get()
    .prepare(`DELETE FROM sessoes WHERE expira_em < datetime('now')`)
    .run();
}

/** Troca a senha de um usuário autenticado. */
function trocarSenha(usuarioId, senhaAtual, senhaNova) {
  const usuario = db.get().prepare('SELECT * FROM usuarios WHERE id = ?').get(usuarioId);
  if (!usuario) return { ok: false, erro: 'Usuário não encontrado.' };
  const hashAtual = hashSenha(senhaAtual, usuario.salt);
  if (!comparar(hashAtual, usuario.senha_hash)) {
    return { ok: false, erro: 'Senha atual incorreta.' };
  }
  if (String(senhaNova || '').length < 4) {
    return { ok: false, erro: 'A nova senha deve ter ao menos 4 caracteres.' };
  }
  const salt = gerarSalt();
  const senha_hash = hashSenha(senhaNova, salt);
  db.get()
    .prepare('UPDATE usuarios SET senha_hash = ?, salt = ? WHERE id = ?')
    .run(senha_hash, salt, usuarioId);
  historico.registrar('alteracao', 'Senha alterada', null, usuarioId);
  return { ok: true };
}

module.exports = {
  criarUsuario,
  garantirAdminPadrao,
  autenticar,
  usuarioDaSessao,
  encerrarSessao,
  limparSessoesExpiradas,
  trocarSenha,
  buscarPorLogin,
  contarUsuarios,
};
