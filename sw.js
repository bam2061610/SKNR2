const CACHE_NAME = 'scanner-v10';
const URLS_TO_CACHE = [
  './',
  './index.html',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
];

// Установка — кэшируем файлы
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

// Запросы — сначала сеть, потом кэш
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // CSV из Google Sheets — сеть, а если нет — кэш
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

  // Всё остальное — кэш, а если нет — сеть
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});
