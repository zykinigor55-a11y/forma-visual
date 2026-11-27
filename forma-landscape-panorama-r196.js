// FORMA R196: distant 360 degree photographic environment. Poly Haven CC0.
export const PANORAMAS=[["conifer","Хвойный лес","steinbach_field"],["deciduous","Лиственный лес","lythwood_field"],["mixed","Смешанный лес","suburban_field_01"],["village","Посёлок","small_rural_road"],["city","Город","hotel_rooftop_balcony"],["field","Поле","suburban_field_01"],["lake","Озеро","radkow_lake"],["mountain","Холмы и горы","golden_gate_hills"],["industrial","Промышленная зона","overcast_industrial_courtyard"],["park","Парковая зона","green_point_park"]];
export const PANORAMA_DEFAULTS=Object.freeze({type:'conifer',rotation:0,radius:200,blur:8,haze:15,season:'summer'});
const clamp=(x,min,max,d)=>Number.isFinite(Number(x))&&x!==null?Math.max(min,Math.min(max,Number(x))):d;
export function normalizePanorama(v={}){
 v=v||{};
 return {type:v.type==='off'||PANORAMAS.some(p=>p[0]===v.type)?v.type:'conifer',rotation:clamp(v.rotation,0,360,0),radius:clamp(v.radius,50,1000,200),blur:clamp(v.blur,0,100,8),haze:clamp(v.haze,0,100,15),season:['summer','spring','autumn','winter'].includes(v.season)?v.season:'summer'};
}
export function createPanoramaEnvironment(T,scene,{mobile=false,onChange=()=>{},onStatus=()=>{}}={}){
 const group=new T.Group();group.name='forma-panorama-r193';group.userData.formaDistantBackground=true;group.visible=false;scene.add(group);
 const u={photo:{value:null},hazeColor:{value:new T.Color('#b8c7c4')},haze:{value:.15},blur:{value:.08},texel:{value:new T.Vector2(1/2048,1/1024)},brightness:{value:1},season:{value:0},tint:{value:new T.Color('#ffffff')},groundHalf:{value:20},groundColor:{value:new T.Color('#687952')},radius:{value:200},groundPhoto:{value:null},hasGroundPhoto:{value:0},groundTint:{value:new T.Color('#ffffff')},groundTile:{value:1.05}};
 const material=new T.ShaderMaterial({uniforms:u,side:T.BackSide,transparent:true,depthWrite:false,depthTest:true,toneMapped:false,fog:false,
 vertexShader:`varying vec2 vUv;varying vec3 vWorld;void main(){vUv=uv;vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`,
 fragmentShader:`uniform sampler2D photo;uniform vec3 hazeColor,tint,groundColor;uniform vec2 texel;uniform float haze,blur,brightness,season;varying vec2 vUv;
 vec3 samplePhoto(vec2 p){return texture2D(photo,vec2(fract(p.x),clamp(p.y,.02,.98))).rgb;}
 void main(){
 float elevation=atan(-.075+vUv.y*.255);vec2 p=vec2(vUv.x,.5+elevation/3.14159265);
 vec2 d=texel*(blur*2.);
 vec3 c=samplePhoto(p)*.40+(samplePhoto(p+vec2(d.x,0.))+samplePhoto(p-vec2(d.x,0.))+samplePhoto(p+vec2(0.,d.y))+samplePhoto(p-vec2(0.,d.y)))*.15;
 float lum=dot(c,vec3(.2126,.7152,.0722));
 float vegetation=smoothstep(.005,.10,c.g-max(c.r,c.b));
 if(season>1.5&&season<2.5)c=mix(c,vec3(lum*1.34,lum*.94,lum*.53),vegetation*.64);
 if(season>2.5)c=mix(c,vec3(lum)*.58+vec3(.13,.15,.17),vegetation*.78);
 if(season>.5&&season<1.5)c=mix(c,vec3(lum*.93,lum*1.08,lum*.83),vegetation*.30);
 c=mix(c,vec3(lum),.08);c=c*tint*brightness;
 float skyLike=smoothstep(.06,.25,lum)*(1.-smoothstep(.02,.15,max(c.r,max(c.g,c.b))-min(c.r,min(c.g,c.b))));
 float top=1.-smoothstep(.54,.98,vUv.y);
 top*=1.-skyLike*smoothstep(.35,.85,vUv.y)*.70;
 c=mix(c,hazeColor,clamp(haze*.40,0.,.85));
 gl_FragColor=vec4(c,top*smoothstep(.03,.30,vUv.y));
 #include <colorspace_fragment>
 }`});
 const ring=new T.Mesh(new T.CylinderGeometry(1,1,.255,mobile?96:192,1,true),material);ring.position.y=16;ring.renderOrder=-70;ring.frustumCulled=false;ring.name='forma-photo-horizon';group.add(ring);
 // One distant ground quad bridges the square parcel and horizon; no trees,
 // buildings, terrain collision geometry or extra shadows are created.
 const floorMat=new T.ShaderMaterial({uniforms:u,side:T.DoubleSide,depthWrite:true,toneMapped:false,
 vertexShader:`varying vec3 vWorld;void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`,
 fragmentShader:`uniform vec3 groundColor,hazeColor,groundTint;uniform float groundHalf,radius,haze,hasGroundPhoto,groundTile;uniform sampler2D groundPhoto;varying vec3 vWorld;
 void main(){float a=max(abs(vWorld.x),abs(vWorld.z));float d=length(vWorld.xz);if(d>radius*1.01)discard;float n=sin(vWorld.x*.13)*sin(vWorld.z*.17)*.035;vec3 nearColor=groundColor;if(hasGroundPhoto>.5){vec3 g=texture2D(groundPhoto,fract((vWorld.xz+vec2(groundHalf))/groundTile)).rgb;nearColor=mix(groundColor,g*groundTint,.86);}float transition=smoothstep(groundHalf+3.,radius*.90,d);vec3 c=mix(nearColor*(1.+n),mix(groundColor,hazeColor,haze*.65),transition);gl_FragColor=vec4(c,1.);
 #include <colorspace_fragment>
 }`});
 const floor=new T.Mesh(new T.PlaneGeometry(2,2),floorMat);floor.rotation.x=-Math.PI/2;floor.position.y=-.075;floor.name='forma-distant-ground';floor.renderOrder=-71;floor.frustumCulled=false;scene.add(floor);
 floor.visible=false;floor.userData.formaDistantBackground=true;
 let settings=normalizePanorama(),active='',serial=0,tex=null,view='3d',loaded=false;
 const loader=new T.TextureLoader();loader.setCrossOrigin('anonymous');
 function show(){group.visible=floor.visible=loaded&&settings.type!=='off'&&view!=='2d';}
 function load(type){
  if(type===active)return;active=type;const request=++serial;loaded=false;show();
  if(type==='off'){tex?.dispose();tex=null;u.photo.value=null;onStatus('Окружение выключено');return;}
  const asset=PANORAMAS.find(p=>p[0]===type);
  if(!asset)return;
  onStatus('Загрузка фотопанорамы…');
  const base='https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/'+asset[2]+'.jpg';
  // Actual 2:1 equirectangular original, never a thumbnail or preview image.
  const candidates=[new URL('./assets/panoramas/r196-'+type+(mobile?'-mobile':'-desktop')+'.webp',import.meta.url).href,base,...(type==='conifer'?['https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/suburban_field_01.jpg']:[])];
  const next=i=>{
   if(request!==serial)return;
   if(i>=candidates.length){onStatus('Фотопанорама HD недоступна. Проверьте соединение и нажмите «Перезагрузить».');onChange();return;}
   loader.load(candidates[i],t=>{
    if(request!==serial){t.dispose();return;}
    const source=t.image,w=source.width,h=source.height;
    if(w<2048||Math.abs(w/h-2)>.06){t.dispose();next(i+1);return;}
    const target=mobile?4096:8192;
    if(w>target){const c=document.createElement('canvas');c.width=target;c.height=target/2;const ctx=c.getContext('2d');ctx.imageSmoothingQuality='high';ctx.drawImage(source,0,0,c.width,c.height);t.dispose();t=new T.CanvasTexture(c);}
    tex?.dispose();tex=t;t.colorSpace=T.SRGBColorSpace;t.wrapS=T.RepeatWrapping;t.wrapT=T.ClampToEdgeWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.needsUpdate=true;
    u.photo.value=t;u.texel.value.set(1/Math.max(1,t.image.width),1/Math.max(1,t.image.height));loaded=true;show();
    onStatus('Готово · '+t.image.width+' × '+t.image.height+' · Poly Haven CC0');onChange();
   },undefined,()=>next(i+1));
  };next(0);
 }
 function apply(v,{time='day',fog='#b8c7c4',weather='sunny',side=40,mode='3d',camera=null,terrainMaterial=null,tile=1.05}={}){
  settings=normalizePanorama(v);view=mode;
  const radius=Math.max(settings.radius,side*.80+10,mode==='3d'&&camera?Math.hypot(camera.position.x,camera.position.z)+15:0);
  ring.scale.setScalar(radius);ring.position.y=radius*.0525;ring.rotation.y=settings.rotation*Math.PI/180;floor.scale.setScalar(radius);
  u.groundHalf.value=side*.5-.03;u.groundPhoto.value=terrainMaterial?.map||null;u.hasGroundPhoto.value=terrainMaterial?.map?1:0;u.groundTint.value.copy(terrainMaterial?.color||new T.Color('#ffffff'));u.groundTile.value=Math.max(.15,tile);u.radius.value=radius;u.hazeColor.value.set(fog);u.blur.value=settings.blur/100;
  u.haze.value=Math.min(.95,settings.haze/100+(weather==='fog'?.38:weather==='rain'||weather==='snow'?.13:0));
  u.season.value=['summer','spring','autumn','winter'].indexOf(settings.season);
  u.brightness.value=({day:1,morning:.90,evening:.72,'blue-hour':.39,night:.13})[time]||1;
  u.tint.value.set(time==='evening'?'#ffe7d2':time==='blue-hour'||time==='night'?'#a1b7dd':'#ffffff');
  u.groundColor.value.set(({summer:'#6c7b51',spring:'#79875b',autumn:'#8e8060',winter:'#b7c1c2'})[settings.season]).multiplyScalar(u.brightness.value);
  if(settings.type!=='off'&&camera?.isPerspectiveCamera&&camera.far<radius*2.4+100){camera.far=radius*2.4+100;camera.updateProjectionMatrix();}
  load(settings.type);show();
  scene.userData.formaPanorama={...settings,label:PANORAMAS.find(p=>p[0]===settings.type)?.[1]||'Без окружения',effectiveRadius:radius};
 }
 return {apply,retry(){active='';load(settings.type)},dispose(){serial++;tex?.dispose();ring.geometry.dispose();floor.geometry.dispose();material.dispose();floorMat.dispose();scene.remove(group,floor);}};
}
export function bindPanoramaPanel(panel,{settings,onUpdate,onRetry}){
 const by=id=>panel.querySelector('#'+id);
 const sync=v=>{for(const k of ['type','rotation','radius','blur','haze','season']){const el=by('panoramaR193'+k);if(el)el.value=String(v[k]);const out=by('panoramaR193'+k+'Value');if(out)out.textContent=v[k]+({rotation:'°',radius:' м',blur:'%',haze:'%'}[k]||'');}};
 let value=normalizePanorama(settings);sync(value);
 for(const k of ['type','rotation','radius','blur','haze','season']){
  const el=by('panoramaR193'+k);el.addEventListener(k==='type'||k==='season'?'change':'input',()=>{value=normalizePanorama({...value,[k]:el.value});sync(value);onUpdate(value);});
 }
 by('panoramaR193reset').onclick=()=>{value=normalizePanorama();sync(value);onUpdate(value);};
 by('panoramaR193retry').onclick=onRetry;
 return {status(message){by('panoramaR193status').textContent=message;}};
}
