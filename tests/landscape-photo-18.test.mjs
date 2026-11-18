import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CATALOG} from '../forma-landscape-project-core.js';
import {PHOTO_ASSETS,fallbackIconURL} from '../forma-landscape-project-graphics.js';

test('historical 18 species retain their verified 1080 RGBA cards; 8 new native 3D species have safe images',()=>{
 const plants=CATALOG.filter(x=>x.group==='trees'||x.group==='shrubs');
 assert.equal(plants.length,26);
 const original=[
  'pine','spruce','birch','oak','maple','linden','willow','rowan','apple','sakura',
  'juniper','hydrangea','spirea','barberry','dogwood','thuja-globe','lavender','boxwood'
 ];
 const fresh=['ninebark','hosta','ornamental-grass','fern','periwinkle','wild-shrub','ash','aspen'];
 assert.deepEqual(new Set(plants.map(p=>p.id)),new Set([...original,...fresh]));
 for(const id of original){
  const name=PHOTO_ASSETS[id];
  assert.match(name,/^[a-z-]+\.png$/,id);
  const png=readFileSync(new URL('../assets/landscape-photo/'+name,import.meta.url));
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a',id);
  assert.equal(png.readUInt32BE(16),1080,id);
  assert.equal(png.readUInt32BE(20),1080,id);
  assert.equal(png[25],6,id+' must contain RGBA alpha');
 }
 for(const id of fresh){
  const plant=plants.find(x=>x.id===id);
  assert.ok(plant,id);
  assert.match(fallbackIconURL(plant),/^data:image\/svg\+xml/);
 }
});
