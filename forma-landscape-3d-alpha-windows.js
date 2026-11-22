import {alphaOpeningPlanes,ALFA_OPENING_DETAIL} from './forma-landscape-3d-alpha-openings.js?v=alpha-wall-240-v1-20261122';
/* FORMA / ALFA: transparent architectural window assembly.
 * Architectural visualization only, not manufacturer shop drawings.
 * Units: metres; facade front is local +Z.
 * Front-facing insulated glazing and slim charcoal aluminium sections,
 * plus a restrained visible interior so panes do not look like solid blue panels.
 */
function finish(T,color,roughness=.6,metalness=0){
 return new T.MeshStandardMaterial({color,roughness,metalness});
}
function addBox(T,g,size,at,mat,part){
 const m=new T.Mesh(new T.BoxGeometry(...size),mat);
 m.position.set(...at);
 // Glass layers must NEVER cast opaque GPU shadow-map silhouettes over
 // the room behind them; three.js transparent PBR panes are visual only.
 m.castShadow=!(/glass|pane|glaz/i.test(String(part)));
 m.receiveShadow=true;m.userData.architecturePart=part;g.add(m);return m;
}
function addBeam(T,g,a,b,profile,mat,part){
 const from=new T.Vector3(...a),to=new T.Vector3(...b),delta=to.clone().sub(from);
 const m=addBox(T,g,[profile,profile,delta.length()],
  [(from.x+to.x)/2,(from.y+to.y)/2,(from.z+to.z)/2],mat,part);
 m.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),delta.normalize());
 return m;
}
function addTriangle(T,g,x,yTop,yBase,z,mat,part){
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute([
  -x,yBase,z,x,yBase,z,0,yTop,z
 ],3));
 geometry.computeVertexNormals();
 const m=new T.Mesh(geometry,mat);m.castShadow=false;m.receiveShadow=false;
 m.userData.architecturePart=part;g.add(m);return m;
}
function glassMaterial(T,{night=false,inner=false}={}){
 // Smoked graphite privacy glazing. Day: about 81% combined effective
 // two-leaf opacity, so the lounge is a faint silhouette rather than
 // a fully exposed showroom. At night the glass stays smoked but lets
 // a little warm internal illumination read from the approach.
 // Environment reflections remain present across the outer glass surface.
 const m=new T.MeshPhysicalMaterial({
  color:inner?'#344148':night?'#3B484C':'#29373D',
  roughness:inner?.075:.055,metalness:0,
  transparent:true,opacity:inner?.20:night?.69:.76,
  depthWrite:false,side:T.DoubleSide,ior:1.52,
  clearcoat:.76,clearcoatRoughness:.055,
  envMapIntensity:inner?.40:1.38
 });
 m.userData.alphaSmokedGlass={
  tinted:true,tint:'graphite-smoke',isInnerLeaf:inner,
  privacyTint:true,privacyVsPrevious:'stronger interior concealment'
 };
 return m;
}
export function addAlphaGlazedFacade(T,g,{
 w,d,eave,rise,half,front,glassBase,top,glassHalf,doorTop,doorW,night=false
}){
 const planes=alphaOpeningPlanes(front),{zOuter,zInner,zFrameFront,zFrameBack,
  zGlassOuter,zGlassInner}=planes;
 const thickness=ALFA_OPENING_DETAIL.frameDepth;
 // ALL profiles, seals, glazing, tracks and handles use the same cassette.
 // The old front + 0.0xx offsets made the window appear glued ON the facade.
 const zFrameCenter=(zFrameFront+zFrameBack)*.5;
 const frame=finish(T,'#252D30',.37,.22),
  sash=finish(T,'#30383B',.42,.15),
  seal=finish(T,'#171D1F',.96,.02),
  spacer=finish(T,'#4A504D',.58,.18),
  wood=finish(T,'#82705D',.79,.01),
  trackMat=finish(T,'#636965',.48,.31);
 const outerGlass=glassMaterial(T,{night}),
  innerGlass=glassMaterial(T,{night,inner:true});
 const doorBottom=.49,doorHeight=doorTop-doorBottom,
  midY=(doorBottom+doorTop)*.5,leafW=doorW/4,doorHalf=doorW*.5;
 // The triangular IG glazing is installed 140mm behind the PBR cladding.
 // A 6-20-6 mm unit has two real thin glass shells 26mm apart.
 addTriangle(T,g,glassHalf,top,glassBase,zGlassInner,
  innerGlass,'alpha-gable-glass-interior-leaf');
 addTriangle(T,g,glassHalf,top,glassBase,zGlassOuter,
  outerGlass,'alpha-gable-glass-exterior-leaf');
 for(const side of [-1,1]){
  addBeam(T,g,[side*glassHalf,glassBase,zFrameCenter],
   [0,top,zFrameCenter],.075,frame,'alpha-triangle-exterior-frame');
  addBeam(T,g,[side*(glassHalf-.02),glassBase+.028,zFrameFront-.011],
   [0,top-.046,zFrameFront-.011],.012,seal,'alpha-triangle-glazing-gasket');
  // All interior wood lies BEHIND the inner wall, never across glass.
  addBeam(T,g,[side*glassHalf,glassBase,zInner-.08],
   [0,top,zInner-.08],.106,wood,'alpha-interior-glazed-rafter');
 }
 addBox(T,g,[glassHalf*2,.080,thickness],
  [0,glassBase,zFrameCenter],frame,'alpha-triangle-base-profile');
 addBox(T,g,[glassHalf*2-.075,.011,.013],
  [0,glassBase+.041,zFrameFront-.011],seal,'alpha-triangle-base-gasket');
 const height=top-glassBase;
 for(const fraction of [.35,.67]){
  const y=glassBase+height*fraction,span=glassHalf*(1-fraction);
  addBox(T,g,[span*2,.055,thickness],
   [0,y,zFrameCenter],frame,'alpha-triangle-horizontal-transom');
  addBox(T,g,[span*2-.065,.009,.012],
   [0,y+.031,zFrameFront-.014],seal,'alpha-triangle-transom-gasket');
 }
 for(const x of [-glassHalf*.51,0,glassHalf*.51]){
  const stop=top-height*Math.abs(x)/glassHalf;
  addBox(T,g,[.056,stop-glassBase,thickness],
   [x,(stop+glassBase)*.5,zFrameCenter],frame,'alpha-gable-full-height-mullion');
 }
 // Small warm timber apex, separate from the glazed triangular void.
 // The z offset is deliberately 5mm above facade to avoid Z-fighting.
 const apexW=half*(1-(top-eave)/rise)-.10;
 addTriangle(T,g,apexW,eave+rise-.10,top,zOuter+.005,
  wood,'alpha-apex-sealed-timber-infill');
 // Sliding aperture's opening remains exactly the same; the actual window
 // frame lives INSIDE the 240mm-thick wall, not on the exterior.
 addBox(T,g,[doorW+.075,.081,thickness],
  [0,doorTop-.017,zFrameCenter],frame,'alpha-sliding-head-profile');
 addBox(T,g,[doorW+.075,.068,thickness],
  [0,doorBottom+.018,zFrameCenter],frame,'alpha-sliding-thermal-threshold');
 for(const x of [-doorHalf+.035,doorHalf-.035]){
  addBox(T,g,[.069,doorHeight-.05,thickness],
   [x,midY,zFrameCenter],frame,'alpha-sliding-exterior-jamb');
  addBox(T,g,[.013,doorHeight-.10,.011],
   [x,midY,zFrameFront-.009],seal,'alpha-sliding-jamb-gasket');
 }
 // Four independent double glazing units at the same 140mm reveal depth.
 for(let i=0;i<4;i++){
  const x=-doorHalf+(i+.5)*leafW;
  const glassW=leafW-.099,glassH=doorHeight-.16;
  const atY=midY;
  addBox(T,g,[glassW,glassH,ALFA_OPENING_DETAIL.paneThickness],
   [x,atY,zGlassOuter],outerGlass,'alpha-sliding-low-iron-exterior-pane');
  addBox(T,g,[glassW,glassH,ALFA_OPENING_DETAIL.paneThickness],
   [x,atY,zGlassInner],innerGlass,'alpha-sliding-low-iron-interior-pane');
  for(const side of [-1,1]){
   addBox(T,g,[.008,glassH,.010],
    [x+side*(glassW*.5-.015),atY,(zGlassOuter+zGlassInner)*.5],
    spacer,'alpha-sliding-glass-spacer-vertical');
   addBox(T,g,[glassW,.008,.010],
    [x,atY+side*(glassH*.5-.015),(zGlassOuter+zGlassInner)*.5],
    spacer,'alpha-sliding-glass-spacer-horizontal');
  }
 }
 for(let i=1;i<4;i++){
  const x=-doorHalf+i*leafW;
  addBox(T,g,[.056,doorHeight-.05,thickness],
   [x,midY,zFrameCenter],sash,'alpha-sliding-slim-sash');
  addBox(T,g,[.012,doorHeight-.13,.015],
   [x,midY,zFrameFront-.011],seal,'alpha-sliding-mullion-rubber-gasket');
 }
 // Both rail grooves belong to the thermally drained sill, not the deck.
 for(const zz of [zFrameFront-.020,zFrameFront-.058]){
  addBox(T,g,[doorW-.17,.006,.013],
   [0,doorBottom+.041,zz],trackMat,'alpha-drained-dual-rail');
 }
 const handle=finish(T,'#9EA29E',.34,.38);
 for(const x of [-.068,.068]){
  addBox(T,g,[.020,.17,.017],
   [x,1.42,zFrameFront-.013],handle,'alpha-sliding-recessed-pull');
  addBox(T,g,[.028,.034,.020],
   [x,1.42,zFrameFront-.019],seal,'alpha-sliding-handle-mount');
 }
 g.userData.alphaFenestration={
  gable:'recessed 6-20-6 IG assembly and 240mm jamb wall',
  entry:'four recessed low-iron insulated sliding leaves',
  doubleGlazed:true,glazingTransparent:true,visualSpecificationOnly:true,
  outerFacadeZ:zOuter,innerWallZ:zInner,windowFrontZ:zFrameFront,
  glassOuterZ:zGlassOuter,glassInnerZ:zGlassInner,
  wallThicknessM:ALFA_OPENING_DETAIL.wallThickness,
  frameRecessM:ALFA_OPENING_DETAIL.frameRecess
 };
}
export function addAlphaVisibleInterior(T,g,{w,d,eave,rise,half,night=false}){
 // Keep all objects comfortably INSIDE the roof and the original footprint.
 const wood=finish(T,'#6A5B4E',.89,0),timber=finish(T,'#86725E',.76,.01);
 const dark=finish(T,'#373C39',.95),warm=finish(T,'#B3A086',.92);
 const metal=finish(T,'#353738',.59,.19);
 const zBack=-d/2+.48,depth=d-.90;
 // Visible timber floor recedes from transparent entrance to back wall.
 addBox(T,g,[w-.70,.065,depth],[0,.505,(zBack+d/2-.42)/2],
  wood,'alpha-visible-interior-solid-oak-floor');
 // Exposed A-frame structural timber at three well-spaced truss locations.
 for(const z of [zBack+.45,-.2,d/2-1.05]){
  for(const sign of [-1,1]){
   addBeam(T,g,[sign*(half-.32),eave+.045,z],[0,eave+rise-.30,z],
    .138,timber,'alpha-visible-interior-structural-rafter');
  }
 }
 // Partial mezzanine and a dark railing, clearly behind upper glazing.
 const mezzDepth=d*.46,zMezz=zBack+mezzDepth*.5;
 addBox(T,g,[2.65,.12,mezzDepth],[0,3.18,zMezz],
  wood,'alpha-interior-mezzanine-oak-slab');
 addBox(T,g,[2.65,.055,.055],[0,4.04,zBack+mezzDepth],
  dark,'alpha-interior-mezzanine-guard-top');
 for(const x of [-1.26,-.64,0,.64,1.26]){
  addBox(T,g,[.035,.74,.035],[x,3.64,zBack+mezzDepth],
   metal,'alpha-interior-mezzanine-railing-post');
 }
 // A modest recognisable interior, not a blank rear-wall plane:
 // dark sofa, warm rug, small timber table. All remain static, cheap geometry.
 addBox(T,g,[2.26,.09,1.35],[-.82,.556,d*.05],
  warm,'alpha-interior-lounge-rug');
 addBox(T,g,[1.72,.36,.80],[-1.02,.77,d*.11],
  dark,'alpha-interior-sofa-seat');
 addBox(T,g,[1.72,.71,.17],[-1.02,.93,d*.11-.34],
  dark,'alpha-interior-sofa-back');
 addBox(T,g,[.94,.065,.49],[.73,.91,d*.12],
  timber,'alpha-interior-coffee-table-top');
 for(const x of [.36,1.10])for(const z of [d*.12-.19,d*.12+.19]){
  addBox(T,g,[.036,.36,.036],[x,.71,z],metal,
   'alpha-interior-coffee-table-leg');
 }
 // Interior warm luminaires are low-energy emissive strips and read from
 // outside without making the facade an unrealistic backlit billboard.
 const lamp=new T.MeshStandardMaterial({
  color:'#C4A986',roughness:.42,emissive:'#CDA777',
  emissiveIntensity:night?.52:.24
 });
 for(const z of [zBack+2.6,zBack+5.0]){
  addBox(T,g,[.85,.026,.041],[0,3.05,z],lamp,'alpha-interior-warm-luminaire');
 }
 g.userData.alphaInterior={visibleBehindGlass:true,mezzanine:true,
  internalFurniture:true,addedWithinOriginalFootprint:true};
}
