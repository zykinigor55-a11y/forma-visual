/* FORMA VISUAL / Species-aware real 3D vegetation.
 * True branch geometry + instanced leaf meshes; no image billboards, no flat
 * cutouts. Everything uses metres and can be orbited, walked through and
 * rendered with real directional shadows. Deterministic per-object seed. */
import {naturalCrown,branchTipDrop,botanicalLeafScale} from './forma-landscape-3d-botany.js';
export const VEGETATION_SPECIES=Object.freeze({
 pine:{kind:'pine',density:650,branches:12,crownStart:.42,leaf:'#507254',bark:'#91674b'},
 spruce:{kind:'spruce',density:1100,branches:15,crownStart:.12,leaf:'#294d3e',bark:'#55433a'},
 birch:{kind:'deciduous',density:1100,branches:12,crownStart:.42,leaf:'#8eb56f',bark:'#d8d8c9'},
 oak:{kind:'deciduous',density:1450,branches:14,crownStart:.31,leaf:'#547b40',bark:'#665442'},
 maple:{kind:'deciduous',density:1300,branches:13,crownStart:.37,leaf:'#70994f',bark:'#62503e'},
 linden:{kind:'deciduous',density:1180,branches:11,crownStart:.34,leaf:'#83a95b',bark:'#645641'},
 willow:{kind:'willow',density:1500,branches:15,crownStart:.33,leaf:'#94aa67',bark:'#70644c'},
 rowan:{kind:'deciduous',density:920,branches:11,crownStart:.47,leaf:'#6b9850',bark:'#696153'},
 apple:{kind:'deciduous',density:1000,branches:11,crownStart:.33,leaf:'#789650',bark:'#715342'},
 sakura:{kind:'deciduous',density:1200,branches:12,crownStart:.36,leaf:'#82a25e',bark:'#79584a'},
 juniper:{kind:'conifer-shrub',density:650,branches:20,crownStart:.04,leaf:'#587a65',bark:'#675d4c'},
 hydrangea:{kind:'shrub',density:520,branches:24,crownStart:.1,leaf:'#76935d',flower:'#e6d9b1',bark:'#6f6650'},
 spirea:{kind:'shrub',density:450,branches:24,crownStart:.04,leaf:'#94a86c',flower:'#ece4ca',bark:'#736958'},
 barberry:{kind:'shrub',density:500,branches:28,crownStart:.04,leaf:'#804448',bark:'#675046'},
 dogwood:{kind:'shrub',density:520,branches:25,crownStart:.06,leaf:'#7b9d68',bark:'#a35748'},
 'thuja-globe':{kind:'conifer-shrub',density:830,branches:25,crownStart:.05,leaf:'#396c57',bark:'#5d624f'},
 lavender:{kind:'shrub',density:330,branches:30,crownStart:.04,leaf:'#73846b',flower:'#9f8ca8',bark:'#6c7364'},
 boxwood:{kind:'shrub',density:680,branches:26,crownStart:.02,leaf:'#506f42',bark:'#68614d'}
});
export const vegetationSpeciesIds=Object.freeze(Object.keys(VEGETATION_SPECIES));
export const isEvergreen=id=>['pine','spruce','juniper','thuja-globe','boxwood'].includes(id);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let a=seed>>>0;return()=>{a=(Math.imul(a,1664525)+1013904223)>>>0;return a/4294967296}}
export function foliageProfile(id,season='summer'){
 const cfg=VEGETATION_SPECIES[id]||VEGETATION_SPECIES.oak;
 let color=cfg.leaf,leafless=season==='winter'&&!isEvergreen(id);
 if(season==='autumn'&&!isEvergreen(id)){
  color=({birch:'#cba84f',oak:'#987548',maple:'#c26d40',linden:'#bca548',willow:'#c5ad66',rowan:'#a97744',apple:'#bd9554',sakura:'#ba8c50'})[id]||color;
 }
 return {color,leafless,kind:cfg.kind};
}
function makeLeafGeometry(T,needle=false){
 if(needle){
  // A tuft is a physical multi-blade mesh crossing three directions, not a PNG.
  const pts=[],norm=[];
  for(let axis=0;axis<3;axis++){
   const theta=axis*Math.PI/3;
   for(let k=0;k<5;k++){
    const v=(k-2)*.21,dx=Math.cos(theta)*v,dz=Math.sin(theta)*v;
    pts.push(-.085,0,-.065,dx,.68,dz,.085,0,.065);
   }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pts,3));g.computeVertexNormals();return g;
 }
 // Distinct curved ovate / narrow leaf outline with actual 3D thickness.
 const xy=[[-.44,0],[-.28,.17],[-.08,.3],[.22,.25],[.51,.04],[.23,-.24],[-.1,-.3],[-.28,-.15]];
 const pts=[];
 for(let i=1;i<xy.length-1;i++){
  pts.push(xy[0][0],xy[0][1],0, xy[i][0],xy[i][1],Math.sin(i/xy.length*Math.PI)*.07,
   xy[i+1][0],xy[i+1][1],Math.sin((i+1)/xy.length*Math.PI)*.07);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pts,3));g.computeVertexNormals();return g;
}
/* Species-specific bark micro-material instead of a single flat brown cylinder.
 * Geometry stays native 3D, and no third-party photo is baked into the editor. */
