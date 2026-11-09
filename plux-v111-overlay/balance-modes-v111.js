/* PLUX V11.1: profile demo balance and liquid mode-card motion, no billing in browser. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
function mountBalance(){
 const prefs=$('prefs'),input=$('pref-name'),app=$('app');
 if(!prefs||!input||!app||$('plux-balance-dialog'))return;
 const row=document.createElement('section');row.className='plux-balance-entry';
 row.innerHTML='<button type="button" class="plux-balance-launch" id="plux-balance-open" aria-haspopup="dialog" aria-controls="plux-balance-dialog">'+
 '<span class="plux-balance-coin" aria-hidden="true">✧</span>'+
 '<span class="plux-balance-copy"><strong>Баланс PLUX</strong><small>Кредиты для фото, видео и музыки</small></span>'+
 '<span class="plux-balance-right"><em>ДЕМО</em><span>Подробнее ›</span></span></button>';
 input.insertAdjacentElement('afterend',row);
 const dlg=document.createElement('dialog');dlg.className='plux-dialog plux-balance-dialog';
 dlg.id='plux-balance-dialog';dlg.setAttribute('aria-labelledby','plux-balance-title');
 dlg.innerHTML='<header><h2 id="plux-balance-title">Баланс PLUX</h2>'+
 '<button type="button" class="plux-balance-close" aria-label="Закрыть баланс" id="plux-balance-close">×</button></header>'+
 '<div class="plux-balance-hero"><div class="plux-balance-overline">БУДУЩИЙ БАЛАНС КРЕДИТОВ</div>'+
 '<div class="plux-balance-amount">0 <span>демо-кредитов</span></div>'+
 '<p>Учёт платежей и реальных кредитов ещё не подключён.</p></div>'+
 '<p class="plux-balance-intro">Здесь появится единый баланс для генерации через API:</p>'+
 '<div class="plux-balance-services" role="list">'+
 '<div role="listitem"><span aria-hidden="true">▧</span><strong>Фото</strong><small>Генерация изображений</small></div>'+
 '<div role="listitem"><span aria-hidden="true">▷</span><strong>Видео</strong><small>Создание роликов</small></div>'+
 '<div role="listitem"><span aria-hidden="true">♫</span><strong>Музыка</strong><small>Треки и звуки</small></div></div>'+
 '<button type="button" class="plux-balance-topup" disabled aria-disabled="true">Пополнение — после подключения платежей</button>'+
 '<p class="plux-balance-note">Стоимость генерации и списания появятся только после подключения защищённого сервера, аккаунтов и API.</p>';
 app.appendChild(dlg);
 let returnToPrefs=false;
 const open=()=>{returnToPrefs=Boolean(prefs.open);if(prefs.open)prefs.close();if(typeof dlg.showModal==='function')dlg.showModal();else dlg.setAttribute('open','')};
 const close=()=>{if(dlg.open)dlg.close();else dlg.removeAttribute('open')};
 $('plux-balance-open').addEventListener('click',open);
 $('plux-balance-close').addEventListener('click',close);
 dlg.addEventListener('click',e=>{if(e.target===dlg)close()});
 dlg.addEventListener('close',()=>{if(returnToPrefs&&!prefs.open&&typeof prefs.showModal==='function'){returnToPrefs=false;prefs.showModal()}});
}
function mountModeMotion(){
 const grid=document.querySelector('#screen-modes .mode-grid');if(!grid||grid.dataset.liquidWired)return;
 grid.dataset.liquidWired='true';
 const cards=Array.from(grid.querySelectorAll('button.mode-card'));
 cards.forEach((card,i)=>{
  if(!card.querySelector('.plux-mode-liquid')){const el=document.createElement('span');el.className='plux-mode-liquid';el.setAttribute('aria-hidden','true');card.insertBefore(el,card.firstChild)}
  card.style.setProperty('--mode-delay',(-i*1.8)+'s');
 });
 const bypass=new WeakSet();let pending=null,timer=0;
 grid.addEventListener('pointerdown',e=>{const c=e.target.closest?.('button.mode-card');if(c&&grid.contains(c))c.classList.add('mode-pressed')},{passive:true});
 for(const type of ['pointerup','pointercancel','pointerleave'])grid.addEventListener(type,()=>cards.forEach(c=>c.classList.remove('mode-pressed')),{passive:true});
 grid.addEventListener('click',e=>{
  const c=e.target.closest?.('button.mode-card');if(!c||!grid.contains(c))return;
  if(bypass.has(c)){bypass.delete(c);return}
  if(reduced?.matches)return;
  e.preventDefault();e.stopImmediatePropagation();
  if(pending){clearTimeout(timer);pending.classList.remove('mode-picking')}
  pending=c;c.classList.remove('mode-pressed');c.classList.add('mode-picking');
  timer=setTimeout(()=>{pending=null;bypass.add(c);c.click();c.classList.remove('mode-picking')},245);
 },true);
}
function init(){mountBalance();mountModeMotion()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
