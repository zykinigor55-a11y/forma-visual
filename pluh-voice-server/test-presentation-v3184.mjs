import assert from "node:assert/strict";
import {makePresentation} from "./presentation-v3184.mjs";
import {storePresentation} from "./presentation-download-v3184.mjs";
import {artifactIntent} from "./chat-artifacts-v14.mjs";
assert.equal(artifactIntent("Сделай мне презентацию про архитектуру"),"presentation");
assert.equal(artifactIntent("Подготовь PowerPoint слайды"),"presentation");
assert.equal(artifactIntent("Как сделать презентацию?"),null);
const base64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==";
const photo="data:image/png;base64,"+base64;
let calls=0;
globalThis.fetch=async(url,opts)=>{
 calls++;
 assert(String(url).includes("/chat/completions"));
 return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({
  title:"Современная архитектура",subtitle:"Концепция жилого дома",
  slides:[
   {title:"Идея",bullets:["Пропорции и объём","Освещение и материалы"]},
   {title:"Планирование",bullets:["Функциональные связи","Логика перемещений"]},
   {title:"Материалы",bullets:["Натуральное дерево","Металл и стекло"]},
   {title:"Итог",bullets:["Точная геометрия","Высокое качество деталей"]}
  ]
 })}}]}),{status:200,headers:{"Content-Type":"application/json"}});
};
const m=[{role:"user",content:[{type:"text",text:"Сделай презентацию про дом"},{type:"image_url",image_url:{url:photo}}]}];
const output=await makePresentation("Сделай мне презентацию о доме",m,"TEST_KEY","127.0.0.1");
assert.equal(calls,1,"provided photo must avoid extra paid image call");
assert.equal(output.type,"presentation");
assert.equal(output.slideCount,5);
assert(output.buffer.length>3500);
assert.equal(output.buffer.subarray(0,2).toString(),"PK");
const stored=storePresentation(output);
assert(/^https:\/\/pluh-voice-demo\.onrender\.com\/api\/download\/presentation\/[A-Za-z0-9_-]{43}$/.test(stored.url));
assert(!("buffer" in stored));
console.log("PLUX V31.8.4 PPTX smoke passed: "+output.buffer.length+" bytes, "+output.slideCount+" slides");
