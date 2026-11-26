/* FORMA architectural houses: metrically correct footprints, distinct facade
 * systems and real roof planes. These are editable, procedural Three.js models.
 * Presets do not infer unknown details from a user's architectural photograph. */
import {buildingHeights,facadeOpeningSchedule,wallPatches,rainwaterDrainPlan,windowTrimProfile,scandiRoofOverhang} from './forma-landscape-3d-architecture-geometry.js';
import {measuredFacadePatchGeometry,applyArchitecturalPBR} from './forma-landscape-3d-house-finish.js?v=visual-R19';
import {addOpenEaveGutter} from './forma-landscape-3d-roof-drainage.js';
import {addScandiRoofSnowGuards,addScandiTerrace} from './forma-landscape-3d-scandi-reference-extras.js';
import {SCANDI_DETAIL,scandiTimberMaterial,addScandinavianVerticalCladding,addScandiGableCladding,addScandiRoofEdgeDetails,addScandiCornerDetails,addScandiEntrance} from './forma-landscape-3d-scandinavian-detail.js';
import {addAlphaReferenceHouse} from './forma-landscape-3d-alpha-house.js?v=visual-R19';
import {normalizeNightInterior,interiorLightColor,interiorLightLevels} from './forma-landscape-3d-night-interior.js?v=bright-night-v2-20261122';
import {addRoofGarland} from './forma-landscape-roof-garlands.js';
export const HOUSE_PRESETS=Object.freeze([
 {id:'barn',name:'Барнхаус',subtitle:'Тёмный металл · дерево',wall:'darkwood',roof:'gable',roofFinish:'standing',accent:'#B8936E'},
 {id:'scandi',name:'Скандинавский',subtitle:'Серый вертикальный планкен · графитовая кровля · чёрные окна',wall:'lightwood',roof:'gable',roofFinish:'standing',accent:'#919897'},
 {id:'timber',name:'Клеёный брус',subtitle:'Орех · строгая геометрия',wall:'walnut',roof:'gable',roofFinish:'tile',accent:'#7E5740'},
 {id:'brick',name:'Кирпичный дом',subtitle:'Баварский кирпич · металл',wall:'brick',roof:'hip',roofFinish:'tile',accent:'#996B5A'},
 {id:'modern',name:'Современный',subtitle:'Штукатурка · панорамное стекло',wall:'plaster',roof:'flat',roofFinish:'flat',accent:'#D5CEBF'},
 {id:'japandi',name:'Japandi',subtitle:'Штукатурка · тёплый кедр',wall:'cedar',roof:'flat',roofFinish:'flat',accent:'#BDA78B'},
 {id:'classic',name:'Классический',subtitle:'Светлый фасад · вальмовая кровля',wall:'stone',roof:'hip',roofFinish:'tile',accent:'#D5D0C7'},
 {id:'aframe',name:'A-frame',subtitle:'Высокий треугольный силуэт',wall:'darkwood',roof:'gable',roofFinish:'standing',accent:'#69533F'},
 {id:'alpha',name:'АЛЬФА · A-frame',subtitle:'Референс 7,5×9,5 · графитовая доска · 4 мансардных окна · терраса',wall:'darkwood',roof:'gable',roofFinish:'standing',accent:'#40484B'},
 {id:'chalet',name:'Альпийское шале',subtitle:'Широкая кровля · деревянная терраса',wall:'walnut',roof:'gable',roofFinish:'tile',accent:'#957157'},
 {id:'cottage',name:'Английский коттедж',subtitle:'Фахверк · крутая кровля',wall:'stone',roof:'gable',roofFinish:'tile',accent:'#B1A193'},
 {id:'mediterranean',name:'Средиземноморский',subtitle:'Терракота · светлый камень',wall:'plaster',roof:'hip',roofFinish:'tile',accent:'#B98764'},
 {id:'hightech',name:'Хай-тек',subtitle:'Консоль · бетон · витраж',wall:'plaster',roof:'flat',roofFinish:'flat',accent:'#A9B6B1'},
 {id:'modular',name:'Модульный дом',subtitle:'Фальц · вертикальный планкен · сборные модули',wall:'lightwood',roof:'flat',roofFinish:'flat',accent:'#A69B88'},
 {id:'logcabin',name:'Рубленый лафет',subtitle:'Реальные венцы · рубленные углы',wall:'walnut',roof:'gable',roofFinish:'tile',accent:'#85664A'},
 {id:'bungalow',name:'Бунгало',subtitle:'Один этаж · широкая веранда',wall:'cedar',roof:'hip',roofFinish:'tile',accent:'#B29F81'},
 {id:'duplex',name:'Двухэтажный',subtitle:'Два этажа · два входа · окна второго уровня',wall:'plaster',roof:'hip',roofFinish:'tile',accent:'#C5B8A8'},
 {id:'panoramic',name:'Панорамный дом',subtitle:'Большой витраж · деревянные ламели',wall:'darkwood',roof:'flat',roofFinish:'flat',accent:'#837869'},
 {id:'tiny',name:'Tiny House',subtitle:'Компактный дом · крыльцо · скатная крыша',wall:'lightwood',roof:'gable',roofFinish:'standing',accent:'#AFA58B'}
]);
const presetById=id=>HOUSE_PRESETS.find(p=>p.id===id);
export const housePreset=id=>presetById(id)||HOUSE_PRESETS[0];
export const housePresetIds=Object.freeze(HOUSE_PRESETS.map(p=>p.id));
const cached=new Map();
function noise(seed){let state=seed|0;return()=>{state=(Math.imul(1664525,state)+1013904223)|0;return (state>>>0)/4294967296}};
function texture(THREE,key,base){
 if(cached.has(key))return cached.get(key);
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
 const c=canvas.getContext('2d'),random=noise(key.split('').reduce((a,ch)=>a*31+ch.charCodeAt(0),61));
 c.fillStyle=base;c.fillRect(0,0,512,512);
 const n=key.toLowerCase();
 const line=(x,y,x2,y2,color,width=1)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke()};
 if(n==='brick'){
  c.fillStyle='#B7B1AA';
  for(let y=0;y<=512;y+=42){line(0,y,512,y,'#BBB8AF',5);
   const shift=((y/42)&1)?-55:0;
   for(let x=shift;x<512;x+=112){
    c.fillStyle=['#7E4E42','#946552','#A27664','#70504B','#A78874'][Math.floor(random()*5)];
    c.fillRect(x+3,y+4,105,34);
    c.fillStyle='rgba(0,0,0,.12)';c.fillRect(x+3,y+36,104,2);
   }
  }
 }else if(['darkwood','lightwood','walnut','cedar'].includes(n)){
  const horizontal=n==='walnut';
  for(let i=0;i<512;i+=horizontal?27:36){
   if(horizontal){line(0,i,512,i,'rgba(15,19,17,.38)',3);line(0,i+3,512,i+3,'rgba(255,255,255,.08)',1)}
   else{line(i,0,i,512,'rgba(15,19,17,.37)',4);line(i+4,0,i+4,512,'rgba(255,255,255,.11)',2)}
  }
  for(let i=0;i<520;i++){const p=random()*512,q=random()*512;line(p,q,p+(horizontal?14:0.7),q+(horizontal?1:27),'rgba(5,8,5,.075)',random()*1.8)}
 }else if(n==='standing'){
  // Physical 3D ribs define the seam direction. Avoid a cross-hatched
  // painted texture that would produce an unrealistic roofing grid.
  for(let i=0;i<1150;i++){const x=random()*512,y=random()*512;
   line(x,y,x+random()*3,y+random()*8,'rgba(214,219,214,.065)',.55)}
 }else if(n==='tile'){
  for(let y=0;y<512;y+=26){line(0,y,512,y,'rgba(10,12,15,.5)',2);
   for(let x=(Math.floor(y/26)%2)*22;x<512;x+=44){line(x,y,x,y+26,'rgba(7,12,17,.18)',1.5)}
  }
 }else if(n==='stone'){
  for(let y=0;y<512;y+=50){
   line(0,y,512,y,'rgba(80,74,68,.16)',1);
   for(let x=0;x<512;x+=100){line(x+(Math.floor(y/50)%2)*30,y,x+(Math.floor(y/50)%2)*30,y+50,'rgba(90,84,78,.11)',1)}
  }
 }
 for(let i=0;i<3200;i++){
  const shade=random()>.5?'rgba(255,255,255,.035)':'rgba(0,0,0,.045)';
  c.fillStyle=shade;const x=random()*512,y=random()*512;c.fillRect(x,y,random()*3+.3,random()*2+.3);
 }
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;
 t.anisotropy=4;cached.set(key,t);return t;
}
function mat(THREE,color,roughness=.84,metalness=.02,tex=null){
 return new THREE.MeshStandardMaterial({color,roughness,metalness,...(tex?{map:tex}:{})});
}
function add(g,THREE,geometry,material,x=0,y=0,z=0){
 const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);
 mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh;
}
function box(g,T,w,h,d,x,y,z,material){return add(g,T,new T.BoxGeometry(w,h,d),material,x,y,z)}
function surface(g,T,w,h,x,y,z,material,rotation=0){
 const v=add(g,T,new T.PlaneGeometry(w,h),material,x,y,z);v.rotation.y=rotation;return v;
}
function windowGroup(T,width,height,night=false,panoramic=false,tripleGlazed=false,interior=null){
 const cfg=normalizeNightInterior(interior),levels=interiorLightLevels(cfg);
 const lightsOn=night&&levels.enabled;
 const glowStrength=lightsOn?levels.windowEmission:0;
 const g=new T.Group();
 const frame=mat(T,tripleGlazed?SCANDI_DETAIL.windowFrame:'#181E20',tripleGlazed?.40:.52,tripleGlazed?0:.5),recess=mat(T,'#121A1C',.91,.02),glass=new T.MeshPhysicalMaterial({
  // Photographic architectural glazing reflects its environment rather than glowing cyan.
  color:lightsOn?'#AAB9B1':'#6C888B',metalness:0,roughness:.19,transparent:true,opacity:lightsOn&&cfg.visibility==='full'?.45:lightsOn&&cfg.visibility==='partial'?.62:.88,
  ior:1.46,clearcoat:.48,clearcoatRoughness:.16,side:T.FrontSide,depthWrite:true,
  emissive:lightsOn?interiorLightColor(cfg.temperature):'#000000',emissiveIntensity:glowStrength
 });
 const w=Math.max(.45,width),h=Math.max(.6,height),edge=.084;
 // Dark recessed opening masks the solid procedural wall behind the pane.
 // Explicit border profiles create the reveal without an unrealistic opaque frame slab.
 if(tripleGlazed)box(g,T,w,h,.035,0,0,-.045,recess);
 else box(g,T,w,h,.035,0,0,.035,recess);
 if(tripleGlazed){
  // Three separate transparent 4mm leaves, dual cavities and visible
  // warm-edge spacers. The frame is uPVC (no metallic reflective finish).
  const pane=new T.MeshPhysicalMaterial({
   color:lightsOn?'#E0CBB3':'#99B6BD',metalness:0,roughness:.058,
   emissive:lightsOn?interiorLightColor(cfg.temperature):'#000000',emissiveIntensity:glowStrength*.19,
   ior:1.52,transparent:true,opacity:.28,depthWrite:false,
   side:T.DoubleSide,clearcoat:.15,clearcoatRoughness:.07
  });
  for(const [i,z] of [.053,.073,.093].entries()){
   const glassLeaf=box(g,T,w-edge*2,h-edge*2,.004,0,0,z,pane);
   glassLeaf.userData.architecturePart=['ig-unit-outer-pane','ig-unit-middle-pane','ig-unit-inner-pane'][i];
   glassLeaf.userData.glassThicknessMm=4;
  }
  const spacer=mat(T,'#383D3B',.82,.06);
  for(const z of [.063,.083]){
   for(const sx of [-1,1])
    box(g,T,.009,h-edge*2,.010,sx*(w*.5-edge+.012),0,z,spacer)
     .userData.architecturePart='ig-unit-warm-edge-spacer';
   for(const sy of [-1,1])
    box(g,T,w-edge*2,.009,.010,0,sy*(h*.5-edge+.012),z,spacer)
     .userData.architecturePart='ig-unit-warm-edge-spacer';
  }
  const pvc=mat(T,SCANDI_DETAIL.windowFrame,.43,0);
  const inset=Math.min(.13,edge+.026);
  for(const side of [-1,1]){
   box(g,T,.038,h,.058,side*(w*.5-inset),0,.128,pvc)
    .userData.architecturePart='upvc-sash-76mm';
   box(g,T,w,.038,.058,0,side*(h*.5-inset),.128,pvc)
    .userData.architecturePart='upvc-sash-76mm';
  }
  const rubber=mat(T,'#161C1D',.96,0);
  for(const side of [-1,1]){
   box(g,T,.008,h-edge*2,.012,side*(w*.5-edge+.012),0,.116,rubber)
    .userData.architecturePart='outer-glazing-gasket';
   box(g,T,w-edge*2,.008,.012,0,side*(h*.5-edge+.012),.116,rubber)
    .userData.architecturePart='outer-glazing-gasket';
  }
  // Physical weep/drain slots in the bottom of the outer PVC sash.
  for(const x of [-w*.29,w*.29]){
   box(g,T,.022,.005,.012,x,-h*.5+.071,.151,rubber)
    .userData.architecturePart='upvc-drainage-weep-hole';
  }
  g.userData.windowSystem={frame:'uPVC 76mm',unit:'triple glazed 4-16-4-16-4',
   panes:3,spacer:'warm-edge',nominalPaneThicknessMm:4};
 }else box(g,T,w,h,.022,0,0,.095,glass);
 for(const side of [-1,1])box(g,T,edge,h+edge*2,tripleGlazed?.076:.16,side*(w+edge)/2,0,tripleGlazed?.089:.065,frame);
 for(const side of [-1,1])box(g,T,w+edge*2,edge,tripleGlazed?.076:.16,0,side*(h+edge)/2,tripleGlazed?.089:.065,frame);
 const mullion=panoramic?2:1;
 for(let i=1;i<=mullion;i++)box(g,T,.036,h,tripleGlazed?.076:.12,(i/(mullion+1)-.5)*w,0,.105,frame);
 box(g,T,w,.033,.12,0,.012,.105,frame);
 box(g,T,w+.26,.065,.26,0,-h/2-.14,.045,mat(T,'#414747',.68,.26));
 // Working casement hardware: discreet hinges on the sash and an upper
 // trickle-vent grille. All are within the actual surveyed glass aperture.
 const hardware=mat(T,'#626C6C',.36,.58);
 for(const y of [-h*.31,h*.31]){
  const hinge=box(g,T,.033,.085,.035,w/2-.055,y,.142,hardware);
  hinge.userData.architecturePart='window-hinge';
 }
 if(w>.85){
  const vent=box(g,T,Math.min(.34,w*.29),.018,.029,-w*.13,h/2-.095,.145,
   mat(T,'#31383C',.72,.18));
  vent.userData.architecturePart='window-trickle-vent';
 }
 // Thin inner seals provide believable depth without covering the true opening.
 const seal=mat(T,'#121718',.91,.05);
 box(g,T,w-.12,.016,.025,0,-h/2+.043,.125,seal);
 box(g,T,w-.12,.016,.025,0,h/2-.043,.125,seal);
 return g;
}
function doorGroup(T,width=1.04,height=2.16,modern=false){
 const g=new T.Group();
 const dark=mat(T,'#242D30',.45,.44),panel=mat(T,modern?'#23343A':'#574437',.6,.16);
 box(g,T,width+.14,height+.12,.14,0,0,-.04,dark);
 box(g,T,width,height,.085,0,0,.032,panel);
 // Real perimeter gasket on the recessed door leaf.
 const gasket=mat(T,'#0A1114',.94,.04);
 for(const sx of [-1,1])box(g,T,.012,height-.10,.018,sx*(width/2-.020),0,.088,gasket)
  .userData.architecturePart='door-gasket';
 box(g,T,width-.08,.013,.020,0,height/2-.036,.087,gasket);
 if(modern){box(g,T,width*.25,height*.86,.04,-width*.25,0,.12,mat(T,'#20383F',.13,.24))}
 const handle=box(g,T,.025,.31,.035,width*.33,-.04,.099,mat(T,'#D0C6AF',.3,.65));
 handle.userData.architecturePart='door-handle';
 const lock=add(g,T,new T.CylinderGeometry(.022,.022,.018,14),
  mat(T,'#C0C3BD',.30,.72),width*.33,-.26,.109);
 lock.rotation.x=Math.PI/2;
 lock.userData.architecturePart='door-lock-cylinder';
 box(g,T,width+.22,.042,.26,0,-height/2-.085,.095,dark)
  .userData.architecturePart='door-threshold';
 return g;
}
/** Measured window assembly: 190 mm wall, recessed real glazed opening,
 * four returns, weather-shedding outer sill, slim inner windowsill and
 * style-appropriate outside casing. No geometry blocks the aperture.
 */
