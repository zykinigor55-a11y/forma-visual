import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {setTimeout as delay} from 'node:timers/promises';
import {existsSync,statSync} from 'node:fs';
import {REAL_3D_OBJECTS} from '../forma-landscape-3d-library40.js';

async function reservePort(){
 const server=createServer();
 await new Promise((resolve,reject)=>server.listen(0,'127.0.0.1',error=>error?reject(error):resolve()));
 const port=server.address().port;
 await new Promise(resolve=>server.close(resolve));
 return port;
}

test('self-hosted PBR GLB streams through production static HTTP server', {timeout:17000},async()=>{
 const file=new URL('../assets/landscape-models/pine.glb',import.meta.url);
 assert.ok(existsSync(file),'GitHub installer must publish pine.glb');
 const expected=statSync(file).size;
 const port=await reservePort(),base='http://127.0.0.1:'+port;
 const subprocess=spawn(process.execPath,['server.mjs'],{
  cwd:new URL('..',import.meta.url),
  env:{...process.env,PORT:String(port),HOST:'127.0.0.1',API_MARKET_KEY:''},
  stdio:'ignore'
 });
 try{
  let ready=false;
  for(let attempt=0;attempt<80;attempt++){
   if(subprocess.exitCode!==null)throw Error('production server exited before becoming ready');
   try{
    const reply=await fetch(base+'/assets/landscape-models/pine.glb',{method:'HEAD',signal:AbortSignal.timeout(1200)});
    if(reply.status===200){
     assert.match(reply.headers.get('content-type')||'',/model\/gltf-binary/);
     assert.equal(Number(reply.headers.get('content-length')),expected);
     ready=true;break;
    }
   }catch(error){if(error.name==='AssertionError')throw error}
   await delay(75);
  }
  assert.equal(ready,true,'GLB HEAD should be served within six seconds');
  // Real HTTP delivery is part of the feature: one absent texture thumbnail
  // or a GLB served as HTML silently breaks a customer's garden scene.
  assert.equal(REAL_3D_OBJECTS.length,40);
  for(const model of REAL_3D_OBJECTS){
   for(const [suffix,mime] of [[model.id+'.glb',/model\\/gltf-binary/],['thumbs/'+model.id+'.webp',/image\\/webp/]]){
    const p='/assets/landscape-models/'+suffix;
    const response=await fetch(base+p,{method:'HEAD',signal:AbortSignal.timeout(2000)});
    assert.equal(response.status,200,'40-item catalogue asset missing: '+p);
    assert.match(response.headers.get('content-type')||'',mime,'Wrong MIME type: '+p);
    assert.ok(Number(response.headers.get('content-length'))>100,'Empty asset: '+p);
   }
  }
  const missing=await fetch(base+'/assets/landscape-models/missing.glb',{method:'HEAD'});
  assert.equal(missing.status,404,'Missing GLB cannot be silently replaced with the app page');
  // GET opens as binary stream, not a Node heap-sized static read.
  const get=await fetch(base+'/assets/landscape-models/pine.glb',{signal:AbortSignal.timeout(3000)});
  assert.equal(get.status,200);
  assert.equal(Number(get.headers.get('content-length')),expected);
  await get.body.cancel();
 }finally{
  subprocess.kill('SIGTERM');
 }
});
