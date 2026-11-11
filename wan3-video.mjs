/**
 * Alibaba Cloud Model Studio Wan3.0 Image-to-Video adapter for ДОМ.РЕНДЕР.
 *
 * Deliberately disabled until the owner enables Free Quota Only for wan3.0-video
 * in Alibaba's Singapore console and explicitly confirms that in Render.
 * Never automatically fall back to pay-as-you-go, other models or regions.
 */
import {randomUUID,timingSafeEqual} from 'node:crypto';
import {Readable} from 'node:stream';

const MODEL='wan3.0-video';
const MAX_IMAGE=8*1024*1024;
const JOB_LIFETIME=24*60*60*1000;
const MAX_PROMPT=4500;
const key=()=>String(process.env.DASHSCOPE_API_KEY||'').trim();
const workspace=()=>String(process.env.WAN3_WORKSPACE_ID||'').trim();
const enabled=()=>process.env.WAN3_ENABLED==='true';
const protectedQuota=()=>process.env.WAN3_FREE_QUOTA_ONLY_CONFIRMED==='true';
const accessCode=()=>String(process.env.WAN3_ACCESS_PIN||'').trim();
function authenticated(code){
 const secret=accessCode();
 if(secret.length<12||typeof code!=='string'||code.length>200)return false;
 const left=Buffer.from(secret),right=Buffer.from(code);
 return left.length===right.length&&timingSafeEqual(left,right);
}
const dailyLimit=()=>{
  const n=Number(process.env.WAN_DAILY_LIMIT||10);
  return Number.isInteger(n)&&n>=1&&n<=20?n:10;
};
const taskID=id=>typeof id==='string'&&/^[0-9a-z-]{8,100}$/i.test(id);
const jobID=id=>typeof id==='string'&&/^[0-9a-f-]{36}$/i.test(id);
const compact=e=>String(e?.message||e||'Ошибка генерации').replace(/[\r\n]+/g,' ').slice(0,210);
function endpoint(){
  const id=workspace();
  if(!/^[a-zA-Z0-9-]{2,64}$/.test(id))throw Error('Укажите Workspace ID региона Singapore в WAN3_WORKSPACE_ID.');
  return 'https://'+id+'.ap-southeast-1.maas.aliyuncs.com';
}
function settings(){
  if(!enabled())return {ready:false,reason:'Wan 3.0 пока выключена. Нужно установить WAN3_ENABLED=true на Render.'};
  if(!key())return {ready:false,reason:'Добавьте DASHSCOPE_API_KEY из Alibaba Cloud Model Studio (Singapore).'};
  if(!workspace())return {ready:false,reason:'Добавьте WAN3_WORKSPACE_ID из Alibaba Cloud Model Studio (Singapore).'};
  try{endpoint()}catch(e){return {ready:false,reason:compact(e)}}
  if(!protectedQuota())return {ready:false,reason:'Сначала включите Free Quota Only для wan3.0-video в Alibaba Cloud, затем установите WAN3_FREE_QUOTA_ONLY_CONFIRMED=true в Render. Без этого возможны списания.'};
  if(accessCode().length<12)return {ready:false,reason:'Создайте WAN3_ACCESS_PIN (минимум 12 символов) в Environment на Render, чтобы защитить пробную квоту от посторонних.'};
  return {ready:true,model:MODEL,region:'Singapore',note:'Конфигурация заполнена; доступность квоты и действительность ключа проверяются только при реальном вызове.'};
}
function providerError(status,body){
  if(body?.code==='AllocationQuota.FreeTierOnly')return 'Бесплатная квота Alibaba исчерпана. Генерация остановлена без оплаты.';
  if(status===401||body?.code==='InvalidApiKey')return 'Alibaba не приняла API-ключ (регион Singapore).';
  if(status===403)return 'Alibaba отклонила доступ к модели или бесплатная квота исчерпана.';
  if(status===429)return 'Alibaba ограничила частоту запросов. Попробуйте позже.';
  return 'Alibaba Cloud отклонила запрос (HTTP '+status+', '+String(body?.code||'error').slice(0,40)+').';
}
async function decode(res){
  try{return await res.json()}catch{throw Error('Alibaba вернула некорректный ответ.')}
}
const auth=()=>({'Authorization':'Bearer '+key()});
const permittedVideoURL=(value)=>{
  try{
    const u=new URL(value);
    const h=u.hostname.toLowerCase();
    return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&
      (h.endsWith('.aliyuncs.com')||h.endsWith('.alibabacloud.com'));
  }catch{return false;}
};

