// src/lib/capacitor.ts
// Capacitor utility helpers untuk detect platform dan manage native features

import { Capacitor } from '@capacitor/core';

/**
 * Check apakah app berjalan di native platform (Android/iOS)
 * Return false jika berjalan di browser biasa
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Get current platform: 'android', 'ios', atau 'web'
 */
export function getPlatform(): string {
  return Capacitor.getPlatform();
}

/**
 * Check apakah berjalan di Android
 */
export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android';
}

/**
 * Setup semua Capacitor plugins saat app start
 * Dipanggil dari CapacitorInit component
 */
export async function setupCapacitor(): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    // Setup Status Bar
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#1B5E20' });

    // Hide splash screen setelah app ready
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide({ fadeOutDuration: 500 });
  } catch (error) {
    console.warn('[Capacitor] Setup error:', error);
  }
}

/**
 * Setup hardware back button handler untuk Android
 * Mencegah app keluar saat tekan back di halaman utama
 */
export async function setupBackButton(
  onBackPress?: () => void
): Promise<(() => void) | undefined> {
  if (!isNativePlatform()) return undefined;

  try {
    const { App: CapApp } = await import('@capacitor/app');

    const listener = await CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else if (onBackPress) {
        onBackPress();
      } else {
        // Minimize app instead of closing
        CapApp.minimizeApp();
      }
    });

    return () => {
      listener.remove();
    };
  } catch (error) {
    console.warn('[Capacitor] Back button setup error:', error);
    return undefined;
  }
}

/**
 * Setup app lifecycle listeners (resume/pause)
 */
export async function setupAppLifecycle(
  onResume?: () => void,
  onPause?: () => void
): Promise<(() => void) | undefined> {
  if (!isNativePlatform()) return undefined;

  try {
    const { App: CapApp } = await import('@capacitor/app');

    const resumeListener = await CapApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive && onResume) {
        onResume();
      } else if (!isActive && onPause) {
        onPause();
      }
    });

    return () => {
      resumeListener.remove();
    };
  } catch (error) {
    console.warn('[Capacitor] Lifecycle setup error:', error);
    return undefined;
  }
}

/**
 * Trigger haptic feedback (untuk POS touch interactions)
 */
export async function triggerHaptic(
  type: 'light' | 'medium' | 'heavy' = 'light'
): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');

    const styleMap: Record<string, any> = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };

    await Haptics.impact({ style: styleMap[type] });
  } catch (error) {
    // Silently fail — haptics not critical
  }
}
