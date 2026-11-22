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
 m.position.set(...at);m.castShadow=!String(part).includes('glass');
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
 // Deliberately neutral and lightly transparent. Outside reflection is
 // provided by scene.environment; the interior is physically visible behind.
 return new T.MeshPhysicalMaterial({
  color:night?'#D1D3CC':'#D5E0DB',
  roughness:inner?.095:.058,metalness:0,
  transparent:true,opacity:inner?.075:.16,
  depthWrite:false,side:T.DoubleSide,ior:1.52,
  clearcoat:.47,clearcoatRoughness:.065,
  envMapIntensity:inner?.62:1.22
 });
}
export function addAlphaGlazedFacade(T,g,{w,d,eave,rise,half,front,glassBase,top,glassHalf,doorTop,doorW,night=false}){
 const frame=finish(T,'#262D30',.32,.25),sash=finish(T,'#30393B',.4,.13);
 const seal=finish(T,'#151C1D',.92,.015),spacer=finish(T,'#555A55',.55,.26);
 const innerWood=finish(T,'#786D5F',.77,.015);
 const outerGlass=glassMaterial(T,{night}),innerGlass=glassMaterial(T,{night,inner:true});
 const topW=Math.max(0,top-glassBase),frameDepth=.082;
 const doorBottom=.49,doorH=doorTop-doorBottom,midY=(doorTop+doorBottom)*.5;
 const doorZ=front+.037,leafW=doorW/4;
 // Two separate transparent glass leaves in the true gable void,
 // not a solid tinted polygon that completely hides the house.
 addTriangle(T,g,glassHalf,top,glassBase,front+.040,innerGlass,'alpha-gable-glass-interior-leaf');
 addTriangle(T,g,glassHalf,top,glassBase,front+.083,outerGlass,'alpha-gable-glass-exterior-leaf');
 for(const side of [-1,1]){
  addBeam(T,g,[side*glassHalf,glassBase,front+.095],[0,top,front+.095],
   .074,frame,'alpha-triangle-exterior-frame');
  addBeam(T,g,[side*(glassHalf-.022),glassBase+.028,front+.119],
   [0,top-.058,front+.119],.012,seal,'alpha-triangle-glazing-gasket');
  // Interior warm timber frame is visible through transparent glass,
  // recessed 170 mm behind the aluminium outer frame.
  addBeam(T,g,[side*glassHalf,glassBase,front-.170],
   [0,top,front-.170],.115,innerWood,'alpha-interior-glazed-rafter');
 }
 addBox(T,g,[glassHalf*2,.069,.104],[0,glassBase,front+.090],frame,'alpha-triangle-base-profile');
 addBox(T,g,[glassHalf*2-.06,.012,.015],[0,glassBase+.045,front+.143],seal,'alpha-triangle-base-gasket');
 for(const fraction of [.35,.67]){
  const y=glassBase+topW*fraction,span=glassHalf*(1-fraction);
  addBox(T,g,[span*2,.057,.077],[0,y,front+.106],frame,'alpha-triangle-horizontal-transom');
  addBox(T,g,[span*2-.06,.010,.013],[0,y+.029,front+.153],seal,'alpha-triangle-transom-gasket');
 }
 // Separate slender mullions follow their triangular top intersections.
 for(const x of [-glassHalf*.51,0,glassHalf*.51]){
  const stop=top-topW*Math.abs(x)/glassHalf;
  addBox(T,g,[.064,stop-glassBase,.077],[x,(stop+glassBase)*.5,front+.109],
   frame,'alpha-gable-full-height-mullion');
 }
 // The actual uppermost ventilation apex is timber, not glass.
 const apexW=half*(1-(top-eave)/rise)-.10;
 addTriangle(T,g,apexW,eave+rise-.10,top,front+.006,
  innerWood,'alpha-apex-sealed-timber-infill');
 // Continuous drained four-panel sliding glass door at the reference opening.
 addBox(T,g,[doorW+.125,.073,.123],[0,doorTop,doorZ],frame,'alpha-sliding-head-profile');
 addBox(T,g,[doorW+.125,.054,.113],[0,doorBottom,doorZ],frame,'alpha-sliding-thermal-threshold');
 for(const x of [-doorW*.5,doorW*.5]){
  addBox(T,g,[.072,doorH+.075,.111],[x,midY,doorZ],frame,'alpha-sliding-exterior-jamb');
 }
 // Four distinct insulated glass units; fine near-black seals remain
 // visible without turning each window into a thick solid panel.
 for(let i=0;i<4;i++){
  const center=-doorW/2+(i+.5)*leafW;
  const revealWidth=leafW-.087,revealHeight=doorH-.123;
  addBox(T,g,[revealWidth,revealHeight,.0035],
   [center,midY,front+.052],outerGlass,'alpha-sliding-low-iron-exterior-pane');
  addBox(T,g,[revealWidth,revealHeight,.0035],
   [center,midY,front-.013],innerGlass,'alpha-sliding-low-iron-interior-pane');
  // A dark warm-edge spacer visible within the glazing cavity.
  for(const side of [-1,1]){
   addBox(T,g,[.008,revealHeight,.010],
    [center+side*(revealWidth/2-.013),midY,front+.022],
    spacer,'alpha-sliding-glass-spacer-vertical');
   addBox(T,g,[revealWidth,.008,.010],
    [center,midY+side*(revealHeight/2-.014),front+.022],
    spacer,'alpha-sliding-glass-spacer-horizontal');
  }
 }
 for(let i=1;i<4;i++){
  const x=-doorW*.5+i*leafW;
  addBox(T,g,[.053,doorH,.09],[x,midY,front+.070],sash,'alpha-sliding-slim-sash');
  addBox(T,g,[.014,doorH-.10,.016],[x,midY,front+.128],seal,'alpha-sliding-mullion-rubber-gasket');
 }
 const track=finish(T,'#585E5A',.43,.28);
 for(const x of [-.042,.042])
  addBox(T,g,[doorW-.12,.007,.014],[0,doorBottom+.028,front+x],
   track,'alpha-drained-dual-rail');
 const handle=finish(T,'#A8A9A2',.36,.35);
 for(const x of [-.079,.079]){
  addBox(T,g,[.016,.176,.020],[x,1.41,front+.135],handle,'alpha-sliding-recessed-pull');
  addBox(T,g,[.022,.031,.027],[x,1.41,front+.133],seal,'alpha-sliding-handle-mount');
 }
 g.userData.alphaFenestration={
  gable:'two lightly transparent panes, aluminium mullions and timber rafters',
  entry:'four low-iron double-pane sliding leaves',
  doubleGlazed:true,glazingTransparent:true,
  visualSpecificationOnly:true
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
