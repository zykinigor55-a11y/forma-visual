import assert from 'node:assert/strict';
import {FENCE_STYLES,normalizeFence,sideFinish,perimeterPoints,snapFencePoint,validateFenceOpenings,createLouverFence} from '../forma-landscape-fence-r210.js';
import * as T from 'three';
assert.equal(Object.keys(FENCE_STYLES).length,13);
const points=perimeterPoints({width:20,height:18});assert.equal(points.length,5);
assert.equal(snapFencePoint({x:.4,y:5},{width:20,height:18}).x,0);
const f=normalizeFence({sideStyles:{0:'brick',1:'mesh'},sideFinishes:{0:{color:'brown',brick:'red'}}});
assert.equal(sideFinish(f,0).brick,'red');assert.equal(sideFinish(f,1).style,'mesh');
for(const style of Object.keys(FENCE_STYLES)){
 const o={points:[{x:0,y:0},{x:18,y:0}],fence:normalizeFence({sideStyles:{0:style},openings:[{side:0,kind:'gate',offset:4,width:4,direction:'right'},{side:0,kind:'wicket',offset:1,width:1}]})};
 assert.equal(validateFenceOpenings(o),'',style);
 const g=createLouverFence(T,o,{pos:(x,y)=>new T.Vector3(x,0,y),terrainAt:()=>0,mobile:true});
 assert(g.children.length>0,style);assert(g.userData.formaFence.instances>10,style);
 for(const mesh of g.children)assert([...mesh.instanceMatrix.array].every(Number.isFinite),style);
}
console.log('13 fence models, openings, and snapping passed');
