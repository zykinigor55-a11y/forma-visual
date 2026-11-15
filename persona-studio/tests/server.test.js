'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {server,toBlob,checkRate,isReady,providerConfig,callImageAPI}=require('../server');
const {buildPrompt}=require('../src/prompt');
test('prompt describes user parameters, reference and garment',()=>{
  const text=buildPrompt({params:{age:45,height:187,faceWidth:25,skin:52,origin:'Армянская',teeth:'gap'},referenceImage:'x',clothingImage:'y',marks:[{type:'scar',x:300,y:360,strength:55}]});
  assert.match(text,/age 45/);assert.match(text,/height 187/);assert.match(text,/same recognizable individual/);assert.match(text,/garment photo/);assert.match(text,/50%, 50%/);assert.match(text,/Do not stereotype/);
});
test('specialized modes preserve identity and hairstyle reference does not copy face',()=>{
  const p=buildPrompt({mode:'hair',params:{age:39,hairStyle:'curly'},referenceImage:'x',hairImage:'y'});
  assert.match(p,/Change ONLY hair/);assert.match(p,/Do not transfer the hairstyle model/);
  const q=buildPrompt({mode:'outfit',params:{age:32},referenceImage:'x',clothingImage:'y'});
  assert.match(q,/Replace ONLY the clothing/);
  assert.match(q,/recognizable individual/);
});
test('data image validation',()=>{
  const blob=toBlob('data:image/png;base64,aGVsbG8=');assert.equal(blob.type,'image/png');assert.equal(blob.size,5);
  assert.throws(()=>toBlob('data:text/html;base64,aGVsbG8='));
});
test('rate limit protects AI usage',()=>{
  const ip='test-'+Math.random();assert.equal(checkRate(ip),true);assert.equal(checkRate(ip),true);assert.equal(checkRate(ip),true);assert.equal(checkRate(ip),false);
});
test('health, static files and unauthorized request',async(t)=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>server.close());const url='http://127.0.0.1:'+server.address().port;
  let r=await fetch(url+'/api/status');assert.equal(r.status,200);const configured=isReady();assert.equal((await r.json()).aiConfigured,configured);
  r=await fetch(url+'/');assert.equal(r.status,200);assert.match(await r.text(),/PERSONA STUDIO/);
  r=await fetch(url+'/.env');assert.equal(r.status,404);
  r=await fetch(url+'/api/ai/generate',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});assert.equal(r.status,configured?401:503);
});

test('Arkheon selection, safe status and standard image endpoint transport',async()=>{
  const vars=['PERSONA_AI_PROVIDER','ARKHEON_API_KEY','ARKHEON_IMAGE_MODEL','ARKHEON_API_BASE','PERSONA_ACCESS_CODE'];
  const old=Object.fromEntries(vars.map(k=>[k,process.env[k]]));
  const originalFetch=global.fetch;
  try{
    process.env.PERSONA_AI_PROVIDER='arkheon';
    process.env.ARKHEON_API_KEY='test-only-not-a-real-key';
    process.env.ARKHEON_IMAGE_MODEL='example/image-model';
    process.env.PERSONA_ACCESS_CODE='test-secret-code';
    delete process.env.ARKHEON_API_BASE;
    const cfg=providerConfig();
    assert.equal(cfg.provider,'arkheon');
    assert.equal(cfg.baseUrl,'https://arkheonchat.com/v1');
    assert.equal(isReady(),true);
    global.fetch=async(url,options)=>{
      assert.equal(url,'https://arkheonchat.com/v1/images/generations');
      assert.equal(options.headers.Authorization,'Bearer test-only-not-a-real-key');
      const data=JSON.parse(options.body);
      assert.equal(data.model,'example/image-model');
      return {ok:true,json:async()=>({data:[{b64_json:'aGVsbG8='}]})};
    };
    const result=await callImageAPI({params:{age:39}});
    assert.equal(result.provider,'arkheon');
    assert.match(result.image,/^data:image\/png;base64,/);
  } finally {
    global.fetch=originalFetch;
    for(const k of vars){if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k];}
  }
});
