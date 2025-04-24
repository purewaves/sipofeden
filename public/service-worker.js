// Sip of Eden Service Worker
const CACHE_NAME = 'sip-of-eden-cache-v1';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline use
const urlsToCache = [
  '/',
  '/offline.html',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js',
  '/assets/logo.svg'
];

// Install Event - Cache important files
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  
  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching important files');
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  
  // Claim clients to control all tabs immediately
  event.waitUntil(self.clients.claim());
  
  // Remove old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch Event - Serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // For API requests, use network-first strategy
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  // For page navigation, use network-first strategy
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }
  
  // For static assets, use cache-first strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone the response as it can only be consumed once
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      }).catch(() => {
        // If fetch fails and we don't have a cached response, return offline page
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
      });
    })
  );
});

// Push Event - Handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received');
  
  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'New Notification',
      body: event.data ? event.data.text() : 'No details available',
      icon: '/assets/icons/icon-192x192.png',
      url: '/'
    };
  }
  
  const title = data.title || 'Sip of Eden';
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    data: {
      url: data.url || '/'
    },
    vibrate: [100, 50, 100],
    timestamp: Date.now()
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click Event - Open the app when notification is clicked
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received');
  
  event.notification.close();
  
  // Get the notification data (contains URL to open)
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({type: 'window'}).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // If so, focus it
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no open window, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});