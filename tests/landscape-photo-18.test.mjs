import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CATALOG} from '../forma-landscape-project-core.js';
import {PHOTO_ASSETS} from '../forma-landscape-project-graphics.js';

test('all 18 botanical entries have a dedicated transparent 1080 square PNG',()=>{
 const plants=CATALOG.filter(x=>x.group==='trees'||x.group==='shrubs');
 assert.equal(plants.length,18);
 for(const p of plants){
   const name=PHOTO_ASSETS[p.id];
   assert.match(name,/^[a-z-]+\.png$/,p.id);
   const png=readFileSync(new URL('../assets/landscape-photo/'+name,import.meta.url));
   assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a',p.id);
   assert.equal(png.readUInt32BE(16),1080,p.id);
   assert.equal(png.readUInt32BE(20),1080,p.id);
   assert.equal(png[25],6,p.id+' must contain RGBA alpha');
 }
});
