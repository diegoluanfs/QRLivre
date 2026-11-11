import { readFile, readdir, mkdir, writeFile, copyFile, rm } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Execute a partir da raiz do QR Livre. Saídas geradas em public/ são ignoradas pelo Git.
const root = process.cwd();
const contentDir = resolve(root, 'content/blog');
const outDir = resolve(root, 'public/blog');
const domain = (process.env.SITE_URL || 'https://qrlivre.com.br').replace(/\/$/, '');

// QR-LIVRE-WEB-ADS-V14 — uma configuração central para React e HTML estático.
const webAds = JSON.parse(await readFile(resolve(root,'config/web-ads.json'),'utf8'));
const webAdsActive = webAds.enabled===true && webAds.siteApproved===true && webAds.privacyIntegrationReady===true && /^ca-pub-\d{16}$/.test(webAds.publisherId);
function webAd(placement,kind='article') {
  const unit=webAds.slots?.[placement];
  if (!webAdsActive || webAds.placements?.[placement]!==true || !/^\d+$/.test(unit||'')) return '';
  return `<section class="qrl-ad qrl-ad--${kind}" data-qrl-ad-placement="${placement}" hidden aria-label="Publicidade"><span class="qrl-ad__label">Publicidade</span><ins class="adsbygoogle" style="display:block" data-ad-client="${esc(webAds.publisherId)}" data-ad-slot="${esc(unit)}" data-ad-format="auto" data-full-width-responsive="true"></ins></section>`;
}
function withMiddleAd(html) {
  const slot=webAd('articleMiddle');
  if(!slot) return html;
  const positions=[...html.matchAll(/<\/p>/g)];
  if(positions.length<6) return html;
  const at=positions[Math.floor(positions.length/2)].index+4;
  return html.slice(0,at)+'\n'+slot+'\n'+html.slice(at);
}

const nav = [
  ['Gerador', '/'], ['Blog', '/blog/'], ['Como funciona', '/#como-funciona'],
  ['Sobre', '/sobre.html'], ['Privacidade', '/privacidade.html'],
];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const slugify = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function inline(raw) {
  // Conteúdo editorial local; mesmo assim escapamos HTML antes da formatação.
  let s = esc(raw);
  s = s.replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+|\/[^\s)]*)\)/g, (_, label, href) => `<a href="${esc(href)}"${href.startsWith('http') ? ' rel="noopener noreferrer" target="_blank"' : ''}>${label}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  return s;
}
function parse(input, filename) {
  const match = /^---\r?\n([\s\S]+?)\r?\n---\r?\n([\s\S]*)$/.exec(input);
  if (!match) throw Error(`${filename}: frontmatter ausente`);
  const meta = Object.fromEntries(match[1].split(/\r?\n/).filter(Boolean).map(line => {
    const idx = line.indexOf(':');
    if (idx < 1) throw Error(`${filename}: metadado invalido: ${line}`);
    return [line.slice(0,idx).trim(),line.slice(idx+1).trim().replace(/^['"]|['"]$/g,'')];
  }));
  for (const key of ['title','description','category','date','slug']) if (!meta[key]) throw Error(`${filename}: ${key} obrigatorio`);
  if (!/^[a-z0-9-]+$/.test(meta.slug) || !/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) throw Error(`${filename}: slug/data invalidos`);
  if (meta.description.length > 180) throw Error(`${filename}: descricao longa demais`);
  return { ...meta, body:match[2].trim(), wordCount:match[2].split(/\s+/).length };
}
function renderMarkdown(md) {
  const lines=md.replace(/\r/g,'').split('\n');
  const out=[]; const sections=[];
  let para=[], list=null;
  function flushPara(){ if(para.length) {out.push(`<p>${inline(para.join(' '))}</p>`);para=[];} }
  function closeList(){ if(list){out.push(`</${list}>`);list=null;} }
  for (const line of [...lines, '']) {
    if (!line.trim()) {flushPara();closeList();continue;}
    const heading=/^(#{2,3})\s+(.+)$/.exec(line);
    if(heading){flushPara();closeList();const level=heading[1].length;const title=heading[2];const id=slugify(title);out.push(`<h${level} id="${id}">${inline(title)}</h${level}>`);if(level===2)sections.push({id,title});continue;}
    const bullet=/^[-*]\s+(.+)$/.exec(line), numbered=/^\d+\.\s+(.+)$/.exec(line);
    if(bullet || numbered){flushPara();const next=bullet?'ul':'ol';if(list!==next){closeList();out.push(`<${next}>`);list=next;}out.push(`<li>${inline((bullet||numbered)[1])}</li>`);continue;}
    if(/^>\s+/.test(line)){flushPara();closeList();out.push(`<blockquote>${inline(line.replace(/^>\s+/,''))}</blockquote>`);continue;}
    closeList();para.push(line.trim());
  }
  return { html:out.join('\n'), sections };
}
function shell({title,description,path,body,ogtype='website',jsonld='',isArticle=false}) {
  const url=`${domain}${path}`;
  const navHtml=nav.map(([label,href])=>`<a class="${href==='/blog/' && path.startsWith('/blog/')?'selected':''}" href="${href}">${esc(label)}</a>`).join('');
  return `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#11352e"><meta name="robots" content="index,follow,max-image-preview:large">
