/* FORMA | Native botanical 3D understory, replacing prefabricated plant GLBs.
 * Fronds, creeping stems, petioles and leaflets are genuine Three.js geometry.
 * Geometric measurements come from the scene instance, never the old imported
 * asset. Every species has a deterministic seed and physically rooted stems.
 */
import {foliageMaterial,normalizeFoliagePalette} from './forma-landscape-3d-plant-materials.js';
import {enableBotanicalLod} from './forma-landscape-3d-foliage-lod.js';

export const NATIVE_UNDERSTORY=Object.freeze({
 fern:{latin:'Dryopteris filix-mas',form:'fronds',stems:22,leaves:24,height:.85,diameter:1.2},
 periwinkle:{latin:'Vinca minor',form:'creeping',stems:32,leaves:8,height:.24,diameter:1.1},
 hosta:{latin:'Hosta plantaginea',form:'basal',stems:27,leaves:3,height:.60,diameter:1.3},
 'ornamental-grass':{latin:'Miscanthus sinensis',form:'grass',stems:100,leaves:4,height:1.3,diameter:1.5},
 'wild-shrub':{latin:'Mixed native deciduous undergrowth',form:'woodland',stems:48,leaves:13,height:1.6,diameter:1.9}
});
export const nativeUnderstoryIds=Object.freeze(Object.keys(NATIVE_UNDERSTORY));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function random(seed){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}}
/** Fern frond: real pinnate geometry with opposing tapered leaflets.
 * Replaces oversized solid leaf paddles, without changing species catalog.
 * Each frond is one mesh instance attached to a grounded curved stalk. */
