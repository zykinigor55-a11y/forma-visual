/* R65 outdoor sky: camera-centred infinite background, layered cloud density
 * and directional cloud shading. A realtime approximation, not ray marching. */
export function makePhotographicSky(T){
 const uniforms={coverage:{value:.35},time:{value:0},opacity:{value:1},cloudColor:{value:new T.Color('#f5f6f1')},sunDirection:{value:new T.Vector3(.5,.7,.5)},zenith:{value:new T.Color('#759abb')},horizon:{value:new T.Color('#d9e1e5')},ground:{value:new T.Color('#9eaeb0')},cloudShade:{value:new T.Color('#a7b5c3')},haze:{value:.30},sunGlow:{value:.15},overcast:{value:0}};
 const material=new T.ShaderMaterial({uniforms,defines:{CLOUD_STEPS:typeof window!=='undefined'&&window.innerWidth<=850?5:9},side:T.BackSide,depthWrite:false,depthTest:true,toneMapped:true,fog:false,
 vertexShader:`varying vec3 vSky;
 void main(){vSky=position;vec4 p=projectionMatrix*vec4(mat3(viewMatrix)*position,1.0);gl_Position=p.xyww;}`,
 fragmentShader:`varying vec3 vSky;
 uniform vec3 zenith,horizon,ground,cloudColor,cloudShade,sunDirection;
 uniform float coverage,time,opacity,haze,sunGlow,overcast;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 float fbm(vec2 p){float s=0.,a=.52;mat2 r=mat2(.8,-.6,.6,.8);for(int i=0;i<5;i++){s+=noise(p)*a;p=r*p*2.06+vec2(3.1,7.7);a*=.49;}return s;}
 float density(vec2 p){float broad=fbm(p*.55);float n=fbm(p+vec2(broad*.95,broad*.38));return smoothstep(.64-coverage*.36,.79-coverage*.35,n*.77+broad*.23);}
 float hash3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
 float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);}
 float cloudVolume(vec3 p,float h){
  float envelope=smoothstep(0.,.19,h)*(1.-smoothstep(.65,1.,h));
  float broad=fbm(p.xz*.52);float detail=noise3(p*2.4)*.65+noise3(p*5.1)*.35;
  return max(0.,broad*.82+detail*.18-(.60-coverage*.32))*envelope*6.;
 }
 void main(){
 vec3 d=normalize(vSky);float altitude=max(0.,d.y),low=smoothstep(0.,.18+haze*.17,altitude);
 vec3 color=mix(horizon,zenith,pow(altitude,.47));color=mix(horizon,color,low*.65+.35);
 if(d.y<0.)color=mix(horizon,ground,smoothstep(0.,.28,-d.y));
 float sunDot=max(0.,dot(d,normalize(sunDirection)));color+=sunGlow*vec3(1.,.82,.63)*pow(sunDot,28.);
 if(d.y>.015&&coverage>.005){
  // Ray integration through a finite cloud layer; Beer-Lambert transmittance
  // and a short sun-direction density probe provide illuminated cloud edges.
  float dy=max(.045,d.y),trans=1.;vec3 scattered=vec3(0.);
  vec3 L=normalize(sunDirection);float mu=dot(d,L);
  float phase=.65+.35*pow(max(0.,mu),5.);
  float dt=.65/(dy*float(CLOUD_STEPS));
  for(int i=0;i<CLOUD_STEPS;i++){
   float h=(float(i)+.5)/float(CLOUD_STEPS);
   vec3 p=d*((1.25+h*.65)/dy);p.xz+=vec2(time*.004,time*.002);
   float den=cloudVolume(p,h);
   float lightDensity=cloudVolume(p+L*.24,clamp(h+L.y*.32,0.,1.));
   float illumination=exp(-lightDensity*1.25);
   vec3 light=mix(cloudShade*.67,cloudColor*1.48,illumination)*phase;
   float alpha=1.-exp(-den*dt*1.9);
   scattered+=trans*alpha*light;trans*=1.-alpha;
  }
  float blend=smoothstep(.035,.19,altitude)*opacity;
  color=mix(color,color*trans+scattered,blend);
 }
 gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const sky=new T.Mesh(new T.SphereGeometry(1,32,16),material);sky.name='forma-volumetric-sky-r71';sky.renderOrder=-100;sky.frustumCulled=false;return sky;
}
export function updatePhotographicSky(sky,{time='day',weather='sunny',sun,coverage=.35,haze=.3,view='3d'}={}){
 if(!sky)return;sky.visible=view!=='2d';const u=sky.material.uniforms;
 const wet=['overcast','rain','fog','snow'].includes(weather);
 const p=time==='night'?['#18283b','#4b657f','#303e49','#69798e','#3b495e',0]:time==='blue-hour'?['#415e90','#9aaec8','#71808e','#b1bdcf','#697b9c',0]:time==='evening'?['#7294ba','#d9b7a2','#b6aaa0','#f8dfc7','#a9aab2',.13]:time==='morning'?['#7ba4c7','#e1d4c4','#b6b9b3','#fff0dc','#afbecb',.12]:wet?['#a4b3bf','#d3dbdf','#b0b8b9','#e4e9ec','#acb6c0',.025]:['#5e8db6','#c9dbe6','#aabbbd','#fffdf7','#97a8ba',.11];
 ['zenith','horizon','ground','cloudColor','cloudShade'].forEach((key,i)=>u[key].value.set(p[i]));
 u.sunGlow.value=p[5];u.coverage.value=Math.max(0,Math.min(1,coverage));u.haze.value=haze;u.overcast.value=wet?1:0;u.opacity.value=1;
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
