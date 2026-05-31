// src/lib/motion.ts
// Utility to safely handle framer-motion initial animations on Android WebView
// Android WebView (Capacitor) can cause framer-motion animations to get stuck
// at opacity: 0, making the entire UI invisible while still interactive.

/**
 * Returns `false` if running in Capacitor/Android WebView to disable
 * framer-motion initial animations that cause the UI to be invisible.
 * Returns the original value on desktop/web browsers where animations work fine.
 *
 * Usage:
 *   <motion.div initial={safeInitial({ opacity: 0, y: 20 })} animate={{ opacity: 1, y: 0 }}>
 */
export function safeInitial<T extends Record<string, unknown>>(
  value: T
): T | false {
  if (typeof window === 'undefined') return value;

  // Detect Capacitor WebView environment
  const isCapacitor =
    // @ts-expect-error Capacitor global may not exist
    typeof window.Capacitor !== 'undefined' ||
    document.URL.startsWith('https://localhost') ||
    document.URL.startsWith('http://localhost') ||
    // Capacitor Android uses capacitor:// or https://localhost
    navigator.userAgent.includes('CapacitorWebView');

  return isCapacitor ? false : value;
}
