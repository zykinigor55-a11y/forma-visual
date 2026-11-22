/* FORMA VISUAL · АЛЬФА / reference A-frame, 2026-11-22.
 * Reference: user's 7.5 × 9.5 m timber A-frame screenshot.
 * Photographic likeness, not engineering drawings. Local axes:
 * X = frontage, Z = building length, +Z = glazed entrance.
 * All sizes are metres. Never changes the authored footprint or placement.
 * Four real holes in the metal roof accommodate flush roof windows.
 */
import {alphaGraphitePBR,alphaFacadePanel} from './forma-landscape-3d-alpha-cladding-pbr.js?v=alpha-wall-240-v1-20261122';
import {addAlphaGlazedFacade,addAlphaVisibleInterior} from './forma-landscape-3d-alpha-windows.js?v=alpha-night-v1-20261122';
import {addAlphaFrontWallVolume,addAlphaRearWallVolume,addAlphaRoofCassetteEnds} from './forma-landscape-3d-alpha-openings.js?v=alpha-wall-240-v1-20261122';
import {normalizeNightInterior,interiorLightColor} from './forma-landscape-3d-night-interior.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function finish(T,color,roughness=.76,metalness=0){
 return new T.MeshStandardMaterial({color,roughness,metalness});
}
const deckPbrCache=new WeakMap();
function alphaNordicDeckMaterial(T){
 // Existing licensed/self-hosted 1K wood PBR: fine grain without extra slat meshes.
 // Fallback keeps the deck usable in headless tests and slow mobile connections.
 const material=finish(T,'#C3A98B',.89,.015);
 if(!T.TextureLoader||typeof window==='undefined')return material;
 let maps=deckPbrCache.get(T);
 if(!maps){
  const loader=new T.TextureLoader();
  const load=(channel)=>{
   const map=loader.load('/assets/house-pbr/wood-'+channel+'-1k.jpg',
    ()=>window.dispatchEvent(new Event('forma-house-pbr-ready')));
   map.wrapS=map.wrapT=T.RepeatWrapping;
   map.repeat.set(3.2,1.4);
   map.anisotropy=8;
   if(channel==='diff')map.colorSpace=T.SRGBColorSpace;
   return map;
  };
  maps={color:load('diff'),normal:load('nor_gl'),roughness:load('rough')};
  deckPbrCache.set(T,maps);
 }
 material.map=maps.color;
 material.normalMap=maps.normal;
 if(T.Vector2)material.normalScale=new T.Vector2(.21,.21);
 material.roughnessMap=maps.roughness;
 material.needsUpdate=true;
 return material;
}
function box(T,g,w,h,d,x,y,z,material,part){
 const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material);
 mesh.position.set(x,y,z);
 mesh.castShadow=mesh.receiveShadow=true;
 mesh.userData.architecturePart=part;
 g.add(mesh);return mesh;
}
function beam(T,g,a,b,w,h,material,part){
 const v=new T.Vector3(...a),q=new T.Vector3(...b);
 const delta=q.clone().sub(v);
 const mesh=box(T,g,w,h,delta.length(),
  (v.x+q.x)/2,(v.y+q.y)/2,(v.z+q.z)/2,material,part);
 mesh.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),delta.normalize());
 return mesh;
}
function triangle(T,g,coords,material,part){
 const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.Float32BufferAttribute(coords,3));
 geo.computeVertexNormals();
 const mesh=new T.Mesh(geo,material);mesh.castShadow=true;mesh.receiveShadow=true;
 mesh.userData.architecturePart=part;g.add(mesh);return mesh;
}
function roofMesh(T,g,side,profile,holes,material,offset,part){
 const {slope,depth,half,rise,eave}=profile;
 const shape=new T.Shape();
 shape.moveTo(0,0);shape.lineTo(slope,0);
 shape.lineTo(slope,depth);shape.lineTo(0,depth);shape.closePath();
 for(const h of holes){
  // Reversed winding for true punched roof apertures, not tinted decals.
  const hole=new T.Path();
  hole.moveTo(h.u,h.v);hole.lineTo(h.u,h.v+h.dv);
  hole.lineTo(h.u+h.du,h.v+h.dv);hole.lineTo(h.u+h.du,h.v);
  hole.closePath();shape.holes.push(hole);
 }
 const geo=new T.ShapeGeometry(shape,1);
 const pos=geo.getAttribute('position'),uv=geo.getAttribute('uv');
 for(let i=0;i<pos.count;i++){
  const u=pos.getX(i),v=pos.getY(i),f=u/slope;
  pos.setXYZ(i,side*half*(1-f),eave+rise*f+offset,v-depth/2);
  uv.setXY(i,u*.32,v*.23);
 }
 pos.needsUpdate=true;geo.computeVertexNormals();
 const mesh=new T.Mesh(geo,material);
 mesh.receiveShadow=mesh.castShadow=true;mesh.userData.architecturePart=part;
 g.add(mesh);return mesh;
}
function addRoof(T,g,profile,{night=false,interior=null}={}){
 const {slope,depth,half,rise,eave}=profile;
 const roof=finish(T,'#1C282B',.41,.66);
 roof.side=T.DoubleSide;
 const underside=finish(T,'#343B3D',.87,.09);
 underside.side=T.DoubleSide;
 const seam=finish(T,'#3E4B4C',.39,.64);
 const trim=finish(T,'#252F32',.46,.59);
 const gasket=finish(T,'#141B1D',.94,.02);
 const indoor=normalizeNightInterior(interior),
  lighted=night&&indoor.lightsEnabled&&indoor.brightness>0&&indoor.visibility!=='off';
 const glass=new T.MeshPhysicalMaterial({
  // Rooflights stay dark smoked; only actual authored indoor light can
  // warm them. Existing measured roof openings remain unchanged.
  color:'#2D393D',roughness:.065,metalness:0,
  transparent:true,opacity:lighted?(indoor.visibility==='full'?.42:.55):.66,
  depthWrite:false,ior:1.52,clearcoat:.71,clearcoatRoughness:.055,
  side:T.DoubleSide,envMapIntensity:1.26,
  emissive:interiorLightColor(indoor.temperature),
  emissiveIntensity:lighted?indoor.windowGlow/100*.055:0
 });
 const windowLength=clamp(slope*.23,1.35,1.85);
 const windowWidth=clamp(depth*.057,.38,.57);
 const holeList=[];
 const roofPoint=(side,u,v,offset=0)=>[
  side*half*(1-u/slope),eave+rise*(u/slope)+offset,v-depth/2
 ];
 // The four thin rooflights belong to the left roof plane in the reference.
 // Two pairs are arranged along the roof incline, close to the front half.
 for(const v of [depth*.60,depth*.735]){
  for(const u of [slope*.17,slope*.49]){
   holeList.push({u,v,du:windowLength,dv:windowWidth});
  }
 }
 for(const side of [-1,1]){
  const holes=side===-1?holeList:[];
  roofMesh(T,g,side,profile,holes,roof,.04,'alpha-standing-seam-roof-with-openings');
  roofMesh(T,g,side,profile,holes,underside,-.18,'alpha-roof-underlay-with-openings');
  // Continuous seam ribs follow the full slope, and stop at rooflights.
  for(let v=.26;v<depth-.20;v+=.58){
   const blocked=holes.filter(h=>v>h.v-.03&&v<h.v+h.dv+.03)
    .map(h=>[h.u-.07,h.u+h.du+.07]).sort((a,b)=>a[0]-b[0]);
   let cursor=.05;
   for(const [lo,hi] of [...blocked,[slope-.04,slope-.04]]){
    if(lo>cursor+.08)
     beam(T,g,roofPoint(side,cursor,v,.077),roofPoint(side,lo,v,.077),
      .021,.032,seam,'alpha-standing-seam-rib');
    cursor=Math.max(cursor,hi);
   }
  }
  // Folded verge and ridge covers, not the heavy faux fascia on the old A-frame.
  for(const v of [.015,depth-.015])
   beam(T,g,roofPoint(side,0,v,.03),roofPoint(side,slope,v,.03),
    .095,.065,trim,'alpha-roof-verge-flashing');
  beam(T,g,roofPoint(side,.06,0,-.05),roofPoint(side,.06,depth,-.05),
   .16,.065,trim,'alpha-roof-base-apron');
 }
 const peak=eave+rise;
 beam(T,g,[0,peak+.055,-depth/2-.03],[0,peak+.055,depth/2+.03],
  .115,.075,trim,'alpha-folded-ridge-cap');
 // Four recessed insulating glass rooflights; each opening remains clear
 // through BOTH upper metal and lower soffit layers.
 for(const h of holeList){
  const side=-1,{u,v,du,dv}=h;
  // Close the roof cassette around the punched aperture instead of leaving
  // a paper-thin edge between the metal and the underlay.
  for(const edgeU of [u,u+du])
   beam(T,g,roofPoint(side,edgeU,v,-.070),
    roofPoint(side,edgeU,v+dv,-.070),.057,.22,gasket,
    'alpha-rooflight-insulated-side-reveal');
  for(const edgeV of [v,v+dv])
   beam(T,g,roofPoint(side,u,edgeV,-.070),
    roofPoint(side,u+du,edgeV,-.070),.057,.22,gasket,
    'alpha-rooflight-insulated-end-reveal');
  const windowShape=new T.Shape();
  windowShape.moveTo(u+.043,v+.042);
  windowShape.lineTo(u+du-.043,v+.042);
  windowShape.lineTo(u+du-.043,v+dv-.042);
  windowShape.lineTo(u+.043,v+dv-.042);
  windowShape.closePath();
  const geo=new T.ShapeGeometry(windowShape);
  const p=geo.getAttribute('position');
  for(let i=0;i<p.count;i++){
   const uu=p.getX(i),vv=p.getY(i);
   p.setXYZ(i,...roofPoint(side,uu,vv,.023));
  }
  p.needsUpdate=true;geo.computeVertexNormals();
  const pane=new T.Mesh(geo,glass);pane.userData.architecturePart='alpha-recessed-rooflight-ig-glass';
  pane.castShadow=false;pane.receiveShadow=true;g.add(pane);
  for(const uu of [u,u+du]){
   beam(T,g,roofPoint(side,uu,v,.067),roofPoint(side,uu,v+dv,.067),
    .068,.065,trim,'alpha-rooflight-side-flashing');
   beam(T,g,roofPoint(side,uu+.017,v+.034,.021),
    roofPoint(side,uu+.017,v+dv-.034,.021),
    .012,.017,gasket,'alpha-rooflight-glazing-gasket');
  }
  for(const vv of [v,v+dv]){
   beam(T,g,roofPoint(side,u,vv,.067),roofPoint(side,u+du,vv,.067),
    .068,.055,trim,'alpha-rooflight-head-sill-flashing');
  }
  beam(T,g,roofPoint(side,u+du*.5,v,.072),roofPoint(side,u+du*.5,v+dv,.072),
   .025,.026,trim,'alpha-rooflight-central-sash');
 }
 addAlphaRoofCassetteEnds(T,g,profile,{outerOffset:.04,underlayOffset:-.18});
 g.userData.alphaRoof={roofType:'folded standing seam',skylights:holeList.length,
  actualCutouts:true,rise,metalFinish:'graphite'};
}
function addFacades(T,g,{w,d,eave,rise,half},night,interior=null){
 const peak=eave+rise,glassBase=eave+rise*.347;
 const front=d/2+.058,rear=-d/2-.061;
 // One seamless UV-mapped PBR facade per end, not hundreds of slat meshes.
 const cladding=alphaGraphitePBR(T,w);
 const doorW=Math.min(w*.67,Math.max(2.3,w-1.1));
 const doorBottom=.49;
 const doorTop=Math.min(glassBase-.11,2.61);
 const glassHalf=half*(1-(glassBase-eave)/rise)-.12;
 const top=peak-.34;
 // Professional fenestration is separate from the graphite PBR siding.
 // Ultra-light transparent insulated glass reveals a real recessed interior;
 // thin aluminium profiles, gaskets, drainage and timber A-rafters stay 3D.
 addAlphaGlazedFacade(T,g,{
  w,d,eave,rise,half,front,glassBase,top,glassHalf,doorTop,doorW,night,interior
 });
 // Flat UV-mapped PBR cladding, only TWO facade meshes in the A-frame.
 // Window and door openings remain real cutouts, not opaque blue decals.
 alphaFacadePanel(T,g,{
  half,base:.49,peak:peak-.070,z:front+.006,width:w,front:true,
  material:cladding,doorHalf:doorW*.5,doorBottom:doorBottom+.008,
  doorTop:doorTop+.016,
  glassHalf,glassBase:glassBase-.012,glassTop:top+.003
 });
 alphaFacadePanel(T,g,{
  half,base:.49,peak:peak-.070,z:rear-.010,width:w,front:false,
  material:cladding
 });
 // 240mm volumetric front and rear wall cassettes. Never shift the outer
 // footprint, facade PBR UVs or the existing main-house scene transform.
 const outline={
  half,base:.49,peak:peak-.070,width:w,
  doorHalf:doorW*.5,doorBottom:doorBottom+.008,doorTop:doorTop+.016,
  glassHalf,glassBase:glassBase-.012,glassTop:top+.003
 };
 addAlphaFrontWallVolume(T,g,{...outline,front},alphaFacadePanel);
 addAlphaRearWallVolume(T,g,{
  half,base:.49,peak:peak-.070,width:w,rear,
  createPanel:alphaFacadePanel
 });
 // Folded weathering drip along the base of the textured rainscreen.
 const apron=finish(T,'#41494B',.51,.53);
 box(T,g,w+.035,.024,.075,0,.491,front+.038,apron,
  'alpha-front-textured-facade-bottom-flashing');
 box(T,g,w+.035,.024,.075,0,.491,rear-.038,apron,
  'alpha-rear-textured-facade-bottom-flashing');
 // Sliding threshold, sill slope and water-drip are now placed correctly
 // INSIDE the reveal by ALFA_OPENING_DETAIL rather than in front of cladding.
 g.userData.alphaGlazing={upperTriangle:true,lowerSlidingLeaves:4,
  exteriorFinish:'single UV-mapped graphite PBR texture; no individual 3D boards'};
}
function addDeck(T,g,w,d){
 const near=d*.5+.065,depth=Math.min(2.1,Math.max(1.65,d*.235));
 const left=-w*.5-.05,right=w*.5+.72,span=right-left;
 const far=near+depth,center=(near+far)/2,xc=(left+right)/2;
 const decking=alphaNordicDeckMaterial(T),edge=finish(T,'#675344',.83,.02);
 const joist=finish(T,'#4A4540',.84,.02);
 const posts=finish(T,'#5C5E58',.89,.02);
 // Exposed supported framing, not a floating cantilevered slab.
 for(const x of [left+.13,right-.13]){
  box(T,g,.12,.19,depth,x,.350,center,joist,'alpha-terrace-side-joist');
 }
 for(let z=near+.10;z<far+.05;z+=.57)
  box(T,g,span-.10,.095,.09,xc,.36,z,joist,'alpha-terrace-cross-joist');
 for(const x of [left+.26,0,right-.26]){
  for(const z of [near+.18,far-.22])
   box(T,g,.18,.32,.18,x,.16,z,posts,'alpha-deck-ground-support');
 }
 const n=Math.max(12,Math.ceil(depth/.126)),pitch=depth/n;
 const batched=new T.InstancedMesh(new T.BoxGeometry(1,1,1),decking,n);
 const matrix=new T.Matrix4(),position=new T.Vector3(),scale=new T.Vector3(),q=new T.Quaternion();
 for(let i=0;i<n;i++){
  position.set(xc,.473,near+(i+.5)*pitch);
  scale.set(span-.026,.038,pitch-.008);
  matrix.compose(position,q,scale);batched.setMatrixAt(i,matrix);
 }
 batched.instanceMatrix.needsUpdate=true;
 batched.castShadow=batched.receiveShadow=true;
 batched.userData.architecturePart='alpha-supported-natural-timber-deck-planks';
 g.add(batched);
 box(T,g,span,.105,.05,xc,.406,far+.015,edge,'alpha-terrace-front-fascia');
 box(T,g,.05,.105,depth,right,.406,center,edge,'alpha-terrace-return-fascia');
 // Two external treads with 160 mm risers, matching a 480 mm finish level.
 // On the reference the short approach is offset to the LEFT, not centred.
 const stairX=left+.61,stairW=Math.min(1.35,w*.22);
 for(const [i,level] of [.32,.16].entries()){
  const stepDepth=.36,stepFar=far+.14+i*stepDepth;
  box(T,g,stairW,level-.024,stepDepth,stairX,(level-.024)/2,
   stepFar+stepDepth*.5,joist,'alpha-terrace-supported-step-core');
  box(T,g,stairW+.035,.028,stepDepth+.024,stairX,level-.014,
   stepFar+stepDepth*.5,decking,'alpha-terrace-timber-step-tread');
  box(T,g,stairW+.04,.020,.024,stairX,level-.032,
   stepFar+stepDepth+.015,edge,'alpha-terrace-step-nosing');
 }
 g.userData.alphaTerrace={supported:true,level:.48,depth,width:span,
  stairPosition:'left'};
}
export function addAlphaReferenceHouse(T,g,b,{width=7.5,depth=9.5,night=false,interior=null}={}){
 const w=Math.max(2,Number(width)||7.5),d=Math.max(2,Number(depth)||9.5);
 // Clamp after conversion, including explicit 0/invalid roofRise.
 const reqRise=Number(b?.roofRise);
 const rise=clamp(reqRise>1?reqRise:w*.79,4.2,8);
 const eave=.65,overhang=.22,half=w*.5+overhang;
 const profile={w,d,eave,rise,half,
  depth:d+overhang*2,slope:Math.hypot(half,rise)};
 const group=new T.Group();group.name='alpha-reference-architecture';
 g.add(group);
 // Real interior geometry must sit behind transparent glass in +Z front.
 // Order does not change the existing house footprint or local origin.
 addAlphaVisibleInterior(T,group,{w,d,eave,rise,half,night,interior});
 addFacades(T,group,{w,d,eave,rise,half},night,interior);
 addRoof(T,group,profile,{night,interior});
 addDeck(T,group,w,d);
 group.userData.alphaReference={
  basedOn:'user supplied A-frame screenshot 7.5 × 9.5m',
  graphiteVerticalCladding:true,rooflights:4,triangularGlazing:true,
  slidingEntrance:true,terrace:true,preservedFootprint:[w,d],
  visualModelOnly:true
 };
 return group;
}
