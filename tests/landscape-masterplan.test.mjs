import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GROUPS,CATALOG,byId,freshProject,normalizeProject,report,polygonArea,lineLength,coordinateSummary} from '../forma-landscape-project-core.js';
import {assetSVG,iconURL,roofingSVG} from '../forma-landscape-project-graphics.js';
import {masterplanPrompt,topDownRoofPrompt} from '../forma-landscape-project-prompts.js';

test('46 exact and distinct overhead landscaping entries; 4 landscape boulders and no wall sconces',()=>{
 const counts={shrubs:8,trees:10,pavers:6,fills:5,lights:6,lawns:4,ponds:3,boulders:4};
 assert.equal(CATALOG.length,46);
 assert.equal(new Set(CATALOG.map(x=>x.id)).size,46);
 for(const [id,count] of Object.entries(counts))assert.equal(CATALOG.filter(x=>x.group===id).length,count);
 assert.deepEqual(Object.fromEntries(GROUPS.map(g=>[g.id,g.qty])),counts);
 assert.ok(!CATALOG.filter(x=>x.group==='lights').some(x=>/wall|sconce|бра|настенн/i.test(x.id+' '+x.name)));
 for(const item of CATALOG){
  const svg=assetSVG(item,{size:1080,transparent:true});
  assert.match(svg,/width="1080" height="1080"/);
  assert.match(svg,/viewBox="0 0 160 160"/);
  assert.match(iconURL(item),/^data:image\/svg\+xml/);
 }
});

test('real plot area, metre path length and polygon lawn area stay exact and independent of canvas zoom',()=>{
 const doc=freshProject();
 assert.equal(report(doc).siteArea,1200);
 assert.equal(report(doc).buildingArea,96);
 const d=normalizeProject({...doc,objects:[
  {id:'p1',catalogId:'concrete-pavers',type:'pavers',width:1.5,points:[{x:0,y:3},{x:9,y:3},{x:9,y:15}]},
  {id:'l1',catalogId:'formal',type:'lawns',points:[{x:10,y:10},{x:15,y:10},{x:15,y:16},{x:10,y:16}]}
 ]});
 assert.equal(report(d).lengths['concrete-pavers'],21);
 // Measured visible area clips the outside half-width and path bend.
  assert.equal(report(d).areas['concrete-pavers'],29.56);
 // A 20 m² overlap with the house is excluded from the visible lawn.
  assert.equal(report(d).areas.formal,10);
 assert.equal(lineLength(d.objects[0].points),21);
 assert.equal(polygonArea(d.objects[1].points),30);
});

test('irregular boundary and additional buildings remain measurable',()=>{
 const d=normalizeProject({...freshProject(),site:{width:30,height:40,boundary:[{x:0,y:0},{x:30,y:0},{x:30,y:40},{x:0,y:35}]},
  buildings:[{id:'bath-1',type:'bath',x:23,y:29,width:6,height:4,rotation:45,roof:'hip',photo:'data:image/jpeg;base64,TEST'}]});
 assert.equal(report(d).siteArea,1125);
 assert.equal(report(d).buildingArea,96);
 assert.equal(report(d).auxBuildingArea,24);
 assert.equal(d.buildings[0].rotation,45);
 const summary=coordinateSummary(d);
 assert.equal(summary.buildings.length,1);
 assert.equal(summary.buildings[0].photo,undefined);
});

test('photo upload alone does not mark dimensions verified; unknown metadata cannot override catalog',()=>{
 const doc=normalizeProject({...freshProject(),verified:'true',objects:[{catalogId:'not-a-catalog-entry',x:10,y:10}],site:{width:30,height:40}});
 assert.equal(doc.verified,false);
 assert.equal(doc.objects.length,0);
 assert.equal(byId('nope'),null);
});

