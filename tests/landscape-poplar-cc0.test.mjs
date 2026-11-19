import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {MATURE_TREE_MODELS} from '../forma-landscape-3d-mature-trees.js';
import {CATALOG,TREE_HEIGHT_M} from '../forma-landscape-project-core.js';
import {VEGETATION_SPECIES} from '../forma-landscape-3d-vegetation.js';
const p=new URL('../assets/landscape-models/poplar-lombardy-tevy-cc0.glb',import.meta.url);
const info=JSON.parse(readFileSync(new URL('../assets/landscape-models/poplar-lombardy-tevy-cc0.source.json',import.meta.url),'utf8'));
const editor=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
test('licensed Tevy poplar has its own catalogue item and model URL',()=>{
 assert.equal(MATURE_TREE_MODELS.poplar.path,'/assets/landscape-models/poplar-lombardy-tevy-cc0.glb');
 assert.equal(MATURE_TREE_MODELS.poplar.remoteFallbackPath,'https://tevy.dev/models/lombardy-poplar/v1/lod0.glb');
 assert.equal(MATURE_TREE_MODELS.poplar.license,'CC0 1.0');
 assert.equal(info.sha256,'0732a7a7e6581d14ecef09be8356ec2365b511b626fbdf8cfc301d350eaa623a');
 assert.ok(CATALOG.some(x=>x.id==='poplar'&&x.group==='trees'));
 assert.equal(TREE_HEIGHT_M.poplar,24);
 assert.ok(VEGETATION_SPECIES.poplar);
 assert.match(editor,/\['birch','oak','maple','linden','apple','rowan','aspen','poplar'\]\.includes/);
 assert.match(editor,/remoteFallbackPath/);
});
test('downloaded model is the verified 6.5 MB glTF v2 binary',{skip:!existsSync(p)},()=>{
 const b=readFileSync(p);
 assert.equal(b.toString('utf8',0,4),'glTF');
 assert.equal(b.readUInt32LE(4),2);
 assert.equal(b.readUInt32LE(8),b.length);
 assert.equal(b.length,info.sizeBytes);
 assert.equal(createHash('sha256').update(b).digest('hex'),info.sha256);
});
