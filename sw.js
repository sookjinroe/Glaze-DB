const VER = 'glazedb-sw-v3';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;           // fonts etc: network
  if (e.request.mode === 'navigate' || url.pathname.endsWith('data.js')) {
    // app shell & data: network first, cache fallback (updates flow through)
    e.respondWith(
      fetch(e.request).then(r => {
        const cp = r.clone();
        caches.open(VER).then(c => c.put(e.request, cp));
        return r;
      }).catch(() => caches.match(e.request, {ignoreSearch: url.pathname.endsWith('data.js')}))
    );
    return;
  }
  // images & static: cache first, fill on demand
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      const cp = r.clone();
      caches.open(VER).then(c => c.put(e.request, cp));
      return r;
    }))
  );
});
