import {installMatteOakMaps} from './forma-oak-matte-bark-r68.js?v=R68';
/* FORMA oak R65: independent Quercus robur geometry, procedural tileable bark. */
export const OAK_STAGES=Object.freeze([
 {age:15,height:8,diameter:5.5,radius:.18,limbs:12,start:.30,bend:.24},
 {age:60,height:17,diameter:15,radius:.48,limbs:18,start:.21,bend:.65},
 {age:150,height:24,diameter:23,radius:.96,limbs:22,start:.17,bend:1.22}
]);
export function oakStage(age){return OAK_STAGES.find(p=>p.age===Number(age))||OAK_STAGES[1];}
function random(seed){let x=2166136261;for(const c of String(seed))x=Math.imul(x^c.charCodeAt(0),16777619);return()=>((x=Math.imul(x^x>>>15,2246822519)>>>0)/4294967296);}
const cache=new WeakMap(),TAU=2*Math.PI;
function maps(T){
 if(cache.has(T))return cache.get(T);
 const N=1024,make=()=>{const c=document.createElement('canvas');c.width=c.height=N;return c;},bark=make(),normal=make(),rough=make(),b=bark.getContext('2d'),n=normal.getContext('2d'),q=rough.getContext('2d'),bi=b.createImageData(N,N),ni=n.createImageData(N,N),qi=q.createImageData(N,N),H=new Float32Array(N*N);
 const rand=random('oak-r65-longitudinal-bark'),wrap=(x,m)=>(x%m+m)%m,clamp=(x,a=0,z=1)=>Math.min(z,Math.max(a,x)),smooth=t=>t*t*(3-2*t);
 const grid=(w,h)=>({w,h,v:Float32Array.from({length:w*h},()=>rand())});
 const grids=[grid(8,4),grid(21,9),grid(56,19),grid(115,45),grid(220,135),grid(410,310),grid(17,51)];
 function noise(g,u,v){const X=u*g.w,Y=v*g.h,x=Math.floor(X),y=Math.floor(Y),a=smooth(X-x),b=smooth(Y-y);const at=(i,j)=>g.v[wrap(j,g.h)*g.w+wrap(i,g.w)];return (at(x,y)*(1-a)+at(x+1,y)*a)*(1-b)+(at(x,y+1)*(1-a)+at(x+1,y+1)*a)*b;}
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  const u=x/N,v=y/N,A=noise(grids[0],u,v),B=noise(grids[1],u,v),C=noise(grids[2],u,v),D=noise(grids[3],u,v),E=noise(grids[4],u,v),F=noise(grids[5],u,v);
  const warped=u+(A-.5)*.052+(B-.5)*.017+(C-.5)*.005;
  const rib=1-Math.pow(Math.abs(Math.sin(Math.PI*(warped*29+(B-.5)*.42))),.38);
  const split=1-Math.pow(Math.abs(Math.sin(Math.PI*(warped*67+(C-.5)*1.4))),.60);
  const cross=noise(grids[6],u,v),interruption=smooth(clamp((cross-.60)*3.2));
  const crack=clamp(rib*.58+split*.21+interruption*.12);
  const height=clamp(.55-crack*.50+(C-.5)*.17+(D-.5)*.20+(E-.5)*.18+(F-.5)*.10);
  const k=(y*N+x)*4;H[y*N+x]=height;
  const gray=91+height*70+(A-.5)*20+(C-.5)*20+(D-.5)*19+(E-.5)*26+(F-.5)*18-crack*28;
  const lichen=clamp((A*.48+B*.27+D*.25-.69)*3.7)*(.25+.75*E),moss=clamp((B*.65+A*.35-.78)*3.8)*(.45+crack*.55);
  bi.data.set([gray*1.07+lichen*13-moss*19,gray*.99+lichen*17-moss*5,gray*.89+lichen*22-moss*18,255],k);
  const r=clamp(.87+(1-height)*.10+(F-.5)*.045)*255;qi.data.set([r,r,r,255],k);
 }
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){const k=(y*N+x)*4,dx=(H[y*N+wrap(x+1,N)]-H[y*N+wrap(x-1,N)])*5,dy=(H[wrap(y+1,N)*N+x]-H[wrap(y-1,N)*N+x])*5,l=Math.hypot(dx,dy,1);ni.data.set([128-127*dx/l,128+127*dy/l,128+127/l,255],k);}
 b.putImageData(bi,0,0);n.putImageData(ni,0,0);q.putImageData(qi,0,0);
 const tex=(c,srgb=false)=>{const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;if(srgb)t.colorSpace=T.SRGBColorSpace;t.name='Oak R65 fine longitudinal bark';return t;};
 const result={bark:tex(bark,true),normal:tex(normal),rough:tex(rough)};cache.set(T,result);installMatteOakMaps(T,result);return result;
}
const leafCache=new WeakMap();
function oakLeafMaps(T){
 if(leafCache.has(T))return leafCache.get(T);
 const w=512,h=768,make=()=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;},color=make(),relief=make(),normal=make(),rough=make(),ctx=color.getContext('2d'),rc=relief.getContext('2d'),nc=normal.getContext('2d'),qc=rough.getContext('2d');
 ctx.scale(2,2);rc.scale(2,2);qc.scale(2,2);
 const path=new Path2D();path.moveTo(128,340);
 path.bezierCurveTo(117,317,104,306,91,299);path.bezierCurveTo(48,312,29,272,52,255);path.bezierCurveTo(69,245,101,264,91,238);
 path.bezierCurveTo(22,246,6,188,31,171);path.bezierCurveTo(52,156,91,190,81,158);
 path.bezierCurveTo(21,160,15,104,46,89);path.bezierCurveTo(70,79,99,119,94,88);
 path.bezierCurveTo(57,58,83,20,112,41);path.bezierCurveTo(124,48,126,12,140,23);path.bezierCurveTo(170,28,174,53,159,81);
 path.bezierCurveTo(154,112,184,76,205,95);path.bezierCurveTo(238,121,211,154,174,158);
 path.bezierCurveTo(159,185,204,151,227,180);path.bezierCurveTo(248,216,211,249,169,239);
 path.bezierCurveTo(154,262,191,245,205,267);path.bezierCurveTo(218,300,172,312,150,299);path.bezierCurveTo(139,310,137,330,128,340);path.closePath();
 const gr=ctx.createLinearGradient(0,30,256,384);gr.addColorStop(0,'#596b35');gr.addColorStop(.45,'#687b3d');gr.addColorStop(1,'#46572b');ctx.fillStyle=gr;ctx.fill(path);
 rc.fillStyle='#777';rc.fillRect(0,0,256,384);rc.fillStyle='#b0b0b0';rc.fill(path);
 const rr=random('oak-leaf-r62-detail');
 ctx.save();ctx.clip(path);
 for(let i=0;i<180;i++){const x=rr()*256,y=rr()*384,r=8+rr()*29,g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,i%2?'rgba(166,175,92,.16)':'rgba(27,47,20,.20)');g.addColorStop(1,'rgba(80,105,45,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r);}
 for(let i=0;i<38000;i++){const x=rr()*256,y=rr()*384;ctx.fillStyle=i%2?'rgba(35,45,20,.10)':'rgba(184,194,119,.12)';ctx.fillRect(x,y,.2+rr()*.9,.2+rr()*.85);}
 ctx.restore();
 const veins=(c,base,side,minor)=>{c.save();c.clip(path);c.lineCap='round';c.strokeStyle=base;c.lineWidth=1.7;c.beginPath();c.moveTo(128,341);c.bezierCurveTo(123,260,134,145,137,29);c.stroke();c.strokeStyle=side;
 for(const [x,y,ey] of [[56,286,266],[34,230,196],[37,149,111],[86,78,51],[201,286,270],[221,229,194],[209,149,112],[161,78,49]]){const start=y+19;c.lineWidth=.9;c.strokeStyle=side;c.beginPath();c.moveTo(129,start);c.quadraticCurveTo((129+x)*.5,y,x,ey);c.stroke();for(let i=1;i<=7;i++){const t=i/8,px=129+(x-129)*t,py=start+(ey-start)*t,sgn=x<129?-1:1;c.strokeStyle=minor;c.lineWidth=.34;for(const sideSign of [-1,1]){c.beginPath();c.moveTo(px,py);c.quadraticCurveTo(px+sgn*5,py+sideSign*5,px+sgn*11,py+sideSign*12);c.stroke();c.beginPath();c.moveTo(px+sgn*6,py+sideSign*6);c.lineTo(px+sgn*13,py+sideSign*5);c.stroke();}}}c.restore();};
 veins(ctx,'#c1c893','rgba(182,193,121,.75)','rgba(174,185,112,.35)');veins(rc,'#d9d9d9','#c8c8c8','#bdbdbd');
 ctx.strokeStyle='#a49b62';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(128,337);ctx.lineTo(126,373);ctx.stroke();
 const src=rc.getImageData(0,0,w,h).data,ni=nc.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const k=(y*w+x)*4,dx=(src[(y*w+Math.min(w-1,x+1))*4]-src[(y*w+Math.max(0,x-1))*4])/255,dy=(src[(Math.min(h-1,y+1)*w+x)*4]-src[(Math.max(0,y-1)*w+x)*4])/255,l=Math.hypot(dx,dy,1);ni.data.set([128-127*dx/l,128+127*dy/l,128+127/l,255],k);}nc.putImageData(ni,0,0);qc.fillStyle='#c6c6c6';qc.fillRect(0,0,256,384);qc.fillStyle='#a0a0a0';qc.fill(path);
 const tex=(c,srgb=false)=>{const t=new T.CanvasTexture(c);t.anisotropy=4;if(srgb)t.colorSpace=T.SRGBColorSpace;return t;};const result={color:tex(color,true),normal:tex(normal),rough:tex(rough)};leafCache.set(T,result);return result;
}
function oakLeaf(T,mobile=false){const g=new T.PlaneGeometry(1,1,mobile?1:2,mobile?2:3),a=g.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i);a.setZ(i,.13*(1-2*Math.abs(x))-.14*y*y);}g.computeVertexNormals();return g;}
export function createNaturalOak(T,o,{season='summer'}={}){
 const p=oakStage(o.oak?.age),h=Number(o.height)||p.height,R=(Number(o.diameter)||p.diameter)/2,mobile=typeof window!=='undefined'&&window.innerWidth<=850,r=random('oak-r59|'+o.id+'|'+o.variant+'|'+p.age),g=new T.Group(),V=(x,y,z)=>new T.Vector3(x,y,z),polar=(a,d,y)=>V(Math.cos(a)*d,y,Math.sin(a)*d),curve=pts=>new T.CatmullRomCurve3(pts,false,'centripetal'),wood={pos:[],uv:[],idx:[],fineIdx:[],colors:[]},leaves=[],leafRng=random('oak-r60-leaves|'+o.id+'|'+p.age),forkRng=random('oak-r64-forks|'+o.id+'|'+p.age);let fineBranchCount=0;
 function tube(c,steps,sides,base,tip,root=false,rand=r){const pts=c.getPoints(steps),first=wood.pos.length/3,phase=rand()*TAU;let U=null,len=0;for(let i=0;i<=steps;i++){const t=i/steps,a=pts[i],axis=pts[Math.min(steps,i+1)].clone().sub(pts[Math.max(0,i-1)]).normalize(),ref=Math.abs(axis.y)>.93?V(1,0,0):V(0,1,0);U=U?U.clone().addScaledVector(axis,-U.dot(axis)):V(0,0,0).crossVectors(axis,ref);if(U.lengthSq()<1e-8)U.crossVectors(axis,ref);U.normalize();const W=V(0,0,0).crossVectors(axis,U).normalize();if(i)len+=a.distanceTo(pts[i-1]);const radius=(tip+(base-tip)*Math.pow(1-t,1.22))*(1+(root?.5:.25)*Math.exp(-t*22));for(let j=0;j<=sides;j++){const ang=j/sides*TAU,rr=radius*(1+.075*Math.sin(ang*5+phase+t*5)+.032*Math.sin(ang*11+t*39));const v=a.clone().addScaledVector(U,rr*Math.cos(ang)).addScaledVector(W,rr*Math.sin(ang));wood.pos.push(v.x,v.y,v.z);const tile=p.age===15?.55:p.age===60?.72:.86,repeat=Math.max(1,Math.round(base*TAU/tile));wood.uv.push(j/sides*repeat+phase/TAU,len/tile);const tint=base<.025?1.12:base<.12?1.06:1;wood.colors.push(Math.min(1,tint*.88),Math.min(1,tint*.91),Math.min(1,tint*.90));if(i&&j<sides){const k=first+(i-1)*(sides+1)+j,m=k+sides+1;(base<.025?wood.fineIdx:wood.idx).push(k,k+1,m,k+1,m+1,m);}}}}
 const trunk=curve([V(0,-.04,0),V(-p.bend*.2,h*.16,0),V(p.bend*.30,h*.34,p.bend*.22),V(p.bend*.62,h*.56,-p.bend*.28),V(-p.bend*.36,h*.79,p.bend*.15),V(p.bend*.25,h*.98,0)]);tube(trunk,70,32,p.radius,.012,true);
 for(let i=0;i<7;i++){const a=i*TAU/7+r()*.4,d=p.radius*(1.7+r()*1.2);tube(curve([V(0,p.radius*.85,0),polar(a,d*.42,p.radius*.24),polar(a,d,-.03)]),12,10,p.radius*.33,.015,true);}
 // Independent random stream keeps all existing scaffold branches unchanged.
 function fineFork(parent,az,L){
  const count=mobile?2:3;
  for(let j=0;j<count;j++){
   const sign=j%2?1:-1,t=.38+j*.48/(count-1),a=parent.getPoint(t);
   const theta=az+sign*(.65+forkRng()*.95),length=Math.min(.95,L*(.31+forkRng()*.27)),rise=length*(.18+forkRng()*.75);
   const end=a.clone().add(polar(theta,length,rise)),c=curve([a,a.clone().add(polar(theta+sign*.25,length*.38,rise*.22)),end]);
   tube(c,4,4,.0045,.0009,false,forkRng);fineBranchCount++;
   const tipAngle=theta-sign*(.55+forkRng()*.35),tipStart=c.getPoint(.62),tipLen=length*(.31+forkRng()*.2),tipEnd=tipStart.clone().add(polar(tipAngle,tipLen,tipLen*.48));
   const tip=curve([tipStart,tipStart.clone().lerp(tipEnd,.43).add(V(0,tipLen*.12,0)),tipEnd]);
   tube(tip,3,4,.0023,.0006,false,forkRng);fineBranchCount++;
   if(season==='winter')continue;
   for(const shoot of [c,tip]){
    const n=Math.max(3,Math.min(mobile?8:11,Math.ceil(shoot.getLength()/.055)));
    for(let k=0;k<n;k++){
     const origin=shoot.getPoint((k+.55)/n),a0=theta+(k%2?1:-1)*(.7+forkRng()*1.1),size=.095+forkRng()*.055;
     for(let l=0;l<2;l++){
      const angle=a0+l*(1.1+forkRng()*.6),dir=polar(angle,.8,(forkRng()-.42)*1.35).normalize();
      leaves.push({origin:origin.clone().add(polar(angle,size*.21,(forkRng()-.5)*size*.35)),dir,size:size*(.87+forkRng()*.24),roll:(forkRng()-.5)*2.9,shade:forkRng()});
     }
    }
   }
  }
 }
 function twig(a,az,L,rise){const end=a.clone().add(polar(az,L,rise)),c=curve([a,a.clone().add(polar(az+.24,L*.35,rise*.4)),a.clone().add(polar(az-.21,L*.68,rise*.85)),end]);tube(c,6,5,.007,.001);fineFork(c,az,L);if(season==='winter')return;const n=Math.max(6,Math.min(mobile?18:27,Math.round(c.getLength()/(mobile?.064:.047))));for(let i=0;i<n;i++){const t=(i+.4)/n,origin=c.getPoint(t),ang=az+(i%2?1:-1)*(.65+r()*1.15),dir=polar(ang,.7+r()*.3,(r()-.53)*.9).normalize(),size=.083+r()*.055;const roll=(r()-.5)*2.8,shade=r();leaves.push({origin,dir,size,roll,shade});for(let j=0;j<2;j++){const sign=j===0?1:-1,off=polar(ang+sign*1.15,size*(.36+leafRng()*.5),(leafRng()-.5)*size*.7),d=polar(ang+sign*(.65+leafRng()*.65),.75,(leafRng()-.5)*1.2).normalize();leaves.push({origin:origin.clone().add(off),dir:d,size:size*(.87+leafRng()*.24),roll:roll+sign*(.4+leafRng()*.8),shade:leafRng()});}}}
 for(let i=0;i<p.limbs;i++){
  const u=i/(p.limbs-1),t=Math.min(.93,p.start+u*(.91-p.start)+(r()-.5)*.07),a=trunk.getPoint(t),az=i*2.39996+(r()-.5)*.65,rad=R*Math.pow(Math.sin(Math.PI*(.13+.80*u)),.75)*(.77+r()*.22),rise=h*(.12+.12*r())*(1-.57*u),end=a.clone().add(polar(az,rad,rise*.78));end.y=Math.min(h*.99,end.y);
  const swing=(i%2?1:-1)*(.21+r()*.14),side=polar(az+Math.PI/2,rad*swing,0),main=curve([a,a.clone().add(polar(az,rad*.15,rise*.34)).addScaledVector(side,.4),a.clone().add(polar(az,rad*.42,rise*.58)).addScaledVector(side,1),a.clone().add(polar(az,rad*.73,rise*.98)).addScaledVector(side,-.3),end]);
  tube(main,35,18,p.radius*(.46-.34*u)*(.82+r()*.28),.009);
  const ns=mobile?7:9;
  for(let j=0;j<ns;j++){const f=.21+j*.76/(ns-1),b=main.getPoint(f),theta=az+(j%2?1:-1)*(.52+r()*.95),span=R*(.18+r()*.16)*(1-.42*u)*(.68+.32*Math.sin(Math.PI*f)),up=h*(.035+r()*.055),e=b.clone().add(polar(theta,span,up));e.y=Math.min(h*.995,e.y);const sec=curve([b,b.clone().add(polar(theta+.29,span*.31,up*.30)),b.clone().add(polar(theta-.22,span*.69,up*.75)),e]);tube(sec,17,8,Math.max(.018,p.radius*.125*(1-f*.75)*(1-u*.45)),.004);
   const nt=mobile?7:10;for(let k=0;k<nt;k++){const q=sec.getPoint(.16+k*.81/(nt-1)),angle=theta+(k%2?1:-1)*(.6+r()*1.1),len=R*(.075+r()*.095)*(1-.35*u);twig(q,angle,len,len*(.12+r()*.50));if(k%2===0)twig(q,angle+1.65,len*.68,len*(.08+r()*.35));}
  }
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(wood.pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(wood.uv,2));geo.setAttribute('color',new T.Float32BufferAttribute(wood.colors,3));geo.setIndex(wood.idx.concat(wood.fineIdx));geo.addGroup(0,wood.idx.length,0);if(wood.fineIdx.length)geo.addGroup(wood.idx.length,wood.fineIdx.length,1);geo.computeVertexNormals();const tex=maps(T),mat=new T.MeshPhysicalMaterial({map:tex.bark,normalMap:tex.normal,normalScale:new T.Vector2(.9,.9),roughnessMap:tex.rough,roughness:1,metalness:0,ior:1.45,specularIntensity:.23,clearcoat:0,envMapIntensity:.19,color:'#f1f0ec',vertexColors:true,side:T.DoubleSide}),fine=new T.MeshPhysicalMaterial({color:'#777a64',vertexColors:true,roughness:.96,metalness:0,specularIntensity:.18,envMapIntensity:.16,side:T.DoubleSide}),m=new T.Mesh(geo,[mat,fine]);m.castShadow=m.receiveShadow=true;m.name='Oak R68 matte longitudinal bark';g.add(m);
 if(leaves.length){const lm=oakLeafMaps(T),leafMat=new T.MeshStandardMaterial({map:lm.color,alphaTest:.45,normalMap:lm.normal,normalScale:new T.Vector2(.8,.8),roughnessMap:lm.rough,roughness:.72,color:'#ffffff',side:T.DoubleSide,emissive:'#606e46',emissiveIntensity:0}),mesh=new T.InstancedMesh(oakLeaf(T,mobile),leafMat,leaves.length),obj=new T.Object3D(),Y=V(0,1,0),palette=(season==='autumn'?['#a49a60','#ba995c','#a58853']:['#d5daca','#eef0df','#bac8a6','#e6e1c8','#aebda0']).map(x=>new T.Color(x));leaves.forEach((f,i)=>{obj.position.copy(f.origin).addScaledVector(f.dir,f.size*.43);obj.quaternion.setFromUnitVectors(Y,f.dir);obj.rotateY(f.roll);obj.scale.set(f.size*.92,f.size*1.22,f.size);obj.updateMatrix();mesh.setMatrixAt(i,obj.matrix);mesh.setColorAt(i,palette[Math.min(palette.length-1,Math.floor(f.shade*palette.length))]);});mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();mesh.castShadow=mesh.receiveShadow=true;mesh.name='Oak R62 botanical leaf maps';g.add(mesh);}
 g.userData.nativeOakR59=true;g.userData.nativeOakR60=true;g.userData.nativeOakR62=true;g.userData.nativeOakR64=true;g.userData.nativeOakR65=true;g.userData.nativeOakR67=true;g.userData.nativeOakR68=true;g.userData.fineBranchCount=fineBranchCount;g.userData.oakAge=p.age;g.userData.trunkDiameter=p.radius*2;g.userData.leafCount=leaves.length;g.userData.primaryBranches=p.limbs;g.userData.physicalHeight=h;return g;
}
