/* Regression tests for the user-approved FORMA ALFA 240mm wall/140mm windows.
 * Run using: npm test / node --test tests/alpha-openings.test.mjs
 * Pure Three.js API stubs: tests do not require WebGL or network.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {addAlphaReferenceHouse} from '../forma-landscape-3d-alpha-house.js';
import {alphaOpeningPlanes,ALFA_OPENING_DETAIL} from '../forma-landscape-3d-alpha-openings.js';

class Vec {
 constructor(x=0,y=0,z=0){this.set(x,y,z)}
 set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
 clone(){return new Vec(this.x,this.y,this.z)}
 sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this}
 length(){return Math.hypot(this.x,this.y,this.z)}
 normalize(){const l=this.length()||1;this.x/=l;this.y/=l;this.z/=l;return this}
}
class Group {
 constructor(){this.children=[];this.userData={};this.position=new Vec()}
 add(child){this.children.push(child)}
}
class Material {
 constructor(props={}){Object.assign(this,props);this.userData={}}
}
class Mesh {
 constructor(geometry,material){
  this.geometry=geometry;this.material=material;this.position=new Vec();
  this.rotation=new Vec();this.quaternion={setFromUnitVectors(){}};
  this.userData={};
 }
}
class InstancedMesh extends Mesh {
 constructor(geom,mat,count){super(geom,mat);this.count=count;this.instanceMatrix={}}
 setMatrixAt(){}
}
class Attr {
 constructor(data,n){this.array=data;this.itemSize=n;this.count=data.length/n}
 getX(i){return this.array[i*this.itemSize]}
 getY(i){return this.array[i*this.itemSize+1]}
 setXYZ(i,x,y,z){this.array[i*this.itemSize]=x;this.array[i*this.itemSize+1]=y;this.array[i*this.itemSize+2]=z}
 setXY(i,x,y){this.array[i*this.itemSize]=x;this.array[i*this.itemSize+1]=y}
}
class Shape {
 constructor(){this.points=[];this.holes=[]}
 moveTo(x,y){this.points.push([x,y])}
 lineTo(x,y){this.points.push([x,y])}
 closePath(){}
}
class ShapeGeometry {
 constructor(shape){
  this.shape=shape;
  const points=shape.points.concat(...shape.holes.map(h=>h.points));
  this.positions=new Attr(new Float32Array(points.flatMap(([x,y])=>[x,y,0])),3);
  this.uv=new Attr(new Float32Array(points.flat()),2);
 }
 getAttribute(name){return name==='position'?this.positions:this.uv}
 computeVertexNormals(){}
}
class BufferGeometry {
 setAttribute(name,value){this[name]=value}
 computeVertexNormals(){}
}
const T={
 Group,Mesh,InstancedMesh,
 BoxGeometry:class {constructor(...size){this.size=size}},
 Shape,Path:Shape,ShapeGeometry,BufferGeometry,
 Float32BufferAttribute:Attr,MeshStandardMaterial:Material,
 MeshPhysicalMaterial:Material,Vector3:Vec,
 Quaternion:class{},Matrix4:class {compose(){}},DoubleSide:2
};
const approx=(a,b,tol=.0005)=>assert.ok(Math.abs(a-b)<=tol,`expected ${a} ≈ ${b}`);
const tagged=(g,key)=>g.children.filter(m=>m.userData?.architecturePart===key);
const build=(width,depth,roofRise)=>{
 const data={archStyle:'alpha',width,height:depth,roofRise,x:14,y:18,rotation:30};
 const original=JSON.stringify(data);
 const world=new Group();
 const group=addAlphaReferenceHouse(T,world,data,{width,depth});
 assert.equal(JSON.stringify(data),original,'No mutations to saved building state');
 assert.equal(world.children[0],group);
 return group;
};
test('ALFA 240mm walls, 140mm recessed frame and 6-20-6 glazing',()=>{
 const w=7.5,d=9.5,g=build(w,d,w*.79);
 const front=d/2+.058,plane=alphaOpeningPlanes(front);
 approx(plane.zOuter-plane.zInner,.24);
 approx(plane.zOuter-plane.zFrameFront,.14);
 approx(plane.zGlassOuter-plane.zGlassInner,.026);
 assert.equal(ALFA_OPENING_DETAIL.paneThickness,.006);
 assert.equal(ALFA_OPENING_DETAIL.glassUnitThickness,.032);
 const outer=tagged(g,'alpha-front-single-pbr-textured-facade')[0];
 const inner=tagged(g,'alpha-front-inner-wall-with-openings')[0];
 assert.ok(outer&&inner,'Both fascia and inner gable wall must exist');
 assert.equal(outer.geometry.shape.holes.length,2);
 assert.equal(inner.geometry.shape.holes.length,2);
 for(let i=0;i<2;i++)
  assert.deepEqual(inner.geometry.shape.holes[i].points,outer.geometry.shape.holes[i].points);
 approx(outer.geometry.getAttribute('position').array[2],plane.zOuter);
 approx(inner.geometry.getAttribute('position').array[2],plane.zInner);
 assert.equal(tagged(g,'alpha-front-reveals-140mm-inset').length,1);
 assert.equal(tagged(g,'alpha-interior-return-after-window-frame').length,1);
 assert.equal(tagged(g,'alpha-opening-cladding-20mm-edge').length,1);
 assert.equal(tagged(g,'alpha-opening-30mm-ventilated-edge').length,1);
 assert.equal(tagged(g,'alpha-sliding-weathered-sill-four-degree-fall').length,1);
 assert.equal(tagged(g,'alpha-sliding-sill-30mm-water-drip').length,1);
 assert.equal(tagged(g,'alpha-sliding-low-iron-exterior-pane').length,4);
 assert.equal(tagged(g,'alpha-sliding-low-iron-interior-pane').length,4);
 assert.equal(tagged(g,'alpha-gable-glass-exterior-leaf').length,1);
 assert.equal(tagged(g,'alpha-gable-glass-interior-leaf').length,1);
 for(const mesh of tagged(g,'alpha-sliding-low-iron-exterior-pane'))
  approx(mesh.position.z,plane.zGlassOuter);
 for(const mesh of tagged(g,'alpha-sliding-low-iron-interior-pane'))
  approx(mesh.position.z,plane.zGlassInner);
 const frontGlass=tagged(g,'alpha-gable-glass-exterior-leaf')[0]
  .geometry.getAttribute('position').array;
 for(let i=2;i<frontGlass.length;i+=3)
  approx(frontGlass[i],plane.zGlassOuter);
 assert.ok(tagged(g,'alpha-roof-closed-gable-cassette-ends').length===1);
 assert.deepEqual(tagged(g,'alpha-standing-seam-roof-with-openings').map(m=>m.geometry.shape.holes.length),[4,0]);
 assert.ok(tagged(g,'alpha-rear-inner-wall').length===1);
 assert.ok(tagged(g,'alpha-rear-wall-240mm-perimeter').length===1);
 assert.equal(tagged(g,'alpha-front-graphite-vertical-timber-board').length,0);
 assert.equal(tagged(g,'alpha-lower-facade-door-glazing').length,0);
 assert.equal(g.userData.alphaWall.thicknessM,.24);
 assert.equal(g.userData.alphaFenestration.frameRecessM,.14);
});
test('ALFA variable widths do not generate non-finite vertices or inverted boxes',()=>{
 for(const [w,d] of [[2,2],[5.5,6.2],[7.5,9.5],[12,15]]){
  const g=build(w,d,Math.max(4.2,Math.min(8,w*.79)));
  for(const m of g.children){
   const positions=m.geometry?.position?.array||m.geometry?.positions?.array||[];
   for(const n of positions)assert.ok(Number.isFinite(n),'non-finite vertex');
   for(const n of m.geometry?.size||[])assert.ok(Number.isFinite(n)&&n>0,'invalid box size');
   for(const n of [m.position?.x,m.position?.y,m.position?.z].filter(n=>n!==undefined))
    assert.ok(Number.isFinite(n),'non-finite transform');
  }
  assert.equal(tagged(g,'alpha-front-inner-wall-with-openings')[0].geometry.shape.holes.length,2);
  assert.equal(tagged(g,'alpha-sliding-low-iron-exterior-pane').length,4);
  assert.equal(tagged(g,'alpha-standing-seam-roof-with-openings')[0].geometry.shape.holes.length,4);
 }
});
