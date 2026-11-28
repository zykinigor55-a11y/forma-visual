/* R215: continuous altitude-dependent sky and one coherent projected cloud field.
 * Scene-linear approximation; not a calibrated spectral atmosphere. */ 
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
export function solarAppearance(elevation){
 const e=clamp(Number.isFinite(Number(elevation))?Number(elevation):45,-18,85);
 const air=1/Math.max(.045,Math.sin(Math.max(0,e)*Math.PI/180)+.045);
 return {elevation:e,direct:smooth(-.83,2,e)*Math.exp(-.15*(air-1)),day:smooth(-9,18,e),twilight:smooth(-18,-5,e)*(1-smooth(0,18,e)),air};
}
const skyKnots=[
 [-18,'#07101e','#162436','#17202c','#526079','#252f44'],
 [-12,'#10233d','#3b5276','#29394c','#788aaa','#3d4d6b'],
 [-6,'#304f87','#a0a8c8','#626b83','#c1a7ab','#687a9c'],
 [0,'#627fae','#e4ab88','#948e89','#f6c6a5','#8b8a9e'],
 [8,'#709bc2','#e3c5ae','#a4adae','#f9e4cb','#a1aab8'],
 [22,'#6998c0','#c9dbe6','#a7b9bd','#fff9ee','#9aaabd'],
 [85,'#5e8db6','#c9dbe6','#aabbbd','#fffdf7','#97a8ba']
];
export function continuousSkyPalette(Color,elevation,weather='sunny'){
 const e=solarAppearance(elevation).elevation;let i=1;while(i<skyKnots.length-1&&e>skyKnots[i][0])i++;
 const a=skyKnots[i-1],b=skyKnots[i],t=smooth(a[0],b[0],e);
 const wet=['overcast','rain','fog','snow'].includes(weather),gray=['#a4b3bf','#d3dbdf','#b0b8b9','#e4e9ec','#acb6c0'];
 const day=smooth(-12,12,e);
 return a.slice(1).map((v,j)=>{const c=new Color(v).lerp(new Color(b[j+1]),t);if(wet)c.lerp(new Color(gray[j]).multiplyScalar(.10+.90*day),.64);return c});
}

