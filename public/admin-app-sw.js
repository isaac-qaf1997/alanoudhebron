const VERSION = 'alanoud-admin-app-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((key) => key.startsWith('alanoud-admin-') && key !== VERSION).map((key) => caches.delete(key)))
    await self.clients.claim()
  })())
})

// Private dashboard pages and API responses are deliberately network-only.
// Never cache orders, customer details, inventory, sessions, or other private data.
self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return
  event.respondWith(fetch(request))
})
