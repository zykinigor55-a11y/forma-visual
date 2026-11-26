import {willowProfile} from './forma-landscape-willow-growth.js?v=R50';
/* FORMA R51 · Salix babylonica — native weeping willow.
 * Bark: Poly Haven Bark Willow 02, CC0, https://polyhaven.com/a/bark_willow_02
 * Leaf scan: NobbiP, Trauerweide Salix sp top 09.jpg, CC BY-SA 3.0.
 * https://commons.wikimedia.org/wiki/File:Trauerweide_Salix_sp_top_09.jpg
 * https://creativecommons.org/licenses/by-sa/3.0/ — derived leaf alpha/grade
 * remains CC BY-SA 3.0. Species of scan is Salix sp., not certified cultivar.
 */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function rng(s){let n=2166136261;for(const c of String(s))n=Math.imul(n^c.charCodeAt(0),16777619);return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}}
const caches=new WeakMap();
function maps(T){
 if(caches.has(T))return caches.get(T);
 const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d'),r=rng('willow bark R47');
 x.fillStyle='#827a66';x.fillRect(0,0,512,512);
 for(let j=0;j<1150;j++){const a=r()*512,b=r()*512,l=15+r()*125;x.strokeStyle=j%3?'rgba(49,44,35,.22)':'rgba(182,173,150,.22)';x.lineWidth=.6+r()*4;x.beginPath();x.moveTo(a,b);x.bezierCurveTo(a+(r()-.5)*12,b+l*.33,a+(r()-.5)*10,b+l*.67,a+(r()-.5)*8,b+l);x.stroke();}
 const bark=new T.CanvasTexture(c);bark.colorSpace=T.SRGBColorSpace;bark.wrapS=bark.wrapT=T.RepeatWrapping;bark.anisotropy=8;bark.userData.source='procedural fallback';
 const leafCanvas=document.createElement('canvas');leafCanvas.width=128;leafCanvas.height=512;const l=leafCanvas.getContext('2d');
 const grad=l.createLinearGradient(0,0,128,512);grad.addColorStop(0,'#a4ab74');grad.addColorStop(.45,'#738651');grad.addColorStop(1,'#60734a');l.fillStyle=grad;
 l.beginPath();l.moveTo(64,8);l.bezierCurveTo(124,160,126,345,64,488);l.bezierCurveTo(15,350,10,170,64,8);l.fill();l.strokeStyle='#b4b98a';l.lineWidth=2;l.beginPath();l.moveTo(64,20);l.lineTo(64,503);l.stroke();
 for(let j=0;j<16;j++){const y=55+j*24;l.strokeStyle='rgba(188,198,141,.35)';for(const sign of [-1,1]){l.beginPath();l.moveTo(64,y+15);l.quadraticCurveTo(64+sign*19,y+2,64+sign*40*Math.sin(Math.PI*y/512),y-22);l.stroke();}}
 const leaf=new T.CanvasTexture(leafCanvas);leaf.colorSpace=T.SRGBColorSpace;leaf.anisotropy=4;leaf.userData.source='native narrow leaf mask';
 const result={bark,leaf,normal:null,rough:null,materials:new Set()};caches.set(T,result);
 const notify=()=>window.dispatchEvent(new Event('forma-foliage-texture-ready'));
 const loader=new T.TextureLoader().setCrossOrigin('anonymous');
 const base='https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/bark_willow_02/bark_willow_02_';
 for(const [suffix,slot] of [['diff','bark'],['nor_gl','normal'],['rough','rough']]){
  loader.load(base+suffix+'_1k.jpg',t=>{t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;if(slot==='bark')t.colorSpace=T.SRGBColorSpace;t.userData.source='Poly Haven Bark Willow 02 · '+suffix;result[slot]=t;for(const m of result.materials){m.map=result.bark;m.normalMap=result.normal;m.roughnessMap=result.rough;m.bumpMap=result.normal?null:result.bark;m.needsUpdate=true;}notify();},undefined,()=>{});
 }
 const img=new Image();img.crossOrigin='anonymous';img.decoding='async';
 img.onload=()=>{try{
  const temp=document.createElement('canvas');temp.width=1024;temp.height=Math.max(1,Math.round(1024*img.height/img.width));const ctx=temp.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,temp.width,temp.height);
  const p=ctx.getImageData(0,0,temp.width,temp.height),a=p.data;let minX=temp.width,maxX=0,minY=temp.height,maxY=0;
  for(let y=0;y<temp.height;y++)for(let z=0;z<temp.width;z++){const i=(y*temp.width+z)*4,m=Math.max(a[i],a[i+1],a[i+2]);const alpha=clamp((m-17)/32,0,1);a[i+3]=Math.round(alpha*255);if(alpha>.8){minX=Math.min(minX,z);maxX=Math.max(maxX,z);minY=Math.min(minY,y);maxY=Math.max(maxY,y);const lum=.21*a[i]+.72*a[i+1]+.07*a[i+2];for(let k=0;k<3;k++)a[i+k]=clamp(lum+(a[i+k]-lum)*.68,0,255);}}
  if(maxX-minX<100||maxY-minY<10||(maxX-minX)/(maxY-minY)<3)return;
  ctx.putImageData(p,0,0);l.clearRect(0,0,128,512);l.save();l.translate(64,256);l.rotate(Math.PI/2);l.drawImage(temp,minX,minY,maxX-minX+1,maxY-minY+1,-248,-57,496,114);l.restore();leaf.needsUpdate=true;leaf.userData.source='NobbiP willow leaf scan · modified alpha CC BY-SA 3.0';notify();
 }catch(e){console.warn('Willow leaf photo fallback',e);}};
 img.src='https://upload.wikimedia.org/wikipedia/commons/b/b4/Trauerweide_Salix_sp_top_09.jpg';
 return result;
}
export function createNaturalWillow(T,o,{season='summer'}={}){
 const h=clamp(Number(o.height)||11,.5,40),d=clamp(Number(o.diameter)||9,.5,30),R=d/2,mobile=typeof window!=='undefined'&&window.innerWidth<=850;
 const r=rng('willow|'+o.id+'|'+o.variant),g=new T.Group(),V=(x,y,z)=>new T.Vector3(x,y,z),p=[],uv=[],ix=[],leafData=[];
 const growth=willowProfile(o.willow),tr=clamp(h*growth.trunk,.055,1.25),wood=maps(T),maturity=clamp((growth.age-10)/65,0,1);
 let branchCount=0,shootCount=0;const foliageRng=rng('willow R48 foliage|'+o.id+'|'+o.variant);
 function tube(curve,n,sides,base,tip,flare=0){
  const pts=curve.getPoints(n),first=p.length/3;let U=null,dist=0;const phase=r()*6.283;
  for(let i=0;i<=n;i++){
   const t=i/n,a=pts[i],axis=pts[Math.min(n,i+1)].clone().sub(pts[Math.max(0,i-1)]).normalize(),ref=Math.abs(axis.y)>.93?V(1,0,0):V(0,1,0);
   U=U?U.clone().addScaledVector(axis,-U.dot(axis)):V(0,0,0).crossVectors(axis,ref);if(U.lengthSq()<1e-9)U.crossVectors(axis,ref);U.normalize();const B=V(0,0,0).crossVectors(axis,U).normalize();
   if(i)dist+=a.distanceTo(pts[i-1]);const radius=tip+(base-tip)*Math.pow(1-t,1.25);
   for(let j=0;j<=sides;j++){const ang=j/sides*Math.PI*2,irr=1+.045*Math.sin(ang*5+phase+t*3)+flare*Math.exp(-t*22)*(.85+.15*Math.sin(ang*3));const q=a.clone().addScaledVector(U,radius*irr*Math.cos(ang)).addScaledVector(B,radius*irr*Math.sin(ang));p.push(q.x,q.y,q.z);uv.push(j/sides*Math.max(.025,base*6.283/.9),dist/.9);if(i&&j<sides){const k=first+(i-1)*(sides+1)+j,l=k+sides+1;ix.push(k,k+1,l,k+1,l+1,l);}}
  }branchCount++;return curve;
 }
 const bez=(a,b,c,d)=>new T.CubicBezierCurve3(a,b,c,d);
 const lean=tr*(.5+.65*maturity),trunk=new T.CatmullRomCurve3([V(0,-.025,0),V(-lean*.20,h*.15,tr*.10),V(lean*.33,h*.31,-tr*.18),V(lean*.57,h*.49,-tr*.36),V(-lean*.13,h*.68,tr*.32),V(-lean*.38,h*.88,tr*.25)],false,'centripetal');
 tube(trunk,76,40,tr,.018,.45+.32*maturity);
 for(let i=0;i<6;i++){const a=i*Math.PI/3+r()*.2,l=tr*(1.6+r()*.8);tube(bez(V(0,tr*.55,0),V(Math.cos(a)*l*.35,tr*.24,Math.sin(a)*l*.35),V(Math.cos(a)*l*.75,.03,Math.sin(a)*l*.75),V(Math.cos(a)*l,-.035,Math.sin(a)*l)),12,12,tr*.34,.004);}
 const polar=(a,rad,y)=>V(Math.cos(a)*rad,y,Math.sin(a)*rad);
 // Rounded irregular dome; smoothly compress overshoot, never collect tips on a flat clipping plane.
 const limit=(q,extent=1)=>{
  const az=Math.atan2(q.z,q.x),rr=Math.hypot(q.x,q.z);
  const radial=R*extent*(1.00+.075*Math.sin(az*3+.7)+.045*Math.cos(az*5+1.2));
  const knee=radial*.81;
  if(rr>knee){const target=knee+(radial-knee)*(1-Math.exp(-(rr-knee)/(radial-knee)));q.x*=target/rr;q.z*=target/rr;}
  const rho=Math.hypot(q.x,q.z)/R;
  const ceiling=h*(1.02-.23*Math.pow(rho,1.8)+.032*Math.sin(az*3+rho*4));
  const start=ceiling-h*.075;
  if(q.y>start)q.y=start+(ceiling-start)*(1-Math.exp(-(q.y-start)/(ceiling-start)));
  q.y=Math.max(.10,q.y);return q;
 };
 function hanging(a,az,len,spread){
  const out=polar(az,spread,0),side=polar(az+Math.PI/2,spread*.45,0);
  const clearance=h*(.065+.13*r()+(1-maturity)*.035),drop=Math.max(.08,Math.min(len,a.y-clearance)),end=limit(a.clone().add(out).addScaledVector(side,.35+r()*.55).add(V(0,-drop,0)));
  const path=new T.CatmullRomCurve3([a,limit(a.clone().addScaledVector(out,.36).add(V(0,Math.min(h*.016,.19),0))),limit(a.clone().lerp(end,.24).addScaledVector(side,.48+r()*.34)),limit(a.clone().lerp(end,.55).addScaledVector(side,-.22-r()*.32)),limit(a.clone().lerp(end,.82).addScaledVector(side,.16)),end],false,'centripetal');
  tube(path,mobile?14:22,mobile?4:5,clamp(h*.00037,.0015,.0055),.00038);shootCount++;
  if(season==='winter')return;
  // Realistic 7–13 cm leaves, alternate along physically connected shoots.
  const count=Math.max(12,Math.min(mobile?96:168,Math.round(path.getLength()/(mobile?.046:.030))));
  for(let j=0;j<count;j++){const t=clamp((j+.6+.26*Math.sin(j*.81))/count,.005,.995),center=path.getPoint(t),ang=az+(j%2?1:-1)*(1.05+foliageRng()*.95)+.35*Math.sin(j*.7),size=1.20*clamp(.072+foliageRng()*.073,.055,.15);
   const dir=polar(ang,.45+foliageRng()*.45,-.48-foliageRng()*.73).normalize(),origin=center.clone().addScaledVector(dir,.004);
   leafData.push({origin,dir,size,roll:(foliageRng()-.5)*2.1,shade:foliageRng()});
  }
 }
 for(let i=0;i<growth.limbs;i++){
  const u=i/Math.max(1,growth.limbs-1),t=clamp(.19+u*.66+(r()-.5)*.09,.16,.88),az=i*2.399+(r()-.5)*1.05,base=trunk.getPoint(t),rad=R*(.48+.51*Math.sin(Math.PI*(.12+u*.75)))*(.82+r()*.28);
  const top=Math.min(h*(.94+.045*r()),Math.max(base.y+h*.18,h*(.62+.33*u+(r()-.5)*.12))),end=limit(polar(az,rad,top-h*(.06+.10*r())));
  const main=bez(base,limit(base.clone().add(polar(az,rad*(.17+.11*r()),(top-base.y)*.78))),limit(polar(az+.22*Math.sin(i*2.1),rad*.67,top+h*.025)),end);
  tube(main,46,22,tr*(.42-.27*t)*(i<3?1.16:.92),.009,.28);
  const secondaries=mobile?6:8;
  for(let k=0;k<secondaries;k++){
   const f=.22+k*.73/Math.max(1,secondaries-1),a=main.getPoint(f),turn=az+(k%2?1:-1)*(.48+r()*1.08),span=R*(.16+r()*.22)*(1-f*.27);
   const b=limit(a.clone().add(polar(turn,span,h*(-.025+r()*.14))),.99);
   const secondary=bez(a,limit(a.clone().add(polar(turn,span*.33,h*.11))),limit(b.clone().add(V(0,h*.045,0))),b);
   tube(secondary,27,14,Math.max(.013,tr*.09*(1-f*.5)),.0035,.18);
   for(let j=0;j<(mobile?5:7);j++){
    const u=.10+j*.84/(mobile?4:6),q=secondary.getPoint(u),theta=turn+(j%2?1:-1)*(.38+r()*1.30),span2=R*(.065+r()*.115);
    const e=limit(q.clone().add(polar(theta,span2,h*(-.018+r()*.067))),.99);
    const twig=bez(q,limit(q.clone().add(polar(theta,span2*.4,h*.05))),limit(e.clone().add(V(0,h*.02,0))),e);
    tube(twig,16,8,.008,.0018);
    for(let k2=0;k2<(mobile?2:3);k2++){
     const v=twig.getPoint(.18+k2*(mobile?.76:.40)),a2=theta+(k2-1)*.85+r()*.55,outer=clamp(Math.hypot(v.x,v.z)/R,0,1),curtain=.55+.45*outer,drop=h*growth.drop*(.24+r()*.96)*(.65+.35*f)*curtain*(.78+.22*Math.sin(i*1.7+k*.85));
     hanging(v,a2,drop,R*(.035+r()*.12));
    }
   }
  }
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();geo.computeBoundingSphere();
 const mat=new T.MeshStandardMaterial({color:'#dfdbcb',map:wood.bark,normalMap:wood.normal,normalScale:new T.Vector2(1.2,1.2),roughnessMap:wood.rough,bumpMap:wood.normal?null:wood.bark,bumpScale:.032,roughness:.93,metalness:0,side:T.DoubleSide});wood.materials.add(mat);mat.addEventListener('dispose',()=>wood.materials.delete(mat));
 const mesh=new T.Mesh(geo,mat);mesh.name='FORMA Willow R51 curved wood';mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);
 if(leafData.length){
  const leafGeo=new T.PlaneGeometry(1,1,mobile?1:2,mobile?2:4),lp=leafGeo.attributes.position;for(let i=0;i<lp.count;i++){const x=lp.getX(i),y=lp.getY(i);lp.setZ(i,.13*(1-Math.abs(x)*2)-.13*y*y+.06*y*x);}
  leafGeo.computeVertexNormals();
  const lm=new T.MeshStandardMaterial({map:wood.leaf,color:'#f2f2e8',side:T.DoubleSide,alphaTest:.28,roughness:.82,metalness:0,emissive:'#9ca78a',emissiveIntensity:.065});
  const leaves=new T.InstancedMesh(leafGeo,lm,leafData.length),tmp=new T.Object3D(),Y=V(0,1,0);
  const palette=(season==='autumn'?['#c6ad6c','#b4a270','#d2bd80']:['#d9dec9','#bdcbb1','#e0e2d0','#d0d9c4']).map(c=>new T.Color(c));
  leafData.forEach((l,i)=>{tmp.position.copy(l.origin).addScaledVector(l.dir,l.size*.43);tmp.quaternion.setFromUnitVectors(Y,l.dir);tmp.rotateY(l.roll);tmp.scale.set(l.size*(.21+.04*l.shade),l.size,l.size*.24);tmp.updateMatrix();leaves.setMatrixAt(i,tmp.matrix);leaves.setColorAt(i,palette[Math.min(palette.length-1,Math.floor(l.shade*palette.length))]);});leaves.instanceMatrix.needsUpdate=true;leaves.instanceColor.needsUpdate=true;leaves.computeBoundingSphere();leaves.castShadow=true;leaves.receiveShadow=true;leaves.name='FORMA Willow R51 individual lanceolate leaves';g.add(leaves);
 }
 g.userData.nativeWillowR47=true;g.userData.nativeWillowR48=true;g.userData.nativeWillowR49=true;g.userData.nativeWillowR50=true;g.userData.nativeWillowR51=true;g.userData.willowAge=growth.age;g.userData.species='willow';g.userData.physicalHeight=h;g.userData.crownDiameter=d;g.userData.trunkDiameter=tr*2;g.userData.woodTriangles=ix.length/3;g.userData.leafCount=leafData.length;g.userData.branchCount=branchCount;g.userData.hangingShoots=shootCount;
 return g;
}
