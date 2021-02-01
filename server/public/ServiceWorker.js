/* add to cache */
let elementsToCache = ['/offline', '/assets/styles/offlineStyles.css', '/assets/selectCharacters/background/background.png', 
                        '/icons/icon-16.png', '/icons/icon-32.png', '/icons/icon-48.png']

let cacheVersion = 3

/* Store cachenames */
let cacheNames = {
    prefetch: `spunchers.io-${cacheVersion}`
}
/* When installing */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(cacheNames.prefetch)
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
                return response || fetch(event.request)
            })
            .catch(() => {
                return caches.match('offline')
            })
    )
})

/* When activating a cache make sure that older versions are deleted */
self.addEventListener('activate', (event) => {
    // Delete all caches that aren't named in CURRENT_CACHES.
    // While there is only one cache in this example, the same logic will handle the case where
    // there are multiple versioned caches.
    let expectedCacheNames = Object.keys(cacheNames).map((key) => cacheNames[key])
  
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (expectedCacheNames.indexOf(cacheName) === -1) {
              // If this cache name isn't present in the array of "expected" cache names, then delete it.
              console.log('Deleting out of date cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        );
      })
    );
  });