const barkTextureCache=new Map();
export function barkPalette(id){
 if(id==='birch')return {base:'#D3D3C8',dark:'#444D4B',light:'#F0EFE6',cross:true};
 if(id==='pine')return {base:'#96613F',dark:'#563C30',light:'#C08B61',cross:false};
 if(id==='spruce')return {base:'#62534A',dark:'#302E2B',light:'#96826A',cross:false};
 if(id==='willow')return {base:'#857A65',dark:'#585B4B',light:'#B2AB92',cross:false};
 if(['oak','apple','rowan'].includes(id))return {base:'#6C5C4E',dark:'#37352F',light:'#90806D',cross:false};
 return {base:'#83715D',dark:'#4D4339',light:'#A9997C',cross:false};
}
function barkTexture(T,id){
 if(barkTextureCache.has(id))return barkTextureCache.get(id);
 const c=document.createElement('canvas');c.width=256;c.height=512;
 const ctx=c.getContext('2d'),palette=barkPalette(id),random=rng(hash('bark|'+id));
 ctx.fillStyle=palette.base;ctx.fillRect(0,0,256,512);
 if(palette.cross){
  for(let i=0;i<230;i++){
   const x=random()*256,y=random()*512,len=3+random()*33;
   ctx.fillStyle=random()>.74?palette.light:palette.dark;ctx.globalAlpha=.18+random()*.55;
   ctx.fillRect(x,y,len,.6+random()*3.2);
  }
 }else{
  // Crack trajectories are irregular and follow the grain of real wood.
  for(let i=0;i<180;i++){
   const x=random()*256,y=random()*512,dy=9+random()*116;
   ctx.strokeStyle=random()>.64?palette.light:palette.dark;
   ctx.globalAlpha=.11+random()*.35;ctx.lineWidth=.4+random()*2;
   ctx.beginPath();ctx.moveTo(x,y);
   ctx.bezierCurveTo(x+(random()-.5)*13,y+dy*.30,x+(random()-.5)*15,y+dy*.72,x+(random()-.5)*11,y+dy);
   ctx.stroke();
  }
 }
 ctx.globalAlpha=1;
 for(let i=0;i<4000;i++){
  const x=random()*256,y=random()*512,v=random();
  ctx.fillStyle=v<.5?'rgba(255,246,214,.055)':'rgba(17,16,15,.065)';
  ctx.fillRect(x,y,1+random()*2,1+random()*4);
 }
 const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;
 texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(1,2);
 texture.anisotropy=4;barkTextureCache.set(id,texture);return texture;
}
function addBranch(g,T,segments,color,id){
 if(!segments.length)return;
 const tex=barkTexture(T,id);
 const base=new T.CylinderGeometry(.70,1,1,9,2),
 m=new T.MeshStandardMaterial({color:'#ffffff',map:tex,bumpMap:tex,bumpScale:.016,roughness:.97,metalness:0});
 const branches=new T.InstancedMesh(base,m,segments.length),dummy=new T.Object3D(),up=new T.Vector3(0,1,0),a=new T.Vector3(),b=new T.Vector3();
 segments.forEach((v,i)=>{
  a.set(...v[0]);b.set(...v[1]);const delta=b.clone().sub(a),len=delta.length();
  dummy.position.copy(a).addScaledVector(delta,.5);dummy.quaternion.setFromUnitVectors(up,delta.normalize());
  dummy.scale.set(v[2],len,v[2]);dummy.updateMatrix();branches.setMatrixAt(i,dummy.matrix);
 });branches.instanceMatrix.needsUpdate=true;branches.castShadow=true;branches.receiveShadow=true;g.add(branches);
}
function addLeaves(g,T,items,color,needle,season,seed){
 if(!items.length)return;
 const mesh=new T.InstancedMesh(makeLeafGeometry(T,needle),new T.MeshStandardMaterial({
  color:'#ffffff',roughness:.91,metalness:0,side:T.DoubleSide,
  depthWrite:true
 }),items.length);
 const dummy=new T.Object3D(),c=new T.Color(color),random=rng(seed);
 for(let i=0;i<items.length;i++){
  const p=items[i];dummy.position.set(p.x,p.y,p.z);
  dummy.rotation.set(random()*Math.PI*2,random()*Math.PI*2,random()*Math.PI*2);
  const scale=p.s;dummy.scale.set(scale,scale*(needle?1:.72),scale);dummy.updateMatrix();
  mesh.setMatrixAt(i,dummy.matrix);
  const tone=.78+random()*.38,c2=c.clone().multiplyScalar(tone);
  if(season==='autumn'&&!needle&&random()<.22)c2.lerp(new T.Color('#c76d32'),random()*.58);
  mesh.setColorAt(i,c2);
 }
 mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 mesh.castShadow=true;mesh.receiveShadow=false;mesh.frustumCulled=false;g.add(mesh);
}
/* Many separate soft irregular 3D foliage masses build real canopy volume;
 * they are neither camera billboards nor a single sphere per plant. Fine
 * leaf geometry remains a second layer on top for convincing close-ups. */
