/* FORMA / physically positioned architectural garden lights.
 * Exact catalog IDs define housing, optics and emission. Distances are metres.
 * Existing lamp placements and rotations are never altered by this module.
 */
export const gardenLightingSpec=Object.freeze({
 bollard:{height:.83,mountHeight:.715,color:0xffd8b0,intensity:23,range:6,kind:'radial',beam:0},
 ground:{height:.12,mountHeight:.085,color:0xffdfb7,intensity:8,range:4.6,kind:'uplight',beam:.64},
 spot:{height:1.11,mountHeight:.91,color:0xffd4ac,intensity:35,range:7.5,kind:'downlight',beam:.41},
 'low-post':{height:1.20,mountHeight:1.04,color:0xffd8a9,intensity:22,range:6.8,kind:'radial',beam:0},
 'deck-light':{height:.10,mountHeight:.013,color:0xffe0b8,intensity:6,range:3.3,kind:'uplight',beam:.58},
 linear:{height:.08,mountHeight:.013,color:0xffdfb3,intensity:11,range:3.8,kind:'uplight',beam:.72},
 mushroom:{height:.38,mountHeight:.308,color:0xffd9b3,intensity:33,range:6.8,kind:'downlight',beam:1.16},
 'square-bollard':{height:.82,mountHeight:.71,color:0xffdbb5,intensity:19,range:5.5,kind:'radial',beam:0},
 'garden-lantern':{height:1.03,mountHeight:.74,color:0xffd4a3,intensity:44,range:9,kind:'radial',beam:0},
 'spike-spot':{height:.39,mountHeight:.22,color:0xffd4ab,intensity:65,range:12,kind:'uplight',beam:.34},
 globe:{height:.40,mountHeight:.20,color:0xffe6c6,intensity:14,range:4.5,kind:'radial',beam:0}
});
const adjustable=new Set(['bollard','low-post','mushroom','square-bollard','garden-lantern','globe']);
export const gardenLightTemperatures=Object.freeze({
 2200:0xffbd84,2700:0xffd8b0,3000:0xffe3c5,4000:0xfff2e6
});
export function gardenLightingState(id,{time='day',weather='sunny',height=null,brightness=1,kelvin=2700}={}){
 const source=gardenLightingSpec[id];if(!source)return null;
 const factor=time==='night'?1:time==='evening'?.43:time==='morning'?.05:0;
 const power=factor*(weather==='fog'?.82:weather==='rain'?.90:1);
 const actual=Number(height);
 // Old projects wrote 1.2 metres for every light. Preserve original scale.
 const historicDefaults={bollard:[.85],'square-bollard':[.50],'garden-lantern':[.995,2.35],globe:[.38,.68]};
 const historic=(historicDefaults[id]||[]).some(v=>Math.abs(v-actual)<.012);
 const legacy=actual===1.2&&id!=='low-post';
 const custom=adjustable.has(id)&&Number.isFinite(actual)&&actual>.14&&actual<4&&!legacy&&!historic;
 const scale=custom?actual/source.height:1;
 const validTemperature=Object.hasOwn(gardenLightTemperatures,Number(kelvin))?Number(kelvin):2700;
 const n=Number(brightness),dimmer=Number.isFinite(n)?Math.max(0,Math.min(2,n)):1;
 return {...source,color:gardenLightTemperatures[validTemperature],
  kelvin:validTemperature,brightness:dimmer,height:source.height*scale,
  mountHeight:source.mountHeight*scale,visible:power*dimmer>0,
  actualIntensity:source.intensity*power*dimmer};
}
export function addRealGardenEmission(T,g,instance,{time='day',weather='sunny',shadow=false}={}){
 const state=gardenLightingState(instance.catalogId,{time,weather,height:instance.height,
  brightness:instance.brightness,kelvin:instance.kelvin});
 if(!state||!state.visible||!g)return null;
 let lamp;
 if(state.kind==='uplight'||state.kind==='downlight'||state.kind==='forward'){
  // In-ground optics point straight up. Articulated spot heads are tilted
  // -0.64 radians about X, so their lens faces UP AND toward -Z.
  // The light beam must point the same way as the visible model.
  lamp=new T.SpotLight(state.color,state.actualIntensity,state.range,state.beam,.72,2);
  lamp.position.set(0,state.mountHeight,0);
  const target=new T.Object3D();
  if(instance.catalogId==='spot'){
   // Uploaded photo 5: side-mounted head is OFF-AXIS and points at the ground.
   lamp.position.set(.118,state.mountHeight,.012);
   target.position.set(.24,0,.11); // shallow angle follows the actual head tilt (-Y with a small +X/+Z component)
  }else if(state.kind==='downlight')target.position.set(0,0,0);
  else if(state.kind==='forward')target.position.set(0,0,Math.min(state.range*.65,4));
  else if(['ground','deck-light','linear'].includes(instance.catalogId))target.position.set(0,Math.min(state.range*.8,6),0);
  else if(instance.catalogId==='spike-spot'){
   // Uploaded photo 1: lens looks to +Z, unlike the former head aimed -Z.
   lamp.position.set(0,state.mountHeight,.080);
   target.position.set(0,state.mountHeight+Math.min(state.range*.31,3),Math.min(state.range*.7,6));
  }else target.position.set(0,state.mountHeight+Math.min(state.range*.75,9),-Math.min(state.range*.55,6.5));
  g.add(target);lamp.target=target;
 }else{
  if(instance.catalogId==='globe'){
   // Flux scales with the area of the opal sphere: equal perceived surface
   // brightness for the 25/40/60/80 cm choices.
   const realDiameter=Math.max(.20,Math.min(.80,Number(g.userData?.sphereDiameter)||state.height));
   const ratio=realDiameter/.40;
   lamp=new T.PointLight(state.color,state.actualIntensity*ratio*ratio,
    state.range*Math.sqrt(ratio),2);
   lamp.position.set(0,realDiameter*.495,0);
   lamp.userData.softOpalAreaSource=true;
  }else{
   lamp=new T.PointLight(state.color,state.actualIntensity,state.range,2);
   lamp.position.set(0,state.mountHeight,0);
  }
 }
 lamp.name='forma-garden-emitter';
 lamp.userData.fixtureId=instance.catalogId;
 lamp.userData.kelvin=state.kelvin;
 lamp.castShadow=Boolean(shadow)&&instance.catalogId!=='globe'; // opal diffuser must never shadow its own interior emitter
 if(lamp.castShadow){
  lamp.shadow.mapSize.set(256,256);
  lamp.shadow.bias=-.00025;
  lamp.shadow.normalBias=.02;
 }
 g.add(lamp);
 // A linear ground luminaire carries several independently located LEDs.
 // Split its flux between cells instead of a fake single radial light point.
 if(instance.catalogId==='linear'){
  lamp.intensity/=5;
  for(const z of [-.215,0,.215,.43]){
   const clone=lamp.clone();
   clone.position.z=z;
   clone.castShadow=false;
   const target=new T.Object3D();target.position.set(0,state.mountHeight+Math.min(state.range*.8,6),z);
   g.add(target);clone.target=target;g.add(clone);
  }
  lamp.position.z=-.43;
 }
 // The three separate lit acrylic belts radiate from different heights.
 // Avoid a single implausibly hot dot from the middle of the post.
 if(instance.catalogId==='square-bollard'){
  const ys=[.63,.69,.745];
  lamp.intensity/=ys.length;
  lamp.position.y=ys[0];
  for(const y of ys.slice(1)){
   const belt=lamp.clone();belt.position.y=y;belt.castShadow=false;
   g.add(belt);
  }
 }
 // Four open vertical glowing tubes: ambient light should read along the
 // height of the cage, not as one harsh unphysical upper point.
 if(instance.catalogId==='garden-lantern'){
  lamp.intensity*=.72;
  const bottom=lamp.clone();
  bottom.intensity=state.actualIntensity*.28;
  bottom.position.y=.49;
  bottom.castShadow=false;
  g.add(bottom);
 }
 return lamp;
}
