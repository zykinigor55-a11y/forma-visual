/* FORMA: lightweight WebGL weather preview, never modifying saved object positions.
 * Exact authored % lives in doc.atmosphere.effects; photographic Nano Banana
 * receives exact values separately. This preview is a fast visual approximation.
 */
import {normalizeWeatherEffects,weatherEffectsVisible} from './forma-landscape-weather-effects.js';
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const randSeed=(seed)=>{let x=seed>>>0;return ()=>((x=(x*1664525+1013904223)>>>0)/4294967296)};
function hashString(v){let h=2166136261>>>0;for(const c of String(v)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
// R242: deterministic smooth multiscale snow cover, no sparkle.
function snowNoise(x,z){
 const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz;
 const u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);
 const h=(a,b)=>{let n=Math.imul(a+1337,374761393)+Math.imul(b+7919,668265263)|0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
 return (h(ix,iz)*(1-u)+h(ix+1,iz)*u)*(1-v)+(h(ix,iz+1)*(1-u)+h(ix+1,iz+1)*u)*v;
}
function snowField(x,z){return .62*snowNoise(x*.65,z*.65)+.26*snowNoise(x*2.1+12,z*2.1)+.12*snowNoise(x*6.4,z*6.4+23);}
function snowMask(x,z,p){if(p>=.999)return 1;if(p<=0)return 0;return clamp((p-snowField(x,z)+.07)/.14,0,1);}
function snowAtlas(T,coverage,side){
 const size=512,el=document.createElement('canvas');el.width=el.height=size;const ctx=el.getContext('2d');if(!ctx)return null;
 const img=ctx.createImageData(size,size),p=coverage/100;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const wx=(x/(size-1)-.5)*side,wz=(.5-y/(size-1))*side;const mask=snowMask(wx,wz,p);const v=Math.round(224+14*snowNoise(wx*3.2,wz*3.2)+6*snowNoise(wx*13.7,wz*13.7));const i=(y*size+x)*4;img.data[i]=v;img.data[i+1]=v+2;img.data[i+2]=v+3;img.data[i+3]=Math.round(mask*255);}
 ctx.putImageData(img,0,0);const t=new T.CanvasTexture(el);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
}
function snowMicroR242(T,side){
 const size=128,data=new Uint8Array(size*size*4);
 // Seamless matte granular height; no specular noise or animated glints.
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const a=x/size*Math.PI*2,b=y/size*Math.PI*2;let n=0;for(let k=1;k<=6;k++){const f=k*2+1;n+=Math.sin(a*f+b*(k+2)+k*1.73)*Math.cos(b*f-a*(k+1)+k*.7)/(k+1);}const v=Math.round(clamp(128+40*n,0,255));data.set([v,v,v,255],(y*size+x)*4);}
 const t=new T.DataTexture(data,size,size,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(side/.85,side/.85);t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;
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
function addSnowGround(T,root,terrainMesh,effects){
 const intensity=effects.snowGround;if(intensity<=0||!terrainMesh)return;
 const geom=terrainMesh.geometry.clone(),positions=geom.getAttribute('position');geom.computeBoundingBox();
 const side=Math.max(1,geom.boundingBox.max.x-geom.boundingBox.min.x,geom.boundingBox.max.z-geom.boundingBox.min.z);
 const map=snowAtlas(T,intensity,side);if(!map){geom.dispose();return;}const micro=snowMicroR242(T,side);
 const depth=effects.snowDepth/100,relief=effects.snowRelief/100,drifts=effects.snowDrifts/100,p=intensity/100;
 for(let i=0;i<positions.count;i++){const x=positions.getX(i),z=positions.getZ(i),mask=snowMask(x,z,p);
  const swell=Math.pow(snowNoise(x*.29+13,z*.29),2.4),rough=snowNoise(x*1.45,z*1.45+17)-.5;
  const layer=.003+Math.max(0,depth*(.76+.42*relief*rough)+drifts*depth*1.05*swell)*mask;
  positions.setY(i,positions.getY(i)+layer);
 }
 positions.needsUpdate=true;geom.computeVertexNormals();geom.computeBoundingBox();geom.computeBoundingSphere();
 const mat=new T.MeshStandardMaterial({map,bumpMap:micro,bumpScale:.006+.028*relief,roughness:1,metalness:0,color:'#ffffff',envMapIntensity:.32,alphaTest:.5,transparent:false,depthWrite:true,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,side:T.DoubleSide});
 const mesh=new T.Mesh(geom,mat);mesh.name='forma-settled-ground-snow-r242';mesh.receiveShadow=true;mesh.castShadow=false;mesh.raycast=()=>{};
 mesh.userData.formaWeatherPreview=true;mesh.userData.textures=[map,micro];root.add(mesh);
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
 mesh.userData.formaWeatherPreview=true;mesh.userData.livePrecipitationR217={kind:'snow',initial:Float32Array.from(points),width:w,depth:h};mesh.frustumCulled=false;
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
 mesh.userData.formaWeatherPreview=true;mesh.userData.livePrecipitationR217={kind:'rain',initial:Float32Array.from(verts),width:w,depth:h};mesh.frustumCulled=false;
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
  addSnowGround(T,root,terrainMesh,effects);
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

/** Time-based precipitation, no geometry rebuild while recording. */
export function tickPrecipitationR217(root,seconds,wind,groundAt){
 if(!root)return false;
 let active=false;
 const wrap=(v,n)=>((v+n/2)%n+n)%n-n/2;
 for(const mesh of root.children){
  const p=mesh.userData.livePrecipitationR217;if(!p||!mesh.visible)continue;
  const a=mesh.geometry.attributes.position.array,base=p.initial,rain=p.kind==='rain',stride=rain?6:3;
  const w=Math.max(1,p.width),d=Math.max(1,p.depth),strength=Math.max(0,Math.min(1,wind/100));
  for(let i=0;i<a.length;i+=stride){
   const seed=i*.173,fall=rain?7.5+1.8*Math.sin(seed):.48+.32*(.5+.5*Math.sin(seed));
   const dx=seconds*strength*(rain?3.4:1.3),dz=seconds*strength*(rain?1.15:.45);
   const x=wrap(base[i]+dx+(rain?0:.24*Math.sin(seconds*.8+seed)),w);
   const z=wrap(base[i+2]+dz+(rain?0:.18*Math.cos(seconds*.6+seed)),d);
   const y=groundAt(x,z)+.15+(((base[i+1]-seconds*fall)%17)+17)%17;
   a[i]=x;a[i+1]=y;a[i+2]=z;
   if(rain){const l=Math.max(.08,base[i+1]-base[i+4]);a[i+3]=x-l*strength*.43;a[i+4]=y-l;a[i+5]=z-l*strength*.15;}
  }
  mesh.geometry.attributes.position.needsUpdate=true;active=true;
 }
 return active;
}
