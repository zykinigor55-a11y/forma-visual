import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {FOLIAGE_PHOTO_SOURCE,exactPhotoSpecies} from '../forma-landscape-3d-photo-foliage.js';
import {VEGETATION_SPECIES} from '../forma-landscape-3d-vegetation.js';
import {NATIVE_UNDERSTORY} from '../forma-landscape-3d-understory.js';
import {enableBotanicalLod,setFoliageTier} from '../forma-landscape-3d-foliage-lod.js';

test('photo-alpha source exists for 27 current and 1 legacy vegetation species',()=>{
 const species=Object.keys(VEGETATION_SPECIES).sort();
 assert.equal(species.length,28,'27 active species plus the archived linden');
 assert.deepEqual(Object.keys(FOLIAGE_PHOTO_SOURCE).sort(),species);
 assert.ok(exactPhotoSpecies.length>=18,'primary photo coverage');
 for(const id of species){
  const source=FOLIAGE_PHOTO_SOURCE[id];
  assert.ok(source&&!source.includes('/')&&!source.includes('..'),id);
  assert.ok(existsSync(new URL('../assets/landscape-photo/'+source+'.png',import.meta.url)),
   id+' must resolve to a local, existing photographic source');
 }
 assert.equal(Object.keys(NATIVE_UNDERSTORY).length,5);
});

test('photo foliage loads lazily, masks borders and falls back on unusable photographs',()=>{
 const code=readFileSync(new URL('../forma-landscape-3d-photo-foliage.js',import.meta.url),'utf8');
 for(const fragment of [
  "img.src=FOLIAGE_SIDE_REFERENCE[id]||'/assets/landscape-photo/'+source+'.png'",
  "pine:'/assets/landscape/items/pine-branch.webp'",
  "spruce:'/assets/landscape/items/spruce-tall.webp'", 
  "texture.userData.photoState='fallback'",
  "texture.userData.photoState='ready'",
  'texture.needsUpdate=true',
  'fallbackSpray(canvas,fallback?.image||null)',
  'stampPhotographicTwigs(canvas,cutout,id)',
  'sourceSites=',
  'ctx.getImageData(0,0,w,h)'
 ])assert.ok(code.includes(fragment),fragment);
});

test('all plants retain geometry and object identity, augment with photo cutouts',()=>{
 const tree=readFileSync(new URL('../forma-landscape-3d-vegetation.js',import.meta.url),'utf8');
 const under=readFileSync(new URL('../forma-landscape-3d-understory.js',import.meta.url),'utf8');
 assert.match(tree,/createPhotoFoliageTexture\(T,id,\{fallback:createSprayTexture\(T,needle,id\)\}\)/);
 assert.match(under,/createPhotoFoliageTexture\(T,id\)/);
 assert.match(tree,/g\.userData\.crownDiameter=diameter/);
 assert.match(under,/group\.userData\.crownDiameter=diameter/);
 assert.match(tree,/tuft\.userData\.photoAlphaCard=true/);
 assert.match(under,/mesh\.userData\.photoAlphaCard=true/);
});

test('photo planes are a minority close-up and primary detail only in far LOD',()=>{
 const make=layer=>({isMesh:true,isInstancedMesh:true,count:400,userData:{botanicalLayer:layer}});
 const nodes=['branches','micro','volume','sprays'].map(make);
 const group={userData:{},traverse(fn){nodes.forEach(fn)}};
 enableBotanicalLod(group,'premium');
 setFoliageTier(group,'near');
 assert.deepEqual(nodes.map(n=>n.visible),[true,true,true,true]);
 assert.ok(nodes[3].count<=120&&nodes[3].count>=80);
 setFoliageTier(group,'middle');
 assert.deepEqual(nodes.map(n=>n.visible),[true,false,true,true]);
 assert.ok(nodes[3].count>140&&nodes[3].count<220);
 setFoliageTier(group,'far');
 assert.deepEqual(nodes.map(n=>n.visible),[true,false,false,true]);
 assert.ok(nodes[3].count>=300);
});
