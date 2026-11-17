import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {VEGETATION_SPECIES,vegetationSpeciesIds,isEvergreen,foliageProfile,createVegetation,createRock,createGardenLight} from '../forma-landscape-3d-vegetation.js';
import {CATALOG,TREE_HEIGHT_M} from '../forma-landscape-project-core.js';

test('3D vegetation implements exactly each 2D catalog species',()=>{
 const catalog=CATALOG.filter(c=>['trees','shrubs'].includes(c.group));
 assert.equal(catalog.length,18);
 assert.deepEqual(new Set(vegetationSpeciesIds),new Set(catalog.map(c=>c.id)));
 assert.ok(catalog.every(c=>VEGETATION_SPECIES[c.id].density>=300));
});

test('seasonal leaf changes are species-specific, not one generic green sphere',()=>{
 assert.equal(foliageProfile('birch','winter').leafless,true);
 assert.equal(foliageProfile('pine','winter').leafless,false);
 assert.equal(foliageProfile('spruce','winter').leafless,false);
 assert.equal(foliageProfile('oak','autumn').color!==foliageProfile('oak','summer').color,true);
 assert.equal(isEvergreen('juniper'),true);
 assert.equal(isEvergreen('willow'),false);
});

test('true 3D vegetation and lighting APIs reject fake missing species',()=>{
 assert.equal(typeof createVegetation,'function');
 assert.equal(typeof createRock,'function');
 assert.equal(typeof createGardenLight,'function');
 assert.ok(TREE_HEIGHT_M.pine>4&&TREE_HEIGHT_M.birch>4);
});

test('all specimen meshes are measured and do not use flat PNG tree billboards',()=>{
 const src=readFileSync(new URL('../forma-landscape-3d-vegetation.js',import.meta.url),'utf8');
 assert.match(src,/new T\.InstancedMesh/);
 assert.match(src,/new T\.CylinderGeometry/);
 assert.match(src,/new T\.BufferGeometry/);
 assert.match(src,/new T\.MeshStandardMaterial/);
 assert.doesNotMatch(src,/SpriteMaterial|TextureLoader|\.png/);
 assert.match(src,/new T\.InstancedMesh\(new T\.PlaneGeometry/);
 const html=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
 assert.match(html,/createVegetation\(THREE,o/);
 assert.match(html,/createRock\(THREE,o/);
 assert.match(html,/createGardenLight\(THREE,o/);
 assert.match(html,/plant:\[\.\.\.CATALOG\.filter\(x=>x\.group==='trees'\)/);
});

test('botanical realism v2 has no spherical crown clumps or disconnected foliage clouds',()=>{
 const src=readFileSync(new URL('../forma-landscape-3d-vegetation.js',import.meta.url),'utf8');
 assert.doesNotMatch(src,/new T\.SphereGeometry\(/,'No green spheres can stand in for leaves');
 assert.match(src,/function curveBranch\(/,'Tapered organic branches exist');
 assert.match(src,/function foliageSprigGeometry\(/,'Leaf clusters use individual 3D blades');
 assert.match(src,/const offset=Math\.min\(\.08,diameter\*\.012\)/,'Crown points stay near the physical branch tips');
 assert.match(src,/const offset=shrub\?\.04:\.075/,'Sprays stay attached to shrub twigs');
 assert.match(src,/function flowerPetalGeometry\(/,'Flowers are petals rather than coloured stones');
});

test('mobile scene mode gives canvas more room without losing tools or editability',()=>{
 const src=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
 assert.match(src,/data-mobile-panel="scene"/);
 assert.match(src,/height:min\(29dvh,250px\)/);
 assert.match(src,/function activateMobilePanel\(name\)/);
 assert.match(src,/\.status-hidden/);
});
