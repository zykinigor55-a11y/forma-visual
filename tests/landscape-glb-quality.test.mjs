import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {REAL_3D_OBJECTS} from '../forma-landscape-3d-library40.js';
import {prepareRealMaterial} from '../forma-landscape-3d-models.js';

const ROOT=new URL('../assets/landscape-models/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('sources.json',ROOT),'utf8'));
const recordById=new Map(manifest.map(x=>[x.catalogId,x]));

function inspectGlb(data,id){
 assert.equal(data.toString('ascii',0,4),'glTF',id+': header');
 assert.equal(data.readUInt32LE(4),2,id+': glTF 2.0');
 assert.equal(data.readUInt32LE(8),data.length,id+': file length');
 const jsonLen=data.readUInt32LE(12);
 assert.equal(data.toString('ascii',16,20),'JSON',id+': JSON chunk');
 assert.ok(jsonLen>20&&jsonLen+20<=data.length,id+': JSON bounds');
 const scene=JSON.parse(data.subarray(20,20+jsonLen).toString('utf8'));
 assert.ok((scene.meshes?.length||0)>0,id+': real mesh, not a placeholder');
 assert.ok((scene.nodes?.length||0)>0,id+': scene nodes');
 assert.ok((scene.meshes||[]).some(m=>m.primitives?.some(p=>p.attributes?.POSITION!==undefined)),id+': vertex positions');
 assert.ok((scene.materials?.length||0)>0,id+': authored PBR materials');
 for(const [index,im] of (scene.images||[]).entries())
  assert.ok(im.bufferView!==undefined||im.uri?.startsWith('data:'),id+': embedded image '+index);
 for(const [index,b] of (scene.buffers||[]).entries())
  assert.equal(b.uri,undefined,id+': no external buffer '+index);
 return {meshes:scene.meshes.length,materials:scene.materials.length,textures:scene.textures?.length||0};
}

test('all 40 GLBs are unique, embedded, source-matched and accompanied by real previews',()=>{
 assert.equal(REAL_3D_OBJECTS.length,40);
 assert.equal(manifest.length,40);
 assert.equal(recordById.size,40);
 const hashes=new Set();
 for(const model of REAL_3D_OBJECTS){
  const {id}=model,record=recordById.get(id);
  assert.ok(record,id+': missing source record');
  assert.equal(record.license,'CC0-1.0',id+': license');
  assert.match(record.source,/^https:\/\/polyhaven\.com\/a\//,id+': source URL');
  const bytes=readFileSync(new URL(id+'.glb',ROOT));
  assert.equal(bytes.length,record.bytes,id+': manifest byte count');
  const hash=createHash('sha256').update(bytes).digest('hex');
  assert.equal(hash,record.sha256,id+': source checksum');
  assert.ok(!hashes.has(hash),id+': duplicate geometry asset');
  hashes.add(hash);
  assert.ok(bytes.length<42*1024*1024,id+': mobile model budget');
  inspectGlb(bytes,id);
  const pic=readFileSync(new URL('thumbs/'+id+'.webp',ROOT));
  assert.equal(pic.toString('ascii',0,4),'RIFF',id+': preview RIFF');
  assert.equal(pic.toString('ascii',8,12),'WEBP',id+': preview format');
  assert.ok(pic.length>1500,id+': nonempty preview');
 }
});

test('source PBR settings are not overwritten by renderer material preparation',()=>{
 const original={transparent:true,opacity:1,alphaTest:.45,depthWrite:false,side:0,metalness:.6,roughness:.35,map:{id:'base'},normalMap:{id:'normal'}};
 const copy={...original};
 assert.equal(prepareRealMaterial(copy),copy);
 assert.equal(copy.depthWrite,true);
 for(const key of ['transparent','opacity','alphaTest','side','metalness','roughness','map','normalMap'])assert.deepEqual(copy[key],original[key],key);
 const stone={transparent:false,side:0,roughness:.85,metalness:0};
 prepareRealMaterial(stone);
 assert.deepEqual(stone,{transparent:false,side:0,roughness:.85,metalness:0});
});
