/* ФОРМА · gated server-only adapters for future AI world / image-to-3D connections.
   Off by default. Requires explicit operator token and opt-in cost header.
   The public Render preview DOES NOT deploy this server module.
*/
import {timingSafeEqual} from 'node:crypto';

const MESHY='https://api.meshy.ai/openapi/v1/image-to-3d';
const MARBLE='https://api.worldlabs.ai/marble/v1';
const enabled=()=>process.env.FORMA_WORLD_AI_ENABLED==='true';
const keyFor=(provider)=>provider==='meshy'?process.env.MESHY_API_KEY:process.env.WLT_API_KEY;
const token=()=>process.env.FORMA_WORLD_ACCESS_TOKEN||'';
let day='',created=0,active=0;
function privateAccess(req) {
 const expected=Buffer.from(token());
 const actual=Buffer.from(String(req.headers['x-forma-world-token']||''));
 return expected.length>=24 && expected.length===actual.length && timingSafeEqual(expected,actual);
}
function bad(status,message){const e=Error(message);e.status=status;throw e}
function imageData(value){
 if(value==null||value==='')return null;
 const match=String(value).match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);
 if(!match||match[2].length>11_200_000)bad(400,'Изображение должно быть PNG, JPG или WEBP до 8 МБ.');
 return {uri:match[0],raw:match[2]};
}
async function providerRequest(provider,url,method='GET',payload=null) {
 const key=keyFor(provider);
 if(!key)bad(503,'API '+provider+' ещё не подключён.');
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),45000);
 try{
  const response=await fetch(url,{
   method,headers:{
    ...(provider==='meshy'?{Authorization:'Bearer '+key}:{'WLT-Api-Key':key}),
    ...(payload?{'Content-Type':'application/json'}:{})
   },body:payload?JSON.stringify(payload):undefined,signal:ctrl.signal
  });
  const raw=await response.text();
  let data;try{data=JSON.parse(raw)}catch{data={}}
  if(!response.ok)bad(response.status>=400&&response.status<500?400:502,'Поставщик '+provider+' вернул ошибку '+response.status+'. Проверьте баланс и параметры.');
  return data;
 }catch(e){
  if(e.name==='AbortError')bad(504,'Поставщик '+provider+' не ответил за 45 секунд. Проверьте историю заданий прежде, чем отправлять повтор.');
  throw e;
 }finally{clearTimeout(timer)}
}
function consume(){
 const current=new Date().toISOString().slice(0,10);
 if(current!==day){day=current;created=0}
 const limit=Math.min(20,Math.max(1,Number(process.env.FORMA_WORLD_DAILY_CAP)||3));
 if(created>=limit)bad(429,'Дневной лимит AI-миров исчерпан.');
 if(active>=2)bad(429,'Уже выполняются запросы. Повторите позже.');
 created++;active++;
}
function cleanId(id){if(!/^[A-Za-z0-9_-]{8,180}$/.test(id||''))bad(400,'Некорректный идентификатор задачи.');return id}
export function createFormaWorldApi({json,readJSON,sameOrigin}){
 return async function handle(req,res){
  const url=new URL(req.url,'http://local');
  if(url.pathname==='/api/forma-world/status'&&req.method==='GET'){
   return json(res,200,{enabled:enabled()&&token().length>=24,meshy:enabled()&&!!keyFor('meshy'),worldLabs:enabled()&&!!keyFor('world'),needsPrivateAccess:true,preview:false});
  }
  if(!enabled()||token().length<24)return json(res,503,{error:'AI-генерация 3D пока не включена администратором.'});
  if(!sameOrigin(req))return json(res,403,{error:'Недопустимый источник запроса.'});
  if(!privateAccess(req))return json(res,401,{error:'Для платной генерации нужен приватный доступ.'});
  try{
   if(req.method==='POST'&&url.pathname==='/api/forma-world/meshy'){
    if(req.headers['x-forma-cost-confirmed']!=='yes')bad(428,'Подтвердите платный запрос перед запуском.');
    const b=await readJSON(req),im=imageData(b.image);
    if(!im)bad(400,'Выберите исходную фотографию объекта.');
    consume();
    try{
     const d=await providerRequest('meshy',MESHY,'POST',{image_url:im.uri,ai_model:process.env.FORMA_MESHY_MODEL||'meshy-7.1',geometry_resolution:'4k',enable_pbr:true,should_texture:true,target_formats:['glb']});
     return json(res,202,{provider:'Meshy',id:d.result||d.id||null,status:'PENDING',notes:'3D-результат не является точной CAD-моделью'});
    }finally{active--}
   }
   if(req.method==='GET'&&url.pathname.startsWith('/api/forma-world/meshy/')){
    const id=cleanId(url.pathname.split('/').pop());
    const d=await providerRequest('meshy',MESHY+'/'+encodeURIComponent(id));
    return json(res,200,{provider:'Meshy',id,status:d.status,progress:Number(d.progress)||0,modelUrl:d.status==='SUCCEEDED'?d.model_urls?.glb||null:null,error:d.task_error?.message||null});
   }
   if(req.method==='POST'&&url.pathname==='/api/forma-world/world'){
    if(req.headers['x-forma-cost-confirmed']!=='yes')bad(428,'Подтвердите платный запрос перед запуском.');
    const b=await readJSON(req);
    const im=imageData(b.image),description=String(b.prompt||'').trim().slice(0,1800);
    if(!im&&!description)bad(400,'Добавьте фотографию участка или текстовое описание.');
    consume();
    try{
     const data=await providerRequest('world',MARBLE+'/worlds:generate','POST',{
      world_prompt:{
       type:im?'image':'text',
       text_prompt:description||null,
       disable_recaption:false,
       image_prompt:im?{source:'data_base64',data_base64:im.raw}:null
      },
      model:process.env.FORMA_WORLDLABS_MODEL||'marble-1.1'
     });
     return json(res,202,{provider:'World Labs',operationId:String(data.operation_id||data.name||'').split('/').pop()||null,status:'PENDING',notes:'AI-мир может менять архитектурную геометрию'});
    }finally{active--}
   }
   if(req.method==='GET'&&url.pathname.startsWith('/api/forma-world/world/')){
    const id=cleanId(url.pathname.split('/').pop());
    const d=await providerRequest('world',MARBLE+'/operations/'+encodeURIComponent(id));
    return json(res,200,{provider:'World Labs',operationId:id,done:!!d.done,result:d.response||null,error:d.error?.message||null});
   }
   json(res,404,{error:'Неизвестный адрес AI-мира'});
  }catch(e){json(res,e.status||502,{error:e.message||'Ошибка AI-провайдера'})}
 }
}
