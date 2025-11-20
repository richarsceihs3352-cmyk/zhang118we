const CACHE_NAME = 'police-vehicle-mgr-v4';
const RUNTIME = 'runtime';

// Resources to cache immediately for offline capability
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn-icons-png.flaticon.com/512/2382/2382533.png'
];

// Install: Cache core files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME, RUNTIME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network first, falling back to cache
// For static assets (JS, CSS, Images), we use Cache First implicitly via match()
self.addEventListener('fetch', event => {
  // Identify external critical resources
  const isExternalLib = 
      event.request.url.includes('aistudiocdn.com') || 
      event.request.url.includes('cdn.tailwindcss.com') ||
      event.request.url.includes('lucide-react') ||
      event.request.url.includes('cdn.sheetjs.com') ||
      event.request.url.includes('cdn-icons-png.flaticon.com');

  // Only handle requests to our own origin or our specific CDNs
  if (event.request.url.startsWith(self.location.origin) || isExternalLib) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        // 1. Return cached response if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // 2. If not in cache, fetch from network
        return caches.open(RUNTIME).then(cache => {
          return fetch(event.request).then(response => {
            // Valid response?
            if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
                return response;
            }
            // Update cache with new response
            cache.put(event.request, response.clone());
            return response;
          }).catch(() => {
             // 3. If network fails (Offline) and not in cache
             // We could return a custom offline.html here if we had one
             console.log('Offline and resource not found:', event.request.url);
             
             // Optional: Return a placeholder image for missing images
             // if (event.request.url.match(/\.(jpg|jpeg|png|gif)$/)) { ... }
          });
        });
      })
    );
  }
});