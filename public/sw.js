/* Service worker da Padaria Villa Reis.
   Estrategia:
   - HTML: rede primeiro (conteudo sempre atual), cache como rede de seguranca offline.
   - Imagens e estaticos: cache primeiro (carregamento instantaneo em conexao ruim).
   Nunca guarda /admin nem /api. */

const VERSION = "villa-reis-v1";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const OFFLINE_URL = "/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE).then((cache) => cache.addAll([OFFLINE_URL])).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/admin")) return;
  if (url.pathname.startsWith("/api/") && !url.pathname.startsWith("/api/media")) return;

  const isMedia = url.pathname.startsWith("/api/media") || /\.(png|jpg|jpeg|webp|avif|svg|woff2?)$/.test(url.pathname);

  if (isMedia || url.pathname.startsWith("/_next/static")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          const cache = await caches.open(PAGE_CACHE);
          cache.put(request, response.clone());
          return response;
        } catch {
          const cache = await caches.open(PAGE_CACHE);
          return (await cache.match(request)) || (await cache.match(OFFLINE_URL)) || Response.error();
        }
      })(),
    );
  }
});
