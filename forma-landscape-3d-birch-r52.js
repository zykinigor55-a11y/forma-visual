/* FORMA Birch R52 — independent native 3D inspection model.
   Original procedural geometry and textures; no downloaded assets. */
export const BIRCH_STAGES=Object.freeze([
 {age:10,height:6,diameter:3.6,radius:.075,limbs:12,start:.33,droop:.55,bend:.10},
 {age:35,height:16,diameter:9,radius:.23,limbs:19,start:.30,droop:1,bend:.27},
 {age:75,height:20,diameter:13,radius:.43,limbs:24,start:.25,droop:1.2,bend:.62}
]);
export function birchStage(age){return BIRCH_STAGES.find(p=>p.age===Number(age))||BIRCH_STAGES[1];}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function random(seed){let x=2166136261;for(const c of String(seed))x=Math.imul(x^c.charCodeAt(0),16777619);return()=>((x=Math.imul(x,1664525)+1013904223>>>0)/4294967296);}
const cache=new WeakMap();
function textures(T){
 if(cache.has(T))return cache.get(T);
 const make=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
 const bark=make(1024,1024),x=bark.getContext('2d'),r=random('birch bark r52');
 x.fillStyle='#e2e0d5';x.fillRect(0,0,1024,1024);
 for(let i=0;i<16000;i++){const a=r()*1024,b=r()*1024,w=2+r()*40,h=.4+r()*4;x.fillStyle=i%3?'rgba(85,80,70,.05)':'rgba(255,255,250,.14)';x.fillRect(a,b,w,h);}
 for(let i=0;i<490;i++){const a=r()*1024,b=r()*1024,w=4+r()*65,h=.8+r()*3.8;x.strokeStyle=i%3?'rgba(68,65,57,.55)':'rgba(104,100,84,.37)';x.lineWidth=h;x.beginPath();x.moveTo(a,b);x.quadraticCurveTo(a+w*.6,b+(r()-.5)*4,a+w,b+(r()-.5)*5);x.stroke();}
 for(let i=0;i<38;i++){const a=r()*1024,b=r()*1024,w=14+r()*100,h=8+r()*37;x.fillStyle=i%3?'#49463d':'#6e695b';x.beginPath();x.moveTo(a-w*.55,b);for(let j=0;j<13;j++){const t=j/12;x.lineTo(a-w*.55+w*t,b-h*Math.sin(t*Math.PI)*(.35+.65*r()));}for(let j=12;j>=0;j--){const t=j/12;x.lineTo(a-w*.55+w*t,b+h*Math.sin(t*Math.PI)*(.35+.65*r()));}x.closePath();x.fill();x.strokeStyle='rgba(40,37,32,.45)';x.lineWidth=1;for(let j=0;j<7;j++){x.beginPath();x.moveTo(a-w*.5+r()*w,b-h*.5+r()*h);x.lineTo(a-w*.5+r()*w,b+h*.4);x.stroke();}}
 for(let i=0;i<80;i++){const a=r()*1024,b=r()*1024,w=12+r()*50;x.fillStyle='rgba(117,112,96,.13)';x.fillRect(a,b,w,1+r()*3);x.fillStyle='rgba(255,255,249,.52)';x.fillRect(a,b+2,w*.8,1);}
 const bt=new T.CanvasTexture(bark);bt.colorSpace=T.SRGBColorSpace;bt.wrapS=bt.wrapT=T.RepeatWrapping;bt.anisotropy=8;
 const leaf=make(128,160),l=leaf.getContext('2d'),grad=l.createLinearGradient(15,0,110,160);
 grad.addColorStop(0,'#b7bc82');grad.addColorStop(.45,'#8f9f64');grad.addColorStop(1,'#75884d');l.fillStyle=grad;
 l.beginPath();l.moveTo(64,153);for(let i=0;i<=22;i++){const t=i/22,yy=145-137*t,ww=50*Math.pow(Math.sin(Math.PI*t),.72)*(1.12-.30*t);l.lineTo(64-ww*(i%2?.88:1),yy);}for(let i=22;i>=0;i--){const t=i/22,yy=145-137*t,ww=50*Math.pow(Math.sin(Math.PI*t),.72)*(1.12-.30*t);l.lineTo(64+ww*(i%2?.88:1),yy);}l.closePath();l.fill();l.strokeStyle='rgba(212,215,157,.8)';l.lineWidth=1.3;l.beginPath();l.moveTo(64,154);l.lineTo(64,11);l.stroke();l.lineWidth=.75;for(let i=0;i<8;i++){const t=(i+2)/12,y=145-137*t,w=42*Math.sin(Math.PI*t);for(const sign of [-1,1]){l.beginPath();l.moveTo(64,y+9);l.quadraticCurveTo(64+sign*w*.55,y,64+sign*w,y-14);l.stroke();}}
 const lt=new T.CanvasTexture(leaf);lt.colorSpace=T.SRGBColorSpace;lt.anisotropy=4;const out={bark:bt,leaf:lt};cache.set(T,out);return out;
}
export function createNaturalBirch(T,o,{season='summer'}={}){
 const p=birchStage(o.birch?.age),h=Number(o.height)||p.height,R=(Number(o.diameter)||p.diameter)/2,mobile=typeof window!=='undefined'&&window.innerWidth<=850;
 const r=random('birch-r52|'+o.id+'|'+o.variant+'|'+p.age),g=new T.Group(),V=(x,y,z)=>new T.Vector3(x,y,z),tex=textures(T);
 const pale={pos:[],uv:[],col:[],idx:[]},dark={pos:[],uv:[],col:[],idx:[]},foliage=[];
 const polar=(a,d,y)=>V(Math.cos(a)*d,y,Math.sin(a)*d),mix=(a,b,t)=>a.clone().lerp(b,t),curve=pts=>new T.CatmullRomCurve3(pts,false,'centripetal');
 function tube(path,steps,sides,base,tip,white=false,root=false){
  const b=white?pale:dark,pts=path.getPoints(steps),first=b.pos.length/3;let U=null,len=0;const phase=r()*6.28;
  for(let i=0;i<=steps;i++){const t=i/steps,c=pts[i],axis=pts[Math.min(steps,i+1)].clone().sub(pts[Math.max(0,i-1)]).normalize(),ref=Math.abs(axis.y)>.92?V(1,0,0):V(0,1,0);
   U=U?U.clone().addScaledVector(axis,-U.dot(axis)):V(0,0,0).crossVectors(axis,ref);if(U.lengthSq()<1e-8)U.crossVectors(axis,ref);U.normalize();const W=V(0,0,0).crossVectors(axis,U).normalize();
   if(i)len+=c.distanceTo(pts[i-1]);const radius=(tip+(base-tip)*Math.pow(1-t,1.32))*(root?1+.32*Math.exp(-t*24):1);
   const rootTint=root?clamp((c.y/(h*(p.age===75?.20:.10)))+.28,.28,1):1;
   for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,rr=radius*(1+.06*Math.sin(a*5+phase+t*3));const q=c.clone().addScaledVector(U,rr*Math.cos(a)).addScaledVector(W,rr*Math.sin(a));b.pos.push(q.x,q.y,q.z);b.uv.push(j/sides*Math.max(.7,base*6.28/.65),len/.95);b.col.push(rootTint,rootTint*.99,rootTint*.96);if(i&&j<sides){const k=first+(i-1)*(sides+1)+j,n=k+sides+1;b.idx.push(k,k+1,n,k+1,n+1,n);}}
  }
 }
 const trunk=curve([V(0,-.04,0),V(-p.bend*.25,h*.18,p.bend*.1),V(p.bend*.35,h*.38,-p.bend*.15),V(p.bend*.75,h*.58,p.bend*.25),V(-p.bend*.20,h*.79,p.bend*.18),V(p.bend*.28,h*.97,0)]);
 tube(trunk,66,28,p.radius,.012,true,true);
 for(let i=0;i<5;i++){const az=i*1.256+r()*.2,L=p.radius*(1.5+r()*.8);tube(curve([V(0,p.radius*.6,0),polar(az,L*.45,p.radius*.18),polar(az,L,-.03)]),8,8,p.radius*.36,.005,true,true);}
 function leafTwig(a,az,len,drop){
  const end=a.clone().add(polar(az,len*.76,-drop)),c=curve([a,a.clone().add(polar(az,len*.33,len*.13)),mix(a,end,.6).add(polar(az+.7,len*.12,0)),end]);tube(c,7,4,.0035,.0006);
  if(season==='winter')return;const n=Math.max(7,Math.min(mobile?34:52,Math.round(c.getLength()/(mobile?.052:.039))));
  for(let i=0;i<n;i++){const t=(i+.45)/n,origin=c.getPoint(t),ang=az+(i%2?1:-1)*(1+r()*1.0),dir=polar(ang,.65+r()*.35,-.28-r()*.65).normalize(),size=.065+r()*.043;foliage.push({origin,dir,size,roll:(r()-.5)*2.8,shade:r()});}
 }
 for(let i=0;i<p.limbs;i++){
  const u=i/(p.limbs-1),t=clamp(p.start+u*(.95-p.start)+(r()-.5)*.055,.24,.95),a=trunk.getPoint(t),az=i*2.39996+(r()-.5)*.75;
  const envelope=Math.pow(Math.sin(Math.PI*(.18+.77*u)),.83),rad=R*envelope*(.70+r()*.22),rise=h*(.065+.075*r())*(1-.40*u),end=a.clone().add(polar(az,rad,rise*.55));
  end.y=Math.min(h*.99,end.y);const main=curve([a,a.clone().add(polar(az,rad*.24,rise*.44)),a.clone().add(polar(az+.09,rad*.67,rise)),end]);
  tube(main,27,12,p.radius*(.31-.20*u)*(.75+r()*.4),.006,true);
  const secondaryCount=mobile?7:9;
  for(let j=0;j<secondaryCount;j++){
   const f=.19+j*.76/(secondaryCount-1),b=main.getPoint(f),theta=az+(j%2?1:-1)*(.55+r()*.95),span=R*(.16+r()*.15)*(1-.46*u)*(.6+.4*Math.sin(Math.PI*f));
   const e=b.clone().add(polar(theta,span,h*(.025+r()*.035)));e.y=Math.min(h*.985,e.y);
   const sec=curve([b,b.clone().add(polar(theta,span*.38,h*.025)),e]);tube(sec,12,6,Math.max(.007,p.radius*.065*(1-f*.55)),.0018,false);
   const twigCount=mobile?7:9;
   for(let k=0;k<twigCount;k++){
    const q=sec.getPoint(.12+k*.85/(twigCount-1)),ang=theta+(k%2?1:-1)*(.45+r()*1.5),len=R*(.09+r()*.14)*(1-.35*u);
    leafTwig(q,ang,len,len*(.30+.6*r())*p.droop);
    if(!mobile||k%2===0)leafTwig(q,ang+1.3,len*(.66+r()*.28),len*(.23+.5*r())*p.droop);
   }
  }
 }
 function mesh(b,mat,name){if(!b.pos.length)return;const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(b.pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(b.uv,2));geo.setAttribute('color',new T.Float32BufferAttribute(b.col,3));geo.setIndex(b.idx);geo.computeVertexNormals();geo.computeBoundingSphere();const m=new T.Mesh(geo,mat);m.name=name;m.castShadow=true;m.receiveShadow=true;g.add(m);}
 mesh(pale,new T.MeshStandardMaterial({map:tex.bark,color:'#f4f1e8',vertexColors:true,bumpMap:tex.bark,bumpScale:.025,roughness:.93,side:T.DoubleSide}),'Birch R52 bark and structural branches');
 mesh(dark,new T.MeshStandardMaterial({color:'#544839',roughness:.97,side:T.DoubleSide}),'Birch R52 fine woody twigs');
 if(foliage.length){const geo=new T.PlaneGeometry(1,1,2,2),a=geo.attributes.position;for(let i=0;i<a.count;i++)a.setZ(i,.16*(1-Math.abs(a.getX(i))*2)-.12*a.getY(i)**2);geo.computeVertexNormals();const mat=new T.MeshStandardMaterial({map:tex.leaf,alphaTest:.35,side:T.DoubleSide,roughness:.88,color:'#efefdf',emissive:'#8e986e',emissiveIntensity:.10});const m=new T.InstancedMesh(geo,mat,foliage.length),tmp=new T.Object3D(),Y=V(0,1,0),colors=(season==='autumn'?['#e4bf73','#c5ab62','#d0bb71']:['#d7dfbc','#c7d3af','#e1e5c6','#b9c5a1']).map(c=>new T.Color(c));
 foliage.forEach((f,i)=>{tmp.position.copy(f.origin).addScaledVector(f.dir,f.size*.43);tmp.quaternion.setFromUnitVectors(Y,f.dir);tmp.rotateY(f.roll);tmp.scale.set(f.size*.76,f.size,f.size*.76);tmp.updateMatrix();m.setMatrixAt(i,tmp.matrix);m.setColorAt(i,colors[Math.min(colors.length-1,Math.floor(f.shade*colors.length))]);});m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;m.computeBoundingSphere();m.castShadow=true;m.receiveShadow=true;m.name='Birch R52 serrated individual leaves';g.add(m);}
 g.userData.nativeBirchR52=true;g.userData.birchAge=p.age;g.userData.leafCount=foliage.length;g.userData.physicalHeight=h;g.userData.trunkDiameter=p.radius*2;return g;
}
