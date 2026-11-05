/* ORION Systemtest – Service Worker
   Legt beim ersten Start eine Kopie der App auf dem Gerät ab,
   damit sie danach ohne Internet startet. Bei Änderungen an den
   Dateien die Versionsnummer in CACHE erhöhen. */
const CACHE = 'orion-test-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    // Seitenaufruf: immer die gespeicherte App liefern, sonst Netz
    event.respondWith(
      caches.match('./index.html', { ignoreSearch: true })
        .then((hit) => hit || fetch(req))
        .catch(() => caches.match('./', { ignoreSearch: true }))
    );
    return;
  }

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req))
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'status') {
    caches.open(CACHE).then((c) => c.keys()).then((keys) => {
      event.source && event.source.postMessage({ type: 'cache', name: CACHE, count: keys.length });
    });
  }
});
