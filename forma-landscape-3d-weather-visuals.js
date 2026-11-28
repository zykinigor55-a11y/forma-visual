/* FORMA: lightweight WebGL weather preview, never modifying saved object positions.
 * Exact authored % lives in doc.atmosphere.effects; photographic Nano Banana
 * receives exact values separately. This preview is a fast visual approximation.
 */
import {normalizeWeatherEffects,weatherEffectsVisible} from './forma-landscape-weather-effects.js?v=R244';
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
// R248: distance to the actual paving boundary, including flat end caps.
// Only the outer edges of a ribbon are used; internal cross-sections are not boundaries.
function pathDistanceR244(paths){
 const cell=2,grid=new Map(),pad=1.4;
 const bin=(points,kind)=>{const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minZ=Math.min(...points.map(p=>p.z)),maxZ=Math.max(...points.map(p=>p.z));const item={points,kind};for(let ix=Math.floor((minX-pad)/cell);ix<=Math.floor((maxX+pad)/cell);ix++)for(let iz=Math.floor((minZ-pad)/cell);iz<=Math.floor((maxZ+pad)/cell);iz++){const k=ix+':'+iz;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(item);}};
 for(const rows of paths||[]){if(rows.length<2)continue;const edge=rows.map((r,i)=>{if(Number.isFinite(r.lx)&&Number.isFinite(r.rx))return [{x:r.lx,z:r.lz},{x:r.rx,z:r.rz}];const a=rows[Math.max(0,i-1)],b=rows[Math.min(rows.length-1,i+1)],dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz)||1;return [{x:r.x-dz/l*r.w,z:r.z+dx/l*r.w},{x:r.x+dz/l*r.w,z:r.z-dx/l*r.w}];});
 for(let i=1;i<edge.length;i++){const a=edge[i-1],b=edge[i];bin([a[0],a[1],b[1],b[0]],'face');bin([a[0],b[0]],'edge');bin([a[1],b[1]],'edge');}bin(edge[0],'edge');bin(edge[edge.length-1],'edge');}
 const seg=(x,z,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,t=clamp(((x-a.x)*dx+(z-a.z)*dz)/Math.max(1e-10,dx*dx+dz*dz),0,1);return Math.hypot(x-a.x-t*dx,z-a.z-t*dz);};
 return (x,z)=>{let d=Infinity,inside=false;for(const item of grid.get(Math.floor(x/cell)+':'+Math.floor(z/cell))||[]){const p=item.points;if(item.kind==='edge'){d=Math.min(d,seg(x,z,p[0],p[1]));continue;}let hit=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)hit=!hit;}inside=inside||hit;}return inside?-d:d;};
}
function smoothR248(x){x=clamp(x,0,1);return x*x*(3-2*x);}
function clearMaskR244(d,clear){return 1-clear*(1-smoothR248((d+.22)/.14));}
function snowAtlas(T,coverage,side,distance,clear){
 const size=side<=55?768:512,el=document.createElement('canvas');el.width=el.height=size;const ctx=el.getContext('2d');if(!ctx)return null;
 const img=ctx.createImageData(size,size),p=coverage/100;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const wx=(x/(size-1)-.5)*side,wz=(.5-y/(size-1))*side;const mask=snowMask(wx,wz,p)*clearMaskR244(distance(wx,wz),clear);const v=Math.round(220+22*snowNoise(wx*3.2,wz*3.2)+9*snowNoise(wx*13.7,wz*13.7));const i=(y*size+x)*4;img.data[i]=v;img.data[i+1]=v+2;img.data[i+2]=v+3;img.data[i+3]=Math.round(mask*255);}
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
function addSnowGround(T,root,terrainMesh,effects,paths){
 const intensity=effects.snowGround;if(intensity<=0||!terrainMesh)return;
 const geom=terrainMesh.geometry.clone(),positions=geom.getAttribute('position');geom.computeBoundingBox();
 const side=Math.max(1,geom.boundingBox.max.x-geom.boundingBox.min.x,geom.boundingBox.max.z-geom.boundingBox.min.z);
 const distance=pathDistanceR244(paths),clear=effects.pathClear/100;const map=snowAtlas(T,intensity,side,distance,clear);if(!map){geom.dispose();return;}const micro=snowMicroR242(T,side);
 const depth=effects.snowDepth/100,relief=effects.snowRelief/100,drifts=effects.snowDrifts/100,p=intensity/100;
 for(let i=0;i<positions.count;i++){const x=positions.getX(i),z=positions.getZ(i),mask=snowMask(x,z,p);
  const swell=Math.pow(snowNoise(x*.29+13,z*.29),2.4),rough=snowNoise(x*1.45,z*1.45+17)-.5;
  const d=distance(x,z),cleared=clearMaskR244(d,clear);const natural=Math.max(0,depth*(.76+.56*relief*rough)+drifts*depth*1.2*swell);const transition=smoothR248((d+.16)/.40);const edgeHeight=.085+(natural-.085)*transition;const bank=Number.isFinite(d)?Math.exp(-Math.pow((d-.37)/.34,2))*smoothR248((d+.05)/.22):0;const layer=.003+Math.max(0,natural*(1-clear)+clear*edgeHeight)*mask*cleared+bank*clear*(effects.pathBanks/100)*(effects.pathBankHeight/100)*(.76+.30*snowNoise(x*1.2,z*1.2))*p;
  positions.setY(i,positions.getY(i)+layer);
 }
 positions.needsUpdate=true;geom.computeVertexNormals();geom.computeBoundingBox();geom.computeBoundingSphere();
 const mat=new T.MeshStandardMaterial({map,bumpMap:micro,bumpScale:.008+.028*relief,roughness:1,metalness:0,color:'#ffffff',envMapIntensity:.32,alphaTest:.5,transparent:false,depthWrite:true,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,side:T.DoubleSide});
 // Reuse plot-aligned contact AO; no extra fullscreen pass or texture allocation.
 const contact=terrainMesh.material?.aoMap;if(contact){mat.aoMap=contact;mat.aoMapIntensity=.72;}
 const mesh=new T.Mesh(geom,mat);mesh.name='forma-settled-ground-snow-r242';mesh.receiveShadow=true;mesh.castShadow=false;mesh.raycast=()=>{};
 mesh.userData.formaWeatherPreview=true;mesh.userData.textures=[map,micro];root.add(mesh);
}
function addPathDustR244(T,root,effects){
 if(effects.snowGround<=0||effects.pathDust<=0||effects.pathClear<=0)return;
 const targets=[];root.traverse(n=>{if(n.isMesh&&n.userData.formaPavingR244&&n.visible)targets.push(n);});
 for(const n of targets){const geo=n.geometry.clone(),p=geo.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)+.009);p.needsUpdate=true;geo.computeBoundingSphere();
 const mat=new T.MeshStandardMaterial({color:'#e4e9ec',roughness:1,metalness:0,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 const dust=effects.pathDust/100*effects.snowGround/100;mat.onBeforeCompile=sh=>{sh.uniforms.dustR244={value:dust};sh.vertexShader='varying vec3 pathP244;\n'+sh.vertexShader;sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\npathP244=position;');sh.fragmentShader='varying vec3 pathP244; uniform float dustR244;\n'+sh.fragmentShader;sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float grain=.5+.24*sin(pathP244.x*14.1+sin(pathP244.z*9.3))*cos(pathP244.z*13.7)+.18*sin(pathP244.x*31.1+pathP244.z*23.4);
 if(dustR244<.999&&grain>dustR244+.075)discard;`);};mat.customProgramCacheKey=()=> 'forma-dust-r244';
 const cover=new T.Mesh(geo,mat);cover.name='forma-path-dust-r244';cover.receiveShadow=true;cover.raycast=()=>{};cover.userData.formaWeatherPreview=true;n.add(cover);
 }
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
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d');const g=ctx.createRadialGradient(32,32,1,32,32,29);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.36,'rgba(255,255,255,.9)');g.addColorStop(.72,'rgba(255,255,255,.28)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);const sprite=new T.CanvasTexture(canvas);
 const sizes=new Float32Array(count);for(let i=0;i<count;i++)sizes[i]=.45+rnd()*.85;geometry.setAttribute('formaFlakeSize',new T.BufferAttribute(sizes,1));
 const material=new T.PointsMaterial({color:'#F2F5F7',map:sprite,size:.037+intensity*.00036,transparent:true,opacity:Math.min(.78,.38+intensity*.004),alphaTest:.025,depthWrite:false,sizeAttenuation:true});
 material.onBeforeCompile=shader=>{shader.vertexShader='attribute float formaFlakeSize;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('gl_PointSize = size;','gl_PointSize = size * formaFlakeSize;');};material.customProgramCacheKey=()=> 'forma-soft-flakes-r244';
 const mesh=new T.Points(geometry,material);
 mesh.userData.formaWeatherPreview=true;mesh.userData.textures=[sprite];mesh.userData.livePrecipitationR217={kind:'snow',initial:Float32Array.from(points),width:w,depth:h};mesh.frustumCulled=false;
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
export function addWeatherSceneVisuals(T,root,terrainMesh,doc,terrainAt,paths=[]){
 if(!root||!doc)return;
 const state=doc.atmosphere||{},effects=normalizeWeatherEffects(state.effects);
 const {snow,rain}=weatherEffectsVisible(state);
 if(snow){
  addSnowGround(T,root,terrainMesh,effects,paths);
  addPathDustR244(T,root,effects);
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
