import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const REVIEW_SCRIPT = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9294489692358309" crossorigin="anonymous"></script>';
// Separate from ad slots: the direct tag is optional and only for the website review.
export function shouldIncludeReviewScript({ command, base, mode, ads }, env) {
  return command === 'build' && base === '/' && mode !== 'android' &&
    env.QRLIVRE_BUILD_TARGET !== 'android' && env.QRLIVRE_ADSENSE_REVIEW === 'true' &&
    ads.publisherId === 'ca-pub-9294489692358309' && ads.enabled === false && ads.siteApproved === false;
}
export function seoReviewPlugin() {
  let include = false;
  return {
    name: 'qrlivre-seo-review',
    configResolved(config) {
      const ads = JSON.parse(readFileSync(resolve(config.root, 'config/web-ads.json'), 'utf8'));
      include = shouldIncludeReviewScript({ command: config.command, base: config.base, mode: config.mode, ads }, process.env);
    },
    transformIndexHtml(html) {
      // Never accept a hardcoded direct tag that could also end up in the native build.
      const clean = html.replace(/<script\b(?=[^>]*\bsrc=["']https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js(?:\?[^"']*)?["'])[^>]*>\s*<\/script>\s*/gi, '');
      return include ? clean.replace(/<\/head>/i, `    ${REVIEW_SCRIPT}\n  </head>`) : clean;
    },
  };
}
