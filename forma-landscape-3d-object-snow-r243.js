import {normalizeWeatherEffects,weatherEffectsVisible} from './forma-landscape-weather-effects.js?v=R244';
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
 if(!rows.length)return null;rows.sort((a,b)=>a.rank-b.rank);
 const geo=new T.SphereGeometry(1,mobile?9:12,mobile?6:8),p=geo.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),v=1+.075*Math.sin(5*x+4*z+5*y)+.035*Math.cos(7*z-3*x);p.setXYZ(i,x*v,y<0?y*.76:y*v,z*v);}geo.computeVertexNormals();
 const mat=material(T),mesh=new T.InstancedMesh(geo,mat,rows.length),d=new T.Object3D(),basis=new T.Matrix4(),top=new T.Vector3(),side=new T.Vector3(),up=new T.Vector3(0,1,0);
 rows.forEach((r,i)=>{d.position.copy(r.p);d.scale.set(r.l,r.h,r.w);const axis=r.axis.clone().normalize();top.copy(up).addScaledVector(axis,-axis.y).normalize();side.crossVectors(axis,top).normalize();basis.makeBasis(axis,top,side);d.quaternion.setFromRotationMatrix(basis);d.updateMatrix();mesh.setMatrixAt(i,d.matrix);});
 mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();mesh.count=0;mesh.castShadow=true;mesh.receiveShadow=true;mesh.raycast=()=>{};mesh.name='forma-snow-branch-clusters-r244';mesh.userData.formaWeatherPreview=true;group.add(mesh);return {kind,mesh,capacity:rows.length};
}
function plantSnow(T,group,kind,mobile,budget){
 if(kind==='trees'&&group.userData?.formaSnowPreview?.branchSnow)return [];
 const rows=[],cells=new Map(),h=Math.max(.5,group.userData.formaPlantBoundsR142?.height||group.userData.physicalHeight||new T.Box3().setFromObject(group).getSize(new T.Vector3()).y);
 const fir=group.userData.formaFirSnowAnchorsR244,decid=group.userData.formaDeciduousSnowAnchorsR244;
 const conifer=!!fir||/pine|spruce|fir|thuja|juniper|cedar/i.test(group.userData.species||group.userData.formaSnowPreview?.species||'');
 const V=(x,y,z)=>new T.Vector3(x,y,z),up=V(0,1,0),spacing=conifer?Math.max(.045,h*.012):Math.max(.025,h*.009);
 const candidate=(p,axis,width,length,height,k)=>{if(Math.abs(axis.y)>.86||p.y<h*(kind==='shrubs'?.18:.19))return;axis.normalize();const key=[Math.floor(p.x/spacing),Math.floor(p.y/spacing),Math.floor(p.z/spacing)].join(':');const rank=rnd(k,71);const row={p,axis,w:width,l:length,h:height,rank};const old=cells.get(key);if(!old||rank<old.rank)cells.set(key,row);};
 if(fir?.length){for(let i=0;i<fir.length;i++){const q=fir[i],axis=V(q[3],q[4],q[5]);const t=clamp(q[1]/h),radius=Math.hypot(q[0],q[2]);const w=clamp(h*.009*(1-.40*t)*(.72+.58*rnd(i,12)),.018,.095);const l=w*(1.5+1.3*rnd(i,16));const thick=w*(.46+.24*rnd(i,19));if(radius<h*.018)continue;candidate(V(q[0],q[1]+w*.20,q[2]),axis,w,l,thick,i);}}
 else if(decid?.length){for(let i=0;i<decid.length;i++){const q=decid[i],a=V(q[0],q[1],q[2]),b=V(q[3],q[4],q[5]),axis=b.clone().sub(a),len=axis.length();if(len<.009)continue;axis.normalize();const n=Math.max(1,Math.ceil(len/Math.max(.055,h*.018)));for(let j=0;j<n;j++){const p=a.clone().lerp(b,(j+.5)/n),w=clamp(q[6]*1.45+h*.0017,.006,.055),thick=w*(.45+.25*rnd(i+j,2));const top=up.clone().addScaledVector(axis,-axis.y).normalize();p.addScaledVector(top,q[6]+thick*.06);candidate(p,axis.clone(),w,Math.max(w*1.3,len/n*.63),thick,i*71+j);}}}
 else {
  const inv=group.matrixWorld.clone().invert(),local=new T.Matrix4(),instance=new T.Matrix4(),m=new T.Matrix4(),nm=new T.Matrix3(),v=new T.Vector3(),normal=new T.Vector3(),axis=V(0,0,0);const nodes=[];group.traverse(n=>{if(usable(n)&&!/cone|fruit|berr|calyx/i.test(n.name))nodes.push(n);});
  for(let ni=0;ni<nodes.length;ni++){const node=nodes[ni],p=node.geometry.attributes.position,n=node.geometry.attributes.normal;if(!p||!n)continue;local.multiplyMatrices(inv,node.matrixWorld);
   const add=(i,k,transform,nmat)=>{v.fromBufferAttribute(p,i).applyMatrix4(transform);normal.fromBufferAttribute(n,i).applyMatrix3(nmat).normalize();if(normal.y<.55)return;axis.set(v.x,0,v.z);if(axis.lengthSq()<.002)axis.set(1,0,0);axis.normalize();const w=clamp(h*(conifer?.006:kind==='shrubs'?.023:.0027)*(.6+.65*rnd(k,3)),.008,conifer?.075:kind==='shrubs'?.08:.033);candidate(v.clone().addScaledVector(up,w*.12),axis.clone(),w,w*(1.4+rnd(k,5)),w*.52,k+ni*65537);};
   if(node.isInstancedMesh){const stride=Math.max(1,Math.floor(node.count/Math.max(12,budget*2)));for(let k=0;k<node.count;k+=stride){node.getMatrixAt(k,instance);m.multiplyMatrices(local,instance);nm.getNormalMatrix(m);for(let j=0;j<3;j++)add(Math.floor(rnd(k+j*137,17)*p.count),k*7+j,m,nm);}}
   else{nm.getNormalMatrix(local);const stride=Math.max(1,Math.floor(p.count/Math.max(1,budget*8)));for(let i=0;i<p.count;i+=stride)add(i,i,local,nm);}
  }
 }
 // Select from the whole crown before limiting, not the first branch / LOD bin.
 const all=[...cells.values()].sort((a,b)=>a.rank-b.rank);const cap=Math.min(all.length,budget);rows.push(...all.slice(0,cap));const dep=addDeposit(T,group,rows,kind,mobile);return dep?[dep]:[];
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
