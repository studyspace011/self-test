const CACHE_NAME = 'mcq-test-v4'; // Version changed to v4 to ensure the browser installs the new Service Worker
const urlsToCache = [
    'index.html',
    'style.css',
    'script.js',
    'manifest.json'
    // Removed 'analytics.html' and 'analytics.js' and Chart.js CDN link
];

self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing and caching essential files...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching complete.');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Service Worker: Caching failed!', error);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return the cached response if found
                if (response) {
                    return response;
                }
                // If not found in cache, fetch from the network
                return fetch(event.request);
            }
        )
    );
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating and clearing old cache versions.');
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Delete old caches not in the whitelist
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log(`Service Worker: Deleting old cache: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