function addWindowFinishing(facade,T,o,style){
 const p=windowTrimProfile(style),w=o.width,h=o.height,x=o.x;
 const bottom=o.bottom,cy=bottom+h*.5,scandi=style==='scandi';
 const wood=['scandi','timber','logcabin','chalet','tiny','bungalow'].includes(style);
 const outer=mat(T,p.material,wood?.78:.55,scandi?0:wood?.03:.35);
 const reveal=mat(T,scandi?'#50585A':['barn','modern','hightech','panoramic'].includes(style)?
  '#343E42':wood?'#A89C87':'#C2C0B8',.87,scandi?0:.03);
 const seal=mat(T,'#192023',.94,.025);
 const sillFinish=mat(T,wood?'#8F9492':['classic','cottage','mediterranean','brick'].includes(style)?
  '#B3AFA4':'#636E71',.48,wood?.30:.49);
 // Exterior face of a 190mm wall is +.095; glass plane is -.065.
 // Returns fill only the measured 160mm depth between wall and glass.
 const depth=p.revealDepth,mid=.015;
 for(const side of [-1,1]){
  box(facade,T,.026,h,depth,x+side*(w*.5-.013),cy,mid,reveal)
   .userData.architecturePart='window-side-reveal';
  box(facade,T,.011,h-.052,depth-.012,
   x+side*(w*.5-.043),cy,mid-.005,seal)
   .userData.architecturePart='window-jamb-shadow';
 }
 for(const side of [-1,1]){
  box(facade,T,w,.025,depth,x,cy+side*(h*.5-.013),mid,reveal)
   .userData.architecturePart=side===1?'window-head-reveal':'window-bottom-reveal';
 }
 // External architraves live outside the glass aperture and physically
 // touch the facade. They are narrower on minimal aluminum buildings.
 const cw=p.width,cz=scandi?.152:.095+p.depth*.46;
 for(const side of [-1,1]){
  box(facade,T,cw,h+cw*.62,p.depth,
   x+side*(w*.5+cw*.5+.013),cy+cw*.10,cz,outer)
   .userData.architecturePart='window-casing-side';
  // A narrow return where the architrave meets the plaster or timber.
  box(facade,T,.012,h+.03,.022,
   x+side*(w*.5+cw+.01),cy,scandi?.158:.113,seal)
   .userData.architecturePart='window-casing-joint';
 }
 box(facade,T,w+cw*2+.045,cw*.78,p.depth,
  x,bottom+h+cw*.40,cz,outer)
  .userData.architecturePart='window-casing-head';
 // Upper head flashing directs facade runoff away from glazing, not into
 // the glazing recess. Keep its projection subordinate to the sill.
 box(facade,T,w+cw*2+.065,.015,.084,
  x,bottom+h+cw*.83,scandi?.174:.128,sillFinish)
  .userData.architecturePart='window-head-flashing';
 // The sill sits BELOW the sash and slopes toward exterior +Z. On the
 // ventilated Scandinavian facade the drip projects > 40mm OUTSIDE the
 // raised boards (not just outside the structural wall).
 const sillDepth=scandi?.37:.30,sillCenter=scandi?.012:.008;
 const nose=scandi?.197:.158;
 const sill=box(facade,T,w+.20,.021,sillDepth,
  x,bottom-.068,sillCenter,sillFinish);
 sill.rotation.x=p.sillSlopeRadians;
 sill.userData.architecturePart='window-pitched-sill';
 sill.userData.slopeOutwardRadians=p.sillSlopeRadians;
 sill.userData.wallExteriorFace=.095;
 sill.userData.sillExteriorNose=.158;
 if(scandi){
  sill.userData.sillExteriorNose=nose;
  sill.userData.claddingOuterFace=.145;
  sill.userData.dripClearanceBeyondCladdingMm=52;
 }
 // Roll-under drip makes water detach from the cladding and caps the ends.
 box(facade,T,w+.22,.020,.020,x,bottom-.094,nose,sillFinish)
  .userData.architecturePart='window-drip';
 for(const side of [-1,1]){
  box(facade,T,.024,.039,sillDepth,
   x+side*(w*.5+.103),bottom-.069,sillCenter,sillFinish)
   .userData.architecturePart='sill-end-cap';
 }
 if(scandi){
  // Extra rainscreen returns span the physical timber ventilation cavity;
  // weather-resisting tapes and expanding joint form a continuous seal
  // between cladding, uPVC sash and the 190mm structural wall.
  const returnMat=mat(T,'#B5A58D',.89,0);
  const epdm=mat(T,'#222B2B',.94,0);
  for(const side of [-1,1]){
   box(facade,T,.018,h,.055,
    x+side*(w*.5-.010),cy,.117,returnMat)
    .userData.architecturePart='rainscreen-window-side-return';
   box(facade,T,.012,h-.06,.023,
    x+side*(w*.5-.045),cy,.064,epdm)
    .userData.architecturePart='window-installation-weather-seal';
  }
  box(facade,T,w+.04,.018,.055,
   x,bottom+h-.010,.117,returnMat)
   .userData.architecturePart='rainscreen-window-head-return';
  box(facade,T,w+.08,.008,.024,
   x,bottom+h+.024,.104,epdm)
   .userData.architecturePart='window-head-waterproof-tape';
  // Two tiny hemmed returns under the outer sill block lateral wind rain.
  for(const side of [-1,1])
   box(facade,T,.017,.047,.030,
    x+side*(w*.5+.095),bottom-.058,nose-.018,epdm)
    .userData.architecturePart='sill-wind-rain-end-upstand';
 }
 box(facade,T,w+.068,.012,.020,x,bottom+.011,-.052,seal)
  .userData.architecturePart='window-sill-seal';
 // The actual interior windowsill projects INTO the house (-Z).
 // A shallow shade line makes its thickness visible through the glass.
 const inner=mat(T,wood?'#B8A99A':'#E2DECF',.77,.025);
 box(facade,T,w+.17,.032,.18,x,bottom-.078,-.146,inner)
  .userData.architecturePart='interior-windowsill';
 box(facade,T,w+.17,.012,.018,x,bottom-.099,-.229,seal)
  .userData.architecturePart='interior-sill-edge';
}
/* A continuous solid cube under fake windows is architecturally wrong.
 * The wall envelope below consists only of closed wall segments *outside*
 * measured door and window apertures. Door/window meshes occupy the void.
 */
