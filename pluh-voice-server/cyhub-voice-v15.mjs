import {appOrigin} from "./allowed-origins-v31.mjs";
/* PLUX V15 — opt-in Russian ElevenLabs narration via Cyhub tasks.
   Provider secret never reaches the web app. Temporary task ownership is in memory.
   This is a restricted preview integration, not production authentication.
*/
import {randomUUID} from "node:crypto";

const CY="https://api.cyhub.ai/v1";
const ORIGIN="https://plux-v12-2-2k-fixed.onrender.com";
const VOICE="cgSgspJ2msm6clMCkdW9";
const tasks=new Map();
const calls=new Map();
let inProgress=0,dailyCount=0,dayStart=Date.now();
const validId=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const clean=s=>String(s||"").replace(/[\u0000-\u001f]/g," ").trim();
function reply(res,status,body){
  res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});
  res.end(JSON.stringify(body));
}
function ipOf(req){return String(req.headers["x-forwarded-for"]||req.socket?.remoteAddress||"unknown").split(",")[0].trim().slice(0,80)}
function key(){return String(process.env.CYHUB_API_KEY||"").trim()}
function fail(status,reason){return Object.assign(new Error(reason),{status})}
function cors(req,res){
  if(!appOrigin(req)){reply(res,403,{error:"Источник не разрешён."});return false}
  res.setHeader("Access-Control-Allow-Origin",appOrigin(req));
  res.setHeader("Access-Control-Allow-Methods","GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  res.setHeader("Vary","Origin");
  if(req.method==="OPTIONS"){res.writeHead(204,{"Cache-Control":"no-store"});res.end();return false}
  return true;
}
function releaseOld(){
  const now=Date.now();
  for(const [id,t] of tasks)if(now-t.created>60*60*1000)tasks.delete(id);
  if(now-dayStart>86400000){dayStart=now;dailyCount=0;calls.clear()}
}
function takeQuota(ip){
  releaseOld();
  const now=Date.now(),list=(calls.get(ip)||[]).filter(t=>now-t<600000);
  if(list.length>=3)throw fail(429,"Максимум три озвучки за 10 минут.");
  if(dailyCount>=25)throw fail(429,"Дневной лимит голосовых запросов исчерпан.");
  if(inProgress>=2)throw fail(429,"Генерация голоса занята. Попробуй чуть позже.");
  list.push(now);calls.set(ip,list);dailyCount++;inProgress++;
}
async function readPayload(req){
  const declared=Number(req.headers["content-length"]||0);
  if(declared>2200)throw fail(413,"Текст слишком длинный.");
  const chunks=[];let size=0;
  for await(const part of req){size+=part.length;if(size>2200)throw fail(413,"Текст слишком длинный.");chunks.push(part)}
  try{return JSON.parse(Buffer.concat(chunks).toString("utf8"))}catch{throw fail(400,"Некорректные данные запроса.")}
}
async function cy(endpoint,options={}){
  const resp=await fetch(CY+endpoint,{
    ...options,
    headers:{"Authorization":"Bearer "+key(),...(options.headers||{})},
    signal:AbortSignal.timeout(18000)
  });
  let data=null;
  if(resp.headers.get("content-type")?.includes("application/json"))data=await resp.json().catch(()=>null);
  if(!resp.ok){
    const msg=resp.status===401||resp.status===403?"Проверь API-ключ Cyhub.":resp.status===402?"Недостаточно средств на балансе Cyhub.":resp.status===422?"Cyhub отклонил параметры озвучки.":"Сервис озвучки ответил HTTP "+resp.status+".";
    throw fail(resp.status===429?429:502,msg);
  }
  return {resp,data};
}
function settings(text){return {model:"elevenlabs",settings:{mode:"text_to_dialogue",text,voice:VOICE,language_code:"ru"}}}
function allowedTask(id,ip){
  releaseOld();
  if(!validId.test(id))throw fail(400,"Неверный идентификатор задачи.");
  const task=tasks.get(id);
  if(!task||task.ip!==ip)throw fail(404,"Задача не найдена. Повтори озвучку.");
  return task;
}
export async function handleCyhub(req,res){
  const path=new URL(req.url||"/","http://localhost").pathname;
  if(!path.startsWith("/api/tts/"))return false;
  if(!cors(req,res))return true;
  try{
    if(path==="/api/tts/config"){
      if(req.method!=="GET")throw fail(405,"Нужен GET.");
      reply(res,200,{configured:Boolean(key()),provider:"cyhub",model:"elevenlabs",language:"ru"});
      return true;
    }
    if(!key())throw fail(503,"Озвучка не подключена: добавь CYHUB_API_KEY в Environment сервера ПЛЮХ на Render.");
    const ip=ipOf(req);
    if(path==="/api/tts/start"){
      if(req.method!=="POST")throw fail(405,"Нужен POST.");
      const body=await readPayload(req);
      const text=clean(body?.text);
      if(text.length<2||text.length>450)throw fail(400,"Для озвучки нужен текст от 2 до 450 символов.");
      // Voice requests are explicitly clicked: never charge for ordinary chat replies.
      takeQuota(ip);
      try{
        const payload=settings(text);
        // The price call does not charge; reject unexpected or expensive jobs.
        const price=(await cy("/price",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)})).data;
        const amount=price?.amount_minor;
        if(!Number.isInteger(amount)||amount<0)throw fail(502,"Cyhub не сообщил стоимость озвучки — запрос не отправлен.");
        if(amount>500)throw fail(400,"Стоимость озвучки превышает лимит 5 ₽. Сократи текст.");
        if(Number.isInteger(price?.available_minor)&&price.available_minor<amount)throw fail(402,"Недостаточно средств на Cyhub.");
        const result=(await cy("/tasks",{
          method:"POST",
          headers:{"Content-Type":"application/json","Idempotency-Key":randomUUID()},
          body:JSON.stringify(payload)
        })).data;
        const id=String(result?.id||"");
        if(!validId.test(id))throw fail(502,"Cyhub не вернул идентификатор задачи.");
        tasks.set(id,{ip,created:Date.now(),status:String(result.status||"queued")});
        reply(res,202,{taskId:id,status:result.status||"queued",amountMinor:amount,currency:price?.currency||"RUB"});
      }finally{inProgress--;}
      return true;
    }
    const taskMatch=/^\/api\/tts\/task\/([^/]+)$/.exec(path);
    if(taskMatch){
      if(req.method!=="GET")throw fail(405,"Нужен GET.");
      const id=taskMatch[1],task=allowedTask(id,ip);
      const data=(await cy("/tasks/"+id)).data;
      const status=String(data?.status||"unknown");
      task.status=status;
      if(!["queued","running","succeeded","failed","cancelled"].includes(status))throw fail(502,"Cyhub вернул неизвестный статус.");
      const ready=status==="succeeded"&&Array.isArray(data.result?.artifacts)&&data.result.artifacts.some(a=>a?.kind==="audio");
      reply(res,200,{status,ready,error:status==="failed"?clean(data?.error?.message||data?.error||"Озвучка не удалась.").slice(0,170):undefined});
      return true;
    }
    const mediaMatch=/^\/api\/tts\/audio\/([^/]+)$/.exec(path);
    if(mediaMatch){
      if(req.method!=="GET")throw fail(405,"Нужен GET.");
      const id=mediaMatch[1],task=allowedTask(id,ip);
      if(task.status!=="succeeded")throw fail(409,"Озвучка ещё не готова.");
      // Download via an authenticated server route; never expose Cyhub API key.
      const external=await fetch(CY+"/tasks/"+id+"/artifacts/0",{
        headers:{"Authorization":"Bearer "+key()},
        signal:AbortSignal.timeout(22000)
      });
      if(!external.ok)throw fail(502,"Не удалось получить MP3 от Cyhub.");
      const length=Number(external.headers.get("content-length")||0);
      if(length>10_000_000)throw fail(413,"Аудиофайл слишком большой.");
      const bytes=Buffer.from(await external.arrayBuffer());
      if(bytes.length<100||bytes.length>10_000_000)throw fail(502,"Cyhub вернул пустой или слишком большой файл.");
      const isMp3=bytes.toString("ascii",0,3)==="ID3"||(bytes[0]===255&&(bytes[1]&224)===224);
      if(!isMp3)throw fail(502,"Cyhub вернул файл, который не похож на MP3.");
      res.writeHead(200,{"Content-Type":"audio/mpeg","Content-Length":bytes.length,"Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Content-Disposition":'attachment; filename="PLUX-voice.mp3"'});
      res.end(bytes);return true;
    }
    throw fail(404,"Маршрут не найден.");
  }catch(e){
    const status=[400,402,403,404,405,409,413,429,502,503].includes(e.status)?e.status:502;
    const safe=status===502&&!e.status?"Нет связи с Cyhub. Попробуй ещё раз.":String(e.message||"Ошибка озвучки.").slice(0,240);
    reply(res,status,{error:safe});
    return true;
  }
}