export function createWan3Video({json,readJSON,sameOrigin,imageBlob}){
  const jobs=new Map();
  let day='',used=0,active=0;
  const fail=(res,status,message)=>json(res,status,{error:message});
  function resetDay(){
    const date=new Date().toISOString().slice(0,10);
    if(date!==day){day=date;used=0;}
    for(const [id,job] of jobs)if(job.created+JOB_LIFETIME<Date.now())jobs.delete(id);
  }
  async function taskStatus(job){
    const r=await fetch(endpoint()+'/api/v1/tasks/'+encodeURIComponent(job.remote),{
      headers:auth(),signal:AbortSignal.timeout(28000)
    });
    const data=await decode(r);
    if(!r.ok)throw Error(providerError(r.status,data));
    const raw=data?.output?.task_status;
    const status=raw==='SUCCEEDED'?'completed':raw==='RUNNING'?'in_progress':
      raw==='PENDING'?'pending':raw==='FAILED'?'failed':
      raw==='CANCELED'?'cancelled':raw==='UNKNOWN'?'expired':'pending';
    const videoURL=typeof data?.output?.video_url==='string'?data.output.video_url:null;
    if(status==='completed'&&videoURL)job.videoURL=videoURL;
    return {status,error:status==='failed'?String(data?.output?.message||data?.message||'Ошибка модели').slice(0,160):''};
  }
  async function handle(req,res){
    resetDay();
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/api/wan3/status'&&req.method==='GET'){
      return json(res,200,{...settings(),remaining:Math.max(0,dailyLimit()-used),
        dailyLimit:dailyLimit(),trialQuota:'30 seconds total for eligible new Singapore accounts; not daily'});
    }
    const cfg=settings();
    if(!cfg.ready)return fail(res,503,cfg.reason);
    if(url.pathname==='/api/wan3/job'&&req.method==='GET'){
      const id=url.searchParams.get('id');
      const job=jobID(id)?jobs.get(id):null;
      if(!job)return fail(res,404,'Задание не найдено. Возможно, сервер Render перезапущен.');
      try{
        const state=await taskStatus(job);
        return json(res,200,{id:job.id,...state,
          downloadUrl:state.status==='completed'&&job.videoURL?'/api/wan3/download?id='+job.id:null});
      }catch(e){return fail(res,502,compact(e))}
    }
    if(url.pathname==='/api/wan3/download'&&req.method==='GET'){
      const id=url.searchParams.get('id');
      const job=jobID(id)?jobs.get(id):null;
      if(!job)return fail(res,404,'Задание не найдено.');
      try{
        const state=await taskStatus(job);
        if(state.status!=='completed')return fail(res,409,'Видео ещё не готово.');
        if(!permittedVideoURL(job.videoURL))return fail(res,502,'Alibaba вернула неподдерживаемый адрес видео.');
        const upstream=await fetch(job.videoURL,{
          redirect:'error',signal:AbortSignal.timeout(45000)
        });
        if(!upstream.ok||!upstream.body)return fail(res,502,'Не удалось загрузить MP4 от Alibaba.');
        const type=upstream.headers.get('content-type')||'video/mp4';
        if(!/video\/|application\/octet-stream/.test(type))return fail(res,502,'Провайдер не вернул видеофайл.');
        res.writeHead(200,{'Content-Type':'video/mp4',
          'Content-Disposition':'attachment; filename="dom-render-wan3.mp4"',
          'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});
        Readable.fromWeb(upstream.body).pipe(res);
      }catch(e){
        if(res.headersSent)res.destroy();
        else return fail(res,502,compact(e));
      }
      return;
    }
    if(url.pathname==='/api/wan3/generate'&&req.method==='POST'){
      if(!sameOrigin(req))return fail(res,403,'Недопустимый источник запроса.');
      if(active>0)return fail(res,429,'Другое видео уже отправляется на генерацию.');
      if(used>=dailyLimit())return fail(res,429,'Дневной лимит запусков сайта исчерпан.');
      active++;
      try{
        const input=await readJSON(req);
        if(!authenticated(input?.accessPin))return fail(res,403,'Неверный приватный код генерации Wan 3.0.');
        const blob=imageBlob(input?.image,'image');
        if(!blob)return fail(res,400,'Загрузите изображение дома.');
        if(blob.size>MAX_IMAGE)return fail(res,413,'Размер изображения должен быть до 8 МБ.');
        const prompt=String(input?.prompt||'').trim().slice(0,MAX_PROMPT);
        if(prompt.length<12)return fail(res,400,'Укажите плавное движение камеры.');
        const duration=Number(input?.duration||5);
        if(duration!==5&&duration!==10)return fail(res,400,'Выберите 5 или 10 секунд.');
        const ratio=String(input?.ratio||'16:9');
        if(!['16:9','9:16'].includes(ratio))return fail(res,400,'Поддерживаются 16:9 и 9:16.');
        const bytes=Buffer.from(await blob.arrayBuffer());
        const base64='data:'+blob.type+';base64,'+bytes.toString('base64');
        const payload={
          model:MODEL,
          input:{
            prompt:prompt+'\nPreserve the source building geometry, all windows, precise cladding layout, landscaping and original materials; gentle camera movement, no morphing.',
            media:[{type:'first_frame',url:base64}]
          },
          parameters:{
            resolution:'480P',ratio:'adaptive',duration,audio:false,
            watermark:false,prompt_extend:false
          }
        };
        const r=await fetch(endpoint()+'/api/v1/services/aigc/video-generation/video-synthesis',{
          method:'POST',headers:{...auth(),'X-DashScope-Async':'enable','Content-Type':'application/json'},
          body:JSON.stringify(payload),signal:AbortSignal.timeout(60000)
        });
        const data=await decode(r);
        if(!r.ok||data?.code)throw Error(providerError(r.status,data));
        const remote=data?.output?.task_id;
        if(!taskID(remote))throw Error('Alibaba не вернула действительный номер задания.');
        const id=randomUUID();
        jobs.set(id,{id,remote,created:Date.now(),videoURL:null});
        used++;
        return json(res,202,{id,status:'pending',model:MODEL});
      }catch(e){return fail(res,502,compact(e))}
      finally{active--}
    }
    return fail(res,404,'Маршрут не найден.');
  }
  return {handle};
}
