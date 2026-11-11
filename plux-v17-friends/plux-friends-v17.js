/* PLUX Friends v17: browser client; the database enforces privacy with RLS. */
(()=>{
'use strict';
if(window.PLUXFriendsV17)return;
const conf=window.PLUX_FRIENDS_CONFIG||{};
const base=/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(conf.url||'')?conf.url:'';
const key=/^(sb_publishable_|eyJ)/.test(conf.anonKey||'')?conf.anonKey:'';
const S={session:null,user:null,friends:[],requests:[],tab:'friends',dialog:null,person:null,timer:0,pictures:new Map(),busy:false,signature:''};
const id=x=>document.getElementById(x);
const make=(tag,cl,text)=>{const n=document.createElement(tag);if(cl)n.className=cl;if(text!==undefined)n.textContent=text;return n};
const visible=(x,on)=>{id(x).hidden=!on};
const notice=(s,bad=false)=>{id('pf-alert').textContent=s;id('pf-alert').hidden=!s;id('pf-alert').classList.toggle('bad',bad)};
const h=(opts={})=>({apikey:key, ...(S.session?.access_token?{Authorization:'Bearer '+S.session.access_token}:{}),...opts});
async function fetcher(path,method='GET',body=null,binary=false,retry=false){
 if(!base||!key)throw Error('Сервис общения пока не подключён');
 const headers=h(binary&&body?{'Content-Type':body.type}:{Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})});
 const response=await fetch(base+path,{method,headers,body:binary?body:body?JSON.stringify(body):undefined,cache:'no-store'});
 if(response.status===401&&S.session?.refresh_token&&!retry){await refresh();return fetcher(path,method,body,binary,true)}
 const type=response.headers.get('content-type')||'';
 const value=binary&&method==='GET'?await response.blob():type.includes('json')?await response.json().catch(()=>null):await response.text();
 if(!response.ok)throw Error(String(value?.message||value?.error_description||value?.error||value||'Ошибка сервера').slice(0,180));
 return value;
}
function setSession(data){S.session=data;S.user=data.user;try{sessionStorage.setItem('plux_friends_session',JSON.stringify(data))}catch{}}
async function refresh(){
 const r=await fetch(base+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:S.session.refresh_token})});
 const d=await r.json();if(!r.ok)throw Error('Сессия истекла');setSession(d);
}
async function start(){
 const me=await fetcher('/rest/v1/plux_profiles?select=id,handle,display_name&id=eq.'+S.user.id);
 S.profile=me[0];id('pf-myname').textContent=S.profile?.display_name||'Профиль';
 id('pf-myhandle').textContent='@'+(S.profile?.handle||'');
 id('pf-display').value=S.profile?.display_name||'';
 id('pf-handle').value=S.profile?.handle||'';
 visible('pf-signin',false);visible('pf-content',true);
 await people();drawPeople();beginPolling();
}
async function people(){
 const [friends,requests]=await Promise.all([
  fetcher('/rest/v1/plux_friends?select=user_a,user_b'),
  fetcher('/rest/v1/plux_requests?select=id,from_id&to_id=eq.'+S.user.id+'&status=eq.pending')
 ]);
 const ids=(friends||[]).map(p=>p.user_a===S.user.id?p.user_b:p.user_a);
 const all=[...new Set([...ids,...(requests||[]).map(x=>x.from_id)])];
 const profiles=all.length?await fetcher('/rest/v1/plux_profiles?select=id,handle,display_name&id=in.('+all.join(',')+')'):[];
 const dict=new Map(profiles.map(p=>[p.id,p]));
 S.friends=ids.map(x=>dict.get(x)).filter(Boolean);
 S.requests=(requests||[]).map(x=>({...x,profile:dict.get(x.from_id)}));
 id('pf-count').textContent=S.requests.length||'';
}
function item(p,label,fn){
 const row=make('div','pf-person'),avatar=make('span','pf-avatar',(p.display_name||'?')[0].toUpperCase());
 const names=make('div','pf-person-title');names.append(make('strong','',p.display_name),make('small','','@'+p.handle));
 const btn=make('button','pf-btn',label);btn.type='button';btn.onclick=fn;row.append(avatar,names,btn);return row;
}
function drawPeople(){
 visible('pf-people',S.tab!=='search');visible('pf-search-area',S.tab==='search');
 document.querySelectorAll('.pf-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===S.tab));
 const list=id('pf-list');list.replaceChildren();
 if(S.tab==='friends')for(const p of S.friends)list.append(item(p,'Написать ›',()=>openChat(p)));
 if(S.tab==='requests')for(const q of S.requests)if(q.profile)list.append(item(q.profile,'✓ Принять',()=>act(async()=>{
   await fetcher('/rest/v1/rpc/plux_accept_friend','POST',{p_request_id:q.id});
   await people();drawPeople();notice('Теперь вы друзья!');
 })));
 if(!list.children.length)list.append(make('div','pf-empty',S.tab==='friends'?'Здесь появятся друзья. Найдите человека по его нику.':'Новых заявок пока нет.'));
}
async function searchFriend(){
 const name=id('pf-query').value.trim().toLowerCase();
 if(!/^[a-z0-9_]{3,24}$/.test(name))throw Error('Введите ник: латиница, цифры, _, от 3 до 24 символов');
 const list=await fetcher('/rest/v1/plux_profiles?select=id,handle,display_name&handle=eq.'+encodeURIComponent(name));
 const container=id('pf-found');container.replaceChildren();
 if(!list.length)container.append(make('div','pf-empty','Пользователь не найден'));
 for(const p of list)container.append(item(p,p.id===S.user.id?'Это вы':'＋ Добавить',()=>act(async()=>{
   if(p.id===S.user.id)return;
   await fetcher('/rest/v1/rpc/plux_request_friend','POST',{p_handle:p.handle});notice('Заявка отправлена пользователю @'+p.handle);
 })));
}
async function openChat(p){
 await act(async()=>{
  const dialog=await fetcher('/rest/v1/rpc/plux_start_dialog','POST',{p_friend_id:p.id});
  S.dialog=dialog;S.person=p;S.signature='';
  id('pf-peer').textContent=p.display_name;id('pf-peername').textContent='@'+p.handle;
  visible('pf-social',false);visible('pf-chat',true);await loadMessages();
 });
}
function leaveChat(){S.dialog=null;S.signature='';visible('pf-social',true);visible('pf-chat',false)}
async function photo(url,im){
 try{
  let obj=S.pictures.get(url);
  if(!obj){
   const blob=await fetcher('/storage/v1/object/authenticated/plux-friends/'+url,'GET',null,true);
   if(!blob.type.startsWith('image/'))throw Error('Неверный формат');
   obj=URL.createObjectURL(blob);S.pictures.set(url,obj);
  }if(im.isConnected)im.src=obj;
 }catch{im.alt='Файл недоступен';}
}
async function loadMessages(){
 if(!S.dialog)return;
 const rows=await fetcher('/rest/v1/plux_messages?select=id,sender_id,content,photo_path,created_at&dialog_id=eq.'+S.dialog+'&order=created_at.asc&limit=100');
 const signature=rows.map(x=>x.id).join(',');
 if(signature===S.signature)return;
 S.signature=signature;
 const pane=id('pf-messages'),near=pane.scrollHeight-pane.scrollTop-pane.clientHeight<100;pane.replaceChildren();
 if(!rows.length)pane.append(make('p','pf-empty','Напишите первое сообщение'));
 for(const m of rows){
  const bubble=make('article','pf-bubble '+(m.sender_id===S.user.id?'mine':'theirs'));
  if(m.content)bubble.append(make('p','',m.content));
  if(m.photo_path){const im=make('img','pf-photo');im.alt='Фото';bubble.append(im);void photo(m.photo_path,im);}
  const date=new Date(m.created_at);bubble.append(make('time','',date.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})));pane.append(bubble);
 }
 if(near)pane.scrollTop=pane.scrollHeight;
}
async function send(){
 if(!S.dialog)return;
 const content=id('pf-input').value.trim(),file=id('pf-file').files[0];if(!content&&!file)return;
 await act(async()=>{
  let photo_path=null;
  if(file){
   const ext=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'})[file.type];
   if(!ext||file.size>6*1024*1024)throw Error('Можно отправить JPG, PNG или WEBP до 6 МБ');
   photo_path=S.dialog+'/'+S.user.id+'/'+crypto.randomUUID()+'.'+ext;
   await fetcher('/storage/v1/object/plux-friends/'+photo_path,'POST',file,true);
  }
  await fetcher('/rest/v1/plux_messages','POST',{dialog_id:S.dialog,sender_id:S.user.id,content:content.slice(0,4000),photo_path});
  id('pf-input').value='';id('pf-file').value='';id('pf-file-title').textContent='';
  S.signature='';await loadMessages();
 });
}
async function act(fn){
 if(S.busy)return;S.busy=true;try{await fn()}catch(e){notice(e.message,true)}finally{S.busy=false}
}
function beginPolling(){
 clearInterval(S.timer);
 S.timer=setInterval(()=>{
  if(id('plux-friends-panel').hidden||document.hidden||S.busy)return;
  if(S.dialog)void loadMessages().catch(()=>{});
  else void people().then(drawPeople).catch(()=>{});
 },10000);
}
function close(){
 id('plux-friends-panel').hidden=true;clearInterval(S.timer);S.timer=0;
 for(const u of S.pictures.values())URL.revokeObjectURL(u);S.pictures.clear();
}
async function open(){
 id('plux-friends-panel').hidden=false;notice('');
 if(!base||!key){visible('pf-setup',true);visible('pf-signin',false);visible('pf-content',false);return;}
 visible('pf-setup',false);
 if(S.session&&S.user){await start();return;}
 try{
  const s=JSON.parse(sessionStorage.getItem('plux_friends_session')||'null');
  if(s?.refresh_token){S.session=s;await refresh();await start();return;}
 }catch{}
 visible('pf-signin',true);visible('pf-content',false);
}
const root=document.createElement('div');root.id='plux-friends-panel';root.hidden=true;
root.innerHTML=[
'<section class="pf-shell"><header class="pf-head"><button id="pf-close" aria-label="Назад">‹</button><div><strong>Друзья <em>✦</em></strong><small>PLUX • PRIVATE MESSENGER</small></div><span>◈</span></header>',
'<div id="pf-alert" class="pf-alert" role="status" hidden></div>',
'<section id="pf-setup" class="pf-section" hidden><h2>Общение в ПЛЮХ</h2><p>Модуль готов. Для настоящих чатов необходимо подключить Supabase с защищённой базой, аккаунтами и приватным хранилищем фото.</p></section>',
'<section id="pf-signin" class="pf-section" hidden><small>АККАУНТ</small><h2>Привет! Найди своих друзей</h2><p>Создай профиль по электронной почте, чтобы начать общение.</p><form id="pf-login"><input id="pf-email" type="email" placeholder="Электронная почта" autocomplete="email" required><input id="pf-password" type="password" placeholder="Пароль от 8 символов" minlength="8" required><div class="pf-row"><button>Войти</button><button id="pf-register" type="button">Регистрация</button></div></form></section>',
'<section id="pf-content" hidden><div id="pf-social" class="pf-section"><div class="pf-profile"><div><strong id="pf-myname"></strong><small id="pf-myhandle"></small></div><button id="pf-logout" type="button">Выйти</button></div><details><summary>Имя и ник</summary><input id="pf-display" placeholder="Ваше имя" maxlength="60"><input id="pf-handle" placeholder="Ник латиницей" maxlength="24"><button id="pf-save-profile" type="button">Сохранить профиль</button></details>',
'<nav class="pf-tabs"><button class="pf-tab active" data-tab="friends">Друзья</button><button class="pf-tab" data-tab="requests">Заявки <span id="pf-count"></span></button><button class="pf-tab" data-tab="search">Найти</button></nav>',
'<div id="pf-people"><div id="pf-list"></div></div><div id="pf-search-area" hidden><form id="pf-search"><input id="pf-query" placeholder="Ник друга, например alexey_77"><button>Поиск</button></form><div id="pf-found"></div></div></div>',
'<div id="pf-chat" class="pf-chat" hidden><div class="pf-chat-head"><button id="pf-chat-back">‹</button><div><strong id="pf-peer"></strong><small id="pf-peername"></small></div></div><div id="pf-messages"></div><form id="pf-compose"><label class="pf-attach">＋<input id="pf-file" type="file" accept="image/jpeg,image/png,image/webp" hidden></label><input id="pf-input" placeholder="Сообщение или фото…" maxlength="4000"><button>➤</button></form><small id="pf-file-title"></small></div></section></section>'
].join('');
document.body.append(root);
function insertButton(){
 if(id('plux-friends-open'))return;
 const b=make('button','pf-open');b.id='plux-friends-open';b.type='button';
 const icon=make('span','pf-open-icon','♧'),txt=make('span','pf-open-copy');
 txt.append(make('strong','','Друзья'),make('small','','Сообщения и фотографии'));
 b.append(icon,txt,make('span','','›'));b.onclick=()=>void open();
 const modes=document.querySelector('#screen-modes .mode-grid');
 if(modes)modes.insertAdjacentElement('afterend',b);
 else (document.querySelector('#screen-modes')||document.querySelector('#screen-home')||document.body).append(b);
}
id('pf-close').onclick=close;
id('pf-chat-back').onclick=leaveChat;
id('pf-login').onsubmit=e=>{e.preventDefault();void act(async()=>{
  const x=await fetcher('/auth/v1/token?grant_type=password','POST',{email:id('pf-email').value.trim(),password:id('pf-password').value});
  setSession(x);await start();
})};
id('pf-register').onclick=()=>void act(async()=>{
 const x=await fetcher('/auth/v1/signup','POST',{email:id('pf-email').value.trim(),password:id('pf-password').value});
 if(x.access_token){setSession(x);await start()}else notice('Проверь почту, подтверди регистрацию и войди');
});
id('pf-logout').onclick=()=>{
 S.session=null;S.user=null;S.dialog=null;try{sessionStorage.removeItem('plux_friends_session')}catch{}
 clearInterval(S.timer);visible('pf-content',false);visible('pf-signin',true);
};
id('pf-save-profile').onclick=()=>void act(async()=>{
 const handle=id('pf-handle').value.trim().toLowerCase(),display_name=id('pf-display').value.trim();
 if(!/^[a-z0-9_]{3,24}$/.test(handle)||!display_name)throw Error('Ник: от 3 до 24 символов латиницей; укажи имя');
 await fetcher('/rest/v1/plux_profiles?id=eq.'+S.user.id,'PATCH',{handle,display_name});await start();notice('Профиль сохранён');
});
document.querySelectorAll('.pf-tab').forEach(b=>b.onclick=()=>{S.tab=b.dataset.tab;drawPeople();notice('')});
id('pf-search').onsubmit=e=>{e.preventDefault();void act(searchFriend)};
id('pf-compose').onsubmit=e=>{e.preventDefault();void send()};
id('pf-file').onchange=()=>{id('pf-file-title').textContent=id('pf-file').files[0]?.name||''};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!root.hidden)close()});
insertButton();
window.PLUXFriendsV17={open,close,configured:()=>Boolean(base&&key)};
})();
