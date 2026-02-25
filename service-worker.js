const CACHE_NAME = 'auto-battle-game-v2';
const urlsToCache = [
  './',
  './index.html',
  './datas/SpriteAnimator.js',
  './datas/game.js',
  './datas/gameData.js',
  './datas/battle-system.js',
  './datas/Router.js',
  './datas/pages/StartPage.js',
  './datas/pages/TrainingPage.js',
  './datas/pages/BattlePage.js',
  './datas/pages/SystemPage.js',
  './datas/skillDatas/index.json',
  './datas/skillDatas/fire.json',
  './datas/skillDatas/slash.json',
  './datas/monsterDatas/index.json',
  './datas/monsterDatas/slime.json',
  './datas/foodIndex.json',
  './datas/element.json',
  './datas/rooms/index.json',
  './datas/map/index.json',
  './datas/css/common.css',
  './datas/css/Start.css',
  './datas/css/Training.css',
  './datas/css/Battle.css',
  './datas/css/System.css',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
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
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        });
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
