/* PLUX V31 - Jamendo read-only music catalog.
 * Own registered JAMENDO_CLIENT_ID required; official testing ID is never used in production.
 * Uses official HTTPS stream URLs, does not cache or redistribute audio files.
 */
import {appOrigin} from './allowed-origins-v31.mjs';
const ENDPOINT='https://api.jamendo.com/v3.0/tracks/';
const recent=new Map(), resultCache=new Map();
let monthly={key:'',used:0};
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data))}
function httpsOnly(value){
  try{const u=new URL(String(value||''));return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname.length<130?u.href:null}catch{return null}
}
export function normalizeJamendoTrack(track){
 if(!track||typeof track!=='object')return null;
 const id=String(track.id||'');
 if(!/^\d{1,12}$/.test(id))return null;
 const stream=httpsOnly(track.audio);
 if(!stream)return null;
 const page=httpsOnly(track.shareurl||'');
 return {id:'jamendo-'+id,title:String(track.name||'Без названия').slice(0,140),
  artist:String(track.artist_name||'Независимый исполнитель').slice(0,110),
  cover:httpsOnly(track.image),stream,
  url:page&&new URL(page).hostname.endsWith('jamendo.com')?page:null,
  license:httpsOnly(track.license_ccurl),
  duration:Math.max(0,Math.min(36000,Number(track.duration)||0)),
  provider:'Jamendo'};
}
export async function handleJamendo(req,res){
 const origin=appOrigin(req);
 if(!origin)return json(res,403,{error:'Источник запроса не разрешён'});
 res.setHeader('Access-Control-Allow-Origin',origin);
 res.setHeader('Vary','Origin');
 res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
 if(req.method==='OPTIONS'){res.writeHead(204);res.end();return}
 if(req.method!=='GET')return json(res,405,{error:'Используй GET'});
 const clientId=String(process.env.JAMENDO_CLIENT_ID||'').trim();
 if(!/^[a-zA-Z0-9]{5,60}$/.test(clientId)||clientId==='709fa152')
   return json(res,503,{error:'Jamendo ещё не подключён: нужен собственный Client ID приложения.'});
 const addr=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].slice(0,80);
 const now=Date.now(),hits=(recent.get(addr)||[]).filter(x=>now-x<60000);
 if(hits.length>=16)return json(res,429,{error:'Слишком много запросов музыки'});
 hits.push(now);recent.set(addr,hits);
 if(recent.size>1200)recent.clear();
 const month=new Date().toISOString().slice(0,7);
 if(monthly.key!==month)monthly={key:month,used:0};
 if(monthly.used>=28000)return json(res,429,{error:'Достигнут месячный лимит запросов Jamendo'});
 const path=new URL(req.url||'/','http://localhost');
 const q=String(path.searchParams.get('q')||'').trim().slice(0,80);
 const key=q.toLowerCase()||'__popular';
 const cached=resultCache.get(key);
 if(cached&&now-cached.at<90000)return json(res,200,cached.value);
 const url=new URL(ENDPOINT);
 url.searchParams.set('client_id',clientId);
 url.searchParams.set('format','json');
 url.searchParams.set('limit','25');
 url.searchParams.set('audioformat','mp32');
 url.searchParams.set('include','licenses');
 if(q){url.searchParams.set('search',q);url.searchParams.set('order','relevance')}
 else url.searchParams.set('order','popularity_total');
 try{
   monthly.used++;
   const upstream=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000)});
   if(!upstream.ok)throw Error('Jamendo API HTTP '+upstream.status);
   const payload=await upstream.json();
   if(payload?.headers?.status!=='success'&&!Array.isArray(payload?.results))
     throw Error('Jamendo вернул ошибку каталога');
   const tracks=(Array.isArray(payload.results)?payload.results:[]).map(normalizeJamendoTrack).filter(Boolean).slice(0,25);
   const value={provider:'Jamendo',tracks,query:q,streamingOnly:true};
   if(resultCache.size>80)resultCache.clear();
   resultCache.set(key,{at:now,value});
   return json(res,200,value);
 }catch(e){
   console.warn('Jamendo metadata error',String(e.message||'unknown').slice(0,120));
   return json(res,502,{error:'Не удалось получить музыку Jamendo. Попробуй позднее.'});
 }
}
