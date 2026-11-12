/* No paid requests. Tests secure caller-known job IDs survive response loss. */
import assert from "node:assert/strict";
import {beginGenerationJob,handleGenerationJobStatus} from "./generation-jobs-v28.mjs";
const id="R".repeat(32),ip="plux-v3188-test",prompt="Тестовое изображение без генерации";
let upstreamCalls=0;
globalThis.fetch=async()=>{
 upstreamCalls++;
 return {ok:false,status:402,headers:new Headers({"content-type":"application/json"}),
  json:async()=>({error:{message:"Mock provider — no paid generation"}})};
};
const req={kind:"image",prompt,messages:[{role:"user",content:prompt}],
 secret:"mock-key",imageKey:"mock-key",ip,clientJobId:id};
assert.throws(()=>beginGenerationJob({...req,clientJobId:"bad"}),/Некорректный/);
const first=beginGenerationJob(req);
assert.equal(first.id,id);
assert.equal(first.state,"working");
const second=beginGenerationJob(req);
assert.equal(second.id,id,"same request ID returns same job");
assert.throws(()=>beginGenerationJob({...req,prompt:"Другая картинка"}),/другого запроса/);
await new Promise(resolve=>setTimeout(resolve,75));
const third=beginGenerationJob(req);
assert.equal(third.id,id,"same request after provider fail never issues another paid generation");
assert.equal(upstreamCalls,1,"just one provider request, even with three POST attempts");
const headers={};
const response={setHeader:(k,v)=>headers[k]=v,writeHead(s,h)=>{response.code=s;Object.assign(headers,h||{})},
 end:body=>{response.body=body}};
const query={url:"/api/generation/status?id="+id,method:"GET",headers:{origin:"https://plux-v17-friends-preview.onrender.com"}};
handleGenerationJobStatus(query,response,"/api/generation/status");
assert.equal(response.code,200);
const status=JSON.parse(response.body);
assert.equal(status.id,id);
assert.equal(status.state,"failed");
assert.equal(headers["Access-Control-Allow-Origin"],"https://plux-v17-friends-preview.onrender.com");
console.log("PLUX3188_JOB_RECOVERY_PASS "+JSON.stringify({sameToken:true,paidCalls:0,upstreamMockCalls:upstreamCalls,jobState:status.state}));
