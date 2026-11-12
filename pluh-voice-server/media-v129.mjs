import {appOrigin} from "./allowed-origins-v31.mjs";
/* PLUX V12.9 — user attachments and Nano Banana image generation.
   All paid API calls stay server-side. Attachments are processed in memory, not stored. */
const PER_FILE_LIMIT=6*1024*1024;
const MAX_IMAGES=3;
const imageHits=new Map();
let imageTotal=0, imageDay=Date.now(), inFlight=0;
const originAllowed="https://plux-v12-2-2k-fixed.onrender.com";
const ALLOWED=new Set(["image/png","image/jpeg","image/webp","application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain","text/markdown"]);
function error(status,message){return Object.assign(new Error(message),{status})}
function reply(res,status,data){res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});res.end(JSON.stringify(data))}
export function mediaCors(req,res){
  const origin=String(req.headers.origin||"");
  if(!appOrigin(req)){reply(res,403,{error:"Недопустимый источник запроса."});return false}
  res.setHeader("Access-Control-Allow-Origin",appOrigin(req));
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
  res.setHeader("Vary","Origin");
  if(req.method==="OPTIONS"){res.writeHead(204,{"Cache-Control":"no-store"});res.end();return false}
  return true;
}
export async function readJsonLimited(req,maxBytes){
  const declared=Number(req.headers["content-length"]||0);
  if(declared>maxBytes)throw error(413,"Файлы слишком большие. Уменьши размер.");
  const chunks=[];let size=0;
  for await(const c of req){size+=c.length;if(size>maxBytes)throw error(413,"Файлы слишком большие. Уменьши размер.");chunks.push(c)}
  try{return JSON.parse(Buffer.concat(chunks).toString("utf8"))}catch{throw error(400,"Некорректный формат запроса.")}
}
function decodeFile(item){
  if(!item||typeof item!=="object")throw error(400,"Некорректное вложение.");
  const name=String(item.name||"файл").replace(/[\r\n<>]/g,"").slice(0,100);
  const match=/^data:([^;]+);base64,([a-z0-9+/=]+)$/i.exec(String(item.dataUrl||""));
  if(!match||!ALLOWED.has(match[1])||!ALLOWED.has(item.mime)||item.mime!==match[1])
    throw error(415,"Формат файла не поддерживается.");
  const bytes=Buffer.from(match[2],"base64");
  if(!bytes.length||bytes.length>PER_FILE_LIMIT)throw error(413,"Один файл должен быть не больше 6 МБ.");
  const mime=item.mime;
  const ok=mime==="image/png"?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    :mime==="image/jpeg"?bytes[0]===255&&bytes[1]===216&&bytes[2]===255
    :mime==="image/webp"?bytes.toString("ascii",0,4)==="RIFF"&&bytes.toString("ascii",8,12)==="WEBP"
    :mime==="application/pdf"?bytes.toString("ascii",0,5)==="%PDF-"
    :mime.includes("wordprocessingml")?bytes.toString("ascii",0,2)==="PK"
    :true;
  if(!ok)throw error(415,"Файл не соответствует выбранному формату.");
  return {name,mime,bytes};
}
export async function messagesWithAttachments(messages,attachments){
  if(attachments===undefined||attachments===null||attachments.length===0)return messages;
  if(!Array.isArray(attachments)||attachments.length>3)throw error(400,"Можно прикрепить не более трёх файлов.");
  if(!messages.length||messages.at(-1).role!=="user")throw error(400,"Вложения должны относиться к сообщению пользователя.");
  const notes=[],images=[];
  for(const item of attachments){
    const {name,mime,bytes}=decodeFile(item);
    if(mime.startsWith("image/")){
      if(images.length>=MAX_IMAGES)throw error(400,"Слишком много изображений.");
      if(bytes.length>3*1024*1024)throw error(413,"Сожми фотографию до 3 МБ.");
      images.push({type:"image_url",image_url:{url:"data:"+mime+";base64,"+bytes.toString("base64")}});
      notes.push("Прикреплена фотография: "+name);
    }else{
      let content="";
      try{
        if(mime==="application/pdf"){
          const pdf=(await import("pdf-parse")).default;
          const parsed=await pdf(bytes,{max:12});
          content=parsed.text||"";
        }else if(mime.includes("wordprocessingml")){
          const mammoth=(await import("mammoth")).default;
          content=(await mammoth.extractRawText({buffer:bytes})).value||"";
        }else{content=bytes.toString("utf8")}
      }catch{throw error(422,"Не удалось прочитать документ «"+name+"». Проверь, что он не защищён паролем.");}
      if(!content.trim())throw error(422,"В документе «"+name+"» не найден текст. Для сканированного PDF пока требуется OCR.");
      notes.push("Текст документа «"+name+"»:\n"+content.slice(0,11000));
    }
  }
  const result=messages.map(m=>({...m}));
  const last=result.at(-1);
  const prompt=[last.content.trim()||"Пожалуйста, проанализируй вложения.",...notes].join("\n\n");
  last.content=images.length?[{type:"text",text:prompt},...images]:prompt;
  return result;
}
export async function handleImageRequest(req,res){
  if(!mediaCors(req,res))return;
  if(req.method!=="POST")return reply(res,405,{error:"Используй POST."});
  const key=process.env.API_MARKET_IMAGE_KEY||process.env.API_MARKET_KEY;
  if(!key)return reply(res,503,{error:"Не задан API_MARKET_IMAGE_KEY в Render Environment."});
  const ip=String(req.headers["x-forwarded-for"]||req.socket?.remoteAddress||"unknown").split(",")[0];
  const now=Date.now();
  const recent=(imageHits.get(ip)||[]).filter(t=>now-t<600000);
  if(recent.length>=3)return reply(res,429,{error:"Не больше трёх изображений за 10 минут."});
  if(now-imageDay>86400000){imageDay=now;imageTotal=0;}
  if(imageTotal>=16)return reply(res,429,{error:"Дневной лимит генераций достигнут."});
  if(inFlight>=2)return reply(res,429,{error:"Генератор занят, попробуй повторить запрос."});
  let payload;
  try{payload=await readJsonLimited(req,12000)}catch(e){return reply(res,e.status||400,{error:e.message})}
  const prompt=String(payload.prompt||"").trim();
  if(prompt.length<3||prompt.length>1300)return reply(res,400,{error:"Опиши изображение (от 3 до 1300 символов)."});
  const styles={realism:"Фотореалистичное изображение с естественным освещением, без надписей.",
    art:"Художественная иллюстрация с продуманной композицией, без надписей.",
    "3d":"Премиальный детализированный 3D-рендер, без надписей.",
    animation:"Статичный выразительный кадр в стиле качественной анимации, без надписей."};
  const style=styles[payload.style]||styles.realism;
  recent.push(now);imageHits.set(ip,recent);imageTotal++;inFlight++;
  try{
    const upstream=await fetch("https://api-market1.shop/v1/images/generations",{
      method:"POST",
      headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},
      body:JSON.stringify({model:"nano-banana-2.1",prompt:prompt+"\n"+style,size:"1024x1024",n:1,response_format:"b64_json"}),
      signal:AbortSignal.timeout(115000)
    });
    const body=await upstream.json().catch(()=>null);
    if(!upstream.ok){
      const msg=String(body?.error?.message||body?.error||"").slice(0,220)
        .replaceAll(key,"[ключ скрыт]").replace(/sk-[a-z0-9_-]{6,}/gi,"[ключ скрыт]");
      console.warn("PLUX IMAGE upstream",upstream.status);
      return reply(res,502,{error:"Nano Banana: HTTP "+upstream.status+". "+(msg||"Проверь ключ и доступ к модели.")});
    }
    const first=body?.data?.[0];
    if(typeof first?.b64_json==="string"&&/^[a-z0-9+/]+={0,2}$/i.test(first.b64_json)&&first.b64_json.length<24000000){
      const imageBytes=Buffer.from(first.b64_json,"base64");
      const kind=imageBytes[0]===255&&imageBytes[1]===216?"image/jpeg":imageBytes[0]===137&&imageBytes[1]===80?"image/png":imageBytes.toString("ascii",0,4)==="RIFF"?"image/webp":null;
      if(!kind)return reply(res,502,{error:"Модель вернула неподдерживаемый формат изображения."});
      return reply(res,200,{image:"data:"+kind+";base64,"+first.b64_json,model:"nano-banana-2.1"});
    }
    if(typeof first?.url==="string"){
      let u;try{u=new URL(first.url)}catch{}
      if(u?.protocol==="https:"&&!u.username&&!u.password&&!["localhost","127.0.0.1"].includes(u.hostname))
        return reply(res,200,{url:u.toString(),model:"nano-banana-2.1"});
    }
    return reply(res,502,{error:"Nano Banana не вернула изображение. Проверь формат ответа модели."});
  }catch(e){return reply(res,502,{error:e?.name==="TimeoutError"?"Истекло время генерации. Проверь баланс — запрос мог быть оплачен.":"Нет связи с API Market."})}
  finally{inFlight--;}
}
