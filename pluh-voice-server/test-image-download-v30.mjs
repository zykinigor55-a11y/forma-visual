import assert from "node:assert/strict";
import {storeGeneratedImage,sendGeneratedImage,_imageCacheStats} from "./image-download-v30.mjs";
const signature=Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
const pixels=Buffer.concat([signature,Buffer.alloc(1300)]);
const result=storeGeneratedImage({
 type:"image",mime:"image/png",filename:"PLUX-GPT-Image-2.png",
 model:"gpt-image-2",dataUrl:"data:image/png;base64,"+pixels.toString("base64")
});
assert.ok(result.url.startsWith("https://pluh-voice-demo.onrender.com/api/download/image/"));
assert.equal(result.dataUrl,undefined);
assert.equal(result.type,"image");
assert.equal(_imageCacheStats().count,1);
const u=new URL(result.url);
class Response{
 constructor(){this.headers={};this.body=null;this.status=0;}
 setHeader(name,value){this.headers[name]=value;}
 writeHead(status,headers){this.status=status;Object.assign(this.headers,headers||{});}
 end(body){this.body=body;}
}
let res=new Response();
assert.equal(sendGeneratedImage({method:"GET",url:u.pathname,headers:{origin:"https://plux-v12-2-2k-fixed.onrender.com"}},res,u.pathname),true);
assert.equal(res.status,200);
assert.ok(res.body.equals(pixels));
assert.equal(res.headers["Access-Control-Allow-Origin"],"https://plux-v12-2-2k-fixed.onrender.com");
assert.equal(res.headers["Content-Type"],"image/png");
res=new Response();
assert.equal(sendGeneratedImage({method:"GET",url:u.pathname+"?download=1",headers:{}},res,u.pathname),true);
assert.equal(res.status,200);
assert.ok(res.headers["Content-Disposition"].startsWith("attachment"));
res=new Response();
const invalid="/api/download/image/"+("z".repeat(43));
sendGeneratedImage({method:"GET",url:invalid,headers:{}},res,invalid);
assert.equal(res.status,404);
console.log("PLUX V30 generated image HTTPS delivery smoke test passed.");
