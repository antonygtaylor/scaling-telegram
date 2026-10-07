const CACHE_NAME = 'rust-and-iron-wars-v1.0.0';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './CHANGELOG.md',
  './src/styles/main.css',
  './src/index.js',
  './src/game/ai.js',
  './src/game/campaign.js',
  './src/game/parallax.js',
  './src/game/physics.js',
  './src/game/scoring.js',
  './src/game/tank.js',
  './src/game/terrain.js',
  './src/utils/particles.js',
  './src/utils/prng.js',
  './src/utils/sound.js',
  './public/icons/icon-192.svg',
  './public/icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  // Always fetch CHANGELOG.md network-first so version updates can be detected instantly
  if (event.request.url.includes('CHANGELOG.md')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clonedRes = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clonedRes));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        return caches.match('./index.html');
      });
    })
  );
});
