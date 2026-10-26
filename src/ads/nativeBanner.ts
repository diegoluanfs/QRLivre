import { Capacitor } from '@capacitor/core';
import { nativeAdConfig } from './config';

/** Singleton: React StrictMode e HMR não devem disparar múltiplos banners no SDK nativo. */
let startPromise: Promise<void> | null = null;
let initialized = false;
const setInset = (height: number) => {
  document.documentElement.style.setProperty('--native-ad-height', `${Math.max(0, Math.ceil(height))}px`);
};

export function startNativeBanner(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !nativeAdConfig.enabled) return Promise.resolve();
  if (startPromise) return startPromise;

  startPromise = (async () => {
    const { AdMob, AdmobConsentStatus, BannerAdSize, BannerAdPosition, BannerAdPluginEvents } =
      await import('@capacitor-community/admob');

    const adId = nativeAdConfig.getBannerId(Capacitor.getPlatform());
    if (!adId) {
      console.warn('[QR Livre] AdMob: banner não configurado para esta plataforma.');
      return;
    }

    // A versão 7 do plugin (compatível com Capacitor 7) inicializa antes da coleta UMP.
    if (!initialized) {
      await AdMob.initialize();
      initialized = true;
    }

    let consent = await AdMob.requestConsentInfo();
    if (consent.isConsentFormAvailable && consent.status === AdmobConsentStatus.REQUIRED) {
      consent = await AdMob.showConsentForm();
    }
    if (!consent.canRequestAds) {
      setInset(0);
      return;
    }

    await AdMob.addListener(BannerAdPluginEvents.SizeChanged, size => {
      setInset(size.height);
    });
    await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, error => {
      console.warn('[QR Livre] Banner AdMob não carregou:', error);
      setInset(0);
    });

    // A área reservada evita que o banner nativo cubra o rodapé durante seu carregamento.
    setInset(64);
    await AdMob.showBanner({
      adId,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: nativeAdConfig.mode === 'test',
    });
  })().catch(error => {
    setInset(0);
    console.warn('[QR Livre] Não foi possível iniciar o AdMob:', error);
    // Permite nova tentativa caso a navegação seja recriada, sem travar o gerador.
    startPromise = null;
  });

  return startPromise;
}

/** Reabre as opções UMP de consentimento, quando disponibilizadas para o usuário. */
export async function openNativeAdPrivacyOptions(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !nativeAdConfig.enabled) return;
  try {
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.showPrivacyOptionsForm();
  } catch (error) {
    console.warn('[QR Livre] Opções de privacidade de anúncios indisponíveis:', error);
  }
}
