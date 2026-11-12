/* PLUX V24 Gallery · save actual generated photos and videos in device IndexedDB.
 * Local, private, offline after completed download; not server/cloud sync.
 */
(()=>{"use strict";
 const DB="plux-gallery-v24",STORE="media",MAX_IMAGE=25*1024*1024,MAX_VIDEO=85*1024*1024;
 const supported=typeof indexedDB!=="undefined";
 let tab="all",rows=[],urls=[],preview=null,loading=false;
 const overlay=document.createElement("div");overlay.id="plux24-gallery";overlay.className="plux24-gallery";overlay.hidden=true;
 overlay.innerHTML='<div class="plux24-gallery-shade" data-gallery-close></div><section class="plux24-gallery-sheet" role="dialog" aria-modal="true" aria-label="Галерея ПЛЮХа"><header><div><strong>Моя галерея</strong><small>Сгенерированные фото и видео · на этом устройстве</small></div><button class="plux24-gallery-x" data-gallery-close type="button" aria-label="Закрыть">×</button></header><div class="plux24-gallery-tabs" role="tablist" aria-label="Фильтр галереи"><button type="button" data-gallery-tab="all" class="selected" aria-selected="true">Все</button><button type="button" data-gallery-tab="image" aria-selected="false">Фото</button><button type="button" data-gallery-tab="video" aria-selected="false">Видео</button></div><p class="plux24-gallery-note" role="status" aria-live="polite"></p><div class="plux24-gallery-grid"></div><small class="plux24-gallery-disclaimer">Файлы хранятся локально. При удалении приложения или очистке данных они могут исчезнуть — сохраняй важное в телефон.</small></section>';
 document.body.append(overlay);
 const $=sel=>overlay.querySelector(sel);
 const grid=$(".plux24-gallery-grid"),note=$(".plux24-gallery-note");
 const tile=document.querySelector('#screen-modes .mode-card[data-action="more"]');
 if(tile){
  tile.dataset.action="gallery";tile.setAttribute("aria-label","Моя галерея: все созданные фото и видео");
  tile.innerHTML='<span class="plux24-gallery-tile-icon" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="6" width="24" height="21" rx="4"/><circle cx="12" cy="13" r="2.5"/><path d="m6 23 7.5-7 5.5 4 3.5-3.5 4 5"/></svg></span><strong>Галерея</strong><small>Мои фото и видео</small>';
  tile.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();void open()},{capture:true});
 }
 const openDB=()=>new Promise((resolve,reject)=>{
  if(!supported)return reject(Error("Браузер не поддерживает локальную галерею."));
  const request=indexedDB.open(DB,1);
  request.onupgradeneeded=()=>{const store=request.result.createObjectStore(STORE,{keyPath:"id"});store.createIndex("createdAt","createdAt");};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(Error("Хранилище недоступно или переполнено."));
 });
 async function transaction(mode,callback){
  const db=await openDB();
  try{return await new Promise((resolve,reject)=>{
   let result;
   const tx=db.transaction(STORE,mode),store=tx.objectStore(STORE);
   tx.onerror=()=>reject(tx.error||Error("Ошибка локальной галереи"));
   tx.onabort=()=>reject(tx.error||Error("Галерея не сохранила файл"));
   tx.oncomplete=()=>resolve(result);
   try{const request=callback(store);if(request){request.onsuccess=()=>{result=request.result};request.onerror=()=>{tx.abort()}}}
   catch(e){try{tx.abort()}catch{}reject(e)}
  })}finally{db.close()}
 }
 const list=()=>transaction("readonly",s=>s.getAll());
 const remove=id=>transaction("readwrite",s=>s.delete(id));
 const put=item=>transaction("readwrite",s=>s.put(item));
 const clean=()=>{for(const u of urls)URL.revokeObjectURL(u);urls=[]};
 const makeUrl=blob=>{const url=URL.createObjectURL(blob);urls.push(url);return url};
 const safeName=(v,ext)=>String(v||"PLUX-"+Date.now()+"."+ext).replace(/[\\\/<>:*?"|\u0000-\u001f]/g,"").slice(0,110);
 function status(text){note.textContent=text}
 async function save({kind="image",source,filename,caption="",model=""}={}){
  if(kind!=="image"&&kind!=="video")return false;
  const sizeLimit=kind==="image"?MAX_IMAGE:MAX_VIDEO;
  if(!source)return false;
  try{
   let blob;
   if(source instanceof Blob)blob=source;
   else if(typeof source==="string"&&/^data:image\/(png|jpeg|webp);base64,/.test(source))blob=await(await fetch(source)).blob();
   else if(typeof source==="string"&&/^https:\/\//.test(source)){
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),60000);
    try{
     const r=await fetch(source,{mode:"cors",credentials:"omit",signal:controller.signal});
     if(!r.ok||Number(r.headers.get("content-length")||0)>sizeLimit)throw Error("Файл слишком большой или недоступен.");
     blob=await r.blob();
    }finally{clearTimeout(timeout)}
   }else return false;
   if(!blob||blob.size<1000||blob.size>sizeLimit)throw Error("Файл слишком большой.");
   if(kind==="image"&&!blob.type.startsWith("image/"))throw Error("Результат не является изображением.");
   if(kind==="video"&&blob.type&&!blob.type.startsWith("video/")&&!/octet-stream/.test(blob.type))throw Error("Неизвестный формат видео.");
   const name=safeName(filename,kind==="image"?"png":"mp4");
   const item={id:(crypto.randomUUID?.()||Date.now()+"-"+Math.random().toString(36).slice(2)),createdAt:Date.now(),
    kind,blob,filename:name,caption:String(caption).slice(0,160),model:String(model).slice(0,50)};
   await put(item);
   if(!overlay.hidden)void refresh();
   return true;
  }catch(e){
   console.warn("PLUX gallery local save unavailable",String(e.message).slice(0,80));
   if(!overlay.hidden)status("Не удалось сохранить в галерею: "+String(e.message||"Проверь память телефона."));
   return false;
  }
 }
 async function refresh(){
  if(loading)return;
  loading=true;grid.replaceChildren();clean();
  try{
   rows=(await list()).sort((a,b)=>b.createdAt-a.createdAt);
   const filtered=rows.filter(x=>tab==="all"||x.kind===tab);
   if(!filtered.length){
    const empty=document.createElement("div");empty.className="plux24-gallery-empty";
    empty.innerHTML='<div aria-hidden="true">✦</div><strong>Здесь появятся твои работы</strong><p>Изображения и видео сохраняются после успешной генерации на этом устройстве.</p>';
    grid.append(empty);
   }
   for(const item of filtered){
    const url=makeUrl(item.blob),button=document.createElement("button");button.type="button";
    button.className="plux24-gallery-item";
    const media=document.createElement(item.kind==="video"?"video":"img");
    media.src=url;media.preload="metadata";if(item.kind==="video"){media.muted=true;media.playsInline=true;media.setAttribute("playsinline","");}
    else{media.loading="lazy";media.alt=item.caption||item.filename}
    const mark=document.createElement("span");mark.textContent=item.kind==="video"?"▶ Видео":"Фото";mark.className="plux24-gallery-mark";
    const label=document.createElement("small");label.textContent=new Date(item.createdAt).toLocaleDateString("ru-RU");label.className="plux24-gallery-date";
    button.append(media,mark,label);button.addEventListener("click",()=>view(item));grid.append(button);
   }
   status(rows.length?rows.length+" файлов сохранено на устройстве":"");
  }catch(e){status(String(e.message||"Не удалось открыть галерею."))}
  finally{loading=false}
 }
 function view(item){
  if(preview)preview.remove();
  preview=document.createElement("div");preview.className="plux24-gallery-preview";preview.setAttribute("role","dialog");preview.setAttribute("aria-modal","true");preview.setAttribute("aria-label","Просмотр файла");
  const box=document.createElement("div");box.className="plux24-gallery-preview-box";
  const back=document.createElement("button");back.type="button";back.textContent="← Назад";back.className="plux24-gallery-preview-back";
  back.addEventListener("click",()=>{preview.remove();preview=null});
  const el=document.createElement(item.kind==="video"?"video":"img");el.src=makeUrl(item.blob);
  if(item.kind==="video"){el.controls=true;el.playsInline=true;el.preload="metadata";}
  else el.alt=item.caption||"Изображение ПЛЮХа";
  const info=document.createElement("p");info.textContent=item.caption||item.filename;
  const buttons=document.createElement("div");buttons.className="plux24-gallery-preview-actions";
  const saveFile=document.createElement("a");saveFile.textContent="Сохранить в телефон";saveFile.href=el.src;saveFile.download=item.filename;
  const del=document.createElement("button");del.textContent="Удалить";del.type="button";
  del.addEventListener("click",async()=>{if(!window.confirm("Удалить этот файл из галереи ПЛЮХа?"))return;await remove(item.id);preview.remove();preview=null;void refresh()});
  buttons.append(saveFile,del);
  if(item.kind==="image"){
   const animate=document.createElement("button");animate.type="button";animate.textContent="Сделать видео";
   animate.addEventListener("click",()=>{
    if(!window.PLUXVideoV16?.open){status("Генератор видео пока не загружен");return}
    // Video generator needs image data, not a revoked blob URL from the gallery.
    const reader=new FileReader();
    reader.onerror=()=>status("Не получилось прочитать изображение из галереи.");
    reader.onload=()=>{
      const data=String(reader.result||"");
      if(!data.startsWith("data:image/")){status("Неверный формат изображения.");return}
      preview.remove();preview=null;close();
      window.PLUXVideoV16.open({imageDataUrl:data,name:item.filename,prompt:"Кинематографичная анимация исходного изображения с сохранением деталей."});
    };
    reader.readAsDataURL(item.blob);
   });buttons.append(animate);
  }
  box.append(back,el,info,buttons);preview.append(box);overlay.append(preview);
 }
 function close(){
  if(preview){preview.remove();preview=null}
  overlay.hidden=true;document.body.classList.remove("plux24-gallery-open");clean();
 }
 async function open(){overlay.hidden=false;document.body.classList.add("plux24-gallery-open");await refresh()}
 overlay.addEventListener("click",e=>{if(e.target.closest("[data-gallery-close]"))close()});
 overlay.querySelector(".plux24-gallery-tabs").addEventListener("click",e=>{
  const btn=e.target.closest("[data-gallery-tab]");if(!btn)return;
  tab=btn.dataset.galleryTab;
  for(const b of overlay.querySelectorAll("[data-gallery-tab]")){
   const active=b===btn;b.classList.toggle("selected",active);b.setAttribute("aria-selected",String(active));
  }
  void refresh();
 });
 document.addEventListener("keydown",e=>{if(!overlay.hidden&&e.key==="Escape"){e.preventDefault();if(preview){preview.remove();preview=null}else close()}});
 window.PLUXGallery={open,save,refresh};
})();
