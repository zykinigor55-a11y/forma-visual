import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {MATURE_TREE_MODELS,TREE_MODEL_SOURCE_LINKS} from '../forma-landscape-3d-mature-trees.js';

const manifest=JSON.parse(readFileSync(new URL('../assets/landscape-models/mature-trees.sources.json',import.meta.url)));
const page=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');

test('verified sources match local tree paths and CC0 license',()=>{
 assert.equal(manifest.license,'CC0 1.0');
 assert.deepEqual(Object.keys(MATURE_TREE_MODELS).sort(),['apple','ash','aspen','birch','linden','maple','oak','rowan','sakura','spruce']);
 assert.equal(manifest.trees.length,6,'original verified Innerscene installer remains unchanged');
 assert.ok(TREE_MODEL_SOURCE_LINKS.pine);
 assert.equal(MATURE_TREE_MODELS.sakura.season,'spring');
 for(const model of manifest.trees){
  if(model.species==='spruce'){
   assert.equal(MATURE_TREE_MODELS.spruce.path,'/assets/landscape-models/spruce-tevy-cc0.glb');
   assert.equal(MATURE_TREE_MODELS.spruce.fallbackPath,'/assets/landscape-models/spruce-mature-cc0.glb');
   assert.equal(MATURE_TREE_MODELS.spruce.sourcePage,'https://tevy.dev/models/norway-spruce');
  }else if(model.species==='birch'){
   assert.equal(MATURE_TREE_MODELS.birch.path,'/assets/landscape-models/birch-tevy-cc0.glb');
   assert.equal(MATURE_TREE_MODELS.birch.fallbackPath,'/assets/landscape-models/birch-mature-cc0.glb');
   assert.equal(MATURE_TREE_MODELS.birch.sourcePage,'https://tevy.dev/models/silver-birch');
  }else{
   assert.equal(MATURE_TREE_MODELS[model.species].path,'/assets/landscape-models/'+model.file);
   assert.equal(MATURE_TREE_MODELS[model.species].sourcePage,model.sourcePage);
  }
  assert.equal(MATURE_TREE_MODELS[model.species].license,'CC0 1.0');
  const url=new URL('../assets/landscape-models/'+model.file,import.meta.url);
  if(!existsSync(url))continue; // Installer workflow fetches originals after source commit.
  const bytes=readFileSync(url);
  assert.equal(bytes.toString('ascii',0,4),'glTF');
  assert.equal(bytes.readUInt32LE(4),2);
  assert.equal(bytes.readUInt32LE(8),bytes.length);
  const provenanceName=model.species==='ash'?'ash-terraintale-cc0.source.json':model.species+'-mature-cc0.source.json';
  const provenance=JSON.parse(readFileSync(new URL('../assets/landscape-models/'+provenanceName,import.meta.url)));
  assert.equal(provenance.license,'CC0 1.0');
  assert.equal(provenance.species,model.species);
 }
});

test('additional textured ash is independently licensed and SHA-pinned',()=>{
 const source=JSON.parse(readFileSync(new URL('../assets/landscape-models/ash-terraintale-cc0.source.json',import.meta.url)));
 assert.equal(source.species,'ash');
 assert.equal(source.license,'CC0 1.0');
 assert.equal(MATURE_TREE_MODELS.ash.path,'/assets/landscape-models/ash-terraintale-cc0.glb');
 assert.equal(source.sourcePage,MATURE_TREE_MODELS.ash.sourcePage);
 assert.equal(source.sha256,'e2f6c99b9a46e3b4ba40ff8efd4f734dc02511023feb9eb85492a6260f0f4e17');
});

test('adult trees autoload with user override and graceful fallback',()=>{
 assert.match(page,/function loadCuratedAdultTree\(species\)/);
 assert.match(page,/if\(MATURE_TREE_MODELS\[o\.catalogId\]&&!imported\)loadCuratedAdultTree\(o\.catalogId\)/);
 assert.match(page,/const source=imported\|\|bundledPine\|\|bundledAdult\|\|null/);
 assert.match(page,/createVegetation\(THREE,o/);
 assert.match(page,/retry\.forEach\(id=>id==='pine'/);
});

test('compressed third-party GLBs are accepted on upload and project restore',()=>{
 assert.match(page,/async function parseImportedGlb\(bytes\)/);
 assert.match(page,/setKTX2Loader\(ktx2\)/);
 assert.match(page,/setMeshoptDecoder\(MeshoptDecoder\)/);
 assert.match(page,/const bytes=await file\.arrayBuffer\(\),glb=await parseImportedGlb\(bytes\)/);
 assert.match(page,/const glb=await parseImportedGlb\(bytes\)/);
});

test('new species use true 3D summer/spring GLBs and safe winter native crowns',()=>{
 assert.match(page,/\['birch','oak','maple','linden','apple','rowan','aspen'\]\.includes\(o\.catalogId\)/);
 assert.match(page,/o\.catalogId==='sakura'&&doc\.atmosphere\.season!=='spring'/);
 assert.match(page,/doc\.atmosphere\.season==='winter'&&o\.catalogId==='ash'/,'ash retains leafless native winter mode');
 assert.match(page,/\['oak','maple','linden'\]\.includes\(o\.catalogId\)/);
});
