// FORMA R192 · Prunus serrulata, single five-petal flowering form.
// Deterministic real 3D branch topology, instanced blossoms and leaves.
export function sakuraStage(age=35){
 return age<=15?{age:10,height:3.2,diameter:2.6}:age<=50?{age:35,height:6.5,diameter:6.8}:{age:75,height:8.8,diameter:10.5};
}
export function createNaturalSakura(T,o,{season='spring',mobile=false}={}){
 const root=new T.Group();root.name='forma-sakura-r192';
 const h=Math.max(.8,Number(o.height)||6.5),r=Math.max(.4,Number(o.diameter)||6.8)/2;
 const age=sakuraStage(o.sakura?.age||(h<4?10:h>8?75:35)).age,young=age===10,old=age===75;
 let seed=(Number(o.variant)||1)*51283+age*7919;
 const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),tau=Math.PI*2,up=V(0,1,0);
 const bp=[],bc=[],uv=[],idx=[],flowers=[],leaves=[];
 const bark=new T.Color(old?'#62504a':young?'#795e50':'#6b554a'),shade=new T.Color('#463b37');
 const lerp=(a,b,t)=>a.clone().lerp(b,t);
 function tube(pts,radii,sides){
  const base=bp.length/3,stride=sides+1;let length=0,prevX=null;
  for(let i=0;i<pts.length;i++){
   if(i)length+=pts[i].distanceTo(pts[i-1]);
   const p=pts[i],d=pts[Math.min(i+1,pts.length-1)].clone().sub(pts[Math.max(0,i-1)]).normalize();
   let x=prevX?prevX.clone().addScaledVector(d,-prevX.dot(d)):V(1,0,0).cross(d);if(x.lengthSq()<.01)x=V(0,0,1).cross(d);x.normalize();prevX=x.clone();const z=d.clone().cross(x);
   for(let j=0;j<=sides;j++){
    const a=j*tau/sides,rr=radii[i]*(1+.045*Math.sin(a*5+length*.82)+.035*Math.sin(a*3-length*1.3));
    const q=p.clone().addScaledVector(x,Math.cos(a)*rr).addScaledVector(z,Math.sin(a)*rr);
    bp.push(q.x,q.y,q.z);uv.push(j/sides,length*1.35);
    const c=bark.clone().lerp(shade,.04+.10*(.5+.5*Math.sin(a*3+length*.67)));bc.push(c.r,c.g,c.b);
   }
  }
  for(let i=0;i<pts.length-1;i++)for(let j=0;j<sides;j++){const a=base+i*stride+j,b=a+1;idx.push(a,b,a+stride,b,b+stride,a+stride)}
 }
 function curved(a,b,bend,n=7){
  const pts=[];for(let i=0;i<=n;i++){const t=i/n;pts.push(lerp(a,b,t).addScaledVector(bend,Math.sin(Math.PI*t)))}return pts;
 }
 function branch(a,b,rad,bend,n=7,sides=7){const pts=curved(a,b,bend,n);tube(pts,pts.map((p,i)=>Math.max(.0018,rad*Math.pow(1-i/(pts.length+.2),1.25))),sides);return pts}
 const baseR=h*(young?.022:old?.042:.031),trunkTop=V(r*(rnd()-.5)*.23,h*.65,r*(rnd()-.5)*.18);
 const trunk=curved(V(),trunkTop,V(-r*.10,h*.035,r*.05),28);
 tube(trunk,trunk.map((p,i)=>Math.max(.012,baseR*(.22+.78*Math.pow(1-i/(trunk.length-1),1.2))*(1+.28*Math.exp(-i*.7)))),mobile?16:28);
 for(let k=0;k<(old?7:4);k++){
  const a=k*tau/(old?7:4),d=baseR*(1.6+rnd()*1.2);
  branch(V(0,baseR*1.4,0),V(Math.cos(a)*d,.015,Math.sin(a)*d),baseR*.34,V(0,baseR*.12,0),7,8);
 }
 const isFlower=season==='spring',hasLeaves=season!=='winter';
 function terminal(a,b,scale,makeTwig=true){
  if(makeTwig)branch(a,b,Math.max(.0022,h*.00048*scale),V((rnd()-.5)*.12,-h*.009,(rnd()-.5)*.12),5,5);
  if(!hasLeaves)return;
  const axis=b.clone().sub(a).normalize();
  const u=V(0,1,0).cross(axis);if(u.lengthSq()<.001)u.set(1,0,0);u.normalize();const v=axis.clone().cross(u).normalize();
  const clusters=isFlower?(mobile?5:7):(mobile?5:8);
  for(let i=0;i<clusters;i++){
   const t=.09+.87*(i+rnd()*.8)/clusters,center=lerp(a,b,t);
   const angle=rnd()*tau,spur=(.018+rnd()*.055)*Math.min(1.4,scale);
   center.addScaledVector(u,Math.cos(angle)*spur).addScaledVector(v,Math.sin(angle)*spur);
   const count=isFlower?(mobile?3+Math.floor(rnd()*3):4+Math.floor(rnd()*3)):2;
   for(let j=0;j<count;j++){
    const phi=angle+j*2.399963+rnd()*.65,rr=(.012+rnd()*.035)*scale;
    const p=center.clone().addScaledVector(u,Math.cos(phi)*rr).addScaledVector(v,Math.sin(phi)*rr).addScaledVector(axis,(rnd()-.5)*.055);
    const normal=u.clone().multiplyScalar(Math.cos(phi)).addScaledVector(v,Math.sin(phi)).addScaledVector(axis,(rnd()-.45)*1.2).normalize();
    const size=isFlower?.024+rnd()*.011:.039+rnd()*.034;
    (isFlower?flowers:leaves).push({p,s:size,normal,roll:rnd()*tau,t:rnd()});
   }
   if(isFlower&&rnd()<.035)leaves.push({p:center.clone(),s:.033+rnd()*.02,normal:u.clone(),roll:rnd()*tau,t:rnd()});
  }
 }
 const mains=young?8:old?15:12,secondary=young?5:old?9:8;
 for(let i=0;i<mains;i++){
  const a=i*2.399963+(rnd()-.5)*.62,dx=Math.cos(a),dz=Math.sin(a);
  const t=.30+.58*(i+.4)/mains,from=trunk[Math.floor(t*(trunk.length-1))];
  const reach=r*(.66+.30*rnd())*(young?.87:1)*(1-.28*Math.pow(i/mains,2));
  const top=h*(.48+.43*(i/mains)+rnd()*.085);
  const end=V(dx*reach,Math.min(h*.95,top),dz*reach);
  const main=branch(from,end,baseR*(.40-.20*i/mains),V(dx*r*.025,h*.09,-dz*r*.045),14,mobile?9:14);
  for(let k=0;k<secondary;k++){
   const f=.27+.68*(k+.25)/secondary,at=main[Math.min(main.length-2,Math.floor(f*(main.length-1)))];
   const side=a+(k%2?1:-1)*(.43+rnd()*.88),reach2=r*(.15+rnd()*.14)*(1-.36*f);
   const tip=at.clone().add(V(Math.cos(side)*reach2,h*(.035+rnd()*.105),Math.sin(side)*reach2));
   const d=Math.hypot(tip.x,tip.z);if(d>r*.99){tip.x*=r*.99/d;tip.z*=r*.99/d}tip.y=Math.min(h*.97,tip.y);
   const sub=branch(at,tip,baseR*(.065+.035*rnd())*(1-.4*f),V((rnd()-.5)*r*.12,h*.038,(rnd()-.5)*r*.12),8,7);
   const shoots=mobile?6:9;
   for(let m=0;m<shoots;m++){
    const p=sub[Math.min(sub.length-1,Math.floor((.25+.72*(m+.5)/shoots)*(sub.length-1)))];
    const ang=side+(m%2?1:-1)*(.35+rnd()*1.4),len=r*(.065+rnd()*.07);
    const e=p.clone().add(V(Math.cos(ang)*len,h*(.026+rnd()*.06),Math.sin(ang)*len));
    const rd=Math.hypot(e.x,e.z);if(rd>r){e.x*=r/rd;e.z*=r/rd}e.y=Math.min(h*.99,e.y);
    const shoot=branch(p,e,Math.max(.003,baseR*.021),V(0,h*.014,0),4,5);
    terminal(shoot[1],e,1,false);
    if(!mobile||m%2===0){
     const q=shoot[2],ang2=ang+(m%2?1:-1)*(.7+rnd()*.8);
     const e2=q.clone().add(V(Math.cos(ang2)*len*.65,h*(.012+rnd()*.036),Math.sin(ang2)*len*.65));
     const rr=Math.hypot(e2.x,e2.z);if(rr>r){e2.x*=r/rr;e2.z*=r/rr}e2.y=Math.min(h,e2.y);
     terminal(q,e2,.9);
    }
   }
  }
 }
 const woodGeo=new T.BufferGeometry();woodGeo.setAttribute('position',new T.Float32BufferAttribute(bp,3));woodGeo.setAttribute('color',new T.Float32BufferAttribute(bc,3));woodGeo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));woodGeo.setIndex(idx);woodGeo.computeVertexNormals();
 // Horizontal lenticels are characteristic of cherry bark.
 const w=256,ht=256,al=new Uint8Array(w*ht*4),bm=new Uint8Array(w*ht*4);
 for(let y=0;y<ht;y++)for(let x=0;x<w;x++){
  const mott=.5+.5*Math.sin(x*.17+y*.09)*Math.cos(x*.06-y*.11);
  let lent=0;
  const cx=Math.floor(x/32),cy=Math.floor(y/23);
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   const X=cx+dx,Y=cy+dy,hash=((Math.imul(X+37,73856093)^Math.imul(Y+71,19349663))>>>0);
   const xx=X*32+4+(hash%24),yy=Y*23+3+((hash>>>8)%17),rx=3+(hash%10),ry=.7+((hash>>>20)%3)*.3;
   const d=((x-xx)/rx)**2+((y-yy)/ry)**2;lent=Math.max(lent,Math.exp(-d*2));
  }
  const n=rnd(),c=Math.max(70,Math.min(255,232-52*lent-19*mott-11*n)),i=(y*w+x)*4,bb=150-55*lent+12*mott+5*n;
  al.set([c,c*.97,c*.94,255],i);bm.set([bb,bb,bb,255],i);
 }
 const tex=(data,srgb)=>{const t=new T.DataTexture(data,w,ht,T.RGBAFormat);t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t};
 const wood=new T.Mesh(woodGeo,new T.MeshStandardMaterial({vertexColors:true,map:tex(al,true),bumpMap:tex(bm,false),bumpScale:.0045,roughness:.82}));wood.name='sakura-bark-branches';wood.castShadow=wood.receiveShadow=true;root.add(wood);
 // Each blossom is a real five-petal cup, not a billboard or a pink sphere.
 function blossomGeo(){
  const p=[],ix=[],colors=[];
  for(let j=0;j<5;j++){
   const angle=j*tau/5,base=p.length/3;
   if(mobile){const pts=[[0,0,.05],[-.30,.09,.59],[-.21,.18,.96],[.21,.18,.96],[.30,.09,.59]];pts.forEach(([x,y,z],i)=>{p.push(x*Math.cos(angle)+z*Math.sin(angle),y,z*Math.cos(angle)-x*Math.sin(angle));colors.push(1,i===0?.78:.96,i===0?.82:.97)});ix.push(base,base+1,base+2,base,base+2,base+3,base,base+3,base+4);continue;}
   const points=[[0,0,.06],[-.23,.03,.29],[-.37,.14,.70],[-.22,.25,.99],[0,.22,.94],[.23,.25,.99],[.37,.14,.70],[.23,.03,.29],[0,.10,.59]];
   points.forEach(([x,y,z],i)=>{p.push(x*Math.cos(angle)+z*Math.sin(angle),y,z*Math.cos(angle)-x*Math.sin(angle));const a=i===0?.76:i===8?.93:1;colors.push(1,a,.94*a+.04)});
   for(let k=0;k<8;k++)ix.push(base+8,base+k,base+(k+1)%8);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ix);g.computeVertexNormals();return g;
 }
 function leafGeo(){
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,0,0,-.34,.04,.32,-.42,.07,.58,-.24,.04,.84,0,0,1,.24,.04,.84,.42,.07,.58,.34,.04,.32,0,.11,.52],3));const ix=[];for(let i=0;i<8;i++)ix.push(8,i,(i+1)%8);g.setIndex(ix);g.computeVertexNormals();return g;
 }
 function inst(rows,geo,palette,name){
  if(!rows.length)return;const mat=new T.MeshStandardMaterial({side:T.DoubleSide,roughness:.76,vertexColors:name==='sakura-blossoms'}),m=new T.InstancedMesh(geo,mat,rows.length),d=new T.Object3D(),spin=new T.Quaternion(),col=new T.Color();
  m.name=name;const cs=palette.map(v=>new T.Color(v));
  rows.forEach((row,i)=>{d.position.copy(row.p);d.quaternion.setFromUnitVectors(up,row.normal);spin.setFromAxisAngle(up,row.roll);d.quaternion.multiply(spin);d.scale.setScalar(row.s);d.updateMatrix();m.setMatrixAt(i,d.matrix);col.copy(cs[Math.min(cs.length-1,Math.floor(row.t*cs.length))]);m.setColorAt(i,col)});
  m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;m.computeBoundingSphere();m.castShadow=m.receiveShadow=true;root.add(m);
 }
 inst(flowers,blossomGeo(),['#f5e4e8','#f0d4dd','#eac4d0','#faedf0','#edcbd6'],'sakura-blossoms');
 inst(leaves,leafGeo(),season==='autumn'?['#a77944','#b58c53','#946345','#ab8a51']:['#607d48','#789253','#527340','#8a9e60'],'sakura-leaves');
 root.userData.formaSakuraStats={age,season,mobile,flowers:flowers.length,leaves:leaves.length,woodTriangles:idx.length/3};
 return root;
}
