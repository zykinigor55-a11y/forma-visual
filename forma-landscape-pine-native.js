/* FORMA · native GLB pine sculptor.
 * Change the tree's OWN needles/branches BufferGeometry in-place.
 * Triangles are transplanted from lower-middle native branch clusters to
 * lower parts of the same tree, preserving source UVs, vertex colors,
 * KTX2 albedo, normals and the exact original glTF PBR materials.
 * No separately-colored foliage cards, billboards or second tree is added.
 */
import {normalizePineGrowth} from './forma-landscape-pine-growth.js';

const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
function category(mesh){
 const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
 if(materials.some(m=>/pine_needles/i.test(m?.name||'')))return 'needles';
 // Deadwood is naturally sparse and sometimes heavily tinted in the source;
 // keep it exactly as authored, and extend only living bark-covered branches.
 if(materials.some(m=>/pine_deadwood/i.test(m?.name||'')))return '';
 if(materials.some(m=>/pine_branch/i.test(m?.name||'')))return 'branches';
 if(/needles/i.test(mesh.name))return 'needles';
 if(/branches/i.test(mesh.name))return 'branches';
 return '';
}
function readComponent(attribute,index,component){
 if(component===0)return attribute.getX(index);
 if(component===1)return attribute.getY(index);
 if(component===2)return attribute.getZ(index);
 if(component===3)return attribute.getW(index);
 return attribute.array[index*attribute.itemSize+component];
}
export function nativePineProfile(growth){
 const p=normalizePineGrowth(growth);
 const mature=clamp((p.age-7)/63,0,1);
 // Solitary trees naturally retain lower whorls. Forest trees shed more of
 // their lowest branches; all growth is still taken from the native model.
 const type=p.pineType;
 // A mature 14m Scots pine cannot have only three sparse needle tiers.
 // Redistribute *native* UV-mapped branch and needle triangles, never add a
 // second tree. Mature solitary specimens keep broad low crowns; forest
 // specimens shed more lower branches; garden trees carry one extra whorl.
 const count=p.age<=9?0:p.age<20?1:p.age<35?2:p.age<75?3:4;
 const copies=type==='forest'?Math.max(0,count-1):
  type==='garden'?Math.min(4,count+1):count;
 return {
  copies,
  crownStart:type==='forest'?.46:type==='garden'?.20:.30,
  foliageWidth:type==='forest'?.84:type==='garden'?1.13:1.04,
  maturity:mature,
  type
 };
}
function nativeSection(T,original,categoryName,profile){
 if(!original?.getAttribute?.('position')||profile.copies<=0)return null;
 const expanded=original.index?original.toNonIndexed():original.clone();
 const pos=expanded.getAttribute('position');
 if(!pos||pos.count<6)return null;
 expanded.computeBoundingBox();
 const bounds=expanded.boundingBox;
 const lo=bounds.min.y,range=bounds.max.y-lo;
 if(!(range>.0001)){expanded.dispose();return null}
 // Native branch and needle triangles are selected above the lowest exposed
 // trunk and redistributed DOWNWARDS; none are invented or recolored.
 const band=categoryName==='needles'?[.47,.80]:[.40,.74];
 const selected=[];
 for(let i=0;i<pos.count-2;i+=3){
  const center=(pos.getY(i)+pos.getY(i+1)+pos.getY(i+2))/3;
  const t=(center-lo)/range;
  if(t>=band[0]&&t<=band[1])selected.push(i);
 }
 const maxTriangles=categoryName==='needles'?4200:2200;
 const stride=Math.max(1,Math.ceil(selected.length/maxTriangles));
 const triangles=selected.filter((_,i)=>i%stride===0);
 if(triangles.length===0){expanded.dispose();return null}
 const additions=triangles.length*3*profile.copies;
 const attrs=Object.entries(expanded.attributes);
 const total=pos.count+additions;
 const data={};
 for(const [name,attribute] of attrs){
  const out=new Float32Array(total*attribute.itemSize);
  for(let i=0;i<pos.count;i++){
   for(let c=0;c<attribute.itemSize;c++)out[i*attribute.itemSize+c]=readComponent(attribute,i,c);
  }
  data[name]={out,itemSize:attribute.itemSize};
 }
 let dst=pos.count;
 for(let k=0;k<profile.copies;k++){
  const angle=(k+1)*2.09439510239+.23;
  const cos=Math.cos(angle),sin=Math.sin(angle);
  const down=(.105+k*.070)*range;
  const width=profile.foliageWidth*(.92+k*.02);
  for(const tri of triangles){
   for(let v=0;v<3;v++,dst++){
    const from=tri+v;
    for(const [name,attribute] of attrs){
     const {out,itemSize}=data[name],idx=dst*itemSize;
     for(let c=0;c<itemSize;c++)out[idx+c]=readComponent(attribute,from,c);
     if(name==='position'){
      const x=readComponent(attribute,from,0),y=readComponent(attribute,from,1),z=readComponent(attribute,from,2);
      out[idx]=(x*cos-z*sin)*width;
      out[idx+1]=y-down;
      out[idx+2]=(x*sin+z*cos)*width;
     }else if((name==='normal'||name==='tangent')&&itemSize>=3){
      const x=readComponent(attribute,from,0),z=readComponent(attribute,from,2);
      out[idx]=x*cos-z*sin;out[idx+2]=x*sin+z*cos;
     }
    }
   }
  }
 }
 const next=new T.BufferGeometry();
 for(const [name,{out,itemSize}] of Object.entries(data)){
  next.setAttribute(name,new T.BufferAttribute(out,itemSize,false));
 }
 // BufferGeometry.toNonIndexed() retains native glTF material groups, but
 // a new BufferGeometry has none. Without transferring them, a mesh with
 // multiple glTF materials loses its needles/branch patches when edited.
 // Preserve every source range and tag transplanted triangles with the
 // material index of their original native triangle.
 if(expanded.groups?.length){
  for(const group of expanded.groups){
   next.addGroup(group.start,group.count,group.materialIndex);
  }
  const materialOf=triangle=>{
   const match=expanded.groups.find(group=>
    triangle>=group.start&&triangle<group.start+group.count);
   return match?.materialIndex??0;
  };
  let offset=pos.count;
  for(let k=0;k<profile.copies;k++){
   let runStart=offset,runCount=0,activeMaterial=null;
   for(const triangle of triangles){
    const currentMaterial=materialOf(triangle);
    if(runCount&&currentMaterial!==activeMaterial){
     next.addGroup(runStart,runCount,activeMaterial);
     runStart+=runCount;
     runCount=0;
    }
    activeMaterial=currentMaterial;
    runCount+=3;
   }
   if(runCount)next.addGroup(runStart,runCount,activeMaterial);
   offset+=triangles.length*3;
  }
 }
 next.computeBoundingBox();next.computeBoundingSphere();
 expanded.dispose();
 return next;
}
export function reshapeNativePine(T,tree,growth){
 const profile=nativePineProfile(growth);
 if(!tree?.isObject3D)return {changed:0,copies:0};
 let changed=0;
 tree.traverse(mesh=>{
  if(!mesh.isMesh)return;
  const kind=category(mesh);
  if(!kind)return; // keep original trunk EXACTLY unchanged
  const replacement=nativeSection(T,mesh.geometry,kind,profile);
  if(!replacement)return;
  // This is the SAME native mesh and the SAME material. Only positions,
  // normals and triangle count of its buffer geometry change.
  mesh.geometry=replacement;
  mesh.userData.bundledSharedGeometry=false;
  mesh.userData.pineNativeSculpted=true;
  changed++;
 });
 tree.userData.pineNativeProfile={...profile,editedMeshes:changed};
 return {changed,copies:profile.copies};
}
