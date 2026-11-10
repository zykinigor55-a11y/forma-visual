/* DOM.RENDER • Cabinet Gallery v56
 * Media is PRIVATE to this browser, stored in the existing render IndexedDB
 * and a separate video Blob store. No made-up cloud sync / video generation.
 */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const PROJECTS_KEY='domrender_mvp_projects_v1';
 const VIDEOS_KEY='domrender_gallery_videos_v1';
 const RENDER_DB='domrender-media-v1',VIDEO_DB='domrender-gallery-media-v1';
 const MAX_VIDEO=160*1024*1024;
 const BATCH=18;
 let filter='all',selectedProject='all',limit=BATCH,allItems=[],itemMap=new Map();
 let renderVersion=0,activeId=null,activeURL=null,videoThumbURLs=new Set(),lastFocus=null;
 const date=ms=>{try{return new Date(ms).toLocaleDateString('ru-RU',{day:'2-digit',month:'short',year:'numeric'})}catch{return '—'}};
 const safeText=s=>String(s||'').slice(0,180);
 const extFromMime=t=>t==='image/png'?'png':t==='image/webp'?'webp':'jpg';
 const safeName=s=>safeText(s).replace(/[\/\\:*?"<>|]+/g,' ').replace(/\s+/g,' ').trim().slice(0,80)||'DOM-RENDER';
 function status(msg){const e=$('cabinetGalleryGrid');if(e)e.textContent=msg}
 function openDB(name,store){
  return new Promise((resolve,reject)=>{
   if(!window.indexedDB)return reject(Error('Хранилище IndexedDB недоступно в этом браузере.'));
   const req=indexedDB.open(name,1);
   req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(store))req.result.createObjectStore(store)};
   req.onsuccess=()=>resolve(req.result);
   req.onerror=()=>reject(Error('Не удалось открыть хранилище файлов.'));
   req.onblocked=()=>reject(Error('Хранилище занято другой вкладкой.'));
  });
 }
 async function dbOp(name,store,type,key,value){
  const db=await openDB(name,store);
  try{return await new Promise((resolve,reject)=>{
   const tx=db.transaction(store,type==='put'||type==='delete'?'readwrite':'readonly');
   const object=tx.objectStore(store);
   const req=type==='get'?object.get(key):type==='put'?object.put(value,key):object.delete(key);
   req.onsuccess=()=>resolve(req.result||null);
   req.onerror=()=>reject(req.error||Error('Не удалось записать файл в память устройства.'));
   tx.onerror=()=>reject(tx.error||Error('Ошибка хранилища.'));
  })}finally{db.close()}
 }
 const getImage=(projectId,renderId)=>dbOp(RENDER_DB,'media','get',projectId+'_render_'+renderId);
 const getVideo=id=>dbOp(VIDEO_DB,'videos','get',id);
 const getVideoIndex=()=>{try{const v=JSON.parse(localStorage.getItem(VIDEOS_KEY)||'[]');return Array.isArray(v)?v:[]}catch{return []}};
 const saveVideoIndex=items=>localStorage.setItem(VIDEOS_KEY,JSON.stringify(items));
 const sourceProjects=()=>{try{const p=JSON.parse(localStorage.getItem(PROJECTS_KEY)||'{}');return Array.isArray(p.projects)?p.projects:[]}catch{return []}};
 function collect(){
  const photos=sourceProjects().filter(p=>p&&!p.demo).flatMap(p=>(Array.isArray(p.renders)?p.renders:[]).filter(r=>r?.id).map(r=>({
   id:'render:'+p.id+':'+r.id,kind:'image',projectId:p.id,renderId:r.id,
   projectName:safeText(p.name||'Проект'),title:safeText(r.batchLabel||'Рендер '+(r.number||'')),
   createdAt:Number(r.createdAt)||Number(p.modifiedAt)||0
  })));
  const clips=getVideoIndex().filter(m=>m?.id).map(m=>({
   id:'video:'+m.id,videoId:m.id,kind:'video',projectId:m.projectId||'imported',
   projectName:safeText(m.projectName||'Мои видео'),title:safeText(m.name||'Видеоролик'),
   poster:typeof m.poster==='string'&&m.poster.startsWith('data:image/')?m.poster:'',
   type:safeText(m.type||'video/mp4'),createdAt:Number(m.createdAt)||0
  }));
  allItems=[...photos,...clips].sort((a,b)=>b.createdAt-a.createdAt);
  itemMap=new Map(allItems.map(x=>[x.id,x]));
  $('cabinetGalleryTotal').textContent=String(allItems.length);
  $('cabinetGalleryRenders').textContent=String(photos.length);
  $('cabinetGalleryVideos').textContent=String(clips.length);
  const select=$('cabinetGalleryProject'),current=select.value||selectedProject;
  select.replaceChildren(new Option('Все проекты','all'));
  const byProject=new Map(allItems.map(i=>[i.projectId,i.projectName]));
  [...byProject].sort((a,b)=>a[1].localeCompare(b[1],'ru')).forEach(([id,name])=>select.add(new Option(name,id)));
  select.value=byProject.has(current)?current:'all';
  selectedProject=select.value;
 }
 function chosen(){return allItems.filter(item=>(filter==='all'||item.kind===filter)&&(selectedProject==='all'||item.projectId===selectedProject))}
 function icon(name){
  const s=document.createElementNS('http://www.w3.org/2000/svg','svg');
  s.classList.add('ico');
  const u=document.createElementNS('http://www.w3.org/2000/svg','use');u.setAttribute('href','#i-'+name);s.appendChild(u);return s;
 }
 function card(item,version){
  const b=document.createElement('button');b.type='button';b.className='cabinet-gallery-card';b.dataset.galleryId=item.id;
  const visual=document.createElement('span');visual.className='cabinet-gallery-thumb';
  const badge=document.createElement('span');badge.className='cabinet-gallery-tag';badge.textContent=item.kind==='video'?'ВИДЕО':'AI · РЕНДЕР';visual.appendChild(badge);
  if(item.kind==='image'){
   const im=document.createElement('img');im.loading='lazy';im.decoding='async';im.alt=item.title;im.style.visibility='hidden';visual.appendChild(im);
   getImage(item.projectId,item.renderId).then(src=>{
    if(version!==renderVersion||!b.isConnected)return;
    if(typeof src==='string'&&src.startsWith('data:image/')){im.src=src;im.style.visibility='visible'}
    else{im.remove();const empty=document.createElement('span');empty.className='cabinet-gallery-empty-art';empty.textContent='Файл отсутствует на этом устройстве';visual.appendChild(empty)}
   }).catch(()=>{if(b.isConnected){im.remove();const empty=document.createElement('span');empty.className='cabinet-gallery-empty-art';empty.textContent='Не удалось прочитать изображение';visual.appendChild(empty)}});
  }else{
   if(item.poster){const im=document.createElement('img');im.src=item.poster;im.alt='';im.loading='lazy';visual.appendChild(im)}
   else{const placeholder=document.createElement('span');placeholder.className='cabinet-gallery-video-placeholder';placeholder.appendChild(icon('film'));visual.appendChild(placeholder)}
   const play=document.createElement('span');play.className='cabinet-gallery-play';const center=document.createElement('span');center.textContent='▶';play.appendChild(center);visual.appendChild(play);
  }
  b.appendChild(visual);
  const caption=document.createElement('span');caption.className='cabinet-gallery-card-copy';
  const title=document.createElement('strong');title.textContent=item.title;
  const project=document.createElement('span');project.textContent=item.projectName;
  const when=document.createElement('small');when.textContent=date(item.createdAt);
  caption.append(title,project,when);b.appendChild(caption);
  return b;
 }
 function render(){
  renderVersion++;
  const version=renderVersion;
  const grid=$('cabinetGalleryGrid');if(!grid)return;
  grid.replaceChildren();
  const list=chosen(),shown=list.slice(0,limit);
  if(!shown.length){
   const empty=document.createElement('div');empty.className='cabinet-gallery-empty';
   empty.appendChild(icon(filter==='video'?'film':'image'));
   const bold=document.createElement('strong');bold.textContent=filter==='video'?'Пока нет видеороликов':filter==='image'?'Здесь пока нет рендеров':'Ваша коллекция пока пуста';
   const p=document.createElement('p');p.textContent=filter==='video'?'Добавьте MP4 или WebM через кнопку «Добавить видео».':'Создайте визуализацию в разделе «Рендер», затем она появится здесь автоматически.';
   empty.append(bold,p);grid.appendChild(empty);
  }else{
   const frag=document.createDocumentFragment();shown.forEach(i=>frag.appendChild(card(i,version)));grid.appendChild(frag)
  }
  $('cabinetGalleryMore').hidden=list.length<=limit;
 }
 function activate(){
  if(!$('cabinetGallery')||$('cabinetGallery').hidden)return;
  $('cabinetCover')?.classList.add('is-gallery');
  limit=BATCH;collect();render();
 }
 function setFilter(type){
  filter=['all','image','video'].includes(type)?type:'all';limit=BATCH;
  document.querySelectorAll('[data-gallery-kind]').forEach(b=>{const on=b.dataset.galleryKind===filter;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
  render();
 }
 function closeViewer(){
  const panel=$('cabinetGalleryLightbox');if(!panel||panel.hidden)return;
  panel.hidden=true;$('cabinetGalleryMedia').replaceChildren();
  if(activeURL){URL.revokeObjectURL(activeURL);activeURL=null}
  activeId=null;
  lastFocus?.focus?.();
 }
 async function openViewer(id){
  const item=itemMap.get(id);if(!item)return;
  lastFocus=document.activeElement;
  closeViewer();
  lastFocus=document.activeElement;
  activeId=id;
  const panel=$('cabinetGalleryLightbox');
  panel.hidden=false;
  $('cabinetGalleryViewTitle').textContent=item.title;
  $('cabinetGalleryViewMeta').textContent=item.projectName+' · '+date(item.createdAt);
  $('cabinetGalleryDeleteVideo').hidden=item.kind!=='video';
  $('cabinetGalleryMedia').textContent='Открываем оригинал…';
  $('cabinetGalleryViewClose').focus();
  try{
   if(item.kind==='image'){
    const src=await getImage(item.projectId,item.renderId);
    if(activeId!==id)return;
    if(typeof src!=='string'||!src.startsWith('data:image/'))throw Error('Оригинал не найден на этом устройстве.');
    const im=new Image();im.alt=item.title;im.src=src;im.decoding='async';
    $('cabinetGalleryMedia').replaceChildren(im);
   }else{
    const blob=await getVideo(item.videoId);
    if(activeId!==id)return;
    if(!(blob instanceof Blob))throw Error('Видео больше не доступно на этом устройстве.');
    activeURL=URL.createObjectURL(blob);
    const vid=document.createElement('video');vid.src=activeURL;vid.controls=true;vid.playsInline=true;vid.preload='metadata';vid.autoplay=false;
    if(item.poster)vid.poster=item.poster;
    $('cabinetGalleryMedia').replaceChildren(vid);
   }
  }catch(e){if(activeId===id)$('cabinetGalleryMedia').textContent=e.message||'Не удалось открыть файл.'}
 }
 function downloadURL(url,filename){
  const a=document.createElement('a');a.href=url;a.download=safeName(filename);document.body.appendChild(a);a.click();a.remove()
 }
 async function download(){
  const item=itemMap.get(activeId);if(!item)return;
  try{
   if(item.kind==='image'){
    const s=await getImage(item.projectId,item.renderId);
    if(typeof s!=='string'||!s.startsWith('data:image/'))throw Error('Файл рендера не найден.');
    const match=s.match(/^data:(image\/(?:png|jpeg|webp));/);
    downloadURL(s,safeName(item.projectName+' — '+item.title)+'.'+extFromMime(match?.[1]));
   }else{
    const b=await getVideo(item.videoId);if(!(b instanceof Blob))throw Error('Видео не найдено.');
    const u=URL.createObjectURL(b);downloadURL(u,safeName(item.title).replace(/\.(mp4|webm)$/i,'')+(item.type.includes('webm')?'.webm':'.mp4'));
    setTimeout(()=>URL.revokeObjectURL(u),60000);
   }
  }catch(e){alert(e.message||'Не удалось скачать файл')}
 }
 async function deleteVideo(){
  const item=itemMap.get(activeId);if(!item||item.kind!=='video')return;
  if(!confirm('Удалить это видео из галереи на данном устройстве? Это действие необратимо.'))return;
  try{
   await dbOp(VIDEO_DB,'videos','delete',item.videoId);
   saveVideoIndex(getVideoIndex().filter(v=>v.id!==item.videoId));
   closeViewer();activate();
  }catch(e){alert(e.message||'Не удалось удалить видео')}
 }
 function thumbForVideo(file){
  return new Promise(resolve=>{
   const url=URL.createObjectURL(file),v=document.createElement('video');let done=false;
   const finish=s=>{if(done)return;done=true;clearTimeout(timer);URL.revokeObjectURL(url);v.removeAttribute('src');v.load();resolve(s)};
   const timer=setTimeout(()=>finish(''),5500);
   v.muted=true;v.playsInline=true;v.preload='metadata';
   v.onerror=()=>finish('');
   v.onloadedmetadata=()=>{try{v.currentTime=Math.min(.6,Math.max(.05,v.duration*.02||.1))}catch{finish('')}};
   v.onseeked=()=>{try{
    const w=v.videoWidth,h=v.videoHeight;if(!w||!h)return finish('');
    const f=Math.min(1,500/Math.max(w,h));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(w*f));canvas.height=Math.max(1,Math.round(h*f));
    canvas.getContext('2d').drawImage(v,0,0,canvas.width,canvas.height);
    finish(canvas.toDataURL('image/jpeg',.76))
   }catch{finish('')}};
   v.src=url;
  })
 }
 async function importVideo(file){
  if(!file)return;
  if(!/^video\/(mp4|webm)$/.test(file.type)&&!/\.(mp4|webm)$/i.test(file.name)){alert('Поддерживаются видео MP4 и WebM.');return}
  if(file.size>MAX_VIDEO){alert('Размер видео должен быть не более 160 МБ.');return}
  const btn=$('cabinetGalleryImport');btn.disabled=true;btn.textContent='Сохраняем видео…';
  try{
   const id=(crypto.randomUUID?.()||'vid-'+Date.now()+'-'+Math.random().toString(16).slice(2));
   const source=sourceProjects();
   const projectId='imported';
   const meta={id,name:safeText(file.name.replace(/\.(mp4|webm)$/i,'')),projectName:'Мои видео',projectId,type:file.type||(/\.webm$/i.test(file.name)?'video/webm':'video/mp4'),createdAt:Date.now(),poster:''};
   await dbOp(VIDEO_DB,'videos','put',id,file);
   meta.poster=await thumbForVideo(file);
   try{saveVideoIndex([meta,...getVideoIndex()])}
   catch(e){await dbOp(VIDEO_DB,'videos','delete',id);throw new Error('Недостаточно места для данных галереи.')}
   activate();
  }catch(e){alert(e?.name==='QuotaExceededError'?'Недостаточно свободной памяти браузера. Скачайте видео и освободите место.':String(e.message||'Не удалось сохранить видео.'))}
  finally{btn.disabled=false;btn.replaceChildren(icon('plus'),document.createTextNode(' Добавить видео'))}
 }
 function init(){
  if(!$('cabinetGalleryGrid'))return;
  $('cabinetGalleryImport')?.addEventListener('click',()=>$('cabinetGalleryFile').click());
  $('cabinetGalleryFile')?.addEventListener('change',e=>{const f=e.target.files?.[0];if(f)importVideo(f);e.target.value=''});
  document.querySelectorAll('[data-gallery-kind]').forEach(el=>el.addEventListener('click',()=>setFilter(el.dataset.galleryKind)));
  $('cabinetGalleryProject').addEventListener('change',e=>{selectedProject=e.target.value;limit=BATCH;render()});
  $('cabinetGalleryMore').addEventListener('click',()=>{limit+=BATCH;render()});
  $('cabinetGalleryGrid').addEventListener('click',ev=>{const id=ev.target.closest('[data-gallery-id]')?.dataset.galleryId;if(id)openViewer(id)});
  $('cabinetGalleryViewClose').addEventListener('click',closeViewer);
  $('cabinetGalleryDownload').addEventListener('click',download);
  $('cabinetGalleryDeleteVideo').addEventListener('click',deleteVideo);
  document.addEventListener('keydown',e=>{
   if(e.key==='Escape'&&!$('cabinetGalleryLightbox').hidden){e.preventDefault();e.stopImmediatePropagation();closeViewer()}
  },true);
  $('cabinetCover').addEventListener('click',ev=>{
   if(ev.target===$('cabinetCover')){closeViewer();$('cabinetCover').classList.remove('is-gallery')}
  });
  $('cabinetClose').addEventListener('click',()=>{closeViewer();$('cabinetCover').classList.remove('is-gallery')});
  document.querySelectorAll('[data-cabinet-tab]').forEach(b=>b.addEventListener('click',()=>{
   if(b.dataset.cabinetTab!=='gallery'){closeViewer();$('cabinetCover').classList.remove('is-gallery')}
  }));
  window.addEventListener('storage',e=>{if([PROJECTS_KEY,VIDEOS_KEY].includes(e.key)&&!$('cabinetGallery').hidden)activate()});
  window.DOM_RENDER_GALLERY={activate};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();