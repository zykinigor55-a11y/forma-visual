import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ashCompoundLeafData,ASH_LEAFLET_PAIRS,ASH_LEAFLET_COUNT,ashCompoundLeafGeometry} from '../forma-landscape-ash-leaves.js';
import {leafOutline,norwayMapleLobeRadius} from '../forma-landscape-3d-botany.js';
import {MATURE_TREE_MODELS} from '../forma-landscape-3d-mature-trees.js';
import {FOLIAGE_PHOTO_SOURCE} from '../forma-landscape-3d-photo-foliage.js';

test('Fraxinus excelsior has 5 paired leaflets plus exactly one terminal leaflet',()=>{
 assert.equal(ASH_LEAFLET_PAIRS,5);
 assert.equal(ASH_LEAFLET_COUNT,11);
 const d=ashCompoundLeafData();
 assert.equal(d.pairs,5);
 assert.equal(d.leafletCount,11);
 assert.ok(d.triangles>=70&&d.triangles<190,'bounded folded 3D leaflet mesh');
 assert.equal(d.positions.length,d.triangles*9,'every triangle has 3 vertices');
 assert.ok(Array.from(d.positions).every(Number.isFinite),'leaf coordinates must be finite');
 const y=[];
 for(let i=1;i<d.positions.length;i+=3)y.push(d.positions[i]);
 assert.ok(Math.min(...y)>=0,'compound sprig rooted at terminal twig');
 assert.ok(Math.max(...y)<=1.01,'one normalized leaf sprig, no floating full crown');
 assert.ok(ashCompoundLeafData().positions.every((p,i)=>p===d.positions[i]),'deterministic GLB fallback');
});
test('native ash instancing creates real mesh geometry with normals',()=>{
 let normals=false;
 class BufferGeometry{
  setAttribute(name,attribute){this[name]=attribute;return this}
  computeVertexNormals(){normals=true}
 }
 class Float32BufferAttribute{
  constructor(array,itemSize){this.array=array;this.itemSize=itemSize}
 }
 const g=ashCompoundLeafGeometry({BufferGeometry,Float32BufferAttribute});
 assert.ok(normals);
 assert.equal(g.position.itemSize,3);
 assert.equal(g.position.array.length,ashCompoundLeafData().positions.length);
});
test('Acer platanoides has five pointed lobes with deep separating recesses',()=>{
 for(let k=0;k<5;k++){
  const tip=Math.PI/2+2*Math.PI*k/5;
  const valley=tip+Math.PI/5;
  assert.ok(norwayMapleLobeRadius(tip)>norwayMapleLobeRadius(valley)+.27);
 }
 const leaf=leafOutline('maple',20);
 assert.equal(leaf.length,20);
 assert.deepEqual(leaf,leafOutline('maple',20));
 assert.notDeepEqual(leaf,leafOutline('oak',20));
 assert.ok(Math.max(...leaf.map(p=>p[0]))-Math.min(...leaf.map(p=>p[0]))>1.45,
  'broad maple lamina, not narrow ash leaflet');
});
test('maple PBR CC0 GLB is preserved; procedural native ash no longer borrows rowan photo at runtime',()=>{
 assert.equal(MATURE_TREE_MODELS.maple.path,'/assets/landscape-models/maple-mature-cc0.glb');
 assert.equal(MATURE_TREE_MODELS.maple.license,'CC0 1.0');
 const vegetation=readFileSync(new URL('../forma-landscape-3d-vegetation.js',import.meta.url),'utf8');
 const photo=readFileSync(new URL('../forma-landscape-3d-photo-foliage.js',import.meta.url),'utf8');
 assert.match(vegetation,/if\(id==='ash'&&!needle\)return ashCompoundLeafGeometry\(T\)/);
 assert.match(vegetation,/if\(id==='ash'&&!needles\)paintAshLeafSpray\(ctx\)/);
 assert.match(photo,/if\(id==='ash'\)\{\s*texture\.userData\.source='native-fraxinus-excelsior'/);
 assert.equal(FOLIAGE_PHOTO_SOURCE.ash,'rowan','legacy mapping does not affect actual ash runtime atlas');
});
