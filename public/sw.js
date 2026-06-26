const CACHE_NAME   = 'mia-one-v4';
const STATIC_CACHE = 'mia-static-v4';
const IMAGE_CACHE  = 'mia-images-v4';
const OFFLINE_URL  = '/offline.html';

const PRECACHE_URLS = ['/', '/offline.html', '/mia-one-logo.png'];

// ── Install: pre-cache shell resources ────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  // Do NOT skipWaiting here — the update banner handles it
});

// ── Activate: remove stale caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const KEEP = new Set([CACHE_NAME, STATIC_CACHE, IMAGE_CACHE]);
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => !KEEP.has(n)).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// ── Update prompt ──────────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// ── Fetch strategies ───────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Navigation — network-first, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // 2. Hashed static assets (/assets/…) — cache-first, effectively immutable
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // 3. Images — stale-while-revalidate (instant display + background refresh)
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((res) => { if (res.ok) cache.put(request, res.clone()); return res; })
          .catch(() => cached || new Response('', { status: 408 }));
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 4. Supabase API — network-only (never serve stale API data)
  if (url.hostname.includes('supabase')) {
    event.respondWith(fetch(request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // 5. Everything else — stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      const fetchPromise = fetch(request).then((res) => {
        if (res.ok && res.type === 'basic') cache.put(request, res.clone());
        return res;
      }).catch(() => {
        if (request.destination === 'image') {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#141820" width="200" height="200"/><text x="100" y="100" text-anchor="middle" fill="#ffffff40" font-size="14">Offline</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
        return new Response('', { status: 408 });
      });
      return cached || fetchPromise;
    })
  );
});
