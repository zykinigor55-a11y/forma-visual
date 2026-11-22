/* FORMA VISUAL: outdoor equirectangular reflection probe.
 * This is a lightweight approximation of environment-based PBR response
 * on glass, lacquered metal and water, not path-traced global illumination.
 * No new scene objects or alterations to measured architecture/landscape. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function outdoorReflectionPalette(time='day',weather='sunny'){
 const wet=['rain','fog','snow','overcast'].includes(weather);
 if(time==='night')return {zenith:'#10233b',horizon:'#405c77',ground:'#1f2f35',disk:'#abbccf',diskAlpha:.23};
 if(time==='blue-hour')return {zenith:'#293e69',horizon:'#7c91b8',ground:'#394759',disk:'#fff',diskAlpha:0};
 if(time==='evening')return {zenith:'#405980',horizon:'#d6ad90',ground:'#60655a',disk:'#ffe1b2',diskAlpha:wet?.22:.60};
 if(time==='morning')return {zenith:'#759cb5',horizon:'#e8c7a2',ground:'#656954',disk:'#ffecce',diskAlpha:wet?.18:.65};
 return {zenith:wet?'#91a8b6':'#7399ae',horizon:wet?'#cbd7d9':'#c9e1ed',
  ground:'#546154',disk:'#fff4d5',diskAlpha:wet?.09:.65};
}
export function createOutdoorReflectionMap(T,domDocument){
 const canvas=domDocument.createElement('canvas');
 canvas.width=512;canvas.height=256;
 const texture=new T.CanvasTexture(canvas);
 texture.colorSpace=T.SRGBColorSpace;
 texture.mapping=T.EquirectangularReflectionMapping;
 texture.wrapS=T.RepeatWrapping;
 texture.wrapT=T.ClampToEdgeWrapping;
 updateOutdoorReflectionMap(texture,{});
 return texture;
}
export function updateOutdoorReflectionMap(texture,{time='day',weather='sunny',azimuth=311,elevation=45,clouds=35}={}){
 const canvas=texture?.image;
 const ctx=canvas?.getContext?.('2d');
 if(!ctx)return false;
 const {width:w,height:h}=canvas,p=outdoorReflectionPalette(time,weather);
 const sky=ctx.createLinearGradient(0,0,0,h);
 sky.addColorStop(0,p.zenith);
 sky.addColorStop(.45,p.horizon);
 sky.addColorStop(.53,p.horizon);
 sky.addColorStop(1,p.ground);
 ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
 // A broad sky highlight, not a fake illuminated sprite pasted onto glazing.
 const angle=clamp(Number(azimuth)||0,0,360);
 const alt=clamp(Number(elevation)||45,0,90);
 const cx=w*(angle/360),cy=h*(.49-alt/180),radius=time==='night'?32:36;
 const attenuation=(1-clamp(Number(clouds)||0,0,100)/100*.55);
 for(const offset of [-w,0,w]){
  const radial=ctx.createRadialGradient(cx+offset,cy,0,cx+offset,cy,radius*3);
  radial.addColorStop(0,p.disk);
  radial.addColorStop(.24,p.disk);
  radial.addColorStop(1,p.horizon);
  ctx.globalAlpha=p.diskAlpha*attenuation*.25;
  ctx.fillStyle=radial;ctx.beginPath();
  ctx.arc(cx+offset,cy,radius*3,0,Math.PI*2);ctx.fill();
 }
 ctx.globalAlpha=1;
 texture.needsUpdate=true;
 return true;
}
