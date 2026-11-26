// FORMA Cycles R123: normalize procedural texture pixels before GLTF export.
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {zipSync,strToU8} from 'three/addons/libs/fflate.module.js';
export const CYclesPresets={draft:{width:1280,samples:32,bounces:4},standard:{width:1920,samples:128,bounces:6},high:{width:2560,samples:256,bounces:8},ultra:{width:3840,samples:1024,bounces:12}};
export async function exportCyclesJob(T,{scene,root,camera,quality='high',device='OPTIX',atmosphere={},exposure=0,onProgress=()=>{}}){
 const preset=CYclesPresets[quality]||CYclesPresets.high;
 const exportScene=new T.Scene(),batches=[],materials=[],objects=[],warnings=[];
 scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
 const M=new T.Matrix4(),W=new T.Matrix4(),v=new T.Vector3(),q=new T.Quaternion(),scale=new T.Vector3(),color=new T.Color();
 const skip=o=>o.userData?.selectionProxy||o.userData?.formaWeatherPreview||/selection|preview.*cursor|brush|gizmo|underlay|proxy/i.test(o.name);
 let id=0,instances=0;
 const textureCache=new Map(),exportTextures=[];
 // GLTFExporter combines metalness and roughness with drawImage. DataTexture
 // images are raw pixel buffers rather than drawable browser images.
 function exportTexture(t){
  if(!t?.isDataTexture)return t;
  if(textureCache.has(t))return textureCache.get(t);
  const {data,width,height}=t.image||{};
  if(!data||!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1)throw Error('Некорректная процедурная текстура: '+(t.name||t.uuid));
  const channels=t.format===T.RGBAFormat?4:t.format===T.RGBFormat?3:t.format===T.RGFormat?2:t.format===T.RedFormat?1:0;
  if(!channels||data.length!==width*height*channels)throw Error('Неподдерживаемый формат процедурной текстуры: '+(t.name||t.uuid));
  const byte=t.type===T.UnsignedByteType,flt=t.type===T.FloatType,half=t.type===T.HalfFloatType;
  if(!byte&&!flt&&!half)throw Error('Неподдерживаемый тип данных текстуры: '+(t.name||t.uuid));
  const value=n=>byte?n:Math.round(Math.max(0,Math.min(1,half?T.DataUtils.fromHalfFloat(n):n))*255);
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Не удалось создать холст для текстуры');
  const image=ctx.createImageData(width,height),out=image.data;
  for(let i=0,j=0;i<data.length;i+=channels,j+=4){
   out[j]=value(data[i]);out[j+1]=channels>1?value(data[i+1]):0;out[j+2]=channels>2?value(data[i+2]):0;out[j+3]=channels===4?value(data[i+3]):255;
  }
  ctx.putImageData(image,0,0);
  const c=new T.CanvasTexture(canvas);
  for(const k of ['name','mapping','channel','wrapS','wrapT','magFilter','minFilter','anisotropy','colorSpace','flipY','generateMipmaps','premultiplyAlpha','matrixAutoUpdate'])c[k]=t[k];
  c.offset.copy(t.offset);c.repeat.copy(t.repeat);c.center.copy(t.center);c.rotation=t.rotation;c.matrix.copy(t.matrix);
  c.needsUpdate=true;textureCache.set(t,c);exportTextures.push(c);return c;
 }
 function copyMat(m){const c=m.clone();materials.push(c);c.onBeforeCompile=()=>{};c.customProgramCacheKey=()=>'';for(const k of Object.keys(c))if(c[k]?.isDataTexture)c[k]=exportTexture(c[k]);return c}
 function visit(o,forced=false){
  if((!forced&&!o.visible)||skip(o))return;
  if(o.isLOD&&/fir-spatial-lod/.test(o.name)){
   const levels=o.levels;
   // Preserve positions; select a consistent geometry level rather than camera LOD.
   const selected=levels[quality==='ultra'?0:quality==='high'?1:2]?.object;
   if(selected)for(const child of selected.children)visit(child,true);
   return;
  }
  if(o.isMesh&&o.geometry?.attributes.position){
   if(o.isSkinnedMesh){warnings.push('Animated skinned mesh skipped: '+o.name);}
   else if((Array.isArray(o.material)?o.material:[o.material]).some(m=>!m?.isMeshStandardMaterial&&!m?.isMeshBasicMaterial)){warnings.push('Unsupported custom material: '+o.name);}
   else {
    const name='FORMA_'+String(++id).padStart(6,'0'),mat=Array.isArray(o.material)?o.material.map(copyMat):copyMat(o.material);
    const mesh=new T.Mesh(o.geometry,mat);mesh.name=name;mesh.matrixAutoUpdate=false;
    const sourceMat=Array.isArray(o.material)?o.material[0]:o.material;
    const semantic=(o.name+' '+(sourceMat.name||'')).toLowerCase();
    const kind=o.userData?.formaWater||/\bwater\b|pond|pool-water/.test(semantic)?'water':/glass|glaz|window-pane/.test(semantic)||sourceMat.transmission>.5?'glass':/grass|turf|needle|foliage|leaves|leaf|crown/.test(semantic)?'foliage':/bark|trunk|fir-curved-branches/.test(semantic)?'bark':/ground|terrain|soil/.test(semantic)?'ground':'original';
    objects.push({name,kind,originalName:o.name,roughness:sourceMat.roughness??.8,metalness:sourceMat.metalness??0});
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
  for(const ch of o.children)visit(ch,forced);
 }
 try{
 onProgress('Подготовка процедурных текстур и геометрии…');
 visit(root);exportScene.updateMatrixWorld(true);
 const lights=[];let sun=null;
 scene.traverseVisible(o=>{
  if(o.name==='forma-bounced-fill'||(!o.isDirectionalLight&&!o.isPointLight&&!o.isSpotLight&&!o.isRectAreaLight))return;
  const position=o.getWorldPosition(new T.Vector3()),direction=o.target?o.target.getWorldPosition(new T.Vector3()).sub(position).normalize():o.getWorldDirection(new T.Vector3()).negate();
  const type=o.isDirectionalLight?'SUN':o.isSpotLight?'SPOT':o.isRectAreaLight?'AREA':'POINT';
  const row={name:o.name||'FORMA light',type,position:position.toArray(),direction:direction.toArray(),color:o.color.toArray(),energy:Math.max(0,o.intensity),angle:(o.angle||.45)*2,width:o.width,height:o.height};
  lights.push(row);if(o.name==='sun')sun={energy:row.energy,direction:direction.clone().negate().toArray()};
 });
 const aspect=camera.isOrthographicCamera?(camera.right-camera.left)/(camera.top-camera.bottom):camera.aspect||16/9;
 const height=Math.max(2,Math.round(preset.width/aspect/2)*2);
 const job={version:123,device,atmosphere,exposure:Math.max(-2,Math.min(2,Number(exposure)||0)),objects,render:{...preset,height},camera:{position:camera.getWorldPosition(new T.Vector3()).toArray(),quaternion:camera.getWorldQuaternion(new T.Quaternion()).toArray(),fov:camera.getEffectiveFOV?.()||45,near:camera.near,far:camera.far,ortho:!!camera.isOrthographicCamera,orthoWidth:camera.isOrthographicCamera?(camera.right-camera.left)/camera.zoom:0},sun,lights,batches,warnings};
  onProgress('Экспорт геометрии и текстур: '+instances+' инстансов…');
  const glb=await new GLTFExporter().parseAsync(exportScene,{binary:true,onlyVisible:true,maxTextureSize:['high','ultra'].includes(quality)?4096:2048});
  const response=await fetch(new URL('./forma-cycles-r107.py?v=R108',import.meta.url));if(!response.ok)throw Error('Скрипт Cycles недоступен: '+response.status);
  const script=await response.text();
  const bat='@echo off\r\ncd /d "%~dp0"\r\nset "BLENDER=blender.exe"\r\nwhere blender.exe >nul 2>nul\r\nif errorlevel 1 (\r\n for /d %%D in ("%ProgramFiles%\\Blender Foundation\\Blender*") do if exist "%%~fD\\blender.exe" set "BLENDER=%%~fD\\blender.exe"\r\n)\r\n"%BLENDER%" --background --factory-startup --python-exit-code 1 --python "%~dp0forma-cycles-r107.py"\r\nif errorlevel 1 echo Render failed. Check console and Blender installation.\r\npause\r\n';
  const readme='FORMA Cycles R123 - experimental local architectural render. Procedural maps converted to export-safe images.\nInstall Blender 4.5 LTS or newer from https://www.blender.org/download/. Extract ALL files into one folder. Windows: run RENDER-WINDOWS.bat. macOS/Linux: blender --background --factory-startup --python-exit-code 1 --python forma-cycles-r107.py. Output: FORMA-render.png, FORMA-scene.blend. No upload or paid API. GPU auto detection, CPU fallback. Physical Cycles material reconstruction for classified water, glazing, plants and bark; individual plant colors quantized into tint groups; masked translucent foliage and higher transparent bounce budget. Cloudy skies reduce direct sun; natural AgX daytime contrast. Static scene, procedural physical sky or optional local HDRI (place environment.hdr beside the BAT file). Custom WebGL shaders, weather particles, some materials and skinned meshes are not fully reproduced. Check console for GPU backend and errors.\n';
  onProgress('Упаковка локального проекта…');
  const zip=zipSync({'scene.glb':new Uint8Array(glb),'job.json':strToU8(JSON.stringify(job)),'forma-cycles-r107.py':strToU8(script),'RENDER-WINDOWS.bat':strToU8(bat),'README.txt':strToU8(readme)},{level:1});
  const url=URL.createObjectURL(new Blob([zip],{type:'application/zip'})),a=document.createElement('a');a.href=url;a.download='FORMA-Cycles-R123.zip';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  return {instances,meshes:id,warnings};
 }finally{for(const m of materials)m.dispose();for(const t of exportTextures)t.dispose()}
}
