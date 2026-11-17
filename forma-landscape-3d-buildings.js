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
 {id:'aframe',name:'A-frame',subtitle:'Высокий треугольный силуэт',wall:'darkwood',roof:'gable',roofFinish:'standing',accent:'#69533F'}
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
  for(let i=2;i<512;i+=68){line(i,0,i,512,'#10191E',4);line(i+4,0,i+4,512,'rgba(192,204,208,.20)',2)}
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
 const frame=mat(T,'#181E20',.52,.5),glass=new T.MeshPhysicalMaterial({
  color:night?'#9EAB9B':'#24404C',metalness:.18,roughness:.14,transparent:true,opacity:.94,
  clearcoat:.85,clearcoatRoughness:.08,emissive:night?'#E3B77C':'#102630',emissiveIntensity:night?.38:.07
 });
 const w=Math.max(.45,width),h=Math.max(.6,height),edge=.084;
 box(g,T,w+edge*2,h+edge*2,.105,0,0,0,frame);
 box(g,T,w,h,.022,0,0,.075,glass);
 const mullion=panoramic?2:1;
 for(let i=1;i<=mullion;i++)box(g,T,.036,h,.12,(i/(mullion+1)-.5)*w,0,.095,frame);
 box(g,T,w,.033,.12,0,.012,.093,frame);
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
 const roof=b.roof||housePreset(b.archStyle).roof,overhang=Math.min(.42,Math.max(.22,Math.min(w,d)*.055));
 const dark=mat(T,'#22282B',.75,.38),gable=roof==='gable',hip=roof==='hip';
 const rise=Math.max(.5,Math.min(4,Number(b.roofRise)||Math.min(w,d)*(b.archStyle==='aframe'?.74:.22)));
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
 const bodyHeight=style==='aframe'?3.25:(isGarage?2.9:isGazebo?2.9:['barn','classic','timber','brick'].includes(style)?4.3:3.5);
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
 const roofMaterial=mat(THREE,b.roofColor||'#F1F1F1',preset.roofFinish==='standing'?.36:.69,.42,roofTex);
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
  if(['barn','scandi','modern','classic'].includes(style)){
   for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])
    box(g,THREE,.065,bodyHeight-.46,.065,x,bodyHeight/2+.2,z,darkTrim);
  }
 }
 roofGeometry(g,THREE,b,w,d,0,bodyHeight,roofMaterial,preset.roofFinish);
 g.userData.archStyle=style;g.userData.footprint={width:w,height:d};
 return g;
}
