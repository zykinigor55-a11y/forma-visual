import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {randomBytes} from 'node:crypto';

async function freePort(){
 return new Promise((resolvePort,reject)=>{
  const server=createServer();
  server.once('error',reject);
  server.listen(0,'127.0.0.1',()=>{
   const port=server.address().port;
   server.close(err=>err?reject(err):resolvePort(port));
  });
 });
}
async function start(){
 const dir=await mkdtemp(join(tmpdir(),'dom-primerka-test-'));
 const port=await freePort();
 const secret=randomBytes(32).toString('hex');
 const server=spawn(process.execPath,['server.mjs'],{
  cwd:resolve(import.meta.dirname,'../..'),
  env:{...process.env,PORT:String(port),HOST:'127.0.0.1',PRIMERKA_DB_PATH:join(dir,'test.sqlite'),PRIMERKA_STAGING_ENABLED:'true',PRIMERKA_ADMIN_KEY:secret,API_MARKET_KEY:''},
  stdio:['ignore','pipe','pipe']
 });
 let logs='';
 server.stderr.on('data',chunk=>{logs+=chunk.toString()});
 const base='http://127.0.0.1:'+port;
 for(let i=0;i<120;i++){
  if(server.exitCode!==null)throw Error('Server exited: '+logs);
  try{const r=await fetch(base+'/api/primerka/status');if(r.status===200)return {base,server,dir,secret}}catch{}
  await new Promise(r=>setTimeout(r,60));
 }
 server.kill();await rm(dir,{recursive:true,force:true});
 throw Error('Staging server did not start: '+logs);
}
async function req(base,path,{method='GET',cookie='',body,headers={}}={}){
 const allHeaders={Accept:'application/json',...headers};
 if(cookie)allHeaders.Cookie=cookie;
 const opts={method,headers:allHeaders};
 if(body!==undefined){allHeaders['Content-Type']='application/json';opts.body=JSON.stringify(body)}
 const response=await fetch(base+'/api/primerka'+path,opts);
 const data=await response.json();
 return {status:response.status,data,cookie:response.headers.get('set-cookie')?.split(';')[0]||null};
}
test('staging API: roles, approvals, tenant isolation, projects, logout, old routes',async t=>{
 const app=await start(),base=app.base;
 t.after(async()=>{app.server.kill();await rm(app.dir,{recursive:true,force:true})});
 const pass='StrongPassphrase-2026!';
 let p=await req(base,'/products');assert.equal(p.status,200);assert.deepEqual(p.data.products,[]);
 const customer=await req(base,'/signup',{method:'POST',body:{email:'customer@test.local',password:pass,role:'customer'}});
 assert.equal(customer.status,201);assert.equal(customer.data.user.role,'customer');const customerCookie=customer.cookie;assert.ok(customerCookie);
 const manufacturer=await req(base,'/signup',{method:'POST',body:{email:'factory@test.local',password:pass,role:'manufacturer',companyName:'Тестовый завод'}});
 assert.equal(manufacturer.status,201);assert.equal(manufacturer.data.user.role,'manufacturer_pending');const manufacturerCookie=manufacturer.cookie;
 const oid=manufacturer.data.user.organizationId;assert.ok(oid);
 const example={name:'Клинкер тестовый',sku:'CL-001',category:'Фасад',price:1250,unit:'м²',color:'#ab7043'};
 p=await req(base,'/products',{method:'POST',cookie:manufacturerCookie,body:example});
 assert.equal(p.status,403,'pending manufacturers cannot publish');
 p=await req(base,'/admin/approve',{method:'POST',headers:{'x-primerka-admin-key':'wrong'},body:{organizationId:oid,approved:true}});
 assert.equal(p.status,403);
 p=await req(base,'/admin/approve',{method:'POST',headers:{'x-primerka-admin-key':app.secret},body:{organizationId:oid,approved:true}});
 assert.equal(p.status,200);
 p=await req(base,'/me',{cookie:manufacturerCookie});assert.equal(p.data.user.role,'manufacturer_admin');
 p=await req(base,'/products',{method:'POST',cookie:manufacturerCookie,body:example});
 assert.equal(p.status,201);const productId=p.data.product.id;assert.equal(p.data.product.brand,'Тестовый завод');
 p=await req(base,'/products',{method:'POST',cookie:manufacturerCookie,body:example});assert.equal(p.status,409,'duplicate SKU must not be created');
 p=await req(base,'/products');assert.equal(p.data.products.length,1);assert.equal(p.data.products[0].sku,'CL-001');
 p=await req(base,'/products',{method:'POST',cookie:customerCookie,body:example});assert.equal(p.status,403,'customers cannot publish');
 const manufacturer2=await req(base,'/signup',{method:'POST',body:{email:'other@test.local',password:pass,role:'manufacturer',companyName:'Другой завод'}});
 assert.equal(manufacturer2.status,201);
 p=await req(base,'/admin/approve',{method:'POST',headers:{'x-primerka-admin-key':app.secret},body:{organizationId:manufacturer2.data.user.organizationId,approved:true}});
 assert.equal(p.status,200);
 p=await req(base,'/products/'+productId,{method:'DELETE',cookie:manufacturer2.cookie});
 assert.equal(p.status,404,'company must not delete another company product');
 p=await req(base,'/my/products',{cookie:manufacturer2.cookie});
 assert.equal(p.status,200);assert.equal(p.data.products.length,0,'catalogs must be isolated');
 p=await req(base,'/projects',{method:'POST',cookie:customerCookie,body:{name:'Мой дом',selectedIds:[productId],photo:null}});
 assert.equal(p.status,201);
 p=await req(base,'/projects',{cookie:customerCookie});
 assert.equal(p.status,200);assert.equal(p.data.projects.length,1);assert.deepEqual(p.data.projects[0].selectedIds,[productId]);
 p=await req(base,'/projects',{cookie:manufacturerCookie});assert.equal(p.status,403);
 p=await req(base,'/products',{method:'POST',cookie:manufacturerCookie,body:{...example,sku:'CL-002'},headers:{Origin:'https://unauthorized.test'}});
 assert.equal(p.status,403,'cross-origin form writes must be rejected');
 const publicHtml=await fetch(base+'/primerka/index.html');assert.equal(publicHtml.status,200);assert.match(await publicHtml.text(),/portal\.js/);
 const originalEditor=await fetch(base+'/');assert.equal(originalEditor.status,200);
 const oldApi=await fetch(base+'/api/status');assert.equal(oldApi.status,200,'old DOM.RENDER status remains available');
 p=await req(base,'/logout',{method:'POST',cookie:customerCookie,body:{}});assert.equal(p.status,200);
 p=await req(base,'/me',{cookie:customerCookie});assert.equal(p.status,401,'logout invalidates sessions');
});
