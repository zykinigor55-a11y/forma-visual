import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareRealFoliageMaterial} from '../forma-landscape-3d-models.js';

test('all original PBR foliage hue and maps are preserved, visible on both sides',()=>{
 const source={name:'Tevy spruce needles',alphaTest:.5,side:0,depthWrite:false,
  color:{value:'#2c4c37'},map:{uri:'basisu-needles'},normalMap:{uri:'basisu-normal'},
  roughness:.81,metalness:0,needsUpdate:false};
 const copy={...source},T={DoubleSide:2};
 const tuned=prepareRealFoliageMaterial(T,copy,'spruce');
 assert.equal(tuned.side,T.DoubleSide);
 assert.equal(tuned.alphaTest,.34);
 assert.equal(tuned.depthWrite,true);
 assert.equal(tuned.color,source.color,'native color must remain exact');
 assert.equal(tuned.map,source.map,'original needle albedo must remain exact');
 assert.equal(tuned.normalMap,source.normalMap,'original bump detail remains');
 assert.equal(tuned.roughness,.81);
 assert.equal(source.alphaTest,.5,'cached GLB material must remain unmodified');
 const birch=prepareRealFoliageMaterial(T,{...source},'birch');
 assert.equal(birch.alphaTest,.44);
 const pine=prepareRealFoliageMaterial(T,{...source},'pine');
 assert.equal(pine.alphaTest,.36);
 assert.equal(prepareRealFoliageMaterial(T,{...source},'oak').alphaTest,.5,'only audited low-mesh GLBs tuned');
});
test('bark and non-cutout geometry are untouched',()=>{
 const T={DoubleSide:2};
 const bark={alphaTest:0,side:0,depthWrite:true,map:'bark',color:'#fff'};
 const result=prepareRealFoliageMaterial(T,{...bark},'spruce');
 assert.equal(result.side,0);assert.equal(result.alphaTest,0);assert.equal(result.map,'bark');
});
test('Android does not silently swap loaded Tevy spruce or birch for sparse or procedural tree',()=>{
 const editor=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
 assert.match(editor,/matureTreeLoader\.loadAsync\(entry\.path\)\.then\(result=>/);
 assert.doesNotMatch(editor,/matureTreeLoader\.loadAsync\(entry\.fallbackPath\)/);
 assert.match(editor,/const importantRealTree=\['pine','spruce','birch','aspen'\]/);
 assert.match(editor,/importantRealTree\|\|!bundledModelFailures\.has\(o\.catalogId\)/);
 assert.match(editor,/renderer\.setPixelRatio\(Math\.min\(window\.devicePixelRatio\|\|1,window\.innerWidth<=720\?1\.18:1\.30\)\)/);
 assert.match(editor,/window\.FORMA_TREE_MODEL_DIAGNOSTICS=treeModelDiagnostics/);
 assert.match(editor,/const source=imported\|\|bundledPine\|\|bundledAdult\|\|null/);
});
