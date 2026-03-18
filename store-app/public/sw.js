// Service Worker — 店舗管理アプリ
const CACHE = 'store-app-v1';
const STATIC = ['/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC).catch(() => {}))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  // API・外部リクエストはキャッシュしない
  if (request.method !== 'GET') return;
  if (request.url.includes('/api/')) return;
  if (!request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(request)
      .then((res) => {
        // 成功したレスポンスをキャッシュに保存
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(request, clone));
        return res;
      })
      .catch(() => caches.match(request))
  );
});
