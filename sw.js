const CACHE_NAME = 'hashgang-chat-v40';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/terms-of-service.html',
  '/privacy-policy.html',
  '/style.css',
  '/app.js',
  '/ads.js',
  '/logo.webp',
  '/logo-sm.webp',
  '/og-image.webp',
  '/apple-touch-icon.webp',
  '/logo.png',
  '/qr-code.png',
  '/manifest.json',
  '/sitemap.xml',
  '/robots.txt',
  '/blog/index.html',
  '/blog/top-omegle-alternatives.html',
  '/blog/free-video-chat-no-login.html',
  '/blog/ometv-vs-hashgang-chat.html',
  '/blog/ai-beauty-filter-video-chat-guide.html',
  '/blog/mobile-pwa-stranger-video-chat.html',
  '/blog/p2p-webrtc-video-chat-explained.html',
  '/blog/safe-anonymous-video-chat-guide.html',
  '/blog/end-to-end-encryption-anonymous-chat.html',
  '/blog/global-stranger-chat-tips.html',
  '/blog/faq-frequently-asked-questions.html',
  '/blog/best-stranger-chat-apps-for-college-students.html',
  '/blog/how-to-fix-camera-permission-issues.html',
  '/blog/language-exchange-video-chat.html',
  '/blog/is-stranger-video-chat-safe-for-women.html',
  '/blog/how-p2p-reduces-server-lag-and-buffering.html',
  '/blog/camsurf-vs-hashgang-chat.html',
  '/blog/emerald-chat-vs-hashgang-chat.html',
  '/blog/chatroulette-vs-hashgang-chat.html',
  '/blog/how-anti-screen-recording-trace-watermark-works.html',
  '/blog/why-free-unlimited-video-chat-beats-coin-paywalls.html',
  '/blog/zero-wait-instant-video-chat-matchmaking.html',
  '/blog/virtual-ring-light-dark-room-video-chat.html'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);
  const isStaticAsset = url.pathname.match(/\.(webp|png|jpg|jpeg|ico|svg|css|woff2?|ttf|eot)$/i);

  if (isStaticAsset) {
    // Cache-First with Network Fallback for static assets (images, fonts, styles)
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Serve from cache immediately, update cache in background
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          }).catch(() => {});
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        });
      })
    );
  } else {
    // Network-First for HTML/JS
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  }
});