function addMeasuredFacades(g,T,{width:w,depth:d,height:h,style,type,material,night,interiorConfig}){
 const plan=facadeOpeningSchedule({width:w,depth:d,height:h,style,type});
 const walls=[
  ['front',w,0,d/2,0],['rear',w,0,-d/2,Math.PI],
  ['left',d,-w/2,0,-Math.PI/2],['right',d,w/2,0,Math.PI/2]
 ];
 const interior=mat(T,'#1C2223',.94,.02);
 const scandiMain=style==='scandi'?scandiTimberMaterial(T,SCANDI_DETAIL.mainWood):null;
 const scandiAccent=style==='scandi'?scandiTimberMaterial(T,SCANDI_DETAIL.accentWood):null;
 for(const [name,span,px,pz,angle] of walls){
  const facade=new T.Group();
  facade.name='facade-'+name;
  facade.position.set(px,0,pz);facade.rotation.y=angle;g.add(facade);
  const openings=plan[name];
  const patches=wallPatches(span,.48,h-.09,openings);
  // Each measured facade segment remains a genuine 190mm thick wall.
  const shellThickness=.19;
  for(const patch of patches){
   const segment=add(facade,T,
    measuredFacadePatchGeometry(T,patch,span,material.userData?.tileMetres||1.8),
    material,patch.x,patch.y,0);
   segment.userData.architecturePart='solid-wall';
   segment.userData.facade=name;
  }
  if(style==='scandi'&&(type==='house'||!type)){
   addScandinavianVerticalCladding(T,facade,{
    span,patches,front:name==='front',
    frontDoor:name==='front'?openings.find(o=>o.kind==='door'):null,
    mainMaterial:scandiMain,accentMaterial:scandiAccent
   });
  }
  for(const opening of openings){
   let part;
   if(opening.kind==='garage'){
    const garageMat=mat(T,'#343B3E',.64,.45);
    const frameMat=mat(T,'#20282B',.46,.55);
    part=new T.Group();
    box(part,T,opening.width,opening.height,.065,0,0,.035,garageMat);
    for(let yy=-opening.height/2+.26;yy<opening.height/2;yy+=.36)
     box(part,T,opening.width,.023,.075,0,yy,.082,frameMat);
    for(const x of [-opening.width/2,opening.width/2])
     box(part,T,.064,opening.height,.16,x,0,.070,frameMat);
    box(part,T,opening.width+.10,.08,.15,0,opening.height/2,.068,frameMat);
   }else if(opening.kind==='door'){
    part=doorGroup(T,opening.width,opening.height,
     ['modern','hightech','japandi','panoramic','modular','scandi'].includes(style));
   }else{
    part=windowGroup(T,opening.width,opening.height,night,opening.panoramic,style==='scandi',interiorConfig);
   }
   // 190mm thick wall (outer face +.095): the window glass is now set
   // 110mm behind it. Aperture geometry and surveyed facade never move.
   part.position.set(opening.x,opening.bottom+opening.height/2,
    opening.kind==='window'?-.16:opening.kind==='door'?-.095:.014);
   part.userData.architecturePart=opening.kind;
   if(opening.kind==='window'){
    part.userData.recessDepth=.16;
    part.userData.reveals=true;
   }
   part.userData.architectureOpening={
    facade:name,width:opening.width,height:opening.height,bottom:opening.bottom
   };
   facade.add(part);
   if(opening.kind==='window')addWindowFinishing(facade,T,opening,style);
   // Non-window openings have their own dark interior door/garage returns.
   if(opening.kind!=='window')for(const edge of [-1,1])
    box(facade,T,.055,opening.height,.13,
     opening.x+edge*(opening.width/2+.023),opening.bottom+opening.height/2,-.022,interior);
  }
 }
 return plan;
}

