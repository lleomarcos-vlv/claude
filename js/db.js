/* Persistência local em IndexedDB. Os dados ficam no perfil do navegador (Chrome/Edge) deste computador. */
(function (root) {
  'use strict';
  const NAME = 'jp-sistema', VERSION = 1, STORES = ['clients', 'quotes', 'settings'];
  let dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      if (!root.indexedDB) return reject(new Error('Este navegador não oferece IndexedDB.'));
      const rq = root.indexedDB.open(NAME, VERSION);
      rq.onupgradeneeded = () => {
        const db = rq.result;
        db.createObjectStore('clients', { keyPath: 'id' });
        db.createObjectStore('quotes', { keyPath: 'id' });
        db.createObjectStore('settings', { keyPath: 'key' });
      };
      rq.onsuccess = () => resolve(rq.result);
      rq.onerror = () => reject(rq.error || new Error('Falha ao abrir o banco local.'));
      rq.onblocked = () => reject(new Error('Banco bloqueado por outra aba aberta. Feche as outras abas do sistema.'));
    });
    return dbp;
  }
  const done = (tx) => new Promise((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error || new Error('Transação cancelada.')); });
  const req = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

  async function all(store) { const db = await open(); return req(db.transaction(store).objectStore(store).getAll()); }
  async function get(store, key) { const db = await open(); return req(db.transaction(store).objectStore(store).get(key)); }
  async function put(store, obj) { const db = await open(); const tx = db.transaction(store, 'readwrite'); tx.objectStore(store).put(obj); return done(tx); }
  async function del(store, key) { const db = await open(); const tx = db.transaction(store, 'readwrite'); tx.objectStore(store).delete(key); return done(tx); }

  /** Salva orçamento e (opcionalmente) a configuração na MESMA transação: o contador de números nunca desanda. */
  async function putMany(ops) {
    const db = await open(); const tx = db.transaction(STORES, 'readwrite');
    ops.forEach(([store, obj]) => tx.objectStore(store).put(obj));
    return done(tx);
  }

  /** Substitui TODOS os registros de forma atômica (restauração). Se algo falhar, nada é alterado. */
  async function replaceAll(data) {
    const db = await open(); const tx = db.transaction(STORES, 'readwrite');
    STORES.forEach(s => tx.objectStore(s).clear());
    (data.clients || []).forEach(o => tx.objectStore('clients').put(o));
    (data.quotes || []).forEach(o => tx.objectStore('quotes').put(o));
    (data.settings || []).forEach(o => tx.objectStore('settings').put(o));
    return done(tx);
  }
  async function dump() { return { clients: await all('clients'), quotes: await all('quotes'), settings: await all('settings') }; }

  const uid = () => (root.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

  root.JPDB = { open, all, get, put, del, putMany, replaceAll, dump, uid };
})(window);
