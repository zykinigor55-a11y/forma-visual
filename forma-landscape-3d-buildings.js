/* FORMA architectural houses: metrically correct footprints, distinct facade
 * systems and real roof planes. These are editable, procedural Three.js models.
 * Presets do not infer unknown details from a user's architectural photograph. */
import {buildingHeights,facadeOpeningSchedule,wallPatches} from './forma-landscape-3d-architecture-geometry.js';
export const HOUSE_PRESETS=Object.freeze([
 {id:'barn',name:'Барнхаус',subtitle:'Тёмный металл · дерево',wall:'darkwood',roof:'gable',roofFinish:'standing',accent:'#B8936E'},
 {id:'scandi',name:'Скандинавский',subtitle:'Светлый планкен · графит',wall:'lightwood',roof:'gable',roofFinish:'standing',accent:'#C1AD91'},
 {id:'timber',name:'Клеёный брус',subtitle:'Орех · строгая геометрия',wall:'walnut',roof:'gable',roofFinish:'tile',accent:'#7E5740'},
 {id:'brick',name:'Кирпичный дом',subtitle:'Баварский кирпич · металл',wall:'brick',roof:'hip',roofFinish:'tile',accent:'#996B5A'},
 {id:'modern',name:'Современный',subtitle:'Штукатурка · панорамное стекло',wall:'plaster',roof:'flat',roofFinish:'flat',accent:'#D5CEBF'},
 {id:'japandi',name:'Japandi',subtitle:'Штукатурка · тёплый кедр',wall:'cedar',roof:'flat',roofFinish:'flat',accent:'#BDA78B'},
 {id:'classic',name:'Классический',subtitle:'Светлый фасад · вальмовая кровля',wall:'stone',roof:'hip',roofFinish:'tile',accent:'#D5D0C7'},
 {id:'aframe',name:'A-frame',subtitle:'Высокий треугольный силуэт',wall:'darkwood',roof:'gable',roofFinish:'standing',accent:'#69533F'},
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
function windowGroup(T,width,height,night=false,panoramic=false){
 const g=new T.Group();
 const frame=mat(T,'#181E20',.52,.5),recess=mat(T,'#121A1C',.91,.02),glass=new T.MeshPhysicalMaterial({
  // Photographic architectural glazing reflects its environment rather than glowing cyan.
  color:night?'#AAB9B1':'#6C888B',metalness:0,roughness:.19,transparent:true,opacity:.88,
  ior:1.46,clearcoat:.48,clearcoatRoughness:.16,side:T.FrontSide,depthWrite:true,
  emissive:night?'#E6BD8D':'#000000',emissiveIntensity:night?.23:0
 });
 const w=Math.max(.45,width),h=Math.max(.6,height),edge=.084;
 // Dark recessed opening masks the solid procedural wall behind the pane.
 // Explicit border profiles create the reveal without an unrealistic opaque frame slab.
 box(g,T,w,h,.035,0,0,.035,recess);
 box(g,T,w,h,.022,0,0,.095,glass);
 for(const side of [-1,1])box(g,T,edge,h+edge*2,.16,side*(w+edge)/2,0,.065,frame);
 for(const side of [-1,1])box(g,T,w+edge*2,edge,.16,0,side*(h+edge)/2,.065,frame);
 const mullion=panoramic?2:1;
 for(let i=1;i<=mullion;i++)box(g,T,.036,h,.12,(i/(mullion+1)-.5)*w,0,.105,frame);
 box(g,T,w,.033,.12,0,.012,.105,frame);
 box(g,T,w+.26,.065,.26,0,-h/2-.14,.045,mat(T,'#414747',.68,.26));
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
 if(modern){box(g,T,width*.25,height*.86,.04,-width*.25,0,.12,mat(T,'#20383F',.13,.24))}
 box(g,T,.025,.31,.035,width*.33,-.04,.099,mat(T,'#D0C6AF',.3,.65));
 box(g,T,width+.22,.042,.26,0,-height/2-.085,.095,dark)
  .userData.architecturePart='door-threshold';
 return g;
}
/* A continuous solid cube under fake windows is architecturally wrong.
 * The wall envelope below consists only of closed wall segments *outside*
 * measured door and window apertures. Door/window meshes occupy the void.
 */
function addMeasuredFacades(g,T,{width:w,depth:d,height:h,style,type,material,night}){
 const plan=facadeOpeningSchedule({width:w,depth:d,height:h,style,type});
 const walls=[
  ['front',w,0,d/2,0],['rear',w,0,-d/2,Math.PI],
  ['left',d,-w/2,0,-Math.PI/2],['right',d,w/2,0,Math.PI/2]
 ];
 const interior=mat(T,'#1C2223',.94,.02);
 for(const [name,span,px,pz,angle] of walls){
  const facade=new T.Group();
  facade.name='facade-'+name;
  facade.position.set(px,0,pz);facade.rotation.y=angle;g.add(facade);
  const openings=plan[name];
  const patches=wallPatches(span,.48,h-.09,openings);
  const shellThickness=.19;
  for(const patch of patches){
   const segment=box(facade,T,patch.width,patch.height,shellThickness,
    patch.x,patch.y,0,material);
   segment.userData.architecturePart='solid-wall';
   segment.userData.facade=name;
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
     ['modern','hightech','japandi','panoramic','modular'].includes(style));
   }else{
    part=windowGroup(T,opening.width,opening.height,night,opening.panoramic);
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
   if(opening.kind==='window'){
    // Genuine 190mm deep jamb and head/sill returns, not black trim
    // painted over the facade. Four surfaces bridge the wall to the sash.
    const reveal=mat(T,['barn','modern','hightech','panoramic'].includes(style)?
     '#343E42':'#A69C8D',.88,.025);
    const revealDepth=.25,cy=opening.bottom+opening.height/2;
    for(const edge of [-1,1])
     box(facade,T,.042,opening.height,revealDepth,
      opening.x+edge*(opening.width/2-.021),cy,-.028,reveal);
    for(const edge of [-1,1])
     box(facade,T,opening.width,.042,revealDepth,
      opening.x,cy+edge*(opening.height/2-.021),-.028,reveal);
    const outerTrim=mat(T,'#333C3E',.56,.25);
    for(const edge of [-1,1])
     box(facade,T,.031,opening.height+.11,.029,
      opening.x+edge*(opening.width/2+.018),cy,.108,outerTrim);
    // Sill and lintel stop at the sides of this exact aperture.
    const modern=['modern','hightech','panoramic','modular','barn'].includes(style);
    const trim=mat(T,modern?'#414A4D':'#A8A49A',modern?.51:.90,modern?.3:.025);
    box(facade,T,opening.width+.21,.065,.31,opening.x,opening.bottom-.06,.14,trim);
    box(facade,T,opening.width+.19,.048,.24,opening.x,opening.bottom+opening.height+.048,.09,trim);
    // Substantial jamb shadow and external sill-drip; the opening remains void.
    const shadow=mat(T,'#182326',.92,.02);
    for(const edge of [-1,1])
     box(facade,T,.018,opening.height-.08,.17,
      opening.x+edge*(opening.width/2-.058),cy,-.067,shadow)
      .userData.architecturePart='window-jamb-shadow';
    box(facade,T,opening.width-.09,.019,.13,opening.x,
     opening.bottom+opening.height-.028,-.045,shadow)
     .userData.architecturePart='window-head-reveal';
    box(facade,T,opening.width+.24,.024,.035,opening.x,
     opening.bottom-.099,.31,trim)
     .userData.architecturePart='window-drip';
    box(facade,T,opening.width+.09,.018,.025,opening.x,
     opening.bottom+.021,-.015,shadow)
     .userData.architecturePart='window-sill-seal';
   }
   // Dark interior return on the opening's inner edge; no solid wall beneath.
   for(const edge of [-1,1])box(facade,T,.055,opening.height,.13,
    opening.x+edge*(opening.width/2+.023),opening.bottom+opening.height/2,-.022,interior);
  }
 }
 return plan;
}

function roofPlane(g,T,slopeLength,depth,x,y,angle,roofMat){
 // Full 240mm roof cassette. The visible edge has the mass of a real roof.
 const roof=add(g,T,new T.BoxGeometry(slopeLength,.24,depth),roofMat,x,y,0);
 roof.userData.roofThickness=.24;
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
 const roof=b.roof||housePreset(b.archStyle).roof,overhang=b.archStyle==='chalet'?Math.min(1.2,Math.min(w,d)*.16):
 b.archStyle==='cottage'?Math.min(.75,Math.min(w,d)*.09):Math.min(.42,Math.max(.22,Math.min(w,d)*.055));
 const dark=mat(T,'#22282B',.75,.38),soffit=mat(T,'#555A59',.82,.06),gable=roof==='gable',hip=roof==='hip';
 const rise=b.archStyle==='aframe'?Math.max(4.2,Math.min(8,Number(b.roofRise)||0,w*.74)):Math.max(.5,Math.min(4,Number(b.roofRise)||Math.min(w,d)*.22));
 if(roof==='flat'){
  box(g,T,w+overhang*2,.19,d+overhang*2,0,bodyHeight+.16,0,roofMaterial);
  const lip=mat(T,'#32393A',.8,.15);
  for(const x of [-1,1])box(g,T,.17,.38,d+overhang*2,x*(w/2+overhang-.08),bodyHeight+.41,0,lip);
  for(const z of [-1,1])box(g,T,w+overhang*2,.38,.17,0,bodyHeight+.41,z*(d/2+overhang-.08),lip);
  return;
 }
 const half=(w+overhang*2)/2,depth=d+overhang*2,run=Math.hypot(half,rise),angle=Math.atan2(rise,half);
 if(gable){
  roofPlane(g,T,run,depth,-half/2,bodyHeight+rise/2+.07,angle,roofMaterial);
  roofPlane(g,T,run,depth,half/2,bodyHeight+rise/2+.07,-angle,roofMaterial);
  // Low underside soffits remain aligned with the sloped roof surfaces.
  for(const side of [-1,1]){
   const panel=add(g,T,new T.BoxGeometry(run,.025,depth-.07),soffit,
    side*half/2,bodyHeight+rise/2-.061,0);
   panel.rotation.z=side<0?angle:-angle;
   panel.userData.architecturePart='roof-soffit';
  }
  if(roofFinish==='standing'){
   // True standing-seam ribs run down the slope; they catch light separately
   // from the painted roof texture and retain the same measured roof planes.
   const rib=mat(T,'#4F5B5C',.43,.62);
   for(let z=-depth/2+.27;z<depth/2;z+=.58){
    for(const side of [-1,1]){
     const bar=box(g,T,run,.025,.03,side*half/2,bodyHeight+rise/2+.208,z,rib);
     bar.rotation.z=side<0?angle:-angle;
    }
   }
  }
  const fascia=mat(T,'#30393D',.62,.36);
  for(const x of [-half,half]){
   for(const z of [-depth/2-.052,depth/2+.052])
    edgeBeam(g,T,[x,bodyHeight+.07,z],
     [0,bodyHeight+rise+.07,z],.21,fascia);
   // The edge fascia/soffit overlaps the 240mm roof sandwich visually.
   box(g,T,.24,.15,depth+.07,x>0?half-.12:-half+.12,bodyHeight-.025,0,soffit);
   const gutter=add(g,T,new T.CylinderGeometry(.085,.085,depth-.11,14),dark,
    x+(x>0?.073:-.073),bodyHeight+.04,0);
   gutter.rotation.x=Math.PI/2;gutter.userData.architecturePart='gutter';
  }
  edgeBeam(g,T,[0,bodyHeight+rise+.07,-depth/2-.06],
   [0,bodyHeight+rise+.07,depth/2+.06],.16,fascia);
  // Vertical gable-end triangle remains visible beneath the true roof.
  const wallColor=mat(T,b.archStyle==='scandi'?'#D0C1AA':b.archStyle==='classic'?'#D9D4C7':'#403B35');
  const faces=new Float32Array([-w/2,bodyHeight,d/2, w/2,bodyHeight,d/2,0,bodyHeight+rise*.94,d/2,
                                 -w/2,bodyHeight,-d/2,0,bodyHeight+rise*.94,-d/2,w/2,bodyHeight,-d/2]);
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(faces,3));geo.computeVertexNormals();
  const fill=add(g,T,geo,wallColor);fill.material.side=T.DoubleSide;
 }else if(hip){
  const startZ=Math.max(.25,d/2-half*.56),top=bodyHeight+rise+.07;
  const planes=[
   [[-half,bodyHeight,-depth/2],[0,top,-startZ],[0,top,startZ],[-half,bodyHeight,depth/2]],
   [[half,bodyHeight,depth/2],[0,top,startZ],[0,top,-startZ],[half,bodyHeight,-depth/2]],
   [[-half,bodyHeight,-depth/2],[half,bodyHeight,-depth/2],[0,top,-startZ]],
   [[half,bodyHeight,depth/2],[-half,bodyHeight,depth/2],[0,top,startZ]]
  ];
  for(const p of planes)thickHipRoofFace(g,T,p,roofMaterial,.20);
  edgeBeam(g,T,[0,top,-startZ],[0,top,startZ],.10,dark);
  // Actual hip-edge flashings, not lines painted onto the texture.
  for(const x of [-half,half])for(const z of [-depth/2,depth/2])
   edgeBeam(g,T,[x,bodyHeight+.04,z],[0,top,z<0?-startZ:startZ],.055,dark);
  for(const x of [-half,half]){
   box(g,T,.20,.18,depth,x,bodyHeight+.028,0,dark);
   const gutter=add(g,T,new T.CylinderGeometry(.083,.083,depth-.12,12),dark,
    x+(x<0?-.07:.07),bodyHeight+.028,0);
   gutter.rotation.x=Math.PI/2;gutter.userData.architecturePart='gutter';
  }
  for(const z of [-depth/2,depth/2])
   box(g,T,w+overhang*2,.19,.19,0,bodyHeight+.028,z,dark);
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
 const plans=entranceDetailPlan(style,frontOpenings,width,depth);
 const timber=mat(T,'#876C50',.85,.02),masonry=mat(T,'#999991',.94,.015),joint=mat(T,'#414644',.80,.04);
 for(const step of plans){
  const finish=step.finish==='timber'?timber:masonry;
  box(g,T,step.stepWidth,.12,.42,step.x,.43,step.front+.23,finish);
  box(g,T,step.stepWidth+.28,.11,.54,step.x,.175,step.front+.68,finish);
  box(g,T,step.stepWidth-.16,.022,.014,step.x,.105,step.front+.955,joint);
 }
}
/* Independent metal rainwater system and layered plinth details. These
 * decorative parts never modify measured house/sauna footprint or parcel size. */
function addFacadeFinish(g,T,{width,depth,height,roof,style}){
 const w=width,d=depth,y=height;
 const metal=mat(T,'#394548',.46,.62),stone=mat(T,'#565B59',.93,.05);
 // A low exposed masonry plinth stops large walls reading as floating boxes.
 for(const z of [-1,1])box(g,T,w,.18,.06,0,.49,z*(d*.5+.034),stone);
 for(const x of [-1,1])box(g,T,.06,.18,d,x*(w*.5+.034),.49,0,stone);
 // Gutters and wall-mounted downpipes are actual geometry, with connecting
 // offsets from the eave trough to the downpipe on the front facade.
 const isFlat=roof==='flat',pitchOverhang=
  style==='chalet'?Math.min(1.2,Math.min(w,d)*.16):
  style==='cottage'?Math.min(.75,Math.min(w,d)*.09):
  Math.min(.42,Math.max(.22,Math.min(w,d)*.055));
 const gutterY=isFlat?y+.18:y+.04;
 for(const side of [-1,1]){
  const x=side*(w*.5-.13),z=d*.5+.165;
  const tubeRadius=.055,pipeLength=Math.max(.35,gutterY-.64);
  const down=add(g,T,new T.CylinderGeometry(tubeRadius,tubeRadius,pipeLength,14),
   metal,x,(gutterY+.64)*.5,z);
  down.userData.architecturePart='downpipe';
  const shoe=add(g,T,new T.CylinderGeometry(.06,.055,.23,14),
   metal,x,.68,z+.12);
  shoe.rotation.x=Math.PI/2;shoe.userData.architecturePart='downpipe-shoe';
  for(let yy=1.12;yy<gutterY-.25;yy+=.93)
   box(g,T,.135,.05,.095,x,yy,z-.040,metal)
    .userData.architecturePart='downpipe-clamp';
  if(!isFlat){
   const outletX=side*(w*.5+pitchOverhang+.07);
   const outletZ=d*.5+pitchOverhang-.12;
   edgeBeam(g,T,[outletX,gutterY,outletZ],
    [x,gutterY-.23,z],.105,metal).userData.architecturePart='gutter-elbow';
   const hopper=box(g,T,.16,.17,.14,x,gutterY-.14,z,metal);
   hopper.userData.architecturePart='gutter-outlet';
  }
 }
 if(isFlat){
  for(const x of [-w*.32,w*.32])
   box(g,T,.18,.10,.18,x,y+.32,d*.5+.10,metal)
    .userData.architecturePart='flat-roof-scupper';
 }else if(roof==='hip'){
  const edgeColor=mat(T,'#454D50',.52,.46);
  for(const z of [-1,1])
   box(g,T,w+.16,.12,.14,0,gutterY,z*(d*.5+.025),edgeColor)
    .userData.architecturePart='hip-roof-fascia';
 }
}
export function createArchitecturalBuilding(THREE,building,{night=false}={}){
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
 // Source-authored canvas relief: subtle fiber and mortar variation in grazing light,
 // avoiding uniformly flat procedural facades without altering footprint geometry.
 wallMaterial.bumpMap=wallTex;
 wallMaterial.bumpScale=preset.wall==='brick'?.018:preset.wall==='stone'?.012:preset.wall==='plaster'?.004:.008;
 const roofColor=new THREE.Color(b.roofColor||'#394348');
 roofColor.lerp(new THREE.Color('#FAFAFA'),.12); // Keep user-selected dark roof appearance.
 const roofMaterial=mat(THREE,roofColor,preset.roofFinish==='standing'?.36:.69,
  preset.roofFinish==='standing'?.76:preset.roofFinish==='tile'?.05:.14,roofTex);
 roofMaterial.bumpMap=roofTex;roofMaterial.bumpScale=preset.roofFinish==='tile'?.012:.003;
 wallTex.repeat.set(Math.max(1,w/3.6),Math.max(1,bodyHeight/2.2));
 roofTex.repeat.set(Math.max(1,w/2.8),Math.max(1,d/3.4));
 // Exact footprint is represented by the house body. Decorative overhang is not
 // included in measured area, and never shifts parcel coordinates.
 const foundation=mat(THREE,'#373B3C',.92,.05,texture(THREE,'stone','#777D80'));
 box(g,THREE,w,.48,d,0,.24,0,foundation);
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
   type:b.type,material:wallMaterial,night});
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
 g.userData.archStyle=style;g.userData.footprint={width:w,height:d};g.userData.textures=[wallTex,roofTex];
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
