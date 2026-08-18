const CACHE_NAME = 'faith-tracker-v4';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function shouldBypass(url) {
  return (
    url.pathname === '/sw.js' ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firebase.google.com') ||
    url.hostname.includes('gstatic.com')
  );
}

function cacheIfSameOrigin(request, response) {
  if (response && response.status === 200 && response.type === 'basic') {
    const clone = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
  }
}

function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      cacheIfSameOrigin(request, response);
      return response;
    })
    .catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === 'navigate') return caches.match('/');
      throw new Error('Offline and uncached');
    });
}

function staleWhileRevalidate(request) {
  return caches.match(request).then((cached) => {
    const fetched = fetch(request)
      .then((response) => {
        cacheIfSameOrigin(request, response);
        return response;
      })
      .catch(() => cached);
    return cached || fetched;
  });
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (shouldBypass(url)) return;

  const accept = event.request.headers.get('accept') || '';
  const isHTML = event.request.mode === 'navigate' || accept.includes('text/html');

  event.respondWith(isHTML ? networkFirst(event.request) : staleWhileRevalidate(event.request));
});
