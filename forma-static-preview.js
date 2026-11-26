/* ФОРМА · публичный статический предпросмотр GitHub Pages.
   Никакие API-ключи и данные пользователей сюда не передаются. */
(() => {
 'use strict';
 const init=()=>{
  // Render serves the real application. Only static file/GitHub Pages is an AI-free preview.
  if(location.protocol!=='file:'&&!/\.github\.io$/i.test(location.hostname))return;
  if(document.documentElement.classList.contains('forma-static-preview'))return;
  document.documentElement.classList.add('forma-static-preview');
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
    window.alert('AI-генерация недоступна в статической версии GitHub Pages. Для рендера откройте серверную версию FORMA.');
  },true);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
