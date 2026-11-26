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
 for(const [age,tex] of ageBarkCache)paintAgeBark(T,age,tex);
 redraw();
}

function rng(s){let x=2166136261;for(const c of String(s)){x=Math.imul(x^c.charCodeAt(0),16777619)}return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296}}
function clamp(x,a,b){return Math.min(b,Math.max(a,x))}
export function woodTexture(T,type='fir'){
 if(cache.has(type))return cache.get(type);
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=1024;
 const c=canvas.getContext('2d'),r=rng(type),bark=type==='fir';
 c.fillStyle=bark?'#77736a':'#a48a6b';c.fillRect(0,0,512,1024);
 for(let i=0;i<6500;i++){const x=r()*512,y=r()*1024,l=7+r()*(bark?80:240);
  c.strokeStyle=r()<.48?(bark?'rgba(42,39,34,.23)':'rgba(65,42,23,.22)'):'rgba(236,221,195,.16)';
  c.lineWidth=.4+r()*1.8;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+(r()-.5)*5,y+l*.3,x+(r()-.5)*7,y+l*.7,x+(r()-.5)*4,y+l);c.stroke();
 }
 if(bark)for(let i=0;i<340;i++){const x=r()*512,y=r()*1024;c.fillStyle='rgba(40,35,30,.24)';c.beginPath();c.ellipse(x,y,1+r()*2,2+r()*6,.3,0,Math.PI*2);c.fill()}
 else for(let i=0;i<5;i++){const x=30+r()*196,y=r()*512;for(let j=1;j<8;j++){c.strokeStyle='rgba(74,49,29,.12)';c.beginPath();c.ellipse(x,y,j*1.8,j*6,.04,0,Math.PI*2);c.stroke()}}
 const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;cache.set(type,t);return t;
}
export function firStage(age){const a=Number(age);return a===10?{age:10,height:3.5,diameter:2.5,tiers:15,base:.07,top:.96,trunk:.012,spread:.75}:a===100?{age:100,height:27,diameter:10.5,tiers:27,base:.24,top:.91,trunk:.016,spread:.44}:{age:45,height:15,diameter:6.8,tiers:23,base:.12,top:.95,trunk:.012,spread:.60};}
function firLight(T,m){
 m.onBeforeCompile=shader=>{
  const physical=T.ShaderChunk.lights_physical_pars_fragment;
  const needle=/reflectedLight\.directDiffuse\s*\+=\s*irradiance\s*\*\s*BRDF_Lambert\(\s*material\.diffuseColor\s*\)\s*;/;
  if(physical&&needle.test(physical))shader.fragmentShader=shader.fragmentShader.replace('#include <lights_physical_pars_fragment>',physical.replace(needle,a=>a+`
   float firBack=max(0.0,dot(-geometryNormal,directLight.direction));
   reflectedLight.directDiffuse+=directLight.color*BRDF_Lambert(material.diffuseColor)*firBack*.24*vec3(.91,1.,.82);
  `));
 };m.customProgramCacheKey=()=> 'forma-fir-transmission-r96';
}
function cloneFirMaterial(m){const copy=m.clone();copy.onBeforeCompile=m.onBeforeCompile;copy.customProgramCacheKey=m.customProgramCacheKey;return copy;}

