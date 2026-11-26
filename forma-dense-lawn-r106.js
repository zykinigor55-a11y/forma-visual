/* R104 isolated lawn: metric curved blades, three distance bands, seeded
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
function tuftGeometry(T,profile,variant,detail,mobile=false){
 const pos=[],uv=[],col=[],idx=[];
 const count=detail===7?5:detail===6?5:detail===5?3:detail===0?9:detail===1?7:detail===2?6:5;
 const rows=detail===6?2:detail>=4?1:detail===0?7:detail===1?4:3;
 const stride=detail===0?3:2;
 const ratio=profile.width/profile.height;
 for(let n=0;n<count;n++){
  const seed=variant*31+n*7;
  const r=k=>hash(seed,n,k);
  const a=n*2.399963+variant*.83+r(1)*.8,dx=Math.cos(a),dz=Math.sin(a),sx=-dz,sz=dx;
  const base=detail===7?.12+r(2)*.55:detail>=4?.08+r(2)*.48:.025+r(2)*.10,ox=dx*base,oz=dz*base;
  const basal=n>=count-Math.min(4,Math.floor(count*.45));
  const h=(basal?.36:.72)+r(3)*(basal?.29:.42);
  const lean=(basal?.65:.16)+r(4)*(basal?.33:.65);
  const bend=lean*clamp(profile.lean/.30,.65,1.45);
  const half=ratio*(.43+r(5)*.29)*(mobile?(detail===7?1.10:detail===5?1.05:detail===6?1.10:1.05):(detail===5?3.5:detail===4?3.0:detail===3?2.7:detail===2?1.6:detail===1?1.25:1.0));
  const first=pos.length/3,twist=(r(8)-.5)*1.5,curve=(r(9)-.5)*.20,age=r(10);
  for(let j=0;j<rows;j++){
   const t=j/rows,w=half*(.73+.32*Math.sin(t*Math.PI))*Math.pow(1-t,.65);
   const out=h*bend*(.08*t+.92*t*t),y=h*(t-.28*bend*t*t);
   for(const k of (stride===3?[-1,0,1]:[-1,1])){
    const turn=twist*Math.pow(t,1.25),fold=Math.abs(k)*w*(.24+.10*Math.sin(t*3.14));
    const sideways=k*w*Math.cos(turn)+curve*h*t*t,along=fold+k*w*Math.sin(turn)*.35;
    pos.push(ox+dx*(out+along)+sx*sideways,y+k*w*Math.sin(turn)*.72,oz+dz*(out+along)+sz*sideways);
    uv.push((k+1)*.5,t);
    const c=(.63+.37*Math.pow(t,.62))*(.87+.13*r(6));
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
 const radius=mobile?2.2:5.0,step=profile.herbs==='clover'?(mobile?.22:.10):(mobile?.30:.16),rows=kinds.map(()=>[]);
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
  uv.push(0,0,1,0,0,.55,1,.55,.5,1);col.push(.53,.55,.50,.53,.55,.50,.74,.77,.70,.74,.77,.70,.88,.91,.84);
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
 const height=clamp(profile.height*.36,.015,.030);
 rows.forEach(([x,z,r,a],i)=>{
  obj.position.set(x,terrainAt(x,z)+.0005,z);orient(obj,x,z,a*6.283185);obj.scale.set(.025+r*.018,height*(.75+r*.5),.025+r*.018);obj.updateMatrix();m.setMatrixAt(i,obj.matrix);m.setColorAt(i,color.copy(dark).lerp(light,r));
 });
 m.name='forma-basal-turf-r104';m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;m.computeBoundingSphere();m.receiveShadow=true;m.raycast=()=>{};root.add(m);
 return rows.length*count;
}
// During a brush stroke, keep existing roots attached without reallocating buffers.
export function reanchorDenseLawn(T,root,terrainAt,dirty){
 if(!root||!dirty)return;
 // All matrices are column-major; only the translation Y needs changing during a stroke.
 for(const m of root.children){if(!m.isInstancedMesh)continue;let changed=false;
  const a=m.instanceMatrix.array;
  for(let i=0;i<(m.userData?.flowerRanks?.length??m.count);i++){const o=i*16,x=a[o+12],z=a[o+14];if(x<dirty.x0-.15||x>dirty.x1+.15||z<dirty.z0-.15||z>dirty.z1+.15)continue;
   a[o+13]=terrainAt(x,z)+.0005;changed=true;
  }
  if(changed){m.instanceMatrix.needsUpdate=true;m.frustumCulled=false;}
 }
}


// Compact colored mesh builder: tapered stems, elongated kernels and flower florets.
function botanicalMesh(T){
 const p=[],c=[],idx=[];
 function vert(x,y,z,color){p.push(x,y,z);c.push(color.r,color.g,color.b);}
 function tube(x0,y0,z0,x1,y1,z1,r0,r1,color,sides=5){
  const base=p.length/3,dir=new T.Vector3(x1-x0,y1-y0,z1-z0).normalize(),u=new T.Vector3().crossVectors(dir,Math.abs(dir.y)>.9?new T.Vector3(1,0,0):new T.Vector3(0,1,0)).normalize(),v=new T.Vector3().crossVectors(dir,u);
  for(let j=0;j<2;j++)for(let k=0;k<sides;k++){const a=k*6.283185/sides,r=j?r1:r0,dx=(u.x*Math.cos(a)+v.x*Math.sin(a))*r,dy=(u.y*Math.cos(a)+v.y*Math.sin(a))*r,dz=(u.z*Math.cos(a)+v.z*Math.sin(a))*r;vert((j?x1:x0)+dx,(j?y1:y0)+dy,(j?z1:z0)+dz,color);}
  for(let k=0;k<sides;k++){const a=base+k,b=base+(k+1)%sides;idx.push(a,b,a+sides,b,b+sides,a+sides);}
 }
 function grain(x,y,z,rx,ry,rz,color,angle=0,sides=5){
  const base=p.length/3,ca=Math.cos(angle),sa=Math.sin(angle);
  vert(x,y-ry,z,color);
  for(let j=1;j<=2;j++){const yy=(j===1?-.42:.42)*ry;
   for(let k=0;k<sides;k++){const a=k*6.283185/sides,xx=Math.cos(a)*rx*.91,zz=Math.sin(a)*rz*.91;vert(x+xx*ca-zz*sa,y+yy,z+xx*sa+zz*ca,color);}
  }
  const tip=p.length/3;vert(x,y+ry,z,color);
  for(let k=0;k<sides;k++){const a=base+1+k,b=base+1+(k+1)%sides;idx.push(base,b,a,a,b,a+sides,b,b+sides,a+sides,a+sides,b+sides,tip);}
 }
 function build(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setIndex(idx);g.computeVertexNormals();return g;}
 return {tube,grain,build};
}
function botanicalWind(mat,wind,scale){
 mat.onBeforeCompile=shader=>{
  shader.uniforms.formaBotTime=wind.t;shader.uniforms.formaBotWind=wind.wind;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float formaBotTime,formaBotWind;').replace('#include <begin_vertex>',`#include <begin_vertex>
  #ifdef USE_INSTANCING
   vec3 botAnchor=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz;
   float botSway=sin(formaBotTime*1.25+botAnchor.x*1.3+botAnchor.z*.9);
   transformed.x+=botSway*formaBotWind*position.y*position.y*${scale.toFixed(2)};
   transformed.z+=sin(formaBotTime*.9+botAnchor.z*.7)*formaBotWind*position.y*position.y*${(scale*.48).toFixed(2)};
  #endif`);
 };mat.customProgramCacheKey=()=> 'forma-botanical-wind-r104-'+scale;
}
// Flower models use separate near, middle and far geometry, with stable world-space placement.
function flowerGeometry(T,kind,detail,variant){
 const b=botanicalMesh(T),green=new T.Color('#63764b'),cream=new T.Color('#d9d6c5'),white=new T.Color('#f1eee1'),yellow=new T.Color('#d9ac24'),gold=new T.Color('#b78a18');
 const height=kind==='clover'?.095:kind==='yellow'?.15:.19,dx=(variant-1)*.013;
 b.tube(0,0,0,dx*.35,height*.55,0,.0014,.0011,green,detail?4:5);
 b.tube(dx*.35,height*.55,0,dx,height,0,.0011,.0008,green,detail?4:5);
 if(kind==='clover'){
  const n=detail===0?42:detail===1?18:8;
  for(let i=0;i<n;i++){const t=(i+.5)/n,a=i*2.399963,y=height-.004+.019*t,r=.0125*Math.sqrt(Math.max(0,1-Math.pow(2*t-1,2)));
   const x=dx+Math.cos(a)*r,z=Math.sin(a)*r;
   b.grain(x,y,z,.0023,.0045,.0019,i%7===0?cream:white,a,detail?3:5);
  }
 }else{
  // Basal rosette of lanceolate lobed leaves; the veins and lobes have actual geometry.
  const leaves=detail===0?5:detail===1?3:2;
  for(let k=0;k<leaves;k++){
   const a=k*2.399963+variant,ca=Math.cos(a),sa=Math.sin(a),len=.075+.025*hash(k,variant,201);
   b.tube(0,.006,0,ca*len,.018,sa*len,.001,.0004,green,3);
   for(let j=1;j<=(detail===0?5:3);j++){const t=j/(detail===0?6:4),x=ca*len*t,z=sa*len*t;
    for(let side of [-1,1]){const q=a+side*1.0,reach=.015*(1-t*.55);
     b.grain(x+Math.cos(q)*reach*.4,.012+.007*t,z+Math.sin(q)*reach*.4,.009*(1-t*.4),.0016,.005,green,q,4);}
   }
  }
  if(kind==='yellow'){
   b.grain(dx,height,0,.009,.003,.009,gold,0,6);
   const n=detail===0?44:detail===1?22:10;
   for(let i=0;i<n;i++){const a=i*2.399963,t=(i+.5)/n,r=.006+.012*t,x=dx+Math.cos(a)*r,z=Math.sin(a)*r;
    b.grain(x,height+.004+.003*(1-t),z,.008*(.75+.25*t),.0013,.0015,i%6===0?gold:yellow,a,detail?3:4);}
  }else{
   b.grain(dx,height,0,.004,.0035,.004,cream,0,5);
   const n=detail===0?44:detail===1?20:9;
   for(let i=0;i<n;i++){const t=(i+.5)/n,yy=2*t-1,a=i*2.399963,rr=Math.sqrt(1-yy*yy),vx=Math.cos(a)*rr,vz=Math.sin(a)*rr,rad=.021;
    const x=dx+vx*rad,y=height+yy*rad,z=vz*rad;
    b.tube(dx+vx*.004,height+yy*.004,vz*.004,x,y,z,.00017,.000075,cream,3);
    const rays=detail===0?5:detail===1?3:2;
    for(let k=0;k<rays;k++){const q=k*6.283185/rays+a,sz=.0032;
     b.tube(x,y,z,x+Math.cos(q)*sz,y+sz*.65,z+Math.sin(q)*sz,.00012,.000045,white,3);}
   }
  }
 }
 return b.build();
}
function addFlowerField(T,root,{focus,mobile,low,terrainAt,contains,wind,flowerAmount=50,kind='clover'}){
 const mat=new T.MeshStandardMaterial({vertexColors:true,roughness:.88,side:T.DoubleSide,envMapIntensity:.28});
 botanicalWind(mat,wind,kind==='clover'?4.2:2.25);
 const bands=[{lo:0,hi:mobile?2.7:3.5,step:kind==='clover'?.14:.24,detail:0},{lo:mobile?2.7:3.5,hi:mobile?7:9,step:kind==='clover'?.20:.32,detail:1},{lo:mobile?7:9,hi:30,step:kind==='clover'?.29:.42,detail:2}];
 const dummy=new T.Object3D();
 for(const band of bands){
  const groups=[[],[],[]],step=band.step*(mobile?(low?2.4:1.7):low?1.15:1);
  for(let iz=Math.floor((focus.z-band.hi)/step);iz<=Math.ceil((focus.z+band.hi)/step);iz++)for(let ix=Math.floor((focus.x-band.hi)/step);ix<=Math.ceil((focus.x+band.hi)/step);ix++){
   const x=(ix+hash(ix,iz,130))*step,z=(iz+hash(ix,iz,131))*step,d=Math.hypot(x-focus.x,z-focus.z);
   if(d<band.lo||d>=band.hi||!contains(x,z))continue;
   const chance=.58+.42*field(x,z,.8,133),rank=hash(ix,iz,132)/chance;
   if(rank>1)continue;
   groups[Math.min(2,Math.floor(hash(ix,iz,136)*3))].push([x,z,hash(ix,iz,134),hash(ix,iz,135),rank]);
  }
  for(let k=0;k<3;k++){const rows=groups[k];if(!rows.length)continue;
   rows.sort((a,b)=>a[4]-b[4]);const g=flowerGeometry(T,kind,band.detail,k),mesh=new T.InstancedMesh(g,mat,rows.length);
   rows.forEach(([x,z,a,v],i)=>{dummy.position.set(x,terrainAt(x,z),z);dummy.rotation.set(0,a*6.283185,0);dummy.scale.set(.80+v*.36,.68+v*.65,.80+v*.36);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
   mesh.name='forma-flower-'+kind+'-lod'+band.detail;mesh.userData.flowerRanks=rows.map(r=>r[4]);mesh.receiveShadow=true;mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();mesh.raycast=()=>{};root.add(mesh);
  }
 }
 setCloverFlowerAmount(root,flowerAmount);
 (root.userData.herbMaterials||=[]).push(mat);
}
export function setCloverFlowerAmount(root,amount){
 if(!root)return false;let changed=false;
 for(const m of root.children){const ranks=m.userData?.flowerRanks;if(!ranks)continue;
  const limit=clamp(Number(amount)||0,0,100)/100;let lo=0,hi=ranks.length;
  while(lo<hi){const mid=(lo+hi)>>1;if(ranks[mid]<=limit)lo=mid+1;else hi=mid;}
  m.count=limit===0?0:lo;m.visible=m.count>0;changed=true;
 }return changed;
}
function dryStemGeometry(T,detail,variant,height=.76){
 const b=botanicalMesh(T),straw=new T.Color('#a48c59'),husk=new T.Color('#b59a65'),gold=new T.Color('#cbb17c'),awn=new T.Color('#c4b18a');
 const bend=(variant-1)*.052;
 b.tube(0,0,0,bend*.3,.38,0,.0019,.0016,straw,detail?4:6);
 b.tube(bend*.3,.38,0,bend,.75,0,.0016,.0011,straw,detail?4:6);
 const rings=detail===0?12:detail===1?8:4;
 for(let j=0;j<rings;j++){
  const t=j/(rings-1),y=.665+t*.095,r=.0045*(1-.48*t),a=(j%2)*Math.PI*.28+variant*.8;
  for(let k=0;k<2;k++){const ang=a+k*Math.PI,x=bend*(y/.75)+Math.cos(ang)*r,z=Math.sin(ang)*r;
   b.grain(x,y,z,.0030*(1-.28*t),.0072,.0021,j%3===0?gold:husk,ang,detail?4:7);
   if(detail===0){const c=Math.cos(ang),d=Math.sin(ang);b.grain(x+c*.0016,y+.001,z+d*.0016,.0018,.008,.0011,husk,ang,5);b.tube(x+c*.003,y-.005,z+d*.003,x+c*.002,y+.008,z+d*.002,.00022,.00009,straw,3);}
   if(detail<2){const reach=.012+.009*hash(j,k,variant+155),rise=.038+.025*hash(j,k,variant+156);b.tube(x,y+.005,z,x+Math.cos(ang)*reach,y+rise,z+Math.sin(ang)*reach,.00037,.00007,awn,3);}
  }
 }
 if(detail<2){for(let j=0;j<2;j++){const y=.19+j*.20,dir=j?-1:1;b.grain(dir*.027,y+.055,.002,.004,.067,.002,straw,0,4);b.tube(0,y,0,dir*.034,y+.12,.008,.0012,.0003,straw,3);}}
 const g=b.build(),p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);p.setY(i,y<.65?y*(height-.11)/.65:y+height-.76);}p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();return g;
}
function createDryField(T,{profile,focus,mobile,low,terrainAt,contains,bounds}){
 const root=new T.Group(),wind={t:{value:0},wind:{value:0}},mat=new T.MeshStandardMaterial({vertexColors:true,roughness:.92,side:T.DoubleSide,envMapIntensity:.32});
 root.name='forma-dry-cereal-field-r104';botanicalWind(mat,wind,.18);
 const dummy=new T.Object3D(),tint=new T.Color(),white=new T.Color('#ddc8a0'),ochre=new T.Color('#aa9470');
 const bands=[{lo:0,hi:mobile?2.8:4,step:mobile?.083:.072,d:0},{lo:mobile?2.8:4,hi:mobile?7:9,step:mobile?.13:.105,d:1},{lo:mobile?7:9,hi:25,step:mobile?.24:.19,d:2}];
 if(bounds){const area=(bounds.x1-bounds.x0)*(bounds.z1-bounds.z0);bands.push({lo:25,hi:Math.hypot(Math.max(Math.abs(bounds.x0-focus.x),Math.abs(bounds.x1-focus.x)),Math.max(Math.abs(bounds.z0-focus.z),Math.abs(bounds.z1-focus.z)))+1,step:Math.max(.30,Math.sqrt(area/(mobile?18000:36000))),d:2,full:true});}
 let total=0;
 for(const b of bands){const step=b.step*(mobile?(low?2.4:1.7):low?1.20:1)/Math.sqrt(mobile?Math.min(1.2,profile.density):profile.density),groups=[[],[],[]];
  for(let iz=Math.floor((b.full?bounds.z0:focus.z-b.hi)/step);iz<=Math.ceil((b.full?bounds.z1:focus.z+b.hi)/step);iz++)for(let ix=Math.floor((b.full?bounds.x0:focus.x-b.hi)/step);ix<=Math.ceil((b.full?bounds.x1:focus.x+b.hi)/step);ix++){
   const x=(ix+hash(ix,iz,140))*step,z=(iz+hash(ix,iz,141))*step,d=Math.hypot(x-focus.x,z-focus.z);
   if(d<b.lo||d>=b.hi||!contains(x,z))continue;
   const v=hash(ix,iz,142),a=hash(ix,iz,143),h=.83+v*.34+(field(x,z,1.1,144)-.5)*.14;
   groups[Math.min(2,Math.floor(hash(ix,iz,145)*3))].push([x,z,h,a,v]);
  }
  for(let k=0;k<3;k++){const rows=groups[k];if(!rows.length)continue;const g=dryStemGeometry(T,b.d,k,profile.height),m=new T.InstancedMesh(g,mat,rows.length);
   rows.forEach(([x,z,h,a,v],i)=>{dummy.position.set(x,terrainAt(x,z),z);dummy.rotation.set((v-.5)*.17,a*6.283185,(a-.5)*.12,'YXZ');dummy.scale.set(.85+v*.25,h,.85+v*.25);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);m.setColorAt(i,tint.copy(ochre).lerp(white,v));});
   m.name='forma-dry-ears-lod'+b.d;m.receiveShadow=true;m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;m.computeBoundingSphere();m.raycast=()=>{};root.add(m);total+=rows.length;
  }
 }
 root.userData={bladeCount:total,wind,dispose(){for(const o of root.children)o.geometry.dispose();mat.dispose();}};return root;
}


// Broad, inexpensive three-leaf clusters beyond the camera-centered detailed carpet.
function addDistantTurf(T,root,{profile,focus,bounds,horizon,mobile,low,terrainAt,contains,mat,palette}){
 const area=Math.max(1,(bounds.x1-bounds.x0)*(bounds.z1-bounds.z0));
 const step=Math.max(mobile?.16:.09,Math.sqrt(area/(mobile?(low?15000:26000):145000)))/Math.sqrt(Math.max(.65,Math.min(mobile?1.35:1.4,profile.density)));
 const rows=[],geo=tuftGeometry(T,profile,1,mobile?7:4,mobile),dummy=new T.Object3D(),color=new T.Color(),fall=new T.Color('#a69a59');
 for(let iz=Math.floor(bounds.z0/step);iz<=Math.ceil(bounds.z1/step);iz++)for(let ix=Math.floor(bounds.x0/step);ix<=Math.ceil(bounds.x1/step);ix++){
  const x=(ix+hash(ix,iz,181))*step,z=(iz+hash(ix,iz,182))*step,d=Math.hypot(x-focus.x,z-focus.z);
  if((mobile?d<(low?3.6:4.9):d<horizon-6)||!contains(x,z))continue;
  if(!mobile&&hash(ix,iz,183)>smooth(clamp((d-horizon+6)/4,0,1)))continue;
  rows.push([x,z,hash(ix,iz,184),hash(ix,iz,185)]);
 }
 if(!rows.length){geo.dispose();return 0;}
 const m=new T.InstancedMesh(geo,mat,rows.length);
 rows.forEach(([x,z,v,a],i)=>{const h=profile.height*(.85+.36*v),w=mobile?h*(.95+.20*v):Math.max(h,step*.96);
  dummy.position.set(x,terrainAt(x,z)+.006,z);dummy.rotation.set(0,a*6.283185,0);dummy.scale.set(w,h,w);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);color.copy(palette[Math.min(palette.length-1,Math.floor(v*palette.length))]);if(profile.season==='autumn')color.lerp(fall,.35+.45*field(x,z,.45,190));m.setColorAt(i,color);
 });
 m.name='forma-parcel-distant-turf-r104';m.receiveShadow=true;m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;m.computeBoundingSphere();m.raycast=()=>{};root.add(m);return rows.length*5;
}

export function createDenseLawn(T,{profile,focus,mobile=false,terrainAt,contains=()=>true,low=false,bounds=null}){
 if(profile.crop)return createDryField(T,{profile,focus,mobile,low,terrainAt,contains,bounds});
 const root=new T.Group();root.name='forma-dense-lawn-r106';const maps=mobile?{}:bladeMaps(T),u={t:{value:0},wind:{value:0}};
 const mat=mobile?new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.92,metalness:0,envMapIntensity:.20}):new T.MeshPhysicalMaterial({...maps,vertexColors:true,side:T.DoubleSide,roughness:.90,metalness:0,clearcoat:.03,clearcoatRoughness:.85,specularIntensity:.22,normalScale:new T.Vector2(.12,.10),envMapIntensity:.23});
 mat.onBeforeCompile=shader=>{
  shader.uniforms.formaGrassTime=u.t;shader.uniforms.formaGrassWind=u.wind;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float formaGrassTime,formaGrassWind;').replace('#include <begin_vertex>',`#include <begin_vertex>
  #ifdef USE_INSTANCING
   vec3 grassAnchor=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz;
   float sway=.72*sin(formaGrassTime*1.1+grassAnchor.x*.95+grassAnchor.z*.72)+.28*sin(formaGrassTime*2.4+grassAnchor.x*2.2-grassAnchor.z*1.7);
   float flex=clamp(position.y,0.,1.);flex*=flex; transformed.z+=sway*formaGrassWind*.42*flex; transformed.x+=sin(formaGrassTime*1.65+grassAnchor.x*.72+grassAnchor.z*.5)*formaGrassWind*.18*flex;
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
    reflectedLight.indirectDiffuse*=mix(.94,1.0,formaRoot);
    reflectedLight.indirectSpecular*=mix(.91,1.0,formaRoot);
    reflectedLight.directDiffuse*=mix(.95,1.0,formaRoot);
   #endif
  `);

 };
 mat.customProgramCacheKey=()=> 'forma-grass-r118';
 const pressedColor=new T.Color('#746c47'),color=new T.Color(),palette=profile.palette.map(c=>new T.Color(c).lerp(new T.Color('#46603b'),.12)),dummy=new T.Object3D();const autumnColors=['#7b824c','#a29b56','#b3a15a','#997c43','#806a42','#65794a'].map(c=>new T.Color(c));
 const cx=Math.round(focus.x/.6)*.6,cz=Math.round(focus.z/.6)*.6;
 const integrated=!!profile.integrated;const near=mobile?(integrated?1.05:1.15):1.55,mid=mobile?(integrated?3.0:3.2):4.0,far=mobile?7.5:9.2,horizon=mobile?14:19;
 const bands=mobile?[{min:0,max:low?2.1:2.5,step:low?.046:.039,detail:2},{min:low?1.7:2.1,max:low?4.6:6.0,step:low?.088:.073,detail:6}]:[{min:0,max:near+.24,step:.020,detail:0},{min:near-.24,max:mid+.36,step:.028,detail:1},{min:mid-.36,max:far+1.2,step:.048,detail:2},{min:far-1.2,max:horizon,step:.065,detail:3}];
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
  const step=b.step/Math.sqrt(mobile?Math.min(1.35,profile.density):profile.density)*(low&&bandIndex<2?1.06:1)*(mobile?1:bandIndex===0?.81:bandIndex===1?.90:1),groups=[[],[],[]];
  for(let iz=Math.floor((cz-b.max)/step);iz<=Math.ceil((cz+b.max)/step);iz++)for(let ix=Math.floor((cx-b.max)/step);ix<=Math.ceil((cx+b.max)/step);ix++){
   const x=(ix+hash(ix,iz,1)+(mobile?(hash(ix,iz,91)-.5)*.65:0))*step,z=(iz+hash(ix,iz,2)+(mobile?(hash(ix,iz,92)-.5)*.65:0))*step,d=Math.hypot(x-cx,z-cz);
   if(d<b.min||d>b.max||!contains(x,z))continue;
   const fadeIn=bandIndex===0?1:smooth(clamp((d-b.min)/(bandIndex===1?.48:bandIndex===2?.72:2.4),0,1)),fadeOut=smooth(clamp((b.max-d)/(bandIndex===0?.48:bandIndex===1?.72:bandIndex===2?2.4:5.0),0,1));
   if(hash(ix,iz,11)>Math.min(1,Math.max(.18,fadeIn*fadeOut)))continue;
   const patch=field(x,z,1.45,32)*.65+field(x,z,4.1,33)*.35;
   const tuft=field(x,z,15,34);const pressed=clamp(smooth(clamp((field(x,z,.83,35)*.73+field(x,z,2.1,36)*.27-.46)/.29,0,1))*(profile.pressedAmount??45)/45,0,1);
   const r=hash(ix,iz,3),h=profile.height*(1+(hash(ix,iz,4)-.5)*2*profile.variation)*(.72+.62*patch)*(.84+.32*tuft);
   const w=Math.max(h*(.94+.24*r)*(1+pressed*.50)*(bandIndex===3?1.5:bandIndex===2?1.13:1),bandIndex>=2?step*.92:0);
   const shade=hash(ix,iz,6),variant=Math.min(2,Math.floor(hash(ix,iz,7)*3));
   const angle=field(x,z,.65,39)*Math.PI*4;const randomAngle=hash(ix,iz,8)*Math.PI*2;
   const stripe=profile.stripes?Math.floor((x+12)/profile.stripes)%2:0;
   const yaw=profile.stripes?(stripe?Math.PI:0)+(randomAngle-Math.PI)*.09:pressed>.4?angle+(randomAngle-Math.PI)*.35:randomAngle;
   const add=(xx,zz)=>groups[variant].push([xx,terrainAt(xx,zz)+.004,zz,h*(1-(profile.stripes?.18:.43)*pressed),w,yaw,shade,pressed,patch,stripe]);
   add(x,z);
   // Area of a sloped patch / its XZ projection = sqrt(1 + dx² + dz²).
   const extra=mobile?0:clamp(slope(x,z).area-1,0,1.35);
   for(let k=0;k<2;k++){if(hash(ix,iz,90+k)>=clamp(extra-k,0,1))continue;const xx=x+(hash(ix,iz,94+k)-.5)*step,zz=z+(hash(ix,iz,96+k)-.5)*step;if(contains(xx,zz))add(xx,zz);}
  }
  for(let k=0;k<3;k++){
   const rows=groups[k];if(!rows.length)continue;
   const geo=tuftGeometry(T,profile,k,b.detail,mobile),mesh=new T.InstancedMesh(geo,mat,rows.length);mesh.name='forma-grass-blades-r104-lod'+b.detail;
   for(let i=0;i<rows.length;i++){
    const [x,y,z,h,w,a,shade,pressed,patch,stripe]=rows[i];
    dummy.position.set(x,y,z);orient(dummy,x,z,a,profile.stripes?.39:0);dummy.scale.set(w,h,w);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    color.copy(palette[Math.min(palette.length-1,Math.floor(shade*palette.length))]).multiplyScalar(.94+.12*shade+.10*patch).lerp(pressedColor,pressed*.12).multiplyScalar(profile.stripes?(stripe?.86:1.07):1);if(profile.season==='autumn'){const a=field(x,z,.37,170)*.65+field(x,z,2.0,171)*.35;const k=Math.min(5,Math.floor(a*6));color.lerp(autumnColors[k],.38+.45*field(x,z,1.3,172));}mesh.setColorAt(i,color);
   }
   mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();mesh.castShadow=false;mesh.receiveShadow=true;mesh.raycast=()=>{};root.add(mesh);
   total+=rows.length*(b.detail===6?5:b.detail===0?9:b.detail===1?7:b.detail===2?6:5);triangles+=rows.length*geo.index.count/3;
  }
 }
 if(bounds)total+=addDistantTurf(T,root,{profile,focus:{x:cx,z:cz},bounds,horizon,mobile,low,terrainAt,contains,mat,palette});
 if(!mobile)total+=addBasalTurf(T,root,{profile,focus,mobile,low,terrainAt,contains,slope,orient,mat});
 addHerbs(T,root,{profile,focus,mobile,low,terrainAt,contains});
 for(const m of (root.userData.herbMaterials||[]))botanicalWind(m,u,2.0);
 if(profile.herbs==='clover'||profile.flowers)addFlowerField(T,root,{focus,mobile,low,terrainAt,contains,wind:u,flowerAmount:profile.flowerAmount??65,kind:profile.flowers||'clover'});
 const herbMaterials=root.userData.herbMaterials||[],herbTextures=root.userData.herbTextures||[];
 root.userData={bladeCount:total,triangles,wind:u,dispose(){for(const o of root.children)o.geometry.dispose();mat.dispose();for(const m of herbMaterials)m.dispose();for(const t of herbTextures)t.dispose();for(const t of Object.values(maps))t.dispose();}};
 return root;
}
export function tickDenseLawn(root,now,strength){const u=root?.userData?.wind;if(!u)return false;u.t.value=now*.001;u.wind.value=clamp(strength,0,1);return true;}
