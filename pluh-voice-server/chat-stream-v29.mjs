/* PLUX V29: stream plain-text conversation over a simple NDJSON transport.
 * Keep GPT Image 2/PDF routes as real generation jobs. No keys, prompts or
 * chat messages are stored in telemetry.
 */
const ORIGIN="https://plux-v12-2-2k-fixed.onrender.com";
function safeError(text){
 const t=String(text||"Сервис ИИ временно не отвечает.").slice(0,450);
 if(/rate.limit|too many|quota|429|balance|credits/i.test(t))return "Сервис достиг лимита запросов. Повтори попытку позже.";
 if(/timeout|aborted|deadline/i.test(t))return "Модель отвечает слишком долго. Попробуй повторить запрос.";
 return "Не удалось получить ответ от сервиса ИИ. Попробуй ещё раз.";
}
const abbreviate=(s)=>String(s||"").trim().toLowerCase().replace(/[!?.,\s]+/g," ");
export function shortGreeting(messages){
 const last=String(messages.at(-1)?.content||"");
 if(last.length>35)return null;
 if(!/^(?:привет|приветик|здравствуй|здравствуйте|доброе утро|добрый день|добрый вечер|здорово|хай|hi|hello)[!\s.?]*$/i.test(last.trim()))return null;
 return "Привет! 👋 Я на связи. Чем займёмся сегодня?";
}
export async function streamPlainChat(req,res,{secret,messages}){
 res.setHeader("Access-Control-Allow-Origin",ORIGIN);
 res.setHeader("Access-Control-Expose-Headers","Content-Type");
 res.setHeader("Vary","Origin");
 res.setHeader("Cache-Control","no-store, no-transform");
 res.setHeader("X-Accel-Buffering","no");
 res.writeHead(200,{"Content-Type":"application/x-ndjson; charset=utf-8"});
 res.flushHeaders?.();
 let closed=false,complete=false;
 const abort=new AbortController();
 const safety=setTimeout(()=>abort.abort(),41000);
 res.once("close",()=>{closed=true;abort.abort()});
 const emit=value=>{if(!closed&&!res.writableEnded)res.write(JSON.stringify(value)+"\n")};
 // If Render or a slow cellular link delays upstream, the UI has already
 // received a valid response with an explicit waiting state.
 emit({type:"started",model:"gpt-6-luna"});
 let answer="";
 const started=Date.now();
 let firstDelta=null;
 const add=txt=>{
  if(typeof txt!=="string"||!txt||answer.length>=5000)return;
  txt=txt.slice(0,5000-answer.length);
  answer+=txt;
  if(firstDelta===null)firstDelta=Date.now()-started;
  emit({type:"delta",text:txt});
 };
 const greet=shortGreeting(messages);
 if(greet){
  add(greet);emit({type:"done"});
  console.log("PLUX chat",JSON.stringify({mode:"greeting",ms:Date.now()-started}));
  clearTimeout(safety);res.end();return;
 }
 try{
  const upstream=await fetch("https://api-market1.shop/v1/chat/completions",{
   method:"POST",
   headers:{"Content-Type":"application/json","Authorization":"Bearer "+secret,"Accept":"text/event-stream"},
   body:JSON.stringify({model:"gpt-6-luna",reasoning_effort:"none",stream:true,messages}),
   signal:abort.signal
  });
  if(!upstream.ok){
   const code=upstream.status;
   const body=(await upstream.text()).slice(0,700);
   console.warn("PLUX chat stream provider",JSON.stringify({status:code,reason:body.includes("reasoning_effort")?"reasoning_parameter":undefined}));
   emit({type:"error",message:code===429?"Лимит запросов к ИИ. Попробуй позже.":"Сервис ИИ временно не отвечает (HTTP "+code+")."});
   complete=true;return;
  }
  const ct=upstream.headers.get("content-type")||"";
  if(!/text\/event-stream/i.test(ct)){
   // Some upstream gateways silently disable streaming. Still return a valid
   // response without issuing a second (potentially paid) API request.
   const result=await upstream.json();
   const text=result?.choices?.[0]?.message?.content;
   if(typeof text==="string"&&text.trim())add(text);
  }else{
   const decoder=new TextDecoder(),reader=upstream.body.getReader();
   let buf="",done=false;
   while(!done){
    const {value,done:ended}=await reader.read();
    if(ended)break;
    buf+=decoder.decode(value,{stream:true});
    if(buf.length>100_000)throw Error("Provider SSE event too large");
    const lines=buf.split(/\r?\n/);buf=lines.pop()||"";
    for(const line of lines){
     if(!line.startsWith("data:"))continue;
     const item=line.slice(5).trim();
     if(item==="[DONE]"){done=true;break;}
     if(!item||item.charAt(0)!=="{")continue;
     try{
      const data=JSON.parse(item);
      const delta=data?.choices?.[0]?.delta?.content;
      if(typeof delta==="string")add(delta);
      else if(Array.isArray(delta))
       for(const piece of delta)if(piece?.type==="text"&&typeof piece.text==="string")add(piece.text);
     }catch{}
    }
    if(answer.length>=5000)break;
   }
   if(!answer&&buf.trim().startsWith("data:")){
    try{const v=JSON.parse(buf.trim().slice(5).trim());add(v?.choices?.[0]?.delta?.content)}catch{}
   }
  }
  if(!answer.trim())emit({type:"error",message:"Модель вернула пустой ответ. Попробуй ещё раз."});
  else{emit({type:"done"});complete=true}
 }catch(error){
  if(!closed)emit({type:"error",message:safeError(error?.message),partial:!!answer.trim()});
  console.warn("PLUX chat stream failed",JSON.stringify({name:String(error?.name||"Error").slice(0,45),ms:Date.now()-started,partial:!!answer}));
 }finally{
  clearTimeout(safety);
  if(!closed&&!res.writableEnded)res.end();
  console.log("PLUX chat latency",JSON.stringify({ms:Date.now()-started,firstDeltaMs:firstDelta,success:complete,chars:answer.length}));
 }
}
