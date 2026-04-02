import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kotoflash.app',
  appName: 'KotoFlash',
  webDir: 'out',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#ffffffff",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#BC002D",
    },
    StatusBar: {
      style: "light",
      backgroundColor: "#ffffffff",
    },
  },
};

export default config;
