const CACHE_NAME = 'scanner-v17';
const URLS_TO_CACHE = [
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // index.html и CSV из Google Sheets — всегда напрямую с сети, без SW-кэша
  if (url.endsWith('/') || url.endsWith('/index.html') || url.includes('docs.google.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Всё остальное (js-библиотеки) — кэш, если нет — сеть
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});
