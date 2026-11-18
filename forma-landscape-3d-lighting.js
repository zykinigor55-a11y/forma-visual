/* FORMA / physically positioned architectural landscape luminaires.
 * The exact catalog ID defines both the 3D housing and its real light source.
 * A luminaire never emits extra photons when it is absent or in daylight.
 */
export const gardenLightingSpec=Object.freeze({
 bollard:{height:.85,mountHeight:.75,color:0xffd8b0,intensity:23,range:6,kind:'radial',beam:0},
 ground:{height:.12,mountHeight:.12,color:0xffdfb7,intensity:8,range:3.8,kind:'radial',beam:0},
 spot:{height:.24,mountHeight:.30,color:0xffd4ac,intensity:86,range:14,kind:'uplight',beam:.38},
 'low-post':{height:1.20,mountHeight:1.04,color:0xffd8a9,intensity:22,range:6.8,kind:'radial',beam:0},
 'deck-light':{height:.10,mountHeight:.115,color:0xffe0b8,intensity:6,range:3.3,kind:'radial',beam:0},
 linear:{height:.08,mountHeight:.10,color:0xffdfb3,intensity:11,range:3.8,kind:'radial',beam:0},
 mushroom:{height:.68,mountHeight:.53,color:0xffd9b3,intensity:33,range:6.8,kind:'downlight',beam:1.16},
 'square-bollard':{height:.82,mountHeight:.70,color:0xffdbb5,intensity:27,range:6.6,kind:'radial',beam:0},
 'garden-lantern':{height:2.35,mountHeight:2.07,color:0xffd4a3,intensity:44,range:9,kind:'radial',beam:0},
 'spike-spot':{height:.36,mountHeight:.34,color:0xffd4ab,intensity:65,range:12,kind:'uplight',beam:.30},
 globe:{height:.68,mountHeight:.50,color:0xffe6c6,intensity:27,range:6.6,kind:'radial',beam:0}
});
const adjustable=new Set(['bollard','low-post','mushroom','square-bollard','garden-lantern','globe']);
export function gardenLightingState(id,{time='day',weather='sunny',height=null}={}){
 const source=gardenLightingSpec[id];
 if(!source)return null;
 const factor=time==='night'?1:time==='evening'?.43:time==='morning'?.05:0;
 const power=factor*(weather==='fog'?.82:weather==='rain'?.90:1);
 const actual=Number(height);
 // Old saved editors accidentally wrote 1.2 m for every fixture. Treat
 // that historical value as a default except for the original low-post.
 const legacy=actual===1.2&&id!=='low-post';
 const custom=adjustable.has(id)&&Number.isFinite(actual)&&actual>.14&&actual<4&&!legacy;
 const scale=custom?actual/source.height:1;
 return {...source,height:source.height*scale,mountHeight:source.mountHeight*scale,
  visible:power>0,actualIntensity:source.intensity*power};
}
export function addRealGardenEmission(T,g,instance,{time='day',weather='sunny',shadow=false}={}){
 const state=gardenLightingState(instance.catalogId,{time,weather,height:instance.height});
 if(!state||!state.visible)return null;
 let lamp;
 if(state.kind==='uplight'||state.kind==='downlight'){
  // Accent spots point into the existing canopy; mushroom light is shielded
  // by the cap and is projected downward to the ground, not into the sky.
  lamp=new T.SpotLight(state.color,state.actualIntensity,state.range,state.beam,.72,2);
  lamp.position.set(0,state.mountHeight,0);
  const target=new T.Object3D();
  if(state.kind==='uplight')target.position.set(0,Math.min(state.range*.7,8),Math.min(state.range*.25,3.5));
  else target.position.set(0,0,0);
  g.add(target);lamp.target=target;
 }else{
  lamp=new T.PointLight(state.color,state.actualIntensity,state.range,2);
  lamp.position.set(0,state.mountHeight,0);
 }
 lamp.name='forma-garden-emitter';
 lamp.userData.fixtureId=instance.catalogId;
 lamp.castShadow=Boolean(shadow);
 if(lamp.castShadow){
  lamp.shadow.mapSize.set(256,256);
  lamp.shadow.bias=-.00025;
  lamp.shadow.normalBias=.02;
 }
 g.add(lamp);
 return lamp;
}
