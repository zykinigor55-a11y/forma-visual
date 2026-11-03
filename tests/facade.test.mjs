import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as module from '../lib/demo-facade.ts';

test('facade mask protects windows, frames, roof and outdoor furniture',()=>{
 assert.equal(typeof module.facadeCoverage,'function');
 for(const [x,y] of [[325,490],[440,470],[550,450],[680,420],[942,650],[1145,650],[1268,660],[1070,775],[800,300],[1365,900]])assert.equal(module.facadeCoverage(x/1448,y/1086,[180,160,140]),0,`${x},${y}`);
});
test('color reaches all main facade faces including the right return',()=>{
 assert.equal(typeof module.facadeCoverage,'function');
 for(const [x,y] of [[250,600],[395,600],[490,650],[540,670],[790,395],[890,410],[860,650],[1010,650],[1080,600],[1335,650]])assert.ok(module.facadeCoverage(x/1448,y/1086,[180,160,140])>.9,`${x},${y}`);
});
test('material color transfer changes hue but preserves texture and warm lighting',()=>{
 assert.equal(typeof module.recolorFacadePixel,'function');
 for(const material of ['brick','wood','plaster','stone']){
  const dark=module.recolorFacadePixel([70,55,40],material,'#4D514A');
  const light=module.recolorFacadePixel([140,110,80],material,'#4D514A');
  assert.ok(light[0]>dark[0]&&light[1]>dark[1]&&light[2]>dark[2]);
 }
 const gray=module.recolorFacadePixel([220,160,105],'wood','#8C8981');
 assert.ok(Math.max(...gray)-Math.min(...gray)<15,gray);
 const warm=module.recolorFacadePixel([240,145,65],'wood','#8C8981',true);
 assert.ok(warm[0]>warm[2]);
});
test('full facade recoloring preserves unmasked pixels at preview and thumbnail sizes',()=>{
 for(const width of [360,1448]){
  const height=width*.75,data=new Uint8ClampedArray(width*height*4);
  for(let i=0;i<data.length;i+=4)data.set([220,160,105,255],i);
  module.recolorFacade(data,width,height,'wood','#4D514A');
  const pixel=(x,y)=>Array.from(data.slice((Math.floor(y/1086*height)*width+Math.floor(x/1448*width))*4,(Math.floor(y/1086*height)*width+Math.floor(x/1448*width))*4+4));
  assert.deepEqual(pixel(325,490),[220,160,105,255]);
  assert.deepEqual(pixel(1010,650),[...module.recolorFacadePixel([220,160,105],'wood','#4D514A'),255]);
 }
});
test('white brick retains texture under bright facade downlights',()=>{
 const a=module.recolorFacadePixel([220,150,95],'brick','#E8DFCE',true);
 const b=module.recolorFacadePixel([240,175,115],'brick','#E8DFCE',true);
 assert.ok(b.every((value,i)=>value>a[i]&&value<255),`${a} / ${b}`);
});
