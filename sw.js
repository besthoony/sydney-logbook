/* Sydney Logbook service worker — 앱 화면을 폰에 저장해 오프라인에서도 열리게 해요.
   공유 자료(Apps Script 응답)는 앱이 localStorage에 따로 보관하므로 여기서 캐시하지 않아요. */
const VERSION = 'sl-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
const OPTIONAL = ['seed.json', 'fonts/HDharmony-L.ttf', 'fonts/HDharmony-M.ttf', 'fonts/HDharmony-B.ttf'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(SHELL);
    await Promise.all(OPTIONAL.map(u => c.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // 구글 서버 요청, 쿼리가 붙은 요청(데이터 API)은 캐시하지 않고 그대로 통과시켜요.
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.search || url.pathname.endsWith('/exec')) return;
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    const hit = await c.match(e.request);
    const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }        // 캐시 먼저 보여주고 뒤에서 새 버전 받기
    return (await net) || (await c.match('index.html')) || Response.error();
  })());
});
