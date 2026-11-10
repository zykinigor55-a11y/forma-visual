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
 if(req.headers.origin!==ORIGIN){json(res,403,{error:"Открой официальное приложение ПЛЮХ для голосового режима."});return false}
 res.setHeader("Access-Control-Allow-Origin",ORIGIN);
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
 const hits=(IP_LIMIT.get(ip)||[]).filter(t=>now-t<600000);
 if(hits.length>=3||total>=25)throw msg(429,"Лимит голосовых сессий: до трёх за 10 минут.");
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
