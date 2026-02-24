const CACHE_NAME = 'auto-battle-game-v1';
const urlsToCache = [
  './',
  './Start.html',
  './scene/Training.html',
  './scene/Battle.html',
  './scene/System.html',
  './datas/game.js',
  './datas/gameData.js',
  './datas/skillDatas/fire.json',
  './datas/skillDatas/slash.json',
  './datas/monsterDatas/slime.json',
  './scene/css/common.css',
  './scene/css/Training.css',
  './scene/css/Battle.css',
  './scene/css/System.css',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
