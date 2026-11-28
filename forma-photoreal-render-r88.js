/* FORMA R66: actual screen-space GTAO from the beauty depth buffer.
 * Preserves alpha-tested foliage silhouettes; no override material pass.
 * The directional penumbra filter is a blocker-based approximation, not RT.
 */
const pipelines=new WeakMap();
let GTAO=null,loading=false,unavailable=false;
export function installSoftPenumbra(T){
 const chunk=T.ShaderChunk.shadowmap_pars_fragment;
 if(!chunk||chunk.includes('formaBlockerCount'))return false;
 const start=chunk.indexOf('float getShadow('),needle='vec2 texelSize = vec2( 1.0 ) / shadowMapSize;';
 const at=chunk.indexOf(needle,start);if(start<0||at<0)return false;
 const pos=at+needle.length;
 const code=`
 #ifndef USE_REVERSEDEPTHBUF
 float formaBlockerSum=0.0;float formaBlockerCount=0.0;
 if(shadowRadius>1.5){
  for(int formaI=0;formaI<8;formaI++){
   float angle=float(formaI)*2.39996323;
   vec2 off=vec2(cos(angle),sin(angle))*texelSize*(2.0+float(formaI)*0.75);
   float blocker=unpackRGBAToDepth(texture2D(shadowMap,clamp(shadowCoord.xy+off,vec2(0.0),vec2(1.0))));
   if(blocker<shadowCoord.z-0.00015){formaBlockerSum+=blocker;formaBlockerCount+=1.0;}
  }
  if(formaBlockerCount>0.0){
   float separation=max(0.0,shadowCoord.z-formaBlockerSum/formaBlockerCount);
   shadowRadius=clamp(1.15+separation*170.0,1.15,shadowRadius*2.3);
  }
 }
 #endif
 `;
 T.ShaderChunk.shadowmap_pars_fragment=chunk.slice(0,pos)+code+chunk.slice(pos);
 return true;
}
function makePipeline(T,renderer,scene,camera,w,h,mobile,mode){
 const scale=mobile?.35:.5;
 const target=new T.WebGLRenderTarget(w,h,{type:T.HalfFloatType,depthBuffer:true,stencilBuffer:false});
 const lawn=!!scene.userData.formaLawnR86,sakura=!!scene.userData.formaSakuraR225;
 // Avoid multisampled depth resolves for alpha-tested vegetation in postFX.
 target.texture.colorSpace=T.LinearSRGBColorSpace;
 target.depthTexture=new T.DepthTexture(w,h,T.UnsignedIntType);
 target.depthTexture.format=T.DepthFormat;
 // Create normal target first (r179 setGBuffer expects one); then use actual
 // scene depth for the AO normal reconstruction, preserving alpha cutouts.
 const aw=Math.max(1,Math.round(w*scale)),ah=Math.max(1,Math.round(h*scale));
 let ao=null,aoTarget=null,aoMat=null,aoScene=null,aoCamera=null;
 if(mode==='gtao'){
  ao=new GTAO(scene,camera,aw,ah);
  ao.setGBuffer(target.depthTexture);
  ao.updateGtaoMaterial({radius:sakura?.38:lawn?.22:.85,thickness:sakura?.14:lawn?.07:.28,distanceFallOff:1,scale:1.1,samples:16,screenSpaceRadius:false});
  ao.updatePdMaterial({radius:4,samples:12,rings:2});
  ao.output=GTAO.OUTPUT.Off;
 }else{
  // R236: depth-only hemisphere approximation, no normal override pass.
  aoTarget=new T.WebGLRenderTarget(aw,ah,{type:T.UnsignedByteType,depthBuffer:false});
  aoMat=new T.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,uniforms:{depth:{value:target.depthTexture},invProjection:{value:camera.projectionMatrixInverse.clone()},pixel:{value:new T.Vector2(1/w,1/h)},projectionScale:{value:camera.projectionMatrix.elements[5]},radius:{value:sakura?.42:lawn?.22:.65}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,fragmentShader:`
  varying vec2 vUv;uniform sampler2D depth;uniform mat4 invProjection;uniform vec2 pixel;uniform float projectionScale,radius;
  vec3 at(vec2 uv){float z=texture2D(depth,uv).r;vec4 p=invProjection*vec4(uv*2.-1.,z*2.-1.,1.);return p.xyz/p.w;}
  void main(){float z=texture2D(depth,vUv).r;if(z>.99999){gl_FragColor=vec4(1.);return;}
   vec3 p=at(vUv),a=at(clamp(vUv+vec2(pixel.x,0.),0.,1.))-p,b=p-at(clamp(vUv-vec2(pixel.x,0.),0.,1.)),c=at(clamp(vUv+vec2(0.,pixel.y),0.,1.))-p,d=p-at(clamp(vUv-vec2(0.,pixel.y),0.,1.));
   vec3 n=cross(length(a)<length(b)?a:b,length(c)<length(d)?c:d);n/=max(length(n),.000001);if(dot(n,-p)<0.)n=-n;
   float occ=0.;float hits=0.;float screenRadius=clamp(radius*projectionScale*.5/max(.12,-p.z),pixel.y*2.,.13);
   for(int i=0;i<12;i++){float fi=float(i);float ang=fi*2.39996323;float rr=sqrt((fi+.5)/12.);vec2 uv=vUv+vec2(cos(ang)*pixel.x/pixel.y,sin(ang))*screenRadius*rr;
    if(any(lessThan(uv,vec2(.001)))||any(greaterThan(uv,vec2(.999))))continue;
    if(texture2D(depth,uv).r>.99999)continue;vec3 v=at(uv)-p;float dist=length(v);if(dist<.012||dist>radius*1.5)continue;
    occ+=max(0.,dot(n,v/dist)-.08)*(1.-smoothstep(radius*.2,radius*1.5,dist));hits+=1.;
   }
   float visibility=clamp(1.-occ/max(4.,hits)*1.45,.48,1.);gl_FragColor=vec4(vec3(visibility),1.);
  }`});
  aoScene=new T.Scene();aoCamera=new T.Camera();const q=new T.Mesh(new T.PlaneGeometry(2,2),aoMat);q.frustumCulled=false;aoScene.add(q);
 }
 const ambient=ao?.gtaoMap||ao?.pdRenderTarget?.texture||aoTarget?.texture;
 if(!ambient)throw Error('AO output unavailable');
 const giTarget=new T.WebGLRenderTarget(Math.max(1,Math.round(w*.5)),Math.max(1,Math.round(h*.5)),{type:T.HalfFloatType,depthBuffer:false});
 const giMat=new T.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,defines:{GI_SAMPLES:mobile?6:10},uniforms:{beauty:{value:target.texture},depth:{value:target.depthTexture},invProjection:{value:camera.projectionMatrixInverse.clone()},pixel:{value:new T.Vector2(1/w,1/h)}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,fragmentShader:`varying vec2 vUv;uniform sampler2D beauty,depth;uniform mat4 invProjection;uniform vec2 pixel;
 vec3 pos(vec2 uv,float z){vec4 p=invProjection*vec4(uv*2.-1.,z*2.-1.,1.);return p.xyz/p.w;}
 vec3 at(vec2 uv){return pos(uv,texture2D(depth,uv).r);}
 void main(){float z=texture2D(depth,vUv).r;if(z>.99999){gl_FragColor=vec4(0.);return;}vec3 p=pos(vUv,z);vec3 a=at(vUv+vec2(pixel.x,0.))-p,b=p-at(vUv-vec2(pixel.x,0.)),c=at(vUv+vec2(0.,pixel.y))-p,d=p-at(vUv-vec2(0.,pixel.y));vec3 n=normalize(cross(length(a)<length(b)?a:b,length(c)<length(d)?c:d));if(dot(n,-p)<0.)n=-n;
 vec3 bounce=vec3(0.);float total=0.;float rot=fract(sin(dot(floor(vUv/pixel*.5),vec2(12.9898,78.233)))*43758.5453)*6.28318;
 for(int i=0;i<GI_SAMPLES;i++){float fi=float(i),ang=rot+fi*2.39996;float radius=(.35+fi/float(GI_SAMPLES))*.085/max(1.,-p.z*.12);vec2 uv=vUv+vec2(cos(ang),sin(ang))*radius*vec2(pixel.x/pixel.y,1.);if(any(lessThan(uv,vec2(.002)))||any(greaterThan(uv,vec2(.998))))continue;float dz=texture2D(depth,uv).r;if(dz>.99999)continue;vec3 q=pos(uv,dz),v=q-p;float dist=length(v);if(dist<.04||dist>3.5)continue;float cosine=max(0.,dot(n,v/dist));float weight=cosine*exp(-dist*.65);vec3 light=min(texture2D(beauty,uv).rgb,vec3(1.6));bounce+=light*weight;total+=weight;}
 gl_FragColor=vec4(bounce/max(2.5,total),-p.z);}`});
 const giScene=new T.Scene(),giCamera=new T.Camera(),giQuad=new T.Mesh(new T.PlaneGeometry(2,2),giMat);giQuad.frustumCulled=false;giScene.add(giQuad);
 const mat=new T.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:true,uniforms:{beauty:{value:target.texture},ambient:{value:ambient},depth:{value:target.depthTexture},strength:{value:.52},lawnAA:{value:lawn?1:0},sakuraAA:{value:sakura?1:0},aoTexel:{value:new T.Vector2(1/aw,1/ah)},cameraNear:{value:camera.near},cameraFar:{value:camera.far},gi:{value:giTarget.texture},giStrength:{value:0},giEnabled:{value:0},inverseProjection:{value:camera.projectionMatrixInverse.clone()},cameraWorld:{value:camera.matrixWorld.clone()},fogColor:{value:new T.Color('#c4d3df')},fogDensity:{value:.002},fogStart:{value:20},pixel:{value:new T.Vector2(1/w,1/h)}},
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
 fragmentShader:`varying vec2 vUv;uniform sampler2D beauty,ambient,depth;uniform float strength,cameraNear,cameraFar,giStrength,giEnabled,fogDensity,fogStart,lawnAA,sakuraAA;uniform vec2 aoTexel,pixel;uniform sampler2D gi;uniform mat4 inverseProjection,cameraWorld;uniform vec3 fogColor;
 float linearDepth(float z){return cameraNear*cameraFar/(cameraFar-z*(cameraFar-cameraNear));}
 void main(){vec4 c=texture2D(beauty,vUv);float z=texture2D(depth,vUv).r;
 float center=linearDepth(z),sum=0.,weights=0.;
 // Bilateral upsampling: preserve thin leaf silhouettes and avoid AO halos in sky.
 for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
  vec2 uv=clamp(vUv+vec2(float(i),float(j))*aoTexel*.55,vec2(.0),vec2(1.));
  float d=linearDepth(texture2D(depth,uv).r);
  float w=exp(-abs(d-center)/max(.07,center*.006))*exp(-.65*float(i*i+j*j));
  sum+=clamp(texture2D(ambient,uv).r,0.,1.)*w;weights+=w;
 }
 float occ=sum/max(weights,.0001);
 float weight=strength*(1.-smoothstep(.72,1.2,dot(c.rgb,vec3(.2126,.7152,.0722)))*.55);if(lawnAA>.5){occ=max(occ,.65);weight*=1.-.50*smoothstep(2.,12.,center);}
 if(z<.99999){
 c.rgb*=mix(1.,occ,weight);
 if(giEnabled>.5){vec3 indirect=vec3(0.);float gw=0.;
 for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 u=clamp(vUv+vec2(float(i),float(j))*aoTexel*.65,vec2(.0),vec2(1.));vec4 g=texture2D(gi,u);float k=g.a>0.0?exp(-abs(g.a-center)/max(.12,center*.012)):0.0;indirect+=g.rgb*k;gw+=k;}
 c.rgb+=indirect/max(gw,.001)*giStrength*clamp(1.-dot(c.rgb,vec3(.2126,.7152,.0722))*.45,.25,1.);}
 vec4 vp=inverseProjection*vec4(vUv*2.-1.,z*2.-1.,1.);vec3 world=(cameraWorld*vec4(vp.xyz/vp.w,1.)).xyz;
 float path=max(0.,length(vp.xyz/vp.w)-fogStart);
 float altitude=max(0.,(world.y+cameraWorld[3].y)*.5);
 float haze=1.-exp(-path*fogDensity*exp(-altitude/15.));
 c.rgb=mix(c.rgb,fogColor,clamp(haze,0.,.55));
 }
 // Small depth-aware edge filter, not a global blur.
 vec3 x1=texture2D(beauty,vUv+vec2(pixel.x,0.)).rgb,x2=texture2D(beauty,vUv-vec2(pixel.x,0.)).rgb,y1=texture2D(beauty,vUv+vec2(0.,pixel.y)).rgb,y2=texture2D(beauty,vUv-vec2(0.,pixel.y)).rgb;
 float ex=abs(dot(x1-x2,vec3(.2126,.7152,.0722))),ey=abs(dot(y1-y2,vec3(.2126,.7152,.0722)));
 vec3 along=ex>ey?(y1+y2)*.5:(x1+x2)*.5;
 float edgeAA=smoothstep(mix(.10,.045,max(lawnAA,sakuraAA*.75)),mix(.55,.25,max(lawnAA,sakuraAA*.75)),max(ex,ey));
 c.rgb=mix(c.rgb,along,edgeAA*mix(.13,.34,max(lawnAA,sakuraAA*.78)));
 gl_FragColor=c;
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const quadScene=new T.Scene(),quadCamera=new T.Camera(),quad=new T.Mesh(new T.PlaneGeometry(2,2),mat);quad.frustumCulled=false;quadScene.add(quad);
 return {target,ao,aoTarget,aoMat,aoScene,aoCamera,mat,quadScene,quadCamera,giTarget,giMat,giScene,giCamera,w,h,mobile,mode,aw,ah,failed:false};
}
export function renderPhotorealFrame(T,renderer,scene,camera,{enabled=true,force=false,onReady=()=>{},mode='auto',gi=false}={}){
 scene.userData.formaSSGIR70=false;scene.userData.formaPostFXR236='pbr';
 if(!enabled||!camera?.isPerspectiveCamera||!renderer.extensions.has('EXT_color_buffer_float')){renderer.render(scene,camera);return false;}
 const mobile=typeof window!=='undefined'&&window.innerWidth<=850;
 const preferGTAO=mode==='gtao'||(mode==='auto'&&!mobile);
 if(preferGTAO&&!GTAO&&!loading&&!unavailable){loading=true;import('three/addons/postprocessing/GTAOPass.js').then(mod=>{GTAO=mod.GTAOPass;onReady();}).catch(e=>{unavailable=true;console.warn('FORMA GTAO unavailable; SSAO fallback',e);onReady();});}
 let selected=preferGTAO&&GTAO&&!unavailable?'gtao':'ssao';
 const sz=renderer.getDrawingBufferSize(new T.Vector2()),w=Math.max(1,Math.round(sz.x)),h=Math.max(1,Math.round(sz.y));
 let state=pipelines.get(renderer);
 if(state?.failed){renderer.render(scene,camera);return false;}
 // Rebuild on actual target size or tier change; never keep stale depth attachments.
 if(state&&(state.w!==w||state.h!==h||state.mode!==selected)){releasePhotorealPipeline(renderer);state=null;}
 const oldTarget=renderer.getRenderTarget(),oldAuto=renderer.autoClear;
 try{
  if(!state){state=makePipeline(T,renderer,scene,camera,w,h,mobile,selected);pipelines.set(renderer,state);}
  const u=state.mat.uniforms;camera.updateMatrixWorld();
  u.strength.value=scene.userData.formaLawnR86?(mobile?.30:.34):scene.userData.formaSakuraR225?(mobile?.40:.44):(mobile?.34:.41);
  u.cameraNear.value=camera.near;u.cameraFar.value=camera.far;
  renderer.setRenderTarget(state.target);renderer.autoClear=true;renderer.render(scene,camera);
  if(state.ao){state.ao.camera=camera;state.ao.scene=scene;state.ao.render(renderer,null,state.target);}
  else{state.aoMat.uniforms.invProjection.value.copy(camera.projectionMatrixInverse);state.aoMat.uniforms.projectionScale.value=camera.projectionMatrix.elements[5];renderer.setRenderTarget(state.aoTarget);renderer.render(state.aoScene,state.aoCamera);}
  const doGI=gi&&selected==='gtao'&&!mobile;
  if(doGI){state.giMat.uniforms.invProjection.value.copy(camera.projectionMatrixInverse);renderer.setRenderTarget(state.giTarget);renderer.render(state.giScene,state.giCamera);}
  u.giEnabled.value=doGI?1:0;u.giStrength.value=doGI?.16:0;
  u.inverseProjection.value.copy(camera.projectionMatrixInverse);u.cameraWorld.value.copy(camera.matrixWorld);
  const haze=scene.userData.formaAtmosphereR70||{};u.fogDensity.value=haze.density??0;u.fogStart.value=haze.start??22;if(scene.fog?.color)u.fogColor.value.copy(scene.fog.color);
  renderer.setRenderTarget(oldTarget);renderer.autoClear=true;renderer.render(state.quadScene,state.quadCamera);
  scene.userData.formaSSGIR70=doGI;scene.userData.formaPostFXR236=selected+(doGI?' + ssgi':'');
  return true;
 }catch(e){
  console.warn('FORMA R236 postFX fallback',e);releasePhotorealPipeline(renderer);
  if(selected==='gtao'){unavailable=true;onReady();}else pipelines.set(renderer,{failed:true});
  renderer.setRenderTarget(oldTarget);renderer.autoClear=oldAuto;renderer.render(scene,camera);return false;
 }finally{renderer.setRenderTarget(oldTarget);renderer.autoClear=oldAuto;}
}
export function applyTurfVariation(mat){
 const prior=mat.onBeforeCompile,key=mat.customProgramCacheKey?.()||'';
 mat.onBeforeCompile=function(shader,renderer){prior?.call(this,shader,renderer);
 shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vFormaR66Turf;').replace('#include <begin_vertex>','#include <begin_vertex>\nvFormaR66Turf=(modelMatrix*vec4(position,1.0)).xyz;');
 shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vFormaR66Turf;').replace('#include <color_fragment>',`#include <color_fragment>
  vec2 pR66=vFormaR66Turf.xz;
  float mR66=sin(pR66.x*.48+sin(pR66.y*.27))*sin(pR66.y*.39+cos(pR66.x*.32));
  float nR66=sin(pR66.x*1.1+pR66.y*.83)*cos(pR66.y*1.37-pR66.x*.43);
  float lumR66=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(lumR66),.13)*(.94+.14*mR66+.045*nR66);
 `);};
 mat.customProgramCacheKey=()=>key+'|forma-turf-r69';mat.needsUpdate=true;
}
export function createPreviewMeadow(T,grass,side){
 const length=1000,geometry=new T.PlaneGeometry(length,length);geometry.rotateX(-Math.PI/2);
 const uv=geometry.attributes.uv,ratio=length/side;
 for(let i=0;i<uv.count;i++)uv.setXY(i,(uv.getX(i)-.5)*ratio+.5,(1-uv.getY(i)-.5)*ratio+.5);
 const mat=new T.MeshStandardMaterial({map:grass,color:'#dce0d1',roughness:.98,metalness:0,envMapIntensity:.20});applyTurfVariation(mat);
 const meadow=new T.Mesh(geometry,mat);meadow.name='forma-preview-horizon-meadow-r66';meadow.position.y=-.13;meadow.receiveShadow=true;meadow.castShadow=false;meadow.raycast=()=>{};return meadow;
}

/* Release optional postprocess targets before heavy GPU jobs or after loss. */
export function releasePhotorealPipeline(renderer){
 const p=pipelines.get(renderer);pipelines.delete(renderer);if(!p||p.failed)return;
 for(const r of [p.target,p.ao,p.aoTarget,p.aoMat,p.mat,p.giTarget,p.giMat]){try{r?.dispose();}catch{}}
 for(const scene of [p.quadScene,p.giScene,p.aoScene])scene?.traverse(n=>{if(n.isMesh)n.geometry?.dispose();});
}
