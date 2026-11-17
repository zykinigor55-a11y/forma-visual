/* FORMA / Landscape 3D lighting contract.
 * Physical source is an explicitly placed catalogue luminaire.
 * No lights are generated for absent objects or daylight without lighting need.
 */
export const gardenLightingSpec=Object.freeze({
 bollard:{height:.85,color:0xffd5a2,intensity:20,range:6,kind:'radial',beam:.0},
 ground:{height:.13,color:0xffdbac,intensity:9,range:4.2,kind:'radial',beam:.0},
 spot:{height:.14,color:0xffd0a0,intensity:75,range:14,kind:'uplight',beam:.43},
 'low-post':{height:1.25,color:0xffd5a0,intensity:24,range:7,kind:'radial',beam:.0},
 'deck-light':{height:.12,color:0xffd5a6,intensity:7,range:3.5,kind:'radial',beam:.0},
 linear:{height:.10,color:0xffd6ac,intensity:11,range:3.8,kind:'radial',beam:.0}
});
export function gardenLightingState(id,{time='day',weather='sunny',height=null}={}){
 const source=gardenLightingSpec[id];
 if(!source)return null;
 const factor=time==='night'?1:time==='evening'?.43:time==='morning'?.05:0;
 const power=factor*(weather==='fog'?.82:weather==='rain'?.90:1);
 const h=Number(height),mount=(Number.isFinite(h)&&h>.05&&h<4&&['bollard','low-post'].includes(id))?h:source.height;
 return {...source,visible:power>0,actualIntensity:source.intensity*power,mountHeight:mount};
}
export function addRealGardenEmission(T,g,instance,{time='day',weather='sunny',shadow=false}={}){
 const state=gardenLightingState(instance.catalogId,{time,weather,height:instance.height});
 if(!state||!state.visible)return null;
 let lamp;
 if(state.kind==='uplight'){
  // Tree accent uplight: real ground-mounted spotlight aimed up into existing canopy.
  lamp=new T.SpotLight(state.color,state.actualIntensity,state.range,state.beam,.75,2);
  lamp.position.set(0,state.mountHeight+.06,0);
  const target=new T.Object3D();target.position.set(0,Math.min(state.range*.78,8),0);
  g.add(target);lamp.target=target;
 }else{
  // Inverse-square falloff with a bounded range. Downlight glows around paths.
  lamp=new T.PointLight(state.color,state.actualIntensity,state.range,2);
  lamp.position.set(0,state.mountHeight,0);
 }
 lamp.name='forma-garden-emitter';
 lamp.castShadow=Boolean(shadow);
 if(lamp.castShadow){
  lamp.shadow.mapSize.set(256,256);
  lamp.shadow.bias=-.00025;
  lamp.shadow.normalBias=.02;
 }
 g.add(lamp);
 return lamp;
}
