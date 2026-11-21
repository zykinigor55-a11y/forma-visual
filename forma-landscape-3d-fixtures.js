/* FORMA 3D / Eleven distinct architectural light fittings.
 * Meter-sized, physically based, self-contained Three.js geometry.
 * Catalog previews use these same meshes: selection can never show another type.
 * No trademarked or unlicensed third-party geometry is embedded.
 */
import {gardenLightingSpec} from './forma-landscape-3d-lighting.js';
import {createPhotoReferenceLuminaire} from './forma-landscape-3d-luminaires-reference.js';

export function createProfessionalGardenLight(T,instance,{night=false}={}){
 const photoReplica=createPhotoReferenceLuminaire(T,instance,{night});
 if(photoReplica)return photoReplica;
 const id=instance?.catalogId,spec=gardenLightingSpec[id];
 if(!spec)return null;
 const g=new T.Group();
 g.name='FORMA-LUMINAIRE-'+id;
 g.userData.fixtureId=id;
 g.userData.fixtureVersion='pbr-11-v2';
 const dimmer=Number.isFinite(Number(instance?.brightness))?Math.max(0,Math.min(2,Number(instance.brightness))):1;
 const glow=night?dimmer:0;
 const kelvin=Number(instance?.kelvin)||2700;
 const lightTint=({2200:'#ffbd84',2700:'#ffdbb0',3000:'#ffe3c5',4000:'#fff2e6'})[kelvin]||'#ffdbb0';
 const metal=new T.MeshPhysicalMaterial({color:'#292f34',metalness:.82,roughness:.40,clearcoat:.18,clearcoatRoughness:.32});
 const brushed=new T.MeshPhysicalMaterial({color:'#62666c',metalness:.78,roughness:.38,clearcoat:.12});
 const bronze=new T.MeshPhysicalMaterial({color:'#827663',metalness:.76,roughness:.29,clearcoat:.21});
 const rubber=new T.MeshStandardMaterial({color:'#171e20',metalness:.03,roughness:.89});
 const opal=new T.MeshPhysicalMaterial({color:'#efe5d3',metalness:0,roughness:.58,transmission:.08,
  thickness:.012,ior:1.45,emissive:lightTint,emissiveIntensity:glow*1.12+.008});
 const lens=new T.MeshPhysicalMaterial({color:'#d5e1e0',metalness:0,roughness:.16,clearcoat:.35,transmission:.28,
  thickness:.008,ior:1.48,emissive:lightTint,emissiveIntensity:glow*1.45+.008});
 const led=new T.MeshStandardMaterial({color:'#fff0d1',metalness:0,roughness:.57,
  emissive:lightTint,emissiveIntensity:glow*2.15+.008});
 const add=(geo,mat,x=0,y=0,z=0,part='housing',casts=true)=>{
  const mesh=new T.Mesh(geo,mat);
  mesh.position.set(x,y,z);mesh.castShadow=casts;mesh.receiveShadow=true;
  mesh.userData.fixturePart=part;g.add(mesh);return mesh;
 };
 const cyl=(r1,r2,h,x,y,z,mat,part='housing',casts=true,segments=32)=>
  add(new T.CylinderGeometry(r1,r2,h,segments),mat,x,y,z,part,casts);
 const box=(w,h,d,x,y,z,mat,part='housing',casts=true)=>
  add(new T.BoxGeometry(w,h,d),mat,x,y,z,part,casts);
 const ball=(r,x,y,z,mat,part='diffuser',casts=false)=>
  add(new T.SphereGeometry(r,32,24),mat,x,y,z,part,casts);
 const ring=(r,t,x,y,z,mat,part='bezel')=>{
  const mesh=add(new T.TorusGeometry(r,t,10,48),mat,x,y,z,part);
  mesh.rotation.x=Math.PI/2;return mesh;
 };
 const screw=(x,y,z)=>{
  const m=cyl(.008,.008,.006,x,y,z,brushed,'fastener',false,16);
  box(.010,.0016,.0022,x,y+.0035,z,rubber,'screw-slot',false);
  return m;
 };
 const base=(r=.12)=>{
  cyl(r*.92,r,.042,0,.024,0,metal,'base');
  ring(r*.79,.007,0,.048,0,brushed,'machined-base-edge');
  ring(r*.64,.005,0,.051,0,rubber,'weather-gasket');
  for(let i=0;i<4;i++){
   const a=i*Math.PI/2+.25;
   screw(Math.cos(a)*r*.82,.049,Math.sin(a)*r*.82);
  }
 };
 if(id==='bollard'){
  base(.135);cyl(.058,.075,.67,0,.374,0,metal,'shaft');
  for(let a=0;a<4;a++){const t=a*Math.PI/2;
   const ob=box(.008,.56,.009,Math.cos(t)*.060,.35,Math.sin(t)*.060,brushed,'brushed-inset',false);ob.rotation.y=-t;}
  cyl(.113,.113,.107,0,.747,0,opal,'diffuser',false);
  cyl(.122,.115,.035,0,.814,0,metal,'anti-glare-cap');
  ring(.098,.008,0,.682,0,bronze);
 }else if(id==='ground'){
  cyl(.142,.142,.055,0,.028,0,rubber,'IP67-housing');
  cyl(.132,.132,.010,0,.063,0,brushed,'rim');
  cyl(.103,.103,.005,0,.069,0,lens,'glass-lens',false);
  ring(.123,.011,0,.074,0,metal,'recessed-bezel');
  ring(.111,.003,0,.077,0,rubber,'waterproof-lens-gasket');
  const reflector=add(new T.CircleGeometry(.09,48),brushed,0,.062,0,'optic-reflector',false);
  reflector.rotation.x=-Math.PI/2;
  for(let i=0;i<4;i++){const a=i*Math.PI/2;screw(.118*Math.cos(a),.078,.118*Math.sin(a))}
  for(let i=-2;i<=2;i++)box(.008,.005,.17,i*.029,.075,0,metal,'anti-glare-grid',false);
 }else if(id==='spot'||id==='spike-spot'){
  const mini=id==='spike-spot',r=mini?.079:.116;
  base(mini?.064:.113);
  cyl(mini?.023:.038,mini?.030:.049,mini?.15:.13,0,mini?.12:.12,0,metal,'articulated-stand');
  const joint=ball(mini?.039:.049,0,mini?.20:.20,0,brushed,'pivot');
  joint.castShadow=true;
  const head=new T.Group();head.position.set(0,mini?.28:.25,mini?.028:.04);head.rotation.x=-.64;g.add(head);
  const housing=new T.Mesh(new T.CylinderGeometry(r*.92,r*.98,mini?.17:.23,32),metal);
  housing.userData.fixturePart='spot-head';housing.castShadow=true;head.add(housing);
  const heat=new T.Mesh(new T.CylinderGeometry(r*.9,r*.9,.014,32),brushed);
  heat.position.y=mini?-.091:-.118;head.add(heat);
  const glass=new T.Mesh(new T.CylinderGeometry(r*.76,r*.76,.008,32),lens);
  glass.position.y=mini?.091:.119;glass.userData.fixturePart='spot-lens';head.add(glass);
  const bezel=new T.Mesh(new T.TorusGeometry(r*.8,.010,8,36),bronze);
  bezel.rotation.x=Math.PI/2;bezel.position.y=mini?.101:.126;head.add(bezel);
  // Die-cast adjustable U-bracket and deep anti-glare hood.
  for(const x of [-r*.83,r*.83]){
   const arm=box(.013,mini?.12:.17,.019,x,mini?.235:.255,.035,brushed,'yoke-bracket');
   arm.rotation.x=-.28;
  }
  const visor=new T.Mesh(new T.CylinderGeometry(r*.93,r*.93,.025,40,1,true),metal);
  visor.position.y=mini?.11:.137;visor.userData.fixturePart='deep-visor';head.add(visor);
  // Visible heat sinks are true housing geometry, not emissive billboards.
  for(let i=0;i<4;i++){
   const fin=new T.Mesh(new T.TorusGeometry(r*.88,.004,6,28),metal);
   fin.rotation.x=Math.PI/2;fin.position.y=(i-1.6)*.026;head.add(fin);
  }
 }else if(id==='low-post'){
  base(.125);
  box(.132,1.11,.132,0,.60,0,metal,'rectangular-post');
  for(let y=.26;y<1.0;y+=.17)box(.012,.062,.004,-.068,y,0,brushed,'side-channel',false);
  box(.092,.28,.012,0,.92,.072,opal,'vertical-window',false);
  box(.142,.034,.146,0,1.17,0,metal,'weather-cap');
  for(const x of [-.066,.066])box(.014,.31,.012,x,.92,.072,brushed,'window-frame');
 }else if(id==='deck-light'){
  box(.23,.072,.23,0,.041,0,rubber,'recessed-housing');
  box(.219,.015,.219,0,.080,0,brushed,'square-bezel');
  box(.145,.007,.145,0,.091,0,opal,'opal-window',false);
  box(.17,.002,.17,0,.087,0,rubber,'compressed-IP-gasket',false);
  for(const x of [-.085,.085])for(const z of [-.085,.085])screw(x,.095,z);
  box(.224,.008,.224,0,.096,0,bronze,'edge-trim',false);
 }else if(id==='linear'){
  box(.138,.074,.94,0,.040,0,rubber,'recessed-linear-tray');
  box(.142,.010,.96,0,.083,0,brushed,'metal-extrusion');
  box(.072,.006,.86,0,.091,0,opal,'linear-diffuser',false);
  for(let z=-.39;z<=.4;z+=.065)box(.035,.002,.018,0,.086,z,led,'led-cell',false);
  for(const z of [-.44,.44])box(.13,.008,.028,0,.095,z,metal,'end-cap');
  for(const x of [-.046,.046])box(.004,.006,.86,x,.095,0,bronze,'linear-edge',false);
 }else if(id==='mushroom'){
  base(.116);cyl(.045,.062,.47,0,.276,0,metal,'stem');
  cyl(.203,.115,.057,0,.553,0,opal,'downward-diffuser',false);
  cyl(.12,.23,.092,0,.619,0,metal,'mushroom-shade');
  ring(.224,.009,0,.579,0,bronze,'cap-edge');
  ring(.16,.006,0,.572,0,rubber,'concealed-diffuser-seal');
  cyl(.074,.074,.021,0,.675,0,brushed,'top-disc');
 }else if(id==='square-bollard'){
  box(.188,.052,.188,0,.028,0,metal,'base');
  box(.139,.61,.139,0,.349,0,metal,'square-column');
  for(const side of [-1,1]){
   box(.011,.49,.004,side*.071,.35,.03,brushed,'steel-channel',false);
   box(.100,.107,.008,0,.69,side*.074,opal,'side-diffuser',false);
  }
  box(.104,.11,.008,.074,.69,0,opal,'side-diffuser',false);
  box(.104,.11,.008,-.074,.69,0,opal,'side-diffuser',false);
  box(.205,.042,.205,0,.779,0,metal,'top-cap');
 }else if(id==='garden-lantern'){
  base(.178);
  cyl(.057,.072,1.87,0,.979,0,metal,'lamp-post');
  for(const y of [.17,1.50,1.86])ring(.071,.011,0,y,0,bronze,'post-collar');
  const foot=cyl(.104,.070,.18,0,.11,0,brushed,'cast-base');foot.castShadow=true;
  // Four real glass faces enclosed by distinct metal mullions.
  box(.32,.028,.32,0,1.948,0,metal,'lantern-base');
  for(const side of [-1,1]){
   box(.016,.29,.28,side*.15,2.112,0,lens,'glass-pane',false);
   box(.28,.29,.016,0,2.112,side*.15,lens,'glass-pane',false);
  }
  for(const x of [-.151,.151])for(const z of [-.151,.151])
   box(.017,.34,.017,x,2.113,z,metal,'corner-frame');
  ball(.054,0,2.102,0,led,'filament-bulb',false);
  const roof=add(new T.ConeGeometry(.245,.19,4),metal,0,2.328,0,'pyramidal-roof');
  roof.rotation.y=Math.PI/4;
  ball(.03,0,2.455,0,bronze,'finial');
 }else if(id==='globe'){
  base(.14);
  cyl(.072,.095,.174,0,.130,0,metal,'pedestal');
  ring(.11,.012,0,.227,0,bronze,'opal-collar');
  ring(.097,.008,0,.236,0,rubber,'opal-neck-gasket');
  const center=.448;
  ball(.238,0,center,0,opal,'opal-globe',false);
  // Inner low-power luminous core is visible only through the diffuser.
  ball(.079,0,center,0,led,'LED-module',false);
 }
 // The saved height changes the geometry and the emitted light consistently.
 const custom=Number(instance.height),legacy=custom===1.2&&id!=='low-post';
 const adjustable=['bollard','low-post','mushroom','square-bollard','garden-lantern','globe'].includes(id);
 if(adjustable&&!legacy&&Number.isFinite(custom)&&custom>.14&&custom<4){
  g.scale.y=custom/spec.height;
 }
 g.userData.measuredHeight=spec.height*g.scale.y;
 return g;
}

