'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(async (reg) => {
          console.log('SW registered:', reg);
          
          // Request notification permission
          if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              const sub = await reg.pushManager.getSubscription();
              if (!sub) {
                // In a real app, you'd use your VAPID public key here
                // reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: '...' });
              }
            }
          }
        })
        .catch((err) => console.log('SW error:', err));
    }
  }, []);

  return null;
}
