/* PLUX V31 free internet radio discovery, streamed from station-owned HTTPS URLs.
 * Radio Browser directory: no accounts, no paid tracks, no audio mirroring.
 * Individual broadcasters determine access/availability/region.
 */
import {appOrigin} from './allowed-origins-v31.mjs';
const ENDPOINT='https://de1.api.radio-browser.info/json/stations';
const hits=new Map();
function send(res,status,body){
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(JSON.stringify(body));
}
function safeHttps(value){
  try{const u=new URL(String(value||''));return u.protocol==='https:'&&u.hostname.length<120
     &&!u.username&&!u.password?u.href:null;}catch{return null}
}
export function normalizeStation(st){
 if(!st||typeof st!=='object')return null;
 const stream=safeHttps(st.url_resolved||st.url);
 if(!stream||st.lastcheckok===false)return null;
 const id=String(st.stationuuid||'');
 if(!/^[a-f0-9-]{36}$/i.test(id))return null;
 return {id,title:String(st.name||'Радио').slice(0,90),artist:'Интернет-радио',
   stream,cover:safeHttps(st.favicon),country:String(st.countrycode||'').slice(0,3),
   tags:String(st.tags||'').slice(0,120),url:safeHttps(st.homepage)};
}
export async function handleRadio(req,res){
 const origin=appOrigin(req);
 if(!origin)return send(res,403,{error:'Недопустимый источник'});
 res.setHeader('Access-Control-Allow-Origin',origin);
 res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
 res.setHeader('Vary','Origin');
 if(req.method==='OPTIONS'){res.writeHead(204);res.end();return}
 if(req.method!=='GET')return send(res,405,{error:'Используй GET'});
 const addr=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].slice(0,80);
 const now=Date.now(),used=(hits.get(addr)||[]).filter(t=>now-t<60000);
 if(used.length>=24)return send(res,429,{error:'Слишком много запросов'});
 used.push(now);hits.set(addr,used);if(hits.size>500)hits.clear();
 const url=new URL(req.url||'/','http://localhost');
 const q=String(url.searchParams.get('q')||'').trim().slice(0,50);
 const upstream=new URL(q?ENDPOINT+'/search':ENDPOINT+'/topclick/60');
 if(q){upstream.searchParams.set('name',q)}
 upstream.searchParams.set('limit','60');
 upstream.searchParams.set('hidebroken','true');
 try{
   const response=await fetch(upstream,{
     headers:{'Accept':'application/json','User-Agent':'PLUX/31'},
     signal:AbortSignal.timeout(8500)
   });
   if(!response.ok)throw Error('Radio Browser unavailable');
   const body=await response.json();
   const stations=(Array.isArray(body)?body:[]).map(normalizeStation).filter(Boolean).slice(0,22);
   return send(res,200,{provider:'Radio Browser',stations});
 }catch(e){
   console.warn('PLUX Radio Browser temporary error',String(e?.message||'error').slice(0,70));
   return send(res,502,{error:'Радиостанции временно недоступны. Попробуй поиск музыки.'});
 }
}
