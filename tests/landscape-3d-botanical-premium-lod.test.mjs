import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BOTANICAL_PHOTO_PROFILES,botanicalPhotoProfile,normalizeFoliagePalette} from '../forma-landscape-3d-plant-materials.js';
import {BOTANICAL_QUALITY,normalizeBotanicalQuality,pickBotanicalLod,projectedPlantPixels,enableBotanicalLod,setFoliageTier} from '../forma-landscape-3d-foliage-lod.js';
import {VEGETATION_SPECIES} from '../forma-landscape-3d-vegetation.js';
const vegetation=readFileSync(new URL('../forma-landscape-3d-vegetation.js',import.meta.url),'utf8');
const page=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');

test('reference birch/oak/spirea have distinctly measured leaf size, branching and physical material values',()=>{
 for(const id of ['birch','oak','spirea']){
  assert.ok(VEGETATION_SPECIES[id],id);
  const profile=botanicalPhotoProfile(id);
  assert.ok(profile.latin&&profile.crown&&profile.twigFrequency>1);
  assert.ok(profile.leafRoughness>.5&&profile.leafRoughness<.85);
  assert.ok(profile.barkBump>.001&&profile.barkBump<.06);
 }
 assert.ok(botanicalPhotoProfile('spirea').leafLengthCm<botanicalPhotoProfile('birch').leafLengthCm);
 assert.ok(botanicalPhotoProfile('birch').leafLengthCm<botanicalPhotoProfile('oak').leafLengthCm);
 assert.notEqual(BOTANICAL_PHOTO_PROFILES.birch.shade,BOTANICAL_PHOTO_PROFILES.oak.shade);
 assert.notDeepEqual(normalizeFoliagePalette('birch','autumn').fall,normalizeFoliagePalette('oak','autumn').fall);
 assert.equal(normalizeFoliagePalette('spirea','summer').fall,null);
});
test('three separate detail modes preserve responsive view while rewarding photographic inspection',()=>{
 assert.deepEqual(Object.keys(BOTANICAL_QUALITY),['speed','standard','premium']);
 assert.equal(normalizeBotanicalQuality('high'),'premium');
 assert.equal(normalizeBotanicalQuality('auto'),'standard');
 assert.equal(normalizeBotanicalQuality('speed'),'speed');
 const camera={fov:50};
 const near=projectedPlantPixels(14,18,camera,900);
 const far=projectedPlantPixels(14,110,camera,900);
 assert.ok(near>far);
 assert.equal(pickBotanicalLod({pixelHeight:near,mode:'premium'}),'near');
 assert.equal(pickBotanicalLod({pixelHeight:near,mode:'speed'}),'middle');
 assert.equal(pickBotanicalLod({pixelHeight:25,mode:'premium'}),'far');
 assert.equal(pickBotanicalLod({pixelHeight:110,mode:'premium',previous:'near'}),'near');
 assert.equal(pickBotanicalLod({pixelHeight:24,mode:'standard',previous:'far'}),'far');
});
test('layer switching uses real near instanced geometry and keeps fallback foliage on mobile',()=>{
 const make=(layer)=>({isMesh:true,isInstancedMesh:true,count:100,userData:{botanicalLayer:layer}});
 const nodes=['branches','micro','volume','sprays'].map(make);
 const group={userData:{},traverse(fn){for(const m of nodes)fn(m)}};
 enableBotanicalLod(group,'premium');setFoliageTier(group,'near');
 assert.equal(nodes[0].visible,true);
 assert.equal(nodes[1].visible,true,'real 3D leaves for closeups');
 assert.equal(nodes[2].visible,true,'curved 3D micro-sprigs for volume');
 assert.equal(nodes[3].visible,true,'near view combines real 3D leaves with restrained photo-alpha cutouts');
 assert.ok(nodes[3].count<35,'near photo detail remains a minority of all foliage sprites');
 setFoliageTier(group,'far');
 assert.equal(nodes[1].visible,false);
 assert.equal(nodes[2].visible,false);
 assert.equal(nodes[3].visible,true);
 assert.ok(nodes[3].count<100,'lightweight far LOD');
 const fallback={userData:{},traverse(fn){for(const m of [nodes[0],nodes[3]])fn(m)}};
 enableBotanicalLod(fallback,'speed');setFoliageTier(fallback,'middle');
 assert.equal(nodes[3].visible,true,'mobile must not vanish');
});
test('editor plugs botanical LOD into camera movement and high-resolution AI capture',()=>{
 for(const token of ['id="quality3d"','Быстрый · лёгкие модели','Стандарт · реалистичная 3D-сцена',
  'Премиум / фотореализм','updateBotanicalLod(model,camera,canvas.clientHeight)',
  "updateBotanicalLod(group,camera,canvas.clientHeight,'premium')",
  'setFoliageTier(group,tier)','botanicalGroups.push(g)',
  'foliageMaterial(T,id)'])assert.ok(page.includes(token)||vegetation.includes(token),token);
 assert.match(vegetation,/barkReliefCanvas\(tex\.image,id\)/);
 assert.match(vegetation,/foliageSprigGeometry\(T,needle,id\)/);
 assert.match(vegetation,/mesh\.userData\.botanicalLayer='micro'/);
 assert.match(vegetation,/tuft\.userData\.botanicalLayer='sprays'/);
 assert.match(vegetation,/id==='spirea'\?actual\*/);
 assert.match(vegetation,/id==='birch'\?13:id==='oak'\|\|id==='ash'\?12/);
});
