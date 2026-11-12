import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const PORT = Number(process.env.PORT || 3000);
const BRAVE_KEY = process.env.BRAVE_SEARCH_API_KEY || '';
const AI_KEY = process.env.VISION_API_KEY || '';
const AI_BASE = (process.env.VISION_API_BASE || 'https://api.openai.com/v1').replace(/\/+$/, '');
const AI_MODEL = process.env.VISION_MODEL || 'gpt-4.1-mini';
const MAX_BYTES = 13 * 1024 * 1024;
const requestCounts = new Map();
const refCache = new Map();
const SITE = [
  {id:'behance', label:'Behance', domain:'behance.net', term:'architectural visualization cinematic exterior'},
  {id:'divisare', label:'Divisare', domain:'divisare.com', term:'architectural photography composition'},
  {id:'archdaily', label:'ArchDaily', domain:'archdaily.com', term:'residential timber house landscape'},
  {id:'cgconnect', label:'CGconnect', domain:'cgconnect.chaos.com', term:'archviz exterior render'},
  {id:'dezeen', label:'Dezeen', domain:'dezeen.com', term:'contemporary house architecture'}
];

function json(res, status, body) {
  const out = JSON.stringify(body);
  res.writeHead(status, {'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});
  res.end(out);
}
function timeout(ms){ return AbortSignal.timeout(ms); }
function rateLimited(req) {
  const ip = req.socket.remoteAddress || 'anonymous';
  const now = Date.now();
  const v = requestCounts.get(ip) || [];
  const count = v.filter(x => x > now-60_000);
  count.push(now);
  requestCounts.set(ip, count);
  if (requestCounts.size > 1500) requestCounts.clear();
  return count.length > 45;
}
async function bodyJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BYTES) throw Object.assign(new Error('Слишком большой файл. Максимум 8 МБ изображения.'), {status:413});
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('Некорректный запрос JSON'), {status:400}); }
}
function validImage(image) {
  if (!image || typeof image !== 'string') return false;
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/i.exec(image);
  return Boolean(match && match[2].length < 11_300_000);
}
function textLimited(v,max=500){return typeof v==='string' ? v.trim().slice(0,max):'';}
function errorOf(err){return err?.name==='TimeoutError' ? 'Сервис не ответил вовремя' : String(err?.message || 'Ошибка сервиса').slice(0,360);}

