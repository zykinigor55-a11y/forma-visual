import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {heightAt,inParcel,clipToCell,terrainTriangles,roofTriangles} from '../forma-landscape-3d-geometry.js';

test('3D heights are continuous between measured terrain samples',()=>{
 const heights=[0,10,20,30];
 assert.equal(heightAt(heights,1,10,10,-5,-5),0);
 assert.equal(heightAt(heights,1,10,10,5,5),30);
 assert.equal(heightAt(heights,1,10,10,0,0),15);
 assert.equal(heightAt(heights,1,10,10,2.5,0),17.5);
});

test('arbitrary plot boundaries reject points outside the actual polygon',()=>{
 const site={width:10,height:10,boundary:[{x:0,y:0},{x:10,y:0},{x:0,y:10}]};
 assert.equal(inParcel({x:2,y:2},site),true);
 assert.equal(inParcel({x:8,y:8},site),false);
 assert.equal(inParcel({x:0,y:6},site),true);
 assert.equal(inParcel({x:11,y:2},site),false);
 assert.equal(inParcel({x:8,y:8},{width:10,height:10}),true);
});

test('terrain polygons clip to parcel without drawing arbitrary full rectangle',()=>{
 const site={width:10,height:10,boundary:[{x:0,y:0},{x:10,y:0},{x:0,y:10}]};
 const data=terrainTriangles(site,new Array(25).fill(0),4);
 assert.ok(data.length>0&&data.length%9===0);
 let area=0;
 for(let i=0;i<data.length;i+=9){
  const [ax,,az,bx,,bz,cx,,cz]=Array.from(data.slice(i,i+9));
  area+=Math.abs((bx-ax)*(cz-az)-(cx-ax)*(bz-az))/2;
 }
 assert.ok(Math.abs(area-50)<.001,'The triangular parcel has exact 50m2 ground, got '+area);
 const poly=clipToCell([{x:-2,z:-2},{x:2,z:-2},{x:2,z:2},{x:-2,z:2}],-1,-1,1,1);
 assert.ok(poly.length>=4);
});

test('roof facets preserve measured building footprint and distinguish gable and hip',()=>{
 const g=roofTriangles(12,8,'gable'),h=roofTriangles(12,8,'hip');
 assert.ok(g.length>0&&h.length>0&&g.length%9===0&&h.length%9===0);
 assert.ok([...g].every(Number.isFinite)&&[...h].every(Number.isFinite));
 assert.ok(Math.max(...g.filter((_,i)=>i%3===1))>3.6);
 assert.ok(Math.max(...g.filter((_,i)=>i%3===0))<=6.25);
});

test('3D editor uses shared model with explicit contour finish instead of auto-closing after 2 points',()=>{
 const html=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
 assert.match(html,/terrainTriangles\(doc.site,heightmap,GRID\)/);
 assert.match(html,/createArchitecturalBuilding\(THREE,b,/);
 assert.match(html,/HOUSE_PRESETS,housePreset,createArchitecturalBuilding/);
 assert.match(html,/function finishContour\(/);
 assert.match(html,/id="finishContour"/);
 assert.match(html,/pointMode.push\(point\);refreshDraft\(\)/);
 assert.match(html,/inParcel\(point,doc.site\)/);
 assert.match(html,/KEY='forma-landscape-masterplan-v1-'/);
});

test('3D HTML embedded module parses as JavaScript without a browser',()=>{
 const html=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
 const start=html.indexOf('<script type="module">'),end=html.indexOf('</script>',start);
 const source=start>=0&&end>start?html.slice(start+'<script type="module">'.length,end):null;
 assert.ok(source,'3D editor module must exist');
 const parsed=spawnSync(process.execPath,['--check','--input-type=module'],{input:source,encoding:'utf8'});
 assert.equal(parsed.status,0,parsed.stderr);
});

test('perspective AI prompt keeps original camera and object coordinates without changing render queue',async()=>{
 const {perspectiveLandscapePrompt}=await import('../forma-landscape-project-prompts.js');
 const {freshProject,coordinateSummary}=await import('../forma-landscape-project-core.js');
 const source={...coordinateSummary(freshProject()),cameraMode:'3d-perspective',cameraView:'3d'};
 const prompt=perspectiveLandscapePrompt(source);
 assert.match(prompt,/IMMUTABLE CAMERA CONTRACT/);
 assert.match(prompt,/ABSOLUTE GEOMETRY LOCK/);
 assert.match(prompt,/Do not force overhead view/);
 assert.match(prompt,/NO landscape|There are NO landscape objects|NO landscape objects/i);
 const server=readFileSync(new URL('../server.mjs',import.meta.url),'utf8');
 assert.match(server,/landscapeMasterplan.cameraMode==='3d-perspective'\?perspectiveLandscapePrompt/);
});

test('twelve independently selectable house presets preserve measured footprints and roof contracts',async()=>{
 const {HOUSE_PRESETS,housePreset,housePresetIds}=await import('../forma-landscape-3d-buildings.js');
 const {normalizeProject,freshProject}=await import('../forma-landscape-project-core.js');
 assert.equal(HOUSE_PRESETS.length,12);
 assert.equal(new Set(housePresetIds).size,12);
 assert.ok(HOUSE_PRESETS.every(x=>x.name&&x.wall&&['gable','hip','flat'].includes(x.roof)));
 const d=freshProject();d.house.archStyle='brick';d.house.roof='hip';d.house.roofRise=2.3;
 d.buildings=[{id:'b-1',type:'house',x:4,y:4,width:7,height:5,rotation:0,roof:'flat',roofRise:1.6,archStyle:'japandi'}];
 const n=normalizeProject(d);
 assert.equal(n.house.width,d.house.width);assert.equal(n.house.height,d.house.height);
 assert.equal(n.house.archStyle,'brick');assert.equal(n.house.roofRise,2.3);
 assert.equal(n.buildings[0].archStyle,'japandi');assert.equal(n.buildings[0].roof,'flat');
 assert.equal(housePreset('invalid').id,'barn');
});
