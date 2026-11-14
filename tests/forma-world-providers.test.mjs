import test from 'node:test';
import assert from 'node:assert/strict';
import {createFormaWorldApi} from '../forma-world-providers.mjs';

test('World/3D adapters stay disabled until configured and enforce private cost consent', async () => {
 const vars=['FORMA_WORLD_AI_ENABLED','FORMA_WORLD_ACCESS_TOKEN','MESHY_API_KEY','WLT_API_KEY','FORMA_WORLD_DAILY_CAP'];
 const original=Object.fromEntries(vars.map(k=>[k,process.env[k]]));
 const fetchOriginal=globalThis.fetch;
 const payloads=[];
 const handle=createFormaWorldApi({
  json:(r,status,value)=>{r.status=status;r.value=value},
  readJSON:async req=>req.payload,
  sameOrigin:()=>true
 });
 async function ask(url,method='GET',payload=null,headers={}){
  const r={};
  await handle({url,method,payload,headers},r);
  return r;
 }
 try {
  delete process.env.FORMA_WORLD_AI_ENABLED;
  delete process.env.FORMA_WORLD_ACCESS_TOKEN;
  assert.equal((await ask('/api/forma-world/status')).value.enabled,false);
  assert.equal((await ask('/api/forma-world/world','POST',{prompt:'Forest'})).status,503);

  process.env.FORMA_WORLD_AI_ENABLED='true';
  process.env.FORMA_WORLD_ACCESS_TOKEN='owner-secret-at-least-24-characters';
  process.env.MESHY_API_KEY='test-meshy-key';
  process.env.WLT_API_KEY='test-worldlabs-key';
  process.env.FORMA_WORLD_DAILY_CAP='5';
  assert.equal((await ask('/api/forma-world/status')).value.worldLabs,true);
  assert.equal((await ask('/api/forma-world/status')).value.meshy,true);

  const headers={'x-forma-world-token':process.env.FORMA_WORLD_ACCESS_TOKEN,'x-forma-cost-confirmed':'yes'};
  const noSecret=await ask('/api/forma-world/meshy','POST',{image:'data:image/png;base64,'+'A'.repeat(200)},{'x-forma-cost-confirmed':'yes'});
  assert.equal(noSecret.status,401);
  const noConsent=await ask('/api/forma-world/world','POST',{prompt:'Detailed forest'}, {'x-forma-world-token':process.env.FORMA_WORLD_ACCESS_TOKEN});
  assert.equal(noConsent.status,428);

  globalThis.fetch=async (url,opts={})=>{
   payloads.push({url:String(url),headers:opts.headers,body:opts.body?JSON.parse(opts.body):null});
   const value=String(url).includes('api.meshy.ai')
    ?(opts.method==='POST'?{result:'test-meshy-id-0123456789'}:{status:'SUCCEEDED',progress:100,model_urls:{glb:'https://assets.meshy.ai/valid-model.glb'}})
    :(opts.method==='POST'?{operation_id:'operations/test-operation-0123456789'}:{done:true,response:{world_url:'https://marble.worldlabs.ai/world/demo'}}); 
   return {ok:true,status:200,text:async()=>JSON.stringify(value)};
  };
  const img='data:image/png;base64,'+'A'.repeat(200);
  const meshy=await ask('/api/forma-world/meshy','POST',{image:img},headers);
  assert.equal(meshy.status,202);
  assert.equal(meshy.value.id,'test-meshy-id-0123456789');
  assert.equal(payloads[0].body.ai_model,'meshy-7.1');
  assert.equal(payloads[0].body.enable_pbr,true);
  assert.match(payloads[0].headers.Authorization,/Bearer test-meshy-key/);
  const meshStatus=await ask('/api/forma-world/meshy/test-meshy-id-0123456789','GET',null,headers);
  assert.equal(meshStatus.value.status,'SUCCEEDED');

  const world=await ask('/api/forma-world/world','POST',{prompt:'A pine forest by the lake, accurate topography'},headers);
  assert.equal(world.status,202);
  assert.equal(world.value.operationId,'test-operation-0123456789');
  assert.equal(payloads[2].body.world_prompt.type,'text');
  assert.equal(payloads[2].headers['WLT-Api-Key'],'test-worldlabs-key');
  const result=await ask('/api/forma-world/world/test-operation-0123456789','GET',null,headers);
  assert.equal(result.value.done,true);
  assert.equal(result.value.result.world_url,'https://marble.worldlabs.ai/world/demo');
  assert.equal(JSON.stringify(meshy.value).includes('test-meshy-key'),false);
  assert.equal(JSON.stringify(world.value).includes('test-worldlabs-key'),false);
 }finally{
  globalThis.fetch=fetchOriginal;
  for(const k of vars){if(original[k]==null)delete process.env[k];else process.env[k]=original[k]}
 }
});
