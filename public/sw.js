// Numele SE SCHIMBA la fiecare livrare. Cat a stat neschimbat, `activate` nu
// avea ce sterge — filtrul de mai jos pastreaza exact cache-ul cu numele
// curent — asa ca paginile salvate ramaneau in browser la nesfarsit. Iar o
// pagina veche trimite la fisiere `/_next/static/` cu nume care nu mai exista
// dupa o reconstruire: de acolo veneau 404-urile si incarcarea greoaie.
const CACHE_NAME = 'dinamo-rugby-2026-08-13';

// `/offline` NU exista (da 404). Statea aici de la inceput, si `cache.addAll`
// respinge TOT daca un singur URL esueaza — deci instalarea pica de fiecare
// data, iar service worker-ul nu ajungea niciodata activ. Se reincerca la
// fiecare incarcare de pagina, degeaba.
const PRECACHE_URLS = ['/offline.html'];

// Install: precache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Fiecare adresa separat: daca una cade, restul intra oricum, si
      // instalarea nu mai e totul-sau-nimic.
      Promise.all(
        PRECACHE_URLS.map((url) => cache.add(url).catch(() => undefined))
      )
    )
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first for navigations/API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // Network-first for navigations and API calls
  if (request.mode === 'navigate' || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // NU salvam paginile. HTML-ul unei pagini Next trimite la fisiere cu
          // nume unic pe livrare; o pagina scoasa din cache dupa o
          // reconstruire cere fisiere care nu mai exista, si atunci situl se
          // incarca greu si arata 404-uri. Pentru cazul „fara internet" e
          // /offline.html, care nu depinde de nicio livrare.
          return response;
        })
        .catch(() => {
          // Try cache first, then offline fallback
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            if (request.mode === 'navigate') {
              return caches.match('/offline.html').then((offline) => {
                return offline || new Response(
                  '<h1>Offline</h1><p>Verifică conexiunea la internet.</p>',
                  { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
                );
              });
            }
            return new Response('', { status: 503 });
          });
        })
    );
    return;
  }

  // Cache-first for static assets (images, CSS, JS, fonts)
  const isStaticAsset = /\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|woff|woff2|ttf|eot)$/i.test(url.pathname)
    || url.pathname.startsWith('/_next/static/');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => new Response('', { status: 503 }));
      })
    );
    return;
  }

  // Default: network-first for everything else
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || new Response('', { status: 503 })))
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'Dinamo Rugby', body: 'Notificare nouă', icon: '/icons/icon-192.png' };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: data,
    })
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
