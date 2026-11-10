/* PLUX V24 · Audius free music search/player. Controls only real audio streams.
 * Text and voice commands are handled locally, no model/tool hallucinations.
 */
(()=>{"use strict";
 const API="https://pluh-voice-demo.onrender.com/api/music";
 const moods={"спокойн":"ambient","расслаб":"chill","релакс":"chill","фоновой":"ambient","для сна":"sleep","весел":"happy","джаз":"jazz","рок":"rock","электрон":"electronic","классическ":"classical","хип-хоп":"hip hop","танцеваль":"dance","лоуфай":"lofi","ло-фай":"lofi"};
 let tracks=[],current=-1,playing=false,busy=false,voiceTriggered=false;
 const audio=new Audio();audio.preload="none";audio.volume=.65;audio.setAttribute("playsinline","");
 const panel=document.createElement("div");panel.id="plux24-music-panel";panel.className="plux24-music-panel";panel.hidden=true;
 panel.innerHTML='<div class="plux24-music-shade" data-music-close></div><section class="plux24-music-sheet" role="dialog" aria-modal="true" aria-label="Музыка Audius"><header><div><strong>Музыка</strong><small>Каталог Audius · бесплатный поиск</small></div><button class="plux24-music-x" type="button" data-music-close aria-label="Закрыть">×</button></header><form id="plux24-music-search"><input id="plux24-music-query" type="search" placeholder="Исполнитель, песня, настроение…" autocomplete="off" aria-label="Найти музыку"><button type="submit" aria-label="Искать">Найти</button></form><p class="plux24-music-notice" role="status" aria-live="polite"></p><div class="plux24-music-tracks" role="list"></div><div class="plux24-music-controls" hidden><img class="plux24-music-cover" alt=""><div class="plux24-music-now"><strong></strong><small></small></div><button type="button" data-music-prev aria-label="Предыдущий трек">⏮</button><button type="button" data-music-toggle aria-label="Воспроизвести">▶</button><button type="button" data-music-next aria-label="Следующий трек">⏭</button></div><footer><span>Музыка принадлежит авторам на Audius.</span><a href="https://audius.co" target="_blank" rel="noopener noreferrer">Audius</a></footer></section>';
 document.body.append(panel);
 const $=sel=>panel.querySelector(sel);
 const notice=$(".plux24-music-notice"),results=$(".plux24-music-tracks"),controls=$(".plux24-music-controls"),cover=$(".plux24-music-cover"),nowTitle=$(".plux24-music-now strong"),nowArtist=$(".plux24-music-now small"),toggle=$("[data-music-toggle]");
 const form=$("#plux24-music-search"),query=$("#plux24-music-query");
 let opener=null;
 function show(text){notice.textContent=text||""}
 function open(){opener=document.activeElement;panel.hidden=false;document.body.classList.add("plux24-music-open");if(!tracks.length)void find("");}
 function close(){panel.hidden=true;document.body.classList.remove("plux24-music-open");opener?.focus?.({preventScroll:true})}
 panel.addEventListener("click",e=>{if(e.target.closest("[data-music-close]"))close()});
 document.addEventListener("keydown",e=>{if(!panel.hidden&&e.key==="Escape")close()});
 function update(){
  controls.hidden=current<0;playing=!audio.paused&&!audio.ended;
  toggle.textContent=playing?"Ⅱ":"▶";
  toggle.setAttribute("aria-label",playing?"Пауза":"Воспроизвести");
  const track=tracks[current];
  if(track){nowTitle.textContent=track.title;nowArtist.textContent=track.artist;cover.src=track.cover||"/icon-192.png";cover.hidden=false;}
  [...results.children].forEach((b,i)=>{b.classList.toggle("active",i===current);b.setAttribute("aria-pressed",String(i===current))});
 }
 function choose(i,autoplay=true){
  const track=tracks[i];if(!track)return false;
  if(!/^https:\/\/api\.audius\.co\/v1\/tracks\/[A-Za-z0-9_-]+\/stream\?/.test(track.stream||"")){show("Audius вернул неподдерживаемую ссылку.");return false}
  current=i;audio.src=track.stream;audio.load();update();
  if(autoplay)void audio.play().then(()=>{show("Сейчас играет Audius");update()}).catch(()=>{
    update();show("Нажми ▶, чтобы разрешить воспроизведение музыки на телефоне.");
  });
  else show("Нажми ▶ для воспроизведения.");
  return true;
 }
 function render(){
  results.replaceChildren();
  for(let i=0;i<tracks.length;i++){
   const t=tracks[i],b=document.createElement("button");
   b.type="button";b.className="plux24-music-track";b.setAttribute("role","listitem");
   const img=document.createElement("img");img.loading="lazy";img.alt="";img.src=t.cover||"/icon-192.png";
   const text=document.createElement("span");text.className="plux24-music-track-info";
   const title=document.createElement("strong");title.textContent=t.title;
   const artist=document.createElement("small");artist.textContent=t.artist;
   text.append(title,artist);
   const play=document.createElement("span");play.className="plux24-music-track-play";play.textContent="▶";
   b.append(img,text,play);b.addEventListener("click",()=>choose(i,true));results.append(b);
  }
  update();
 }
 async function find(term="",autoplay=false){
  if(busy)return;busy=true;
  const clean=String(term||"").trim().slice(0,96);
  show(clean?"Ищу музыку…":"Загружаю популярные треки Audius…");results.replaceChildren();
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),11000);
  try{
   const endpoint=clean?"/search?q="+encodeURIComponent(clean):"/trending";
   const response=await fetch(API+endpoint,{mode:"cors",headers:{"Accept":"application/json"},signal:abort.signal,cache:"no-store"});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(data.error||"Сервис музыки не отвечает");
   tracks=Array.isArray(data.tracks)?data.tracks.filter(t=>t&&typeof t.stream==="string"):[];
   current=-1;audio.pause();audio.removeAttribute("src");audio.load();render();
   show(tracks.length?("Найдено треков: "+tracks.length):"Не нашёл подходящих треков. Попробуй другой запрос.");
   if(tracks.length&&autoplay)choose(0,true);
  }catch(e){tracks=[];render();show(e.name==="AbortError"?"Поиск занял слишком много времени. Попробуй позже.":String(e.message||"Нет связи с Audius."))}
  finally{clearTimeout(timer);busy=false}
 }
 function playPause(){if(current<0){if(tracks.length)choose(0,true);else void find("");return}
  if(audio.paused)void audio.play().then(update).catch(()=>show("Нажми ▶, чтобы включить музыку."));
  else audio.pause();update();
 }
 function next(){if(tracks.length)choose((Math.max(current,0)+1)%tracks.length,true)}
 function prev(){if(tracks.length)choose((Math.max(current,1)-1+tracks.length)%tracks.length,true)}
 form.addEventListener("submit",e=>{e.preventDefault();void find(query.value,true)});
 $("[data-music-toggle]").addEventListener("click",playPause);
 $("[data-music-next]").addEventListener("click",next);
 $("[data-music-prev]").addEventListener("click",prev);
 audio.addEventListener("play",update);audio.addEventListener("pause",update);audio.addEventListener("ended",next);
 audio.addEventListener("error",()=>{show("Не удалось воспроизвести трек. Выбери другой или нажми ▶.");update()});
 const musicTile=document.querySelector('#screen-modes .mode-card[data-action="music"]');
 if(musicTile)musicTile.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();open()},{capture:true});
 function interpret(message,{source="chat"}={}){
  const original=String(message||"").trim();const text=original.toLowerCase();if(!text)return false;
  if(/^(?:пауза|останови музыку|выключи музыку|поставь на паузу|пауза музыка)$/i.test(text)){audio.pause();update();show("Музыка на паузе.");return true}
  if(/^(?:продолжи музыку|возобнови музыку|играй дальше)$/i.test(text)){open();playPause();return true}
  if(/^(?:следующий трек|переключи трек|следующую песню)$/i.test(text)){open();next();return true}
  if(!/(?:включи|поставь|запусти|найди|послушаем|послушать|сыграй|воспроизведи)/i.test(text))return false;
  if(!/(?:музык|песн|трек|плейлист|джаз|рок|рэп|класси|лоу.?фай|lofi|hip.?hop|ambient|jazz|поп|блюз|шансон|электрон|исполнител)/i.test(text))return false;
  let want=text.replace(/^(?:плюх[,!]?\s*)?(?:пожалуйста[,!]?\s*)?(?:включи|поставь|запусти|найди|послушаем|послушать|сыграй|воспроизведи)\s*/i,"")
    .replace(/^(?:мне|для меня|нам)\s*/i,"").replace(/\b(?:музыку|песню|трек|плейлист|из интернета|на аудиусе|на audius)\b/gi,"").trim();
  for(const [mood,search] of Object.entries(moods))if(text.includes(mood)){want=search;break}
  if(want.length>96)want=want.slice(0,96);
  open();query.value=want;
  // Mobile browsers can require a second user tap after an async provider search.
  // Voice commands open the player; they never claim a track played unless it did.
  void find(want,source==="chat");
  if(source==="voice"){voiceTriggered=true;show("Ищу трек по голосовой команде. Если нужно, нажми ▶.");}
  return true;
 }
 window.PLUXMusic={open,find,interpret,pause:()=>{audio.pause();update()},get state(){return {playing:!audio.paused,title:tracks[current]?.title||"",open:!panel.hidden}}};
})();
