import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.diegoluan.qrlivre',
  appName: 'QR Livre',
  webDir: 'dist',
  android: { allowMixedContent: false },
};

export default config;
