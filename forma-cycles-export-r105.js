// FORMA R105: package a local Cycles job without uploading the scene.
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {zipSync,strToU8} from 'three/addons/libs/fflate.module.js';
export const CYclesPresets={draft:{width:1280,samples:32,bounces:4},standard:{width:1920,samples:128,bounces:6},high:{width:2560,samples:256,bounces:8},ultra:{width:3840,samples:512,bounces:12}};
export async function exportCyclesJob(T,{scene,root,camera,quality='high',device='AUTO',onProgress=()=>{}}){
 const preset=CYclesPresets[quality]||CYclesPresets.high;
 const exportScene=new T.Scene(),batches=[],materials=[],warnings=[];
 scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
 const M=new T.Matrix4(),W=new T.Matrix4(),v=new T.Vector3(),q=new T.Quaternion(),scale=new T.Vector3(),color=new T.Color();
 const skip=o=>o.userData?.selectionProxy||o.userData?.formaWeatherPreview||/selection|preview.*cursor|brush|gizmo|underlay|proxy/i.test(o.name);
 let id=0,instances=0;
 function copyMat(m){const c=m.clone();c.onBeforeCompile=()=>{};c.customProgramCacheKey=()=>'';materials.push(c);return c}
 function visit(o){
  if(!o.visible||skip(o))return;
  if(o.isLOD&&/fir-spatial-lod/.test(o.name)){
   const levels=o.levels;
   // Preserve positions; select a consistent geometry level rather than camera LOD.
   const selected=levels[quality==='ultra'?0:quality==='high'?1:2]?.object;
   if(selected)for(const child of selected.children)visit(child);
   return;
  }
  if(o.isMesh&&o.geometry?.attributes.position){
   if(o.isSkinnedMesh){warnings.push('Animated skinned mesh skipped: '+o.name);}
   else {
    const name='FORMA_'+String(++id).padStart(6,'0'),mat=Array.isArray(o.material)?o.material.map(copyMat):copyMat(o.material);
    const mesh=new T.Mesh(o.geometry,mat);mesh.name=name;mesh.matrixAutoUpdate=false;
    if(o.isInstancedMesh){
     const data=[],sum=[0,0,0];
     for(let i=0;i<o.count;i++){
      o.getMatrixAt(i,M);W.multiplyMatrices(o.matrixWorld,M);W.decompose(v,q,scale);
      color.setRGB(1,1,1);if(o.instanceColor)o.getColorAt(i,color);
      data.push(...[v.x,v.y,v.z,q.x,q.y,q.z,q.w,scale.x,scale.y,scale.z,color.r,color.g,color.b].map(x=>Math.round(x*1e6)/1e6));
      sum[0]+=color.r;sum[1]+=color.g;sum[2]+=color.b;
     }
     if(o.count){batches.push({name,data,tint:sum.map(x=>x/o.count)});instances+=o.count;exportScene.add(mesh)}
    }else{mesh.matrix.copy(o.matrixWorld);exportScene.add(mesh)}
   }
  }
  for(const ch of o.children)visit(ch);
 }
 visit(root);exportScene.updateMatrixWorld(true);
 const lights=[];let sun=null;
 scene.traverseVisible(o=>{
  if(!o.isDirectionalLight&&!o.isPointLight&&!o.isSpotLight&&!o.isRectAreaLight)return;
  const position=o.getWorldPosition(new T.Vector3()),direction=o.target?o.target.getWorldPosition(new T.Vector3()).sub(position).normalize():o.getWorldDirection(new T.Vector3()).negate();
  const type=o.isDirectionalLight?'SUN':o.isSpotLight?'SPOT':o.isRectAreaLight?'AREA':'POINT';
  const row={name:o.name||'FORMA light',type,position:position.toArray(),direction:direction.toArray(),color:o.color.toArray(),energy:Math.max(0,o.intensity),angle:(o.angle||.45)*2,width:o.width,height:o.height};
  lights.push(row);if(o.name==='sun')sun={energy:row.energy,direction:direction.clone().negate().toArray()};
 });
 const aspect=camera.isOrthographicCamera?(camera.right-camera.left)/(camera.top-camera.bottom):camera.aspect||16/9;
 const height=Math.max(2,Math.round(preset.width/aspect/2)*2);
 const job={version:105,device,render:{...preset,height},camera:{position:camera.getWorldPosition(new T.Vector3()).toArray(),quaternion:camera.getWorldQuaternion(new T.Quaternion()).toArray(),fov:camera.getEffectiveFOV?.()||45,near:camera.near,far:camera.far,ortho:!!camera.isOrthographicCamera,orthoWidth:camera.isOrthographicCamera?(camera.right-camera.left)/camera.zoom:0},sun,lights,batches,warnings};
 try{
  onProgress('Экспорт геометрии и текстур: '+instances+' инстансов…');
  const glb=await new GLTFExporter().parseAsync(exportScene,{binary:true,onlyVisible:true,maxTextureSize:quality==='ultra'?4096:2048});
  const response=await fetch(new URL('./forma-cycles-r105.py',import.meta.url));if(!response.ok)throw Error('Скрипт Cycles недоступен: '+response.status);
  const script=await response.text();
  const bat='@echo off\r\ncd /d "%~dp0"\r\nset "BLENDER=blender.exe"\r\nwhere blender.exe >nul 2>nul\r\nif errorlevel 1 (\r\n for /d %%D in ("%ProgramFiles%\\Blender Foundation\\Blender*") do if exist "%%~fD\\blender.exe" set "BLENDER=%%~fD\\blender.exe"\r\n)\r\n"%BLENDER%" --background --factory-startup --python-exit-code 1 --python "%~dp0forma-cycles-r105.py"\r\nif errorlevel 1 echo Render failed. Check console and Blender installation.\r\npause\r\n';
  const readme='FORMA Cycles R105 - experimental local render.\nInstall Blender 4.5 LTS or newer from https://www.blender.org/download/. Extract ALL files into one folder. Windows: run RENDER-WINDOWS.bat. macOS/Linux: blender --background --factory-startup --python-exit-code 1 --python forma-cycles-r105.py. Output: FORMA-render.png, FORMA-scene.blend. No upload or paid API. GPU auto detection, CPU fallback. Initial bridge: static meshes, average instance tint, reconstructed sky; custom WebGL shaders, animation, some materials and skinned meshes are not fully reproduced. Check console for GPU backend and errors.\n';
  onProgress('Упаковка локального проекта…');
  const zip=zipSync({'scene.glb':new Uint8Array(glb),'job.json':strToU8(JSON.stringify(job)),'forma-cycles-r105.py':strToU8(script),'RENDER-WINDOWS.bat':strToU8(bat),'README.txt':strToU8(readme)},{level:1});
  const url=URL.createObjectURL(new Blob([zip],{type:'application/zip'})),a=document.createElement('a');a.href=url;a.download='FORMA-Cycles-R105.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
  return {instances,meshes:id,warnings};
 }finally{for(const m of materials)m.dispose()}
}
