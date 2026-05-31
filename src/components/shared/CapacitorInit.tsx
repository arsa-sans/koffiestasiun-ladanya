'use client';

import { useEffect } from 'react';
import {
  setupCapacitor,
  setupBackButton,
  setupAppLifecycle,
  isNativePlatform,
} from '@/lib/capacitor';

/**
 * CapacitorInit — Client component yang menginisialisasi Capacitor plugins
 *
 * Mount di root layout untuk:
 * - Hide splash screen setelah app ready
 * - Setup Android back button handler
 * - Setup app lifecycle (resume/pause)
 * - Apply status bar styling
 *
 * Component ini tidak me-render apapun (return null)
 */
export default function CapacitorInit() {
  useEffect(() => {
    // Skip jika bukan native platform
    if (!isNativePlatform()) return;

    const cleanupFns: Array<(() => void) | undefined> = [];

    async function init() {
      // 1. Setup Capacitor plugins (status bar, splash screen)
      await setupCapacitor();

      // 2. Setup hardware back button
      const cleanupBack = await setupBackButton();
      cleanupFns.push(cleanupBack);

      // 3. Setup app lifecycle
      const cleanupLifecycle = await setupAppLifecycle(
        // onResume: bisa dipakai untuk refresh data
        () => {
          console.log('[Capacitor] App resumed');
        },
        // onPause
        () => {
          console.log('[Capacitor] App paused');
        }
      );
      cleanupFns.push(cleanupLifecycle);
    }

    init();

    return () => {
      cleanupFns.forEach((fn) => fn?.());
    };
  }, []);

  return null;
}
