import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {freshProject,normalizeProject} from '../forma-landscape-project-core.js';
import {composeProfessionalPlanSheet,professionalPlanPrompt,professionalPlanMode} from '../forma-landscape-professional-sheet.js';
const here=dirname(fileURLToPath(import.meta.url));
const src=n=>readFileSync(resolve(here,'..',n),'utf8');

function scene(){
 const p=freshProject();
 p.title='Landscape demo';p.north=35;p.verified=true;p.northVerified=false;
 p.objects=[
  {id:'tree001',catalogId:'pine',type:'trees',x:5,y:8,diameter:7,height:14},
  {id:'tree002',catalogId:'spruce',type:'trees',x:15,y:8,diameter:5,height:12},
  {id:'lawn001',catalogId:'universal',type:'lawns',points:[{x:0,y:0},{x:30,y:0},{x:30,y:40},{x:0,y:40}],width:1.2}
 ];
 return normalizeProject(p);
}
const map='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 40"><rect width="30" height="40"/></svg>';
test('professional A3-sheet modes have truthful dimensions, north and botanical legend',()=>{
 const doc=scene();
 for(const mode of ['presentation','planting','technical']){
  const output=composeProfessionalPlanSheet(map,doc,mode);
  assert.match(output,/viewBox="0 0 2400 1680"/);
  assert.match(output,/30 × 40 м/);
  assert.match(output,/Pinus sylvestris/);
  assert.match(output,/Picea abies/);
  assert.match(output,/ м²/,'measured area is rendered instead of mere polygon count');
  assert.match(output,/СЕВЕР · УСЛОВНЫЙ/,'verified measurements alone do not verify north');
  assert.match(output,/rotate\(-35\)/);
  assert.equal((output.match(/<svg/g)||[]).length,(output.match(/<\/svg>/g)||[]).length);
 }
 doc.northVerified=true;
 assert.match(composeProfessionalPlanSheet(map,doc),/СЕВЕР · ПОДТВЕРЖДЁН/);
});
test('AI prompt receives style and enforces unchanged measured source',()=>{
 const p=scene();
 for(const mode of ['presentation','planting','technical']){
  const prompt=professionalPlanPrompt({...p,presentationMode:mode});
  assert.match(prompt,/STRICT TRUE-ORTHOGRAPHIC 90-DEGREE TOP VIEW/);
  assert.match(prompt,/EXACTLY the same framing/);
  assert.match(prompt,/KEEP TEXT OUT/);
 }
 assert.equal(professionalPlanMode('not-a-mode'),'presentation');
});
test('2D phone touch dock keeps precise 10 cm operations with undo and image-safe mode selection',()=>{
 const code=src('forma-landscape-project.js'),css=src('forma-landscape-mobile-dock.css');
 assert.match(code,/id='lpTouchSelection'/);
 assert.match(code,/nudgeSelected\(b\.dataset\.planFine,\.1\)/);
 assert.match(code,/checkpoint\(\)/);
 assert.match(code,/modal\.append\(touchDock\)/);
 assert.match(code,/if\(b\.dataset\.planDone!==undefined\)/);
 assert.match(css,/min-height:44px/);
 assert.match(code,/landscapeMasterplan:\{\.\.\.coordinateSummary\(doc\),presentationMode\}/);
 assert.match(code,/northVerified/);
});
test('3D mobile object move is separated from camera with snap and finish',()=>{
 const html=src('forma-landscape-3d.html'),style=src('forma-mobile-landscape-v1.css');
 assert.match(html,/state\.mobileMoveMode/);
 assert.match(html,/controls\.enabled=false/);
 assert.match(html,/canvas\.setPointerCapture\?\.\(e\.pointerId\)/);
 assert.match(html,/function snapMobileObjectPosition/);
 assert.match(html,/nudgeSelectedObject/);
 assert.match(html,/id="selectedObjectDone"/);
 assert.match(style,/mobile-nudge/);
});
