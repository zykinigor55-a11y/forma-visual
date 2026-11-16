import {createHash,randomBytes} from 'node:crypto';

/**
 * A small FIFO queue for a single-instance image service. One paid provider call
 * at a time; the image result can be retrieved after browser/network timeouts.
 * A permanent multi-instance product needs persistent jobs + storage.
 */
export function createRenderJobQueue({
 worker,
 maxWaiting=4,
 maxQueuedBytes=48*1024*1024,
 ttlMs=10*60*1000,
 maxFinished=5,
 now=()=>Date.now()
}={}){
 if(typeof worker!=='function')throw new TypeError('Image worker is required');
 const jobs=new Map(),keys=new Map(),waiting=[];
 let running=null;

 function prune(){
  const finished=[...jobs.values()].filter(j=>['completed','failed'].includes(j.status)).sort((a,b)=>(a.finishedAt||0)-(b.finishedAt||0));
  const excess=Math.max(0,finished.length-maxFinished);
  for(let i=0;i<finished.length;i++){
   const j=finished[i];
   if(i<excess || now()-j.finishedAt>ttlMs){
    jobs.delete(j.id);if(j.key&&keys.get(j.key)===j.id)keys.delete(j.key);
    j.payload=null;j.result=null;
   }
  }
 }
 function view(j){
  if(!j)return null;
  return {
   jobId:j.id,
   requestId:j.id.slice(0,12),
   status:j.status,
   position:j.status==='queued'?waiting.indexOf(j)+1:0,
   queuedCount:waiting.length,
   createdAt:new Date(j.createdAt).toISOString(),
   startedAt:j.startedAt?new Date(j.startedAt).toISOString():null,
   finishedAt:j.finishedAt?new Date(j.finishedAt).toISOString():null,
   hasResult:j.status==='completed',
   error:j.status==='failed'?j.error:null,
   pollAfterMs:j.status==='queued'?3000:2000
  };
 }
 function complete(j){
  j.finishedAt=now();j.payload=null;
  if(j.resolve){j.resolve(j);j.resolve=null;}
  if(running===j)running=null;
  prune();pump();
 }
 function pump(){
  if(running)return;
  const job=waiting.shift();
  if(!job)return;
  running=job;job.status='running';job.startedAt=now();
  Promise.resolve().then(()=>worker(job.payload,job.id)).then(result=>{
   job.result=result;job.status='completed';
  },error=>{
   const status=Number.isInteger(error?.status)&&error.status>=400&&error.status<=599?error.status:502;
   job.error={status,code:String(error?.code||'render_failed').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,50),message:String(error?.message||'Ошибка генерации').slice(0,240)};
   job.status='failed';
  }).finally(()=>complete(job));
 }
 function enqueue(payload,{idempotencyKey}={}){
  prune();
  const key=typeof idempotencyKey==='string'&&/^[\w.-]{16,128}$/.test(idempotencyKey)?idempotencyKey:null;
  if(idempotencyKey&&!key)throw Object.assign(Error('Неверный ключ защиты повторного запроса'),{status:400,code:'invalid_idempotency'});
  const serialized=JSON.stringify(payload);
 const bytes=Buffer.byteLength(serialized,'utf8');
 const hash=createHash('sha256').update(serialized).digest('hex');
  if(key&&keys.has(key)){
   const old=jobs.get(keys.get(key));
   if(old){
    if(old.hash!==hash)throw Object.assign(Error('Этот ключ уже использован с другими параметрами'),{status:409,code:'duplicate_mismatch'});
    return view(old);
   }
   keys.delete(key);
  }
  if(running&&waiting.length>=maxWaiting)throw Object.assign(Error('Очередь заполнена. Повторите позже — генерация не началась и не оплачивалась.'),{status:429,code:'queue_full'});
  if(running&&waiting.reduce((sum,j)=>sum+j.bytes,0)+bytes>maxQueuedBytes)throw Object.assign(Error('Недостаточно памяти для ещё одного задания в очереди. Генерация не запускалась и не оплачивалась.'),{status:429,code:'queue_memory'});
  const id=randomBytes(24).toString('hex');
  const job={id,hash,key,bytes,createdAt:now(),startedAt:0,finishedAt:0,status:'queued',payload,result:null,error:null,resolve:null};
  jobs.set(id,job);if(key)keys.set(key,id);waiting.push(job);pump();
  return view(job);
 }
 function get(id){prune();return view(jobs.get(id))}
 function result(id){
  prune();const j=jobs.get(id);
  if(!j)return null;
  if(j.status==='completed')return {status:200,body:{...j.result,requestId:id}};
  if(j.status==='failed')return {status:j.error.status,body:{error:j.error.message,code:j.error.code,requestId:id}};
  return {status:202,body:view(j)};
 }
 function wait(id){
  const j=jobs.get(id);
  if(!j)return Promise.resolve(null);
  if(j.status==='completed'||j.status==='failed')return Promise.resolve(j);
  return new Promise(resolve=>{const previous=j.resolve;j.resolve=job=>{previous?.(job);resolve(job)}});
 }
 function stats(){prune();return {running:running?1:0,waiting:waiting.length,maxWaiting,queuedBytes:waiting.reduce((sum,j)=>sum+j.bytes,0),maxQueuedBytes,oldestWaitSeconds:waiting.length?Math.round((now()-waiting[0].createdAt)/1000):0};}
 return {enqueue,get,result,wait,stats};
}
