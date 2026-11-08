/**
 * ДОМ.РЕНДЕР – minimal local Node 20+ server + OpenAI Images Edit proxy.
 * Keeps API keys on the server, not in the browser. Prototype, not public multi-tenant service.
 */
import http from 'node:http';
import path from 'node:path';
import {readFile, stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {randomBytes, timingSafeEqual} from 'node:crypto';
import {apiMarketEdit} from './api-market.mjs';
const ROOT = path.dirname(fileURLToPath(import.meta.url));
// Optional simple local .env parser (no external packages). Environment variables win.
try {const dotenv=await readFile(path.join(ROOT,'.env'),'utf8');for(const line of dotenv.split(/\r?\n/)){const m=line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,'')}} catch {}
const PORT=Number(process.env.PORT)||3000;
const HOST=process.env.HOST||'127.0.0.1';
const API_KEY=process.env.API_MARKET_KEY||'';
const MODEL='nano-banana-2.1';
const ACCESS_PIN=process.env.SITE_ACCESS_PIN||'';
if(HOST!=='127.0.0.1'&&HOST!=='localhost'&&!ACCESS_PIN)throw new Error('Для публичного HOST укажите SITE_ACCESS_PIN (защита генерации от посторонних).');
const SESSION_TOKEN=randomBytes(24).toString('hex');
const DAILY_CAP=Math.min(200,Math.max(1,Number(process.env.DAILY_GENERATION_LIMIT)||12));
let dailyCount=0, day=new Date().toISOString().slice(0,10);
const loginAttempts=new Map();
function authorized(req){if(!ACCESS_PIN)return true;const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('domrender_session='))?.slice('domrender_session='.length);if(!token||token.length!==SESSION_TOKEN.length)return false;return timingSafeEqual(Buffer.from(token),Buffer.from(SESSION_TOKEN));}
function safeEquals(a,b){const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y);}
function sameOrigin(req){const origin=req.headers.origin;if(!origin)return true;const host=req.headers.host;try{return new URL(origin).host===host}catch{return false}}
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json; charset=utf-8'};
const MAX_BODY=24*1024*1024;
let active=0;
function json(res,status,payload){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(payload))}
async function readJSON(req){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>MAX_BODY){const err=Error('Запрос слишком большой');err.status=413;throw err}chunks.push(chunk)}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{const err=Error('Некорректный JSON');err.status=400;throw err}}
function imageBlob(data,field){if(!data)return null;const m=String(data).match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+\/=]+)$/);if(!m)throw Object.assign(Error(`Некорректное изображение: ${field}`),{status:400});const bytes=Buffer.from(m[2],'base64');if(bytes.length>14*1024*1024||bytes.length<100)throw Object.assign(Error(`Неверный размер: ${field}`),{status:400});const type=m[1]==='jpeg'?'image/jpeg':`image/${m[1]}`;return new Blob([bytes],{type})}
function compact(str,limit=180){return String(str||'').slice(0,limit).replace(/\s+/g,' ').trim()}
function createPrompt(p){const b=p.brief||{};const specific=p.selectedZone&&p.mask;
 const essential=`You are an expert architectural photographer and material visualization artist. Produce a genuinely photorealistic high-end editorial architectural photograph, never a CGI-looking image, illustration, or concept sketch. Source input image 1 is the authoritative architectural building and camera view. Preserve the exact building massing, facade proportions, number/size/locations of windows and doors, roof silhouette, entrance, horizontal lines and camera perspective. Do NOT invent extra rooms, balconies, windows, roofs, storeys or structural elements. Natural light transport, plausible surface textures, realistic reflections, detailed landscaping, restrained photographic grading. No logos, text, people, watermarks or distracting objects.`;
 const context=`Environment: ${compact(b.environment)}. Site instructions: ${compact(b.environmentInstructions,350)}. Season: ${compact(b.season)}. Weather: ${compact(b.weather)}. Time of day: ${compact(b.time)}. Vegetation: ${compact(b.plants)}. Fit vegetation to climate and do not obstruct the architecture. Exterior material map: ${Object.entries(b.materials||{}).map(([z,m])=>`${compact(z,50)}: ${compact(m,70)}`).join('; ')}. Texture repeat scale: ${compact(b.textureScale)}. Texture rotation: ${compact(b.textureRotation)}. Image aspect ratio: ${compact(b.output?.ratio)}.`;
 const geometry=b.lockGeometry===false?'Respect architectural design broadly.':'VERY IMPORTANT: architectural geometry must not be changed under any circumstance.';
 const physics=!specific&&(/зима|winter/i.test(String(b.season||'')))?'WINTER PHYSICAL REALISM: any outdoor swimming pool in view is winterized and FULLY CLOSED by a taut opaque safety cover; no open blue water, no pool loungers, towels, wine glasses or summer furniture left outside. Snow settles on roofs, ground and plantings according to temperature. Trees and vegetation match winter, shadows and reflections are plausible.':!specific&&(/дождь|rain/i.test(String(b.weather||'')))?'RAIN PHYSICAL REALISM: wet stone and pavement, rainwater puddles and realistic muted reflections, wet foliage. No impossible sunlight or floating raindrops.':'';
 const continuity=p.reference?`Additional reference image depicts the SAME project as a previous view. Reuse its material palette, specific tree species, garden character, shoreline/terrain motifs and photographic style where visible and logically consistent with the new camera. The new first image dictates the geometry and camera. Without a 3D scene, do not claim exact spatial reconstruction.`:'';
 const edit=specific?`LOCAL EDIT ONLY: edit the transparent region of the supplied PNG mask on IMAGE 1. The masked area is the selected facade zone named '${compact(p.selectedZone)}'. Apply material '${compact(p.materialName)}' to that facade surface and keep the rest of the image, environment, lighting and all other surfaces as unchanged as possible. Use the material reference image (when provided) for accurate color, grain and texture repeat. ${Number(p.materialDimensions?.width)>0?`Material physical size: ${Number(p.materialDimensions.width)} by ${Number(p.materialDimensions.height)||Number(p.materialDimensions.width)} millimetres.`:''} Replace the material consistently through the ENTIRE transparent masked area, never only a small isolated patch. Respect the mask boundary, preserve the contours around glazing and doors, and keep all unmasked pixels as untouched as possible. The mask is a guide and may not be pixel exact. Material reference image is not the building.`:`FULL SCENE ENHANCEMENT: Transform the sketch/model screenshot into a realistic photograph, preserving the existing architecture and point of view. Design only the surroundings, photographic light and surface appearance that the user selected.`;
 return [essential,geometry,edit,physics,context,continuity].filter(Boolean).join('\n\n')}
