import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {optimizeNativeLinden,enhanceLindenBark} from '../forma-landscape-linden-pbr.js';
import {MATURE_TREE_MODELS} from '../forma-landscape-3d-mature-trees.js';

test('linden native tree remains the original licensed Tilia GLB with no edited source bytes',()=>{
 const p=new URL('../assets/landscape-models/linden-mature-cc0.glb',import.meta.url);
 const bytes=readFileSync(p);
 const meta=JSON.parse(readFileSync(new URL('../assets/landscape-models/linden-mature-cc0.source.json',import.meta.url)));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),meta.sha256);
 assert.equal(meta.license,'CC0 1.0');
 assert.equal(meta.species,'linden');
 assert.equal(MATURE_TREE_MODELS.linden.path,'/assets/landscape-models/linden-mature-cc0.glb');
 assert.equal(meta.analysis.images,0,'source GLB has no UV maps or PBR images');
 assert.equal(meta.analysis.meshes,625);
});
test('linden only gets a matte neutral-brown bark shader with preserved PBR material',()=>{
 const color={received:null,setRGB(r,g,b){this.received=[r,g,b]}};
 const mat={name:'bark',roughness:.65,metalness:.1,userData:{preserveSource:true},
  color,map:{id:'existing'},normalMap:{id:'existing-normal'},alphaTest:0,
  needsUpdate:false};
 const patched=enhanceLindenBark(null,mat);
 assert.strictEqual(patched,mat);
 assert.ok(mat.userData.formaLindenBark);
 assert.ok(mat.userData.preserveSource);
 assert.ok(mat.roughness>=.86);
 assert.equal(mat.metalness,0);
 assert.deepEqual(color.received,[.36,.33,.3]);
 assert.equal(mat.map.id,'existing');
 assert.equal(mat.normalMap.id,'existing-normal');
 assert.equal(mat.alphaTest,0);
 assert.equal(mat.customProgramCacheKey(),'forma-linden-native-bark-v1');
 const shader={vertexShader:'#include <common>\n#include <worldpos_vertex>',
  fragmentShader:'#include <common>\n#include <color_fragment>'};
 mat.onBeforeCompile(shader);
 assert.match(shader.vertexShader,/varying vec3 vFormaLindenWorld/);
 assert.match(shader.fragmentShader,/float fissure=pow/);
 assert.match(shader.fragmentShader,/diffuseColor\.rgb\*=barkTone/);
 const original=mat.onBeforeCompile;
 enhanceLindenBark(null,mat);
 assert.strictEqual(mat.onBeforeCompile,original,'avoid stacking shader hooks on repeat planting');
});
test('native bark optimization leaves unrelated species and empty scenes untouched',()=>{
 assert.equal(optimizeNativeLinden({},null),null);
 const source={isObject3D:true,clone(){return {isObject3D:true,updateMatrixWorld(){},
   matrixWorld:{clone(){return {invert(){return this}}}},
   traverse(){},userData:{}}}};
 const a=optimizeNativeLinden({},source),b=optimizeNativeLinden({},source);
 assert.strictEqual(a,b,'native tree source optimized exactly once');
 assert.notStrictEqual(a,source,'source glTF preserved untouched');
});
test('only linden accesses the native optimization and bark shader',()=>{
 const editor=readFileSync(new URL('../forma-landscape-3d-models.js',import.meta.url),'utf8');
 assert.match(editor,/instance\.catalogId==='linden'&&shareGeometry\)source=optimizeNativeLinden\(T,source\)/);
 assert.match(editor,/instance\.catalogId==='linden'&&String\(material\.name\|\|''\)\.toLowerCase\(\)==='bark'/);
});
