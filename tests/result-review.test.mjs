import test from 'node:test';import assert from 'node:assert/strict';
import {createReviewQueue,inGallery} from '../forma-result-queue.js';
test('every generated frame is reviewed once and saving waits for the gallery write',async()=>{
 const q=createReviewQueue();let stored=[];
 q.add({image:'a',onSave:async()=>stored.push('a')});q.add({image:'b',onSave:async()=>stored.push('b')});q.add({image:'a',scene:'updated'});
 assert.equal(q.pending,2);assert.equal(q.next().image,'a');await q.decide('save');assert.deepEqual(stored,['a']);assert.equal(q.next().image,'b');await q.decide('later');assert.equal(q.next(),null);assert.equal(q.pending,0);
 q.add({image:'a'});assert.equal(q.pending,0);
});
test('failed storage keeps the result review available for retry',async()=>{
 const q=createReviewQueue();q.add({image:'a',onSave:async()=>{throw Error('quota');}});q.next();await assert.rejects(q.decide('save'),/quota/);assert.equal(q.pending,1);
});
test('new renders are not in gallery until chosen; legacy renders remain visible',()=>{
 assert.equal(inGallery({id:'new',gallerySaved:false}),false);assert.equal(inGallery({id:'new',gallerySaved:true}),true);assert.equal(inGallery({id:'legacy'}),true);
});
test('gallery confirmation targets the generated frame even after another result becomes active',async()=>{
 const {default:vm}=await import('node:vm');const {readFileSync}=await import('node:fs');
 const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');const code=source.slice(source.indexOf('function announceGenerated('),source.indexOf('// Narrow project interface'));
 const owner={id:'p',name:'Дом',renders:[{id:'a'},{id:'b'}]};let offer,stored;
 const context={project:owner,window:{FORMA_RESULT_FOCUS:{show:e=>offer=e}},save:()=>stored=JSON.stringify({projects:[owner]}),localStorage:{getItem:()=>stored},document:{dispatchEvent(){}},Event,JSON,Error};
 vm.runInNewContext(code+';this.offer=announceGenerated;',context);context.offer('image-a','a');owner.activeRender='b';await offer.onSave();
 assert.equal(owner.renders[0].gallerySaved,true);assert.equal(owner.renders[1].gallerySaved,undefined);
});
