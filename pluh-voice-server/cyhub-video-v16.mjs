/* PLUX V16 — lowest-priced Cyhub Grok Imagine Lite, text-to-video.
 * Strict server-side key, quote-before-charge, short-lived quotes, bounded spend,
 * per-client/global budgets, idempotency and protected result download.
 * The browser cannot choose another model or bypass the quote.
 */
import {randomUUID} from "node:crypto";

const BASE="https://api.cyhub.ai/v1";
const ORIGIN="https://plux-v12-2-2k-fixed.onrender.com";
const MODEL="grok_video";
const VARIANT="grok_lite";
const MAX_PRICE_MINOR=7500; // Absolute hard stop: 75 RUB, regardless of account balance.
const quotes=new Map();
const jobs=new Map();
const hits=new Map();
let daily=0,day=Date.now(),active=0;
const problem=(status,msg)=>Object.assign(new Error(msg),{status});
const safeText=(s,len=240)=>String(s||"").replace(/[\u0000-\u001f]/g," ").trim().slice(0,len);
const ipOf=req=>String(req.headers["x-forwarded-for"]||req.socket?.remoteAddress||"unknown").split(",")[0].trim().slice(0,90);
const secret=()=>String(process.env.CYHUB_API_KEY||"").trim();
function json(res,status,body){
 res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});
 res.end(JSON.stringify(body));
}
function cors(req,res){
 if(req.headers.origin!==ORIGIN){json(res,403,{error:"Источник запроса не разрешён."});return false}
 res.setHeader("Access-Control-Allow-Origin",ORIGIN);
 res.setHeader("Access-Control-Allow-Headers","Content-Type");
 res.setHeader("Access-Control-Allow-Methods","GET, POST, OPTIONS");
 res.setHeader("Vary","Origin");
 if(req.method==="OPTIONS"){res.writeHead(204,{"Cache-Control":"no-store"});res.end();return false}
 return true;
}
function prune(){
 const now=Date.now();
 for(const [id,x] of quotes)if(now-x.created>10*60*1000)quotes.delete(id);
 for(const [id,x] of jobs)if(now-x.created>70*60*1000)jobs.delete(id);
 if(now-day>86400000){day=now;daily=0;hits.clear();}
}
function checkQuota(ip){
 prune();
 const now=Date.now(),recent=(hits.get(ip)||[]).filter(x=>now-x<600000);
 if(recent.length>=2)throw problem(429,"Не более двух видео за 10 минут.");
 if(daily>=12)throw problem(429,"Дневной лимит генерации видео исчерпан.");
 if(active>=2)throw problem(429,"Генератор занят. Попробуй позже.");
 return recent;
}
function settings(body){
 const prompt=safeText(body?.prompt,1400);
 if(prompt.length<5||prompt.length>1200)throw problem(400,"Опиши видео текстом длиной от 5 до 1200 символов.");
 const seconds=Number(body?.duration??5);
 if(!Number.isInteger(seconds)||seconds<1||seconds>15)throw problem(400,"Длительность должна быть от 1 до 15 секунд.");
 const aspect=String(body?.aspectRatio||"16:9");
 if(!["16:9","9:16","1:1"].includes(aspect))throw problem(400,"Недопустимый формат кадра.");
 // Do not accept arbitrary models, urls, resolutions, unsafe settings.
 return {model:MODEL,settings:{mode:"text_to_video",model:VARIANT,prompt,
   duration:seconds,aspect_ratio:aspect,quality:"480p"}};
}
async function readBody(req,maxBytes=2600){
 const declared=Number(req.headers["content-length"]||0);
 if(declared>maxBytes)throw problem(413,"Слишком большой запрос.");
 const list=[];let len=0;
 for await(const part of req){len+=part.length;if(len>maxBytes)throw problem(413,"Слишком большой запрос.");list.push(part)}
 try{return JSON.parse(Buffer.concat(list).toString("utf8"))}catch{throw problem(400,"Неверный формат запроса.")}
}
async function provider(path,opts={}){
 const response=await fetch(BASE+path,{
   ...opts,
   headers:{Authorization:"Bearer "+secret(),...(opts.headers||{})},
   signal:AbortSignal.timeout(18000)
 });
 const body=await response.json().catch(()=>null);
 if(!response.ok){
  let desc="Ошибка API Cyhub: HTTP "+response.status+".";
  if(response.status===401||response.status===403)desc="Проверь API-ключ Cyhub.";
  else if(response.status===402)desc="Недостаточно средств на балансе Cyhub.";
  else if(response.status===422)desc="Настройки видео отклонены Cyhub. Проверь поддержку Grok Lite.";
  else if(response.status===429)desc="Лимит запросов Cyhub. Попробуй позже.";
  throw problem(response.status===429?429:502,desc);
 }
 return body;
}
async function getPrice(data){
 const x=await provider("/price",{method:"POST",
   headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
 if(!Number.isInteger(x?.amount_minor)||x.amount_minor<0||x.currency!=="RUB")
  throw problem(502,"Cyhub не сообщил цену в рублях. Видео не запущено.");
 if(x.amount_minor>MAX_PRICE_MINOR)
  throw problem(400,"Стоимость выше лимита 75 ₽. Уменьши длительность.");
 return x;
}
function jobFor(req,id){
 prune();
 if(!/^[0-9a-f-]{36}$/i.test(id))throw problem(400,"Неверный идентификатор.");
 const job=jobs.get(id);
 if(!job||job.ip!==ipOf(req))throw problem(404,"Задача не найдена в этой сессии.");
 return job;
}
async function downloadVideo(req,res,job){
 if(job.state!=="succeeded"||!Number.isInteger(job.index))throw problem(409,"Видео ещё не готово.");
 const r=await fetch(BASE+"/tasks/"+encodeURIComponent(job.providerId)+"/artifacts/"+job.index,{
   headers:{Authorization:"Bearer "+secret()},
   signal:AbortSignal.timeout(45000)
 });
 if(!r.ok)throw problem(502,"Cyhub не выдал готовый MP4.");
 const declared=Number(r.headers.get("content-length")||0);
 if(declared>65_000_000)throw problem(413,"Видеофайл слишком большой.");
 let total=0;const parts=[];
 if(!r.body)throw problem(502,"Cyhub вернул пустой файл.");
 for await(const part of r.body){
  total+=part.length;if(total>65_000_000)throw problem(413,"Файл превышает 65 МБ.");
  parts.push(Buffer.from(part));
 }
 const file=Buffer.concat(parts);
 const mp4=file.subarray(4,8).toString("ascii")==="ftyp";
 if(!mp4||file.length<400)throw problem(502,"Cyhub вернул неподдерживаемый видеофайл.");
 res.writeHead(200,{"Content-Type":"video/mp4","Content-Length":file.length,
  "Cache-Control":"private, no-store","Accept-Ranges":"none",
  "Content-Disposition":'inline; filename="PLUX-Grok-Lite.mp4"',
  "X-Content-Type-Options":"nosniff"});
 res.end(file);
}
export async function handleCyhubVideo(req,res){
 const path=new URL(req.url||"/","http://localhost").pathname;
 if(!path.startsWith("/api/video/"))return false;
 if(!cors(req,res))return true;
 try{
  if(path==="/api/video/config"){
    if(req.method!=="GET")throw problem(405,"Используй GET.");
    json(res,200,{configured:Boolean(secret()),model:MODEL,variant:VARIANT,
      options:{seconds:[1,3,5,8,10,15],aspects:["16:9","9:16","1:1"],quality:"480p"},
      maxChargeRub:MAX_PRICE_MINOR/100});
    return true;
  }
  if(!secret())throw problem(503,"Cyhub ещё не подключён. Добавь CYHUB_API_KEY в Render Environment сервера ПЛЮХ.");
  const ip=ipOf(req);
  if(path==="/api/video/quote"){
    if(req.method!=="POST")throw problem(405,"Используй POST.");
    const body=await readBody(req),payload=settings(body),price=await getPrice(payload);
    prune();
    const token=randomUUID();
    quotes.set(token,{created:Date.now(),ip,payload,amount:price.amount_minor,currency:price.currency,used:false});
    json(res,200,{quoteId:token,amountMinor:price.amount_minor,currency:"RUB",
      expiresSeconds:600,available:typeof price.available_minor==="number"?
        price.available_minor>=price.amount_minor:undefined});
    return true;
  }
  if(path==="/api/video/start"){
    if(req.method!=="POST")throw problem(405,"Используй POST.");
    const body=await readBody(req,600);
    const quote=quotes.get(String(body?.quoteId||""));
    if(!quote||quote.used||quote.ip!==ip||Date.now()-quote.created>600000)
      throw problem(409,"Цена устарела. Проверь стоимость ещё раз.");
    checkQuota(ip);
    // Reprice immediately. Changes never become a surprise charge.
    const price=await getPrice(quote.payload);
    if(price.amount_minor!==quote.amount)throw problem(409,"Цена изменилась. Проверь стоимость повторно.");
    if(Number.isInteger(price.available_minor)&&price.available_minor<price.amount_minor)
      throw problem(402,"Недостаточно средств на балансе Cyhub.");
    quote.used=true;
    active++;
    try{
      const job=await provider("/tasks",{method:"POST",
        headers:{"Content-Type":"application/json","Idempotency-Key":randomUUID()},
        body:JSON.stringify(quote.payload)});
      if(typeof job?.id!=="string"||!/^[0-9a-f-]{36}$/i.test(job.id))
        throw problem(502,"Cyhub не вернул идентификатор задачи. Проверь историю задач перед повтором.");
      const token=randomUUID();
      jobs.set(token,{created:Date.now(),ip,providerId:job.id,
        state:job.status||"queued",index:null});
      const recent=checkQuota(ip);
      recent.push(Date.now());hits.set(ip,recent);daily++;
      quotes.delete(String(body.quoteId));
      json(res,202,{videoId:token,status:job.status||"queued",
        amountMinor:Number.isInteger(job.amount_minor)?job.amount_minor:quote.amount,
        currency:"RUB"});
    }finally{active--}
    return true;
  }
  const status=/^\/api\/video\/status\/([0-9a-f-]{36})$/.exec(path);
  if(status){
    if(req.method!=="GET")throw problem(405,"Используй GET.");
    const job=jobFor(req,status[1]);
    const data=await provider("/tasks/"+encodeURIComponent(job.providerId));
    const state=String(data?.status||"queued");
    if(!["queued","running","succeeded","failed","cancelled"].includes(state))
      throw problem(502,"Cyhub вернул неизвестный статус.");
    job.state=state;
    if(state==="succeeded"){
      const a=data?.result?.artifacts?.find(a=>a?.kind==="video"&&Number.isInteger(a.index));
      if(!a)throw problem(502,"Задача завершена, но видео не найдено.");
      job.index=a.index;
    }
    json(res,200,{status:state,ready:state==="succeeded",
      stage:safeText(data?.stage,130),
      error:state==="failed"?safeText(typeof data?.error==="string"?data.error:data?.error?.message,180):undefined});
    return true;
  }
  const file=/^\/api\/video\/file\/([0-9a-f-]{36})$/.exec(path);
  if(file){
    if(req.method!=="GET")throw problem(405,"Используй GET.");
    await downloadVideo(req,res,jobFor(req,file[1]));
    return true;
  }
  throw problem(404,"Неизвестный маршрут.");
 }catch(e){
   const status=[400,402,403,404,405,409,413,429,502,503].includes(e.status)?e.status:502;
   const reason=e.status?safeText(e.message,230):"Нет связи с Cyhub. Запрос не следует повторять без проверки истории задач, если он уже был отправлен.";
   json(res,status,{error:reason});
   return true;
 }
}
