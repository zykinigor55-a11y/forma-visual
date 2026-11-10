/* PLUX V14: GPT Image 2 and Cyrillic PDF generation for chat. */
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const url="https://api-market1.shop/v1";
const hits=new Map();
let concurrent=0;
let dayStart=Date.now(),daily=0;
const err=(status,message)=>Object.assign(new Error(message),{status});
const clean=(x,max=5000)=>String(x??"").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g," ").slice(0,max).trim();
export function artifactIntent(text){
  const s=clean(text,2600).toLowerCase();
  if(!s||/(как|почему|расскажи|объясни|можно ли).{0,55}(сделать|создать|pdf|пдф|картин)/i.test(s))return null;
  if(/(напиши|составь|придумай).{0,16}промпт/i.test(s))return null;
  // Spoken/chat shorthand is an image request too: "Полосатая корова фото"
  // and "Фото полосатой коровы" must not go to a text model that fabricates
  // ChatGPT-internal estuary URLs or JSON image output.
  const action=/(сдела|созда|сгенериру|нарису|подготов|оформ|собер|состав|generate|create|draw|make)/i.test(s);
  const visual=/(изображени|картин|рисунк|рисунок|фото|фотографи|иллюстраци|обложк|постер|портрет|image|picture|photo)/i.test(s);
  const describe=/(?:^|\s)(?:фото|фотографи[яию]|картин[ау]|изображени[ея]|рисунок|портрет)\s+.{3,100}$|^.{3,100}\s+(?:фото|фотографи[яию]|картин[ау]|изображени[ея]|рисунок|портрет)$/i.test(s);
  const question=/(?:[?？]|^(?:где|когда|покажи|найди|что|кто|почему|зачем|можно|есть|скажи|оцени|опиши|сравни|проанализируй)\b)/i.test(s);
  if(/(пдф|pdf)/i.test(s)){
    // "Нужен пдф альбом", "Хочу PDF", "PDF доклад" are generation requests.
    const requested=/(?:^|\s)(?:нужен|нужна|нужно|хочу|подготовь|составь|пришли|собери|создай|сделай)(?=\s|$)/i.test(s);
    const shorthand=/^(?:пдф|pdf)[\s:,-]+(?:альбом|доклад|отч[её]т|сценарий|презентац|проект|документ)/i.test(s);
    return action||requested||shorthand?"pdf":null;
  }
  if((action&&visual)||(action&&/(?:нарису|нарисуй|draw)/i.test(s)))return "image";
  if(!question&&s.length<=125&&describe)return "image";
  return null;
}
function limit(ip){
  const now=Date.now();
  if(now-dayStart>86400000){dayStart=now;daily=0;hits.clear()}
  const old=(hits.get(ip)||[]).filter(x=>now-x<600000);
  if(old.length>=6||daily>=60||concurrent>=2)throw err(429,"Лимит защиты: до 6 генераций за 10 минут, 60 за день. Дождись окончания предыдущей задачи.");
  old.push(now);hits.set(ip,old);daily++;concurrent++;
}
function failure(response,data){
  const raw=data?.error?.message||data?.error||data?.message||"";
  const safe=(typeof raw==="string"?clean(raw,160):"").replace(/sk-[a-z0-9_-]{6,}/gi,"[ключ скрыт]");
  return "API Market HTTP "+response.status+". "+(safe||"Проверь доступ к модели и баланс.");
}
function mimeOf(bytes){
  if(bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e)return "image/png";
  if(bytes[0]===0xff&&bytes[1]===0xd8)return "image/jpeg";
  if(bytes.toString("ascii",0,4)==="RIFF"&&bytes.toString("ascii",8,12)==="WEBP")return "image/webp";
  return null;
}
export async function makeGptImage(prompt,key,ip){
  limit("image:"+ip);
  try{
    const upstream=await fetch(url+"/images/generations",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},
      body:JSON.stringify({model:"gpt-image-2",prompt:clean(prompt,1700),size:"1024x1024",n:1}),
      signal:AbortSignal.timeout(235000)
    });
    const result=await upstream.json().catch(()=>null);
    if(!upstream.ok)throw err(502,failure(upstream,result));
    const item=result?.data?.[0];
    if(typeof item?.b64_json==="string"&&item.b64_json.length<19_000_000){
      const bytes=Buffer.from(item.b64_json,"base64");
      const mime=mimeOf(bytes);
      if(!mime||bytes.length>13_500_000)throw err(502,"Генератор вернул неподдерживаемый файл.");
      const suffix=mime==="image/jpeg"?"jpg":mime.split("/")[1];
      return {type:"image",mime,filename:"PLUX-GPT-Image-2."+suffix,dataUrl:"data:"+mime+";base64,"+item.b64_json,model:"gpt-image-2"};
    }
    if(typeof item?.url==="string"){
      let target;try{target=new URL(item.url)}catch{}
      if(target?.hostname==="chatgpt.com"&&target.pathname.startsWith("/backend-api/"))
        throw err(502,"Провайдер вернул приватную ссылку ChatGPT вместо открытого изображения.");
      if(target?.protocol==="https:"&&!target.username&&!target.password)
        return {type:"image",mime:"image/png",filename:"PLUX-GPT-Image-2.png",url:target.href,model:"gpt-image-2"};
    }
    throw err(502,"GPT Image 2 не вернула изображение. Проверь формат ответа API Market.");
  }catch(e){if(e?.name==="TimeoutError")throw err(504,"Генерация заняла слишком много времени; запрос мог быть оплачен.");throw e}
  finally{concurrent--}
}
function structured(text){
  const input=clean(text,24000);
  const start=input.indexOf("{"),end=input.lastIndexOf("}");
  if(start>=0&&end>start){try{return JSON.parse(input.slice(start,end+1))}catch{}}
  return {title:"Документ ПЛЮХ",sections:[{heading:"Содержание",paragraphs:[input.slice(0,9000)]}]};
}
function normalize(doc){
  const sections=Array.isArray(doc?.sections)?doc.sections.slice(0,10).map((s,i)=>{
    const raw=Array.isArray(s?.paragraphs)?s.paragraphs:[s?.text];
    return {heading:clean(s?.heading||"Раздел "+(i+1),140),
      paragraphs:raw.filter(x=>typeof x==="string").map(p=>clean(p,2400)).filter(Boolean).slice(0,8)};
  }).filter(s=>s.paragraphs.length):[];
  if(!sections.length)sections.push({heading:"Содержание",paragraphs:["Материал для документа не подготовлен."]});
  return {title:clean(doc?.title||"Документ ПЛЮХ",130),subtitle:clean(doc?.subtitle||"",200),sections};
}
async function pdfContent(prompt,messages,key){
  const recent=messages.slice(-5).map(m=>{
    const s=typeof m.content==="string"?m.content
      :Array.isArray(m.content)?m.content.filter(p=>p?.type==="text").map(p=>p.text).join(" "):"";
    return (m.role==="user"?"Пользователь: ":"Ассистент: ")+clean(s,1500);
  }).join("\n");
  const instructions="Ты редактор ПЛЮХ. Подготовь связный, аккуратный русскоязычный PDF. "+
    "Отвечай только JSON: "+
    '{"title":"Название","subtitle":"Подзаголовок","sections":[{"heading":"Заголовок","paragraphs":["Абзац 1","Абзац 2"]}]}. '+
    "Создай 3–8 разделов с содержательными абзацами. Не придумывай источники и факты. Не вставляй markdown и ссылки на несуществующие файлы.";
  const response=await fetch(url+"/chat/completions",{
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},
    body:JSON.stringify({model:"gpt-6-luna",reasoning_effort:"none",max_completion_tokens:3000,temperature:0.3,messages:[
      {role:"system",content:instructions},
      {role:"user",content:"Задача: "+clean(prompt,1900)+"\nКонтекст:\n"+recent}
    ]}),
    signal:AbortSignal.timeout(80000)
  });
  const result=await response.json().catch(()=>null);
  if(!response.ok)throw err(502,failure(response,result));
  const content=result?.choices?.[0]?.message?.content;
  if(typeof content!=="string"||!content.trim())throw err(502,"Модель не подготовила текст для PDF.");
  return normalize(structured(content));
}
export async function buildRussianPdf(document){
  const pdfMake=require("pdfmake/build/pdfmake.js");
  const fonts=require("pdfmake/build/vfs_fonts.js");
  pdfMake.addVirtualFileSystem(fonts);
  const documentContent=[
    {text:"PLUX  /  ДОКУМЕНТ",fontSize:10,bold:true,color:"#147c64",margin:[0,0,0,24]},
    {text:document.title,fontSize:25,bold:true,color:"#11332c",margin:[0,0,0,10]},
    ...(document.subtitle?[{text:document.subtitle,fontSize:12,color:"#506a62",margin:[0,0,0,15]}]:[]),
    {canvas:[{type:"line",x1:0,y1:0,x2:484,y2:0,lineColor:"#16936d",lineWidth:2}],margin:[0,0,0,15]}
  ];
  for(const section of document.sections){
    documentContent.push({text:section.heading,fontSize:15,bold:true,color:"#135441",margin:[0,12,0,8]});
    for(const paragraph of section.paragraphs){
      documentContent.push({text:paragraph,fontSize:10.5,color:"#273c38",lineHeight:1.35,margin:[0,0,0,10]});
    }
  }
  const definition={pageSize:"A4",pageMargins:[53,57,53,57],defaultStyle:{font:"Roboto"},
    info:{title:document.title,author:"PLUX"},
    footer:(page,total)=>({text:"PLUX  •  "+page+" / "+total,alignment:"right",color:"#82908a",fontSize:8,margin:[0,19,50,0]}),
    content:documentContent};
  const bytes=await new Promise((resolve,reject)=>{
    try{pdfMake.createPdf(definition).getBuffer(buf=>resolve(Buffer.from(buf)))}catch(e){reject(e)}
  });
  if(bytes.toString("ascii",0,5)!=="%PDF-"||bytes.length>8_000_000)throw err(502,"Не удалось подготовить PDF.");
  return bytes;
}
export async function makePdf(prompt,messages,key,ip){
  limit("pdf:"+ip);
  try{
    const document=await pdfContent(prompt,messages,key);
    const bytes=await buildRussianPdf(document);
    return {type:"pdf",mime:"application/pdf",
      filename:"PLUX-"+new Date().toISOString().slice(0,10)+".pdf",
      title:document.title,dataUrl:"data:application/pdf;base64,"+bytes.toString("base64")};
  }finally{concurrent--}
}
