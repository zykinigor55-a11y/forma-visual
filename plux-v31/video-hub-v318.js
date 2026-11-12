/* PLUX V31.8 VIDEO: official platform embeds and private per-device favourites.
   No YouTube Data API key, copyrighted video downloads or playback proxies.
   Embedded players start ONLY on user gesture. */
(()=>{
"use strict";
if(window.PLUXVideoHubV318)return;
const nav=document.querySelector("#screen-home .bottom-nav");
if(!nav)return;
const storeKey="plux_video_favorites_v318";
const create=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el};
const providers={
 youtube:{name:"YouTube",search:q=>"https://www.youtube.com/results?search_query="+encodeURIComponent(q)},
 rutube:{name:"RUTUBE",search:q=>"https://rutube.ru/search/?query="+encodeURIComponent(q)},
 vk:{name:"VK Видео",search:q=>"https://vkvideo.ru/search?query="+encodeURIComponent(q)}
};
function safeVideo(raw){
 let u;try{u=new URL(String(raw||"").trim())}catch{throw Error("Вставь полную HTTPS-ссылку на видео")}
 if(u.protocol!=="https:"||u.username||u.password)throw Error("Разрешены только HTTPS-ссылки YouTube, RUTUBE и VK Видео");
 const host=u.hostname.toLowerCase().replace(/^www\./,"").replace(/^m\./,"");
 const path=u.pathname;
 if(["youtube.com","youtu.be","youtube-nocookie.com"].includes(host)){
  let id;
  if(host==="youtu.be")id=path.split("/")[1];
  else if(path==="/watch")id=u.searchParams.get("v");
  else id=/^\/(?:shorts|live|embed|v)\/([a-zA-Z0-9_-]{11})/.exec(path)?.[1];
  if(!/^[a-zA-Z0-9_-]{11}$/.test(id||""))throw Error("У YouTube не найден идентификатор видео");
  return {provider:"youtube",url:"https://www.youtube.com/watch?v="+id,embed:"https://www.youtube-nocookie.com/embed/"+id+"?playsinline=1&rel=0"};
 }
 if(host==="rutube.ru"){
  const id=/^\/(?:video|shorts)\/([a-f0-9]{32})(?:\/|$)/i.exec(path)?.[1]||
           /^\/play\/embed\/([a-f0-9]{32})(?:\/|$)/i.exec(path)?.[1];
  if(!id)throw Error("У RUTUBE не найден ID видео — скопируй обычную ссылку на ролик");
  return {provider:"rutube",url:"https://rutube.ru/video/"+id+"/",embed:"https://rutube.ru/play/embed/"+id};
 }
 if(host==="vkvideo.ru"||host==="vk.com"){
  const oid=u.searchParams.get("oid"),vid=u.searchParams.get("id"),hash=u.searchParams.get("hash");
  if(path==="/video_ext.php"&&/^-?\d+$/.test(oid||"")&&/^\d+$/.test(vid||"")&&/^[a-z0-9_-]{8,80}$/i.test(hash||"")){
   const source="https://vkvideo.ru/video_ext.php?oid="+oid+"&id="+vid+"&hash="+encodeURIComponent(hash);
   return {provider:"vk",url:"https://vkvideo.ru/video"+oid+"_"+vid,embed:source};
  }
  if(/^\/video-?\d+_\d+/.test(path))return {provider:"vk",url:u.origin+path,embed:null};
  throw Error("Для VK Видео скопируй ссылку на ролик либо код вставки плеера");
 }
 throw Error("Ссылка не относится к YouTube, RUTUBE или VK Видео");
}
function favorites(){try{const v=JSON.parse(localStorage.getItem(storeKey)||"[]");return Array.isArray(v)?v.filter(x=>x&&typeof x.url==="string").slice(0,40):[]}catch{return []}}
function saveFavorites(items){try{localStorage.setItem(storeKey,JSON.stringify(items.slice(0,40)))}catch{status("Не удалось сохранить избранное на этом устройстве",true)}}
const button=create("button","nav-button plux318-video-nav");
button.id="plux-videos-open";button.type="button";button.setAttribute("aria-label","Открыть раздел Видео");
button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.8" y="4.6" width="18.4" height="14.8" rx="4"/><path d="m10 9 5 3-5 3z"/></svg><span>Видео</span>';
nav.append(button);
const panel=create("section","plux318-video");
panel.id="plux-video-panel";panel.hidden=true;panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");panel.setAttribute("aria-label","Видео ПЛЮХ");
panel.innerHTML=[
 '<div class="pv-shell">',
 '<header class="pv-head"><button class="pv-back" type="button" aria-label="Вернуться">‹</button><div><strong>Видео <em>✧</em></strong><small>PLUX • WATCH & SHARE</small></div><span class="pv-head-logo">▷</span></header>',
 '<div class="pv-scroll">',
 '<div class="pv-intro"><b>Смотри и делись</b><p>Видео с любимых площадок — в одном месте. Открой ролик по ссылке, сохрани его или отправь другу.</p></div>',
 '<div class="pv-tabs" role="group" aria-label="Видеоплощадки"><button class="pv-source active" type="button" data-source="youtube">YouTube</button><button class="pv-source" type="button" data-source="rutube">RUTUBE</button><button class="pv-source" type="button" data-source="vk">VK Видео</button></div>',
 '<form class="pv-search"><label for="pv-search-term">Найти видео</label><div class="pv-inline"><input id="pv-search-term" type="search" placeholder="Например: уроки нейросетей" maxlength="110"><button type="submit">Искать</button></div><small>Поиск откроется на выбранной площадке. Для просмотра в ПЛЮХ скопируй ссылку на ролик.</small></form>',
 '<form class="pv-link"><label for="pv-video-url">Ссылка на видео</label><div class="pv-inline"><input id="pv-video-url" type="url" inputmode="url" placeholder="https://youtube.com/watch?v=…" required><button type="submit">Открыть</button></div></form>',
 '<div class="pv-status" role="status" aria-live="polite">Вставь ссылку на ролик, чтобы открыть официальный плеер.</div>',
 '<section class="pv-player" hidden><div class="pv-frame"></div><div class="pv-meta"><strong class="pv-label">Видео</strong><small class="pv-provider"></small></div><div class="pv-actions"><button class="pv-fav" type="button">☆ В избранное</button><button class="pv-share" type="button">↗ Другу</button><button class="pv-external" type="button">Открыть на сайте</button></div></section>',
 '<section class="pv-favourites"><div class="pv-section-title"><strong>Избранное</strong><small>Сохраняется на этом устройстве</small></div><div class="pv-favourites-list"></div></section>',
 '<p class="pv-legal">Видео воспроизводятся в официальных плеерах платформ. Доступность роликов зависит от страны, прав и настроек автора. Не все VK Видео разрешают встраивание.</p>',
 '</div></div>'
].join("");
document.body.append(panel);
const $=sel=>panel.querySelector(sel);
let source="youtube",selected=null,lastFocus=null;
function status(value,bad=false){const n=$(".pv-status");n.textContent=value;n.classList.toggle("bad",bad)}
function setSource(name){if(!providers[name])return;source=name;panel.querySelectorAll(".pv-source").forEach(b=>b.classList.toggle("active",b.dataset.source===source))}
function stopPlayer(){const area=$(".pv-frame");area.replaceChildren()}
function close(){stopPlayer();panel.hidden=true;button.setAttribute("aria-expanded","false");lastFocus?.focus?.({preventScroll:true})}
function open(){lastFocus=document.activeElement;panel.hidden=false;button.setAttribute("aria-expanded","true");drawFavorites()}
function openExternal(url){const a=create("a");a.href=url;a.target="_blank";a.rel="noopener noreferrer";document.body.append(a);a.click();a.remove()}
function drawFavorites(){
 const box=$(".pv-favourites-list");box.replaceChildren();const items=favorites();
 if(!items.length){box.append(create("div","pv-empty","Здесь появятся видео, которые ты сохранишь."));return}
 for(const item of items){
  let v;try{v=safeVideo(item.url)}catch{continue}
  const row=create("div","pv-bookmark");
  const title=create("button","pv-bookmark-title",providers[v.provider].name+" · "+(item.title||"Сохранённое видео"));
  title.type="button";title.onclick=()=>play(v);
  const remove=create("button","pv-bookmark-remove","×");remove.type="button";remove.setAttribute("aria-label","Удалить из избранного");
  remove.onclick=()=>{saveFavorites(favorites().filter(x=>x.url!==item.url));drawFavorites()};
  row.append(title,remove);box.append(row);
 }
}
function play(v){
 selected=v;stopPlayer();setSource(v.provider);$("#pv-video-url").value=v.url;
 const container=$(".pv-frame"),area=$(".pv-player");area.hidden=false;
 $(".pv-provider").textContent=providers[v.provider].name;
 $(".pv-label").textContent="Просмотр через "+providers[v.provider].name;
 if(v.embed){
  const frame=create("iframe");frame.src=v.embed;frame.title="Видео — "+providers[v.provider].name;
  frame.loading="eager";frame.referrerPolicy="strict-origin-when-cross-origin";
  frame.allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write";
  frame.allowFullscreen=true;frame.setAttribute("allowfullscreen","");
  container.append(frame);
  status("Открыт официальный плеер "+providers[v.provider].name+".");
 }else{
  const note=create("p","pv-embed-notice","VK Видео не предоставил код встраивания в этой ссылке. Нажми «Открыть на сайте» для просмотра.");
  container.append(note);status("Для VK Видео нужна ссылка на плеер из «Поделиться → Код вставки».");
 }
 $(".pv-fav").textContent=favorites().some(x=>x.url===v.url)?"★ Сохранено":"☆ В избранное";
 area.scrollIntoView({behavior:"smooth",block:"nearest"});
}
function share(){
 if(!selected)return;
 try{sessionStorage.setItem("plux_pending_shared_video",selected.url)}catch{}
 close();
 if(window.PLUXFriendsV17?.configured?.()){
  void window.PLUXFriendsV17.open();return;
 }
 if(navigator.share){void navigator.share({url:selected.url,title:"Видео из ПЛЮХ"}).catch(()=>{})}
 else if(navigator.clipboard?.writeText){void navigator.clipboard.writeText(selected.url)}
}
button.onclick=open;$(".pv-back").onclick=close;
panel.querySelectorAll(".pv-source").forEach(b=>b.onclick=()=>setSource(b.dataset.source));
$(".pv-search").onsubmit=e=>{e.preventDefault();const q=$("#pv-search-term").value.trim();if(!q){status("Введи поисковый запрос",true);return}openExternal(providers[source].search(q));status("Поиск открыт на "+providers[source].name+". Скопируй ссылку понравившегося ролика.")};
$(".pv-link").onsubmit=e=>{e.preventDefault();try{play(safeVideo($("#pv-video-url").value))}catch(x){status(x.message,true)}};
$(".pv-fav").onclick=()=>{if(!selected)return;const a=favorites();if(!a.some(x=>x.url===selected.url)){a.unshift({url:selected.url,title:"Видео",savedAt:Date.now()});saveFavorites(a)}drawFavorites();$(".pv-fav").textContent="★ Сохранено";status("Ролик добавлен в избранное")};
$(".pv-share").onclick=share;
$(".pv-external").onclick=()=>{if(selected)openExternal(selected.url)};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!panel.hidden){e.preventDefault();close()}});
window.PLUXVideoHubV318={open,close,parse:safeVideo};
})();