/* add to cache */
let elementsToCache = ['/offline']
let cacheName = 'tilegame'

/* When installing */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(cacheName)
            .then((cache) => {
                return cache.addAll(elementsToCache)
            })
    )     
})

/* When fecthing cache */
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
            .catch(() => {
                return caches.match('offline');
            })
    )
})