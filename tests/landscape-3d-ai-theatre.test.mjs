import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {coordinateSummary,freshProject} from '../forma-landscape-project-core.js';
import {perspectiveLandscapePrompt} from '../forma-landscape-project-prompts.js';
const page=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
const server=readFileSync(new URL('../server.mjs',import.meta.url),'utf8');

test('3D render opens progress window and uses the existing paid-request queue',()=>{
 for(const id of ['aiProgress','aiProgressTitle','aiProgressDetail','aiProgressHide','aiRenderModel','aiResult','aiResultImage','downloadAiResult'])assert.match(page,new RegExp('id="'+id+'"'));
 assert.match(page,/forma-render-queue-client\.js/);
 assert.match(page,/forma:render-job-status/);
 assert.match(page,/window\.FORMA_RENDER_QUEUE\?\.fetch\|\|fetch/);
 assert.match(page,/setAiProgress\('queued'/);
 assert.match(page,/setAiProgress\('completed'/);
 assert.match(page,/setAiProgress\('failed'/);
 assert.match(page,/aria-label="Рендер выполняется\. Точный процент не предоставляется моделью"/);
 assert.match(page,/\$\('#aiProgress'\)\.hidden=true;\$\('#aiResult'\)\.hidden=false/);
});

test('public model selector uses approachable quality names and defaults to photographic mode',()=>{
 const first=page.indexOf('<option value="nano-banana-2.1">Высокое качество · фотореализм</option>');
 const second=page.indexOf('<option value="gpt-image-2.6">Сбалансированное качество · точность деталей</option>');
 assert.ok(first>0&&second>first,'high quality uses Nano Banana by default');
 assert.match(page,/Качество фоторендера/);
 assert.doesNotMatch(page,/<option[^>]+>GPT Image 2\.6/);
});

test('3D scene sends extra GLB asset identities, sun and camera measurements to AI',()=>{
 assert.match(page,/extra3dObjects:extra\.slice\(0,250\)/);
 assert.match(page,/cameraFovDegrees:camera\.isPerspectiveCamera\?camera\.fov/);
 assert.match(page,/sunPosition:sunlight\?/);
 assert.match(page,/landscapeModel:model/);
});
test('server allows Nano Banana only on perspective 3D, not top-down site plans',()=>{
 assert.match(server,/p\.landscapeMasterplan\?\.cameraMode==='3d-perspective'&&p\.landscapeModel==='nano-banana-2\.1'/);
 assert.match(server,/landscapeModel=needsLandscape/);
 assert.match(server,/model:needsLandscape\?landscapeModel:needsPlan\?PLAN_IMAGE_MODEL:MODEL/);
 assert.match(server,/model_not_allowed/);
});
test('photographic landscape instruction forbids invented objects while demanding physically consistent sun, PBR materials and species',()=>{
 const doc=coordinateSummary(freshProject());
 const prompt=perspectiveLandscapePrompt({...doc,cameraMode:'3d-perspective',cameraView:'3d',cameraFovDegrees:50,sunPosition:{x:-30,y:70,z:20},
  extra3dObjects:[{type:'pine',catalogName:'Scots pine',group:'plants',x:12,y:15,width:5,rotation:30}]});
 for(const token of ['ABSOLUTE PHOTOGRAPHIC TARGET','PHYSICALLY BASED ARCHITECTURAL MATERIALS','TRUE SUN AND GLOBAL ILLUMINATION','BOTANICAL PHOTOGRAPHIC HARD REQUIREMENT','PHOTOGRAPHIC SHRUB DETAIL','NEGATIVE QUALITY CHECK','EXISTING 3D ASSET LOCK'])assert.ok(prompt.includes(token),token);
 assert.match(prompt,/Scots pine/);
 assert.match(prompt,/vertical field of view 50\.00 degrees/);
 assert.match(prompt,/sun vector X=-30\.00 Y=70\.00 Z=20\.00/);
 assert.match(prompt,/PLUS 1 placed three-dimensional assets/);
 assert.match(prompt,/do not add any new landscaping objects/);
});
