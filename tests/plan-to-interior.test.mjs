import test from 'node:test';
import assert from 'node:assert/strict';
import {buildWalls,boundsMeters,nearestWall,validateModel,suggestWalls} from '../plan-geometry.js';
import {validatePlan,visionStatus} from '../plan-vision.mjs';
const floor={width:1000,height:800,scale:.01,wallThickness:.2,wallHeight:2.8,walls:[{id:'w1',a:{x:100,y:200},b:{x:600,y:200},verified:true}]};
test('single 5m wall is a real metric extrusion',()=>{
 const result=buildWalls({...floor,openings:[]});
 assert.equal(result.length,1);assert.equal(result[0].length,5);assert.equal(result[0].wallHeight,2.8);
});
test('door creates two sides and overhead lintel, not a filled wall',()=>{
 const result=buildWalls({...floor,openings:[{wallId:'w1',kind:'door',offset:.5,width:.2}]});
 assert.equal(result.length,3);assert.equal(result.filter(r=>r.y<2.2).length,2);
});
test('window with explicit 1.2m height adds sill and header around its physical opening',()=>{
 const result=buildWalls({...floor,openings:[{wallId:'w1',kind:'window',offset:.5,width:.2,heightM:1.2}]});
 assert.equal(result.length,4);
 assert.ok(result.some(p=>Math.abs(p.wallHeight-.9)<1e-8));
 assert.ok(result.some(p=>Math.abs(p.y-2.45)<1e-8));
});
test('calibrated floor plan bounds and snapping nearest wall',()=>{
 const bounds=boundsMeters(floor.walls,floor.width,floor.height,floor.scale);
 assert.equal(bounds.width,5);assert.equal(nearestWall(floor.walls,{x:350,y:202},20).t,.5);
});
test('cannot claim verified precision without scale',()=>{
 const errors=validateModel({...floor,image:'data:image',scaleVerified:false,openings:[]});
 assert.ok(errors.some(v=>/масштаб/i.test(v)));
});
test('AI vision output requires normalized finite wall geometry',()=>{
 const p=validatePlan({walls:[{x1:.1,y1:.1,x2:.9,y2:.1,confidence:.8},{x1:5,y1:0,x2:6,y2:0}],openings:[{wallIndex:0,kind:'window',offset:.5,width:.2}]});
 assert.equal(p.walls.length,1);assert.equal(p.openings.length,1);assert.equal(p.openings[0].wallId,p.walls[0].id);
});
test('Vision is not silently enabled without explicit model configuration',()=>{
 if(!process.env.PLAN_VISION_MODEL)assert.equal(visionStatus().ready,false);
});
test('raster detector finds a dark rectangular wall drawing',()=>{
 const source={width:300,height:200,pixels:new Uint8ClampedArray(300*200*4)};
 for(let i=0;i<source.pixels.length;i+=4){source.pixels[i]=source.pixels[i+1]=source.pixels[i+2]=255;source.pixels[i+3]=255}
 for(let y=40;y<160;y++)for(let x=35;x<275;x++){if(y<=44||y>=154||x<=39||x>=270||x>=160&&x<=164){const i=(y*300+x)*4;source.pixels[i]=source.pixels[i+1]=source.pixels[i+2]=22}}
 const oldDocument=globalThis.document;
 globalThis.document={createElement(){
  const c={width:0,height:0,pixels:null};
  c.getContext=()=>({
   drawImage(image){
    c.pixels=new Uint8ClampedArray(c.width*c.height*4);
    for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
     const ix=Math.min(image.width-1,Math.floor(x/c.width*image.width));
     const iy=Math.min(image.height-1,Math.floor(y/c.height*image.height));
     for(let k=0;k<4;k++)c.pixels[(y*c.width+x)*4+k]=image.pixels[(iy*image.width+ix)*4+k]
    }
   },
   getImageData(){return {data:c.pixels}}
  });
  return c;
 }};
 try{assert.ok(suggestWalls(source).length>=4)}
 finally{globalThis.document=oldDocument}
});

test('default window height is 1.35m and its header is aligned above the opening',()=>{
 const parts=buildWalls({...floor,openings:[{wallId:'w1',kind:'window',offset:.5,width:.2}]});
 const header=parts.find(p=>Math.abs(p.bottomM-2.25)<1e-8);
 assert.ok(header);assert.equal(header.topM,2.8);assert.ok(Math.abs(header.y-2.525)<1e-8);
});
