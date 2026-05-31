import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.koffiestasiun.pos',
  appName: 'KoffiePOS',
  webDir: 'public',

  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'http://192.168.108.123:3000',
    cleartext: true,
    androidScheme: 'https',
    // Izinkan navigasi ke domain yang dibutuhkan
    allowNavigation: [
      '*.supabase.co',
      '*.supabase.in',
      'localhost',
      '192.168.*.*',
      '10.*.*.*',
    ],
  },

  // Android-specific configuration
  android: {
    // Warna status bar dan navigasi
    backgroundColor: '#1B5E20',
  },

  plugins: {
    SplashScreen: {
      // Durasi splash screen ditampilkan (ms)
      launchShowDuration: 2000,
      // Auto-hide setelah durasi
      launchAutoHide: true,
      // Fade-out animation duration
      launchFadeOutDuration: 500,
      // Background color splash screen
      backgroundColor: '#1B5E20',
      // Resize mode untuk logo di splash
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      // Show spinner saat loading
      showSpinner: false,
      // Warna spinner (jika show)
      spinnerColor: '#C08B5C',
    },
    StatusBar: {
      // Style status bar (dark text pada light bg, atau light text pada dark bg)
      style: 'LIGHT',
      // Background color status bar
      backgroundColor: '#1B5E20',
    },
  },
};

export default config;
