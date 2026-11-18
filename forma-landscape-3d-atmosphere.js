/* FORMA / Lightweight perceptual atmosphere. Retains measured terrain,
 * house and water geometry. This is realtime sky-fill, not path-traced GI. */
const clamp=(v,min,max,fallback)=>{const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback};
export const ATMOSPHERE_DEFAULTS=Object.freeze({globalFill:110,clouds:35,haze:30,nightGlow:75,ripples:30});
export function normalizeSceneAtmosphere(v={}){
 const raw=v&&typeof v==='object'?v:{};
 return {
  globalFill:clamp(raw.globalFill,30,180,ATMOSPHERE_DEFAULTS.globalFill),
  clouds:clamp(raw.clouds,0,100,ATMOSPHERE_DEFAULTS.clouds),
  haze:clamp(raw.haze,0,100,ATMOSPHERE_DEFAULTS.haze),
  nightGlow:clamp(raw.nightGlow,0,100,ATMOSPHERE_DEFAULTS.nightGlow),
  ripples:clamp(raw.ripples,0,100,ATMOSPHERE_DEFAULTS.ripples)
 };
}
/** Physically modest upper hemisphere and indirect bounce approximation.
 * At night the sky stays visible and gently illuminates exterior materials. */
export function atmosphereLighting({time='day',weather='sunny',siteSize=40,settings={}}={}){
 const v=normalizeSceneAtmosphere(settings),night=time==='night',evening=time==='evening',morning=time==='morning';
 const cloudWeather=['overcast','rain','snow','fog'].includes(weather);
 const cloudCover=Math.min(1,(v.clouds/100)*(cloudWeather?1.0:.78)+(cloudWeather?.17:0));
 const fill=v.globalFill/100;
 const nightAmount=night?.55+v.nightGlow*.006:1;
 const base=night?.54:evening?1.20:morning?1.45:weather==='overcast'?1.72:1.88;
 const extent=Math.max(10,Number(siteSize)||40),haze=v.haze/100;
 const weatherFog=weather==='fog',wetFog=['rain','snow'].includes(weather);
 const fogFactor=1-haze*.38;
 const fogNear=(weatherFog?Math.max(22,extent*.70):wetFog?Math.max(65,extent*1.5):Math.max(120,extent*2.2))*fogFactor;
 const fogFar=(weatherFog?Math.max(110,extent*3):wetFog?Math.max(145,extent*3.7):Math.max(230,extent*5))*(1-haze*.23);
 return {
  skyFillIntensity:base*fill*nightAmount,
  bouncedFillIntensity:(night?.25:evening?.32:.40)*fill*(night?.35+v.nightGlow*.008:1),
  clouds:cloudCover,
  haze,fogNear,fogFar:Math.max(fogNear+30,fogFar),
  background:night?'#344657':evening?'#a4a597':'#b8c7c4',
  fogColor:night?'#405466':evening?'#aeaea3':'#bcc9c7',
  exposure:night?1.20:evening?1.03:morning?1.05:1.13,
  nightClouds:night
 };
}
/** Cloud coverage is an optional transparent skydome. All GPU effects are
 * intentionally inexpensive and depend on time, not the camera or survey. */
export function makeCloudLayer(T){
 const uniforms={
  coverage:{value:.35},time:{value:0},opacity:{value:.6},
  cloudColor:{value:new T.Color('#fffdf5')}
 };
 const m=new T.ShaderMaterial({
  uniforms,transparent:true,depthWrite:false,depthTest:true,side:T.BackSide,
  vertexShader:`varying vec3 vDirection;
   void main(){vDirection=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform float coverage;uniform float time;uniform float opacity;uniform vec3 cloudColor;
   varying vec3 vDirection;
   float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),
      mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
   float fbm(vec2 p){float n=0.,a=.55;
    for(int i=0;i<4;i++){n+=a*noise(p);p*=2.05;a*=.48;}return n;}
   void main(){
    vec3 dir=normalize(vDirection);
    float sky=smoothstep(.065,.28,dir.y);
    vec2 uv=vec2(atan(dir.z,dir.x)*1.59155,dir.y*1.8);
    float n=fbm(uv*3.4+vec2(time*.007,time*.003));
    float mask=smoothstep(.55-coverage*.25,.66-coverage*.23,n);
    float alpha=mask*sky*opacity*coverage;
    if(alpha<.008)discard;
    gl_FragColor=vec4(cloudColor,alpha);
   }`
 });
 const cloud=new T.Mesh(new T.SphereGeometry(420,48,24),m);
 cloud.name='forma-atmosphere-clouds';cloud.renderOrder=-5;cloud.frustumCulled=false;
 return cloud;
}
/** The water stays an exactly level polygon. Ripples modulate its normals only,
 * so surveyed shorelines, level and editing hit-tests never move. */
export function makeWaterRippleTexture(T,domDocument){
 const canvas=domDocument.createElement('canvas');canvas.width=canvas.height=256;
 const c=canvas.getContext('2d');
 c.fillStyle='#858585';c.fillRect(0,0,256,256);
 for(let k=0;k<22;k++){
  const x=(k*87+23)%256,y=(k*53+91)%256,r=7+(k*17)%47;
  for(let band=0;band<3;band++){
   c.beginPath();c.ellipse(x,y,r+band*5,(r+band*5)*.62,k*.31,0,Math.PI*2);
   c.strokeStyle=band===0?'rgba(225,225,225,.20)':band===1?'rgba(24,24,24,.18)':'rgba(230,230,230,.13)';
   c.lineWidth=1.6;c.stroke();
  }
 }
 const tex=new T.CanvasTexture(canvas);
 tex.wrapS=tex.wrapT=T.RepeatWrapping;
 tex.repeat.set(3.5,3.5);tex.anisotropy=4;
 return tex;
}
export function animateWaterRipple(texture,now,amount=30){
 if(!texture||amount<=0)return false;
 const t=Math.max(0,Number(now)||0)*.00001;
 texture.offset.set((t*.26)%1,(t*.18)%1);
 return true;
}
