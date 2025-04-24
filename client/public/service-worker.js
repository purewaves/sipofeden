// Very minimal service worker for PWA functionality
const CACHE_NAME = 'sip-of-eden-admin-v3';

// Minimal install event - cache only essential files
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force activation
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/admin',
        '/manifest.json',
        '/icons/icon-192x192.png'
      ]);
    })
  );
});

// Simple activate event - claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Extremely simple fetch handler - network-first with minimal caching
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests to avoid complexity
  if (event.request.method !== 'GET') return;
  
  // Simple network-first strategy
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Basic notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Try to open the admin dashboard
  if (clients.openWindow) {
    clients.openWindow('/admin/dashboard');
  }
});