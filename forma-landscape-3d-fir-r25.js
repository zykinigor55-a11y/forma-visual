/* Original FORMA young fir: tiered woody branches and individually folded
 * flat needles. No billboard, external dependency, or change of saved dimensions. */
const cache=new Map(),firCache=new Map();
let firAtlas=null,firBarkSource=null;
function redraw(){window.dispatchEvent(new Event('forma-foliage-texture-ready'))}
function needleAtlas(T){
 if(firAtlas)return firAtlas;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
 const c=canvas.getContext('2d'),r=rng('abies-alpha-v28');
 c.lineCap='round';c.strokeStyle='#665c46';c.lineWidth=4;c.beginPath();c.moveTo(256,485);c.quadraticCurveTo(246,255,256,24);c.stroke();
 for(let i=0;i<60;i++){
  const t=(i+.5)/60,y=478-t*438,x=256+Math.sin(t*5)*7;
  for(const side of [-1,1]){
   const len=(42+95*Math.pow(Math.sin(Math.PI*t),.65))*(.75+r()*.25);
   const dx=side*len,dy=-len*(.24+r()*.26);
   const green=75+Math.round(r()*28),grad=c.createLinearGradient(x,y,x+dx,y+dy);
   grad.addColorStop(0,'#354d35');grad.addColorStop(.65,'rgb('+Math.round(green*.73)+','+green+','+Math.round(green*.68)+')');grad.addColorStop(1,'#71865a');
   c.fillStyle=grad;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+dx*.48,y+dy*.42-4,x+dx,y+dy);
   c.quadraticCurveTo(x+dx*.53,y+dy*.52+4,x,y+3);c.fill();
  }
 }
 firAtlas=new T.CanvasTexture(canvas);firAtlas.colorSpace=T.SRGBColorSpace;firAtlas.anisotropy=4;
 firAtlas.userData.source='local drawn Abies needle alpha';return firAtlas;
}
// Recover original photographic alpha and bark from the existing local CC0 GLB.
// Readable RGBA images only: compressed or unsuitable atlases retain safe local texture.
export function adoptFirPhotoMaps(T,source){
 const atlas=needleAtlas(T),canvas=atlas.image;
 let foliage=null,bark=null;
 source.traverse(n=>{if(!n.isMesh)return;for(const m of Array.isArray(n.material)?n.material:[n.material]){
  if(!m?.map)continue;if(m.alphaTest>0&&!foliage)foliage=m;
  else if(!m.alphaTest&&!m.transparent&&/bark|branch|trunk|wood/i.test((m.name||'')+' '+(n.name||'')))bark=m;
 }});
 if(bark){const image=bark.map.image;try{const dst=woodTexture(T,'fir').image,ctx=dst.getContext('2d');ctx.drawImage(image,0,0,dst.width,dst.height);woodTexture(T,'fir').needsUpdate=true;firBarkSource='Poly Haven fir GLB';}catch{}}
 if(foliage){try{
  const src=foliage.map.image,w=src.width,h=src.height;if(!w||!h)throw Error('no readable photo');
  const tmp=document.createElement('canvas');tmp.width=tmp.height=512;const cx=tmp.getContext('2d',{willReadFrequently:true});cx.drawImage(src,0,0,512,512);
  if(foliage.alphaMap?.image){const mask=document.createElement('canvas');mask.width=mask.height=512;const mc=mask.getContext('2d');mc.drawImage(foliage.alphaMap.image,0,0,512,512);const a=mc.getImageData(0,0,512,512),p=cx.getImageData(0,0,512,512);for(let i=0;i<p.data.length;i+=4)p.data[i+3]=Math.round(p.data[i+3]*a.data[i+1]/255);cx.putImageData(p,0,0)}
  const p=cx.getImageData(0,0,512,512).data;let transparent=0,opaque=0;for(let i=3;i<p.length;i+=4){if(p[i]<40)transparent++;if(p[i]>180)opaque++;}
  if(transparent<512*512*.08||opaque<512*512*.04)throw Error('no usable alpha');
  // Only use the original atlas when it actually contains transparency.
  canvas.getContext('2d').clearRect(0,0,512,512);canvas.getContext('2d').drawImage(tmp,0,0);atlas.needsUpdate=true;atlas.userData.source='Poly Haven fir GLB alpha';
 }catch{}}
 redraw();
}

