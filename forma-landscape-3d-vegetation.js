/* FORMA VISUAL / Species-aware real 3D vegetation.
 * True branch geometry + instanced leaf meshes; no image billboards, no flat
 * cutouts. Everything uses metres and can be orbited, walked through and
 * rendered with real directional shadows. Deterministic per-object seed. */
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
function addBranch(g,T,segments,color){
 if(!segments.length)return;
 const base=new T.CylinderGeometry(1,1,1,6,1),m=new T.MeshStandardMaterial({color,roughness:1,metalness:0,flatShading:true});
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
function addFoliageVolume(g,T,points,id,diameter,season,seed,quality){
 if(!points.length||foliageProfile(id,season).leafless)return;
 const cfg=VEGETATION_SPECIES[id],shrub=['shrub','conifer-shrub'].includes(cfg.kind);
 const r=rng(seed^0x8fc1a0),conifer=['pine','spruce','juniper','thuja-globe'].includes(id);
 const crown=clamp(diameter/2,.1,15);
 const density=shrub?Math.round(220*quality):Math.round((id==='pine'?440:id==='spruce'?620:720)*quality);
 const count=clamp(density,shrub?80:150,1000),geo=new T.SphereGeometry(1,9,6);
 const verts=geo.getAttribute('position');
 // Break each lobe into botanical irregularity, never a smooth perfect ball.
 for(let i=0;i<verts.count;i++){
  const x=verts.getX(i),y=verts.getY(i),z=verts.getZ(i);
  const n=1+.13*Math.sin(x*8+z*13)+.08*Math.cos(y*15+x*11);
  verts.setXYZ(i,x*n,y*n,z*n);
 }geo.computeVertexNormals();
 const m=new T.MeshStandardMaterial({color:'#ffffff',roughness:.96,metalness:0,flatShading:false});
 const inst=new T.InstancedMesh(geo,m,count),d=new T.Object3D(),base=new T.Color(foliageProfile(id,season).color);
 const nominal=shrub?Math.max(.065,crown*.27):Math.max(.17,Math.min(.72,crown*.22));
 for(let i=0;i<count;i++){
  const p=points[Math.floor(r()*points.length)];
  const size=nominal*(.56+r()*.66)*(id==='pine'?.78:1);
  d.position.set(
   clamp(p.x+(r()-.5)*size*.75,-crown,crown),
   p.y+(r()-.5)*size*.50,
   clamp(p.z+(r()-.5)*size*.75,-crown,crown)
  );
  d.rotation.set(r()*6.28,r()*6.28,r()*6.28);
  d.scale.set(size*(.8+r()*.55),size*(.65+r()*.55),size*(.8+r()*.55));
  if(id==='willow')d.scale.y*=1.35;
  if(id==='spruce')d.scale.y*=.80;
  d.updateMatrix();inst.setMatrixAt(i,d.matrix);
  const shade=.72+r()*.56,leaf=base.clone().multiplyScalar(shade);
  if(season==='autumn'&&!conifer&&r()<.28)leaf.lerp(new T.Color('#bf6c39'),r()*.48);
  inst.setColorAt(i,leaf);
 }
 inst.instanceMatrix.needsUpdate=true;if(inst.instanceColor)inst.instanceColor.needsUpdate=true;
 inst.castShadow=true;inst.receiveShadow=true;inst.frustumCulled=false;
 g.add(inst);
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
 const needle=['pine','spruce','juniper','thuja-globe'].includes(id),count=clamp(Math.round(points.length*quality*(shrub?.85:1.2)),90,1900);
 const material=new T.MeshStandardMaterial({map:createSprayTexture(T,needle),alphaTest:.18,side:T.DoubleSide,roughness:.92,metalness:0});
 const mesh=new T.InstancedMesh(new T.PlaneGeometry(1,1),material,count),d=new T.Object3D(),tone=new T.Color(type.color);
 for(let i=0;i<count;i++){
  const p=points[Math.floor(r()*points.length)];
  const offset=shrub?.17:.40;
  d.position.set(p.x+(r()-.5)*offset,p.y+(r()-.5)*offset,p.z+(r()-.5)*offset);
  d.rotation.set(r()*6.283,r()*6.283,r()*6.283);
  const w=(shrub?.25:.61)*(.67+r()*.82);d.scale.set(w,w,1);
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
  if(kind==='spruce')radial=radius*(1-.83*t)*(.81+r()*.19);
  else if(kind==='pine')radial=radius*(.44+.56*Math.sin(t*Math.PI))*(.75+r()*.32);
  else if(kind==='willow')radial=radius*(.75+.24*r())*(.58+.42*Math.sin(t*Math.PI));
  else radial=radius*Math.pow(Math.sin(t*Math.PI),.52)*(.66+r()*.30);
  const arms=kind==='spruce'?7:kind==='pine'?4:5;
  for(let k=0;k<arms;k++){
   const direction=angle+k*2*Math.PI/arms+r()*.30;
   const length=radial*(.66+r()*.31);
   const branchRise=conifer?(kind==='pine'?.12:-.11):.2+r()*.25;
   const outerY=clamp(y+crownH*branchRise*(r()-.25),.12,height*.99);
   const tip=[Math.cos(direction)*length,outerY,Math.sin(direction)*length];
   const stemY=y-(conifer?.04:.02)*height;
   branches.push([[0,stemY,0],tip,trunkRadius*(conifer?.23:.40)*(1-t*.55)]);
   const twigCount=kind==='pine'?6:kind==='spruce'?8:9;
   for(let j=0;j<twigCount;j++){
    const f=(j+.2+r()*.45)/twigCount,flare=(r()-.5)*length*.4;
    const mid=[tip[0]*f,stemY+(outerY-stemY)*f,tip[2]*f];
    const x=mid[0]+Math.cos(direction+Math.PI/2)*flare;
    const z=mid[2]+Math.sin(direction+Math.PI/2)*flare;
    const yy=mid[1]+(kind==='willow'?-.20-height*.07*r():height*.03*r());
    if(!conifer)branches.push([mid,[x,yy,z],trunkRadius*.10*(1-t*.5)]);
    centers.push({x,y:yy,z});
   }
  }
 }
 const max=clamp(Math.round(c.density*quality),180,2500);
 for(let i=0;i<max;i++){
  const p=centers[Math.floor(r()*centers.length)];
  const d=kind==='spruce'?.16:kind==='pine'?.38:.44;
  const tx=(r()-.5)*radius*d, tz=(r()-.5)*radius*d;
  const leafY=clamp(p.y+(r()-.5)*crownH*(kind==='willow'?.21:.13),start*.8,height);
  const size=conifer?(.14+r()*.15):(.14+r()*.20);
  leafPoints.push({x:clamp(p.x+tx,-radius,radius),y:leafY,z:clamp(p.z+tz,-radius,radius),s:size});
 }
 // Birch has a visible pale trunk; Scots pine a taller open red-brown bole.
 if(id==='birch'){for(let i=0;i<8;i++){const y=height*(.12+i*.07);branches.push([[-trunkRadius,y,0],[trunkRadius,y+.055,.02],trunkRadius*.10])}}
 addBranch(g,T,branches,c.bark);
 if(!leafless){addFoliageVolume(g,T,leafPoints,id,diameter,season,Math.floor(r()*4294967295),quality);addLeaves(g,T,leafPoints,foliageProfile(id,season).color,conifer,season,Math.floor(r()*4294967295));addFoliageSprays(g,T,leafPoints,id,season,Math.floor(r()*4294967295),quality);}
 flowerClusters(g,T,leafPoints,id,Math.floor(r()*4294967295),season);
}
function generateShrub(T,g,id,height,diameter,season,r,quality){
 const c=VEGETATION_SPECIES[id],radius=diameter/2;
 const heightActual=clamp(height,.3,3.5);
 const conifer=c.kind==='conifer-shrub',branches=[],points=[];
 for(let j=0;j<c.branches;j++){
  const az=j*2.399+r()*.28,dist=radius*(.36+r()*.60);
  const spread=id==='juniper'?.43:id==='lavender'?.58:.78;
  const pt=[Math.cos(az)*dist, heightActual*(.35+r()*.55)*spread,Math.sin(az)*dist];
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
 addBranch(g,T,branches,c.bark);
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
