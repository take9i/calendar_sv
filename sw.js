self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('hyperapp-pwa')
    // .then(cache => cache.addAll(['/index.js']))
    .then(cache => cache.addAll(['/build/bundle.js']))
  )
})

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
    .then(response => response
      ? response
      : fetch(event.request)
    )
  )
})
