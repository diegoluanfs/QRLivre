/* QR Livre v1.6 — GA4 direto, opcional. Não é consentimento para publicidade. */
(() => {
  'use strict';
  if (window.Capacitor?.isNativePlatform?.() || window.__qrlAnalyticsV16) return;
  const ID = 'G-1NNWXVJLZR';
  const KEY = 'qrlivre-metrics-choice-v1'; // mantém a escolha já feita para a mesma finalidade
  const production = location.protocol === 'https:' && ['qrlivre.com.br', 'www.qrlivre.com.br'].includes(location.hostname);
  const preview = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  if (!production && !preview) return;
  const canonical = document.querySelector('link[rel="canonical"]')?.href;
  // Apenas páginas conhecidas do portal. Não usa valores de formulários, query strings ou fragmentos.
  let page;
  try {
    const url = new URL(canonical);
    if (url.origin === 'https://qrlivre.com.br' && /^\/(?:blog\/(?:[a-z0-9-]+\/)?|sobre\.html|privacidade\.html)?$/.test(url.pathname)) page = url.origin + url.pathname;
  } catch { /* página sem canônica */ }
  if (!page) return;
  window.__qrlAnalyticsV16 = true;
  const denied = { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
  let choice = null, started = false, banner;
  try { choice = localStorage.getItem(KEY); } catch { /* browser sem armazenamento */ }
  if (!['accepted', 'rejected'].includes(choice)) choice = null;
  const disabledKey = 'ga-disable-' + ID;
  function gtag() { window.dataLayer.push(arguments); }
  function start() {
    if (!production || choice !== 'accepted' || started) return;
    // Não execute uma segunda instalação caso uma tag externa ainda exista.
    if (document.querySelector('script[src*="googletagmanager.com/gtm.js"],script[src*="googletagmanager.com/gtag/js"]') || typeof window.gtag === 'function') { console.warn('[QR Livre] Tag Google já presente; verifique duplicidade.'); return; }
    started = true;
    window[disabledKey] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = gtag;
    gtag('consent', 'default', { ...denied });
    gtag('consent', 'update', { ...denied, analytics_storage: 'granted' });
    gtag('js', new Date());
    let referrer = '';
    try { const r = new URL(document.referrer); if (['https:', 'http:'].includes(r.protocol)) referrer = r.origin + '/'; } catch {}
    // Configuração global do documento e da propriedade. Nenhum dado do gerador é incluído.
    const context = { page_location: page, page_referrer: referrer };
    gtag('set', context);
    gtag('config', ID, { ...context, send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, cookie_flags: 'SameSite=Lax;Secure' });
    gtag('event', 'page_view', { ...context, send_to: ID });
    const script = document.createElement('script');
    script.id = 'qrlivre-ga4-script'; script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    script.referrerPolicy = 'strict-origin-when-cross-origin';
    script.addEventListener('error', () => console.warn('[QR Livre] Analytics indisponível nesta página.'));
    document.head.appendChild(script);
  }
  function stop() {
    if (!started) return;
    window[disabledKey] = true;
    gtag('consent', 'update', { ...denied });
    // Cookies do GA4 criados por esta integração (escopo raiz).
    for (const name of ['_ga', '_ga_' + ID.slice(2)]) {
      for (const domain of ['', 'domain=qrlivre.com.br;', 'domain=' + location.hostname + ';']) {
        try { document.cookie = name + '=; Max-Age=0; path=/; ' + domain + ' SameSite=Lax; Secure'; } catch {}
      }
    }
    location.reload(); // encerra a tag já carregada nesta página
  }
  function choose(value, persist = true) {
    const previous = choice; choice = value;
    if (persist) { try { localStorage.setItem(KEY, value); } catch {} }
    if (banner) banner.hidden = true;
    if (value === 'accepted') start();
    else if (previous === 'accepted') stop();
  }
  function setup() {
    banner = document.createElement('aside');
    banner.className = 'qrl-consent'; banner.setAttribute('role', 'region'); banner.setAttribute('aria-label', 'Preferências de métricas');
    banner.innerHTML = '<p><strong>Privacidade no QR Livre</strong><span>Com sua autorização, usamos Google Analytics para entender o uso do site. Você pode recusar e continuar usando todas as ferramentas.</span><a href="/privacidade.html">Saiba mais</a></p><div class="qrl-consent-actions"><button type="button" data-qrl-reject>Não aceitar</button><button type="button" data-qrl-accept>Aceitar métricas</button></div>';
    const style = document.createElement('style');
    style.textContent = '.qrl-consent{position:fixed;inset:auto 16px 16px 16px;max-width:760px;margin:auto;z-index:99999;background:#fff;border:1px solid #d8e5dc;box-shadow:0 18px 58px #122e2470;border-radius:18px;padding:17px 20px;display:flex;align-items:center;gap:22px;font:14px/1.55 system-ui,-apple-system,Segoe UI,sans-serif;color:#183b31;box-sizing:border-box}.qrl-consent[hidden]{display:none!important}.qrl-consent p{margin:0;flex:1}.qrl-consent strong,.qrl-consent span{display:block}.qrl-consent strong{font-size:15px;margin-bottom:4px}.qrl-consent span{font-size:13px;color:#5d7566}.qrl-consent a{font-size:13px;color:#276747;text-decoration:underline}.qrl-consent-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:end}.qrl-consent button{border:1px solid #174c37;background:#fff;color:#174c37;border-radius:9px;padding:10px 12px;min-height:42px;font:700 13px system-ui;cursor:pointer}.qrl-consent button:focus-visible{outline:3px solid #367748;outline-offset:2px}@media(max-width:620px){.qrl-consent{display:block;padding:15px}.qrl-consent-actions{justify-content:stretch;margin-top:12px}.qrl-consent button{flex:1}}';
    document.head.appendChild(style);
    document.body.appendChild(banner);
    banner.hidden = choice !== null;
    banner.querySelector('[data-qrl-accept]').addEventListener('click', () => choose('accepted'));
    banner.querySelector('[data-qrl-reject]').addEventListener('click', () => choose('rejected'));
    document.addEventListener('click', e => { const trigger = e.target?.closest?.('[data-open-privacy-settings]'); if (trigger) { e.preventDefault(); banner.hidden = false; banner.querySelector('[data-qrl-reject]').focus(); } });
    window.addEventListener('storage', e => { if (e.key === KEY) { if (['accepted', 'rejected'].includes(e.newValue)) choose(e.newValue, false); else { const previous = choice; choice = null; if (previous === 'accepted') stop(); else banner.hidden = false; } } });
    if (choice === 'accepted') start();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true }); else setup();
})();
