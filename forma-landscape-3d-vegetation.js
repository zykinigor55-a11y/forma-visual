/* FORMA VISUAL / Species-aware real 3D vegetation.
 * True branch geometry + instanced leaf meshes; no image billboards, no flat
 * cutouts. Everything uses metres and can be orbited, walked through and
 * rendered with real directional shadows. Deterministic per-object seed. */
import {naturalCrown,branchTipDrop,botanicalLeafScale,leafOutline,foliageSprayWidth,coniferNeedleProfile,foliageDepthTone} from './forma-landscape-3d-botany.js';
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
function makeLeafGeometry(T,needle=false,id='oak'){
 if(needle){
  // Physically narrow needle triangles: evergreen clusters stay green in winter.
  const pts=[];
  for(let axis=0;axis<3;axis++){
   const theta=axis*Math.PI/3;
   for(let k=0;k<5;k++){
    const v=(k-2)*.21,dx=Math.cos(theta)*v,dz=Math.sin(theta)*v;
    pts.push(-.045,0,-.035,dx,.68,dz,.045,0,.035);
   }
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pts,3));
  geo.computeVertexNormals();return geo;
 }
 const outline=leafOutline(id,20),pts=[];
 // Species-correct contour with a slight fold down the midrib.
 for(let i=0;i<outline.length;i++){
  const a=outline[i],b=outline[(i+1)%outline.length],za=.055*(1-a[0]*a[0]),zb=.055*(1-b[0]*b[0]);
  pts.push(0,0,.07,a[0],a[1],za,b[0],b[1],zb);
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pts,3));
 geo.computeVertexNormals();return geo;
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
function addLeaves(g,T,items,color,needle,season,seed,id='oak'){
 if(!items.length)return;
 const mesh=new T.InstancedMesh(makeLeafGeometry(T,needle,id),new T.MeshStandardMaterial({
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
 const arms=needle?5:4,leaves=needle?3:2;
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
function addFoliageVolume(g,T,points,id,diameter,season,seed,quality,height){
 if(!points.length||foliageProfile(id,season).leafless)return;
 const cfg=VEGETATION_SPECIES[id],shrub=['shrub','conifer-shrub'].includes(cfg.kind);
 const r=rng(seed^0x8fc1a0),needle=['pine','spruce','juniper','thuja-globe'].includes(id);
 const source=foliageProfile(id,season),number=clamp(
  Math.round(points.length*quality*(needle?2.05:2.15)),shrub?170:520,shrub?1100:2450
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
  const scale=(needle?.235:.25)*crown*(.70+r()*.54);
  d.scale.set(scale,scale*(needle?1.07:.9),scale);
  d.updateMatrix();mesh.setMatrixAt(i,d.matrix);
  const shade=foliageDepthTone(id,p.y/Math.max(.25,height),Math.hypot(p.x,p.z)/Math.max(.1,diameter*.5));
  const color=base.clone().multiplyScalar((.84+r()*.25)*shade);
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
function createSprayTexture(T,needles,id){
 const textureId=(needles?'needles-':'leaves-')+id;
 if(sprayTextureCache.has(textureId))return sprayTextureCache.get(textureId);
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
 const ctx=canvas.getContext('2d'),random=rng(hash(textureId)),profile=needles?coniferNeedleProfile(id):null;
 const stem=(a,b,c,d,w=1.1)=>{ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.strokeStyle='rgba(186,194,169,.70)';ctx.lineWidth=w;ctx.stroke()};
 const arms=profile?.arms||13;
 for(let j=0;j<arms;j++){
  const angle=j*Math.PI*2/arms+(random()-.5)*.32;
  const length=(54+random()*59)*(profile?.length||1);
  const endX=128+Math.cos(angle)*length,endY=128+Math.sin(angle)*length*.80;
  stem(128,128,endX,endY);
  for(let k=1;k<=8;k++){
   const t=k/9,x=128+(endX-128)*t,y=128+(endY-128)*t;
   for(const side of [-1,1]){
    const nx=-Math.sin(angle)*side,ny=Math.cos(angle)*side;
    const speciesWidth=id==='willow'?.55:id==='birch'?.74:id==='oak'?1.2:id==='maple'?1.1:id==='lavender'?.40:1;
    const dx=nx*(14+random()*10)*speciesWidth*(profile?.spread||1),dy=ny*(14+random()*10)*speciesWidth*(profile?.spread||1);
    if(needles){
     // One-pixel needle strokes disappear under mipmapping at overview zoom.
     // Individually tapered, filled needle bundles retain alpha coverage
     // at distance while keeping the fine species-specific outline.
     for(let n=0;n<profile.needlesPerSide;n++){
      const spread=(n-(profile.needlesPerSide-1)/2)*2.0;
      const tx=x+dx*(.72+n*.08),ty=y+dy*(.72+n*.08);
      const thick=Math.max(1.6,profile.thickness*(id==='pine'?2.6:2.3));
      ctx.beginPath();ctx.moveTo(x+spread, y+spread*.3);
      ctx.quadraticCurveTo((x+tx)/2+thick*1.4,(y+ty)/2-thick,tx,ty);
      ctx.quadraticCurveTo((x+tx)/2-thick*1.4,(y+ty)/2+thick,x+spread,y+spread*.3);
      ctx.fillStyle='rgba(232,239,217,.93)';ctx.fill();
     }
    }
    else{
     ctx.save();ctx.translate(x+dx*.7,y+dy*.7);ctx.rotate(Math.atan2(dy,dx));
     ctx.fillStyle='rgba(232,239,217,.94)';
     const narrow=id==='willow'?.35:id==='birch'?.68:id==='rowan'?.62:id==='oak'?1.1:1;
     ctx.beginPath();ctx.moveTo(-14,0);ctx.quadraticCurveTo(0,-9*narrow,16,0);
     ctx.quadraticCurveTo(0,9*narrow,-14,0);ctx.fill();
     ctx.strokeStyle='rgba(89,111,88,.28)';ctx.lineWidth=.8;
     ctx.beginPath();ctx.moveTo(-10,0);ctx.lineTo(14,0);ctx.stroke();
     ctx.restore();
    }
   }
  }
 }
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;
 sprayTextureCache.set(textureId,texture);return texture;
}
/* Three-dimensional crossed foliage sprays. Each textured tuft is attached to
 * a modelled twig endpoint, not distributed in an imaginary sphere. Two
 * intersecting planes keep leaf volume visible from a moving camera. */
function addFoliageSprays(g,T,points,id,season,seed,quality,diameter,height){
 if(!points.length||foliageProfile(id,season).leafless)return;
 const type=foliageProfile(id,season),r=rng(seed),shrub=type.kind.includes('shrub');
 const needle=['pine','spruce','juniper','thuja-globe'].includes(id);
 // Sparse mobile scenes stay lightweight; quality desktop scenes use enough
 // independent terminal sprays to hold a readable crown at parcel scale.
 const minimum=quality<.3?(shrub?220:620):quality<.45?(shrub?390:1250):(shrub?670:2250);
 const count=clamp(Math.round(points.length*(1.25+quality*1.55)),minimum,shrub?2150:4200);
 const texture=createSprayTexture(T,needle,id);
 const material=new T.MeshStandardMaterial({map:texture,alphaTest:.26,side:T.DoubleSide,roughness:.94,metalness:0,depthWrite:true});
 const mesh=new T.InstancedMesh(new T.PlaneGeometry(1,1),material,count),
  cross=new T.InstancedMesh(new T.PlaneGeometry(1,1),material.clone(),count);
 const d=new T.Object3D(),tone=new T.Color(type.color);
 // Wide sprays supply the distant silhouette. Close-up mesh leaves and bark
 // supply microgeometry; no large geometric leaf balls are recreated.
 for(let i=0;i<count;i++){
  const p=points[Math.floor(r()*points.length)],offset=shrub?.05:.09;
  d.position.set(p.x+(r()-.5)*offset,p.y+(r()-.5)*offset,p.z+(r()-.5)*offset);
  d.rotation.set(r()*6.283,r()*6.283,r()*6.283);
  const w=foliageSprayWidth(id,diameter)*(.72+r()*.70);
  d.scale.set(w,w,1);d.updateMatrix();mesh.setMatrixAt(i,d.matrix);
  const shade=foliageDepthTone(id,p.y/Math.max(.25,height),Math.hypot(p.x,p.z)/Math.max(.1,diameter*.5));
  const colour=tone.clone().multiplyScalar((.87+r()*.22)*shade);mesh.setColorAt(i,colour);
  d.rotateY(Math.PI/2);d.updateMatrix();cross.setMatrixAt(i,d.matrix);
  cross.setColorAt(i,colour);
 }
 for(const tuft of [mesh,cross]){
  tuft.instanceMatrix.needsUpdate=true;
  if(tuft.instanceColor)tuft.instanceColor.needsUpdate=true;
  tuft.castShadow=quality>=.30&&quality<.43;
  tuft.frustumCulled=false;g.add(tuft);
 }
}
/* Real petalled flowers instead of tiny stone-shaped spheres.
 * Pairs of concave triangles form each petal; repeated as instanced clusters. */
function flowerPetalGeometry(T){
 const pos=[],petals=5;
 for(let i=0;i<petals;i++){
  const a=i*Math.PI*2/petals,c=Math.cos(a),s=Math.sin(a),
   sideX=-s,sideZ=c;
  const root=[0,0,0],tip=[c*.74,.19,s*.74],
   left=[c*.35+sideX*.32,.08,s*.35+sideZ*.32],
   right=[c*.35-sideX*.32,.08,s*.35-sideZ*.32],middle=[c*.42,.18,s*.42];
  pos.push(...root,...left,...middle,...root,...middle,...right,...left,...tip,...middle,...right,...middle,...tip);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.computeVertexNormals();return g;
}
function flowerClusters(g,T,positions,id,seed,season){
 if(!positions.length)return;
 const bloom=(id==='hydrangea'&&season!=='winter')||(id==='spirea'&&season==='spring')||
  (id==='lavender'&&['summer','spring'].includes(season))||(id==='sakura'&&season==='spring')||
  (id==='apple'&&season==='spring');
 if(!bloom)return;
 const r=rng(seed^0x77cc11),color=VEGETATION_SPECIES[id]?.flower||(id==='sakura'?'#efd1de':'#f0d9cc');
 const count=Math.min(id==='lavender'?260:240,Math.round(positions.length*.31));
 const mat=new T.MeshStandardMaterial({color,roughness:.91,side:T.DoubleSide});
 const mesh=new T.InstancedMesh(flowerPetalGeometry(T),mat,count),d=new T.Object3D();
 for(let i=0;i<count;i++){
  const p=positions[Math.floor(r()*positions.length)];
  d.position.set(p.x,p.y+.035,p.z);
  d.rotation.set(r()*3,r()*6.28,r()*6.28);
  const size=(id==='hydrangea'?.065:id==='lavender'?.026:.04)*(.7+r()*.52);
  d.scale.set(size,size,size);d.updateMatrix();mesh.setMatrixAt(i,d.matrix);
 }
 mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;g.add(mesh);
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
   if(conifer){
    // Real lateral shoots start on the outer half of the parent branch.
    // Without these, most silhouette foliage is concentrated at a few isolated
    // twig tips and mature conifers resemble bare trunks at parcel distance.
    const shoots=kind==='spruce'?4:3;
    for(let n=0;n<shoots;n++){
     const fraction=.54+(n+r()*.42)/shoots*.42;
     const base=[tip[0]*fraction,stemY+(outerY-stemY)*fraction,tip[2]*fraction];
     const sideways=(n%2===0?1:-1)*(.10+r()*.15)*length;
     const end=[
      clamp(base[0]-Math.sin(direction)*sideways,-radius,radius),
      clamp(base[1]+(kind==='spruce'?-.065:.035)*height*(.3+r()*.3),.08,height),
      clamp(base[2]+Math.cos(direction)*sideways,-radius,radius)
     ];
     curveBranch(branches,base,end,Math.max(.003,trunkRadius*.024*(1-t*.50)),0);
     centers.push({x:end[0],y:end[1],z:end[2]});
    }
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
 if(!leafless){
  if(quality>=.36)addFoliageVolume(g,T,leafPoints,id,diameter,season,Math.floor(r()*4294967295),quality,height);
  if(quality>=.43)addLeaves(g,T,leafPoints,foliageProfile(id,season).color,conifer,season,Math.floor(r()*4294967295),id);
  addFoliageSprays(g,T,leafPoints,id,season,Math.floor(r()*4294967295),quality,diameter,height);
 }
 flowerClusters(g,T,leafPoints,id,Math.floor(r()*4294967295),season);
}
/* Branch-connected shrub clusters. Groundcover lies low and spreads
 * horizontally; hydrangea and dogwood stand upright; lavender uses thin
 * flowering spikes. Foliage endpoints belong to real tapered twig geometry. */
function generateShrub(T,g,id,height,diameter,season,r,quality){
 const c=VEGETATION_SPECIES[id],radius=diameter/2,actual=clamp(height,.3,3.5);
 const evergreen=c.kind==='conifer-shrub',branches=[],points=[],isCreeper=id==='juniper',isSpike=id==='lavender';
 const stems=isCreeper?24:isSpike?38:id==='hydrangea'?30:c.branches;
 for(let j=0;j<stems;j++){
  // Botanical asymmetry: individual shrubs form naturally offset branch whorls,
  // rather than a perfect radial hedgehog around their survey point.
  const az=j*2.399+r()*.34,dist=radius*(.43+r()*.53),
   horizontal=isCreeper?1:isSpike?.72:id==='thuja-globe'?.8:1;
  const tipHeight=isCreeper?actual*(.17+r()*.23):
   isSpike?actual*(.50+r()*.45):
   id==='boxwood'||id==='thuja-globe'?actual*(.51+r()*.47):
   actual*(.38+r()*.54);
  const pt=[Math.cos(az)*dist*horizontal,tipHeight,Math.sin(az)*dist*horizontal],
   radiusStem=isSpike?.007:isCreeper?.012:.016+r()*.016;
  curveBranch(branches,[0,.045,0],pt,radiusStem,actual*(isCreeper?-.01:.065));
  for(let k=0;k<15;k++){
   const f=.22+r()*.77,
    mid=[pt[0]*f,.045+(pt[1]-.045)*f,pt[2]*f],length=radius*(isCreeper?.19:isSpike?.08:.16);
   const direction=az+(r()-.5)*2.6,tip=[
    clamp(mid[0]+Math.cos(direction)*length*(.25+r()*.85),-radius,radius),
    clamp(mid[1]+actual*(isSpike?.035:.08)*(r()-.33),.04,actual),
    clamp(mid[2]+Math.sin(direction)*length*(.25+r()*.85),-radius,radius)
   ];
   branches.push([mid,tip,Math.max(.0025,radiusStem*.32)]);
   points.push({x:tip[0],y:tip[1],z:tip[2],s:evergreen?.09+r()*.10:.095+r()*.12});
   // Secondary terminal shoots add low and side foliage without detaching
   // leaves from branches. They stay inside the measured crown footprint.
   if(k%3===0&&!isSpike){
    const lateral=direction+Math.PI*.5*(r()>.5?1:-1);
    const sideLength=radius*(isCreeper?.065:.085)*(.65+r()*.35);
    const end=[
     clamp(tip[0]+Math.cos(lateral)*sideLength,-radius,radius),
     clamp(tip[1]+actual*(r()-.55)*.035,.04,actual),
     clamp(tip[2]+Math.sin(lateral)*sideLength,-radius,radius)
    ];
    branches.push([tip,end,Math.max(.0025,radiusStem*.20)]);
    points.push({x:end[0],y:end[1],z:end[2],s:evergreen?.085:.12});
   }
  }
 }
 const total=clamp(Math.round(c.density*quality),140,1300);
 while(points.length<total){
  const p=points[Math.floor(r()*points.length)];
  // Small jitter only around already-connected twig tips.
  points.push({x:clamp(p.x+(r()-.5)*.045,-radius,radius),
   y:clamp(p.y+(r()-.5)*.045,.05,actual),
   z:clamp(p.z+(r()-.5)*.045,-radius,radius),s:p.s*(.88+r()*.22)});
 }
 addBranch(g,T,branches,c.bark,id);
 if(!foliageProfile(id,season).leafless){
  if(quality>=.36)addFoliageVolume(g,T,points,id,diameter,season,Math.floor(r()*4294967295),quality,height);
  if(quality>=.43)addLeaves(g,T,points,foliageProfile(id,season).color,evergreen,season,Math.floor(r()*4294967295),id);
  addFoliageSprays(g,T,points,id,season,Math.floor(r()*4294967295),quality,diameter,height);
 }
 flowerClusters(g,T,points,id,Math.floor(r()*4294967295),season);
}
export function createVegetation(T,instance,{season='summer',quality=1}={}){
 const id=instance.catalogId,cfg=VEGETATION_SPECIES[id];
 if(!cfg)throw Error('Unknown botanical species: '+id);
 const diameter=clamp(Number(instance.diameter)||1,.2,30),height=clamp(Number(instance.height)||1,.25,40);
 const variant=clamp(Math.round(Number(instance.variant)||1),1,3),seed=hash((instance.id||id)+'|'+id+'|crown-'+variant),r=rng(seed),g=new T.Group();
 if(cfg.kind==='shrub'||cfg.kind==='conifer-shrub')generateShrub(T,g,id,height,diameter,season,r,quality);
 else generateTree(T,g,id,height,diameter,season,r,quality);
 g.userData.species=id;g.userData.physicalHeight=height;g.userData.crownDiameter=diameter;g.userData.variant=variant;
 return g;
}
const rockTextureCache=new Map();
function rockMineralTexture(T,id){
 if(rockTextureCache.has(id))return rockTextureCache.get(id);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 const ctx=canvas.getContext('2d'),r=rng(hash('mineral|'+id));
 const colors={
  'granite-boulder':['#bec2bf','#7b827e','#d8d5ca'],
  'limestone-boulder':['#d3ccb8','#a29a83','#e8e4d4'],
  'slate-boulder':['#858d8b','#454f51','#b4b9b4'],
  'sandstone-boulder':['#d3b68e','#947654','#f0d4aa']
 }[id]||['#bdc2bd','#818a84','#e1dfd8'];
 ctx.fillStyle=colors[0];ctx.fillRect(0,0,256,256);
 for(let i=0;i<10000;i++){
  ctx.globalAlpha=.035+r()*.27;ctx.fillStyle=r()>.56?colors[1]:colors[2];
  const x=r()*256,y=r()*256,sz=.5+r()*3.6;
  ctx.fillRect(x,y,sz,sz*(id==='slate-boulder'?.42:1.0));
 }
 if(id==='slate-boulder'||id==='sandstone-boulder'){
  for(let i=0;i<43;i++){
   ctx.beginPath();const y=r()*256;
   ctx.moveTo(0,y);ctx.bezierCurveTo(80,y-3+r()*6,175,y-4+r()*8,256,y-4+r()*8);
   ctx.strokeStyle=colors[1];ctx.lineWidth=.4+r()*1.2;ctx.globalAlpha=.1+r()*.18;ctx.stroke();
  }
 }
 ctx.globalAlpha=1;
 const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;
 tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=4;
 rockTextureCache.set(id,tex);return tex;
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
 const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,map:rockMineralTexture(T,id),bumpMap:rockMineralTexture(T,id),bumpScale:.024,roughness:.97,metalness:0,flatShading:false}));
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
