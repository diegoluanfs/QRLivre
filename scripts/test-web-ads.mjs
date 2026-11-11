import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const root=process.cwd();
const config=JSON.parse(await readFile(resolve(root,'config/web-ads.json'),'utf8'));
const placements=['generator','blogIndexFirst','blogIndexLast','articleMiddle','articleEnd'];
assert.match(config.publisherId,/^ca-pub-\d{16}$/);
assert.deepEqual(Object.keys(config.slots).sort(),[...placements].sort());
for(const p of placements) {
  assert.equal(typeof config.placements[p],'boolean',`Placement invalido: ${p}`);
  assert.ok(config.slots[p]==='' || /^\d+$/.test(config.slots[p]),`ID do bloco invalido: ${p}`);
}
const enabled=config.enabled===true && config.siteApproved===true && config.privacyIntegrationReady===true;
for (const name of ['blog/index.html','sobre.html']) {
  const html=await readFile(resolve(root,'public',name),'utf8');
  if(!enabled) assert.doesNotMatch(html,/data-qrl-ad-placement=/,'Não deve renderizar slots desativados');
}
const dirs=(await readdir(resolve(root,'public/blog'),{withFileTypes:true})).filter(d=>d.isDirectory());
for(const d of dirs) {
  const html=await readFile(join(root,'public/blog',d.name,'index.html'),'utf8');
  if(!enabled) assert.doesNotMatch(html,/data-qrl-ad-placement=/,'Não deve renderizar slots desativados');
}
const runtime=await readFile(resolve(root,'public/assets/qrlivre-web-ads.js'),'utf8');
assert.match(runtime,/qrlivre:ads-consent-changed/);
assert.match(runtime,/qrlivreAdConsentGranted === true/);
assert.match(runtime,/article-card:not\(\[hidden\]\)/);
const filter = await readFile(resolve(root,'site/blog-filter.js'),'utf8');
assert.match(filter,/qrlivre:blog-filter-updated/);
assert.ok((await stat(resolve(root,'public/assets/qrlivre-ads-config.js'))).size>30);
assert.ok((await stat(resolve(root,'public/assets/qrlivre-web-ads.css'))).size>30);
const app=await readFile(resolve(root,'src/App.tsx'),'utf8');
assert.match(app,/<PortalAdSlot placement="generator"/);
assert.match(app,/!isNativeApp && <PortalAdSlot/);
console.log(`[QR Livre] Publicidade web validada: ${placements.length} posições, habilitação=${enabled}, ${dirs.length} artigos.`);
