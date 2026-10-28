import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnv, type Plugin } from 'vite';

/**
 * Integração exclusivamente no BUILD WEB:
 * - metatag de verificação do site com o ID AdSense configurado;
 * - ads.txt no artefato dist/ quando fornecido pelo publisher.
 * Não injeta o script de anúncios: os componentes AdSlot já cuidam disso
 * apenas em ambiente web e quando VITE_ADSENSE_ENABLED=true.
 */
export function adsenseWebPlugin(): Plugin {
  let client = '';
  let adsTxtLine = '';
  let root = process.cwd();

  return {
    name: 'qrlivre-adsense-web',
    configResolved(config) {
      root = config.root;
      const env = loadEnv(config.mode, config.root, '');
      client = (env.VITE_ADSENSE_CLIENT || '').trim();
      adsTxtLine = (env.ADSENSE_ADS_TXT_LINE || '').trim();
    },
    transformIndexHtml(html) {
      if (!/^ca-pub-\d{16}$/.test(client)) return html;
      // A metatag é inserida mesmo com banners desligados, para verificação do AdSense.
      if (html.includes('name="google-adsense-account"')) return html;
      return html.replace('</head>',
        `    <meta name="google-adsense-account" content="${client}" />\n  </head>`);
    },
    generateBundle() {
      // Se o dono do site criou public/ads.txt manualmente, preserve esse arquivo.
      if (existsSync(resolve(root, 'public/ads.txt')) || !adsTxtLine) return;

      const publisherId = /^ca-(pub-\d{16})$/.exec(client)?.[1];
      const match = /^google\.com,\s*(pub-\d{16}),\s*DIRECT,\s*f08c47fec0942fa0$/.exec(adsTxtLine);
      if (!publisherId || !match || match[1] !== publisherId) {
        this.error('ADSENSE_ADS_TXT_LINE deve conter a linha exata do seu AdSense e corresponder a VITE_ADSENSE_CLIENT.');
        return;
      }
      this.emitFile({ type: 'asset', fileName: 'ads.txt', source: `${adsTxtLine}\n` });
    },
  };
}
