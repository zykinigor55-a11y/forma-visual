import assert from "node:assert/strict";
import {videoSettings,handleCyhubVideo,parseUploadedPhoto} from "./cyhub-video-v16.mjs";
const params=videoSettings({prompt:"Зелёная стеклянная капля улыбается",duration:1,aspectRatio:"16:9"});
assert.equal(params.model,"grok_video");
assert.equal(params.settings.model,"grok_lite");
assert.equal(params.settings.mode,"text_to_video");
assert.equal(params.settings.duration,1);
assert.equal(params.settings.quality,"480p");
assert.equal(params.settings.aspect_ratio,"16:9");
for(const duration of [0,-1,16,1.4,"nan"]){
 assert.throws(()=>videoSettings({prompt:"Премиальный дом в сосновом лесу",duration,aspectRatio:"16:9"}));
}
for(const aspectRatio of ["21:9","4:3","bad"]){
 assert.throws(()=>videoSettings({prompt:"Премиальный дом в сосновом лесу",duration:5,aspectRatio}));
}
assert.throws(()=>videoSettings({prompt:" "}));
const headers={origin:"https://plux-v12-2-2k-fixed.onrender.com"};
const req={url:"/api/video/config",method:"GET",headers};
let status=0,content="";
const res={setHeader(){},writeHead(code){status=code},end(data){content=String(data||"")}};
await handleCyhubVideo(req,res);
assert.equal(status,200);
const cfg=JSON.parse(content);
assert.equal(cfg.model,"grok_video");
assert.equal(cfg.variant,"grok_lite");
assert.equal(typeof cfg.configured,"boolean");
console.log("PLUX V16 video smoke tests passed: pricing-safe payload, bounds, config");

const imagePayload=videoSettings({prompt:"Камера плавно приближается к дому",duration:5,aspectRatio:"16:9"},"https://files.cyhub.ai/example-first-frame.jpg");
assert.equal(imagePayload.model,"grok_video");
assert.equal(imagePayload.settings.mode,"image_to_video");
assert.equal(imagePayload.settings.model,"grok_lite");
assert.deepEqual(imagePayload.settings.image_urls,["https://files.cyhub.ai/example-first-frame.jpg"]);
assert.equal(Object.hasOwn(imagePayload.settings,"aspect_ratio"),false);
assert.equal(imagePayload.settings.quality,"480p");
assert.equal(cfg.supportsImageToVideo,true);
console.log("PLUX V17 image-to-video smoke test passed");


// Android gallery may advertise JPEG bytes as PNG, and vice versa.
// Verify the real bytes take priority; this test creates NO chargeable task.
const pngMagic=Buffer.from([137,80,78,71,13,10,26,10]);
const pngBytes=Buffer.concat([pngMagic,Buffer.alloc(400)]);
const pngWrongLabel=parseUploadedPhoto("data:image/jpeg;base64,"+pngBytes.toString("base64"));
assert.equal(pngWrongLabel.mime,"image/png");
assert.equal(pngWrongLabel.extension,"png");
assert.equal(pngWrongLabel.bytes.byteLength,pngBytes.byteLength);
const jpgBytes=Buffer.concat([Buffer.from([255,216,255,224,0,16]),Buffer.alloc(330),Buffer.from([255,217])]);
const jpgWrongLabel=parseUploadedPhoto("data:image/png;base64,"+jpgBytes.toString("base64"));
assert.equal(jpgWrongLabel.mime,"image/jpeg");
assert.equal(jpgWrongLabel.extension,"jpg");
const webpBytes=Buffer.concat([Buffer.from("RIFF"),Buffer.from([0,0,0,0]),Buffer.from("WEBP"),Buffer.alloc(400)]);
const webp=parseUploadedPhoto("data:image/webp;base64,"+webpBytes.toString("base64"));
assert.equal(webp.mime,"image/webp");
assert.throws(()=>parseUploadedPhoto("data:image/png;base64,"+Buffer.alloc(330).toString("base64")));
// Data URLs sometimes contain harmless line wrapping from browser plugins.
const withWhitespace=parseUploadedPhoto("data:image/jpeg;base64,"+jpgBytes.toString("base64").replace(/.{72}/g,"$&\n"));
assert.equal(withWhitespace.mime,"image/jpeg");
console.log("PLUX V19 gallery file smoke tests passed: PNG/JPEG/WebP and mislabeled MIME");

/* V31 source-upload diagnostic: valid photo upload is free and must
 * return the sourceId required by the subsequent no-charge /price call.
 * This mock makes no real Cyhub API call. */
const originalFetch=globalThis.fetch;
const formerKey=process.env.CYHUB_API_KEY;
process.env.CYHUB_API_KEY="test-cyhub-video-key";
try{
 let requests=0;
 globalThis.fetch=async (url,opts)=>{
  assert.equal(url,"https://api.cyhub.ai/v1/files");
  assert.equal(opts.method,"POST");
  assert.equal(opts.body.constructor.name,"FormData");
  requests++;
  return new Response(JSON.stringify({url:"https://files.cyhub.ai/test-frame.png",id:"mock-source"}),{
    status:200,headers:{"content-type":"application/json"}
  });
 };
 const payload=Buffer.from(JSON.stringify({dataUrl:"data:image/png;base64,"+pngBytes.toString("base64")}));
 const request={
   method:"POST",url:"/api/video/source",
   headers:{origin:"https://plux-v12-2-2k-fixed.onrender.com","content-length":String(payload.length)},
   socket:{remoteAddress:"127.0.0.1"},
   async *[Symbol.asyncIterator](){yield payload}
 };
 let sourceStatus=0,sourceContent="";
 const sourceRes={headers:{},setHeader(k,v){this.headers[k]=v},writeHead(code){sourceStatus=code},end(data){sourceContent=String(data||"")}};
 await handleCyhubVideo(request,sourceRes);
 assert.equal(sourceStatus,201,sourceContent);
 assert.equal(requests,1);
 assert.match(JSON.parse(sourceContent).sourceId,/^[0-9a-f-]{36}$/);
 console.log("PLUX V31 Cyhub first-frame upload route verified without paid generation");
}finally{
 globalThis.fetch=originalFetch;
 if(formerKey===undefined)delete process.env.CYHUB_API_KEY;
 else process.env.CYHUB_API_KEY=formerKey;
}
