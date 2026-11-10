/* PLUX V29 regression: streaming output and fast greetings without paid calls */
import assert from "node:assert/strict";
import {EventEmitter} from "node:events";
import {shortGreeting,streamPlainChat} from "./chat-stream-v29.mjs";

class TestResponse extends EventEmitter{
 constructor(){super();this.headers={};this.messages=[];this.ended=false;}
 setHeader(name,value){this.headers[name]=value;}
 writeHead(status,headers){this.status=status;Object.assign(this.headers,headers);}
 flushHeaders(){}
 write(value){this.messages.push(String(value));return true;}
 end(){this.ended=true;this.emit("close");}
 get events(){return this.messages.join("").trim().split("\n").filter(Boolean).map(JSON.parse)}
}
const original=globalThis.fetch;
try{
 assert.equal(shortGreeting([{role:"user",content:"Привет!"}]),"Привет! 👋 Я на связи. Чем займёмся сегодня?");
 assert.equal(shortGreeting([{role:"user",content:"Объясни солнечную систему"}]),null);
 globalThis.fetch=()=>{throw Error("Greeting must not call paid API")};
 const quick=new TestResponse();
 await streamPlainChat({},quick,{secret:"test",messages:[{role:"user",content:"Привет"}]});
 assert.equal(quick.status,200);
 assert.equal(quick.ended,true);
 assert.deepEqual(quick.events.map(x=>x.type),["started","delta","done"]);
 assert.equal(quick.events[1].text,"Привет! 👋 Я на связи. Чем займёмся сегодня?");
 globalThis.fetch=async (url,args)=>{
   assert.ok(url.includes("/chat/completions"));
   assert.equal(JSON.parse(args.body).stream,true);
   const lines=[
    'data: {"choices":[{"delta":{"content":"Привет, "}}]}',
    '',
    'data: {"choices":[{"delta":{"content":"чем помочь?"}}]}',
    '',
    'data: [DONE]',
    ''
   ].join("\n");
   return new Response(lines,{status:200,headers:{"content-type":"text/event-stream"}});
 };
 const streaming=new TestResponse();
 await streamPlainChat({},streaming,{secret:"test",messages:[{role:"user",content:"Как дела"}]});
 assert.equal(streaming.status,200);
 assert.equal(streaming.ended,true);
 assert.equal(streaming.events.map(e=>e.type).join(","),"started,delta,delta,done");
 assert.equal(streaming.events.filter(e=>e.type==="delta").map(e=>e.text).join(""),"Привет, чем помочь?");
 console.log("PLUX V29 chat streaming and instant greetings verified");
}finally{globalThis.fetch=original}
