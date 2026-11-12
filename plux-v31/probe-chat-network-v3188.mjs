import assert from "node:assert/strict";
const API="https://pluh-voice-demo.onrender.com",origin="https://plux-v17-friends-preview.onrender.com";
async function request(path,method,body,timeout=80000){
 const started=Date.now();
 const headers={Origin:origin,Accept:"application/json"};
 if(method==="POST"||method==="OPTIONS")headers["Content-Type"]="application/json";
 if(method==="OPTIONS"){
  headers["Access-Control-Request-Method"]="POST";
  headers["Access-Control-Request-Headers"]="content-type";
 }
 try{
  const r=await fetch(API+path,{method,headers,signal:AbortSignal.timeout(timeout),
   body:body===undefined?undefined:JSON.stringify(body)});
  const t=(await r.text()).slice(0,700);
  const cors=r.headers.get("access-control-allow-origin");
  const result={path,method,status:r.status,cors,allowHeaders:r.headers.get("access-control-allow-headers"),
    allowMethods:r.headers.get("access-control-allow-methods"),elapsed:Date.now()-started,text:t};
  console.log("PLUX_NET "+JSON.stringify(result));
  return result;
 }catch(e){console.log("PLUX_NET_FAIL "+JSON.stringify({path,method,error:String(e?.message||e),elapsed:Date.now()-started,cause:String(e?.cause?.message||"")}));throw e}
}
const health=await request("/api/health","GET",undefined,85000);
assert.equal(health.status,200);
const preflight=await request("/api/chat","OPTIONS",undefined,30000);
assert.equal(preflight.status,204);
assert.equal(preflight.cors,origin);
assert.match(preflight.allowHeaders||"",/content-type/i);
const malformed=await request("/api/chat","POST",{messages:[]},30000);
assert.equal(malformed.status,400);
assert.equal(malformed.cors,origin);
const statusPreflight=await request("/api/generation/status?id=not-real","OPTIONS",undefined,30000);
assert.equal(statusPreflight.status,204);
assert.equal(statusPreflight.cors,origin);
const badStatus=await request("/api/generation/status?id=not-real","GET",undefined,30000);
assert.equal(badStatus.status,404);
assert.equal(badStatus.cors,origin);
console.log("PLUX_NET_PROBE_PASS "+JSON.stringify({health:health.status,preflight:preflight.status,malformed:malformed.status,status:badStatus.status}));
