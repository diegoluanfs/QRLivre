/* Publicidade web estática. Nunca solicita anúncios enquanto a configuração ou consentimento não estiverem prontos. */
(() => {
  'use strict';
  const config = window.qrlivreWebAdsConfig;
  const valid = config && config.enabled === true && config.siteApproved === true &&
    config.privacyIntegrationReady === true && /^ca-pub-\d{16}$/.test(config.publisherId);
  if (!valid || window.Capacitor?.isNativePlatform?.()) return;
  let scriptPromise;
  const requested = new WeakSet();

  function consented() { return window.qrlivreAdConsentGranted === true; }
  function loadScript() {
    if (scriptPromise) return scriptPromise;
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(config.publisherId)}`;
      script.onload = resolve;
      script.onerror = () => { script.remove(); scriptPromise = null; reject(new Error('AdSense indisponível')); };
      document.head.appendChild(script);
    });
    return scriptPromise;
  }

  function update() {
    const sections = document.querySelectorAll('[data-qrl-ad-placement]');
    if (!consented()) { sections.forEach(section => { section.hidden = true; }); return; }
    sections.forEach(section => {
      const placement = section.dataset.qrlAdPlacement;
      if (placement?.startsWith('blogIndex') && document.querySelectorAll('.article-card:not([hidden])').length < 4) {
        section.hidden = true;
        return;
      }
      if (requested.has(section)) { section.hidden = false; return; }
      const unit = config.slots?.[placement];
      if (!config.placements?.[placement] || !/^\d+$/.test(unit || '') || requested.has(section)) return;
      const ins = section.querySelector('ins.adsbygoogle');
      if (!ins) return;
      section.hidden = false;
      if (ins.getBoundingClientRect().width < 250) { section.hidden = true; return; }
      if (!('IntersectionObserver' in window)) return;
      const observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting) || requested.has(section)) return;
        observer.disconnect();
        requested.add(section);
        void loadScript().then(() => {
          if (section.isConnected && consented()) (window.adsbygoogle = window.adsbygoogle || []).push({});
        }).catch(() => { section.hidden = true; });
      }, { rootMargin: '120px' });
      observer.observe(ins);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', update, { once: true });
  else update();
  window.addEventListener('qrlivre:ads-consent-changed', update);
  document.addEventListener('qrlivre:blog-filter-updated', update);
})();
