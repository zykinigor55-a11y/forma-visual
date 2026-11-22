import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {pavingPathMaterial} from '../forma-landscape-3d-surfaces.js';
import {professionalPlanPrompt} from '../forma-landscape-professional-sheet.js';
import {interiorLightLevels} from '../forma-landscape-3d-night-interior.js';
const here=dirname(fileURLToPath(import.meta.url));
const read=name=>readFileSync(resolve(here,'..',name),'utf8');
const route=(id,catalogId,width,points)=>({id,catalogId,type:'pavers',width,points});
const project={site:{width:30,height:40},house:{width:10,height:8},objects:[
 route('path1','concrete-pavers',1.5,[{x:2,y:3},{x:10,y:3}]),
 route('path2','clinker-herringbone',1.1,[{x:4,y:5},{x:4,y:13}])
]};
function fakeTexture(){
 return {repeat:{set(x,y){this.x=x;this.y=y}},anisotropy:1,
  clone(){return fakeTexture()}};
}
const FakeTHREE={
 TextureLoader:class {load(){return fakeTexture()}},
 MeshStandardMaterial:class {constructor(options){Object.assign(this,options)}},
 RepeatWrapping:1000,SRGBColorSpace:3001,DoubleSide:2
};

test('each selected paving catalog item receives its own named 3D texture and real scale',()=>{
 const a=pavingPathMaterial(FakeTHREE,'concrete-pavers',1.5,8);
 const b=pavingPathMaterial(FakeTHREE,'clinker-herringbone',1.5,8);
 assert.equal(a.userData.formaMaterialId,'concrete-pavers');
 assert.equal(b.userData.formaMaterialId,'clinker-herringbone');
 assert.notEqual(a.map.name,b.map.name);
 assert.notEqual(a.map.repeat.x,b.map.repeat.x);
 assert.notEqual(a.map.repeat.y,b.map.repeat.y);
});
test('professional genplan AI locks different materials to source polylines',()=>{
 const p=professionalPlanPrompt({...project,presentationMode:'presentation'});
 assert.match(p,/Path 1 \/ concrete-pavers/);
 assert.match(p,/Path 2 \/ clinker-herringbone/);
 assert.match(p,/1\.50 m/);
 assert.match(p,/1\.10 m/);
 assert.match(p,/Do not render all paths as one repeated concrete slab pattern/);
 const photoSource=read('forma-landscape-project-prompts.js');
 assert.match(photoSource,/INDIVIDUAL SOURCE-LINKED PAVING PATHS/);
 assert.match(photoSource,/material ID /);
 assert.match(photoSource,/measured polyline/);
});
test('the paving selection edits only an existing selected road, not an overlapping copy',()=>{
 const js=read('forma-landscape-project.js');
 assert.match(js,/selectedPath\.catalogId=material\.id/);
 assert.match(js,/mode='select';photoVisible=false/);
 assert.match(js,/Math\.min\(d\*\.32,1\.6\)/);
});
test('touch mode places lamps without opening a blocking inspector automatically',()=>{
 const html=read('forma-landscape-3d.html');
 const css=read('forma-mobile-object-editor-v1.css');
 assert.match(html,/id="mobilePlacementHint"/);
 assert.match(html,/id="mobilePlacementCancel"/);
 assert.match(html,/id="mobileHouseSelect"/);
 assert.match(html,/e\.pointerType==='mouse'&&!e\.shiftKey&&\['plant','light'/);
 assert.match(html,/window\.innerWidth<=850&&!state\.mobileMoveMode/);
 assert.match(html,/data-mobile-panel="scene"/);
 assert.match(css,/#mobilePlacementHint:not\(\[hidden\]\)/);
 assert.match(css,/#mobileHouseSelect/);
});
test('house has both roof garlands and progressive interior lighting controls',()=>{
 const html=read('forma-landscape-3d.html');
 assert.match(html,/houseInteriorMarkup\(\)/);
 assert.match(html,/roofGarlandMarkup\(o\)/);
 assert.match(html,/id="houseSwitchToNight"/);
 assert.match(html,/id="houseInteriorBrightness"/);
 assert.match(html,/id="houseWindowGlow"/);
 const seq=[0,25,50,75,100].map(brightness=>interiorLightLevels({
  lightsEnabled:true,brightness,windowGlow:80
 }));
 for(let i=1;i<seq.length;i++){
  assert.ok(seq[i].windowEmission>seq[i-1].windowEmission);
  assert.ok(seq[i].pointIntensity>seq[i-1].pointIntensity);
  assert.ok(seq[i].floorEmission>seq[i-1].floorEmission);
 }
 assert.equal(interiorLightLevels({lightsEnabled:false,brightness:100}).windowEmission,0);
});
