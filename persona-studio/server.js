/** PERSONA STUDIO server — Node.js 20+, no dependencies.
 * API tokens never reach the browser or GitHub. AI is disabled until an
 * administrator configures a provider key, model and PERSONA_ACCESS_CODE.
 * Arkheon image endpoints are provisionally OpenAI-shaped: publication of
 * Arkheon image API methods has not been independently confirmed.
 */
'use strict';
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs/promises');
const { URL } = require('node:url');
const { buildPrompt } = require('./src/prompt.js');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const MAX_JSON_BYTES = 22 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const LIMIT_COUNT = 3;
const WINDOW_MS = 10 * 60_000;
const rateLimits = new Map();

function respond(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(payload));
}
function providerConfig(){
  const provider=process.env.PERSONA_AI_PROVIDER==='arkheon'?'arkheon':'openai';
  const arkheon=provider==='arkheon';
  const baseUrl=arkheon
    ? (process.env.ARKHEON_API_BASE || 'https://arkheonchat.com/v1').replace(/\\/+$/,'')
    : 'https://api.openai.com/v1';
  if(!/^https:\/\//.test(baseUrl))throw new Error('Provider base URL must use HTTPS.');
  return {
    provider,baseUrl,
    apiKey:arkheon?process.env.ARKHEON_API_KEY:process.env.OPENAI_API_KEY,
    model:arkheon?(process.env.ARKHEON_IMAGE_MODEL||''):(process.env.OPENAI_IMAGE_MODEL||'gpt-image-2'),
  };
}
function isReady(){
  const config=providerConfig();
  return !!(config.apiKey && config.model && process.env.PERSONA_ACCESS_CODE);
}
function getClientIP(req) {
  // Render provides this forwarding header. Prefer the connecting peer otherwise.
  return (req.headers['cf-connecting-ip'] || req.headers['x-real-ip'] || req.socket.remoteAddress || 'unknown').toString().slice(0, 100);
}
function checkRate(ip) {
  const now = Date.now();
  if(rateLimits.size>3000) for(const [k,v] of rateLimits) if(now-v.window>WINDOW_MS)rateLimits.delete(k);
  let info = rateLimits.get(ip);
  if(!info || now-info.window>WINDOW_MS) info={window:now,count:0};
  if(info.count>=LIMIT_COUNT) return false;
  info.count++;
  rateLimits.set(ip, info);
  return true;
}
async function readJson(req) {
  if(!String(req.headers['content-type']||'').startsWith('application/json')) throw Object.assign(new Error('Ожидался JSON.'), {status:415});
  const parts=[];let size=0;
  for await(const part of req) {
    size+=part.length;
    if(size>MAX_JSON_BYTES)throw Object.assign(new Error('Слишком большой файл. Максимум 5 МБ на изображение.'),{status:413});
    parts.push(part);
  }
  try{return JSON.parse(Buffer.concat(parts).toString('utf8'));}
  catch{throw Object.assign(new Error('Неверные данные запроса.'),{status:400});}
}
function toBlob(dataUri) {
  if(!dataUri)return null;
  if(typeof dataUri !== 'string') throw Object.assign(new Error('Некорректное изображение.'),{status:400});
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([a-z0-9+/=]+)$/i.exec(dataUri);
  if(!match)throw Object.assign(new Error('Поддерживаются изображения JPG, PNG и WebP.'),{status:400});
  if(match[2].length > Math.ceil(MAX_IMAGE_BYTES*4/3)+8)throw Object.assign(new Error('Изображение слишком большое.'),{status:413});
  const buffer=Buffer.from(match[2],'base64');
  if(buffer.length===0 || buffer.length>MAX_IMAGE_BYTES)throw Object.assign(new Error('Изображение слишком большое.'),{status:413});
  return new Blob([buffer],{type:match[1]});
}
async function callImageAPI(data) {
  const prompt=buildPrompt(data);
  const reference=toBlob(data.referenceImage);
  const clothing=toBlob(data.clothingImage);
  const hairstyle=toBlob(data.hairImage);
  const config=providerConfig();
  if(!config.apiKey||!config.model)throw Object.assign(new Error('Не настроен ключ или модель выбранного AI-провайдера.'),{status:503});
  const model=config.model;
  const quality=['low','medium','high'].includes(data.quality)?data.quality:'medium';
  const size=['1024x1024','1024x1536','1536x1024'].includes(data.size)?data.size:'1024x1536';
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),115000);
  try{
    let body,headers={'Authorization':`Bearer ${config.apiKey}`};
    let endpoint;
    if(reference || clothing || hairstyle){
      endpoint=config.baseUrl+'/images/edits';
      body=new FormData();
      body.append('model',model);body.append('prompt',prompt);
      body.append('size',size);body.append('quality',quality);
      if(reference)body.append('image[]',reference,'character.png');
      if(clothing)body.append('image[]',clothing,'outfit.png');
      if(hairstyle)body.append('image[]',hairstyle,'hair.png');
    }else{
      endpoint=config.baseUrl+'/images/generations';
      headers['Content-Type']='application/json';
      body=JSON.stringify({model,prompt,size,quality,n:1});
    }
    const answer=await fetch(endpoint,{method:'POST',headers,body,signal:controller.signal});
    let json;
    try{json=await answer.json();}catch{json=null;}
    if(!answer.ok){
      const msg=typeof json?.error?.message==='string'?json.error.message.slice(0,260):'Не удалось выполнить генерацию.';
      const noImageAPI=config.provider==='arkheon' && [404,405,501].includes(answer.status);
      const err=new Error(noImageAPI
        ? 'Arkheon: метод генерации изображений не подтверждён или недоступен по этому адресу. Уточните у Arkheon API endpoint для image generation / image edits.'
        : msg);
      err.status=noImageAPI?501:(answer.status===429?429:(answer.status===401?502:(answer.status===402?402:502)));
      throw err;
    }
    const base64=json?.data?.[0]?.b64_json;
    if(!base64)throw Object.assign(new Error('AI не вернул изображение. Проверьте модель и параметры.'),{status:502});
    return {image:'data:image/png;base64,'+base64,model,provider:config.provider};
  }finally{clearTimeout(timer);}
}
const FILES={
  '/':'index.html','/index.html':'index.html','/styles.css':'styles.css',
  '/app.js':'app.js','/assets/favicon.svg':'assets/favicon.svg',
};
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
  const pathname=new URL(req.url||'/', 'http://localhost').pathname;
  if(req.method==='GET'&&pathname==='/api/status'){
    const config=providerConfig();
    return respond(res,200,{aiConfigured:isReady(),provider:config.provider,model:config.model||null,authRequired:true,imageEndpointVerified:false});
  }
  if(req.method==='POST'&&pathname==='/api/ai/generate'){
    if(!isReady())return respond(res,503,{error:'Генерация выключена: владелец ещё не настроил серверные ключи.'});
    const access=req.headers['x-persona-access-code'];
    if(typeof access!=='string'||access.length>160||access!==process.env.PERSONA_ACCESS_CODE)return respond(res,401,{error:'Неверный код доступа к генерации.'});
    if(!checkRate(getClientIP(req)))return respond(res,429,{error:'Лимит: 3 генерации за 10 минут. Повторите позже.'});
    try{const input=await readJson(req);const out=await callImageAPI(input);return respond(res,200,out);}
    catch(err){const status=err.status|| (err.name==='AbortError'?504:502);return respond(res,status,{error:err.name==='AbortError'?'Время ожидания AI истекло.':err.message||'Ошибка AI.'});}
  }
  if(req.method!=='GET'&&req.method!=='HEAD')return respond(res,405,{error:'Method not allowed'});
  const file=FILES[pathname];
  if(!file)return respond(res,404,{error:'Not found'});
  try{const bytes=await fs.readFile(path.join(ROOT,file));res.writeHead(200,{
    'Content-Type':MIME[path.extname(file)]||'application/octet-stream',
    'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'no-referrer',
    'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
  });res.end(req.method==='HEAD'?undefined:bytes);}
  catch{respond(res,500,{error:'File unavailable'});}
});
if(require.main===module) server.listen(PORT,'0.0.0.0',()=>console.log(`PERSONA STUDIO http://localhost:${PORT}`));
module.exports={server,callImageAPI,toBlob,readJson,checkRate,isReady,providerConfig};
