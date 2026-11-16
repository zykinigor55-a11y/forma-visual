import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRenderJobQueue} from '../forma-render-jobs.mjs';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('quality stylesheet loads on both live entry pages after existing theme layers',()=>{
 const css=read('forma-quality-polish-v1.css');
 for(const path of ['forma-preview.html','index.html']){
  const html=read(path);
  assert.match(html,/forma-quality-polish-v1\.css\?v=quality-nine-pass1/);
  assert.ok(html.indexOf('forma-quality-polish-v1.css')>html.indexOf('forma-landscape-premium-cards.css'));
 }
 assert.match(css,/--forma-touch:44px/);
 assert.match(css,/min-height:46px/);
 assert.match(css,/font-size:12px!important/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/touch-action:none/);
});

test('quality fixes do not recolor light theme green and maintain neutral dark graphite',()=>{
 const css=read('forma-quality-polish-v1.css');
 assert.match(css,/html\[data-forma-theme="dark"\]/);
 assert.match(css,/--fs-bg:#202124/);
 assert.match(css,/--fs-panel:#292b30/);
 assert.match(css,/html\[data-forma-theme="light"\]/);
 assert.doesNotMatch(css,/#(?:008000|00ff00|00aa00|006600)/i);
});

test('bounded pending 2K image requests protect memory without another paid call',async()=>{
 let release;
 const gate=new Promise(resolve=>{release=resolve});
 const calls=[];
 const q=createRenderJobQueue({maxQueuedBytes:115,maxWaiting:4,worker:async(p)=>{
  calls.push(p.id);
  if(p.id===1)await gate;
  return {images:['ok']};
 }});
 const a=q.enqueue({id:1,image:'a'.repeat(72)});
 const b=q.enqueue({id:2,image:'b'.repeat(72)},{idempotencyKey:'forma-quality-unique-0001'});
 assert.equal(q.stats().waiting,1);
 assert.ok(q.stats().queuedBytes>0);
 assert.equal(q.enqueue({id:2,image:'b'.repeat(72)},{idempotencyKey:'forma-quality-unique-0001'}).jobId,b.jobId);
 assert.throws(()=>q.enqueue({id:3,image:'c'.repeat(72)}),{status:429,code:'queue_memory'});
 release();
 await Promise.all([q.wait(a.jobId),q.wait(b.jobId)]);
 assert.deepEqual(calls,[1,2]);
 assert.equal(q.stats().queuedBytes,0);
});
