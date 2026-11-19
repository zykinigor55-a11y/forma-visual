/* FORMA | Native Tilia cordata (licensed CC0 Innerscene GLB) optimization.
 * The original model has 622 separate, grey/brown bark objects plus three
 * foliage parts. Combine bark parts once, preserving every polygon and normal,
 * without touching or reprojecting the approved source GLB. Since bark has
 * POSITION/NORMAL but NO UVs, a world-space procedural PBR shading pattern
 * is used, not a stretched 2D bark decal.
 */
const optimized=new WeakMap();
export function optimizeNativeLinden(T,original){
 if(!original?.isObject3D)return original;
 if(optimized.has(original))return optimized.get(original);
 const root=original.clone(true);
 root.updateMatrixWorld(true);
 const inverse=root.matrixWorld.clone().invert();
 const bark=[];
 root.traverse(node=>{
  if(!node.isMesh||!node.geometry?.getAttribute)return;
  const materials=Array.isArray(node.material)?node.material:[node.material];
  if(materials.length===1&&String(materials[0]?.name||'').toLowerCase()==='bark'){
   bark.push(node);
  }
 });
 if(bark.length<40){optimized.set(original,root);return root;}
 // Keep source branch transforms and geometry pristine. Transform all bark
 // vertices into the GLB root coordinate frame, then merge draw calls.
 const geos=[],matrices=[];
 let totalVertices=0,totalIndices=0;
 for(const node of bark){
  const geom=node.geometry;
  const pos=geom.getAttribute('position'),normal=geom.getAttribute('normal');
  if(!pos||!normal||pos.count!==normal.count){optimized.set(original,root);return root;}
  const transform=new T.Matrix4().multiplyMatrices(inverse,node.matrixWorld);
  const transformed=geom.clone();
  transformed.applyMatrix4(transform);
  geos.push(transformed);
  totalVertices+=pos.count;
  totalIndices+=geom.getIndex()?.count||pos.count;
 }
 const posArray=new Float32Array(totalVertices*3),normalArray=new Float32Array(totalVertices*3);
 const indexArray=totalVertices>65535?new Uint32Array(totalIndices):new Uint16Array(totalIndices);
 let vertexOffset=0,indexOffset=0;
 for(const geom of geos){
  const pos=geom.getAttribute('position'),normal=geom.getAttribute('normal'),idx=geom.getIndex();
  for(let i=0;i<pos.count;i++){
   const k=(vertexOffset+i)*3;
   posArray[k]=pos.getX(i);posArray[k+1]=pos.getY(i);posArray[k+2]=pos.getZ(i);
   normalArray[k]=normal.getX(i);normalArray[k+1]=normal.getY(i);normalArray[k+2]=normal.getZ(i);
  }
  if(idx){
   for(let i=0;i<idx.count;i++)indexArray[indexOffset+i]=idx.getX(i)+vertexOffset;
   indexOffset+=idx.count;
  }else{
   for(let i=0;i<pos.count;i++)indexArray[indexOffset+i]=i+vertexOffset;
   indexOffset+=pos.count;
  }
  vertexOffset+=pos.count;
  geom.dispose();
 }
 const merged=new T.BufferGeometry();
 merged.setAttribute('position',new T.BufferAttribute(posArray,3));
 merged.setAttribute('normal',new T.BufferAttribute(normalArray,3));
 merged.setIndex(new T.BufferAttribute(indexArray,1));
 merged.computeBoundingBox();merged.computeBoundingSphere();
 const barkMaterial=bark[0].material;
 for(const mesh of bark)mesh.parent?.remove(mesh);
 const trunk=new T.Mesh(merged,barkMaterial);
 trunk.name='Tilia-cordata-native-merged-bark';
 trunk.castShadow=true;trunk.receiveShadow=true;
 trunk.userData={lindenOriginalBarkMeshes:bark.length,bundledSharedGeometry:true};
 root.add(trunk);
 root.userData={...root.userData,lindenNativePbr:{
  originalBarkMeshes:bark.length,mergedBarkMeshes:1,triangles:indexArray.length/3
 }};
 optimized.set(original,root);
 return root;
}
export function enhanceLindenBark(T,material){
 if(!material||material.userData?.formaLindenBark)return material;
 material.userData={...material.userData,formaLindenBark:true};
 if(material.color?.setRGB)material.color.setRGB(.36,.33,.30);
 material.roughness=Math.max(.86,Number(material.roughness)||0);
 material.metalness=0;
 const original=material.onBeforeCompile;
 material.onBeforeCompile=function(shader,...args){
  if(typeof original==='function')original.call(this,shader,...args);
  const vertexHeader='#include <common>';
  const vertexAnchor='#include <worldpos_vertex>';
  const fragmentHeader='#include <common>';
  const fragmentAnchor='#include <color_fragment>';
  if(!shader.vertexShader?.includes(vertexAnchor)||!shader.fragmentShader?.includes(fragmentAnchor))return;
  shader.vertexShader=shader.vertexShader.replace(vertexHeader,vertexHeader+'\nvarying vec3 vFormaLindenWorld;');
  shader.vertexShader=shader.vertexShader.replace(vertexAnchor,vertexAnchor+'\nvFormaLindenWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
  shader.fragmentShader=shader.fragmentShader.replace(fragmentHeader,fragmentHeader+'\nvarying vec3 vFormaLindenWorld;');
  shader.fragmentShader=shader.fragmentShader.replace(fragmentAnchor,fragmentAnchor+`
    // Closely spaced elongated lenticels/fissures of weathered linden bark.
    float wave=sin(vFormaLindenWorld.x*13.4+vFormaLindenWorld.z*18.1+
     .34*sin(vFormaLindenWorld.y*5.3));
    float fissure=pow(1.0-abs(wave),8.0);
    float grain=.5+.5*sin(vFormaLindenWorld.y*27.0+
     vFormaLindenWorld.x*41.3+vFormaLindenWorld.z*32.5);
    float barkTone=clamp(1.02+.12*wave-.40*fissure+.07*(grain-.5),.59,1.17);
    diffuseColor.rgb*=barkTone;
  `);
 };
 material.customProgramCacheKey=()=> 'forma-linden-native-bark-v1';
 material.needsUpdate=true;
 return material;
}
