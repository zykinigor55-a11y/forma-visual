/* Regression: realistic botanical image-to-image prompts, no CGI lock,
   full-frame checking and no silent paid retries. Pure Node tests. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {perspectiveLandscapePrompt} from '../forma-landscape-project-prompts.js';
import {inspectRenderImagePixels} from '../forma-landscape-ai-photo-quality.js';
import {photoLightingContract} from '../forma-landscape-3d-lighting-photo.js';

const landscape={
 site:{width:40,height:35,boundary:[]},
 house:{type:'house',archStyle:'alpha',width:7.5,height:9.5,x:14,y:16,
  rotation:0,roof:'gable',roofRise:5.9},
 buildings:[],
 objects:[
  {id:'spruce-1',catalogId:'spruce',x:8,y:11,diameter:4.3,height:13,
   spruce:{type:'century',age:120}},
  {id:'spruce-2',catalogId:'spruce',x:12,y:12,diameter:2.2,height:5,
   spruce:{type:'young',age:12}},
  {id:'pine-1',catalogId:'pine',x:22,y:15,diameter:5.5,height:15,
   pine:{pineType:'solitary',age:85}}
 ],
 extra3dObjects:[],
 cameraView:'3d',cameraFovDegrees:50,
 atmosphere:{season:'summer',weather:'overcast',time:'day'}
};
test('perspective render reconstructs natural spruce and pine rather than locking CGI foliage',()=>{
 const p=perspectiveLandscapePrompt(landscape);
 assert.match(p,/Picea abies/);
 assert.match(p,/Pinus sylvestris/);
 assert.match(p,/CENTURY-OLD Norway spruce|TREE TYPE century/);
 assert.match(p,/YOUNG LOW Norway spruce|TREE TYPE young/);
 assert.match(p,/GEOMETRY AND IDENTITY LOCK, NOT POLYGON LOCK/);
 assert.match(p,/PHOTO RECONSTRUCTION PRIORITY/);
 assert.match(p,/procedural branches|3D needle cards|generic triangular silhouette/);
 assert.match(p,/No blank white lower half|no blank white lower half/);
 assert.match(p,/source geometry|measured|crown/i);
 assert.match(p,/240mm visual wall cassette/);
});
test('photographic contract does not invent botanical assets',()=>{
 const p=perspectiveLandscapePrompt({...landscape,objects:[],extra3dObjects:[]});
 assert.match(p,/There are NO landscape objects/);
 assert.match(p,/No invented lawn, vegetation|no extra trees|no invented trees|No extra trees/i);
 assert.match(p,/COMPLETE FRAME \/ NO WHITE STRIP/);
});
function image(dataFn){
 const width=96,height=96,data=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const [r,g,b,a=255]=dataFn(x,y);const i=(y*width+x)*4;
  data[i]=r;data[i+1]=g;data[i+2]=b;data[i+3]=a;
 }
 return {width,height,data};
}
test('white lower band is detected in a normal summer architecture render',()=>{
 const raw=image((x,y)=>y>=70?[255,255,255]:[45+x%35,75+y%30,55]);
 const result=inspectRenderImagePixels(raw,{season:'summer'});
 assert.equal(result.ok,false);
 assert.ok(result.whiteFraction>.9);
 assert.match(result.reason,/белая/);
});
test('natural photo data is accepted and intentional winter snow is not rejected',()=>{
 const natural=image((x,y)=>[65+x%17,89+y%23,57+x%37]);
 assert.equal(inspectRenderImagePixels(natural,{season:'summer'}).ok,true);
 const snow=image((x,y)=>y>=70?[255,255,255]:[65,89,57]);
 assert.equal(inspectRenderImagePixels(snow,{season:'winter'}).ok,true);
});
test('partially missing transparent WebGL buffer is rejected before paid request',()=>{
 const raw=image((x,y)=>y>=70?[0,0,0,0]:[65,89,57]);
 const result=inspectRenderImagePixels(raw,{season:'summer'});
 assert.equal(result.ok,false);
 assert.ok(result.transparentFraction>.6);
});

test('full lighting passport preserves author-set sun and all chosen atmospherics',()=>{
 const lightingRig={
  time:'morning',season:'autumn',weather:'overcast',
  sun:{azimuthDeg:282,elevationDeg:20,strength:1.1,softness:3.2,
   intensity:.81,color:'#ffe1be',position:{x:-60,y:29,z:13},
   shadowEnabled:true,shadowRadius:3.2,shadowMapWidth:2048,shadowMapHeight:2048},
  sky:{visible:true,turbidity:9.2,rayleigh:.75,mieCoefficient:.005,mieDirectionalG:.82},
  clouds:{visible:true,coverage:.44,opacity:.6},
  atmosphere:{clouds:55,haze:37,globalFill:112,nightGlow:75,ripples:30},
  fill:{hemisphereIntensity:1.75,hemisphereColor:'#e6eef6',groundColor:'#5b6954',
   bounceIntensity:.43,bounceColor:'#c6d8e3'},
  fog:{color:'#bcc9c7',near:120,far:250},
  renderer:{exposure:1.05,toneMapping:'ACESFilmic',
   background:'#b8c7c4',environmentIntensity:.72}
 };
 const full=photoLightingContract({...landscape,lightingRig});
 for(const token of [
  'AZIMUTH 282.0°','ELEVATION 20.0°',
  'shadow softness 3.20','RELATIVE INTENSITY','2048px × 2048px',
  'sky turbidity 9.20','Rayleigh coefficient 0.75',
  'Mie coefficient 0.0050','cloud setting 55%',
  'author haze 37%','global fill 112%',
  'Hemisphere skylight colour #E6EEF6','bounced directional fill colour #C6D8E3',
  'exposure 1.050','fog near 120.00m','fog far 250.00m',
  'RGB #FFE1BE','author-selected shadow'
 ])assert.ok(full.includes(token),'Missing selected lighting attribute: '+token);
 assert.match(full,/numeric solar control wins/);
 assert.match(full,/NOT geographic true solar time/);
 assert.ok(!full.includes('actual astronomical sunrise'));
 const p=perspectiveLandscapePrompt({...landscape,lightingRig});
 assert.ok(p.includes('AZIMUTH 282.0°'));
 assert.ok(p.includes('sky turbidity 9.20'));
 assert.ok(p.includes('weather overcast sky'));
});
test('night controls prohibit daylight and unknown lighting values are not invented',()=>{
 const night=photoLightingContract({lightingRig:{time:'night',weather:'fog',season:'winter'}});
 assert.match(night,/NIGHT selected: no visible daylight sunlight/);
 assert.match(night,/Solar angles not provided/);
 assert.match(night,/not supplied/);
 const absent=photoLightingContract({...landscape});
 assert.match(absent,/No full live lighting rig was sent/);
 assert.match(absent,/do not invent sun angle/);
});
