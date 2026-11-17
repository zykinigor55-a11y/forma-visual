import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {freshProject,normalizeProject,coordinateSummary,TREE_HEIGHT_M,SCENE_OPTIONS} from '../forma-landscape-project-core.js';
import {masterplanPrompt} from '../forma-landscape-project-prompts.js';
import {TREE_SPECIES} from '../forma-landscape-tree-atlas.js';

test('all ten botanical species have editable default heights',()=>{
 assert.equal(TREE_SPECIES.length,10);
 for(const id of TREE_SPECIES)assert.ok(TREE_HEIGHT_M[id]>0,id+' is missing an actual height');
});
test('existing projects get safe sunlight and tree-height defaults',()=>{
 const d=normalizeProject({site:{width:30,height:40},objects:[{id:'t1',catalogId:'birch',x:10,y:10,diameter:6}]});
 assert.equal(d.objects[0].height,16);
 assert.deepEqual(d.atmosphere,{time:'day',season:'summer',weather:'sunny'});
});
test('scene and height changes survive normalization and AI coordinate summary',()=>{
 const d=freshProject();
 d.atmosphere={time:'evening',season:'autumn',weather:'after-rain'};
 d.objects=[{id:'t1',catalogId:'pine',type:'trees',x:7,y:11,diameter:7,height:19,rotation:0}];
 const n=normalizeProject(d),p=coordinateSummary(n);
 assert.deepEqual(n.atmosphere,d.atmosphere);
 assert.equal(p.objects[0].height,19);
 assert.equal(p.atmosphere.season,'autumn');
 const prompt=masterplanPrompt(p);
 assert.match(prompt,/AUTUMN/);assert.match(prompt,/EVENING/);
 assert.match(prompt,/AFTER RAIN/);assert.match(prompt,/tree-height=19.00m/);
 assert.match(prompt,/HARD GEOMETRY LOCK/);
});
test('scene selectors each have valid finite options',()=>{
 for(const key of ['time','season','weather'])assert.ok(SCENE_OPTIONS[key].length>=4);
});
test('independent PNG sprites and geometry-preserving dynamic shadows are wired',()=>{
 const root=new URL('..',import.meta.url),graphics=readFileSync(new URL('../forma-landscape-project-graphics.js',import.meta.url),'utf8');
 const tree=readFileSync(new URL('../forma-landscape-tree-atlas.js',import.meta.url),'utf8');
 const editor=readFileSync(new URL('../forma-landscape-project.js',import.meta.url),'utf8');
 assert.match(graphics,/treeCanopyPNG\(entry.id\)/);
 assert.match(tree,/canvas.toDataURL\('image\/png'\)/);
 assert.match(editor,/treeShadow\(item,entry,d\)/);
 assert.match(editor,/height\/Math.tan\(sun.el\*Math.PI\/180\)/);
 assert.match(editor,/id="lpAtmoQuick"/);
 assert.match(editor,/aria-expanded="false"/);
});
