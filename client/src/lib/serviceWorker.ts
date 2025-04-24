// Simple service worker registration for PWA functionality

// Register service worker with minimal features
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(() => {
          console.log('Service Worker registered successfully');
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }
}

// Function to get VAPID public key from server
async function getVapidPublicKey() {
  try {
    const response = await fetch('/api/admin/notifications/vapid-public-key');
    if (!response.ok) {
      throw new Error(`Failed to get VAPID key: ${response.status}`);
    }
    const data = await response.json();
    return data.vapidPublicKey;
  } catch (error) {
    console.error('Error fetching VAPID key:', error);
    throw error;
  }
}

// Function to convert base64 string to Uint8Array for push subscription
function urlBase64ToUint8Array(base64String: string) {
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

// Subscribe to push notifications and register with the server
async function subscribeToPushNotifications(swRegistration: ServiceWorkerRegistration) {
  try {
    // Get the VAPID public key from the server
    const vapidPublicKey = await getVapidPublicKey();
    
    // Convert the public key to the format expected by the browser
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    
    // Subscribe to push notifications
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
    
    console.log('Push subscription successful:', subscription);
    
    // Register the subscription with the server
    const response = await fetch('/api/admin/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription,
        deviceName: navigator.userAgent
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to register subscription: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Subscription registered with server:', data);
    
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    throw error;
  }
}

// Test notification function that registers push subscriptions
export async function sendTestNotification() {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('This browser does not support notifications or push notifications');
    return Promise.reject(new Error('Push notifications not supported'));
  }

  // First check if permission is already granted
  if (Notification.permission === 'granted') {
    try {
      // Get the service worker registration
      const swRegistration = await navigator.serviceWorker.ready;
      
      // Check if we already have a push subscription
      let subscription = await swRegistration.pushManager.getSubscription();
      
      // If no subscription exists, create one
      if (!subscription) {
        console.log('No push subscription found, creating one...');
        subscription = await subscribeToPushNotifications(swRegistration);
      }
      
      // Send a test notification through the server
      const testResponse = await fetch('/api/admin/notifications/test', {
        method: 'POST'
      });
      
      if (!testResponse.ok) {
        const errorData = await testResponse.json();
        console.warn('Server notification test failed:', errorData);
        
        // Fall back to a local notification if server test fails
        new Notification('Local Test Notification', {
          body: 'This is a local notification. Server push may not be working.'
        });
      }
      
      return subscription;
    } catch (error) {
      console.error('Error in notification test:', error);
      
      // Fall back to a local notification
      new Notification('Notification Test', {
        body: 'This is a local notification. Push notifications may not be working correctly.'
      });
      
      throw error;
    }
  } else if (Notification.permission !== 'denied') {
    // Request permission
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Call this function again now that we have permission
      return sendTestNotification();
    } else {
      alert('Notification permission denied. Please enable notifications in your browser settings.');
      return Promise.reject(new Error('Notification permission denied'));
    }
  } else {
    alert('Please enable notifications in your browser settings');
    return Promise.reject(new Error('Notification permission denied'));
  }
}

// Simple function to check if app is installed as PWA
export function isPwaInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
}