function fernPinnaeGeometry(T){
 const verts=[];
 const tri=(a,b,c)=>verts.push(...a,...b,...c);
 for(let n=0;n<19;n++){
  const t=(n+.65)/20,baseY=t-.12;
  const spread=.32*Math.pow(Math.max(0,Math.sin(Math.PI*t)),.83);
  for(const side of [-1,1]){
   const turn=side*spread,curve=.14*Math.sin(Math.PI*t);
   const origin=[0,baseY,curve*.52];
   const inner=[turn*.38,baseY+.025,curve+.02];
   const tip=[turn,baseY+.072,curve+.065*Math.sin(n*.9)];
   const back=[turn*.57,baseY+.11,curve+.02];
   // Two faceted segments give a real tapered pinna with no alpha card.
   tri(origin,inner,back);tri(inner,tip,back);
  }
 }
 const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));
 geo.computeVertexNormals();
 return geo;
}
function curvedLeaf(T,form){
 // 8 genuine triangles in 3D with a slight midrib fold and a tapered tip.
 // The leaf does not rotate to face the camera (no billboard).
 const points=[],uv=[],indices=[];
 // Natural fern pinnae and woodland leaflets are narrow, not plastic paddles.
 const narrow=form==='grass'?.068:form==='fronds'?.115:form==='creeping'?.39:form==='basal'?.74:.255;
 if(form==='fronds')return fernPinnaeGeometry(T);
 const segments=form==='grass'?8:6;
 for(let j=0;j<=segments;j++){
  const t=j/segments,w=narrow*Math.pow(Math.sin(Math.PI*t),form==='basal'?.60:.76);
  const y=t-.15,arch=Math.sin(t*Math.PI)*.13;
  for(const side of [-1,0,1]){
   points.push(side*w,y,arch+(side===0?.08*Math.sin(Math.PI*t):0));
   uv.push((side+1)/2,t);
  }
 }
 for(let k=0;k<segments;k++)for(let side=0;side<2;side++){
  const a=k*3+side,b=a+3;
  indices.push(a,b,a+1,b,b+1,a+1);
 }
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(points,3));
 g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 g.setIndex(indices);g.computeVertexNormals();
 return g;
}
function twigSegments(T,segments,id){
 const group=new T.Group();
 if(!segments.length)return group;
 const geometry=new T.CylinderGeometry(.60,1,1,6,1);
 const bark=new T.MeshStandardMaterial({color:id==='fern'?'#667151':id==='ornamental-grass'?'#a7a479':'#625b44',roughness:.94});
 const mesh=new T.InstancedMesh(geometry,bark,segments.length),dummy=new T.Object3D(),
  v=new T.Vector3(),w=new T.Vector3(),up=new T.Vector3(0,1,0);
 segments.forEach(([a,b,thick],i)=>{
  v.set(...a);w.set(...b);const delta=w.clone().sub(v),length=delta.length();
  dummy.position.copy(v).addScaledVector(delta,.5);dummy.quaternion.setFromUnitVectors(up,delta.normalize());
  dummy.scale.set(Math.max(.002,thick),length,Math.max(.002,thick));dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
 });
 mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;
 mesh.userData.botanicalLayer='branches';group.add(mesh);return group;
}
function buildLeaves(T,items,id,form,season,quality){
 const g=new T.Group();if(!items.length)return g;
 const profile=normalizeFoliagePalette(id,season);
 const palette=new T.Color(profile.shade),sun=new T.Color(profile.sunlit);
 const geometry=curvedLeaf(T,form);
 const material=foliageMaterial(T,id),randomHue=random(hash(id+'|'+season));
 const make=(layer,step,relative)=>{
  const list=items.filter((_,i)=>i%step===0);
  if(!list.length)return;
  const mesh=new T.InstancedMesh(geometry,material.clone(),list.length),d=new T.Object3D();
  list.forEach((p,i)=>{
   d.position.set(form==='fronds'?p.x*.82:p.x,form==='fronds'?p.y-p.size*.40:p.y,form==='fronds'?p.z*.82:p.z);
    d.rotation.set(p.pitch,p.yaw,p.roll);
   d.scale.set(p.size*relative,p.size*relative*(form==='grass'?2.6:1),p.size*relative);
   d.updateMatrix();mesh.setMatrixAt(i,d.matrix);
   const color=palette.clone().lerp(sun,.15+randomHue()*.8);
   if(profile.fall){const alt=profile.fall[Math.floor(randomHue()*profile.fall.length)];
    color.lerp(new T.Color(alt),.58+randomHue()*.34)}
   mesh.setColorAt(i,color);
  });
  mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  mesh.castShadow=layer==='micro'||layer==='volume';
  mesh.userData.botanicalLayer=layer;mesh.frustumCulled=false;g.add(mesh);
 };
 make('micro',1,1);make('volume',2,.95);make('sprays',4,1.15);
 return g;
}
export function createNativeUnderstory(T,instance,{season='summer',quality=1,mode='standard'}={}){
 const id=instance.catalogId,spec=NATIVE_UNDERSTORY[id];if(!spec)throw Error('Unknown native 3D plant '+id);
 const height=clamp(Number(instance.height)||spec.height,.12,4),diameter=clamp(Number(instance.diameter)||spec.diameter,.2,10);
 const radius=diameter/2,r=random(hash(String(instance.id||id)+'|'+id+'|'+String(instance.variant||1)));
 const stems=[],leaves=[],shoots=Math.max(8,Math.round(spec.stems*Math.max(.36,Math.min(1,quality))));
 const rootRadius=id==='ornamental-grass'?.18:id==='fern'?.1:id==='hosta'?.15:.23;
 const winter=season==='winter'&&id!=='periwinkle';
 for(let j=0;j<shoots;j++){
  const az=j*2.399+(r()-.5)*.39,cs=Math.cos(az),sn=Math.sin(az);
  const reach=radius*(.54+r()*.40),form=spec.form;
  const aerial=form==='grass'?height*(.80+r()*.17):
   form==='creeping'?height*(.24+r()*.40):
   form==='fronds'?height*(.65+r()*.32):
   form==='basal'?height*(.74+r()*.24):height*(.52+r()*.43);
  const stemRadius=form==='grass'?.0025:form==='basal'?.006:form==='fronds'?.004:.009;
  let last=[cs*radius*rootRadius,.026,sn*radius*rootRadius];
  const steps=form==='fronds'?9:form==='creeping'?6:7;
  for(let k=1;k<=steps;k++){
   const t=k/steps,arc=Math.sin(t*Math.PI);
   const horiz=reach*(form==='creeping'?t:form==='grass'?t*.68:form==='basal'?t*.76:t);
   const vertical=form==='creeping'?aerial*(.5+.35*arc):
    form==='fronds'?aerial*(t+.12*arc):
    aerial*(t+.05*arc);
   const p=[cs*horiz,Math.max(.025,vertical),sn*horiz];
   stems.push([last,p,Math.max(.002,stemRadius*(1-.66*t))]);last=p;
   if(winter)continue;
   if(form==='fronds'&&k<steps)continue; // One pinnate frond per curved stem, not nine repeated paddles.
    const leavesPerStep=form==='fronds'?1:form==='grass'?1:form==='basal'?2:form==='creeping'?2:3;
   for(let l=0;l<leavesPerStep;l++){
    const side=l%2?-1:1;
    const spread=form==='fronds'?reach*.21*Math.sin(t*Math.PI):
     form==='basal'?reach*.16:form==='grass'?.025:reach*.10;
    const tx=-sn*spread*side,tz=cs*spread*side;
    const scale=form==='grass'?.18+height*.15:
     form==='basal'?.19+diameter*.14:
     form==='fronds'?height*(.55+r()*.13):
     form==='creeping'?.055+diameter*.06:
     .032+diameter*.025;
    leaves.push({x:clamp(p[0]+tx,-radius,radius),y:clamp(p[1]+.013,.025,height),
     z:clamp(p[2]+tz,-radius,radius),yaw:az+side*(.35+r()*.32),
     pitch:form==='fronds'?-0.26+r()*.38:r()*.3-.25,roll:form==='fronds'?.48+r()*.34:side*(.24+r()*.3),
     size:scale*(.68+r()*.47)});
   }
  }
 }
 const group=new T.Group();group.add(twigSegments(T,stems,id));
 group.add(buildLeaves(T,leaves,id,spec.form,season,quality));
 group.userData.species=id;group.userData.physicalHeight=height;
 group.userData.crownDiameter=diameter;group.userData.variant=instance.variant||1;
 group.userData.nativeUnderstory=true;enableBotanicalLod(group,mode);
 return group;
}
