/* PLAN TO INTERIOR: opt-in Vision recognition. Server secrets never reach the browser. */
const KEY=process.env.PLAN_VISION_KEY||process.env.API_MARKET_KEY||'';
const MODEL=process.env.PLAN_VISION_MODEL||'';
const ENDPOINT='https://api-market1.shop/v1/chat/completions';
let busy=false,day='',used=0;
const quota=16;
function textJSON(raw){
 const t=String(raw||'').trim(),a=t.indexOf('{'),b=t.lastIndexOf('}');
 if(a<0||b<a)throw Error('AI не вернул структурированный план.');
 return JSON.parse(t.slice(a,b+1));
}
export function validatePlan(data){
 const arr=Array.isArray(data?.walls)?data.walls:[];
 if(!arr.length)throw Error('AI не распознал достаточно стен. Уточните вручную.');
 const original=arr.slice(0,150).map((w,i)=>{
  const a=[Number(w.x1),Number(w.y1),Number(w.x2),Number(w.y2)];
  if(a.some(v=>!Number.isFinite(v)||v<0||v>1))return null;
  if(Math.hypot(a[2]-a[0],a[3]-a[1])<.018)return null;
  const conf=Number(w.confidence);
  return {id:'ai_'+i,x1:a[0],y1:a[1],x2:a[2],y2:a[3],confidence:Number.isFinite(conf)?Math.min(1,Math.max(0,conf)):.5};
 });
 const walls=original.filter(Boolean);
 if(!walls.length)throw Error('AI вернул некорректные координаты стен.');
 const openings=(Array.isArray(data?.openings)?data.openings:[]).slice(0,90).map((o,i)=>{
  const wallIndex=Number(o.wallIndex),offset=Number(o.offset),width=Number(o.width);
  if(!Number.isInteger(wallIndex)||wallIndex<0||wallIndex>=original.length||!original[wallIndex]||!Number.isFinite(offset)||!Number.isFinite(width)||offset<0||offset>1||width<=0||width>1)return null;
  return {id:'opening_'+i,wallId:original[wallIndex].id,offset,width,kind:o.kind==='window'?'window':'door',verified:false};
 }).filter(Boolean);
 return {walls,openings,scaleSource:'unverified',warning:'AI выдал предполагаемые линии стен. Подтвердите масштаб, геометрию и проёмы.'};
}
export function visionStatus(){return {ready:!!KEY&&!!MODEL,model:MODEL||null,configured:!!MODEL,quotaRemaining:Math.max(0,quota-used),costNotice:'AI-анализ платный по тарифам провайдера и требует подтверждения.'}}
function deny(res,status,msg){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify({error:msg}))}
export function createPlanVision({json,readJSON,sameOrigin}){
 return async function(req,res){
  if(!sameOrigin(req))return deny(res,403,'Недопустимый источник.');
  if(req.method!=='POST')return deny(res,405,'Метод не поддерживается.');
  if(!KEY||!MODEL)return deny(res,503,'Для AI-анализа нужно указать PLAN_VISION_MODEL и API_MARKET_KEY на сервере.');
  const d=new Date().toISOString().slice(0,10);if(day!==d){day=d;used=0}
  if(busy)return deny(res,429,'Vision-анализ уже выполняется. Попробуйте после завершения.');
  if(used>=quota)return deny(res,429,'Достигнут лимит AI-анализов на сегодня.');
  let request;try{request=await readJSON(req)}catch(e){return deny(res,e.status||400,'Некорректное изображение.')}
  const image=request?.image;
  if(typeof image!=='string'||image.length>5_800_000||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(image))return deny(res,400,'Изображение должно быть PNG, JPG или WEBP до 4 МБ.');
  busy=true;used++;
  try{
   const response=await fetch(ENDPOINT,{method:'POST',
    headers:{Authorization:'Bearer '+KEY,'Content-Type':'application/json'},
    signal:AbortSignal.timeout(70000),
    body:JSON.stringify({
     model:MODEL,temperature:0,max_tokens:3000,
     messages:[
      {role:'system',content:'You are a floor plan geometry parser. Return ONLY a compact JSON object. Detect major walls from the supplied 2D architectural plan, not furniture lines or texts. Use normalised image coordinates 0..1 with top-left origin. JSON schema: {"walls":[{"x1":0,"y1":0,"x2":1,"y2":0,"confidence":0.8}],"openings":[{"wallIndex":0,"kind":"door","offset":0.5,"width":0.1}]}. Wall endpoints should be in the CENTER of each wall band, along the wall axis. Only output positions you can infer; do not invent measurements. Do not output lengths in meters. Straight segments only. Max 100 walls and 70 openings. If unsure, omit the uncertain element. No prose.'},
      {role:'user',content:[{type:'text',text:'Trace the walls and visible door/window openings in this plan. Output JSON only. User will calibrate actual meters afterwards.'},{type:'image_url',image_url:{url:image,detail:'high'}}]}
     ]
    })
   });
   if(!response.ok){
    let err='Vision-модель недоступна через выбранный API.';
    if(response.status===401||response.status===403)err='Ключ Vision API недействителен или не имеет доступа.';
    if(response.status===402)err='Недостаточно средств на AI Vision.';
    if(response.status===429)err='Vision API временно ограничивает запросы.';
    return deny(res,502,err+' Код: '+response.status);
   }
   const data=await response.json();
   const raw=data?.choices?.[0]?.message?.content;
   const resultText=typeof raw==='string'?raw:Array.isArray(raw)?raw.map(x=>x.text||'').join(''):'';
   const parsed=validatePlan(textJSON(resultText));
   json(res,200,{...parsed,model:MODEL,billedRequest:true});
  }catch(e){
   const msg=/timeout|abort/i.test(String(e.name||''))?'Время ожидания Vision-модели истекло. Запрос мог быть оплачен.':'AI не смог уверенно распознать план. Используйте ручную проверку.';
   deny(res,502,msg);
  }finally{busy=false}
 }
}