/** Each picker photo is rendered from the identical mesh used in the
 * scene. No stock pictures, broken URLs, mislabeled sprites or fake types.
 * Lazy and cached by caller to avoid extra WebGL contexts during navigation.
 */
export function photographGardenLightPreviews(T,ids){
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});
 renderer.setSize(192,192,false);
 renderer.shadowMap.enabled=true;
 renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.setPixelRatio(1);
 renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.toneMapping=T.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.35;
 const scene=new T.Scene();
 scene.background=new T.Color('#c8cac4');
 const key=new T.DirectionalLight(0xffebce,3.4);key.position.set(-3,7,5);scene.add(key);
 const fill=new T.HemisphereLight(0xd7ebff,0x35403a,2.5);scene.add(fill);
 const rim=new T.DirectionalLight(0xaac5e0,2);rim.position.set(3,5,-4);scene.add(rim);
 const floor=new T.Mesh(new T.CylinderGeometry(.63,.63,.035,48),new T.MeshStandardMaterial({color:'#8e9791',metalness:.10,roughness:.80}));
 floor.receiveShadow=true;
 floor.position.y=-.033;scene.add(floor);
 const camera=new T.PerspectiveCamera(38,1,.02,40);
 const result={};
 try{
  for(const id of ids){
   const spec=gardenLightingSpec[id];if(!spec)continue;
   const fixture=createProfessionalGardenLight(T,{catalogId:id,height:spec.height,brightness:1,kelvin:2700},{night:id==='globe'});
   scene.add(fixture);
   const h=spec.height,targetHeight=Math.min(h*.49,.9);
   const dist=Math.max(.78,h*1.42+.55,id==='linear'?1.45:0);
   camera.position.set(dist*.76,targetHeight+Math.max(.50,h*.31),dist);
   camera.lookAt(0,targetHeight,0);
   floor.visible=h<1.5;
   renderer.render(scene,camera);
   result[id]=renderer.domElement.toDataURL('image/png');
   scene.remove(fixture);
   fixture.traverse(n=>{if(n.geometry)n.geometry.dispose();if(n.material){for(const m of (Array.isArray(n.material)?n.material:[n.material]))m.dispose?.()}});
  }
 }finally{
  floor.geometry.dispose();floor.material.dispose();
  renderer.dispose();
  renderer.forceContextLoss?.();
 }
 return result;
}
