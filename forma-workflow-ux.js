/* Visible node actions and local settings, inspired by typed workflow editors. */
(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
let uploading=false;let dialog=null,marker=null,settingsHost=null,lastFocus=null,uploadNode=null;
const names={source:'Исходное изображение',exterior:'Экстерьер',interior:'Интерьер',lighting:'Свет и сезон',materials:'Материалы',geometry:'Сравнение с исходником',upscale:'Увеличить до 4K',video:'Анимация',export:'Сохранить файл'};
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
 const d=document.createElement('dialog');d.className='fa-workflow-add';d.setAttribute('aria-label','Добавить следующий блок');d.innerHTML='<header><h2>Следующий шаг</h2><button type="button" data-dismiss aria-label="Закрыть">×</button></header><p>Блок подключится к выбранному выходу.</p><div>'+Object.entries(names).filter(([k])=>k!=='source').map(([k,v])=>`<button type="button" data-add="${k}">${v}<span>＋</span></button>`).join('')+'</div>';document.body.append(d);d.showModal();
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
function enhanceSettings(){
 const host=$('#faFlowNodeSettings');if(!host)return;
 const env=$('[data-node-option="environment"]',host);if(env&&!$('.fa-workflow-visual-options',host)){
  const bar=document.createElement('div');bar.className='fa-workflow-visual-options';bar.innerHTML=[['suburban','Сад','env-garden.jpg'],['forest','Лес','env-forest.jpg'],['minimal','Минимализм','env-minimal.jpg'],['lake','Побережье','env-coast.jpg']].map(([v,t,src])=>`<button type="button" data-workflow-env="${v}"><img src="assets/thumbs/${src}" alt=""><span>${t}</span></button>`).join('');env.closest('label').after(bar);
  bar.addEventListener('click',e=>{const b=e.target.closest('[data-workflow-env]');if(!b)return;env.value=b.dataset.workflowEnv;env.dispatchEvent(new Event('change',{bubbles:true}));});
 }
}
function addVisualChoices(host,key,choices){
 const select=$('[data-node-option="'+key+'"]',host);if(!select||$('[data-visual-for="'+key+'"]',host))return;
 const bar=document.createElement('div');bar.className='fa-workflow-visual-options';bar.dataset.visualFor=key;
 bar.innerHTML=choices.map(([value,title,src])=>`<button type="button" data-visual-value="${value}" aria-pressed="${select.value===value}"><img src="assets/thumbs/${src}" alt=""><span>${title}</span></button>`).join('');select.closest('label').after(bar);
 bar.addEventListener('click',e=>{const b=e.target.closest('[data-visual-value]');if(!b)return;select.value=b.dataset.visualValue;select.dispatchEvent(new Event('change',{bubbles:true}));});
}
function enhance(){
 const flow=$('#faFlowBackdrop');if(!flow)return;
 if(!$('#faFlowAddBlock')){const b=document.createElement('button');b.id='faFlowAddBlock';b.type='button';b.textContent='＋ Шаг';b.onclick=()=>showAdd(window.FORMA_NODES.graph().selected);$('.fa-flow-head-actions',flow)?.prepend(b);}
 const title=$('.fa-flow-name b',flow);if(title&&title.textContent.includes('НОДЫ'))title.innerHTML='ФОРМА <span>/ СЦЕНАРИИ</span>';
 const label=$('.fa-flow-name small',flow);if(label&&label.textContent!=='Исходник → обработка → результат')label.textContent='Исходник → обработка → результат';
 if(!$('#faFlowSearch')){
  const input=document.createElement('input');input.id='faFlowSearch';input.type='search';input.placeholder='Найти шаг…';input.setAttribute('aria-label','Поиск блока');$('.fa-flow-palette-toolbar',flow)?.before(input);
  input.addEventListener('input',()=>{$$('[data-add-node]',flow).forEach(b=>b.hidden=!b.textContent.toLowerCase().includes(input.value.toLowerCase()));});
 }
 for(const card of $$('.fa-node',flow)){
  const n=window.FORMA_NODES?.getNode?.(card.dataset.node);if(!n)continue;
  const pic=$('.fa-node-picture',card);
  if(!pic.classList.contains('has-image')&&['exterior','lighting'].includes(n.type))pic.style.backgroundImage='linear-gradient(0deg,#24272bba,#24272b55),url(assets/thumbs/env-'+(n.options?.environment==='forest'?'forest':'garden')+'.jpg)';
  const input=$('[data-port-in]',card),output=$('[data-port-out]',card);if(input){input.title='Вход: изображение предыдущего шага';input.setAttribute('aria-label','Вход изображения');}if(output){output.title='Выход: передать результат следующему шагу';output.setAttribute('aria-label',n.type==='video'?'Выход видео':'Выход изображения');}
 }
 enhanceSettings();
 const host=$('#faFlowNodeSettings');if(host){addVisualChoices(host,'plants',[['garden','Сад','plants-decorative.jpg'],['conifers','Хвойные','plants-forest.jpg'],['natural','Естественные','plants-minimal.jpg'],['ornamental','Травы','plants-decorative.jpg']]);addVisualChoices(host,'time',[['noon','День','time-day.jpg'],['golden','Золотой час','time-golden.jpg'],['night','Ночь','time-night.jpg']]);}
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
