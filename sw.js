const CACHE_NAME = 'curv-static-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/header.html',
  '/footer.html',
  '/styles/animations.css',
  '/styles/modal.css',
  '/js/header-loader.js',
  '/js/modal.js',
  '/images/curv_.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => {
      if (key !== CACHE_NAME) return caches.delete(key);
    }))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Only same-origin
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
        return response;
      }).catch(() => cached);
    })
  );
}); 