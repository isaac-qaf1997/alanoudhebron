const CACHE_NAME = 'alanoud-staff-shell-v1'
const OFFLINE_PAGE = '/staff-offline.html'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_PAGE)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('alanoud-staff-') && key !== CACHE_NAME).map((key) => caches.delete(key)))),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return
  if (request.mode === 'navigate' && url.pathname.startsWith('/staff')) {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_PAGE)))
  }
})
