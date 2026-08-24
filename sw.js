const CACHE_NAME = 'hashgang-chat-v19';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/terms-of-service.html',
  '/privacy-policy.html',
  '/style.css',
  '/app.js',
  '/ads.js',
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
  '/blog/how-p2p-reduces-server-lag-and-buffering.html'
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

  // Network-First for HTML/CSS/JS so code updates load immediately
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
});
