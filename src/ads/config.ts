import { Capacitor } from '@capacitor/core';

/** IDs de anúncios são públicos. Não coloque tokens privados nas variáveis VITE_. */
export const isNativeApp = Capacitor.isNativePlatform();

const env = import.meta.env;

const enabled = (value: string | undefined) => value === 'true';
const publisherIdPattern = /^ca-pub-\d{16}$/;
const adUnitPattern = /^ca-app-pub-\d{16}\/\d+$/;
const slotPattern = /^\d+$/;

export const webAdConfig = {
  enabled: !isNativeApp && enabled(env.VITE_ADSENSE_ENABLED),
  showPlaceholders: enabled(env.VITE_SHOW_AD_PLACEHOLDERS || 'true'),
  client: (env.VITE_ADSENSE_CLIENT || '').trim(),
  slots: {
    top: (env.VITE_ADSENSE_SLOT_TOP || '').trim(),
    sidebar: (env.VITE_ADSENSE_SLOT_SIDEBAR || '').trim(),
    bottom: (env.VITE_ADSENSE_SLOT_BOTTOM || '').trim(),
  },
} as const;

export type WebAdPlacement = keyof typeof webAdConfig.slots;

export function isAdSenseSlotReady(placement: WebAdPlacement): boolean {
  return webAdConfig.enabled &&
    publisherIdPattern.test(webAdConfig.client) &&
    slotPattern.test(webAdConfig.slots[placement]);
}

const androidTestBannerId = 'ca-app-pub-3940256099942544/6300978111';
const iosTestBannerId = 'ca-app-pub-3940256099942544/2934735716';

export const nativeAdConfig = {
  enabled: enabled(env.VITE_ADMOB_ENABLED ?? 'true'),
  mode: env.VITE_ADMOB_MODE === 'live' ? 'live' : 'test',
  getBannerId(platform: string): string | null {
    if (platform !== 'android' && platform !== 'ios') return null;
    if (this.mode === 'test') {
      return platform === 'ios' ? iosTestBannerId : androidTestBannerId;
    }
    const id = platform === 'ios'
      ? env.VITE_ADMOB_IOS_BANNER_ID
      : env.VITE_ADMOB_ANDROID_BANNER_ID;
    return id && adUnitPattern.test(id) ? id : null;
  },
} as const;
