// R201: independent near/far photographic forest horizons; local CC0 alpha textures only.
export const PANORAMAS=[['off','Без окружения'],['conifer','Хвойный лес'],['deciduous','Лиственный лес'],['mixed','Смешанный лес']];
export const FAR_PANORAMAS=[...PANORAMAS,['hills','Высокие лесистые холмы'],['mountains','Горы']];
const types=new Set(PANORAMAS.map(p=>p[0])),relief=new Set(['hills','mountains']);
const farTypes=new Set(FAR_PANORAMAS.map(p=>p[0]));
const clamp=(x,a,b,d)=>x!==null&&x!==''&&Number.isFinite(Number(x))?Math.max(a,Math.min(b,Number(x))):d;
export function normalizePanorama(v={}){
 v=v||{};
 const layer=(p,d,lo,hi,maxH,allowed=types,minH=5)=>{p=p||{};return {type:allowed.has(p.type)?p.type:d.type,distance:clamp(p.distance,lo,hi,d.distance),height:clamp(p.height,minH,maxH,d.height),rotation:clamp(p.rotation,0,360,0)};};
 const near=layer(v.near,{type:'conifer',distance:180,height:18},50,250,35);
 const elevated=relief.has(v.far?.type),mountain=v.far?.type==='mountains';
 const far=layer(v.far,{type:'mixed',distance:mountain?1500:elevated?700:420,height:mountain?220:elevated?95:14},elevated?500:260,elevated?2500:1000,elevated?350:40,farTypes,elevated?45:5);
 if(near.type!=='off'&&far.type!=='off')far.distance=Math.max(far.distance,near.distance+100);
 return {near,far,blur:clamp(v.blur,0,12,2),haze:clamp(v.haze,0,25,10),season:['summer','spring','autumn','winter'].includes(v.season)?v.season:'summer'};
}
export function createPanoramaEnvironment(T,scene,{mobile=false,onChange=()=>{},onStatus=()=>{}}={}){
 let current=normalizePanorama(),lastOptions={},disposed=false;
 const root=new T.Group();root.name='forma-alpha-horizon-r201';root.visible=false;root.userData.formaDistantBackground=true;scene.add(root);
 const cache=new Map(),rings=[];
 const texLoader=new T.TextureLoader();texLoader.setCrossOrigin('anonymous');
 const blank=new T.DataTexture(new Uint8Array([0,0,0,0]),1,1,T.RGBAFormat);blank.needsUpdate=true;
 function ring(order){
  const u={groundTint:{value:new T.Color('#66794b')},foot:{value:.045},photo:{value:blank},photo2:{value:blank},fullCircle:{value:0},mixed:{value:0},ratio2:{value:1},repeats:{value:2},offset:{value:0},haze:{value:.1},sky:{value:new T.Color('#b5c5cb')},tone:{value:1},tint:{value:new T.Color('#ffffff')},season:{value:0},blur:{value:0},texel:{value:new T.Vector2(1/4096,1/1024)}};
  const mat=new T.ShaderMaterial({uniforms:u,side:T.BackSide,transparent:true,depthWrite:false,depthTest:true,toneMapped:false,
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D photo,photo2;uniform float fullCircle,mixed,ratio2,repeats,offset,haze,tone,season,blur;uniform vec3 sky,tint,groundTint;uniform float foot;uniform vec2 texel;varying vec2 vUv;
  void main(){float x=fullCircle>.5?fract(vUv.x):1.-abs(mod(vUv.x*repeats+offset,2.)-1.);vec2 uv=vec2(x,vUv.y);
  vec4 c=texture2D(photo,uv);if(blur>.01){vec2 d=texel*blur*1.2;c=c*.60+texture2D(photo,uv+vec2(d.x,0.))*.20+texture2D(photo,uv-vec2(d.x,0.))*.20;}if(mixed>.5){float x2=1.-abs(mod(vUv.x*repeats*ratio2+offset+.63,2.)-1.);vec4 b=texture2D(photo2,vec2(x2,vUv.y));float a=b.a+c.a*(1.-b.a);c=vec4((b.rgb*b.a+c.rgb*c.a*(1.-b.a))/max(a,.001),a);}
  float alpha=c.a;if(alpha<.025)discard;
  float l=dot(c.rgb,vec3(.2126,.7152,.0722));float g=smoothstep(.015,.14,c.g-max(c.r,c.b));
  if(season>1.5&&season<2.5)c.rgb=mix(c.rgb,vec3(l*1.27,l*.93,l*.55),g*.48);
  if(season>2.5)c.rgb=mix(c.rgb,vec3(l*.84+.10),g*.45);
  c.rgb=mix(c.rgb*tint*tone,sky,haze);float baseFade=1.-smoothstep(0.,foot,vUv.y);c.rgb=mix(c.rgb,groundTint,baseFade*.33);gl_FragColor=vec4(c.rgb,alpha);
  #include <colorspace_fragment>
  }`});
  const mesh=new T.Mesh(new T.CylinderGeometry(1,1,1,mobile?128:256,1,true),mat);mesh.renderOrder=order;mesh.frustumCulled=false;root.add(mesh);rings.push({mesh,u,active:'',request:0,ready:false,error:false});return rings.at(-1);
 }
 const far=ring(-31),near=ring(-30);
 // Same lighting, texture and tone mapping as the surveyed parcel.
 // UVs are in parcel units (the existing map.repeat already encodes tile size).
 const gu={plotHalf:{value:20},radius:{value:200},reach:{value:300},nearRadius:{value:180},farRadius:{value:420},nearOn:{value:1},farOn:{value:1},sky:{value:new T.Color('#b5c5cb')},haze:{value:.12},relief:{value:0}};
 const floorMat=new T.MeshStandardMaterial({color:'#ffffff',side:T.DoubleSide,roughness:.96,metalness:0,fog:false,envMapIntensity:.21});
 floorMat.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,{formaPlotHalf:gu.plotHalf,formaRadius:gu.radius,formaReach:gu.reach,formaNearRadius:gu.nearRadius,formaFarRadius:gu.farRadius,formaNearOn:gu.nearOn,formaFarOn:gu.farOn,formaSky:gu.sky,formaHaze:gu.haze,formaRelief:gu.relief});
  shader.vertexShader='varying vec3 formaGroundWorld;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','formaGroundWorld=(modelMatrix*vec4(transformed,1.0)).xyz;\n#include <project_vertex>');
  shader.fragmentShader='varying vec3 formaGroundWorld; uniform float formaPlotHalf,formaRadius,formaReach,formaNearRadius,formaFarRadius,formaNearOn,formaFarOn,formaHaze,formaRelief; uniform vec3 formaSky;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`
   #include <color_fragment>
   float frDist=length(formaGroundWorld.xz);
   float frEdge=max(abs(formaGroundWorld.x),abs(formaGroundWorld.z));
   if(frEdge<formaPlotHalf-.12||frDist>formaReach)discard;
   float frFade=smoothstep(0.,65.,max(0.,frEdge-formaPlotHalf));
   float frNoise=sin(formaGroundWorld.x*.087)*sin(formaGroundWorld.z*.093)*.038+sin(formaGroundWorld.x*.023+formaGroundWorld.z*.047)*.032;
   float frAngle=atan(formaGroundWorld.z,formaGroundWorld.x);
   float frWobble=sin(frAngle*29.)*1.8+sin(frAngle*71.)*.75;
   float frNear=formaNearOn*exp(-pow((frDist-formaNearRadius+4.+frWobble)/7.,2.));
   float frFar=formaFarOn*exp(-pow((frDist-formaFarRadius+8.+frWobble)/16.,2.));
   float frFoot=max(frNear,frFar);
   float frLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(frLuma),frFade*.12);
   diffuseColor.rgb*=1.+frNoise*frFade;
   diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.80,.86,.68),frFoot*.40);
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
   float frAtmos=smoothstep(formaPlotHalf+12.,max(formaPlotHalf+13.,formaRadius),frDist);
   outgoingLight=mix(outgoingLight,formaSky,frAtmos*min(.24,formaHaze*.45));
   #include <opaque_fragment>
  `);
 };
 floorMat.customProgramCacheKey=()=> 'forma-ground-continuity-r201';
 const floorGeo=new T.PlaneGeometry(2,2);floorGeo.rotateX(-Math.PI/2);
 const floor=new T.Mesh(floorGeo,floorMat);floor.position.y=-.055;floor.name='forma-distant-ground-r201';floor.renderOrder=-60;floor.frustumCulled=false;floor.receiveShadow=true;floor.raycast=()=>{};root.add(floor);
 let uvKey='',lastMap=null;
 function syncGroundMaterial(terrainMaterial,side,reach){
  const map=terrainMaterial?.map||null;
  if(lastMap!==map){lastMap=map;floorMat.map=map;floorMat.needsUpdate=true;}
  if(terrainMaterial){floorMat.color.copy(terrainMaterial.color);floorMat.roughness=terrainMaterial.roughness;floorMat.metalness=terrainMaterial.metalness;floorMat.envMapIntensity=terrainMaterial.envMapIntensity;floorMat.toneMapped=terrainMaterial.toneMapped;}
  const key=side+'|'+reach;if(uvKey!==key){uvKey=key;const uv=floorGeo.attributes.uv,pos=floorGeo.attributes.position;
   for(let i=0;i<uv.count;i++)uv.setXY(i,pos.getX(i)*reach/side+.5,.5-pos.getZ(i)*reach/side);
   uv.needsUpdate=true;
  }
 }
 const size=mobile?'4k':'8k';
 const sets={conifer:['Backdrop004'],deciduous:['Backdrop001'],mixed:['Backdrop004','Backdrop001'],hills:['Backdrop006'],mountains:['Alpine360']};
 function texture(id){
  if(cache.has(id))return cache.get(id);
  const promise=new Promise((resolve,reject)=>{
   const isRelief=['Backdrop006','Alpine360'].includes(id);const url=new URL('./assets/panoramas/'+(isRelief?'r200/':'r197/')+id+'-'+size+(isRelief?'.png':'.webp'),import.meta.url).href;
   texLoader.load(url,t=>{t.colorSpace=T.SRGBColorSpace;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.generateMipmaps=true;t.needsUpdate=true;resolve(t);},undefined,reject);
  });cache.set(id,promise);promise.catch(()=>cache.delete(id));return promise;
 }
 function status(){
  const enabled=rings.filter(r=>r.active&&r.active!=='off');
  if(!enabled.length)onStatus('Окружение выключено');
  else if(enabled.some(r=>r.error))onStatus('Не удалось загрузить лес. Нажмите «Перезагрузить».');
  else if(enabled.every(r=>r.ready))onStatus('Готово · прозрачные фотопанорамы '+size.toUpperCase());
  else onStatus('Загрузка лесных панорам…');
 }
 function load(r,type){
  if(r.active===type)return;r.active=type;r.ready=false;r.error=false;r.mesh.visible=false;const req=++r.request;
  if(type==='off'){status();return;}
  status();
  Promise.all(sets[type].map(texture)).then(a=>{
   if(disposed||req!==r.request)return;
   const t=a[0];r.u.photo.value=t;r.u.texel.value.set(1/t.image.width,1/t.image.height);
   r.u.photo2.value=a[1]||blank;r.u.mixed.value=a.length>1?1:0;r.u.fullCircle.value=type==='mountains'?1:0;
   r.ready=true;apply(current,lastOptions);status();onChange();
  }).catch(()=>{if(!disposed&&req===r.request){r.error=true;status();onChange();}});
 }
 function apply(v,o={}){
  current=normalizePanorama(v);lastOptions=o;
  const {time='day',weather='sunny',fog='#b8c7c4',side=40,mode='3d',camera=null,terrainMaterial=null,tile=1.05}=o;
  const useNear=current.near.type!=='off',useFar=current.far.type!=='off',use=useNear||useFar;
  root.visible=use&&mode!=='2d';
  const minimum=Math.max(side*Math.SQRT2*.5+12,mode==='3d'&&camera?Math.hypot(camera.position.x,camera.position.z)+20:0);
  const rNear=Math.max(current.near.distance,minimum),rFar=Math.max(current.far.distance,minimum+(useNear?100:0),useNear?rNear+100:0);
  const outer=Math.max(useNear?rNear:0,useFar?rFar:0,minimum);
  const sky=new T.Color(fog),light=({day:1,morning:.88,evening:.69,'blue-hour':.38,night:.14})[time]||1;
  const haze=Math.min(.75,current.haze/100+(weather==='fog'?.40:['rain','snow'].includes(weather)?.14:0));
  const season=['summer','spring','autumn','winter'].indexOf(current.season),tint=time==='evening'?'#ffe5c9':time==='night'||time==='blue-hour'?'#afc6ea':'#ffffff';
  for(const [r,p,d,phase,opacity] of [[near,current.near,rNear,0,haze*.55],[far,current.far,rFar,.64,Math.min(.8,haze+.12)]]){
   load(r,p.type);r.mesh.visible=p.type!=='off'&&r.ready;
   r.mesh.scale.set(d,p.height,d);const embed=relief.has(p.type)?Math.max(1.5,p.height*.025):.85;r.mesh.position.y=p.height/2-embed;r.u.foot.value=relief.has(p.type)?.07:.06;r.u.groundTint.value.copy(floorMat.color).multiply(new T.Color('#687a53')).multiplyScalar(light);r.mesh.rotation.y=p.rotation*Math.PI/180;
   const image=r.u.photo.value?.image,ratio=(image?.width||4096)/(image?.height||1024),im2=r.u.photo2.value?.image,ratio2=(im2?.width||4096)/(im2?.height||1024);
   r.u.repeats.value=Math.max(2,Math.round(2*Math.PI*d/(p.height*ratio)/2)*2);
   r.u.ratio2.value=Math.max(2,Math.round(r.u.repeats.value*ratio/ratio2/2)*2)/r.u.repeats.value;
   r.u.offset.value=phase;r.u.haze.value=relief.has(p.type)?Math.min(.65,opacity+.06):opacity;r.u.sky.value.copy(sky);r.u.tone.value=light;r.u.tint.value.set(tint);r.u.season.value=season;r.u.blur.value=current.blur/100;
  }
  floor.visible=use;const reach=outer+Math.max(60,outer*.22);floor.scale.set(reach,1,reach);gu.reach.value=reach;gu.radius.value=outer;gu.plotHalf.value=side*.5;gu.nearRadius.value=rNear;gu.farRadius.value=rFar;gu.nearOn.value=useNear?1:0;gu.farOn.value=useFar?1:0;gu.sky.value.copy(sky);gu.haze.value=haze;gu.relief.value=relief.has(current.far.type)?1:0;syncGroundMaterial(terrainMaterial,side,reach);
  if(camera?.isPerspectiveCamera&&root.visible){const needed=reach*2+100;if(camera.far<needed){camera.far=needed;camera.updateProjectionMatrix();}}
  scene.userData.formaPanorama={...current,near:{...current.near,effectiveDistance:rNear,assetIds:sets[current.near.type]||[],loaded:near.ready},far:{...current.far,effectiveDistance:rFar,assetIds:sets[current.far.type]||[],loaded:far.ready},treeLine:use,groundContinuity:'same-pbr-turf-with-forest-edge-transition',preserveReferenceSkyline:true};
 }
 return {apply,retry(){for(const r of rings)r.active='';apply(current,lastOptions);onChange();},dispose(){disposed=true;for(const r of rings)r.request++;root.traverse(n=>{n.geometry?.dispose();n.material?.dispose();});for(const p of cache.values())p.then(t=>t.dispose()).catch(()=>{});cache.clear();blank.dispose();scene.remove(root);}};
}
export function bindPanoramaPanel(panel,{settings,onUpdate,onRetry}){
 let value=normalizePanorama(settings);const by=id=>panel.querySelector('#panoramaR198'+id);
 const fields=[...['near','far'].flatMap(layer=>['type','distance','height','rotation'].map(k=>[layer,k])),...['blur','haze','season'].map(k=>[null,k])];
 const id=(layer,k)=>layer?layer+k[0].toUpperCase()+k.slice(1):k;
 function sync(){const elevated=relief.has(value.far.type),dist=by('farDistance'),ht=by('farHeight');dist.min=elevated?500:260;dist.max=elevated?2500:1000;ht.min=elevated?45:5;ht.max=elevated?350:40;const hl=panel.querySelector('label[for=panoramaR198farHeight]');if(hl?.firstChild)hl.firstChild.textContent=elevated?'Высота рельефа ':'Высота деревьев ';for(const [layer,k] of fields){const el=by(id(layer,k)),v=layer?value[layer][k]:value[k];if(!el)continue;el.value=String(v);const out=by(id(layer,k)+'Value');if(out)out.textContent=v+({rotation:'°',distance:' м',height:' м',blur:'%',haze:'%'}[k]||'');}for(const layer of ['near','far']){const block=by(layer+'Controls');if(block)block.hidden=value[layer].type==='off';}}
 for(const [layer,k] of fields){const el=by(id(layer,k));if(!el)continue;el.addEventListener(['type','season'].includes(k)?'change':'input',()=>{const patch=layer?{...value[layer],[k]:el.value}:null;if(layer==='far'&&k==='type'&&relief.has(el.value)!==relief.has(value.far.type)){Object.assign(patch,relief.has(el.value)?{distance:el.value==='mountains'?1500:700,height:el.value==='mountains'?220:95}:{distance:420,height:14});}else if(layer==='far'&&k==='type'&&relief.has(el.value)&&el.value!==value.far.type){Object.assign(patch,{distance:el.value==='mountains'?1500:700,height:el.value==='mountains'?220:95});}value=normalizePanorama(layer?{...value,[layer]:patch}:{...value,[k]:el.value});sync();onUpdate(value);});}
 by('reset').onclick=()=>{value=normalizePanorama();sync();onUpdate(value);};by('retry').onclick=onRetry;sync();return {status(m){by('status').textContent=m;}};
}