test('GPT 2.6 prompt for masterplan is strictly orthographic and never lets AI measure dimensions',()=>{
 const d=coordinateSummary(freshProject());
 const prompt=masterplanPrompt({...d,style:'modern'});
 assert.match(prompt,/TRUE ORTHOGRAPHIC 90-DEGREE/);
 assert.match(prompt,/HARD GEOMETRY LOCK/);
 assert.match(prompt,/no wall sconces/i);
 assert.match(prompt,/image-to-image MATERIAL AND LIGHTING REFINEMENT/);
 assert.match(prompt,/30.00m by 40.00m/);
 assert.throws(()=>masterplanPrompt({site:{width:0,height:3}}));
 const roof=topDownRoofPrompt({width:6,height:4,roof:'gable'});
 assert.match(roof,/FULL-BLEED top-down roof texture/);
 assert.match(roof,/gable roof/);
 assert.match(roof,/No perspective/);
});

test('front-end and server are wired to the dedicated GPT 2.6 landscape workflow',async()=>{
 const html=fs.readFileSync(new URL('../forma-preview.html',import.meta.url),'utf8');
 const shell=fs.readFileSync(new URL('../forma-studio-shell.js',import.meta.url),'utf8');
 const editor=fs.readFileSync(new URL('../forma-landscape-project.js',import.meta.url),'utf8');
 const server=fs.readFileSync(new URL('../server.mjs',import.meta.url),'utf8');
 assert.match(html,/forma-landscape-project\.js/);
 assert.match(html,/forma-landscape-project\.css/);
 assert.match(shell,/landscape-project/);
 assert.match(editor,/data-tool="path"/);
 assert.match(editor,/step=".05"/);
 assert.match(editor,/landscapeMasterplan:coordinateSummary/);
 assert.match(server,/LANDSCAPE_IMAGE_MODEL/);
 assert.match(server,/gpt-image-2\.6-sunburst/);
 assert.match(server,/needsLandscape\?landscapeModel/);
 assert.match(server,/landscapeModel=.*nano-banana-2\.1/);
 assert.doesNotMatch(server,/needsLandscape\?MODEL/);
 const {createPrompt,renderQuantity}=await import('../server.mjs');
 assert.match(createPrompt({landscapeMasterplan:coordinateSummary(freshProject())}),/MASTERPLAN REALISM 4\.0/);
 assert.match(createPrompt({roofTopView:{width:6,height:4,roof:'gable'}}),/ORTHOGRAPHIC NADIR/);
 assert.equal(renderQuantity({landscapeMasterplan:coordinateSummary(freshProject()),quantity:4}),1);
});

test('Landscape tool UX: stop-path, two styles, edit drawn path material/width, visible lawns and lights, render theatre',()=>{
 const editor=fs.readFileSync(new URL('../forma-landscape-project.js',import.meta.url),'utf8');
 const css=fs.readFileSync(new URL('../forma-landscape-project.css',import.meta.url),'utf8');
 assert.match(editor,/data-path-shape="free"/);
 assert.match(editor,/data-path-shape="orthogonal"/);
 assert.match(editor,/function endDrawing\(/);
 assert.match(editor,/data-quick-category="lawns"/);
 assert.match(editor,/data-quick-category="lights"/);
 assert.match(editor,/object.catalogId/);
 assert.match(editor,/object.width/);
 assert.match(editor,/function pathPoint\(/);
 assert.match(editor,/lpRenderOverlay/);
 assert.match(editor,/forma:render-job-status/);
 assert.match(editor,/lpRenderOutputImage/);
 assert.match(editor,/id="lpPhotoToggle"/);
 assert.match(css,/lp-render-overlay/);
 assert.match(css,/lp-category-shortcuts/);
});

test('Realism prompt contains exact species and material schedule with coordinates',()=>{
 const input=coordinateSummary({...freshProject(),objects:[
  {id:'pine-test',catalogId:'pine',type:'trees',x:4,y:6,diameter:7,rotation:0},
  {id:'path-test',catalogId:'granite-setts',type:'pavers',width:1.2,points:[{x:1,y:1},{x:1,y:8}]}
 ]});
 const p=masterplanPrompt(input);
 assert.match(p,/Pinus sylvestris X=4\.00m Y=6\.00m crown=7\.00m/);
 assert.match(p,/Колотая гранитная брусчатка actual paver joints/);
 assert.match(p,/EXACT path width 1\.20m/);
 assert.match(p,/BOTANICAL PHOTOREALISM/);
 assert.match(p,/GLOBAL ILLUMINATION/);
});
