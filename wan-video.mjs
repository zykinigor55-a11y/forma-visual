/** Opt-in Wan 2.6 Free OpenRouter API for ДОМ.РЕНДЕР (Node.js 20+). */
import {randomUUID} from 'node:crypto';
import {Readable} from 'node:stream';

const API='https://openrouter.ai/api/v1';
const MODEL='alibaba/wan-2.6:free';
const FRAME_TTL=7200000, JOB_TTL=86400000, MAX_IMAGE=8*1024*1024;
const validId=id=>/^[0-9a-f-]{36}$/i.test(id||'');
const errorText=e=>String(e?.message||e||'Ошибка запроса').slice(0,250);
const key=()=>String(process.env.OPENROUTER_API_KEY||'').trim();
const enabled=()=>process.env.WAN_VIDEO_ENABLED==='true'&&!!key();
const headers=()=>({Authorization:'Bearer '+key()});
const dailyLimit=()=>{const n=Number(process.env.WAN_DAILY_LIMIT||3);return Number.isInteger(n)&&n>=1&&n<=20?n:3};
const providerError=res=>res.status===401?'Неверный API-ключ OpenRouter.':res.status===402?'OpenRouter запросил оплату: платная генерация заблокирована.':res.status===429?'Бесплатная модель перегружена или исчерпан лимит.':'OpenRouter вернул ошибку HTTP '+res.status;
async function parse(res){try{return await res.json()}catch{throw Error('OpenRouter вернул некорректный ответ.')}}
function noCharge(model){
  const skus=model?.pricing_skus;
  if(!skus||typeof skus!=='object')return true;
  return Object.values(skus).filter(x=>x!=null).every(x=>{
    const n=Number(String(x).trim().replace(/[$\s]/g,''));
    return Number.isFinite(n)&&n===0;
  });
}
async function modelInfo(){
  const r=await fetch(API+'/videos/models',{headers:headers(),signal:AbortSignal.timeout(18000)});
  if(!r.ok)throw Error(providerError(r));
  const data=await parse(r);
  const model=Array.isArray(data.data)?data.data.find(x=>x.id===MODEL):null;
  if(!model)throw Error('Wan 2.6 Free сейчас отсутствует в каталоге OpenRouter.');
  if(!noCharge(model))throw Error('Обнаружена ненулевая цена модели, запуск заблокирован.');
  if(!model.supported_frame_images?.includes('first_frame'))throw Error('Wan 2.6 Free сейчас не поддерживает первый кадр.');
  return model;
}
export function createWanVideo({json,readJSON,sameOrigin,imageBlob}){
  const frames=new Map(),jobs=new Map();
  let day='',used=0,active=0;
  const reply=(res,status,message)=>json(res,status,{error:message});
  const cleanup=()=>{
    const now=Date.now();
    for(const [id,o] of frames)if(o.expires<now)frames.delete(id);
    for(const [id,o] of jobs)if(o.created+JOB_TTL<now)jobs.delete(id);
    const date=new Date().toISOString().slice(0,10);
    if(date!==day){day=date;used=0;}
  };
  const findJob=id=>validId(id)?jobs.get(id):null;
  const publicOrigin=()=>{
    const value=String(process.env.WAN_PUBLIC_ORIGIN|| (process.env.RENDER_EXTERNAL_HOSTNAME?'https://'+process.env.RENDER_EXTERNAL_HOSTNAME:'')).trim();
    if(!value)throw Error('Нужно указать WAN_PUBLIC_ORIGIN.');
    const url=new URL(value);
    if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('Некорректный публичный HTTPS-адрес.');
    return url.origin;
  };
  async function state(job){
    const res=await fetch(API+'/videos/'+encodeURIComponent(job.remote),{headers:headers(),signal:AbortSignal.timeout(25000)});
    if(!res.ok)throw Error(providerError(res));
    const data=await parse(res);
    return {status:['pending','in_progress','completed','failed','cancelled','expired'].includes(data.status)?data.status:'pending',
      error:data.status==='failed'?'Видео не создано провайдером.':''};
  }
  async function handle(req,res){
    cleanup();
    const url=new URL(req.url,'http://localhost'),route=url.pathname;
    if(route==='/api/wan/frame'&&req.method==='GET'){
      const frame=frames.get(url.searchParams.get('id'));
      if(!frame||frame.expires<Date.now())return reply(res,404,'Исходный кадр недоступен.');
      res.writeHead(200,{'Content-Type':frame.type,'Content-Length':frame.bytes.length,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});
      return res.end(frame.bytes);
    }
    if(route==='/api/wan/status'&&req.method==='GET'){
      if(!enabled())return json(res,200,{ready:false,reason:'Для Wan 2.6 добавьте OPENROUTER_API_KEY и WAN_VIDEO_ENABLED=true в Render.',remaining:dailyLimit()-used});
      try{
        const model=await modelInfo();
        return json(res,200,{ready:true,model:MODEL,remaining:Math.max(0,dailyLimit()-used),durations:model.supported_durations||[],ratios:model.supported_aspect_ratios||[]});
      }catch(e){return json(res,200,{ready:false,reason:errorText(e),remaining:Math.max(0,dailyLimit()-used)})}
    }
    if(!enabled())return reply(res,503,'Wan 2.6 ещё не подключена.');
    if(route==='/api/wan/job'&&req.method==='GET'){
      const job=findJob(url.searchParams.get('id'));
      if(!job)return reply(res,404,'Задание не найдено или сервер перезапущен.');
      try{
        const info=await state(job);
        return json(res,200,{id:job.id,...info,downloadUrl:info.status==='completed'?'/api/wan/download?id='+job.id:null});
      }catch(e){return reply(res,502,errorText(e))}
    }
    if(route==='/api/wan/download'&&req.method==='GET'){
      const job=findJob(url.searchParams.get('id'));
      if(!job)return reply(res,404,'Задание не найдено или сервер перезапущен.');
      try{
        if((await state(job)).status!=='completed')return reply(res,409,'Видео ещё не готово.');
        const upstream=await fetch(API+'/videos/'+encodeURIComponent(job.remote)+'/content?index=0',{headers:headers(),signal:AbortSignal.timeout(45000)});
        if(!upstream.ok||!upstream.body)return reply(res,502,providerError(upstream));
        res.writeHead(200,{'Content-Type':upstream.headers.get('content-type')||'video/mp4','Content-Disposition':'attachment; filename="dom-render-wan26.mp4"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});
        Readable.fromWeb(upstream.body).pipe(res);
      }catch(e){if(!res.headersSent)return reply(res,502,errorText(e));res.destroy()}
      return;
    }
    if(route==='/api/wan/generate'&&req.method==='POST'){
      if(!sameOrigin(req))return reply(res,403,'Недопустимый источник.');
      if(active>0)return reply(res,429,'Другая генерация уже отправляется.');
      if(used>=dailyLimit())return reply(res,429,'Дневной лимит пробных видео исчерпан.');
      active++;
      let frameId;
      try{
        const input=await readJSON(req);
        const blob=imageBlob(input?.image,'image');
        if(!blob)return reply(res,400,'Загрузите фото или рендер дома.');
        if(blob.size>MAX_IMAGE)return reply(res,413,'Максимум 8 МБ на изображение.');
        const prompt=String(input?.prompt||'').trim().slice(0,4500);
        if(prompt.length<12)return reply(res,400,'Укажите движение камеры.');
        const duration=Number(input?.duration),ratio=String(input?.ratio||'16:9');
        if(![5,10].includes(duration))return reply(res,400,'Выберите 5 или 10 секунд.');
        if(!['16:9','9:16'].includes(ratio))return reply(res,400,'Допустимые форматы: 16:9, 9:16.');
        const model=await modelInfo();
        if(model.supported_durations?.length&&!model.supported_durations.includes(duration))return reply(res,400,'Выбранная длительность недоступна.');
        if(model.supported_aspect_ratios?.length&&!model.supported_aspect_ratios.includes(ratio))return reply(res,400,'Выбранный формат недоступен.');
        const resolutions=model.supported_resolutions;
        const resolution=Array.isArray(resolutions)?(resolutions.includes('720p')?'720p':resolutions.includes('1080p')?'1080p':null):null;
        if(resolutions?.length&&!resolution)return reply(res,503,'Нет поддерживаемого разрешения.');
        frameId=randomUUID();
        frames.set(frameId,{bytes:Buffer.from(await blob.arrayBuffer()),type:blob.type,expires:Date.now()+FRAME_TTL});
        const payload={model:MODEL,prompt:prompt+'\nStrict preservation: original building geometry, windows, roofing, materials, landscape. Smooth natural motion; no redesign.',duration,aspect_ratio:ratio,generate_audio:false,frame_images:[{type:'image_url',image_url:{url:publicOrigin()+'/api/wan/frame?id='+frameId},frame_type:'first_frame'}]};
        if(resolution)payload.resolution=resolution;
        const sent=await fetch(API+'/videos',{method:'POST',headers:{...headers(),'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(60000)});
        if(!sent.ok)throw Error(providerError(sent));
        const output=await parse(sent);
        if(typeof output.id!=='string'||!output.id)throw Error('Провайдер не вернул ID задания.');
        const id=randomUUID();
        jobs.set(id,{id,remote:output.id,frameId,created:Date.now()});
        used++;
        return json(res,202,{id,status:output.status||'pending',model:MODEL});
      }catch(e){if(frameId)frames.delete(frameId);return reply(res,502,errorText(e))}
      finally{active--}
    }
    return reply(res,404,'Маршрут не найден.');
  }
  return {handle};
}
