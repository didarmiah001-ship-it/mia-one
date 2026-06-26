/**
 * MIA Admin — Service Worker
 * Scope: /admin/
 *
 * Strategy:
 *  - Navigation requests (/admin/*): network-first, fall back to cached shell
 *  - Static assets (logo, cached shell resources): cache-first
 *  - Supabase API & external requests: network-only (admin needs live data)
 */

const CACHE_NAME = 'mia-admin-v2';

// Resources to pre-cache on install
const PRECACHE = [
  '/admin/',
  '/mia-admin-logo.png',
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE).catch(() => { /* ignore pre-cache failures */ }))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and non-HTTP(S) requests
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // Skip Supabase API, external APIs, fonts — always network-only
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname !== self.location.hostname
  ) {
    return; // browser handles it natively
  }

  // ── Navigation requests (/admin/*) — network-first with shell fallback ──
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            // Update cached shell with fresh copy
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put('/admin/', clone));
          }
          return response;
        })
        .catch(() =>
          caches.match('/admin/').then(cached =>
            cached || new Response(
              `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MIA Admin — Offline</title>
  <style>
    body { margin:0; background:#0A0A0F; color:#fff; font-family:system-ui,sans-serif;
           display:flex; align-items:center; justify-content:center; min-height:100vh; }
    .card { text-align:center; padding:2rem; }
    img { width:80px; height:80px; object-fit:contain; margin-bottom:1.5rem;
          filter:drop-shadow(0 0 16px rgba(255,138,0,0.4)); }
    h1 { font-size:1.25rem; margin:0 0 0.5rem; }
    p  { color:rgba(255,255,255,0.4); font-size:0.875rem; margin:0 0 1.5rem; }
    button { padding:0.75rem 2rem; border-radius:12px; border:none; cursor:pointer;
             background:linear-gradient(135deg,#FF8A00,#FF2EC9); color:#fff;
             font-size:0.875rem; font-weight:600; }
  </style>
</head>
<body>
  <div class="card">
    <img src="/mia-admin-logo.png" alt="MIA Admin" />
    <h1>You're Offline</h1>
    <p>MIA Admin needs an internet connection to work.</p>
    <button onclick="location.reload()">Try Again</button>
  </div>
</body>
</html>`,
              { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
            )
          )
        )
    );
    return;
  }

  // ── Static assets — cache-first ──────────────────────────────────────────
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname === '/mia-admin-logo.png' ||
    url.pathname === '/admin-manifest.json'
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        });
      })
    );
  }
});
