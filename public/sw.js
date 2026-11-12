// Safe pass-through Service Worker for 10A5 PWA
// Clears any stale Workbox caches that could block mobile loading and never hijacks network requests.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', () => {
  // Network pass-through only: never intercept or block requests on mobile
  return;
});
