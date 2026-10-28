import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.diegoluan.qrlivre',
  appName: 'QR Livre',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    // Capacitor 7: Android 15+ pode desenhar o WebView sob as barras do sistema.
    // Ajusta as margens nativas quando o edge-to-edge estiver ativo.
    adjustMarginsForEdgeToEdge: 'auto',
  },
};

export default config;
