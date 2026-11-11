import { readFile, readdir, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { join, resolve } from 'node:path';
const root=process.cwd();
const listDir=resolve(root,'public/blog');
const articles=(await readdir(listDir,{withFileTypes:true})).filter(x=>x.isDirectory());
assert.ok(articles.length>=8,`Esperados ao menos 8 artigos, obtidos: ${articles.length}`);
let count=0;
for(const dir of articles){
  const file=join(listDir,dir.name,'index.html');
  const html=await readFile(file,'utf8');
  assert.match(html,/<h1>[^<]+<\/h1>/);
  assert.match(html,/<link rel="canonical" href="https:\/\/qrlivre\.com\.br\/blog\//);
  assert.match(html,/application\/ld\+json/);
  assert.match(html,/<article class="article-content">/);
  assert.doesNotMatch(html,/class="adsbygoogle"/);
  assert.ok((html.match(/<p>/g)||[]).length >= 7,`${dir.name}: conteúdo insuficiente`);
  count++;
}
for(const file of ['public/blog/index.html','public/sobre.html','public/sitemap.xml','public/robots.txt','public/assets/qrlivre-consent.js'])assert.ok((await stat(join(root,file))).size>30,`${file}: arquivo ausente`);
const index=await readFile(join(root,'index.html'),'utf8');assert.doesNotMatch(index,/googletagmanager\.com\/gtm\.js/i,'GTM direto no index.html ignora o consentimento');
console.log(`[QR Livre] Portal validado: ${count} artigos, SEO, sitemap e consentimento.`);
