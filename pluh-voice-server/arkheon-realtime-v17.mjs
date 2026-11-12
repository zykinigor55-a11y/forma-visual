import {appOrigin} from "./allowed-origins-v31.mjs";
/* PLUX V17: ephemeral Arkheon Realtime browser credentials.
 * Browser never receives ARKHEON_API_KEY; token valid for one connection/60s.
 */
const ORIGIN="https://plux-v12-2-2k-fixed.onrender.com";
const MODEL="google/gemini-2.5-flash-lite";
const TOKEN_API="https://arkheonchat.com/v1/realtime/client_secrets";
const IP_LIMIT=new Map();
let day=Date.now(),total=0;
function json(res,status,data){
 res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});
 res.end(JSON.stringify(data));
}
const msg=(status,message)=>Object.assign(new Error(message),{status});
function origin(req,res){
 if(!appOrigin(req)){json(res,403,{error:"Открой официальное приложение ПЛЮХ для голосового режима."});return false}
 res.setHeader("Access-Control-Allow-Origin",appOrigin(req));
 res.setHeader("Access-Control-Allow-Methods","GET, POST, OPTIONS");
 res.setHeader("Access-Control-Allow-Headers","Content-Type");
 res.setHeader("Vary","Origin");
 if(req.method==="OPTIONS"){res.writeHead(204,{"Cache-Control":"no-store"});res.end();return false}
 return true;
}
function rate(req){
 const now=Date.now();
 if(now-day>=86400000){total=0;day=now;IP_LIMIT.clear()}
 const ip=String(req.headers["x-forwarded-for"]||req.socket?.remoteAddress||"unknown").split(",")[0].trim().slice(0,75);
 const hits=(IP_LIMIT.get(ip)||[]).filter(t=>now-t<60000);
 // No artificial three-conversations-per-ten-minutes limit: rapid re-opening is normal.
 // Protect the account only against automated mass token issuance.
 if(hits.length>=20||total>=160)throw msg(429,"Защита от слишком частых автоматических подключений. Повтори немного позже.");
 hits.push(now);IP_LIMIT.set(ip,hits);total++;
}
export async function arkheonSession(req,res){
 const path=new URL(req.url||"/","http://localhost").pathname;
 if(!path.startsWith("/api/arkheon/"))return false;
 if(!origin(req,res))return true;
 if(path==="/api/arkheon/config"){
  if(req.method!=="GET")return json(res,405,{error:"Нужен GET."});
  json(res,200,{ready:Boolean(process.env.ARKHEON_API_KEY),model:MODEL,transport:"websocket",provider:"arkheon"});
  return true;
 }
 if(path!=="/api/arkheon/token")return json(res,404,{error:"Маршрут не найден."});
 if(req.method!=="POST")return json(res,405,{error:"Нужен POST."});
 const key=String(process.env.ARKHEON_API_KEY||"").trim();
 if(!key)return json(res,503,{error:"Для живого разговора добавь ARKHEON_API_KEY в Render Environment. Ключ нельзя вводить на экране телефона."});
 try{
  rate(req);
  const response=await fetch(TOKEN_API,{
   method:"POST",
   headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},
   body:JSON.stringify({session:{type:"realtime",model:MODEL}}),
   signal:AbortSignal.timeout(16000)
  });
  const data=await response.json().catch(()=>null);
  if(!response.ok){
   const detail=response.status===401||response.status===403?"Проверь API-ключ Arkheon и права доступа к Realtime.":
    response.status===402?"Пополните баланс Arkheon.":response.status===429?"Достигнут лимит Arkheon.":
    response.status===400||response.status===422?"Arkheon отклонил формат запроса на одноразовый токен. Проверь контракт API.":
    "Arkheon ответил HTTP "+response.status+".";
   return json(res,response.status===429?429:502,{error:detail});
  }
  const token=data?.client_secret?.value||data?.client_secret?.token||data?.value||data?.token||data?.secret;
  if(typeof token!=="string"||token.length<16||token.length>300)
   return json(res,502,{error:"Arkheon не вернул одноразовый токен в ожидаемом формате."});
  return json(res,200,{token,model:MODEL,wsUrl:"wss://arkheonchat.com/v1/realtime?model="+encodeURIComponent(MODEL),expiresSeconds:60});
 }catch(e){
  const code=e.status||502;
  return json(res,code,{error:code===429?e.message:e?.name==="TimeoutError"?"Arkheon не ответил вовремя.":"Не удалось связаться с Arkheon."});
 }
}


