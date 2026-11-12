/* PLUX V31 — compact free music & world-radio player.
 * Retains approved V30 greeting animation, then replaces that small capsule.
 * No music autoplay; streams Jamendo tracks, Audius, and radio from original hosts.
 */
(()=>{
 'use strict';
 if(window.PLUXMusicV31)return;
 const home=document.getElementById('screen-home');
 const greeting=document.getElementById('speech-button');
 if(!home||!greeting)return;
 const BACK='https://pluh-voice-demo.onrender.com';
 const audio=new Audio();audio.preload='none'; // Streaming servers need not support CORS for playback.
 const S={source:'jamendo',list:[],track:null,index:-1,busy:false};
 const el=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x};
 const mini=el('div','plux31-mini-player');mini.id='plux31-mini-player';mini.hidden=true;
 mini.setAttribute('role','group');mini.setAttribute('aria-label','Музыкальный плеер ПЛЮХ');
 const play=el('button','plux31-play','▶');play.type='button';play.setAttribute('aria-label','Воспроизвести музыку');
 const desc=el('div','plux31-now');
 const title=el('strong','','Музыка и радио'),artist=el('small','','Jamendo · Audius · радио');
 desc.append(title,artist);
 const search=el('button','plux31-search','⌕');search.type='button';search.setAttribute('aria-label','Найти музыку и радиостанции');
 mini.append(play,desc,search);
 greeting.insertAdjacentElement('afterend',mini);
 const dialog=el('dialog','plux31-music-dialog');
 dialog.setAttribute('aria-label','Музыка и радио');
 dialog.innerHTML=[
  '<section class="plux31-music-sheet">',
  '<header><div><strong>Музыка и радио</strong><small>PLUX • FREE MUSIC</small></div><button type="button" class="plux31-music-close" aria-label="Закрыть">×</button></header>',
  '<div class="plux31-source"><button type="button" data-source="jamendo" class="active">Jamendo</button><button type="button" data-source="radio">Радио</button><button type="button" data-source="tracks">Audius</button></div>',
  '<form class="plux31-query"><input type="search" placeholder="Поиск станции или исполнителя" maxlength="50" aria-label="Поиск музыки"><button type="submit">Найти</button></form>',
  '<div class="plux31-music-message" role="status">Выбери музыку или радиостанцию</div>',
  '<div class="plux31-music-results"></div>',
  '<footer>Jamendo Music · независимые артисты · Creative Commons. Воспроизведение только онлайн с серверов правообладателей; доступность зависит от страны.</footer>',
  '</section>'
 ].join('');
 document.body.append(dialog);
 const $=(sel)=>dialog.querySelector(sel);
 const note=$('.plux31-music-message'),list=$('.plux31-music-results'),inp=$('input');
 function sync(){
  play.textContent=audio.paused?'▶':'Ⅱ';play.setAttribute('aria-label',audio.paused?'Воспроизвести':'Пауза');
  if(S.track){title.textContent=S.track.title;artist.textContent=S.track.artist||S.track.country||'Музыка'}
 }
 function choose(t,idx){
  S.track=t;S.index=idx;audio.pause();audio.src=t.stream;audio.load();
  sync();
  if('mediaSession' in navigator){
   try{navigator.mediaSession.metadata=new MediaMetadata({
     title:t.title||'Радиостанция',artist:t.artist||'Интернет-радио',
     album:t.provider==='Jamendo'?'Jamendo Music':S.source==='radio'?'PLUX Radio':'Audius',
     artwork:t.cover?[{src:t.cover,sizes:'any'}]:[]
   })}catch{}
  }
  const started=audio.play();
  if(started?.catch)started.catch(()=>{note.textContent='Не удалось начать воспроизведение. Попробуй другую станцию.';sync()});
  sync();
 }
 function showRows(){
  list.replaceChildren();
  if(!S.list.length){note.textContent='Ничего не найдено. Попробуй другой запрос.';return}
  note.textContent='Найдено: '+S.list.length;
  S.list.forEach((t,i)=>{
   const b=el('button','plux31-result');b.type='button';
   const icon=el('span','plux31-result-icon',S.source==='radio'?'◉':'♫');
   const text=el('span','plux31-result-text');
   text.append(el('strong','',t.title),el('small','',(t.artist||t.country||'')+(S.source==='jamendo'?' · Jamendo':'')));
   b.append(icon,text,el('span','plux31-result-play','▶'));
   b.onclick=()=>{choose(t,i);dialog.close()};
   list.append(b);
  });
 }
 async function load(q=''){
  if(S.busy)return;
  S.busy=true;note.textContent='Ищу музыку…';list.replaceChildren();
  const url=BACK+(S.source==='radio'?'/api/music/radio'+(q?'?q='+encodeURIComponent(q):''):
   S.source==='jamendo'?'/api/music/jamendo'+(q?'?q='+encodeURIComponent(q):''):
   '/api/music/'+(q?'search?q='+encodeURIComponent(q):'trending'));
  try{
   const r=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(14000)});
   const d=await r.json().catch(()=>({}));
   if(!r.ok)throw Error(d.error||'Сервис недоступен');
   S.list=(S.source==='radio'?d.stations:d.tracks)||[];
   showRows();
  }catch(e){note.textContent=String(e.message||'Нет связи с музыкальным сервисом.');}
  finally{S.busy=false}
 }
 $('.plux31-music-close').onclick=()=>dialog.close();
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
 dialog.querySelectorAll('[data-source]').forEach(b=>{
   b.onclick=()=>{
     S.source=b.dataset.source;dialog.querySelectorAll('[data-source]').forEach(x=>x.classList.toggle('active',x===b));
     inp.placeholder=S.source==='radio'?'Название станции или жанр':S.source==='jamendo'?'Поиск в Jamendo: жанр или артист':'Исполнитель или название трека';
     inp.value='';void load();
   };
 });
 $('.plux31-query').onsubmit=e=>{e.preventDefault();void load(inp.value.trim())};
 search.onclick=()=>{if(!dialog.open)dialog.showModal();void load()};
 play.onclick=async()=>{
   if(!S.track){if(!dialog.open)dialog.showModal();void load();return}
   if(audio.paused)try{await audio.play()}catch{if(!dialog.open)dialog.showModal();note.textContent='Поток не воспроизводится. Выбери другую станцию.'}
   else audio.pause();
   sync();
 };
 audio.onplay=sync;audio.onpause=sync;
 audio.onerror=()=>{if(S.track){artist.textContent='Станция временно недоступна';sync()}};
 try{
  navigator.mediaSession?.setActionHandler?.('play',()=>{void audio.play().then(sync).catch(()=>{})});
  navigator.mediaSession?.setActionHandler?.('pause',()=>{audio.pause();sync()});
 }catch{}
 let switched=false;
 const showMini=()=>{
  if(switched)return;
  switched=true;
  greeting.hidden=true;
  greeting.style.display='none';
  mini.hidden=false;
 };
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 // Allow welcome typewriter to finish before substituting a useful module.
 const transitionMs=reduced?4500:9500;
 setTimeout(showMini,transitionMs);
 window.PLUXMusicV31={open:()=>{if(!dialog.open)dialog.showModal();void load()},stop:()=>audio.pause()};
})();