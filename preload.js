'use strict';

/**
 * Preload do Electron. Mantém contextIsolation ativo e expõe apenas
 * informações inócuas ao renderer (nenhum acesso direto ao sistema/arquivos).
 */

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('estacao', {
  ambiente: 'electron',
  versoes: {
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome,
  },
});
