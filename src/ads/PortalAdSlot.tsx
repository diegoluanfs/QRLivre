/** Anúncios web do portal. Não modifica o AdMob do Capacitor. */
import { useEffect, useRef, useState } from 'react';
import { isNativeApp } from './config';
import config from '../../config/web-ads.json';
import { loadAdSense, requestDisplayAd } from './webAds';

export type PortalPlacement = keyof typeof config.slots;
const validClient = /^ca-pub-\d{16}$/;
const validSlot = /^\d+$/;

function isConfigured(placement: PortalPlacement): boolean {
  return !isNativeApp && config.enabled && config.siteApproved &&
    config.privacyIntegrationReady && config.placements[placement] &&
    validClient.test(config.publisherId) && validSlot.test(config.slots[placement]);
}

function hasConsent(): boolean {
  return (window as Window & { qrlivreAdConsentGranted?: boolean }).qrlivreAdConsentGranted === true;
}

export function PortalAdSlot({ placement }: { placement: PortalPlacement }) {
  const adRef = useRef<HTMLModElement>(null);
  const requested = useRef(false);
  const [consented, setConsented] = useState(false);
  const configured = isConfigured(placement);

  useEffect(() => {
    if (!configured) return;
    const update = () => setConsented(hasConsent());
    update();
    window.addEventListener('qrlivre:ads-consent-changed', update);
    return () => window.removeEventListener('qrlivre:ads-consent-changed', update);
  }, [configured]);

  useEffect(() => {
    if (!configured || !consented || requested.current || !adRef.current) return;
    const element = adRef.current;
    let cancelled = false;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting) || requested.current || element.getBoundingClientRect().width < 250) return;
      requested.current = true;
      observer.disconnect();
      void loadAdSense(config.publisherId)
        .then(() => {
          if (!cancelled && element.isConnected && hasConsent()) requestDisplayAd();
        })
        .catch(() => {
          requested.current = false;
          element.closest('.qrl-ad')?.setAttribute('hidden', '');
        });
    }, { rootMargin: '120px' });
    observer.observe(element);
    return () => { cancelled = true; observer.disconnect(); };
  }, [configured, consented]);

  // Nenhum banner reservado, solicitação ou script até aprovação E consentimento.
  if (!configured || !consented) return null;
  return <section className="qrl-ad qrl-ad--generator" aria-label="Publicidade">
    <span className="qrl-ad__label">Publicidade</span>
    <ins ref={adRef} className="adsbygoogle" style={{ display: 'block' }}
      data-ad-client={config.publisherId}
      data-ad-slot={config.slots[placement]}
      data-ad-format="auto"
      data-full-width-responsive="true" />
  </section>;
}
