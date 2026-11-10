/* PLUX V30 · Real image delivery as an expiring HTTPS media URL.
 * This avoids injecting multi-megabyte Base64 strings into a mobile JSON
 * response. Save finished artwork to the device gallery before expiry.
 */
import {randomBytes} from "node:crypto";
const BASE="https://pluh-voice-demo.onrender.com";
const ORIGIN="https://plux-v12-2-2k-fixed.onrender.com";
const images=new Map();
const TTL=30*60*1000,MAX_FILES=12,MAX_TOTAL=68*1024*1024,MAX_FILE=13*1024*1024;
let bytesUsed=0;
function trim(){
 const now=Date.now();
 for(const [token,file] of images){
  if(now-file.at>TTL){bytesUsed-=file.data.length;images.delete(token)}
 }
 while(images.size>MAX_FILES||bytesUsed>MAX_TOTAL){
  const first=images.keys().next().value;
  if(!first)break;
  bytesUsed-=images.get(first).data.length;images.delete(first);
 }
}
function validImage(data,mime){
 if(data.length<1000||data.length>MAX_FILE)return false;
 if(mime==="image/png")return data[0]===0x89&&data[1]===0x50&&data[2]===0x4e;
 if(mime==="image/jpeg")return data[0]===0xff&&data[1]===0xd8;
 if(mime==="image/webp")return data.toString("ascii",0,4)==="RIFF"&&data.toString("ascii",8,12)==="WEBP";
 return false;
}
export function storeGeneratedImage(artifact){
 if(artifact?.type!=="image"||typeof artifact.dataUrl!=="string")return artifact;
 const match=/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(artifact.dataUrl);
 if(!match)throw Object.assign(new Error("Генератор вернул неподдерживаемое изображение."),{status:502});
 const data=Buffer.from(match[2],"base64");
 const mime=match[1];
 if(!validImage(data,mime))throw Object.assign(new Error("Получено повреждённое изображение."),{status:502});
 const token=randomBytes(32).toString("base64url");
 const filename=String(artifact.filename||"PLUX-image.png").replace(/[^\wА-Яа-я.\- ]/g,"").slice(0,100);
 images.set(token,{data,mime,filename,at:Date.now()});
 bytesUsed+=data.length;
 trim();
 const output={...artifact,url:BASE+"/api/download/image/"+token};
 delete output.dataUrl;
 return output;
}
export function sendGeneratedImage(req,res,pathname){
 if(!pathname.startsWith("/api/download/image/"))return false;
 const token=pathname.slice("/api/download/image/".length);
 if(!/^[A-Za-z0-9_-]{43}$/.test(token)){res.writeHead(404);res.end();return true}
 trim();
 const item=images.get(token);
 if(!item){res.writeHead(404,{"Cache-Control":"no-store"});res.end("Ссылка на изображение истекла.");return true}
 const origin=String(req.headers.origin||"");
 if(origin===ORIGIN)res.setHeader("Access-Control-Allow-Origin",ORIGIN);
 res.setHeader("Vary","Origin");
 res.setHeader("Cache-Control","private, max-age=120");
 res.setHeader("X-Content-Type-Options","nosniff");
 res.setHeader("Cross-Origin-Resource-Policy","cross-origin");
 const u=new URL(req.url||"/","http://localhost");
 const download=u.searchParams.has("download");
 const asciiName=item.filename.replace(/[^a-zA-Z0-9._-]/g,"_")||"PLUX-image.png";
 res.setHeader("Content-Disposition",(download?"attachment":"inline")+'; filename="'+asciiName+'"');
 res.setHeader("Content-Type",item.mime);
 res.setHeader("Content-Length",String(item.data.length));
 if(req.method==="HEAD"){res.writeHead(200);res.end();return true}
 if(req.method!=="GET"){res.writeHead(405);res.end();return true}
 res.writeHead(200);res.end(item.data);
 return true;
}
export const _imageCacheStats=()=>({count:images.size,bytesUsed});
