/* PLUX V24 · Free Audius music search for text and voice actions.
 * Read-only API, no secrets in browser, no unlicensed media mirroring.
 * The client plays original Audius streaming URLs with user interaction.
 */
const ORIGIN="https://plux-v12-2-2k-fixed.onrender.com";
const API="https://api.audius.co/v1";
const APP="PLUX";
const rateByIP=new Map();
const cache=new Map();
const LIMIT=10;
function json(res,status,body){
 res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});
 res.end(JSON.stringify(body));
}
function cors(req,res){
 const origin=req.headers.origin;
 if(origin!==ORIGIN){json(res,403,{error:"Музыкальный поиск доступен в приложении ПЛЮХ."});return false}
 res.setHeader("Access-Control-Allow-Origin",ORIGIN);
 res.setHeader("Access-Control-Allow-Methods","GET, OPTIONS");
 res.setHeader("Vary","Origin");
 if(req.method==="OPTIONS"){res.writeHead(204,{"Cache-Control":"no-store"});res.end();return false}
 return true;
}
function allowRate(req){
 const ip=String(req.headers["x-forwarded-for"]||req.socket?.remoteAddress||"unknown").split(",")[0].trim().slice(0,72);
 const now=Date.now(), recent=(rateByIP.get(ip)||[]).filter(x=>now-x<60_000);
 if(recent.length>=30)return false;
 recent.push(now);rateByIP.set(ip,recent);
 if(rateByIP.size>1500)rateByIP.clear();
 return true;
}
const safeImage=url=>{
 if(typeof url!=="string")return null;
 try{const v=new URL(url);return v.protocol==="https:"&&v.hostname.length<100?v.href:null}catch{return null}
};
function normalize(track){
 if(!track||typeof track!=="object"||!track.id||track.is_streamable===false||track.is_delete)return null;
 const id=String(track.id);
 if(!/^[A-Za-z0-9_-]{1,90}$/.test(id))return null;
 const title=String(track.title||"Без названия").slice(0,140);
 const artist=String(track.user?.name||track.user?.handle||"Исполнитель").slice(0,110);
 const cover=safeImage(track.artwork?.["480x480"]||track.artwork?.["150x150"]||"");
 const stream=new URL(API+"/tracks/"+encodeURIComponent(id)+"/stream");
 stream.searchParams.set("app_name",APP);
 return {id,title,artist,cover,duration:Math.max(0,Math.min(36000,Number(track.duration)||0)),url:safeImage(track.permalink||""),
  stream:stream.href};
}
export async function handleAudius(req,res){
 const u=new URL(req.url||"/","http://localhost");
 const path=u.pathname;
 if(!path.startsWith("/api/music/"))return false;
 if(!cors(req,res))return true;
 if(req.method!=="GET")return json(res,405,{error:"Нужен запрос GET."});
 if(path!=="/api/music/search"&&path!=="/api/music/trending")return json(res,404,{error:"Нет такого музыкального маршрута."});
 if(!allowRate(req))return json(res,429,{error:"Слишком много поисковых запросов. Попробуй позже."});
 const query=String(u.searchParams.get("q")||"").trim().slice(0,96);
 if(path.endsWith("/search")&&query.length<2)return json(res,400,{error:"Напиши исполнителя, трек или настроение."});
 const key=path+"|"+query.toLowerCase();
 const previous=cache.get(key);
 if(previous&&Date.now()-previous.at<120000)return json(res,200,previous.result);
 const upstream=new URL(API+(path.endsWith("/trending")?"/tracks/trending":"/tracks/search"));
 upstream.searchParams.set("limit",String(LIMIT));
 upstream.searchParams.set("app_name",APP);
 if(path.endsWith("/search"))upstream.searchParams.set("query",query);
 try{
  const replyUp=await fetch(upstream,{headers:{"Accept":"application/json"},signal:AbortSignal.timeout(8000)});
  if(!replyUp.ok)throw Error("Audius HTTP "+replyUp.status);
  const jsonUp=await replyUp.json();
  const list=Array.isArray(jsonUp.data)?jsonUp.data:Array.isArray(jsonUp.tracks)?jsonUp.tracks:[];
  const tracks=list.map(normalize).filter(Boolean).slice(0,LIMIT);
  const result={provider:"Audius",query,tracks};
  if(cache.size>150)cache.clear();
  cache.set(key,{at:Date.now(),result});
  return json(res,200,result);
 }catch(e){
  console.warn("Audius search unavailable",String(e?.message||"unknown").slice(0,90));
  return json(res,502,{error:"Audius временно не отвечает. Попробуй другой запрос."});
 }
}
