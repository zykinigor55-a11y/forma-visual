import {createProfessionalGardenLight} from './forma-landscape-3d-fixtures.js';
/* FORMA VISUAL / Species-aware real 3D vegetation.
 * True branch geometry + instanced leaf meshes; no image billboards, no flat
 * cutouts. Everything uses metres and can be orbited, walked through and
 * rendered with real directional shadows. Deterministic per-object seed. */
import {naturalCrown,branchTipDrop,botanicalLeafScale,leafOutline,foliageSprayWidth,coniferNeedleProfile,foliageDepthTone} from './forma-landscape-3d-botany.js';
import {botanicalPhotoProfile,normalizeFoliagePalette,foliageMaterial,barkReliefCanvas} from './forma-landscape-3d-plant-materials.js';
import {enableBotanicalLod} from './forma-landscape-3d-foliage-lod.js';
import {referenceCanopy,speciesGrowthProfile,referenceBranchTips,referenceFoliageDensity,constrainCrownRadius,specimenCrownVariation} from './forma-landscape-3d-reference-canopies.js';
import {createNativeUnderstory,NATIVE_UNDERSTORY} from './forma-landscape-3d-understory.js';
export const VEGETATION_SPECIES=Object.freeze({
 pine:{kind:'pine',density:1750,branches:13,crownStart:.40,leaf:'#507254',bark:'#91674b'},
 spruce:{kind:'spruce',density:2450,branches:17,crownStart:.10,leaf:'#294d3e',bark:'#55433a'},
 birch:{kind:'deciduous',density:2700,branches:12,crownStart:.42,leaf:'#8eb56f',bark:'#d8d8c9'},
 oak:{kind:'deciduous',density:2550,branches:14,crownStart:.31,leaf:'#547b40',bark:'#665442'},
 maple:{kind:'deciduous',density:1300,branches:13,crownStart:.37,leaf:'#70994f',bark:'#62503e'},
 linden:{kind:'deciduous',density:1180,branches:11,crownStart:.34,leaf:'#83a95b',bark:'#645641'},
 willow:{kind:'willow',density:1500,branches:15,crownStart:.33,leaf:'#94aa67',bark:'#70644c'},
 rowan:{kind:'deciduous',density:920,branches:11,crownStart:.47,leaf:'#6b9850',bark:'#696153'},
 apple:{kind:'deciduous',density:1000,branches:11,crownStart:.33,leaf:'#789650',bark:'#715342'},
 sakura:{kind:'deciduous',density:1200,branches:12,crownStart:.36,leaf:'#82a25e',bark:'#79584a'},
 ash:{kind:'deciduous',density:1400,branches:15,crownStart:.39,leaf:'#64864d',bark:'#807365'},
 aspen:{kind:'deciduous',density:1550,branches:13,crownStart:.43,leaf:'#90ae68',bark:'#c9d2b3'},
 juniper:{kind:'conifer-shrub',density:650,branches:20,crownStart:.04,leaf:'#587a65',bark:'#675d4c'},
 hydrangea:{kind:'shrub',density:520,branches:24,crownStart:.1,leaf:'#76935d',flower:'#e6d9b1',bark:'#6f6650'},
 spirea:{kind:'shrub',density:940,branches:24,crownStart:.04,leaf:'#94a86c',flower:'#ece4ca',bark:'#736958'},
 barberry:{kind:'shrub',density:500,branches:28,crownStart:.04,leaf:'#804448',bark:'#675046'},
 dogwood:{kind:'shrub',density:520,branches:25,crownStart:.06,leaf:'#7b9d68',bark:'#a35748'},
 'thuja-globe':{kind:'conifer-shrub',density:830,branches:25,crownStart:.05,leaf:'#396c57',bark:'#5d624f'},
 lavender:{kind:'shrub',density:330,branches:30,crownStart:.04,leaf:'#73846b',flower:'#9f8ca8',bark:'#6c7364'},
 boxwood:{kind:'shrub',density:680,branches:26,crownStart:.02,leaf:'#506f42',bark:'#68614d'},
 ninebark:{kind:'shrub',density:590,branches:28,crownStart:.06,leaf:'#86674e',bark:'#816050'},
 hosta:{kind:'shrub',density:440,branches:18,crownStart:.02,leaf:'#64865b',bark:'#69795a'},
 'ornamental-grass':{kind:'shrub',density:620,branches:44,crownStart:.02,leaf:'#989b67',bark:'#968c62'},
 fern:{kind:'shrub',density:440,branches:22,crownStart:.01,leaf:'#5a8861',bark:'#6e7656'},
 periwinkle:{kind:'shrub',density:490,branches:25,crownStart:.01,leaf:'#5e8f6a',bark:'#67644e'},
 'wild-shrub':{kind:'shrub',density:690,branches:36,crownStart:.05,leaf:'#71965f',bark:'#705b47'}
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
  color=({birch:'#cba84f',oak:'#987548',maple:'#c26d40',linden:'#bca548',willow:'#c5ad66',rowan:'#a97744',apple:'#bd9554',sakura:'#ba8c50',ash:'#b4a056',aspen:'#d6ae54',ninebark:'#a8704e','wild-shrub':'#b48c55',fern:'#a18d5f',hosta:'#b09c66'})[id]||color;
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
const barkTextureCache=new Map(),barkBumpCache=new Map();
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
  // Betula pendula: irregular dark lenticels and peeling bark fissures,
  // not uniform decorative horizontal ruler lines.
  for(let patch=0;patch<105;patch++){
   const x=random()*256,y=random()*512,l=4+random()*24;
   ctx.save();ctx.translate(x,y);ctx.rotate((random()-.5)*.23);
   ctx.globalAlpha=.2+random()*.65;
   ctx.fillStyle=random()>.22?palette.dark:palette.light;
   ctx.beginPath();ctx.ellipse(0,0,l/2,1+random()*2.4,0,0,Math.PI*2);ctx.fill();
   ctx.restore();
  }
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
 let relief=barkBumpCache.get(id);
 if(!relief){
  relief=new T.CanvasTexture(barkReliefCanvas(tex.image,id));
  relief.wrapS=relief.wrapT=T.RepeatWrapping;relief.repeat.set(1,2);
  relief.anisotropy=4;barkBumpCache.set(id,relief);
 }
 const base=new T.CylinderGeometry(.70,1,1,10,3),profile=botanicalPhotoProfile(id);
 const m=new T.MeshStandardMaterial({color:'#ffffff',map:tex,bumpMap:relief,
  bumpScale:profile.barkBump,roughness:.93,metalness:0});
 const branches=new T.InstancedMesh(base,m,segments.length),dummy=new T.Object3D(),up=new T.Vector3(0,1,0),a=new T.Vector3(),b=new T.Vector3();
 segments.forEach((v,i)=>{
  a.set(...v[0]);b.set(...v[1]);const delta=b.clone().sub(a),len=delta.length();
  dummy.position.copy(a).addScaledVector(delta,.5);dummy.quaternion.setFromUnitVectors(up,delta.normalize());
  dummy.scale.set(v[2],len,v[2]);dummy.updateMatrix();branches.setMatrixAt(i,dummy.matrix);
 });branches.instanceMatrix.needsUpdate=true;branches.castShadow=true;branches.receiveShadow=true;
 branches.userData.botanicalLayer='branches';g.add(branches);
}
function addLeaves(g,T,items,color,needle,season,seed,id='oak'){
 if(!items.length)return;
 const mesh=new T.InstancedMesh(makeLeafGeometry(T,needle,id),foliageMaterial(T,id),items.length);
 const palette=normalizeFoliagePalette(id,season);
 const dark=new T.Color(palette.shade),sunlit=new T.Color(palette.sunlit);
 const fall=palette.fall?.map(hex=>new T.Color(hex));
 const dummy=new T.Object3D(),random=rng(seed);
 const profile=botanicalPhotoProfile(id);
 // Instance geometry is expressed in real metres; broadleaf outlines are
 // clamped by species leaf-width reference, not an arbitrary shrub-size slider.
 const widest=Math.max(.08,...leafOutline(id,16).map(([x])=>Math.abs(x)));
 const physicalScale=!needle&&Number.isFinite(profile.leafWidthCm)
  ? profile.leafWidthCm/100/(2*widest):null;
 for(let i=0;i<items.length;i++){
  const p=items[i];dummy.position.set(p.x,p.y,p.z);
  dummy.rotation.set(random()*Math.PI*2,random()*Math.PI*2,random()*Math.PI*2);
  const scale=physicalScale?Math.min(p.s,physicalScale*(.82+random()*.36)):p.s;
  dummy.scale.set(scale,scale*(needle?1:.72),scale);dummy.updateMatrix();
  mesh.setMatrixAt(i,dummy.matrix);
  const exposure=.13+random()*.80,c2=dark.clone().lerp(sunlit,exposure);
  if(fall&&!needle)c2.lerp(fall[Math.floor(random()*fall.length)],.62+random()*.33);
  mesh.setColorAt(i,c2);
 }
 mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 mesh.castShadow=true;mesh.receiveShadow=false;mesh.frustumCulled=false;
 mesh.userData.botanicalLayer='micro';g.add(mesh);
}
/* Many separate soft irregular 3D foliage masses build real canopy volume;
 * they are neither camera billboards nor a single sphere per plant. Fine
 * leaf geometry remains a second layer on top for convincing close-ups. */
/* A rooted, branching botanical spray, not a solid sphere. Each instance is
 * attached to a physically modelled terminal twig and consists of several
 * independent curved leaf/needle blades. Its origin is the branch endpoint.
 * This fixes hovering green blobs and makes canopy porous in perspective. */
function foliageSprigGeometry(T,needle,id='oak'){
 // Botanical terminal shoots in THREE DIMENSIONS, not the former hedgehog-like
 // radial pointy star. Leaves are paired along a short curved rachis; every
 // species uses its characteristic leaf outline and branchlet length.
 const vertices=[];
 const push=(a,b,c)=>vertices.push(...a,...b,...c);
 const conifer=needle,profile=conifer?coniferNeedleProfile(id):null;
 const isSmall=['birch','rowan','ash','aspen','spirea','barberry'].includes(id);
 const pairs=conifer?(id==='spruce'?18:id==='pine'?15:12):isSmall?7:5;
 const contour=leafOutline(id,10);
 const leafWidth=conifer?(id==='pine'?.013:.009):id==='birch'?.091:
  id==='spirea'?.066:id==='oak'?.135:id==='hydrangea'?.16:isSmall?.09:.12;
 const leafLength=conifer?(id==='pine'?.13:.082):id==='birch'?.115:
  id==='spirea'?.205:id==='oak'?.20:isSmall?.22:.265;
 const along=(u,v)=>[u[0]+v[0],u[1]+v[1],u[2]+v[2]];
 for(let i=0;i<pairs;i++)for(const side of [-1,1]){
  const t=(i+.7)/(pairs+1),inward=1-.25*t;
  // Growth alternates along a single twig. This prevents evenly spaced
  // spherical bursts that formerly looked like plastic sea urchins.
  const az=(i*.27+side*.34),cs=Math.cos(az),sn=Math.sin(az);
  const base=[.085*Math.sin(t*1.7),t*.67,.065*Math.cos(t*1.7)];
  const direction=[side*cs*.77, .32+.28*t, side*sn*.67];
  const transverse=[-direction[2],.06,direction[0]];
  const len=leafLength*inward,width=leafWidth*(.68+.28*Math.sin(Math.PI*t));
  const centre=along(base,[direction[0]*len*.48,direction[1]*len*.48,direction[2]*len*.48]);
  if(conifer){
   // Genuine folded 3D needles: four triangles instead of a broadleaf
   // fan. Preserves dense, connected pine/spruce crowns with ~3x less GPU work.
   const start=along(base,[direction[0]*len*.05,direction[1]*len*.05,direction[2]*len*.05]);
   const middle=along(base,[direction[0]*len*.54,direction[1]*len*.54+.011,direction[2]*len*.54]);
   const tip=along(base,[direction[0]*len,direction[1]*len+.007,direction[2]*len]);
   const left=along(middle,[transverse[0]*width,transverse[1]*width,transverse[2]*width]);
   const right=along(middle,[-transverse[0]*width,-transverse[1]*width,-transverse[2]*width]);
   push(start,left,middle);push(middle,left,tip);
   push(start,middle,right);push(middle,tip,right);
   continue;
  }
  let outline=[];
  for(const [u,v] of contour){
   // 2D leaf contour is only a parametric template; transformed leaves have
   // a genuine curved middle and a free 3D orientation.
   const vr=v*.82;
   const wave=.018*Math.sin(Math.PI*(vr+.8)*.625);
   outline.push([
    centre[0]+transverse[0]*u*width+direction[0]*vr*len,
    centre[1]+transverse[1]*u*width+direction[1]*vr*len+wave,
    centre[2]+transverse[2]*u*width+direction[2]*vr*len+
     .035*(1-Math.abs(u))*Math.cos(Math.PI*vr*.5)
   ]);
  }
  for(let j=0;j<outline.length;j++)push(centre,outline[j],outline[(j+1)%outline.length]);
 }
 const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
 geo.computeVertexNormals();
 return geo;
}
function addFoliageVolume(g,T,points,id,diameter,season,seed,quality,height){
 if(!points.length||foliageProfile(id,season).leafless)return;
 const cfg=VEGETATION_SPECIES[id],shrub=['shrub','conifer-shrub'].includes(cfg.kind);
 const r=rng(seed^0x8fc1a0),needle=['pine','spruce','juniper','thuja-globe'].includes(id);
 const source=foliageProfile(id,season),number=clamp(
  Math.round(points.length*quality*(needle?2.5:2.45)),shrub?170:680,shrub?1650:needle?2900:5400
 );
 const geometry=foliageSprigGeometry(T,needle,id);
 const material=foliageMaterial(T,id,{physical:false});
 const palette=normalizeFoliagePalette(id,season);
 const shadeColor=new T.Color(palette.shade),sunColor=new T.Color(palette.sunlit);
 const fallColors=palette.fall?.map(hex=>new T.Color(hex));
 const mesh=new T.InstancedMesh(geometry,material,number),d=new T.Object3D();
 for(let i=0;i<number;i++){
  const p=points[Math.floor(r()*points.length)];
  // The maximum 3cm placement offset remains within terminal twig thickness;
  // former ±0.5m cloud offsets were the source of hovering foliage.
  d.position.set(p.x+(r()-.5)*.055,p.y+(r()-.5)*.055,p.z+(r()-.5)*.055);
  d.rotation.set(r()*6.283,r()*6.283,r()*6.283);
  const crown=Math.max(.45,Math.min(2.4,diameter/4));
  const growth=speciesGrowthProfile(id);
  // Terminal needle shoots are longer, but individual needles stay narrow.
  // Preserve the measured crown envelope by limiting sprig radius.
  const mass=needle?(id==='spruce'?.67:id==='pine'?.72:.55):id==='birch'?.37:id==='oak'?.43:.33;
  const scale=mass*crown*(.70+r()*.54)*(growth?.leafClusterScale||1);
  d.scale.set(scale,scale*(needle?1.07:.9),scale);
  d.updateMatrix();mesh.setMatrixAt(i,d.matrix);
  const shade=foliageDepthTone(id,p.y/Math.max(.25,height),Math.hypot(p.x,p.z)/Math.max(.1,diameter*.5));
  const color=shadeColor.clone().lerp(sunColor,.15+r()*.78).multiplyScalar(shade);
  if(fallColors&&!needle)color.lerp(fallColors[Math.floor(r()*fallColors.length)],.57+r()*.36);
  mesh.setColorAt(i,color);
 }
 mesh.instanceMatrix.needsUpdate=true;
 if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 mesh.castShadow=true;mesh.receiveShadow=false;mesh.frustumCulled=false;
 mesh.userData.botanicalLayer='volume';g.add(mesh);
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
 // Crowded auto-preview intentionally caps alpha cards. Actual premium
 // geometry and surveyed crown dimensions are unaffected.
 const minimum=quality<.35?(shrub?145:420):quality<.45?(shrub?320:980):(shrub?670:2250);
 const maximum=quality<.35?(shrub?450:860):quality<.45?(shrub?900:2200):(shrub?2150:4200);
 const count=clamp(Math.round(points.length*(1.25+quality*1.55)),minimum,maximum);
 const texture=createSprayTexture(T,needle,id);
 const material=new T.MeshStandardMaterial({map:texture,alphaTest:.26,side:T.DoubleSide,roughness:.94,metalness:0,depthWrite:true});
 const mesh=new T.InstancedMesh(new T.PlaneGeometry(1,1),material,count),
  cross=new T.InstancedMesh(new T.PlaneGeometry(1,1),material.clone(),count);
 const d=new T.Object3D(),palette=normalizeFoliagePalette(id,season),
  shadeColor=new T.Color(palette.shade),sunColor=new T.Color(palette.sunlit),
  fallColors=palette.fall?.map(hex=>new T.Color(hex));
 // Wide sprays supply the distant silhouette. Close-up mesh leaves and bark
 // supply microgeometry; no large geometric leaf balls are recreated.
 for(let i=0;i<count;i++){
  const p=points[Math.floor(r()*points.length)],offset=shrub?.05:.09;
  d.position.set(p.x+(r()-.5)*offset,p.y+(r()-.5)*offset,p.z+(r()-.5)*offset);
  d.rotation.set(r()*6.283,r()*6.283,r()*6.283);
  const w=foliageSprayWidth(id,diameter)*(.72+r()*.70);
  d.scale.set(w,w,1);d.updateMatrix();mesh.setMatrixAt(i,d.matrix);
  const shade=foliageDepthTone(id,p.y/Math.max(.25,height),Math.hypot(p.x,p.z)/Math.max(.1,diameter*.5));
  const colour=shadeColor.clone().lerp(sunColor,.10+r()*.79).multiplyScalar(shade);
  if(fallColors&&!needle)colour.lerp(fallColors[Math.floor(r()*fallColors.length)],.58+r()*.32);
  mesh.setColorAt(i,colour);
  d.rotateY(Math.PI/2);d.updateMatrix();cross.setMatrixAt(i,d.matrix);
  cross.setColorAt(i,colour);
 }
 for(const tuft of [mesh,cross]){
  tuft.instanceMatrix.needsUpdate=true;
  if(tuft.instanceColor)tuft.instanceColor.needsUpdate=true;
  tuft.castShadow=quality>=.30;
  tuft.frustumCulled=false;tuft.userData.botanicalLayer='sprays';g.add(tuft);
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
 mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;
 mesh.userData.botanicalLayer='micro';g.add(mesh);
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
 // The living trunk narrows progressively toward its leader instead of being
 // one uniform pipe. Seven connected real bark segments remain inexpensive.
 const branches=[];
 for(let n=0;n<7;n++){
  const lo=n/7,hi=(n+1)/7,stemRadius=trunkRadius*(1-.65*lo);
  const sway=trunkRadius*(kind==='pine'?.24:.12);
  const start=[sway*Math.sin(lo*2.4)*lo,trunkEnd*lo,sway*Math.cos(lo*1.6)*lo];
  const end=[sway*Math.sin(hi*2.4)*hi,trunkEnd*hi,sway*Math.cos(hi*1.6)*hi];
  branches.push([start,end,stemRadius]);
 }
 const reference=referenceCanopy(id),growth=speciesGrowthProfile(id);
 const leafPoints=[],tiers=reference?Math.round(c.branches*reference.tierMultiplier):c.branches,leafless=foliageProfile(id,season).leafless;
 const specimenSeed=Math.floor(r()*100000);
 const start=height*c.crownStart,crownH=height-start;
 const centers=[];
 for(let i=0;i<tiers;i++){
  const t=(i+.5)/tiers,y=start+crownH*t,angle=i*2.399+r()*.6;
  let radial;
  // Reach the true surveyed crown envelope at mature branching tiers.
  radial=radius*naturalCrown(id,t)*(.86+r()*.14);
  const arms=growth?.primaryArms|| (kind==='spruce'?7:kind==='pine'?4:5);
  for(let k=0;k<arms;k++){
   const direction=angle+k*2*Math.PI/arms+r()*.30;
   // Uneven windward whorls instead of a regular green cone.
   const length=Math.min(radius*.995,radial*(.92+r()*.15)*specimenCrownVariation(id,t,direction,specimenSeed));
   const branchRise=conifer?(kind==='pine'?.12:-.11):growth?.branchAngle||(.2+r()*.25);
   const outerY=clamp(y+crownH*branchRise*(r()-.25)-branchTipDrop(id,height,t)*.35,.12,height*.99);
   const [tipX,tipZ]=constrainCrownRadius(Math.cos(direction)*length,Math.sin(direction)*length,radius);
   const tip=[tipX,outerY,tipZ];
   const stemY=y-(conifer?.04:.02)*height;
   curveBranch(branches,[0,stemY,0],tip,trunkRadius*(conifer?.25:.37)*(1-t*.55),height*(conifer?-.012:.028));
   if(growth&&!conifer){
    // Birch grows airy, pendant secondary shoots; oak has deep branching forks.
    // All foliage attaches to these authored branch tips, never to a random
    // spherical canopy surface or an off-centre alpha card.
    const secondary=referenceBranchTips(id,{start:[0,stemY,0],end:tip,stage:t,
     crownRadius:radius,plantHeight:height,seed:Math.floor(r()*100000)});
    for(const shoot of secondary){
     curveBranch(branches,shoot.base,shoot.tip,
      Math.max(.003,trunkRadius*shoot.thicknessFactor*(1-t*.45)),
      id==='birch'?-.035*height:.009*height);
     centers.push({x:shoot.tip[0],y:shoot.tip[1],z:shoot.tip[2]});
    }
   }
   const twigCount=kind==='pine'?6:kind==='spruce'?8:
   id==='birch'?13:id==='oak'||id==='ash'?12:id==='aspen'?14:9;
   for(let j=0;j<twigCount;j++){
    const f=(j+.2+r()*.45)/twigCount,flare=(r()-.5)*length*.4;
    const mid=[tip[0]*f,stemY+(outerY-stemY)*f,tip[2]*f];
    const [x,z]=constrainCrownRadius(mid[0]+Math.cos(direction+Math.PI/2)*flare,
     mid[2]+Math.sin(direction+Math.PI/2)*flare,radius);
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
 const max=clamp(Math.round(c.density*quality*referenceFoliageDensity(id,quality)),180,4600);
 for(let i=0;i<max;i++){
  const p=centers[Math.floor(r()*centers.length)];
  // Distribution follows reachable branch endpoints, not a random crown cloud.
  // Offset is capped to 8cm; loose leaves never hang half a metre in air.
  const offset=Math.min(.08,diameter*.012),scale=botanicalLeafScale(id,height,diameter);
  const leafY=clamp(p.y+(r()-.5)*offset,.075,height);
  const size=(conifer?(.11+r()*.12):(.11+r()*.16))*scale;
  const [leafX,leafZ]=constrainCrownRadius(p.x+(r()-.5)*offset,p.z+(r()-.5)*offset,radius);
  leafPoints.push({x:leafX,y:leafY,z:leafZ,s:size});
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
 const reference=referenceCanopy(id),growth=speciesGrowthProfile(id);
 const stems=isCreeper?24:isSpike?38:id==='hosta'?19:id==='ornamental-grass'?56:id==='hydrangea'?30:id==='spirea'?38:c.branches;
 const specimenSeed=Math.floor(r()*100000);
 for(let j=0;j<stems;j++){
  // Botanical asymmetry: individual shrubs form naturally offset branch whorls,
  // rather than a perfect radial hedgehog around their survey point.
  const az=j*2.399+r()*.34,
   dist=radius*(.48+r()*.52)*specimenCrownVariation(id,j/stems,az,specimenSeed),
   horizontal=isCreeper?1:isSpike?.72:id==='ornamental-grass'?.72:
   id==='hosta'?.89:id==='thuja-globe'?.8:1;
  const tipHeight=isCreeper?actual*(.17+r()*.23):
   id==='ornamental-grass'?actual*(.65+r()*.34):
   id==='hosta'?actual*(.31+r()*.56):
   id==='spirea'?actual*(.32+r()*.43):
   isSpike?actual*(.50+r()*.45):
   id==='boxwood'||id==='thuja-globe'?actual*(.51+r()*.47):
   actual*(.38+r()*.54);
  const [tipX,tipZ]=constrainCrownRadius(Math.cos(az)*dist*horizontal,Math.sin(az)*dist*horizontal,radius);
  const pt=[tipX,tipHeight,tipZ],
   radiusStem=id==='spirea'?.0045+r()*.0035:id==='hosta'?.0035:isSpike?.007:isCreeper?.012:.016+r()*.016;
  curveBranch(branches,[0,.045,0],pt,radiusStem,
   actual*(isCreeper?-.01:id==='spirea'?.16:.065));
  if(growth&&!isSpike){
   // Spirea is a fan of arching woody stems, with small leaf clusters
   // concentrated on laterally branched shoots, not a uniform green sphere.
   for(const shoot of referenceBranchTips(id,{start:[0,.045,0],end:pt,stage:j/stems,
    crownRadius:radius,plantHeight:actual,seed:j})){
    branches.push([shoot.base,shoot.tip,Math.max(.002,radiusStem*shoot.thicknessFactor)]);
    points.push({x:shoot.tip[0],y:shoot.tip[1],z:shoot.tip[2],s:.038+r()*.055});
   }
  }
  for(let k=0;k<15;k++){
   const f=.22+r()*.77,
    mid=[pt[0]*f,.045+(pt[1]-.045)*f,pt[2]*f],length=radius*(isCreeper?.19:isSpike?.08:.16);
   const direction=az+(r()-.5)*2.6,
    [twigX,twigZ]=constrainCrownRadius(
     mid[0]+Math.cos(direction)*length*(.25+r()*.85),
     mid[2]+Math.sin(direction)*length*(.25+r()*.85),radius),
    tip=[twigX,clamp(mid[1]+actual*(isSpike?.035:.08)*(r()-.33),.04,actual),twigZ];
   branches.push([mid,tip,Math.max(.0025,radiusStem*.32)]);
   points.push({x:tip[0],y:tip[1],z:tip[2],s:
    id==='spirea'?.045+r()*.065:evergreen?.09+r()*.10:.095+r()*.12});
   // Secondary terminal shoots add low and side foliage without detaching
   // leaves from branches. They stay inside the measured crown footprint.
   if(k%3===0&&!isSpike){
    const lateral=direction+Math.PI*.5*(r()>.5?1:-1);
    const sideLength=radius*(isCreeper?.065:.085)*(.65+r()*.35);
    const [sideX,sideZ]=constrainCrownRadius(
      tip[0]+Math.cos(lateral)*sideLength,
      tip[2]+Math.sin(lateral)*sideLength,radius);
     const end=[sideX,clamp(tip[1]+actual*(r()-.55)*.035,.04,actual),sideZ];
    branches.push([tip,end,Math.max(.0025,radiusStem*.20)]);
    points.push({x:end[0],y:end[1],z:end[2],s:evergreen?.085:.12});
   }
  }
 }
 const total=clamp(Math.round(c.density*quality*referenceFoliageDensity(id,quality)),140,1900);
 while(points.length<total){
  const p=points[Math.floor(r()*points.length)];
  // Small jitter only around already-connected twig tips.
  const [leafX,leafZ]=constrainCrownRadius(
   p.x+(r()-.5)*.045,p.z+(r()-.5)*.045,radius);
  points.push({x:leafX,y:clamp(p.y+(r()-.5)*.045,.05,actual),
   z:leafZ,s:p.s*(.88+r()*.22)});
 }
 addBranch(g,T,branches,c.bark,id);
 if(!foliageProfile(id,season).leafless){
  if(quality>=.36)addFoliageVolume(g,T,points,id,diameter,season,Math.floor(r()*4294967295),quality,height);
  if(quality>=.43)addLeaves(g,T,points,foliageProfile(id,season).color,evergreen,season,Math.floor(r()*4294967295),id);
  addFoliageSprays(g,T,points,id,season,Math.floor(r()*4294967295),quality,diameter,height);
 }
 flowerClusters(g,T,points,id,Math.floor(r()*4294967295),season);
}
export function createVegetation(T,instance,{season='summer',quality=1,mode='standard'}={}){
 const id=instance.catalogId,cfg=VEGETATION_SPECIES[id];
 if(NATIVE_UNDERSTORY[id])return createNativeUnderstory(T,instance,{season,quality,mode});
 if(!cfg)throw Error('Unknown botanical species: '+id);
 const diameter=clamp(Number(instance.diameter)||1,.2,30),height=clamp(Number(instance.height)||1,.25,40);
 const variant=clamp(Math.round(Number(instance.variant)||1),1,3),seed=hash((instance.id||id)+'|'+id+'|crown-'+variant),r=rng(seed),g=new T.Group();
 if(cfg.kind==='shrub'||cfg.kind==='conifer-shrub')generateShrub(T,g,id,height,diameter,season,r,quality);
 else generateTree(T,g,id,height,diameter,season,r,quality);
 g.userData.species=id;g.userData.physicalHeight=height;g.userData.crownDiameter=diameter;g.userData.variant=variant;
 // Large editable plots can contain hundreds of trees. Each instanced branch/
 // foliage mesh is wholly enclosed in this conservative species envelope.
 // Cull entire off-camera trees rather than drawing every offscreen needle.
 const foliageBounds=new T.Sphere(new T.Vector3(0,height*.5,0),
  Math.hypot(diameter*.5,height*.5)+Math.max(.65,diameter*.16));
 g.traverse(node=>{
  if(node.isInstancedMesh&&node.userData.botanicalLayer){
   node.boundingSphere=foliageBounds.clone();
   node.frustumCulled=true;
  }
 });
 enableBotanicalLod(g,mode);
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
 return createProfessionalGardenLight(T,instance,{night});
}
