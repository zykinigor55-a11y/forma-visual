// R197: transparent photographic tree belts and distant mountain geometry.
import {createPanoramaEnvironment as legacyEnvironment,bindPanoramaPanel as legacyPanel} from './forma-landscape-panorama-r196.js?v=R196';
export const PANORAMAS=[['conifer','Хвойный лес'],['deciduous','Лиственный лес'],['mixed','Смешанный лес'],['village','Посёлок'],['city','Город'],['field','Поле'],['lake','Озеро'],['mountain','Горы'],['snow-mountain','Снежные горы'],['industrial','Промышленная зона'],['park','Парковая зона']];
const forest=new Set(['conifer','deciduous','mixed','mountain','snow-mountain','park']);
const clamp=(x,a,b,d)=>x!==null&&x!==''&&Number.isFinite(Number(x))?Math.max(a,Math.min(b,Number(x))):d;
export function normalizePanorama(v={}){
 v=v||{};return {type:v.type==='off'||PANORAMAS.some(p=>p[0]===v.type)?v.type:'conifer',rotation:clamp(v.rotation,0,360,0),radius:clamp(v.radius,50,1000,200),blur:clamp(v.blur,0,100,8),haze:clamp(v.haze,0,100,15),season:['summer','spring','autumn','winter'].includes(v.season)?v.season:'summer',mountains:!!v.mountains};
}
export function createPanoramaEnvironment(T,scene,{mobile=false,onChange=()=>{},onStatus=()=>{}}={}){
 const previous=legacyEnvironment(T,scene,{mobile,onChange,onStatus:m=>{if(!forest.has(current.type))onStatus(m)}});
 let current=normalizePanorama(),loaded=false,request=0,active='',lastOptions={};
 const root=new T.Group();root.name='forma-alpha-horizon-r197';root.visible=false;root.userData.formaDistantBackground=true;scene.add(root);
 const cache=new Map(),rings=[];
 const texLoader=new T.TextureLoader();texLoader.setCrossOrigin('anonymous');
 const blank=new T.DataTexture(new Uint8Array([0,0,0,0]),1,1,T.RGBAFormat);blank.needsUpdate=true;
 function ring(order){
  const u={photo:{value:blank},repeats:{value:2},offset:{value:0},haze:{value:.1},sky:{value:new T.Color('#b5c5cb')},tone:{value:1},tint:{value:new T.Color('#ffffff')},season:{value:0},blur:{value:0},texel:{value:new T.Vector2(1/4096,1/1024)}};
  const mat=new T.ShaderMaterial({uniforms:u,side:T.BackSide,transparent:true,depthWrite:false,depthTest:true,toneMapped:false,
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D photo;uniform float repeats,offset,haze,tone,season,blur;uniform vec3 sky,tint;uniform vec2 texel;varying vec2 vUv;
  void main(){float x=1.-abs(mod(vUv.x*repeats+offset,2.)-1.);vec2 uv=vec2(x,vUv.y);
  vec4 c=texture2D(photo,uv);if(blur>.01){vec2 d=texel*blur*1.2;c=c*.60+texture2D(photo,uv+vec2(d.x,0.))*.20+texture2D(photo,uv-vec2(d.x,0.))*.20;}
  float alpha=c.a*smoothstep(0.,.045,vUv.y);if(alpha<.025)discard;
  float l=dot(c.rgb,vec3(.2126,.7152,.0722));float g=smoothstep(.015,.14,c.g-max(c.r,c.b));
  if(season>1.5&&season<2.5)c.rgb=mix(c.rgb,vec3(l*1.27,l*.93,l*.55),g*.48);
  if(season>2.5)c.rgb=mix(c.rgb,vec3(l*.84+.10),g*.45);
  c.rgb=mix(c.rgb*tint*tone,sky,haze);gl_FragColor=vec4(c.rgb,alpha);
  #include <colorspace_fragment>
  }`});
  const mesh=new T.Mesh(new T.CylinderGeometry(1,1,1,mobile?128:256,1,true),mat);mesh.renderOrder=order;mesh.frustumCulled=false;root.add(mesh);rings.push({mesh,u});return rings.at(-1);
 }
 const far=ring(-31),near=ring(-30);
 // Two lightweight mountain ridges. Real geometry, never a stretched photo.
 const mountains=new T.Group();mountains.name='forma-distant-mountain-r197';root.add(mountains);
 const ridgeLayers=[];
 for(let layer=0;layer<2;layer++){
  const N=mobile?180:320,positions=[],colors=[],indices=[];
  const color=new T.Color(),base=new T.Color('#45574f'),rock=new T.Color('#7d827b'),snow=new T.Color('#e2e7e8');
  const height=a=>.23+.24*Math.pow(.5+.5*Math.sin(a*3+layer*1.8),1.5)+.19*Math.pow(.5+.5*Math.cos(a*7+.9+layer),2)+.09*Math.sin(a*19+layer*2)+.035*Math.sin(a*47+layer);
  for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,h=Math.max(.11,height(a)),peak=1+.07*Math.sin(a*5+layer);
   for(let j=0;j<4;j++){const f=j/3,r=[.56,.70,.87,1][j]*peak,y=h*[0,.23,.64,1][j];positions.push(Math.cos(a)*r,y,Math.sin(a)*r);
    color.copy(base).lerp(rock,f*.75).multiplyScalar(.87+.16*Math.sin(a*11+f*8));colors.push(color.r,color.g,color.b);}
   if(i<N)for(let j=0;j<3;j++){const k=i*4+j;indices.push(k,k+4,k+1,k+1,k+4,k+5);}
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();
  const mat=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,fog:false,toneMapped:false});const m=new T.Mesh(geo,mat);m.frustumCulled=false;m.renderOrder=-80+layer;mountains.add(m);ridgeLayers.push({m,baseColors:colors});
 }
 // Seamless terrain extension, reusing the actual project turf texture.
 const gu={photo:{value:blank},hasPhoto:{value:0},tint:{value:new T.Color('#ffffff')},base:{value:new T.Color('#687950')},sky:{value:new T.Color('#b5c5cb')},half:{value:20},radius:{value:200},tile:{value:1.05},haze:{value:.12},light:{value:1}};
 const floorMat=new T.ShaderMaterial({uniforms:gu,side:T.DoubleSide,toneMapped:false,
 vertexShader:`varying vec3 world;void main(){world=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}`,
 fragmentShader:`uniform sampler2D photo;uniform vec3 tint,base,sky;uniform float half,radius,tile,haze,hasPhoto,light;varying vec3 world;void main(){float edge=max(abs(world.x),abs(world.z));float d=length(world.xz);if(edge<half-.015||d>radius)discard;vec3 c=base;if(hasPhoto>.5)c=texture2D(photo,fract(vec2(world.x+half,half-world.z)/tile)).rgb*tint*light;float t=smoothstep(half+4.,radius*.85,d);c=mix(c,base,t*.75);c=mix(c,sky,t*haze*.70);gl_FragColor=vec4(c,1.);
 #include <colorspace_fragment>
 }`});
 const floor=new T.Mesh(new T.PlaneGeometry(2,2),floorMat);floor.rotation.x=-Math.PI/2;floor.position.y=-.035;floor.renderOrder=-60;floor.frustumCulled=false;root.add(floor);
 const sets={conifer:['Backdrop004','Backdrop001'],deciduous:['Backdrop001','Backdrop004'],mixed:['Backdrop004','Backdrop001'],mountain:['Backdrop004','Backdrop001'],'snow-mountain':['Backdrop004','Backdrop001'],park:['Backdrop001','Backdrop004']};
 const size=mobile?'4k':'8k';
 function texture(id){
  if(cache.has(id))return cache.get(id);
  const urls=[new URL('./assets/panoramas/r197/'+id+'-'+size+'.webp',import.meta.url).href,'https://acg-media.struffelproductions.com/file/ambientCG-Web/media/thumbnail/2048-WEBP/'+id+'.webp'];
  const promise=new Promise((resolve,reject)=>{
   const next=i=>{if(i>=urls.length){reject(Error(id));return;}texLoader.load(urls[i],t=>{
    t.colorSpace=T.SRGBColorSpace;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.generateMipmaps=true;t.needsUpdate=true;
    resolve({t,preview:i>0});},undefined,()=>next(i+1));};next(0);
  });cache.set(id,promise);promise.catch(()=>cache.delete(id));return promise;
 }
 function setTexture(r,x){r.u.photo.value=x.t;r.u.texel.value.set(1/x.t.image.width,1/x.t.image.height);}
 function load(type){
  if(active===type)return;active=type;loaded=false;near.mesh.visible=far.mesh.visible=false;const req=++request;
  if(!forest.has(type))return;
  onStatus('Загрузка прозрачных лесных панорам…');
  Promise.all(sets[type].map(texture)).then(a=>{if(req!==request)return;setTexture(near,a[0]);setTexture(far,a[1]);loaded=true;near.mesh.visible=far.mesh.visible=true;onStatus(a.some(x=>x.preview)?'Временное превью ambientCG · HD-текстуры готовятся в GitHub':'Прозрачные фотопанорамы ambientCG · '+size.toUpperCase());apply(current,lastOptions);onChange();}).catch(()=>{if(req===request){onStatus('PNG-панорамы недоступны. Нажмите «Перезагрузить».');onChange();}});
 }
 function apply(v,o={}){
  current=normalizePanorama(v);lastOptions=o;
  const {time='day',weather='sunny',fog='#b8c7c4',side=40,mode='3d',camera=null,terrainMaterial=null,tile=1.05}=o;
  const use=forest.has(current.type);const mountainsOn=current.mountains||['mountain','snow-mountain'].includes(current.type);
  previous.apply(use?{...current,type:'off'}:current,o);
  root.visible=(use||mountainsOn)&&current.type!=='off'&&mode!=='2d';mountains.visible=mountainsOn&&root.visible;
  const radius=Math.max(current.radius,side*.85+20,mode==='3d'&&camera?Math.hypot(camera.position.x,camera.position.z)+30:0);
  const outer=radius*1.65,sky=new T.Color(fog),light=({day:1,morning:.88,evening:.69,'blue-hour':.38,night:.14})[time]||1;
  const haze=Math.min(.75,current.haze/100+(weather==='fog'?.40:['rain','snow'].includes(weather)?.14:0));
  const season=['summer','spring','autumn','winter'].indexOf(current.season),tint=time==='evening'?'#ffe5c9':time==='night'||time==='blue-hour'?'#afc6ea':'#ffffff';
  for(const [r,d,height,phase,opacity] of [[near,radius,22,0,haze*.55],[far,outer,18,.64,Math.min(.8,haze+.12)]]){
   r.mesh.visible=use&&loaded;r.mesh.scale.set(d,height,d);r.mesh.position.y=height/2-.30;r.mesh.rotation.y=current.rotation*Math.PI/180;
   const image=r.u.photo.value?.image,ratio=(image?.width||4096)/(image?.height||1024);
   r.u.repeats.value=Math.max(2,Math.round(2*Math.PI*d/(height*ratio)/2)*2);r.u.offset.value=phase;r.u.haze.value=opacity;r.u.sky.value.copy(sky);r.u.tone.value=light;r.u.tint.value.set(tint);r.u.season.value=season;r.u.blur.value=current.blur/100;
  }
  floor.visible=use;floor.scale.setScalar(outer*1.02);gu.radius.value=outer*1.02;gu.half.value=side*.5;gu.photo.value=terrainMaterial?.map||blank;gu.hasPhoto.value=terrainMaterial?.map?1:0;gu.tint.value.copy(terrainMaterial?.color||new T.Color('#fff'));gu.tile.value=tile;gu.sky.value.copy(sky);gu.haze.value=haze;gu.light.value=light;
  gu.base.value.set(({summer:'#6b7950',spring:'#758458',autumn:'#8b805f',winter:'#b7c1c2'})[current.season]).multiplyScalar(light);
  const mountainRadius=Math.max(1100,outer*2.2);mountains.rotation.y=current.rotation*Math.PI/180;
  for(let i=0;i<ridgeLayers.length;i++){const {m,baseColors}=ridgeLayers[i];const d=mountainRadius*(i?1:1.5);m.scale.set(d,d*.46,d);const a=m.geometry.attributes.color;
   const key=[current.type,current.season,time,weather,Math.round(haze*100),fog?.getHexString?.()||String(fog)].join('|');if(m.userData.colorKey!==key){m.userData.colorKey=key;const c=new T.Color(),snow=new T.Color('#e1e6e8');for(let k=0;k<a.count;k++){c.setRGB(baseColors[k*3],baseColors[k*3+1],baseColors[k*3+2]);if(current.type==='snow-mountain'||current.season==='winter'){const y=m.geometry.attributes.position.getY(k);c.lerp(snow,Math.max(0,Math.min(.96,(y-.19)*5)));}c.multiplyScalar(light).lerp(sky,Math.min(.88,haze+.28+(i?0:.14)));a.setXYZ(k,c.r,c.g,c.b);}a.needsUpdate=true;}
  }
  if(camera?.isPerspectiveCamera&&root.visible){const needed=mountainsOn?mountainRadius*2.2+Math.hypot(camera.position.x,camera.position.z):outer*2+100;if(camera.far<needed){camera.far=needed;camera.updateProjectionMatrix();}}
  load(current.type);
  scene.userData.formaPanorama={...current,label:PANORAMAS.find(p=>p[0]===current.type)?.[1]||'Без окружения',effectiveRadius:radius,treeLine:use,treesNearHeightM:22,treesFarHeightM:18,farRadiusM:outer,mountains:mountainsOn,mountainRadiusM:mountainsOn?mountainRadius:null};
 }
 return {apply,retry(){cache.clear();active='';if(forest.has(current.type))load(current.type);else previous.retry();},dispose(){request++;previous.dispose();root.traverse(n=>{n.geometry?.dispose();n.material?.dispose();});for(const p of cache.values())p.then(x=>x.t.dispose()).catch(()=>{});blank.dispose();scene.remove(root);}};
}
export function bindPanoramaPanel(panel,{settings,onUpdate,onRetry}){
 let value=normalizePanorama(settings);const by=id=>panel.querySelector('#panoramaR193'+id);
 const keys=['type','rotation','radius','blur','haze','season','mountains'];
 function sync(){for(const k of keys){const el=by(k);if(!el)continue;if(k==='mountains')el.checked=value[k];else el.value=String(value[k]);const out=by(k+'Value');if(out)out.textContent=value[k]+({rotation:'°',radius:' м',blur:'%',haze:'%'}[k]||'');}}
 for(const k of keys){const el=by(k);if(!el)continue;el.addEventListener(['type','season','mountains'].includes(k)?'change':'input',()=>{value=normalizePanorama({...value,[k]:k==='mountains'?el.checked:el.value});sync();onUpdate(value);});}
 by('reset').onclick=()=>{value=normalizePanorama();sync();onUpdate(value);};by('retry').onclick=onRetry;sync();return {status(m){by('status').textContent=m;}};
}
