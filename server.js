'use strict';

/**
 * Servidor Express da Estação de Trabalho.
 *
 * Responsável por: inicializar o banco, semear dados, servir a interface
 * (public/) e expor a API em /api. É iniciado tanto pelo Electron (main.js)
 * quanto diretamente via `npm run web` (modo navegador).
 */

const path = require('path');
const express = require('express');

const config = require('./config/config');
const logger = require('./utils/logger');
const db = require('./database/db');
const { semear } = require('./database/seed');
const authService = require('./services/authService');
const backupService = require('./services/backupService');
const { carregarSessao } = require('./middleware/auth');
const { naoEncontrado, tratarErro } = require('./middleware/errorHandler');

function criarApp() {
  // 1) Banco + seeds + admin padrão.
  db.inicializar();
  semear();
  authService.limparSessoesExpiradas();

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Cabeçalhos de segurança básicos.
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });

  // Sessão em todas as requisições.
  app.use(carregarSessao);

  // API.
  app.use('/api', require('./routes'));

  // Páginas.
  app.get('/', (req, res) => {
    if (req.usuario) return res.redirect('/app');
    res.sendFile(path.join(config.paths.public, 'login.html'));
  });
  app.get('/app', (req, res) => {
    if (!req.usuario) return res.redirect('/');
    res.sendFile(path.join(config.paths.public, 'index.html'));
  });

  // Arquivos estáticos (css/js/assets).
  app.use(express.static(config.paths.public));

  // Erros.
  app.use(naoEncontrado);
  app.use(tratarErro);

  return app;
}

function iniciar() {
  const app = criarApp();
  const { host, port } = config.server;
  const server = app.listen(port, host, () => {
    logger.info(`[server] Estação de Trabalho ouvindo em http://${host}:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.erro(`[server] A porta ${port} já está em uso. Feche a outra instância ou ajuste config/local.json.`);
      process.exit(1);
    }
    logger.erro('[server] Erro:', err.message);
  });

  // Tarefas de manutenção.
  backupService.agendarAutomatico();
  const limpeza = setInterval(() => authService.limparSessoesExpiradas(), 3600000);
  if (limpeza.unref) limpeza.unref();

  const encerrar = () => {
    logger.info('[server] Encerrando...');
    server.close(() => db.fechar());
    setTimeout(() => process.exit(0), 500);
  };
  process.on('SIGINT', encerrar);
  process.on('SIGTERM', encerrar);

  return server;
}

if (require.main === module) {
  iniciar();
}

module.exports = { criarApp, iniciar };
