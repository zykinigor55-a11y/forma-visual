import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHRUB_HEIGHT_M,naturalCrown,branchTipDrop,botanicalLeafScale,vegetationQuality,leafOutline} from '../forma-landscape-3d-botany.js';
import {VEGETATION_SPECIES,foliageProfile} from '../forma-landscape-3d-vegetation.js';
import {CATALOG} from '../forma-landscape-project-core.js';

test('all fourteen shrub and groundcover varieties have realistic, independent adult heights in metres',()=>{
 const shrubs=CATALOG.filter(x=>x.group==='shrubs');
 assert.equal(shrubs.length,14);
 assert.deepEqual(new Set(Object.keys(SHRUB_HEIGHT_M)),new Set(shrubs.map(x=>x.id)));
 assert.ok(SHRUB_HEIGHT_M.juniper<SHRUB_HEIGHT_M.dogwood);
 assert.ok(SHRUB_HEIGHT_M.lavender<SHRUB_HEIGHT_M.hydrangea);
 assert.ok(Object.values(SHRUB_HEIGHT_M).every(n=>n>=.20&&n<=3));
});

test('pine, spruce, willow, oak and birch have genuinely different crowns',()=>{
 const sample=[.12,.3,.5,.7,.94];
 for(const kind of ['pine','spruce','birch','oak','willow'])assert.ok(sample.every(t=>Number.isFinite(naturalCrown(kind,t))));
 assert.ok(naturalCrown('spruce',.12)>naturalCrown('spruce',.94),'spruce narrows upward');
 assert.ok(naturalCrown('pine',.50)>naturalCrown('pine',.94)*1.7,'Scots pine crown tapers toward leader rather than forming a mushroom');
 assert.ok(naturalCrown('pine',.50)>naturalCrown('pine',.12),'Scots pine opens above the lower branches');
 assert.ok(naturalCrown('oak',.12)<naturalCrown('oak',.5),'oak crown widens in its upper body');
 assert.ok(naturalCrown('willow',.12)>naturalCrown('birch',.12),'weeping willow canopy spreads lower');
 assert.ok(branchTipDrop('willow',12,.3)>branchTipDrop('birch',12,.3)*3,'willow branches hang far lower');
 assert.equal(branchTipDrop('oak',12,.3),0);
});

test('botanical leaves preserve species scale and real winter silhouette',()=>{
 assert.ok(botanicalLeafScale('birch',14,6)<botanicalLeafScale('oak',14,6));
 assert.equal(foliageProfile('willow','winter').leafless,true);
 assert.equal(foliageProfile('pine','winter').leafless,false);
 assert.equal(Object.keys(VEGETATION_SPECIES).length,28,'13 tree choices + 14 shrubs + archived linden');
});

test('adaptive vegetation detail protects mobile, high-density scenes',()=>{
 assert.equal(vegetationQuality(1800,3,'3d'),1);
 assert.ok(vegetationQuality(400,80,'3d')<vegetationQuality(1800,3,'3d'));
 assert.ok(vegetationQuality(1200,100,'2d')<vegetationQuality(1200,10,'3d'));
 assert.ok(vegetationQuality(390,500,'3d')>=.22);
});

test('3D viewport creates true volumetric leaves and weeping branches without 2D billboards',()=>{
 const source=readFileSync(new URL('../forma-landscape-3d-vegetation.js',import.meta.url),'utf8');
 const page=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
 assert.match(source,/branchTipDrop\(id,height,t\)/);
 assert.match(source,/if\(id==='willow'\)/);
 assert.match(source,/new T\.InstancedMesh/);
 assert.match(page,/vegetationQuality\(window\.innerWidth/);
 assert.match(page,/SHRUB_HEIGHT_M\[state\.placing\]/);
});

test('each major species has its own anatomically distinct small-leaf silhouette',()=>{
 const contour=id=>leafOutline(id,20);
 const ids=['oak','maple','birch','willow','linden','rowan','hydrangea','lavender'];
 for(const id of ids)assert.equal(contour(id).length,20);
 const width=id=>Math.max(...contour(id).map(p=>p[0]))-Math.min(...contour(id).map(p=>p[0]));
 const height=id=>Math.max(...contour(id).map(p=>p[1]))-Math.min(...contour(id).map(p=>p[1]));
 assert.ok(width('willow')/height('willow')<.2,'Willow has a narrow lanceolate leaf');
 assert.ok(width('maple')/height('maple')>.6,'Maple has a broad lobed leaf');
 assert.notDeepEqual(contour('maple'),contour('oak'));
 assert.notDeepEqual(contour('birch'),contour('linden'));
 const code=readFileSync(new URL('../forma-landscape-3d-vegetation.js',import.meta.url),'utf8');
 assert.match(code,/makeLeafGeometry\(T,needle,id\)/);
});

test('plant silhouette variants survive 2D/3D save and remain within measured footprint',async()=>{
 const {normalizeProject,freshProject}=await import('../forma-landscape-project-core.js');
 const doc=freshProject();
 doc.objects=[{id:'p-variation-3',catalogId:'pine',type:'trees',x:7,y:8,diameter:6,height:14,rotation:0,variant:3}];
 const next=normalizeProject(doc);
 assert.equal(next.objects[0].variant,3);
 assert.equal(next.objects[0].diameter,6);
 assert.equal(next.objects[0].height,14);
 assert.equal(next.objects[0].x,7);
 const src=readFileSync(new URL('../forma-landscape-3d-vegetation.js',import.meta.url),'utf8');
 const editor=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
 assert.match(src,/crown-'\+variant/);
 assert.match(editor,/id="plantVariant"/);
});
