/* FORMA R30 maple: a continuous textured trunk, tapered forks and individually
 * oriented leaf masks, no reliance on the old low-poly catalogue GLB. */
import {barkTexture} from './forma-landscape-3d-vegetation.js?v=R29';
import {mapleLeafMask} from './forma-landscape-3d-photo-foliage.js?v=R29';
function random(s){let n=2166136261;for(const ch of String(s))n=Math.imul(n^ch.charCodeAt(0),16777619);return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const barkCache=new WeakMap();
function barkMaps(T){
 if(barkCache.has(T))return barkCache.get(T);
 const map=barkTexture(T,'maple'),canvas=map.image,ctx=canvas.getContext('2d'),r=random('maple fissures');
 for(let i=0;i<150;i++){
  const x=r()*canvas.width,y=r()*canvas.height,len=30+r()*115;
  ctx.strokeStyle='rgba(34,32,27,.48)';ctx.lineWidth=1.2+r()*3;
  ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+(r()-.5)*13,y+len*.3,x+(r()-.5)*16,y+len*.7,x+(r()-.5)*6,y+len);ctx.stroke();
 }
 map.needsUpdate=true;
 const result={map,normal:null,materials:new Set()};barkCache.set(T,result);
 const base='https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/trident_maple_bark/trident_maple_bark_';
 const loader=new T.TextureLoader().setCrossOrigin('anonymous');
 for(const [channel,slot] of [['diff','map'],['nor_gl','normal']])loader.load(base+channel+'_1k.jpg',t=>{
  t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;if(slot==='map')t.colorSpace=T.SRGBColorSpace;
  result[slot]=t;
  for(const m of result.materials){m.map=result.map;m.bumpMap=result.normal?null:result.map;m.normalMap=result.normal;m.needsUpdate=true;}
  window.dispatchEvent(new Event('forma-foliage-texture-ready'));
 },undefined,()=>{});
 return result;
}
export function createNaturalMaple(T,instance,{season='summer'}={}){
 const h=clamp(Number(instance.height)||13,.25,40),d=clamp(Number(instance.diameter)||8,.2,30),rad=d*.5;
 const r=random('maple|'+instance.id+'|'+instance.variant),g=new T.Group(),V=(x,y,z)=>new T.Vector3(x,y,z);
 const pos=[],uv=[],idx=[],leafPoints=[];
 const trunkR=clamp(h*.019,.035,.44),mobile=window.innerWidth<=850;
 function tube(points,radii,sides,seed){
  let first=pos.length/3,dist=0;const phase=seed*6.283;
  for(let i=0;i<points.length;i++){
   const p=points[i],axis=points[Math.min(i+1,points.length-1)].clone().sub(points[Math.max(0,i-1)]).normalize();
   const ref=Math.abs(axis.y)>.93?V(1,0,0):V(0,1,0),u=new T.Vector3().crossVectors(axis,ref).normalize(),v=new T.Vector3().crossVectors(axis,u).normalize();
   if(i)dist+=p.distanceTo(points[i-1]);
   const R=radii[i];
   for(let j=0;j<=sides;j++){
    const a=j*6.28318530718/sides,irregular=1+.085*Math.sin(a*5+phase+i*.19)+.035*Math.cos(a*9-phase);
    const q=p.clone().addScaledVector(u,Math.cos(a)*R*irregular).addScaledVector(v,Math.sin(a)*R*irregular);
    pos.push(q.x,q.y,q.z);uv.push(j/sides*Math.max(.35,R*6.283/.48),dist/.65);
    if(i&&j<sides){const k=first+(i-1)*(sides+1)+j,l=k+sides+1;idx.push(k,k+1,l,k+1,l+1,l);}
   }
  }
 }
 const trunk=[];
 for(let i=0;i<=20;i++){const t=i/20;trunk.push(V(h*.014*Math.sin(t*5.7)*t,h*t*.91,h*.009*Math.sin(t*8.1)*t));}
 tube(trunk,trunk.map((_,i)=>trunkR*(i===0?1.5:i===1?1.16:Math.max(.045,Math.pow(1-i/21,1.36)))),24,r());
 // Low, shallow, embedded root flares, rather than triangular feet.
 for(let i=0;i<6;i++){const a=i*1.047+r()*.3,l=trunkR*(1.45+r()*.8);
  tube([V(0,trunkR*.75,0),V(Math.cos(a)*l*.6,trunkR*.27,Math.sin(a)*l*.6),V(Math.cos(a)*l,-trunkR*.08,Math.sin(a)*l)],[trunkR*.38,trunkR*.20,.006],8,r());
 }
 function curve(a,b,width,bend,sides=8){
  const mid=a.clone().lerp(b,.48);mid.y+=bend;
  const curve=new T.QuadraticBezierCurve3(a,mid,b),pts=curve.getPoints(sides>=12?7:4);
  tube(pts,pts.map((_,i)=>width*Math.max(.045,Math.pow(1-i/pts.length,1.15))),sides,r());
  return curve;
 }
 function leafyTwig(a,b,width){
  const q=curve(a,b,width,h*.003,5);
  const count=mobile?8:13;
  for(let j=0;j<count;j++){
   const t=(j+.5)/count,p=q.getPoint(t),axis=q.getTangent(t),side=new T.Vector3().crossVectors(axis,V(0,1,0)).normalize();
   for(const sign of [-1,1]){
    const reach=clamp(h*.008,.035,.10)*(.6+r()*.75);
    const leaf=p.clone().addScaledVector(side,sign*reach).add(V(0,(r()-.4)*reach,0));
    leafPoints.push({p:leaf,yaw:r()*6.283,pitch:(r()-.5)*1.9,roll:(r()-.5)*1.6,size:clamp(h*.011,.06,.18)*(.72+r()*.65)});
   }
  }
 }
 // Branches follow a rounded, asymmetrical deciduous crown: lower limbs spread
 // outwards, upper forks rise. No horizontal conifer whorls or leaf spheres.
 for(let i=0;i<15;i++){
  const t=i/14,az=i*2.399+(r()-.5)*.48,y=h*(.31+t*.49);
  const base=trunk[Math.min(20,Math.round(y/(h*.91)*20))].clone();
  const len=rad*(.58+.39*Math.sin(Math.PI*(.18+t*.8)))*(.86+r()*.14);
  const tip=V(Math.cos(az)*len,Math.min(h*.94,y+h*(.12+.09*r())),Math.sin(az)*len);
  const main=curve(base,tip,trunkR*(.38-.17*t),-h*.025,14);
  for(let k=0;k<10;k++){
   const f=.30+(k+.5)/10*.67,p=main.getPoint(f),side=k%2?1:-1,a=az+side*(.42+r()*.95);
   const span=rad*(.20+.15*r())*(1-f*.5);
   let end=p.clone().add(V(Math.cos(a)*span,h*(.045+r()*.06),Math.sin(a)*span));
   const limit=rad*(.97-.12*t),rr=Math.hypot(end.x,end.z);if(rr>limit){end.x*=limit/rr;end.z*=limit/rr;}end.y=Math.min(h*.985,end.y);
   const secondary=curve(p,end,trunkR*.10*(1-f*.5),h*.009,8);
   for(let j=0;j<5;j++){
    const q=secondary.getPoint(.27+(j+.5)*.14),angle=a+(j%2?1:-1)*(.6+r()*.75),s=clamp(rad*.105,.12,.55)*(.7+r()*.4);
    const e=q.clone().add(V(Math.cos(angle)*s,h*(.008+r()*.018),Math.sin(angle)*s));
    const radius=Math.hypot(e.x,e.z);if(radius>rad*.98){e.x*=rad*.98/radius;e.z*=rad*.98/radius;}e.y=Math.min(h*.99,e.y);
    leafyTwig(q,e,Math.max(.0015,trunkR*.015));
   }
  }
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();geo.computeBoundingSphere();
 const maps=barkMaps(T),bark=new T.MeshStandardMaterial({map:maps.map,bumpMap:maps.normal?null:maps.map,normalMap:maps.normal,bumpScale:.024,roughness:.94,metalness:0,envMapIntensity:.22});
 maps.materials.add(bark);bark.addEventListener('dispose',()=>maps.materials.delete(bark));
 const stem=new T.Mesh(geo,bark);stem.castShadow=true;stem.receiveShadow=true;stem.name='FORMA maple continuous textured forks';g.add(stem);
 if(season!=='winter'&&leafPoints.length){
  const leaf=new T.MeshStandardMaterial({map:mapleLeafMask(T),alphaTest:.32,side:T.DoubleSide,roughness:.84,metalness:0,depthWrite:true,envMapIntensity:.26});
  const mesh=new T.InstancedMesh(new T.PlaneGeometry(1,1),leaf,leafPoints.length),o=new T.Object3D();
  const palette=(season==='autumn'?['#cfad73','#c28c50','#d9c18a','#a6a16f']:['#ced5b9','#b3c0a1','#e1e0c8','#a9b59a']).map(c=>new T.Color(c));
  leafPoints.forEach((l,i)=>{o.position.copy(l.p);o.rotation.set(l.pitch,l.yaw,l.roll);o.scale.set(l.size,l.size*.95,1);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);mesh.setColorAt(i,palette[Math.floor(r()*palette.length)]);});
  mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();mesh.castShadow=true;mesh.receiveShadow=false;mesh.name='FORMA maple alpha leaves R30';g.add(mesh);
 }
 g.userData.species='maple';g.userData.physicalHeight=h;g.userData.crownDiameter=d;g.userData.nativeMapleR30=true;g.userData.leafCount=season==='winter'?0:leafPoints.length;
 return g;
}
