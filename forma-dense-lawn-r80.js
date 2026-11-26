/* R80 isolated lawn: metric curved blades, three distance bands, seeded
 * variation and shared GPU instance buffers. Existing ground photo stays below.
 * Blade microstructure is procedural, not a photographic scan. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function hash(x,z,n){let k=Math.imul(x,374761393)^Math.imul(z,668265263)^Math.imul(n,1274126177);k=Math.imul(k^(k>>>13),1274126177);return ((k^(k>>>16))>>>0)/4294967296;}
// Each instanced clump contains several separately curved, folded leaves.
function tuftGeometry(T,profile,variant,detail){
 const pos=[],uv=[],col=[],idx=[];
 const count=detail===0?7:detail===1?5:3;
 const rows=detail===0?4:detail===1?3:2;
 const stride=detail===0?3:2;
 const ratio=profile.width/profile.height;
 for(let n=0;n<count;n++){
  const seed=variant*31+n*7;
  const r=k=>hash(seed,n,k);
  const a=n*2.399963+variant*.83+r(1)*.8,dx=Math.cos(a),dz=Math.sin(a),sx=-dz,sz=dx;
  const base=.025+r(2)*.10,ox=dx*base,oz=dz*base;
  const basal=n>=count-2;
  const h=(basal?.36:.72)+r(3)*(basal?.29:.42);
  const lean=(basal?.65:.16)+r(4)*(basal?.33:.65);
  const bend=lean*clamp(profile.lean/.30,.65,1.45);
  const half=ratio*(.54+r(5)*.38)*(detail===2?3.1:detail===1?1.85:1.25);
  const first=pos.length/3;
  for(let j=0;j<rows;j++){
   const t=j/rows,w=half*(.73+.32*Math.sin(t*Math.PI))*Math.pow(1-t,.65);
   const out=h*bend*(.15*t+.85*t*t),y=h*(t-.28*bend*t*t);
   for(const k of (stride===3?[-1,0,1]:[-1,1])){
    const fold=Math.abs(k)*w*.30;
    pos.push(ox+dx*(out+fold)+sx*k*w,y,oz+dz*(out+fold)+sz*k*w);
    uv.push((k+1)*.5,t);
    const c=(.62+.38*Math.pow(t,.42))*(.88+.12*r(6));
    col.push(c,c,c);
   }
  }
  for(let j=0;j<rows-1;j++)for(let k=0;k<stride-1;k++){
   const a=first+j*stride+k,b=a+stride;idx.push(a,b,a+1,a+1,b,b+1);
  }
  const tip=pos.length/3;pos.push(ox+dx*h*bend,h*(1-.28*bend),oz+dz*h*bend);uv.push(.5,1);col.push(.97,.98,.93);
  for(let k=0;k<stride-1;k++)idx.push(first+(rows-1)*stride+k,tip,first+(rows-1)*stride+k+1);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
function bladeMaps(T){
 const w=64,h=128,albedo=new Uint8Array(w*h*4),normal=new Uint8Array(w*h*4),rough=new Uint8Array(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const u=x/(w-1),v=y/(h-1),vein=Math.exp(-Math.pow((u-.5)*30,2)),fine=Math.sin(u*91+v*.9)*.55+Math.sin(u*173)*.25,grain=hash(x,y,8)-.5;
  const c=clamp(218+vein*17+fine*9+grain*7,185,250),i=(y*w+x)*4;
  albedo.set([c,c,Math.max(0,c-5),255],i);
  const dx=.09*Math.cos(u*91)+.035*Math.cos(u*173)+.15*Math.sin((u-.5)*42)*vein,l=Math.hypot(dx,1);normal.set([128+127*dx/l,128,128+127/l,255],i);
  const r=clamp(173+fine*9-vein*12+grain*9,145,198);rough.set([r,r,r,255],i);
 }
 const tex=(a,srgb=false)=>{const t=new T.DataTexture(a,w,h,T.RGBAFormat);t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;};
 return {map:tex(albedo,true),normalMap:tex(normal),roughnessMap:tex(rough)};
}
export function createDenseLawn(T,{profile,focus,mobile=false,terrainAt,contains=()=>true,low=false}){
 const root=new T.Group();root.name='forma-dense-lawn-r80';const maps=bladeMaps(T),u={t:{value:0},wind:{value:0}};
 const mat=new T.MeshStandardMaterial({...maps,vertexColors:true,side:T.DoubleSide,roughness:.94,metalness:0,normalScale:new T.Vector2(.18,.18),envMapIntensity:.32});
 mat.onBeforeCompile=shader=>{
  shader.uniforms.formaGrassTime=u.t;shader.uniforms.formaGrassWind=u.wind;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float formaGrassTime,formaGrassWind;').replace('#include <begin_vertex>',`#include <begin_vertex>
  #ifdef USE_INSTANCING
   vec3 grassAnchor=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz;
   float sway=.72*sin(formaGrassTime*1.1+grassAnchor.x*.95+grassAnchor.z*.72)+.28*sin(formaGrassTime*2.4+grassAnchor.x*2.2-grassAnchor.z*1.7);
   transformed.z+=sway*formaGrassWind*.09*uv.y*uv.y;
  #endif`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   roughnessFactor=clamp(roughnessFactor,.62,.96);
  `);
 };
 mat.customProgramCacheKey=()=> 'forma-grass-r80';
 const color=new T.Color(),palette=profile.palette.map(c=>new T.Color(c)),dummy=new T.Object3D();
 const cx=Math.round(focus.x/.6)*.6,cz=Math.round(focus.z/.6)*.6;
 const near=mobile?.70:1.25,mid=mobile?2.3:3.5,far=mobile?5.6:7.8;
 const bands=[{min:0,max:near+.24,step:mobile?.024:.020,detail:0},{min:near-.24,max:mid+.36,step:mobile?.031:.028,detail:1},{min:mid-.36,max:far,step:mobile?.058:.048,detail:2}];
 let total=0,triangles=0;
 for(const [bandIndex,b] of bands.entries()){
  const step=b.step/Math.sqrt(profile.density)*(low?1.22:1),groups=[[],[],[]];
  for(let iz=Math.floor((cz-b.max)/step);iz<=Math.ceil((cz+b.max)/step);iz++)for(let ix=Math.floor((cx-b.max)/step);ix<=Math.ceil((cx+b.max)/step);ix++){
   const x=(ix+hash(ix,iz,1))*step,z=(iz+hash(ix,iz,2))*step,d=Math.hypot(x-cx,z-cz);
   if(d<b.min||d>b.max||!contains(x,z))continue;
   const fadeIn=bandIndex===0?1:clamp((d-b.min)/(bandIndex===1?.48:.72),0,1),fadeOut=bandIndex===2?clamp((far-d)/.8,0,1):clamp((b.max-d)/(bandIndex===0?.48:.72),0,1);
   if(hash(ix,iz,11)>fadeIn*fadeOut)continue;
   const patch=.5+.5*Math.sin(x*2.7+Math.sin(z*2.3))*Math.cos(z*2.8);
   const tuft=.5+.5*Math.sin(x*29+Math.sin(z*17))*Math.cos(z*23+Math.sin(x*14));
   const r=hash(ix,iz,3),h=profile.height*(1+(hash(ix,iz,4)-.5)*2*profile.variation)*(1-profile.patch*.45+profile.patch*.45*patch)*(.92+.16*tuft);
   const w=h*(.86+.28*r);
   const shade=hash(ix,iz,6),variant=Math.min(2,Math.floor(hash(ix,iz,7)*3));
   groups[variant].push([x,terrainAt(x,z)+.002,z,h,w,hash(ix,iz,8)*Math.PI*2,shade]);
  }
  for(let k=0;k<3;k++){
   const rows=groups[k];if(!rows.length)continue;
   const geo=tuftGeometry(T,profile,k,b.detail),mesh=new T.InstancedMesh(geo,mat,rows.length);mesh.name='forma-grass-blades-r80-lod'+b.detail;
   for(let i=0;i<rows.length;i++){
    const [x,y,z,h,w,a,shade]=rows[i];
    dummy.position.set(x,y,z);dummy.rotation.set(0,a,0);dummy.scale.set(w,h,w);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    color.copy(palette[Math.min(palette.length-1,Math.floor(shade*palette.length))]).multiplyScalar(.94+.12*shade);mesh.setColorAt(i,color);
   }
   mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();mesh.castShadow=false;mesh.receiveShadow=true;mesh.raycast=()=>{};root.add(mesh);
   total+=rows.length*(b.detail===0?7:b.detail===1?5:3);triangles+=rows.length*geo.index.count/3;
  }
 }
 root.userData={bladeCount:total,triangles,wind:u,dispose(){for(const o of root.children)o.geometry.dispose();mat.dispose();for(const t of Object.values(maps))t.dispose();}};
 return root;
}
export function tickDenseLawn(root,now,strength){const u=root?.userData?.wind;if(!u)return false;u.t.value=now*.001;u.wind.value=clamp(strength,0,1);return true;}
