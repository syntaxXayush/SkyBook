'use client';

import { useEffect } from 'react';

/**
 * Registers the SkyBook service worker for PWA support.
 *
 * Strategy:
 * - Defers registration until after the page loads (no impact on FCP)
 * - Silently updates in the background when a new version is available
 * - Logs lifecycle events for debugging
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[SW] Registered:', registration.scope);

            // Auto-update check every 60 minutes
            setInterval(() => {
              registration.update();
            }, 60 * 60 * 1000);
          })
          .catch((error) => {
            console.error('[SW] Registration failed:', error);
          });
      });
    }
  }, []);

  return null; // This component renders nothing
}
