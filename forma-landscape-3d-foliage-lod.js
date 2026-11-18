/* FORMA botanical detail budget, screen-space transitions and 3 LODs.
 * No billboard swaps near the camera: close foliage uses genuine curved
 * leaf/needle triangles. Low-detail texture sprays only appear at distance.
 * Object identity, root coordinates and measured plant height NEVER change.
 */
export const BOTANICAL_QUALITY=Object.freeze({
 speed:{label:'Быстрый',qualityScale:.56,nearPixels:9999,farPixels:98},
 standard:{label:'Стандарт',qualityScale:1,nearPixels:175,farPixels:65},
 premium:{label:'Премиум · фотореализм',qualityScale:1,nearPixels:85,farPixels:38}
});
const BANDS=Object.freeze(['near','middle','far']);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function normalizeBotanicalQuality(value){
 const map={auto:'standard',high:'premium',speed:'speed',standard:'standard',premium:'premium'};
 return map[value]||'standard';
}
export function projectedPlantPixels(height,distance,camera,viewportHeight=900){
 const h=clamp(Number(height)||1,.15,50);
 const d=Math.max(.15,Number(distance)||1);
 const pixels=Math.max(100,Number(viewportHeight)||900);
 if(camera?.isOrthographicCamera){
  return h*pixels/Math.max(.01,Math.abs(Number(camera.top)-Number(camera.bottom)));
 }
 const fov=clamp(Number(camera?.fov)||50,5,150)*Math.PI/180;
 return h*pixels/(2*d*Math.tan(fov*.5));
}
export function pickBotanicalLod({pixelHeight=0,mode='standard',previous=null,hysteresis=.12}={}){
 const m=BOTANICAL_QUALITY[normalizeBotanicalQuality(mode)];
 const p=Math.max(0,Number(pixelHeight)||0);
 const margin=clamp(Number(hysteresis)||0,0,.25);
 if(previous==='near'&&p>m.nearPixels*(1-margin))return 'near';
 if(previous==='middle'){
  if(p>m.nearPixels*(1+margin))return 'near';
  if(p<m.farPixels*(1-margin))return 'far';
  return 'middle';
 }
 if(previous==='far'&&p<m.farPixels*(1+margin))return 'far';
 return p>=m.nearPixels?'near':p>=m.farPixels?'middle':'far';
}
export function setFoliageTier(group,tier){
 if(!group?.userData?.botanicalLod)return null;
 const next=BANDS.includes(tier)?tier:'middle';
 if(group.userData.botanicalCurrentLod===next)return next;
 group.traverse(node=>{
  if(!node.isMesh||!node.userData?.botanicalLayer)return;
  const layer=node.userData.botanicalLayer;
  // Near: fine actual 3D leaf/needle geometry, volumetric terminal sprouts,
  // no crossed alpha cards. Middle: 3D volume + a restrained alpha silhouette.
  // Far: lightweight alpha clusters; keep physical trunk and branches visible.
  // Mid-distance deliberately keeps a partial silhouette on TOP of the
  // real 3D branch-anchored foliage. Previous code hid all spray geometry in
  // mid LOD then revealed it abruptly in far LOD, causing crown popping.
  node.visible=layer==='branches'||
   (layer==='micro'&&next==='near')||
   (layer==='volume'&&(next==='near'||next==='middle'))||
   (layer==='sprays'&&(next==='far'||next==='middle'||
    (next==='near'&&!group.userData.botanicalHasVolume&&!group.userData.botanicalHasMicro)));
  const original=node.userData.botanicalOriginalCount;
  if(node.isInstancedMesh&&Number.isInteger(original)){
   // The far crown keeps its botanical silhouette; only real expensive
   // volume/microgeometry loses instances as the plant gets smaller on screen.
   const factor=layer==='branches'?1:
    layer==='sprays'?(next==='middle'?.30:next==='far'?.82:1):
    next==='near'?1:next==='middle'?.74:.40;
   node.count=Math.max(1,Math.min(original,Math.round(original*factor)));
  }
 });
 group.userData.botanicalCurrentLod=next;
 return next;
}
export function enableBotanicalLod(group,mode='standard'){
 group.userData.botanicalLod=true;
 group.userData.botanicalMode=normalizeBotanicalQuality(mode);
 group.userData.botanicalHasVolume=false;group.userData.botanicalHasMicro=false;
 group.traverse(node=>{
  if(node.userData?.botanicalLayer==='volume')group.userData.botanicalHasVolume=true;
  if(node.userData?.botanicalLayer==='micro')group.userData.botanicalHasMicro=true;
  if(node.isInstancedMesh&&node.userData.botanicalLayer)
   node.userData.botanicalOriginalCount=node.count;
 });
 return setFoliageTier(group,'middle');
}
export function updateBotanicalLod(group,camera,viewportHeight=900,forceMode=null){
 if(!group?.userData?.botanicalLod||!camera)return null;
 const T=group.position;
 // Scene object group already stores world matrix and matrixWorld position;
 // Three.Vector3 is not required as a new allocation per visible plant.
 const e=group.matrixWorld?.elements;
 const x=e?e[12]:T.x,y=e?e[13]:T.y,z=e?e[14]:T.z;
 const dx=x-camera.position.x,dy=y-camera.position.y,dz=z-camera.position.z;
 const distance=Math.hypot(dx,dy,dz);
 const pixels=projectedPlantPixels(group.userData.physicalHeight,distance,camera,viewportHeight);
 const mode=forceMode||group.userData.botanicalMode;
 const tier=pickBotanicalLod({pixelHeight:pixels,mode,previous:group.userData.botanicalCurrentLod});
 return setFoliageTier(group,tier);
}