const PROMPT_SYSTEM = `You are a senior architectural art director, an architectural photographer and an architectural visualizer. Analyze the ACTUAL uploaded architectural image (never pretend certainty about unseen portions). Respond ONLY with valid JSON (no markdown): {"architecture":"one short Russian sentence about the visible architectural style/shape","materials":"Russian concise verified visible materials or explicitly "не могу определить"","composition":"Russian note on actual view, lens perspective and composition","lighting":"Russian note about existing light","constraints":["3-5 concise Russian rules for locked geometry"],"query":"4-9 English words describing building style and material suitable for photo reference discovery","choice":"editorial|cinematic|atmospheric","reason":"2 sentences in Russian why the chosen visual direction is best for this particular architecture","confidence":"high|medium|low"}. Do not invent missing materials, orientation, dimensions, camera EXIF or architect's identity. Preserve building's geometry, window placement, roof configuration, openings, frame and camera if locked. Use image first; contextual user notes are only hints, not proof.`;
function tryExtractJson(content){
  if(typeof content !== 'string') throw new Error('Модель не вернула текст');
  let raw = content.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'').trim();
  try{return JSON.parse(raw);}catch{
    const a=raw.indexOf('{'),z=raw.lastIndexOf('}');
    if(a>=0&&z>a)return JSON.parse(raw.slice(a,z+1));
    throw new Error('Модель вернула ответ не в формате JSON');
  }
}
async function analyze(input){
  if(!AI_KEY) return {available:false,code:'AI_NOT_CONFIGURED', message:'Подключите VISION_API_KEY в настройках сервера для анализа фотографии.'};
  const image = input.image;
  if(!validImage(image)) throw Object.assign(new Error('Для AI-анализа загрузите JPG, PNG или WebP до 8 МБ'),{status:400});
  const project = input.project || {};
  const userContext = `Project inputs (may be assumptions): type=${textLimited(project.type,80)}, material=${textLimited(project.materials,200)}, scene=${textLimited(project.description,800)}, geometry_lock=${project.lockGeometry !== false ? 'yes':'no'}`;
  const response=await fetch(`${AI_BASE}/chat/completions`,{
    method:'POST',
    headers:{'authorization':`Bearer ${AI_KEY}`,'content-type':'application/json'},
    body:JSON.stringify({model:AI_MODEL,temperature:0.25,max_tokens:950,messages:[
      {role:'system',content:PROMPT_SYSTEM},
      {role:'user',content:[{type:'text',text:`Analyze this original building image for professional architectural reference selection. ${userContext}`},{type:'image_url',image_url:{url:image,detail:'high'}}]}
    ]}),signal:timeout(32_000)
  });
  if(!response.ok){const txt=await response.text();throw new Error(`AI API: ${response.status} ${txt.slice(0,180)}`);}
  const payload=await response.json();
  const answer=tryExtractJson(payload?.choices?.[0]?.message?.content);
  return {available:true,result:{
    architecture:textLimited(answer.architecture,240),
    materials:textLimited(answer.materials,220),
    composition:textLimited(answer.composition,260),
    lighting:textLimited(answer.lighting,220),
    constraints:Array.isArray(answer.constraints) ? answer.constraints.slice(0,5).map(x=>textLimited(x,160)):[],
    query:textLimited(answer.query,120),
    choice:['editorial','cinematic','atmospheric'].includes(answer.choice) ? answer.choice : 'editorial',
    reason:textLimited(answer.reason,480),
    confidence:['high','medium','low'].includes(answer.confidence) ? answer.confidence : 'low'
  }};
}
function filterResult(x,s){
  try {
    const url=new URL(x.url), host=url.hostname.toLowerCase();
    if(!['https:','http:'].includes(url.protocol))return null;
    if(!(host===s.domain||host.endsWith('.'+s.domain)))return null;
    const thumb= x.thumbnail?.src;
    if(!thumb||!/^https:\/\//.test(thumb))return null;
    return {source:s.id, sourceLabel:s.label, title:textLimited(x.title,120) || 'Архитектурный референс', link:url.href, thumbnail:thumb, confidence:x.confidence||'unknown'};
  } catch{return null;}
}
async function searchSources(rawQuery){
  if(!BRAVE_KEY) return {available:false,results:[],sources:SITE.map(s=>({id:s.id,label:s.label,count:0,status:'not-configured'}))};
  const query=textLimited(rawQuery,110) || 'modern wooden house exterior';
  const cacheKey=query.toLowerCase();
  const cached=refCache.get(cacheKey);
  if(cached && Date.now()-cached.at<15*60*1000) return {...cached.data,cached:true};
  const fetched=await Promise.all(SITE.map(async s=>{
    const url=new URL('https://api.search.brave.com/res/v1/images/search');
    url.searchParams.set('q',`site:${s.domain} ${query} ${s.term}`.slice(0,320));
    url.searchParams.set('count','25');
    url.searchParams.set('safesearch','strict');
    url.searchParams.set('country','ALL');
    url.searchParams.set('search_lang','en');
    try{
      const r=await fetch(url,{headers:{'x-subscription-token':BRAVE_KEY,'accept':'application/json'},signal:timeout(15_000)});
      if(!r.ok) return {id:s.id,label:s.label,count:0,status:`HTTP ${r.status}`,results:[]};
      const data=await r.json();
      const unique=new Map();
      for(const x of data.results||[]) {
        const p=filterResult(x,s);
        if(p && !unique.has(p.link))unique.set(p.link,p);
      }
      return {id:s.id,label:s.label,count:unique.size,status:'ok',results:[...unique.values()].slice(0,8)};
    }catch(e){return {id:s.id,label:s.label,count:0,status:errorOf(e),results:[]};}
  }));
  const results=fetched.flatMap(s=>s.results||[]);
  const output={available:true,results,sources:fetched.map(({id,label,count,status})=>({id,label,count,status}))};
  if(refCache.size>50)refCache.clear();
  refCache.set(cacheKey,{at:Date.now(),data:output});
  return output;
}
function safePath(reqPath){
  let parsed;
  try{parsed=decodeURIComponent(new URL(reqPath,'http://localhost').pathname);}catch{return null;}
  if(parsed.includes('\0'))return null;
  const relative=parsed==='/' ? 'index.html' : parsed.replace(/^\/+/, '');
  const candidate=path.resolve(ROOT,relative);
  if(candidate!==ROOT && !candidate.startsWith(ROOT+path.sep))return null;
  return candidate;
}
async function staticServe(req,res){
  const file=safePath(req.url);
  if(!file)return json(res,400,{error:'Неверный путь'});
  try{
    if(!(await stat(file)).isFile())throw new Error('not a file');
    const ext=path.extname(file);
    const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
    res.writeHead(200,{'content-type':types[ext]||'application/octet-stream','cache-control':'public, max-age=60','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin'});
    res.end(await readFile(file));
  } catch {json(res,404,{error:'Не найдено'});}
}
const server=http.createServer(async(req,res)=>{
  try{
    if(rateLimited(req))return json(res,429,{error:'Слишком много запросов. Повторите позже.'});
    const pathName=new URL(req.url,'http://localhost').pathname;
    if(req.method==='GET'&&pathName==='/api/health')return json(res,200,{status:'ok',app:'forma-studio',version:'0.1.0'});
    if(req.method==='GET'&&pathName==='/api/config')return json(res,200,{ai:!!AI_KEY,search:!!BRAVE_KEY,model:AI_KEY?AI_MODEL:null,sources:SITE.map(({id,label,domain})=>({id,label,domain}))});
    if(req.method==='POST'&&pathName==='/api/analyze')return json(res,200,await analyze(await bodyJson(req)));
    if(req.method==='GET'&&pathName==='/api/references'){
      const q=new URL(req.url,'http://localhost').searchParams.get('q');
      return json(res,200,await searchSources(q));
    }
    if(req.method==='GET'||req.method==='HEAD')return await staticServe(req,res);
    return json(res,405,{error:'Метод не поддерживается'});
  }catch(e){json(res,e.status||502,{error:errorOf(e)});}
});
server.listen(PORT,'0.0.0.0',()=>console.log(`FORMA STUDIO listening on ${PORT}`));