function rng(s){let x=2166136261;for(const c of String(s)){x=Math.imul(x^c.charCodeAt(0),16777619)}return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296}}
function clamp(x,a,b){return Math.min(b,Math.max(a,x))}
export function woodTexture(T,type='fir'){
 if(cache.has(type))return cache.get(type);
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;
 const c=canvas.getContext('2d'),r=rng(type),bark=type==='fir';
 c.fillStyle=bark?'#77736a':'#a48a6b';c.fillRect(0,0,256,512);
 for(let i=0;i<2200;i++){const x=r()*256,y=r()*512,l=5+r()*(bark?40:150);
  c.strokeStyle=r()<.48?(bark?'rgba(42,39,34,.23)':'rgba(65,42,23,.22)'):'rgba(236,221,195,.16)';
  c.lineWidth=.4+r()*1.8;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+(r()-.5)*5,y+l*.3,x+(r()-.5)*7,y+l*.7,x+(r()-.5)*4,y+l);c.stroke();
 }
 if(bark)for(let i=0;i<95;i++){const x=r()*256,y=r()*512;c.fillStyle='rgba(40,35,30,.24)';c.beginPath();c.ellipse(x,y,1+r()*2,2+r()*6,.3,0,Math.PI*2);c.fill()}
 else for(let i=0;i<5;i++){const x=30+r()*196,y=r()*512;for(let j=1;j<8;j++){c.strokeStyle='rgba(74,49,29,.12)';c.beginPath();c.ellipse(x,y,j*1.8,j*6,.04,0,Math.PI*2);c.stroke()}}
 const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;cache.set(type,t);return t;
}
export function createDetailedFir(T,instance){
 const h=clamp(Number(instance.height)||3,.25,40),d=clamp(Number(instance.diameter)||2,.2,30),rad=d/2;
 const variant=clamp(Math.round(Number(instance.variant)||1),1,3),key=h.toFixed(3)+'|'+d.toFixed(3)+'|'+variant;
 const cached=firCache.get(key);if(cached){const copy=cached.clone(true);copy.traverse(n=>{if(n.isMesh)n.material=n.material.clone()});return copy;}
 const r=rng('fir|'+variant),g=new T.Group();
 const branches=[],vertices=[],colors=[],indices=[],cards=[];
 const shades=['#263e2b','#37543a','#466445','#5c7853','#38563f'].map(c=>new T.Color(c));
 const V=(x,y,z)=>new T.Vector3(x,y,z);
 function branch(a,b,w){branches.push([a,b,w])}
 function needle(base,dir,side,len,width,c){
  const tip=base.clone().addScaledVector(dir,len),mid=base.clone().addScaledVector(dir,len*.45);
  const left=mid.clone().addScaledVector(side,width),right=mid.clone().addScaledVector(side,-width);
  const ridge=mid.clone().add(V(0,width*.27,0));
  const i=vertices.length/3;
  for(const v of [base,left,ridge,tip,right]){vertices.push(v.x,v.y,v.z);colors.push(c.r,c.g,c.b);}
  indices.push(i,i+1,i+2,i+1,i+3,i+2,i,i+2,i+4,i+2,i+3,i+4);
 }
 function shoot(a,b,angle,young,extra=false){
  branch(a,b,Math.max(.0007,h*.00065));
  const axis=b.clone().sub(a),len=axis.length();if(len<.0001)return;axis.normalize();
  const lateral=V(-Math.sin(angle),.03,Math.cos(angle)).normalize();
  if(len>h*.025&&!extra)cards.push({a:a.clone(),b:b.clone(),angle,young});
  const n=Math.max(5,Math.min(18,Math.round(len/Math.max(.013,h*.0065))));
  for(let i=0;i<n;i++){const t=(i+.4)/n,p=a.clone().lerp(b,t);
   for(const sign of [-1,1]){
    const nd=axis.clone().multiplyScalar(.33+r()*.2).addScaledVector(lateral,sign*(.72+r()*.23)).add(V(0,.12+r()*.48,0)).normalize();
    const across=V(-nd.z,0,nd.x).normalize();
    const L=clamp(h*(.016+r()*.007)*(1-t*.22),.017,.072),W=L*(.065+r()*.025);
    const c=shades[Math.min(4,Math.floor(r()*5))].clone().multiplyScalar(young?1.07:.87+r()*.2);
    needle(p,nd,across,L,W,c);
    if(!extra&&i%2===0){const upper=nd.clone().add(V(0,.65,0)).normalize();needle(p,upper,across,L*.86,W*.89,c);}
   }
  }
 }
 // One living leader, layered asymmetrical radial branches, naturally open gaps.
 const tiers=18;
 for(let j=0;j<12;j++)branch(V(0,h*j/12,0),V(0,h*(j+1)/12,0),Math.max(h*.001,h*.012*(1-j/12)));
 for(let i=0;i<tiers;i++){
  const t=i/(tiers-1),y=h*(.095+t*.84+(r()-.5)*.017),a0=i*2.399+r()*.6;
  const envelope=Math.pow(1-t,.65)*(.91+.09*Math.sin(i*2.1));
  const arms= i>14?4:i%3===0?7:6;
  for(let j=0;j<arms;j++){
   const a=a0+j*Math.PI*2/arms+(r()-.5)*.22,L=rad*envelope*(.82+r()*.18);
   const start=V(0,y,0),mid=V(Math.cos(a)*L*.53,y-h*.012,Math.sin(a)*L*.53),tip=V(Math.cos(a)*L,y+h*(.008+r()*.024),Math.sin(a)*L);
   branch(start,mid,h*.0038*(1-t*.7));branch(mid,tip,h*.002*(1-t*.6));
   const count= i>14?6:11;
   for(let k=0;k<count;k++){
    const q=(k+.6)/count,p=q<.53?start.clone().lerp(mid,q/.53):mid.clone().lerp(tip,(q-.53)/.47);
    for(const sign of [-1,1]){
     const angle=a+sign*(.56+r()*.42),sl=L*(.30*(1-q)+.11)*(.8+r()*.35);
     const b=p.clone().add(V(Math.cos(angle)*sl,h*(.012+r()*.037),Math.sin(angle)*sl));
     const bz=Math.hypot(b.x,b.z),limit=rad*envelope*1.02;if(bz>limit&&bz>0){b.x*=limit/bz;b.z*=limit/bz;}
     shoot(p,b,angle,i>13);
     // Secondary branchlets grow from the outer half of real lateral shoots,
     // staggered vertically to prevent sparse, flat ladder-like foliage.
     if(i<15&&k%2===0){const base=p.clone().lerp(b,.48+r()*.2);const a2=angle+sign*(.57+r()*.35),l2=sl*(.4+r()*.3);const end=base.clone().add(V(Math.cos(a2)*l2,h*(.017+r()*.025),Math.sin(a2)*l2));const rr=Math.hypot(end.x,end.z);if(rr>limit&&rr>0){end.x*=limit/rr;end.z*=limit/rr;}shoot(base,end,a2,i>13,true);}
    }
   }
   shoot(mid,tip,a,i>10);
  }
 }
 for(let j=0;j<5;j++){const a=j*2.399;shoot(V(0,h*.92,0),V(Math.cos(a)*rad*.09,h*.99,Math.sin(a)*rad*.09),a,true)}
 const wood=woodTexture(T,'fir'),bm=new T.MeshStandardMaterial({map:wood,bumpMap:wood,bumpScale:.009,roughness:.96,metalness:0,envMapIntensity:.2});
 const stem=new T.InstancedMesh(new T.CylinderGeometry(.55,1,1,7),bm,branches.length),o=new T.Object3D(),up=V(0,1,0);
 branches.forEach(([a,b,w],i)=>{const delta=b.clone().sub(a);o.position.copy(a).addScaledVector(delta,.5);o.quaternion.setFromUnitVectors(up,delta.clone().normalize());o.scale.set(w,delta.length(),w);o.updateMatrix();stem.setMatrixAt(i,o.matrix)});
 stem.instanceMatrix.needsUpdate=true;stem.castShadow=true;stem.receiveShadow=true;stem.computeBoundingSphere();g.add(stem);
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();
 const leaves=new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.82,metalness:0,envMapIntensity:.24}));leaves.castShadow=false;leaves.receiveShadow=false;g.add(leaves);
 const atlas=needleAtlas(T),cardMat=new T.MeshStandardMaterial({map:atlas,alphaTest:.30,side:T.DoubleSide,roughness:.85,metalness:0,envMapIntensity:.22,depthWrite:true});
 const sprays=new T.InstancedMesh(new T.PlaneGeometry(1,1),cardMat,cards.length*2),dummy=new T.Object3D(),axis=V(0,1,0);
 let i=0;for(const card of cards){
  const v=card.b.clone().sub(card.a),length=v.length();
  dummy.position.copy(card.a).addScaledVector(v,.5);dummy.quaternion.setFromUnitVectors(axis,v.normalize());
  dummy.scale.set(Math.max(h*.035,length*.54),length*1.2,1);
  dummy.rotateY(card.angle);dummy.updateMatrix();sprays.setMatrixAt(i++,dummy.matrix);
  dummy.rotateY(Math.PI*.46);dummy.updateMatrix();sprays.setMatrixAt(i++,dummy.matrix);
 }
 sprays.instanceMatrix.needsUpdate=true;sprays.computeBoundingSphere();sprays.castShadow=true;sprays.receiveShadow=false;g.add(sprays);
 // Fit the actual mesh (including individual needles) to the saved dimensions.
 geo.computeBoundingBox();const b=geo.boundingBox,actual=Math.max(b.max.x-b.min.x,b.max.z-b.min.z);if(actual>0)g.scale.set(d/actual,1,d/actual);
 g.traverse(n=>{if(n.isMesh)n.userData.bundledSharedGeometry=true;});
 g.userData.species='ph-fir-sapling';g.userData.physicalHeight=h;g.userData.crownDiameter=d;g.userData.firNativeR25=true;g.userData.firNativeR26=true;g.userData.firHybridR28=true;g.name='FORMA detailed young fir';
 if(firCache.size<4){const template=g.clone(true);template.traverse(n=>{if(n.isMesh)n.material=n.material.clone()});firCache.set(key,template);}else g.traverse(n=>{if(n.isMesh)n.userData.bundledSharedGeometry=false;});
 return g;
}
