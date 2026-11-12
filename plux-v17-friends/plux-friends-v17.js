/* PLUX Friends v17: browser client; the database enforces privacy with RLS. */
(()=>{
'use strict';
if(window.PLUXFriendsV17)return;
const conf=window.PLUX_FRIENDS_CONFIG||{};
const base=/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(conf.url||'')?conf.url:'';
const key=/^(sb_publishable_|eyJ)/.test(conf.anonKey||'')?conf.anonKey:'';
const S={session:null,user:null,friends:[],requests:[],tab:'friends',newcomers:[],discoveryJoined:false,dialog:null,person:null,timer:0,pictures:new Map(),busy:false,signature:''};
const id=x=>document.getElementById(x);
const make=(tag,cl,text)=>{const n=document.createElement(tag);if(cl)n.className=cl;if(text!==undefined)n.textContent=text;return n};

/* V31.8: square, recompressed profile photos. Only the owner uploads/changes an avatar. */
const avatarPattern=/^[a-f0-9-]{36}\/[a-f0-9-]{36}\.webp$/;
const avatarObjectUrls=new Map();
function drawAvatar(el,p){
 if(!el)return;
 const initial=String(p?.display_name||p?.handle||'?').trim().charAt(0).toUpperCase()||'?';
 const path=p?.avatar_path;
 el.replaceChildren();
 el.textContent=initial;
 if(typeof path!=='string'||!avatarPattern.test(path))return;
 const im=make('img','pf-avatar-photo');
 im.alt='Аватар';im.loading='eager';im.decoding='async';
 const cached=avatarObjectUrls.get(path);
 let retried=false;
 im.onload=()=>{if(el.isConnected)el.replaceChildren(im)};
 im.onerror=async()=>{
  if(retried){im.remove();if(el.id==='pf-myavatar')notice('Не удалось загрузить аватарку. Проверь соединение.',true);return}
  retried=true;
  try{
   const blob=await fetcher('/storage/v1/object/public/plux-avatars/'+path,'GET',null,true);
   if(!blob?.type?.startsWith('image/')||blob.size<100)throw Error('Неизвестный формат изображения');
   const old=avatarObjectUrls.get(path);if(old)URL.revokeObjectURL(old);
   const local=URL.createObjectURL(blob);avatarObjectUrls.set(path,local);im.src=local;
  }catch{
   if(el.id==='pf-myavatar')notice('Фото есть в профиле, но не загрузилось. Проверь интернет.',true);
  }
 };
 im.src=cached||base+'/storage/v1/object/public/plux-avatars/'+path;
}
async function prepareAvatar(file){
 if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>6*1024*1024)
  throw Error('Выберите JPG, PNG или WEBP до 6 МБ');
 const url=URL.createObjectURL(file);
 let picture;
 try{
  picture=await new Promise((resolve,reject)=>{
   const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Не удалось открыть фотографию'));im.src=url;
  });
  const w=picture.naturalWidth,h=picture.naturalHeight;
  if(!w||!h||Math.max(w,h)>10000)throw Error('Слишком большое фото. Выберите другое.');
  const side=Math.min(w,h),canvas=document.createElement('canvas');
  canvas.width=384;canvas.height=384;
  const context=canvas.getContext('2d');
  if(!context)throw Error('Обработка фотографии недоступна');
  context.drawImage(picture,(w-side)/2,(h-side)/2,side,side,0,0,384,384);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Не удалось подготовить фото')),'image/webp',.84));
  if(blob.type!=='image/webp'||blob.size>2*1024*1024)throw Error('Не удалось сжать фото до нужного размера');
  return blob;
 }finally{URL.revokeObjectURL(url)}
}
async function changeAvatar(file){
 if(!S.user||!S.profile)throw Error('Сначала войдите в профиль');
 const data=await prepareAvatar(file);
 const path=S.user.id+'/'+crypto.randomUUID()+'.webp';
 await fetcher('/storage/v1/object/plux-avatars/'+path,'POST',data,true);
 let updated;
 try{
  updated=await fetcher('/rest/v1/plux_profiles?id=eq.'+S.user.id+'&select=avatar_path','PATCH',{avatar_path:path});
  if(!Array.isArray(updated)||updated[0]?.avatar_path!==path)throw Error('Изображение загружено, но профиль не обновился');
 }catch(e){
  void fetcher('/storage/v1/object/plux-avatars/'+path,'DELETE').catch(()=>{});
  throw e;
 }
 const old=S.profile.avatar_path;
 S.profile.avatar_path=path;
 const preview=URL.createObjectURL(data);
 avatarObjectUrls.set(path,preview);
 drawAvatar(id('pf-myavatar'),S.profile);
 if(old&&avatarPattern.test(old)&&old!==path)
  void fetcher('/storage/v1/object/plux-avatars/'+old,'DELETE').catch(()=>{});
 notice('Аватарка обновлена. Её увидят другие пользователи ПЛЮХ.');
}

const visible=(x,on)=>{id(x).hidden=!on};
const notice=(s,bad=false)=>{id('pf-alert').textContent=s;id('pf-alert').hidden=!s;id('pf-alert').classList.toggle('bad',bad)};
const h=(opts={})=>({apikey:key, ...(S.session?.access_token?{Authorization:'Bearer '+S.session.access_token}:{}),...opts});
async function fetcher(path,method='GET',body=null,binary=false,retry=false){
 if(!base||!key)throw Error('Сервис общения пока не подключён');
 if(!path.startsWith('/auth/'))await ensureFresh();
 const headers=h(binary&&body?{'Content-Type':body.type}:{Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})});
 if(method==='PATCH')headers.Prefer='return=representation';
 const response=await fetch(base+path,{method,headers,body:binary?body:body?JSON.stringify(body):undefined,cache:'no-store'});
 if(response.status===401&&S.session?.refresh_token&&!retry){await refresh();return fetcher(path,method,body,binary,true)}
 const type=response.headers.get('content-type')||'';
 const value=binary&&method==='GET'?await response.blob():type.includes('json')?await response.json().catch(()=>null):await response.text();
 if(!response.ok)throw Error(String(value?.message||value?.error_description||value?.error||value||'Ошибка сервера').slice(0,180));
 return value;
}
/* V31.8.5: persistent, rotating Supabase refresh token across Android app restarts.
   Sign-out is the only normal action that deletes the saved session. */
