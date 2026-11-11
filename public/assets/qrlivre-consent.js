/* QR Livre: apenas métricas opcionais. NÃO constitui CMP certificada para publicidade. */
(()=>{
  'use strict';
  if(window.Capacitor?.isNativePlatform?.())return;
  const KEY='qrlivre-metrics-choice-v1';
  const GTM_ID='GTM-NSP5WG4F';
  let choice=null;
  try { choice=localStorage.getItem(KEY); } catch { /* armazenamento indisponível */ }
  function track(){
    if(choice!=='accepted'||document.getElementById('qrlivre-gtm-script'))return;
    window.dataLayer=window.dataLayer||[];
    function gtag(){window.dataLayer.push(arguments);}
    gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    gtag('consent','update',{analytics_storage:'granted'});
    window.dataLayer.push({event:'qrlivre_metrics_consent'});
    const s=document.createElement('script');s.id='qrlivre-gtm-script';s.async=true;s.src=`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
    document.head.appendChild(s);
  }
  const banner=document.createElement('aside');
  banner.className='qrl-consent';banner.setAttribute('role','dialog');banner.setAttribute('aria-label','Preferências de métricas');
  banner.innerHTML='<p><strong>Privacidade no QR Livre</strong><span>Podemos usar métricas opcionais para entender o uso do site. O gerador funciona normalmente se você recusar.</span><a href="/privacidade.html">Saiba mais</a></p><div class="qrl-consent-actions"><button type="button" data-qrl-reject>Não aceitar</button><button type="button" data-qrl-accept>Aceitar métricas</button></div>';
  const styles=document.createElement('style');styles.textContent='.qrl-consent{position:fixed;inset:auto 16px 16px 16px;max-width:760px;margin:auto;z-index:99999;background:#fff;border:1px solid #d8e5dc;box-shadow:0 18px 58px #122e2470;border-radius:18px;padding:17px 20px;display:flex;align-items:center;gap:22px;font:14px/1.55 system-ui,-apple-system,Segoe UI,sans-serif;color:#183b31}.qrl-consent[hidden]{display:none!important}.qrl-consent p{margin:0;flex:1}.qrl-consent strong,.qrl-consent span{display:block}.qrl-consent strong{font-size:15px;margin-bottom:4px}.qrl-consent span{font-size:12px;color:#5d7566}.qrl-consent a{font-size:12px;color:#276747;text-decoration:underline}.qrl-consent-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:end}.qrl-consent button{border:1px solid #d8e5dc;background:#f4f8f4;color:#234637;border-radius:9px;padding:10px 12px;font:700 12px system-ui;cursor:pointer}.qrl-consent button[data-qrl-accept]{background:#174c37;color:#fff;border-color:#174c37}@media(max-width:620px){.qrl-consent{display:block;padding:15px}.qrl-consent-actions{justify-content:stretch;margin-top:12px}.qrl-consent button{flex:1}}';document.head.appendChild(styles);
  function setup(){
    document.body.appendChild(banner);
    if(choice==='accepted'){banner.hidden=true;track();}else if(choice==='rejected'){banner.hidden=true;}
    banner.querySelector('[data-qrl-accept]').addEventListener('click',()=>choose('accepted'));
    banner.querySelector('[data-qrl-reject]').addEventListener('click',()=>choose('rejected'));
    document.addEventListener('click',e=>{const trigger=e.target.closest?.('[data-open-privacy-settings]');if(trigger){e.preventDefault();banner.hidden=false;}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
  function choose(value){const previous=choice;choice=value;try{localStorage.setItem(KEY,value);}catch{}banner.hidden=true;if(value==='accepted')track();else if(previous==='accepted')window.location.reload();}
})();
