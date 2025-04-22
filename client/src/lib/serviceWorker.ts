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
        
        // Check if user is already authenticated as admin before subscribing
        // Only admins need push notifications
        fetch('/api/admin/profile')
          .then(response => {
            if (response.ok) {
              // User is authenticated as admin, proceed with subscription
              return fetch('/api/admin/notifications/vapid-public-key')
                .then(res => {
                  if (!res.ok) {
                    throw new Error('Failed to fetch VAPID key');
                  }
                  return res.json();
                })
                .then(data => {
                  const publicVapidKey = data.vapidPublicKey;
                  
                  return registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
                  });
                })
                .then(subscription => {
                  // Send subscription to server
                  console.log('User is subscribed to push notifications');
                  
                  // Get device info for better subscription management
                  const deviceName = getDeviceName();
                  
                  // Send the subscription to our server
                  return fetch('/api/admin/notifications/subscribe', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      subscription,
                      deviceName
                    }),
                    credentials: 'include'
                  });
                })
                .then(response => {
                  if (!response.ok) {
                    throw new Error('Failed to register push subscription with server');
                  }
                  console.log('Push subscription successfully registered with server');
                })
                .catch(error => {
                  console.error('Push subscription error:', error);
                });
            } else {
              // Not an admin, don't subscribe
              console.log('User is not authenticated as admin, skipping push subscription');
            }
          })
          .catch(error => {
            console.error('Error checking admin status:', error);
          });
      } else {
        console.log('Notification permission denied');
      }
    });
  }
}

// Helper function to get device name
function getDeviceName(): string {
  const userAgent = navigator.userAgent;
  let deviceName = 'Unknown Device';
  
  // Try to identify the device type
  if (/iPad/.test(userAgent)) {
    deviceName = 'iPad';
  } else if (/iPhone/.test(userAgent)) {
    deviceName = 'iPhone';
  } else if (/Android/.test(userAgent)) {
    deviceName = 'Android Device';
  } else if (/Windows/.test(userAgent)) {
    deviceName = 'Windows PC';
  } else if (/Mac/.test(userAgent)) {
    deviceName = 'Mac';
  } else if (/Linux/.test(userAgent)) {
    deviceName = 'Linux Device';
  }
  
  // Add browser info
  if (/Chrome/.test(userAgent)) {
    deviceName += ' - Chrome';
  } else if (/Firefox/.test(userAgent)) {
    deviceName += ' - Firefox';
  } else if (/Safari/.test(userAgent)) {
    deviceName += ' - Safari';
  } else if (/Edge/.test(userAgent)) {
    deviceName += ' - Edge';
  }
  
  return deviceName;
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
  
  // First try the server-side test API, which will send a notification through the push service
  // This tests the entire notification pipeline including the subscription on the server
  return fetch('/api/admin/notifications/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  })
  .then(response => {
    if (!response.ok) {
      // If server-side test fails, fall back to local notification
      console.warn('Server push notification test failed, falling back to local notification');
      return fallbackToLocalNotification();
    }
    
    return response.json().then(data => {
      console.log('Push notification test sent successfully:', data);
      return data;
    });
  })
  .catch(error => {
    console.error('Error sending push notification test:', error);
    // Fall back to local notification
    return fallbackToLocalNotification();
  });
}

// Local notification fallback if server push fails
function fallbackToLocalNotification(): Promise<void> {
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
      console.error('Error showing local notification:', error);
      return Promise.reject(error);
    });
}

// Function to check if app is installed as PWA
export function isPwaInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
}