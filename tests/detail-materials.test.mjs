import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {imageTaskPrompt,normalizeImageTask} from '../forma-image-workflows.js';
const crop={x:.2,y:.2,w:.4,h:.4};
test('both detail modes request a generative microtexture redraw while locking visible geometry',()=>{
 for(const level of ['close','macro']){
  const prompt=imageTaskPrompt(normalizeImageTask({kind:'detail',crop,level}));
  assert.match(prompt,/GENERATIVE REDRAW/);assert.match(prompt,/Do not merely enlarge, interpolate, sharpen/);
  assert.match(prompt,/stone grain and pores, wood fibres/);assert.match(prompt,/Keep existing joints at their exact positions/);
  assert.match(prompt,/NEVER reveal an unseen side/);assert.match(prompt,/never presented as recovered factual detail/);
 }
 assert.match(imageTaskPrompt({kind:'detail',crop,level:'macro'}),/MACRO MATERIAL STUDY/);
 assert.match(imageTaskPrompt({kind:'detail',crop,level:'close'}),/ARCHITECTURAL CLOSE-UP/);
});
test('a crop sends native source pixels rather than a pre-enlarged blurry image',async()=>{
 const source=readFileSync(new URL('../forma-image-workspace.js',import.meta.url),'utf8');
 const code=source.slice(source.indexOf('async function cropImage('),source.indexOf('\nfunction imageView'));
 let dimensions,draw;
 const context={normalizeCrop:x=>x,loadImage:async()=>({naturalWidth:1000,naturalHeight:500}),canvas:(w,h)=>{dimensions=[w,h];return {width:w,height:h,getContext:()=>({drawImage:(...args)=>draw=args}),toDataURL:()=> 'crop'};}};
 vm.runInNewContext(code+';this.cropImage=cropImage;',context);
 assert.equal(await context.cropImage('source',crop), 'crop');assert.deepEqual(dimensions,[400,200]);assert.deepEqual(draw.slice(1,5),[200,100,400,200]);
 await context.cropImage('source',{x:0,y:0,w:1,h:1},640);assert.deepEqual(dimensions,[640,320]);
});
function materialsHarness({busy=false}={}){
 const source=readFileSync(new URL('../forma-materials-upload.js',import.meta.url),'utf8');
 const code=source.slice(source.indexOf('export function mountMaterialsSource'),source.indexOf("\ndocument.addEventListener")).replace('export ','');
 const input={files:[],disabled:false,value:'',addEventListener:(_type,fn)=>{input.change=fn;}};
 const status={textContent:''};const card={querySelector:selector=>selector==='input'?input:status};let uploads=0,uploaded;
 const controls={querySelector:()=>null,prepend:element=>assert.equal(element,card)};
 const context={document:{createElement:()=>card},window:{FORMA_ART_BRIDGE:{snapshot:()=>({busy}),uploadFile:async file=>{uploads++;uploaded=file;}}}};
 vm.runInNewContext(code+';this.mount=mountMaterialsSource;',context);context.mount({id:'materials',controls});
 return {input,status,get uploads(){return uploads;},get uploaded(){return uploaded;}};
}
test('Materials owns a source picker that uploads through the project bridge',async()=>{
 const h=materialsHarness(),file={name:'house.png',type:'image/png',size:100};h.input.files=[file];
 await h.input.change();assert.equal(h.uploads,1);assert.equal(h.uploaded,file);assert.equal(h.input.disabled,false);assert.match(h.status.textContent,/Исходник загружен/);
});
test('Materials refuses a source replacement during processing or an invalid file',async()=>{
 for(const [options,file,message] of [[{busy:true},{type:'image/png',size:100},/Дождитесь/],[{}, {type:'text/plain',size:100},/PNG/],[{},{type:'image/png',size:15*1024*1024},/14 МБ/]]){
  const h=materialsHarness(options);h.input.files=[file];await h.input.change();assert.equal(h.uploads,0);assert.match(h.status.textContent,message);assert.equal(h.input.disabled,false);
 }
});
test('close-up capture targets the selected region in the full source without orbiting',()=>{
 const p=imageTaskPrompt({kind:'detail',crop:{x:.1,y:.3,w:.2,h:.4},level:'macro',notes:'Ручка на деревянном фасаде'});
 assert.match(p,/aim.*20%.*50%/i);assert.match(p,/move.*closer.*same viewing direction/i);assert.match(p,/Ручка на деревянном фасаде/);assert.doesNotMatch(p,/Preserve the crop camera/);
});
