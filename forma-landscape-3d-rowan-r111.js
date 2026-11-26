// FORMA R117: folded leaf mesh, vein normal/roughness maps, compact textured fruit and bark.
export function rowanStage(age=35){
 const a=Number(age)||35;
 return a<=15?{age:10,height:3.8,diameter:2.2}:a<=50?{age:35,height:7.8,diameter:5.0}:{age:75,height:11.2,diameter:7.8};
}
export function createNaturalRowan(T,o,{season='summer',mobile=false}={}){
 const root=new T.Group();root.name='forma-rowan-r117';
 const h=Math.max(.8,Number(o.height)||7.8),r=Math.max(.4,Number(o.diameter)||5)/2;
 const age=Number(o.rowan?.age)||(h<5?10:h>9?75:35),old=age>=60;
 let seed=(Number(o.variant)||1)*17431+Math.round(h*100);
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const V=(x,y,z)=>new T.Vector3(x,y,z),up=V(0,1,0),tau=Math.PI*2;
 const bp=[],bc=[],bi=[],bu=[],leafRows=[],fruitRows=[],calyxRows=[];
 const bark=new T.Color(old?'#81796d':'#a5a098'),dark=new T.Color('#656159');
 const barkRand=(i,k)=>.5+.5*Math.sin(i*19.73+k*4.71);
 function along(points,t){const d=t*(points.length-1),i=Math.min(points.length-2,Math.floor(d));return points[i].clone().lerp(points[i+1],d-i);}
 function crownLimit(p){const v=Math.max(-.99,Math.min(.99,(p.y/h-.65)/.36));const width=r*(age<15?.92:1.04)*Math.sqrt(1-v*v),radial=Math.hypot(p.x,p.z);if(radial>width&&radial>0){p.x*=width/radial;p.z*=width/radial;}return p;}
 function tube(points,radii,sides){
  const base=bp.length/3,stride=sides+1;let distance=0;
  points.forEach((p,i)=>{if(i)distance+=p.distanceTo(points[i-1]);
   const dir=points[Math.min(i+1,points.length-1)].clone().sub(points[Math.max(0,i-1)]).normalize();
   const x=V(1,0,0).cross(dir);if(x.lengthSq()<.01)x.set(0,0,1).cross(dir);x.normalize();const z=dir.clone().cross(x);
   for(let k=0;k<=sides;k++){const j=k%sides,a=j*tau/sides,rr=radii[i]*(1+.065*Math.sin(j*3.1+i*.8)+(i===0?.12*Math.sin(j*2.4):0));const q=p.clone().addScaledVector(x,Math.cos(a)*rr).addScaledVector(z,Math.sin(a)*rr);bp.push(q.x,q.y,q.z);bu.push(k/sides,(points[0].y+distance)*1.7);const c=bark.clone().lerp(dark,.045+.12*barkRand(i,j));bc.push(c.r,c.g,c.b);}
  });
  for(let i=0;i<points.length-1;i++)for(let k=0;k<sides;k++){const a=base+i*stride+k,b=a+1;bi.push(a,b,a+stride,b,b+stride,a+stride);}
 }
 const trunk=[];for(let i=0;i<=14;i++){const t=i/14;trunk.push(V(Math.sin(t*4.1)*h*.029*t,h*t*.98,Math.sin(t*5.1)*h*.022*t));}
 const trunkR=h*(old?.025:age<15?.014:.019);
 tube(trunk,trunk.map((_,i)=>Math.max(.003,trunkR*Math.pow(1-i/15,1.52)*(i===0?1.20:1))),mobile?10:18);
 for(let k=0;k<(old?6:4);k++){const a=k*tau/(old?6:4)+rand()*.5,l=trunkR*(1.4+rand()*1.3);tube([V(Math.cos(a)*l,.015,Math.sin(a)*l),V(Math.cos(a)*trunkR*.72,trunkR*.8,Math.sin(a)*trunkR*.72),V(0,trunkR*2.1,0)],[trunkR*.15,trunkR*.25,trunkR*.10],mobile?5:8);}
 const branches=age<15?17:old?35:29;
 for(let i=0;i<branches;i++){
  const t=.28+.59*(i+.45)/branches+(rand()-.5)*.105,ang=i*2.399963+(rand()-.5)*1.35;
  const crownT=Math.max(.02,Math.min(.98,(t-.20)/.76));const envelope=Math.pow(Math.sin(Math.PI*crownT),.69)*(old?1:age<15?.83:.96);
  const reach=r*envelope*(.56+.35*rand())*(.91+.09*Math.sin(ang*2.3)),dx=Math.cos(ang),dz=Math.sin(ang);
  const start=along(trunk,t);
  const end=crownLimit(V(dx*reach,Math.min(h*.965,h*(t+.085+.13*rand())),dz*reach));
  const mid=start.clone().lerp(end,.48);mid.y-=h*(.008+.035*rand());mid.x+=Math.sin(ang)*r*(rand()-.5)*.12;mid.z-=Math.cos(ang)*r*(rand()-.5)*.12;
  const br=trunkR*(.13+.22*(1-t))*(.65+.6*rand());
  const bend=start.clone().lerp(mid,.52);bend.y+=h*.016;const branchPath=[start,bend,mid,end];tube(branchPath,[br,br*.76,br*.44,.003],mobile?6:10);
  const shoots=mobile?12:17;
  for(let j=0;j<shoots;j++){
   const f=.28+.70*(j+.35+rand()*.4)/shoots,anchor=along(branchPath,f);
   const side=(j%2?1:-1),a=ang+side*(.40+.65*rand());
   const len=Math.min(r*.52,h*.19)*(.63+.52*rand())*(1-.35*f);
   const tip=anchor.clone().add(V(Math.cos(a)*len,h*(.018+.095*rand()),Math.sin(a)*len));tip.y=Math.min(h*.985,tip.y);crownLimit(tip);
   const elbow=anchor.clone().lerp(tip,.53);elbow.y-=len*.08;elbow.x+=Math.sin(a)*len*.055;elbow.z-=Math.cos(a)*len*.055;const shoulder=anchor.clone().lerp(elbow,.55);shoulder.y+=len*.035;const shootPath=[anchor,shoulder,elbow,tip];
   const shootR=Math.max(.002,br*.17*(1-f*.5));tube(shootPath,[shootR,shootR*.72,Math.max(.0015,shootR*.39),.0012],mobile?4:6);
   const n=mobile?11:16;
   for(let k=0;k<n;k++){
    const u=.20+.80*k/(n-1),p=along(shootPath,u),a2=a+(k%2?1:-1)*(1.05+.55*rand());
    const direction=V(Math.cos(a2),-.50+.90*rand(),Math.sin(a2)).normalize();
    leafRows.push([p.clone(),direction,.90+rand()*.48,rand()]);
    // Secondary leafy shoots populate the crown volume, not just a single branch line.
    const spread=Math.min(.27,r*.13)*(.36+.64*u)*(.56+.54*rand());
    for(let m=0;m<(mobile?2:3);m++){
      const aa=a2+m*2.399963+rand()*1.6,dir=V(Math.cos(aa),-.65+rand()*1.12,Math.sin(aa)).normalize();
      const pp=crownLimit(p.clone().add(V(Math.cos(aa)*spread*(.55+.45*rand()),(rand()-.4)*spread,Math.sin(aa)*spread*(.55+.45*rand()))));
      // Every displaced compound leaf has its own connected terminal twig.
      if(pp.distanceToSquared(p)>.000001)tube([p,pp],[.0012,.00055],3);
      leafRows.push([pp,dir,.78+rand()*.56,rand()]);
    }
   }
   if(age>=15&&(season==='summer'||season==='autumn')&&f>.48&&rand()<(mobile?.44:.52)){
    const outward=V(Math.cos(ang),0,Math.sin(ang)),center=tip.clone().addScaledVector(outward,.045).add(V(0,-.058,0)),count=mobile?32:48;
    tube([tip,center],[.0025,.0015],4);
    for(let k=0;k<count;k++){const a3=k*2.399963,rr=.036*Math.sqrt((k+.5)/count)*(.94+.12*rand()),p=center.clone().add(V(Math.cos(a3)*rr,-.007-.014*rand()-.014*(1-rr/.036),Math.sin(a3)*rr)),sz=.0045+.0016*rand();fruitRows.push([p,sz,rand()]);if(!mobile){calyxRows.push([p.clone().add(V(0,-sz*.86,0)),sz*.27]);}tube([center,p],[.00065,.00035],3);}
   }
  }
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(bp,3));geo.setAttribute('color',new T.Float32BufferAttribute(bc,3));geo.setAttribute('uv',new T.Float32BufferAttribute(bu,2));geo.setIndex(bi);geo.computeVertexNormals();
 // Small repeatable bark map with horizontal lenticels and fine weathered pores.
 const tw=256,th=512,pixels=new Uint8Array(tw*th*4),relief=new Uint8Array(tw*th*4);
 for(let y=0;y<th;y++)for(let x=0;x<tw;x++){
  const k=(y*tw+x)*4,grain=(rand()-.5)*13;
  const warp=x+3*Math.sin(y*.033+x*.02),ridges=Math.pow(.5+.5*Math.sin(warp*.18+Math.sin(y*.018)),8);
  const mottling=9*Math.sin(x*.043+y*.031)+6*Math.sin(x*.09-y*.018);
  const cell=Math.floor(y/37),cx=(cell*97)%tw,dx=Math.min(Math.abs(x-cx),tw-Math.abs(x-cx)),dy=y%37-9-2*Math.sin(x*.14);
  const lens=Math.exp(-Math.pow(dx/(9+cell%5*3),4)-Math.pow(dy/1.6,2));
  const fissure=old?ridges*(.6+.4*Math.sin(y*.075)**2):ridges*.21;
  const scabs=Math.pow(Math.max(0,Math.sin(x*.081+y*.042)*Math.cos(y*.053-x*.027)),3),pores=Math.pow(.5+.5*Math.sin(x*1.6+y*.59),12);const v=Math.max(85,Math.min(245,220+grain+mottling-65*lens-37*fissure-24*scabs-8*pores));
  pixels.set([v,Math.min(255,v*1.006),v*.98,255],k);
  const b=Math.max(0,Math.min(255,160+grain*.55-95*lens-72*fissure-23*scabs-12*pores));relief.set([b,b,b,255],k);
 }
 const barkMap=new T.DataTexture(pixels,tw,th,T.RGBAFormat);barkMap.colorSpace=T.SRGBColorSpace;barkMap.wrapS=barkMap.wrapT=T.RepeatWrapping;barkMap.magFilter=T.LinearFilter;barkMap.minFilter=T.LinearMipmapLinearFilter;barkMap.generateMipmaps=true;barkMap.needsUpdate=true;
 const bump=new T.DataTexture(relief,tw,th,T.RGBAFormat);bump.wrapS=bump.wrapT=T.RepeatWrapping;bump.magFilter=T.LinearFilter;bump.minFilter=T.LinearMipmapLinearFilter;bump.generateMipmaps=true;bump.needsUpdate=true;
 const wood=new T.Mesh(geo,new T.MeshStandardMaterial({map:barkMap,bumpMap:bump,bumpScale:old?.020:.010,vertexColors:true,roughness:.88,metalness:0}));wood.name='rowan-bark-trunk-branches';wood.castShadow=true;wood.receiveShadow=true;root.add(wood);
 if(season!=='winter'&&leafRows.length){
  // One compound leaf with 13 narrow tapered leaflets on a shared rachis.
  const p=[],c=[],uv=[],idx=[];
  // A shared low-resolution alpha/vein atlas preserves a serrated outline on mobile.
  const lw=128,lh=256,rgba=new Uint8Array(lw*lh*4),norm=new Uint8Array(lw*lh*4),rough=new Uint8Array(lw*lh*4),heights=new Float32Array(lw*lh);
  for(let y=0;y<lh;y++)for(let x=0;x<lw;x++){
   const t=y/(lh-1),side=(x/(lw-1)-.5)*2,d=Math.abs(side);
   const outline=Math.pow(Math.sin(Math.PI*t),.70)*(.94+.045*Math.sin(t*118));
   const mid=Math.exp(-d*d*470),phase=(t-d*.19+.018*Math.sin(d*8))*Math.PI*22,veins=Math.pow(Math.max(0,Math.cos(phase)),22)*(1-d*.55);
   const fine=Math.pow(Math.max(0,Math.cos((t+d*.21)*Math.PI*61)),24)*.45;
   const grain=Math.sin(x*2.13+y*1.27)*Math.cos(y*.87-x*1.51);
   const v=Math.max(180,Math.min(255,229+17*mid+9*veins+5*fine-8*d+4*grain+5*Math.sin(x*.17+y*.09)));
   const i=y*lw+x;rgba.set([v,v,Math.round(v*.98),d<=outline?255:0],i*4);
   heights[i]=.30*mid+.17*veins+.06*fine+.018*grain-.06*d*d;
   const rv=Math.round(190+22*d-34*mid-17*veins+8*grain);rough.set([rv,rv,rv,255],i*4);
  }
  for(let y=0;y<lh;y++)for(let x=0;x<lw;x++){
   const dx=(heights[y*lw+Math.min(lw-1,x+1)]-heights[y*lw+Math.max(0,x-1)])*2.2;
   const dy=(heights[Math.min(lh-1,y+1)*lw+x]-heights[Math.max(0,y-1)*lw+x])*2.2;
   const len=Math.hypot(dx,dy,1);norm.set([128-127*dx/len,128-127*dy/len,128+127/len,255],(y*lw+x)*4);
  }
  const tex=(data,srgb=false)=>{const t=new T.DataTexture(data,lw,lh,T.RGBAFormat);t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=2;t.needsUpdate=true;return t;};
  const leafMap=tex(rgba,true),leafNormal=tex(norm),leafRough=tex(rough);
  function leaflet(x,z,angle,L,W){
   const dx=Math.cos(angle),dz=Math.sin(angle),sx=-dz,sz=dx,base=p.length/3,rows=5;
   if(mobile){
    // Four folded triangles, with a raised central midrib and curved tip.
    const add=(t,k,y)=>{p.push(x+dx*L*t+sx*W*k,y,z+dz*L*t+sz*W*k);uv.push((k+1)/2,t);const tone=k===0?1:.94;c.push(tone,tone,tone);};
    add(0,-1,0);add(0,1,0);add(1,-1,-L*.09);add(1,1,-L*.09);add(.48,0,L*.085);
    idx.push(base,base+4,base+1,base+1,base+4,base+3,base+3,base+4,base+2,base+2,base+4,base);return;
   }
   for(let j=0;j<=rows;j++){const t=j/rows,w=W*Math.pow(Math.sin(Math.PI*t),.7)*(j%2?.95:1);for(const k of [-1,0,1]){if(mobile&&k===0)continue;p.push(x+dx*L*t+sx*w*k,L*.09*Math.sin(t*Math.PI)-L*.085*t*t-Math.abs(k)*w*.32,z+dz*L*t+sz*w*k);uv.push(.5+k*w/(2*W),t);const tone=(k===0?1:.88)*(.91+.09*Math.sin(t*Math.PI));c.push(tone,tone,tone);}}
   const cols=mobile?2:3;for(let j=0;j<rows;j++)for(let k=0;k<cols-1;k++){const a=base+j*cols+k,b=a+cols;idx.push(a,b,a+1,a+1,b,b+1);}
  }
  for(let i=0;i<6;i++){const z=.028+i*.027,L=.059*(1-.055*i);leaflet(0,z,.48,L,.010);leaflet(0,z,Math.PI-.48,L,.010);}
  leaflet(0,.178,Math.PI/2,.043,.008);
  const q=p.length/3;p.push(-.0008,0,0,.0008,0,0,-.0005,0,.195,.0005,0,.195);c.push(.6,.66,.48,.6,.66,.48,.6,.66,.48,.6,.66,.48);uv.push(.49,.35,.51,.35,.49,.65,.51,.65);idx.push(q,q+1,q+2,q+1,q+3,q+2);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  const mat=new T.MeshStandardMaterial({map:leafMap,normalMap:leafNormal,normalScale:new T.Vector2(.52,.52),roughnessMap:leafRough,alphaTest:.46,vertexColors:true,side:T.DoubleSide,roughness:.82,envMapIntensity:.32});
  // Subtle backlighting on the thin leaf surface. Keep the ordinary PBR material
  // as a fallback, including for GLB export.
  mat.onBeforeCompile=shader=>{
   if(mat.userData.formaThinTransmissionR63)return; // shared PBR engine already supplies it
   const chunk=T.ShaderChunk.lights_physical_pars_fragment;
   const needle=/reflectedLight\.directDiffuse\s*\+=\s*irradiance\s*\*\s*BRDF_Lambert\(\s*material\.diffuseColor\s*\)\s*;/;
   if(chunk&&needle.test(chunk))shader.fragmentShader=shader.fragmentShader.replace('#include <lights_physical_pars_fragment>',chunk.replace(needle,m=>m+`\n reflectedLight.directDiffuse+= directLight.color*BRDF_Lambert(material.diffuseColor)*max(0.0,dot(-geometryNormal,directLight.direction))*.23;\n`));
  };
  mat.customProgramCacheKey=()=> 'forma-rowan-leaf-r117';
  const mesh=new T.InstancedMesh(g,mat,leafRows.length);mesh.name='rowan-pinnate-foliage';mesh.castShadow=!mobile;mesh.receiveShadow=true;
  const obj=new T.Object3D(),color=new T.Color(),palette=(season==='autumn'?['#aa743d','#bd9a48','#9a633a','#777a42']:['#536b46','#637a4e','#6a8055','#778b60','#5b724d']).map(x=>new T.Color(x));
  leafRows.forEach(([p,d,s,t],i)=>{obj.position.copy(p);obj.quaternion.setFromUnitVectors(V(0,0,1),d);obj.rotateZ((t-.5)*1.85);obj.scale.setScalar(s);obj.updateMatrix();mesh.setMatrixAt(i,obj.matrix);mesh.setColorAt(i,color.copy(palette[Math.floor(t*palette.length)]).multiplyScalar((.93+t*.15)*(.92+.08*Math.min(1,Math.hypot(p.x,p.z)/Math.max(.2,r*.75)))));});mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();root.add(mesh);
 }
 if(fruitRows.length){
 const g=new T.SphereGeometry(1,mobile?6:12,mobile?4:9),pos=g.attributes.position;
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),w=1+.035*Math.sin(x*9+y*5)*Math.cos(z*7);pos.setXYZ(i,x*w,y*w*(1-.06*Math.abs(y)),z*w);}
 g.computeVertexNormals();
 const fw=64,fh=64,al=new Uint8Array(fw*fh*4),br=new Uint8Array(fw*fh*4);
 for(let y=0;y<fh;y++)for(let x=0;x<fw;x++){const u=x/fw,v=y/(fh-1),speck=Math.pow(.5+.5*Math.sin(x*19.2+y*7.3),20),mottle=Math.sin(u*18+v*9)*Math.cos(v*14-u*7),spot=Math.exp(-Math.pow((v-.96)*18,2)),c=Math.max(100,Math.min(255,238+8*mottle-45*speck-76*spot)),i=(y*fw+x)*4;al.set([c,c*.98,c*.95,255],i);const z=145+10*mottle-33*speck-26*spot;br.set([z,z,z,255],i);}
 const ft=(data,srgb)=>{const t=new T.DataTexture(data,fw,fh,T.RGBAFormat);t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;};
 const mat=new T.MeshStandardMaterial({map:ft(al,true),bumpMap:ft(br,false),bumpScale:.0005,roughness:.59,metalness:0}),m=new T.InstancedMesh(g,mat,fruitRows.length),obj=new T.Object3D(),a=new T.Color('#ba3921'),b=new T.Color('#d77537'),c=new T.Color();m.name='rowan-fruit-berries';fruitRows.forEach(([p,s,t],i)=>{obj.position.copy(p);obj.scale.set(s*(.93+.09*t),s*(.91+.12*(1-t)),s*(.96+.07*t));obj.rotation.set(t*.45,t*6.28,0);obj.updateMatrix();m.setMatrixAt(i,obj.matrix);m.setColorAt(i,c.copy(a).lerp(b,t));});m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;m.computeBoundingSphere();root.add(m);}
 if(calyxRows.length){const g=new T.SphereGeometry(1,5,3),m=new T.InstancedMesh(g,new T.MeshStandardMaterial({color:'#57382b',roughness:.93}),calyxRows.length),ob=new T.Object3D();m.name='rowan-fruit-calyx';calyxRows.forEach(([p,r],i)=>{ob.position.copy(p);ob.scale.set(r,r*.5,r);ob.updateMatrix();m.setMatrixAt(i,ob.matrix);});m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();root.add(m);}
 root.userData.formaRowanStats={age,compoundLeaves:leafRows.length,berries:fruitRows.length,mobile,woodTriangles:bi.length/3};
 return root;
}
