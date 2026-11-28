/* FORMA Birch R56 — native geometry, CC0 photo-derived bark material. */
export const BIRCH_STAGES=Object.freeze([
 {age:10,height:6,diameter:3.6,radius:.075,limbs:12,start:.33,droop:.55,bend:.10},
 {age:35,height:16,diameter:9,radius:.23,limbs:19,start:.30,droop:1,bend:.27},
 {age:75,height:20,diameter:13,radius:.43,limbs:24,start:.25,droop:1.2,bend:.62}
]);
export function birchStage(age){return BIRCH_STAGES.find(p=>p.age===Number(age))||BIRCH_STAGES[1];}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function random(seed){let x=2166136261;for(const c of String(seed))x=Math.imul(x^c.charCodeAt(0),16777619);return()=>((x=Math.imul(x,1664525)+1013904223>>>0)/4294967296);}
const cache=new WeakMap();
// Irregular horizontal lenticels and peeling bark; deterministic, not uniform rings.
function stripeBark(ctx,w,h){
 const r=random('birch horizontal bark r54'),sx=w/1024,sy=h/1024;
 ctx.save();ctx.scale(sx,sy);
 ctx.fillStyle='rgba(112,107,95,.13)';ctx.fillRect(0,0,1024,1024);
 for(let i=0;i<240;i++){
  const x=r()*1024,y=r()*1024,L=15+Math.pow(r(),1.5)*170,H=.6+r()*2.9;
  ctx.strokeStyle='rgba(54,51,45,'+(.25+r()*.39)+')';ctx.lineWidth=H;
  for(const offset of [-1024,0,1024]){ctx.beginPath();ctx.moveTo(x+offset,y);ctx.bezierCurveTo(x+offset+L*.27,y+(r()-.5)*3,x+offset+L*.72,y+(r()-.5)*4,x+offset+L,y+(r()-.5)*3);ctx.stroke();}
 }
 for(let i=0;i<46;i++){
  const x=r()*1024,y=r()*1024,L=60+r()*280,H=3+r()*12,shade=26+Math.round(r()*31);
  const top=[],bottom=[];for(let j=0;j<=24;j++){const t=j/24,amp=Math.pow(Math.sin(t*Math.PI),.48),xx=x+t*L;top.push([xx,y-H*amp*(.45+r()*.55)+(r()-.5)*2]);bottom.push([xx,y+H*amp*(.3+r()*.6)+(r()-.5)*2]);}
  for(const offset of [-1024,0,1024]){
   ctx.fillStyle='rgba('+shade+','+(shade-2)+','+(shade-6)+','+(.76+r()*.22)+')';ctx.beginPath();ctx.moveTo(top[0][0]+offset,top[0][1]);for(const q of top)ctx.lineTo(q[0]+offset,q[1]);for(const q of [...bottom].reverse())ctx.lineTo(q[0]+offset,q[1]);ctx.closePath();ctx.fill();
   ctx.strokeStyle='rgba(237,233,221,.56)';ctx.lineWidth=.8;ctx.beginPath();for(let j=0;j<bottom.length;j++){const q=bottom[j];if(j===0)ctx.moveTo(q[0]+offset,q[1]+1.5);else ctx.lineTo(q[0]+offset,q[1]+1.5);}ctx.stroke();
  }
 }
 for(let i=0;i<90;i++){
  const x=r()*1024,y=r()*1024,L=15+r()*110;
  for(const offset of [-1024,0,1024]){ctx.lineWidth=.8+r()*1.6;ctx.strokeStyle='rgba(96,91,79,.18)';ctx.beginPath();ctx.moveTo(x+offset,y);ctx.quadraticCurveTo(x+offset+L*.5,y-2,x+offset+L,y+.7);ctx.stroke();ctx.strokeStyle='rgba(245,241,228,.40)';ctx.beginPath();ctx.moveTo(x+offset,y+1.6);ctx.quadraticCurveTo(x+offset+L*.5,y-.4,x+offset+L,y+2);ctx.stroke();}
 }
 ctx.restore();
}

