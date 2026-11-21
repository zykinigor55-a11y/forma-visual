/* FORMA VISUAL · Seven user-approved visual references, 22 Nov 2026.
 * Original editable geometry, metres. All materials are physically shaded.
 * Exact visual sources: the seven images uploaded in the conversation.
 * The visible front/side construction is reconstructed; obscured backsides,
 * internal circuitry, undocumented dimensions are engineering approximations.
 * Existing scene positions, object IDs, placement rotations are NEVER changed.
 */
export const uploadedGardenLightIds=Object.freeze([
 'spike-spot','square-bollard','low-post','globe','spot','garden-lantern','bollard'
]);
export const globeDiameterByVariant=Object.freeze({1:.40,2:.25,3:.60,4:.80});

export function createUserReferenceGardenLuminaire(T,instance,{night=false}={}){
 const id=instance?.catalogId;
 if(!uploadedGardenLightIds.includes(id))return null;
 const G=new T.Group();
 G.name='FORMA-LUMINAIRE-'+id;
 G.userData.fixtureId=id;
 G.userData.fixtureVersion='user-uploaded-7-photos-v4';
 G.userData.userPhotoReference=true;
 const number=(n,f)=>Number.isFinite(Number(n))?Number(n):f;
 const dim=Math.max(0,Math.min(2,number(instance?.brightness,1)));
 const warm=({2200:'#ffbe86',2700:'#ffdbac',3000:'#ffe7c7',4000:'#f9f6ee'})[number(instance?.kelvin,2700)]||'#ffdbac';
 const emission=night?dim:0;
 const P=(color,metalness=.5,roughness=.46,other={})=>
  new T.MeshPhysicalMaterial({color,metalness,roughness,clearcoat:.16,clearcoatRoughness:.39,...other});
 const body=P('#242629',.58,.58),bodySoft=P('#333639',.54,.56),
  dark=P('#121416',.38,.58),blackRubber=P('#121313',.02,.91),
  machined=P('#a1a3a1',.85,.28),chromium=P('#eaebe8',.96,.15),
  screwMetal=P('#c4c8c8',.78,.23),
  warmGlass=P('#e6dbbd',.04,.31,{transmission:.23,thickness:.006,ior:1.51,
   emissive:warm,emissiveIntensity:emission*.17+.006,transparent:true,opacity:.92,side:T.DoubleSide}),
  frosted=P('#d1d0c9',.02,.67,{transmission:.30,thickness:.011,ior:1.45,
   emissive:warm,emissiveIntensity:emission*.12+.004,transparent:true,opacity:.87,side:T.DoubleSide}),
  clearGlass=P('#e2e8e8',.06,.13,{transmission:.55,thickness:.003,ior:1.49,
   clearcoat:.85,clearcoatRoughness:.06,transparent:true,opacity:.77,side:T.DoubleSide}),
  led=P('#fff7e0',.03,.43,{emissive:warm,emissiveIntensity:emission*2.1+.02}),
  warmPlate=P('#f6e6b6',.08,.40,{emissive:warm,emissiveIntensity:emission*1.1+.014}),
  reflector=P('#d7d9d6',.90,.17,{side:T.DoubleSide}),
  opticDark=P('#161819',.18,.35),
  opal=P('#f0eee7',.01,.67,{transmission:.035,thickness:.018,
   emissive:warm,emissiveIntensity:emission*.86+.008,side:T.DoubleSide});
 function part(geo,mat,x=0,y=0,z=0,name='housing',parent=G,cast=true){
  const m=new T.Mesh(geo,mat);
  m.position.set(x,y,z);m.userData.fixturePart=name;
  m.castShadow=cast;m.receiveShadow=true;parent.add(m);return m;
 }
 const cy=(rt,rb,h,x,y,z,mat,name='housing',seg=64,parent=G)=>
  part(new T.CylinderGeometry(rt,rb,h,seg),mat,x,y,z,name,parent);
 const bx=(w,h,d,x,y,z,mat,name='housing',parent=G)=>
  part(new T.BoxGeometry(w,h,d),mat,x,y,z,name,parent);
 const sp=(r,x,y,z,mat,name='diffuser',parent=G)=>
  part(new T.SphereGeometry(r,64,40),mat,x,y,z,name,parent,name!=='diffuser');
 function tor(r,t,x,y,z,mat,name='seal',parent=G){
  const m=part(new T.TorusGeometry(r,t,8,64),mat,x,y,z,name,parent);
  m.rotation.x=Math.PI/2;
  return m;
 }
 function tube(pts,r,mat,name,parent=G){
  const line=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)));
  return part(new T.TubeGeometry(line,Math.max(30,pts.length*12),r,10,false),mat,0,0,0,name,parent);
 }
 function roundedPane(w,h,r,material,x,y,z,rotationY=0,name='frosted-glass'){
  const sh=new T.Shape(),L=-w/2,R=w/2,B=-h/2,U=h/2;
  sh.moveTo(L+r,B);sh.lineTo(R-r,B);sh.quadraticCurveTo(R,B,R,B+r);
  sh.lineTo(R,U-r);sh.quadraticCurveTo(R,U,R-r,U);
  sh.lineTo(L+r,U);sh.quadraticCurveTo(L,U,L,U-r);
  sh.lineTo(L,B+r);sh.quadraticCurveTo(L,B,L+r,B);
  const m=part(new T.ShapeGeometry(sh,8),material,x,y,z,name,G,false);
  m.rotation.y=rotationY;return m;
 }
 function bolt(x,y,z,rot=0){
  const a=cy(.0046,.0046,.005,x,y,z,screwMetal,'bolt-head',16);
  a.rotation.z=rot;
  bx(.003,.0009,.0009,x,y+.003,z,dark,'bolt-slot');
 }
 // Actual scribed chrome reflector made from independent planar microprisms:
 // concentric alternating faces of one coherent bowl with parabolic depth.
 function microPrismReflector(radius=.052,lensY=.065,parent=G){
  const pos=[],colors=[],bands=13,slices=72;
  const color=new T.Color();
  const seed=(j,k)=>{const v=Math.sin(j*17.13+k*84.9)*14937.27;return v-Math.floor(v)};
  for(let j=0;j<bands;j++)for(let k=0;k<slices;k++){
   const r0=.006+(radius-.006)*j/bands,r1=.006+(radius-.006)*(j+1)/bands;
   const a0=k*Math.PI*2/slices,a1=(k+1)*Math.PI*2/slices;
   const y0=lensY-.031+.035*(r0/radius)**2,y1=lensY-.031+.035*(r1/radius)**2;
   const mid=(a0+a1)/2;
   const corners=[[Math.cos(a0)*r0,y0,Math.sin(a0)*r0],
     [Math.cos(a0)*r1,y1,Math.sin(a0)*r1],
     [Math.cos(a1)*r1,y1,Math.sin(a1)*r1],
     [Math.cos(a1)*r0,y0,Math.sin(a1)*r0]];
   const l=.73+.26*seed(j,k),f=j%2===0?1:.94;
   color.setRGB(l*f,l*f,l*f,'srgb');
   for(const q of [0,1,2,0,2,3]){pos.push(...corners[q]);colors.push(color.r,color.g,color.b)}
  }
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
  const mat=new T.MeshPhysicalMaterial({vertexColors:true,metalness:.89,roughness:.21,side:T.DoubleSide,
   clearcoat:.4,clearcoatRoughness:.20,flatShading:true});
  return part(geo,mat,0,0,0,'actual-microprism-reflector',parent,false);
 }
 if(id==='spike-spot'){
  // Image 1: very long black ground stake with black hinged cylindrical torch.
  // Negative Y is deliberately buried when placed on real garden terrain.
  const spike=part(new T.ConeGeometry(.036,.34,5),blackRubber,0,-.19,0,'faceted-sharp-ground-spike');
  spike.rotation.y=Math.PI/5; spike.rotation.x=Math.PI; // sharp point faces DOWN
  cy(.026,.028,.105,0,.035,0,body,'connector-stake-neck',40);
  bx(.061,.08,.064,0,.089,0,body,'rectangular-yoke');
  sp(.026,0,.137,.012,bodySoft,'pivot-cylinder');
  const hinge=cy(.014,.014,.008,.029,.137,.012,screwMetal,'silver-pivot-bolt',24);
  hinge.rotation.z=Math.PI/2;
  const slot=bx(.013,.002,.002,.035,.137,.012,dark,'pivot-bolt-slot');slot.rotation.y=.2;
  const head=new T.Group();head.position.set(0,.220,.034);
  head.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(0,.25,.968).normalize());
  head.name='rotating-cylindrical-spot-head';G.add(head);
  // Back is shorter and smaller; front bulges into a deep rubber bezel.
  const profile=[
   new T.Vector2(0,-.102),new T.Vector2(.033,-.102),
   new T.Vector2(.044,-.091),new T.Vector2(.053,-.054),
   new T.Vector2(.061,.015),new T.Vector2(.064,.064),
   new T.Vector2(.065,.071)
  ];
  part(new T.LatheGeometry(profile,72),bodySoft,0,0,0,'tapered-cast-alloy-housing',head);
  // Annular bezel ONLY: never cover the actual metallic reflector with a solid cap.
  const openBezel=part(new T.RingGeometry(.055,.068,72),dark,0,.075,0,'real-open-annular-bezel',head);
  openBezel.rotation.x=-Math.PI/2;
  tor(.055,.005,0,.075,0,blackRubber,'front-waterproof-gasket',head);
  microPrismReflector(.052,.066,head);
  cy(.011,.011,.0016,0,.047,0,led,'central-CREE-LED',32,head);
  tor(.012,.002,0,.051,0,warmPlate,'LED-yellow-phosphor',head);
  cy(.028,.036,.025,0,-.100,0,body,'rear-optic-driver',48,head);
  // Electrical cable loops behind body, disappears into the stake:
  tube([[0,.126,-.048],[-.023,.105,-.065],[-.041,.04,-.071],
    [-.047,-.035,-.055],[-.034,-.069,-.022],[-.01,-.074,0]],.006,blackRubber,'external-routed-PVC-cable');
  cy(.014,.014,.019,-.017,.142,-.045,machined,'metal-cable-gland',20);
  G.userData.measuredHeight=.39;
 }else if(id==='square-bollard'){
  // Image 2: charcoal rectangular post and THREE illuminated thin belts near top.
  const H=.82,w=.145,band=.030,gap=.030;
  const bandWarm=P('#b49b78',.06,.32,{emissive:warm,emissiveIntensity:emission*.36+.005});
  const first=H-.082; // near cap, top of luminous belt
  const lower=first-3*band-2*gap;
  bx(w,lower,w,0,lower/2,0,body,'one-piece-matte-charcoal-post');
  for(let i=0;i<3;i++){
   const yc=first-band/2-i*(band+gap);
   // Individual wraps are transparent acrylic, separated by opaque black bridges.
   bx(w-.007,band,w-.007,0,yc,0,warmGlass,'continuous-clear-acrylic-wrap-'+i);
   bx(w-.030,band-.005,w-.030,0,yc,0,opticDark,'hidden-core-LED-rail-'+i);
   for(let side=0;side<4;side++){
    const localZ=side%2===0?(side===0?1:-1)*(w/2+.0009):0;
    const localX=side%2===1?(side===1?1:-1)*(w/2+.0009):0;
    const face=bx(side%2===0?w-.022:.005,band*.53,side%2===0?.005:w-.022,
      localX,yc,localZ,bandWarm,'warm-optical-window-'+i+'-'+side);
    face.castShadow=false;
   }
   if(i<2){const bridgeY=yc-(band+gap)/2;bx(w,gap,w,0,bridgeY,0,body,'opaque-recessed-separator-'+i)}
  }
  bx(w,H-first,w,0,(first+H)/2,0,body,'solid-black-upper-cap');
  bx(w+.003,.010,w+.003,0,H-.005,0,bodySoft,'flattened-weatherproof-top');
  bx(w,.016,w,0,.008,0,dark,'bolted-foot');
  for(const x of [-w*.35,w*.35])bolt(x,.012,w/2+.001);
  G.userData.measuredHeight=H;
 }else if(id==='low-post'){
  // Image 3: long, satin dark grey square post and large warm frosted
  // rectangular head; rounded pane corners, visibly glowing lamp inside.
  const H=1.20,w=.205,lower=.925,headTop=H-.027;
  bx(w,lower,w,0,lower/2,0,bodySoft,'cast-graphite-square-column');
  bx(w+.005,.018,w+.005,0,lower+.006,0,body,'neck-weatherproof-transition');
  // Crucial: interior is NOT a giant opaque solid block; the lamp is inside.
  bx(w-.025,.014,w-.025,0,lower+.012,0,reflector,'internal-mirrored-LED-bottom');
  const source=sp(.044,0,1.064,0,warmPlate,'actual-warm-internal-bulb');
  source.scale.set(.83,1.28,.83);
  const glassY=(lower+headTop)/2,glassH=headTop-lower-.032,paneW=w-.032;
  roundedPane(paneW,glassH,.024,frosted,0,glassY,w/2+.002,0,'rounded-front-glass');
  roundedPane(paneW,glassH,.024,frosted,0,glassY,-w/2-.002,Math.PI,'rounded-back-glass');
  roundedPane(paneW,glassH,.024,frosted,w/2+.002,glassY,0,Math.PI/2,'rounded-right-glass');
  roundedPane(paneW,glassH,.024,frosted,-w/2-.002,glassY,0,-Math.PI/2,'rounded-left-glass');
  for(const x of [-w/2+.008,w/2-.008])for(const z of [-w/2+.008,w/2-.008])
   cy(.007,.007,headTop-lower, x,(headTop+lower)/2,z,body,'slim-rounded-black-corner-frame',24);
  bx(w+.012,.032,w+.012,0,H-.016,0,body,'flat-waterproof-square-top');
  bx(w+.008,.008,w+.008,0,.004,0,dark,'square-base-seal');
  G.userData.measuredHeight=H;
 }else if(id==='globe'){
  // Image 4: opal ground spheres in different diameters, NOT raised on a pole.
  const variant=[1,2,3,4].includes(Number(instance?.variant))?Number(instance.variant):1;
  let diameter=globeDiameterByVariant[variant];
  const explicit=number(instance?.diameter,NaN);
  if(Number.isFinite(explicit)&&explicit>=.20&&explicit<=1&&Math.abs(explicit-.40)>.02)
   diameter=explicit;
  const r=diameter/2;
  const base=cy(r*.42,r*.47,.014,0,.007,0,blackRubber,'hidden-ground-base',48);
  cy(r*.35,r*.35,.009,0,.013,0,body,'invisible-electrical-driver',48);
  const sphere=sp(r,0,r*.99,0,opal,'uniform-seamless-opal-polyethylene-ball');
  sphere.scale.y=.99;
  sp(r*.12,0,r*.99,0,led,'LED-module-inside-diffuser').castShadow=false;
  G.userData.availableDiameters=[.25,.40,.60,.80];
  G.userData.sphereDiameter=diameter;
  G.userData.measuredHeight=diameter;
 }else if(id==='spot'){
  // Image 5: a tall dark cylindrical post with a short side-hanging
  // fully pivoting black cylindrical head and white downward-facing lens.
  const H=1.11,shaftR=.052;
  cy(shaftR,shaftR,H-.040,0,(H-.040)/2,0,body,'clean-continuous-round-pole',72);
  cy(shaftR*1.035,shaftR*1.035,.026,0,H-.140,0,bodySoft,'upper-shoulder-collar',72);
  cy(shaftR,shaftR,.04,0,H-.020,0,dark,'flat-head-neck-top',72);
  bx(.056,.032,.040,.076,H-.081,0,body,'side-bearing-arm');
  const hinge=cy(.014,.014,.009,.104,H-.078,0,machined,'spot-tilt-hinge',24);
  hinge.rotation.z=Math.PI/2;
  // Cylindrical head drops below its upper swivel, faces down.
  const axis=new T.Group();
  axis.position.set(.118,H-.137,.012);axis.rotation.z=.21; axis.rotation.x=-.16; // angle visible lens toward the viewer while aiming away from the post
  axis.name='side-mounted-adjustable-head';G.add(axis);
  cy(.051,.051,.132,0,-.015,0,dark,'side-downward-lamp-head',64,axis);
  cy(.049,.049,.012,0,.054,0,bodySoft,'upper-cover-heat-sink',64,axis);
  cy(.049,.049,.012,0,-.089,0,body,'thick-black-optic-bezel',64,axis);
  cy(.038,.038,.003,0,-.095,0,opal,'downward-white-optical-disc',56,axis);
  cy(.032,.032,.001,0,-.097,0,led,'internal-COB-light-source',56,axis);
  tor(.045,.002,0,-.097,0,blackRubber,'flush-lens-gasket',axis);
  cy(shaftR*1.03,shaftR*1.03,.014,0,.007,0,dark,'slim-sealed-bottom');
  G.userData.emitterOffset=[.118,H-.23,0];
  G.userData.measuredHeight=H;
 }else if(id==='garden-lantern'){
  // Image 6: open modern *rectangular lantern* garden bollard.
  // Four tall black structural corner rails; light comes from inner
  // thin vertical warm panels, not from a solid outer post.
  const H=1.03,w=.205,edge=.012;
  bx(w,.037,w,0,.0185,0,body,'square-machined-base');
  bx(w+.004,.031,w+.004,0,H-.0155,0,body,'fully-closed-flat-roof');
  for(const x of [-(w-edge)/2,(w-edge)/2])for(const z of [-(w-edge)/2,(w-edge)/2]){
   bx(edge,H-.068,edge,x,H/2,z,body,'hollow-frame-black-vertical-corner');
  }
  const inner=.064;
  const smoked=P('#4b4436',.07,.34,{transmission:.10,transparent:true,opacity:.78,
    emissive:warm,emissiveIntensity:emission*.06});
  const amber=P('#8d6e42',.08,.36,{emissive:warm,emissiveIntensity:emission*.38+.003});
  for(const x of [-inner,inner])for(const z of [-inner,inner]){
   // The original photo has warm gold light high up; the lower channels remain shaded.
   bx(.011,H-.21,.007,x,H*.48,z,smoked,'smoked-vertical-inner-protector');
   bx(.007,H*.37,.004,x,H*.737,z,amber,'high-warm-LED-tube');
  }
  // Crossbrace holds suspended inner diffuser but leaves open air on sides.
  bx(w-.03,.012,.012,0,H-.10,0,bodySoft,'inner-floating-rail');
  bx(.012,.012,w-.03,0,H-.10,0,bodySoft,'cross-inner-rail');
  bx(.087,.019,.087,0,.048,0,body,'IP-rated-core');
  for(const x of [-w*.34,w*.34])bolt(x,.042,w/2+.002);
  G.userData.measuredHeight=H;
 }else if(id==='bollard'){
  // Image 7: heavy round charcoal shaft with a clear optically ribbed
  // cylindrical upper chamber and thin black top cap.
  const H=.83,r=.077,glassH=.213,shaftTop=H-glassH-.016;
  cy(r,r,shaftTop,0,shaftTop/2,0,body,'dark-cylindrical-aluminium-column',72);
  cy(r+.018,r+.018,.013,0,.007,0,dark,'wide-circular-mounting-flange',72);
  tor(r*.96,.0025,0,shaftTop,0,blackRubber,'IP-rated-lens-foot-gasket');
  cy(r*.94,r*.94,glassH,0,shaftTop+glassH/2,0,clearGlass,'transparent-cylindrical-basket',72);
  cy(r*.61,r*.61,glassH*.85,0,shaftTop+glassH*.425,0,
    P('#abb8b6',.03,.43,{transmission:.40,transparent:true,opacity:.48,
     emissive:warm,emissiveIntensity:emission*.045,side:T.DoubleSide}),
    'inside-smoked-glass-LED-diffuser',64);
  // Visible individual engraved grid lines across clear cylindrical glass.
  const prism=P('#8f9798',.26,.31,{transmission:.14,transparent:true,opacity:.76,side:T.DoubleSide});
  for(let j=0;j<21;j++){
   const y=shaftTop+.007+(j+.5)*(glassH-.017)/21;
   tor(r*.93,.0017,0,y,0,prism,'horizontal-refractive-grid-'+j);
  }
  for(let j=0;j<22;j++){
   const a=j*2*Math.PI/22,rad=r*.934;
   cy(.0017,.0017,glassH-.013,Math.cos(a)*rad,shaftTop+glassH/2,Math.sin(a)*rad,prism,
    'vertical-glass-prism-'+j,10);
  }
  // Actual LED bulb visible through the clear prismatic chamber.
  sp(.027,0,shaftTop+glassH*.45,0,led,'internal-visible-LED-bulb').castShadow=false;
  cy(r,r,.015,0,H-.0075,0,dark,'cylindrical-flat-cap',72);
  tor(r*.97,.002,0,H-.019,0,blackRubber,'roof-glass-seal');
  G.userData.measuredHeight=H;
 }
 // Respect historic placed custom heights but never invent a different model:
 // if the user explicitly set a height, scale *only the height* of bollards.
 const actual=number(instance?.height,NaN);
 const natural=Number(G.userData.measuredHeight)||1;
 const oldDefaults={bollard:[.85], 'square-bollard':[.50], 'garden-lantern':[.995,2.35],globe:[.38,.40,.68]};
 const historicDefault=(oldDefaults[id]||[]).some(v=>Math.abs(v-actual)<.012);
 const hasRealCustom=Number.isFinite(actual)&&actual>.14&&actual<4&&
   Math.abs(actual-natural)>.04&&!historicDefault&&
   // Legacy scene saved 1.2 m on EVERY lamp, not a genuine custom height.
   !(actual===1.2&&id!=='low-post');
 const scalable=['bollard','low-post','square-bollard','garden-lantern','globe'].includes(id);
 if(hasRealCustom&&scalable){
  if(id==='globe'){const factor=actual/natural;G.scale.setScalar(factor)}
  else G.scale.y=actual/natural;
  G.userData.measuredHeight=actual;
 }
 return G;
}
