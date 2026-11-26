/* FORMA R30 maple: a continuous textured trunk, tapered forks and individually
 * oriented leaf masks, no reliance on the old low-poly catalogue GLB. */
import {mapleLeafMask} from './forma-landscape-3d-photo-foliage.js?v=R34';
import {fuseWood} from './forma-landscape-3d-wood-union.js?v=R38';
import {mapleProfile} from './forma-landscape-maple-growth.js?v=R39';
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
 map.userData.formaBarkSource='procedural fallback';
 const result={map,bump,photoBump:null,normal:null,materials:new Set()};barkCache.set(T,result);
 const base='https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/trident_maple_bark/trident_maple_bark_';
 const local=new URL('./assets/landscape-photo/maple-r33/',import.meta.url).href;
 const loader=new T.TextureLoader().setCrossOrigin('anonymous');
 for(const [channel,slot] of [['diff','map'],['nor_gl','normal'],['rough','roughness']]){
 const apply=t=>{
  t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;
  const w=t.image?.width||1,h=t.image?.height||1;t.repeat.y=w/h;
  if(slot==='map'){
   t.colorSpace=T.SRGBColorSpace;t.userData.formaBarkSource='Poly Haven · Trident Maple Bark';
   // Grade the actual photograph, keeping its natural cracks, mottling and knots.
   try{
    const c=document.createElement('canvas');c.width=t.image.width;c.height=t.image.height;
    const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(t.image,0,0);
    const p=x.getImageData(0,0,c.width,c.height),a=p.data;
    const relief=x.createImageData(c.width,c.height);
    const lum=new Float32Array(c.width*c.height);
    for(let i=0,k=0;i<a.length;i+=4,k++)lum[k]=a[i]*.2126+a[i+1]*.7152+a[i+2]*.0722;
    const W=c.width,H=c.height;
    for(let y=0;y<H;y++)for(let j=0;j<W;j++){
     const k=y*W+j,i=k*4,L=lum[k];
     const nearby=(lum[y*W+(j+4)%W]+lum[y*W+(j+W-4)%W]+lum[((y+4)%H)*W+j]+lum[((y+H-4)%H)*W+j])*.25;
     const detail=L-nearby,base=L*.99+13+detail*.32;
     for(let z=0;z<3;z++)a[i+z]=clamp(base+(a[i+z]-L)*.67+(z===2?-2:0),0,255);
     const height=clamp(128+detail*2.2+(L-90)*.28,0,255);
     relief.data[i]=relief.data[i+1]=relief.data[i+2]=height;relief.data[i+3]=255;
    }
    x.putImageData(p,0,0);
    const corrected=new T.CanvasTexture(c);corrected.colorSpace=T.SRGBColorSpace;corrected.wrapS=corrected.wrapT=T.RepeatWrapping;corrected.anisotropy=8;corrected.repeat.copy(t.repeat);corrected.userData.formaBarkSource='Poly Haven · Trident Maple Bark · R37 photo grade';
    const rc=document.createElement('canvas');rc.width=W;rc.height=H;rc.getContext('2d').putImageData(relief,0,0);
    const rb=new T.CanvasTexture(rc);rb.wrapS=rb.wrapT=T.RepeatWrapping;rb.anisotropy=8;rb.repeat.copy(t.repeat);result.photoBump=rb;
    t.dispose();t=corrected;
   }catch(error){console.warn('FORMA bark photo grade',error);}
  }
  result[slot]=t;
  for(const m of result.materials){m.map=result.map;m.bumpMap=result.normal?null:(result.photoBump||result.bump);m.normalMap=result.normal;m.roughnessMap=result.roughness||null;m.normalScale.set(1.35,1.35);m.needsUpdate=true;}
  window.dispatchEvent(new Event('forma-foliage-texture-ready'));
 };
 loader.load(local+channel+'.jpg?v=R36',apply,undefined,()=>loader.load(base+channel+'_1k.jpg',apply,undefined,()=>{}));
 }
 return result;
}
export function createNaturalMaple(T,instance,{season='summer'}={}){
 const h=clamp(Number(instance.height)||13,.25,40),d=clamp(Number(instance.diameter)||8,.2,30),rad=d*.5;
 const r=random('maple|'+instance.id+'|'+instance.variant),g=new T.Group(),V=(x,y,z)=>new T.Vector3(x,y,z);
 const pos=[],uv=[],idx=[],leafPoints=[],seamPairs=[],woodColors=[],junctionNormals=[];
 const leafRng=random('maple foliage detail R32|'+instance.id+'|'+instance.variant);
 const bendRng=random('maple branch curvature R33|'+instance.id+'|'+instance.variant);
 const crownRng=random('maple spatial crown R35|'+instance.id+'|'+instance.variant);
 const growth=mapleProfile(instance.maple),trunkR=clamp(h*growth.trunk,.035,1.30),mobile=window.innerWidth<=850;
 const fusionStep=Math.max(.007,trunkR*(mobile?.17:.135)),fusionPaths=[],replacedRanges=[];
 function tube(points,radii,sides,seed,collar=0,parentAxis=null){
  let first=pos.length/3,dist=0,prevU=null;const phase=seed*6.283;
  const indexStart=idx.length;
  let fuseEnd=0;
  for(let i=0;i<points.length;i++){
   const p=points[i],axis=points[Math.min(i+1,points.length-1)].clone().sub(points[Math.max(0,i-1)]).normalize();
   // Transport the frame along the curve: no sudden ring rotation when a limb bends past vertical.
   const ref=Math.abs(axis.y)>.93?V(1,0,0):V(0,1,0);
   let u=prevU?prevU.clone().addScaledVector(axis,-prevU.dot(axis)):new T.Vector3().crossVectors(axis,ref);
   if(u.lengthSq()<1e-8)u.crossVectors(axis,ref);u.normalize();
   const v=new T.Vector3().crossVectors(axis,u).normalize();prevU=u.clone();
   seamPairs.push([first+i*(sides+1),first+i*(sides+1)+sides]);
   if(i)dist+=p.distanceTo(points[i-1]);
   const R=radii[i];
   for(let j=0;j<=sides;j++){
    const a=j*Math.PI*2/sides,t=i/Math.max(1,points.length-1);
    const flare=collar*Math.exp(-t*13)*(.8+.2*Math.cos(a+phase));
    const ridges=R>.035?.045*Math.sin(a*13+phase+t*8):.015*Math.sin(a*7+phase);
    const knot=R>.025?.045*Math.sin(a*4+phase+t*17)*Math.sin(t*Math.PI)**2:0;
    const irregular=1+flare+.092*Math.sin(a*3+phase+t*5.2)+.045*Math.cos(a*7-phase+t*3.6)+ridges+knot;
    const q=p.clone().addScaledVector(u,Math.cos(a)*R*irregular).addScaledVector(v,Math.sin(a)*R*irregular);
    const vi=pos.length/3;
    pos.push(q.x,q.y,q.z);uv.push(seed*.8+j/sides*Math.max(.045,radii[0]*Math.PI*2/1.8),seed*.9+dist/1.8);
    const shade=clamp(.92+.07*Math.sin(a*3+phase+t*5)+.05*Math.cos(t*11+phase)+.035*Math.sin(a*7-t*9),.82,1.07);
    woodColors.push(shade,shade,shade);
    // Blend shading into the supporting limb near the base. The collar still
    // overlaps the parent mesh, but the normals avoid a hard cylindrical seam.
    if(parentAxis&&collar>=.30&&t<.16){
      const parentRadial=q.clone().sub(points[0]);parentRadial.addScaledVector(parentAxis,-parentRadial.dot(parentAxis));
      if(parentRadial.lengthSq()>1e-8)junctionNormals.push({i:vi,n:parentRadial.normalize(),w:.62*(1-t/.16)**2});
    }
    if(i&&j<sides){const k=first+(i-1)*(sides+1)+j,l=k+sides+1;idx.push(k,k+1,l,k+1,l+1,l);}
   }
  }
  // Only fuse sufficiently thick woody limbs. Keep detailed distal tubes and
  // fine twigs, overlapping the taper below the visible fork.
  if(sides>=12&&radii[0]>=fusionStep*1.6){
   for(let i=1;i<points.length;i++){if(radii[i]<fusionStep*1.05)break;fuseEnd=i;}
   if(fuseEnd>=3){
    const fp=points.slice(0,fuseEnd+1),fr=radii.slice(0,fuseEnd+1).map((R,i)=>R*(1+collar*.65*Math.exp(-i/Math.max(1,points.length-1)*13)));
    // A brief narrowing extension inside the original distal tube hides the cap.
    if(fuseEnd+1<points.length){fp.push(points[fuseEnd+1]);fr.push(Math.max(fusionStep*.45,radii[fuseEnd+1]*.7));}
    fusionPaths.push({points:fp,radii:fr,seed});
    replacedRanges.push([indexStart,indexStart+Math.max(1,fuseEnd-1)*sides*6]);
   }
  }
 }
 const trunk=[];
 for(let i=0;i<=20;i++){const t=i/20;trunk.push(V(h*.029*growth.curve*Math.sin(t*5.7)*t,h*t*.96,h*.021*growth.curve*Math.sin(t*8.1)*t));}
 const trunkSmooth=new T.CatmullRomCurve3(trunk,false,'centripetal').getPoints(60);
 const trunkRadiusAt=t=>trunkR*(Math.max(.045,Math.pow(1-t*20/21,1.36))+.50*Math.exp(-t*37));
 tube(trunkSmooth,trunkSmooth.map((_,i)=>trunkRadiusAt(i/60)),32,r());
 // Low, shallow, embedded root flares, rather than triangular feet.
 for(let i=0;i<6;i++){const a=i*1.047+r()*.3,l=trunkR*(1.45+r()*.8);
  tube(new T.QuadraticBezierCurve3(V(0,trunkR*.75,0),V(Math.cos(a)*l*.45,trunkR*.10,Math.sin(a)*l*.45),V(Math.cos(a)*l,-trunkR*.08,Math.sin(a)*l)).getPoints(8),Array.from({length:9},(_,k)=>Math.max(.006,trunkR*.38*Math.pow(1-k/8,1.3))),12,r());
 }
 function curve(a,b,width,bend,sides=8,parentAxis=null){
  const delta=b.clone().sub(a),length=a.distanceTo(b),side=V(-delta.z,0,delta.x).normalize();
  const sign=bendRng()<.5?-1:1,bulge=length*(sides>=12?.23:sides>=8?.17:.10)*sign*growth.curve;
  const direction=delta.clone().normalize();
  const growthDirection=parentAxis?parentAxis.clone().multiplyScalar(.46).addScaledVector(direction,.70).normalize():direction.clone();
  const c1=a.clone().addScaledVector(growthDirection,length*.30).addScaledVector(side,bulge*.60);
  const c2=a.clone().lerp(b,.71).addScaledVector(side,-bulge*.57);
  c1.y+=bend*.35;c2.y+=bend*.35+length*.065;
  const bezier=new T.CubicBezierCurve3(a,c1,c2,b);
  // Additional smoothly varying deviation, zero at the junctions and tips.
  const nodes=bezier.getPoints(sides>=12?9:sides>=8?6:3);
  for(let i=1;i<nodes.length-1;i++){const t=i/(nodes.length-1),env=Math.sin(Math.PI*t)**2;
   nodes[i].addScaledVector(side,Math.sin(t*8.7+sign)*length*.043*env);
   nodes[i].y+=Math.sin(t*7.2+sign*.7)*length*.032*env;
  }
  const curve=new T.CatmullRomCurve3(nodes,false,'centripetal');
  const pts=curve.getPoints(sides>=12?36:sides>=8?20:mobile?5:8);
  tube(pts,pts.map((_,i)=>width*Math.max(.025,Math.pow(1-i/(pts.length-1),.95))),sides>=12?24:sides>=8?14:mobile?5:7,r(),parentAxis?(sides>=12?.63:sides>=8?.39:.14):0,parentAxis);
  return curve;
 }
 function leafyTwig(a,b,width,count=mobile?7:10,existing=null){
  const q=existing||curve(a,b,width,h*.002,5);
  for(let j=0;j<count;j++){
   const t=(j+.5)/count,p=q.getPoint(t),axis=q.getTangent(t),side=new T.Vector3().crossVectors(axis,V(0,1,0)).normalize();
   for(const sign of [-1,1]){
    const reach=clamp(h*.009,.035,.115)*(.6+r()*.75);
    const leaf=p.clone().addScaledVector(side,sign*reach).add(V(0,(r()-.4)*reach,0));
    const mainLeaf={p:leaf,yaw:r()*6.283,pitch:(r()-.5)*2.15,roll:(r()-.5)*2.65,size:clamp(h*.012,.07,.185)*(.67+r()*.65)};
    leafPoints.push(mainLeaf);
    // Independent deterministic stream: the actual R31 woody skeleton remains
    // identical. Extra leaves are attached beside the existing twig, not a sphere.
    if(leafRng()<Math.min(.65,.36*growth.leafDensity)){
     const offset=reach*(.55+leafRng()*.45),q2=p.clone().addScaledVector(axis,(leafRng()-.5)*.06).addScaledVector(side,sign*offset);
     q2.y+=(leafRng()-.35)*reach*.8;
     const radius=Math.hypot(q2.x,q2.z);if(radius>rad){q2.x*=rad/radius;q2.z*=rad/radius;}q2.y=Math.min(h,q2.y);
     leafPoints.push({p:q2,yaw:mainLeaf.yaw+(leafRng()-.5)*2.4,pitch:(leafRng()-.5)*2,roll:(leafRng()-.5)*2.8,size:mainLeaf.size*(.58+leafRng()*.25)});
    }
   }
  }
 }
 // Branches follow a rounded, asymmetrical deciduous crown: lower limbs spread
 // outwards, upper forks rise. No horizontal conifer whorls or leaf spheres.
 for(let i=0;i<growth.branches;i++){
  const t=i/Math.max(1,growth.branches-1),az=i*2.399+(r()-.5)*.85,y=h*((.28-(growth.spread-1)*.10)+t*.53+(r()-.5)*.032);
  const base=trunk[Math.min(20,Math.round(y/(h*.96)*20))].clone();
  const len=rad*(.49+.48*Math.sin(Math.PI*(.20+t*.70)))*(.83+r()*.17);
  const tip=V(Math.cos(az)*len,Math.min(h*.95,y+h*(.055+.125*r())/growth.spread),Math.sin(az)*len);
  const main=curve(base,tip,trunkR*(.38-.17*t),-h*.013,14,V(0,1,0));
  const forks=Math.max(4,Math.round((7+Math.floor(r()*5))*Math.sqrt(growth.leafDensity)));
  for(let k=0;k<forks;k++){
   const f=.26+(k+.5)/forks*.70,p=main.getPoint(f),side=k%2?1:-1,a=az+side*(.42+r()*.95);
   const span=rad*(.22+.19*r())*(1-f*.38)*growth.spread;
   const lift=h*(.025+.085*crownRng())*(crownRng()<.19?-.55:1);
   let end=p.clone().add(V(Math.cos(a)*span,lift,Math.sin(a)*span));
   const limit=rad*(.97-.12*t),rr=Math.hypot(end.x,end.z);if(rr>limit){end.x*=limit/rr;end.z*=limit/rr;}end.y=Math.min(h*.985,end.y);
   const secondary=curve(p,end,trunkR*.10*(1-f*.5),h*.005,8,main.getTangent(f));
   // A third order of branching fills three-dimensional crown lobes,
   // instead of laying all leaves along six narrow, ascending stripes.
   const constrain=p=>{const radius=Math.hypot(p.x,p.z);if(radius>rad*.97){p.x*=rad*.97/radius;p.z*=rad*.97/radius;}p.y=clamp(p.y,h*.25,h*.985);return p;};
   for(let j=0;j<5;j++){
    const q=secondary.getPoint(.18+(j+.5)*.155),angle=a+(j%2?1:-1)*(.52+r()*.95),span=clamp(rad*.14,.14,.78)*(.75+r()*.5);
    const lift=h*(.008+crownRng()*.027)*(crownRng()<.31?-1:1);
    const e=constrain(q.clone().add(V(Math.cos(angle)*span,lift,Math.sin(angle)*span)));
    const shoot=curve(q,e,Math.max(.002,trunkR*.023),h*.004,5,secondary.getTangent(.18+(j+.5)*.155));
    for(let k2=0;k2<2;k2++){
     const v=shoot.getPoint(.38+k2*.48),turn=angle+(k2?1:-1)*(.48+crownRng()*.86),L=span*(.41+crownRng()*.32);
     const finish=constrain(v.clone().add(V(Math.cos(turn)*L,h*(crownRng()-.36)*.035,Math.sin(turn)*L)));
     leafyTwig(v,finish,Math.max(.0013,trunkR*.012),Math.max(3,Math.round((mobile?5:7)*growth.leafDensity)));
    }
    // Terminal cluster continues the supporting branch rather than floating.
    leafyTwig(q,e,Math.max(.0012,trunkR*.009),Math.max(2,Math.round((mobile?3:4)*growth.leafDensity)),shoot);
   }
  }
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setAttribute('color',new T.Float32BufferAttribute(woodColors,3));geo.setIndex(idx);geo.computeVertexNormals();
 const normals=geo.attributes.normal;
 for(const j of junctionNormals){const n=V(normals.getX(j.i),normals.getY(j.i),normals.getZ(j.i)).lerp(j.n,j.w).normalize();normals.setXYZ(j.i,n.x,n.y,n.z);}
 for(const [a,b] of seamPairs){const n=V(normals.getX(a)+normals.getX(b),normals.getY(a)+normals.getY(b),normals.getZ(a)+normals.getZ(b)).normalize();normals.setXYZ(a,n.x,n.y,n.z);normals.setXYZ(b,n.x,n.y,n.z);}normals.needsUpdate=true;geo.computeBoundingSphere();
 let union=null;try{union=fuseWood(T,fusionPaths,fusionStep);}catch(error){console.warn('FORMA R38 wood union fallback',error);}
 if(union){const remaining=[];let cursor=0;for(const [a,b] of replacedRanges){for(let i=cursor;i<a;i++)remaining.push(idx[i]);cursor=b;}for(let i=cursor;i<idx.length;i++)remaining.push(idx[i]);geo.setIndex(remaining);}
 const maps=barkMaps(T),bark=new T.MeshStandardMaterial({vertexColors:true,map:maps.map,bumpMap:maps.normal?null:(maps.photoBump||maps.bump),normalMap:maps.normal,roughnessMap:maps.roughness||null,bumpScale:.019,normalScale:new T.Vector2(1.35,1.35),roughness:.91,metalness:0,envMapIntensity:.34});
 maps.materials.add(bark);bark.addEventListener('dispose',()=>maps.materials.delete(bark));
 const stem=new T.Mesh(geo,bark);stem.castShadow=true;stem.receiveShadow=true;stem.name='FORMA maple continuous textured forks';g.add(stem);
 if(union){const fused=new T.Mesh(union,bark.clone());maps.materials.add(fused.material);fused.material.addEventListener('dispose',()=>maps.materials.delete(fused.material));fused.castShadow=true;fused.receiveShadow=true;fused.name='FORMA R38 fused woody skeleton';g.add(fused);}
 if(season!=='winter'&&leafPoints.length){
  const mask=mapleLeafMask(T);
  // Restrained diffuse fill approximates scattered light through thin leaves.
  // Stock PBR material avoids mobile custom shader incompatibilities.
  const leaf=new T.MeshStandardMaterial({map:mask,emissiveMap:mask,emissive:season==='autumn'?'#e6d0a3':'#d3e5c5',emissiveIntensity:.043,alphaTest:.29,side:T.DoubleSide,roughness:.81,metalness:0,depthWrite:true,envMapIntensity:.34});
  // A folded leaf surface with UVs, not a perfectly flat billboard.
 const leafGeo=new T.PlaneGeometry(1,1,mobile?1:2,mobile?2:3),lp=leafGeo.attributes.position;
 for(let i=0;i<lp.count;i++){const x=lp.getX(i),y=lp.getY(i);lp.setZ(i,.10*(1-Math.abs(x)*2)-.13*y*y+.045*Math.sin(y*5+x*4));}
 leafGeo.computeVertexNormals();
 const mesh=new T.InstancedMesh(leafGeo,leaf,leafPoints.length),o=new T.Object3D();
  const palette=(season==='autumn'?['#cfad73','#c28c50','#d9c18a','#a6a16f']:['#d3d9c7','#aebca9','#e1e3ce','#b6c7b0','#c7d2ba']).map(c=>new T.Color(c));
  leafPoints.forEach((l,i)=>{o.position.copy(l.p);o.rotation.set(l.pitch,l.yaw,l.roll);o.scale.set(l.size,l.size*.95,1);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);mesh.setColorAt(i,palette[Math.floor(r()*palette.length)]);});
  mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();mesh.castShadow=true;mesh.receiveShadow=true;mesh.name='FORMA maple spatial crown R35';
 g.userData.leafTriangles=leafGeo.index.count/3*leafPoints.length;g.add(mesh);
 }
 g.userData.species='maple';g.userData.physicalHeight=h;g.userData.crownDiameter=d;g.userData.nativeMapleR30=true;g.userData.nativeMapleR31=true;g.userData.nativeMapleR32=true;g.userData.nativeMapleR33=true;g.userData.nativeMapleR34=true;g.userData.nativeMapleR35=true;g.userData.nativeMapleR36=true;g.userData.nativeMapleR37=true;g.userData.nativeMapleR38=true;g.userData.nativeMapleR39=true;g.userData.mapleAge=growth.age;g.userData.trunkDiameter=trunkR*2;g.userData.fusedWood=Boolean(union);g.userData.fusedPaths=union?fusionPaths.length:0;g.userData.woodTriangles=geo.index.count/3+(union?union.attributes.position.count/3:0);g.userData.leafCount=season==='winter'?0:leafPoints.length;
 return g;
}
