// FORMA R111: native Sorbus aucuparia, metric geometry and instanced compound leaves.
export function rowanStage(age=35){
 const a=Number(age)||35;
 return a<=15?{age:10,height:3.8,diameter:2.2}:a<=50?{age:35,height:7.8,diameter:5.0}:{age:75,height:11.2,diameter:7.8};
}
export function createNaturalRowan(T,o,{season='summer',mobile=false}={}){
 const root=new T.Group();root.name='forma-rowan-r112';
 const h=Math.max(.8,Number(o.height)||7.8),r=Math.max(.4,Number(o.diameter)||5)/2;
 const age=Number(o.rowan?.age)||(h<5?10:h>9?75:35),old=age>=60;
 let seed=(Number(o.variant)||1)*17431+Math.round(h*100);
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const V=(x,y,z)=>new T.Vector3(x,y,z),up=V(0,1,0),tau=Math.PI*2;
 const bp=[],bc=[],bi=[],bu=[],leafRows=[],fruitRows=[];
 const bark=new T.Color(old?'#665f56':'#858077'),dark=new T.Color('#49473f');
 function tube(points,radii,sides){
  const base=bp.length/3;
  points.forEach((p,i)=>{
   const dir=points[Math.min(i+1,points.length-1)].clone().sub(points[Math.max(0,i-1)]).normalize();
   const x=V(1,0,0).cross(dir);if(x.lengthSq()<.01)x.set(0,0,1).cross(dir);x.normalize();const z=dir.clone().cross(x);
   for(let k=0;k<sides;k++){const a=k*tau/sides,rr=radii[i]*(1+.045*Math.sin(k*3.1+i*.8));const q=p.clone().addScaledVector(x,Math.cos(a)*rr).addScaledVector(z,Math.sin(a)*rr);bp.push(q.x,q.y,q.z);bu.push(k/sides,p.y*.85);const c=bark.clone().lerp(dark,.07+.13*rand());bc.push(c.r,c.g,c.b);}
  });
  for(let i=0;i<points.length-1;i++)for(let k=0;k<sides;k++){const a=base+i*sides+k,b=base+i*sides+(k+1)%sides;bi.push(a,b,a+sides,b,b+sides,a+sides);}
 }
 const trunk=[];for(let i=0;i<=9;i++){const t=i/9;trunk.push(V(Math.sin(t*3.8)*h*.022*t,h*t*.98,Math.sin(t*5.1)*h*.018*t));}
 const trunkR=h*(old?.025:age<15?.014:.019);
 tube(trunk,trunk.map((_,i)=>Math.max(.005,trunkR*Math.pow(1-i/10,1.45))),mobile?9:15);
 const branches=age<15?18:old?35:29;
 for(let i=0;i<branches;i++){
  const t=.24+.64*(i+.45)/branches+(rand()-.5)*.055,ang=i*2.399963+(rand()-.5)*.95;
  const envelope=Math.pow(Math.sin(Math.PI*(t-.12)/.91),.58)*(old?1:1-.08*(t-.3));
  const reach=r*envelope*(.63+.30*rand()),dx=Math.cos(ang),dz=Math.sin(ang);
  const start=V(Math.sin(t*3.8)*h*.022*t,h*t,Math.sin(t*5.1)*h*.018*t);
  const end=V(dx*reach,Math.min(h*.96,h*(t+.055+.115*rand())),dz*reach);
  const mid=start.clone().lerp(end,.48);mid.y-=h*(.008+.035*rand());mid.x+=Math.sin(ang)*r*(rand()-.5)*.12;mid.z-=Math.cos(ang)*r*(rand()-.5)*.12;
  const br=trunkR*(.13+.22*(1-t))*(.65+.6*rand());
  tube([start,mid,end],[br,br*.52,.004],mobile?6:9);
  const shoots=mobile?12:17;
  for(let j=0;j<shoots;j++){
   const f=.28+.72*(j+.4)/shoots,anchor= f<.48?start.clone().lerp(mid,f/.48):mid.clone().lerp(end,(f-.48)/.52);
   const side=(j%2?1:-1),a=ang+side*(.40+.65*rand());
   const len=Math.min(r*.52,h*.19)*(.63+.52*rand())*(1-.35*f);
   const tip=anchor.clone().add(V(Math.cos(a)*len,h*(.035+.055*rand()),Math.sin(a)*len));
   const elbow=anchor.clone().lerp(tip,.53);elbow.y-=len*.08;
   tube([anchor,elbow,tip],[br*.22,.006,.0018],mobile?4:6);
   const n=mobile?11:16;
   for(let k=0;k<n;k++){
    const u=.16+.84*k/(n-1),p=anchor.clone().lerp(tip,u),a2=a+(k%2?1:-1)*(1.05+.55*rand());
    const direction=V(Math.cos(a2),-.10+.42*rand(),Math.sin(a2)).normalize();
    p.addScaledVector(direction,.025+rand()*.045);
    leafRows.push([p,direction,1.04+rand()*.48,rand()]);
    // Secondary leafy shoots populate the crown volume, not just a single branch line.
    const spread=Math.min(.36,r*.14)*(.45+.55*u);
    for(let m=0;m<(mobile?2:3);m++){
      const aa=a2+m*2.399963+rand()*.9,dir=V(Math.cos(aa),-.32+rand()*.68,Math.sin(aa)).normalize();
      const pp=p.clone().add(V(Math.cos(aa)*spread*(.55+.45*rand()),(rand()-.4)*spread,Math.sin(aa)*spread*(.55+.45*rand())));
      leafRows.push([pp,dir,.88+rand()*.57,rand()]);
      if(m===0&&k%3===0)tube([p,pp],[.0018,.0009],mobile?3:5);
    }
   }
   if(age>=15&&(season==='summer'||season==='autumn')&&rand()<(mobile?.38:.48)){
    const center=tip.clone().add(V(0,-.075,0)),count=mobile?18:30;
    for(let k=0;k<count;k++){const a3=k*2.399963,rr=.063*Math.sqrt(rand()),p=center.clone().add(V(Math.cos(a3)*rr,-.018-.043*rand(),Math.sin(a3)*rr));fruitRows.push([p,.0042+.0012*rand(),rand()]);}
    tube([tip,center],[.002,.001],4);
   }
  }
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(bp,3));geo.setAttribute('color',new T.Float32BufferAttribute(bc,3));geo.setAttribute('uv',new T.Float32BufferAttribute(bu,2));geo.setIndex(bi);geo.computeVertexNormals();
 // Small repeatable bark map with horizontal lenticels and fine weathered pores.
 const tw=128,th=256,pixels=new Uint8Array(tw*th*4);
 for(let y=0;y<th;y++)for(let x=0;x<tw;x++){
  const k=(y*tw+x)*4,grain=(rand()-.5)*18,streak=5*Math.sin(x*.22)+3*Math.sin(x*.81);
  const band=y%29,cell=Math.floor(y/29),cx=(cell*47)%tw,dx=Math.min(Math.abs(x-cx),tw-Math.abs(x-cx));
  const lenticel=band<2&&dx<7+(cell%4)*3?35:0;
  const v=Math.max(80,Math.min(245,216+grain+streak-lenticel));
  pixels.set([v,v,v,255],k);
 }
 const barkMap=new T.DataTexture(pixels,tw,th,T.RGBAFormat);barkMap.colorSpace=T.SRGBColorSpace;barkMap.wrapS=barkMap.wrapT=T.RepeatWrapping;barkMap.magFilter=T.LinearFilter;barkMap.minFilter=T.LinearMipmapLinearFilter;barkMap.generateMipmaps=true;barkMap.needsUpdate=true;
 const wood=new T.Mesh(geo,new T.MeshStandardMaterial({map:barkMap,vertexColors:true,roughness:.91,metalness:0}));wood.name='rowan-bark-trunk-branches';wood.castShadow=true;wood.receiveShadow=true;root.add(wood);
 if(season!=='winter'&&leafRows.length){
  // One compound leaf with 13 narrow tapered leaflets on a shared rachis.
  const p=[],c=[],idx=[];
  function leaflet(x,z,angle,L,W){
   const dx=Math.cos(angle),dz=Math.sin(angle),sx=-dz,sz=dx,base=p.length/3,rows=3;
   if(mobile){p.push(x,0,z,x+dx*L*.47+sx*W,.003,z+dz*L*.47+sz*W,x+dx*L*.47-sx*W,.003,z+dz*L*.47-sz*W,x+dx*L,0,z+dz*L);c.push(.85,.85,.85,1,1,1,.96,.96,.96,.9,.9,.9);idx.push(base,base+1,base+2,base+1,base+3,base+2);return;}
   for(let j=0;j<=rows;j++){const t=j/rows,w=W*Math.pow(Math.sin(Math.PI*t),.7)*(j%2?.95:1);for(const k of [-1,0,1]){if(mobile&&k===0)continue;p.push(x+dx*L*t+sx*w*k,.004*Math.sin(t*Math.PI)-Math.abs(k)*w*.24,z+dz*L*t+sz*w*k);const tone=k===0?1:.88;c.push(tone,tone,tone);}}
   const cols=mobile?2:3;for(let j=0;j<rows;j++)for(let k=0;k<cols-1;k++){const a=base+j*cols+k,b=a+cols;idx.push(a,b,a+1,a+1,b,b+1);}
  }
  for(let i=0;i<6;i++){const z=.028+i*.027,L=.059*(1-.055*i);leaflet(0,z,.48,L,.010);leaflet(0,z,Math.PI-.48,L,.010);}
  leaflet(0,.178,Math.PI/2,.043,.008);
  const q=p.length/3;p.push(-.0008,0,0,.0008,0,0,-.0005,0,.195,.0005,0,.195);c.push(.6,.66,.48,.6,.66,.48,.6,.66,.48,.6,.66,.48);idx.push(q,q+1,q+2,q+1,q+3,q+2);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setIndex(idx);g.computeVertexNormals();
  const mat=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.78,envMapIntensity:.35});
  const mesh=new T.InstancedMesh(g,mat,leafRows.length);mesh.name='rowan-pinnate-foliage';mesh.castShadow=!mobile;mesh.receiveShadow=true;
  const obj=new T.Object3D(),color=new T.Color(),palette=(season==='autumn'?['#aa743d','#bd9a48','#9a633a','#777a42']:['#526b3f','#627c48','#46633a','#758b51']).map(x=>new T.Color(x));
  leafRows.forEach(([p,d,s,t],i)=>{obj.position.copy(p);obj.quaternion.setFromUnitVectors(V(0,0,1),d);obj.rotateZ((t-.5)*1.3);obj.scale.setScalar(s);obj.updateMatrix();mesh.setMatrixAt(i,obj.matrix);mesh.setColorAt(i,color.copy(palette[Math.floor(t*palette.length)]).multiplyScalar(.92+t*.16));});mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();root.add(mesh);
 }
 if(fruitRows.length){const g=new T.SphereGeometry(1,mobile?5:8,mobile?4:6),mat=new T.MeshStandardMaterial({roughness:.53,metalness:0}),m=new T.InstancedMesh(g,mat,fruitRows.length),obj=new T.Object3D(),a=new T.Color('#b34c28'),b=new T.Color('#d57831'),c=new T.Color();m.name='rowan-fruit-berries';fruitRows.forEach(([p,s,t],i)=>{obj.position.copy(p);obj.scale.setScalar(s);obj.updateMatrix();m.setMatrixAt(i,obj.matrix);m.setColorAt(i,c.copy(a).lerp(b,t));});m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;m.computeBoundingSphere();root.add(m);}
 return root;
}
