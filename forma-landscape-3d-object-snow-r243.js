import {normalizeWeatherEffects,weatherEffectsVisible} from './forma-landscape-weather-effects.js?v=R243';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const rnd=(i,k=0)=>{let n=Math.imul(i+173,374761393)^Math.imul(k+91,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
const roofPart=/^(roof-layer|alpha-standing-seam-roof-with-openings|parapet-metal-coping)$/;
const deckPart=/deck-planks|step-tread|terrace.*(deck|board|plank)|decking/i;
function usable(n){
 if(!n.isMesh||!n.geometry?.attributes?.position||n.userData?.formaWeatherPreview||!n.visible)return false;
 const mats=Array.isArray(n.material)?n.material:[n.material];
 return mats.some(m=>m&&m.colorWrite!==false&&!m.wireframe&&!(m.transparent&&m.opacity<.8)&&!m.transmission)&&!/glass|glazing|rooflight|window|water|click-volume|light-emission|helper/i.test(n.name+' '+(n.userData.architecturePart||''))&&!n.userData.formaWater;
}
function material(T){return new T.MeshStandardMaterial({color:'#e9edf0',roughness:1,metalness:0,envMapIntensity:.35,side:T.DoubleSide});}
function addDeposit(T,group,rows,kind,mobile){
 if(!rows.length)return null;
 rows.sort((a,b)=>a.rank-b.rank);
 const geo=new T.SphereGeometry(1,mobile?7:10,mobile?4:6),p=geo.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),v=1+.055*Math.sin(6*x+4*z+5*y);p.setXYZ(i,x*v,y<0?y*.48:y*v,z*v);}geo.computeVertexNormals();
 const mesh=new T.InstancedMesh(geo,material(T),rows.length),d=new T.Object3D();
 rows.forEach((r,i)=>{d.position.copy(r.p);d.scale.set(r.w,r.h,r.l);d.rotation.set(0,r.angle,0);d.updateMatrix();mesh.setMatrixAt(i,d.matrix);});
 mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();mesh.count=0;mesh.castShadow=true;mesh.receiveShadow=true;mesh.raycast=()=>{};mesh.name='forma-snow-deposits-r243';mesh.userData.formaWeatherPreview=true;group.add(mesh);
 return {kind,mesh,capacity:rows.length};
}
function plantSnow(T,group,kind,mobile,budget){
 if(kind==='trees'&&group.userData?.formaSnowPreview?.branchSnow)return [];
 const rows=[],cells=new Set(),h=Math.max(.5,group.userData.formaPlantBoundsR142?.height||new T.Box3().setFromObject(group).getSize(new T.Vector3()).y);
 const spacing=kind==='shrubs'?Math.max(.045,h*.055):Math.max(.065,h*.025);
 const inv=group.matrixWorld.clone().invert(),local=new T.Matrix4(),instance=new T.Matrix4(),m=new T.Matrix4(),nm=new T.Matrix3(),v=new T.Vector3(),normal=new T.Vector3(),up=new T.Vector3(0,1,0);
 const nodes=[];group.traverse(n=>{if(usable(n))nodes.push(n);});nodes.sort((a,b)=>Number(b.isInstancedMesh)-Number(a.isInstancedMesh));
 for(const node of nodes){if(rows.length>=budget)break;const p=node.geometry.attributes.position,n=node.geometry.attributes.normal;if(!p||!n)continue;local.multiplyMatrices(inv,node.matrixWorld);
  const add=(i,k,transform,nmat,scale)=>{
   v.fromBufferAttribute(p,i).applyMatrix4(transform);normal.fromBufferAttribute(n,i).applyMatrix3(nmat).normalize();
   if(normal.y<.32||v.y<h*(kind==='shrubs'?.22:.30))return;
   const key=Math.floor(v.x/spacing)+':'+Math.floor(v.y/spacing)+':'+Math.floor(v.z/spacing);if(cells.has(key))return;cells.add(key);
   const width=clamp(spacing*(.52+rnd(k,3)*.55)*scale,.025,kind==='shrubs'?.20:.23),height=width*(.36+.22*rnd(k,4));
   rows.push({p:v.clone().addScaledVector(up,height*.32),w:width,h:height,l:width*(1.1+rnd(k,5)*.65),rank:rnd(k,7),angle:rnd(k,9)*Math.PI});
  };
  if(node.isInstancedMesh){const stride=Math.max(1,Math.floor(node.count/Math.max(1,budget*3)));const candidates=[];const vs=Math.max(1,Math.floor(p.count/32));for(let i=0;i<p.count;i+=vs)candidates.push(i);
   for(let k=0;k<node.count&&rows.length<budget;k+=stride){node.getMatrixAt(k,instance);m.multiplyMatrices(local,instance);nm.getNormalMatrix(m);for(let j=0;j<Math.min(4,candidates.length);j++){const i=candidates[Math.floor(rnd(k+j*113,17)*candidates.length)];add(i,k*7+j,m,nm,.86);}}
  }else{nm.getNormalMatrix(local);const stride=Math.max(1,Math.floor(p.count/Math.max(1,budget*6)));for(let i=0;i<p.count&&rows.length<budget;i+=stride)add(i,i,local,nm,1);}
 }
 const dep=addDeposit(T,group,rows,kind,mobile);return dep?[dep]:[];
}
function surfaceSnow(T,group,kind,mobile){
 const nodes=[];group.traverse(n=>{if(!usable(n)||n.isInstancedMesh)return;const part=n.userData.architecturePart||'';if(kind==='roof'&&!roofPart.test(part)&&!(group.userData.archStyle==='custom-glb'&&/(?:roof|кровл|крыш)/i.test(n.name)))return;if(kind==='deck'&&!deckPart.test(part))return;nodes.push(n);});
 const result=[],inv=group.matrixWorld.clone().invert(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),ab=new T.Vector3(),ac=new T.Vector3(),normal=new T.Vector3(),transform=new T.Matrix4();
 for(const node of nodes){const g=node.geometry,p=g.attributes.position,index=g.index,tri=index?index.count/3:p.count/3,part=node.userData.architecturePart||'';if(tri>25000)continue;
  transform.multiplyMatrices(inv,node.matrixWorld);const out=[],slopes=[];let maxEdge=0;const triangles=[];
  const hip=kind==='roof'&&part==='roof-layer'&&g.type!=='BoxGeometry'&&node.userData.roofThickness;
  const hipTop=hip?Math.max(0,Math.round((p.count/2)-2)):0;
  for(let k=0;k<tri;k++){if(hip&&!(k<hipTop*2&&k%2===0))continue;
   const get=i=>index?index.getX(k*3+i):k*3+i;
   a.fromBufferAttribute(p,get(0)).applyMatrix4(transform);b.fromBufferAttribute(p,get(1)).applyMatrix4(transform);c.fromBufferAttribute(p,get(2)).applyMatrix4(transform);
   ab.subVectors(b,a);ac.subVectors(c,a);normal.crossVectors(ab,ac);if(normal.lengthSq()<1e-12)continue;normal.normalize();
   const alpha=part==='alpha-standing-seam-roof-with-openings';if(hip||alpha){if(Math.abs(normal.y)<.22)continue;if(normal.y<0){const tmp=b.clone();b.copy(c);c.copy(tmp);normal.negate();}}else if(normal.y<(kind==='roof'?.23:.66))continue;
   maxEdge=Math.max(maxEdge,a.distanceTo(b),b.distanceTo(c),c.distanceTo(a));triangles.push([a.clone(),b.clone(),c.clone(),normal.y]);
  }
  if(!triangles.length)continue;
  const n=Math.max(1,Math.min(mobile?12:20,Math.ceil(maxEdge/.45),Math.floor(Math.sqrt((mobile?10000:24000)/triangles.length))));
  for(const [A,B,C,ny] of triangles){const point=(i,j)=>{const x=A.clone().multiplyScalar(1-(i+j)/n).addScaledVector(B,i/n).addScaledVector(C,j/n);return x;};const push=(x)=>{out.push(x.x,x.y,x.z);slopes.push(ny);};
   for(let i=0;i<n;i++)for(let j=0;j<n-i;j++){push(point(i,j));push(point(i+1,j));push(point(i,j+1));if(i+j<n-1){push(point(i+1,j));push(point(i+1,j+1));push(point(i,j+1));}}
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(out,3));geo.computeVertexNormals();
  const mat=material(T),u={value:0};mat.onBeforeCompile=shader=>{shader.uniforms.formaSnowCoverageR243=u;shader.vertexShader='varying vec3 vSnowR243;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSnowR243=position;');shader.fragmentShader='varying vec3 vSnowR243; uniform float formaSnowCoverageR243;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float field=.5+.19*sin(vSnowR243.x*1.9+sin(vSnowR243.z*2.3))*cos(vSnowR243.z*1.7)+.13*sin(vSnowR243.x*5.1+vSnowR243.z*4.3);
 if(formaSnowCoverageR243<.999&&field>formaSnowCoverageR243)discard;
 float grain=sin(vSnowR243.x*11.3+sin(vSnowR243.z*17.1))*cos(vSnowR243.z*13.9+sin(vSnowR243.x*15.7));diffuseColor.rgb*=.97+.018*grain;
 `);};mat.customProgramCacheKey=()=> 'forma-matte-snow-r243';
  const mesh=new T.Mesh(geo,mat);mesh.name='forma-snow-surface-r243';mesh.userData.formaWeatherPreview=true;mesh.receiveShadow=true;mesh.castShadow=false;mesh.raycast=()=>{};group.add(mesh);
  result.push({kind,mesh,u,base:Float32Array.from(out),slopes:Float32Array.from(slopes),last:''});
 }
 return result;
}
export function attachObjectSnowPreview(T,group,kind,atmosphere,{mobile=false,budget=600}={}){
 if(!group||!weatherEffectsVisible(atmosphere).snow||group.userData.formaObjectSnowR243)return 0;
 group.updateWorldMatrix(true,true);
 let entries=kind==='trees'||kind==='shrubs'?plantSnow(T,group,kind,mobile,budget):kind==='building'?[...surfaceSnow(T,group,'roof',mobile),...surfaceSnow(T,group,'deck',mobile)]:surfaceSnow(T,group,'object',mobile);
 if(!entries.length)return 0;
 group.userData.formaObjectSnowR243=entries;updateObjectSnowPreview(group,atmosphere);return entries.reduce((n,e)=>n+(e.capacity||0),0);
}
function updateObjectSnowPreview(group,atmosphere){
 const e=normalizeWeatherEffects(atmosphere.effects),active=weatherEffectsVisible(atmosphere).snow;
 for(const entry of group.userData.formaObjectSnowR243||[]){
  const value=active?(entry.kind==='trees'?e.snowTrees:entry.kind==='shrubs'?e.snowShrubs:entry.kind==='roof'?e.snowRoofs:e.snowObjects)/100:0;
  entry.mesh.visible=value>0;
  if(entry.capacity){entry.mesh.count=Math.round(entry.capacity*value);continue;}
  entry.u.value=value;const key=[value,e.snowDepth,e.snowRelief,e.snowDrifts].join('|');if(entry.last===key)continue;entry.last=key;
  const p=entry.mesh.geometry.attributes.position,depth=Math.min(.24,e.snowDepth/100)*(entry.kind==='roof'?.62:.42);
  for(let i=0;i<p.count;i++){const x=entry.base[i*3],y=entry.base[i*3+1],z=entry.base[i*3+2],retention=entry.kind==='roof'?clamp((entry.slopes[i]-.22)/.78,.14,1):1;
   const relief=1+.18*(e.snowRelief/100)*Math.sin(x*2.1+Math.sin(z*1.7))*Math.cos(z*1.9)+.24*(e.snowDrifts/100)*Math.sin(x*.85+z*.55)**2;
   p.setXYZ(i,x,y+.012+depth*retention*relief*Math.sqrt(value),z);
  }p.needsUpdate=true;entry.mesh.geometry.computeVertexNormals();entry.mesh.geometry.computeBoundingSphere();
 }
}
export function refreshAllObjectSnowPreview(root,atmosphere){root?.traverse(n=>{if(n.userData?.formaObjectSnowR243)updateObjectSnowPreview(n,atmosphere);});}
