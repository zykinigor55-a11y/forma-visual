// FORMA R114: rounded asymmetric Sorbus crown, tapered shoots, leaf and fruit refinement.
export function rowanStage(age=35){
 const a=Number(age)||35;
 return a<=15?{age:10,height:3.8,diameter:2.2}:a<=50?{age:35,height:7.8,diameter:5.0}:{age:75,height:11.2,diameter:7.8};
}
export function createNaturalRowan(T,o,{season='summer',mobile=false}={}){
 const root=new T.Group();root.name='forma-rowan-r114';
 const h=Math.max(.8,Number(o.height)||7.8),r=Math.max(.4,Number(o.diameter)||5)/2;
 const age=Number(o.rowan?.age)||(h<5?10:h>9?75:35),old=age>=60;
 let seed=(Number(o.variant)||1)*17431+Math.round(h*100);
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const V=(x,y,z)=>new T.Vector3(x,y,z),up=V(0,1,0),tau=Math.PI*2;
 const bp=[],bc=[],bi=[],bu=[],leafRows=[],fruitRows=[],calyxRows=[];
 const bark=new T.Color(old?'#777064':'#99958b'),dark=new T.Color('#53534b');
 function tube(points,radii,sides){
  const base=bp.length/3;
  points.forEach((p,i)=>{
   const dir=points[Math.min(i+1,points.length-1)].clone().sub(points[Math.max(0,i-1)]).normalize();
   const x=V(1,0,0).cross(dir);if(x.lengthSq()<.01)x.set(0,0,1).cross(dir);x.normalize();const z=dir.clone().cross(x);
   for(let k=0;k<sides;k++){const a=k*tau/sides,rr=radii[i]*(1+.065*Math.sin(k*3.1+i*.8)+(i===0?.12*Math.sin(k*2.4):0));const q=p.clone().addScaledVector(x,Math.cos(a)*rr).addScaledVector(z,Math.sin(a)*rr);bp.push(q.x,q.y,q.z);bu.push(k/sides,p.y*2.1);const c=bark.clone().lerp(dark,.045+.12*rand());bc.push(c.r,c.g,c.b);}
  });
  for(let i=0;i<points.length-1;i++)for(let k=0;k<sides;k++){const a=base+i*sides+k,b=base+i*sides+(k+1)%sides;bi.push(a,b,a+sides,b,b+sides,a+sides);}
 }
 const trunk=[];for(let i=0;i<=14;i++){const t=i/14;trunk.push(V(Math.sin(t*4.1)*h*.029*t,h*t*.98,Math.sin(t*5.1)*h*.022*t));}
 const trunkR=h*(old?.025:age<15?.014:.019);
 tube(trunk,trunk.map((_,i)=>Math.max(.003,trunkR*Math.pow(1-i/15,1.52)*(i===0?1.20:1))),mobile?10:18);
 for(let k=0;k<(old?6:4);k++){const a=k*tau/(old?6:4)+rand()*.5,l=trunkR*(1.4+rand()*1.3);tube([V(Math.cos(a)*l,.015,Math.sin(a)*l),V(Math.cos(a)*trunkR*.72,trunkR*.8,Math.sin(a)*trunkR*.72),V(0,trunkR*2.1,0)],[trunkR*.15,trunkR*.25,trunkR*.10],mobile?5:8);}
 const branches=age<15?18:old?35:29;
 for(let i=0;i<branches;i++){
  const t=.28+.60*(i+.45)/branches+(rand()-.5)*.095,ang=i*2.399963+(rand()-.5)*1.3;
  const crownT=Math.max(.02,Math.min(.98,(t-.20)/.76));const envelope=Math.pow(Math.sin(Math.PI*crownT),.69)*(old?1:age<15?.83:.96);
  const reach=r*envelope*(.56+.35*rand())*(.91+.09*Math.sin(ang*2.3)),dx=Math.cos(ang),dz=Math.sin(ang);
  const start=V(Math.sin(t*4.1)*h*.029*t,h*t*.98,Math.sin(t*5.1)*h*.022*t);
  const end=V(dx*reach,Math.min(h*.955,h*(t+.085+.145*rand())),dz*reach);
  const mid=start.clone().lerp(end,.48);mid.y-=h*(.008+.035*rand());mid.x+=Math.sin(ang)*r*(rand()-.5)*.12;mid.z-=Math.cos(ang)*r*(rand()-.5)*.12;
  const br=trunkR*(.13+.22*(1-t))*(.65+.6*rand());
  const bend=start.clone().lerp(mid,.52);bend.y+=h*.016;tube([start,bend,mid,end],[br,br*.76,br*.44,.003],mobile?6:10);
  const shoots=mobile?12:17;
  for(let j=0;j<shoots;j++){
   const f=.24+.76*(j+.35+rand()*.4)/shoots,anchor= f<.48?start.clone().lerp(mid,f/.48):mid.clone().lerp(end,(f-.48)/.52);
   const side=(j%2?1:-1),a=ang+side*(.40+.65*rand());
   const len=Math.min(r*.52,h*.19)*(.63+.52*rand())*(1-.35*f);
   const tip=anchor.clone().add(V(Math.cos(a)*len,h*(.018+.095*rand()),Math.sin(a)*len));tip.y=Math.min(h*.97,tip.y);const radial=Math.hypot(tip.x,tip.z),cap=r*(.94+.10*rand());if(radial>cap){tip.x*=cap/radial;tip.z*=cap/radial;}
   const elbow=anchor.clone().lerp(tip,.53);elbow.y-=len*.08;
   tube([anchor,elbow,tip],[br*.22,.006,.0018],mobile?4:6);
   const n=mobile?11:16;
   for(let k=0;k<n;k++){
    const u=.16+.84*k/(n-1),p=anchor.clone().lerp(tip,u),a2=a+(k%2?1:-1)*(1.05+.55*rand());
    const direction=V(Math.cos(a2),-.50+.90*rand(),Math.sin(a2)).normalize();
    p.addScaledVector(direction,.025+rand()*.045);
    leafRows.push([p,direction,.90+rand()*.59,rand()]);
    // Secondary leafy shoots populate the crown volume, not just a single branch line.
    const spread=Math.min(.39,r*.15)*(.44+.56*u)*(.66+.62*rand());
    for(let m=0;m<(mobile?2:3);m++){
      const aa=a2+m*2.399963+rand()*1.6,dir=V(Math.cos(aa),-.65+rand()*1.12,Math.sin(aa)).normalize();
      const pp=p.clone().add(V(Math.cos(aa)*spread*(.55+.45*rand()),(rand()-.4)*spread,Math.sin(aa)*spread*(.55+.45*rand())));
      leafRows.push([pp,dir,.82+rand()*.69,rand()]);
      if(m===0&&k%3===0)tube([p,pp],[.0018,.0009],mobile?3:5);
    }
   }
   if(age>=15&&(season==='summer'||season==='autumn')&&f>.48&&rand()<(mobile?.44:.52)){
    const outward=V(Math.cos(ang),0,Math.sin(ang)),center=tip.clone().addScaledVector(outward,.065).add(V(0,-.095,0)),count=mobile?24:38;
    tube([tip,center],[.0025,.0015],4);
    for(let k=0;k<count;k++){const a3=k*2.399963,rr=.041*Math.sqrt(rand()),p=center.clone().add(V(Math.cos(a3)*rr,-.011-.034*rand()-.020*(1-rr/.041),Math.sin(a3)*rr)),sz=.0045+.0016*rand();fruitRows.push([p,sz,rand()]);if(!mobile){calyxRows.push([p.clone().add(V(0,-sz*.86,0)),sz*.27]);}if(k%5===0)tube([center,p],[.0009,.0005],3);}
   }
  }
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(bp,3));geo.setAttribute('color',new T.Float32BufferAttribute(bc,3));geo.setAttribute('uv',new T.Float32BufferAttribute(bu,2));geo.setIndex(bi);geo.computeVertexNormals();
 // Small repeatable bark map with horizontal lenticels and fine weathered pores.
 const tw=128,th=256,pixels=new Uint8Array(tw*th*4);
 for(let y=0;y<th;y++)for(let x=0;x<tw;x++){
  const k=(y*tw+x)*4,grain=(rand()-.5)*18,streak=5*Math.sin(x*.22)+3*Math.sin(x*.81);
  const band=y%19,cell=Math.floor(y/19),cx=(cell*47)%tw,dx=Math.min(Math.abs(x-cx),tw-Math.abs(x-cx));
  const lenticel=band<2&&dx<5+(cell%4)*4?51:0;
  const v=Math.max(80,Math.min(245,216+grain+streak-lenticel));
  pixels.set([v,v,v,255],k);
 }
 const barkMap=new T.DataTexture(pixels,tw,th,T.RGBAFormat);barkMap.colorSpace=T.SRGBColorSpace;barkMap.wrapS=barkMap.wrapT=T.RepeatWrapping;barkMap.magFilter=T.LinearFilter;barkMap.minFilter=T.LinearMipmapLinearFilter;barkMap.generateMipmaps=true;barkMap.needsUpdate=true;
 const wood=new T.Mesh(geo,new T.MeshStandardMaterial({map:barkMap,bumpMap:barkMap,bumpScale:old?.012:.004,vertexColors:true,roughness:.86,metalness:0}));wood.name='rowan-bark-trunk-branches';wood.castShadow=true;wood.receiveShadow=true;root.add(wood);
 if(season!=='winter'&&leafRows.length){
  // One compound leaf with 13 narrow tapered leaflets on a shared rachis.
  const p=[],c=[],idx=[];
  function leaflet(x,z,angle,L,W){
   const dx=Math.cos(angle),dz=Math.sin(angle),sx=-dz,sz=dx,base=p.length/3,rows=3;
   if(mobile){p.push(x,0,z,x+dx*L*.47+sx*W,.003,z+dz*L*.47+sz*W,x+dx*L*.47-sx*W,.003,z+dz*L*.47-sz*W,x+dx*L,0,z+dz*L);c.push(.85,.85,.85,1,1,1,.96,.96,.96,.9,.9,.9);idx.push(base,base+1,base+2,base+1,base+3,base+2);return;}
   for(let j=0;j<=rows;j++){const t=j/rows,w=W*Math.pow(Math.sin(Math.PI*t),.7)*(j%2?.95:1);for(const k of [-1,0,1]){if(mobile&&k===0)continue;p.push(x+dx*L*t+sx*w*k,.004*Math.sin(t*Math.PI)-Math.abs(k)*w*.24,z+dz*L*t+sz*w*k);const tone=(k===0?1:.88)*(.91+.09*Math.sin(t*Math.PI));c.push(tone,tone,tone);}}
   const cols=mobile?2:3;for(let j=0;j<rows;j++)for(let k=0;k<cols-1;k++){const a=base+j*cols+k,b=a+cols;idx.push(a,b,a+1,a+1,b,b+1);}
  }
  for(let i=0;i<6;i++){const z=.028+i*.027,L=.059*(1-.055*i);leaflet(0,z,.48,L,.010);leaflet(0,z,Math.PI-.48,L,.010);}
  leaflet(0,.178,Math.PI/2,.043,.008);
  const q=p.length/3;p.push(-.0008,0,0,.0008,0,0,-.0005,0,.195,.0005,0,.195);c.push(.6,.66,.48,.6,.66,.48,.6,.66,.48,.6,.66,.48);idx.push(q,q+1,q+2,q+1,q+3,q+2);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setIndex(idx);g.computeVertexNormals();
  const mat=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.84,envMapIntensity:.25});
  const mesh=new T.InstancedMesh(g,mat,leafRows.length);mesh.name='rowan-pinnate-foliage';mesh.castShadow=!mobile;mesh.receiveShadow=true;
  const obj=new T.Object3D(),color=new T.Color(),palette=(season==='autumn'?['#aa743d','#bd9a48','#9a633a','#777a42']:['#3d5834','#506b3d','#5b7346','#6a8250','#455e39']).map(x=>new T.Color(x));
  leafRows.forEach(([p,d,s,t],i)=>{obj.position.copy(p);obj.quaternion.setFromUnitVectors(V(0,0,1),d);obj.rotateZ((t-.5)*2.55);obj.scale.setScalar(s);obj.updateMatrix();mesh.setMatrixAt(i,obj.matrix);mesh.setColorAt(i,color.copy(palette[Math.floor(t*palette.length)]).multiplyScalar(.86+t*.23));});mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();root.add(mesh);
 }
 if(fruitRows.length){const g=new T.SphereGeometry(1,mobile?5:8,mobile?4:6),mat=new T.MeshStandardMaterial({roughness:.53,metalness:0}),m=new T.InstancedMesh(g,mat,fruitRows.length),obj=new T.Object3D(),a=new T.Color('#a92f19'),b=new T.Color('#d96927'),c=new T.Color();m.name='rowan-fruit-berries';fruitRows.forEach(([p,s,t],i)=>{obj.position.copy(p);obj.scale.setScalar(s);obj.updateMatrix();m.setMatrixAt(i,obj.matrix);m.setColorAt(i,c.copy(a).lerp(b,t));});m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;m.computeBoundingSphere();root.add(m);}
 if(calyxRows.length){const g=new T.SphereGeometry(1,5,3),m=new T.InstancedMesh(g,new T.MeshStandardMaterial({color:'#57382b',roughness:.93}),calyxRows.length),ob=new T.Object3D();m.name='rowan-fruit-calyx';calyxRows.forEach(([p,r],i)=>{ob.position.copy(p);ob.scale.set(r,r*.5,r);ob.updateMatrix();m.setMatrixAt(i,ob.matrix);});m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();root.add(m);}
 root.userData.formaRowanStats={age,compoundLeaves:leafRows.length,berries:fruitRows.length,mobile};
 return root;
}
