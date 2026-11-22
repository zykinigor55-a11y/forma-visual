/* Node-only regression checks for scene-safe mobile weather changes.
 * No WebGL, network or paid API calls are used.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {attachTreeSnowPreview,refreshAllTreeSnowPreview} from '../forma-landscape-3d-snow-canopy.js';
import {normalizeWeatherEffects,weatherEffectsVisible} from '../forma-landscape-weather-effects.js';

const here=dirname(fileURLToPath(import.meta.url));
const read=(name)=>readFileSync(resolve(here,'..',name),'utf8');
class FakeColor {
 constructor(code='#ffffff'){
  const hex=String(code).replace('#','');
  const num=parseInt(hex,16);
  this.r=((num>>16)&255)/255;
  this.g=((num>>8)&255)/255;
  this.b=(num&255)/255;
 }
 clone(){const c=new FakeColor();return c.copy(this)}
 copy(c){this.r=c.r;this.g=c.g;this.b=c.b;return this}
 lerp(c,a){this.r+=(c.r-this.r)*a;this.g+=(c.g-this.g)*a;this.b+=(c.b-this.b)*a;return this}
}
function material(color='#294d36',options={}){
 return {
  name:options.name||'',
  map:options.map||null,
  color:new FakeColor(color),
  emissive:new FakeColor('#000000'),
  emissiveIntensity:0,
  transparent:!!options.transparent,alphaTest:options.alphaTest||0,
  clone(){
   const copy=material(color,options);
   copy.color=this.color.clone();
   copy.emissive=this.emissive.clone();
   copy.emissiveIntensity=this.emissiveIntensity;
   return copy;
  }
 };
}
const Three={Color:FakeColor};
function tree(nodes){
 return {
  userData:{},
  position:{x:2.5,y:0,z:4.25},
  traverse(callback){for(const n of nodes)callback(n)}
 };
}
const winter=(snowTrees)=>({season:'winter',weather:'snow',effects:{snowTrees}});
function fixture(){
 const trunk={isMesh:true,name:'Pine_trunk_bark',userData:{},material:material('#765038')};
 const leaves={
  isMesh:true,isInstancedMesh:true,name:'needles',userData:{},
  material:material('#224d3a'),
  instanceColor:{array:new Float32Array([.16,.34,.21,.13,.3,.19,.18,.4,.24]),needsUpdate:false},
  count:3
 };
 return {trunk,leaves,group:tree([trunk,leaves])};
}
test('winter conifer snow visibly updates GLB foliage and leaves bark and XYZ unchanged',()=>{
 const {group,trunk,leaves}=fixture();
 const originalTrunk=trunk.material,originalCoord={...group.position};
 const originalColor=leaves.instanceColor.array.slice();
 const info=attachTreeSnowPreview(Three,group,{catalogId:'pine',id:'test-pine'},winter(0));
 assert.ok(info,'individual snow preview is attached to the real tree');
 assert.equal(info.eligibleMeshes,1);
 assert.equal(trunk.material,originalTrunk,'wood material is not replaced');
 const root={traverse(callback){callback(group)}};
 assert.equal(refreshAllTreeSnowPreview(root,winter(100)),1);
 assert.ok(leaves.instanceColor.array[1]>.70,'needle instances brighten at 100%');
 assert.equal(leaves.instanceColor.needsUpdate,true,'GPU instance upload requested');
 assert.deepEqual(group.position,originalCoord,'no moved planting coordinates');
 assert.equal(refreshAllTreeSnowPreview(root,winter(0)),1);
 assert.deepEqual([...leaves.instanceColor.array],[...originalColor],'snow 0% restores the original needle colours');
 assert.equal(trunk.material,originalTrunk,'trunk stays identical after slider reset');
});
test('generic opaque PBR GLB foliage is detected without bleaching thin woody mesh',()=>{
 const crown={
  isMesh:true,name:'Mesh_002',userData:{},
  material:material('#a7afa5',{map:{name:'Texture_001'}}),
  geometry:{boundingBox:{min:{x:-2,y:1,z:-2},max:{x:2,y:4,z:2}}}
 };
 const bark={
  isMesh:true,name:'Mesh_003',userData:{},
  material:material('#947455',{map:{name:'Bark_001'}}),
  geometry:{boundingBox:{min:{x:-.15,y:0,z:-.15},max:{x:.15,y:5,z:.15}}}
 };
 const g=tree([crown,bark]),oldBark=bark.material;
 const before=crown.material.color.r;
 const preview=attachTreeSnowPreview(Three,g,{catalogId:'spruce',id:'test-spruce'},winter(100));
 assert.ok(preview,'anonymous broad GLB crown has a snow material');
 assert.ok(crown.material.color.r>before,'opaque PBR foliage becomes visibly lighter');
 assert.equal(bark.material,oldBark,'narrow bark is never modified');
});
test('weather sliders clamp, track season and never imply rain after rainfall',()=>{
 assert.equal(normalizeWeatherEffects({snowTrees:340}).snowTrees,100);
 assert.equal(normalizeWeatherEffects({snowTrees:-2}).snowTrees,0);
 assert.equal(weatherEffectsVisible({season:'winter',weather:'sunny'}).snow,true);
 assert.equal(weatherEffectsVisible({season:'summer',weather:'rain'}).rain,true);
});
test('mobile editor starts with the 3D canvas and uses accessible, tappable sheets',()=>{
 const html=read('forma-landscape-3d.html');
 const css=read('forma-mobile-landscape-v1.css');
 assert.match(html,/activateMobilePanel\(window\.innerWidth<=850\?'scene':'tools'\)/);
 assert.match(html,/role="group" aria-label="Мобильные панели редактора"/);
 assert.match(html,/setAttribute\('aria-pressed',String\(active\)\)/);
 assert.match(html,/forma-mobile-landscape-v1\.css/);
 assert.match(css,/body\[data-mobile-panel="details"\] #right\{[^}]*height:min\(48dvh,440px\)\}/);
 assert.match(css,/#mobileWorkspaceTabs button\{min-width:0;min-height:44px/);
 assert.match(html,/id="quickWeatherSnowTrees"/);
 assert.match(html,/id="quickInteriorLights"/);
});