<title>${esc(title)} | QR Livre</title><meta name="description" content="${esc(description)}">
<meta property="og:type" content="${ogtype}"><meta property="og:site_name" content="QR Livre">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}"><link rel="canonical" href="${esc(url)}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="stylesheet" href="/blog/blog.css"><link rel="stylesheet" href="/assets/qrlivre-web-ads.css">
${jsonld?`<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g,'\\u003c')}</script>`:''}
</head><body class="${isArticle?'article-page':''}">
<header class="topbar"><div class="wrap top-inner"><a class="brand" href="/" aria-label="QR Livre — início"><span class="brand-icon" aria-hidden="true">▦</span><span>QR<span class="brand-light">Livre</span><b>.</b></span></a><nav aria-label="Navegação principal">${navHtml}</nav><a class="top-cta" href="/">Criar QR Code <span aria-hidden="true">↗</span></a></div></header>
${body}
<footer class="footer"><div class="wrap footer-inner"><div><a class="brand" href="/"><span class="brand-icon" aria-hidden="true">▦</span><span>QR<span class="brand-light">Livre</span><b>.</b></span></a><p>Ferramentas gratuitas e informações para usar QR Codes com confiança.</p></div><div class="footer-links"><a href="/">Gerador</a><a href="/blog/">Blog</a><a href="/sobre.html">Sobre</a><a href="/privacidade.html">Privacidade</a><button type="button" data-open-privacy-settings>Preferências de métricas</button></div></div><div class="wrap footer-copy">© ${new Date().getFullYear()} QR Livre · Ferramenta gratuita · Conteúdo educativo</div></footer>
<script defer src="/assets/qrlivre-ads-config.js"></script>
<script defer src="/assets/qrlivre-web-ads.js"></script>
<script defer src="/assets/qrlivre-consent.js"></script>
</body></html>`;
}
async function main() {
  await mkdir(resolve(root,'public/assets'),{recursive:true});
  await copyFile(resolve(root,'site/web-ads-runtime.js'),resolve(root,'public/assets/qrlivre-web-ads.js'));
  await copyFile(resolve(root,'site/web-ads.css'),resolve(root,'public/assets/qrlivre-web-ads.css'));
  await writeFile(resolve(root,'public/assets/qrlivre-ads-config.js'), 'window.qrlivreWebAdsConfig = '+JSON.stringify(webAds)+';\n');
  const files=(await readdir(contentDir)).filter(f=>f.endsWith('.md')).sort();
  if(!files.length) throw Error('Nenhum artigo em content/blog');
  const articles=await Promise.all(files.map(async f=>parse(await readFile(join(contentDir,f),'utf8'),f)));
  const slugs=new Set(); for(const a of articles){if(slugs.has(a.slug))throw Error(`Slug duplicado: ${a.slug}`);slugs.add(a.slug);if(a.wordCount<250)throw Error(`Artigo superficial (<250 palavras): ${a.slug}`);}
  articles.sort((a,b)=>b.date.localeCompare(a.date));
  await rm(outDir,{recursive:true,force:true}); await mkdir(outDir,{recursive:true});
  await copyFile(resolve(root,'site/blog.css'),join(outDir,'blog.css'));
  for (const a of articles) {
    const {html:markdownHtml,sections}=renderMarkdown(a.body);
    const html=withMiddleAd(markdownHtml);
    const url=`/blog/${a.slug}/`;
    const toc=sections.length?`<aside class="toc" aria-label="Neste artigo"><strong>Neste artigo</strong>${sections.map(s=>`<a href="#${s.id}">${esc(s.title)}</a>`).join('')}</aside>`:'';
    const related=articles.filter(x=>x.slug!==a.slug && x.category===a.category).slice(0,2);
    const others=(related.length?related:articles.filter(x=>x.slug!==a.slug).slice(0,2));
    const relatedHtml=others.map(x=>`<a class="related" href="/blog/${esc(x.slug)}/"><span>${esc(x.category)}</span><strong>${esc(x.title)}</strong><span class="read-arrow">Ler artigo ↗</span></a>`).join('');
    const jsonld={"@context":"https://schema.org","@type":"BlogPosting",headline:a.title,description:a.description,datePublished:a.date,dateModified:a.date,inLanguage:'pt-BR',mainEntityOfPage:`${domain}${url}`,author:{"@type":"Organization",name:'QR Livre'},publisher:{"@type":"Organization",name:'QR Livre',url:domain}};
    const body=`<main id="conteudo"><section class="article-hero"><div class="wrap"><a href="/blog/" class="back-link">← Voltar ao blog</a><div class="article-category">${esc(a.category)}</div><h1>${esc(a.title)}</h1><p class="article-lead">${esc(a.description)}</p><div class="byline"><span>Por Equipe QR Livre</span><span>Publicado em <time datetime="${a.date}">${new Intl.DateTimeFormat('pt-BR',{dateStyle:'long',timeZone:'UTC'}).format(new Date(`${a.date}T12:00:00Z`))}</time></span><span>${Math.max(2,Math.ceil(a.wordCount/210))} min de leitura</span></div></div></section><div class="wrap article-grid"><article class="article-content">${html}<div class="article-cta"><span>Coloque o conteúdo em prática</span><h2>Crie um QR Code gratuitamente</h2><p>Faça um teste com seus dados e confira a leitura antes de compartilhar ou imprimir.</p><a href="/">Abrir gerador gratuito ↗</a></div></article>${toc}</div><section class="wrap related-section"><div class="section-heading"><span>CONTINUE APRENDENDO</span><h2>Outras leituras úteis</h2></div><div class="related-grid">${relatedHtml}</div></section>${webAd('articleEnd')}</main>`;
    const dir=join(outDir,a.slug);await mkdir(dir,{recursive:true});await writeFile(join(dir,'index.html'),shell({title:a.title,description:a.description,path:url,body,ogtype:'article',jsonld,isArticle:true}));
  }
  const cats=[...new Set(articles.map(a=>a.category))];
  const cards=articles.map((a,i)=>`<a class="article-card" href="/blog/${esc(a.slug)}/" data-title="${esc((a.title+' '+a.description).toLowerCase())}" data-category="${esc(a.category)}"><div class="card-visual visual-${i%4}" aria-hidden="true"><span>${['▦','◇','▤','↗'][i%4]}</span><span>QR Livre / ${String(i+1).padStart(2,'0')}</span></div><div class="card-body"><span class="pill">${esc(a.category)}</span><h2>${esc(a.title)}</h2><p>${esc(a.description)}</p><div class="card-end"><span>${Math.max(2,Math.ceil(a.wordCount/210))} min de leitura</span><span>Ler artigo ↗</span></div></div></a>`).join('');
  let cardNumber=0;
  const cardsWithAds=cards.replace(/<\/a>/g, endTag => {
    cardNumber+=1;
    return cardNumber===3 ? endTag+webAd('blogIndexFirst','grid') : endTag;
  });
  const listingBody=`<main><section class="blog-hero"><div class="wrap blog-hero-inner"><div><span class="eyebrow">CONHECIMENTO QUE VOCÊ USA</span><h1>Ideias que conectam <em>pessoas e negócios.</em></h1><p>Aprenda a criar, compartilhar e aplicar QR Codes com orientações práticas, exemplos e cuidados de segurança.</p><a class="blog-cta" href="/">Criar meu QR Code ↗</a></div><div class="hero-graphic" aria-hidden="true"><span>▦</span><div>Conhecimento<br>em cada código.</div></div></div></section><section class="wrap library"><div class="section-heading"><span>EXPLORE NOSSO CONTEÚDO</span><h2>Guias e aplicações práticas</h2><p>Conteúdo educativo próprio do QR Livre, organizado para facilitar suas próximas decisões.</p></div><div class="filters"><label for="blog-search" class="sr-only">Buscar artigos</label><input id="blog-search" type="search" placeholder="Buscar guias e assuntos…" autocomplete="off"/><div class="category-filter" role="group" aria-label="Filtrar por categoria"><button class="active" type="button" data-filter="Todos">Todos</button>${cats.map(c=>`<button type="button" data-filter="${esc(c)}">${esc(c)}</button>`).join('')}</div></div><div class="cards" id="blog-cards">${cardsWithAds}</div><p id="blog-empty" class="empty" hidden>Nenhum artigo encontrado. Experimente outro termo.</p></section>${webAd('blogIndexLast','blog')}<section class="wrap callout"><div><span>PRONTO PARA TESTAR?</span><h2>Da ideia para o QR Code em segundos.</h2><p>Use o gerador gratuito, personalize e baixe seus códigos sem criar uma conta.</p></div><a href="/">Abrir o gerador ↗</a></section></main><script defer src="/blog/blog-filter.js"></script>`;
  await writeFile(join(outDir,'index.html'),shell({title:'Blog — QR Codes para pessoas e negócios',description:'Tutoriais e exemplos práticos sobre QR Codes, Pix, Wi-Fi, impressão, segurança e uso em negócios.',path:'/blog/',body:listingBody,jsonld:{'@context':'https://schema.org','@type':'Blog',name:'Blog QR Livre',url:`${domain}/blog/`,inLanguage:'pt-BR'}}));
  await copyFile(resolve(root,'site/blog-filter.js'),join(outDir,'blog-filter.js'));
  const about=`<main class="wrap about"><span class="eyebrow">SOBRE O PROJETO</span><h1>QR Livre: compartilhar informações deveria ser simples.</h1><p class="lead">O QR Livre é uma ferramenta gratuita para criar QR Codes diretamente no dispositivo, acompanhada de materiais educativos sobre usos responsáveis dessa tecnologia.</p><section class="about-cards"><div><h2>O que fazemos</h2><p>Facilitamos a geração de códigos para links, Wi-Fi, mensagens, contatos e Pix estático. Também publicamos tutoriais para ajudar pessoas e negócios a aplicar QR Codes de forma acessível.</p></div><div><h2>Como funciona</h2><p>O gerador é desenvolvido com tecnologias web e processa o conteúdo do código no navegador, sem exigir conta. O site é disponibilizado por HTTPS.</p></div><div><h2>Nosso compromisso</h2><p>Priorizamos clareza, acessibilidade e orientações de segurança. Cada QR Code deve ser testado antes de ser impresso ou utilizado para pagamentos.</p></div></section><h2>Quem mantém o projeto?</h2><p>O QR Livre é um projeto independente. O código e informações técnicas podem ser encontrados no <a href="https://github.com/diegoluanfs/QRLivre" rel="noopener noreferrer" target="_blank">repositório público no GitHub</a>, onde também é possível comunicar problemas. Os artigos são disponibilizados como orientação geral e não substituem a conferência dos dados em serviços de destino.</p><h2>Fale sobre um problema ou melhoria</h2><p>Para relatar um erro, sugerir tema ou propor melhoria, utilize as <a href="https://github.com/diegoluanfs/QRLivre/issues" rel="noopener noreferrer" target="_blank">issues do repositório</a>. Você também pode consultar nossa <a href="/privacidade.html">Política de Privacidade</a> e começar no <a href="/">gerador gratuito</a>.</p></main>`;
  await writeFile(resolve(root,'public/sobre.html'),shell({title:'Sobre o QR Livre',description:'Conheça o QR Livre, uma ferramenta gratuita para criar QR Codes e aprender formas responsáveis de utilizá-los.',path:'/sobre.html',body:about}));
  const sitemap=[{loc:`${domain}/`,lastmod:articles[0].date},{loc:`${domain}/blog/`,lastmod:articles[0].date},{loc:`${domain}/sobre.html`,lastmod:articles[0].date},{loc:`${domain}/privacidade.html`,lastmod:articles[0].date},...articles.map(a=>({loc:`${domain}/blog/${a.slug}/`,lastmod:a.date}))];
  await writeFile(resolve(root,'public/sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.map(u=>`  <url><loc>${esc(u.loc)}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  await writeFile(resolve(root,'public/robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${domain}/sitemap.xml\n`);
  console.log(`[QR Livre] ${articles.length} artigos + indice + pagina sobre + sitemap/robots gerados.`);
}
main().catch(e=>{console.error('[QR Livre] Falha no build do blog:',e);process.exitCode=1;});
