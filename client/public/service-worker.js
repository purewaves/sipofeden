// Service Worker for Sip of Eden Admin Dashboard
const CACHE_NAME = 'sip-of-eden-admin-v1';
const OFFLINE_PAGE = '/admin/offline.html';
const ASSETS_TO_CACHE = [
  '/',
  '/admin',
  OFFLINE_PAGE,
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/assets/logo.jpg'
];

// Install event - Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Network first, falling back to cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip API requests - these should always be fresh
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for non-API requests
        if (response.status === 200 && !event.request.url.includes('/api/')) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // If network request fails, try to serve from cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            
            // If request is for a page, show offline page
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_PAGE);
            }
            
            return new Response('Network error happened', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Push event - Handle notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const notification = event.data.json();
    
    const options = {
      body: notification.body || 'New notification from Sip of Eden',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: notification.data || {},
      actions: notification.actions || [],
      vibrate: [100, 50, 100],
      timestamp: notification.timestamp || Date.now()
    };
    
    event.waitUntil(
      self.registration.showNotification(
        notification.title || 'Sip of Eden Notification', 
        options
      )
    );
  } catch (err) {
    console.error('Error processing push notification:', err);
  }
});

// Notification click event - Open relevant page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Get notification data
  const data = event.notification.data;
  let targetUrl = '/admin';
  
  // Handle different notification types
  if (data.type === 'new_order') {
    targetUrl = `/admin/orders/${data.orderId}`;
  } else if (data.type === 'inventory_alert') {
    targetUrl = '/admin/products';
  } else if (data.type === 'customer_message') {
    targetUrl = '/admin/messages';
  } else if (data.url) {
    targetUrl = data.url;
  }
  
  event.waitUntil(
    clients.matchAll({type: 'window'})
      .then((clientList) => {
        // If a window is already open, focus it and navigate
        for (const client of clientList) {
          if (client.url.includes('/admin') && 'focus' in client) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});