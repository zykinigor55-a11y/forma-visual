import test from 'node:test';
import assert from 'node:assert/strict';
import {
 ROOF_GARLAND_DEFAULTS,normalizeRoofGarland,garlandLayout,addRoofGarland,roofGarlandPhotoContract
} from '../forma-landscape-roof-garlands.js';
import {interiorLightLevels} from '../forma-landscape-3d-night-interior.js';
import {freshProject,normalizeProject} from '../forma-landscape-project-core.js';

class Group {
 constructor(){this.children=[];this.userData={};this.name=''}
 add(child){this.children.push(child)}
}
class Dummy{
 constructor(){this.position={set:(...a)=>{this.p=a}};this.scale={set:(...a)=>{this.s=a}};this.matrix={}}
 updateMatrix(){this.matrix={position:this.p,scale:this.s}}
}
class Buffer{
 setAttribute(){return this}
}
class Instanced{
 constructor(geometry,material,count){this.geometry=geometry;this.material=material;this.count=count;this.instanceMatrix={needsUpdate:false}}
 setMatrixAt(){}
}
class PointLight{
 constructor(color,intensity,distance,decay){Object.assign(this,{color,intensity,distance,decay,userData:{}});this.position={set(){}}}
}
const T={
 Group,Object3D:Dummy,PointLight,
 InstancedMesh:Instanced,BufferGeometry:Buffer,
 Float32BufferAttribute:class{},
 LineBasicMaterial:class{constructor(opts){Object.assign(this,opts)}},
 MeshStandardMaterial:class{constructor(opts){Object.assign(this,opts)}},
 CylinderGeometry:class{},SphereGeometry:class{},IcosahedronGeometry:class{},
 LineSegments:class{constructor(geometry,material){this.geometry=geometry;this.material=material}}
};
const base={enabled:true,type:'retro',temperature:'warm',brightness:65,placement:'front'};
const options={width:7.5,depth:9.5,eave:.65,rise:5.8,overhang:.22,style:'alpha',roof:'gable'};
test('garland layout follows A-frame triangular fascia, not an invented rectangular bar',()=>{
 const paths=garlandLayout({...options,placement:'front'});
 assert.equal(paths.length,1);
 assert.equal(paths[0].length,3);
 assert.ok(paths[0][1][1]>paths[0][0][1]+5);
 assert.equal(paths[0][0][2],paths[0][2][2]);
 assert.equal(garlandLayout({...options,placement:'perimeter'}).length,4);
 assert.equal(garlandLayout({...options,style:'modern',roof:'flat'}).at(0).length,2);
});
test('garlands default OFF; settings persist for main house and outbuildings',()=>{
 assert.equal(normalizeRoofGarland({}).enabled,false);
 assert.equal(ROOF_GARLAND_DEFAULTS.type,'retro');
 const p=freshProject();
 assert.equal(p.house.garland.enabled,false);
 p.house.garland={...base,type:'icicle',temperature:'cool',brightness:95,placement:'perimeter'};
 p.buildings.push({id:'outbuilding1',type:'bath',x:7,y:8,width:5,height:6,garland:{...base}});
 const saved=normalizeProject(p);
 assert.equal(saved.house.garland.type,'icicle');
 assert.equal(saved.house.garland.temperature,'cool');
 assert.equal(saved.house.garland.brightness,95);
 assert.equal(saved.buildings[0].garland.type,'retro');
 assert.equal(normalizeRoofGarland({enabled:true,brightness:250}).brightness,100);
});
test('retro and icicle lights are 3D mesh instances with no excessive light sources',()=>{
 assert.equal(addRoofGarland(T,{garland:{...base,enabled:false}},options),null);
 const retro=addRoofGarland(T,{garland:base},{...options,night:true});
 assert.ok(retro);assert.equal(retro.name,'forma-roof-garland');
 const bulbs=retro.children.find(item=>item instanceof Instanced&&item.name?.startsWith('roof-garland-'));
 assert.ok(bulbs);
 assert.ok(bulbs.count>10);
 assert.ok(bulbs.material.emissiveIntensity>0);
 assert.ok(retro.children.filter(item=>item instanceof PointLight).length<=2);
 const icicle=addRoofGarland(T,{garland:{...base,type:'icicle',temperature:'cool'}},{...options,night:true});
 const drops=icicle.children.find(item=>item instanceof Instanced&&item.name?.startsWith('roof-garland-'));
 assert.ok(drops.count>bulbs.count);
 assert.equal(drops.material.emissive,'#D7EEFF');
 const daytime=addRoofGarland(T,{garland:base},{...options,night:false});
 const dark=daytime.children.find(item=>item instanceof Instanced&&item.name?.startsWith('roof-garland-'));
 assert.equal(dark.material.emissiveIntensity,0);
 assert.equal(daytime.children.filter(item=>item instanceof PointLight).length,0);
});
test('interior lighting grows progressively as the slider rises',()=>{
 const levels=[0,10,35,65,100].map(brightness=>interiorLightLevels({
  lightsEnabled:true,brightness,windowGlow:80
 }));
 for(let i=1;i<levels.length;i++){
  assert.ok(levels[i].pointIntensity>levels[i-1].pointIntensity);
  assert.ok(levels[i].windowEmission>levels[i-1].windowEmission);
  assert.ok(levels[i].fixtureEmission>levels[i-1].fixtureEmission);
 }
 assert.equal(interiorLightLevels({lightsEnabled:false,brightness:100}).pointIntensity,0);
});
test('photographic renderer preserves roof structure and respects selected color/type',()=>{
 const text=roofGarlandPhotoContract({garland:{...base,type:'icicle',temperature:'cool'}});
 assert.match(text,/Hanging icicle-light rain/);
 assert.match(text,/Color temperature cool/);
 assert.match(text,/Preserve the exact original roof structure/);
 assert.match(roofGarlandPhotoContract({garland:{enabled:false}}),/None/);
});
