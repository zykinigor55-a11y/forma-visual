/* FORMA · editable mature Scots pine. Instanced 3D branchlets and
 * tapered evergreen needle clusters complement the untouched CC0 GLB.
 * Zero additions return the exact original PBR tree.
 */
import {normalizePineGrowth} from './forma-landscape-pine-growth.js';

const clamp=(v,low,high)=>Math.max(low,Math.min(high,v));
function makeRandom(seed){
 let n=seed>>>0||1;
 return ()=>{
  n+=0x6d2b79f5;
  let t=n;t=Math.imul(t^(t>>>15),t|1);
  t^=t+Math.imul(t^(t>>>7),t|61);
  return ((t^(t>>>14))>>>0)/4294967296;
 };
}
function stableIdHash(id){
 let hash=2166136261;
 for(const c of String(id||'')){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619)}
 return hash>>>0;
}
/** A small tapered *three-dimensional* pine shoot, never a black alpha quad.
 * 36 real blades are crossed in space at various elevations, so they retain
 * volume from 2D overhead and Walk mode. One shared geometry is instanced
 * for the entire tree; there is no draw call per blade.
 */
export function makePineNeedleSprayGeometry(T){
 const p=[];
 for(let tier=0;tier<4;tier++){
  const advance=tier*.17;
  for(let k=0;k<9;k++){
   const angle=(k+tier*.44)*Math.PI*2/9;
   const reach=(.33+(k%3)*.045)*(1-tier*.12);
   const tipY=advance+.06+Math.sin(angle*2.2)*.10;
   const baseX=Math.cos(angle)*.06,baseZ=Math.sin(angle)*.06;
   const tipX=Math.cos(angle)*reach,tipZ=Math.sin(angle)*reach;
   const sideX=-Math.sin(angle)*.022,sideZ=Math.cos(angle)*.022;
   p.push(baseX,advance-.11,baseZ,
    tipX+sideX,tipY,tipZ+sideZ,
    tipX-sideX,tipY-.012,tipZ-sideZ);
  }
 }
 const geom=new T.BufferGeometry();
 geom.setAttribute('position',new T.Float32BufferAttribute(p,3));
 geom.computeVertexNormals();
 return geom;
}
export function makePineExtraGrowth(T,source,instance,settings){
 const growth=normalizePineGrowth(settings);
 if(!Number.isFinite(Number(instance?.height))||!Number.isFinite(Number(instance?.diameter)))return null;
 const height=clamp(Number(instance.height),2,40);
 const crownRadius=clamp(Number(instance.diameter)/2,.25,15);
 const branchCount=Math.round(growth.branchDensity*.25);
 const spraysCount=Math.round(growth.needleDensity*2.2);
 if(!branchCount&&!spraysCount)return null;

 const tree=new T.Group();
 tree.name='pine-extra-growth';
 tree.userData.pineExtra=true;
 const rng=makeRandom((growth.seed*9719+stableIdHash(instance.id)*7919+(instance.variant||1)*97)>>>0);
 const branchGeom=new T.CylinderGeometry(.58,1,1,7,1);
 // Preserve PBR bark on the source GLB; its own narrow bark UV atlas does not
 // fit procedural side shoots. Use a subtle warm-brown rough matte here, not
 // the original atlas wrapped into nearly-black streaks.
 const bark=new T.MeshStandardMaterial({color:'#927153',roughness:.97,metalness:0});
 const wood=branchCount?new T.InstancedMesh(branchGeom,bark,branchCount*2):null;
 if(wood){wood.name='pine-extra-real-branches';wood.castShadow=false;wood.receiveShadow=false;}
 const up=new T.Vector3(0,1,0),start=new T.Vector3(),mid=new T.Vector3(),tip=new T.Vector3(),dummy=new T.Object3D();
 let segmentIndex=0;
 function segment(a,b,r){
  if(!wood)return;
  const dir=b.clone().sub(a),len=dir.length();
  if(len<.01)return;
  dummy.position.copy(a).add(b).multiplyScalar(.5);
  dummy.quaternion.setFromUnitVectors(up,dir.normalize());
  dummy.scale.set(r,len,r);dummy.updateMatrix();
  wood.setMatrixAt(segmentIndex++,dummy.matrix);
 }
 const base=height*growth.crownBase/100;
 const crownH=Math.max(.5,height-base);
 const breadth=.70+.30*(growth.crownSpread-70)/70;
 const anchors=[],angle0=rng()*Math.PI*2;
 const count=Math.max(1,branchCount,Math.min(32,Math.ceil(spraysCount/14)));
 for(let i=0;i<count;i++){
  const t=(i+.3+rng()*.38)/count;
  const y=clamp(base+t*crownH,height*.18,height*.96);
  const angle=angle0+i*2.3999632297+(rng()-.5)*growth.irregularity*.04;
  const variation=(rng()-.5)*growth.irregularity/100;
  const crownProfile=clamp(Math.sin(Math.PI*(.12+.82*t)),.18,1);
  const reach=crownRadius*breadth*crownProfile*(.66+rng()*.22+variation);
  const length=Math.max(.15,reach);
  const rise=(rng()-.5)*height*(.014+growth.irregularity*.00028);
  start.set(Math.sin(angle)*.025,y-.10,Math.cos(angle)*.025);
  mid.set(Math.cos(angle)*length*.54,y+rise*.47,Math.sin(angle)*length*.54);
  tip.set(Math.cos(angle)*length,y+rise+height*.012,Math.sin(angle)*length);
  if(i<branchCount){
   const thickness=clamp(height*(.0021+(1-t)*.0016),.012,.055);
   segment(start,mid,thickness);
   segment(mid,tip,thickness*.55);
  }
  anchors.push({x:tip.x,y:tip.y,z:tip.z,angle,reach:length});
 }
 if(wood){wood.count=segmentIndex;wood.instanceMatrix.needsUpdate=true;tree.add(wood)}
 else{branchGeom.dispose();bark.dispose()}

 if(spraysCount){
  const greens=['#406a48','#365e42','#51774c','#456d43','#597953','#3b644b'];
  const needleGeom=makePineNeedleSprayGeometry(T);
  const needleMat=new T.MeshStandardMaterial({color:'#ffffff',roughness:.98,metalness:0,side:T.DoubleSide});
  const shoots=new T.InstancedMesh(needleGeom,needleMat,spraysCount);
  shoots.name='pine-extra-real-needles';shoots.castShadow=false;shoots.receiveShadow=true;
  const stem=new T.Vector3(),angles=new T.Euler();
  for(let i=0;i<spraysCount;i++){
   const a=anchors[i%anchors.length];
   const fraction=.62+rng()*.32,tangent=(rng()-.5)*crownRadius*.15;
   stem.set(a.x*fraction-Math.sin(a.angle)*tangent,
    clamp(a.y+(rng()-.5)*height*.06,base*.93,height*.99),
    a.z*fraction+Math.cos(a.angle)*tangent);
   dummy.position.copy(stem);
   angles.set((rng()-.5)*.72,a.angle+(rng()-.5)*1.9,(rng()-.5)*.60,'YXZ');
   dummy.quaternion.setFromEuler(angles);
   const spread=clamp((.66+rng()*.28)*(height/14)**.16,.36,1.2);
   dummy.scale.set(spread,spread,spread);dummy.updateMatrix();
   shoots.setMatrixAt(i,dummy.matrix);
   shoots.setColorAt(i,new T.Color(greens[Math.floor(rng()*greens.length)]));
  }
  shoots.instanceMatrix.needsUpdate=true;
  if(shoots.instanceColor)shoots.instanceColor.needsUpdate=true;
  tree.add(shoots);
 }
 tree.userData.pineExtraBranches=branchCount;
 tree.userData.pineExtraNeedleClusters=spraysCount;
 tree.userData.pineGrowth={...growth};
 return tree;
}