function roofPlane(g,T,slopeLength,depth,x,y,angle,roofMat){
 // Full 320mm roof cassette. The visible edge has the mass of a real roof.
 const roof=add(g,T,new T.BoxGeometry(slopeLength,.32,depth),roofMat,x,y,0);
 roof.userData.roofThickness=.32;
 roof.rotation.z=angle;
 roof.userData.architecturePart='roof-layer';
 return roof;
}
function edgeBeam(g,T,a,b,thickness,material){
 const p=new T.Vector3(...a),q=new T.Vector3(...b),d=q.clone().sub(p),m=new T.Vector3().addVectors(p,q).multiplyScalar(.5);
 const item=add(g,T,new T.BoxGeometry(thickness,thickness,d.length()),material,m.x,m.y,m.z);
 item.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),d.normalize());return item;
}
function thickHipRoofFace(g,T,points,material,thickness=.20){
 // Closed hip-roof panel: outer cladding, underside and four real edges.
 const count=points.length,positions=[],uv=[],index=[];
 for(const dy of [.055,.055-thickness])for(const p of points){
  positions.push(p[0],p[1]+dy,p[2]);
  uv.push(p[0]*.22,p[2]*.22);
 }
 for(let i=1;i<count-1;i++)index.push(0,i,i+1,count,count+i+1,count+i);
 for(let i=0;i<count;i++){
  const n=(i+1)%count;
  index.push(i,n,count+n,i,count+n,count+i);
 }
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 geometry.setIndex(index);geometry.computeVertexNormals();
 // Both long hip faces use opposite authored vertex winding; allow
 // double-sided physically lit facets instead of disappearing roof slopes.
 material.side=T.DoubleSide;
 const mesh=add(g,T,geometry,material);
 mesh.userData.architecturePart='roof-layer';
 mesh.userData.roofThickness=thickness;
 return mesh;
}
function roofGeometry(g,T,b,w,d,eave,bodyHeight,roofMaterial,roofFinish){
 const roof=b.roof||housePreset(b.archStyle).roof,overhang=b.archStyle==='scandi'?scandiRoofOverhang(w,d):b.archStyle==='chalet'?Math.min(1.2,Math.min(w,d)*.16):
 b.archStyle==='cottage'?Math.min(.75,Math.min(w,d)*.09):Math.min(.42,Math.max(.22,Math.min(w,d)*.055));
 const dark=mat(T,'#22282B',.75,.38),soffit=mat(T,'#555A59',.82,.06),gable=roof==='gable',hip=roof==='hip';
 const rise=b.archStyle==='aframe'?Math.max(4.2,Math.min(8,Number(b.roofRise)||0,w*.74)):Math.max(.5,Math.min(4,Number(b.roofRise)||Math.min(w,d)*.22));
 if(roof==='flat'){
  box(g,T,w+overhang*2,.30,d+overhang*2,0,bodyHeight+.16,0,roofMaterial);
  const lip=mat(T,'#32393A',.8,.15);
  for(const x of [-1,1])box(g,T,.17,.38,d+overhang*2,x*(w/2+overhang-.08),bodyHeight+.41,0,lip);
  for(const z of [-1,1])box(g,T,w+overhang*2,.38,.17,0,bodyHeight+.41,z*(d/2+overhang-.08),lip);
  // A folded metal coping caps the entire parapet, including a small
  // projecting drip edge. Bare rectangular parapet tops looked unfinished.
  const coping=mat(T,'#7B8484',.48,.46);
  for(const x of [-1,1]){
   box(g,T,.24,.035,d+overhang*2+.18,x*(w/2+overhang-.08),
    bodyHeight+.615,0,coping).userData.architecturePart='parapet-metal-coping';
  }
  for(const z of [-1,1]){
   box(g,T,w+overhang*2+.18,.035,.24,0,
    bodyHeight+.615,z*(d/2+overhang-.08),coping)
    .userData.architecturePart='parapet-metal-coping';
  }
  // Shadowed underside makes the insulated 300mm slab readable at eye level.
  box(g,T,w+overhang*2-.12,.023,d+overhang*2-.12,0,
   bodyHeight-.007,0,soffit).userData.architecturePart='roof-underside';
  return;
 }
 const half=(w+overhang*2)/2,depth=d+overhang*2,run=Math.hypot(half,rise),angle=Math.atan2(rise,half);
 if(gable){
  roofPlane(g,T,run,depth,-half/2,bodyHeight+rise/2+.07,angle,roofMaterial);
  roofPlane(g,T,run,depth,half/2,bodyHeight+rise/2+.07,-angle,roofMaterial);
  // Low underside soffits remain aligned with the sloped roof surfaces.
  for(const side of [-1,1]){
   const panel=add(g,T,new T.BoxGeometry(run,.044,depth-.07),soffit,
    side*half/2,bodyHeight+rise/2-.123,0);
   panel.rotation.z=side<0?angle:-angle;
   panel.userData.architecturePart='roof-soffit';
  }
  if(roofFinish==='standing'){
   // True standing-seam ribs run down the slope; they catch light separately
   // from the painted roof texture and retain the same measured roof planes.
   const rib=mat(T,'#4F5B5C',.43,.62);
   for(let z=-depth/2+.27;z<depth/2;z+=.58){
    for(const side of [-1,1]){
     const bar=box(g,T,run,.025,.03,side*half/2,bodyHeight+rise/2+.247,z,rib);
     bar.rotation.z=side<0?angle:-angle;
    }
   }
  }
  const fascia=mat(T,'#30393D',.62,.36);
  for(const x of [-half,half]){
   for(const z of [-depth/2-.052,depth/2+.052])
    edgeBeam(g,T,[x,bodyHeight+.07,z],
     [0,bodyHeight+rise+.07,z],.32,fascia);
   // Structural fascia visibly closes the 320mm roof cassette.
   box(g,T,.30,.28,depth+.07,x>0?half-.15:-half+.15,bodyHeight-.062,0,fascia)
    .userData.architecturePart='roof-eave-fascia';
   if(b.archStyle!=='aframe'){
    if(T.ExtrudeGeometry)addOpenEaveGutter(T,g,{
     x:x+(x>0?.145:-.145),y:bodyHeight-.065,z:0,
     length:depth-.05,fallToward:x>0?1:-1,material:dark
    });
    else{
     // Compatibility only for older Three builds without profile extrusion.
     const gutter=add(g,T,new T.CylinderGeometry(.12,.12,depth-.05,22,1,true,Math.PI,Math.PI),dark,
      x+(x>0?.145:-.145),bodyHeight-.065,0);
     gutter.material.side=T.DoubleSide;
     gutter.rotation.x=Math.PI/2;gutter.userData.architecturePart='gutter';
    }
   }
  }
  edgeBeam(g,T,[0,bodyHeight+rise+.07,-depth/2-.06],
   [0,bodyHeight+rise+.07,depth/2+.06],.21,fascia);
  // Continuous thin metal eave flashing catches the roof-edge highlight.
  // It follows the outer plane, without changing the house footprint.
  const drip=mat(T,'#6D7779',.42,.51);
  for(const side of [-1,1]){
   box(g,T,.125,.035,depth+.12,side*(half+.065),
    bodyHeight-.215,0,drip).userData.architecturePart='gable-roof-drip-flashing';
  }
  // Scandinavian upper gable has a REAL punched hole for insulating
  // glass. A solid triangle here would completely hide the window.
  if(b.archStyle!=='scandi'){
   const wallColor=mat(T,b.archStyle==='classic'?'#D9D4C7':'#403B35');
   const faces=new Float32Array([-w/2,bodyHeight,d/2, w/2,bodyHeight,d/2,0,bodyHeight+rise*.94,d/2,
                                  -w/2,bodyHeight,-d/2,0,bodyHeight+rise*.94,-d/2,w/2,bodyHeight,-d/2]);
   const geo=new T.BufferGeometry();
   geo.setAttribute('position',new T.BufferAttribute(faces,3));
   geo.computeVertexNormals();
   const fill=add(g,T,geo,wallColor);fill.material.side=T.DoubleSide;
  }
 }else if(hip){
  const startZ=Math.max(.25,d/2-half*.56),top=bodyHeight+rise+.07;
  const planes=[
   [[-half,bodyHeight,-depth/2],[0,top,-startZ],[0,top,startZ],[-half,bodyHeight,depth/2]],
   [[half,bodyHeight,depth/2],[0,top,startZ],[0,top,-startZ],[half,bodyHeight,-depth/2]],
   [[-half,bodyHeight,-depth/2],[half,bodyHeight,-depth/2],[0,top,-startZ]],
   [[half,bodyHeight,depth/2],[-half,bodyHeight,depth/2],[0,top,startZ]]
  ];
  for(const p of planes)thickHipRoofFace(g,T,p,roofMaterial,.30);
  edgeBeam(g,T,[0,top,-startZ],[0,top,startZ],.10,dark);
  // Actual hip-edge flashings, not lines painted onto the texture.
  for(const x of [-half,half])for(const z of [-depth/2,depth/2])
   edgeBeam(g,T,[x,bodyHeight+.04,z],[0,top,z<0?-startZ:startZ],.055,dark);
  for(const x of [-half,half]){
   box(g,T,.27,.27,depth,x,bodyHeight+.018,0,dark);
   addOpenEaveGutter(T,g,{
    x:x+(x<0?-.145:.145),y:bodyHeight-.065,z:0,
    length:depth-.10,fallToward:x>0?1:-1,material:dark
   });
  }
  for(const z of [-depth/2,depth/2]){
   box(g,T,w+overhang*2,.28,.19,0,bodyHeight+.028,z,dark);
   // A hip roof has FOUR eaves. Both front and rear get working,
   // open-profile gutters that join the longitudinal side runs at corners.
   addOpenEaveGutter(T,g,{
    x:0,y:bodyHeight-.065,z:z+(z<0?-.145:.145),
    length:w+overhang*2-.10,axis:'x',fallToward:z>0?1:-1,
    material:dark
   });
  }
 }
}
/** Existing house doors receive measured entry steps, without changing
 * the house footprint, opening widths, or adding catalogue models. */
