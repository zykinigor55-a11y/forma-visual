import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
 heightAt,inParcel,terrainTriangles,squareTerrainSide,squareTerrainTriangles
} from '../forma-landscape-3d-geometry.js';

const here=dirname(fileURLToPath(import.meta.url));
const html=()=>readFileSync(resolve(here,'../forma-landscape-3d.html'),'utf8');
const site={width:30,height:40,boundary:[
 {x:0,y:0},{x:30,y:0},{x:18,y:18},{x:30,y:40},{x:0,y:40}
]};
const grid=48;
const heights=Array.from({length:(grid+1)**2},(_,i)=>.4*Math.sin(i*.11));
test('ground presentation is a complete square, even with a concave site outline',()=>{
 const v=squareTerrainTriangles(site,heights,grid);
 const side=squareTerrainSide(site);
 assert.equal(v.length,grid*grid*18);
 const xs=[],zs=[];
 let signedArea=0;
 for(let i=0;i<v.length;i+=9){
  const [ax,ay,az,bx,by,bz,cx,cy,cz]=v.slice(i,i+9);
  signedArea+=(bz-az)*(cx-ax)-(bx-ax)*(cz-az);
  xs.push(ax,bx,cx);zs.push(az,bz,cz);
  for(const q of [ax,ay,az,bx,by,bz,cx,cy,cz])assert.ok(Number.isFinite(q));
 }
 assert.equal(Math.min(...xs),-side/2);
 assert.equal(Math.max(...xs),side/2);
 assert.equal(Math.min(...zs),-side/2);
 assert.equal(Math.max(...zs),side/2);
 assert.ok(Math.abs(signedArea/2-side*side)<.00001);
 assert.ok(signedArea>0,'triangles have upward-facing XZ normals');
});
test('actual property boundary and existing terrain heights are unchanged',()=>{
 const old=terrainTriangles(site,heights,grid);
 const square=squareTerrainTriangles(site,heights,grid);
 assert.ok(old.length<square.length,'the old scene was visually clipped by the parcel');
 assert.equal(inParcel({x:26,y:18},site),false);
 assert.equal(inParcel({x:10,y:10},site),true);
 const center=square.findIndex((q,i)=>i%3===0&&Math.abs(q)<.01);
 assert.ok(center>=0);
 for(let i=0;i<square.length;i+=3){
  const x=square[i],z=square[i+2];
  if(Math.abs(x)>site.width/2&&Math.abs(z)>site.height/2)continue;
  assert.ok(Math.abs(square[i+1]-heightAt(heights,grid,site.width,site.height,x,z))<1e-6);
 }
});
test('3D uses square presentation ground, while a measured underlay remains clipped to the parcel',()=>{
 const src=html();
 assert.match(src,/squareTerrainTriangles\(doc\.site,heightmap,GRID\)/);
 assert.match(src,/groundSide=squareTerrainSide\(doc\.site\)/);
 assert.match(src,/const verts=terrainTriangles\(doc\.site,heightmap,GRID\)/);
 assert.match(src,/doc\.site\.boundary\?\.length>=3/);
 assert.match(src,/inParcel\(point,doc\.site\)/);
});
