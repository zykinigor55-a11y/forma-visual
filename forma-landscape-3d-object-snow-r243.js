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
// R245: contiguous tapered covers, not independent snow balls.
function branchShellR245(T,group,kind,mobile,budget){
 const fir=group.userData.formaFirBoughsR245,decid=group.userData.formaDeciduousSnowPathsR245;
 if(!fir?.length&&!decid?.length)return null;
 const V=(x,y,z)=>new T.Vector3(x,y,z),up=V(0,1,0),h=group.userData.physicalHeight||group.userData.formaPlantBoundsR142?.height||5;
 const candidates=(fir?.length?fir.map((b,i)=>({points:b.points,rank:rnd(i,89),bough:b})):decid.map((points,i)=>({points,rank:rnd(i,89)}))).filter(q=>q.points.length>1);
 candidates.sort((a,b)=>a.rank-b.rank);const paths=candidates.slice(0,Math.min(candidates.length,Math.max(80,budget))),positions=[],normals=[],ends=[];
 const across=mobile?6:10;
 for(let k=0;k<paths.length;k++){const q=paths[k],pts=q.points.map(p=>V(p[0],p[1],p[2])),rows=[];let valid=false;
  for(let i=0;i<pts.length;i++){const p=pts[i],t=i/(pts.length-1),axis=pts[Math.min(pts.length-1,i+1)].clone().sub(pts[Math.max(0,i-1)]).normalize(),side=V(0,0,0).crossVectors(axis,up).normalize(),top=V(0,0,0).crossVectors(side,axis).normalize();
   if(side.lengthSq()<.01){side.set(1,0,0);top.set(0,1,0);}
   const taper=Math.pow(Math.max(.01,Math.sin(Math.PI*t)),.58),slope=Math.sqrt(Math.max(0,1-axis.y*axis.y));let w,thick,offset;
   if(q.bough){const L=q.bough.length;const outer=.8+.16*Math.sin(i*2.8+k*.91);w=Math.max(.018,L*(.27-.04*t)*taper*outer);thick=Math.max(.018,L*.14*taper*(.9+.12*Math.sin(k*2+i*.9)));offset=Math.min(.12,L*.17)*taper;valid=true;}
   else{const r=q.points[i][3]||.001;const extra=Math.min(.045,Math.max(.003,r*.65+h*.0014))*slope;w=Math.max(.001,r+extra*.72*taper);thick=r+extra*taper;offset=0;if(slope>.30&&p.y>h*.18)valid=true;}
   const row=[];for(let j=0;j<=across;j++){const u=j/across,angle=-Math.PI*.12+u*Math.PI*1.24,noise=1+.06*Math.sin(k*1.4+i*1.9+j*2.7);const pos=p.clone().addScaledVector(side,Math.cos(angle)*w*noise).addScaledVector(top,Math.sin(angle)*thick*noise+offset);const norm=side.clone().multiplyScalar(Math.cos(angle)/Math.max(.001,w)).addScaledVector(top,Math.sin(angle)/Math.max(.001,thick)).normalize();row.push({pos,norm});}rows.push(row);
  }
  if(!valid)continue;
  const tri=(a,b,c)=>{const n=b.pos.clone().sub(a.pos).cross(c.pos.clone().sub(a.pos));if(n.dot(a.norm.clone().add(b.norm).add(c.norm))<0){const tmp=b;b=c;c=tmp;}for(const p of [a,b,c]){positions.push(p.pos.x,p.pos.y,p.pos.z);normals.push(p.norm.x,p.norm.y,p.norm.z);}};
  for(let i=0;i<rows.length-1;i++)for(let j=0;j<across;j++){const a=rows[i][j],b=rows[i+1][j],c=rows[i][j+1],d=rows[i+1][j+1];tri(a,b,c);tri(c,b,d);}
  ends.push(positions.length/3);
 }
 if(!ends.length)return null;
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geo.computeBoundingSphere();
 const mat=material(T);mat.color.set('#e5ebef');mat.roughness=1;const mesh=new T.Mesh(geo,mat);mesh.name='forma-continuous-branch-snow-r245';mesh.userData.formaWeatherPreview=true;mesh.raycast=()=>{};mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return {kind,mesh,ends};
}
function plantSnow(T,group,kind,mobile,budget){
 if(kind==='trees'&&group.userData?.formaSnowPreview?.branchSnow)return [];
 const native=branchShellR245(T,group,kind,mobile,budget);if(native)return [native];
 // Fallback for other native or imported plants: a conforming layer on real
 // upward-facing surfaces, without disconnected spheres or new crown geometry.
 const entries=[],nodes=[];group.traverse(n=>{if(usable(n)&&!/fruit|berry|cone|calyx|click-volume/i.test(n.name))nodes.push(n);});
 const isConifer=/pine|spruce|fir|thuja|juniper|cedar/i.test(group.userData.species||group.userData.formaSnowPreview?.species||'');
 for(const n of nodes){const mats=Array.isArray(n.material)?n.material:[n.material];for(const mat of mats){if(!mat?.isMeshStandardMaterial||mat.userData.formaSnowCoatR245)continue;
  const u={value:0},prior=mat.onBeforeCompile,oldKey=mat.customProgramCacheKey.bind(mat);mat.userData.formaSnowCoatR245=true;
  mat.onBeforeCompile=function(sh,renderer){prior.call(this,sh,renderer);sh.uniforms.formaSnowR245=u;
   sh.vertexShader='varying vec3 snowP245; varying vec3 snowN245;\n'+sh.vertexShader;
   sh.vertexShader=sh.vertexShader.replace('#include <project_vertex>',`vec4 sp245=vec4(transformed,1.);
   vec3 sn245=objectNormal;
   #ifdef USE_INSTANCING
    sp245=instanceMatrix*sp245;sn245=mat3(instanceMatrix)*sn245;
   #endif
   snowP245=(modelMatrix*sp245).xyz;snowN245=normalize(mat3(modelMatrix)*sn245);
   #include <project_vertex>`);
   sh.fragmentShader='varying vec3 snowP245; varying vec3 snowN245; uniform float formaSnowR245;\n'+sh.fragmentShader;
   sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float patch245=.50+.23*sin(snowP245.x*4.1+sin(snowP245.y*5.3))*cos(snowP245.z*4.9)+.12*sin(snowP245.y*7.9+snowP245.z*6.2);
    float face245=smoothstep(${isConifer?'.10,.70':'.25,.82'},normalize(snowN245).y);
    float coat245=smoothstep(patch245-.15,patch245+.04,formaSnowR245)*face245*step(.001,formaSnowR245);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.79,.83,.86),coat245);`);
  };mat.customProgramCacheKey=()=>oldKey()+'|snow-coat-r245-'+(isConifer?'c':'d');mat.needsUpdate=true;entries.push({kind,coat:u});
 }}
 return entries;
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
  if(entry.coat){entry.coat.value=value;continue;}
  entry.mesh.visible=value>0;
  if(entry.ends){const count=Math.round(entry.ends.length*value);entry.mesh.geometry.setDrawRange(0,count?entry.ends[count-1]:0);continue;}
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
