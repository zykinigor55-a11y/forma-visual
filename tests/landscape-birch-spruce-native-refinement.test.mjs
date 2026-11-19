import test from 'node:test';
import assert from 'node:assert/strict';
import {birchCrownDisplacement,refineNativeBirch} from '../forma-landscape-birch-native.js';
import {spruceTipDrop,spruceNativeProfile} from '../forma-landscape-spruce-native.js';

test('birch droops at branch tips but preserves the basal white trunk and top leader',()=>{
 const tip=birchCrownDisplacement({height:16,relativeY:.61,relativeRadius:.95,azimuth:0});
 assert.ok(tip>.4&&tip<1,'hanging branchlets need visible but restrained sag');
 assert.equal(birchCrownDisplacement({height:16,relativeY:.61,relativeRadius:0}),0);
 assert.equal(birchCrownDisplacement({height:16,relativeY:0,relativeRadius:.95}),0);
 assert.equal(birchCrownDisplacement({height:16,relativeY:1,relativeRadius:.95}),0);
});
test('spruce ageing drops supported twigs and needle sprays together, not the trunk',()=>{
 const old=spruceNativeProfile({type:'century'});
 const young=spruceNativeProfile({type:'young'});
 const lowerOld=spruceTipDrop({height:16,relativeY:.40,relativeRadius:.90,amount:old.lowerDrop});
 const lowerYoung=spruceTipDrop({height:16,relativeY:.40,relativeRadius:.90,amount:young.lowerDrop});
 const high=spruceTipDrop({height:16,relativeY:.92,relativeRadius:.90,amount:old.lowerDrop});
 assert.ok(lowerOld>lowerYoung);
 assert.ok(lowerOld>high);
 assert.equal(spruceTipDrop({height:16,relativeY:.40,relativeRadius:0,amount:old.lowerDrop}),0);
 assert.equal(spruceTipDrop({height:16,relativeY:.40,relativeRadius:.90,amount:0}),0);
});

class Vector3{
 constructor(x=0,y=0,z=0){this.set(x,y,z)}
 set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
 copy(v){return this.set(v.x,v.y,v.z)}
 applyMatrix4(_matrix){return this}
}
class Identity{
 clone(){return new Identity()}
 invert(){return this}
}
class Attribute{
 constructor(values,itemSize){this.array=new Float32Array(values);this.itemSize=itemSize;this.count=this.array.length/itemSize}
 getX(i){return this.array[i*this.itemSize]}
 getY(i){return this.array[i*this.itemSize+1]}
 getZ(i){return this.array[i*this.itemSize+2]}
 setXYZ(i,x,y,z){this.array.set([x,y,z],i*this.itemSize)}
 clone(){return new Attribute(this.array,this.itemSize)}
}
class Geometry{
 constructor(positions,uvs){this.attributes={position:new Attribute(positions,3),uv:new Attribute(uvs,2)}}
 getAttribute(name){return this.attributes[name]}
 clone(){
  const c=Object.create(Geometry.prototype);c.attributes={};
  for(const [key,val] of Object.entries(this.attributes))c.attributes[key]=val.clone();
  return c;
 }
 computeBoundingBox(){}
 computeBoundingSphere(){}
}
class Box3{
 setFromObject(root){
  const all=[];
  root.traverse(mesh=>{
   if(!mesh.isMesh)return;
   const a=mesh.geometry.getAttribute('position');
   for(let i=0;i<a.count;i++)all.push([a.getX(i),a.getY(i),a.getZ(i)]);
  });
  this.min={x:Math.min(...all.map(x=>x[0])),y:Math.min(...all.map(x=>x[1])),z:Math.min(...all.map(x=>x[2]))};
  this.max={x:Math.max(...all.map(x=>x[0])),y:Math.max(...all.map(x=>x[1])),z:Math.max(...all.map(x=>x[2]))};
  return this;
 }
 isEmpty(){return this.max.y<this.min.y}
 getSize(out){return out.set(this.max.x-this.min.x,this.max.y-this.min.y,this.max.z-this.min.z)}
 getCenter(out){return out.set((this.max.x+this.min.x)/2,(this.max.y+this.min.y)/2,(this.max.z+this.min.z)/2)}
}
const T={Vector3,Box3};
const positions=[0,0,0, 0,2,0, 0,10,0, 2,5,0, 2.1,5.2,.1, 2.2,5.1,0];
const uvs=[0,0,0,1,.5,1,.3,.2,.7,.5,.9,.4];
const material={name:'Original CC0 birch',roughness:.76,map:{name:'original KTX2 albedo'},normalMap:{name:'original normal texture'},alphaTest:.5};
function makeSource(){
 const geometry=new Geometry(positions,uvs);
 const mesh={isMesh:true,geometry,material,matrixWorld:new Identity(),userData:{},
  updateWorldMatrix(){}};
 const makeGroup=(node)=>({
  isObject3D:true,userData:{},updateMatrixWorld(){},
  traverse(callback){callback(node)},
  clone(){return makeGroup({...node,userData:{},geometry:node.geometry})}
 });
 return {source:makeGroup(mesh),geometry};
}
test('birch native edit is cached, source-preserving and retains UV/PBR material identity',()=>{
 const {source,geometry}=makeSource();
 const originalCoords=Array.from(geometry.getAttribute('position').array);
 const originalUv=Array.from(geometry.getAttribute('uv').array);
 const result=refineNativeBirch(T,source);
 assert.strictEqual(refineNativeBirch(T,source),result,'same refined source reused by all birches');
 let refined;
 result.traverse(mesh=>refined=mesh);
 assert.notStrictEqual(refined.geometry,geometry);
 assert.strictEqual(refined.material,material,'original GLB texture/roughness maps untouched');
 assert.deepEqual(Array.from(geometry.getAttribute('position').array),originalCoords);
 assert.deepEqual(Array.from(refined.geometry.getAttribute('uv').array),originalUv);
 const after=refined.geometry.getAttribute('position');
 assert.equal(after.getY(0),0,'trunk base anchored to terrain');
 assert.equal(after.getY(2),10,'top leader stays at same height');
 assert.ok(after.getY(3)<5,'lateral foliage branches hang naturally');
 assert.equal(refined.userData.bundledSharedGeometry,true,'refined geometry shared between instances');
});