// Continuous tapered woody tubes. Every path has shared rings, continuous UVs
// and smooth normals; branch starts penetrate their supporting parent.
function woodyBuilder(T){
 const p=[],uv=[],idx=[],V=(x,y,z)=>new T.Vector3(x,y,z);
 function tube(points,radii,sides,seed,rough=0,uvScale=1){
  const first=p.length/3;let length=0;
  for(let j=0;j<points.length;j++){
   const point=points[j],tangent=points[Math.min(j+1,points.length-1)].clone().sub(points[Math.max(0,j-1)]).normalize();
   const helper=Math.abs(tangent.y)>.93?V(1,0,0):V(0,1,0),u=helper.clone().cross(tangent).normalize(),v=tangent.clone().cross(u).normalize();
   if(j)length+=point.distanceTo(points[j-1]);
   for(let k=0;k<=sides;k++){
    const a=(k%sides)/sides*Math.PI*2,rr=radii[j]*(1+rough*(.55*Math.sin(a*5+seed+j*.19)+.30*Math.sin(a*9-seed+j*.33)));
    const q=point.clone().addScaledVector(u,Math.cos(a)*rr).addScaledVector(v,Math.sin(a)*rr);
    p.push(q.x,q.y,q.z);uv.push(k/sides*Math.max(.25,radii[0]*6),length*uvScale);
   }
   if(j)for(let k=0;k<sides;k++){const a=first+(j-1)*(sides+1)+k,b=a+sides+1;idx.push(a,a+1,b,a+1,b+1,b);}
  }
  // close tiny terminal cross section
  const tip=p.length/3,last=points[points.length-1];p.push(last.x,last.y,last.z);uv.push(.5,length*uvScale);
  const ring=first+(points.length-1)*(sides+1);for(let k=0;k<sides;k++)idx.push(ring+k,ring+k+1,tip);
 }
 function geometry(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();g.computeBoundingSphere();return g;}
 return {tube,geometry};
}
const ageBarkCache=new Map();
function ageBark(T,age){
 if(ageBarkCache.has(age))return ageBarkCache.get(age);
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=1024;
 const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;
 ageBarkCache.set(age,t);paintAgeBark(T,age,t);return t;
}
function paintAgeBark(T,age,t){
 const c=t.image.getContext('2d'),r=rng('fir-bark-'+age),old=age===100;
 c.fillStyle=old?'#777369':age===10?'#9b998a':'#858174';c.fillRect(0,0,512,1024);
 c.globalAlpha=.65;c.drawImage(woodTexture(T,'fir').image,0,0,512,1024);c.globalAlpha=1;
 if(age!==10)for(let k=0;k<(old?80:36);k++){
  const x=r()*512,y=r()*1024,L=35+r()*(old?240:95),w=(old?1.6:.65)+r()*(old?3.8:1.1);
  const path=()=>{c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+(r()-.5)*12,y+L*.27,x+(r()-.5)*18,y+L*.7,x+(r()-.5)*10,y+L);};
  path();c.strokeStyle='rgba(48,43,37,.58)';c.lineWidth=w;c.stroke();c.save();c.translate(w*.75,0);c.strokeStyle='rgba(190,180,158,.32)';c.lineWidth=w*.6;c.stroke();c.restore();
 }
 if(age===10)for(let i=0;i<180;i++){c.fillStyle='rgba(76,74,63,.22)';c.beginPath();c.ellipse(r()*512,r()*1024,1+r()*4,.7+r()*1.6,0,0,Math.PI*2);c.fill();}
 t.needsUpdate=true;
}

