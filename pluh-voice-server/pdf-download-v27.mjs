/* PLUX V27 PDF: unguessable temporary direct HTTPS download for Android. */
import {randomBytes} from "node:crypto";
const FILES=new Map(),ORIGIN="https://pluh-voice-demo.onrender.com",TTL=20*60*1000;
function cleanup(){
 const now=Date.now();
 for(const [key,item] of FILES)if(item.expires<now)FILES.delete(key);
 while(FILES.size>10)FILES.delete(FILES.keys().next().value);
}
export function storeGeneratedPdf(artifact){
 if(artifact?.type!=="pdf"||typeof artifact.dataUrl!=="string")throw Error("Invalid generated PDF");
 const match=/^data:application\/pdf;base64,([A-Za-z0-9+/=]+)$/.exec(artifact.dataUrl);
 if(!match)throw Error("Invalid PDF content type");
 const bytes=Buffer.from(match[1],"base64");
 if(bytes.length<500||bytes.length>8_000_000||bytes.subarray(0,5).toString()!=="%PDF-")throw Error("Invalid PDF");
 cleanup();
 const token=randomBytes(32).toString("base64url");
 const filename=String(artifact.filename||"PLUX-document.pdf").replace(/[\\/<>:"|?*\x00-\x1f]/g,"").slice(0,100)||"PLUX-document.pdf";
 FILES.set(token,{bytes,filename,expires:Date.now()+TTL});
 cleanup();
 return ORIGIN+"/api/download/pdf/"+token;
}
export function sendGeneratedPdf(req,res,pathname){
 if(!pathname.startsWith("/api/download/pdf/"))return false;
 if(req.method!=="GET"&&req.method!=="HEAD"){
  res.writeHead(405,{"Allow":"GET, HEAD","Cache-Control":"no-store"});res.end();return true;
 }
 cleanup();
 const token=pathname.slice("/api/download/pdf/".length);
 if(!/^[A-Za-z0-9_-]{43}$/.test(token)||!FILES.has(token)){
  res.writeHead(404,{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store"});
  res.end("Срок ссылки истёк. Создай PDF в чате заново.");return true;
 }
 const item=FILES.get(token);
 const filename=item.filename.toLowerCase().endsWith(".pdf")?item.filename:item.filename+".pdf";
 res.writeHead(200,{
  "Content-Type":"application/pdf",
  "Content-Length":String(item.bytes.length),
  "Content-Disposition":"attachment; filename=\"PLUX-document.pdf\"; filename*=UTF-8''"+encodeURIComponent(filename),
  "Cache-Control":"private, no-store, max-age=0","Pragma":"no-cache",
  "X-Content-Type-Options":"nosniff","X-Robots-Tag":"noindex, nofollow",
  "Referrer-Policy":"no-referrer"
 });
 res.end(req.method==="HEAD"?undefined:item.bytes);
 return true;
}
