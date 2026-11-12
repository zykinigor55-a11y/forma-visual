import {appOrigin} from "./allowed-origins-v31.mjs";
/* PLUX 15.1 — limited-time ElevenLabs real-time voice session credential.
 * Cyhub text-to-dialogue is a separate asynchronous TTS workflow, not live voice.
 * Key stays server-side. Preview rate limits are not a replacement for user auth.
 */
const originalAppOrigin="https://plux-v12-2-2k-fixed.onrender.com";
const counters=new Map();
let dayStart=Date.now(),daily=0;
function json(res,status,data){
  res.writeHead(status,{
    "Content-Type":"application/json; charset=utf-8",
    "Cache-Control":"no-store","X-Content-Type-Options":"nosniff"
  });
  res.end(JSON.stringify(data));
}
function allow(req,res){
  if(!appOrigin(req)){
    json(res,403,{error:"Для голосового режима открой оригинальное приложение ПЛЮХ."});return false;
  }
  res.setHeader("Access-Control-Allow-Origin",appOrigin(req));
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  res.setHeader("Access-Control-Allow-Methods","GET, POST, OPTIONS");
  res.setHeader("Vary","Origin");
  if(req.method==="OPTIONS"){
    res.writeHead(204,{"Cache-Control":"no-store"});res.end();return false;
  }
  return true;
}
export async function voiceSession(req,res){
  const path=new URL(req.url||"/","http://localhost").pathname;
  if(!path.startsWith("/api/voice/"))return false;
  if(!allow(req,res))return true;
  if(path==="/api/voice/config"){
    if(req.method!=="GET")json(res,405,{error:"Нужен запрос GET."});
    else json(res,200,{
      ready:Boolean(process.env.ELEVENLABS_API_KEY),
      agentConfigured:Boolean(process.env.ELEVENLABS_AGENT_ID),
      transport:"webrtc"
    });
    return true;
  }
  if(path!=="/api/voice/token"){json(res,404,{error:"Неизвестный голосовой маршрут."});return true}
  if(req.method!=="POST"){json(res,405,{error:"Нужен POST."});return true}
  const secret=process.env.ELEVENLABS_API_KEY;
  const agent=process.env.ELEVENLABS_AGENT_ID||"agent_7501m6wt1wm5efybwty352yqned2";
  if(!secret){
    json(res,503,{error:"Голосовой диалог требует ELEVENLABS_API_KEY в Render. Ключ Cyhub /tasks подходит только для озвучки, не для живого разговора."});
    return true;
  }
  const now=Date.now();
  if(now-dayStart>=86400000){dayStart=now;daily=0;counters.clear()}
  const address=String(req.headers["x-forwarded-for"]||req.socket?.remoteAddress||"unknown").split(",")[0].trim().slice(0,75);
  const hits=(counters.get(address)||[]).filter(t=>now-t<600000);
  if(daily>=20||hits.length>=3){
    json(res,429,{error:"Лимит голосовых сессий. Попробуй через 10 минут."});return true;
  }
  hits.push(now);counters.set(address,hits);daily++;
  try{
    const endpoint=new URL("https://api.elevenlabs.io/v1/convai/conversation/token");
    endpoint.searchParams.set("agent_id",agent);
    const response=await fetch(endpoint,{
      headers:{"xi-api-key":secret},
      signal:AbortSignal.timeout(14000)
    });
    if(!response.ok){
      const reason=response.status===401||response.status===403
        ?"Проверь ELEVENLABS_API_KEY, права Conversations и настройки агента."
        :response.status===402
          ?"Проверь баланс ElevenLabs."
          :"ElevenLabs отклонил создание голосовой сессии (HTTP "+response.status+").";
      json(res,502,{error:reason});return true;
    }
    const result=await response.json().catch(()=>null);
    if(typeof result?.token!=="string"||result.token.length<20){
      json(res,502,{error:"ElevenLabs не вернул токен для голосового соединения."});return true;
    }
    json(res,200,{conversationToken:result.token,transport:"webrtc"});
  }catch(e){
    json(res,502,{error:e?.name==="TimeoutError"
      ?"ElevenLabs долго не отвечает. Попробуй позже."
      :"Нет соединения с ElevenLabs."});
  }
  return true;
}