export function createDetailedFir(T,instance){
 const stage=firStage(instance.fir?.age??(Number(instance.height)<6?10:45)),old=stage.age===100,youngTree=stage.age===10;
 const h=clamp(Number(instance.height)||3,.25,40),d=clamp(Number(instance.diameter)||2,.2,30),rad=d/2;
 const variant=clamp(Math.round(Number(instance.variant)||1),1,3),key=h.toFixed(3)+'|'+d.toFixed(3)+'|'+variant+'|'+stage.age;
 const cached=firCache.get(key);if(cached){const copy=cached.clone(true);copy.traverse(n=>{if(n.isMesh)n.material=cloneFirMaterial(n.material)});return copy;}
 const r=rng('fir-r96|'+variant+'|'+stage.age),g=new T.Group();
 const branches=[],vertices=[],colors=[],indices=[],cards=[];let needleCount=0;const woodMesh=woodyBuilder(T),trunkMesh=woodyBuilder(T);
 const shades=['#455b43','#50684b','#607253','#71835c','#52694d'].map(c=>new T.Color(c));
 const V=(x,y,z)=>new T.Vector3(x,y,z);
 function branch(a,b,w){if(a.distanceTo(b)>.0001)branches.push([a,b,w]);}
 function trunkAt(t){return V(h*.003*Math.sin(t*4.4)*t,h*t,h*.0027*Math.sin(t*6.2)*t);}
 const trunkPoints=[],trunkRadii=[];
 for(let j=0;j<=64;j++){const t=j/64;trunkPoints.push(trunkAt(t));trunkRadii.push(Math.max(.002,h*stage.trunk*Math.pow(1-t,.83))*(1+(old?.55:.22)*Math.exp(-t*45)));}
 trunkMesh.tube(trunkPoints,trunkRadii,old?28:24,variant,old?.11:.045,1.4);
 for(let k=0;k<(old?7:4);k++){const a=k*2.399963,rr=trunkRadii[0];const p0=V(Math.cos(a)*rr*.42,rr*.8,Math.sin(a)*rr*.42),p1=V(Math.cos(a)*rr*1.35,rr*.16,Math.sin(a)*rr*1.35),p2=V(Math.cos(a)*rr*2.1,-.012,Math.sin(a)*rr*2.1);trunkMesh.tube([p0,p1,p2],[rr*.30,rr*.20,.006],10,k,.08,1.4);}
 function needle(base,dir,side,len,width,c){
  if(r()>(youngTree?.85:old?.43:.55)||needleCount>=130000)return;
  const normal=new T.Vector3().crossVectors(dir,side).normalize(),bend=(r()-.35)*len*.17;
  const i=vertices.length/3;
  // Two curved cross-sections and a narrow tip; true folded needle with underside.
  for(const t of [0,.34,.72,1]){
   const center=base.clone().addScaledVector(dir,len*t).addScaledVector(normal,bend*t*t);
   const w=width*(t===0?.38:t===1?.07:1-t*.35);
   for(let k=0;k<3;k++){
    const v=center.clone().addScaledVector(side,(k-1)*w).addScaledVector(normal,k===1?w*.30:0);
    vertices.push(v.x,v.y,v.z);const tint=(.83+.17*t)*(k===1?1.05:.96);colors.push(c.r*tint,c.g*tint,c.b*tint);
   }
  }
  for(let j=0;j<3;j++)for(let k=0;k<2;k++){const a=i+j*3+k,b=a+3;indices.push(a,b,a+1,a+1,b,b+1);}
  needleCount++;
 }
 function shoot(a,b,angle,young,extra=false){
  branch(a,b,Math.max(.0007,Math.min(.007,h*.00055)));
  const axis=b.clone().sub(a),len=axis.length();if(len<.0001)return;axis.normalize();
  const lateral=V(-Math.sin(angle),.03,Math.cos(angle)).normalize();
  // Short overlapping sprays preserve needle scale instead of one oversized flat fern.
  if(len>.05){const pieces=Math.min(7,Math.max(1,Math.ceil(len/.19)));for(let j=0;j<pieces;j++){const t0=j/pieces,t1=Math.min(1,(j+1.16)/pieces);cards.push({a:a.clone().lerp(b,t0),b:a.clone().lerp(b,t1),angle:angle+(r()-.5)*.8,young});}}
  const n=Math.max(7,Math.min(24,Math.round(len/.019)));
  for(let i=0;i<n;i++){const t=(i+.4)/n,p=a.clone().lerp(b,t);
   for(const sign of [-1,1]){
    const nd=axis.clone().multiplyScalar(.25+r()*.35).addScaledVector(lateral,sign*(.55+r()*.40)).add(V(0,-.25+r()*.95,0)).normalize();
    const across=V(-nd.z,0,nd.x).normalize();
    const L=(.022+r()*.023)*(1-t*.15),W=L*(.045+r()*.020);
    const c=shades[Math.min(4,Math.floor(r()*5))].clone().multiplyScalar(young&&t>.55?1.14:.92+r()*.17);
    needle(p,nd,across,L,W,c);
    if(!extra&&i%2===0){const upper=nd.clone().add(V(0,.85,0)).normalize();needle(p,upper,across,L*.86,W*.89,c);}
   }
  }
 }
 // One living leader, layered asymmetrical radial branches, naturally open gaps.
 const tiers=stage.tiers;
 // Trunk built as a single indexed surface above.
 for(let i=0;i<tiers;i++){
  const t=i/(tiers-1),y=h*(stage.base+t*(stage.top-stage.base)+(r()-.5)*.014),a0=i*2.399+r()*.65;
  const envelope=Math.pow(Math.max(.012,1-t),stage.spread)*(.90+.10*Math.sin(i*2.1))*(old?(.75+.25*Math.sin(Math.PI*Math.min(1,t+.16))):1);
  const arms=t>.83?4:5+Math.floor(r()*3);
  for(let j=0;j<arms;j++){
   const a=a0+j*Math.PI*2/arms+(r()-.5)*.22,L=rad*envelope*(.82+r()*.18);
   const droop=(old?.034:youngTree?.008:.019)*(1-t),lift=(old?.012:.022)+r()*.012;const start=trunkAt(y/h),mid=V(start.x+Math.cos(a)*L*.53,y-h*droop,start.z+Math.sin(a)*L*.53),tip=V(start.x+Math.cos(a)*L,y+h*(lift-droop*.45),start.z+Math.sin(a)*L);
   const curve=new T.QuadraticBezierCurve3(start,mid.clone().multiplyScalar(2).addScaledVector(start,-.5).addScaledVector(tip,-.5),tip);const path=curve.getPoints(8),baseW=h*.0032*(1-t*.72);woodMesh.tube(path,path.map((_,k)=>Math.max(.0006,baseW*Math.pow(1-k/8,.83))*(k===0?1.32:1)),10,i+j,.045,1.7);
   const count=t>.83?7:youngTree?12:13;
   for(let k=0;k<count;k++){
    const q=(k+.6)/count,p=curve.getPoint(q);
    for(const sign of [-1,1]){
     const angle=a+sign*(.56+r()*.42),sl=L*(.30*(1-q)+.11)*(.8+r()*.35);
     const b=p.clone().add(V(Math.cos(angle)*sl,Math.min(L*.17,h*(.009+r()*.026)),Math.sin(angle)*sl));
     const bz=Math.hypot(b.x,b.z),limit=rad*envelope*1.02;if(bz>limit&&bz>0){b.x*=limit/bz;b.z*=limit/bz;}
     shoot(p,b,angle,t>.72||r()<.18);
     // Secondary branchlets grow from the outer half of real lateral shoots,
     // staggered vertically to prevent sparse, flat ladder-like foliage.
     if(t<.83&&(k%2===0||r()<.22)){const base=p.clone().lerp(b,.48+r()*.2);const a2=angle+sign*(.57+r()*.35),l2=sl*(.4+r()*.3);const end=base.clone().add(V(Math.cos(a2)*l2,Math.min(L*.13,h*(.010+r()*.018)),Math.sin(a2)*l2));const rr=Math.hypot(end.x,end.z);if(rr>limit&&rr>0){end.x*=limit/rr;end.z*=limit/rr;}shoot(base,end,a2,t>.72,true);if(k%4===0){const pp=p.clone().lerp(b,.68),aa=a2+sign*.8,ee=pp.clone().add(V(Math.cos(aa)*l2*.65,l2*.55,Math.sin(aa)*l2*.65));shoot(pp,ee,aa,t>.65,true);}}
    }
   }
   shoot(curve.getPoint(.84),tip,a,t>.72);
  }
 }
 for(let j=0;j<(old?7:5);j++){const a=j*2.399;shoot(trunkAt(old?.89:.92),V(Math.cos(a)*rad*(old?.15:.065),h*(old?.96+r()*.035:.99),Math.sin(a)*rad*(old?.15:.065)),a,true)}
 const wood=ageBark(T,stage.age),bm=new T.MeshStandardMaterial({map:wood,bumpMap:wood,bumpScale:old?.032:youngTree?.004:.015,roughness:.93,metalness:0,envMapIntensity:.30});
 branches.forEach(([a,b,w],i)=>{const mid=a.clone().lerp(b,.5);mid.y-=a.distanceTo(b)*.035;woodMesh.tube([a,mid,b],[w,w*.57,Math.max(.00015,w*.06)],5,i,0,2);});
 const trunk=new T.Mesh(trunkMesh.geometry(),bm);trunk.name='fir-continuous-trunk';trunk.castShadow=true;trunk.receiveShadow=true;g.add(trunk);
 const stem=new T.Mesh(woodMesh.geometry(),bm.clone());stem.name='fir-curved-branches';stem.castShadow=true;stem.receiveShadow=true;g.add(stem);
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();
 const leaves=new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.78,metalness:0,envMapIntensity:.50}));firLight(T,leaves.material);leaves.name='fir-needle-leaves';leaves.castShadow=false;leaves.receiveShadow=false;g.add(leaves);
 const atlas=needleAtlas(T),cardMat=new T.MeshStandardMaterial({map:atlas,alphaTest:.37,side:T.DoubleSide,roughness:.84,metalness:0,envMapIntensity:.44,depthWrite:true});
 firLight(T,cardMat);
 const sprayGeo=new T.PlaneGeometry(1,1,2,2);const sp=sprayGeo.attributes.position;for(let j=0;j<sp.count;j++)sp.setZ(j,.15*Math.sin((sp.getY(j)+.5)*Math.PI)*Math.abs(sp.getX(j))*2);sprayGeo.computeVertexNormals();const sprays=new T.InstancedMesh(sprayGeo,cardMat,cards.length*2),dummy=new T.Object3D(),axis=V(0,1,0);
 let i=0;for(const card of cards){
  const v=card.b.clone().sub(card.a),length=v.length();
  dummy.position.copy(card.a).addScaledVector(v,.5);dummy.quaternion.setFromUnitVectors(axis,v.normalize());
  dummy.scale.set(Math.min(.13,Math.max(.055,length*.53)),length*1.12,.065);
  dummy.rotateY(card.angle);dummy.updateMatrix();sprays.setMatrixAt(i++,dummy.matrix);
  dummy.rotateY(Math.PI*.43);dummy.updateMatrix();sprays.setMatrixAt(i++,dummy.matrix);
 }
 sprays.name='fir-foliage-sprays';sprays.instanceMatrix.needsUpdate=true;sprays.computeBoundingSphere();sprays.castShadow=true;sprays.receiveShadow=false;g.add(sprays);
 if(!youngTree){
  const coneCount=old?30:18,coneGeo=new T.LatheGeometry([new T.Vector2(0,0),new T.Vector2(.028,.012),new T.Vector2(.042,.055),new T.Vector2(.038,.115),new T.Vector2(.022,.145),new T.Vector2(0,.157)],10);
  const coneMat=new T.MeshStandardMaterial({color:'#77664b',roughness:.92,metalness:0,map:wood,bumpMap:wood,bumpScale:.0018});
  const cones=new T.InstancedMesh(coneGeo,coneMat,coneCount),p=new T.Object3D();
  for(let k=0;k<coneCount;k++){const a=k*2.399963,y=h*(.70+r()*.17),rr=rad*(.14+r()*.18);p.position.set(Math.cos(a)*rr,y,Math.sin(a)*rr);p.rotation.set(0,a,0);p.scale.setScalar(.75+r()*.45);p.updateMatrix();cones.setMatrixAt(k,p.matrix);}
  cones.name='fir-upright-cones';cones.instanceMatrix.needsUpdate=true;cones.computeBoundingSphere();g.add(cones);
 }
 // Fit the actual mesh (including individual needles) to the saved dimensions.
 geo.computeBoundingBox();const b=geo.boundingBox,actual=Math.max(b.max.x-b.min.x,b.max.z-b.min.z);if(actual>0)g.scale.set(d/actual,1,d/actual);
 g.traverse(n=>{if(n.isMesh)n.userData.bundledSharedGeometry=true;});
 g.userData.species='ph-fir-sapling';g.userData.physicalHeight=h;g.userData.crownDiameter=d;g.userData.firNativeR25=true;g.userData.firNativeR26=true;g.userData.firHybridR28=true;g.userData.firAge=stage.age;g.userData.firR93=true;g.userData.firR94=true;g.userData.firR96=true;g.userData.needleCount=needleCount;g.userData.continuousTrunk=true;g.name='FORMA fir · '+stage.age;
 if(firCache.size<2){const template=g.clone(true);template.traverse(n=>{if(n.isMesh)n.material=cloneFirMaterial(n.material)});firCache.set(key,template);}else g.traverse(n=>{if(n.isMesh)n.userData.bundledSharedGeometry=false;});
 return g;
}
