import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TERRAIN_GRID,inferTerrainGrid,resampleTerrainGrid,sampledTerrainNormals} from '../forma-landscape-3d-terrain-grid.js';
import {heightAt,terrainTriangles} from '../forma-landscape-3d-geometry.js';
import {walkStep,walkMovementKey,WALK_EYE_HEIGHT} from '../forma-landscape-3d-walk.js';
import {applyTerrainBrush} from '../forma-landscape-3d-terrain-brush.js';
const html=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
test('double resolution of measured terrain, preserving legacy sample heights and actual dimensions',()=>{
 assert.equal(TERRAIN_GRID,96);
 const old=48,prior=Array.from({length:(old+1)*(old+1)},(_,i)=>{
  const x=i%(old+1),z=Math.floor(i/(old+1));return .1*x+.04*z;
 });
 assert.equal(inferTerrainGrid(prior),48);
 const updated=resampleTerrainGrid(prior,96);
 assert.equal(updated.length,97*97);
 for(let z=0;z<=48;z++)for(let x=0;x<=48;x++){
  assert.ok(Math.abs(updated[(2*z)*97+2*x]-prior[z*49+x])<1e-12);
 }
 assert.equal(updated[48*97+48],prior[24*49+24]);
 assert.deepEqual(resampleTerrainGrid(updated,96),updated);
 assert.deepEqual(resampleTerrainGrid([1,2,3],96).slice(0,4),[0,0,0,0],'invalid arrays must not corrupt grid');
});
test('terrain uses smoothed physical normals rather than faceted triangle normals',()=>{
 const site={width:20,height:20},h=Array.from({length:97*97},(_,i)=>Math.sin((i%97)/96*Math.PI)*.45);
 const geometry=terrainTriangles(site,h,96);
 assert.ok(geometry.length>50000);
 const norm=sampledTerrainNormals(geometry,20,20,(x,z)=>heightAt(h,96,20,20,x,z));
 assert.equal(norm.length,geometry.length);
 for(let i=0;i<norm.length;i+=3){
  assert.ok(Math.abs(Math.hypot(norm[i],norm[i+1],norm[i+2])-1)<.00001);
  assert.ok(norm[i+1]>.6,'surface stays upward facing');
 }
 assert.match(html,/sampledTerrainNormals\(vertices,w,h/);
});
test('brush strokes change slopes by centimetres instead of huge meters',()=>{
 const g=96,blank=Array((g+1)*(g+1)).fill(0);
 const data={heights:blank,grid:g,width:30,length:40,world:{x:0,z:0},mode:'raise',radius:3,strength:.12,softness:92};
 const result=applyTerrainBrush(data);
 const centre=result[(g/2)*(g+1)+g/2];
 assert.ok(centre>=.02&&centre<.04,'normal single brush step below 4 cm');
 assert.ok(result.every(v=>v>=0&&v<=centre));
 assert.equal(result[0],0);
 assert.match(html,/heightmap=resampleTerrainGrid\(heightmap,GRID\)/);
 assert.match(html,/max="\.8" step="\.02" value="\.12"/);
});
test('walk position is always terrain height plus eye level even while yawing or walking backwards',()=>{
 assert.ok(walkMovementKey('w'));assert.ok(walkMovementKey('ArrowUp'));assert.equal(walkMovementKey('space'),false);
 const terrain=(x,z)=>2+z*.04,contains=(x,z)=>x>=-5&&x<=5&&z>=-5&&z<=5;
 let p=walkStep({x:0,z:0,yaw:0,keys:['w'],dt:.1,ground:terrain,contains});
 assert.ok(p.z<0&&Math.abs(p.x)<1e-9);
 assert.equal(p.y,terrain(p.x,p.z)+WALK_EYE_HEIGHT);
 const back=walkStep({...p,yaw:0,keys:['s'],dt:.1,ground:terrain,contains});
 assert.ok(Math.abs(back.z)<.0001);
 const right=walkStep({...p,yaw:0,keys:['d'],dt:.1,ground:terrain,contains});
 assert.ok(right.x>p.x);
 const diagonal=walkStep({x:0,z:0,yaw:0,keys:['w','d'],dt:.1,ground:terrain,contains});
 assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.z)-.28)<1e-9,'diagonal movement should not be faster');
 const boundary=walkStep({x:5,z:5,yaw:0,keys:['s','d'],dt:.1,ground:terrain,contains});
 assert.equal(boundary.moved,false);assert.equal(boundary.y,terrain(5,5)+WALK_EYE_HEIGHT);
 assert.equal(walkStep({x:0,z:0,yaw:1.1,keys:[],dt:1,ground:terrain,contains}).y,2+WALK_EYE_HEIGHT);
});
test('Delete and Backspace reuse one undoable selection-removal path; walk uses held key state',()=>{
 assert.match(html,/function deleteSelectedObject\(\)/);
 assert.match(html,/\$\('#deleteObject'\)\.onclick=deleteSelectedObject/);
 assert.match(html,/key==='delete'\|\|key==='backspace'/);
 assert.match(html,/if\(ref\.type==='house'\)/);
 assert.match(html,/heldWalkKeys\.add\(key\)/);
 assert.match(html,/window\.addEventListener\('keyup'/);
 assert.match(html,/walkStep\(\{/);
 assert.match(html,/document\.exitPointerLock\?\.\(\)/);
 assert.match(html,/id="cameraHeight"/);
 assert.match(html,/id="cameraEyeLevel"/);
 assert.match(html,/id="walkInstructions"/);
});


test('Walk cannot clip through rotated house footprints and slides beside walls',async()=>{
 const {walkCanOccupy}=await import('../forma-landscape-3d-walk.js');
 const house={x:0,z:0,width:6,depth:4,rotation:0};
 assert.equal(walkCanOccupy(0,0,[house]),false);
 assert.equal(walkCanOccupy(4,0,[house]),true);
 assert.equal(walkCanOccupy(0,3,[house]),true);
 assert.equal(walkCanOccupy(0,2,[{...house,rotation:90}]),false);
 const wall=[{x:0,z:-.65,width:1,depth:1}];
 const p=walkStep({x:-.9,z:0,yaw:0,keys:['w','d'],dt:.1,obstacles:wall});
 assert.ok(p.z<0,'movement should continue along the unobstructed wall axis');
 assert.equal(p.x,-.9,'movement cannot penetrate expanded building footprint');
 const blocked=walkStep({x:0,z:0,yaw:0,keys:['w'],dt:.1,obstacles:[{x:0,z:-1,width:1,depth:1}]});
 assert.equal(blocked.moved,false);
 assert.match(html,/obstacles:walkStructureObstacles\(\)/);
 assert.match(html,/walkCanOccupy\(x,z,obstacles\)/);
});
test('3D editor selection does not produce phantom undo entries; terrain strokes use metre spacing',()=>{
 assert.match(html,/terrainStrokeSamples\(terrainStrokeLast,p,spacing\)/);
 assert.match(html,/state\.draggingMoved=true;push\(\)/);
 assert.match(html,/if\(moved\)\{save\(\);rebuild\(\)\}/);
});