export function entranceDetailPlan(style,frontOpenings,width,depth){
 const supported=['barn','modern','brick','logcabin','scandi','japandi','classic'];
 if(!supported.includes(style)||!Array.isArray(frontOpenings))return [];
 const w=Math.max(2,Number(width)||2),d=Math.max(2,Number(depth)||2);
 return frontOpenings.filter(o=>o.kind==='door').map(o=>({
  x:o.x,front:d/2,stepWidth:Math.max(.9,Math.min(w*.37,o.width+.56)),
  finish:['barn','logcabin','scandi'].includes(style)?'timber':'masonry'
 }));
}
function addEntranceDetails(g,T,{style,width,depth,frontOpenings}){
 if(style==='scandi'){
  // A 480mm entry has 3 x 160mm risers and 320mm goings. Build genuine
  // supported treads and a deep landing in front of the ORIGINAL door.
  addScandiEntrance(T,g,{door:frontOpenings.find(o=>o.kind==='door'),width,depth});
  return;
 }
 const plans=entranceDetailPlan(style,frontOpenings,width,depth);
 const timber=mat(T,'#876C50',.85,.02),masonry=mat(T,'#999991',.94,.015),joint=mat(T,'#414644',.80,.04);
 for(const step of plans){
  const finish=step.finish==='timber'?timber:masonry;
  box(g,T,step.stepWidth,.12,.42,step.x,.43,step.front+.23,finish);
  box(g,T,step.stepWidth+.28,.11,.54,step.x,.175,step.front+.68,finish);
  box(g,T,step.stepWidth-.16,.022,.014,step.x,.105,step.front+.955,joint);
 }
}
/* Physically cylindrical downpipes and elbows, not square pipe stubs. */
function roundPipeBetween(g,T,a,b,radius,material,part){
 const start=new T.Vector3(...a),end=new T.Vector3(...b),
  direction=end.clone().sub(start);
 const midpoint=start.clone().add(end).multiplyScalar(.5);
 const item=add(g,T,new T.CylinderGeometry(radius,radius,direction.length(),16),
  material,midpoint.x,midpoint.y,midpoint.z);
 item.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());
 item.userData.architecturePart=part;
 return item;
}
/* Independent rainwater and plinth detailing. True measured house footprint
 * and window/door voids remain unchanged. */
