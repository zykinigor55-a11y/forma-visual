/* FORMA VISUAL / Scandinavian reference architecture 2026-11
 * From user-supplied photographs: standing seam snow retention, gray timber
 * terrace supported on real pedestals and floor joists, and understated
 * dark-metal technical finishing. Compact instancing; no heavyweight GLBs.
 * This is VISUAL geometry, not a code-compliant construction document.
 */
const COLOR=Object.freeze({
 metal:'#384146',snow:'#424C50',deck:'#8B9090',
 framing:'#505A5B',footing:'#767C7E',edge:'#30393E'
});
const measured=(v,fallback)=>Number.isFinite(Number(v))?Number(v):fallback;
function material(T,color,metalness=0,roughness=.83){
 return new T.MeshStandardMaterial({color,metalness,roughness});
}
function box(T,g,{w,h,d,x=0,y=0,z=0,mat,part}){
 const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);
 m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;
 m.userData.architecturePart=part;g.add(m);return m;
}
export function scandiTerracePlan(width=10,depth=8,door){
 const w=Math.max(2,measured(width,10)),d=Math.max(2,measured(depth,8));
 if(!door||w<5.5)return null;
 const stepW=Math.min(Math.max(1.4,door.width+.6),Math.max(1.45,w*.38));
 const stepLeft=door.x-stepW*.5;
 // The patio is on the LEFT of the actual measured entrance. It connects to
 // floor-height sliding-glass portals but does not cover any entrance stair.
 const left=-w*.5+.23;
 const right=Math.min(stepLeft-.20,w*.5-.24);
 const span=right-left;
 if(span<1.65)return null;
 return {left,right,span,centerX:(left+right)*.5,
  near:d*.5+.025,depth:Math.min(2.18,Math.max(1.55,d*.25)),
  level:.48,entryX:door.x,stepLeft};
}
export function addScandiTerrace(T,house,{width,depth,door}={}){
 const spec=scandiTerracePlan(width,depth,door);
 if(!spec)return null;
 const timber=material(T,COLOR.deck,0,.88);
 const edge=material(T,COLOR.edge,.12,.66);
 const structure=material(T,COLOR.framing,.10,.81);
 const concrete=material(T,COLOR.footing,0,.93);
 const far=spec.near+spec.depth,mid=(spec.near+far)*.5;
 // Continuous joists beneath real timber decking (no unsupported slab).
 for(const x of [spec.left+.08,spec.right-.08]){
  box(T,house,{w:.085,h:.165,d:spec.depth-.08,
   x,y:.348,z:mid,mat:structure,part:'scandi-deck-longitudinal-joist'});
 }
 for(let z=spec.near+.12;z<far-.01;z+=Math.min(.60,spec.depth/3)){
  box(T,house,{w:spec.span-.13,h:.112,d:.072,x:spec.centerX,y:.355,
   z,mat:structure,part:'scandi-deck-cross-joist'});
 }
 for(const x of [spec.left+.17,spec.right-.17]){
  for(const z of [spec.near+.15,far-.16]){
   box(T,house,{w:.18,h:.225,d:.18,x,y:.1125,
    z,mat:concrete,part:'scandi-deck-ground-pedestal'});
   box(T,house,{w:.09,h:.17,d:.09,x,y:.273,z,
    mat:structure,part:'scandi-deck-support-post'});
  }
 }
 // Exactly one draw call per grey deck finish; end-grain and parallel
 // 120mm timber planks make the terrace read like actual construction.
 const count=Math.max(6,Math.ceil(spec.depth/.127)),pitch=spec.depth/count;
 const geo=new T.BoxGeometry(1,1,1),mesh=new T.InstancedMesh(geo,timber,count);
 const matrix=new T.Matrix4(),scale=new T.Vector3(),
  position=new T.Vector3(),rotation=new T.Quaternion();
 const boardZ=Math.min(.119,pitch*.93);
 for(let i=0;i<count;i++){
  position.set(spec.centerX,.4765,spec.near+(i+.5)*pitch);
  scale.set(spec.span-.09,.028,boardZ);
  matrix.compose(position,rotation,scale);
  mesh.setMatrixAt(i,matrix);
 }
 mesh.instanceMatrix.needsUpdate=true;
 mesh.castShadow=mesh.receiveShadow=true;
 mesh.userData.architecturePart='scandi-terrace-horizontal-deck-boards';
 mesh.userData.boardCount=count;
 house.add(mesh);
 // Drip edge is external to the 480mm wall plinth.
 box(T,house,{w:spec.span+.055,h:.095,d:.034,x:spec.centerX,y:.395,
  z:far+.025,mat:edge,part:'scandi-deck-front-fascia'});
 for(const sx of [spec.left,spec.right]){
  box(T,house,{w:.036,h:.092,d:spec.depth+.07,x:sx,y:.395,
   z:mid,mat:edge,part:'scandi-deck-side-fascia'});
 }
 // Three 160mm rises from grade to the 480mm terrace. Two outward
 // timber steps below the finished deck must NEVER be a single 240mm jump.
 const stepW=Math.min(2.15,spec.span*.5);
 for(const [i,level] of [.32,.16].entries()){
  const stepZ=far+.20+i*.35;
  const coreH=level-.026;
  box(T,house,{w:stepW,h:coreH,d:.35,x:spec.centerX,y:coreH*.5,
   z:stepZ,mat:concrete,part:'scandi-deck-supported-approach-step'});
  box(T,house,{w:stepW+.04,h:.026,d:.36,x:spec.centerX,y:level-.013,
   z:stepZ,mat:timber,part:'scandi-deck-approach-tread'});
  box(T,house,{w:stepW+.055,h:.011,d:.018,
   x:spec.centerX,y:level-.025,z:stepZ+.18,
   mat:edge,part:'scandi-deck-step-drip-nosing'});
 }
 house.userData.scandiTerrace=spec;
 return spec;
}
export function scandiSnowGuardPlan(width=10,depth=8,rise=1.5,overhang=.6){
 const w=Math.max(2,measured(width,10)),d=Math.max(2,measured(depth,8));
 const half=w*.5+overhang,r=Math.max(.5,measured(rise,1.5));
 const lines=(w>8.5&&r>1.32)?[.76,.55]:[.73];
 return lines.flatMap(frac=>[-1,1].map(side=>({
  roofSide:side,frac,roofX:side*half*frac,
  // 320mm cassette top is +160mm from mid-plane and has pitched normal.
  y:3.5+r*(1-frac)+.238,
  zFrom:-d*.5+.28,zTo:d*.5-.28,
  bracketSpacing:.85,snowRailRadius:.021
 })));
}
export function addScandiRoofSnowGuards(T,g,{width,depth,rise,overhang,bodyHeight}={}){
 const plans=scandiSnowGuardPlan(width,depth,rise,overhang);
 const metal=material(T,COLOR.snow,.58,.38);
 const clamp=material(T,COLOR.metal,.62,.42);
 for(const plan of plans){
  const {roofX,zFrom,zTo,snowRailRadius}=plan;
  const y=bodyHeight+(plan.y-3.5),run=zTo-zFrom;
  if(run<=.5)continue;
  for(const offset of [0,.098]){
   // A pair of small round tubes runs parallel to EAVE, along Z.
   const cyl=new T.Mesh(new T.CylinderGeometry(
    snowRailRadius,snowRailRadius,run,10),metal);
   cyl.position.set(roofX,y+offset,(zFrom+zTo)*.5);
   cyl.rotation.x=Math.PI*.5;
   cyl.userData.architecturePart='scandi-standing-seam-snow-guard-tube';
   cyl.castShadow=true;cyl.receiveShadow=true;g.add(cyl);
  }
  const brackets=Math.max(3,Math.ceil(run/plan.bracketSpacing)+1);
  for(let i=0;i<brackets;i++){
   const z=zFrom+run*i/(brackets-1);
   box(T,g,{w:.078,h:.14,d:.072,x:roofX,y:y-.058,z,
    mat:clamp,part:'scandi-snow-guard-seam-bracket'});
   box(T,g,{w:.066,h:.030,d:.098,x:roofX,y:y+.078,z,
    mat:metal,part:'scandi-snow-guard-upper-tube-clamp'});
  }
 }
 g.userData.scandiSnowGuards={lines:plans.length,rails:plans.length*2,
  fastening:'standing-seam-clamps'};
 return plans.length;
}