const sessionKey='plux_friends_session_v3185';
let refreshPending=null;
function dropSession(){
 S.session=null;S.user=null;S.profile=null;
 try{localStorage.removeItem(sessionKey);sessionStorage.removeItem('plux_friends_session')}catch{}
}
function setSession(data){
 if(!data?.access_token||!data?.refresh_token||!data?.user?.id)throw Error('Неверные данные авторизации');
 S.session={...data,expires_at:Number(data.expires_at)||(Math.floor(Date.now()/1000)+Number(data.expires_in||3600))};
 S.user=data.user;
 try{localStorage.setItem(sessionKey,JSON.stringify(S.session));
  sessionStorage.removeItem('plux_friends_session')}catch{}
}
function restoreSession(){
 let saved=null;
 try{saved=JSON.parse(localStorage.getItem(sessionKey)||sessionStorage.getItem('plux_friends_session')||'null')}catch{}
 if(!saved?.refresh_token||!saved?.user?.id)return false;
 S.session=saved;S.user=saved.user;return true;
}
async function refresh(){
 if(refreshPending)return refreshPending;
 if(!S.session?.refresh_token)throw Error('Для входа требуется авторизация');
 refreshPending=(async()=>{
  const r=await fetch(base+'/auth/v1/token?grant_type=refresh_token',{
   method:'POST',headers:{apikey:key,'Content-Type':'application/json'},
   body:JSON.stringify({refresh_token:S.session.refresh_token}),signal:AbortSignal.timeout(18000)
  });
  const d=await r.json().catch(()=>({}));
  if(!r.ok){
   // A temporary network error must not silently log out a user.
   if([400,401,403].includes(r.status))dropSession();
   throw Error(d?.msg||d?.error_description||'Не удалось обновить сессию');
  }
  setSession(d);
  return S.session;
 })();
 try{return await refreshPending}finally{refreshPending=null}
}
async function ensureFresh(){
 if(S.session?.refresh_token&&(!S.session.expires_at||S.session.expires_at*1000<Date.now()+90000))await refresh();
}
async function start(){
 const me=await fetcher('/rest/v1/plux_profiles?select=id,handle,display_name,avatar_path&id=eq.'+S.user.id);
 S.profile=me[0];id('pf-myname').textContent=S.profile?.display_name||'Профиль';
 id('pf-myhandle').textContent='@'+(S.profile?.handle||'');
 id('pf-display').value=S.profile?.display_name||'';
 id('pf-handle').value=S.profile?.handle||'';
 drawAvatar(id('pf-myavatar'),S.profile);
 visible('pf-signin',false);visible('pf-content',true);
 await people();
 try{await loadDiscovery()}catch{S.newcomers=[];S.discoveryJoined=false;}
 drawPeople();beginPolling();
}
async function people(){
 const [friends,requests]=await Promise.all([
  fetcher('/rest/v1/plux_friends?select=user_a,user_b'),
  fetcher('/rest/v1/plux_requests?select=id,from_id&to_id=eq.'+S.user.id+'&status=eq.pending')
 ]);
 const ids=(friends||[]).map(p=>p.user_a===S.user.id?p.user_b:p.user_a);
 const all=[...new Set([...ids,...(requests||[]).map(x=>x.from_id)])];
 const profiles=all.length?await fetcher('/rest/v1/plux_profiles?select=id,handle,display_name,avatar_path&id=in.('+all.join(',')+')'):[];
 const dict=new Map(profiles.map(p=>[p.id,p]));
 S.friends=ids.map(x=>dict.get(x)).filter(Boolean);
 S.requests=(requests||[]).map(x=>({...x,profile:dict.get(x.from_id)}));
 id('pf-count').textContent=S.requests.length||'';
 const badge=id('plux31-friends-badge');
 if(badge){badge.hidden=!S.requests.length;badge.textContent=S.requests.length>9?'9+':String(S.requests.length)}
}
async function loadDiscovery(){
 const mine=await fetcher('/rest/v1/plux_discovery_opt_in?select=user_id&user_id=eq.'+S.user.id+'&limit=1');
 S.discoveryJoined=mine.length>0;
 const toggle=id('pf-discover-toggle');if(toggle)toggle.checked=S.discoveryJoined;
 const rows=await fetcher('/rest/v1/plux_discovery_opt_in?select=user_id,joined_at&order=joined_at.desc&limit=26');
 const entries=rows.filter(x=>x.user_id!==S.user.id).slice(0,20);
 if(!entries.length){S.newcomers=[];return}
 const ids=entries.map(x=>x.user_id);
 const profiles=await fetcher('/rest/v1/plux_profiles?select=id,handle,display_name,avatar_path&id=in.('+ids.join(',')+')');
 const dict=new Map(profiles.map(p=>[p.id,p]));
 S.newcomers=entries.map(x=>dict.has(x.user_id)?{...dict.get(x.user_id),joined_at:x.joined_at}:null).filter(Boolean);
}
async function toggleDiscovery(checked){
 if(checked){
  await fetcher('/rest/v1/plux_discovery_opt_in','POST',{user_id:S.user.id});
  notice('Теперь твой профиль виден в разделе «Новенькие».');
 }else{
  await fetcher('/rest/v1/plux_discovery_opt_in?user_id=eq.'+S.user.id,'DELETE');
  notice('Твой профиль больше не показывается другим новым участникам.');
 }
 await loadDiscovery();drawPeople();
}
function item(p,label,fn){
 const row=make('div','pf-person'),avatar=make('span','pf-avatar');drawAvatar(avatar,p);
 const names=make('div','pf-person-title');names.append(make('strong','',p.display_name),make('small','','@'+p.handle));
 const btn=make('button','pf-btn',label);btn.type='button';btn.onclick=fn;row.append(avatar,names,btn);return row;
}
function drawPeople(){
 visible('pf-people',S.tab!=='search');visible('pf-search-area',S.tab==='search');
 visible('pf-discovery-settings',S.tab==='new');visible('pf-new-description',S.tab==='new');visible('pf-new-filter-wrap',S.tab==='new');
 document.querySelectorAll('.pf-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===S.tab));
 const list=id('pf-list');list.replaceChildren();
 if(S.tab==='friends')for(const p of S.friends)list.append(item(p,'Написать ›',()=>openChat(p)));
 if(S.tab==='new')for(const p of S.newcomers.filter(p=>{
  const term=(id('pf-new-filter')?.value||'').trim().toLocaleLowerCase('ru-RU');
  return !term||(p.display_name||'').toLocaleLowerCase('ru-RU').includes(term)||(p.handle||'').toLowerCase().includes(term);
 }))list.append(item(p,'＋ Добавить',()=>act(async()=>{
  if(p.id===S.user.id)return;
  await fetcher('/rest/v1/rpc/plux_request_friend','POST',{p_handle:p.handle});
  notice('Заявка отправлена пользователю @'+p.handle);
 })));
 if(S.tab==='requests')for(const q of S.requests)if(q.profile)list.append(item(q.profile,'✓ Принять',()=>act(async()=>{
   await fetcher('/rest/v1/rpc/plux_accept_friend','POST',{p_request_id:q.id});
   await people();drawPeople();notice('Теперь вы друзья!');
 })));
 if(!list.children.length)list.append(make('div','pf-empty',S.tab==='friends'?'Здесь появятся друзья. Найдите человека по его нику.':S.tab==='new'?(id('pf-new-filter')?.value.trim()?'По этому имени пока никого нет. Попробуй другое имя.':'Новых участников пока нет. Показываются только профили с согласия владельцев.'):'Новых заявок пока нет.'));
}
async function searchFriend(){
 const name=id('pf-query').value.trim().toLowerCase();
 if(!/^[a-z0-9_]{3,24}$/.test(name))throw Error('Введите ник: латиница, цифры, _, от 3 до 24 символов');
 const list=await fetcher('/rest/v1/plux_profiles?select=id,handle,display_name,avatar_path&handle=eq.'+encodeURIComponent(name));
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
  drawAvatar(id('pf-peer-avatar'),p);
  visible('pf-social',false);visible('pf-chat',true);await loadMessages();
  // Share-video handoff is always a draft. Sending remains a user action.
  const link=sessionStorage.getItem('plux_pending_shared_video');
  if(link&&/^https:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|rutube\.ru|vkvideo\.ru|vk\.com)\//i.test(link)){
   id('pf-input').value=link;sessionStorage.removeItem('plux_pending_shared_video');
   notice('Ссылка на видео добавлена в сообщение. Нажми отправить.');
  }
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
  else if(S.tab==='new')void Promise.all([people(),loadDiscovery()]).then(drawPeople).catch(()=>{});
  else void people().then(drawPeople).catch(()=>{});
 },10000);
}
function close(){
 id('plux-friends-open')?.setAttribute('aria-expanded','false');
 id('plux-friends-panel').hidden=true;clearInterval(S.timer);S.timer=0;
 for(const u of S.pictures.values())URL.revokeObjectURL(u);S.pictures.clear();
}
async function open(){
 id('plux-friends-panel').hidden=false;notice('');
 if(!base||!key){visible('pf-setup',true);visible('pf-signin',false);visible('pf-content',false);return;}
 visible('pf-setup',false);
 if((S.session&&S.user)||restoreSession()){
  try{await ensureFresh();await start();return}
  catch(e){
   if(S.session){
    visible('pf-signin',false);visible('pf-content',true);
    notice('Профиль сохранён. Нет связи: '+String(e.message||'попробуй позже').slice(0,100),true);
    return;
   }
  }
 }
 visible('pf-signin',true);visible('pf-content',false);
}
const root=document.createElement('div');root.id='plux-friends-panel';root.hidden=true;
root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Друзья и личные сообщения');
root.innerHTML=[
'<section class="pf-shell"><header class="pf-head"><button id="pf-close" aria-label="Назад">‹</button><div><strong>Друзья <em>✦</em></strong><small>PLUX • PRIVATE MESSENGER</small></div><span>◈</span></header>',
'<div id="pf-alert" class="pf-alert" role="status" hidden></div>',
'<section id="pf-setup" class="pf-section" hidden><h2>Общение в ПЛЮХ</h2><p>Модуль готов. Для настоящих чатов необходимо подключить Supabase с защищённой базой, аккаунтами и приватным хранилищем фото.</p></section>',
'<section id="pf-signin" class="pf-section" hidden><small>АККАУНТ</small><h2>Привет! Найди своих друзей</h2><p>Создай профиль по электронной почте, чтобы начать общение.</p><form id="pf-login"><input id="pf-email" type="email" placeholder="Электронная почта" autocomplete="email" required><input id="pf-password" type="password" placeholder="Пароль от 8 символов" minlength="8" required><div class="pf-row"><button>Войти</button><button id="pf-register" type="button">Регистрация</button></div></form></section>',
'<section id="pf-content" hidden><div id="pf-social" class="pf-section"><div class="pf-profile"><div class="pf-profile-id"><button id="pf-avatar-change" type="button" aria-label="Загрузить или поменять фото профиля" title="Нажмите, чтобы изменить аватарку"><span id="pf-myavatar" class="pf-avatar pf-avatar-own">?</span><span class="pf-avatar-edit-indicator" aria-hidden="true">＋</span></button><input id="pf-avatar-input" type="file" accept="image/jpeg,image/png,image/webp" hidden><div><strong id="pf-myname"></strong><small id="pf-myhandle"></small><small class="pf-avatar-hint">Нажмите на фото, чтобы изменить</small></div></div><button id="pf-logout" type="button">Выйти</button></div><details><summary>Имя и ник</summary><input id="pf-display" placeholder="Ваше имя" maxlength="60"><input id="pf-handle" placeholder="Ник латиницей" maxlength="24"><button id="pf-save-profile" type="button">Сохранить профиль</button></details>',
'<nav class="pf-tabs"><button class="pf-tab active" data-tab="friends">Друзья</button><button class="pf-tab" data-tab="requests">Заявки <span id="pf-count"></span></button><button class="pf-tab" data-tab="new">Новенькие</button><button class="pf-tab" data-tab="search">Найти</button></nav>',
'<p id="pf-new-description" class="pf-discovery-info" hidden>Знакомься без знания ника: здесь новые участники, которые согласились показывать свой профиль.</p>',
 '<label id="pf-new-filter-wrap" class="pf-new-filter" hidden><span>Поиск по имени</span><input id="pf-new-filter" type="search" placeholder="Например, Катя или Андрей" maxlength="60" autocomplete="off"></label>',
'<label id="pf-discovery-settings" class="pf-discovery-settings" hidden><input id="pf-discover-toggle" type="checkbox"><span><strong>Показывать меня в «Новеньких»</strong><small>Выключено по умолчанию. Можно отключить в любой момент.</small></span></label>',
'<div id="pf-people"><div id="pf-list"></div></div><div id="pf-search-area" hidden><form id="pf-search"><input id="pf-query" placeholder="Ник друга, например alexey_77"><button>Поиск</button></form><div id="pf-found"></div></div></div>',
'<div id="pf-chat" class="pf-chat" hidden><div class="pf-chat-head"><button id="pf-chat-back">‹</button><span id="pf-peer-avatar" class="pf-avatar pf-peer-avatar">?</span><div><strong id="pf-peer"></strong><small id="pf-peername"></small></div></div><div id="pf-messages"></div><form id="pf-compose"><label class="pf-attach">＋<input id="pf-file" type="file" accept="image/jpeg,image/png,image/webp" hidden></label><input id="pf-input" placeholder="Сообщение или фото…" maxlength="4000"><button>➤</button></form><small id="pf-file-title"></small></div></section></section>'
].join('');
document.body.append(root);
function insertButton(){
 if(id('plux-friends-open'))return;
 // Native fifth item of the approved V30 bottom navigation — not a modes card.
 const nav=document.querySelector('#screen-home .bottom-nav');
 if(!nav){console.warn('PLUX Friends: home navigation is unavailable');return}
 const b=make('button','nav-button pf-nav-button');
 b.id='plux-friends-open';b.type='button';b.setAttribute('aria-label','Открыть друзей и сообщения');
 b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-expanded','false');
 const symbol=document.createElementNS('http://www.w3.org/2000/svg','svg');
 symbol.setAttribute('viewBox','0 0 24 24');symbol.setAttribute('fill','none');
 symbol.setAttribute('stroke','currentColor');symbol.setAttribute('stroke-linecap','round');
 symbol.setAttribute('stroke-linejoin','round');symbol.setAttribute('stroke-width','1.7');
 for(const d of [
   'M15.5 19.4v-1.2c0-2-1.6-3.6-3.6-3.6H5.6c-2 0-3.6 1.6-3.6 3.6v1.2',
   'M8.8 11.4a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7',
   'M18.2 11.2a3.3 3.3 0 0 1 0-6.2',
   'M22 19.4v-1.2a3.6 3.6 0 0 0-2.7-3.5'
 ]){
   const path=document.createElementNS('http://www.w3.org/2000/svg','path');
   path.setAttribute('d',d);symbol.append(path);
 }
 const label=make('span','', 'Друзья');
 const badge=make('i','pf-notify');badge.id='plux31-friends-badge';badge.hidden=true;badge.setAttribute('aria-label','Новые заявки в друзья');
 b.append(symbol,label,badge);
 b.addEventListener('click',()=>{b.setAttribute('aria-expanded','true');void open()});
 const chat=nav.querySelector('[data-go="chat"]');
 if(chat)chat.insertAdjacentElement('afterend',b);else nav.append(b);
}
id('pf-close').onclick=close;
id('pf-avatar-change').onclick=()=>id('pf-avatar-input').click();
id('pf-avatar-input').onchange=e=>{
 const file=e.target.files?.[0];e.target.value='';
 if(file)void act(()=>changeAvatar(file));
};
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
 const token=S.session?.access_token;
 dropSession();S.dialog=null;
 clearInterval(S.timer);S.timer=0;
 visible('pf-content',false);visible('pf-signin',true);notice('');
 for(const link of avatarObjectUrls.values())URL.revokeObjectURL(link);
 avatarObjectUrls.clear();
 if(token)void fetch(base+'/auth/v1/logout',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+token}}).catch(()=>{});
};
id('pf-save-profile').onclick=()=>void act(async()=>{
 const handle=id('pf-handle').value.trim().toLowerCase(),display_name=id('pf-display').value.trim();
 if(!/^[a-z0-9_]{3,24}$/.test(handle)||!display_name)throw Error('Ник: от 3 до 24 символов латиницей; укажи имя');
 await fetcher('/rest/v1/plux_profiles?id=eq.'+S.user.id,'PATCH',{handle,display_name});await start();notice('Профиль сохранён');
});
document.querySelectorAll('.pf-tab').forEach(b=>b.onclick=()=>{S.tab=b.dataset.tab;drawPeople();notice('');
 if(S.tab==='new')void loadDiscovery().then(drawPeople).catch(e=>notice(e.message,true));
});
id('pf-new-filter').addEventListener('input',()=>{if(S.tab==='new')drawPeople()});
id('pf-discover-toggle').onchange=e=>void act(async()=>{
 try{await toggleDiscovery(e.target.checked)}
 catch(err){e.target.checked=S.discoveryJoined;throw err}
});
id('pf-search').onsubmit=e=>{e.preventDefault();void act(searchFriend)};
id('pf-compose').onsubmit=e=>{e.preventDefault();void send()};
id('pf-file').onchange=()=>{id('pf-file-title').textContent=id('pf-file').files[0]?.name||''};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!root.hidden)close()});
insertButton();
window.PLUXFriendsV17={open,close,configured:()=>Boolean(base&&key)};
})();
