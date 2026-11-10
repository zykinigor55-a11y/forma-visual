/* DОМ.РЕНДЕР · account and contact UI v2.7. Never expose provider API keys. */
(()=>{'use strict';
function $(id){return document.getElementById(id)}
const d=document;
let previousFocus=null,shown='account',lastStatus=null;
function txt(id,value){const e=$(id);if(e)e.textContent=String(value)}
function switchView(view){
 shown=['account','gallery','contacts'].includes(view)?view:'account';
 $('cabinetAccount').hidden=shown!=='account';
 $('cabinetGallery').hidden=shown!=='gallery';
 $('cabinetContacts').hidden=shown!=='contacts';
 txt('cabinetTitle',shown==='account'?'Личный кабинет':shown==='gallery'?'Галерея работ':'Контакты');
 $('cabinetCover').classList.toggle('is-gallery',shown==='gallery');
 d.querySelectorAll('[data-cabinet-tab]').forEach(btn=>{const on=btn.dataset.cabinetTab===shown;btn.classList.toggle('active',on);btn.setAttribute('aria-selected',String(on))});
 if(shown==='gallery')window.DOM_RENDER_GALLERY?.activate?.();
}
function open(view){
 previousFocus=d.activeElement;
 switchView(view);
 $('cabinetCover').hidden=false;
 d.body.classList.add('cabinet-open');
 $('cabinetClose').focus();
 if(shown==='account')refresh();
}
function close(){
 $('cabinetCover').hidden=true;
 $('cabinetCover').classList.remove('is-gallery');
 d.body.classList.remove('cabinet-open');
 if(previousFocus&&previousFocus.isConnected)previousFocus.focus();
}
function updateContact(email){
 const safe=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email||'')?email:'';
 txt('cabinetSupportEmail',safe||'Контактный адрес ещё не опубликован');
 $('cabinetSupportAction').hidden=!safe;
 $('cabinetSupportNote').hidden=!!safe;
 if(safe)$('cabinetSupportAction').href='mailto:'+safe+'?subject='+encodeURIComponent('ДОМ.РЕНДЕР — обращение');
}
function paint(data){
 lastStatus=data;
 const ready=!!data.ready;
 txt('cabinetAccessStatus',ready?'AI подключён · Nano Banana 2.1':'Генерация пока недоступна');
 const remaining=(data.authorized&&Number.isInteger(data.dailyRemaining))?data.dailyRemaining:null;
 const limit=(data.authorized&&Number.isInteger(data.dailyLimit))?data.dailyLimit:null;
 txt('cabinetRemaining',remaining===null?'—':remaining);
 txt('cabinetLimitNote',limit===null?'Общий лимит сервера · доступен после входа':('Общий лимит сервера: '+limit+' в сутки · не личная квота'));
 txt('cabinetBalance','Пока не подключён');
 txt('cabinetTariff',data.tariffName||'Пока не назначен');
 updateContact(data.supportEmail);
}
async function refresh(){
 if(!$('cabinetCover')||$('cabinetCover').hidden)return;
 const btn=$('cabinetRefresh');
 btn.disabled=true;
 txt('cabinetAccessStatus','Проверяем статус сервера…');
 try{
  const response=await fetch('/api/status',{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(18000)});
  if(!response.ok)throw Error('Ошибка получения данных');
  const data=await response.json();
  paint(data);
 }catch(error){
  txt('cabinetAccessStatus','Не удалось получить данные. Нажмите «Обновить данные».');
  txt('cabinetRemaining','—');
  }finally{btn.disabled=false}
}
function init(){
 if(!$('cabinetCover'))return;
 d.querySelectorAll('[data-open-cabinet]').forEach(el=>el.addEventListener('click',()=>open(el.dataset.openCabinet)));
 d.querySelectorAll('[data-cabinet-tab]').forEach(el=>el.addEventListener('click',()=>switchView(el.dataset.cabinetTab)));
 $('cabinetClose').addEventListener('click',close);
 $('cabinetGoGallery')?.addEventListener('click',()=>switchView('gallery'));
 $('cabinetRefresh').addEventListener('click',refresh);
 $('cabinetCover').addEventListener('click',ev=>{if(ev.target===$('cabinetCover'))close()});
 d.addEventListener('keydown',ev=>{if($('cabinetCover').hidden)return;if(ev.key==='Escape'){ev.preventDefault();close()}});
}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
