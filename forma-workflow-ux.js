/* Visible node actions and local settings, inspired by typed workflow editors. */
(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
let uploading=false;let dialog=null,marker=null,settingsHost=null,lastFocus=null,uploadNode=null;
const names={source:'Исходное изображение',exterior:'Экстерьер',orbit:'Другой ракурс · тот же участок',interior:'Интерьер',lighting:'Свет и сезон',materials:'Материалы',geometry:'Сравнение с исходником',upscale:'Увеличить до 4K',video:'Анимация',export:'Сохранить файл'};
function openSettings(){
 if(dialog)return;const host=$('#faFlowInspector');if(!host)return;
 settingsHost=host;lastFocus=document.activeElement;marker=document.createComment('node-settings');host.before(marker);
 dialog=document.createElement('dialog');dialog.className='fa-workflow-settings';dialog.setAttribute('aria-label','Настройки блока сценария');dialog.innerHTML='<header><span>ФОРМА / ПАРАМЕТРЫ БЛОКА</span><button type="button" data-node-settings-close aria-label="Закрыть настройки">×</button></header><div class="fa-workflow-settings-body"></div><footer><button type="button" data-node-settings-close>Готово</button></footer>';
 document.body.append(dialog);$('.fa-workflow-settings-body',dialog).append(host);host.classList.add('is-dialog');dialog.showModal();
 dialog.addEventListener('cancel',e=>{e.preventDefault();closeSettings();});dialog.addEventListener('click',e=>{if(e.target.closest('[data-node-settings-close]'))closeSettings();});
 enhanceSettings();
}
function closeSettings(){if(!dialog)return;marker?.replaceWith(settingsHost);settingsHost?.classList.remove('is-dialog');dialog.close();dialog.remove();dialog=null;lastFocus?.focus({preventScroll:true});}
function showAdd(from){
 const d=document.createElement('dialog');d.className='fa-workflow-add';d.setAttribute('aria-label','Добавить следующий блок');d.innerHTML='<header><h2>Следующий шаг</h2><button type="button" data-dismiss aria-label="Закрыть">×</button></header><p>Блок подключится к выбранному выходу.</p><div>'+Object.entries(names).map(([k,v])=>`<button type="button" data-add="${k}">${v}<span>＋</span></button>`).join('')+'</div>';document.body.append(d);d.showModal();
 d.addEventListener('click',e=>{const add=e.target.closest('[data-add]');if(add){window.FORMA_NODES.add(add.dataset.add,window.FORMA_NODES.getNode(from)?.type==='export'?null:from);d.close();d.remove();window.FORMA_NODES.openStep(window.FORMA_NODES.graph().selected);}if(e.target.closest('[data-dismiss]')){d.close();d.remove();}});d.addEventListener('cancel',()=>d.remove(),{once:true});
}
async function uploadSource(node){
 const engine=window.FORMA_NODE_ENGINE;if(engine?.busy||engine?.preparing||uploading){window.FORMA_NODES?.showStatus('Дождитесь выполнения сценария или загрузки исходника.');return;}
 uploadNode=node;const input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';
 input.addEventListener('change',async()=>{const file=input.files?.[0];if(!file)return;uploading=true;const api=window.FORMA_NODES,graph=api.graph(),project=window.FORMA_ART_BRIDGE.snapshot();
 try{
  if(file.size>14*1024*1024)throw Error('Изображение должно быть меньше 14 МБ');
  const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Не удалось прочитать файл'));reader.readAsDataURL(file);});
  const im=new Image();im.src=data;await im.decode();
  if(window.FORMA_NODE_ENGINE?.busy||window.FORMA_NODE_ENGINE?.preparing||api.graph()!==graph||window.FORMA_ART_BRIDGE.snapshot().projectId!==project.projectId)throw Error('Сценарий или проект изменился во время загрузки');
  if(!project.hasSource||project.demo)await window.FORMA_ART_BRIDGE.uploadFile(file);
  if(api.graph()!==graph)throw Error('Сценарий изменился. Загрузите изображение снова.');
  await api.setSnapshot(node,data);api.invalidateFrom(node);api.setOptions(node,{sourceName:file.name});api.save();api.redraw();api.showStatus('Исходник «'+file.name+'» загружен в блок. Можно запускать сценарий.');
 }catch(e){api.showStatus(e.message);}finally{uploading=false;}
 },{once:true});input.click();
}
const photoGroups={environment:'env',weather:'weather',season:'season',time:'time',plants:'plants',material:'mat'};
const photoFiles={environment:{mountains:'mountains'},material:{custom:null}};
const safeText=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function optionPhoto(key,value,n){
 if(value==='keep'||value==='custom')return null;
 if(key==='environmentSubtype')return 'assets/thumbs/landscapes/'+n.options.environment+'-'+value+'.webp';
 return photoGroups[key]?'assets/thumbs/'+photoGroups[key]+'-'+value+'.jpg':null;
}
function enhanceSettings(){
 const host=$('#faFlowNodeSettings'),n=window.FORMA_NODES?.getNode?.(window.FORMA_NODES?.graph?.()?.selected);if(!host||!n)return;
 for(const key of [...Object.keys(photoGroups),'environmentSubtype']){
  const field=$('[data-node-option="'+key+'"]',host);if(!field)continue;field.hidden=true;
  let view=$('[data-scenario-picker="'+key+'"]',host);
  if(!view){
   view=document.createElement('details');view.className='fa-scenario-picker';view.dataset.scenarioPicker=key;
   view.innerHTML='<summary><span class="fa-scenario-current-photo"></span><span class="fa-scenario-current-copy"></span><span class="fa-scenario-switch">Изменить <span aria-hidden="true">↗</span></span></summary><div class="fa-scenario-catalog" role="group"></div>';
   field.closest('label').after(view);
   const catalog=$('.fa-scenario-catalog',view);catalog.setAttribute('aria-label','Выбор: '+field.closest('label').firstChild.textContent);
   catalog.innerHTML=[...field.options].map(o=>{const photo=optionPhoto(key,o.value,n);return '<button type="button" data-scenario-value="'+safeText(o.value)+'" aria-pressed="false">'+(photo?'<img src="'+photo+'" alt="" loading="lazy">':'<span class="fa-scenario-original" aria-hidden="true">◫</span>')+'<span>'+safeText(o.textContent)+'</span></button>';}).join('');
   catalog.addEventListener('click',e=>{const choice=e.target.closest('[data-scenario-value]');if(!choice||field.disabled)return;field.value=choice.dataset.scenarioValue;view.open=false;field.dispatchEvent(new Event('change',{bubbles:true}));enhanceSettings();});
   field.addEventListener('change',enhanceSettings);
  }
  const value=field.value,selected=field.options[field.selectedIndex],photo=optionPhoto(key,value,n),signature=value+'|'+String(photo);
  if(view.dataset.selection!==signature){
   view.dataset.selection=signature;
   $('.fa-scenario-current-photo',view).innerHTML=photo?'<img src="'+photo+'" alt="">':'<span class="fa-scenario-original" aria-hidden="true">◫</span>';
   $('.fa-scenario-current-copy',view).innerHTML='<small>Выбрано</small><strong>'+safeText(selected?.textContent||'По исходнику')+'</strong>';
   $$('[data-scenario-value]',view).forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.scenarioValue===value)));
  }
 }
}
function enhance(){
 const flow=$('#faFlowBackdrop');if(!flow)return;
 if(!$('#faFlowAddBlock')){const b=document.createElement('button');b.id='faFlowAddBlock';b.type='button';b.textContent='＋ Добавить блок';b.onclick=()=>showAdd(window.FORMA_NODES.graph().selected);$('.fa-flow-head-actions',flow)?.prepend(b);}
 const title=$('.fa-flow-name b',flow);if(title&&title.textContent.includes('НОДЫ'))title.innerHTML='ФОРМА <span>/ СЦЕНАРИИ</span>';
 const label=$('.fa-flow-name small',flow);if(label&&label.textContent!=='Исходник → обработка → результат')label.textContent='Исходник → обработка → результат';
 if(!$('#faFlowSearch')){
  const input=document.createElement('input');input.id='faFlowSearch';input.type='search';input.placeholder='Найти шаг…';input.setAttribute('aria-label','Поиск блока');$('.fa-flow-palette-toolbar',flow)?.before(input);
  input.addEventListener('input',()=>{$$('[data-add-node]',flow).forEach(b=>b.hidden=!b.textContent.toLowerCase().includes(input.value.toLowerCase()));});
 }
 for(const card of $$('.fa-node',flow)){
  const n=window.FORMA_NODES?.getNode?.(card.dataset.node);if(!n)continue;
  const pic=$('.fa-node-picture',card);
  if(!pic.classList.contains('has-image')&&['exterior','lighting'].includes(n.type)){const env=n.options?.environment,sub=n.options?.environmentSubtype;const image=env&&env!=='keep'?(sub&&sub!=='keep'?'assets/thumbs/landscapes/'+env+'-'+sub+'.webp':optionPhoto('environment',env,n)):null;pic.style.backgroundImage=image?'linear-gradient(0deg,#24272bba,#24272b55),url("'+image+'")':'';}
  const input=$('[data-port-in]',card),output=$('[data-port-out]',card);if(input){input.title='Вход: изображение предыдущего шага';input.setAttribute('aria-label','Вход изображения');}if(output){output.title='Выход: передать результат следующему шагу';output.setAttribute('aria-label',n.type==='video'?'Выход видео':'Выход изображения');}
 }
 enhanceSettings();

}
function cinemaEnhance(){
 const panel=$('#animationPanel');if(!panel)return;
 const duration=$('#animDuration'),wan=$('#wanDuration');if(duration&&wan){wan.value=duration.value;if(!duration.dataset.syncWan){duration.dataset.syncWan='true';duration.addEventListener('change',()=>wan.value=duration.value);}}
 if(!$('.fs-video-connection',panel)){const details=document.createElement('details');details.className='fs-video-connection';details.innerHTML='<summary>Подключение видео</summary>';const container=$('#wan26Panel');if(container){container.append(details);const label=$('.wan26-private-label',container),foot=$('.wan26-foot',container);if(label)details.append(label);if(foot)details.append(foot);}}
 if(!$('.fs-cinema-tabs',panel)){
  const sections=$$('details.anim-section',panel);if(!sections.length)return;
  const bar=document.createElement('div');bar.className='fs-cinema-tabs';bar.setAttribute('role','group');bar.setAttribute('aria-label','Настройки анимации');bar.innerHTML=['Камера','Объектив','Движение','Цвет'].map((name,i)=>`<button type="button" data-cinema-page="${i}" aria-pressed="${i===0}">${name}</button>`).join('');sections[0].before(bar);
  const show=i=>{sections.forEach((s,n)=>{s.hidden=n!==i;s.open=n===i;});$$('[data-cinema-page]',bar).forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.cinemaPage)===i)));};show(0);bar.onclick=e=>{const b=e.target.closest('[data-cinema-page]');if(b)show(Number(b.dataset.cinemaPage));};
 }
}
window.FORMA_CINEMA_UI={enhance:cinemaEnhance};
// One delegated upload action remains functional after graph redraws.
document.addEventListener('click',e=>{const b=e.target.closest('[data-source-upload]');if(b){e.preventDefault();e.stopImmediatePropagation();uploadSource(b.dataset.sourceUpload);}},true);
document.addEventListener('dblclick',e=>{const card=e.target.closest('.fa-node');if(card)window.FORMA_NODES?.openStep?.(card.dataset.node);});
let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance();});});
function start(){observer.observe(document.body,{childList:true,subtree:true});document.addEventListener('forma:source-uploaded',()=>enhance());}
window.FORMA_WORKFLOW_UI={get uploading(){return uploading;},openSettings,closeSettings,showAdd,uploadSource};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
