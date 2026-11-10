/**
 * Provider adapter: API Market / OpenAI-compatible image edits (Nano Banana 2.1).
 * No credential is ever sent to a browser, source file or an unapproved hostname.
 */
import dns from 'node:dns/promises';
import net from 'node:net';

export const API_MARKET_ENDPOINT = 'https://api-market1.shop/v1/images/edits';
export const API_MARKET_MODEL = 'nano-banana-2.1';
const MAX_OUTPUT_BYTES=18*1024*1024;

export function sanitizeProviderError(status, body){
  const text=typeof body?.error==='string'?body.error:typeof body?.error?.message==='string'?body.error.message:'';
  const code=body?.error?.code||body?.code;
  if(status===401||status===403)return 'API Market отклонил ключ доступа. Проверьте API_MARKET_KEY и его статус.';
  if(status===402||/insufficient|balance|credit|quota/i.test(String(code)+' '+text))return 'Недостаточно средств или квоты на балансе API Market.';
  if(status===429)return 'API Market ограничил число запросов. Повторите позже.';
  if(status===400)return 'API Market не принял параметры изображения. Проверьте формат и документацию модели.';
  if(status>=500)return 'API Market временно недоступен. Попробуйте позже.';
  return `Ошибка API Market (${status}).`;
}

function publicIP(ip){
  const v=net.isIP(ip);
  if(v===4){const p=ip.split('.').map(Number);return !(p[0]===0||p[0]===10||p[0]===127||p[0]>=224||(p[0]===169&&p[1]===254)||(p[0]===172&&p[1]>=16&&p[1]<=31)||(p[0]===192&&p[1]===168)||(p[0]===100&&p[1]>=64&&p[1]<=127)||(p[0]===198&&(p[1]===18||p[1]===19)));}
  if(v===6){const s=ip.toLowerCase();return !(s==='::'||s==='::1'||s.startsWith('fc')||s.startsWith('fd')||s.startsWith('fe8')||s.startsWith('fe9')||s.startsWith('fea')||s.startsWith('feb')||s.startsWith('::ffff:127.')||s.startsWith('::ffff:10.')||s.startsWith('::ffff:192.168.'));}
  return false;
}

async function imageFromURL(url,{fetchImpl=fetch,dnsLookup=dns.lookup}={}){
  let u;try{u=new URL(url)}catch{throw new Error('API Market вернул некорректный адрес изображения.');}
  if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443'||net.isIP(u.hostname)||u.hostname==='localhost')throw new Error('Поставщик вернул небезопасный адрес изображения.');
  const addresses=await dnsLookup(u.hostname,{all:true});
  if(!addresses.length||addresses.some(item=>!publicIP(item.address)))throw new Error('Недопустимый адрес для загрузки результата.');
  const resp=await fetchImpl(u.toString(),{redirect:'error',signal:AbortSignal.timeout(25000)});
  if(!resp.ok)throw new Error('Не удалось скачать изображение результата из API Market.');
  const type=(resp.headers.get('content-type')||'').split(';')[0].trim();
  if(type&& !['image/png','image/jpeg','image/webp','application/octet-stream'].includes(type))throw new Error('API Market вернул не изображение.');
  const declaredSize=Number(resp.headers.get('content-length')||0);
  if(declaredSize>MAX_OUTPUT_BYTES)throw new Error('AI-изображение слишком большое.');
  const data=Buffer.from(await resp.arrayBuffer());
  if(data.length<100||data.length>MAX_OUTPUT_BYTES||!detectMime(data))throw new Error('Повреждённое изображение от AI.');
  return {b64:data.toString('base64'),mimeType:detectMime(data)};
}

export function detectMime(b){
  if(b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47)return 'image/png';
  if(b[0]===0xff&&b[1]===0xd8&&b[2]===0xff)return 'image/jpeg';
  if(b.subarray(0,4).toString('ascii')==='RIFF'&&b.subarray(8,12).toString('ascii')==='WEBP')return 'image/webp';
  return null;
}

export async function parseImageReply(reply, opts={}){
  const data=reply?.data;
  if(!Array.isArray(data)||!data.length)throw new Error('API Market не вернул изображение.');
  const first=data[0];
  if(typeof first?.b64_json==='string'){
    const encoded=first.b64_json.trim();
    if(!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)||encoded.length>Math.ceil(MAX_OUTPUT_BYTES*4/3)+10)throw new Error('Некорректные данные изображения.');
    const raw=Buffer.from(encoded,'base64'),mimeType=detectMime(raw);
    if(!mimeType||raw.length<100||raw.length>MAX_OUTPUT_BYTES)throw new Error('API Market вернул неподдерживаемый файл.');
    return {b64:raw.toString('base64'),mimeType};
  }
  if(typeof first?.url==='string')return await imageFromURL(first.url,opts);
  throw new Error('API Market не вернул файл изображения или ссылку на него.');
}

/** one edit per paid request; never send additional image prompt-only */
export async function apiMarketEdit({apiKey,source,material,reference,mask,prompt,quality='high',fetchImpl=fetch,timeoutMs=165000}){
  if(!apiKey)throw new Error('Не настроен API_MARKET_KEY.');
  if(!source)throw new Error('Исходный скриншот не задан.');
  const form=new FormData();
  form.append('model',API_MARKET_MODEL);
  form.append('prompt',prompt);
  form.append('quality',quality==='medium'?'medium':'high');
  form.append('response_format','b64_json');
  form.append('n','1');
  // File extensions must match the actual Blob MIME type (JPEG is common here).
  const uploadName=(blob,stem)=>stem+(blob?.type==='image/jpeg'?'.jpg':blob?.type==='image/webp'?'.webp':'.png');
  if(!reference&&!material&&!mask)form.append('image',source,uploadName(source,'source'));
  else {
    form.append('image[]',source,uploadName(source,'source'));
    if(material)form.append('image[]',material,uploadName(material,'material-reference'));
    if(reference)form.append('image[]',reference,uploadName(reference,'previous-view'));
    if(mask)form.append('image[]',mask,'selection-mask.png');
  }
  let response;
  try{
    response=await fetchImpl(API_MARKET_ENDPOINT,{method:'POST',headers:{Authorization:`Bearer ${apiKey}`},body:form,signal:AbortSignal.timeout(timeoutMs)});
  }catch(error){if(error.name==='TimeoutError'||error.name==='AbortError')throw new Error('Превышено время ожидания API Market. Проверьте баланс: запрос мог быть оплачен.');throw new Error('Не удалось соединиться с API Market.');}
  const responseType=(response.headers.get('content-type')||'').toLowerCase().split(';')[0];
  if(response.ok&&['image/png','image/jpeg','image/webp'].includes(responseType)){
    const raw=Buffer.from(await response.arrayBuffer()),mimeType=detectMime(raw);
    if(!mimeType||raw.length<100||raw.length>MAX_OUTPUT_BYTES)throw new Error('API Market вернул повреждённое изображение.');
    return {b64:raw.toString('base64'),mimeType};
  }
  let body;
  try{body=await response.json()}
  catch{
    // A gateway may return HTML/text on failure. Don't expose HTML or secrets to clients.
    console.warn('[API Market] Не-JSON ответ:',response.status,responseType||'unknown content type');
    if(response.status>=500)throw new Error('API Market временно вернул ошибку сервера (HTTP '+response.status+'). Попробуйте позже; запрос мог быть оплачен.');
    throw new Error('API Market вернул некорректный формат ответа (HTTP '+response.status+').');
  }
  if(!response.ok)throw new Error(sanitizeProviderError(response.status,body));
  return parseImageReply(body,{fetchImpl});
}
