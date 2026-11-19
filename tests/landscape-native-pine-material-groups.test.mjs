import test from 'node:test';
import assert from 'node:assert/strict';
import {nativePineProfile,reshapeNativePine} from '../forma-landscape-pine-native.js';

// Lightweight Three.js geometry contract. Keep this test runnable without
// WebGL or a native graphics driver in GitHub Actions.
class Attribute{
 constructor(array,itemSize,normalized=false){
  this.array=array;this.itemSize=itemSize;this.normalized=normalized;
  this.count=array.length/itemSize;
 }
 getX(i){return this.array[i*this.itemSize]}
 getY(i){return this.array[i*this.itemSize+1]}
 getZ(i){return this.array[i*this.itemSize+2]}
 getW(i){return this.array[i*this.itemSize+3]}
 clone(){return new Attribute(this.array.slice(),this.itemSize,this.normalized)}
}
class Geometry{
 constructor(){this.attributes={};this.groups=[];this.index=null;this.disposed=false}
 setAttribute(name,attribute){this.attributes[name]=attribute;return this}
 getAttribute(name){return this.attributes[name]}
 addGroup(start,count,materialIndex){this.groups.push({start,count,materialIndex})}
 clone(){
  const c=new Geometry();
  for(const [name,a] of Object.entries(this.attributes))c.setAttribute(name,a.clone());
  c.groups=this.groups.map(g=>({...g}));
  return c;
 }
 computeBoundingBox(){
  const a=this.getAttribute('position');let min=Infinity,max=-Infinity;
  for(let i=0;i<a.count;i++){min=Math.min(min,a.getY(i));max=Math.max(max,a.getY(i))}
  this.boundingBox={min:{y:min},max:{y:max}};
 }
 computeBoundingSphere(){}
 dispose(){this.disposed=true}
}
const THREE={BufferGeometry:Geometry,BufferAttribute:Attribute};

test('native pine ageing retains separate glTF foliage material ranges',()=>{
 const original=new Geometry();
 const positions=[];
 const heights=[.1,.54,.65,.68,.9];
 for(const y of heights){
  positions.push(-.15,y,0,.15,y,0,0,y,.20);
 }
 original.setAttribute('position',new Attribute(new Float32Array(positions),3));
 original.setAttribute('uv',new Attribute(new Float32Array(heights.flatMap(()=>
  [0,0,1,0,.5,1])),2));
 original.addGroup(0,6,0);
 original.addGroup(6,9,1);
 const mesh={isMesh:true,name:'Pine_Branches',
  material:[{name:'pine_branch'},{name:'pine_branch'}],
  geometry:original,userData:{}};
 const root={isObject3D:true,userData:{},traverse(callback){callback(mesh)}};
 const growth={age:80,pineType:'garden'};
 const profile=nativePineProfile(growth);
 const result=reshapeNativePine(THREE,root,growth);
 assert.equal(result.changed,1);
 assert.equal(result.copies,profile.copies);
 assert.equal(mesh.userData.pineNativeSculpted,true);
 assert.notEqual(mesh.geometry,original);
 assert.deepEqual(original.groups,[{start:0,count:6,materialIndex:0},{start:6,count:9,materialIndex:1}],
  'original cached glTF geometry must not change');
 assert.deepEqual(mesh.geometry.groups.slice(0,2),original.groups,
  'source glTF material groups must remain exactly intact');
 const copied=mesh.geometry.groups.slice(2);
 assert.equal(copied.length,2*profile.copies,
  'each growth tier should have grouped material 0 and 1 triangles');
 for(let tier=0;tier<profile.copies;tier++){
  const start=15+tier*9;
  assert.deepEqual(copied.slice(tier*2,tier*2+2),[
   {start,count:3,materialIndex:0},
   {start:start+3,count:6,materialIndex:1}
  ]);
 }
 const total=mesh.geometry.groups.reduce((n,g)=>n+g.count,0);
 assert.equal(total,mesh.geometry.getAttribute('position').count,
  'every original and transplanted triangle must be rendered');
 assert.equal(mesh.geometry.getAttribute('uv').count,mesh.geometry.getAttribute('position').count,
  'native GLB UV maps must extend to every transplanted triangle');
});
