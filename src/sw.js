/**
 * Service worker — El ECG del Clínico
 * Estrategia:
 *   - Static (CSS/JS/iconos): cache-first
 *   - HTML: stale-while-revalidate (sirve cache, refresca en bg)
 *   - Imágenes hot-link de drsmithsecgblog.com: cache-first con TTL largo
 */
const VERSION = "v2.1.0";
const STATIC_CACHE = `static-${VERSION}`;
const HTML_CACHE = `html-${VERSION}`;
const IMG_CACHE = "ecg-images-v1";

const CORE = [
  "/",
  "/css/style.css",
  "/js/main.bundle.js",
  "/js/search-index.js",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(CORE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![STATIC_CACHE, HTML_CACHE, IMG_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Imágenes del blog original — cache-first con red de respaldo
  if (
    url.hostname === "drsmithsecgblog.com" &&
    /\.(png|jpe?g|gif|webp)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.open(IMG_CACHE).then((cache) =>
        cache.match(req).then((cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          }).catch(() => cached)
        )
      )
    );
    return;
  }

  // Solo manejamos same-origin a partir de aquí
  if (url.origin !== self.location.origin) return;

  // HTML — stale-while-revalidate
  if (req.mode === "navigate" || req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      caches.open(HTML_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          const fetchPromise = fetch(req)
            .then((res) => {
              if (res.ok) cache.put(req, res.clone());
              return res;
            })
            .catch(() => cached || cache.match("/"));
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // Estáticos — cache-first
  event.respondWith(
    caches.match(req).then((cached) =>
      cached ||
      fetch(req).then((res) => {
        if (res.ok && url.origin === self.location.origin) {
          caches.open(STATIC_CACHE).then((cache) => cache.put(req, res.clone()));
        }
        return res;
      })
    )
  );
});
