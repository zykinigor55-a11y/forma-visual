import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeCameraOrbit,cameraOrbitPrompt} from '../forma-camera-orbit.js';
import {normalizeFurnitureEdit,furnitureEditPrompt} from '../forma-furniture-edit.js';

test('camera orbit accepts only deliberate left/right 30/45/90-degree changes',()=>{
 for(const direction of ['left','right'])for(const degrees of [30,45,90]){
  const p=normalizeCameraOrbit({direction,degrees});
  assert.equal(p.direction,direction);assert.equal(p.degrees,degrees);
 }
 assert.throws(()=>normalizeCameraOrbit({direction:'flip',degrees:180}));
 assert.throws(()=>normalizeCameraOrbit({direction:'right',degrees:15}));
});

test('orbit prompt preserves relative physical site layout, not flat backdrops',()=>{
 const p=cameraOrbitPrompt({direction:'right',degrees:45,sourceMode:'inferred'});
 for(const word of ['WORLD-SPACE CONTINUITY','relative to the building','parallax','SAME house','not a dimensional survey','camera'])assert.match(p,new RegExp(word,'i'));
 assert.doesNotMatch(p,/new landscape design/i);
});
test('CAD orbit requires a second screenshot, then gives image 2 sole camera authority',()=>{
 assert.throws(()=>cameraOrbitPrompt({direction:'left',degrees:90,sourceMode:'cad'}),/CAD-скриншот/);
 const p=cameraOrbitPrompt({direction:'left',degrees:90,sourceMode:'cad'},{referenceProvided:true});
 assert.match(p,/IMAGE 2 is the user-uploaded CAD/);
 assert.match(p,/IMAGE 1 is the previously APPROVED/);
 assert.match(p,/WORLD-SPACE CONTINUITY/);
});
test('furniture replacement validates region and requires a mask',()=>{
 const object={rect:{x:25,y:30,w:35,h:40},type:'chair',scale:90,rotation:10,hasReference:true};
 assert.equal(normalizeFurnitureEdit(object).type,'chair');
 assert.throws(()=>normalizeFurnitureEdit({rect:{x:96,y:96,w:30,h:30}}));
 assert.throws(()=>furnitureEditPrompt(object,{maskProvided:false,referenceProvided:true}),/маска/);
 assert.throws(()=>furnitureEditPrompt(object,{maskProvided:true,referenceProvided:false}),/фотографию/);
});
test('furniture prompt preserves all pixels outside mask and references one object only',()=>{
 const p=furnitureEditPrompt({rect:{x:10,y:20,w:40,h:50},type:'sofa',hasReference:true,note:'Fabric soft beige'},{maskProvided:true,referenceProvided:true});
 assert.match(p,/ANY opaque pixels/);
 assert.match(p,/ONLY the single user-selected sofa/);
 assert.match(p,/IMAGE 2 is the user-uploaded replacement OBJECT ONLY/);
 assert.match(p,/EXACTLY the input camera view/);
});
test('result UI, node UI and API server all route the same orbit and furniture contracts',async()=>{
 const result=fs.readFileSync(new URL('../forma-result-focus.js',import.meta.url),'utf8');
 const orbit=fs.readFileSync(new URL('../forma-camera-orbit-ui.js',import.meta.url),'utf8');
 const furniture=fs.readFileSync(new URL('../forma-furniture-editor.js',import.meta.url),'utf8');
 const graph=fs.readFileSync(new URL('../forma-nodes.js',import.meta.url),'utf8');
 const engine=fs.readFileSync(new URL('../forma-node-engine.js',import.meta.url),'utf8');
 const html=fs.readFileSync(new URL('../forma-preview.html',import.meta.url),'utf8');
 assert.match(result,/data-result-action="furniture"/);
 assert.match(result,/FORMA_CAMERA_ORBIT/);
 assert.match(furniture,/protectOutside/);
 assert.match(furniture,/setPointerCapture/);
 assert.match(orbit,/cameraOrbit/);
 assert.match(orbit,/Загрузить новый ракурс/);
 assert.match(graph,/orbit:\{title:'Другой ракурс'/);
 assert.match(engine,/n.type==='orbit'/);
 assert.match(engine,/cameraOrbit:options.cameraOrbit/);
 assert.match(html,/forma-camera-orbit-ui.js/);
 assert.match(html,/forma-furniture-editor.js/);
 const {createPrompt}=await import('../server.mjs');
 assert.match(createPrompt({image:'x',cameraOrbit:{direction:'right',degrees:30}}),/WORLD-SPACE CONTINUITY/);
 assert.match(createPrompt({image:'x',furnitureEdit:{rect:{x:20,y:20,w:30,h:35}},mask:'png-mask'}),/PRECISE LOCAL FURNITURE REPLACEMENT/);
});
