import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorkspaceGuard,imageForStorage} from '../lib/workspace.ts';
import {readFileSync} from 'node:fs';
test('a late save from the previous house cannot replace the active project',async()=>{
 const guard=createWorkspaceGuard();let resolve;const request=new Promise(r=>resolve=r);let projectId='new-house';
 const result=guard.run(()=>request,old=>{projectId=old.id;});
 guard.invalidate();resolve({id:'old-house'});
 assert.equal(await result,null);assert.equal(projectId,'new-house');
});
test('current project saves can update the active project',async()=>{
 const guard=createWorkspaceGuard();let projectId=null;
 const result=await guard.run(async()=>({id:'same-house'}),p=>{projectId=p.id;});
 assert.equal(projectId,'same-house');assert.equal(result.id,'same-house');
});
test('JPEG is persisted byte-for-byte without larger PNG re-encoding',()=>{
 const jpg='data:image/jpeg;base64,'+readFileSync(new URL('./fixtures/source.jpg',import.meta.url)).toString('base64');
 assert.equal(imageForStorage(jpg),jpg);
});
