import test from 'node:test';
import assert from 'node:assert/strict';
import {applyRealModelShadowBudget} from '../forma-landscape-3d-shadow-budget.js';

const model=(id,x,z,real=true)=>{
 const mesh={isMesh:true,castShadow:true,userData:{}};
 const group={userData:{realGlb:real},position:{x,y:0,z},children:[mesh],traverse(fn){fn(mesh)}};
 return {id,group,mesh};
};
test('mobile prioritizes nearest five real GLB casters and leaves unrelated models intact',()=>{
 const objects=Array.from({length:9},(_,i)=>model('m'+i,i*10,0));
 const other=model('other',4,0,false);
 const root={children:[...objects.map(o=>o.group),other.group]};
 const camera={position:{x:0,y:0,z:0}};
 assert.equal(applyRealModelShadowBudget(root,camera,{mobile:true,maxCasters:5}),true);
 assert.deepEqual(objects.map(x=>x.mesh.castShadow),[true,true,true,true,true,false,false,false,false]);
 assert.equal(other.mesh.castShadow,true);
 camera.position.x=90;
 assert.equal(applyRealModelShadowBudget(root,camera,{mobile:true,maxCasters:5}),true);
 assert.deepEqual(objects.map(x=>x.mesh.castShadow),[false,false,false,false,true,true,true,true,true]);
 assert.equal(applyRealModelShadowBudget(root,camera,{mobile:false,maxCasters:5}),true);
 assert.ok(objects.every(x=>x.mesh.castShadow),'desktop restores authored shadows');
 assert.equal(applyRealModelShadowBudget(root,camera,{mobile:false,maxCasters:5}),false,'no spurious re-render');
});
test('single trees and authored non-shadow meshes are not changed',()=>{
 const a=model('pine',0,0),b=model('shrub',2,0);
 b.mesh.castShadow=false;
 const root={children:[a.group,b.group]};
 assert.equal(applyRealModelShadowBudget(root,{position:{x:0,y:5,z:0}},{mobile:true,maxCasters:5}),false);
 assert.equal(a.mesh.castShadow,true);assert.equal(b.mesh.castShadow,false);
});
