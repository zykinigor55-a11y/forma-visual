/* FORMA R47 · Salix babylonica — native weeping willow.
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
 const tr=clamp(h*.039,.055,1.05),wood=maps(T);
 let branchCount=0,shootCount=0;
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
 const trunk=bez(V(0,-.025,0),V(-tr*.3,h*.27,tr*.15),V(tr*.55,h*.49,-tr*.4),V(-tr*.25,h*.83,tr*.35));
 tube(trunk,56,32,tr,.028,.65);
 for(let i=0;i<6;i++){const a=i*Math.PI/3+r()*.2,l=tr*(1.6+r()*.8);tube(bez(V(0,tr*.55,0),V(Math.cos(a)*l*.35,tr*.24,Math.sin(a)*l*.35),V(Math.cos(a)*l*.75,.03,Math.sin(a)*l*.75),V(Math.cos(a)*l,-.035,Math.sin(a)*l)),12,12,tr*.34,.004);}
 const polar=(a,rad,y)=>V(Math.cos(a)*rad,y,Math.sin(a)*rad);
 const limit=(q,extent=1)=>{const rr=Math.hypot(q.x,q.z);if(rr>R*extent){q.x*=R*extent/rr;q.z*=R*extent/rr;}q.y=clamp(q.y,.12,h*.995);return q;};
 function hanging(a,az,len,spread){
  const out=polar(az,spread,0),side=polar(az+Math.PI/2,spread*.45,0);
  const drop=Math.min(len,a.y-.20),end=limit(a.clone().add(out).add(side).add(V(0,-drop,0)));
  const path=bez(a,limit(a.clone().addScaledVector(out,.55).add(V(0,Math.min(h*.015,.18),0))),limit(end.clone().addScaledVector(side,-.65).add(V(0,drop*.36,0))),end);
  tube(path,mobile?15:23,mobile?5:6,clamp(h*.0009,.002,.012),.0009);shootCount++;
  if(season==='winter')return;
  // Realistic 7–13 cm leaves, alternate along physically connected shoots.
  const count=Math.max(12,Math.min(68,Math.round(a.distanceTo(end)/.072)));
  for(let j=0;j<count;j++){const t=(j+.6)/count,center=path.getPoint(t),ang=az+(j%2?1:-1)*(1.1+r()*.7),size=clamp(.075+r()*.055,.045,.13);
   const dir=polar(ang,.70,-.62).normalize(),origin=center.clone().addScaledVector(dir,.006);
   leafData.push({origin,dir,size,roll:(r()-.5)*1.6,shade:r()});
  }
 }
 for(let i=0;i<13;i++){
  const t=.30+i/12*.60,az=i*2.399+(r()-.5)*.65,base=trunk.getPoint(t),rad=R*(.55+.36*Math.sin(Math.PI*(.18+i/13*.73)));
  const top=Math.min(h*.97,base.y+h*(.25+.14*r())),end=polar(az,rad,top-h*(.08+.07*r()));
  const main=bez(base,limit(base.clone().add(polar(az,rad*.27,h*.26))),polar(az,rad*.69,top),end);
  tube(main,34,18,tr*(.39-.20*t),.018,.24);
  for(let k=0;k<7;k++){
   const f=.24+k*.105,a=main.getPoint(f),turn=az+(k%2?1:-1)*(.44+r()*.9),span=R*(.24+r()*.20)*(1-f*.33);
   const b=limit(a.clone().add(polar(turn,span,h*(.035+r()*.09))),.98);
   const secondary=bez(a,limit(a.clone().add(polar(turn,span*.33,h*.11))),limit(b.clone().add(V(0,h*.045,0))),b);
   tube(secondary,20,10,Math.max(.013,tr*.09*(1-f*.5)),.004,.12);
   for(let j=0;j<6;j++){
    const u=.12+j*.155,q=secondary.getPoint(u),theta=turn+(j%2?1:-1)*(.5+r()*1.15),span2=R*(.10+r()*.10);
    const e=limit(q.clone().add(polar(theta,span2,h*(.03+r()*.035))),.98);
    const twig=bez(q,limit(q.clone().add(polar(theta,span2*.4,h*.05))),limit(e.clone().add(V(0,h*.02,0))),e);
    tube(twig,12,7,.009,.0025);
    for(let k2=0;k2<(mobile?2:3);k2++){
     const v=twig.getPoint(.23+k2*(mobile?.62:.33)),a2=theta+(k2-1)*.9+r()*.35,drop=h*(.22+r()*.29)*( .76+.24*f);
     hanging(v,a2,drop,R*(.045+r()*.12));
    }
   }
  }
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();geo.computeBoundingSphere();
 const mat=new T.MeshStandardMaterial({color:'#dfdbcb',map:wood.bark,normalMap:wood.normal,roughnessMap:wood.rough,bumpMap:wood.normal?null:wood.bark,bumpScale:.045,roughness:.93,metalness:0,side:T.DoubleSide});wood.materials.add(mat);mat.addEventListener('dispose',()=>wood.materials.delete(mat));
 const mesh=new T.Mesh(geo,mat);mesh.name='FORMA Willow R47 curved wood';mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);
 if(leafData.length){
  const leafGeo=new T.PlaneGeometry(1,1,mobile?1:2,mobile?2:4),lp=leafGeo.attributes.position;for(let i=0;i<lp.count;i++){const x=lp.getX(i),y=lp.getY(i);lp.setZ(i,.13*(1-Math.abs(x)*2)-.13*y*y+.06*y*x);}
  leafGeo.computeVertexNormals();
  const lm=new T.MeshStandardMaterial({map:wood.leaf,color:'#dedfca',side:T.DoubleSide,alphaTest:.34,roughness:.82,metalness:0,emissive:'#889b66',emissiveIntensity:.035});
  const leaves=new T.InstancedMesh(leafGeo,lm,leafData.length),tmp=new T.Object3D(),Y=V(0,1,0);
  const palette=(season==='autumn'?['#c6ad6c','#b4a270','#d2bd80']:['#c4ccae','#aebda0','#d0d3b9','#b5c2a2']).map(c=>new T.Color(c));
  leafData.forEach((l,i)=>{tmp.position.copy(l.origin).addScaledVector(l.dir,l.size*.43);tmp.quaternion.setFromUnitVectors(Y,l.dir);tmp.rotateY(l.roll);tmp.scale.set(l.size*.20,l.size,l.size*.20);tmp.updateMatrix();leaves.setMatrixAt(i,tmp.matrix);leaves.setColorAt(i,palette[Math.min(palette.length-1,Math.floor(l.shade*palette.length))]);});leaves.instanceMatrix.needsUpdate=true;leaves.instanceColor.needsUpdate=true;leaves.computeBoundingSphere();leaves.castShadow=true;leaves.receiveShadow=true;leaves.name='FORMA Willow R47 individual lanceolate leaves';g.add(leaves);
 }
 g.userData.nativeWillowR47=true;g.userData.species='willow';g.userData.physicalHeight=h;g.userData.crownDiameter=d;g.userData.trunkDiameter=tr*2;g.userData.woodTriangles=ix.length/3;g.userData.leafCount=leafData.length;g.userData.branchCount=branchCount;g.userData.hangingShoots=shootCount;
 return g;
}
