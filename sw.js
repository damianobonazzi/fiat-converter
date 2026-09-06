const CACHE_NAME = 'fiat-converter-cache-v2';

// Percorsi relativi (fondamentali per GitHub Pages)
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './script.js',
  './manifest.json'
  // Aggiungi qui eventuali altri asset come ./style.css o ./icon.png se presenti
];

self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  // Ignora le richieste non-GET (es. POST/PUT) o gli schemi non-http(s) (es. chrome-extension://)
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Se la rete risponde correttamente, aggiorna la cache in background
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        // In caso di assenza di connessione, recupera il file dalla cache
        return caches.match(event.request);
      })
  );
});
