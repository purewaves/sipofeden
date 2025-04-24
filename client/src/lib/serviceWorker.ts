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

// Super simple notification test function
export function sendTestNotification() {
  if (!('Notification' in window)) {
    alert('This browser does not support notifications');
    return Promise.reject(new Error('Notifications not supported'));
  }

  if (Notification.permission === 'granted') {
    // Create a simple notification
    try {
      new Notification('Test Notification', {
        body: 'This notification system is working!'
      });
      return Promise.resolve();
    } catch (error) {
      console.error('Error creating notification:', error);
      return Promise.reject(error);
    }
  } else if (Notification.permission !== 'denied') {
    // Request permission
    return Notification.requestPermission()
      .then(permission => {
        if (permission === 'granted') {
          new Notification('Notification Permission Granted', {
            body: 'You will now receive notifications!'
          });
          return Promise.resolve();
        } else {
          return Promise.reject(new Error('Permission denied'));
        }
      });
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