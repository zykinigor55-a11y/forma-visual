import assert from "node:assert/strict";
import {videoSettings,handleCyhubVideo} from "./cyhub-video-v16.mjs";
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
