import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MATURE_TREE_MODELS} from '../forma-landscape-3d-mature-trees.js';
const html=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
const lineup=readFileSync(new URL('../forma-tree-lineup.html',import.meta.url),'utf8');
function inspectGlb(file){
 const buf=readFileSync(new URL('../assets/landscape-models/'+file,import.meta.url));
 assert.equal(buf.toString('ascii',0,4),'glTF');
 assert.equal(buf.readUInt32LE(4),2);
 assert.equal(buf.readUInt32LE(8),buf.length);
 const length=buf.readUInt32LE(12);
 assert.equal(buf.toString('ascii',16,20),'JSON');
 const json=JSON.parse(buf.subarray(20,20+length).toString('utf8'));
 const primitives=(json.meshes||[]).flatMap(m=>m.primitives||[]);
 const triangles=primitives.reduce((sum,p)=>{
  const idx=p.indices??p.attributes?.POSITION;
  return sum+Math.floor((json.accessors?.[idx]?.count||0)/3);
 },0);
 return {bytes:buf.length,meshes:json.meshes?.length||0,materials:json.materials||[],triangles,images:json.images?.length||0};
}
test('aspen and Scots pine have real local full-resolution CC0 GLB assets with needle/leaf cutouts',()=>{
 const aspen=inspectGlb('aspen-mature-cc0.glb');
 const pine=inspectGlb('pine-mature-cc0.glb');
 assert.ok(aspen.bytes>1_000_000&&aspen.triangles>=20_000);
 assert.ok(pine.bytes>4_000_000&&pine.triangles>=46_000);
 assert.ok(aspen.meshes>=3&&pine.meshes>=3);
 assert.ok(aspen.images>=3&&pine.images>=3);
 assert.ok(aspen.materials.some(m=>m.alphaMode==='MASK'||m.alphaMode==='BLEND'),'aspen must have real cutout leaves');
 assert.ok(pine.materials.some(m=>m.alphaMode==='MASK'||m.alphaMode==='BLEND'),'pine must have real cutout needles');
 const aspenSource=JSON.parse(readFileSync(new URL('../assets/landscape-models/aspen-mature-cc0.source.json',import.meta.url)));
 const pineSource=JSON.parse(readFileSync(new URL('../assets/landscape-models/pine-mature-cc0.source.json',import.meta.url)));
 assert.equal(aspenSource.license,'CC0 1.0');
 assert.equal(pineSource.license,'CC0 1.0');
 assert.equal(MATURE_TREE_MODELS.aspen.path,'/assets/landscape-models/aspen-mature-cc0.glb');
});
test('real GLB is the user-facing default, including migration from old procedural browser choice',()=>{
 assert.match(html,/const flag='forma-prefer-real-glb-trees-v2'/);
 assert.match(html,/localStorage\.setItem\(CODE_TREE_KEY,'glb'\)/);
 assert.match(html,/return localStorage\.getItem\(CODE_TREE_KEY\)==='code'\?'code':'glb'/);
 assert.match(html,/if\(o\.catalogId==='pine'&&!imported\)loadMatureScotsPine\(\)/);
 assert.match(html,/if\(MATURE_TREE_MODELS\[o\.catalogId\]&&!imported\)loadCuratedAdultTree\(o\.catalogId\)/);
 assert.match(html,/const source=imported\|\|bundledPine\|\|bundledAdult\|\|null/);
 assert.match(html,/if\(species==='birch'&&treeSourceChoice\(\)==='code'\)return/);
 assert.match(html,/const performanceFallback=!\['pine','aspen','spruce','birch'\]\.includes\(o\.catalogId\)/);
 assert.match(html,/const denseMobileTree=window\.innerWidth<=720&&!\['pine','aspen','spruce','birch'\]/);
 assert.match(html,/const seasonalNative=\(doc\.atmosphere\.season==='winter'/);
 assert.match(lineup,/get\('source'\)!=='code'/);
});
test('aspen and pine keep own metric scaling and no external model download at render time',()=>{
 const adapter=readFileSync(new URL('../forma-landscape-3d-models.js',import.meta.url),'utf8');
 assert.match(adapter,/vegetationFit/);
 assert.match(adapter,/node\.material=Array\.isArray\(node\.material\)/);
 assert.match(adapter,/group\.userData\.realGlb=true/);
 assert.match(html,/const MATURE_SCOTS_PINE_GLB='\/assets\/landscape-models\/pine-mature-cc0\.glb'/);
 assert.match(html,/loadAsync\(entry\.path\)/);
 assert.match(html,/pineGrowth:o\.catalogId==='pine'\?normalizePineGrowth\(o\.pine\):null/);
});