function addFacadeFinish(g,T,{width,depth,height,roof,style}){
 const w=width,d=depth,y=height;
 const metal=mat(T,style==='scandi'?'#343D41':'#586468',.43,.68),stone=mat(T,'#565B59',.93,.05);
 // Exposed 480mm plinth, continuous along all four surveyed elevations.
 for(const z of [-1,1])box(g,T,w,.18,.06,0,.49,z*(d*.5+.034),stone);
 for(const x of [-1,1])box(g,T,.06,.18,d,x*(w*.5+.034),.49,0,stone);
 const isFlat=roof==='flat';
 const gutterY=isFlat?y+.19:y-.065;
 const sites=rainwaterDrainPlan({width:w,depth:d,roof,style});
 g.userData.roofDrainagePlan=sites;
 for(const site of sites){
  const {side,end,pipeX:x,pipeZ:z}=site;
  const radius=.067,pipeBottom=site.pipeBottom;
  const pipeTop=isFlat?y+.035:gutterY-.26;
  const pipe=roundPipeBetween(g,T,[x,pipeBottom,z],[x,pipeTop,z],radius,metal,'downpipe');
  pipe.userData.facade=site.facade;
  pipe.userData.connectedToGutter=true;
  // Fastening clamps are on the REAL wall behind the pipe, rather than
  // floating on the wrong elevation. Side wall for pitched roofs; rear for flat.
  for(let yy=1.07;yy<pipeTop-.10;yy+=.83){
   if(isFlat){
    box(g,T,.152,.052,.065,x,yy,z+.015,metal)
     .userData.architecturePart='downpipe-clamp';
    box(g,T,.052,.065,.12,x,yy,z+.077,metal)
     .userData.architecturePart='downpipe-wall-bracket';
   }else{
    box(g,T,.075,.056,.156,x-side*.035,yy,z,metal)
     .userData.architecturePart='downpipe-clamp';
    box(g,T,.130,.055,.049,x-side*.085,yy,z,metal)
     .userData.architecturePart='downpipe-wall-bracket';
   }
  }
  // The bottom shoe directs discharge AWAY from the surveyed foundation.
  const shoeA=[x,pipeBottom+.02,z],shoeB=isFlat?
   [x,pipeBottom-.10,z-.17]:
   [x+side*.17,pipeBottom-.10,z];
  const shoeC=isFlat?[x,pipeBottom-.21,z-.17]:
   [x+side*.17,pipeBottom-.21,z];
  roundPipeBetween(g,T,shoeA,shoeB,.069,metal,'downpipe-shoe');
  roundPipeBetween(g,T,shoeB,shoeC,.069,metal,'downpipe-shoe');
  if(!isFlat){
   // The sloped U-channel above terminates in an outlet funnel directly
   // above the actual side-wall downpipe, not in front of a window.
   const hub=[site.outletX,gutterY-.045,site.outletZ];
   const middle=[x+side*.115,gutterY-.15,z+end*.085];
   roundPipeBetween(g,T,hub,middle,.079,metal,'gutter-elbow');
   roundPipeBetween(g,T,middle,[x,pipeTop,z],radius,metal,'gutter-elbow');
   const funnel=add(g,T,new T.CylinderGeometry(.115,.079,.16,16),metal,
    site.outletX,gutterY-.08,site.outletZ);
   funnel.userData.architecturePart='gutter-outlet';
   funnel.userData.facade=site.facade;
  }else{
   // Flat roofs drain through the REAR parapet scupper and into rear pipes.
   const outlet=[site.outletX,y+.22,site.outletZ-.045];
   const scupper=box(g,T,.20,.12,.31,outlet[0],outlet[1],outlet[2],metal);
   scupper.userData.architecturePart='flat-roof-scupper';
   const mouth=box(g,T,.23,.02,.115,outlet[0],outlet[1]-.055,
    outlet[2]-.17,metal);
   mouth.userData.architecturePart='scupper-drip-lip';
   roundPipeBetween(g,T,outlet,[x,y+.10,z-.055],radius,metal,'gutter-elbow');
   roundPipeBetween(g,T,[x,y+.10,z-.055],[x,pipeTop,z],radius,metal,'gutter-elbow');
  }
 }
 if(roof==='hip'){
  const overhang=sites[0]?.overhang||.3,edgeColor=mat(T,'#444E52',.55,.44);
  for(const side of [-1,1]){
   const z=side*(d*.5+overhang-.10);
   box(g,T,w+overhang*2,.22,.21,0,gutterY,z,edgeColor)
    .userData.architecturePart='hip-roof-fascia';
  }
 }
}
export function createArchitecturalBuilding(THREE,building,{night=false,interior=null}={}){
 const b=building||{},preset=housePreset(b.archStyle),style=b.archStyle||preset.id;
 const w=Math.max(2,Number(b.width)||8),d=Math.max(2,Number(b.height)||7);
 const g=new THREE.Group();g.name='architecture-'+style;
 const isGarage=b.type==='garage',isGazebo=b.type==='gazebo',isBath=b.type==='bath',
  isCarport=b.type==='carport',isGreenhouse=b.type==='greenhouse';
 const dimensions=buildingHeights({archStyle:style,type:b.type,width:w,roofRise:b.roofRise});
 const bodyHeight=dimensions.eave;
 const shades={
  darkwood:['#53504C','#293237'],lightwood:['#D7C7B0','#323D40'],
  walnut:['#8A624D','#242D32'],brick:['#B38C7A','#303A3C'],
  plaster:['#E9E7DF','#3B4241'],cedar:['#CEBA9A','#343C3B'],
  stone:['#DDD7CF','#383E43']
 };
 const [walls,roofTint]=shades[preset.wall]||shades.darkwood;
 const wallTex=texture(THREE,preset.wall,walls).clone(),roofKey=preset.roofFinish==='tile'?'tile':'standing';
 const roofTex=texture(THREE,roofKey,roofTint).clone();
 wallTex.needsUpdate=true;roofTex.needsUpdate=true;
 const wallMaterial=mat(THREE,'#FFFFFF',.86,.02,wallTex);
 wallMaterial.userData.tileMetres=preset.wall==='brick'?1.24:
  ['plaster','stone'].includes(preset.wall)?2.1:1.8;
 // Source-authored canvas relief: subtle fiber and mortar variation in grazing light,
 // avoiding uniformly flat procedural facades without altering footprint geometry.
 wallMaterial.bumpMap=wallTex;
 wallMaterial.bumpScale=preset.wall==='brick'?.018:preset.wall==='stone'?.012:preset.wall==='plaster'?.004:.008;
 const roofColor=new THREE.Color(b.roofColor||'#394348');
 roofColor.lerp(new THREE.Color('#FAFAFA'),.12); // Keep user-selected dark roof appearance.
 const roofMaterial=mat(THREE,roofColor,preset.roofFinish==='standing'?.36:.69,
  preset.roofFinish==='standing'?.76:preset.roofFinish==='tile'?.05:.14,roofTex);
 roofMaterial.bumpMap=roofTex;roofMaterial.bumpScale=preset.roofFinish==='tile'?.012:.003;
 // UV coordinates now flow uninterrupted across real window/door openings.
 wallTex.repeat.set(1,1);
 roofTex.repeat.set(Math.max(1,w/2.8),Math.max(1,d/3.4));
 const ownedHouseTextures=[wallTex,roofTex];
 applyArchitecturalPBR(THREE,{wall:preset.wall,roofFinish:preset.roofFinish,
  wallMaterial,roofMaterial,
  roofScale:[Math.max(1,w/2.8),Math.max(1,d/3.4)],
  ownedTextures:ownedHouseTextures});
 // Exact footprint is represented by the house body. Decorative overhang is not
 // included in measured area, and never shifts parcel coordinates.
 const foundation=mat(THREE,'#373B3C',.92,.05,texture(THREE,'stone','#777D80'));
 box(g,THREE,w,.48,d,0,.24,0,foundation);
 // A separate reference-accurate A-frame: built-in roof apertures and a
 // full-height triangular facade. Never fall back to ordinary house walls.
 if(style==='alpha'){
  addAlphaReferenceHouse(THREE,g,b,{width:w,depth:d,night,interior});
  const alphaGarland=addRoofGarland(THREE,b,{width:w,depth:d,eave:.65,
   style:'alpha',roof:'gable',rise:Math.max(4.2,Math.min(8,Number(b.roofRise)||(w*.79))),overhang:.22,night});
  if(alphaGarland)g.add(alphaGarland);
  g.userData.archStyle=style;
  g.userData.footprint={width:w,height:d};
  g.userData.textures=ownedHouseTextures;
  return g;
 }
 if(isGazebo){
  for(const x of [-w/2+.2,w/2-.2])for(const z of [-d/2+.2,d/2-.2]){
   box(g,THREE,.2,bodyHeight-.4,.2,x,bodyHeight/2+.2,z,mat(THREE,'#80664E',.79));
  }
 }else if(style==='aframe'){
  // The A-frame has a real triangular end wall and low roof eaves; it does not
  // retain the rectangular walls of an ordinary house.
  const rise=Math.max(4.2,Math.min(8,Number(b.roofRise)||0,w*.74));
  const glass=new THREE.MeshPhysicalMaterial({color:night?'#5D6C67':'#1D4048',metalness:.2,roughness:.1,clearcoat:.9,side:THREE.DoubleSide});
  const triangle=[-w*.42,.60,d/2+.03,w*.42,.60,d/2+.03,0,.60+rise*.81,d/2+.03];
  const front=new THREE.BufferGeometry();front.setAttribute('position',new THREE.Float32BufferAttribute(triangle,3));front.computeVertexNormals();add(g,THREE,front,glass);
  const dark=mat(THREE,'#1A2224',.5,.35);
  edgeBeam(g,THREE,[-w*.42,.60,d/2+.11],[0,.60+rise*.81,d/2+.11],.08,dark);
  edgeBeam(g,THREE,[0,.60+rise*.81,d/2+.11],[w*.42,.60,d/2+.11],.08,dark);
  box(g,THREE,.075,rise*.65,.10,0,.60+rise*.34,d/2+.13,dark);
  box(g,THREE,w*.8,.07,.12,0,1.95,d/2+.12,dark);
  const door=doorGroup(THREE,1.1,2.0,true);door.position.set(w*.12,1.58,d/2+.20);g.add(door);
  // Rear facade intentionally solid; no inferred balcony or skylights.
  const rear=new THREE.BufferGeometry();
  rear.setAttribute('position',new THREE.Float32BufferAttribute([-w*.42,.60,-d/2-.03,0,.60+rise*.81,-d/2-.03,w*.42,.60,-d/2-.03],3));
  rear.computeVertexNormals();const facing=add(g,THREE,rear,wallMaterial);facing.material.side=THREE.DoubleSide;
 }else if(isCarport){
  // Fully open vehicular canopy: four true supports, no fake garage walls.
  const steel=mat(THREE,'#394349',.48,.78);
  const inset=Math.min(.34,Math.min(w,d)*.08);
  for(const x of [-w/2+inset,w/2-inset])for(const z of [-d/2+inset,d/2-inset])
   box(g,THREE,.17,bodyHeight-.35,.17,x,bodyHeight/2+.18,z,steel);
  for(const z of [-d/2+inset,d/2-inset])
   box(g,THREE,w-inset*2,.15,.18,0,bodyHeight-.11,z,steel);
 }else if(isGreenhouse){
  // No opaque wall slabs: actual glazing and aluminum glazing bars.
  const aluminum=mat(THREE,'#778887',.34,.72);
  const glass=new THREE.MeshPhysicalMaterial({color:'#C0D5CF',metalness:0,roughness:.10,
   transmission:.62,thickness:.009,ior:1.50,transparent:true,opacity:.58,side:THREE.DoubleSide});
  for(const x of [-w/2+.09,w/2-.09])for(const z of [-d/2+.09,d/2-.09])
   box(g,THREE,.065,bodyHeight-.51,.065,x,bodyHeight/2+.24,z,aluminum);
  for(const side of [-1,1]){
   const z=side*(d/2-.04);
   if(side===1){
    // Transparent wall still has a REAL empty door aperture. There is no
    // unbroken pane of glass behind a fake opaque entrance.
    const width=Math.min(1.05,w*.28),opening={x:0,width,bottom:.48,height:2.03};
    for(const patch of wallPatches(w,.48,bodyHeight-.14,[opening]))
     box(g,THREE,patch.width,patch.height,.012,patch.x,patch.y,z,glass);
   }else box(g,THREE,w-.15,bodyHeight-.62,.012,0,bodyHeight/2+.18,z,glass);
   for(let x=-w/2+.18;x<w/2-.15;x+=Math.max(.65,w/5))
    if(!(side===1&&Math.abs(x)<.61))
     box(g,THREE,.048,bodyHeight-.51,.048,x,bodyHeight/2+.24,z,aluminum);
  }
  for(const side of [-1,1]){
   const x=side*(w/2-.04);
   box(g,THREE,.012,bodyHeight-.62,d-.15,x,bodyHeight/2+.18,0,glass);
   for(let z=-d/2+.15;z<d/2-.14;z+=Math.max(.7,d/5))
    box(g,THREE,.048,bodyHeight-.51,.048,x,bodyHeight/2+.24,z,aluminum);
  }
  const entrance=doorGroup(THREE,Math.min(1.05,w*.28),2.03,true);
  entrance.position.set(0,1.56,d/2+.095);g.add(entrance);
 }else{
  const facadePlan=addMeasuredFacades(g,THREE,{width:w,depth:d,height:bodyHeight,style,
   type:b.type||'house',
    // Dark weather-resistive rainscreen membrane appears between REAL
    // vertical board joints; it must not reveal old beige wall texture.
    material:style==='scandi'?new THREE.MeshStandardMaterial({
     color:'#424A4C',roughness:.96,metalness:0}):wallMaterial,night,interiorConfig:interior});
  g.userData.facadeSchedule=facadePlan;
  const darkTrim=mat(THREE,'#262B2D',.52,.34);
  // Thin projecting base and eave band cast physically grounded shadows.
  box(g,THREE,w,.07,d,0,.52,0,darkTrim);
  box(g,THREE,w,.09,d,0,bodyHeight-.045,0,darkTrim);
  if(style==='logcabin'){
   // Laftet corner notches: staggered exposed dovetail-like short end logs,
   // never cylindrical oversized full-round logs or fake continuous circles.
   const seam=mat(THREE,'#59432F',.79,.02),timber=mat(THREE,'#927253',.76,.01);
   for(let yy=.62;yy<bodyHeight-.14;yy+=.29){
    for(const x of [-w/2-.12,w/2+.12])
     box(g,THREE,.39,.22,.29,x,yy,d/2-.09,timber);
    for(const z of [-d/2-.12,d/2+.12])
     box(g,THREE,.29,.22,.39,w/2-.08,yy,z,timber);
   }
   // Existing doors/windows remain real apertures: only wood runs on solids.
   for(const [face,span,px,pz,angle] of [
    ['front',w,0,d/2,0],['rear',w,0,-d/2,Math.PI],
    ['left',d,-w/2,0,-Math.PI/2],['right',d,w/2,0,Math.PI/2]
   ]){
    const openings=facadePlan[face],trim=new THREE.Group();
    trim.position.set(px,0,pz);trim.rotation.y=angle;trim.name='lafet-courses-'+face;g.add(trim);
    // Exactly 290 mm crown pitch. Seams break at real apertures, not across glazing.
    for(let yy=.72;yy<bodyHeight-.16;yy+=.29){
     const occupied=openings.filter(o=>yy>o.bottom-.045&&yy<o.bottom+o.height+.045)
      .map(o=>[o.x-o.width/2-.045,o.x+o.width/2+.045]).sort((a,b)=>a[0]-b[0]);
     let at=-span/2+.13;
     for(const [lo,hi] of [...occupied,[span/2-.13,span/2-.13]]){
      if(lo>at+.12){
       box(trim,THREE,lo-at,.018,.035,(at+lo)/2,yy,.127,seam);
       box(trim,THREE,lo-at,.022,.014,(at+lo)/2,yy+.041,.118,timber);
      }
      at=Math.max(at,hi);
     }
    }
   }  }
  if(['barn','scandi','modern','classic','modular','panoramic','duplex','tiny'].includes(style))
   for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])
    box(g,THREE,.059,bodyHeight-.45,.059,x,bodyHeight/2+.22,z,darkTrim);
 }
 const greenhouseRoof=isGreenhouse?new THREE.MeshPhysicalMaterial({
  color:'#BDD3CB',metalness:0,roughness:.12,transparent:true,opacity:.64,transmission:.52,
  ior:1.49,thickness:.012,side:THREE.DoubleSide
 }):roofMaterial;
 const roofBuilding=isGreenhouse?{...b,roof:'gable'}:isCarport?{...b,roof:'flat'}:b;
 roofGeometry(g,THREE,roofBuilding,w,d,0,bodyHeight,greenhouseRoof,preset.roofFinish);
 if(style==='scandi'&&(!b.type||b.type==='house')&&(b.roof||preset.roof)==='gable'){
  // The original roof stays untouched. Technical flashings and timber
  // gable siding follow its existing ridge, slopes and measured overhangs.
  const overhang=scandiRoofOverhang(w,d);
  const rise=Math.max(.5,Math.min(4,Number(b.roofRise)||Math.min(w,d)*.22));
  addScandiGableCladding(THREE,g,{width:w,depth:d,bodyHeight,rise,overhang});
  addScandiRoofEdgeDetails(THREE,g,{width:w,depth:d,bodyHeight,rise,overhang});
  addScandiCornerDetails(THREE,g,{width:w,depth:d,bodyHeight});
  addScandiRoofSnowGuards(THREE,g,{width:w,depth:d,bodyHeight,rise,overhang});
  addScandiTerrace(THREE,g,{width:w,depth:d,
   door:g.userData.facadeSchedule?.front?.find(o=>o.kind==='door')});
  g.userData.scandiEnvelope={facadeMaterials:['vertical-weathered-silver-grey-timber','vertical-smoked-graphite-grey-timber'],
   roofGableWindBoard:true,vergeMetalFlashing:true};
 }
 if(!isGazebo&&!isCarport&&!isGreenhouse&&style!=='aframe'){
  addFacadeFinish(g,THREE,{width:w,depth:d,height:bodyHeight,roof:b.roof||preset.roof,style});
  addEntranceDetails(g,THREE,{style,width:w,depth:d,frontOpenings:g.userData.facadeSchedule?.front||[]});
 }
 if(isBath){
  // Sauna-specific porch and metal flue; these remain attached to the bath,
  // not additional user-authored project objects.
  const deckMat=mat(THREE,'#80654A',.80,.02,texture(THREE,'walnut','#80654A'));
  const railMat=mat(THREE,'#494D4B',.56,.22);
  const front=d/2+.46,porchW=Math.min(2.8,w*.52);
  box(g,THREE,porchW,.16,.92,0,.31,front,deckMat);
  for(const side of [-1,1]){
   box(g,THREE,.065,.72,.065,side*porchW*.48,.74,front+.40,railMat);
   box(g,THREE,.06,.07,.90,side*porchW*.48,1.09,front,railMat);
  }
  const rise=(b.roof||preset.roof)==='flat'?.18:Math.max(.5,Math.min(4,Number(b.roofRise)||Math.min(w,d)*.22));
  const flue=mat(THREE,'#454D4C',.39,.68);
  const flueHeight=Math.max(.7,rise*.75),flueCenter=bodyHeight+rise*.75;
  const chimney=add(g,THREE,new THREE.CylinderGeometry(.115,.115,flueHeight,14),flue,w*.25,flueCenter,0);
  chimney.castShadow=true;
  const cap=add(g,THREE,new THREE.CylinderGeometry(.18,.18,.04,14),railMat,w*.25,flueCenter+flueHeight*.5+.025,0);
  cap.castShadow=true;
 }
 if(!isGarage&&!isGazebo&&!isCarport&&!isGreenhouse)
  addPresetVolumes(g,THREE,{style,w,d,bodyHeight});
 const trimOverhang=style==='scandi'?scandiRoofOverhang(w,d):
  style==='chalet'?Math.min(1.2,Math.min(w,d)*.16):
  style==='cottage'?Math.min(.75,Math.min(w,d)*.09):
  Math.min(.42,Math.max(.22,Math.min(w,d)*.055));
 const roofType=roofBuilding.roof||preset.roof;
 const garlandRise=style==='aframe'?Math.max(4.2,Math.min(8,Number(b.roofRise)||w*.74)):
  Math.max(.5,Math.min(4,Number(b.roofRise)||Math.min(w,d)*.22));
 const garland=addRoofGarland(THREE,b,{width:w,depth:d,eave:bodyHeight,
  style,roof:roofType,rise:garlandRise,overhang:trimOverhang,night});
 if(garland)g.add(garland);
 g.userData.archStyle=style;g.userData.footprint={width:w,height:d};g.userData.textures=ownedHouseTextures;
 return g;
}