async function proxyRender(req,res){
 if(!authorized(req))return json(res,401,{error:'Для генерации требуется код доступа к сайту.'});
 if(!sameOrigin(req))return json(res,403,{error:'Недопустимый источник запроса.'});
 if(!API_KEY)return json(res,503,{error:'AI не настроен: укажите API_MARKET_KEY в .env и перезапустите сервер.'});
 const today=new Date().toISOString().slice(0,10);if(today!==day){day=today;dailyCount=0;}
 if(dailyCount>=DAILY_CAP)return json(res,429,{error:'Достигнут дневной лимит генераций этого сервера.'});
 if(active>=1)return json(res,429,{error:'Другая визуализация уже выполняется. Дождитесь результата.'});
 active++;
 try{
  const p=await readJSON(req);if(!p.image)return json(res,400,{error:'Загрузите исходный скриншот'});
  const primary=imageBlob(p.image,'image');const mask=imageBlob(p.mask,'mask');const material=imageBlob(p.material,'material');const reference=imageBlob(p.reference,'reference');
  if(mask&&mask.type!=='image/png')return json(res,400,{error:'Маска должна быть PNG'});
  const n=[1,2,4].includes(Number(p.quantity))?Number(p.quantity):1;
  if(dailyCount+n>DAILY_CAP)return json(res,429,{error:`Осталось генераций на сегодня: ${Math.max(0,DAILY_CAP-dailyCount)}.`});
  const prompt=createPrompt(p);
  const images=[];const mimes=[];let warning='';
  for(let i=0;i<n;i++){
   // Count before call: timeout does not prove supplier hasn't charged the request.
   dailyCount++;
   try{
    const result=await apiMarketEdit({apiKey:API_KEY,source:primary,material,reference,mask,prompt: n>1?prompt+`\nCreate variation ${i+1} of ${n} with the same architecture and camera.`:prompt,quality:p.quality});
    images.push(result.b64);mimes.push(result.mimeType);
   }catch(error){
    if(!images.length)throw error;
    warning='Часть визуализаций не создана: '+error.message;
    break;
   }
  }
  json(res,200,{images,mimes,model:MODEL,provider:'API Market',warning});
 }catch(err){const status=err.status||502;json(res,status,{error:err.message||'Ошибка сервера'})}finally{active--}
}
async function login(req,res){
 if(!sameOrigin(req))return json(res,403,{error:'Недопустимый источник запроса.'});
 if(!ACCESS_PIN)return json(res,200,{ok:true});
 const ip=String(req.socket.remoteAddress||'unknown');const attempts=loginAttempts.get(ip)||{count:0,at:Date.now()};
 if(Date.now()-attempts.at>15*60*1000){attempts.count=0;attempts.at=Date.now();}
 if(attempts.count>=8)return json(res,429,{error:'Слишком много попыток. Повторите позже.'});
 let body;try{body=await readJSON(req)}catch{return json(res,400,{error:'Некорректный запрос'})}
 if(!safeEquals(body.pin||'',ACCESS_PIN)){attempts.count++;loginAttempts.set(ip,attempts);return json(res,401,{error:'Неверный код доступа.'});}
 loginAttempts.delete(ip);
 const secure=(req.headers['x-forwarded-proto']==='https'||req.socket.encrypted)?'; Secure':'';
 res.setHeader('Set-Cookie',`domrender_session=${SESSION_TOKEN}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${secure}`);
 return json(res,200,{ok:true});
}
async function serveStatic(req,res){let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{return json(res,400,{error:'Неправильный адрес'})}if(pathname==='/')pathname='/index.html';if(pathname.startsWith('/.'))return json(res,403,{error:'Нет доступа'});const file=path.resolve(ROOT,'.'+pathname);if(!(file===ROOT||file.startsWith(ROOT+path.sep))||path.basename(file).startsWith('.'))return json(res,403,{error:'Нет доступа'});const ext=path.extname(file).toLowerCase();if(!MIME[ext]||ext==='.json')return json(res,404,{error:'Не найдено'});try{const s=await stat(file);if(!s.isFile())throw Error();const content=await readFile(file);res.writeHead(200,{'Content-Type':MIME[ext],'Content-Length':content.length,'X-Content-Type-Options':'nosniff','Cache-Control':ext==='.html'?'no-store':'public, max-age=300','Referrer-Policy':'no-referrer'});res.end(content)}catch{json(res,404,{error:'Не найдено'})}}
const server=http.createServer(async(req,res)=>{
 if(req.url==='/api/status'&&req.method==='GET')return json(res,200,{ready:!!API_KEY&&authorized(req),provider:'API Market',model:API_KEY?MODEL:null,authRequired:!!ACCESS_PIN,authorized:authorized(req),dailyRemaining:Math.max(0,DAILY_CAP-dailyCount)});
 if(req.url==='/api/login'&&req.method==='POST')return login(req,res);
 if(req.url==='/api/render'&&req.method==='POST')return proxyRender(req,res);
 if(req.url?.startsWith('/api/'))return json(res,404,{error:'Не найдено'});
 if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'Метод запрещён'});
 await serveStatic(req,res)
});
server.listen(PORT,HOST,()=>{console.log(`ДОМ.РЕНДЕР: http://${HOST}:${PORT}`);console.log(API_KEY?`AI Market: ${MODEL} (секрет на сервере)`:'AI Market не подключён — демо без генерации')});
