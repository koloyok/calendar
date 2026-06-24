const CACHE = 'calendar';
const FILES = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        caches.open(CACHE).then(cache => cache.put(e.request, res.clone()));
        // If index.html updated, notify the client to reload
        if (e.request.url.includes('index.html') && cached) {
          cached.text().then(oldText => {
            res.clone().text().then(newText => {
              if (oldText !== newText) {
                self.clients.matchAll().then(clients =>
                  clients.forEach(client => client.postMessage('reload'))
                );
              }
            });
          });
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
