/* R83 isolated lawn: metric curved blades, three distance bands, seeded
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
 const rows=detail===0?4:detail===1?3:2;
 const stride=detail===0?3:2;
 const ratio=profile.width/profile.height;
 for(let n=0;n<count;n++){
  const seed=variant*31+n*7;
  const r=k=>hash(seed,n,k);
  const a=n*2.399963+variant*.83+r(1)*.8,dx=Math.cos(a),dz=Math.sin(a),sx=-dz,sz=dx;
  const base=.025+r(2)*.10,ox=dx*base,oz=dz*base;
  const basal=n>=count-3;
  const h=(basal?.36:.72)+r(3)*(basal?.29:.42);
  const lean=(basal?.65:.16)+r(4)*(basal?.33:.65);
  const bend=lean*clamp(profile.lean/.30,.65,1.45);
  const half=ratio*(.52+r(5)*.38)*(detail===3?5.4:detail===2?2.45:detail===1?1.65:1.12);
  const first=pos.length/3;
  for(let j=0;j<rows;j++){
   const t=j/rows,w=half*(.73+.32*Math.sin(t*Math.PI))*Math.pow(1-t,.65);
   const out=h*bend*(.15*t+.85*t*t),y=h*(t-.28*bend*t*t);
   for(const k of (stride===3?[-1,0,1]:[-1,1])){
    const fold=Math.abs(k)*w*.30;
    pos.push(ox+dx*(out+fold)+sx*k*w,y,oz+dz*(out+fold)+sz*k*w);
    uv.push((k+1)*.5,t);
    const c=(.34+.66*Math.pow(t,.56))*(.90+.10*r(6));
    col.push(c,c,c);
   }
  }
  for(let j=0;j<rows-1;j++)for(let k=0;k<stride-1;k++){
   const a=first+j*stride+k,b=a+stride;idx.push(a,b,a+1,a+1,b,b+1);
  }
  const tip=pos.length/3;pos.push(ox+dx*h*bend,h*(1-.28*bend),oz+dz*h*bend);uv.push(.5,1);col.push(.87,.92,.87);
  for(let k=0;k<stride-1;k++)idx.push(first+(rows-1)*stride+k,tip,first+(rows-1)*stride+k+1);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();const normals=g.getAttribute('normal');for(let i=0;i<normals.count;i++){const x=normals.getX(i)*.65,y=normals.getY(i)*.65+.35,z=normals.getZ(i)*.65,l=Math.hypot(x,y,z)||1;normals.setXYZ(i,x/l,y/l,z/l);}return g;
}
function bladeMaps(T){
 const w=128,h=256,albedo=new Uint8Array(w*h*4),normal=new Uint8Array(w*h*4),rough=new Uint8Array(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const u=x/(w-1),v=y/(h-1),vein=Math.exp(-Math.pow((u-.5)*30,2)),fine=Math.sin(u*91+v*.9)*.55+Math.sin(u*173)*.25,grain=hash(x,y,8)-.5;
  const c=clamp(210+vein*23+fine*13+grain*9+5*Math.sin(v*22+u*3),175,248),i=(y*w+x)*4;
  albedo.set([c*.96,c,Math.max(0,c*.94),255],i);
  const dx=.09*Math.cos(u*91)+.035*Math.cos(u*173)+.15*Math.sin((u-.5)*42)*vein,l=Math.hypot(dx,1);normal.set([128+127*dx/l,128,128+127/l,255],i);
  const r=clamp(177+fine*18-vein*34+grain*14,115,220);rough.set([r,r,r,255],i);
 }
 const tex=(a,srgb=false)=>{const t=new T.DataTexture(a,w,h,T.RGBAFormat);t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;};
 return {map:tex(albedo,true),normalMap:tex(normal),roughnessMap:tex(rough)};
}

// Distinct broadleaf geometry: trifoliate clover, plantain-like rosettes,
// and narrow sedge blades. Shared instances keep the mobile draw count low.
function herbGeometry(T,kind){
 const p=[],c=[],uv=[],idx=[];
 function leaf(a,bx,by,bz,len,width,rise,kind){
  const dx=Math.cos(a),dz=Math.sin(a),sx=-dz,sz=dx,first=p.length/3,rows=6;
  for(let j=0;j<=rows;j++){
   const t=j/rows;
   const shape=kind==='clover'?Math.pow(Math.sin(Math.PI*t),.65)*(1+.20*t):Math.pow(Math.sin(Math.PI*t),.82);
   const w=Math.max(.002,width*shape),y=by+rise*Math.sin(t*Math.PI*.62);
   for(let k=-1;k<=1;k++){
    p.push(bx+dx*len*t+sx*k*w,y-Math.abs(k)*w*.16,bz+dz*len*t+sz*k*w);
    const vein=k===0?1.13:.92;const mark=kind==='clover'&&j===2?1.2:1;
    c.push(.79*vein*mark,.96*vein*mark,.73*vein*mark);uv.push((k+1)*.5,t);
   }
  }
  for(let j=0;j<rows;j++)for(let k=0;k<2;k++){const a=first+j*3+k,b=a+3;idx.push(a,b,a+1,a+1,b,b+1);}
 }
 if(kind==='clover'){
  // Three leaflets on each of three stalks at different heights.
  for(let n=0;n<3;n++){const a=n*2.39996,x=Math.cos(a)*.018,z=Math.sin(a)*.018,y=.027+n*.013;
   leaf(a,0,0,0,.023,.0016,y,'stem');
   for(let k=0;k<3;k++)leaf(a+k*Math.PI*2/3,x,y,z,.022,.010,.004,'clover');
  }
 }else if(kind==='plantain'){for(let n=0;n<6;n++)leaf(n*2.39996,0,.005,0,.085+(n%3)*.024,.014+(n%2)*.006,.025+(n%3)*.012,'plantain');}
 else {for(let n=0;n<7;n++)leaf(n*2.39996,0,0,0,.075+(n%3)*.035,.0035,.10+(n%4)*.024,'sedge');}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
function addHerbs(T,root,{profile,focus,mobile,low,terrainAt,contains}){
 if(!profile.herbs)return;
 const kinds=profile.herbs==='clover'?['clover']:['plantain','sedge','clover'];
 const radius=mobile?5.5:8,step=profile.herbs==='clover'?(mobile?.105:.085):(mobile?.20:.16),rows=kinds.map(()=>[]);
 for(let iz=Math.floor((focus.z-radius)/step);iz<=Math.ceil((focus.z+radius)/step);iz++)for(let ix=Math.floor((focus.x-radius)/step);ix<=Math.ceil((focus.x+radius)/step);ix++){
  const x=(ix+hash(ix,iz,60))*step,z=(iz+hash(ix,iz,61))*step,d=Math.hypot(x-focus.x,z-focus.z);
  if(d>radius||!contains(x,z))continue;
  const patch=field(x,z,1.7,62),chance=(profile.herbs==='clover'? .20+.62*patch:.10+.53*patch)*(low?.65:1)*clamp((radius-d)/1.1,0,1);
  if(hash(ix,iz,63)>chance)continue;
  const k=Math.min(kinds.length-1,Math.floor(hash(ix,iz,64)*kinds.length));rows[k].push([x,terrainAt(x,z),z,hash(ix,iz,65),hash(ix,iz,66)]);
 }
 const mat=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.68,metalness:0,envMapIntensity:.28});
 const dummy=new T.Object3D(),color=new T.Color();
 for(let k=0;k<kinds.length;k++){if(!rows[k].length)continue;const g=herbGeometry(T,kinds[k]),m=new T.InstancedMesh(g,mat,rows[k].length);
  rows[k].forEach(([x,y,z,a,b],i)=>{dummy.position.set(x,y,z);dummy.rotation.set(0,a*6.283185,0);dummy.scale.setScalar(.72+b*.58);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);color.set('#64834d').lerp(new T.Color('#3d5b35'),b*.65);m.setColorAt(i,color);});
  m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;m.computeBoundingSphere();m.receiveShadow=true;m.raycast=()=>{};m.name='forma-lawn-herb-'+kinds[k];root.add(m);
 }
 root.userData.herbMaterial=mat;
}

export function createDenseLawn(T,{profile,focus,mobile=false,terrainAt,contains=()=>true,low=false}){
 const root=new T.Group();root.name='forma-dense-lawn-r83';const maps=bladeMaps(T),u={t:{value:0},wind:{value:0}};
 const mat=new T.MeshStandardMaterial({...maps,vertexColors:true,side:T.DoubleSide,roughness:.83,metalness:0,normalScale:new T.Vector2(.25,.12),envMapIntensity:.34});
 mat.onBeforeCompile=shader=>{
  shader.uniforms.formaGrassTime=u.t;shader.uniforms.formaGrassWind=u.wind;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float formaGrassTime,formaGrassWind;').replace('#include <begin_vertex>',`#include <begin_vertex>
  #ifdef USE_INSTANCING
   vec3 grassAnchor=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz;
   float sway=.72*sin(formaGrassTime*1.1+grassAnchor.x*.95+grassAnchor.z*.72)+.28*sin(formaGrassTime*2.4+grassAnchor.x*2.2-grassAnchor.z*1.7);
   transformed.z+=sway*formaGrassWind*.09*uv.y*uv.y;
  #endif`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   roughnessFactor=clamp(roughnessFactor,.43,.86);
  `).replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
   #if NUM_DIR_LIGHTS > 0
    vec3 grassL=directionalLights[0].direction;
    float back=max(0.0,dot(-normal,grassL));
    float forward=pow(max(0.0,dot(-grassL,normalize(vViewPosition))),3.0);
    reflectedLight.directDiffuse+=diffuseColor.rgb*directionalLights[0].color*(back*.13+forward*.065)*vec3(.94,1.0,.63);
   #endif
  `);
 };
 mat.customProgramCacheKey=()=> 'forma-grass-r83';
 const pressedColor=new T.Color('#746c47'),color=new T.Color(),palette=profile.palette.map(c=>new T.Color(c).lerp(new T.Color('#36533a'),.24)),dummy=new T.Object3D();
 const cx=Math.round(focus.x/.6)*.6,cz=Math.round(focus.z/.6)*.6;
 const near=mobile?.75:1.25,mid=mobile?2.3:3.5,far=mobile?6.3:8.5,horizon=mobile?12:17;
 const bands=[{min:0,max:near+.24,step:mobile?.024:.020,detail:0},{min:near-.24,max:mid+.36,step:mobile?.031:.028,detail:1},{min:mid-.36,max:far+1.2,step:mobile?.052:.048,detail:2},{min:far-1.2,max:horizon,step:mobile?.15:.12,detail:3}];
 let total=0,triangles=0;
 for(const [bandIndex,b] of bands.entries()){
  const step=b.step/Math.sqrt(profile.density)*(low?1.16:1)*(bandIndex===0?.81:bandIndex===1?.90:1),groups=[[],[],[]];
  for(let iz=Math.floor((cz-b.max)/step);iz<=Math.ceil((cz+b.max)/step);iz++)for(let ix=Math.floor((cx-b.max)/step);ix<=Math.ceil((cx+b.max)/step);ix++){
   const x=(ix+hash(ix,iz,1))*step,z=(iz+hash(ix,iz,2))*step,d=Math.hypot(x-cx,z-cz);
   if(d<b.min||d>b.max||!contains(x,z))continue;
   const fadeIn=bandIndex===0?1:clamp((d-b.min)/(bandIndex===1?.48:bandIndex===2?.72:2.4),0,1),fadeOut=clamp((b.max-d)/(bandIndex===0?.48:bandIndex===1?.72:bandIndex===2?2.4:3.5),0,1);
   if(hash(ix,iz,11)>fadeIn*fadeOut)continue;
   const patch=field(x,z,1.45,32)*.65+field(x,z,4.1,33)*.35;
   const tuft=field(x,z,15,34);const pressed=smooth(clamp((field(x,z,.83,35)*.73+field(x,z,2.1,36)*.27-.46)/.29,0,1));
   const r=hash(ix,iz,3),h=profile.height*(1+(hash(ix,iz,4)-.5)*2*profile.variation)*(.72+.62*patch)*(.84+.32*tuft);
   const w=h*(.94+.24*r)*(1+pressed*.50);
   const shade=hash(ix,iz,6),variant=Math.min(2,Math.floor(hash(ix,iz,7)*3));
   const angle=field(x,z,.65,39)*Math.PI*4;const randomAngle=hash(ix,iz,8)*Math.PI*2;
   const stripe=profile.stripes?Math.floor((x+12)/profile.stripes)%2:0;
   groups[variant].push([x,terrainAt(x,z)-.0015,z,h*(1-(profile.stripes?.18:.60)*pressed),w,profile.stripes?(stripe?Math.PI:0)+(randomAngle-Math.PI)*.09:pressed>.4?angle+(randomAngle-Math.PI)*.35:randomAngle,shade,pressed,patch,stripe]);
  }
  for(let k=0;k<3;k++){
   const rows=groups[k];if(!rows.length)continue;
   const geo=tuftGeometry(T,profile,k,b.detail),mesh=new T.InstancedMesh(geo,mat,rows.length);mesh.name='forma-grass-blades-r83-lod'+b.detail;
   for(let i=0;i<rows.length;i++){
    const [x,y,z,h,w,a,shade,pressed,patch,stripe]=rows[i];
    dummy.position.set(x,y,z);dummy.rotation.set(profile.stripes?.39:0,a,0,'YXZ');dummy.scale.set(w,h,w);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    color.copy(palette[Math.min(palette.length-1,Math.floor(shade*palette.length))]).multiplyScalar(.85+.16*shade+.12*patch).lerp(pressedColor,pressed*.12).multiplyScalar(profile.stripes?(stripe?.86:1.07):1);mesh.setColorAt(i,color);
   }
   mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();mesh.castShadow=false;mesh.receiveShadow=true;mesh.raycast=()=>{};root.add(mesh);
   total+=rows.length*(b.detail===0?9:b.detail===1?6:b.detail===2?4:2);triangles+=rows.length*geo.index.count/3;
  }
 }
 addHerbs(T,root,{profile,focus,mobile,low,terrainAt,contains});
 const herbMaterial=root.userData.herbMaterial;
 root.userData={bladeCount:total,triangles,wind:u,dispose(){for(const o of root.children)o.geometry.dispose();mat.dispose();herbMaterial?.dispose();for(const t of Object.values(maps))t.dispose();}};
 return root;
}
export function tickDenseLawn(root,now,strength){const u=root?.userData?.wind;if(!u)return false;u.t.value=now*.001;u.wind.value=clamp(strength,0,1);return true;}
