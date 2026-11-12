import assert from 'node:assert/strict';
const base='https://plux-v17-friends-preview.onrender.com';
const api='https://pluh-voice-demo.onrender.com';
const page=await fetch(base+'/?mobile=1&v=3182',{signal:AbortSignal.timeout(40000)});
assert.equal(page.status,200);const html=await page.text();
let scripts=[...html.matchAll(/<script\b[^>]*src="([^"]+)"/ig)].map(x=>x[1]);
let all=[{src:'inline',body:html}];
for(const src of scripts){
 if(!src.startsWith('/')&&!src.startsWith(base))continue;
 try{let r=await fetch(new URL(src,base),{signal:AbortSignal.timeout(25000)});if(!r.ok)continue;let body=await r.text();all.push({src,body});}catch{}
}
for(let {src,body}of all){
 const tokens=['/api/voice/token','/api/arkheon/token','ELEVENLABS_API_KEY','conversationToken','open-voice-quick','speech-button','getUserMedia','response.audio.delta','realtime','wss://'];
 let hits=[];
 for(const t of tokens){let i=body.indexOf(t);if(i>=0){hits.push({token:t,count:body.split(t).length-1,context:body.slice(Math.max(0,i-230),i+420).replace(/(?:sk|ek)_[A-Za-z0-9_-]{12,}/g,'[redacted]')})}}
 if(hits.length)console.log('PLUX_VOICE_SCRIPT '+JSON.stringify({src,bytes:body.length,hits:hits.slice(0,10)}));
}
for(const [method,path,body] of [
 ['GET','/api/arkheon/config',null],
 ['GET','/api/voice/config',null],
 ['GET','/api/image/config',null],
 ['OPTIONS','/api/image',null],
 ['POST','/api/image',{prompt:'a'}],
]){
 const headers={'Origin':base,'Content-Type':'application/json'};
 const r=await fetch(api+path,{method,headers,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(40000)});
 const txt=(await r.text()).slice(0,500).replace(/(?:sk|ek)_[A-Za-z0-9_-]{12,}/g,'[redacted]');
 console.log('PLUX_API_PROBE '+JSON.stringify({method,path,status:r.status,cors:r.headers.get('access-control-allow-origin'),response:txt}));
}
