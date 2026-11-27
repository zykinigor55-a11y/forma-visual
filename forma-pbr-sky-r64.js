import {continuousSkyPalette,solarAppearance} from './forma-photographic-environment-r71.js?v=R215';
/* R64 procedural HDR sky for environment-based lighting. Linear radiance,
 * PMREM filtering, no sharp sun disk (the shadowed directional sun owns it).
 * Not a measured HDRI and not a path-traced bounce solution.
 */
const probes=new WeakMap(),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function updateHDRSky(T,renderer,{time='day',weather='sunny',azimuth=311,elevation=45,clouds=35}={}){
 if(!renderer?.capabilities?.isWebGL2||!renderer.extensions.has('EXT_color_buffer_float'))return null;
 const signature=[time,weather,Math.round(azimuth/5),Math.round(elevation/3),Math.round(clouds/5)].join('|');
 let state=probes.get(renderer);
 if(state?.signature===signature)return state.target?.texture||null;
 const mobile=typeof window!=='undefined'&&window.innerWidth<=850,w=mobile?256:512,h=w/2,values=new Uint16Array(w*h*4);
 const overcast=['overcast','rain','fog','snow'].includes(weather),day=['day','morning','evening'].includes(time);
 const colors=continuousSkyPalette(T.Color,elevation,weather);const palette=[colors[0].toArray(),colors[1].toArray(),colors[2].toArray()];const appearance=solarAppearance(elevation);
 const az=Number(azimuth)*Math.PI/180,el=Number(elevation)*Math.PI/180,sx=Math.sin(az)*Math.cos(el),sy=Math.sin(el),sz=Math.cos(az)*Math.cos(el);
 const cover=clamp(Number(clouds)/100,0,1);
 for(let y=0;y<h;y++){
  const lat=((y+.5)/h-.5)*Math.PI,dy=Math.sin(lat),horizontal=Math.cos(lat);
  for(let x=0;x<w;x++){
   const lon=((x+.5)/w-.5)*Math.PI*2,dx=Math.cos(lon)*horizontal,dz=Math.sin(lon)*horizontal;
   const zen=Math.pow(Math.max(0,dy),.55),ground=Math.pow(Math.max(0,-dy),.55),v=dy>=0?zen:ground;
   const base=dy>=0?palette[0]:palette[2],horizon=palette[1],dot=clamp(dx*sx+dy*sy+dz*sz,0,1);
   const glow=dy>0?appearance.direct*Math.pow(dot,18)*(overcast?.09:.40)*(1-cover*.60):0;
   const cloud=dy>0?appearance.day*Math.max(0,Math.sin(dx*9+dz*3+Math.sin(dy*12))*.5+Math.sin(dz*15+dy*6)*.28+Math.sin(dx*21-dz*19)*.12-.52+cover*.42)*.20:0;
   const k=(y*w+x)*4;
   for(let i=0;i<3;i++){const warmth=i===0?1:i===1?.88:.69;values[k+i]=T.DataUtils.toHalfFloat(clamp(horizon[i]*(1-v)+base[i]*v+glow*warmth+cloud,0,4));}
   values[k+3]=T.DataUtils.toHalfFloat(1);
  }
 }
 let source,target;
 try{
  source=new T.DataTexture(values,w,h,T.RGBAFormat,T.HalfFloatType);
  source.mapping=T.EquirectangularReflectionMapping;source.colorSpace=T.LinearSRGBColorSpace;
  source.minFilter=source.magFilter=T.LinearFilter;source.needsUpdate=true;
  if(!state)state={generator:new T.PMREMGenerator(renderer),target:null,signature:''};
  target=state.generator.fromEquirectangular(source);
  state.target?.dispose();state.target=target;state.signature=signature;probes.set(renderer,state);
  return target.texture;
 }catch(e){console.warn('FORMA HDR sky fallback',e);target?.dispose();return null;}
 finally{source?.dispose();}
}
