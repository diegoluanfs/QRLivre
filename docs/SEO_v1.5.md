> **Atualização v1.6 — Analytics:** o contêiner GTM foi substituído pelo GA4 direto. Consulte [ANALYTICS_v1.6.md](ANALYTICS_v1.6.md) para a configuração vigente. As instruções antigas abaixo são históricas.

# QR Livre — SEO e revisão AdSense v1.5

Complemento incremental para v1.4. Não altera os artigos Markdown, o GTM, os IDs de banner, os dados do gerador, as configurações nativas ou o estado de aprovação.

## O que melhora

- Título da home voltado à busca, descrição específica, canonical, Open Graph e Twitter Cards usando o ícone já publicado. H1 visível ajustado quando o texto original está presente.
- JSON-LD WebSite, Organization, WebApplication e BlogPosting; breadcrumbs visíveis e dados estruturados correspondentes nos artigos. Sem avaliações inventadas.
- Sitemap com URLs canônicas e datas dos artigos, sem inventar datas de atualização nas outras páginas. Blog continua estático. Política de privacidade ganha descrição, canonical e explicação do script opcional.
- Fallback de navegação quando JavaScript está desativado. Não é SSR do gerador.
- Meta de verificação na home e blog, `public/ads.txt` com linha do publisher informado (preserva outras entradas). Confirme a linha exata no painel AdSense.

## Código de verificação

A metatag e o ads.txt estão disponíveis sem carregar JavaScript de publicidade. O snippet oficial está em `scripts/seo-vite-plugin.mjs` e só entra no `<head>` da home compilada se `QRLIVRE_ADSENSE_REVIEW=true`, o build é web, o publisher corresponde, o site ainda não consta aprovado e os blocos continuam desligados. O build padrão não faz essa conexão externa. Nenhum anúncio manual é solicitado por este plugin. O código direto pode comunicar dados técnicos ao Google antes da escolha de métricas; não é uma CMP nem equivale a consentimento. Configure os requisitos de privacidade aplicáveis antes de utilizá-lo. Se isso ainda não foi feito, use a verificação por metatag ou ads.txt.

Antes de habilitar o snippet, confirme que **Anúncios automáticos estão desligados** no painel do AdSense para qrlivre.com.br. O JSON local não controla os anúncios automáticos do painel do Google. Confirme também que a verificação por snippet é necessária. Para ativar, adicione a variável de **build** `QRLIVRE_ADSENSE_REVIEW=true` na Cloudflare e faça novo deploy. Após a revisão, retire essa variável (ou defina false) e use somente a configuração controlada de blocos da v1.4 com consentimento adequado. Não coloque a variável nos arquivos .env: este controle lê o ambiente do processo de build.

Teste local da opção, PowerShell (não clique em anúncios nem ative blocos reais):

```powershell
$env:QRLIVRE_ADSENSE_REVIEW = 'true'
npm run build
npm run check:seo:dist
Remove-Item Env:\QRLIVRE_ADSENSE_REVIEW
npm run build
npm run check:seo:dist
```

`npm run android:init` e `npm run android:sync` agora usam `npm run build:android` para manter o script fora do bundle nativo inclusive se a variável de revisão estiver presente. Ao sincronizar o Android, use sempre `npm run android:sync`, e não `npx cap sync android` após um build web com o snippet.

## Validação e publicação

```powershell
npm run check:seo
npm run check:blog
npm run check:ads
npm run test
npm run build
npm run check:seo:dist
npm run dev
```

Execute os testes usando a URL de produção padrão. Verifique as páginas na Cloudflare depois de publicar: a canonical deve corresponder à URL final após redirecionamentos. A política /privacidade.html e /sobre.html foram preservadas; se a hospedagem canonicalizar extensões para outras URLs, ajuste o sitemap e links de maneira coordenada. Não alteramos o Worker nem o comportamento da PWA.

Search Console: use a propriedade de domínio, envie `https://qrlivre.com.br/sitemap.xml`, inspecione home/blog/artigos e solicite indexação quando pertinente. Confira o relatório de indexação, links e Core Web Vitals. Teste em https://pagespeed.web.dev/ e https://search.google.com/test/rich-results. Não há garantia de ranking, rich results ou aprovação do AdSense. Revise conteúdo editorial e exemplos reais antes da nova solicitação.

Fontes: https://developers.google.com/search/docs/fundamentals/seo-starter-guide ; https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap ; https://support.google.com/adsense/answer/12169212?hl=pt-BR ; https://support.google.com/adsense/answer/13554116?hl=pt-BR
