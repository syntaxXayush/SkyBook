// ============================================================
// SkyBook Service Worker
// Strategic caching with two tiers:
//
//   CacheFirst   → Static assets (fonts, CSS, icons, images)
//                   Checks device cache before touching the network.
//                   Result: instant loads for unchanging resources.
//
//   StaleWhileRevalidate → API/data fetches (bookings, flights)
//                   Shows cached data instantly, then quietly
//                   refreshes from the network in the background.
//                   Result: offline-first with eventual consistency.
// ============================================================

const CACHE_NAME = 'skybook-v1';
const STATIC_CACHE = 'skybook-static-v1';
const DATA_CACHE = 'skybook-data-v1';

// Static assets to pre-cache on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon.svg',
];

// ---- INSTALL: pre-cache critical static assets ----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ---- ACTIVATE: clean up old caches ----
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DATA_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// ---- FETCH: route requests through the right strategy ----
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Supabase auth endpoints (never cache auth tokens)
  if (url.pathname.includes('/auth/')) return;

  // ---- Strategy 1: CacheFirst for static assets ----
  // Fonts, CSS, JS chunks, icons, images
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico') ||
    url.host === 'fonts.googleapis.com' ||
    url.host === 'fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // ---- Strategy 2: StaleWhileRevalidate for data/pages ----
  // Dashboard, bookings API, flight data
  if (
    url.pathname.startsWith('/dashboard') ||
    url.pathname.startsWith('/flights') ||
    url.pathname.startsWith('/booking') ||
    url.host.includes('supabase')
  ) {
    event.respondWith(
      caches.open(DATA_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const networkFetch = fetch(request)
            .then((response) => {
              if (response.ok) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => {
              // Network failed — if we have a cached version, great.
              // If not, show the offline page for navigation requests.
              if (cached) return cached;
              if (request.mode === 'navigate') {
                return caches.match('/offline');
              }
              return new Response('Offline', { status: 503 });
            });

          // Return cached immediately, update in background
          return cached || networkFetch;
        })
      )
    );
    return;
  }

  // ---- Default: Network-first with offline fallback for navigations ----
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline') || caches.match('/');
      })
    );
  }
});
