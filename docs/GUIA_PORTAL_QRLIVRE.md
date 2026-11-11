# QR Livre v1.3 — Portal e blog

## O que muda

- Adiciona `/blog/` e nove artigos em páginas HTML estáticas com navegação, categorias, busca local, índice de tópicos e links internos.
- Inclui `/sobre.html`, `sitemap.xml`, `robots.txt` e metadados (canonical, Open Graph e BlogPosting JSON-LD).
- Adiciona cards de conteúdo na home. Mantém o QR Code, Android e AdMob.
- Remove os banners da página do gerador durante a revisão do AdSense; não há anúncios de terceiros nos artigos.
- Gerencia o carregamento opcional de `GTM-NSP5WG4F`: só carrega após consentimento explícito para métricas.
- Atualiza a política de privacidade para declarar o GTM opcional e o projeto independente.

## Instalação (PowerShell)

Coloque o ZIP em `C:\Users\diego\Desktop\projetos`, extraia e execute, com Node.js disponível:

```powershell
cd C:\Users\diego\Desktop\projetos
Expand-Archive -Path .\QR-Livre-Portal-v1.3.zip -DestinationPath .\QR-Livre-Portal-v1.3 -Force
node .\QR-Livre-Portal-v1.3\INSTALAR_ATUALIZACAO.mjs "C:\Users\diego\Desktop\projetos\QRLivre"

cd .\QRLivre
npm run check:blog
npm run test
npm run build
npm run dev
```

O instalador gera backup dos arquivos existentes em pasta ao lado de `QRLivre`. Os artigos em `content/blog/*.md` são *arquivos-fonte* versionados; a pasta `public/blog/` é gerada automaticamente por `npm run build` ou `npm run dev`.

## Git e Cloudflare

Verifique localmente `/blog/`, `/blog/qr-code-para-pequenos-negocios/`, `/sobre.html` e `/privacidade.html`. Depois:

```powershell
git status
git diff --check
git add .gitignore package.json index.html src/App.tsx src/main.tsx src/style.css src/components/BlogHighlights.tsx public/privacidade.html public/assets/qrlivre-consent.js content/blog scripts/build-blog.mjs scripts/test-blog.mjs site docs/GUIA_PORTAL_QRLIVRE.md
git diff --cached --check
git commit -m "feat(web): adiciona portal editorial, blog estatico, SEO e consentimento para metricas"
git push origin main
```

A Cloudflare deve executar `npm run build`, que agora roda automaticamente o gerador do blog (`prebuild`). Confirme que `wrangler.jsonc` ainda aponta `assets.directory` para `./dist`.

Se o projeto não possui rotas SPA públicas além da home, considere alterar `assets.not_found_handling` de `single-page-application` para `404-page` no Wrangler e publicar uma página 404 específica. Faça isso somente após testar as rotas existentes.

## Google Tag Manager e GA4

O identificador `GTM-NSP5WG4F` é um **contêiner do Google Tag Manager**, não uma propriedade GA4. Entre em https://tagmanager.google.com, configure uma tag do GA4 com o ID de medição `G-...`, publique o contêiner e valide no Tag Assistant / tempo real do Analytics.

O site só carrega o script GTM após o visitante aceitar as métricas. O visitante pode rever essa escolha pelo rodapé. Se recusar, o Tag Manager não é carregado pelo script novo. Essa implementação **não substitui uma CMP certificada para anúncios**.

## AdSense e revisão editorial

Mantenha `VITE_ADSENSE_ENABLED=false` enquanto o site estiver em revisão e não publique banners em páginas com pouco conteúdo. Os textos incluídos são rascunhos editoriais completos, mas **devem ser revisados por uma pessoa antes de uma nova solicitação ao AdSense**. Acrescente capturas de tela reais do gerador, exemplos testados, fontes quando necessário e uma forma de contato adequada ao produto. A aprovação nunca é garantida.

Mantenha os dados pessoais usados em `VITE_*` restritos a identificadores públicos: não coloque tokens ou senhas no frontend.

## Verificações após deploy

- https://qrlivre.com.br/blog/
- https://qrlivre.com.br/blog/o-que-e-qr-code/
- https://qrlivre.com.br/sobre.html
- https://qrlivre.com.br/sitemap.xml
- https://qrlivre.com.br/robots.txt
- https://qrlivre.com.br/privacidade.html

Configure o sitemap no Google Search Console e confira a indexação após o deploy. Valide no DevTools que `googletagmanager.com` não é solicitado **antes** do consentimento e que a página continua funcional depois de recusar métricas.

## Observações sobre a versão Android

A versão React continua utilizando as mesmas opções de QR Code e a integração do AdMob. A nova navegação do blog é exibida somente na Web; as páginas estáticas são geradas durante o build para a Cloudflare. Não substitua sua pasta `android/` pela versão antiga de qualquer pacote.
