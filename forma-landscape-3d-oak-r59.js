/* FORMA oak R59: independent Quercus robur geometry, procedural tileable bark. */
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
 const size=512,make=()=>{const c=document.createElement('canvas');c.width=c.height=size;return c;};
 const bark=make(),normal=make(),rough=make(),b=bark.getContext('2d'),n=normal.getContext('2d'),q=rough.getContext('2d'),bi=b.createImageData(size,size),ni=n.createImageData(size,size),qi=q.createImageData(size,size),height=new Float32Array(size*size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size*TAU,v=y/size*TAU,warp=.43*Math.sin(v*3+u*4)+.18*Math.sin(v*9-u*5),a=21*u+warp,crack=Math.pow(Math.abs(Math.sin(a*.5)),.31),split=Math.pow(Math.abs(Math.sin(39*u+v*2+.8*Math.sin(v*5+u*3))),.24),cross=Math.pow(Math.abs(Math.sin(v*12+u*4+1.2*Math.sin(u*7))),.22);
  height[y*size+x]=.57*crack+.19*split+.11*cross+.06*Math.sin(83*u+v*23)*Math.sin(v*61-u*13)+.07*Math.sin(u*8+v*6);
 }
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=y*size+x,k=i*4,h=height[i],c=42+100*Math.max(0,h),dx=(height[y*size+(x+1)%size]-height[y*size+(x+size-1)%size])*3,dy=(height[((y+1)%size)*size+x]-height[((y+size-1)%size)*size+x])*3,l=Math.hypot(dx,dy,1);
  bi.data.set([c*1.04,c,c*.89,255],k);ni.data.set([128-127*dx/l,128+127*dy/l,128+127/l,255],k);const g=220+30*(1-h);qi.data.set([g,g,g,255],k);
 }
 b.putImageData(bi,0,0);n.putImageData(ni,0,0);q.putImageData(qi,0,0);
 const tex=(c,srgb=false)=>{const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;if(srgb)t.colorSpace=T.SRGBColorSpace;return t;};
 const result={bark:tex(bark,true),normal:tex(normal),rough:tex(rough)};cache.set(T,result);return result;
}
function oakLeaf(T){
 const edge=[[0,-.5],[-.13,-.36],[-.27,-.29],[-.30,-.19],[-.13,-.16],[-.36,-.05],[-.37,.06],[-.17,.10],[-.32,.23],[-.29,.32],[-.10,.30],[-.14,.43],[0,.5]];
 const outline=[...edge,...edge.slice(1,-1).reverse().map(([x,y])=>[-x,y])],pos=[0,0,.075],colors=[.79,.83,.64],idx=[];
 for(const [x,y] of outline){pos.push(x,y,-.09*Math.abs(x)+.04*y*y);colors.push(.95,.98,.85);}
 for(let i=0;i<outline.length;i++)idx.push(0,i+1,(i+1)%outline.length+1);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
export function createNaturalOak(T,o,{season='summer'}={}){
 const p=oakStage(o.oak?.age),h=Number(o.height)||p.height,R=(Number(o.diameter)||p.diameter)/2,mobile=typeof window!=='undefined'&&window.innerWidth<=850,r=random('oak-r59|'+o.id+'|'+o.variant+'|'+p.age),g=new T.Group(),V=(x,y,z)=>new T.Vector3(x,y,z),polar=(a,d,y)=>V(Math.cos(a)*d,y,Math.sin(a)*d),curve=pts=>new T.CatmullRomCurve3(pts,false,'centripetal'),wood={pos:[],uv:[],idx:[]},leaves=[];
 function tube(c,steps,sides,base,tip,root=false){const pts=c.getPoints(steps),first=wood.pos.length/3,phase=r()*TAU;let U=null,len=0;for(let i=0;i<=steps;i++){const t=i/steps,a=pts[i],axis=pts[Math.min(steps,i+1)].clone().sub(pts[Math.max(0,i-1)]).normalize(),ref=Math.abs(axis.y)>.93?V(1,0,0):V(0,1,0);U=U?U.clone().addScaledVector(axis,-U.dot(axis)):V(0,0,0).crossVectors(axis,ref);if(U.lengthSq()<1e-8)U.crossVectors(axis,ref);U.normalize();const W=V(0,0,0).crossVectors(axis,U).normalize();if(i)len+=a.distanceTo(pts[i-1]);const radius=(tip+(base-tip)*Math.pow(1-t,1.22))*(1+(root?.5:.25)*Math.exp(-t*22));for(let j=0;j<=sides;j++){const ang=j/sides*TAU,rr=radius*(1+.075*Math.sin(ang*5+phase+t*5)+.032*Math.sin(ang*11+t*39));const v=a.clone().addScaledVector(U,rr*Math.cos(ang)).addScaledVector(W,rr*Math.sin(ang));wood.pos.push(v.x,v.y,v.z);wood.uv.push(j/sides*Math.max(1,Math.round(base*TAU/.85)),len/1.65);if(i&&j<sides){const k=first+(i-1)*(sides+1)+j,m=k+sides+1;wood.idx.push(k,k+1,m,k+1,m+1,m);}}}}
 const trunk=curve([V(0,-.04,0),V(-p.bend*.2,h*.16,0),V(p.bend*.30,h*.34,p.bend*.22),V(p.bend*.62,h*.56,-p.bend*.28),V(-p.bend*.36,h*.79,p.bend*.15),V(p.bend*.25,h*.98,0)]);tube(trunk,70,32,p.radius,.012,true);
 for(let i=0;i<7;i++){const a=i*TAU/7+r()*.4,d=p.radius*(1.7+r()*1.2);tube(curve([V(0,p.radius*.85,0),polar(a,d*.42,p.radius*.24),polar(a,d,-.03)]),12,10,p.radius*.33,.015,true);}
 function twig(a,az,L,rise){const end=a.clone().add(polar(az,L,rise)),c=curve([a,a.clone().add(polar(az+.24,L*.35,rise*.4)),a.clone().add(polar(az-.21,L*.68,rise*.85)),end]);tube(c,6,5,.007,.001);if(season==='winter')return;const n=Math.max(6,Math.min(mobile?18:27,Math.round(c.getLength()/(mobile?.064:.047))));for(let i=0;i<n;i++){const t=(i+.4)/n,origin=c.getPoint(t),ang=az+(i%2?1:-1)*(.65+r()*1.15),dir=polar(ang,.7+r()*.3,(r()-.53)*.9).normalize(),size=.083+r()*.055;leaves.push({origin,dir,size,roll:(r()-.5)*2.8,shade:r()});}}
 for(let i=0;i<p.limbs;i++){
  const u=i/(p.limbs-1),t=Math.min(.93,p.start+u*(.91-p.start)+(r()-.5)*.07),a=trunk.getPoint(t),az=i*2.39996+(r()-.5)*.65,rad=R*Math.pow(Math.sin(Math.PI*(.13+.80*u)),.75)*(.77+r()*.22),rise=h*(.12+.12*r())*(1-.57*u),end=a.clone().add(polar(az,rad,rise*.78));end.y=Math.min(h*.99,end.y);
  const swing=(i%2?1:-1)*(.21+r()*.14),side=polar(az+Math.PI/2,rad*swing,0),main=curve([a,a.clone().add(polar(az,rad*.15,rise*.34)).addScaledVector(side,.4),a.clone().add(polar(az,rad*.42,rise*.58)).addScaledVector(side,1),a.clone().add(polar(az,rad*.73,rise*.98)).addScaledVector(side,-.3),end]);
  tube(main,35,18,p.radius*(.46-.34*u)*(.82+r()*.28),.009);
  const ns=mobile?7:9;
  for(let j=0;j<ns;j++){const f=.21+j*.76/(ns-1),b=main.getPoint(f),theta=az+(j%2?1:-1)*(.52+r()*.95),span=R*(.18+r()*.16)*(1-.42*u)*(.68+.32*Math.sin(Math.PI*f)),up=h*(.035+r()*.055),e=b.clone().add(polar(theta,span,up));e.y=Math.min(h*.995,e.y);const sec=curve([b,b.clone().add(polar(theta+.29,span*.31,up*.30)),b.clone().add(polar(theta-.22,span*.69,up*.75)),e]);tube(sec,17,8,Math.max(.018,p.radius*.125*(1-f*.75)*(1-u*.45)),.004);
   const nt=mobile?7:10;for(let k=0;k<nt;k++){const q=sec.getPoint(.16+k*.81/(nt-1)),angle=theta+(k%2?1:-1)*(.6+r()*1.1),len=R*(.075+r()*.095)*(1-.35*u);twig(q,angle,len,len*(.12+r()*.50));if(k%2===0)twig(q,angle+1.65,len*.68,len*(.08+r()*.35));}
  }
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(wood.pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(wood.uv,2));geo.setIndex(wood.idx);geo.computeVertexNormals();const tex=maps(T),mat=new T.MeshStandardMaterial({map:tex.bark,normalMap:tex.normal,normalScale:new T.Vector2(1.35,1.35),roughnessMap:tex.rough,roughness:1,color:'#c0b7a5',side:T.DoubleSide}),m=new T.Mesh(geo,mat);m.castShadow=m.receiveShadow=true;m.name='Oak R59 fissured bark';g.add(m);
 if(leaves.length){const leafMat=new T.MeshStandardMaterial({color:'#c7cbb4',vertexColors:true,roughness:.84,side:T.DoubleSide,emissive:'#606e46',emissiveIntensity:.075}),mesh=new T.InstancedMesh(oakLeaf(T),leafMat,leaves.length),obj=new T.Object3D(),Y=V(0,1,0),palette=(season==='autumn'?['#a49a60','#ba995c','#a58853']:['#81945c','#92a36b','#788c58','#a2ad76']).map(x=>new T.Color(x));leaves.forEach((f,i)=>{obj.position.copy(f.origin).addScaledVector(f.dir,f.size*.43);obj.quaternion.setFromUnitVectors(Y,f.dir);obj.rotateY(f.roll);obj.scale.set(f.size*.9,f.size,f.size);obj.updateMatrix();mesh.setMatrixAt(i,obj.matrix);mesh.setColorAt(i,palette[Math.min(palette.length-1,Math.floor(f.shade*palette.length))]);});mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();mesh.castShadow=mesh.receiveShadow=true;mesh.name='Oak R59 individually lobed leaves';g.add(mesh);}
 g.userData.nativeOakR59=true;g.userData.oakAge=p.age;g.userData.trunkDiameter=p.radius*2;g.userData.leafCount=leaves.length;g.userData.primaryBranches=p.limbs;g.userData.physicalHeight=h;return g;
}
