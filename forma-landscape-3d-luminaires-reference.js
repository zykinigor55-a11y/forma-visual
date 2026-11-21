/* FORMA VISUAL / garden luminaire replicas from inspected real-life product photographs.
 * Modeled in metre units, using original self-authored Three.js geometry (no
 * copied proprietary manufacturer meshes or redistributed product photography).
 * References: docs/garden-lights-11-photo-references.md
 * The model ID and saved x/y/rotation remain unchanged.
 */
import {gardenLightingSpec} from './forma-landscape-3d-lighting.js';
import {createUserReferenceGardenLuminaire} from './forma-landscape-3d-user-7-lights.js';

export function createPhotoReferenceLuminaire(T, instance, {night=false}={}){
 const photo= createUserReferenceGardenLuminaire(T,instance,{night});
 if(photo)return photo;
 const id=instance?.catalogId, spec=gardenLightingSpec[id];
 if(!spec)return null;
 const g=new T.Group();
 g.name='FORMA-LUMINAIRE-'+id;
 g.userData.fixtureId=id;
 g.userData.fixtureVersion='real-photo-reference-v3';
 const kelvin=Number(instance?.kelvin)||2700;
 const temp=({2200:'#ffc18c',2700:'#ffe0b9',3000:'#ffe9d0',4000:'#f4f3ed'})[kelvin]||'#ffe0b9';
 const dim=Number.isFinite(Number(instance?.brightness))?Math.max(0,Math.min(2,Number(instance.brightness))):1;
 const luminous=(night?dim:0);
 const pbr=(color,metalness=.7,roughness=.42)=>new T.MeshPhysicalMaterial({color,metalness,roughness,clearcoat:.19,clearcoatRoughness:.35});
 const graphite=pbr('#27292b',.78,.47),matteBlack=pbr('#191b1c',.57,.56),
  silver=pbr('#9b9ea0',.85,.29),brushed=pbr('#74777a',.79,.37),
  darkBronze=pbr('#34312f',.72,.43),
  rubber=new T.MeshStandardMaterial({color:'#111313',roughness:.88}),
  mirror=new T.MeshPhysicalMaterial({color:'#d8dadb',metalness:.92,roughness:.16}),
  opal=new T.MeshPhysicalMaterial({color:'#f1ece3',roughness:.69,metalness:0,
    emissive:temp,emissiveIntensity:luminous*.8+.007,transmission:.025,thickness:.025,ior:1.46}),
  glass=new T.MeshPhysicalMaterial({color:'#bbc6c8',metalness:.04,roughness:.12,
    transmission:.38,thickness:.007,ior:1.5,clearcoat:.8,clearcoatRoughness:.08,
    emissive:temp,emissiveIntensity:luminous*.20}),
  led=new T.MeshStandardMaterial({color:'#f6ebd9',roughness:.5,emissive:temp,
    emissiveIntensity:luminous*1.8+.016}),
  darkGlass=new T.MeshPhysicalMaterial({color:'#25272a',metalness:.15,roughness:.18,clearcoat:.8,
    emissive:temp,emissiveIntensity:luminous*.06});
 const mesh=(geom,mat,x=0,y=0,z=0,part='housing',shadow=true)=>{
  const m=new T.Mesh(geom,mat);m.position.set(x,y,z);m.castShadow=shadow;m.receiveShadow=true;
  m.userData.fixturePart=part;g.add(m);return m;
 };
 const cyl=(rt,rb,h,x,y,z,mat,part='housing',seg=48)=>
  mesh(new T.CylinderGeometry(rt,rb,h,seg),mat,x,y,z,part);
 const box=(w,h,d,x,y,z,mat,part='housing')=>
  mesh(new T.BoxGeometry(w,h,d),mat,x,y,z,part);
 const globe=(r,x,y,z,mat,part='diffuser')=>
  mesh(new T.SphereGeometry(r,64,40),mat,x,y,z,part,part!=='diffuser');
 const ring=(r,wire,x,y,z,mat,part='bezel')=>{
  const v=mesh(new T.TorusGeometry(r,wire,10,64),mat,x,y,z,part);
  v.rotation.x=-Math.PI/2;return v;
 };
 const screw=(x,y,z,r=.004)=>{
  cyl(r,r,.002,x,y,z,brushed,'captive-screw',12);
  box(r*1.2,.0008,r*.24,x,y+.0011,z,matteBlack,'slot');
 };
 const rod=(points,rad,mat,part='rod')=>{
  const v=points.map(p=>new T.Vector3(...p)),curve=new T.CatmullRomCurve3(v);
  return mesh(new T.TubeGeometry(curve,20,rad,8,false),mat,0,0,0,part);
 };
 const facing=(o,dir)=>o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...dir).normalize());
 const opaqueCylinder=(height,radius,mat)=>{
  cyl(radius,radius,height*.95,0,height*.475,0,mat,'extruded-aluminium-tube');
  cyl(radius*.94,radius*.94,.01,0,height*.963,0,matteBlack,'end-cap');
 };
 function cortenMaterial(){
  const c=document.createElement('canvas');c.width=c.height=256;
  const cx=c.getContext('2d'),image=cx.createImageData(256,256);
  let seed=183491;const rng=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296};
  for(let i=0;i<image.data.length;i+=4){
   const x=(i/4)%256,y=Math.floor(i/4/256),grain=(rng()-.5)*40;
   const tide=12*Math.sin(y*.04+x*.013)+8*Math.sin(x*.11+y*.025);
   const v=grain+tide;
   image.data[i]=Math.max(0,Math.min(255,94+v));
   image.data[i+1]=Math.max(0,Math.min(255,48+v*.62));
   image.data[i+2]=Math.max(0,Math.min(255,29+v*.40));
   image.data[i+3]=255;
  }
  cx.putImageData(image,0,0);
  const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;
  texture.wrapS=texture.wrapT=T.RepeatWrapping;
  return new T.MeshStandardMaterial({map:texture,roughness:.91,metalness:.34,side:T.DoubleSide,
   bumpMap:texture,bumpScale:.0014});
 }
 if(id==='bollard'){
  // BEGA 84 418: black tube, tall contiguous satin opal band and black lip.
  const H=spec.height, r=.067;
  cyl(r,r,H*.79,0,H*.395,0,graphite,'powder-coated-post',64);
  cyl(r*.95,r*.95,H*.16,0,H*.87,0,opal,'satin-opal-ring',64);
  cyl(r,r,H*.055,0,H*.9725,0,graphite,'flat-upper-cap',64);
  cyl(r*.98,r*.98,.013,0,.010,0,matteBlack,'sealed-foot',64);
  ring(r*.98,.0018,0,H*.790,0,rubber,'opal-bottom-seal');
  ring(r*.96,.0018,0,H*.947,0,rubber,'opal-top-seal');
  for(const a of [0,Math.PI]){const v=cyl(.0024,.0024,.0026,Math.cos(a)*r,.046,Math.sin(a)*r,silver,'mounting-stud',12);v.rotation.z=Math.PI/2;}
 }else if(id==='ground'){
  // Delta Light LOGIC 190: stainless ring, deep dark optical bowl and 7 LEDs.
  cyl(.092,.079,.105,0,-.054,0,matteBlack,'buried-IP67-housing',64);
  cyl(.094,.094,.012,0,.006,0,silver,'brushed-stainless-rim',72);
  cyl(.073,.073,.001,0,.013,0,darkGlass,'black-glass-lens',64);
  ring(.071,.002,0,.015,0,rubber,'glass-seal');
  ring(.082,.003,0,.015,0,brushed,'bezel-step');
  for(const a of [0,Math.PI])screw(.083*Math.cos(a),.014,.083*Math.sin(a),.004);
  const points=[[0,0]];for(let i=0;i<6;i++){const a=i*Math.PI/3;points.push([Math.cos(a)*.037,Math.sin(a)*.037]);}
  points.forEach(([x,z])=>{
   cyl(.010,.010,.002,x,.016,z,mirror,'led-optical-cup',20);
   cyl(.006,.006,.002,x,.018,z,led,'led-diode',20);
  });
 }else if(id==='spot'){
  // Flos Belvedere Spot F1: one bent stem into a tapered conical optical head.
  const baseR=.093;
  cyl(baseR,baseR,.008,0,.004,0,darkBronze,'circular-mounting-disc',64);
  cyl(.021,.021,.095,0,.054,0,darkBronze,'vertical-elbow-stem');
  rod([[0,.091,0],[0,.145,-.008],[0,.172,-.032],[0,.178,-.058]],.019,darkBronze,'cast-elbow');
  const dir=new T.Vector3(0,.67,-.74).normalize();
  const center=new T.Vector3(0,.229,-.105);
  const shell=mesh(new T.CylinderGeometry(.060,.031,.13,64),darkBronze,
    center.x,center.y,center.z,'tapered-spot-body');facing(shell,dir.toArray());
  const bezelPos=center.clone().addScaledVector(dir,.067);
  const optic=cyl(.048,.048,.003,bezelPos.x,bezelPos.y,bezelPos.z,glass,'recessed-lens',64);facing(optic,dir.toArray());
  const bezel=cyl(.061,.061,.009,bezelPos.x,bezelPos.y+.002,bezelPos.z-.002,silver,'anti-glare-lip',64);facing(bezel,dir.toArray());
  const iris=cyl(.047,.047,.011,bezelPos.x+dir.x*.006,bezelPos.y+dir.y*.006,bezelPos.z+dir.z*.006,darkGlass,'optical-recess',48);facing(iris,dir.toArray());
  const diode=globe(.012,bezelPos.x+dir.x*.014,bezelPos.y+dir.y*.014,bezelPos.z+dir.z*.014,led,'LED-chip');
 }else if(id==='low-post'){
  // BEGA Home & Garden square bollard: tall square pillar with light-box top.
  const H=spec.height, p=.065;
  box(.118,H*.81,.118,0,H*.405,0,graphite,'square-extrusion');
  box(.122,.010,.122,0,H*.815,0,matteBlack,'upper-gasket');
  box(.118,H*.144,.118,0,H*.894,0,opal,'opal-light-head');
  for(const x of [-p,p])for(const z of [-p,p]){
   box(.007,H*.15,.007,x,H*.895,z,graphite,'cast-corner-spine');
  }
  box(.134,.019,.134,0,H*.989,0,graphite,'square-top-cap');
  box(.125,.012,.125,0,.006,0,matteBlack,'ground-foot');
  for(const z of [-.05,.05])screw(.052,H*.813,z,.0026);
 }else if(id==='deck-light'){
  // SLV DASAR S: small brushed square flush trim with recessed round optics.
  box(.081,.104,.081,0,-.049,0,matteBlack,'buried-polymers');
  box(.095,.007,.095,0,.002,0,silver,'satin-square-trim');
  box(.089,.001,.089,0,.006,0,brushed,'bevel-inset');
  cyl(.028,.028,.002,0,.007,0,matteBlack,'circular-dark-well',48);
  cyl(.022,.022,.002,0,.009,0,mirror,'deep-spun-reflector',48);
  cyl(.017,.017,.002,0,.011,0,glass,'watertight-lens',48);
  cyl(.011,.011,.001,0,.012,0,led,'COB-emitter',32);
  ring(.028,.002,0,.009,0,graphite,'machined-collar');
  for(const [x,z] of [[-.037,-.034],[.037,-.034],[0,.039]])screw(x,.009,z,.0035);
 }else if(id==='linear'){
  // iGuzzini Linealuce Mini 37: thin linear extrusion with individual optics.
  const length=.96,width=.037;
  box(width,.070,length,0,-.035,0,matteBlack,'extruded-recessed-driver');
  box(width+.012,.006,length+.012,0,.003,0,silver,'flush-stainless-linear-rim');
  box(width-.005,.003,length-.050,0,.007,0,matteBlack,'recessed-dark-channel');
  for(let i=0;i<8;i++){
   const z=(i-3.5)*.109;
   cyl(.010,.010,.003,0,.010,z,mirror,'micro-reflector',24);
   cyl(.006,.006,.002,0,.012,z,led,'led-optic',24);
   ring(.010,.001,0,.011,z,graphite,'optic-cell-gasket');
  }
  for(const z of [-length*.47,length*.47])screw(0,.010,z,.0028);
 }else if(id==='mushroom'){
  // FLOS Bellhop bollard H380: domed black top over an ultra-slim round post.
  const H=spec.height;
  cyl(.024,.024,H*.81,0,H*.405,0,graphite,'thin-extruded-stem',64);
  const pts=[
    new T.Vector2(0,H*.822),new T.Vector2(.048,H*.822),new T.Vector2(.061,H*.826),
    new T.Vector2(.064,H*.842),new T.Vector2(.065,H*.885),new T.Vector2(.062,H*.94),
    new T.Vector2(.050,H*.975),new T.Vector2(.026,H*.994),new T.Vector2(0,H)
  ];
  mesh(new T.LatheGeometry(pts,72),matteBlack,0,0,0,'soft-mushroom-dome');
  cyl(.051,.051,.004,0,H*.816,0,mirror,'shielded-downlight-reflector',48);
  ring(.045,.004,0,H*.812,0,opal,'under-cap-LED-diffuser');
  cyl(.027,.027,.004,0,H*.803,0,led,'under-cap-LED-plate');
  cyl(.031,.031,.007,0,.004,0,graphite,'minimal-stem-base');
 }else if(id==='square-bollard'){
  // SLV RUSTY SLOT 50: genuine 12 x 12 x 50 cm corten-steel box with an
  // open vertical slot, not a luminous sticker placed on a solid side.
  const rust=cortenMaterial(),w=.12,h=.50,thick=.009;
  // Hollow Corten body. The front is four separate steel panels so its
  // cut-out is actual missing geometry with depth, not a glowing decal.
  box(w,h,thick,0,h/2,-w/2+thick/2,rust,'rear-wall');
  for(const x of [-w/2+thick/2,w/2-thick/2])
   box(thick,h,w,x,h/2,0,rust,'corten-side-wall');
  box(w,.10,thick,0,.05,w/2-thick/2,rust,'lower-front-panel');
  box(w,.105,thick,0,h-.0525,w/2-thick/2,rust,'upper-front-panel');
  for(const x of [-.053,.053])
   box(.014,.30,thick,x,.250,w/2-thick/2,rust,'vertical-corten-edge');
  box(w,.009,w,0,h-.0045,0,rust,'fully-closed-steel-top');
  box(w,.008,w,0,.004,0,matteBlack,'foundation-seal');
  // Inner reflector sits behind the cut steel edge, within the 120-mm prism.
  box(.085,.28,.005,0,.250,w/2-.027,matteBlack,'real-dark-cavity');
  box(.072,.235,.002,0,.250,w/2-.022,mirror,'deep-cavity-reflector');
  box(.062,.195,.001,0,.250,w/2-.019,opal,'indirect-warm-light-source');
 }else if(id==='garden-lantern'){
  // Philips myGarden Creek 15383/30/16: slender traditional post with a
  // flared pedestal, vertical clear lantern panes and softly curved roof.
  const H=spec.height;
  cyl(.065,.089,.025,0,.013,0,matteBlack,'hexagonal-cast-ground-base',6);
  const foot=mesh(new T.CylinderGeometry(.024,.070,.105,6),graphite,0,.069,0,'tapered-hexagonal-foot');
  cyl(.019,.024,H*.676,0,.46,0,graphite,'slim-post',48);
  ring(.026,.005,0,H*.756,0,brushed,'lantern-mount-neck');
  const lower=H*.778,upper=H*.936,r=.091;
  cyl(.076,.057,.026,0,lower+.012,0,graphite,'lantern-lower-socket',12);
  for(let a=0;a<6;a++){
   const t=a*Math.PI/3;
   const x=Math.cos(t)*r,z=Math.sin(t)*r;
   rod([[x*.7,lower,z*.7],[x,lower+.05,z],[x,upper-.015,z]],.006,graphite,'curved-protective-grille');
  }
  for(let a=0;a<6;a++){
   const t=a*Math.PI/3,side=.085;
   const pane=box(.003,upper-lower-.028,.076,Math.cos(t)*side,(lower+upper)/2,Math.sin(t)*side,glass,'lantern-glass-pane');
   pane.rotation.y=-t;
  }
  cyl(.026,.026,.026,0,lower+.043,0,brushed,'E27-bulb-holder',24);
  globe(.031,0,lower+.095,0,led,'warm-E27-bulb');
  const roofPts=[
   new T.Vector2(0,H*.939),new T.Vector2(.075,H*.937),
   new T.Vector2(.101,H*.959),new T.Vector2(.116,H*.974),
   new T.Vector2(.115,H*.983),new T.Vector2(.096,H*.994),new T.Vector2(0,H)
  ];
  mesh(new T.LatheGeometry(roofPts,72),graphite,0,0,0,'gently-curved-canopy');
  ring(.105,.003,0,H*.967,0,matteBlack,'waterproof-cap-rim');
 }else if(id==='spike-spot'){
  // SLV NAUTILUS SPIKE XL: true angled cylinder / pivot / detachable
  // ground spike, fixing bolts and a dark routed electrical cable.
  cyl(.035,.006,.17,0,-.087,0,matteBlack,'long-conical-ground-spike',6);
  cyl(.023,.023,.075,0,.041,0,graphite,'pivot-mount-post',24);
  globe(.019,0,.098,0,brushed,'tilt-hinge');
  const dir=[0,.64,-.768],start=new T.Vector3(0,.154,-.042);
  const shell=cyl(.048,.044,.127,start.x,start.y,start.z,matteBlack,'machined-cylinder-head',64);
  facing(shell,dir);
  const lip=start.clone().addScaledVector(new T.Vector3(...dir),.068);
  const optic=cyl(.034,.034,.003,lip.x,lip.y,lip.z,glass,'GU10-glass',48);facing(optic,dir);
  const bezel=cyl(.049,.049,.006,lip.x,lip.y,lip.z,brushed,'bolt-on-front-ring',48);facing(bezel,dir);
  const diode=globe(.016,lip.x,lip.y+.003,lip.z-.004,led,'internal-LED-lamp');
  for(let k=0;k<4;k++){
   const a=k*Math.PI/2;
   const v=cyl(.003,.003,.002,lip.x+Math.cos(a)*.042,lip.y+Math.sin(a)*.013,lip.z+Math.sin(a)*.03,silver,'front-cap-screw',12);
   v.rotation.z=Math.PI/2;
  }
  rod([[0,.145,.02],[.025,.128,.06],[.07,.082,.08],[.097,.035,.11]],.004,matteBlack,'rubber-power-cable');
 }else if(id==='globe'){
  // Serralunga ATMOSFERA 602: opal polyethylene Ø 40 cm x 38 cm,
  // spherical body with a tiny under-sphere foot, no visible pole.
  const shell=globe(.20,0,.19,0,opal,'satin-polyethylene-sphere');
  shell.scale.y=.95;
  cyl(.083,.083,.009,0,.005,0,rubber,'hidden-disc-foot',48);
  cyl(.068,.068,.003,0,.011,0,matteBlack,'sealed-driver-base',48);
 }
 // Existing authored installations preserve their x/y, saved rotation and id.
 const old=Number(instance.height), legacy=old===1.2&&id!=='low-post';
 const scaleable=['bollard','low-post','mushroom','square-bollard','garden-lantern','globe'].includes(id);
 if(scaleable&&!legacy&&Number.isFinite(old)&&old>.14&&old<4)g.scale.y=old/spec.height;
 g.userData.measuredHeight=spec.height*g.scale.y;
 g.userData.photoReference=true;
 return g;
}
