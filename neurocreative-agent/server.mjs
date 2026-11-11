import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';

const DIR=path.dirname(fileURLToPath(import.meta.url));
const PORT=Number(process.env.PORT||10000);
const PASSWORD=process.env.ADMIN_PASSWORD||'';
const SECRET=process.env.SESSION_SECRET||'';
const SHARE=process.env.VIZORLAB_SHARE_URL||'';
const AI_KEY=process.env.OPENAI_API_KEY||'';
const MODEL=process.env.OPENAI_MODEL||'gpt-4.1-mini';
if(PASSWORD.length<12 || SECRET.length<32)throw Error('Set ADMIN_PASSWORD and SESSION_SECRET in Render environment');
let base=null;
if(SHARE){base=new URL(SHARE);if(base.protocol!=='https:'||base.username||base.password)throw Error('Invalid VIZORLAB_SHARE_URL');}
const failed=new Map(),ttl=172800000;
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
function eq(a,b){const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&crypto.timingSafeEqual(x,y);}
function mac(s){return crypto.createHmac('sha256',SECRET).update(s).digest('hex');}
function session(req){
 const v=/(?:^|;\s*)vz_session=([^;]+)/.exec(req.headers.cookie||'')?.[1];
 if(!v)return null;
 const parts=v.split('.');
 if(parts.length!==3||!/^\d{13}$/.test(parts[0]))return null;
 if(!eq(mac(parts[0]+'.'+parts[1]),parts[2])||Date.now()-Number(parts[0])>ttl||Number(parts[0])>Date.now()+30000)return null;
 return {csrf:mac('csrf:'+parts[0]+'.'+parts[1])};
}
function out(res,status,obj,extra={}){
 res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",...extra});
 res.end(JSON.stringify(obj));
}
function originOk(req){if(!req.headers.origin)return true;try{return new URL(req.headers.origin).host===req.headers.host;}catch{return false;}}
function auth(req,res,write=false){
 const s=session(req);
 if(!s){out(res,401,{ok:false,error:'Войдите по паролю'});return false;}
 if(write&&(!originOk(req)||!eq(req.headers['x-csrf-token']||'',s.csrf))){out(res,403,{ok:false,error:'Проверка безопасности не пройдена'});return false;}
 return s;
}
async function jsonBody(req,max=12000000){
 let total=0,parts=[];
 for await(const c of req){total+=c.length;if(total>max)throw Object.assign(Error('Слишком большой запрос'),{status:413});parts.push(c);}
 try{return JSON.parse(Buffer.concat(parts).toString('utf8'));}catch{throw Object.assign(Error('Ожидался JSON'),{status:400});}
}
function remoteUrl(act,p={}){
 if(!base)throw Object.assign(Error('VIZORLAB_SHARE_URL не задан'),{status:503});
 const u=new URL(base);u.searchParams.set('act',act);
 for(const [k,v]of Object.entries(p))u.searchParams.set(k,String(v));
 return u;
}
async function upstream(act,p={},payload=null){
 const r=await fetch(remoteUrl(act,p),{method:payload?'POST':'GET',redirect:'error',headers:{'Accept':'application/json',...(payload?{'Content-Type':'application/json'}:{})},body:payload?JSON.stringify(payload):undefined,signal:AbortSignal.timeout(payload?45000:18000)});
 if(!r.ok)throw Error('VIZORLAB HTTP '+r.status);
 const data=await r.json();
 if(data.ok===false)throw Error(data.error||data.message||'Ошибка API');
 return data;
}
async function ai(instruction){
 if(!AI_KEY)throw Object.assign(Error('ИИ-сценарист требует OPENAI_API_KEY в Render'),{status:503});
 const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',redirect:'error',signal:AbortSignal.timeout(30000),headers:{'Authorization':'Bearer '+AI_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:MODEL,instructions:'Ты сценарист коротких оригинальных нейровидео в России. Пиши сценарии по-русски, кратко и ясно. Никаких секретов API.',input:instruction,max_output_tokens:650})});
 if(!r.ok)throw Error('Ошибка ИИ HTTP '+r.status);
 const data=await r.json();
 return(data.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('\n')||'Нет результата';
}
http.createServer(async(req,res)=>{
 try{
 const url=new URL(req.url,'http://localhost'),p=url.pathname;
 if(p==='/health'&&req.method==='GET')return out(res,200,{ok:true,configured:!!base});
 if(p==='/api/me'&&req.method==='GET'){const s=session(req);return out(res,200,{ok:true,authenticated:!!s,csrf:s?.csrf||null,aiEnabled:!!AI_KEY});}
 if(p==='/api/login'&&req.method==='POST'){
   if(!originOk(req))return out(res,403,{ok:false,error:'Недопустимый источник'});
   const ip=req.socket.remoteAddress||'?',state=failed.get(ip)||{count:0,until:0};
   if(state.count>=8&&state.until>Date.now())return out(res,429,{ok:false,error:'Слишком много попыток входа'});
   const body=await jsonBody(req,10000);
   if(!eq(body.password||'',PASSWORD)){failed.set(ip,{count:state.count+1,until:Date.now()+900000});return out(res,401,{ok:false,error:'Неверный пароль'});}
   failed.delete(ip);const ts=String(Date.now()),id=crypto.randomBytes(16).toString('hex'),val=ts+'.'+id+'.'+mac(ts+'.'+id);
   return out(res,200,{ok:true,csrf:mac('csrf:'+ts+'.'+id)},{'Set-Cookie':'vz_session='+val+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=172800'});
 }
 if(p==='/api/logout'&&req.method==='POST'){if(!auth(req,res,true))return;return out(res,200,{ok:true},{'Set-Cookie':'vz_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict'});}
 if(p==='/api/messages'&&req.method==='GET'){
   if(!auth(req,res))return;
   const since=Math.max(0,Math.floor(Number(url.searchParams.get('since')||0)||0));
   const limit=Math.max(1,Math.min(200,Math.floor(Number(url.searchParams.get('limit')||200)||200)));
   return out(res,200,await upstream('messages',{since,limit}));
 }
 if(p==='/api/post'&&req.method==='POST'){
   if(!auth(req,res,true))return;
   const d=await jsonBody(req,20000),msg=String(d.text||'').trim();
   if(!msg||msg.length>4000)return out(res,400,{ok:false,error:'Напишите сообщение (до 4000 символов)'});
   return out(res,200,await upstream('post',{}, {text:msg}));
 }
 if(p==='/api/upload'&&req.method==='POST'){
   if(!auth(req,res,true))return;
   const d=await jsonBody(req),name=String(d.filename||'file.jpg').slice(0,120).replace(/[^\p{L}\p{N}._ -]/gu,'_');
   const b64=String(d.file_base64||'');
   if(!/\.(jpg|jpeg|png|webp|gif|pdf|txt)$/i.test(name)||!b64||b64.length>11500000||!/^[A-Za-z0-9+/]+={0,2}$/.test(b64)||Buffer.from(b64,'base64').length>8*1024*1024)return out(res,400,{ok:false,error:'Разрешены JPG, PNG, WEBP, GIF, PDF, TXT до 8 МБ'});
   return out(res,200,await upstream('upload',{}, {filename:name,file_base64:b64,text:String(d.text||'').slice(0,1000)}));
 }
 if(p==='/api/file'&&req.method==='GET'){
   if(!auth(req,res))return;
   const fid=url.searchParams.get('fid');
   if(!/^\d{1,12}$/.test(fid||''))return out(res,400,{ok:false,error:'Неверный файл'});
   const r=await fetch(remoteUrl('file',{fid}),{redirect:'error',signal:AbortSignal.timeout(30000)});
   if(!r.ok)throw Error('Не удалось получить файл '+r.status);
   const type=(r.headers.get('content-type')||'application/octet-stream').split(';')[0];
   if(type.includes('json')||type.includes('html'))throw Error('Файл недоступен');
   if(Number(r.headers.get('content-length')||0)>80*1024*1024)throw Object.assign(Error('Файл больше 80 МБ'),{status:413});
   const name=String(url.searchParams.get('name')||'file').replace(/[^\p{L}\p{N}._ -]/gu,'_').slice(0,120);
   res.writeHead(200,{'Content-Type':type,'Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(name),'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});
   return await pipeline(Readable.fromWeb(r.body),res);
 }
 if(p==='/api/assist'&&req.method==='POST'){
   if(!auth(req,res,true))return;
   const d=await jsonBody(req,12000),instruction=String(d.instruction||'').trim();
   if(!instruction||instruction.length>2000)return out(res,400,{ok:false,error:'Укажите тему до 2000 символов'});
   return out(res,200,{ok:true,text:await ai(instruction)});
 }
 if(req.method!=='GET')return out(res,405,{ok:false,error:'Метод не поддерживается'});
 const assets={'/':'index.html','/index.html':'index.html','/app.css':'app.css','/app.js':'app.js'};
 if(!assets[p])return out(res,404,{ok:false,error:'Страница не найдена'});
 const file=path.join(DIR,'public',assets[p]);
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});
 res.end(fs.readFileSync(file));
 }catch(e){
   console.error('Request failed:',String(e?.message||'error').replace(/token=[^&\s]+/gi,'token=[redacted]'));
   if(res.headersSent){res.destroy();return;}
   return out(res,e.status||502,{ok:false,error:e.name==='TimeoutError'?'Сервер VIZORLAB не ответил вовремя':e.message==='fetch failed'?'Нет связи с VIZORLAB (DNS или доступ к серверу)':(e.message||'Ошибка сервера')});
 }
}).listen(PORT,'0.0.0.0',()=>console.log('VIZORLAB bridge listening on '+PORT));
