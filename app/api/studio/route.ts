import {bindings,identity,ownedProject,serialize,json,month,monthlyLimit,type ProjectRow,type Variant} from '@/lib/server';
import {normalizeSettings,buildPrompt,buildGeminiRequest} from '@/lib/prompts';
import {parseImage,safeTitle,readJsonBody} from '@/lib/validation';
import {finalGeneratedImage} from '@/lib/provider';

export const dynamic='force-dynamic';

export async function GET(request:Request){
 const url=new URL(request.url),action=url.searchParams.get('action')||'status';
 const user=await identity(),e=bindings();
 if(action==='status'){
  const used=user&&e.DB?await e.DB.prepare('SELECT used FROM usage WHERE owner=? AND month=?').bind(user.userId,month()).first<{used:number}>():null;
  return json({user:user?{name:user.displayName,email:user.email}:null,generationReady:!!e.GEMINI_API_KEY&&e.GENERATION_ENABLED==='true',billingReady:false,remaining:Math.max(0,monthlyLimit()-(used?.used||0)),limit:monthlyLimit()});
 }
 if(!user)return json({error:'Войдите, чтобы открыть свои проекты.'},401);
 if(!e.DB||!e.BUCKET)return json({error:'Хранилище проектов ещё не подключено.'},503);
 if(action==='projects'){
  const rows=await e.DB.prepare('SELECT * FROM projects WHERE owner=? ORDER BY updated_at DESC LIMIT 50').bind(user.userId).all<ProjectRow>();
  return json({projects:rows.results.map(serialize)});
 }
 const row=await ownedProject(url.searchParams.get('id')||'',user.userId);
 if(!row)return json({error:'Проект не найден.'},404);
 if(action==='project')return json({project:serialize(row)});
 if(action==='asset'){
  const kind=url.searchParams.get('kind'),variants=JSON.parse(row.variants) as Variant[];
  const key=kind==='source'?row.source_key:variants.find(v=>v.id===kind)?.key;
  if(!key)return json({error:'Изображение не найдено.'},404);
  const object=await e.BUCKET.get(key);
  if(!object)return json({error:'Изображение не найдено.'},404);
  return new Response(object.body,{headers:{'Content-Type':object.httpMetadata?.contentType||'image/png','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }
 return json({error:'Неизвестное действие.'},400);
}

export async function POST(request:Request){
 const origin=request.headers.get('origin');
 if(origin&&origin!==new URL(request.url).origin)return json({error:'Недопустимый источник запроса.'},403);
 const user=await identity();
 if(!user)return json({error:'Войдите, чтобы сохранять проекты и создавать визуализации.'},401);
 const e=bindings();
 if(!e.DB||!e.BUCKET)return json({error:'Хранилище проектов ещё не подключено.'},503);
 const length=Number(request.headers.get('content-length')||0);
 if(length>12*1024*1024)return json({error:'Файл слишком большой. Максимум — 8 МБ.'},413);
 let body:Record<string,unknown>;
 try {const parsed=await readJsonBody(request);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('Invalid body');body=parsed as Record<string,unknown>;}catch(error){return json({error:error instanceof RangeError?error.message:'Не удалось прочитать запрос.'},error instanceof RangeError?413:400);}
 const action=body.action;
 if(action==='save'){
  let row:ProjectRow|null=null;
  if(body.id){row=await ownedProject(String(body.id),user.userId);if(!row)return json({error:'Проект не найден.'},404);}
  const id=row?.id||crypto.randomUUID(),now=new Date().toISOString();
  let sourceKey=row?.source_key;
  if(!sourceKey){
   let image;try{image=parseImage(body.source);}catch(error){return json({error:(error as Error).message},400);}
   sourceKey=`projects/${id}/source`;
   await e.BUCKET.put(sourceKey,image.bytes,{httpMetadata:{contentType:image.mimeType}});
  }
  const settings=JSON.stringify(normalizeSettings(body.settings)),title=safeTitle(body.title);
  if(row)await e.DB.prepare('UPDATE projects SET title=?,settings=?,updated_at=? WHERE id=? AND owner=?').bind(title,settings,now,id,user.userId).run();
  else await e.DB.prepare('INSERT INTO projects (id,owner,title,source_key,settings,variants,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)').bind(id,user.userId,title,sourceKey,settings,'[]',now,now).run();
  return json({project:serialize((await ownedProject(id,user.userId))!)});
 }
 if(action==='delete'){
  const row=await ownedProject(String(body.id||''),user.userId);
  if(!row)return json({error:'Проект не найден.'},404);
  await e.DB.prepare('DELETE FROM projects WHERE id=? AND owner=?').bind(row.id,user.userId).run();
  const keys=[row.source_key,...(JSON.parse(row.variants) as Variant[]).map(v=>v.key)];
  await e.BUCKET.delete(keys);
  return json({ok:true});
 }
 if(action!=='generate')return json({error:'Неизвестное действие.'},400);
 if(!e.GEMINI_API_KEY||e.GENERATION_ENABLED!=='true')return json({error:'Генерация ещё не подключена. Можно настроить проект и сохранить инструкцию для Nano Banana.',code:'NOT_CONFIGURED'},503);
 const row=await ownedProject(String(body.id||''),user.userId);
 if(!row)return json({error:'Сначала сохраните проект с исходным изображением.'},404);
 const source=await e.BUCKET.get(row.source_key);
 if(!source)return json({error:'Исходное изображение не найдено. Загрузите его заново.'},404);
 const period=month();
 const reservation=await e.DB.prepare('INSERT INTO usage (owner,month,used) VALUES (?,?,1) ON CONFLICT(owner,month) DO UPDATE SET used=used+1 WHERE used < ? RETURNING used').bind(user.userId,period,monthlyLimit()).first<{used:number}>();
 if(!reservation)return json({error:'Лимит визуализаций на этот месяц исчерпан.'},429);
 let resultKey:string|undefined;
 try{
  const sourceBytes=new Uint8Array(await source.arrayBuffer());
  let binary='';for(let i=0;i<sourceBytes.length;i+=8192)binary+=String.fromCharCode(...sourceBytes.subarray(i,i+8192));
  const settings=normalizeSettings(body.settings),model=e.GEMINI_MODEL||'gemini-nano-banana-2.1';
  if(!['gemini-nano-banana-2.1','gemini-3.1-flash-image','gemini-3-pro-image'].includes(model))throw new Error('Модель генерации не настроена.');
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':e.GEMINI_API_KEY},body:JSON.stringify(buildGeminiRequest(settings,{mimeType:source.httpMetadata?.contentType||'image/png',data:btoa(binary)})),signal:AbortSignal.timeout(110000)});
  if(!response.ok){console.error('Google image request failed',response.status);throw new Error(response.status===429?'Сервис генерации временно перегружен. Попробуйте позже.':'Google не смог создать изображение. Проверьте настройки подключения и повторите попытку.');}
  const image=finalGeneratedImage(await response.json());
  const parsed=parseImage(`data:${image.mimeType};base64,${image.data}`),id=crypto.randomUUID(),now=new Date().toISOString();
  resultKey=`projects/${row.id}/${id}`;await e.BUCKET.put(resultKey,parsed.bytes,{httpMetadata:{contentType:parsed.mimeType}});
  const variant:Variant={id,key:resultKey,settings,createdAt:now,prompt:buildPrompt(settings)};
  // Append inside SQLite: simultaneous requests never overwrite another variant.
  await e.DB.prepare("UPDATE projects SET variants=json_insert(variants,'$[#]',json(?)),settings=?,updated_at=? WHERE id=? AND owner=?").bind(JSON.stringify(variant),JSON.stringify(settings),now,row.id,user.userId).run();
  return json({project:serialize((await ownedProject(row.id,user.userId))!),variantId:id,remaining:Math.max(0,monthlyLimit()-reservation.used)});
 }catch(error){
  await e.DB.prepare('UPDATE usage SET used=MAX(0,used-1) WHERE owner=? AND month=?').bind(user.userId,period).run();
  if(resultKey)await e.BUCKET.delete(resultKey);
  return json({error:(error as Error).name==='TimeoutError'?'Генерация заняла слишком много времени. Лимит не списан.':(error as Error).message||'Не удалось создать визуализацию.'},502);
 }
}
