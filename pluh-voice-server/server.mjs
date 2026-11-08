import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, timingSafeEqual } from "node:crypto";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "public");
const port = Number(process.env.PORT || 8080);
const agentId = process.env.ELEVENLABS_AGENT_ID || "agent_7501m6wt1wm5efybwty352yqned2";
const types={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".webp":"image/webp",".mp4":"video/mp4"};
const requests=new Map();
function reply(res,status,data){res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});res.end(JSON.stringify(data));}
function compare(a,b){if(typeof a!=="string"||typeof b!=="string")return false;const ha=createHash("sha256").update(a).digest(),hb=createHash("sha256").update(b).digest();return timingSafeEqual(ha,hb);}
async function handler(req,res){
 res.setHeader("X-Content-Type-Options","nosniff");
 res.setHeader("Referrer-Policy","no-referrer");
 res.setHeader("Permissions-Policy","microphone=(self)");
 res.setHeader("Content-Security-Policy","default-src 'self'; connect-src 'self' wss://api.elevenlabs.io; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
 const pathname=new URL(req.url||"/","http://localhost").pathname;
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
 if(req.method!=="GET"&&req.method!=="HEAD")return reply(res,405,{error:"Method not allowed"});
 const path=resolve(root,"."+decodeURIComponent(pathname==="/"?"/index.html":pathname));
 if(!path.startsWith(root+sep))return reply(res,403,{error:"Forbidden"});
 try{
  const st=await stat(path);if(!st.isFile())throw Error();
  const data=await readFile(path);
  res.writeHead(200,{"Content-Type":types[extname(path)]||"application/octet-stream","Cache-Control":"public, max-age=120"});
  res.end(req.method==="HEAD"?undefined:data);
 }catch{return reply(res,404,{error:"Not found"});}
}
createServer((req,res)=>{handler(req,res).catch(()=>reply(res,500,{error:"Internal server error"}));}).listen(port,"0.0.0.0",()=>console.log("PLUH voice server started on "+port));
