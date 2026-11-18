/* FORMA architectural houses: metrically correct footprints, distinct facade
 * systems and real roof planes. These are editable, procedural Three.js models.
 * Presets do not infer unknown details from a user's architectural photograph. */
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
 {id:'hightech',name:'Хай-тек',subtitle:'Консоль · бетон · витраж',wall:'plaster',roof:'flat',roofFinish:'flat',accent:'#A9B6B1'}
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
  color:night?'#9EAB9B':'#24404C',metalness:.18,roughness:.14,transparent:true,opacity:.94,
  clearcoat:.85,clearcoatRoughness:.08,side:T.FrontSide,depthWrite:true,emissive:night?'#E3B77C':'#102630',emissiveIntensity:night?.38:.07
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
 return g;
}
function doorGroup(T,width=1.04,height=2.16,modern=false){
 const g=new T.Group();
 const dark=mat(T,'#242D30',.45,.44),panel=mat(T,modern?'#23343A':'#574437',.6,.16);
 box(g,T,width+.14,height+.12,.1,0,0,0,dark);
 box(g,T,width,height,.07,0,0,.066,panel);
 if(modern){box(g,T,width*.25,height*.86,.04,-width*.25,0,.12,mat(T,'#20383F',.13,.24))}
 box(g,T,.025,.31,.035,width*.33,-.04,.118,mat(T,'#D0C6AF',.3,.65));
 return g;
}
function roofPlane(g,T,slopeLength,depth,x,y,angle,roofMat){
 const geo=new T.PlaneGeometry(slopeLength,depth);
 geo.rotateX(-Math.PI/2);
 const roof=add(g,T,geo,roofMat,x,y,0);
 roof.rotation.z=angle;
 roof.material.side=T.DoubleSide;
 return roof;
}
function edgeBeam(g,T,a,b,thickness,material){
 const p=new T.Vector3(...a),q=new T.Vector3(...b),d=q.clone().sub(p),m=new T.Vector3().addVectors(p,q).multiplyScalar(.5);
 const item=add(g,T,new T.BoxGeometry(thickness,thickness,d.length()),material,m.x,m.y,m.z);
 item.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),d.normalize());return item;
}
function roofGeometry(g,T,b,w,d,eave,bodyHeight,roofMaterial,roofFinish){
 const roof=b.roof||housePreset(b.archStyle).roof,overhang=b.archStyle==='chalet'?Math.min(1.2,Math.min(w,d)*.16):
 b.archStyle==='cottage'?Math.min(.75,Math.min(w,d)*.09):Math.min(.42,Math.max(.22,Math.min(w,d)*.055));
 const dark=mat(T,'#22282B',.75,.38),gable=roof==='gable',hip=roof==='hip';
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
  if(roofFinish==='standing'){
   // True standing-seam ribs run down the slope; they catch light separately
   // from the painted roof texture and retain the same measured roof planes.
   const rib=mat(T,'#4F5B5C',.43,.62);
   for(let z=-depth/2+.27;z<depth/2;z+=.58){
    for(const side of [-1,1]){
     const bar=box(g,T,run,.018,.028,side*half/2,bodyHeight+rise/2+.087,z,rib);
     bar.rotation.z=side<0?angle:-angle;
    }
   }
  }
  for(const x of [-half,half])edgeBeam(g,T,[x,bodyHeight+.08,-depth/2],[0,bodyHeight+rise+.08,-depth/2],.065,dark);
  edgeBeam(g,T,[0,bodyHeight+rise+.08,-depth/2],[0,bodyHeight+rise+.08,depth/2],.10,dark);
  for(const x of [-half,half]){
   const gutter=add(g,T,new T.CylinderGeometry(.057,.057,depth,10),dark,x,bodyHeight+.07,0);
   gutter.rotation.x=Math.PI/2;
  }
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
  for(const p of planes){
   const xyz=p.length===4?[...p[0],...p[1],...p[2],...p[0],...p[2],...p[3]]:[...p[0],...p[1],...p[2]];
   const uv=p.length===4?[0,0,0,1,1,1,0,0,1,1,1,0]:[0,0,1,0,.5,1];
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(xyz,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
   geo.computeVertexNormals();const mesh=add(g,T,geo,roofMaterial);
   mesh.material.side=T.DoubleSide;
  }
  edgeBeam(g,T,[0,top,-startZ],[0,top,startZ],.10,dark);
 }
}
export function createArchitecturalBuilding(THREE,building,{night=false}={}){
 const b=building||{},preset=housePreset(b.archStyle),style=b.archStyle||preset.id;
 const w=Math.max(2,Number(b.width)||8),d=Math.max(2,Number(b.height)||7);
 const g=new THREE.Group();g.name='architecture-'+style;
 const isGarage=b.type==='garage',isGazebo=b.type==='gazebo',isBath=b.type==='bath';
 const bodyHeight=style==='aframe'?.65:(isGarage?2.9:isGazebo?2.9:['barn','classic','timber','brick','chalet','cottage','mediterranean'].includes(style)?4.3:3.5);
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
 roofColor.lerp(new THREE.Color('#FAFAFA'),.69);
 const roofMaterial=mat(THREE,roofColor,preset.roofFinish==='standing'?.36:.69,.42,roofTex);
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
 }else{
  box(g,THREE,w,bodyHeight-.48,d,0,.48+(bodyHeight-.48)/2,0,wallMaterial);
  const darkTrim=mat(THREE,'#262B2D',.52,.34);
  box(g,THREE,w,.10,d,0,.53,0,darkTrim);
  box(g,THREE,w,.13,d,0,bodyHeight-.045,0,darkTrim);
  const glassStyle=['modern','japandi','barn'].includes(style),winWidth=glassStyle?Math.min(2.15,w*.24):Math.min(1.22,w*.2);
  const winHeight=glassStyle?Math.min(2.5,bodyHeight-.9):Math.min(1.45,bodyHeight-1.5);
  const low=glassStyle?.7:1.3,centreY=low+winHeight/2;
  if(isGarage){
   const garage=mat(THREE,'#242B2F',.7,.32);
   box(g,THREE,Math.min(w*.70,4.5),2.2,.14,0,1.55,d/2+.07,garage);
   for(let y=.6;y<2.65;y+=.4)box(g,THREE,Math.min(w*.70,4.5),.026,.15,0,y,d/2+.16,mat(THREE,'#5C6667',.5,.28));
  }else{
   const door=doorGroup(THREE,Math.min(1.15,w*.18),2.12,glassStyle);
   door.position.set(w*.28,1.64,d/2+.10);g.add(door);
   const count=w>=7?2:1;
   for(let i=0;i<count;i++){
    const x=count===1?-w*.24:-w*.30+i*w*.27;
    const item=windowGroup(THREE,winWidth,winHeight,night,glassStyle);
    item.position.set(x,centreY,d/2+.12);g.add(item);
   }
   const rear=windowGroup(THREE,Math.min(winWidth*1.12,w*.28),winHeight,night,glassStyle);
   rear.rotation.y=Math.PI;rear.position.set(-w*.10,centreY,-d/2-.12);g.add(rear);
   if(d>4){
    for(const direction of [-1,1]){
     const item=windowGroup(THREE,Math.min(1.4,d*.24),Math.min(1.42,winHeight),night,false);
     item.rotation.y=direction*Math.PI/2;
     item.position.set(direction*(w/2+.12),Math.max(1.5,centreY),-d*.08);g.add(item);
    }
   }
  }
  // Crisp, projecting corner trim gives real highlights and depth.
  if(style==='timber'){
   const seam=mat(THREE,'#3B2D29',.87,.02);
   for(let y=.72;y<bodyHeight-.12;y+=.32){
    box(g,THREE,w,.017,.025,0,y,d/2+.018,seam);
    box(g,THREE,w,.017,.025,0,y,-d/2-.018,seam);
   }
  }
  if(['barn','scandi','modern','classic'].includes(style)){
   for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])
    box(g,THREE,.065,bodyHeight-.46,.065,x,bodyHeight/2+.2,z,darkTrim);
  }
 }
 roofGeometry(g,THREE,b,w,d,0,bodyHeight,roofMaterial,preset.roofFinish);
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
  // Deep terrace on the south elevation and visible handrail / roof supports.
  box(g,T,Math.min(w*.82,w-1),.18,.92,0,2.61,d/2+.45,wood);
  for(let x=-w*.36;x<=w*.36;x+=Math.max(.34,w*.11))
   box(g,T,.065,.88,.065,x,3.07,d/2+.86,dark);
  box(g,T,w*.76,.08,.11,0,3.53,d/2+.86,wood);
  for(const x of [-w*.38,w*.38])
   box(g,T,.15,2.38,.15,x,1.33,d/2+.84,wood);
  // Horizontal timber slats make the building credible at near-ground eye level.
  for(let i=0;i<9;i++)box(g,T,w-.28,.016,.035,0,.95+i*.31,d/2+.09,m('#42352D'));
 }
 if(style==='cottage'){
  const beam=m('#514439'),z=d/2+.10;
  // Half-timber structural rhythm, diagonal braces and deep eave brackets.
  for(const x of [-w*.44,-w*.22,0,w*.22,w*.44])
   box(g,T,.105,Math.max(2.6,y-.65),.10,x,y/2+.3,z,beam);
  for(const yy of [1.28,2.83,y-.20])box(g,T,w-.12,.11,.09,0,yy,z,beam);
  for(const x of [-w*.32,w*.32]){
   edgeBeam(g,T,[x-.33,1.30,z+.04],[x+.31,2.77,z+.04],.095,beam);
  }
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
  box(g,T,w*.68,1.10,.055,-w*.10,2.56,d/2+.16,glass);
  for(let i=0;i<5;i++){
   const x=-w*.44+i*w*.17;
   box(g,T,.045,1.17,.075,x,2.58,d/2+.19,steel);
  }
  for(const x of [-w*.40,w*.40])
   box(g,T,.10,y*.62,.16,x,y*.37,d/2+.16,dark);
 }
}
