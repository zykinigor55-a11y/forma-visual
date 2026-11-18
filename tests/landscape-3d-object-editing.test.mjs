import test from 'node:test';
import assert from 'node:assert/strict';
import {duplicateLandscapeObject,rotatedLandscapeObject,normalizedRotation} from '../forma-landscape-3d-editing.js';

test('3D rotation uses normalized finite degrees without mutating saved original',()=>{
 const original={id:'tree-1',x:4,y:4,rotation:355,type:'pine'};
 assert.equal(normalizedRotation(-15),345);
 assert.equal(normalizedRotation(735),15);
 assert.equal(normalizedRotation(NaN),0);
 const rotated=rotatedLandscapeObject(original,15);
 assert.equal(rotated.rotation,10);
 assert.equal(original.rotation,355);
 assert.equal(rotatedLandscapeObject(original,-15).rotation,340);
});
test('duplicating a real PBR GLB preserves licence-linked source and physical scale',()=>{
 const src={id:'a',type:'rock-grey',x:7,y:8,width:1.4,rotation:15,metadata:{source:'Poly Haven CC0'}};
 const copy=duplicateLandscapeObject(src,{newId:'b',plot:{width:30,height:40}});
 assert.ok(copy);
 assert.equal(copy.id,'b');
 assert.equal(copy.type,'rock-grey');
 assert.equal(copy.width,1.4);
 assert.equal(copy.metadata.source,'Poly Haven CC0');
 assert.notEqual(copy.x,src.x);
 assert.notEqual(copy.y,src.y);
 copy.metadata.source='edited';
 assert.equal(src.metadata.source,'Poly Haven CC0');
});
test('near a surveyed corner duplicate tries opposite direction instead of leaving parcel',()=>{
 const edge={id:'a',type:'fern',x:9.4,y:9.4,width:1.2,rotation:20};
 const copy=duplicateLandscapeObject(edge,{newId:'b',plot:{width:10,height:10}});
 assert.ok(copy);
 assert.ok(copy.x>=0&&copy.x<=10&&copy.y>=0&&copy.y<=10);
 assert.ok(copy.x<edge.x);
 assert.equal(copy.rotation,20);
});
test('polygon and path duplicates preserve every vertex and stroke properties',()=>{
 const src={id:'a',points:[{x:1,y:1},{x:3,y:1},{x:3,y:2}],x:1,y:1,width:.85,type:'fence'};
 const copy=duplicateLandscapeObject(src,{newId:'b',plot:{width:30,height:30}});
 assert.ok(copy);
 assert.equal(copy.points.length,3);
 assert.equal(copy.points[1].x-copy.points[0].x,2);
 assert.equal(copy.points[1].y-copy.points[0].y,0);
 assert.equal(copy.width,.85);
 assert.equal(src.points[0].x,1);
});
test('duplicate never leaves custom polygon plot boundaries',()=>{
 const src={id:'a',x:5,y:5,width:3,type:'garden-bench'};
 assert.equal(duplicateLandscapeObject(src,{newId:'b',contains:()=>false}),null);
 assert.equal(duplicateLandscapeObject(src,{newId:''}),null);
 assert.equal(duplicateLandscapeObject(null,{newId:'b'}),null);
});
test('editor integrates selection ring, quick rotation and duplication controls',async()=>{
 const {readFileSync}=await import('node:fs');
 const page=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
 assert.match(page,/duplicateLandscapeObject\(/);
 assert.match(page,/rotatedLandscapeObject\(/);
 assert.match(page,/new THREE\.RingGeometry/);
 assert.match(page,/ring\.raycast=\(\)=>\{\}/);
 for(const id of ['rotateLeft','rotateRight','duplicateObject'])assert.ok(page.includes('id="'+id+'"'),id);
 assert.match(page,/Array\.isArray\(n\.material\)\?n\.material:\[n\.material\]/,'PBR materials must be released across all GLB meshes');
});


test('editing measured geometry rejects negative size, blank values and positions outside the plot',async()=>{
 const {validatedLandscapeProps}=await import('../forma-landscape-3d-editing.js');
 const original={x:5,y:5,width:6,height:8,rotation:5};
 const config={plot:{width:30,height:20},kind:'house',contains:p=>p.x>=0&&p.y>=0&&p.x+p.y<=30};
 const updated=validatedLandscapeProps(original,{x:'7',y:'6',width:'8',height:'10',rotation:'365'},config);
 assert.equal(updated.width,8);assert.equal(updated.height,10);assert.equal(updated.rotation,5);
 assert.equal(original.width,6,'edited copy must not mutate saved original before commit');
 for(const patch of [{width:'-1'},{height:''},{x:'31'},{y:'-2'},{rotation:'NaN'},{roofRise:'-4'},{x:'24',y:'10'}]){
  assert.equal(validatedLandscapeProps(original,patch,config),null,JSON.stringify(patch));
 }
 assert.equal(validatedLandscapeProps({x:2,y:2,width:1.4},{width:'35'},{plot:{width:30,height:20},kind:'extra',model:true}),null);
});
