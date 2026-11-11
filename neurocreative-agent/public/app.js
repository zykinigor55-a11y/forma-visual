'use strict';
const byId=id=>document.getElementById(id);
const log=byId('auth'),app=byId('app'),messages=byId('messages'),draft=byId('text');
let csrf='',logged=false,interval=null,busy=false;
const ideas=[
['Ларёк после полуночи','МИСТИКА / 1996','Вместо сдачи продавщица выдаёт фотографии завтрашнего дня.','Россия, 1996 год. VHS 4:3, 20 секунд. Мужик покупает жвачку в ночном ларьке. Вместо сдачи продавщица протягивает фото его завтрашних похорон. Он раздражённо спрашивает: «А мелочь где?» — «Завтра занесёшь». За спиной мужчины продавщица появляется второй раз. Обрыв плёнки.'],
['Домофон из ада','ЧЁРНЫЙ ЮМОР / 1997','Подъездный домофон выставляет жильцу долг за грехи.','Россия, 1997 год, 20 секунд. У подъезда домофон сообщает Сидорову: «Ваш долг за грехи — 48 рублей 60 копеек». Тот спрашивает: «Пенсионерам скидка есть?» — «Только ветеранам ада». Из темноты бабкин голос: «Сидоров, опять с домофоном бухаешь?!» За спиной вспыхивают красные глаза. VHS.'],
['Последняя маршрутка','ХОРРОР / 1998','Маршрутка заезжает на улицы, которых не существует.','Россия, 1998 год, 20 секунд. Мужчина садится в последнюю маршрутку и отдаёт три рубля. Водитель спрашивает: «До конечной?» — «Мне до дома». В салоне пассажиры держат завтрашние газеты с некрологом мужчины. Мужчина: «А по пенсионному скидка?» Резкий конец.'],
['Пейджер от мёртвых','АБСУРД / 1997','Пейджер присылает предупреждения из пустой квартиры.','Россия, 1997 год, VHS, 20 секунд. Пейджер: «НЕ ВКЛЮЧАЙ СВЕТ». Герой включает. Следующее сообщение: «НУ И ЗАЧЕМ?» Герой отвечает: «А ты кто?» Пейджер: «Электрик. Уже 40 лет как умер». За дверью голос: «Щиток открой». Резкий обрыв записи.'],
['Киров через сто лет','ВИЗУАЛЬНЫЙ ЭФФЕКТ','Знакомые улицы превращаются в невероятный город будущего.','Кинематографичный ролик 15 секунд: камера движется по знакомой улице Кирова. В одном плавном переходе дома, деревья и транспорт превращаются в вид 2126 года. На фоне футуризма всё та же бабушка продаёт семечки и говорит: «А цены всё те же».'],
['Фото становится кино','НЕЙРОРЕКЛАМА','Превращение исходного кадра в атмосферный рекламный ролик.','Реклама 15 секунд: начинаем с простой фотографии товара или архитектуры. Плавное движение камеры открывает фактуру, объёмный свет и отражения. Атмосферный звук и аккуратный монтаж. Финальный кадр — лаконичное название бренда.']
];
async function api(url,options={}){
 const headers=Object.assign({},options.headers||{});
 if(options.body&&typeof options.body!=='string'){options.body=JSON.stringify(options.body);headers['Content-Type']='application/json';}
 if(options.method&&options.method!=='GET'&&url!=='/api/login')headers['X-CSRF-Token']=csrf;
 const response=await fetch(url,Object.assign({},options,{headers,credentials:'same-origin'}));
 let data;try{data=await response.json();}catch{throw Error('Сервер вернул непонятный ответ');}
 if(!response.ok||data.ok===false){if(response.status===401&&url!=='/api/login')showLogin();throw Error(data.error||'Ошибка соединения');}
 return data;
}
function showLogin(){logged=false;log.hidden=false;app.hidden=true;if(interval)clearInterval(interval);}
function showApp(){logged=true;log.hidden=true;app.hidden=false;}
function node(tag,cls,txt){const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x;}
function setStatus(connected,msg){
 byId('status').classList.toggle('bad',!connected);
 byId('statusText').textContent=connected?'Связь установлена':'Нет связи';
 byId('connection').textContent=msg;
}
function date(m){return (m.date?m.date.split('-').reverse().join('.'):'')+' '+(m.time||'');}
function draw(list){
 const bottom=messages.scrollHeight-messages.scrollTop-messages.clientHeight<110;
 messages.replaceChildren();
 if(!list.length){messages.append(node('div','empty','В группе пока нет сообщений'));return;}
 for(const m of list){
 const own=String(m.author||'').toLowerCase()==='ассистент';
 const row=node('div','message'+(own?' own':''));
 row.append(node('div','avatar',(m.author||'?').slice(0,1).toUpperCase()));
 const inside=node('div','message-inner'),info=node('div','message-info');
 info.append(node('strong','',m.author||'Участник'),node('span','',date(m)));inside.append(info);
 const bubble=node('div','bubble',m.text||'');
 for(const file of m.files||[]){
   if(!/^\d+$/.test(String(file.file_id)))continue;
   const a=node('a','filelink','📎 '+(file.name||'Файл'));
   a.href='/api/file?fid='+encodeURIComponent(file.file_id)+'&name='+encodeURIComponent(file.name||'file');
   a.target='_blank';a.rel='noopener noreferrer';bubble.append(a);
 }
 inside.append(bubble);row.append(inside);messages.append(row);
 }
 if(bottom||!messages.dataset.loaded)messages.scrollTop=messages.scrollHeight;
 messages.dataset.loaded='1';
}
async function load(silent=false){
 if(!logged||busy)return;busy=true;
 try{
   const data=await api('/api/messages?since=0&limit=200');
   const list=Array.isArray(data.messages)?data.messages.filter(m=>!m.deleted):[];
   draw(list);const count=Number(data.count||list.length);
   byId('count').textContent=String(count);
   byId('total').textContent=count+' сообщений';
   byId('notice').hidden=true;
   setStatus(true,'Подключено, сообщения загружены');
 }catch(e){
   setStatus(false,e.message);
   if(!silent){byId('notice').hidden=false;byId('notice').textContent=e.message;}
   if(!messages.dataset.loaded)messages.replaceChildren(node('div','empty','Не удалось прочитать сообщения: '+e.message));
 }finally{busy=false;}
}
async function boot(){
 try{
  const m=await api('/api/me');
  if(!m.authenticated){showLogin();return;}
  csrf=m.csrf;showApp();
  byId('aiState').textContent=m.aiEnabled?'API ключ подключён':'API ключ не задан';
  await load();
  if(interval)clearInterval(interval);
  interval=setInterval(()=>{if(document.visibilityState==='visible')load(true);},30000);
 }catch{showLogin();}
}
byId('loginForm').addEventListener('submit',async e=>{
 e.preventDefault();byId('loginError').textContent='';
 const btn=e.submitter;btn.disabled=true;
 try{const d=await api('/api/login',{method:'POST',body:{password:byId('password').value}});csrf=d.csrf;byId('password').value='';await boot();}
 catch(err){byId('loginError').textContent=err.message;}
 finally{btn.disabled=false;}
});
byId('logout').addEventListener('click',async()=>{try{await api('/api/logout',{method:'POST',body:{}});}catch{}showLogin();});
byId('refresh').addEventListener('click',()=>load(false));
function tab(name){
 document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.tab===name));
 document.querySelectorAll('.view').forEach(n=>n.classList.toggle('visible',n.id==='view-'+name));
 byId('headerTitle').textContent=({chat:'Групповой чат',ideas:'Банк идей',settings:'Подключение'})[name]||'Нейрокреатив';
}
document.querySelectorAll('.nav').forEach(n=>n.addEventListener('click',()=>tab(n.dataset.tab)));
draft.addEventListener('input',()=>byId('chars').textContent=draft.value.length+'/4000');
byId('file').addEventListener('change',()=>byId('filename').textContent=byId('file').files[0]?.name||'');
function fileBase64(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=()=>reject(Error('Ошибка чтения файла'));r.onload=()=>resolve(String(r.result).split(',')[1]);r.readAsDataURL(file);});}
byId('sendForm').addEventListener('submit',async e=>{
 e.preventDefault();
 const msg=draft.value.trim(),file=byId('file').files[0],btn=byId('send');
 byId('sendError').textContent='';
 if(!msg&&!file){byId('sendError').textContent='Напишите сообщение или прикрепите файл';return;}
 if(!confirm('Отправить '+(file?'вложение':'сообщение')+' в настоящую группу «Нейрокреатив»?'))return;
 btn.disabled=true;btn.textContent='Отправка…';
 try{
  if(file){if(file.size>8*1024*1024)throw Error('Файл должен быть до 8 МБ');await api('/api/upload',{method:'POST',body:{filename:file.name,file_base64:await fileBase64(file),text:msg}});}
  else await api('/api/post',{method:'POST',body:{text:msg}});
  draft.value='';byId('file').value='';byId('filename').textContent='';byId('chars').textContent='0/4000';
  await load();
 }catch(err){byId('sendError').textContent=err.message;}
 finally{btn.disabled=false;btn.textContent='Отправить ↗';}
});
function insert(text){draft.value=text;draft.dispatchEvent(new Event('input'));tab('chat');draft.focus();window.scrollTo({top:0,behavior:'smooth'});}
for(let i=0;i<ideas.length;i++){
 const a=ideas[i],card=node('article','idea'),title=node('h3','',a[0]),button=node('button','','Использовать идею ↗');
 button.type='button';button.addEventListener('click',()=>insert(a[3]));
 card.append(node('small','',a[1]),title,node('p','',a[2]),button);byId('ideas').append(card);
}
byId('generate').addEventListener('click',async()=>{
 const instruction=byId('instruction').value.trim(),button=byId('generate');
 if(!instruction){byId('aiStatus').textContent='Опиши идею';return;}
 button.disabled=true;byId('aiStatus').textContent='Генерация…';byId('result').hidden=true;byId('insert').hidden=true;
 try{const d=await api('/api/assist',{method:'POST',body:{instruction}});byId('result').textContent=d.text;byId('result').hidden=false;byId('insert').hidden=false;byId('aiStatus').textContent='Черновик готов';}
 catch(err){byId('aiStatus').textContent=err.message;}finally{button.disabled=false;}
});
byId('insert').addEventListener('click',()=>insert(byId('result').textContent));
boot();
