import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {freshProject,normalizeProject} from '../forma-landscape-project-core.js';
import {PINE_GROWTH_DEFAULTS,PINE_GROWTH_RANGES,PINE_GROWTH_PRESETS,
 normalizePineGrowth,pineGrowthMarkup,pineGrowthEquals} from '../forma-landscape-pine-growth.js';
import {makePineExtraGrowth} from '../forma-landscape-pine-geometry.js';

test('pine growth settings are clamped and defaults are safe',()=>{
 const d=normalizePineGrowth();
 assert.deepEqual(d,PINE_GROWTH_DEFAULTS);
 const strange=normalizePineGrowth({branchDensity:950,needleDensity:-8,crownBase:100,
  crownSpread:-200,irregularity:999,seed:100000});
 assert.equal(strange.branchDensity,200);
 assert.equal(strange.needleDensity,0);
 assert.equal(strange.crownBase,65);
 assert.equal(strange.crownSpread,70);
 assert.equal(strange.irregularity,40);
 assert.equal(strange.seed,99999);
 assert.ok(pineGrowthEquals({},PINE_GROWTH_DEFAULTS));
 assert.ok(!pineGrowthEquals({branchDensity:110},PINE_GROWTH_DEFAULTS));
 assert.equal(PINE_GROWTH_PRESETS.length,6);
 assert.ok(Object.keys(PINE_GROWTH_RANGES).includes('needleDensity'));
});
test('each pine in the saved masterplan keeps independent branch and needle values',()=>{
 const d=freshProject();
 const a={id:'pine-a',catalogId:'pine',type:'trees',x:10,y:20,height:14,diameter:7,
   pine:{branchDensity:165,needleDensity:220,crownBase:37,crownSpread:132,irregularity:33,seed:19}};
 const b={id:'pine-b',catalogId:'pine',type:'trees',x:23,y:29,height:9,diameter:4.5,
   pine:{branchDensity:10,needleDensity:55,seed:4}};
 const birch={id:'birch',catalogId:'birch',type:'trees',x:7,y:25,height:14,diameter:6};
 const result=normalizeProject({...d,objects:[a,b,birch]});
 assert.equal(result.objects.length,3);
 assert.equal(result.objects[0].pine.branchDensity,165);
 assert.equal(result.objects[0].pine.needleDensity,220);
 assert.equal(result.objects[0].pine.seed,19);
 assert.equal(result.objects[1].pine.branchDensity,10);
 assert.equal(result.objects[1].pine.needleDensity,55);
 assert.equal(result.objects[2].pine,undefined,'other trees retain their schema');
 const restored=normalizeProject(JSON.parse(JSON.stringify(result)));
 assert.deepEqual(restored.objects[0].pine,result.objects[0].pine);
 assert.deepEqual(restored.objects[1].pine,result.objects[1].pine);
});
test('real pine editor exposes functioning inputs, natural randomness, and presets',()=>{
 const html=pineGrowthMarkup(PINE_GROWTH_DEFAULTS);
 for(const name of Object.keys(PINE_GROWTH_RANGES)){
  assert.ok(html.includes('data-pine-growth="'+name+'"'),name);
  assert.ok(html.includes('pineGrowOut-'+name),name);
 }
 assert.match(html,/id="pineNaturalRandom"/);
 assert.match(html,/data-pine-growth-preset="5"/);
 assert.match(html,/data-pine-growth="branchDensity"/);
 assert.match(html,/data-pine-growth="needleDensity"/);
 const css=readFileSync(new URL('../forma-landscape-pine-sizing.css',import.meta.url),'utf8');
 assert.match(css,/touch-action:pan-x/);
});
test('pine supplements are actual instanced branch and needle geometry',()=>{
 const source=readFileSync(new URL('../forma-landscape-pine-geometry.js',import.meta.url),'utf8');
 const editor=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
 const model=readFileSync(new URL('../forma-landscape-3d-models.js',import.meta.url),'utf8');
 assert.equal(typeof makePineExtraGrowth,'function');
 assert.match(source,/new T\.InstancedMesh\(branchGeom,bark,branchCount\*2\)/);
 assert.match(source,/new T\.InstancedMesh\(needleGeom,needleMat,spraysCount\)/);
 assert.match(source,/makePineNeedleSprayGeometry\(T\)/);
 assert.match(source,/new T\.MeshStandardMaterial\(\{color:'#927153'/);
 assert.match(source,/seededRandom/);
 assert.match(model,/makePineExtraGrowth\(T,clone,instance,pineGrowth\)/);
 assert.match(editor,/mountPineGrowth\(el,o/);
 assert.match(editor,/previewSelectedPineGrowth\(/);
 assert.match(editor,/commitSelectedPineGrowth\(/);
 assert.match(editor,/o\.pine=next;save\(\);rebuild\(\)/);
 assert.match(editor,/activateMobilePanel\('details'\)/);
});
