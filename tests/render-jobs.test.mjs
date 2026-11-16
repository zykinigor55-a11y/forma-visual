import test from 'node:test';
import assert from 'node:assert/strict';
import {createRenderJobQueue} from '../forma-render-jobs.mjs';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const hold=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const until=async(fn)=>{for(let i=0;i<100;i++){if(fn())return;await sleep(5)}throw Error('Timed out waiting for queue state');};

test('only one expensive image worker runs; later jobs run in FIFO order',async()=>{
 const releases=[hold(),hold(),hold()];let concurrent=0,peak=0;const invoked=[];
 const q=createRenderJobQueue({worker:async(p)=>{concurrent++;peak=Math.max(peak,concurrent);invoked.push(p.i);await releases[p.i-1].promise;concurrent--;return {images:['image-'+p.i]};}});
 const a=q.enqueue({i:1}),b=q.enqueue({i:2}),c=q.enqueue({i:3});
 assert.equal(q.get(a.jobId).status,'running');
 assert.equal(q.get(b.jobId).position,1);
 assert.equal(q.get(c.jobId).position,2);
 assert.equal(q.stats().waiting,2);
 releases[0].resolve();await until(()=>q.get(b.jobId).status==='running');
 releases[1].resolve();await until(()=>q.get(c.jobId).status==='running');
 releases[2].resolve();await q.wait(c.jobId);
 assert.deepEqual(invoked,[1,2,3]);assert.equal(peak,1);assert.equal(q.get(c.jobId).status,'completed');
 assert.equal(q.result(a.jobId).body.images[0],'image-1');
});

test('idempotency key never causes a second paid request for the same payload',async()=>{
 const blocker=hold();let called=0;
 const q=createRenderJobQueue({worker:async()=>{called++;await blocker.promise;return {images:['ok']}}});
 const original=q.enqueue({image:'test'}, {idempotencyKey:'forma-test-1234567890'});
 const duplicate=q.enqueue({image:'test'}, {idempotencyKey:'forma-test-1234567890'});
 assert.equal(original.jobId,duplicate.jobId);
 assert.equal(called,0);await until(()=>called===1);
 assert.throws(()=>q.enqueue({image:'different'}, {idempotencyKey:'forma-test-1234567890'}),{status:409});
 blocker.resolve();await q.wait(original.jobId);
 assert.equal(called,1);
 assert.equal(q.result(original.jobId).status,200);
});

test('queue is bounded and saturated requests do not reach the provider',async()=>{
 const blocker=hold();let called=0;
 const q=createRenderJobQueue({maxWaiting:1,worker:async()=>{called++;await blocker.promise;return {images:['ok']}}});
 const first=q.enqueue({id:1});const second=q.enqueue({id:2});
 assert.throws(()=>q.enqueue({id:3}),{status:429,code:'queue_full'});
 assert.equal(q.stats().waiting,1);
 blocker.resolve();await Promise.all([q.wait(first.jobId),q.wait(second.jobId)]);
 assert.equal(called,2);
});

test('worker failure is recoverable as a status without any automatic paid retry',async()=>{
 let called=0;
 const q=createRenderJobQueue({worker:async()=>{called++;throw Object.assign(Error('Provider timeout; may be billed'),{status:502,code:'provider_timeout'})}});
 const job=q.enqueue({id:1});await q.wait(job.jobId);
 assert.equal(q.get(job.jobId).status,'failed');
 assert.deepEqual(q.result(job.jobId).body.error,undefined);
 assert.equal(q.result(job.jobId).body.code,'provider_timeout');
 assert.equal(q.result(job.jobId).status,502);
 assert.equal(called,1);
});

test('completed image data expires after configured retention',async()=>{
 let tick=1000;
 const q=createRenderJobQueue({ttlMs:1000,now:()=>tick,worker:async()=>({images:['ok']})});
 const job=q.enqueue({id:1});await q.wait(job.jobId);
 assert.equal(q.result(job.jobId).status,200);
 tick+=1001;
 assert.equal(q.result(job.jobId),null);
 assert.equal(q.get(job.jobId),null);
});
