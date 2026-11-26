/* R86 isolated lawn: metric curved blades, three distance bands, seeded
 * variation and shared GPU instance buffers. Existing ground photo stays below.
 * Blade microstructure is procedural, not a photographic scan. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function hash(x,z,n){let k=Math.imul(x,374761393)^Math.imul(z,668265263)^Math.imul(n,1274126177);k=Math.imul(k^(k>>>13),1274126177);return ((k^(k>>>16))>>>0)/4294967296;}
function smooth(v){return v*v*(3-2*v);}
function field(x,z,scale,seed){
 const xx=x*scale,zz=z*scale,ix=Math.floor(xx),iz=Math.floor(zz),u=smooth(xx-ix),v=smooth(zz-iz);
 const a=hash(ix,iz,seed),b=hash(ix+1,iz,seed),c=hash(ix,iz+1,seed),d=hash(ix+1,iz+1,seed);
 return (a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v;
}
export function lawnTerrainMicro(x,z){
 return (field(x,z,1.35,41)-.5)*.018+(field(x,z,2.3,43)-.5)*.006;
}
// Each instanced clump contains several separately curved, folded leaves.
function tuftGeometry(T,profile,variant,detail){
 const pos=[],uv=[],col=[],idx=[];
 const count=detail===0?9:detail===1?6:detail===2?4:2;
 const rows=detail===0?7:detail===1?4:2;
 const stride=detail===0?3:2;
 const ratio=profile.width/profile.height;
 for(let n=0;n<count;n++){
  const seed=variant*31+n*7;
  const r=k=>hash(seed,n,k);
  const a=n*2.399963+variant*.83+r(1)*.8,dx=Math.cos(a),dz=Math.sin(a),sx=-dz,sz=dx;
  const base=.025+r(2)*.10,ox=dx*base,oz=dz*base;
  const basal=n>=count-4;
  const h=(basal?.36:.72)+r(3)*(basal?.29:.42);
  const lean=(basal?.65:.16)+r(4)*(basal?.33:.65);
  const bend=lean*clamp(profile.lean/.30,.65,1.45);
  const half=ratio*(.43+r(5)*.29)*(detail===3?4.5:detail===2?2.0:detail===1?1.4:1.0);
  const first=pos.length/3,twist=(r(8)-.5)*1.5,curve=(r(9)-.5)*.20,age=r(10);
  for(let j=0;j<rows;j++){
   const t=j/rows,w=half*(.73+.32*Math.sin(t*Math.PI))*Math.pow(1-t,.65);
   const out=h*bend*(.08*t+.92*t*t),y=h*(t-.28*bend*t*t);
   for(const k of (stride===3?[-1,0,1]:[-1,1])){
    const turn=twist*Math.pow(t,1.25),fold=Math.abs(k)*w*(.24+.10*Math.sin(t*3.14));
    const sideways=k*w*Math.cos(turn)+curve*h*t*t,along=fold+k*w*Math.sin(turn)*.35;
    pos.push(ox+dx*(out+along)+sx*sideways,y+k*w*Math.sin(turn)*.72,oz+dz*(out+along)+sz*sideways);
    uv.push((k+1)*.5,t);
    const c=(.30+.70*Math.pow(t,.62))*(.87+.13*r(6));
    col.push(c*(.96+.08*age),c*(.96+.04*age),c*(.91+.07*(1-age)));
   }
  }
  for(let j=0;j<rows-1;j++)for(let k=0;k<stride-1;k++){
   const a=first+j*stride+k,b=a+stride;idx.push(a,b,a+1,a+1,b,b+1);
  }
  const tip=pos.length/3;pos.push(ox+dx*h*bend+sx*curve*h,h*(1-.28*bend),oz+dz*h*bend+sz*curve*h);uv.push(.5,1);col.push(.87,.92,.87);
  for(let k=0;k<stride-1;k++)idx.push(first+(rows-1)*stride+k,tip,first+(rows-1)*stride+k+1);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();const normals=g.getAttribute('normal');for(let i=0;i<normals.count;i++){const x=normals.getX(i)*.65,y=normals.getY(i)*.65+.35,z=normals.getZ(i)*.65,l=Math.hypot(x,y,z)||1;normals.setXYZ(i,x/l,y/l,z/l);}return g;
}
function bladeMaps(T){
 const w=256,h=512,albedo=new Uint8Array(w*h*4),normal=new Uint8Array(w*h*4),rough=new Uint8Array(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const u=x/(w-1),v=y/(h-1),vein=Math.exp(-Math.pow((u-.5)*30,2)),fine=Math.sin(u*91+v*.9)*.55+Math.sin(u*173)*.25,grain=hash(x,y,8)-.5;
  const fibers=Math.cos(u*132+Math.sin(v*8+u*9)*.45)*.48+Math.cos(u*287+v*1.8)*.19;const age=field(u*3,v*8,2,82);const edge=Math.pow(Math.abs(u-.5)*2,5);const c=clamp(210+vein*18+fine*8+fibers*13+grain*6+(age-.5)*24-edge*11,155,248),i=(y*w+x)*4;
  albedo.set([c*(.94+age*.04),c,Math.max(0,c*(.91+age*.04)),255],i);
  const dx=.065*Math.cos(u*132+Math.sin(v*8)*.45)+.025*Math.cos(u*287+v*1.8)+.14*Math.sin((u-.5)*42)*vein,dy=.018*Math.sin(v*94+u*6),l=Math.hypot(dx,dy,1);normal.set([128+127*dx/l,128+127*dy/l,128+127/l,255],i);
  const r=clamp(192+fine*12+fibers*16-vein*33+grain*10+edge*12,128,235);rough.set([r,r,r,255],i);
 }
 const tex=(a,srgb=false)=>{const t=new T.DataTexture(a,w,h,T.RGBAFormat);t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=4;t.needsUpdate=true;return t;};
 return {map:tex(albedo,true),normalMap:tex(normal),roughnessMap:tex(rough)};
}

// Distinct broadleaf geometry: trifoliate clover, plantain-like rosettes,
// and narrow sedge blades. Shared instances keep the mobile draw count low.
// Curved leaflets with genuine petiole tubes, raised midrib and fine serration.
function herbGeometry(T,kind,detail=0){
 const p=[],c=[],uv=[],idx=[];
 function vertex(x,y,z,u,v,r,g,b){p.push(x,y,z);uv.push(u,v);c.push(r,g,b);}
 function stem(x,y,z,curve){
  const start=p.length/3,rows=4,sides=5;
  for(let j=0;j<=rows;j++){const t=j/rows,rr=.00105*(1-.55*t);
   for(let k=0;k<sides;k++){const a=k*2*Math.PI/sides;vertex(x*t+curve*t*(1-t)+rr*Math.cos(a),y*t,z*t+rr*Math.sin(a),.90,.04,.58,.73,.43);}
  }
  for(let j=0;j<rows;j++)for(let k=0;k<sides;k++){const a=start+j*sides+k,b=start+j*sides+(k+1)%sides;idx.push(a,a+sides,b,b,a+sides,b+sides);}
 }
 function leaf(a,bx,by,bz,len,width,rise,type,seed){
  const dx=Math.cos(a),dz=Math.sin(a),sx=-dz,sz=dx,first=p.length/3,rows=detail?5:10,cols=detail?3:5;
  for(let j=0;j<=rows;j++){
   const t=j/rows;
   const shape=type==='clover'?Math.pow(Math.sin(Math.PI*t),.62)*(1+.32*t):Math.pow(Math.sin(Math.PI*t),.85);
   const serration=1+.035*Math.sin(j*2.4+seed);
   const w=Math.max(.0001,width*shape*serration);
   const arch=rise*Math.sin(t*Math.PI*.86)+.004*Math.sin(Math.PI*t);
   for(let k=0;k<cols;k++){
    const u=k/(cols-1),side=u*2-1;
    const cup=Math.abs(side)*w*.20+side*w*.12*Math.sin(seed+t*2);
    const notch=type==='clover'?Math.max(0,(t-.85)/.15)*.002*(1-Math.abs(side)):0;
    const tone=.82+.13*Math.sin(Math.PI*t)+.05*hash(j,k,seed);
    vertex(bx+dx*(len*t-notch)+sx*side*w,by+arch-cup,bz+dz*(len*t-notch)+sz*side*w,u,t,tone,tone,tone);
   }
  }
  for(let j=0;j<rows;j++)for(let k=0;k<cols-1;k++){const a=first+j*cols+k,b=a+cols;idx.push(a,b,a+1,a+1,b,b+1);}
 }
 if(kind==='clover'){
  for(let n=0;n<3;n++){const a=n*2.39996,x=Math.cos(a)*(.011+n*.004),z=Math.sin(a)*(.011+n*.004),y=.025+n*.014;
   stem(x,y,z,.003*(n-1));
   for(let k=0;k<3;k++)leaf(a+k*Math.PI*2/3,x,y,z,.018+(n%2)*.005,.0085+(k%2)*.0015,.0035+hash(n,k,90)*.004,'clover',n*5+k);
  }
 }else if(kind==='plantain'){for(let n=0;n<6;n++)leaf(n*2.39996,0,.005,0,.085+(n%3)*.024,.014+(n%2)*.006,.025+(n%3)*.012,'plantain',n);}
 else {for(let n=0;n<7;n++)leaf(n*2.39996,0,0,0,.075+(n%3)*.035,.0035,.10+(n%4)*.024,'sedge',n);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
function herbMaps(T,kind){
 const w=128,h=128,albedo=new Uint8Array(w*h*4),normal=new Uint8Array(w*h*4),rough=new Uint8Array(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const u=x/(w-1),v=y/(h-1),d=Math.abs(u-.5)*2,noise=hash(x,y,71)-.5;
  const midrib=Math.exp(-d*d*170),branch=Math.pow(Math.max(0,Math.cos((v-d*.28)*Math.PI*22)),22)*(.3+.7*d);
  const mark=kind==='clover'?Math.exp(-Math.pow((v-(.38+.19*d))/.065,2))*(.75+.25*Math.sin(d*6)):0;
  const tone=clamp(198+12*Math.sin(v*5)+noise*16+midrib*29+branch*12+mark*39,145,250),i=(y*w+x)*4;
  albedo.set([tone*(.91+mark*.075),tone,tone*(.85+mark*.12),255],i);
  const dx=.17*Math.sin((u-.5)*Math.PI*10)*midrib+.09*Math.sin((v-d*.28)*Math.PI*22);
  const dy=.05*Math.cos(v*Math.PI*22),l=Math.hypot(dx,dy,1);
  normal.set([128+127*dx/l,128+127*dy/l,128+127/l,255],i);
  const rr=clamp(179-32*midrib-13*branch+noise*21,115,215);rough.set([rr,rr,rr,255],i);
 }
 const tex=(a,srgb=false)=>{const t=new T.DataTexture(a,w,h,T.RGBAFormat);t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.needsUpdate=true;return t;};
 return {map:tex(albedo,true),normalMap:tex(normal),roughnessMap:tex(rough)};
}
function addHerbs(T,root,{profile,focus,mobile,low,terrainAt,contains}){
 if(!profile.herbs)return;
 const kinds=profile.herbs==='clover'?['clover']:['plantain','sedge','clover'];
 const radius=mobile?3.3:5.0,step=profile.herbs==='clover'?(mobile?.12:.10):(mobile?.20:.16),rows=kinds.map(()=>[]);
 for(let iz=Math.floor((focus.z-radius)/step);iz<=Math.ceil((focus.z+radius)/step);iz++)for(let ix=Math.floor((focus.x-radius)/step);ix<=Math.ceil((focus.x+radius)/step);ix++){
  const x=(ix+hash(ix,iz,60))*step,z=(iz+hash(ix,iz,61))*step,d=Math.hypot(x-focus.x,z-focus.z);
  if(d>radius||!contains(x,z))continue;
  const patch=field(x,z,1.7,62),chance=(profile.herbs==='clover'? .20+.62*patch:.10+.53*patch)*(low?.65:1)*clamp((radius-d)/1.1,0,1);
  if(hash(ix,iz,63)>chance)continue;
  const k=Math.min(kinds.length-1,Math.floor(hash(ix,iz,64)*kinds.length));rows[k].push([x,terrainAt(x,z),z,hash(ix,iz,65),hash(ix,iz,66)]);
 }
 const materials=[],textures=[];
 const dummy=new T.Object3D(),color=new T.Color(),dark=new T.Color('#3d5b35');
 for(let k=0;k<kinds.length;k++){if(!rows[k].length)continue;const maps=herbMaps(T,kinds[k]);textures.push(...Object.values(maps));const mat=new T.MeshPhysicalMaterial({...maps,vertexColors:true,side:T.DoubleSide,roughness:.83,metalness:0,clearcoat:.10,clearcoatRoughness:.55,normalScale:new T.Vector2(.22,.22),envMapIntensity:.24});materials.push(mat);const g=herbGeometry(T,kinds[k],mobile||low?1:0),m=new T.InstancedMesh(g,mat,rows[k].length);
  rows[k].forEach(([x,y,z,a,b],i)=>{dummy.position.set(x,y,z);dummy.rotation.set(0,a*6.283185,0);dummy.scale.setScalar(.72+b*.58);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);color.set('#698154').lerp(dark,b*.65);m.setColorAt(i,color);});
  m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;m.computeBoundingSphere();m.receiveShadow=true;m.raycast=()=>{};m.name='forma-lawn-herb-'+kinds[k];root.add(m);
 }
 root.userData.herbMaterials=materials;root.userData.herbTextures=textures;
}


// Short, low-cost basal carpet. Roots are separate from taller clumps.
function addBasalTurf(T,root,{profile,focus,mobile,low,terrainAt,contains,slope,orient,mat}){
 const pos=[],uv=[],col=[],idx=[];
 const count=5;
 for(let i=0;i<count;i++){
  const a=i*2.399963,dx=Math.cos(a),dz=Math.sin(a),sx=-dz,sz=dx,b=pos.length/3;
  const l=.72+(i%3)*.16,w=.105,base=.14;
  pos.push(dx*base-sx*w,0,dz*base-sz*w,dx*base+sx*w,0,dz*base+sz*w,
    dx*(base+.30)-sx*w*.72,.51,dz*(base+.30)-sz*w*.72,
    dx*(base+.30)+sx*w*.72,.51,dz*(base+.30)+sz*w*.72,dx*l,.74,dz*l);
  uv.push(0,0,1,0,0,.55,1,.55,.5,1);col.push(.33,.33,.31,.33,.33,.31,.62,.65,.58,.62,.65,.58,.81,.85,.76);
  idx.push(b,b+2,b+1,b+1,b+2,b+3,b+2,b+4,b+3);
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setAttribute('color',new T.Float32BufferAttribute(col,3));geo.setIndex(idx);geo.computeVertexNormals();
 const rows=[],radius=mobile?3.6:5.5,step=(mobile?.038:.032)*(low?1.15:1)/Math.sqrt(Math.min(1.4,profile.density));
 for(let iz=Math.floor((focus.z-radius)/step);iz<=Math.ceil((focus.z+radius)/step);iz++)for(let ix=Math.floor((focus.x-radius)/step);ix<=Math.ceil((focus.x+radius)/step);ix++){
  const x=(ix+hash(ix,iz,101))*step,z=(iz+hash(ix,iz,102))*step,d=Math.hypot(x-focus.x,z-focus.z);
  if(d>radius||!contains(x,z)||hash(ix,iz,103)>clamp((radius-d)/.9,0,1))continue;
  const add=(xx,zz)=>rows.push([xx,zz,hash(ix,iz,104),hash(ix,iz,105)]);
  add(x,z);
  if(hash(ix,iz,106)<clamp(slope(x,z).area-1,0,1)){const xx=x+(hash(ix,iz,107)-.5)*step,zz=z+(hash(ix,iz,108)-.5)*step;if(contains(xx,zz))add(xx,zz);}
 }
 const m=new T.InstancedMesh(geo,mat,rows.length),obj=new T.Object3D(),color=new T.Color(),dark=new T.Color('#485b35'),light=new T.Color('#69794c');
 const height=clamp(profile.height*.32,.012,.024);
 rows.forEach(([x,z,r,a],i)=>{
  obj.position.set(x,terrainAt(x,z)+.0005,z);orient(obj,x,z,a*6.283185);obj.scale.set(.025+r*.018,height*(.75+r*.5),.025+r*.018);obj.updateMatrix();m.setMatrixAt(i,obj.matrix);m.setColorAt(i,color.copy(dark).lerp(light,r));
 });
 m.name='forma-basal-turf-r86';m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;m.computeBoundingSphere();m.receiveShadow=true;m.raycast=()=>{};root.add(m);
 return rows.length*count;
}
// During a brush stroke, keep existing roots attached without reallocating buffers.
export function reanchorDenseLawn(T,root,terrainAt,dirty){
 if(!root||!dirty)return;
 // All matrices are column-major; only the translation Y needs changing during a stroke.
 for(const m of root.children){if(!m.isInstancedMesh)continue;let changed=false;
  const a=m.instanceMatrix.array;
  for(let i=0;i<m.count;i++){const o=i*16,x=a[o+12],z=a[o+14];if(x<dirty.x0-.15||x>dirty.x1+.15||z<dirty.z0-.15||z>dirty.z1+.15)continue;
   a[o+13]=terrainAt(x,z)+.0005;changed=true;
  }
  if(changed){m.instanceMatrix.needsUpdate=true;m.frustumCulled=false;}
 }
}

export function createDenseLawn(T,{profile,focus,mobile=false,terrainAt,contains=()=>true,low=false}){
 const root=new T.Group();root.name='forma-dense-lawn-r86';const maps=bladeMaps(T),u={t:{value:0},wind:{value:0}};
 const mat=new T.MeshPhysicalMaterial({...maps,vertexColors:true,side:T.DoubleSide,roughness:.90,metalness:0,clearcoat:.03,clearcoatRoughness:.85,specularIntensity:.22,normalScale:new T.Vector2(.12,.10),envMapIntensity:.16});
 mat.onBeforeCompile=shader=>{
  shader.uniforms.formaGrassTime=u.t;shader.uniforms.formaGrassWind=u.wind;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float formaGrassTime,formaGrassWind;').replace('#include <begin_vertex>',`#include <begin_vertex>
  #ifdef USE_INSTANCING
   vec3 grassAnchor=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz;
   float sway=.72*sin(formaGrassTime*1.1+grassAnchor.x*.95+grassAnchor.z*.72)+.28*sin(formaGrassTime*2.4+grassAnchor.x*2.2-grassAnchor.z*1.7);
   transformed.z+=sway*formaGrassWind*.09*uv.y*uv.y;
  #endif`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   roughnessFactor=clamp(roughnessFactor,.64,.94);
  `);
  // RE_Direct_Physical receives directLight.color after shadow attenuation.
  // Use existing physical lighting function and a bounded thin-leaf approximation.
  const physical=T.ShaderChunk.lights_physical_pars_fragment;
  const needle=/reflectedLight\.directDiffuse\s*\+=\s*irradiance\s*\*\s*BRDF_Lambert\(\s*material\.diffuseColor\s*\)\s*;/;
  if(physical&&needle.test(physical)){
   shader.fragmentShader=shader.fragmentShader.replace('#include <lights_physical_pars_fragment>',physical.replace(needle,m=>m+`
    float formaBack=max(0.0,dot(-geometryNormal,directLight.direction));
    float formaForward=pow(max(0.0,dot(-directLight.direction,geometryViewDir)),3.0);
    reflectedLight.directDiffuse+=directLight.color*BRDF_Lambert(material.diffuseColor)*(formaBack*.28+formaForward*.08)*vec3(.96,1.0,.77);
   `));
  }
  shader.fragmentShader=shader.fragmentShader.replace('#include <aomap_fragment>',`#include <aomap_fragment>
   #ifdef USE_MAP
    float formaRoot=smoothstep(0.0,.85,vMapUv.y);
    reflectedLight.indirectDiffuse*=mix(.53,1.0,formaRoot);
    reflectedLight.indirectSpecular*=mix(.45,1.0,formaRoot);
    reflectedLight.directDiffuse*=mix(.82,1.0,formaRoot);
   #endif
  `);

 };
 mat.customProgramCacheKey=()=> 'forma-grass-r86';
 const pressedColor=new T.Color('#746c47'),color=new T.Color(),palette=profile.palette.map(c=>new T.Color(c).lerp(new T.Color('#36533a'),.24)),dummy=new T.Object3D();
 const cx=Math.round(focus.x/.6)*.6,cz=Math.round(focus.z/.6)*.6;
 const near=mobile?.95:1.55,mid=mobile?2.9:4.0,far=mobile?7.0:9.2,horizon=mobile?16:19;
 const bands=[{min:0,max:near+.24,step:mobile?.024:.020,detail:0},{min:near-.24,max:mid+.36,step:mobile?.031:.028,detail:1},{min:mid-.36,max:far+1.2,step:mobile?.052:.048,detail:2},{min:far-1.2,max:horizon,step:mobile?.15:.12,detail:3}];
 const slopeCache=new Map(),up=new T.Vector3(0,1,0),normal=new T.Vector3(),axis=new T.Vector3(1,0,0),qYaw=new T.Quaternion(),qTilt=new T.Quaternion();
 function slope(x,z){
  const ix=Math.round(x/.18),iz=Math.round(z/.18),key=ix+':'+iz;
  let v=slopeCache.get(key);if(v)return v;
  const xx=ix*.18,zz=iz*.18,e=.09;
  const dx=(terrainAt(xx+e,zz)-terrainAt(xx-e,zz))/(2*e),dz=(terrainAt(xx,zz+e)-terrainAt(xx,zz-e))/(2*e);
  v={dx,dz,area:Math.hypot(1,dx,dz)};slopeCache.set(key,v);return v;
 }
 function orient(obj,x,z,yaw,tilt=0){
  const v=slope(x,z);
  // Partly follow the surface; living leaves still tend upwards.
  normal.set(-v.dx*.48,1,-v.dz*.48).normalize();
  obj.quaternion.setFromUnitVectors(up,normal).multiply(qYaw.setFromAxisAngle(up,yaw));
  if(tilt)obj.quaternion.multiply(qTilt.setFromAxisAngle(axis,tilt));
 }
 let total=0,triangles=0;
 for(const [bandIndex,b] of bands.entries()){
  const step=b.step/Math.sqrt(profile.density)*(low?1.12:1)*(bandIndex===0?.81:bandIndex===1?.90:1),groups=[[],[],[]];
  for(let iz=Math.floor((cz-b.max)/step);iz<=Math.ceil((cz+b.max)/step);iz++)for(let ix=Math.floor((cx-b.max)/step);ix<=Math.ceil((cx+b.max)/step);ix++){
   const x=(ix+hash(ix,iz,1))*step,z=(iz+hash(ix,iz,2))*step,d=Math.hypot(x-cx,z-cz);
   if(d<b.min||d>b.max||!contains(x,z))continue;
   const fadeIn=bandIndex===0?1:smooth(clamp((d-b.min)/(bandIndex===1?.48:bandIndex===2?.72:2.4),0,1)),fadeOut=smooth(clamp((b.max-d)/(bandIndex===0?.48:bandIndex===1?.72:bandIndex===2?2.4:5.0),0,1));
   if(hash(ix,iz,11)>fadeIn*fadeOut)continue;
   const patch=field(x,z,1.45,32)*.65+field(x,z,4.1,33)*.35;
   const tuft=field(x,z,15,34);const pressed=smooth(clamp((field(x,z,.83,35)*.73+field(x,z,2.1,36)*.27-.46)/.29,0,1));
   const r=hash(ix,iz,3),h=profile.height*(1+(hash(ix,iz,4)-.5)*2*profile.variation)*(.72+.62*patch)*(.84+.32*tuft);
   const w=h*(.94+.24*r)*(1+pressed*.50);
   const shade=hash(ix,iz,6),variant=Math.min(2,Math.floor(hash(ix,iz,7)*3));
   const angle=field(x,z,.65,39)*Math.PI*4;const randomAngle=hash(ix,iz,8)*Math.PI*2;
   const stripe=profile.stripes?Math.floor((x+12)/profile.stripes)%2:0;
   const yaw=profile.stripes?(stripe?Math.PI:0)+(randomAngle-Math.PI)*.09:pressed>.4?angle+(randomAngle-Math.PI)*.35:randomAngle;
   const add=(xx,zz)=>groups[variant].push([xx,terrainAt(xx,zz)+.0005,zz,h*(1-(profile.stripes?.18:.60)*pressed),w,yaw,shade,pressed,patch,stripe]);
   add(x,z);
   // Area of a sloped patch / its XZ projection = sqrt(1 + dx² + dz²).
   const extra=clamp(slope(x,z).area-1,0,1.35);
   for(let k=0;k<2;k++){if(hash(ix,iz,90+k)>=clamp(extra-k,0,1))continue;const xx=x+(hash(ix,iz,94+k)-.5)*step,zz=z+(hash(ix,iz,96+k)-.5)*step;if(contains(xx,zz))add(xx,zz);}
  }
  for(let k=0;k<3;k++){
   const rows=groups[k];if(!rows.length)continue;
   const geo=tuftGeometry(T,profile,k,b.detail),mesh=new T.InstancedMesh(geo,mat,rows.length);mesh.name='forma-grass-blades-r86-lod'+b.detail;
   for(let i=0;i<rows.length;i++){
    const [x,y,z,h,w,a,shade,pressed,patch,stripe]=rows[i];
    dummy.position.set(x,y,z);orient(dummy,x,z,a,profile.stripes?.39:0);dummy.scale.set(w,h,w);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    color.copy(palette[Math.min(palette.length-1,Math.floor(shade*palette.length))]).multiplyScalar(.79+.16*shade+.12*patch).lerp(pressedColor,pressed*.12).multiplyScalar(profile.stripes?(stripe?.86:1.07):1);mesh.setColorAt(i,color);
   }
   mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();mesh.castShadow=false;mesh.receiveShadow=true;mesh.raycast=()=>{};root.add(mesh);
   total+=rows.length*(b.detail===0?9:b.detail===1?6:b.detail===2?4:2);triangles+=rows.length*geo.index.count/3;
  }
 }
 total+=addBasalTurf(T,root,{profile,focus,mobile,low,terrainAt,contains,slope,orient,mat});
 addHerbs(T,root,{profile,focus,mobile,low,terrainAt,contains});
 const herbMaterials=root.userData.herbMaterials||[],herbTextures=root.userData.herbTextures||[];
 root.userData={bladeCount:total,triangles,wind:u,dispose(){for(const o of root.children)o.geometry.dispose();mat.dispose();for(const m of herbMaterials)m.dispose();for(const t of herbTextures)t.dispose();for(const t of Object.values(maps))t.dispose();}};
 return root;
}
export function tickDenseLawn(root,now,strength){const u=root?.userData?.wind;if(!u)return false;u.t.value=now*.001;u.wind.value=clamp(strength,0,1);return true;}
