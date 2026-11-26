/* R69: unified outdoor lighting calibration. All values are scene-linear
 * approximations, not photometric lux or path-traced global illumination. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function outdoorLightProfile({time='day',weather='sunny',elevation=39,clouds=.3,fill=110,photo=false}={}){
 const daylight=['day','morning','evening'].includes(time);
 const cover=clamp(Number(clouds)||0,0,1),cloudy=['overcast','rain','snow','fog'].includes(weather);
 const e=clamp(Number(elevation)||39,2,85),f=clamp(Number(fill)||110,30,180)/110;
 if(!daylight)return {sunScale:1,skyScale:1,bounceScale:1,environmentScale:1,exposureScale:1,shadowRadiusScale:1,sunColor:null,skyColor:null,groundColor:null};
 // Retain sun controls and weather; redistribute energy instead of globally boosting it.
 const low=1-clamp((e-8)/55,0,1);
 return {
  sunScale:cloudy?(.73-.12*cover):(1.16-.24*cover),
  skyScale:(cloudy?.83:.61+.14*cover)*f,
  bounceScale:cloudy?.90:.72,
  environmentScale:(photo?.90:1.02)*(cloudy?1.07:.91+.10*cover),
  exposureScale:cloudy?1.06:1.025,
  shadowRadiusScale:cloudy?1.3:1+.25*cover,
  sunColor:time==='evening'?'#ffcea3':time==='morning'?'#ffe4c8':low>.5?'#fff0dc':'#fff5e7',
  skyColor:cloudy?'#e0e7ec':time==='evening'?'#c9d8eb':'#d5e5f5',
  groundColor:cloudy?'#64645b':'#777865'
 };
}
export function applyPhysicalLight(T,{scene,renderer,sun,sky,bounce,atmosphere,settings,solarSettings,time,weather,modelling=false,enabled=true}){
 if(!enabled||modelling)return;
 const p=outdoorLightProfile({time,weather,elevation:solarSettings.elevation,clouds:atmosphere.clouds,fill:settings.globalFill,photo:scene.userData.formaPhotographicHDRR67});
 if(!p.sunColor)return;
 sun.intensity*=p.sunScale;sun.color.set(p.sunColor);
 sun.shadow.radius*=p.shadowRadiusScale;
 if(sky){sky.intensity*=p.skyScale;sky.color.set(p.skyColor);sky.groundColor.set(p.groundColor);}
 if(bounce){bounce.intensity*=p.bounceScale;bounce.color.set('#d7d5c5');
  // Place the broad approximate ground bounce below the crown. No extra
  // unshadowed key light from an arbitrary opposite direction.
  const d=sun.position.clone().normalize();bounce.position.set(-d.x*20,5,-d.z*20);}
 scene.environmentIntensity*=p.environmentScale;
 renderer.toneMappingExposure*=p.exposureScale;
 scene.userData.formaLightProfileR69=p;
}
/* Crown-scale shading for the native oak only: instanced vertex colors are
 * multiplied by a mild spatial attenuation, not a replacement texture.
 * Retains the exact instance transforms, count and existing leaf palette. */
export function applyCanopyDepth(T,group){
 if(!group?.userData?.nativeOakR68)return;
 const h=group.userData.physicalHeight||17;
 group.traverse(mesh=>{
  if(!mesh.isInstancedMesh||!mesh.instanceColor||!/leaf/i.test(mesh.name)||mesh.userData.formaCanopyR69)return;
  const matrix=new T.Matrix4(),p=new T.Vector3(),c=new T.Color();
  let maxR=0;
  for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);p.setFromMatrixPosition(matrix);maxR=Math.max(maxR,Math.hypot(p.x,p.z));}
  maxR=Math.max(maxR,1);
  for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);p.setFromMatrixPosition(matrix);mesh.getColorAt(i,c);
   const radial=clamp(Math.hypot(p.x,p.z)/maxR,0,1),height=clamp(p.y/h,0,1);
   const interior=1-Math.pow(radial,.70),overhead=1-height;
   const shade=clamp(1-.15*interior-.065*overhead,.78,1);
   c.multiplyScalar(shade);mesh.setColorAt(i,c);
  }
  mesh.instanceColor.needsUpdate=true;mesh.userData.formaCanopyR69=true;
 });
}
