import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {handleImageRequest} from './media-v129.mjs';
const origin='https://plux-v17-friends-preview.onrender.com';
process.env.API_MARKET_IMAGE_KEY='local-mock-test-only';
function mockReq(payload,ip){
 const req=Readable.from([Buffer.from(JSON.stringify(payload))]);
 req.method='POST';req.headers={'origin':origin,'x-forwarded-for':ip,'content-type':'application/json'};
 return req;
}
function mockRes(){
 return {headers:{},status:0,body:'',
   setHeader(k,v){this.headers[k.toLowerCase()]=v},
   writeHead(code,headers){this.status=code;Object.assign(this.headers,headers||{})},
   end(data=''){this.body=String(data)}
 };
}
const orig=globalThis.fetch;
let called=0;
try{
 globalThis.fetch=async()=>{called++;throw Error('Unexpected paid call')};
 const bad=mockRes();
 await handleImageRequest(mockReq({prompt:'Измени фон на лес',referenceImage:'data:image/jpeg;base64,AAAA'},'test-198.51.100.11'),bad);
 assert.equal(bad.status,415);
 assert.equal(called,0);
 assert.equal(bad.headers['access-control-allow-origin'],origin);
 const jpeg=Buffer.alloc(1800,15);jpeg[0]=255;jpeg[1]=216;jpeg[2]=255;
 const encoded=jpeg.toString('base64');
 const output=Buffer.alloc(2200,10);output[0]=255;output[1]=216;output[2]=255;
 const returned=output.toString('base64');
 globalThis.fetch=async (url,options)=>{
   called++;
   assert.equal(url,'https://api-market1.shop/v1/images/edits');
   assert.equal(options.method,'POST');
   assert.equal(options.body.get('model'),'gpt-image-2');
   assert.equal(options.body.get('prompt').includes('Измени фон на лес'),true);
   assert.ok(options.body.get('image') instanceof Blob);
   assert.equal(options.body.get('image').type,'image/jpeg');
   return {ok:true,json:async()=>({data:[{b64_json:returned}]})};
 };
 const good=mockRes();
 await handleImageRequest(mockReq({
   prompt:'Измени фон на лес',style:'realism',
   referenceImage:'data:image/jpeg;base64,'+encoded
 },'test-198.51.100.12'),good);
 assert.equal(called,1,'must not make a second paid request');
 assert.equal(good.status,200);
 const result=JSON.parse(good.body);
 assert.equal(result.edited,true);
 assert.equal(result.image,'data:image/jpeg;base64,'+returned);
 console.log('V31 image edit: rejects invalid photo without charging; routes valid source to edits once');
}finally{globalThis.fetch=orig}
