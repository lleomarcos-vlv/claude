'use strict';

/**
 * Processo principal do Electron.
 *
 * Estratégia: o servidor Express (com o SQLite) roda em um processo Node
 * separado (`node server.js`). O Electron apenas exibe a interface apontando
 * para http://127.0.0.1:PORT. Isso mantém a lógica de dados isolada e torna a
 * instalação "dois cliques" muito mais confiável.
 *
 * O banco usa sql.js (SQLite em WebAssembly, 100% JavaScript), então roda
 * igualmente no Node e dentro do Electron, sem compilação nativa. Por isso o
 * fallback abaixo — iniciar o servidor dentro do próprio Electron quando o
 * Node não estiver acessível como processo separado — também funciona.
 */

const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const config = require('./config/config');
const HOST = config.server.host;
const PORT = config.server.port;
const URL_BASE = `http://${HOST}:${PORT}`;

let janela = null;
let servidorProc = null;
let servidorEmbutido = null;

/** Verifica se o servidor já responde. */
function servidorNoAr() {
  return new Promise((resolve) => {
    const req = http.get(`${URL_BASE}/api/info`, (res) => {
      res.resume();
      resolve(res.statusCode > 0);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function esperar(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Aguarda o servidor subir (com timeout). */
async function aguardarServidor(timeoutMs = 30000) {
  const inicio = Date.now();
  while (Date.now() - inicio < timeoutMs) {
    if (await servidorNoAr()) return true;
    await esperar(500);
  }
  return false;
}

/** Inicia o servidor como processo Node separado. */
function iniciarServidorProcesso() {
  const serverPath = path.join(__dirname, 'server.js');
  const cmd = process.platform === 'win32' ? 'node.exe' : 'node';
  try {
    servidorProc = spawn(cmd, [serverPath], {
      cwd: __dirname,
      env: { ...process.env, PORT: String(PORT), HOST },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    });
    servidorProc.stdout.on('data', (d) => process.stdout.write(`[server] ${d}`));
    servidorProc.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));
    servidorProc.on('error', (err) => {
      console.error('[main] Falha ao iniciar node server.js:', err.message);
    });
    return true;
  } catch (err) {
    console.error('[main] spawn falhou:', err.message);
    return false;
  }
}

/** Fallback: inicia o servidor dentro do próprio Electron. */
function iniciarServidorEmbutido() {
  try {
    servidorEmbutido = require('./server').iniciar();
    // iniciar() é assíncrono; evita "unhandled rejection" se falhar.
    if (servidorEmbutido && typeof servidorEmbutido.catch === 'function') {
      servidorEmbutido.catch((err) =>
        console.error('[main] Servidor embutido falhou:', err.message)
      );
    }
    return true;
  } catch (err) {
    console.error('[main] Servidor embutido falhou:', err.message);
    return false;
  }
}

function criarJanela() {
  janela = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#0f1226',
    title: config.app.nome,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  janela.once('ready-to-show', () => janela.show());
  janela.loadURL(URL_BASE);

  // Links externos abrem no navegador padrão (ex.: WhatsApp Web, sites).
  janela.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });

  janela.on('closed', () => (janela = null));
}

function montarMenu() {
  const template = [
    {
      label: 'Arquivo',
      submenu: [
        { label: 'Recarregar', accelerator: 'CmdOrCtrl+R', click: () => janela && janela.reload() },
        { type: 'separator' },
        { label: 'Sair', role: 'quit' },
      ],
    },
    {
      label: 'Exibir',
      submenu: [
        { label: 'Tela cheia', role: 'togglefullscreen' },
        { label: 'Zoom +', role: 'zoomIn' },
        { label: 'Zoom -', role: 'zoomOut' },
        { label: 'Zoom padrão', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Ferramentas de desenvolvedor', accelerator: 'F12', click: () => janela && janela.webContents.toggleDevTools() },
      ],
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Sobre',
          click: () =>
            dialog.showMessageBox(janela, {
              type: 'info',
              title: 'Sobre',
              message: config.app.nome,
              detail: `${config.app.descricao}\nVersão ${require('./package.json').version}`,
            }),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function inicializar() {
  // Se já houver servidor no ar (ex.: iniciado pelo .bat), apenas conecta.
  if (!(await servidorNoAr())) {
    if (!iniciarServidorProcesso()) {
      iniciarServidorEmbutido();
    }
  }

  const ok = await aguardarServidor();
  if (!ok) {
    // Última tentativa: servidor embutido.
    if (!servidorEmbutido) iniciarServidorEmbutido();
    if (!(await aguardarServidor(10000))) {
      dialog.showErrorBox(
        'Erro ao iniciar',
        'Não foi possível iniciar o servidor local. Verifique se o Node.js está instalado e execute "instalar.bat" novamente.'
      );
      app.quit();
      return;
    }
  }

  montarMenu();
  criarJanela();
}

app.whenReady().then(inicializar);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) criarJanela();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (servidorProc) {
    try {
      servidorProc.kill();
    } catch (_) {
      /* noop */
    }
  }
});
