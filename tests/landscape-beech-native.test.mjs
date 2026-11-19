import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CATALOG,TREE_HEIGHT_M,byId,normalizeProject} from '../forma-landscape-project-core.js';
import {MATURE_TREE_MODELS} from '../forma-landscape-3d-mature-trees.js';
import {VEGETATION_SPECIES} from '../forma-landscape-3d-vegetation.js';
import {leafOutline} from '../forma-landscape-3d-botany.js';

test('beech replaces linden in the 12-species planting catalogue without corrupting archived projects',()=>{
 const trees=CATALOG.filter(x=>x.group==='trees');
 assert.equal(trees.length,12);
 assert.equal(trees.filter(x=>x.id==='beech').length,1);
 assert.equal(trees.filter(x=>x.id==='linden').length,0);
 assert.equal(trees.find(x=>x.id==='beech').latin,'Fagus sylvatica');
 assert.equal(TREE_HEIGHT_M.beech,20);
 assert.ok(VEGETATION_SPECIES.beech);
 assert.ok(byId('linden')?.group==='trees','legacy linden remains readable');
 assert.equal(MATURE_TREE_MODELS.linden.path,'/assets/landscape-models/linden-mature-cc0.glb');
 const legacy=normalizeProject({objects:[{id:'old-linden-1',catalogId:'linden',
  type:'trees',x:7,y:9,height:13,diameter:8}]});
 assert.equal(legacy.objects[0].catalogId,'linden');
 assert.equal(legacy.objects[0].height,13);
});
test('beech foliage and locally pinned native model retain morphology, CC0 and all 3 LODs',()=>{
 const leaf=leafOutline('beech',20);
 assert.equal(leaf.length,20);
 assert.ok(leaf.every(p=>p.every(Number.isFinite)));
 assert.notDeepEqual(leaf,leafOutline('oak',20));
 const model=MATURE_TREE_MODELS.beech;
 assert.equal(model.license,'CC0 1.0');
 assert.equal(model.sourcePage,'https://tevy.dev/models/european-beech');
 assert.equal(model.lods.length,3);
 const meta=JSON.parse(readFileSync(new URL('../assets/landscape-models/beech-tevy-cc0.source.json',import.meta.url)));
 assert.equal(meta.species,'beech');
 assert.equal(meta.license,'CC0 1.0');
 assert.equal(meta.version,'v1');
 assert.equal(meta.sourcePage,model.sourcePage);
 for(const [i,path] of model.lods.entries()){
  assert.ok(path.startsWith('/assets/landscape-models/beech-tevy-'));
  assert.ok(existsSync(new URL('..'+path,import.meta.url)),path+' missing');
  const buffer=readFileSync(new URL('..'+path,import.meta.url));
  assert.equal(buffer.toString('ascii',0,4),'glTF');
  assert.equal(buffer.readUInt32LE(4),2);
  assert.equal(buffer.readUInt32LE(8),buffer.length);
  assert.equal(createHash('sha256').update(buffer).digest('hex'),meta.lods[i].sha256,'source file tampered');
 }
 assert.ok(existsSync(new URL('../assets/landscape/items/beech.webp',import.meta.url)),
  'catalog thumbnail must show the actual downloaded beech, not old linden');
});
test('editor uses native beech PBR on desktop/mobile and no summer foliage in winter',()=>{
 const page=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
 assert.match(page,/o\.catalogId==='beech'/,'beech GLB protected from automatic mobile proxy');
 assert.match(page,/doc\.atmosphere\.season==='winter'&&o\.catalogId==='beech'/);
 assert.match(page,/MATURE_TREE_MODELS\[o\.catalogId\]/);
});
