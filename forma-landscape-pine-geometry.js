/* FORMA · genuine, adjustable extra pine branch geometry and PBR needle sprays.
 * Supplement the CC0 GLB; never change the source trunk or licensed mesh data.
 * Branches and textured needle cards are InstancedMesh (two draw calls at most).
 */
import {normalizePineGrowth} from './forma-landscape-pine-growth.js';

function seededRandom(seed){
 let n=(seed>>>0)||1;
 return ()=>{
  n+=0x6d2b79f5;
  let t=n;t=Math.imul(t^(t>>>15),t|1);
  t^=t+Math.imul(t^(t>>>7),t|61);
  return ((t^(t>>>14))>>>0)/4294967296;
 };
}
function materialFor(source,type){
 let found=null;
 source.traverse(node=>{
  if(found||!node.isMesh)return;
  for(const m of (Array.isArray(node.material)?node.material:[node.material])){
   if(!m)continue;
   const needles=(m.alphaTest>0||m.transparent);
   if((type==='needle'&&needles)||(type==='bark'&&!needles)){found=m;break}
  }
 });
 return found;
}
const limit=(n,min,max)=>Math.max(min,Math.min(max,n));

export function makePineExtraGrowth(T,source,instance,settings){
 const p=normalizePineGrowth(settings);
 if(!Number.isFinite(Number(instance?.height))||!Number.isFinite(Number(instance?.diameter)))return null;
 const height=limit(Number(instance.height),2,40),radius=limit(Number(instance.diameter)/2,.25,15);
 const branchCount=Math.round(p.branchDensity*.45);
 const spraysCount=Math.round(p.needleDensity*3.0);
 if(!branchCount&&!spraysCount)return null;
 const g=new T.Group();
 g.name='pine-extra-growth';
 g.userData.pineExtra=true;
 const rand=seededRandom((p.seed*9719+(instance.variant||1)*7919+11719)>>>0);
 const needleMatSource=materialFor(source,'needle'),barkMatSource=materialFor(source,'bark');
 const needles=needleMatSource?.map||needleMatSource?.alphaMap||null;
 // PBR bark is reused from the author's tree. The cylinder's small UVs are
 // sufficient because limbs are only a few centimetres wide.
 const bark=barkMatSource?.clone()||new T.MeshStandardMaterial({color:0x805947,roughness:1});
 bark.roughness=Math.max(.82,bark.roughness??.93);
 const branchGeometry=new T.CylinderGeometry(.56,1,1,6,1);
 const segmentCount=branchCount*2;
 const wood=branchCount?new T.InstancedMesh(branchGeometry,bark,segmentCount):null;
 if(wood){wood.name='pine-extra-real-branches';wood.castShadow=true;wood.receiveShadow=true}
 const axes=new T.Vector3(0,1,0);
 const start=new T.Vector3(),middle=new T.Vector3(),end=new T.Vector3();
 const dummy=new T.Object3D();
 let segmentIdx=0;
 const setSegment=(a,b,r)=>{
  if(!wood)return;
  const direction=b.clone().sub(a);
  const length=direction.length();
  if(length<.005)return;
  dummy.position.copy(a).add(b).multiplyScalar(.5);
  dummy.quaternion.setFromUnitVectors(axes,direction.normalize());
  dummy.scale.set(r,length,r);dummy.updateMatrix();
  wood.setMatrixAt(segmentIdx++,dummy.matrix);
 };
 const anchors=[];
 const growingBase=height*p.crownBase/100;
 const growHeight=Math.max(.3,height-growingBase);
 const widthFactor=.70+.30*(p.crownSpread-70)/70;
 const angleSeed=rand()*Math.PI*2;
 // Staggered whorls with crown taper at the top, broader in the middle.
 const count=Math.max(branchCount,Math.min(45,Math.round(spraysCount/15)));
 for(let i=0;i<count;i++){
  const t=(i+.4+rand()*.25)/count;
  const level=limit(growingBase+t*growHeight,height*.15,height*.975);
  const theta=angleSeed+i*2.39996323+(rand()-.5)*p.irregularity*.045;
  const asym=(rand()-.5)*p.irregularity/100;
  const crownProfile=limit(Math.sin(Math.PI*(.18+t*.78)),.15,1);
  const reach=radius*widthFactor*crownProfile*(.67+rand()*.26+asym);
  const outward=Math.max(.18,reach);
  const tilt=(rand()-.5)*height*(.012+p.irregularity*.0002);
  start.set(Math.sin(theta)*height*.006,level-Math.min(.35,height*.03),Math.cos(theta)*height*.006);
  middle.set(Math.cos(theta)*outward*.59,level+tilt*.5,Math.sin(theta)*outward*.59);
  end.set(Math.cos(theta)*outward,level+tilt+height*.014,Math.sin(theta)*outward);
  const branchRadius=limit(height*(.0038+(1-t)*.0032),.012,.09);
  if(i<branchCount){
   setSegment(start,middle,branchRadius);
   setSegment(middle,end,branchRadius*.49);
  }
  anchors.push({x:end.x,y:end.y,z:end.z,theta,radius:outward,t});
 }
 if(wood){
  wood.count=segmentIdx;
  wood.instanceMatrix.needsUpdate=true;
  g.add(wood);
 }else{branchGeometry.dispose();bark.dispose()}
 if(spraysCount){
  // Reuse alpha-cut needle photography already present in the imported GLB.
  // If no alpha image was supplied, narrow dark green sprays remain drawable
  // without inventing a photographic source.
  const leaf=needleMatSource?.clone()||new T.MeshStandardMaterial({color:'#375e3b',roughness:1});
  leaf.side=T.DoubleSide;leaf.depthWrite=true;leaf.transparent=false;
  if(needles){
   if(!leaf.map)leaf.map=needles;
   leaf.alphaTest=Math.max(.24,leaf.alphaTest||.24);
  }else leaf.color=new T.Color('#3b6445');
  leaf.roughness=1;
  const sprayGeom=new T.PlaneGeometry(1,1);
  const cards=new T.InstancedMesh(sprayGeom,leaf,spraysCount*2);
  cards.name='pine-extra-photo-needles';
  cards.castShadow=false;cards.receiveShadow=true;
  const stem=new T.Vector3(),spin=new T.Euler();
  let idx=0;
  for(let i=0;i<spraysCount;i++){
   const a=anchors[i%anchors.length];
   const dist=.72+rand()*.22;
   const tangent=(rand()-.5)*.18*radius;
   stem.set(
    a.x*dist-Math.sin(a.theta)*tangent,
    limit(a.y+(rand()-.5)*height*.055,growingBase*.90,height*.987),
    a.z*dist+Math.cos(a.theta)*tangent
   );
   const breadth=limit((.19+rand()*.19)*(height/14)**.23,.16,.55);
   for(let j=0;j<2;j++){
    dummy.position.copy(stem);
    // Crossed real alpha-cut needles preserve volume when viewed from any side.
    spin.set((rand()-.5)*.65,a.theta+j*Math.PI/2+(rand()-.5)*.45,(rand()-.5)*.4,'YXZ');
    dummy.quaternion.setFromEuler(spin);
    dummy.scale.set(breadth,breadth*(1.25+rand()*.65),1);dummy.updateMatrix();
    cards.setMatrixAt(idx++,dummy.matrix);
   }
  }
  cards.instanceMatrix.needsUpdate=true;
  g.add(cards);
 }
 g.userData.pineExtraBranches=branchCount;
 g.userData.pineExtraNeedleCards=spraysCount*2;
 g.userData.pineGrowth={...p};
 return g;
}
