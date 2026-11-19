import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { REVIEW_SCRIPT, shouldIncludeReviewScript, seoReviewPlugin } from './seo-vite-plugin.mjs';
const root=process.cwd(), dist=process.argv.includes('--dist'), domain='https://qrlivre.com.br';
const read=f=>readFile(join(root,f),'utf8');
const ads=JSON.parse(await read('config/web-ads.json'));
const expectedLine='google.com, pub-9294489692358309, DIRECT, f08c47fec0942fa0';
const output = dist?'dist':'public';
const htmlHome=await read(dist?'dist/index.html':'index.html');
const directTag=/<script\b[^>]*src=["']https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js[^"']*["']/gi;
const countTags=s=>(s.match(directTag)||[]).length;
const opts={command:'build',base:'/',mode:'production',ads:{...ads,enabled:false,siteApproved:false,publisherId:'ca-pub-9294489692358309'}};
assert.equal(shouldIncludeReviewScript(opts,{}),false);
assert.equal(shouldIncludeReviewScript(opts,{QRLIVRE_ADSENSE_REVIEW:'true'}),true);
assert.equal(shouldIncludeReviewScript(opts,{QRLIVRE_ADSENSE_REVIEW:'true',QRLIVRE_BUILD_TARGET:'android'}),false);
assert.equal(shouldIncludeReviewScript({...opts,mode:'android'},{QRLIVRE_ADSENSE_REVIEW:'true'}),false);
assert.equal(shouldIncludeReviewScript({...opts,command:'serve'},{QRLIVRE_ADSENSE_REVIEW:'true'}),false);
assert.equal(shouldIncludeReviewScript({...opts,ads:{...opts.ads,siteApproved:true}},{QRLIVRE_ADSENSE_REVIEW:'true'}),false);
assert.equal(shouldIncludeReviewScript({...opts,ads:{...opts.ads,enabled:true}},{QRLIVRE_ADSENSE_REVIEW:'true'}),false);
// Exercise actual Vite HTML transform in both modes; restore local environment afterwards.
const previous=process.env.QRLIVRE_ADSENSE_REVIEW, priorTarget=process.env.QRLIVRE_BUILD_TARGET;
try {
  process.env.QRLIVRE_ADSENSE_REVIEW='true'; delete process.env.QRLIVRE_BUILD_TARGET;
  const web=seoReviewPlugin();web.configResolved({root,command:'build',base:'/',mode:'production'});
  const expected=ads.enabled===false&&ads.siteApproved===false?1:0;
  assert.equal(countTags(web.transformIndexHtml(`<html><head>${REVIEW_SCRIPT}</head></html>`)),expected);
  process.env.QRLIVRE_BUILD_TARGET='android';
  const native=seoReviewPlugin();native.configResolved({root,command:'build',base:'/',mode:'production'});
  assert.equal(countTags(native.transformIndexHtml(`<html><head>${REVIEW_SCRIPT}</head></html>`)),0);
} finally {
  if(previous===undefined)delete process.env.QRLIVRE_ADSENSE_REVIEW;else process.env.QRLIVRE_ADSENSE_REVIEW=previous;
  if(priorTarget===undefined)delete process.env.QRLIVRE_BUILD_TARGET;else process.env.QRLIVRE_BUILD_TARGET=priorTarget;
}
const expectedSnippet=dist&&shouldIncludeReviewScript({...opts,ads},process.env)?1:0;
assert.equal(countTags(htmlHome),expectedSnippet,'Snippet AdSense: confira se o mesmo ambiente foi usado no build e no teste.');
const sitemap=await read(`${output}/sitemap.xml`);
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);assert.ok(urls.length>=12);assert.equal(new Set(urls).size,urls.length);
const titles=new Set(), descriptions=new Set();
function metadata(html,name){return [...html.matchAll(/<meta\b[^>]*>/gi)].filter(m=>new RegExp(`(?:name|property)=["']${name}["']`,'i').test(m[0])).map(m=>/content=["']([^"']*)["']/i.exec(m[0])?.[1]);}
const canonicalRE=/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
for(const url of urls){
  assert.ok(url.startsWith(domain+'/'));const path=new URL(url).pathname;
  const html=path==='/'?htmlHome:await read(`${output}${path}${path.endsWith('/')?'index.html':''}`);
  const can=[...html.matchAll(canonicalRE)];assert.equal(can.length,1,url+' canonical');assert.equal(can[0][1],url);
  const title=/<title>([^<]+)<\/title>/i.exec(html)?.[1];assert.ok(title && !titles.has(title),url+' title');titles.add(title);
  const desc=metadata(html,'description');assert.equal(desc.length,1,url+' description');assert.ok(desc[0]&&!descriptions.has(desc[0]),url+' description duplicada');descriptions.add(desc[0]);
  if(path!=='/privacidade.html'){
    assert.equal(metadata(html,'og:image').length,1,url+' imagem social');
    assert.equal(metadata(html,'og:url')[0],url);assert.equal(metadata(html,'twitter:card')[0],'summary');
    assert.equal(metadata(html,'og:locale')[0],'pt_BR');
  }
  if(path==='/')assert.equal(metadata(html,'google-adsense-account')[0],ads.publisherId);
  if(path!=='/')assert.equal(countTags(html),0,url+' script de revisão indevido');
  if(/^\/blog\/.+\/$/.test(path)){
    const parsed=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]+?)<\/script>/g)].map(m=>JSON.parse(m[1]));
    assert.equal(parsed.length,1);const types=parsed[0]['@graph'].map(x=>x['@type']);assert.ok(types.includes('BlogPosting')&&types.includes('BreadcrumbList'),url);
    assert.match(html,/aria-current="page"/);assert.equal(metadata(html,'google-adsense-account')[0],ads.publisherId);
  }
}
assert.ok((await stat(resolve(root,output,'icons/icon-512.png'))).size>0);
assert.ok((await read(`${output}/ads.txt`)).split(/\r?\n/).some(x=>x.trim().replace(/\s*,\s*/g,', ')===expectedLine));
assert.match(await read(`${output}/robots.txt`),/Sitemap: https:\/\/qrlivre\.com\.br\/sitemap\.xml/);
const pkg=JSON.parse(await read('package.json'));
for(const k of ['android:init','android:sync'])if(pkg.scripts[k])assert.match(pkg.scripts[k],/npm run build:android/);
console.log(`[QR Livre] SEO validado (${dist?'dist':'fonte'}): ${urls.length} URLs, títulos/canônicas únicos, dados estruturados, ads.txt e isolamento Android. Script direto=${expectedSnippet===1}.`);