export function makePhotographicSky(T){
 const uniforms={coverage:{value:.35},time:{value:0},opacity:{value:1},cloudColor:{value:new T.Color('#f5f6f1')},sunDirection:{value:new T.Vector3(.5,.7,.5)},zenith:{value:new T.Color('#759abb')},horizon:{value:new T.Color('#d9e1e5')},ground:{value:new T.Color('#9eaeb0')},cloudShade:{value:new T.Color('#a7b5c3')},haze:{value:.30},sunGlow:{value:.15},overcast:{value:0},cloudDensity:{value:.65},cloudScale:{value:1},cloudHeight:{value:1},cloudThickness:{value:1},cloudTransmission:{value:.65},cloudDetail:{value:.75}};
 const material=new T.ShaderMaterial({uniforms,defines:{CLOUD_STEPS:typeof window!=='undefined'&&window.innerWidth<=850?5:8},side:T.BackSide,depthWrite:false,depthTest:true,toneMapped:true,fog:false,
 vertexShader:`varying vec3 vSky;
 void main(){vSky=position;vec4 p=projectionMatrix*vec4(mat3(viewMatrix)*position,1.0);gl_Position=p.xyww;}`,
 fragmentShader:`varying vec3 vSky;
 uniform vec3 zenith,horizon,ground,cloudColor,cloudShade,sunDirection;
 uniform float coverage,time,opacity,haze,sunGlow,overcast,cloudDensity,cloudScale,cloudHeight,cloudThickness,cloudTransmission,cloudDetail;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 float fbm(vec2 p){float s=0.,a=.52;mat2 r=mat2(.8,-.6,.6,.8);for(int i=0;i<5;i++){s+=noise(p)*a;p=r*p*2.06+vec2(3.1,7.7);a*=.49;}return s;}
 float density(vec2 p){float broad=fbm(p*.55);float n=fbm(p+vec2(broad*.95,broad*.38));return smoothstep(.64-coverage*.36,.79-coverage*.35,n*.77+broad*.23);}
 float hash3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
 float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);}
 float cloudVolume(vec3 p,float h){
  float envelope=smoothstep(0.,.19,h)*(1.-smoothstep(.65,1.,h));
  float broad=fbm(p.xz*.52/cloudScale);float detail=noise3(p*2.4/cloudScale)*.56+noise3(p*5.1/cloudScale)*.30+noise3(p*10.3/cloudScale)*.14;
  float shape=broad*(1.-cloudDetail*.32)+detail*cloudDetail*.32;
  return max(0.,shape-(.65-coverage*.43))*envelope*(2.0+cloudDensity*9.);
 }
 void main(){
 vec3 d=normalize(vSky);float sunTransmittance=1.;float altitude=max(0.,d.y),low=smoothstep(0.,.18+haze*.17,altitude);
 vec3 color=mix(horizon,zenith,pow(altitude,.47));color=mix(horizon,color,low*.65+.35);
 if(d.y<0.)color=mix(horizon,ground,smoothstep(0.,.28,-d.y));
 float sunDot=max(0.,dot(d,normalize(sunDirection)));color+=sunGlow*vec3(1.,.82,.63)*pow(sunDot,28.);
 if(d.y>.015&&coverage>.005){
  // One continuous field on a curved projection. No repeated slices or
  // translucent copies; the second probe affects lighting only.
  float dy=max(.10,d.y);
  vec2 p=d.xz*(1.25*cloudHeight/dy)/max(.4,cloudScale)+vec2(time*.004,time*.002);
  float n=fbm(p*.65+vec2(13.7,8.2));
  float detail=fbm(p*2.4+vec2(4.1,19.7));
  float shape=mix(n,detail,.13*cloudDetail);
  float threshold=.72-coverage*.52;
  float den=smoothstep(threshold,threshold+.16,shape);
  vec2 lightOffset=normalize(sunDirection.xz+vec2(.0001))*.12*cloudThickness;
  float upstream=fbm((p+lightOffset)*.65+vec2(13.7,8.2));
  float deep=fbm((p+lightOffset*2.6)*.65+vec2(13.7,8.2));
  float optical=max(0.,upstream-threshold)*.65+max(0.,deep-threshold)*.35;
  float shade=exp(-optical*cloudDensity*10.);
  float extinction=mix(2.7,1.1,cloudTransmission);
  float alpha=(1.-exp(-den*cloudDensity*cloudThickness*extinction*3./max(.36,dy)))*smoothstep(.025,.16,altitude)*opacity;
  float silver=pow(sunDot,7.)*(1.-den)*smoothstep(.03,.4,den)*(1.-overcast)*.15;
  vec3 light=mix(cloudShade*.76,cloudColor*1.12,shade*.86+.14)+cloudColor*silver;
  color=mix(color,light,alpha);sunTransmittance=1.-alpha;
 }
 // Single solar disc, angular diameter about half a degree; clouds attenuate it.
 float disk=smoothstep(.999986,.999994,sunDot)*step(0.,sunDirection.y)*sunTransmittance;
 color+=disk*sunGlow*12.*vec3(1.,.88,.72);
 gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const sky=new T.Mesh(new T.SphereGeometry(1,32,16),material);sky.name='forma-volumetric-sky-r71';sky.renderOrder=-100;sky.frustumCulled=false;return sky;
}
export function updatePhotographicSky(sky,{time='day',weather='sunny',sun,coverage=.35,haze=.3,view='3d',settings={}}={}){
 if(!sky)return;sky.visible=view!=='2d';const u=sky.material.uniforms;
 const wet=['overcast','rain','fog','snow'].includes(weather);
 const elevation=sun?Math.asin(clamp(sun.position.y/Math.max(.001,sun.position.length()),-1,1))*180/Math.PI:({night:-18,'blue-hour':-6,evening:5,morning:12,day:67}[time]??45);
 const appearance=solarAppearance(elevation),palette=continuousSkyPalette(u.zenith.value.constructor,elevation,weather);
 ['zenith','horizon','ground','cloudColor','cloudShade'].forEach((key,i)=>u[key].value.copy(palette[i]));
 u.sunGlow.value=appearance.direct*(wet?.06:.23);u.coverage.value=clamp(coverage,0,1);u.haze.value=haze;u.overcast.value=wet?1:0;u.opacity.value=1;
 for(const [key,def] of Object.entries({cloudDensity:65,cloudScale:100,cloudHeight:100,cloudThickness:100,cloudTransmission:65,cloudDetail:75}))u[key].value=(Number(settings[key]??def))/100;
 if(sun)u.sunDirection.value.copy(sun.position).normalize();
}
/* Keep the editable parcel and every surveyed position unchanged. */
export function photographicFog({time='day',weather='sunny',haze=.3,siteSize=40,treeTest=false}={}){
 const size=Math.max(10,siteSize),h=Math.min(1,Math.max(0,haze));
 const dense=weather==='fog',wet=['rain','snow'].includes(weather);
 const near=dense?Math.max(5,size*.24):wet?Math.max(12,size*.46):treeTest?Math.max(18,29-h*14):Math.max(24,size*.48);
 const far=dense?Math.max(40,size*1.8):wet?Math.max(90,size*3):Math.max(120,size*3.6)*(1-h*.28);
 return {near,far:Math.max(near+25,far),color:time==='night'?'#43566a':time==='blue-hour'?'#7e95b2':time==='evening'?'#c0b6a7':'#c4d3df'};
}

/** Bake the same scattering approximation into a linear HDR environment for
 * the path tracer. Alpha stores direct solar transmittance before readback. */
export async function bakeCloudEnvironment(T,renderer,{sun,time='day',weather='sunny',settings={},high=false,mobile=false,isAlive=()=>true,onProgress=()=>{}}={}){
 const width=high?1024:512,height=width/2;
 const dome=makePhotographicSky(T);updatePhotographicSky(dome,{sun,time,weather,settings,coverage:Math.min(1,(settings.clouds??35)/100*(weather==='sunny'?.78:1)+(['overcast','rain','fog','snow'].includes(weather)?.17:0)),haze:(settings.haze??30)/100});
 const mat=new T.ShaderMaterial({uniforms:dome.material.uniforms,defines:{CLOUD_STEPS:high?14:mobile?5:9},depthTest:false,depthWrite:false,toneMapped:false,
 vertexShader:'varying vec3 vSky; varying vec2 vUv; void main(){vUv=uv;vSky=vec3(0.);gl_Position=vec4(position.xy,0.,1.);}',
 fragmentShader:dome.material.fragmentShader.replace('varying vec3 vSky;','varying vec3 vSky; varying vec2 vUv;').replace('vec3 d=normalize(vSky);','float phi=(vUv.x-.5)*6.28318530718;float theta=(vUv.y-.5)*3.14159265359;vec3 d=vec3(cos(theta)*cos(phi),sin(theta),cos(theta)*sin(phi));').replace('gl_FragColor=vec4(color,1.);','gl_FragColor=vec4(color,sunTransmittance);').replace('#include <tonemapping_fragment>','').replace('#include <colorspace_fragment>','')});
 const rt=new T.WebGLRenderTarget(width,height,{type:T.FloatType,format:T.RGBAFormat,depthBuffer:false,stencilBuffer:false});
 const quad=new T.PlaneGeometry(2,2),scene=new T.Scene(),cam=new T.Camera();scene.add(new T.Mesh(quad,mat));
 const old=renderer.getRenderTarget(),vp=renderer.getViewport(new T.Vector4()),sc=renderer.getScissor(new T.Vector4()),test=renderer.getScissorTest(),auto=renderer.autoClear,data=new Float32Array(width*height*4);
 try{
  const gl=renderer.getContext();
  // Render small strips and read each one back before submitting the next.
  // This avoids one giant GPU command and yields to UI between strips.
  renderer.autoClear=false;
  for(let y=0;y<height;y+=16){
   if(!isAlive())throw Error('Подготовка неба отменена');
   if(gl.isContextLost())throw Error('WebGL отключён при подготовке неба');
   const rows=Math.min(16,height-y),part=new Float32Array(width*rows*4);
   rt.scissor.set(0,y,width,rows);rt.scissorTest=true;
   renderer.setRenderTarget(rt);renderer.state.scissor(rt.scissor);renderer.state.setScissorTest(true);
   renderer.render(scene,cam);renderer.readRenderTargetPixels(rt,0,y,width,rows,part);
   data.set(part,y*width*4);renderer.setRenderTarget(old);
   onProgress(Math.round((y+rows)/height*100));
   await new Promise(resolve=>requestAnimationFrame(resolve));
  }
  if(!data.some((v,i)=>i%4!==3&&v>.01))throw Error('HDR cloud readback failed');
  const d=sun?.position.clone().normalize()||new T.Vector3(.5,.7,.5).normalize(),x=Math.min(width-1,Math.max(0,Math.floor((Math.atan2(d.z,d.x)/(2*Math.PI)+.5)*width))),y=Math.min(height-1,Math.max(0,Math.floor((Math.asin(d.y)/Math.PI+.5)*height)));
  const direct=Math.max(.04,Math.min(1,data[(y*width+x)*4+3]));
  for(let i=3;i<data.length;i+=4)data[i]=1;
  const tex=new T.DataTexture(data,width,height,T.RGBAFormat,T.FloatType);tex.mapping=T.EquirectangularReflectionMapping;tex.colorSpace=T.LinearSRGBColorSpace;tex.needsUpdate=true;
  return {texture:tex,label:'FORMA HDR · облака '+(high?'1K':'512 px'),photographic:false,solarTransmission:direct};
 }finally{renderer.autoClear=auto;renderer.setRenderTarget(old);renderer.setViewport(vp);renderer.setScissor(sc);renderer.setScissorTest(test);rt.dispose();quad.dispose();mat.dispose();dome.geometry.dispose();dome.material.dispose();}
}