/* The four new presets carry distinct built silhouettes rather than recolouring
   one rectangular mass. Measured footprint (w × d) remains authoritative. */
function addPresetVolumes(g,T,{style,w,d,bodyHeight:y}){
 const m=(color,roughness=.78)=>new T.MeshStandardMaterial({color,roughness,metalness:.05});
 const wood=m('#6B4D39'),dark=m('#272F31'),stucco=m('#E5DCD0'),glass=m('#304A55',.19),steel=m('#606E70',.4);
 if(style==='chalet'){
  // A real ground-supported porch: old mock placed its floor 2.6 metres
  // above ground, leaving a physically floating deck and false railing.
  const span=Math.max(2,Math.min(w*.82,w-.6)),z=d/2+.48;
  box(g,T,span,.15,1.05,0,.52,z,wood);
  box(g,T,span*.45,.10,.36,0,.30,d/2+1.20,wood);
  for(const x of [-span*.45,span*.45]){
   box(g,T,.15,2.83,.15,x,2.03,z+.36,wood);
   box(g,T,.11,.26,.11,x,.71,z+.36,dark);
  }
  box(g,T,span+.14,.13,1.35,0,3.54,z+.17,dark);
  const rail=m('#72543C');
  for(let x=-span*.40;x<=span*.40;x+=Math.max(.35,span*.17)){
   if(Math.abs(x)<.75)continue; // opening and steps stay clear
   box(g,T,.065,.83,.065,x,1.08,z+.46,rail);
  }
  for(const x of [-span*.38,span*.38])
   box(g,T,.12,.08,1.0,x,1.52,z,rail);
 }
 if(style==='cottage'){
  const beam=m('#514439'),z=d/2+.115;
  // Joinery occupies solid piers and upper facade, never crosses the real
  // window and entrance apertures cut into the underlying walls.
  for(const x of [-w*.45,w*.45])
   box(g,T,.105,y-.56,.10,x,y/2+.22,z,beam);
  for(const yy of [3.04,y-.18])
   if(yy<y-.05)box(g,T,w-.12,.105,.09,0,yy,z,beam);
  for(const x of [-w*.32,w*.32])
   edgeBeam(g,T,[x-.27,3.12,z+.04],[x+.25,Math.max(3.35,y-.28),z+.04],.078,beam);
  for(const x of [-w*.40,w*.40])box(g,T,.20,.24,.42,x,y+.07,d/2+.13,beam);
 }
 if(style==='mediterranean'){
  const n=3;
  // Shaded entrance colonnade with distinct projecting terracotta cornice.
  box(g,T,w*.72,.19,1.08,0,2.88,d/2+.60,stucco);
  for(let i=0;i<n;i++){
   const x=(i-(n-1)/2)*w*.30;
   const column=new T.Mesh(new T.CylinderGeometry(.105,.14,2.18,14),stucco);
   column.position.set(x,1.80,d/2+1.07);column.castShadow=true;g.add(column);
   box(g,T,.35,.15,.34,x,2.92,d/2+1.07,stucco);
   box(g,T,.33,.13,.32,x,.69,d/2+1.07,stucco);
  }
  const terracotta=m('#B76E4B');for(const x of [-w*.43,w*.43])
   box(g,T,.12,.22,d+.35,x,y+.02,0,terracotta);
 }
 if(style==='hightech'){
  // Clearly cantilevered horizontal plate, external aluminum mullions and
  // dark glazed ribbon: visually different from flat-roof modern preset.
  box(g,T,w*.83,.25,d*.88,-w*.07,y+.17,0,stucco);
  box(g,T,w*.69,.19,.71,-w*.08,y*.79,d/2+.37,stucco);
  // The ribbon windows are now genuine apertures in addMeasuredFacades,
  // not a glass rectangle pasted on a continuous concrete wall.
  for(let i=0;i<5;i++){
   const x=-w*.44+i*w*.17;
   box(g,T,.045,1.17,.075,x,2.58,d/2+.19,steel);
  }
  for(const x of [-w*.40,w*.40])
   box(g,T,.10,y*.62,.16,x,y*.37,d/2+.16,dark);
 }
 if(style==='modular'){
  const dark=m('#364144',.44),wood=m('#9B8365');
  // Three panel divisions in genuine metal, with externally proud end ribs.
  for(const x of [-w*.48,w*.48]){
   box(g,T,.085,y-.52,.065,x,y/2+.23,d/2+.13,dark);
   box(g,T,.085,y-.52,.065,x,y/2+.23,-d/2-.13,dark);
  }
  for(const z of [-d*.45,d*.45]){
   box(g,T,.065,y-.52,.085,w/2+.13,y/2+.23,z,dark);
   box(g,T,.065,y-.52,.085,-w/2-.13,y/2+.23,z,dark);
  }
  box(g,T,w-.20,.08,.14,0,y-.16,d/2+.12,wood);
  for(const x of [-w*.40,w*.40])box(g,T,.11,.23,.48,x,.52,d/2+.25,dark);
 }
 if(style==='bungalow'){
  const decking=m('#9E7B58'),frame=m('#665542',.75);
  // Covered low veranda with actual vertical bearing posts.
  const width=Math.max(2,Math.min(w-.5,w*.83));
  const z=d/2+.67;
  box(g,T,width,.17,1.3,0,.52,z,decking);
  for(const x of [-width*.45,width*.45]){
   box(g,T,.14,2.23,.14,x,1.70,z+.52,frame);
   box(g,T,.29,.10,.29,x,.60,z+.52,frame);
  }
  box(g,T,width+.20,.15,1.55,0,2.91,z+.20,frame);
  // Safe, discrete entrance step; not an invented second balcony.
  box(g,T,Math.min(2.0,width*.5),.13,.42,0,.30,d/2+1.46,decking);
 }
 if(style==='duplex'){
  const band=m('#D1CABD'),rail=m('#444B4F',.50);
  // Story line must follow the actual 5.9m two-storey envelope.
  box(g,T,w+.07,.12,d+.08,0,3.08,0,band);
  for(const x of [-w*.28,w*.28]){
   box(g,T,Math.min(w*.20,1.6),.13,.64,x,2.79,d/2+.37,band);
   for(const side of [-1,1])
    box(g,T,.055,.28,.065,x+side*.55,2.69,d/2+.47,rail);
  }
  for(const x of [-w*.41,w*.41])
   box(g,T,.07,Math.max(1,y-3.1),.08,x,(y+3.08)/2,d/2+.11,rail);
 }
 if(style==='panoramic'){
  const teak=m('#907457'),struct=m('#333D40',.48);
  // Structural portal and exterior deck frame the real panorama opening.
  box(g,T,w*.86,.13,1.22,0,.53,d/2+.64,teak);
  for(const x of [-w*.46,w*.46]){
   box(g,T,.095,y-.40,.14,x,y/2+.25,d/2+.14,struct);
   box(g,T,.15,.12,1.21,x,y-.18,d/2+.53,struct);
  }
  box(g,T,w*.88,.14,1.25,0,y-.12,d/2+.62,struct);
  for(let i=0;i<5;i++){
   const x=-w*.44+i*w*.22;
   box(g,T,.034,.62,.045,x,y-.47,d/2+1.17,teak);
  }
 }
 if(style==='tiny'){
  const decking=m('#A78C68'),steel=m('#4B5559',.49);
  // Compact entry, step and one correctly scaled porch roof.
  const width=Math.min(w*.66,2.5);
  box(g,T,width,.13,.86,w*.22,.46,d/2+.51,decking);
  box(g,T,width*.64,.10,.36,w*.22,.25,d/2+1.08,decking);
  for(const x of [w*.22-width*.42,w*.22+width*.42]){
   box(g,T,.078,2.13,.078,x,1.70,d/2+.86,steel);
  }
  box(g,T,width+.14,.12,1.04,w*.22,2.79,d/2+.49,steel);
 }

}
