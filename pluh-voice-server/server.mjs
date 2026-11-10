import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, timingSafeEqual } from "node:crypto";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "public");

const previewMarkup=readFileSync(resolve(root,"plux-v5.html"),"utf8");
const inlineHashes=(tag)=>{
 const matches=[...previewMarkup.matchAll(new RegExp("<"+tag+">([\\s\\S]*?)<\\/"+tag+">","g"))];
 return matches.map(m=>"'sha256-"+createHash("sha256").update(m[1]).digest("base64")+"'").join(" ");
};
const previewCsp="default-src 'self'; connect-src 'self' wss://api.elevenlabs.io; script-src 'self' "+inlineHashes("script")+"; style-src 'self' "+inlineHashes("style")+"; img-src 'self' data:; media-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";

const port = Number(process.env.PORT || 8080);
const agentId = process.env.ELEVENLABS_AGENT_ID || "agent_7501m6wt1wm5efybwty352yqned2";
const types={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".png":"image/png",".webp":"image/webp",".mp4":"video/mp4"};
const requests=new Map();
const chatRequests=new Map();let chatDailyCount=0,chatDayStart=Date.now();

function reply(res,status,data){res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});res.end(JSON.stringify(data));}
function compare(a,b){if(typeof a!=="string"||typeof b!=="string")return false;const ha=createHash("sha256").update(a).digest(),hb=createHash("sha256").update(b).digest();return timingSafeEqual(ha,hb);}
async function handler(req,res){
 res.setHeader("X-Content-Type-Options","nosniff");
 res.setHeader("Referrer-Policy","no-referrer");
 res.setHeader("Permissions-Policy","microphone=(self)");
 const pathname=new URL(req.url||"/","http://localhost").pathname;
 const previewRoute=pathname==="/"||pathname==="/index.html"||pathname==="/plux-v5.html";
 res.setHeader("Content-Security-Policy",previewRoute?previewCsp:"default-src 'self'; connect-src 'self' wss://api.elevenlabs.io; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
 if(pathname==="/api/health")return reply(res,200,{ready:Boolean(process.env.ELEVENLABS_API_KEY&&process.env.PLUH_DEMO_CODE),agentConfigured:!!agentId});
 if(pathname==="/api/session"){
   if(req.method!=="POST")return reply(res,405,{error:"Use POST"});
   if(!process.env.ELEVENLABS_API_KEY||!process.env.PLUH_DEMO_CODE)return reply(res,503,{error:"Сначала добавь ELEVENLABS_API_KEY и PLUH_DEMO_CODE в Render Environment."});
   const ip=String(req.headers["x-forwarded-for"]||req.socket?.remoteAddress||"unknown").split(",")[0];
   const now=Date.now(),hits=(requests.get(ip)||[]).filter(t=>now-t<60000);
   if(hits.length>=8)return reply(res,429,{error:"Слишком много запросов. Попробуй через минуту."});
   hits.push(now);requests.set(ip,hits);
   let raw="";for await(const chunk of req){raw+=chunk;if(raw.length>2048)return reply(res,413,{error:"Too large"});}
   let code="";try{code=JSON.parse(raw).code||"";}catch{}
   if(!compare(code,process.env.PLUH_DEMO_CODE))return reply(res,401,{error:"Неверный код доступа."});
   try{
     const uri=new URL("https://api.elevenlabs.io/v1/convai/conversation/get-signed-url");
     uri.searchParams.set("agent_id",agentId);
     const response=await fetch(uri,{headers:{"xi-api-key":process.env.ELEVENLABS_API_KEY},signal:AbortSignal.timeout(12000)});
     if(!response.ok)return reply(res,502,{error:"ElevenLabs HTTP "+response.status+" — проверь ключ и разрешения."});
     const result=await response.json();
     if(typeof result.signed_url!=="string"||!result.signed_url.startsWith("wss://api.elevenlabs.io/"))return reply(res,502,{error:"Некорректный ответ ElevenLabs."});
     return reply(res,200,{signedUrl:result.signed_url});
   }catch{return reply(res,502,{error:"Связь с ElevenLabs недоступна."});}
 }
 if(pathname==="/api/chat") { // PLUX_CHAT_V128
  const allowedOrigin="https://plux-v12-2-2k-fixed.onrender.com";
  const origin=String(req.headers.origin||"");
  if(origin!==allowedOrigin) return reply(res,403,{error:"Origin not allowed"});
  res.setHeader("Access-Control-Allow-Origin",allowedOrigin);
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
  res.setHeader("Vary","Origin");
  if(req.method==="OPTIONS"){res.writeHead(204,{"Cache-Control":"no-store"});res.end();return}
  if(req.method!=="POST")return reply(res,405,{error:"Use POST"});
  const secret=process.env.API_MARKET_KEY;
  if(!secret)return reply(res,503,{error:"ИИ пока не подключён. Нужно добавить API_MARKET_KEY в настройки сервера Render."});
  const ip=String(req.headers["x-forwarded-for"]||req.socket?.remoteAddress||"unknown").split(",")[0];
  const now=Date.now();
  const recent=(chatRequests.get(ip)||[]).filter(t=>now-t<60000);
  if(recent.length>=10)return reply(res,429,{error:"Слишком много сообщений. Попробуй через минуту."});
  recent.push(now);chatRequests.set(ip,recent);
  // Prevent unlimited anonymous consumption. The counters reset when the service restarts.
  if(now-chatDayStart>86400000){chatDayStart=now;chatDailyCount=0}
  if(++chatDailyCount>500)return reply(res,429,{error:"Сегодня лимит сообщений закончился."});
  let raw="";for await(const chunk of req){raw+=chunk;if(raw.length>18000)return reply(res,413,{error:"Сообщение слишком длинное"})}
  let data;try{data=JSON.parse(raw)}catch{return reply(res,400,{error:"Некорректный запрос"})}
  if(!Array.isArray(data.messages)||data.messages.length>16||!data.messages.length)return reply(res,400,{error:"Некорректная история сообщений"});
  const messages=data.messages.filter(m=>m&&["user","assistant"].includes(m.role)&&typeof m.content==="string").slice(-12);
  if(messages.length<1||messages.some(m=>!m.content.trim()||m.content.length>2500))return reply(res,400,{error:"Сообщение должно содержать текст до 2500 символов"});
  // Do not forward arbitrary client-injected roles or keys.
  messages.unshift({role:"system",content:"Ты ПЛЮХ — доброжелательный, энергичный персональный помощник. Отвечай на русском естественно и ясно, коротко по умолчанию. Не придумывай, что ты уже выполнил действие или подключил сервис."});
  try {
    const upstream=await fetch("https://api-market1.shop/v1/chat/completions",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+secret},
      body:JSON.stringify({model:"gpt-6-luna",messages}),
      signal:AbortSignal.timeout(30000)
    });

    if(!upstream.ok){
      // Inspect the provider's error without leaking credentials or arbitrary HTML to the client.
      const contentType=upstream.headers.get("content-type")||"";
      const textBody=(await upstream.text()).slice(0,3000);
      const html=/html/i.test(contentType)||/^\s*</.test(textBody);
      let providerError=null;
      if(!html){
        try {
          const payload=JSON.parse(textBody);
          providerError=payload?.error||payload;
        } catch {}
      }
      const type=providerError&&typeof providerError==="object"
        ? String(providerError.type||providerError.code||"").slice(0,70) : "";
      const message=typeof providerError==="string" ? providerError
        : (providerError&&typeof providerError==="object"
          ? String(providerError.message||providerError.detail||"") : "");
      const safeMessage=message
        .replaceAll(secret,"[ключ скрыт]")
        .replace(/Bearer\s+\S+/gi,"[токен скрыт]")
        .replace(/sk-[a-z0-9_-]{6,}/gi,"[ключ скрыт]")
        .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,"[email скрыт]")
        .replace(/[\r\n\t]+/g," ")
        .slice(0,180);
      const channelDenied=/regular users cannot specify a channel/i.test(message);
      const detail=channelDenied
        ? "Поставщик API отклонил маршрутизацию ключа: обычному аккаунту запрещено выбирать канал. ПЛЮХ канал не указывает. Проверь тип ключа в API Market или сообщи поддержке."
        : (html
          ? "Провайдер вернул HTML-страницу запрета (возможно, сработала защита сайта или ограничение IP сервера)."
          : safeMessage||"Провайдер не указал причину отказа.");
      console.warn("API Market upstream rejected",JSON.stringify({
        status:upstream.status,
        responseType:html?"html":(contentType.includes("json")?"json":"other"),
        errorType:type
      }));
      return reply(res,502,{
        error:"API Market: HTTP "+upstream.status+". "+detail,
        upstreamStatus:upstream.status,
        upstreamType:type||undefined
      });
    }
    const result=await upstream.json();
    const answer=result?.choices?.[0]?.message?.content;
    if(typeof answer!=="string"||!answer.trim())return reply(res,502,{error:"Модель вернула пустой ответ."});
    return reply(res,200,{reply:answer.slice(0,5000),model:"gpt-6-luna"});
  } catch(e){return reply(res,502,{error:e?.name==="TimeoutError"?"Модель не ответила вовремя.":"Связь с API Market недоступна."})}
 }
 if(req.method!=="GET"&&req.method!=="HEAD")return reply(res,405,{error:"Method not allowed"});
 const path=resolve(root,"."+decodeURIComponent(pathname==="/"?"/index.html":pathname));
 if(!path.startsWith(root+sep))return reply(res,403,{error:"Forbidden"});
 try{
  const st=await stat(path);if(!st.isFile())throw Error();
  const data=await readFile(path);
  res.writeHead(200,{"Content-Type":types[extname(path)]||"application/octet-stream","Cache-Control":"no-store"});
  res.end(req.method==="HEAD"?undefined:data);
 }catch{return reply(res,404,{error:"Not found"});}
}
createServer((req,res)=>{handler(req,res).catch(()=>reply(res,500,{error:"Internal server error"}));}).listen(port,"0.0.0.0",()=>console.log("PLUH voice server started on "+port));

