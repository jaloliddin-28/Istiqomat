/* Istiqomat — offline cache. Bump VERSION whenever you change any file, so phones pick up the update. */
var VERSION = 'istiqomat-v1.0.0';
var FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/util.js', 'js/dates.js', 'js/content.js', 'js/store.js', 'js/model.js', 'js/fx.js', 'js/charts.js', 'js/ui.js',
  'js/actions.js', 'js/timer.js', 'js/stories.js', 'js/sync.js', 'js/onboarding.js',
  'js/views/today.js', 'js/views/korean.js', 'js/views/tasks.js', 'js/views/stats.js', 'js/views/me.js', 'js/app.js',
  'data/quotes.js', 'data/korean.js',
  'fonts/unbounded-600.woff2', 'fonts/unbounded-800.woff2', 'fonts/onest-400.woff2', 'fonts/onest-600.woff2', 'fonts/onest-700.woff2',
  'fonts/onest-ext-400.woff2', 'fonts/onest-ext-600.woff2', 'fonts/onest-ext-700.woff2', 'fonts/amiri-quran-arabic.woff2',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; /* GitHub sync and links go straight to the network */
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) {
    var net = fetch(req).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () { return hit || caches.match('index.html'); });
    return hit || net;
  }));
});