// Match opposite borders after every color/stripe operation, including the fallback.
function seamlessBark(ctx,w,h){
 const im=ctx.getImageData(0,0,w,h),a=im.data;
 const blend=(i,j,t)=>{for(let k=0;k<3;k++){const x=a[i+k],y=a[j+k],m=(x+y)*.5;a[i+k]=x+(m-x)*t;a[j+k]=y+(m-y)*t;}};
 const nx=Math.min(64,Math.floor(w/8)),ny=Math.min(96,Math.floor(h/8));
 for(let y=0;y<h;y++)for(let x=0;x<nx;x++)blend((y*w+x)*4,(y*w+w-1-x)*4,.5+.5*Math.cos(Math.PI*x/nx));
 for(let y=0;y<ny;y++)for(let x=0;x<w;x++)blend((y*w+x)*4,((h-1-y)*w+x)*4,.5+.5*Math.cos(Math.PI*y/ny));
 ctx.putImageData(im,0,0);return im;
}
function textures(T){
 if(cache.has(T))return cache.get(T);
 const make=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
 const bark=make(1024,1024),x=bark.getContext('2d'),r=random('birch bark r52');
 x.fillStyle='#c9c7bb';x.fillRect(0,0,1024,1024);
 for(let i=0;i<16000;i++){const a=r()*1024,b=r()*1024,w=2+r()*40,h=.4+r()*4;x.fillStyle=i%3?'rgba(85,80,70,.05)':'rgba(255,255,250,.14)';x.fillRect(a,b,w,h);}
 for(let i=0;i<490;i++){const a=r()*1024,b=r()*1024,w=4+r()*65,h=.8+r()*3.8;x.strokeStyle=i%3?'rgba(68,65,57,.55)':'rgba(104,100,84,.37)';x.lineWidth=h;x.beginPath();x.moveTo(a,b);x.quadraticCurveTo(a+w*.6,b+(r()-.5)*4,a+w,b+(r()-.5)*5);x.stroke();}
 for(let i=0;i<15;i++){const a=r()*1024,b=r()*1024,w=14+r()*100,h=8+r()*37;x.fillStyle=i%3?'#49463d':'#6e695b';x.beginPath();x.moveTo(a-w*.55,b);for(let j=0;j<13;j++){const t=j/12;x.lineTo(a-w*.55+w*t,b-h*Math.sin(t*Math.PI)*(.35+.65*r()));}for(let j=12;j>=0;j--){const t=j/12;x.lineTo(a-w*.55+w*t,b+h*Math.sin(t*Math.PI)*(.35+.65*r()));}x.closePath();x.fill();x.strokeStyle='rgba(40,37,32,.45)';x.lineWidth=1;for(let j=0;j<7;j++){x.beginPath();x.moveTo(a-w*.5+r()*w,b-h*.5+r()*h);x.lineTo(a-w*.5+r()*w,b+h*.4);x.stroke();}}
 for(let i=0;i<80;i++){const a=r()*1024,b=r()*1024,w=12+r()*50;x.fillStyle='rgba(117,112,96,.13)';x.fillRect(a,b,w,1+r()*3);x.fillStyle='rgba(255,255,249,.52)';x.fillRect(a,b+2,w*.8,1);}
 stripeBark(x,1024,1024);seamlessBark(x,1024,1024);
 const bt=new T.CanvasTexture(bark);bt.colorSpace=T.SRGBColorSpace;bt.wrapS=bt.wrapT=T.RepeatWrapping;bt.anisotropy=8;
 const leaf=make(128,160),l=leaf.getContext('2d'),grad=l.createLinearGradient(15,0,110,160);
 grad.addColorStop(0,'#b7bc82');grad.addColorStop(.45,'#8f9f64');grad.addColorStop(1,'#75884d');l.fillStyle=grad;
 l.beginPath();l.moveTo(64,153);for(let i=0;i<=22;i++){const t=i/22,yy=145-137*t,ww=50*Math.pow(Math.sin(Math.PI*t),.72)*(1.12-.30*t);l.lineTo(64-ww*(i%2?.88:1),yy);}for(let i=22;i>=0;i--){const t=i/22,yy=145-137*t,ww=50*Math.pow(Math.sin(Math.PI*t),.72)*(1.12-.30*t);l.lineTo(64+ww*(i%2?.88:1),yy);}l.closePath();l.fill();l.strokeStyle='rgba(212,215,157,.8)';l.lineWidth=1.3;l.beginPath();l.moveTo(64,154);l.lineTo(64,11);l.stroke();l.lineWidth=.75;for(let i=0;i<8;i++){const t=(i+2)/12,y=145-137*t,w=42*Math.sin(Math.PI*t);for(const sign of [-1,1]){l.beginPath();l.moveTo(64,y+9);l.quadraticCurveTo(64+sign*w*.55,y,64+sign*w,y-14);l.stroke();}}
 const lt=new T.CanvasTexture(leaf);lt.colorSpace=T.SRGBColorSpace;lt.anisotropy=4;const out={bark:bt,leaf:lt,normal:null,rough:null,materials:new Set()};cache.set(T,out);
 bt.userData.source='R54 seamless striped bark · procedural fallback';
 // W.carter, Birch trunk with bark in Norrkila (Betula pendula), 2018, CC0.
 // https://commons.wikimedia.org/wiki/File:Birch_trunk_with_bark_in_Norrkila.jpg
 // Photo-derived albedo, approximate normal/roughness; not measured scan maps.
 const photo=new Image();photo.crossOrigin='anonymous';photo.decoding='async';
 photo.onload=()=>{try{
  const w=1024,h=2048,src=make(w,h),ctx=src.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(photo,photo.naturalWidth*.23,photo.naturalHeight*.025,photo.naturalWidth*.52,photo.naturalHeight*.91,0,0,w,h);
  const raw=ctx.getImageData(0,0,w,h),data=raw.data,cols=new Float32Array(w);
  // Estimate broad cylindrical shading from bright pixels only, excluding bark scars.
  for(let X=0;X<w;X++){let sum=0,n=0;for(let Y=0;Y<h;Y+=4){const i=(Y*w+X)*4,L=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];if(L>145){sum+=L;n++;}}cols[X]=n?sum/n:205;}
  const smooth=new Float32Array(w);for(let X=0;X<w;X++){let sum=0,n=0;for(let j=-48;j<=48;j+=4){sum+=cols[clamp(X+j,0,w-1)];n++;}smooth[X]=sum/n;}
  for(let Y=0;Y<h;Y++)for(let X=0;X<w;X++){const i=(Y*w+X)*4,L=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2],gain=clamp(191/Math.max(155,smooth[X]),.76,1.14);for(let k=0;k<3;k++)data[i+k]=clamp((L+(data[i+k]-L)*.62)*gain,0,250);}
  // Crossfade matching opposite edge strips so the cylindrical UV seam is invisible.
  const blend=(i,j,t)=>{for(let k=0;k<3;k++){const a=data[i+k],b=data[j+k],m=(a+b)*.5;data[i+k]=a+(m-a)*t;data[j+k]=b+(m-b)*t;}};
  for(let y=0;y<h;y++)for(let x=0;x<48;x++)blend((y*w+x)*4,(y*w+w-1-x)*4,.5+.5*Math.cos(Math.PI*x/48));
  for(let y=0;y<64;y++)for(let x=0;x<w;x++)blend((y*w+x)*4,((h-1-y)*w+x)*4,.5+.5*Math.cos(Math.PI*y/64));
  ctx.putImageData(raw,0,0);stripeBark(ctx,w,h);
  data.set(seamlessBark(ctx,w,h).data);
  const heights=new Float32Array(w*h);for(let i=0;i<heights.length;i++){const k=i*4;heights[i]=(.2126*data[k]+.7152*data[k+1]+.0722*data[k+2])/255;}
  const normal=make(w,h),rough=make(w,h),nc=normal.getContext('2d'),rc=rough.getContext('2d'),nm=nc.createImageData(w,h),rm=rc.createImageData(w,h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,k=i*4,dx=(heights[y*w+(x+1)%w]-heights[y*w+(x+w-1)%w])*1.65,dy=(heights[((y+1)%h)*w+x]-heights[((y+h-1)%h)*w+x])*1.65,n=Math.hypot(dx,dy,1);nm.data[k]=128-127*dx/n;nm.data[k+1]=128+127*dy/n;nm.data[k+2]=128+127/n;nm.data[k+3]=255;const R=clamp(176+60*(1-heights[i])+30*Math.min(1,Math.abs(dx)+Math.abs(dy)),0,255);rm.data[k]=rm.data[k+1]=rm.data[k+2]=R;rm.data[k+3]=255;}
  nc.putImageData(nm,0,0);rc.putImageData(rm,0,0);
  const map=(c)=>{const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;return t;};
  bt.image=src;bt.needsUpdate=true;bt.userData.source='R54 · seamless W.carter CC0 photo + irregular horizontal bark scars · 1024×2048';
  out.normal=map(normal);out.rough=map(rough);
  for(const m of out.materials){m.normalMap=out.normal;m.roughnessMap=out.rough;m.bumpMap=null;m.roughness=1;m.needsUpdate=true;}
  window.dispatchEvent(new Event('forma-foliage-texture-ready'));
 }catch(e){console.warn('Birch R53 photo processing failed',e);}};
 photo.onerror=()=>{console.warn('Birch R53 photo unavailable; retained procedural bark');};
 photo.src='https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e5/Birch_trunk_with_bark_in_Norrkila.jpg/1920px-Birch_trunk_with_bark_in_Norrkila.jpg?utm_campaign=index&utm_content=thumbnail&utm_source=commons.wikimedia.org';
 return out;
}
export function createNaturalBirch(T,o,{season='summer'}={}){
 const p=birchStage(o.birch?.age),h=Number(o.height)||p.height,R=(Number(o.diameter)||p.diameter)/2,mobile=typeof window!=='undefined'&&window.innerWidth<=850;
 const r=random('birch-r52|'+o.id+'|'+o.variant+'|'+p.age),g=new T.Group(),V=(x,y,z)=>new T.Vector3(x,y,z),tex=textures(T);
 const pale={pos:[],uv:[],col:[],idx:[]},dark={pos:[],uv:[],col:[],idx:[]},foliage=[],extraTwigs=[],forks=[];const detailRng=random('birch-r56-details|'+o.id+'|'+o.variant+'|'+p.age);
 const polar=(a,d,y)=>V(Math.cos(a)*d,y,Math.sin(a)*d),mix=(a,b,t)=>a.clone().lerp(b,t),curve=pts=>new T.CatmullRomCurve3(pts,false,'centripetal');
 const snowPathsR245=[];
 function tube(path,steps,sides,base,tip,white=false,root=false){
  const b=white?pale:dark,pts=path.getPoints(steps),first=b.pos.length/3;let U=null,len=0;const phase=r()*6.28;
  if(season==='winter'&&!root&&base>=.0018){const stride=Math.max(1,Math.floor(steps/12));const samples=[];for(let j=0;j<=steps;j++){if(j%stride&&j!==steps)continue;const q=pts[j],t=j/steps;samples.push([q.x,q.y,q.z,tip+(base-tip)*Math.pow(1-t,1.32)]);}snowPathsR245.push(samples);}
  for(let i=0;i<=steps;i++){const t=i/steps,c=pts[i],axis=pts[Math.min(steps,i+1)].clone().sub(pts[Math.max(0,i-1)]).normalize(),ref=Math.abs(axis.y)>.92?V(1,0,0):V(0,1,0);
   U=U?U.clone().addScaledVector(axis,-U.dot(axis)):V(0,0,0).crossVectors(axis,ref);if(U.lengthSq()<1e-8)U.crossVectors(axis,ref);U.normalize();const W=V(0,0,0).crossVectors(axis,U).normalize();
   if(i)len+=c.distanceTo(pts[i-1]);const radius=(tip+(base-tip)*Math.pow(1-t,1.32))*(root?1+.32*Math.exp(-t*24):white?1+.17*Math.exp(-t*19):1);
   const rootTint=root?clamp((c.y/(h*(p.age===75?.20:.10)))+.28,.28,1):1;
   for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,rr=radius*(1+.06*Math.sin(a*5+phase+t*3)+(white?.027*Math.sin(a*9+t*47+phase)+.018*Math.sin(a*13-t*63):0));const q=c.clone().addScaledVector(U,rr*Math.cos(a)).addScaledVector(W,rr*Math.sin(a));b.pos.push(q.x,q.y,q.z);b.uv.push(j/sides*Math.max(1,Math.round(base*6.28/1.05)),len/1.62);b.col.push(rootTint,rootTint*.99,rootTint*.96);if(i&&j<sides){const k=first+(i-1)*(sides+1)+j,n=k+sides+1;b.idx.push(k,k+1,n,k+1,n+1,n);}}
  }
 }
 const trunk=curve([V(0,-.04,0),V(-p.bend*.25,h*.18,p.bend*.1),V(p.bend*.35,h*.38,-p.bend*.15),V(p.bend*.75,h*.58,p.bend*.25),V(-p.bend*.20,h*.79,p.bend*.18),V(p.bend*.28,h*.97,0)]);
 tube(trunk,66,28,p.radius,.012,true,true);
 for(let i=0;i<5;i++){const az=i*1.256+r()*.2,L=p.radius*(1.5+r()*.8);tube(curve([V(0,p.radius*.6,0),polar(az,L*.45,p.radius*.18),polar(az,L,-.03)]),8,8,p.radius*.36,.005,true,true);}
 function leafTwig(a,az,len,drop,detail=false){
  const end=a.clone().add(polar(az,len*.76,-drop)),c=curve([a,a.clone().add(polar(az,len*.33,len*.13)),mix(a,end,.6).add(polar(az+.7,len*.12,0)),end]);tube(c,9,4,.0035,.0006);
  if(!detail&&detailRng()<.12){const t=.30+detailRng()*.44;extraTwigs.push({a:c.getPoint(t),az:az+(detailRng()<.5?-1:1)*(.75+detailRng()*.65),len:len*(.48+detailRng()*.22),drop:drop*.65});}
  if(season==='winter')return;const n=Math.max(7,Math.min(mobile?34:52,Math.round(c.getLength()/(mobile?.052:.039))));
  for(let i=0;i<n;i++){const t=(i+.45)/n,origin=c.getPoint(t),ang=az+(i%2?1:-1)*(1+r()*1.0),dir=polar(ang,.65+r()*.35,-.28-r()*.65).normalize(),size=.065+r()*.043;foliage.push({origin,dir,size,roll:(r()-.5)*2.8,shade:r()});}
  if(!detail){const m=Math.round(n*.23);for(let i=0;i<m;i++){const t=(i+.68)/m,origin=c.getPoint(t),ang=az+(i%2?1:-1)*(1+detailRng()),dir=polar(ang,.65+detailRng()*.35,-.28-detailRng()*.65).normalize(),size=.065+detailRng()*.043;foliage.push({origin,dir,size,roll:(detailRng()-.5)*2.8,shade:detailRng()});}}
 }
 for(let i=0;i<p.limbs;i++){
  const u=i/(p.limbs-1),t=clamp(p.start+u*(.95-p.start)+(r()-.5)*.055,.24,.95),a=trunk.getPoint(t),az=i*2.39996+(r()-.5)*.75;
  const envelope=Math.pow(Math.sin(Math.PI*(.18+.77*u)),.83),rad=R*envelope*(.70+r()*.22),rise=h*(.065+.075*r())*(1-.40*u),end=a.clone().add(polar(az,rad,rise*.55));
  end.y=Math.min(h*.99,end.y)-h*.025*Math.pow(1-u,1.4);const sweep=(.23+.12*Math.sin(i*2.17))*(i%2?1:-1),cross=polar(az+Math.PI/2,rad*sweep,0);const main=curve([a,a.clone().add(polar(az,rad*.14,rise*.54)).addScaledVector(cross,.50),a.clone().add(polar(az,rad*.43,rise*1.04)).addScaledVector(cross,1),a.clone().add(polar(az,rad*.76,rise*.94)).addScaledVector(cross,-.30),end]);
  const limbRadius=p.radius*(.31-.20*u)*(.75+r()*.4);tube(main,40,16,limbRadius,.006,true);forks.push({a:a.clone(),end:main.getPoint(.11),radius:limbRadius});
  const secondaryCount=mobile?7:9;
  for(let j=0;j<secondaryCount;j++){
   const f=.19+j*.76/(secondaryCount-1),b=main.getPoint(f),theta=az+(j%2?1:-1)*(.55+r()*.95),span=R*(.16+r()*.15)*(1-.46*u)*(.6+.4*Math.sin(Math.PI*f));
   const e=b.clone().add(polar(theta,span,h*(.025+r()*.035)));e.y=Math.min(h*.985,e.y);
   const sway=polar(theta+Math.PI/2,span*(j%2?-.21:.21),0);const sec=curve([b,b.clone().lerp(e,.32).addScaledVector(sway,.9).add(V(0,h*.015,0)),b.clone().lerp(e,.70).addScaledVector(sway,-.45).add(V(0,h*.009,0)),e]);tube(sec,20,6,Math.max(.007,p.radius*.065*(1-f*.55)),.0018,false);
   const twigCount=mobile?7:9;
   for(let k=0;k<twigCount;k++){
    const q=sec.getPoint(.12+k*.85/(twigCount-1)),ang=theta+(k%2?1:-1)*(.45+r()*1.5),len=R*(.09+r()*.14)*(1-.35*u);
    leafTwig(q,ang,len,len*(.30+.6*r())*p.droop);
    if(!mobile||k%2===0)leafTwig(q,ang+1.3,len*(.66+r()*.28),len*(.23+.5*r())*p.droop);
   }
  }
 }
 for(const t of extraTwigs)leafTwig(t.a,t.az,t.len,t.drop,true);
 // A short tapered collar overlaps the branch base and blends its attachment into the trunk.
 for(const f of forks){const axis=f.end.clone().sub(f.a).normalize(),start=f.a.clone().addScaledVector(axis,-f.radius*.36),end=f.a.clone().addScaledVector(axis,f.radius*2.8);tube(curve([start,f.a.clone(),end]),10,16,f.radius*1.13,f.radius*.74,true);}
 function mesh(b,mat,name){if(!b.pos.length)return;const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(b.pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(b.uv,2));geo.setAttribute('color',new T.Float32BufferAttribute(b.col,3));geo.setIndex(b.idx);geo.computeVertexNormals();geo.computeBoundingSphere();const m=new T.Mesh(geo,mat);m.name=name;m.castShadow=true;m.receiveShadow=true;g.add(m);}
 const barkMaterial=new T.MeshStandardMaterial({map:tex.bark,color:'#ece9df',vertexColors:true,normalMap:tex.normal,normalScale:new T.Vector2(1.34,1.34),roughnessMap:tex.rough,bumpMap:tex.normal?null:tex.bark,bumpScale:.035,roughness:tex.rough?1:.93,side:T.DoubleSide});tex.materials.add(barkMaterial);barkMaterial.addEventListener('dispose',()=>tex.materials.delete(barkMaterial));mesh(pale,barkMaterial,'Birch R56 photographic bark and structural branches');
 mesh(dark,new T.MeshStandardMaterial({color:'#544839',roughness:.97,side:T.DoubleSide}),'Birch R52 fine woody twigs');
 if(foliage.length){const geo=new T.PlaneGeometry(1,1,2,2),a=geo.attributes.position;for(let i=0;i<a.count;i++)a.setZ(i,.16*(1-Math.abs(a.getX(i))*2)-.12*a.getY(i)**2);geo.computeVertexNormals();const mat=new T.MeshStandardMaterial({map:tex.leaf,alphaTest:.35,side:T.DoubleSide,roughness:.88,color:'#efefdf',emissive:'#8e986e',emissiveIntensity:.10});const m=new T.InstancedMesh(geo,mat,foliage.length),tmp=new T.Object3D(),Y=V(0,1,0),colors=(season==='autumn'?['#e4bf73','#c5ab62','#d0bb71']:['#d7dfbc','#c7d3af','#e1e5c6','#b9c5a1']).map(c=>new T.Color(c));
 foliage.forEach((f,i)=>{tmp.position.copy(f.origin).addScaledVector(f.dir,f.size*.43);tmp.quaternion.setFromUnitVectors(Y,f.dir);tmp.rotateY(f.roll);tmp.scale.set(f.size*.76,f.size,f.size*.76);tmp.updateMatrix();m.setMatrixAt(i,tmp.matrix);m.setColorAt(i,colors[Math.min(colors.length-1,Math.floor(f.shade*colors.length))]);});m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;m.computeBoundingSphere();m.castShadow=true;m.receiveShadow=true;m.name='Birch R52 serrated individual leaves';g.add(m);}
 g.userData.nativeBirchR52=true;g.userData.nativeBirchR53=true;g.userData.nativeBirchR54=true;g.userData.nativeBirchR55=true;g.userData.nativeBirchR56=true;g.userData.birchAge=p.age;g.userData.leafCount=foliage.length;g.userData.physicalHeight=h;g.userData.trunkDiameter=p.radius*2;g.userData.formaDeciduousSnowPathsR245=snowPathsR245;return g;
}
