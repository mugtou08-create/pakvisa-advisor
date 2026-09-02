'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function getInitialOnlineStatus() {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

function getInitialInstalledStatus() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(getInitialInstalledStatus);
  const [isOnline, setIsOnline] = useState(getInitialOnlineStatus);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Service worker registration DISABLED — it was causing
    // 'TypeError: Failed to fetch' on API routes in production.
    // The PWA install prompt still works without an active SW.
    // if ('serviceWorker' in navigator) {
    //   navigator.serviceWorker
    //     .register('/sw.js')
    //     .then((reg) => {
    //       console.log('SW registered:', reg.scope);
    //     })
    //     .catch((err) => console.warn('SW registration failed:', err));
    // }

    // Track online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Capture the install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setTimeout(() => setShowInstallPrompt(true), 3000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      deferredPrompt.current = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt.current) return false;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setShowInstallPrompt(false);
    deferredPrompt.current = null;
    return outcome === 'accepted';
  }, []);

  const dismissInstall = useCallback(() => {
    setShowInstallPrompt(false);
  }, []);

  return { isInstalled, isOnline, showInstallPrompt, installApp, dismissInstall };
}
