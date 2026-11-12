import pptxgen from "pptxgenjs";
import {makeGptImage} from "./chat-artifacts-v14.mjs";
const clean=(x,n=500)=>String(x??"").replace(/[\u0000-\u001f]/g," ").trim().slice(0,n);
const fail=(message)=>Object.assign(new Error(message),{status:502});
function fromAttachments(messages){
 for(const m of [...messages].reverse()){
  if(!Array.isArray(m.content))continue;
  for(const part of m.content){
   const u=part?.image_url?.url;
   if(typeof u==="string"&&u.length<4300000&&/^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(u))return u;
  }
 }
 return null;
}
async function outline(prompt,messages,key){
 const context=messages.slice(-5).map(m=>typeof m.content==="string"?m.content:"[Вложения]").join("\n").slice(0,3000);
 const instructions='Подготовь презентацию на русском. Верни только JSON: {"title":"Название","subtitle":"Подзаголовок","slides":[{"title":"Тема","bullets":["Тезис 1","Тезис 2","Тезис 3"]}]}. Дай 4–6 слайдов, на каждом 2–4 конкретных тезиса, без вымышленных фактов.';
 const r=await fetch("https://api-market1.shop/v1/chat/completions",{
  method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},
  body:JSON.stringify({model:"gpt-6-luna",messages:[{role:"system",content:instructions},{role:"user",content:clean(prompt,1900)+"\n"+context}]}),
  signal:AbortSignal.timeout(80000)
 });
 const j=await r.json().catch(()=>null);
 if(!r.ok)throw fail("API Market не подготовил текст презентации (HTTP "+r.status+").");
 const raw=j?.choices?.[0]?.message?.content;
 if(typeof raw!=="string")throw fail("Модель не вернула текст для слайдов.");
 let data;try{data=JSON.parse(raw.slice(raw.indexOf("{"),raw.lastIndexOf("}")+1))}catch{throw fail("Не удалось разобрать содержание презентации.");}
 const slides=(Array.isArray(data.slides)?data.slides:[]).slice(0,6).map((s,i)=>({
  title:clean(s.title||"Слайд "+(i+1),90),
  bullets:(Array.isArray(s.bullets)?s.bullets:[]).map(v=>clean(v,155)).filter(Boolean).slice(0,4)
 })).filter(s=>s.bullets.length);
 if(slides.length<2)throw fail("Уточни тему презентации, материала для слайдов мало.");
 return {title:clean(data.title||prompt,120),subtitle:clean(data.subtitle,150),slides};
}
function illustration(){
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">'+
 '<rect width="1200" height="800" fill="#071f1d"/><circle cx="950" cy="410" r="265" fill="none" stroke="#42e7b8" stroke-width="3"/>'+
 '<circle cx="950" cy="410" r="174" fill="none" stroke="#b0ffe9" stroke-width="2" opacity=".7"/>'+
 '<circle cx="950" cy="410" r="70" fill="#40c59b"/><path d="M100 650 L350 400 L560 530 L770 280" fill="none" stroke="#76eac6" stroke-width="14"/>'+
 '</svg>';
 return "data:image/svg+xml;base64,"+Buffer.from(svg).toString("base64");
}
export async function makePresentation(prompt,messages,key,ip){
 if(!key)throw fail("Не настроен ключ API Market.");
 const data=await outline(prompt,messages,key);
 let visual=fromAttachments(messages),imageNote="";
 if(!visual){
  try{
   const img=await makeGptImage("Иллюстрация для презентации: "+clean(prompt,650)+". Без текста.",key,ip);
   if(typeof img?.dataUrl==="string"&&/^data:image\/(png|jpeg|webp);base64,/.test(img.dataUrl))visual=img.dataUrl;
  }catch(e){imageNote="GPT Image 2 не создала картинку: "+clean(e.message,90)}
 }
 if(!visual)visual=illustration();
 const pptx=new pptxgen();pptx.layout="LAYOUT_WIDE";pptx.author="PLUX";pptx.lang="ru-RU";
 const dark="061918",accent="53E6B8",white="F5FFFA",muted="A3CBBB";
 function base(title,index){
  const slide=pptx.addSlide();slide.background={color:dark};
  slide.addShape(pptx.ShapeType.rect,{x:0,y:0,w:.13,h:7.5,line:{color:accent,transparency:100},fill:{color:accent}});
  slide.addText("PLUX / PRESENTATION",{x:.66,y:.4,w:7.8,h:.28,fontSize:11,charSpacing:2,color:accent,bold:true,margin:0});
  slide.addText(String(index).padStart(2,"0"),{x:12,y:7.03,w:.5,h:.2,fontSize:9,color:muted,margin:0,align:"right"});
  if(title)slide.addText(title,{x:.7,y:1.05,w:11.7,h:.8,fontSize:28,bold:true,color:white,margin:0,fit:"shrink"});
  return slide;
 }
 let slide=base("",1);
 slide.addImage({data:visual,x:6.4,y:1.55,w:6.23,h:4.97});
 slide.addText(data.title,{x:.82,y:2.0,w:5.3,h:1.6,fontSize:33,bold:true,color:white,margin:0,fit:"shrink"});
 slide.addText(data.subtitle||"Подготовлено в ПЛЮХ",{x:.82,y:4.2,w:5.3,h:1,color:muted,fontSize:18,margin:0,fit:"shrink"});
 for(let i=0;i<data.slides.length;i++){
  const x=data.slides[i];slide=base(x.title,i+2);
  slide.addShape(pptx.ShapeType.rect,{x:.7,y:2.04,w:7.4,h:4.46,fill:{color:"10342D"},line:{color:"326452",width:.5}});
  x.bullets.forEach((b,j)=>{
   slide.addShape(pptx.ShapeType.ellipse,{x:.98,y:2.36+j*.99,w:.17,h:.17,fill:{color:accent},line:{color:accent}});
   slide.addText(b,{x:1.36,y:2.26+j*.99,w:6.4,h:.7,fontSize:17,color:white,margin:0,fit:"shrink",valign:"mid"});
  });
  slide.addImage({data:i%2?illustration():visual,x:8.36,y:2.04,w:4.25,h:4.46});
 }
 const buf=Buffer.from(await pptx.write({outputType:"nodebuffer",compression:true}));
 if(buf.length<3500||buf.length>16000000||buf.toString("ascii",0,2)!=="PK")throw fail("Ошибка при создании PPTX.");
 return {type:"presentation",mime:"application/vnd.openxmlformats-officedocument.presentationml.presentation",
  filename:"PLUX-Presentation-"+new Date().toISOString().slice(0,10)+".pptx",title:data.title,
  buffer:buf,slideCount:data.slides.length+1,note:imageNote};
}
