/* FORMA VISUAL / ALFA: volumetric gable wall, actual opening returns,
 * factory-positioned glazing and continuous A-frame roof cassette edges.
 * Architectural visualization only: not a certified building section.
 * Local +Z faces outdoors; millimetre-scale dimensions are in metres.
 */
export const ALFA_OPENING_DETAIL=Object.freeze({
 wallThickness:.240,claddingThickness:.020,ventGap:.030,
 frameRecess:.140,frameFaceWidth:.069,frameDepth:.082,
 glassUnitThickness:.032,paneThickness:.006,
 sillSlopeDegrees:4,dripProjection:.030,revealTolerance:.003
});
export function alphaOpeningPlanes(front,config=ALFA_OPENING_DETAIL){
 const zOuter=front+.006,zInner=zOuter-config.wallThickness,
  zFrameFront=zOuter-config.frameRecess,
  zFrameBack=zFrameFront-config.frameDepth,
  zGlassOuter=zFrameFront-.010,zGlassInner=zGlassOuter-.026;
 return {zOuter,zInner,zFrameFront,zFrameBack,zGlassOuter,zGlassInner,
  thickness:config.wallThickness,recess:config.frameRecess};
}
function material(T,hex,roughness=.77,metalness=.04){
 return new T.MeshStandardMaterial({color:hex,roughness,metalness,side:T.DoubleSide});
}
function quadVertices(a,b,c,d,out){
 // Concave silhouettes are broken into separately specified planar quads.
 // Never put a solid rectangle through a glass/door aperture.
 out.push(...a,...b,...c,...a,...c,...d);
}
function quadMesh(T,g,quads,mat,part){
 if(!quads.length)return null;
 const triangles=[];
 for(const q of quads)quadVertices(q[0],q[1],q[2],q[3],triangles);
 const geom=new T.BufferGeometry();
 geom.setAttribute('position',new T.Float32BufferAttribute(triangles,3));
 const uv=[];
 for(let i=0;i<triangles.length;i+=18) uv.push(0,0,1,0,1,1,0,0,1,1,0,1);
 geom.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 geom.computeVertexNormals();
 const mesh=new T.Mesh(geom,mat);
 mesh.userData.architecturePart=part;
 mesh.receiveShadow=mesh.castShadow=true;
 g.add(mesh);return mesh;
}
function ribbon(q,a,b,zStart,zEnd){
 // [x,y] boundary segment extruded along local +Z/-Z.
 q.push([[a[0],a[1],zStart],[b[0],b[1],zStart],
  [b[0],b[1],zEnd],[a[0],a[1],zEnd]]);
}
function border(T,g,a,b,thick,depth,z,mat,part){
 const p=new T.Vector3(a[0],a[1],z),q=new T.Vector3(b[0],b[1],z),
  vec=q.clone().sub(p);
 const m=new T.Mesh(new T.BoxGeometry(thick,depth,vec.length()),mat);
 m.position.set((p.x+q.x)/2,(p.y+q.y)/2,z);
 m.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),vec.normalize());
 m.castShadow=m.receiveShadow=true;m.userData.architecturePart=part;
 g.add(m);return m;
}
function doorAndTriangleEdges({doorHalf,doorBottom,doorTop,glassHalf,glassBase,glassTop}){
 const D=doorHalf,bot=doorBottom,up=doorTop;
 const G=glassHalf,gb=glassBase,gt=glassTop;
 return {
  // The ordering matches the two apertures from alphaFacadePanel.
  door:[[[-D,bot],[-D,up]],[[-D,up],[D,up]],[[D,up],[D,bot]],[[D,bot],[-D,bot]]],
  triangle:[[[-G,gb],[0,gt]],[[0,gt],[G,gb]],[[G,gb],[-G,gb]]]
 };
}
export function addAlphaFrontWallVolume(T,g,opts,createPanel){
 const {front,half,base,peak,doorHalf,doorBottom,doorTop,
   glassHalf,glassBase,glassTop}=opts;
 const plane=alphaOpeningPlanes(front),{zOuter,zInner,zFrameFront,zFrameBack}=plane;
 const inside=material(T,'#B6B1A6',.93,0);
 const exposed=material(T,'#333C40',.67,.16);
 const backReveal=material(T,'#999184',.87,0);
 const metal=material(T,'#283034',.44,.56);
 const separator=material(T,'#1D2629',.86,.08);
 // Both wall faces use the identical silhouette and TWO IDENTICAL holes.
 // Supplied alphaFacadePanel is the existing tested ShapeGeometry helper.
 const inner=createPanel(T,g,{...opts,front:true,z:zInner,material:inside,
   partName:'alpha-front-inner-wall-with-openings'});
 inner.userData.wallThickness=plane.thickness;
 inner.userData.openings=['sliding-door','triangular-glazing'];
 // Close perimeter where roof ends or side view exposes the 240mm cassette.
 const edgePoints=[[-half,base],[half,base],[0,peak]];
 const external=[];
 for(let i=0;i<edgePoints.length;i++)
  ribbon(external,edgePoints[i],edgePoints[(i+1)%edgePoints.length],zOuter,zInner);
 quadMesh(T,g,external,exposed,'alpha-wall-240mm-extruded-outside-perimeter');
 const segments=doorAndTriangleEdges(opts);
 const frontReturns=[],interiorReturns=[];
 for(const [a,b] of [...segments.door.slice(0,3),...segments.triangle])
  ribbon(frontReturns,a,b,zOuter-ALFA_OPENING_DETAIL.claddingThickness-ALFA_OPENING_DETAIL.ventGap,zFrameFront);
 for(const [a,b] of [...segments.door,...segments.triangle])
  ribbon(interiorReturns,a,b,zFrameBack,zInner);
 quadMesh(T,g,frontReturns,exposed,'alpha-front-reveals-140mm-inset');
 quadMesh(T,g,interiorReturns,backReveal,'alpha-interior-return-after-window-frame');
 // Ventilation/cladding edges are exposed only in narrow cross-section
 // stripes, not by extra 'slat' meshes over the actual PBR facade.
 const depth1=zOuter-ALFA_OPENING_DETAIL.claddingThickness;
 const depth2=depth1-ALFA_OPENING_DETAIL.ventGap;
 const strips=[],seams=[];
 for(const [a,b] of [...segments.door.slice(0,3),...segments.triangle]){
  ribbon(strips,a,b,zOuter,depth1);
  ribbon(seams,a,b,depth1,depth2);
 }
 quadMesh(T,g,strips,metal,'alpha-opening-cladding-20mm-edge');
 quadMesh(T,g,seams,separator,'alpha-opening-30mm-ventilated-edge');
 // Thin folded aluminium outer quarter, deliberately on opaque cladding
 // alongside the aperture. Keep every strip away from glazed area.
 for(const [a,b] of [...segments.door.slice(0,3),...segments.triangle]){
  const borderWidth=.027;
  border(T,g,a,b,borderWidth,.005,zOuter+.001,
   metal,'alpha-opening-perimeter-metal-quarter');
 }
 // Window bottom: water drains outward, 4° over the 140mm exterior reveal.
 // The sill plane slopes down ~9.8mm towards positive local Z.
 const D=doorHalf, yStart=doorBottom+.022,
  run=zOuter-zFrameFront,
  fall=ALFA_OPENING_DETAIL.sillSlopeDegrees*Math.PI/180,
  yEnd=yStart-run*Math.tan(fall);
 quadMesh(T,g,[[
  [-D,yEnd,zOuter+.014],[D,yEnd,zOuter+.014],
  [D,yStart,zFrameFront],[-D,yStart,zFrameFront]
 ]],metal,'alpha-sliding-weathered-sill-four-degree-fall');
 border(T,g,[-D,doorBottom-.014],[D,doorBottom-.014],
  .018,.018,zOuter+ALFA_OPENING_DETAIL.dripProjection,
  metal,'alpha-sliding-sill-30mm-water-drip');
 // Reinforce exterior slope edges with narrow gaskets at window line.
 for(const [a,b] of [...segments.door.slice(0,3),...segments.triangle]){
  border(T,g,a,b,.010,.010,zFrameFront-.006,separator,
   'alpha-recess-frame-compression-gasket');
 }
 g.userData.alphaWall={
  thicknessM:plane.thickness,recessM:plane.recess,
  claddingM:ALFA_OPENING_DETAIL.claddingThickness,
  ventCavityM:ALFA_OPENING_DETAIL.ventGap,
  innerWallWithSameOpenings:true,
  doorReturns:4,triangularReturns:3,
  exteriorReveals:7,interiorReveals:7,
  continuousDoorSill:true
 };
 return plane;
}
export function addAlphaRearWallVolume(T,g,{
  rear,half,base,peak,width,createPanel
}){
 // Rear outer face looks toward -Z. Its interior plane is therefore +Z.
 const out=rear-.010,insideZ=out+ALFA_OPENING_DETAIL.wallThickness;
 const inner=material(T,'#B6B1A6',.93,0);
 createPanel(T,g,{half,base,peak,z:insideZ,width,
  front:false,material:inner,partName:'alpha-rear-inner-wall'});
 const points=[[-half,base],[half,base],[0,peak]],edges=[];
 for(let i=0;i<3;i++)ribbon(edges,points[i],points[(i+1)%3],out,insideZ);
 quadMesh(T,g,edges,material(T,'#343C3D',.67,.09),
  'alpha-rear-wall-240mm-perimeter');
}
export function addAlphaRoofCassetteEnds(T,g,profile,{
  outerOffset=.04,underlayOffset=-.18
}={}){
 const {half,eave,rise,depth,slope}=profile;
 const coords=(side,u,v,off)=>[
  side*half*(1-u/slope),eave+rise*(u/slope)+off,v-depth/2
 ];
 const exposed=[],eaves=[];
 for(const side of [-1,1]){
  for(const v of [0,depth]){
   exposed.push([
    coords(side,0,v,outerOffset),
    coords(side,slope,v,outerOffset),
    coords(side,slope,v,underlayOffset),
    coords(side,0,v,underlayOffset)
   ]);
  }
  eaves.push([
   coords(side,0,0,outerOffset),
   coords(side,0,depth,outerOffset),
   coords(side,0,depth,underlayOffset),
   coords(side,0,0,underlayOffset)
  ]);
 }
 quadMesh(T,g,exposed,material(T,'#252F32',.48,.55),
  'alpha-roof-closed-gable-cassette-ends');
 quadMesh(T,g,eaves,material(T,'#3A3E40',.66,.17),
  'alpha-roof-closed-eaves-cassette');
 g.userData.alphaRoofThicknessVisual={
  roofEdgeLayerVerticalM:outerOffset-underlayOffset,closedEnds:true
 };
}
