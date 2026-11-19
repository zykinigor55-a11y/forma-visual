/* FORMA / CODEX 3D Botany v1 · 100% geometry in Three.js.
 * Scots pine + silver birch. No billboards, composited 2D PNG crowns, or
 * proprietary downloaded tree mesh. Independent vertex-based bark, curved
 * tapered branches, true 3D needles and physical 3D leaf geometry.
 * Copyright © FORMA — generated source, editable by the user.
 */
const CROWN_TYPES=['solitary','forest','garden'];
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
function hash(s){let h=2166136261;for(const c of String(s)){h=Math.imul(h^c.charCodeAt(0),16777619)}return h>>>0}
function seeded(seed){let a=seed>>>0;return()=>{a=(a+0x6d2b79f5)>>>0;let t=Math.imul(a^(a>>>15),1|a);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296}}
const lerp=(a,b,t)=>a+(b-a)*t;
function barkTexture(T,species){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 const data=ctx.createImageData(256,512),pixels=data.data,rand=seeded(species==='pine'?0x96bacace:0x323bcaab);
 const column=new Float32Array(256);
 for(let x=0;x<256;x++)column[x]=rand()-.5;
 for(let y=0;y<512;y++){
  for(let x=0;x<256;x++){
   const i=(y*256+x)*4;
   const grooved=(Math.sin(x*.265+Math.sin(y*.025)*2.2)+Math.sin(x*.093-y*.011)*.6);
   const fine=Math.sin(x*.78+y*.015)*.32;
   const fleck=(rand()-.5)*19;
   if(species==='pine'){
    const crevice=Math.max(0,Math.sin(x*.34+Math.sin(y*.021)*1.5))**9;
    const glow=Math.sin(y*.035+x*.045)*5;
    const base=column[x]*18+grooved*10+fine*6+fleck+glow-crevice*37;
    pixels[i]=clamp(113+base,31,192);
    pixels[i+1]=clamp(83+base*.76,22,144);
    pixels[i+2]=clamp(64+base*.59,18,117);
   }else{
    // Silver birch: lateral lenticels and vertical scaly seams;
    // the dark scars are strongly interrupted, never continuous bands.
    const lenticel=Math.sin(y*.46+x*.019+Math.sin(x*.06))>.94&&
     Math.sin(x*.065+y*.011)>.10;
    const scar=lenticel?-90:0,base=grooved*3+column[x]*12+fleck*.55+scar;
    pixels[i]=clamp(219+base,50,243);
    pixels[i+1]=clamp(216+base,44,241);
    pixels[i+2]=clamp(201+base,38,228);
   }
   pixels[i+3]=255;
  }
 }
 ctx.putImageData(data,0,0);
 const tex=new T.CanvasTexture(canvas);
 tex.colorSpace=T.SRGBColorSpace;
 tex.wrapS=tex.wrapT=T.RepeatWrapping;
 tex.repeat.set(species==='pine'?2.2:1.3,species==='pine'?3.4:4.2);
 tex.anisotropy=4;
 return tex;
}
function batchTubeGeometry(T,paths){
 const positions=[],uv=[],indices=[];
 for(const spec of paths){
  const pts=spec.points;if(pts.length<2)continue;
  const count=pts.length,radial=spec.radial||6,base=positions.length/3;
  const dir=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
  let length=0;
  for(let k=0;k<count;k++){
   const point=pts[k];
   dir.copy(pts[Math.min(count-1,k+1)]).sub(pts[Math.max(0,k-1)]).normalize();
   b.set(0,0,1);if(Math.abs(dir.dot(b))>.85)b.set(1,0,0);
   b.cross(dir).normalize();c.crossVectors(dir,b).normalize();
   if(k)length+=pts[k].distanceTo(pts[k-1]);
   const t=k/(count-1),r=lerp(spec.radius,spec.endRadius??spec.radius*.14,t);
   for(let j=0;j<=radial;j++){
    const theta=j/radial*2*Math.PI;
    const v=point.clone().addScaledVector(b,Math.cos(theta)*r).addScaledVector(c,Math.sin(theta)*r);
    positions.push(v.x,v.y,v.z);
    uv.push(j/radial,length*2);
   }
  }
  for(let k=0;k<count-1;k++)for(let j=0;j<radial;j++){
   const a=base+k*(radial+1)+j,d=a+radial+1;
   indices.push(a,d,a+1,d,d+1,a+1);
  }
 }
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 g.setIndex(indices);
 g.computeVertexNormals();g.computeBoundingSphere();
 return g;
}
function needlePair(T){
 const positions=[],normals=[],indices=[];
 for(let needle=0;needle<2;needle++){
  const side=needle?1:-1,base=positions.length/3;
  const coordinates=[
   [0,0,0],[side*.003,.018,.004],
   [side*.018,.064,.007],[side*.03,.104,.011],
   [side*.003,.019,-.003],[side*.016,.062,-.003]
  ];
  for(const [x,y,z]of coordinates){positions.push(x,y,z);normals.push(0,0,1)}
  indices.push(base,base+1,base+4,base+1,base+2,base+4,
   base+4,base+2,base+5,base+2,base+3,base+5,
   base,base+4,base+1,base+1,base+4,base+2,
   base+4,base+5,base+2,base+2,base+5,base+3);
 }
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 g.setIndex(indices);g.computeVertexNormals();return g;
}
function birchLeaf(T){
 // Physically oriented, slightly bent three-dimensional diamond leaf with
 // a central ridge. This geometry NEVER rotates to face the camera.
 const p=[
  0,0,0, -.033,.027,.006, 0,.061,.012, .031,.029,.006,
  0,.032,-.005, 0,.084,.001
 ];
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(p,3));
 g.setIndex([0,1,4,1,2,4,4,2,3,4,3,0,1,5,2,2,5,3]);
 g.computeVertexNormals();return g;
}
function mainAxis(T,H,rnd,species){
 const p=[];
 for(let i=0;i<=28;i++){
  const t=i/28,curve=(species==='pine'?.13:.21);
  p.push(new T.Vector3(Math.sin(t*5.1+.2)*curve*t*t,
   H*t,Math.sin(t*4.3+.75)*curve*t*t));
 }
 return p;
}
function addPath(T,list,points,radius,to,radial=6){
 list.push({points,radius,endRadius:to,radial});
}
function createCodeTree(T,tree,{quality='standard'}={}){
 const species=tree?.catalogId;
 if(species!=='pine'&&species!=='birch')throw Error('Code3D supported species: pine, birch');
 const pine=species==='pine',H=clamp(Number(tree.height)||14,2,40);
 const D=clamp(Number(tree.diameter)||6.5,.5,30),R=D*.5;
 const q=quality==='high'?1:quality==='speed'?.5:.77;
 const type=CROWN_TYPES.includes(tree?.pine?.pineType)?tree.pine.pineType:'solitary';
 const age=clamp(Number(tree?.pine?.age)||40,3,150);
 const start=pine?(type==='forest'?.47:type==='garden'?.23:.32):.24;
 const crownBase=H*(pine?start*(age<18?.83:1):start);
 const rootSeed=hash((tree.id||'tree')+'-'+species+'-'+(tree.variant||1)+'-'+type);
 const rand=seeded(rootSeed);
 const root=new T.Group();root.name='FORMA Code3D · '+(pine?'Scots pine':'Silver birch');
 const trunkPath=mainAxis(T,H,rand,species);
 const woody=[],mainwood=[];
 addPath(T,mainwood,trunkPath,H*(pine?.019:.013),.012,10);
 const tips=[];
 const whorls=Math.round((pine?19:24)*Math.sqrt(H/14)),up=new T.Vector3(0,1,0);
 let outerBranches=0;
 for(let j=0;j<whorls;j++){
  const t=(j+rand()*.44)/whorls,y=crownBase+(H-crownBase)*t;
  if(y>=H*.97)continue;
  const n=pine?3+(rand()>.43?1:0):2+(rand()>.37?1:0);
  for(let b=0;b<n;b++){
   const ang=(j*.59+b/n)*2*Math.PI+(rand()-.5)*.40;
   const dir=new T.Vector3(Math.cos(ang),0,Math.sin(ang));
   const shape=pine?Math.pow(1-t,.6):Math.pow(Math.sin((t*.85+.12)*Math.PI),.70);
   const spread=R*shape*(.78+rand()*.3);
   const curl=pine?(t<.45?-.12:.22):(.02-.26*t);
   const from=new T.Vector3(Math.sin(y/H*5.1+.2)*.13*y*y/(H*H),y,
    Math.sin(y/H*4.3+.75)*.13*y*y/(H*H));
   const p1=from.clone().addScaledVector(dir,spread*.35).add(new T.Vector3(0,curl*spread*.15,0));
   const p2=from.clone().addScaledVector(dir,spread*.72).add(new T.Vector3(0,curl*spread*.38,0));
   const end=from.clone().addScaledVector(dir,spread).add(new T.Vector3(0,curl*spread*.75+(pine?.23:-.26),0));
   addPath(T,woody,[from,p1,p2,end],H*(pine?.0041:.0026)*(1-t*.55),.008,7);
   outerBranches++;
   // Twigs fan in three directions; lower birch twigs bend downwards.
   const count=pine?5:7;
   for(let k=0;k<count;k++){
    const t2=.41+(k/count)*.5,jitter=(rand()-.5)*.18;
    const startPt=from.clone().lerp(end,t2);
    const rot=ang+(k%2===0?1:-1)*(.38+rand()*.38);
    const twigDir=new T.Vector3(Math.cos(rot),0,Math.sin(rot));
    const length=spread*(pine?.22:.26)*(.7+rand()*.65);
    const outer=startPt.clone().addScaledVector(twigDir,length)
      .add(new T.Vector3(0,pine?.08:-.27-length*.2,0));
    const middle=startPt.clone().lerp(outer,.58).add(new T.Vector3(0,pine?.07:.09,0));
    addPath(T,woody,[startPt,middle,outer],H*(pine?.0019:.0013),.003,5);
    tips.push({start:startPt,middle,end:outer,direction:twigDir,level:t});
   }
  }
 }
 const bark=barkTexture(T,species);
 const mainMat=new T.MeshStandardMaterial({map:bark,color:'#ffffff',roughness:.95,metalness:0});
 const twigMat=new T.MeshStandardMaterial({
  color:pine?'#675849':'#6e6454',roughness:.96,metalness:0
 });
 const trunk=new T.Mesh(batchTubeGeometry(T,mainwood),mainMat);
 trunk.name=pine?'Pinus sylvestris · tapered bark trunk':'Betula pendula · white bark trunk';
 trunk.castShadow=true;trunk.receiveShadow=true;root.add(trunk);
 const branches=new T.Mesh(batchTubeGeometry(T,woody),twigMat);
 branches.name='Tapered branched timber · fully 3D';
 branches.castShadow=true;branches.receiveShadow=true;root.add(branches);
 // Each instance represents an actual curved physical needle PAIR or leaf:
 // no camera-facing planes, no screenshot layer, no one-sprite tree.
 const density=(pine?Math.round(28*q):Math.round(39*q));
 const maxInstances=tips.length*density,leafGeo=pine?needlePair(T):birchLeaf(T);
 const foliage=new T.InstancedMesh(leafGeo,
  new T.MeshStandardMaterial({color:'#ffffff',roughness:.85,metalness:0,side:T.DoubleSide}),
  maxInstances);
 foliage.name=pine?'Instanced 3D Scots pine needle pairs':'Instanced 3D silver birch leaves';
 foliage.frustumCulled=false;
 foliage.castShadow=quality==='high';foliage.receiveShadow=true;
 const object=new T.Object3D(),leafColor=new T.Color();
 const colors=pine?['#4b6756','#58745d','#65765f','#6d846a','#4d5d48']:
  ['#708846','#81934d','#91a360','#718f54','#a0ab63'];
 const baseUp=new T.Vector3(0,1,0);
 let index=0;
 for(const tip of tips){
  for(let v=0;v<density;v++){
   const t=.25+.75*rand(),pt=tip.middle.clone().lerp(tip.end,t);
   const az=rand()*Math.PI*2;
   const sway=new T.Vector3(Math.cos(az),-.03+rand()*.36,Math.sin(az));
   const dir=tip.direction.clone().multiplyScalar(.55).add(sway.multiplyScalar(.75)).normalize();
   pt.addScaledVector(sway,(rand()-.5)*(pine?.12:.17));
   object.position.copy(pt);
   object.quaternion.setFromUnitVectors(baseUp,dir);
   const s=(pine?.75:.9)+rand()*(pine?.5:.4);
   object.scale.setScalar(s);
   object.updateMatrix();
   foliage.setMatrixAt(index,object.matrix);
   leafColor.set(colors[Math.floor(rand()*colors.length)]);
   foliage.setColorAt(index,leafColor);
   index++;
  }
 }
 foliage.count=index;
 foliage.instanceMatrix.needsUpdate=true;
 if(foliage.instanceColor)foliage.instanceColor.needsUpdate=true;
 root.add(foliage);
 root.userData={textures:[bark],
  code3D:true,botanicalSpecies:species,source:'FORMA authored procedural mesh',
  branchCount:outerBranches+tips.length,needlePairs:pine?index:0,leafCount:pine?0:index,
  physicalHeight:H,crownDiameter:D,bark:'seeded procedural CanvasTexture',
  renderQuality:quality
 };
 return root;
}
export {createCodeTree};
