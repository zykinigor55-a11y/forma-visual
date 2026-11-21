/* FORMA VISUAL · scanned geological landscape boulders.
 * All four shapes reuse locally bundled, CC0 photogrammetry GLBs by Poly Haven.
 * The PBR photo maps, normal detail and 3D silhouettes remain intact.
 * The source scan is centered in a new local group: changing its model does
 * NOT change any previously placed object's saved x/y, id or rotation.
 *
 * Sources: https://polyhaven.com/a/boulder_01
 *          https://polyhaven.com/a/namaqualand_boulder_05
 *          https://polyhaven.com/a/rock_09
 *          https://polyhaven.com/a/rock_moss_set_01
 */
export const ROCK_SCAN_SOURCES=Object.freeze({
 'granite-boulder':'assets/landscape-models/granite-boulder.glb',
 'limestone-boulder':'assets/landscape-models/rock-moss.glb',
 'slate-boulder':'assets/landscape-models/rock-rough.glb',
 'sandstone-boulder':'assets/landscape-models/sandstone-boulder.glb'
});
export const ROCK_GEOLOGICAL_PROFILES=Object.freeze({
 'granite-boulder':{name:'Гранит',reference:'boulder_01',tint:'#a6b1b2',roughness:.91,aspect:.69},
 'limestone-boulder':{name:'Известняк',reference:'rock_moss_set_01',tint:'#e7dfcb',roughness:.95,aspect:.67},
 'slate-boulder':{name:'Сланец',reference:'rock_09',tint:'#75838b',roughness:.96,aspect:.45},
 'sandstone-boulder':{name:'Песчаник',reference:'namaqualand_boulder_05',tint:'#f2e4d0',roughness:.96,aspect:.57}
});
const limits=(v,a,b,d)=>Number.isFinite(Number(v))?Math.max(a,Math.min(b,Number(v))):d;
export function landscapeRockSize(instance){
 const profile=ROCK_GEOLOGICAL_PROFILES[instance.catalogId]||ROCK_GEOLOGICAL_PROFILES['granite-boulder'];
 const diameter=limits(instance.diameter,.3,7,1.5);
 // The old 3D editor saved a generic 0.95m initial height. Respect explicit
 // heights; never migrate legacy documents, positions or selected orientation.
 const rawH=limits(instance.height,.20,5,.95);
 return {diameter,height:rawH,profile,burial:limits(instance.burial,0,.36,.12),
  variant:Math.round(limits(instance.variant,1,4,1))};
}
function dominantRockMesh(cloned,variant=1){
 const meshes=[];
 cloned.updateMatrixWorld(true);
 cloned.traverse(node=>{
  if(!node.isMesh||!node.geometry?.attributes?.position)return;
  node.geometry.computeBoundingBox?.();
  const bb=node.geometry.boundingBox;
  const volume=bb?Math.abs((bb.max.x-bb.min.x)*(bb.max.y-bb.min.y)*(bb.max.z-bb.min.z)):0;
  meshes.push({node,volume});
 });
 if(!meshes.length)return {cloned,modelCount:0};
 // The original Moss Set is a collection of six rocks; use one real rock,
 // not the entire 8-metre rock scatter as a single "limestone boulder".
 meshes.sort((a,b)=>b.volume-a.volume);
 const index=Math.min(meshes.length-1,Math.max(0,variant-1));
 const winner=meshes[index]?.node;
 for(const entry of meshes)if(entry.node!==winner)entry.node.parent?.remove(entry.node);
 return {cloned,modelCount:1};
}
function modelMeshes(g){
 let count=0,triangles=0,photoMaps=0;
 g.traverse(node=>{if(!node.isMesh)return;count++;
  const geometry=node.geometry;
  triangles+=geometry?.index?geometry.index.count/3:(geometry?.attributes?.position?.count||0)/3;
  for(const mat of Array.isArray(node.material)?node.material:[node.material])
   if(mat?.map)photoMaps++;
 });
 return {count,triangles:Math.round(triangles),photoMaps};
}
export function createPhotogrammetryBoulder(T,source,instance){
 if(!source)return null;
 const {diameter,height,burial,variant,profile}=landscapeRockSize(instance);
 const rock=new T.Group();
 rock.userData.fixtureId=instance.catalogId;
 rock.userData.geology=profile.name;
 rock.userData.scannedCC0=true;
 rock.userData.scanSource=ROCK_SCAN_SOURCES[instance.catalogId];
 rock.userData.modelVersion='real-boulders-photo-pbr-v2';
 rock.name='FORMA-PBR-BOULDER-'+instance.catalogId;
 const scan=source.clone(true);
 // Select exactly one scanned natural stone from the multi-piece limestone
 // source. Keep other three source models as-is.
 if(instance.catalogId==='limestone-boulder')dominantRockMesh(scan,variant);
 const box=new T.Box3().setFromObject(scan);
 const size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
 if(!Number.isFinite(size.x)||Math.max(size.x,size.z)<.0001)return null;
 const horizontal=diameter/Math.max(size.x,size.z);
 // No exaggerated elongation from the source scan's absolute metres:
 // height is an explicit editable value in the existing property inspector.
 const vertical=height/Math.max(.01,size.y);
 scan.scale.set(horizontal,vertical,horizontal);
 scan.position.set(-center.x*horizontal,-box.min.y*vertical-height*burial,
  -center.z*horizontal);
 // Only the pose of the *internal* scanned shape varies; user placement and
 // saved rotation on the wrapper group remain unchanged.
 scan.rotation.y=variant===1?0:variant===2?.48:variant===3?1.11:1.71;
 scan.updateMatrixWorld(true);
 let sharedMaterials=0;
 scan.traverse(node=>{
  if(!node.isMesh)return;
  node.castShadow=true;node.receiveShadow=true;
  const sourceMaterials=Array.isArray(node.material)?node.material:[node.material];
  const materials=sourceMaterials.map(material=>{
   if(!material?.isMaterial)return material;
   const copy=material.clone();
   if(copy.color)copy.color.multiply(new T.Color(profile.tint));
   copy.roughness=Math.max(profile.roughness,Number(copy.roughness)||0);
   copy.metalness=0;
   copy.envMapIntensity=.65;
   copy.needsUpdate=true;
   sharedMaterials++;
   return copy;
  });
  node.material=Array.isArray(node.material)?materials:materials[0];
 });
 rock.add(scan);
 rock.userData.measuredDiameter=diameter;
 rock.userData.measuredHeight=height;
 rock.userData.burial=burial;
 rock.userData.variant=variant;
 rock.userData.scanStats={...modelMeshes(scan),materials:sharedMaterials};
 return rock;
}
function seedHash(str){
 let h=2166136261;
 for(const c of String(str)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
 return h>>>0;
}
function lattice(x,y,z,seed){
 let h=(Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(z,2246822519)^seed)>>>0;
 h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;
}
function fractal(x,y,z,s){
 let sum=0,amp=.5,f=1,norm=0;
 for(let i=0;i<4;i++){
  const a=x*f,b=y*f,c=z*f,X=Math.floor(a),Y=Math.floor(b),Z=Math.floor(c);
  const tx=a-X,ty=b-Y,tz=c-Z;
  const u=tx*tx*(3-2*tx),v=ty*ty*(3-2*ty),w=tz*tz*(3-2*tz);
  const L=(ix,iy,iz)=>lattice(X+ix,Y+iy,Z+iz,s+i*123);
  const mix=(a,b,t)=>a+(b-a)*t;
  const n=mix(mix(mix(L(0,0,0),L(1,0,0),u),mix(L(0,1,0),L(1,1,0),u),v),
              mix(mix(L(0,0,1),L(1,0,1),u),mix(L(0,1,1),L(1,1,1),u),v),w);
  sum+=(n*2-1)*amp;norm+=amp;amp*=.51;f*=2.07;
 }
 return sum/norm;
}
export function createGeologicalFallbackBoulder(T,instance){
 // Geometry fallback is deterministic even with no GLB/data connection.
 // It has large natural asymmetries and true 3D stratified fractures.
 const {diameter,height,burial,profile,variant}=landscapeRockSize(instance);
 const id=instance.catalogId||'granite-boulder',seed=seedHash(instance.id||id)+variant*1987;
 const g=new T.Group();g.name='FORMA-GEOLOGICAL-BOULDER-'+id;
 g.userData.scannedCC0=false;g.userData.modelVersion='geological-rock-geom-v1';
 const geo=new T.SphereGeometry(1,84,60);
 const pos=geo.getAttribute('position'),col=[];
 const base=new T.Color(profile.tint);
 const slate=id==='slate-boulder',sand=id==='sandstone-boulder';
 const limestone=id==='limestone-boulder';
 const noiseScale=slate?3.7:limestone?3.0:2.6;
 for(let i=0;i<pos.count;i++){
  const ox=pos.getX(i),oy=pos.getY(i),oz=pos.getZ(i);
  const mass=fractal(ox*noiseScale,oy*noiseScale,oz*noiseScale,seed);
  const rough=fractal(ox*18,oy*16,oz*17,seed+113);
  const jagged=slate||limestone?Math.round(mass*6)/6:mass;
  const scale=1+.21*jagged+.064*rough;
  const strat=slate?Math.sin((oy+mass*.1)*29):sand?Math.sin((oy+mass*.1)*36):0;
  const crack=Math.exp(-Math.abs(strat)*15);
  const x=ox*diameter*.51*scale;
  const z=oz*diameter*.42*(scale+.035*rough);
  const y=height*(oy*.50+.45)*scale-(slate?.035:0)*crack*height-height*burial;
  pos.setXYZ(i,x,y,z);
  const mineral=fractal(ox*10,oy*9,oz*11,seed+182);
  const c=base.clone().multiplyScalar(.76+.30*(.5+.5*mineral)+.12*rough);
  if(slate)c.multiplyScalar(1-.13*crack);
  if(limestone&&rough<-.20)c.multiplyScalar(.85);
  col.push(c.r,c.g,c.b);
 }
 geo.setAttribute('color',new T.Float32BufferAttribute(col,3));
 pos.needsUpdate=true;geo.computeVertexNormals();
 const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,roughness:profile.roughness,
  metalness:0,flatShading:false,side:T.FrontSide}));
 mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.geologicalFallback=true;
 g.add(mesh);
 g.userData.measuredDiameter=diameter;
 g.userData.measuredHeight=height;
 g.userData.burial=burial;
 g.userData.variant=variant;
 return g;
}
