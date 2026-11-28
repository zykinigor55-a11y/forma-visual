/* FORMA Visual 3D · true foliage snow feedback.
 * Edits ACTUAL needle/leaf instance colours and individual foliage-only PBR
 * materials. No free-floating white dots or replacement cartoon spheres.
 * Trunks, branches, plant positioning, crown scales and user geometry are
 * untouched; render-friendly in-place slider updates on Android.
 */
import {normalizeWeatherEffects,weatherEffectsVisible} from './forma-landscape-weather-effects.js';

const conifer=/pine|spruce|fir|thuja|juniper|cedar|cypress|hemlock|yew/i;
const foliage=/foliage|leaf|leaves|needle|spruce|pine_crown|green|branchleaves|frond|pine_leaf|canopy|crown|conifer|needles|pineleaf|spruceleaf|pinebranchlets/i;
const woody=/trunk|stem|bark|wood|twig|branch|root|bole/i;
const clamp=n=>Math.max(0,Math.min(1,n));
const noise=(i,seed)=>{let x=(i*1664525+seed*1013904223)>>>0;
 x^=x>>>16;x=Math.imul(x,2246822519);x^=x>>>13;
 return (x>>>0)/4294967295};
const hash=s=>{let h=2166136261>>>0;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
function isFoliage(mesh){
 const layer=String(mesh.userData?.botanicalLayer||'').toLowerCase();
 if(['micro','volume','sprays','leaves','foliage'].includes(layer))return true;
 if(['branches','bark','trunk'].includes(layer))return false;
 const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];
 const label=[mesh.name,...mats.map(m=>m?.name||''),...mats.map(m=>m?.map?.name||'')].join(' ').toLowerCase();
 if(woody.test(label)&&!foliage.test(label))return false;
 if(foliage.test(label))return true;
 if(mesh.userData?.isFoliage===true||mesh.userData?.formaLeaf===true)return true;
 return mats.some(m=>m&&(
  Number(m.alphaTest)>0.02||
  !!m.alphaMap||
  (m.transparent===true&&!!m.map)||
  (m.map&&/green|leaf|needle|foliage|crown|pine|spruce/i.test(m.map.name||''))||
  // Anonymous opaque GLB crown geometry often has green-tinted PBR material.
  (m.color&&m.color.g>m.color.r*1.13&&m.color.g>m.color.b*.91&&m.color.g>.06)
  ));
}
function detachMaterials(mesh,entries){
 const originals=Array.isArray(mesh.material)?mesh.material:[mesh.material],unique=new Map();
 const snowCopies=originals.map(original=>{
  if(!original||typeof original.clone!=='function')return original;
  let copy=unique.get(original);
  if(!copy){copy=original.clone();unique.set(original,copy)}
  return copy;
 });
 mesh.material=Array.isArray(mesh.material)?snowCopies:snowCopies[0];
 const mats=snowCopies.filter((m,i)=>m&&snowCopies.indexOf(m)===i);
 for(const m of mats){
  entries.push({kind:'material',target:m,
   color:m.color?.clone()||null,emissive:m.emissive?.clone()||null,
   emissiveIntensity:m.emissiveIntensity||0});
 }
}
export function attachTreeSnowPreview(T,group,plant,atmosphere){
 const species=String(plant?.catalogId||plant?.type||group?.userData?.species||'');
 if(!group||!group.traverse)return null;
 // R240 native deciduous branch snow, independently ranked instances.
 const branchSnow=[];group.traverse(n=>{if(n.isInstancedMesh&&n.userData?.formaBranchSnowR240)branchSnow.push(n);});
 if(branchSnow.length){const info={species,branchSnow,strength:-1};group.userData.formaSnowPreview=info;updateTreeSnowPreview(info,atmosphere);return info;}
 if(!conifer.test(species))return null;
 if(group.userData?.formaSnowPreview)return group.userData.formaSnowPreview;
 const entries=[],seed=hash(plant.id||species),white=new T.Color('#E7F0F2');
 let eligible=0;
 group.traverse(node=>{
  if(!node.isMesh||node.userData?.formaWeatherPreview||!isFoliage(node))return;
  eligible++;
  detachMaterials(node,entries);
  const color=node.instanceColor;
  if(node.isInstancedMesh&&color?.array?.length>=3){
   entries.push({kind:'instance',target:color,
    original:color.array.slice(),seed:seed+eligible*1597,
    count:Math.min(node.count||Math.floor(color.array.length/3),
      Math.floor(color.array.length/3))});
  }
 });
 // Some CC0 models have only generic Mesh_001 names and opaque foliage.
 // Fallback: snow-coat only broad, textured geometry, never slender trunks.
 if(!eligible){
  group.traverse(node=>{
   if(!node.isMesh||node.userData?.formaWeatherPreview||!node.material)return;
   const mats=Array.isArray(node.material)?node.material:[node.material];
   const label=[node.name,...mats.map(m=>m?.name||'')].join(' ').toLowerCase();
   if(woody.test(label)&&!foliage.test(label))return;
   const g=node.geometry;
   if(!g?.boundingBox&&typeof g?.computeBoundingBox==='function')g.computeBoundingBox();
   const box=g?.boundingBox;
   if(!box)return;
   const horizontal=Math.max(box.max.x-box.min.x,box.max.z-box.min.z);
   const vertical=Math.max(.001,box.max.y-box.min.y);
   const broadCanopy=horizontal>=vertical*.50;
   const textured=mats.some(m=>!!(m?.map||m?.alphaMap));
   if(!broadCanopy||!textured)return;
   eligible++;detachMaterials(node,entries);
   const color=node.instanceColor;
   if(node.isInstancedMesh&&color?.array?.length>=3){
    entries.push({kind:'instance',target:color,original:color.array.slice(),
     seed:seed+eligible*1597,count:Math.min(node.count||color.array.length/3,color.array.length/3)});
   }
  });
 }
 if(!eligible)return null;
 const hasInstanceColors=new Set();
 // Instance colours provide per-needle patchiness; avoid global white wash.
 if(entries.some(e=>e.kind==='instance'))
  for(const e of entries)if(e.kind==='material')hasInstanceColors.add(e.target);
 const info={species,seed,entries,eligibleMeshes:eligible,
  strength:-1,white,group,hasInstanceColors};
 group.userData.formaSnowPreview=info;
 updateTreeSnowPreview(info,atmosphere);
 return info;
}
export function updateTreeSnowPreview(info,atmosphere){
 if(!info)return false;
 const snow=weatherEffectsVisible(atmosphere).snow,
  effects=normalizeWeatherEffects(atmosphere?.effects);
 const strength=snow?clamp(effects.snowTrees/100):0;
 if(info.strength===strength)return false;
 info.strength=strength;
 if(info.branchSnow){for(const mesh of info.branchSnow){const max=mesh.userData.snowCapacityR240||0;mesh.count=Math.min(max,Math.round(max*strength));mesh.visible=mesh.count>0;}return true;}
 const white=info.white;
 for(const e of info.entries){
  if(e.kind==='material'){
   const mat=e.target;
   const lighten=(info.hasInstanceColors?.has(mat)?strength*.08:strength*.38);
   if(e.color&&mat.color){
    mat.color.copy(e.color).lerp(white,lighten);
   }
   // A faint PBR emissive component lifts photo-dark GLB needle maps.
   // Keep night-time snow softly lit, NEVER an electric white neon tree.
   if(e.emissive&&mat.emissive){
    mat.emissive.copy(e.emissive);
    mat.emissiveIntensity=e.emissiveIntensity;
   }
  }else if(e.kind==='instance'){
   const dst=e.target.array,src=e.original;
   for(let i=0;i<e.count;i++){
    const m=i*3,random=noise(i,e.seed);
    // 20% => roughly one fifth of real branchlet foliage gets snow.
    // 100% => nearly every foliage needle/leaf becomes white.
    // Selection never touches trunk or branch geometry.
    const coat=strength===0?0:clamp((strength-random+.10)*6);
    const amount=coat*(.28+.24*strength);
    dst[m]=src[m]+(white.r-src[m])*amount;
    dst[m+1]=src[m+1]+(white.g-src[m+1])*amount;
    dst[m+2]=src[m+2]+(white.b-src[m+2])*amount;
   }
   e.target.needsUpdate=true;
  }
 }
 return true;
}
export function refreshAllTreeSnowPreview(root,atmosphere){
 if(!root)return 0;
 let count=0;
 root.traverse?.(node=>{
  const preview=node.userData?.formaSnowPreview;
  if(preview&&updateTreeSnowPreview(preview,atmosphere))count++;
 });
 return count;
}
