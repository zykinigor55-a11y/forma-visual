import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {MATURE_TREE_MODELS} from '../forma-landscape-3d-mature-trees.js';

const manifest=JSON.parse(readFileSync(new URL('../assets/landscape-models/tevy-trees.sources.json',import.meta.url)));
const page=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
test('Tevy CC0 sources are pinned, species-correct, and local at runtime',()=>{
 assert.equal(manifest.license,'CC0 1.0');
 assert.deepEqual(manifest.trees.map(x=>x.species).sort(),['apple','aspen','rowan']);
 const slugs={apple:'apple-tree',aspen:'aspen',rowan:'rowan'};
 for(const source of manifest.trees){
  const {species}=source,entry=MATURE_TREE_MODELS[species];
  assert.equal(source.download,'https://tevy.dev/models/'+slugs[species]+'/v1/lod0.glb');
  assert.equal(source.sourcePage,'https://tevy.dev/models/'+slugs[species]);
  assert.equal(entry.sourcePage,source.sourcePage);
  assert.equal(entry.license,'CC0 1.0');
  assert.equal(entry.path,'/assets/landscape-models/'+source.file);
  const file=new URL('../assets/landscape-models/'+source.file,import.meta.url);
  if(!existsSync(file))continue; // GitHub Actions downloads and commits binaries.
  const bytes=readFileSync(file);
  assert.equal(bytes.toString('ascii',0,4),'glTF');
  assert.equal(bytes.readUInt32LE(4),2);
  assert.equal(bytes.readUInt32LE(8),bytes.length);
  const license=JSON.parse(readFileSync(new URL('../assets/landscape-models/'+species+'-mature-cc0.source.json',import.meta.url)));
  assert.equal(license.species,species);
  assert.equal(license.license,'CC0 1.0');
 }
});
test('native seasonal trees remain present for autumn and winter with GLB summer photo-realism',()=>{
 assert.match(page,/\['birch','oak','maple','linden','apple','rowan','aspen'\]\.includes\(o\.catalogId\)/);
 assert.match(page,/const source=imported\|\|bundledPine\|\|bundledAdult\|\|null/);
 assert.match(page,/createVegetation\(THREE,o/);
});
