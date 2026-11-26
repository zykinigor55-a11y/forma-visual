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
function makePipeline(T,renderer,scene,camera,w,h,mobile){
 const target=new T.WebGLRenderTarget(w,h,{type:T.HalfFloatType,depthBuffer:true,stencilBuffer:false});
 target.texture.colorSpace=T.LinearSRGBColorSpace;
 target.depthTexture=new T.DepthTexture(w,h,T.UnsignedIntType);
 target.depthTexture.format=T.DepthFormat;
 // Create normal target first (r179 setGBuffer expects one); then use actual
 // scene depth for the AO normal reconstruction, preserving alpha cutouts.
 const ao=new GTAO(scene,camera,Math.max(1,Math.round(w*.5)),Math.max(1,Math.round(h*.5)));
 ao.setGBuffer(target.depthTexture);
 ao.updateGtaoMaterial({radius:.85,thickness:.32,distanceFallOff:1,scale:1.15,samples:mobile?8:16,screenSpaceRadius:false});
 ao.updatePdMaterial({radius:mobile?3:5,samples:mobile?8:16,rings:2});
 ao.output=GTAO.OUTPUT.Off;
 const mat=new T.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:true,uniforms:{beauty:{value:target.texture},ambient:{value:ao.pdRenderTarget.texture},depth:{value:target.depthTexture},strength:{value:.52},aoTexel:{value:new T.Vector2(2/w,2/h)},cameraNear:{value:camera.near},cameraFar:{value:camera.far}},
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
 fragmentShader:`varying vec2 vUv;uniform sampler2D beauty,ambient,depth;uniform float strength,cameraNear,cameraFar;uniform vec2 aoTexel;
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
 float weight=strength*(1.-smoothstep(.72,1.2,dot(c.rgb,vec3(.2126,.7152,.0722)))*.55);
 if(z<.99999)c.rgb*=mix(1.,occ,weight);gl_FragColor=c;
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const quadScene=new T.Scene(),quadCamera=new T.Camera(),quad=new T.Mesh(new T.PlaneGeometry(2,2),mat);quad.frustumCulled=false;quadScene.add(quad);
 return {target,ao,mat,quadScene,quadCamera,w,h,mobile,failed:false};
}
export function renderPhotorealFrame(T,renderer,scene,camera,{enabled=true,force=false,onReady=()=>{}}={}){
 if(!enabled||!camera?.isPerspectiveCamera||!renderer.extensions.has('EXT_color_buffer_float')||unavailable){renderer.render(scene,camera);return false;}
 if(!GTAO){
  if(!loading){loading=true;import('three/addons/postprocessing/GTAOPass.js').then(mod=>{GTAO=mod.GTAOPass;onReady();}).catch(e=>{unavailable=true;console.warn('FORMA GTAO unavailable',e);});}
  renderer.render(scene,camera);return false;
 }
 let state=pipelines.get(renderer);
 if(state?.failed){renderer.render(scene,camera);return false;}
 const mobile=typeof window!=='undefined'&&window.innerWidth<=850,sz=renderer.getDrawingBufferSize(new T.Vector2()),w=Math.max(1,Math.round(sz.x)),h=Math.max(1,Math.round(sz.y));
 const oldTarget=renderer.getRenderTarget(),oldAuto=renderer.autoClear;
 try{
  if(!state){state=makePipeline(T,renderer,scene,camera,w,h,mobile);pipelines.set(renderer,state);}
  if(w!==state.w||h!==state.h){state.target.setSize(w,h);state.ao.setSize(Math.max(1,Math.round(w*.5)),Math.max(1,Math.round(h*.5)));state.w=w;state.h=h;}
  state.ao.camera=camera;state.ao.scene=scene;
  state.mat.uniforms.strength.value=force?.60:mobile?.48:.55;state.mat.uniforms.cameraNear.value=camera.near;state.mat.uniforms.cameraFar.value=camera.far;state.mat.uniforms.aoTexel.value.set(1/state.ao.width,1/state.ao.height);
  renderer.setRenderTarget(state.target);renderer.autoClear=true;renderer.render(scene,camera);
  state.ao.render(renderer,null,state.target);
  renderer.setRenderTarget(oldTarget);renderer.autoClear=true;renderer.render(state.quadScene,state.quadCamera);
  return true;
 }catch(e){console.warn('FORMA GTAO fallback',e);pipelines.set(renderer,{failed:true});renderer.setRenderTarget(oldTarget);renderer.autoClear=oldAuto;renderer.render(scene,camera);return false;}
 finally{renderer.setRenderTarget(oldTarget);renderer.autoClear=oldAuto;}
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
