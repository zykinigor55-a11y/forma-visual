/* FORMA: lightweight WebGL weather preview, never modifying saved object positions.
 * Exact authored % lives in doc.atmosphere.effects; photographic Nano Banana
 * receives exact values separately. This preview is a fast visual approximation.
 */
import {normalizeWeatherEffects,weatherEffectsVisible} from './forma-landscape-weather-effects.js';
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const randSeed=(seed)=>{let x=seed>>>0;return ()=>((x=(x*1664525+1013904223)>>>0)/4294967296)};
function hashString(v){let h=2166136261>>>0;for(const c of String(v)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
const rgba=(x,y,coverage,random)=>{
 const d=Math.sin(x*.061+Math.sin(y*.083))*Math.cos(y*.063-x*.041)*.21+
  Math.sin(x*.19+y*.15)*Math.cos(y*.14-x*.07)*.12+
  (random()-.5)*.10;
 const threshold=(coverage/100)*1.23-.13;
 const alpha=clamp((threshold-d)*1.9,0,1);
 return Math.round(alpha*226);
};
function snowAtlas(T,doc,coverage){
 const el=document.createElement('canvas');el.width=el.height=128;
 const ctx=el.getContext('2d');if(!ctx)return null;
 const img=ctx.createImageData(128,128),rnd=randSeed(712345);
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){
  const i=(y*128+x)*4,a=rgba(x,y,coverage,rnd);
  img.data[i]=230;img.data[i+1]=236;img.data[i+2]=237;img.data[i+3]=a;
 }
 ctx.putImageData(img,0,0);
 const map=new T.CanvasTexture(el);map.colorSpace=T.SRGBColorSpace;
 map.wrapS=map.wrapT=T.ClampToEdgeWrapping;map.anisotropy=4;
 return map;
}
export function addSnowToPlant(T,group,plant,atmosphere){
 const {snow}=weatherEffectsVisible(atmosphere);
 const controls=normalizeWeatherEffects(atmosphere?.effects);
 const strength=controls.snowTrees;
 const species=String(plant?.catalogId||plant?.type||'');
 const conifer=/pine|spruce|fir|thuja|juniper|cypress|cedar|hemlock/i.test(species);
 if(!snow||strength<3||!conifer||!group||!T.InstancedMesh)return null;
 const count=Math.min(92,Math.round(strength*.82));
 if(!count)return null;
 const h=clamp(Number(plant.height)||7,1,40),width=clamp(Number(plant.diameter||plant.width)||3,.4,15);
 const rnd=randSeed(hashString(plant.id||species));
 const m=new T.MeshStandardMaterial({color:'#DCE5E8',roughness:.94,metalness:0,
  transparent:true,opacity:clamp(.40+strength*.005,0,.90),depthWrite:false});
 const g=new T.SphereGeometry(1,6,4),snowMesh=new T.InstancedMesh(g,m,count),dummy=new T.Object3D();
 for(let i=0;i<count;i++){
  const t=(species.includes('pine')?.48:.15)+rnd()*(species.includes('pine')?.46:.78);
  const radius=(width*.50)*(1-t*.82)*(species.includes('pine')?1.28:1);
  const angle=rnd()*Math.PI*2,rad=radius*(.50+rnd()*.52),length=width*(.025+rnd()*.028);
  dummy.position.set(Math.cos(angle)*rad,h*t+.012,Math.sin(angle)*rad);
  dummy.scale.set(length,.012+rnd()*.027,length*(.49+rnd()*.34));
  dummy.rotation.set(0,rnd()*Math.PI*2,0);dummy.updateMatrix();
  snowMesh.setMatrixAt(i,dummy.matrix);
 }
 snowMesh.instanceMatrix.needsUpdate=true;
 snowMesh.castShadow=false;snowMesh.receiveShadow=true;
 snowMesh.userData.formaWeatherPreview=true;
 group.add(snowMesh);return snowMesh;
}
function addSnowGround(T,root,terrainMesh,intensity){
 if(intensity<2||!terrainMesh)return;
 const map=snowAtlas(T,null,intensity);if(!map)return;
 const geom=terrainMesh.geometry.clone(),positions=geom.getAttribute('position');
 for(let i=0;i<positions.count;i++)positions.setY(i,positions.getY(i)+.028);
 positions.needsUpdate=true;geom.computeBoundingSphere();
 const mat=new T.MeshBasicMaterial({map,transparent:true,opacity:1,depthWrite:false,
  polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,side:T.DoubleSide});
 const mesh=new T.Mesh(geom,mat);mesh.renderOrder=3;mesh.receiveShadow=false;
 mesh.userData.formaWeatherPreview=true;mesh.userData.textures=[map];
 root.add(mesh);
}
function addSnowfall(T,root,site,intensity){
 if(intensity<2)return;
 const rnd=randSeed(81923),count=Math.min(600,Math.round(intensity*5.3));
 const points=[],w=site.width||30,h=site.height||40;
 for(let i=0;i<count;i++){
  points.push((rnd()-.5)*w,.3+rnd()*17,(rnd()-.5)*h);
 }
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(points,3));
 const material=new T.PointsMaterial({color:'#E7ECEC',size:.07+intensity*.0009,
  transparent:true,opacity:Math.min(.72,.25+intensity*.004),
  depthWrite:false,sizeAttenuation:true});
 const mesh=new T.Points(geometry,material);
 mesh.userData.formaWeatherPreview=true;mesh.frustumCulled=false;
 root.add(mesh);
}
function addRain(T,root,site,precipitation){
 if(precipitation<2)return;
 const n=Math.min(500,Math.max(25,Math.round(precipitation*4.5)));
 const rnd=randSeed(91389),verts=[],w=site.width||30,h=site.height||40;
 for(let i=0;i<n;i++){
  const x=(rnd()-.5)*w,z=(rnd()-.5)*h,y=1.5+rnd()*15;
  const l=.15+.29*precipitation/100+rnd()*.17;
  verts.push(x,y,z,x-.044*l,y-l,z+.026*l);
 }
 const geom=new T.BufferGeometry();
 geom.setAttribute('position',new T.Float32BufferAttribute(verts,3));
 const mat=new T.LineBasicMaterial({color:'#BECED9',transparent:true,
  opacity:.08+.31*precipitation/100,depthWrite:false});
 const mesh=new T.LineSegments(geom,mat);
 mesh.userData.formaWeatherPreview=true;mesh.frustumCulled=false;
 root.add(mesh);
}
function addPuddles(T,root,site,groundAt,intensity){
 if(intensity<2)return;
 const count=Math.min(15,Math.round(intensity*.14));
 if(!count)return;
 const mat=new T.MeshPhysicalMaterial({color:'#75858A',roughness:.085,
  metalness:.17,transparent:true,opacity:.10+intensity*.003,
  depthWrite:false,side:T.DoubleSide});
 const rnd=randSeed(372091);const w=site.width||30,h=site.height||40;
 for(let i=0;i<count;i++){
  const x=(rnd()-.5)*w,z=(rnd()-.5)*h;
  // These are transient shader-like 3D puddles, NOT persistent objects.
  // No terrain edits, no saved object IDs and no pickable meshes.
  const r=.3+rnd()*.8;
  const mesh=new T.Mesh(new T.CircleGeometry(r,22),mat);
  mesh.rotation.x=-Math.PI/2;
  mesh.scale.y=.50+rnd()*.55;
  mesh.position.set(x,groundAt(x,z)+.047,z);
  mesh.userData.formaWeatherPreview=true;mesh.renderOrder=2;
  root.add(mesh);
 }
}
export function addWeatherSceneVisuals(T,root,terrainMesh,doc,terrainAt){
 if(!root||!doc)return;
 const state=doc.atmosphere||{},effects=normalizeWeatherEffects(state.effects);
 const {snow,rain}=weatherEffectsVisible(state);
 if(snow){
  addSnowGround(T,root,terrainMesh,effects.snowGround);
  addSnowfall(T,root,doc.site,effects.snowfall);
 }
 if(rain){
  if(state.weather==='rain')addRain(T,root,doc.site,effects.rainIntensity);
  addPuddles(T,root,doc.site,terrainAt,effects.puddles);
 }
}
export function applyWetMaterialResponse(root,atmosphere){
 if(!root)return;
 const effects=normalizeWeatherEffects(atmosphere?.effects),
  {rain}=weatherEffectsVisible(atmosphere);
 const strength=rain?effects.surfaceWetness/100:0;
 const materials=new Set();
 root.traverse?.(object=>{
  if(!object.isMesh||object.userData?.formaWeatherPreview)return;
  const tag=String(object.userData?.architecturePart||'');
  // All real roof/front/terrace constructions and weatherable path/fill
  // assets, but NEVER interiors, glazing, or natural leaves.
  if(!object.userData?.ground&&!object.userData?.formaWeatherableSurface&&
    !(/^alpha-/.test(tag)&&!/interior|glass|pane|gasket|warm-luminaire/.test(tag)))return;
  for(const m of (Array.isArray(object.material)?object.material:[object.material]))
   if(m&&Number.isFinite(m.roughness))materials.add(m);
 });
 for(const m of materials){
  if(!m.userData)m.userData={};
  if(m.userData.formaDryRoughness===undefined)m.userData.formaDryRoughness=m.roughness;
  // No fake mirror-like roof: even at 100%, retain material roughness.
  m.roughness=clamp(m.userData.formaDryRoughness*(1-strength*.52),.105,1);
  m.needsUpdate=true;
 }
}
