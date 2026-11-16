/* Run in the development runtime: node tests/art-canvas.verify.mjs.
   Uses the runtime canvas implementation, not a deployment dependency. */
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {composeMasked,loadImage} from '../forma-local-composite.js';
const require=createRequire(import.meta.url);
const {createCanvas,Image}=require('@napi-rs/canvas');
globalThis.Image=Image;globalThis.document={createElement:()=>createCanvas(1,1)};
const base=createCanvas(960,640),bc=base.getContext('2d');
const original=bc.createImageData(960,640);
for(let y=0;y<640;y++)for(let x=0;x<960;x++){const i=(y*960+x)*4;original.data[i]=x%251;original.data[i+1]=y%241;original.data[i+2]=(x+y)%239;original.data[i+3]=255;}
bc.putImageData(original,0,0);
const edit=createCanvas(256,256),ec=edit.getContext('2d');ec.fillStyle='#f12e49';ec.fillRect(0,0,256,256);
const mask=createCanvas(960,640),mc=mask.getContext('2d');mc.fillStyle='#fff';mc.fillRect(410,290,90,60);
const crop={x:400,y:260,width:140,height:120},frame={width:140,height:140,x:0,y:10};
const result=await composeMasked(base.toDataURL('image/png'),edit.toDataURL('image/png'),mask,crop,frame);
const decoded=await loadImage(result),out=createCanvas(decoded.width,decoded.height),oc=out.getContext('2d');oc.drawImage(decoded,0,0);
const pixels=oc.getImageData(0,0,960,640).data;
let protectedPixels=0;
for(let y=0;y<640;y++)for(let x=0;x<960;x++){
 const i=(y*960+x)*4,inside=x>=410&&x<500&&y>=290&&y<350;
 if(!inside){for(let c=0;c<4;c++)assert.equal(pixels[i+c],original.data[i+c],`pixel ${x},${y}, channel ${c}`);protectedPixels++;}
 else assert.deepEqual([...pixels.slice(i,i+4)],[241,46,73,255]);
}
assert.equal(decoded.width,960);assert.equal(decoded.height,640);
const wrong=createCanvas(300,100);await assert.rejects(()=>composeMasked(base.toDataURL('image/png'),wrong.toDataURL('image/png'),mask,crop,frame),/пропорции/);
console.log(`Native canvas composition passed: ${protectedPixels} protected pixels unchanged; padded/resized AI crop aligned; wrong aspect rejected.`);
const {prepareMaterialEdit}=await import('../forma-local-composite.js');
assert.equal(typeof prepareMaterialEdit,'function','material edits need a bounded cropped provider payload');
const providerMask=createCanvas(960,640),pm=providerMask.getContext('2d');pm.fillStyle='#000';pm.fillRect(0,0,960,640);pm.clearRect(410,290,90,60);
const prepared=await prepareMaterialEdit(base.toDataURL('image/png'),providerMask.toDataURL('image/png'));
const sent=await loadImage(prepared.image);assert.ok(sent.width<=1536&&sent.height<=1536);assert.equal(sent.width,sent.height);
const applied=await prepared.compose(edit.toDataURL('image/png'));assert.equal((await loadImage(applied)).width,960);
const empty=createCanvas(960,640);empty.getContext('2d').fillRect(0,0,960,640);await assert.rejects(()=>prepareMaterialEdit(base.toDataURL('image/png'),empty.toDataURL('image/png')),/выделение/);
console.log('Material crop preparation passed: square bounded payload, native result composition, empty masks rejected.');
const {drawStrokes}=await import('../forma-landscape-tools.js');
const brush=createCanvas(200,200),br=brush.getContext('2d');br.strokeStyle='#fff';drawStrokes(br,[{size:.2,points:[{x:.2,y:.5},{x:.8,y:.5}]},{size:.1,erase:true,points:[{x:.5,y:.4},{x:.5,y:.6}]}],200,200);
assert.ok(br.getImageData(50,100,1,1).data[3]>250);assert.equal(br.getImageData(100,100,1,1).data[3],0);assert.equal(br.getImageData(10,10,1,1).data[3],0);
console.log('Landscape brush and eraser: painted coverage, erased center and protected exterior verified.');
