// Service Worker Registration for PWA

// Register service worker
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    // Execute immediately instead of waiting for load event
    // This helps ensure the service worker is registered early
    console.log('Attempting to register service worker...');
    
    // The service worker URL must be absolute from the origin
    navigator.serviceWorker
      .register('/service-worker.js', { 
        scope: '/',
        updateViaCache: 'none' // Bypass cache for updates
      })
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
        
        // Force update check on each registration
        registration.update();
        
        // Subscribe to push notifications if available
        subscribeToPushNotifications(registration);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  } else {
    console.warn('Service workers are not supported in this browser');
  }
}

// Request push notification permission and subscribe
function subscribeToPushNotifications(registration: ServiceWorkerRegistration) {
  if ('Notification' in window && 'PushManager' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log('Notification permission granted');
        
        // Here we would subscribe the user to push notifications
        // This requires a backend push notification service with public VAPID keys
        // Commented out code below shows how this would work
        
        /*
        const publicVapidKey = 'your-public-vapid-key';
        
        registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        })
        .then(subscription => {
          // Send subscription to server
          console.log('User is subscribed to push notifications');
          // Here you would send the subscription to your server
        })
        .catch(error => {
          console.error('Push subscription error:', error);
        });
        */
      } else {
        console.log('Notification permission denied');
      }
    });
  }
}

// Helper function to convert URL base64 to Uint8Array
// Required for VAPID authentication with push service
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

// Send a test notification (for testing purposes)
export function sendTestNotification() {
  // First check if we can access service workers and notifications
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported in this browser');
    return Promise.reject(new Error('Service workers not supported'));
  }
  
  if (!('Notification' in window)) {
    console.warn('Notifications are not supported in this browser');
    return Promise.reject(new Error('Notifications not supported'));
  }
  
  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return Promise.reject(new Error('Notification permission not granted'));
  }
  
  // Try to show notification through the service worker
  return navigator.serviceWorker.getRegistration()
    .then(registration => {
      if (!registration) {
        console.warn('No service worker registration found');
        return Promise.reject(new Error('No service worker registration found'));
      }
      
      return registration.showNotification('Sip of Eden Admin', {
        body: 'New order received! Check your dashboard for details.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
          url: '/admin/orders'
        }
      } as NotificationOptions);
    })
    .catch(error => {
      console.error('Error showing notification:', error);
      return Promise.reject(error);
    });
}

// Function to check if app is installed as PWA
export function isPwaInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
}