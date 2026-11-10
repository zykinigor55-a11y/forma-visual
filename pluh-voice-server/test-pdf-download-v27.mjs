import assert from "node:assert/strict";
import {storeGeneratedPdf,sendGeneratedPdf} from "./pdf-download-v27.mjs";
const raw=Buffer.from("%PDF-1.4\n"+Array(700).fill("0").join("")+"\n%%EOF");
const item={type:"pdf",filename:"Мафин — герой дня.pdf",dataUrl:"data:application/pdf;base64,"+raw.toString("base64")};
const uri=storeGeneratedPdf(item);
assert.match(uri,/^https:\/\/pluh-voice-demo\.onrender\.com\/api\/download\/pdf\/[A-Za-z0-9_-]{43}$/);
const path=new URL(uri).pathname;
function fake(method="GET"){
 const response={status:0,headers:{},body:null,writeHead(status,headers){this.status=status;this.headers=headers;},
  end(buf){this.body=buf||null}};
 const taken=sendGeneratedPdf({method},response,path);
 return {taken,response};
}
let {taken,response}=fake();
assert.equal(taken,true);
assert.equal(response.status,200);
assert.equal(response.headers["Content-Type"],"application/pdf");
assert.match(response.headers["Content-Disposition"],/attachment/);
assert.deepEqual(response.body,raw);
({response}=fake("HEAD"));
assert.equal(response.status,200);
assert.equal(response.body,null);
const invalid={writeHead(status){this.status=status},end(){}};
sendGeneratedPdf({method:"GET"},invalid,"/api/download/pdf/invalid");
assert.equal(invalid.status,404);
console.log("PLUX V27 PDF download tests passed: real HTTPS URL, GET, HEAD, invalid token");