/* A rooted, branching botanical spray, not a solid sphere. Each instance is
 * attached to a physically modelled terminal twig and consists of several
 * independent curved leaf/needle blades. Its origin is the branch endpoint.
 * This fixes hovering green blobs and makes canopy porous in perspective. */
function foliageSprigGeometry(T,needle){
 const vertices=[];
 const tri=(a,b,c)=>vertices.push(...a,...b,...c);
 const arms=needle?8:5,leaves=needle?5:3;
 for(let arm=0;arm<arms;arm++){
  const a=arm*Math.PI*2/arms,ca=Math.cos(a),sa=Math.sin(a);
  for(let j=0;j<leaves;j++){
   const k=(j+.75)/leaves,side=j%2?-1:1;
   const base=[ca*k*.23, k*.21, sa*k*.23];
   const tip=[ca*(.22+k*.42), (.18+k*.31)+(needle?.035:.065),sa*(.22+k*.42)];
   const normal=[-sa,0,ca],w=(needle?.012:.07)*(.55+.5*k),mid=[
    (base[0]+tip[0])*.5+(normal[0]*side*w*.65),
    (base[1]+tip[1])*.5+.025,
    (base[2]+tip[2])*.5+(normal[2]*side*w*.65)
   ];
   const left=[base[0]+normal[0]*w,base[1],base[2]+normal[2]*w];
   const right=[base[0]-normal[0]*w,base[1],base[2]-normal[2]*w];
   tri(left,mid,tip);tri(left,tip,right);
  }
 }
 const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
 geo.computeVertexNormals();return geo;
}
function addFoliageVolume(g,T,points,id,diameter,season,seed,quality){
 if(!points.length||foliageProfile(id,season).leafless)return;
 const cfg=VEGETATION_SPECIES[id],shrub=['shrub','conifer-shrub'].includes(cfg.kind);
 const r=rng(seed^0x8fc1a0),needle=['pine','spruce','juniper','thuja-globe'].includes(id);
 const source=foliageProfile(id,season),number=clamp(
  Math.round(points.length*quality*(needle?1.50:1.95)),shrub?160:350,shrub?1200:2600
 );
 const geometry=foliageSprigGeometry(T,needle);
 const material=new T.MeshStandardMaterial({color:'#ffffff',roughness:.86,metalness:0,side:T.DoubleSide});
 const mesh=new T.InstancedMesh(geometry,material,number),d=new T.Object3D(),base=new T.Color(source.color);
 for(let i=0;i<number;i++){
  const p=points[Math.floor(r()*points.length)];
  // The maximum 3cm placement offset remains within terminal twig thickness;
  // former ±0.5m cloud offsets were the source of hovering foliage.
  d.position.set(p.x+(r()-.5)*.055,p.y+(r()-.5)*.055,p.z+(r()-.5)*.055);
  d.rotation.set(r()*6.283,r()*6.283,r()*6.283);
  const crown=Math.max(.45,Math.min(2.4,diameter/4));
  const scale=(needle?.22:.23)*crown*(.63+r()*.62);
  d.scale.set(scale,scale*(needle?1.07:.9),scale);
  d.updateMatrix();mesh.setMatrixAt(i,d.matrix);
  const color=base.clone().multiplyScalar(.76+r()*.39);
  if(season==='autumn'&&!needle&&r()<.25)color.lerp(new T.Color('#c98644'),r()*.42);
  mesh.setColorAt(i,color);
 }
 mesh.instanceMatrix.needsUpdate=true;
 if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 mesh.castShadow=true;mesh.receiveShadow=false;mesh.frustumCulled=false;g.add(mesh);
}
/* Botanical leaf atlas: thin leaflets and conifer needles on real angled
 * 3D foliage quads, not flat whole-tree billboards. */
