/* ФОРМА / AI 3D generation UI.
 * Keys remain server-side. Private token is not saved or logged.
 * Public preview has no these routes: no paid calls can be made there.
 */
(() => {
'use strict';
const $=s=>document.querySelector(s);
const status=$('#fwAIStatus'),output=$('#fwAIResult'),file=$('#fwAIFile');
const worldButton=$('#fwCreateWorld'),objectButton=$('#fwCreateObject');
let capabilities={enabled:false,worldLabs:false,meshy:false},photo=null,busy=false,poller=null;
function say(str){output.textContent=str}
function statusText(str){status.textContent=str}
function eligible(provider){return capabilities.enabled&&!!capabilities[provider]&&!!$('#fwAIConfirm').checked&&$('#fwAIToken').value.trim().length>=24&&!busy}
function update(){
 worldButton.disabled=!eligible('worldLabs');objectButton.disabled=!eligible('meshy');
}
function safeLink(text,value){
 try{
  const u=new URL(String(value));
  if(u.protocol!=='https:'||!['meshy.ai','worldlabs.ai'].some(host=>u.hostname===host||u.hostname.endsWith('.'+host)))return;
  const link=document.createElement('a');
  link.href=u.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent=text;link.className='fw-ai-link';
  output.append(link);
 }catch{}
}
function deepWorldLink(value,depth=0){
 if(depth>6||!value||typeof value!=='object')return null;
 for(const [k,v] of Object.entries(value)){
  if(typeof v==='string'&&(k.toLowerCase().includes('url')||k.toLowerCase().includes('link'))&&v.includes('worldlabs.ai'))return v;
  if(typeof v==='object'){const match=deepWorldLink(v,depth+1);if(match)return match}
 }
 return null;
}
async function getImageData(f){
 if(!f)return null;
 if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>8*1024*1024)throw Error('Выберите JPG, PNG или WEBP до 8 МБ.');
 return await new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>reject(Error('Не удалось прочитать изображение'));
  reader.readAsDataURL(f);
 });
}
async function request(url,method='GET',body=null){
 const headers={'x-forma-world-token':$('#fwAIToken').value.trim()};
 if(body){headers['Content-Type']='application/json';headers['x-forma-cost-confirmed']='yes'}
 const res=await fetch(url,{method,headers,body:body?JSON.stringify(body):undefined,cache:'no-store'});
 const data=await res.json().catch(()=>({error:'Некорректный ответ сервера'}));
 if(!res.ok)throw Error(data.error||'Сервер вернул ошибку '+res.status);
 return data;
}
async function check(){
 try{
  const res=await fetch('/api/forma-world/status',{cache:'no-store'});
  if(!res.ok)throw Error();
  const data=await res.json();
  capabilities={enabled:!!data.enabled,worldLabs:!!data.worldLabs,meshy:!!data.meshy};
  statusText(!data.enabled?'AI-генерация отключена. Подключите ключи и приватный доступ на отдельном сервере ФОРМЫ.':
   'Сервер: World Labs '+(data.worldLabs?'подключён':'не подключён')+' · Meshy '+(data.meshy?'подключён':'не подключён'));
 }catch{
  capabilities={enabled:false,worldLabs:false,meshy:false};
  statusText('В этом публичном предпросмотре AI-генерация отключена. GLB-прогулка и HDR-освещение доступны без API.');
 }
 update();
}
async function poll(kind,id){
 clearTimeout(poller);
 const endpoint='/api/forma-world/'+kind+'/'+encodeURIComponent(id);
 const started=Date.now();
 const tick=async()=>{
  if(!busy)return;
  try{
   const data=await request(endpoint);
   if(kind==='meshy'){
    const pct=Math.max(0,Math.min(100,Number(data.progress)||0));
    say('Meshy: '+(data.status||'обрабатывается')+' · '+pct+'%');
    if(data.status==='SUCCEEDED'){
     say('3D-модель готова. Скачайте GLB и загрузите его в просмотрщик выше.');
     if(data.modelUrl)safeLink('Скачать GLB-модель',data.modelUrl);
     busy=false;update();return;
    }
    if(['FAILED','CANCELED'].includes(data.status)){say('Генерация Meshy не выполнена: '+(data.error||data.status));busy=false;update();return}
   }else{
    say(data.done?'World Labs: задача завершена.':'World Labs: создаётся исследуемое пространство…');
    if(data.done){
     if(data.error)say('World Labs: '+data.error);
     else{
      say('AI-мир создан. При наличии ссылки откройте его в Marble. Это реконструкция, не точная CAD-модель.');
      const link=deepWorldLink(data.result);if(link)safeLink('Открыть созданный 3D-мир',link);
     }
     busy=false;update();return;
    }
   }
   if(Date.now()-started>12*60*1000){
    say('Время ожидания истекло. Задача может продолжаться на стороне провайдера. Её идентификатор: '+id+'. Не запускайте повторно без проверки.');busy=false;update();return;
   }
   poller=setTimeout(tick,7500);
  }catch(e){say('Проверка статуса: '+e.message+'. Номер задачи: '+id+'.');busy=false;update()}
 };
 await tick();
}
async function submit(kind){
 if(busy||!eligible(kind==='world'?'worldLabs':'meshy'))return;
 if(!confirm('Платная AI-генерация может списать кредиты. Продолжить запуск одного задания?'))return;
 const prompt=$('#fwAIPrompt').value.trim();
 if(kind==='meshy'&&!photo){say('Для 3D-модели Meshy необходимо загрузить фотографию.');return}
 if(kind==='world'&&!photo&&!prompt){say('Для AI-мира добавьте фото или описание.');return}
 busy=true;update();
 try{
  say('Передаём задание выбранному AI-провайдеру…');
  const image=await getImageData(photo);
  const url=kind==='world'?'/api/forma-world/world':'/api/forma-world/meshy';
  const data=await request(url,'POST',{prompt,image});
  const id=data.operationId||data.id;
  if(!id)throw Error('Провайдер не вернул номер задания. Проверьте баланс и историю перед повтором.');
  say('Задача принята: '+id+' · начинаем проверку статуса.');
  await poll(kind,id);
 }catch(e){say('Не удалось запустить AI: '+e.message);busy=false;update()}
}
file.addEventListener('change',event=>{
 const f=event.target.files?.[0]||null;photo=f;
 $('#fwAIFileInfo').textContent=f?f.name+' · '+(f.size/1024/1024).toFixed(1)+' МБ':'Фото ещё не выбрано';
});
for(const id of ['#fwAIToken','#fwAIConfirm'])$(id).addEventListener('input',update);
$('#fwAIConfirm').addEventListener('change',update);
worldButton.addEventListener('click',()=>submit('world'));
objectButton.addEventListener('click',()=>submit('meshy'));
window.addEventListener('pagehide',()=>clearTimeout(poller));
check();
})();
