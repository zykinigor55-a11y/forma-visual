import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {landscapePrompt} from '../forma-art-direction-core.js';
test('text landscape prompt names exact botanical species and placement without cutout guidance',()=>{
 const p=landscapePrompt({items:[{kind:'tree',catalogId:'pine-tall',x:.8,y:.9,w:.3,h:2}]});
 assert.match(p,/Pinus sylvestris/);assert.match(p,/80%.*90%/);
 assert.match(p,/TEXT-DESCRIBED/);assert.match(p,/Do not shrink.*frame/i);
 assert.match(p,/Image 2.*clean full scene/i);assert.doesNotMatch(p,/All supplied cutouts/);
});
test('landscape provider payload contains clean images and mask, no screenshot guide or species board',async()=>{
 const source=readFileSync(new URL('../forma-landscape-atmosphere.js',import.meta.url),'utf8');
 const code=source.slice(source.indexOf('async function landscapePayload('),source.indexOf('\nasync function providerCopy'));
 const data='data:image/png;base64,clean';const c=()=>({getContext:()=>({fillRect(){},drawImage(){},getImageData:()=>({data:Uint8ClampedArray.of(0,0,0,255)})}),toDataURL:()=>data});
 const context={items:[{kind:'tree',catalogId:'pine-tall',x:.5,y:.8,w:.1,h:.3}],loadImage:async()=>({naturalWidth:1000,naturalHeight:1000}),cropBounds:()=>({x:0,y:0,width:1000,height:1000}),canvas:c,drawSelection(){},selectionHasCoverage:()=>true,isLinearEdge:()=>false,isBrushKind:k=>k==='fill'||k==='scatter',normalizeLandscape:x=>x,CUSTOM_LANDSCAPE_ID:'custom-image',customAssets:[],customImages:new Map(),makeCustomReferenceBoard:async()=>null};
 vm.runInNewContext(code+';this.payload=landscapePayload;',context);
 const {payload:p}=await context.payload({image:'source'});
 assert.equal(p.material,undefined);assert.equal(p.landscapeEdit.placementGuide,undefined);assert.equal(p.landscapeEdit.speciesBoard,undefined);
 assert.equal(p.image,data);assert.ok(p.reference);assert.ok(p.mask);
});
