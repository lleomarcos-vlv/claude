/**
 * Service worker do Grafista (item 41): PWA instalável com shell offline.
 * Estratégia: network-first para navegação e assets (app sempre atual),
 * caindo para o cache quando a rede falhar. Chamadas ao Supabase nunca são
 * cacheadas — dado de negócio offline é papel da fila do PDV, não do SW.
 */
const CACHE = 'grafista-shell-v1'
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icone-192.svg', '/icone-512.svg']

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (evento) => {
  const url = new URL(evento.request.url)
  // Só o próprio host; API do Supabase passa direto (sem cache de dados).
  if (url.origin !== self.location.origin || evento.request.method !== 'GET') return

  evento.respondWith(
    fetch(evento.request)
      .then((resposta) => {
        const copia = resposta.clone()
        caches.open(CACHE).then((cache) => cache.put(evento.request, copia)).catch(() => {})
        return resposta
      })
      .catch(async () => {
        const cache = await caches.open(CACHE)
        const guardada = await cache.match(evento.request)
        if (guardada) return guardada
        // Navegação sem cache específico: devolve o shell.
        if (evento.request.mode === 'navigate') {
          const shell = await cache.match('/index.html')
          if (shell) return shell
        }
        return Response.error()
      }),
  )
})
