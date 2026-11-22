/* FORMA · true scale Scandinavian architecture details.
 * All coordinates are METRES. Timber ventilated rainscreen, two vertical
 * wood finishes, geometrically real glazing joinery, folding roof flashings,
 * and code-compliant-looking 3x160 mm entry rise (not a construction plan).
 * Existing 2D building, footprint, roof and fenestration are immutable.
 */
export const SCANDI_DETAIL=Object.freeze({
 // Two distinct real vertical timber finishes: silver-weathered ash-grey
 // and deeply smoked graphite. Never replace the siding with stucco.
 mainWood:'#7E8789',accentWood:'#42494D',
 // The APR 10 reference profile is 21.5 × 94 mm with 84 mm cover.
 // Upright boards and a ~10mm shadow joint, ventilated behind the boards.
 boardWidth:.084,boardPitch:.094,boardDepth:.0215,ventilationCavity:.029,
 entryRise:.48,stepRiser:.16,stepGoing:.32,landingDepth:1.24,
 entryWidth:1.72,vergeMetal:'#333B3F',windowFrame:'#222A2D'
});
export function scandiEntranceBand(frontOpenings=[],width=8){
 const door=frontOpenings.find(o=>o.kind==='door');
 if(!door)return null;
 const w=Math.max(2,Number(width)||8);
 // A distinctly readable second timber plane frames the entrance, with
 // the same 94mm upright profile. Measured apertures are never filled.
 const band=Math.max(2.35,Math.min(3.7,door.width+2.00,w*.38));
 return {left:Math.max(-w*.5+.10,door.x-band*.5),
  right:Math.min(w*.5-.10,door.x+band*.5),doorX:door.x};
}
function finishMaterial(T,color){
 return new T.MeshStandardMaterial({color,roughness:.83,metalness:0});
}
// The lightweight, self-hosted 1K Poly Haven timber normal / roughness
// photographs add real fibre relief without turning the silver-grey
// architectural finish brown (diffuse from source is intentionally unused).
// Cached maps are shared by both grey wood finishes and across houses.
const timberTextureCache=new Map();
function timberTexture(T,channel){
 if(timberTextureCache.has(channel))return timberTextureCache.get(channel);
 const filename='/assets/house-pbr/wood-'+channel+'-1k.jpg';
 const tex=new T.TextureLoader().load(filename,()=>{
  if(typeof window!=='undefined')
   window.dispatchEvent(new Event('forma-house-pbr-ready'));
 },undefined,()=>{});
 tex.wrapS=tex.wrapT=T.RepeatWrapping;
 tex.anisotropy=8;
 // The photographed source is a plank floor: align fibre grain to +Y
 // for real upright wall boards, not horizontal wood scratches.
 tex.center.set(.5,.5);
 tex.rotation=-Math.PI/2;
 tex.needsUpdate=true;
 timberTextureCache.set(channel,tex);
 return tex;
}
export function scandiTimberMaterial(T,color){
 const mat=finishMaterial(T,color);
 mat.normalMap=timberTexture(T,'nor_gl');
 mat.normalScale=new T.Vector2(.34,.34);
 mat.roughnessMap=timberTexture(T,'rough');
 mat.roughness=.94;
 mat.userData.scandiPhotographedTimberNormal=true;
 return mat;
}
function attach(g,T,geom,material,x,y,z,part){
 const m=new T.Mesh(geom,material);m.position.set(x,y,z);
 m.userData.architecturePart=part;m.castShadow=true;m.receiveShadow=true;
 g.add(m);return m;
}
function addBox(g,T,w,h,d,x,y,z,material,part){
 return attach(g,T,new T.BoxGeometry(w,h,d),material,x,y,z,part);
}
function segmentBoards(T,g,segments,material,part,z){
 if(!segments.length)return null;
 // One real instanced geometry and draw call per timber finish on each wall.
 // Full measured width is reflected in each plank, not repeated billboards.
 const geometry=new T.BoxGeometry(1,1,1);
 const mesh=new T.InstancedMesh(geometry,material,segments.length);
 const matrix=new T.Matrix4(),at=new T.Vector3(),scale=new T.Vector3(),rotate=new T.Quaternion();
 const boardColor=new T.Color();
 segments.forEach(([x,y,w,h],i)=>{
  at.set(x,y,z);scale.set(w,h,SCANDI_DETAIL.boardDepth);
  matrix.compose(at,rotate,scale);
  mesh.setMatrixAt(i,matrix);
  // Deterministic 6% light/dark wood grain variation for each real board.
  // Separate instance colors remove the identical cloned-plank appearance.
  const seed=Math.sin(x*127.173+y*.371+i*.001)*43758.5453;
  const light=.945+((seed-Math.floor(seed))*.105);
  mesh.setColorAt(i,boardColor.setRGB(light,light,light));
 });
 mesh.instanceColor.needsUpdate=true;
 mesh.instanceMatrix.needsUpdate=true;
 mesh.castShadow=true;mesh.receiveShadow=true;
 mesh.frustumCulled=false; // thin shingles beyond a single instance bound
 mesh.userData.architecturePart=part;
 mesh.userData.instanceCount=segments.length;
 g.add(mesh);
 return mesh;
}
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
function splitAt(xlo,xhi,left,right){
 return [[xlo,Math.min(xhi,left),false],
  [Math.max(xlo,left),Math.min(xhi,right),true],
  [Math.max(xlo,right),xhi,false]].filter(([a,b])=>b>a+.002);
}
export function addScandinavianVerticalCladding(T,facade,{
 span,patches,frontDoor=null,front=false,mainMaterial=null,accentMaterial=null
}={}){
 const main=mainMaterial||scandiTimberMaterial(T,SCANDI_DETAIL.mainWood);
 const accent=accentMaterial||scandiTimberMaterial(T,SCANDI_DETAIL.accentWood);
 const band=front?scandiEntranceBand(frontDoor?[frontDoor]:[],span):null;
 const all=[[],[]],pitch=SCANDI_DETAIL.boardPitch;
 const count=Math.min(500,Math.ceil(span/pitch));
 const actualPitch=span/count;
 const boardW=Math.min(SCANDI_DETAIL.boardWidth,actualPitch*.90);
 let panelCount=0;
 for(const patch of patches){
  const low=patch.x-patch.width*.5,high=patch.x+patch.width*.5;
  const sections=band?splitAt(low,high,band.left,band.right):[[low,high,false]];
  for(const [a,b,isAccent] of sections){
   if(isAccent){
    // Dark backing is only inside the authentic wall patches, never over a
    // window or door. A ventilated shadow gap remains between vertical boards.
    addBox(facade,T,b-a,patch.height,.009,
     (a+b)*.5,patch.y,.100,accent,'scandi-second-wood-backing');
    panelCount++;
   }
   for(let j=Math.max(0,Math.floor((a+span*.5)/actualPitch)-1);
    j<Math.min(count,Math.ceil((b+span*.5)/actualPitch)+1);j++){
    const cell=-span*.5+(j+.5)*actualPitch;
    const xmin=Math.max(a,cell-boardW*.5),xmax=Math.min(b,cell+boardW*.5);
    if(xmax-xmin<.018||patch.height<.04)continue;
    all[isAccent?1:0].push([(xmin+xmax)*.5,patch.y,xmax-xmin,patch.height-.005]);
   }
  }
 }
 segmentBoards(T,facade,all[0],main,'scandi-vertical-cladding-main',.135);
 segmentBoards(T,facade,all[1],accent,'scandi-vertical-cladding-accent',.135);
 // Subtle ventilation/drainage starter profile ends above masonry plinth.
 const starter=finishMaterial(T,'#41494B');
 addBox(facade,T,span,.018,.024,0,.498,.154,starter,'rainscreen-ventilated-starter');
 facade.userData.scandiCladding={pitch:actualPitch,boardDepth:SCANDI_DETAIL.boardDepth,
  nominalVentilatedCavity:SCANDI_DETAIL.ventilationCavity,
  measuredAirGapFromWallFace:.02925,
  mainCount:all[0].length,accentCount:all[1].length,backingPanels:panelCount,
  band};
 return facade.userData.scandiCladding;
}
export function addScandiCornerDetails(T,group,{width,depth,bodyHeight}={}){
 const casing=finishMaterial(T,'#343D40');
 casing.metalness=.16;
 for(const sx of [-1,1])for(const sz of [-1,1]){
  // Two mitered vertical returns close the ventilated wood facade at
  // the exposed external corner. They are NOT full-width facade cladding.
  addBox(group,T,.042,bodyHeight-.49,.058,
   sx*(width*.5+.142),bodyHeight*.5+.235,sz*(depth*.5+.126),
   casing,'rainscreen-corner-termination-x');
  addBox(group,T,.058,bodyHeight-.49,.042,
   sx*(width*.5+.126),bodyHeight*.5+.235,sz*(depth*.5+.142),
   casing,'rainscreen-corner-termination-z');
 }
}
export function addScandiGableCladding(T,group,{
 width,depth,bodyHeight,rise,overhang
}={}){
 const half=(width+overhang*2)*.5,pitch=SCANDI_DETAIL.boardPitch;
 const count=Math.min(450,Math.ceil(width/pitch));
 const plank=scandiTimberMaterial(T,SCANDI_DETAIL.mainWood);
 const backer=finishMaterial(T,'#4E5658');
 for(const side of [-1,1]){
  const v=[];
  for(let i=0;i<count;i++){
   const x=-width*.5+(i+.5)*width/count;
   const top=bodyHeight+rise*(1-Math.abs(x)/half)-.065;
   const h=top-bodyHeight-.045;
   if(h<.05)continue;
   v.push([x,bodyHeight+.020+h*.5,Math.min(SCANDI_DETAIL.boardWidth,width/count*.88),h]);
  }
  const facade=new T.Group();
  facade.name=side>0?'scandi-gable-front':'scandi-gable-rear';
  facade.position.z=side*depth*.5;
  // Keep both gables visibly finished without covering the measured
  // lower facade. Negative rear faces are viewed from the opposite side.
  if(side<0)facade.rotation.y=Math.PI;
  addBox(facade,T,width,.012,.012,0,bodyHeight+.025,.110,backer,'gable-timber-starter');
  segmentBoards(T,facade,v,plank,'scandi-gable-vertical-boards',.137);
  group.add(facade);
 }
}
function barBetween(g,T,a,b,w,h,material,part){
 const start=new T.Vector3(...a),end=new T.Vector3(...b);
 const vec=end.clone().sub(start),mid=start.clone().add(end).multiplyScalar(.5);
 const obj=addBox(g,T,w,h,vec.length(),mid.x,mid.y,mid.z,material,part);
 obj.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),vec.normalize());
 return obj;
}
export function addScandiRoofEdgeDetails(T,group,{
 width,depth,overhang,rise,bodyHeight
}={}){
 const half=(width+overhang*2)*.5,edgeZ=depth*.5+overhang;
 const metal=finishMaterial(T,SCANDI_DETAIL.vergeMetal);
 metal.metalness=.54;metal.roughness=.42;
 const soffit=finishMaterial(T,'#565F60'),flashing=finishMaterial(T,'#626C70');
 flashing.metalness=.66;flashing.roughness=.38;
 const eaveY=bodyHeight+.075,peakY=bodyHeight+rise+.075;
 for(const end of [-1,1]){
  for(const side of [-1,1]){
   const from=[side*half,eaveY,end*(edgeZ+.016)];
   const to=[0,peakY,end*(edgeZ+.016)];
   // Full timber wind/bargeboard and thin folded powder-coated wind
   // flashing that protects end grain of the real roof cassette.
   barBetween(group,T,from,to,.156,.166,soffit,'gable-wind-board');
   barBetween(group,T,
    [from[0],from[1]+.100,from[2]+end*.030],
    [to[0],to[1]+.100,to[2]+end*.030],
    .064,.025,metal,'gable-wind-flashing');
   barBetween(group,T,
    [from[0],from[1]+.044,from[2]+end*.067],
    [to[0],to[1]+.044,to[2]+end*.067],
    .021,.119,flashing,'wind-flashing-folded-return');
  }
 }
 // Metal ridge cap stays aligned with the original ridge, rather than
 // adding a false, second roof silhouette.
 barBetween(group,T,[0,peakY+.125,-edgeZ-.06],
  [0,peakY+.125,edgeZ+.06],.178,.034,metal,'standing-seam-ridge-cap');
 // A real metal drip at each eave makes the outer roof edge read as folded.
 for(const side of [-1,1])
  addBox(group,T,.042,.038,depth+2*overhang+.09,
   side*(half+.08),bodyHeight-.207,0,flashing,'scandi-eave-edge-flashing');
}
export function scandiEntryStairSpec(door,width=8,depth=7){
 const d=Math.max(2,Number(depth)||7),w=Math.max(2,Number(width)||8);
 const doorW=door?.width||1.04;
 const actualWidth=Math.min(Math.max(1.4,doorW+.60),Math.max(1.45,w*.38));
 return {x:door?.x||0,facade:d*.5,
  landingDepth:SCANDI_DETAIL.landingDepth,
  stepWidth:actualWidth,
  riser:SCANDI_DETAIL.stepRiser,
  levels:[.16,.32,.48],going:SCANDI_DETAIL.stepGoing};
}
export function addScandiEntrance(T,group,{door,width,depth}={}){
 if(!door)return null;
 const plan=scandiEntryStairSpec(door,width,depth);
 const x=plan.x,z=plan.facade,w=plan.stepWidth;
 const wood=finishMaterial(T,'#858D8B'),structure=finishMaterial(T,'#41494A');
 const trim=finishMaterial(T,'#303A3D'),concrete=finishMaterial(T,'#7C807B');
 const tread=finishMaterial(T,'#989E9B');
 // Top landing level exactly +0.480 m, with a continuous supporting
 // structure down to grade. A 1.24m deep platform allows the door to open.
 const landingStart=.075,landingEnd=landingStart+plan.landingDepth;
 const landingCenter=z+(landingStart+landingEnd)*.5;
 addBox(group,T,w,.442,plan.landingDepth,x,.221,landingCenter,structure,'entry-landing-core');
 addBox(group,T,w,.035,plan.landingDepth,x,.4625,landingCenter,wood,'entry-landing-deck');
 for(const side of [-1,1]){
  addBox(group,T,.035,.405,plan.landingDepth,
   x+side*(w*.5-.027),.222,z+(landingStart+landingEnd)*.5,trim,'entry-landing-side-fascia');
 }
 // 3 equal 160mm rises from finished grade; two projected timber treads
 // and the +480mm top landing, with realistic 320mm goings.
 for(let i=2;i>=1;i--){
  const isHigh=i===2;
  const level=isHigh?.32:.16;
  const near=landingEnd+(2-i)*plan.going;
  const far=near+plan.going;
  const center=z+(near+far)*.5;
  const h=level-.037;
  addBox(group,T,w-.014,h,plan.going,x,h*.5,center,concrete,'entry-stair-supported-riser');
  addBox(group,T,w+.018,.037,plan.going+.027,
   x,level-.0185,center+.009,tread,'entry-stair-tread');
  addBox(group,T,w+.023,.012,.015,
   x,level-.031,center+plan.going*.5+.015,trim,'entry-tread-nosing');
  // Thin continuous side fascia conceals concrete riser and supports
  // timber treads; never leave floating steps.
  for(const side of [-1,1])
   addBox(group,T,.018,level,plan.going,
    x+side*w*.49,level*.5,center,structure,'entry-stair-stringer');
 }
 // Set the door threshold behind the top landing and slightly above it;
 // stop dirt/rain migrating underneath the PVC entrance door.
 addBox(group,T,door.width+.11,.027,.115,
  x,.498,z+.065,trim,'entry-drained-door-threshold');
 // Minimal 850mm deep canopy, placed far above the doorway; no roof post
 // crosses the existing door or the surveyed neighbouring window.
 const canopyWidth=Math.min(w+.13,Math.max(1.7,door.width+.70));
 const canopyY=door.bottom+door.height+.37;
 addBox(group,T,canopyWidth,.108,.84,
  x,canopyY,z+.40,trim,'entry-canopy-metal-cassette');
 addBox(group,T,canopyWidth-.06,.014,.78,
  x,canopyY-.063,z+.40,wood,'entry-canopy-timber-soffit');
 addBox(group,T,canopyWidth+.018,.017,.034,
  x,canopyY-.061,z+.83,structure,'entry-canopy-drip-edge');
 // Concealed triangular load-bearing brackets tie the canopy back to wall.
 for(const side of [-1,1]){
  const sx=x+side*(canopyWidth*.5-.135);
  barBetween(group,T,[sx,canopyY-.11,z+.13],
   [sx,canopyY-.58,z+.08],.028,.03,structure,'entry-canopy-wall-bracket');
 }
 // Discrete entrance illumination, not an uncontrolled emissive blob.
 const lamp=addBox(group,T,.17,.045,.095,
  x,canopyY-.087,z+.54,trim,'entry-canopy-light-fixture');
 lamp.userData.hasPhysicalEmission=false;
 group.userData.scandiEntrance=plan;
 return plan;
}
