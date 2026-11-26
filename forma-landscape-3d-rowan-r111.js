// FORMA R122: age-specific crown balance, outward fruit corymbs, restrained PBR and mobile geometry budget.
export function rowanStage(age=35){
 const a=Number(age)||35;
 return a<=15?{age:10,height:3.8,diameter:2.25}:a<=50?{age:35,height:7.8,diameter:5.4}:{age:75,height:11.2,diameter:9.0};
}
export function createNaturalRowan(T,o,{season='summer',mobile=false}={}){
 const root=new T.Group();root.name='forma-rowan-r122';
 const h=Math.max(.8,Number(o.height)||7.8),r=Math.max(.4,Number(o.diameter)||5)/2;
 const age=Number(o.rowan?.age)||(h<5?10:h>9?75:35),old=age>=60,young=age<=15;
 let seed=(Number(o.variant)||1)*17431+Math.round(h*100);let fruitSeed=(seed^0x9e3779b9)>>>0;const fr=()=>{fruitSeed=(Math.imul(fruitSeed,1664525)+1013904223)>>>0;return fruitSeed/4294967296;};
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const V=(x,y,z)=>new T.Vector3(x,y,z),up=V(0,1,0),tau=Math.PI*2;
 const bp=[],bc=[],bi=[],bu=[],seams=[],leafRows=[],fruitRows=[],calyxRows=[];let clusters=0;
 const bark=new T.Color(old?'#827c70':young?'#a49d91':'#989389'),dark=new T.Color(old?'#58564f':'#716b62');
 const barkRand=(i,k)=>.5+.5*Math.sin(i*19.73+k*4.71);
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const hash=(x,y,seed=0)=>{let n=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(seed+1,1274126177);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
 const noise=(x,y,seed=0,period=0)=>{const i=Math.floor(x),j=Math.floor(y),u=x-i,v=y-j,fu=u*u*(3-2*u),fv=v*v*(3-2*v);const h=(a,b)=>hash(period?((a%period)+period)%period:a,b,seed);const a=h(i,j),b=h(i+1,j),c=h(i,j+1),d=h(i+1,j+1);return (a+(b-a)*fu)*(1-fv)+(c+(d-c)*fu)*fv;};
 function along(points,t){const d=t*(points.length-1),i=Math.min(points.length-2,Math.floor(d));return points[i].clone().lerp(points[i+1],d-i);}
 function crownLimit(p){const v=Math.max(-.99,Math.min(.99,(p.y/h-(old?.60:young?.64:.62))/(old?.39:.37)));const width=r*(young?1.03:1.04)*Math.pow(1-v*v,young?.61:.47),radial=Math.hypot(p.x,p.z);if(radial>width&&radial>0){p.x*=width/radial;p.z*=width/radial;}return p;}
 function tube(points,radii,sides){
  const base=bp.length/3,stride=sides+1;let distance=0;
  points.forEach((p,i)=>{if(i)distance+=p.distanceTo(points[i-1]);
   const dir=points[Math.min(i+1,points.length-1)].clone().sub(points[Math.max(0,i-1)]).normalize();
   const x=V(1,0,0).cross(dir);if(x.lengthSq()<.01)x.set(0,0,1).cross(dir);x.normalize();const z=dir.clone().cross(x);if(sides>=8)seams.push([base+i*stride,base+i*stride+sides]);
   for(let k=0;k<=sides;k++){const j=k%sides,a=j*tau/sides,rr=radii[i]*(1+.065*Math.sin(j*3.1+i*.8)+(i===0?.12*Math.sin(j*2.4):0));const q=p.clone().addScaledVector(x,Math.cos(a)*rr).addScaledVector(z,Math.sin(a)*rr);bp.push(q.x,q.y,q.z);bu.push(k/sides,(points[0].y+distance)*1.7);const c=bark.clone().lerp(dark,.045+.025*barkRand(i,j));bc.push(c.r,c.g,c.b);}
  });
  for(let i=0;i<points.length-1;i++)for(let k=0;k<sides;k++){const a=base+i*stride+k,b=a+1;bi.push(a,b,a+stride,b,b+stride,a+stride);}
 }
 const trunk=[];for(let i=0;i<=26;i++){const t=i/26;trunk.push(V(Math.sin(t*4.1)*h*(old?.055:young?.012:.024)*t+(old?h*.012*Math.sin(t*10)*t:0),h*t*.98,Math.sin(t*5.1)*h*(old?.045:young?.009:.019)*t));}
 const trunkR=h*(old?.030:young?.014:.019);
 tube(trunk,trunk.map((_,i)=>Math.max(.003,trunkR*Math.pow(1-i/27,1.52)*(1+.24*Math.exp(-i*.60)))),mobile?24:36);
 for(let k=0;k<(old?6:4);k++){const a=k*tau/(old?6:4)+rand()*.5,l=trunkR*(1.4+rand()*1.3);tube([V(Math.cos(a)*l,.015,Math.sin(a)*l),V(Math.cos(a)*trunkR*.72,trunkR*.8,Math.sin(a)*trunkR*.72),V(0,trunkR*2.1,0)],[trunkR*.15,trunkR*.25,trunkR*.10],mobile?5:8);}
 const branches=young?15:old?40:32;
 for(let i=0;i<branches;i++){
  const t=(old?.23:young?.33:.27)+(old?.61:young?.56:.59)*(i+.45)/branches+(rand()-.5)*.054,ang=i*2.399963+(rand()-.5)*(old?1.45:.85);
  const crownT=Math.max(.02,Math.min(.98,(t-.20)/.76));const envelope=Math.pow(Math.sin(Math.PI*crownT),.69)*(old?1:age<15?.83:.96);
  const reach=r*envelope*(old?.68+.24*rand():young?.62+.27*rand():.65+.25*rand())*(.91+.09*Math.sin(ang*2.3)),dx=Math.cos(ang),dz=Math.sin(ang);
  const start=along(trunk,t);
  const end=crownLimit(V(dx*reach,Math.min(h*.965,h*(t+(old?.045:young?.13:.075)+(old?.10:young?.15:.12)*rand())),dz*reach));
  const mid=start.clone().lerp(end,.48);mid.y-=h*(.008+.035*rand());mid.x+=Math.sin(ang)*r*(rand()-.5)*.12;mid.z-=Math.cos(ang)*r*(rand()-.5)*.12;
  const br=trunkR*(.13+.22*(1-t))*(.65+.6*rand())*(old?1.18:1);
  const bend=start.clone().lerp(mid,.52);bend.y+=h*.016;const branchPath=[start,bend,mid,end];tube(branchPath,[br,br*.76,br*.44,.003],mobile?10:14);
  const shoots=young?(mobile?8:11):old?(mobile?14:20):(mobile?12:17);
  for(let j=0;j<shoots;j++){
   const f=.28+.70*(j+.35+rand()*.4)/shoots,anchor=along(branchPath,f);
   const side=(j%2?1:-1),a=ang+side*(.40+.65*rand());
   const len=Math.min(r*(old?.52:young?.45:.51),h*.19)*(.72+.36*rand())*(1-.35*f);
   const tip=anchor.clone().add(V(Math.cos(a)*len,h*(.018+.095*rand()),Math.sin(a)*len));tip.y=Math.min(h*.985,tip.y);crownLimit(tip);
   const elbow=anchor.clone().lerp(tip,.53);elbow.y-=len*.08;elbow.x+=Math.sin(a)*len*.055;elbow.z-=Math.cos(a)*len*.055;const shoulder=anchor.clone().lerp(elbow,.55);shoulder.y+=len*.035;const shootPath=[anchor,shoulder,elbow,tip];
   const shootR=Math.max(.002,br*.17*(1-f*.5));tube(shootPath,[shootR,shootR*.72,Math.max(.0015,shootR*.39),.0012],mobile?4:6);
   const n=young?(mobile?8:11):old?(mobile?12:18):(mobile?11:16);
   for(let k=0;k<n;k++){
    const u=.20+.80*k/(n-1),p=along(shootPath,u),a2=a+(k%2?1:-1)*(1.05+.55*rand());
    const direction=V(Math.cos(a2),-.50+.90*rand(),Math.sin(a2)).normalize();
    leafRows.push([p.clone(),direction,(young?.85:.90)+rand()*.48,rand()]);
    // Secondary leafy shoots populate the crown volume, not just a single branch line.
    const spread=Math.min(old?.33:.27,r*.13)*(.36+.64*u)*(.56+.54*rand());
    for(let m=0;m<(mobile?2:3);m++){
      const aa=a2+m*2.399963+rand()*1.6,dir=V(Math.cos(aa),-.65+rand()*1.12,Math.sin(aa)).normalize();
      const pp=crownLimit(p.clone().add(V(Math.cos(aa)*spread*(.55+.45*rand()),(rand()-.4)*spread,Math.sin(aa)*spread*(.55+.45*rand()))));
      // Every displaced compound leaf has its own connected terminal twig.
      if(pp.distanceToSquared(p)>.000001)tube([p,pp],[.0012,.00055],3);
      leafRows.push([pp,dir,.78+rand()*.56,rand()]);
    }
   }
   if((season==='summer'||season==='autumn')&&f>.36&&fr()<(young?.09:old?.88:.80)){clusters++;
    const outward=V(tip.x,0,tip.z).normalize(),center=tip.clone().addScaledVector(outward,young?.065:.14).add(V(0,-(young?.065:.10),0)),count=Math.round((young?18:old?46:48)+fr()*15),radius=(young?.027:.048)+fr()*.009;
    tube([tip,center],[.0020,.0012],4);
    const pedicels=[];
    for(let j=0;j<7;j++){const q=j*2.399963,stem=center.clone().add(V(Math.cos(q)*radius*.57,-.014-fr()*.007,Math.sin(q)*radius*.57));pedicels.push(stem);tube([center,stem],[.00085,.00048],3);}
    for(let k=0;k<count;k++){const a3=k*2.399963,rr=radius*Math.sqrt((k+.5)/count)*(.92+.12*fr()),p=center.clone().add(V(Math.cos(a3)*rr,-.017-.021*fr()-.008*(1-rr/radius),Math.sin(a3)*rr)),sz=.0042+.0016*fr();fruitRows.push([p,sz,fr()]);if(!mobile||k%3===0)calyxRows.push([p.clone().add(V(0,-sz*.86,0)),sz*.26]);let stem=pedicels[0];for(const q of pedicels)if(q.distanceToSquared(p)<stem.distanceToSquared(p))stem=q;if(!mobile||k%2===0)tube([stem,p],[.00048,.00028],3);}
   }
  }
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(bp,3));geo.setAttribute('color',new T.Float32BufferAttribute(bc,3));geo.setAttribute('uv',new T.Float32BufferAttribute(bu,2));geo.setIndex(bi);geo.computeVertexNormals();
 const gn=geo.attributes.normal;for(const [a,b] of seams){const n=V(gn.getX(a)+gn.getX(b),gn.getY(a)+gn.getY(b),gn.getZ(a)+gn.getZ(b)).normalize();gn.setXYZ(a,n.x,n.y,n.z);gn.setXYZ(b,n.x,n.y,n.z);}gn.needsUpdate=true;
 // Age-specific bark: non-periodic cellular lenticels, lichen islands, pores
 // and fine vertical fissures. Shared texture coordinates remain metric along the stem.
 const tw=512,th=1024,pixels=new Uint8Array(tw*th*4),relief=new Float32Array(tw*th),barkNormals=new Uint8Array(tw*th*4),barkRough=new Uint8Array(tw*th*4);
 for(let y=0;y<th;y++)for(let x=0;x<tw;x++){
  const u=x/tw,v=y/th,i=y*tw+x,k=i*4;
  const broad=noise(u*8,v*12,41,8),fine=noise(u*64,v*96,42,64),grain=hash(x,y,43)-.5;
  const warp=u*26+(noise(u*8,v*7,44,8)-.5)*1.1;
  const fissure=Math.pow(1-Math.abs(2*noise(warp,v*7,45,26)-1),9)*noise(u*16,v*15,46,16);
  const lx=u*12,ly=v*27,ix=Math.floor(lx),iy=Math.floor(ly);let lenticel=0;
  for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){
   const cx=ix+a,cy=iy+b,hx=(cx+12)%12,hy=(cy+27)%27;
   if(hash(hx,hy,47)<.23)continue;
   const dx=(lx-cx-.2-.6*hash(hx,hy,48))/(.20+.19*hash(hx,hy,49));
   const dy=(ly-cy-.2-.6*hash(hx,hy,50)-(lx-cx-.5)*.12)/(.025+.022*hash(hx,hy,51));
   lenticel=Math.max(lenticel,Math.exp(-Math.pow(dx,4)-dy*dy));
  }
  const lichen=old?clamp((noise(u*19,v*25,53,19)-.63)*3.6,0,1)*noise(u*80,v*120,54,80):young?0:clamp((noise(u*15,v*22,53,15)-.79)*2,0,1);
  const cracks=fissure*(old?1:young?.12:.36);
  const tone=clamp(226+26*(broad-.5)+20*(fine-.5)+grain*12-79*lenticel-55*cracks+22*lichen,65,251);
  pixels.set([tone,clamp(tone+5*lichen-2,0,255),clamp(tone-5+10*lichen,0,255),255],k);
  relief[i]=.5+.13*(fine-.5)+.055*grain-.34*lenticel-.32*cracks+.12*lichen;
  const rough=clamp((young?189:old?231:214)+18*(fine-.5)+17*cracks+11*lichen,155,250);barkRough.set([rough,rough,rough,255],k);
 }
 for(let y=0;y<th;y++)for(let x=0;x<tw;x++){
  const i=(y*tw+x)*4,dx=(relief[y*tw+(x+1)%tw]-relief[y*tw+(x+tw-1)%tw])*2.3,dy=(relief[((y+1)%th)*tw+x]-relief[((y+th-1)%th)*tw+x])*2.3,l=Math.hypot(dx,dy,1);
  barkNormals.set([128-127*dx/l,128-127*dy/l,128+127/l,255],i);
 }
 const barkTex=(data,srgb=false)=>{const t=new T.DataTexture(data,tw,th,T.RGBAFormat);t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=4;t.needsUpdate=true;return t;};
 const barkMap=barkTex(pixels,true),normal=barkTex(barkNormals),roughMap=barkTex(barkRough);
 const wood=new T.Mesh(geo,new T.MeshStandardMaterial({map:barkMap,normalMap:normal,roughnessMap:roughMap,normalScale:new T.Vector2(old?.95:young?.40:.68,old?.95:young?.40:.68),vertexColors:true,roughness:1,metalness:0}));wood.name='rowan-bark-trunk-branches';wood.castShadow=true;wood.receiveShadow=true;root.add(wood);
 if(season!=='winter'&&leafRows.length){
  // One compound leaf with 13 narrow tapered leaflets on a shared rachis.
  const p=[],c=[],uv=[],idx=[];
  // A shared low-resolution alpha/vein atlas preserves a serrated outline on mobile.
  const lw=256,lh=512,rgba=new Uint8Array(lw*lh*4),norm=new Uint8Array(lw*lh*4),rough=new Uint8Array(lw*lh*4),heights=new Float32Array(lw*lh);
  for(let y=0;y<lh;y++)for(let x=0;x<lw;x++){
   const t=y/(lh-1),side=(x/(lw-1)-.5)*2,d=Math.abs(side);
   const serration=.94+.052*Math.sin(t*126+.36*Math.sin(t*31));const outline=Math.pow(Math.sin(Math.PI*t),.70)*serration;
   const mid=Math.exp(-d*d*1100),phase=(t-d*.21+.018*Math.sin(d*8)+.009*side)*Math.PI*22,veins=Math.pow(Math.max(0,Math.cos(phase)),38)*(1-d*.76);
   const fine=Math.pow(Math.max(0,Math.cos((t+d*.14+.012*Math.sin(d*27))*Math.PI*81)),32)*.5;
   const cells=noise(x/9,y/13,71),grain=hash(x,y,72)-.5,blotch=noise(x/43,y/76,73);
   const v=clamp(229+24*mid+15*veins+7*fine-10*d+8*grain+17*(cells-.5)+11*(blotch-.5),165,255);
   const i=y*lw+x,alpha=clamp((outline-d)*lw*.5+.5,0,1)*255;rgba.set([v,clamp(v+3*mid,0,255),Math.round(v*.97),alpha],i*4);
   heights[i]=.40*mid+.22*veins+.075*fine+.025*grain+.04*(cells-.5)-.06*d*d;
   const rv=clamp(196+24*d-39*mid-23*veins+12*grain+15*(cells-.5),115,250);rough.set([rv,rv,rv,255],i*4);
  }
  for(let y=0;y<lh;y++)for(let x=0;x<lw;x++){
   const dx=(heights[y*lw+Math.min(lw-1,x+1)]-heights[y*lw+Math.max(0,x-1)])*2.2;
   const dy=(heights[Math.min(lh-1,y+1)*lw+x]-heights[Math.max(0,y-1)*lw+x])*2.2;
   const len=Math.hypot(dx,dy,1);norm.set([128-127*dx/len,128-127*dy/len,128+127/len,255],(y*lw+x)*4);
  }
  const tex=(data,srgb=false)=>{const t=new T.DataTexture(data,lw,lh,T.RGBAFormat);t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=4;t.needsUpdate=true;return t;};
  const leafMap=tex(rgba,true),leafNormal=tex(norm),leafRough=tex(rough);
  function leaflet(x,z,angle,L,W){
   const dx=Math.cos(angle),dz=Math.sin(angle),sx=-dz,sz=dx,base=p.length/3,rows=6;
   if(mobile){
    // Six triangles per leaflet: continuous lengthwise bow, soft fold and curved tip.
    const add=(t,k)=>{const bend=L*(.075*Math.sin(Math.PI*t)-.12*t*t),cup=(1-Math.abs(k))*W*.23*Math.sin(Math.PI*t);p.push(x+dx*L*t+sx*(W*k+W*.09*t*t),bend+cup,z+dz*L*t+sz*(W*k+W*.09*t*t));uv.push((k+1)/2,t);const tone=.95+.05*(1-Math.abs(k));c.push(tone,tone,tone);};
    add(0,-1);add(0,1);add(.50,-1);add(.50,0);add(.50,1);add(1,-1);add(1,1);
    idx.push(base,base+3,base+1,base,base+2,base+3,base+1,base+3,base+4,base+2,base+5,base+3,base+3,base+5,base+6,base+3,base+6,base+4);return;
   }
   for(let j=0;j<=rows;j++){const t=j/rows,w=W*Math.pow(Math.sin(Math.PI*t),.7)*(j%2?.95:1);for(const k of [-1,0,1]){if(mobile&&k===0)continue;p.push(x+dx*L*t+sx*w*k,L*.075*Math.sin(t*Math.PI)-L*.12*t*t-Math.abs(k)*w*.24,z+dz*L*t+sz*w*k);uv.push(.5+k*w/(2*W),t);const tone=(k===0?1:.88)*(.91+.09*Math.sin(t*Math.PI));c.push(tone,tone,tone);}}
   const cols=mobile?2:3;for(let j=0;j<rows;j++)for(let k=0;k<cols-1;k++){const a=base+j*cols+k,b=a+cols;idx.push(a,b,a+1,a+1,b,b+1);}
  }
  for(let i=0;i<6;i++){const z=.028+i*.027,L=.059*(1-.055*i);leaflet(0,z,.48,L,.010);leaflet(0,z,Math.PI-.48,L,.010);}
  leaflet(0,.178,Math.PI/2,.043,.008);
  const q=p.length/3;p.push(-.0008,0,0,.0008,0,0,-.0005,0,.195,.0005,0,.195);c.push(.6,.66,.48,.6,.66,.48,.6,.66,.48,.6,.66,.48);uv.push(.49,.35,.51,.35,.49,.65,.51,.65);idx.push(q,q+1,q+2,q+1,q+3,q+2);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  const mat=new T.MeshPhysicalMaterial({map:leafMap,normalMap:leafNormal,normalScale:new T.Vector2(.53,.53),roughnessMap:leafRough,alphaTest:.46,vertexColors:true,side:T.DoubleSide,roughness:.83,metalness:0,ior:1.44,specularIntensity:.40,clearcoat:.015,clearcoatRoughness:.72,envMapIntensity:.40});
  // Subtle backlighting on the thin leaf surface. Keep the ordinary PBR material
  // as a fallback, including for GLB export.
  mat.onBeforeCompile=shader=>{
   if(mat.userData.formaThinTransmissionR63)return; // shared PBR engine already supplies it
   const chunk=T.ShaderChunk.lights_physical_pars_fragment;
   const needle=/reflectedLight\.directDiffuse\s*\+=\s*irradiance\s*\*\s*BRDF_Lambert\(\s*material\.diffuseColor\s*\)\s*;/;
   if(chunk&&needle.test(chunk))shader.fragmentShader=shader.fragmentShader.replace('#include <lights_physical_pars_fragment>',chunk.replace(needle,m=>m+`\n reflectedLight.directDiffuse+= directLight.color*BRDF_Lambert(material.diffuseColor)*max(0.0,dot(-geometryNormal,directLight.direction))*.23;\n`));
  };
  mat.customProgramCacheKey=()=> 'forma-rowan-leaf-r122';
  mat.userData.formaRowanPBR={transmission:.42,roughness:.83};
  const mesh=new T.InstancedMesh(g,mat,leafRows.length);mesh.name='rowan-pinnate-foliage';mesh.castShadow=!mobile;mesh.receiveShadow=true;
  const obj=new T.Object3D(),color=new T.Color(),palette=(season==='autumn'?['#aa743d','#bd9a48','#9a633a','#777a42']:(young?['#60794b','#718454','#6b8053','#81905f','#627951']:['#536b46','#637a4e','#6a8055','#778b60','#5b724d'])).map(x=>new T.Color(x));
  leafRows.forEach(([p,d,s,t],i)=>{obj.position.copy(p);obj.quaternion.setFromUnitVectors(V(0,0,1),d);obj.rotateZ((t-.5)*1.85);obj.scale.setScalar(s);obj.updateMatrix();mesh.setMatrixAt(i,obj.matrix);mesh.setColorAt(i,color.copy(palette[Math.floor(t*palette.length)]).multiplyScalar((.97+t*.12)*(.96+.04*Math.min(1,Math.hypot(p.x,p.z)/Math.max(.2,r*.75)))));});mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();root.add(mesh);
 }
 if(fruitRows.length){
 const g=new T.SphereGeometry(1,mobile?5:12,mobile?3:9),pos=g.attributes.position;
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),w=1+.035*Math.sin(x*9+y*5)*Math.cos(z*7);pos.setXYZ(i,x*w,y*w*(1-.06*Math.abs(y)),z*w);}
 g.computeVertexNormals();
 const fw=64,fh=64,al=new Uint8Array(fw*fh*4),br=new Uint8Array(fw*fh*4);
 for(let y=0;y<fh;y++)for(let x=0;x<fw;x++){const u=x/fw,v=y/(fh-1),speck=Math.pow(.5+.5*Math.sin(x*19.2+y*7.3),20),mottle=Math.sin(u*18+v*9)*Math.cos(v*14-u*7),spot=Math.exp(-Math.pow((v-.96)*18,2)),c=Math.max(100,Math.min(255,238+8*mottle-45*speck-76*spot)),i=(y*fw+x)*4;al.set([c,c*.98,c*.95,255],i);const z=145+10*mottle-33*speck-26*spot;br.set([z,z,z,255],i);}
 const ft=(data,srgb)=>{const t=new T.DataTexture(data,fw,fh,T.RGBAFormat);t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;};
 const mat=new T.MeshStandardMaterial({map:ft(al,true),bumpMap:ft(br,false),bumpScale:.0005,roughness:.59,metalness:0}),m=new T.InstancedMesh(g,mat,fruitRows.length),obj=new T.Object3D(),a=new T.Color('#b93c23'),b=new T.Color('#df7438'),c=new T.Color();m.name='rowan-fruit-berries';fruitRows.forEach(([p,s,t],i)=>{obj.position.copy(p);obj.scale.set(s*(.93+.09*t),s*(.91+.12*(1-t)),s*(.96+.07*t));obj.rotation.set(t*.45,t*6.28,0);obj.updateMatrix();m.setMatrixAt(i,obj.matrix);m.setColorAt(i,c.copy(a).lerp(b,t));});m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;m.computeBoundingSphere();root.add(m);}
 if(calyxRows.length){const g=new T.SphereGeometry(1,5,3),m=new T.InstancedMesh(g,new T.MeshStandardMaterial({color:'#57382b',roughness:.93}),calyxRows.length),ob=new T.Object3D();m.name='rowan-fruit-calyx';calyxRows.forEach(([p,r],i)=>{ob.position.copy(p);ob.scale.set(r,r*.5,r);ob.updateMatrix();m.setMatrixAt(i,ob.matrix);});m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();root.add(m);}
 root.userData.formaRowanStats={age,compoundLeaves:leafRows.length,berries:fruitRows.length,clusters,mobile,woodTriangles:bi.length/3};
 return root;
}
