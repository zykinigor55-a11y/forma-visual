/* R65 outdoor sky: camera-centred infinite background, layered cloud density
 * and directional cloud shading. A realtime approximation, not ray marching. */
export function makePhotographicSky(T){
 const uniforms={coverage:{value:.35},time:{value:0},opacity:{value:1},cloudColor:{value:new T.Color('#f5f6f1')},sunDirection:{value:new T.Vector3(.5,.7,.5)},zenith:{value:new T.Color('#759abb')},horizon:{value:new T.Color('#d9e1e5')},ground:{value:new T.Color('#9eaeb0')},cloudShade:{value:new T.Color('#a7b5c3')},haze:{value:.30},sunGlow:{value:.15},overcast:{value:0}};
 const material=new T.ShaderMaterial({uniforms,side:T.BackSide,depthWrite:false,depthTest:true,toneMapped:true,fog:false,
 vertexShader:`varying vec3 vSky;
 void main(){vSky=position;vec4 p=projectionMatrix*vec4(mat3(viewMatrix)*position,1.0);gl_Position=p.xyww;}`,
 fragmentShader:`varying vec3 vSky;
 uniform vec3 zenith,horizon,ground,cloudColor,cloudShade,sunDirection;
 uniform float coverage,time,opacity,haze,sunGlow,overcast;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 float fbm(vec2 p){float s=0.,a=.52;mat2 r=mat2(.8,-.6,.6,.8);for(int i=0;i<5;i++){s+=noise(p)*a;p=r*p*2.06+vec2(3.1,7.7);a*=.49;}return s;}
 float density(vec2 p){float broad=fbm(p*.55);float n=fbm(p+vec2(broad*.95,broad*.38));return smoothstep(.70-coverage*.40,.86-coverage*.37,n*.80+broad*.20);}
 void main(){
 vec3 d=normalize(vSky);float altitude=max(0.,d.y),low=smoothstep(0.,.18+haze*.17,altitude);
 vec3 color=mix(horizon,zenith,pow(altitude,.47));color=mix(horizon,color,low*.65+.35);
 if(d.y<0.)color=mix(horizon,ground,smoothstep(0.,.28,-d.y));
 float sunDot=max(0.,dot(d,normalize(sunDirection)));color+=sunGlow*vec3(1.,.82,.63)*pow(sunDot,28.);
 if(d.y>.015&&coverage>.005){
  vec2 p=d.xz/(max(.075,d.y)+.16)*1.65+vec2(time*.0035,time*.0017);
  float a=density(p);vec2 sl=sunDirection.xz*.22;float shade=density(p+sl);
  float relief=clamp(.65+(a-shade)*1.35,0.,1.);
  float rim=pow(sunDot,12.)*clamp(a-shade+.2,0.,.55);
  vec3 cloud=mix(cloudShade,cloudColor,relief)*mix(.84,1.13,relief)+vec3(1.,.88,.70)*rim*.19;
  float mask=clamp(a*1.22,0.,1.)*smoothstep(.025,.19,altitude)*opacity;
  color=mix(color,cloud,mask);
 }
 gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const sky=new T.Mesh(new T.SphereGeometry(1,32,16),material);sky.name='forma-photographic-sky-r65';sky.renderOrder=-100;sky.frustumCulled=false;return sky;
}
export function updatePhotographicSky(sky,{time='day',weather='sunny',sun,coverage=.35,haze=.3,view='3d'}={}){
 if(!sky)return;sky.visible=view!=='2d';const u=sky.material.uniforms;
 const wet=['overcast','rain','fog','snow'].includes(weather);
 const p=time==='night'?['#18283b','#4b657f','#303e49','#69798e','#3b495e',0]:time==='blue-hour'?['#415e90','#9aaec8','#71808e','#b1bdcf','#697b9c',0]:time==='evening'?['#7294ba','#d9b7a2','#b6aaa0','#f8dfc7','#a9aab2',.13]:time==='morning'?['#7ba4c7','#e1d4c4','#b6b9b3','#fff0dc','#afbecb',.12]:wet?['#a4b3bf','#d3dbdf','#b0b8b9','#e4e9ec','#acb6c0',.025]:['#6591b9','#d0e0eb','#aabbbd','#fffdf5','#a5b6c7',.08];
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
