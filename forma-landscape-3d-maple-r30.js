/* FORMA R30 maple: a continuous textured trunk, tapered forks and individually
 * oriented leaf masks, no reliance on the old low-poly catalogue GLB. */
import {barkTexture} from './forma-landscape-3d-vegetation.js?v=R29';
import {mapleLeafMask} from './forma-landscape-3d-photo-foliage.js?v=R31';
function random(s){let n=2166136261;for(const ch of String(s))n=Math.imul(n^ch.charCodeAt(0),16777619);return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const barkCache=new WeakMap();
function barkMaps(T){
 if(barkCache.has(T))return barkCache.get(T);
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=1024;
 const ctx=canvas.getContext('2d'),r=random('maple fissures'),map=new T.CanvasTexture(canvas);
 map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=4;
 // Original fallback with irregular interlocking plates rather than woodgrain.
 const img=ctx.createImageData(512,1024),height=ctx.createImageData(512,1024);
 const hash=(x,y,z)=>{let a=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(z,1274126177);a=Math.imul(a^(a>>>13),1274126177);return ((a^(a>>>16))>>>0)/4294967295};
 const noise=(u,v,nx,ny,k)=>{const x=u*nx,y=v*ny,ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,a=fx*fx*(3-2*fx),b=fy*fy*(3-2*fy);
 const q=(X,Y)=>hash((X%nx+nx)%nx,(Y%ny+ny)%ny,k);return (q(ix,iy)*(1-a)+q(ix+1,iy)*a)*(1-b)+(q(ix,iy+1)*(1-a)+q(ix+1,iy+1)*a)*b;};
 for(let y=0;y<1024;y++)for(let x=0;x<512;x++){
  const u=x/512,v=y/1024,warp=noise(u,v,7,5,1),coarse=noise(u,v,17,6,2),fine=noise(u,v,80,40,3);
  const f=Math.abs(Math.sin(Math.PI*(u*21+warp*1.1+noise(u,v,9,13,4)*.32)));
  const fissure=Math.max(0,1-f/.19),flaking=Math.max(0,1-Math.abs(coarse-.49)*24)*.45;
  const relief=135+(coarse-.5)*50+(fine-.5)*40-fissure*82-flaking*32;
  const tone=(warp-.5)*24+(coarse-.5)*31+(fine-.5)*24-fissure*43-flaking*15;
  const i=(y*512+x)*4;for(let k=0;k<3;k++){img.data[i+k]=[116,110,99][k]+tone;height.data[i+k]=relief;}img.data[i+3]=height.data[i+3]=255;
 }
 ctx.putImageData(img,0,0);const hc=document.createElement('canvas');hc.width=512;hc.height=1024;hc.getContext('2d').putImageData(height,0,0);
 const bump=new T.CanvasTexture(hc);bump.wrapS=bump.wrapT=T.RepeatWrapping;bump.anisotropy=4;
 for(let i=0;i<150;i++){
  const x=r()*canvas.width,y=r()*canvas.height,len=30+r()*115;
  ctx.strokeStyle='rgba(34,32,27,.48)';ctx.lineWidth=1.2+r()*3;
  ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+(r()-.5)*13,y+len*.3,x+(r()-.5)*16,y+len*.7,x+(r()-.5)*6,y+len);ctx.stroke();
 }
 map.needsUpdate=true;
 const result={map,bump,normal:null,materials:new Set()};barkCache.set(T,result);
 const base='https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/trident_maple_bark/trident_maple_bark_';
 const loader=new T.TextureLoader().setCrossOrigin('anonymous');
 for(const [channel,slot] of [['diff','map'],['nor_gl','normal']])loader.load(base+channel+'_1k.jpg',t=>{
  t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;if(slot==='map')t.colorSpace=T.SRGBColorSpace;
  result[slot]=t;
  for(const m of result.materials){m.map=result.map;m.bumpMap=result.normal?null:result.bump;m.normalMap=result.normal;m.needsUpdate=true;}
  window.dispatchEvent(new Event('forma-foliage-texture-ready'));
 },undefined,()=>{});
 return result;
}
export function createNaturalMaple(T,instance,{season='summer'}={}){
 const h=clamp(Number(instance.height)||13,.25,40),d=clamp(Number(instance.diameter)||8,.2,30),rad=d*.5;
 const r=random('maple|'+instance.id+'|'+instance.variant),g=new T.Group(),V=(x,y,z)=>new T.Vector3(x,y,z);
 const pos=[],uv=[],idx=[],leafPoints=[];
 const trunkR=clamp(h*.022,.035,.46),mobile=window.innerWidth<=850;
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
    pos.push(q.x,q.y,q.z);uv.push(j/sides*Math.max(.35,radii[0]*6.283/.65),dist/.85);
    if(i&&j<sides){const k=first+(i-1)*(sides+1)+j,l=k+sides+1;idx.push(k,k+1,l,k+1,l+1,l);}
   }
  }
 }
 const trunk=[];
 for(let i=0;i<=20;i++){const t=i/20;trunk.push(V(h*.029*Math.sin(t*5.7)*t,h*t*.96,h*.021*Math.sin(t*8.1)*t));}
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
  const count=mobile?10:14;
  for(let j=0;j<count;j++){
   const t=(j+.5)/count,p=q.getPoint(t),axis=q.getTangent(t),side=new T.Vector3().crossVectors(axis,V(0,1,0)).normalize();
   for(const sign of [-1,1]){
    const reach=clamp(h*.008,.035,.10)*(.6+r()*.75);
    const leaf=p.clone().addScaledVector(side,sign*reach).add(V(0,(r()-.4)*reach,0));
    leafPoints.push({p:leaf,yaw:r()*6.283,pitch:(r()-.5)*1.5,roll:(r()-.5)*2.4,size:clamp(h*.012,.07,.185)*(.67+r()*.65)});
   }
  }
 }
 // Branches follow a rounded, asymmetrical deciduous crown: lower limbs spread
 // outwards, upper forks rise. No horizontal conifer whorls or leaf spheres.
 for(let i=0;i<18;i++){
  const t=i/17,az=i*2.399+(r()-.5)*.85,y=h*(.28+t*.53+(r()-.5)*.032);
  const base=trunk[Math.min(20,Math.round(y/(h*.96)*20))].clone();
  const len=rad*(.43+.52*Math.sin(Math.PI*(.12+t*.85)))*(.78+r()*.22);
  const tip=V(Math.cos(az)*len,Math.min(h*.94,y+h*(.12+.09*r())),Math.sin(az)*len);
  const main=curve(base,tip,trunkR*(.38-.17*t),-h*.025,14);
  const forks=7+Math.floor(r()*5);
  for(let k=0;k<forks;k++){
   const f=.26+(k+.5)/forks*.70,p=main.getPoint(f),side=k%2?1:-1,a=az+side*(.42+r()*.95);
   const span=rad*(.20+.15*r())*(1-f*.5);
   let end=p.clone().add(V(Math.cos(a)*span,h*(.045+r()*.06),Math.sin(a)*span));
   const limit=rad*(.97-.12*t),rr=Math.hypot(end.x,end.z);if(rr>limit){end.x*=limit/rr;end.z*=limit/rr;}end.y=Math.min(h*.985,end.y);
   const secondary=curve(p,end,trunkR*.10*(1-f*.5),h*.009,8);
   for(let j=0;j<6;j++){
    const q=secondary.getPoint(.20+(j+.5)*.125),angle=a+(j%2?1:-1)*(.6+r()*.75),s=clamp(rad*.105,.12,.55)*(.7+r()*.4);
    const e=q.clone().add(V(Math.cos(angle)*s,h*(.008+r()*.018),Math.sin(angle)*s));
    const radius=Math.hypot(e.x,e.z);if(radius>rad*.98){e.x*=rad*.98/radius;e.z*=rad*.98/radius;}e.y=Math.min(h*.99,e.y);
    leafyTwig(q,e,Math.max(.0015,trunkR*.015));
   }
  }
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();geo.computeBoundingSphere();
 const maps=barkMaps(T),bark=new T.MeshStandardMaterial({map:maps.map,bumpMap:maps.normal?null:maps.bump,normalMap:maps.normal,bumpScale:.036,roughness:.94,metalness:0,envMapIntensity:.22});
 maps.materials.add(bark);bark.addEventListener('dispose',()=>maps.materials.delete(bark));
 const stem=new T.Mesh(geo,bark);stem.castShadow=true;stem.receiveShadow=true;stem.name='FORMA maple continuous textured forks';g.add(stem);
 if(season!=='winter'&&leafPoints.length){
  const leaf=new T.MeshStandardMaterial({map:mapleLeafMask(T),alphaTest:.32,side:T.DoubleSide,roughness:.84,metalness:0,depthWrite:true,envMapIntensity:.26});
  // A folded leaf surface with UVs, not a perfectly flat billboard.
 const leafGeo=new T.PlaneGeometry(1,1,4,4),lp=leafGeo.attributes.position;
 for(let i=0;i<lp.count;i++){const x=lp.getX(i),y=lp.getY(i);lp.setZ(i,.115*(1-Math.abs(x)*2)-.10*y*y+.035*Math.sin(y*5+x*4));}
 leafGeo.computeVertexNormals();
 const mesh=new T.InstancedMesh(leafGeo,leaf,leafPoints.length),o=new T.Object3D();
  const palette=(season==='autumn'?['#cfad73','#c28c50','#d9c18a','#a6a16f']:['#ced5b9','#b3c0a1','#e1e0c8','#a9b59a']).map(c=>new T.Color(c));
  leafPoints.forEach((l,i)=>{o.position.copy(l.p);o.rotation.set(l.pitch,l.yaw,l.roll);o.scale.set(l.size,l.size*.95,1);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);mesh.setColorAt(i,palette[Math.floor(r()*palette.length)]);});
  mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();mesh.castShadow=true;mesh.receiveShadow=true;mesh.name='FORMA maple curved alpha leaves R31';g.add(mesh);
 }
 g.userData.species='maple';g.userData.physicalHeight=h;g.userData.crownDiameter=d;g.userData.nativeMapleR30=true;g.userData.nativeMapleR31=true;g.userData.leafCount=season==='winter'?0:leafPoints.length;
 return g;
}
