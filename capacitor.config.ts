import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.diegoluan.qrlivre',
  appName: 'QR Livre',
  webDir: 'dist',

  android: {
    allowMixedContent: false,
  },

  plugins: {
    SystemBars: {
      insetsHandling: 'css',
      style: 'DARK',
      hidden: false,
    },
  },
};

export default config;