const sprayTextureCache=new Map();
function createSprayTexture(T,needles){
 const id=needles?'needles':'leaves';
 if(sprayTextureCache.has(id))return sprayTextureCache.get(id);
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
 const ctx=canvas.getContext('2d'),random=rng(hash(id));
 const stem=(a,b,c,d,w=1.1)=>{ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.strokeStyle='rgba(186,194,169,.70)';ctx.lineWidth=w;ctx.stroke()};
 for(let j=0;j<9;j++){
  const angle=j*Math.PI*2/9+(random()-.5)*.36;
  const length=50+random()*57;
  const endX=128+Math.cos(angle)*length,endY=128+Math.sin(angle)*length*.80;
  stem(128,128,endX,endY);
  for(let k=1;k<=6;k++){
   const t=k/7,x=128+(endX-128)*t,y=128+(endY-128)*t;
   for(const side of [-1,1]){
    const nx=-Math.sin(angle)*side,ny=Math.cos(angle)*side;
    const dx=nx*(12+random()*8),dy=ny*(12+random()*8);
    if(needles){for(let n=0;n<3;n++)stem(x+n*1.7,y,x+dx*(.70+n*.14),y+dy*(.70+n*.14),.8)}
    else{
     ctx.save();ctx.translate(x+dx*.7,y+dy*.7);ctx.rotate(Math.atan2(dy,dx));
     ctx.fillStyle='rgba(232,239,217,.94)';
     ctx.beginPath();ctx.moveTo(-10,0);ctx.quadraticCurveTo(0,-6,12,0);
     ctx.quadraticCurveTo(0,6,-10,0);ctx.fill();
     ctx.strokeStyle='rgba(89,111,88,.28)';ctx.lineWidth=.8;
     ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(10,0);ctx.stroke();
     ctx.restore();
    }
   }
  }
 }
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;
 sprayTextureCache.set(id,texture);return texture;
}
function addFoliageSprays(g,T,points,id,season,seed,quality){
 if(!points.length||foliageProfile(id,season).leafless)return;
 const type=foliageProfile(id,season),r=rng(seed),shrub=type.kind.includes('shrub');
 const needle=['pine','spruce','juniper','thuja-globe'].includes(id),
 count=clamp(Math.round(points.length*quality*(shrub?1.55:2.50)),shrub?210:520,3800);
 const material=new T.MeshStandardMaterial({map:createSprayTexture(T,needle),alphaTest:.30,side:T.DoubleSide,roughness:.92,metalness:0,depthWrite:true});
 const mesh=new T.InstancedMesh(new T.PlaneGeometry(1,1),material,count),d=new T.Object3D(),tone=new T.Color(type.color);
 for(let i=0;i<count;i++){
  const p=points[Math.floor(r()*points.length)];
  const offset=shrub?.04:.075;
  d.position.set(p.x+(r()-.5)*offset,p.y+(r()-.5)*offset,p.z+(r()-.5)*offset);
  d.rotation.set(r()*6.283,r()*6.283,r()*6.283);
  const w=(shrub?.23:.44)*(.65+r()*.85);d.scale.set(w,w,1);
  d.updateMatrix();mesh.setMatrixAt(i,d.matrix);
  mesh.setColorAt(i,tone.clone().multiplyScalar(.83+r()*.35));
 }
 mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 mesh.castShadow=true;mesh.frustumCulled=false;g.add(mesh);
}
function flowerClusters(g,T,positions,id,seed,season){
 if(!positions.length)return;
 const bloom=(id==='hydrangea'&&season!=='winter')||(id==='spirea'&&season==='spring')||
  (id==='lavender'&&['summer','spring'].includes(season))||(id==='sakura'&&season==='spring')||
  (id==='apple'&&season==='spring');
 if(!bloom)return;
 const r=rng(seed^0x77cc11),color=VEGETATION_SPECIES[id]?.flower||(id==='sakura'?'#efd1de':'#f0d9cc');
 const count=Math.min(165,Math.round(positions.length*.13));
 const geo=new T.IcosahedronGeometry(1,0),mat=new T.MeshStandardMaterial({color,roughness:.92,flatShading:true});
 const mesh=new T.InstancedMesh(geo,mat,count),d=new T.Object3D();
 for(let i=0;i<count;i++){
  const p=positions[Math.floor(r()*positions.length)];d.position.set(p.x,p.y+.035,p.z);
  const size=(id==='hydrangea'?.085:.038)*(0.5+r());d.scale.set(size*1.2,size,size*1.2);
  d.rotation.set(r()*3,r()*3,r()*3);d.updateMatrix();mesh.setMatrixAt(i,d.matrix);
 }mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;g.add(mesh);
}
/* Tapered curved branch: 3 connected real cylinders, never a rigid stick
 * connecting the trunk to a floating blob. Each span touches the next. */