/** Non-billable voice inventory check. This does not synthesize audio or expose the API key. */
export async function arkheonVoiceProbe(){
 const key=String(process.env.ARKHEON_API_KEY||"").trim();
 if(!key)return {configured:false,checked:false,voices:[]};
 try{
  const response=await fetch("https://arkheonchat.com/v1/audio/models",{
   method:"GET",headers:{Authorization:"Bearer "+key,"Accept":"application/json"},
   signal:AbortSignal.timeout(9000)
  });
  if(!response.ok)return {configured:true,checked:false,status:response.status,voices:[]};
  const info=await response.json();
  const values=[];
  const scan=x=>{
   if(!x||typeof x!=="object"||values.length>100)return;
   if(Array.isArray(x)){for(const item of x.slice(0,100))scan(item);return}
   if(typeof x.id==="string"&&/^(ash|echo|verse|alloy|coral|marin|cedar|onyx|puck|male|ru[-_])/i.test(x.id))
    values.push(x.id.slice(0,70));
   if(typeof x.name==="string"&&/^(ash|echo|verse|alloy|coral|marin|cedar|onyx)/i.test(x.name))
    values.push(x.name.slice(0,70));
   for(const k of ["data","models","voices","items","supported_voices","available_voices"])if(x[k])scan(x[k]);
  };
  scan(info);
  return {configured:true,checked:true,voices:[...new Set(values)].slice(0,40),
    topLevelKeys:typeof info==="object"?Object.keys(info||{}).slice(0,7):[]};
 }catch{return {configured:true,checked:false,voices:[]};}
}


/** Read-only billing telemetry for operator logs; never log keys or account identifiers. */
export async function arkheonUsageProbe(){
 const key=String(process.env.ARKHEON_API_KEY||"").trim();
 if(!key)return {configured:false,checked:false};
 try{
  const [usageResult,balanceResult]=await Promise.allSettled([
   fetch("https://arkheonchat.com/v1/usage?days=30",{
    headers:{Authorization:"Bearer "+key,"Accept":"application/json"},
    signal:AbortSignal.timeout(10000)}),
   fetch("https://arkheonchat.com/v1/balance",{
    headers:{Authorization:"Bearer "+key,"Accept":"application/json"},
    signal:AbortSignal.timeout(10000)})
  ]);
  const usage=usageResult.status==="fulfilled"&&usageResult.value.ok
   ?await usageResult.value.json().catch(()=>null):null;
  const balance=balanceResult.status==="fulfilled"&&balanceResult.value.ok
   ?await balanceResult.value.json().catch(()=>null):null;
  const finite=value=>typeof value==="number"&&Number.isFinite(value)?value:null;
  const total=usage?.total||{};
  const perModel=Array.isArray(usage?.by_model)?usage.by_model:[];
  const b=balance||{};
  const creditsRemaining=finite(b.balance)??finite(b.credits)??finite(b.available_credits)??finite(b.available);
  return {
   configured:true,usageChecked:Boolean(usage),balanceChecked:Boolean(balance),
   periodDays:usage?.period?.days??30,
   requests:finite(total.requests),
   creditsSpent:finite(total.credits),
   creditsRemaining,
   byModel:perModel.slice(0,15).filter(x=>x&&typeof x.model==="string").map(x=>({
    model:x.model.slice(0,80),requests:finite(x.requests),credits:finite(x.credits)
   }))
  };
 }catch{return {configured:true,usageChecked:false,balanceChecked:false}}
}
