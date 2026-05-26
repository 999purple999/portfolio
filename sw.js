// W5 PWA service worker — static cache + stale-while-revalidate for data.
const VERSION = 'v4-' + '2026-05-26';
const CACHE = `portfolio-${VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './assets/css/style.css',
  './assets/js/app.js',
  './assets/js/hero.js',
  './assets/js/i18n.js',
  './assets/js/dashboard.js',
  './assets/js/dashboard-data.js',
  './manifest.webmanifest',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('portfolio-') && k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Cross-origin (Three.js da unpkg, Chart.js da jsdelivr, fonts): cache-first + revalidate
  if (url.origin !== location.origin) {
    e.respondWith(
      caches.match(req).then((cached) => {
        const fetched = fetch(req).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone));
          }
          return res;
        }).catch(() => cached);
        return cached || fetched;
      }),
    );
    return;
  }
  // Same-origin: stale-while-revalidate
  e.respondWith(
    caches.open(CACHE).then((c) =>
      c.match(req).then((cached) => {
        const fetched = fetch(req).then((res) => {
          if (res.ok) c.put(req, res.clone());
          return res;
        }).catch(() => cached);
        return cached || fetched;
      }),
    ),
  );
});
