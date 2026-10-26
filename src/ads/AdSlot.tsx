import { useEffect, useRef } from 'react';
import { isAdSenseSlotReady, isNativeApp, webAdConfig, type WebAdPlacement } from './config';
import { loadAdSense, requestDisplayAd } from './webAds';

const placements: Record<WebAdPlacement, { title: string; description: string }> = {
  top: { title: 'Banner horizontal', description: 'Espaço para anúncios responsivos' },
  sidebar: { title: 'Banner lateral', description: 'Espaço para anúncios 300 × 250' },
  bottom: { title: 'Banner inferior', description: 'Espaço para anúncios responsivos' },
};

export function AdSlot({ placement }: { placement: WebAdPlacement }) {
  const adRef = useRef<HTMLModElement>(null);
  const requested = useRef(false);
  const ready = isAdSenseSlotReady(placement);

  useEffect(() => {
    if (!ready || isNativeApp || requested.current) return;
    const element = adRef.current;
    if (!element) return;

    // Não requisitar banners escondidos em layouts menores nem antes de aparecerem na tela.
    const observer = new IntersectionObserver(entries => {
      if (!entries[0]?.isIntersecting || requested.current || element.getBoundingClientRect().width < 250) return;
      requested.current = true;
      observer.disconnect();
      void loadAdSense(webAdConfig.client)
        .then(() => {
          if (element.isConnected) requestDisplayAd();
        })
        .catch(error => console.warn('[QR Livre] AdSense indisponível:', error));
    }, { rootMargin: '160px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ready]);

  if (isNativeApp) return null;
  if (!ready && !webAdConfig.showPlaceholders) return null;

  return <section className={`ad-space ad-space--${placement} ${ready ? 'ad-space--live' : 'ad-space--placeholder'}`} aria-label="Publicidade">
    <span className="ad-space__label">Publicidade</span>
    {ready ? (
      <ins ref={adRef} className="adsbygoogle" style={{ display: 'block' }}
        data-ad-client={webAdConfig.client}
        data-ad-slot={webAdConfig.slots[placement]}
        data-ad-format="auto"
        data-full-width-responsive="true" />
    ) : (
      <div className="ad-space__placeholder" aria-label={`Espaço reservado: ${placements[placement].title}`}>
        <span className="ad-space__symbol" aria-hidden="true">▦</span>
        <strong>{placements[placement].title}</strong>
        <span>{placements[placement].description}</span>
      </div>
    )}
  </section>;
}
