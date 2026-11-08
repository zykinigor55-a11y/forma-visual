import test from 'node:test';
import assert from 'node:assert/strict';
import {apiMarketEdit,parseImageReply,sanitizeProviderError,API_MARKET_ENDPOINT} from '../api-market.mjs';
const png=Buffer.concat([Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),Buffer.alloc(190)]);
const jpeg=Buffer.concat([Buffer.from([0xff,0xd8,0xff]),Buffer.alloc(190)]);
const source=()=>new Blob([png],{type:'image/png'});

test('edits endpoint sends source image, prompt, model and high quality - never key in body',async()=>{
 let called=false;
 const fakeFetch=async (url,init)=>{
  called=true;assert.equal(url,API_MARKET_ENDPOINT);assert.equal(init.method,'POST');
  assert.equal(init.headers.Authorization,'Bearer PRIVATE_TEST_KEY');
  assert.equal(init.body.get('model'),'nano-banana-2.1');
  assert.equal(init.body.get('prompt'),'Keep geometry unchanged');
  assert.equal(init.body.get('quality'),'high');
  assert.equal(init.body.get('response_format'),'b64_json');
  assert.equal(init.body.get('n'),'1');
  assert.equal(init.body.getAll('image').length,1);
  assert.equal(init.body.getAll('image[]').length,0);
  assert(!String([...init.body.entries()]).includes('PRIVATE_TEST_KEY'));
  return new Response(JSON.stringify({data:[{b64_json:png.toString('base64')}]}),{status:200,headers:{'Content-Type':'application/json'}});
 };
 const result=await apiMarketEdit({apiKey:'PRIVATE_TEST_KEY',source:source(),prompt:'Keep geometry unchanged',fetchImpl:fakeFetch});
 assert.equal(result.mimeType,'image/png');assert.equal(result.b64,png.toString('base64'));assert(called);
});
test('multiple visual references are sent in documented image[] file collection',async()=>{
 let count=0;
 const fakeFetch=async (url,init)=>{
  count=init.body.getAll('image[]').length;
  return new Response(JSON.stringify({data:[{b64_json:jpeg.toString('base64')}]}),{status:200});
 };
 const r=await apiMarketEdit({apiKey:'dummy',source:source(),reference:source(),material:source(),mask:source(),prompt:'Change masked zone',fetchImpl:fakeFetch});
 assert.equal(count,4);assert.equal(r.mimeType,'image/jpeg');
});
test('errors are user safe (no response body or secrets returned)',async()=>{
 assert.match(sanitizeProviderError(401,{error:{message:'secret leaked'}}),/ключ/);
 await assert.rejects(()=>apiMarketEdit({apiKey:'dummy',source:source(),prompt:'x',fetchImpl:async()=>new Response(JSON.stringify({error:{message:'private token abc'}}),{status:403})}),/ключ доступа/);
});
test('unexpected URL schemes are rejected',async()=>{
 await assert.rejects(()=>parseImageReply({data:[{url:'http://127.0.0.1/internal'}]}),/небезопасный/);
});
test('empty responses are rejected',async()=>{await assert.rejects(()=>parseImageReply({data:[]}),/не вернул/)});
