/* PLUX: short-lived, unguessable PowerPoint download token. */
import {randomBytes} from "node:crypto";
const docs=new Map();const TTL=25*60*1000;
const host="https://pluh-voice-demo.onrender.com";
function clean(){
 const now=Date.now();
 for(const [token,doc] of docs)if(doc.until<now)docs.delete(token);
 while(docs.size>9)docs.delete(docs.keys().next().value);
}
export function storePresentation(artifact){
 const bytes=artifact?.buffer;
 if(artifact?.type!=="presentation"||!Buffer.isBuffer(bytes)||bytes.length<3500||bytes.length>16000000
   ||bytes.toString("ascii",0,2)!=="PK")throw Error("Презентация не подготовлена.");
 clean();
 const token=randomBytes(32).toString("base64url");
 docs.set(token,{bytes,name:artifact.filename,until:Date.now()+TTL});
 const result={type:"presentation",mime:artifact.mime,title:artifact.title,
  filename:artifact.filename,slideCount:artifact.slideCount,url:host+"/api/download/presentation/"+token};
 clean();return result;
}
export function servePresentation(req,res,path){
 if(!path.startsWith("/api/download/presentation/"))return false;
 if(!["GET","HEAD"].includes(req.method)){res.writeHead(405);res.end();return true}
 clean();
 const token=path.split("/").at(-1);
 const doc=/^[A-Za-z0-9_-]{43}$/.test(token||"")?docs.get(token):null;
 if(!doc){res.writeHead(404,{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store"});res.end("Время хранения файла истекло. Создай презентацию снова.");return true}
 res.writeHead(200,{
  "Content-Type":"application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "Content-Length":String(doc.bytes.length),
  "Content-Disposition":'attachment; filename="PLUX-Presentation.pptx"',
  "Cache-Control":"private,no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"
 });
 res.end(req.method==="HEAD"?undefined:doc.bytes);return true;
}
