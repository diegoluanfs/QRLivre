import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
const dist=process.argv.includes('--dist'), output=dist?'dist':'public';
const read=f=>readFile(f,'utf8');
const runtime=await read(`${output}/assets/qrlivre-analytics.js`);
assert.doesNotMatch(runtime,/GTM-NSP5WG4F/);
function simulate({choice=null,host='qrlivre.com.br',native=false,canonical='https://qrlivre.com.br/blog/qr-code-pix-seguranca/?secret=abc#xyz',otherTag=false}={}){
  const nodes=[], handlers={}, windowHandlers={}, stored=new Map(), cookies=[];
  if(choice)stored.set('qrlivre-metrics-choice-v1',choice);
  const element=tag=>({tag,hidden:false,children:[],listeners:{},appendChild(n){this.children.push(n);nodes.push(n);},setAttribute(){},addEventListener(k,fn){this.listeners[k]=fn;},querySelector(s){return buttons[s];}});
  const buttons={'[data-qrl-accept]':element('button'),'[data-qrl-reject]':element('button')}; for(const b of Object.values(buttons))b.focus=()=>{};
  const location={hostname:host,protocol:'https:',href:`https://${host}/?pix=secret`,reload(){this.reloaded=true;}};
  const document={readyState:'complete',head:element('head'),body:element('body'),referrer:'https://example.org/private?secret=ghi',createElement:element,querySelector(s){if(s==='link[rel="canonical"]')return {href:canonical};return otherTag?{}:null;},addEventListener(k,v){handlers[k]=v;},set cookie(v){cookies.push(v);}};
  const window={Capacitor:{isNativePlatform:()=>native},addEventListener(k,v){windowHandlers[k]=v;}};
  const context=vm.createContext({window,document,location,localStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)},URL,Date,console:{warn(){}}});
  const run=()=>vm.runInContext(runtime,context);
  run();return {window,location,nodes,buttons,windowHandlers,stored,cookies,run,count:()=>nodes.filter(n=>n.tag==='script').length,cmds:()=>Array.from(window.dataLayer||[],x=>Array.from(x)),accept(){buttons['[data-qrl-accept]'].listeners.click();},reject(){buttons['[data-qrl-reject]'].listeners.click();}};
}
let s=simulate();assert.equal(s.count(),0);assert.equal(s.cmds().length,0);s.reject();assert.equal(s.count(),0);s.accept();assert.equal(s.count(),1);s.accept();s.run();assert.equal(s.count(),1);
assert.equal(s.nodes.find(n=>n.tag==='script').src,'https://www.googletagmanager.com/gtag/js?id=G-TKHY6BQRTF');
const cmds=s.cmds();assert.equal(cmds[0][0],'consent');assert.equal(cmds[0][2].analytics_storage,'denied');assert.equal(cmds[1][2].analytics_storage,'granted');assert.equal(cmds[1][2].ad_storage,'denied');assert.equal(cmds[1][2].ad_user_data,'denied');assert.equal(cmds[1][2].ad_personalization,'denied');
const config=cmds.find(c=>c[0]==='config');assert.equal(config[1],'G-TKHY6BQRTF');assert.equal(config[2].send_page_view,false);assert.equal(config[2].allow_google_signals,false);assert.equal(config[2].allow_ad_personalization_signals,false);
const pageViews=cmds.filter(c=>c[0]==='event'&&c[1]==='page_view');assert.equal(pageViews.length,1);assert.equal(pageViews[0][2].page_location,'https://qrlivre.com.br/blog/qr-code-pix-seguranca/');assert.equal(pageViews[0][2].page_referrer,'https://example.org/');assert.doesNotMatch(JSON.stringify(cmds),/secret|xyz|private/);
s.reject();assert.equal(s.window['ga-disable-G-TKHY6BQRTF'],true);assert.equal(s.location.reloaded,true);assert.ok(s.cookies.length>0);
assert.equal(simulate({choice:'rejected'}).count(),0);assert.equal(simulate({choice:'accepted'}).count(),1);assert.equal(simulate({choice:'accepted',host:'localhost'}).count(),0);assert.equal(simulate({choice:'accepted',native:true}).count(),0);assert.equal(simulate({choice:'accepted',host:'example.com'}).count(),0);assert.equal(simulate({choice:'accepted',otherTag:true}).count(),0);assert.equal(simulate({choice:'accepted',canonical:'https://example.com/'}).count(),0);
s=simulate({choice:'accepted'});s.windowHandlers.storage({key:'qrlivre-metrics-choice-v1',newValue:'rejected'});assert.equal(s.window['ga-disable-G-TKHY6BQRTF'],true);
const exportSession = simulate();
assert.equal(exportSession.windowHandlers['qrlivre:export'], undefined);
exportSession.accept();
const emitExport = detail => exportSession.windowHandlers['qrlivre:export']({ detail });
const exportsSent = () => exportSession.cmds().filter(command => command[1] === 'qr_export');
emitExport({kind: 'pix', format: 'png', payload: 'private value'});
emitExport({kind: 'private value', format: 'png'});
assert.equal(exportsSent().length, 1);
assert.deepEqual(JSON.parse(JSON.stringify(exportsSent()[0][2])), {
  send_to: config[1], qr_type: 'pix', file_format: 'png'
});
exportSession.reject();
emitExport({kind: 'pix', format: 'png'});
assert.equal(exportsSent().length, 1);
const files=[`${output}/blog/index.html`,`${output}/sobre.html`,`${output}/privacidade.html`];
for(const dir of await readdir(`${output}/blog`,{withFileTypes:true}))if(dir.isDirectory())files.push(`${output}/blog/${dir.name}/index.html`);
for(const f of files){const html=await read(f);assert.equal((html.match(/src="\/assets\/qrlivre-analytics\.js"/g)||[]).length,1,f);assert.doesNotMatch(html,/googletagmanager\.com\/(?:gtm\.js|gtag\/js)|qrlivre-consent\.js/,f);}
const home=await read(dist?'dist/index.html':'index.html');assert.doesNotMatch(home,/googletagmanager\.com\/(?:gtm\.js|gtag\/js)|GTM-NSP5WG4F/);
const main=await read('src/main.tsx');assert.equal((main.match(/qrlivre-analytics\.js/g)||[]).length,1);assert.match(main,/!isNativeApp/);assert.doesNotMatch(main,/qrlivre-consent\.js|GTM-NSP5WG4F/);
if(dist){const bundles=(await readdir('dist/assets')).filter(f=>/^index-.*\.js$/.test(f));assert.ok((await Promise.all(bundles.map(f=>read(join('dist/assets',f))))).some(s=>s.includes('qrlivre-analytics.js')),'Runtime GA4 ausente da entrada React');}
console.log(`[QR Livre] Analytics validado (${dist?'dist':'fonte'}): ${files.length+1} páginas, consentimento, recusa, revogação, ausência de duplicidade, URL canônica e isolamento Android/localhost (simulação).`);