function curveBranch(segments,start,end,thickness,bend=0){
 const amount=3,wobble=(end[2]-start[2])*.036,side=(start[0]-end[0])*.036;
 let last=start;
 for(let step=1;step<=amount;step++){
  const t=step/amount,arc=Math.sin(Math.PI*t);
  const p=[start[0]+(end[0]-start[0])*t+wobble*arc,
   start[1]+(end[1]-start[1])*t+bend*arc,
   start[2]+(end[2]-start[2])*t+side*arc];
  segments.push([last,p,Math.max(.004,thickness*(1-t*.74))]);
  last=p;
 }
}
function generateTree(T,g,id,height,diameter,season,r,quality){
 const c=VEGETATION_SPECIES[id],kind=c.kind,evergreen=isEvergreen(id),radius=diameter/2;
 const conifer=kind==='spruce'||kind==='pine',trunkRadius=clamp(height*(kind==='pine'?.025:.022),.065,.46);
 const trunkEnd=kind==='spruce'?height*.88:kind==='pine'?height*.88:height*.75;
 const branches=[[[0,0,0],[0,trunkEnd,0],trunkRadius]];
 const leafPoints=[],tiers=c.branches,leafless=foliageProfile(id,season).leafless;
 const start=height*c.crownStart,crownH=height-start;
 const centers=[];
 for(let i=0;i<tiers;i++){
  const t=(i+.5)/tiers,y=start+crownH*t,angle=i*2.399+r()*.6;
  let radial;
  radial=radius*naturalCrown(id,t)*(.76+r()*.26);
  const arms=kind==='spruce'?7:kind==='pine'?4:5;
  for(let k=0;k<arms;k++){
   const direction=angle+k*2*Math.PI/arms+r()*.30;
   const length=radial*(.66+r()*.31);
   const branchRise=conifer?(kind==='pine'?.12:-.11):.2+r()*.25;
   const outerY=clamp(y+crownH*branchRise*(r()-.25)-branchTipDrop(id,height,t)*.35,.12,height*.99);
   const tip=[Math.cos(direction)*length,outerY,Math.sin(direction)*length];
   const stemY=y-(conifer?.04:.02)*height;
   curveBranch(branches,[0,stemY,0],tip,trunkRadius*(conifer?.25:.37)*(1-t*.55),height*(conifer?-.012:.028));
   const twigCount=kind==='pine'?6:kind==='spruce'?8:9;
   for(let j=0;j<twigCount;j++){
    const f=(j+.2+r()*.45)/twigCount,flare=(r()-.5)*length*.4;
    const mid=[tip[0]*f,stemY+(outerY-stemY)*f,tip[2]*f];
    const x=mid[0]+Math.cos(direction+Math.PI/2)*flare;
    const z=mid[2]+Math.sin(direction+Math.PI/2)*flare;
    const yy=mid[1]+(kind==='willow'?-.20-height*.07*r():height*.03*r());
    curveBranch(branches,mid,[x,yy,z],trunkRadius*(conifer?.072:.10)*(1-t*.5),height*(conifer?-.004:.008));
    if(id==='willow'){
     // Three connected hanging twig segments create real cascades visible in
     // perspective and Walk. They are geometry, not billboard strips.
     const fall=branchTipDrop(id,height,t),end=[x*1.02,Math.max(.18,yy-fall),z*1.02];
     const bow=[x*1.09,Math.max(.2,yy-fall*.46),z*1.09];
     branches.push([[x,yy,z],bow,trunkRadius*.046],[bow,end,trunkRadius*.027]);
     centers.push({x:bow[0],y:bow[1],z:bow[2]},{x:end[0],y:end[1],z:end[2]});
    }else if(id==='birch'){
     const droop=branchTipDrop(id,height,t);
     const end=[x*1.10,Math.max(.12,yy-droop),z*1.10];
     branches.push([[x,yy,z],end,trunkRadius*.038]);centers.push({x:end[0],y:end[1],z:end[2]});
    }
    centers.push({x,y:yy,z});
   }
  }
 }
 const max=clamp(Math.round(c.density*quality),180,2500);
 for(let i=0;i<max;i++){
  const p=centers[Math.floor(r()*centers.length)];
  // Distribution follows reachable branch endpoints, not a random crown cloud.
  // Offset is capped to 8cm; loose leaves never hang half a metre in air.
  const offset=Math.min(.08,diameter*.012),scale=botanicalLeafScale(id,height,diameter);
  const leafY=clamp(p.y+(r()-.5)*offset,.075,height);
  const size=(conifer?(.11+r()*.12):(.11+r()*.16))*scale;
  leafPoints.push({
   x:clamp(p.x+(r()-.5)*offset,-radius,radius),y:leafY,
   z:clamp(p.z+(r()-.5)*offset,-radius,radius),s:size
  });
 }
 // Birch has a visible pale trunk; Scots pine a taller open red-brown bole.
 if(id==='birch'){for(let i=0;i<8;i++){const y=height*(.12+i*.07);branches.push([[-trunkRadius,y,0],[trunkRadius,y+.055,.02],trunkRadius*.10])}}
 addBranch(g,T,branches,c.bark,id);
 if(!leafless){addFoliageVolume(g,T,leafPoints,id,diameter,season,Math.floor(r()*4294967295),quality);addLeaves(g,T,leafPoints,foliageProfile(id,season).color,conifer,season,Math.floor(r()*4294967295));addFoliageSprays(g,T,leafPoints,id,season,Math.floor(r()*4294967295),quality);}
 flowerClusters(g,T,leafPoints,id,Math.floor(r()*4294967295),season);
}
function generateShrub(T,g,id,height,diameter,season,r,quality){
 const c=VEGETATION_SPECIES[id],radius=diameter/2;
 const heightActual=clamp(height,.3,3.5);
 const conifer=c.kind==='conifer-shrub',branches=[],points=[];
 for(let j=0;j<c.branches;j++){
  const az=j*2.399+r()*.28,dist=radius*(.36+r()*.60);
  const spread=id==='juniper'?.24:id==='lavender'?.68:id==='hydrangea'?.90:.78;
  const pt=[Math.cos(az)*dist, heightActual*(.32+r()*.62)*spread,Math.sin(az)*dist];
  branches.push([[0,.06,0],pt,.019+r()*.032]);
  for(let k=0;k<17;k++){
   const f=.42+r()*.58,y=pt[1]*f+(r()-.5)*heightActual*.25;
   points.push({x:pt[0]*f+(r()-.5)*radius*.34,y:Math.max(.05,y),z:pt[2]*f+(r()-.5)*radius*.34,s:conifer?.09+r()*.13:.11+r()*.16});
  }
 }
 const count=clamp(Math.round(c.density*quality),130,1300);
 while(points.length<count){
  const p=points[Math.floor(r()*points.length)];
  points.push({x:clamp(p.x+(r()-.5)*radius*.19,-radius,radius),
   y:clamp(p.y+(r()-.5)*heightActual*.13,.08,heightActual),
   z:clamp(p.z+(r()-.5)*radius*.19,-radius,radius),s:p.s*(.8+r()*.3)});
 }
 addBranch(g,T,branches,c.bark,id);
 if(!foliageProfile(id,season).leafless){addFoliageVolume(g,T,points,id,diameter,season,Math.floor(r()*4294967295),quality);addLeaves(g,T,points,foliageProfile(id,season).color,conifer,season,Math.floor(r()*4294967295));addFoliageSprays(g,T,points,id,season,Math.floor(r()*4294967295),quality);}
 flowerClusters(g,T,points,id,Math.floor(r()*4294967295),season);
}
export function createVegetation(T,instance,{season='summer',quality=1}={}){
 const id=instance.catalogId,cfg=VEGETATION_SPECIES[id];
 if(!cfg)throw Error('Unknown botanical species: '+id);
 const diameter=clamp(Number(instance.diameter)||1,.2,30),height=clamp(Number(instance.height)||1,.25,40);
 const seed=hash((instance.id||id)+'|'+id),r=rng(seed),g=new T.Group();
 if(cfg.kind==='shrub'||cfg.kind==='conifer-shrub')generateShrub(T,g,id,height,diameter,season,r,quality);
 else generateTree(T,g,id,height,diameter,season,r,quality);
 g.userData.species=id;g.userData.physicalHeight=height;g.userData.crownDiameter=diameter;
 return g;
}
export function createRock(T,instance){
 const radius=clamp(Number(instance.diameter)||1.3,.25,6)/2,id=instance.catalogId;
 const r=rng(hash(instance.id||id)),g=new T.Group();
 const geo=new T.IcosahedronGeometry(radius,3),p=geo.getAttribute('position'),colors=[];
 const base=new T.Color(({ 'granite-boulder':'#818687','limestone-boulder':'#bfb8a6','slate-boulder':'#586066','sandstone-boulder':'#b79a75'})[id]||'#858b88');
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
  const shape=1+.09*Math.sin(x*21+z*17)+.11*Math.cos(z*13-y*19)+.07*(r()-.5);
  p.setXYZ(i,x*shape,Math.max(.025,y*shape*.63+radius*.43),z*shape);
  const c=base.clone().multiplyScalar(.78+r()*.45);colors.push(c.r,c.g,c.b);
 }
 geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
 const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:false}));
 mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return g;
}
export function createGardenLight(T,instance,{night=false}={}){
 const g=new T.Group(),id=instance.catalogId,h=clamp(Number(instance.height)||.9,.18,2.3);
 const mat=color=>new T.MeshStandardMaterial({color,metalness:.55,roughness:.43});
 const metal=mat('#343b39'),glass=new T.MeshPhysicalMaterial({color:'#e4d7b8',roughness:.18,
  transparent:true,opacity:.88,emissive:night?'#d3a56a':'#5e5343',emissiveIntensity:night?1.5:.09});
 const cylinder=(a,b,y,r,material)=>{
  const ob=new T.Mesh(new T.CylinderGeometry(a,b,y,12),material);
  ob.castShadow=true;ob.position.y=r;g.add(ob);
 };
 if(['ground','spot','deck-light'].includes(id)){
  cylinder(.15,.15,.075,.045,metal);cylinder(.11,.11,.03,.095,glass);
 }else if(id==='linear'){
  const ob=new T.Mesh(new T.BoxGeometry(.14,.065,.95),metal);ob.position.y=.045;g.add(ob);
  const strip=new T.Mesh(new T.BoxGeometry(.06,.02,.82),glass);strip.position.y=.085;g.add(strip);
 }else{
  cylinder(.065,.10,h,h/2,metal);
  cylinder(id==='bollard'?.15:.14,.13,.23,h+.06,glass);
  cylinder(.17,.16,.06,h+.2,metal);
 }
 return g;
}
