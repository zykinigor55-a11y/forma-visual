/* FORMA VISUAL — architectural roof-line garlands, metres.
 * The fixture is a decoration attached to existing roof fascia/soffit.
 * Default OFF. No house positions, footprint, windows or roof geometry change.
 */
export const ROOF_GARLAND_DEFAULTS=Object.freeze({
 enabled:false,type:'retro',temperature:'warm',brightness:65,placement:'front'
});
const clamp=(value,min,max,otherwise)=>Number.isFinite(Number(value))
 ?Math.max(min,Math.min(max,Math.round(Number(value)))):otherwise;
export function normalizeRoofGarland(raw){
 const g=raw&&typeof raw==='object'?raw:{};
 return {
  enabled:g.enabled===true,
  type:['retro','led','icicle'].includes(g.type)?g.type:'retro',
  temperature:['warm','cool'].includes(g.temperature)?g.temperature:'warm',
  brightness:clamp(g.brightness,0,100,65),
  placement:['front','perimeter'].includes(g.placement)?g.placement:'front'
 };
}
export function garlandLayout({width=8,depth=8,height=3,rise=2,overhang=.36,style='barn',roof='gable',placement='front'}={}){
 const w=Math.max(2,Number(width)||8),d=Math.max(2,Number(depth)||8);
 const over=Math.max(.1,Math.min(1.5,Number(overhang)||.36));
 const front=d*.5+over+.022,back=-front,half=w*.5+over+.006;
 const isA=style==='alpha'||style==='aframe';
 const eave=isA?style==='alpha'?.65:Number(height)||.65:Number(height)||3;
 const peak=isA?Math.max(4.2,Math.min(8,Number(rise)||w*.79)):
  Math.max(.5,Math.min(4,Number(rise)||w*.22));
 const paths=[];
 // Foremost sloping trim of A-frame/gable, following existing fascia.
 if(roof==='gable'||isA){
  paths.push([[-half,eave-.10,front],[0,eave+peak-.13,front],[half,eave-.10,front]]);
  if(placement==='perimeter'){
   paths.push([[-half,eave-.10,back],[0,eave+peak-.13,back],[half,eave-.10,back]]);
   paths.push([[-half,eave-.12,front],[-half,eave-.12,back]]);
   paths.push([[half,eave-.12,front],[half,eave-.12,back]]);
  }
 }else{
  const y=eave+(roof==='flat'?.43:-.10);
  paths.push([[-half,y,front],[half,y,front]]);
  if(placement==='perimeter'){
   paths.push([[-half,y,back],[half,y,back]]);
   paths.push([[-half,y,front],[-half,y,back]]);
   paths.push([[half,y,front],[half,y,back]]);
  }
 }
 return paths;
}
const distance=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
function sampledSegments(paths,spacing,cap){
 const samples=[],segments=[];
 for(const path of paths){
  for(let i=1;i<path.length;i++){
   const a=path[i-1],b=path[i],length=distance(a,b);
   const steps=Math.max(1,Math.round(length/spacing));
   segments.push([a,b]);
   for(let j=0;j<=steps;j++){
    if(samples.length>=cap)break;
    // avoid duplicating the corner fixture between adjacent slopes
    if(i>1&&j===0)continue;
    const t=j/steps;
    samples.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]);
   }
  }
 }
 return {samples,segments};
}
export function addRoofGarland(T,building,{width,depth,eave,roof='gable',style='barn',rise=2,overhang=.36,night=false}={}){
 const cfg=normalizeRoofGarland(building?.garland);
 if(!cfg.enabled)return null;
 const group=new T.Group();group.name='forma-roof-garland';
 group.userData.architecturePart='architectural-roof-string-lights';
 group.userData.garland={...cfg};
 const isLit=night&&cfg.brightness>0;
 const hue=cfg.temperature==='cool'?'#D7EEFF':'#FFD1A0';
 const pitch=cfg.type==='retro'?.63:cfg.type==='icicle'?.32:.24;
 const paths=garlandLayout({width,depth,height:eave,rise,overhang,roof,style,placement:cfg.placement});
 const {samples,segments}=sampledSegments(paths,pitch,340);
 if(!samples.length)return null;
 const wireMat=new T.LineBasicMaterial({color:0x343439});
 const wirePositions=[];
 for(const [a,b] of segments)wirePositions.push(...a,...b);
 const socketGeometry=new T.CylinderGeometry(cfg.type==='retro'?.028:.011,cfg.type==='retro'?.028:.011,
  cfg.type==='retro'?.065:.032,7);
 const socketMat=new T.MeshStandardMaterial({color:'#292B2A',metalness:.25,roughness:.65});
 const socket= new T.InstancedMesh(socketGeometry,socketMat,samples.length);
 const dummy=new T.Object3D();
 const maxDrop=cfg.type==='retro'?.15:.055;
 for(let i=0;i<samples.length;i++){
  const p=samples[i];dummy.position.set(p[0],p[1]-maxDrop*.4,p[2]);
  dummy.updateMatrix();socket.setMatrixAt(i,dummy.matrix);
  wirePositions.push(p[0],p[1],p[2],p[0],p[1]-maxDrop*.8,p[2]);
 }
 socket.instanceMatrix.needsUpdate=true;group.add(socket);
 const bulbs=[];
 if(cfg.type==='icicle'){
  // Individual short curtains suspended from the *existing* roof trim.
  // Staggered but deterministic: no animation needed to read as "дождик".
  samples.forEach((p,i)=>{
   const drop=.19+((i*7)%6)*.09,counts=2+((i*5)%3);
   wirePositions.push(p[0],p[1]-.04,p[2],p[0],p[1]-drop,p[2]);
   for(let j=1;j<=counts;j++)bulbs.push([p[0],p[1]-.04-drop*j/(counts+1),p[2]]);
  });
 }else samples.forEach(p=>bulbs.push([p[0],p[1]-maxDrop,p[2]]));
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(wirePositions,3));
 const cables=new T.LineSegments(geometry,wireMat);cables.name='garland-attached-cables';group.add(cables);
 const retro=cfg.type==='retro';
 const bulbRadius=retro?.058:cfg.type==='icicle'?.014:.023;
 const bulbGeo=retro?new T.SphereGeometry(bulbRadius,8,6):new T.IcosahedronGeometry(bulbRadius,0);
 const bulbMat=new T.MeshStandardMaterial({
  color:isLit?hue:'#B8AD96',metalness:0,roughness:retro?.23:.4,
  emissive:hue,emissiveIntensity:isLit?(.22+3.8*Math.pow(cfg.brightness/100,1.25)):0
 });
 const instances=new T.InstancedMesh(bulbGeo,bulbMat,bulbs.length);
 for(let i=0;i<bulbs.length;i++){
  dummy.position.set(...bulbs[i]);
  dummy.scale.set(1,retro?1.25:1,1);
  dummy.updateMatrix();instances.setMatrixAt(i,dummy.matrix);
 }
 instances.instanceMatrix.needsUpdate=true;
 instances.name='roof-garland-'+cfg.type+'-'+cfg.temperature;
 group.add(instances);
 // Only two tiny unshadowed light sources even when dozens of bulbs are rendered.
 // On phones this avoids dozens of dynamic punctual lights and GPU stalls.
 if(isLit&&typeof T.PointLight==='function'){
  const count=Math.min(2,paths.length);
  for(let i=0;i<count;i++){
   const span=paths[i],a=span[0],b=span[Math.floor(span.length/2)];
   const lamp=new T.PointLight(hue,.4+2.8*Math.pow(cfg.brightness/100,1.3),Math.min(5,Math.max(2,width*.35)),2);
   lamp.position.set((a[0]+b[0])*.5,(a[1]+b[1])*.5-.28,(a[2]+b[2])*.5);
   lamp.castShadow=false;lamp.userData.architecturePart='roof-trim-garland-light';group.add(lamp);
  }
 }
 return group;
}
export function roofGarlandPhotoContract(building){
 const g=normalizeRoofGarland(building?.garland);
 if(!g.enabled)return 'ROOF GARLAND: None. Do not add fairy lights or hanging strings to the roof.';
 return 'ARCHITECTURAL ROOF GARLAND: Existing roof trim/underside only. '+(
  g.placement==='front'?'Front gable / front eave only. ':'Existing gable and roof eaves all around. ')+
  (g.type==='retro'?'Period-style exposed filament bulbs with dark sockets and cords. ':
   g.type==='icicle'?'Hanging icicle-light rain: short variable vertical strands under the existing fascia. ':
   'Delicate micro LED fairy lights with fine cables. ')+
  'Color temperature '+g.temperature+'; authored brightness '+g.brightness+
  '%. Preserve the exact original roof structure, silhouette, measurements and windows. No additional or detached light fixtures.';
}
