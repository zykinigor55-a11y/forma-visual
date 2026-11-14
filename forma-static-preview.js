/* ФОРМА · публичный статический предпросмотр GitHub Pages.
   Никакие API-ключи и данные пользователей сюда не передаются. */
(() => {
 'use strict';
 const init=()=>{
  if(document.getElementById('formaPreviewNotice'))return;
  const banner=document.createElement('aside');
  banner.id='formaPreviewNotice';
  banner.setAttribute('role','status');
  banner.innerHTML='<span class="fp-dot" aria-hidden="true"></span><strong>ПРЕДПРОСМОТР ФОРМА</strong><span>Интерфейс, заставка и ноды доступны. AI-генерация здесь не подключена.</span><a href="https://github.com/zykinigor55-a11y/forma-visual/tree/feature/forma-archviz-studio" target="_blank" rel="noopener noreferrer">Исходники</a>';
  document.body.append(banner);
  document.documentElement.classList.add('forma-static-preview');
  const style=document.createElement('style');
  style.textContent=`
    #formaPreviewNotice{box-sizing:border-box;position:fixed;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:1900;display:flex;align-items:center;gap:10px;background:#162323ed;border:1px solid #64756d;padding:10px 15px;border-radius:10px;box-shadow:0 12px 32px #0003;color:#e9e7dd;font:500 10px Inter,Arial,sans-serif;max-width:min(95vw,850px);backdrop-filter:blur(12px)}
    #formaPreviewNotice .fp-dot{height:7px;width:7px;flex:none;border-radius:100%;background:#d2b487}
    #formaPreviewNotice strong{white-space:nowrap;letter-spacing:.055em;color:#daccb9;font-size:9px}
    #formaPreviewNotice>span:nth-of-type(2){line-height:1.35;color:#c3cec6}
    #formaPreviewNotice a{color:#e6d5bb;text-decoration:underline;text-underline-offset:3px;white-space:nowrap}
    @media(max-width:680px){#formaPreviewNotice{left:10px;right:10px;bottom:max(10px,env(safe-area-inset-bottom));transform:none;max-width:none;flex-wrap:wrap;gap:5px 9px;padding:9px 11px;font-size:9px}#formaPreviewNotice>span:nth-of-type(2){flex-basis:100%;order:3}#formaPreviewNotice a{margin-left:auto}}
  `;
  document.head.append(style);
  const disable=()=>{
   for(const q of ['#generateBtn','#renderSetupGenerate','#renderSetupBatch','#batchGenerateBtn','#generateVideoBtn']){
    const e=document.querySelector(q);
    if(e&&!e.dataset.formaPreviewUnavailable){e.dataset.formaPreviewUnavailable='true';e.title='В публичной версии-предпросмотре AI не подключён';e.setAttribute('aria-disabled','true')}
   }
  };
  disable();
  // Capture means older render handlers cannot issue non-working requests.
  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-forma-preview-unavailable]');
    if(!btn)return;
    e.preventDefault();e.stopImmediatePropagation();
    banner.animate([{transform:'translateX(-50%) scale(1)'},{transform:'translateX(-50%) scale(1.025)'},{transform:'translateX(-50%) scale(1)'}],{duration:350});
  },true);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
