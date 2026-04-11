const CACHE_NAME = 'scanner-v12';
const URLS_TO_CACHE = [
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
];

// Установка — кэшируем только внешние JS-библиотеки (не index.html)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

// Активация — удаляем старые кэши
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

  // index.html — всегда с сети (обновления подтягиваются сразу)
  if (url.endsWith('/') || url.endsWith('/index.html')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // CSV из Google Sheets — сеть, если нет — кэш
  if (url.includes('docs.google.com') && url.includes('output=csv')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Всё остальное — кэш, если нет — сеть
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});
