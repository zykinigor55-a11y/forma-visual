/* PLUX V28 — nonblocking real image/PDF generation.
 * Long GPT Image 2 requests can exceed the phone's HTTP timeout. Return
 * an opaque job id immediately and poll without starting another paid request.
 */
import {randomBytes,createHash} from "node:crypto";
import {makeGptImage,makePdf} from "./chat-artifacts-v14.mjs";
import {storeGeneratedPdf} from "./pdf-download-v27.mjs";
import {storeGeneratedImage} from "./image-download-v30.mjs";

const ORIGIN="https://plux-v12-2-2k-fixed.onrender.com";
const TTL=18*60*1000,MAX_JOBS=8,MAX_ACTIVE=3,MAX_PER_IP=2;
const jobs=new Map();
const failText=e=>{
 const status=Number(e?.status)||502;
 const value=String(e?.message||"Генератор временно недоступен.").slice(0,210);
 return {status,message:value.includes("API Market")?value:value};
};
function cleanup(){
 const now=Date.now();
 for(const [key,item] of jobs)
  if(item.updatedAt+TTL<now&&item.state!=="working")jobs.delete(key);
 if(jobs.size>MAX_JOBS){
  for(const [key,item] of jobs){
   if(jobs.size<=MAX_JOBS)break;
   if(item.state!=="working")jobs.delete(key);
  }
 }
}
function signature({kind,prompt,ip}){
 return createHash("sha256").update(kind+"\0"+ip+"\0"+String(prompt).trim().toLowerCase()).digest("hex");
}
export function beginGenerationJob({kind,prompt,messages,secret,imageKey,ip}){
 if(kind!=="image"&&kind!=="pdf")throw Object.assign(new Error("Неизвестный тип файла."),{status:400});
 cleanup();
 const sig=signature({kind,prompt,ip}),now=Date.now();
 // Deduplicate pending requests from the same device and prevent accidental
 // double charges if the client retries during a weak connection.
 for(const job of jobs.values()){
  if(job.signature===sig&&now-job.createdAt<TTL&&job.state!=="failed")
   return {id:job.id,kind:job.kind,state:job.state};
 }
 let active=0,activeForIp=0;
 for(const job of jobs.values())if(job.state==="working"){
  active++;if(job.ip===ip)activeForIp++;
 }
 if(active>=MAX_ACTIVE||activeForIp>=MAX_PER_IP){
  throw Object.assign(new Error("Генератор занят. Подожди завершения предыдущей задачи."),{status:429});
 }
 const id=randomBytes(24).toString("base64url");
 const job={id,kind,ip,signature:sig,state:"working",createdAt:now,updatedAt:now,result:null,error:null};
 jobs.set(id,job);
 // The task intentionally outlives the HTTP request. A status poll does not
 // reissue an upstream request, avoiding duplicate paid generations.
 void Promise.resolve().then(async()=>{
  try{
   let artifact=kind==="image"
    ?await makeGptImage(prompt,imageKey||secret,ip)
    :await makePdf(prompt,messages,secret,ip);
   if(kind==="image")artifact=storeGeneratedImage(artifact);
   if(kind==="pdf"){
    artifact.url=storeGeneratedPdf(artifact);
    // PDF is delivered as a genuine HTTPS download by Android DownloadManager.
    delete artifact.dataUrl;
   }
   job.result={reply:kind==="image"?"Создал изображение с GPT Image 2.":"Подготовил PDF-документ: "+artifact.title,artifact};
   job.state="complete";
  }catch(e){
   job.error=failText(e);job.state="failed";
   console.warn("PLUX generation job failed",JSON.stringify({kind,code:job.error.status,type:String(e?.name||"Error").slice(0,50)}));
  }finally{job.updatedAt=Date.now();cleanup()}
 });
 return {id,kind,state:"working"};
}
function json(res,status,payload){
 res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});
 res.end(JSON.stringify(payload));
}
export function handleGenerationJobStatus(req,res,pathname){
 if(pathname!=="/api/generation/status")return false;
 const origin=String(req.headers.origin||"");
 if(origin!==ORIGIN)return json(res,403,{error:"Недопустимый источник."});
 res.setHeader("Access-Control-Allow-Origin",ORIGIN);
 res.setHeader("Access-Control-Allow-Headers","Content-Type");
 res.setHeader("Access-Control-Allow-Methods","GET, OPTIONS");
 res.setHeader("Vary","Origin");
 if(req.method==="OPTIONS"){res.writeHead(204,{"Cache-Control":"no-store"});res.end();return true}
 if(req.method!=="GET")return json(res,405,{error:"Нужен GET."});
 cleanup();
 const u=new URL(req.url||"/","http://localhost"),id=u.searchParams.get("id")||"";
 if(!/^[A-Za-z0-9_-]{32}$/.test(id)||!jobs.has(id))return json(res,404,{error:"Задача не найдена или срок хранения результата истёк."});
 const job=jobs.get(id);
 // A high-entropy job identifier is the authorization token; do not expose
 // user prompts, API keys, or the other user's job list.
 if(job.state==="working")return json(res,200,{id,kind:job.kind,state:"working"});
 if(job.state==="failed")return json(res,200,{id,kind:job.kind,state:"failed",error:job.error?.message||"Ошибка генерации."});
 return json(res,200,{id,kind:job.kind,state:"complete",...job.result});
}
export function _jobTestStats(){return {size:jobs.size,active:[...jobs.values()].filter(j=>j.state==="working").length}}
