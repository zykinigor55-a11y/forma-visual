import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {freshProject,byId} from '../forma-landscape-project-core.js';
import {masterplanPrompt} from '../forma-landscape-project-prompts.js';
import {composeProfessionalPlanSheet,professionalPlanMode} from '../forma-landscape-professional-sheet.js';

const dir=dirname(fileURLToPath(import.meta.url));
const file=name=>readFileSync(resolve(dir,'..',name),'utf8');
const project=()=>{
 const p=freshProject();
 p.title='Демо · частный участок';
 p.north=30;
 p.objects=[{id:'p-1',catalogId:'pine',type:'trees',x:5,y:8,diameter:4,height:12,rotation:0}];
 return p;
};
test('three professional modes preserve exact geometry constraints without photographer prompt',()=>{
 for(const mode of ['presentation','planting','technical']){
  const p=project();
  const prompt=masterplanPrompt({...p,presentationMode:mode});
  assert.match(prompt,/STRICT TRUE-ORTHOGRAPHIC 90-DEGREE TOP VIEW/);
  assert.match(prompt,/GEOMETRY LOCK/);
  assert.match(prompt,/EXISTING PLANT SCHEDULE/);
  assert.ok(!prompt.includes('MASTERPLAN REALISM 4.0'));
  assert.ok(prompt.includes('30.00m × 40.00m'));
 }
 assert.equal(professionalPlanMode('broken'),'presentation');
});
test('SVG presentation sheets have real measurements, north and original source artwork',()=>{
 const p=project();
 const source='<svg id="lpSvg" xmlns="http://www.w3.org/2000/svg" width="1400" height="1400" viewBox="0 0 30 40"><circle cx="5" cy="8" r="2"/></svg>';
 for(const mode of ['presentation','planting','technical']){
  const svg=composeProfessionalPlanSheet(source,p,mode);
  assert.match(svg,/viewBox="0 0 2400 1680"/);
  assert.match(svg,/circle cx="5" cy="8"/);
  assert.match(svg,/Сосна/);
  assert.match(svg,/× 1/);
  assert.match(svg,/СЕВЕР/);
  assert.match(svg,/Графическая шкала/);
  assert.match(svg,/rotate\(-30\)/);
 }
});
test('client wiring: direct mobile drag, layers, measured SVG and style mode',()=>{
 const scene=file('forma-landscape-3d.html'),plan=file('forma-landscape-project.js');
 assert.match(scene,/selectedObjectMove/);
 assert.match(scene,/state\.mobileMoveMode/);
 assert.match(scene,/controls\.enabled=false;\s*canvas\.setPointerCapture/);
 assert.match(scene,/if\(moved\)\{save\(\);rebuild\(\)/);
 assert.match(plan,/data-plan-layer/);
 assert.match(plan,/data-pro-sheet/);
 assert.match(plan,/landscapeMasterplan:\{\.\.\.coordinateSummary\(doc\),presentationMode\}/);
 assert.match(plan,/composeProfessionalPlanSheet\(src,doc,presentationMode\)/);
 assert.match(plan,/hiddenPlanLayers\.clear\(\)/);
});
