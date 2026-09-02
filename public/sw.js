// This service worker is DEPRECATED and has been disabled.
// It caused 'TypeError: Failed to fetch' errors on API routes.
// On activate, it unregisters itself and cleans up all caches.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Delete all caches
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    ).then(() => {
      // Unregister this service worker
      self.registration.unregister();
    })
  );
  self.clients.claim();
});

// Don't intercept any fetches — let everything pass through normally
// (no fetch event listener needed)
