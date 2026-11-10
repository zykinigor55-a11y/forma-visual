import assert from "node:assert/strict";
import {handleCyhub} from "./cyhub-voice-v15.mjs";
const origin="https://plux-v12-2-2k-fixed.onrender.com";
const probe=async (url,method,requestOrigin)=>{
  const state={status:null,headers:{},body:null};
  const req={url,method,headers:{origin:requestOrigin},socket:{remoteAddress:"127.0.0.1"}};
  const res={
    setHeader:(k,v)=>state.headers[k]=v,
    writeHead:(code,headers)=>{state.status=code;Object.assign(state.headers,headers||{})},
    end:body=>{state.body=body||""}
  };
  const handled=await handleCyhub(req,res);
  return {handled,...state};
};
const denied=await probe("/api/tts/config","GET","https://bad.example");
assert.equal(denied.handled,true);assert.equal(denied.status,403);
const preflight=await probe("/api/tts/start","OPTIONS",origin);
assert.equal(preflight.status,204);
assert.equal(preflight.headers["Access-Control-Allow-Origin"],origin);
const config=await probe("/api/tts/config","GET",origin);
assert.equal(config.status,200);
const body=JSON.parse(config.body);
assert.equal(typeof body.configured,"boolean");
assert.equal(body.model,"elevenlabs");
const wrong=await probe("/api/tts/config","POST",origin);
assert.equal(wrong.status,405);
console.log("PLUX V15 Cyhub route/CORS smoke tests passed");