/* PLUX_ONE_SHOT_KEY_CHECK_V2: temporary authentication test, never logs secrets or response bodies. */
setTimeout(async()=>{
  const key=process.env.API_MARKET_KEY;
  if(!key){console.log("PLUX_KEY_CHECK",JSON.stringify({step:"config",result:"missing_key"}));return;}
  const base="https://api-market1.shop/v1";
  function classify(body,status){
    if(status>=200 && status<300)return "ok";
    if(/regular users cannot specify a channel/i.test(body))return "channel_forbidden";
    if(/quota|balance|insufficient|billing/i.test(body))return "billing_limit";
    if(/unauthoriz|invalid.*(?:key|token)|authentication/i.test(body))return "authorization";
    if(/model.*(?:not found|unsupported|unavailable)/i.test(body))return "model_restriction";
    return "other";
  }
  try{
    const models=await fetch(base+"/models",{
      method:"GET",headers:{"Authorization":"Bearer "+key},signal:AbortSignal.timeout(12000)
    });
    const body=await models.text();
    const cls=classify(body,models.status);
    console.log("PLUX_KEY_CHECK",JSON.stringify({step:"models",http:models.status,result:cls}));
    // Chat availability may differ from the models endpoint; test it independently.
    const chat=await fetch(base+"/chat/completions",{
      method:"POST",
      headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},
      body:JSON.stringify({model:"gpt-6-luna",messages:[{role:"user",content:"Ответь одним словом: привет"}]}),
      signal:AbortSignal.timeout(16000)
    });
    const txt=await chat.text();
    let hasText=false;
    if(chat.ok){try{hasText=Boolean(JSON.parse(txt)?.choices?.[0]?.message?.content)}catch{}}
    console.log("PLUX_KEY_CHECK",JSON.stringify({step:"luna",http:chat.status,result:classify(txt,chat.status),hasText}));
  }catch(e){
    console.log("PLUX_KEY_CHECK",JSON.stringify({step:"transport",result:e?.name==="TimeoutError"?"timeout":"unavailable"}));
  }
},1100);
