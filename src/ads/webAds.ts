/** Carrega o script uma única vez, exclusivamente no navegador web e com configuração válida. */
let scriptPromise: Promise<void> | null = null;

export function loadAdSense(client: string): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.dataset.qrlivreAdsense = 'true';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      scriptPromise = null;
      reject(new Error('Não foi possível carregar o Google AdSense.'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, never>>;
  }
}

export function requestDisplayAd(): void {
  (window.adsbygoogle = window.adsbygoogle || []).push({});
}
