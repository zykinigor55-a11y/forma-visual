/* Adaptive shadow-detail budget for heavy, imported 3D assets.
 * Preserve geometry, dimensions, materials and full-res appearance.
 * On phone-sized viewports, expensive glTF shadow casters are prioritized
 * by camera distance. Non-GLB geometry is never affected.
 */
export function applyRealModelShadowBudget(root,camera,{mobile=false,maxCasters=5}={}){
 if(!root||!camera?.position)return false;
 const groups=(root.children||[]).filter(g=>g.userData?.realGlb===true);
 const limit=mobile&&groups.length>maxCasters?Math.max(1,maxCasters):groups.length;
 const nearest=groups.map(group=>{
  const dx=(group.position?.x||0)-camera.position.x;
  const dy=(group.position?.y||0)-camera.position.y;
  const dz=(group.position?.z||0)-camera.position.z;
  return {group,dist:dx*dx+dy*dy+dz*dz};
 }).sort((a,b)=>a.dist-b.dist).slice(0,limit);
 const casting=new Set(nearest.map(x=>x.group));
 let changed=false;
 for(const group of groups){
  const enabled=casting.has(group);
  group.traverse(node=>{
   if(!node.isMesh)return;
   if(node.userData._formaAuthoredCastShadow===undefined)
    node.userData._formaAuthoredCastShadow=Boolean(node.castShadow);
   const target=node.userData._formaAuthoredCastShadow&&enabled;
   if(node.castShadow!==target){node.castShadow=target;changed=true}
  });
 }
 return changed;
}
