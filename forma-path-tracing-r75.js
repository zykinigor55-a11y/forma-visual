/* FORMA R73 — optional actual WebGL GPU path tracing snapshot.
 * three-gpu-pathtracer 0.0.23 + three-mesh-bvh 0.8.3; no mutation of editor scene.
 * Shader-only effects are not representable by the physical tracer.
 */
const isMobile=()=>window.innerWidth<=850;
const nextFrame=()=>new Promise(r=>requestAnimationFrame(r));
function makeSky(T,source){
 const w=512,h=256,data=new Float32Array(w*h*4);
 const sun=source.getObjectByName('sun'),day=(sun?.intensity||0)>.2;
 const zen=new T.Color(day?'#7297bf':'#26374f'),hor=new T.Color(day?'#d3e0e7':'#586a80'),ground=new T.Color(day?'#777b67':'#303b32');
 const c=new T.Color();
 for(let y=0;y<h;y++){const a=Math.sin(((y+.5)/h-.5)*Math.PI);c.copy(hor).lerp(a>0?zen:ground,Math.pow(Math.abs(a),.55));for(let x=0;x<w;x++){const k=(y*w+x)*4;data[k]=c.r;data[k+1]=c.g;data[k+2]=c.b;data[k+3]=1;}}
 const t=new T.DataTexture(data,w,h,T.RGBAFormat,T.FloatType);t.mapping=T.EquirectangularReflectionMapping;t.colorSpace=T.LinearSRGBColorSpace;t.needsUpdate=true;return t;
}
async function loadSkyR73(T,source){
 const sun=source.getObjectByName('sun');
 if(!sun||sun.intensity<.3)return {texture:makeSky(T,source),label:'Процедурное небо (ночь)'};
 const id='kloppenheim_03_puresky',res=isMobile()?'1k':'2k',file=id+'_'+res+'.hdr';
 try{
  const {RGBELoader}=await import('three/addons/loaders/RGBELoader.js');
  const loader=new RGBELoader().setDataType(T.FloatType);
  let t;try{t=await loader.loadAsync(new URL('./assets/landscape-photo/r67/'+file,document.baseURI).href);}catch{t=await loader.loadAsync('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/'+res+'/'+file);}
  const d=t.image.data;let avg=0,count=0;
  for(let i=0;i<d.length;i+=4){const y=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];if(Number.isFinite(y)&&y>0&&y<25){avg+=y;count++;}}
  if(!count)throw Error('HDRI has no valid radiance');
  const gain=.72/Math.max(.04,avg/count);
  // Preserve cloud radiance contrast; limit direct solar hotspots because a separate area light supplies direct sunlight.
  for(let i=0;i<d.length;i+=4){const y=(.2126*d[i]+.7152*d[i+1]+.0722*d[i+2])*gain;const scale=gain*Math.min(1,3.5/Math.max(.00001,y));for(let j=0;j<3;j++)d[i+j]=Math.max(0,Number.isFinite(d[i+j])?d[i+j]*scale:0);d[i+3]=1;}
  t.mapping=T.EquirectangularReflectionMapping;t.colorSpace=T.LinearSRGBColorSpace;t.needsUpdate=true;
  return {texture:t,label:'Poly Haven HDRI '+res};
 }catch(e){console.warn('R73 HDRI fallback',e);return {texture:makeSky(T,source),label:'Процедурное HDRI (резерв)'};}
}
function bakeInstances(T,o){
 const src=o.geometry,p=src.attributes.position,n=src.attributes.normal,uv=src.attributes.uv,col=src.attributes.color;
 const count=p.count,N=count*o.count,index=src.index,ic=index?.count||count;
 const pos=new Float32Array(N*3),normal=new Float32Array(N*3),tex=new Float32Array(N*2),colors=new Float32Array(N*4),idx=new Uint32Array(ic*o.count);
 const M=new T.Matrix4(),NM=new T.Matrix3(),v=new T.Vector3(),c=new T.Color();
 for(let i=0;i<o.count;i++){
  o.getMatrixAt(i,M);NM.getNormalMatrix(M);c.setRGB(1,1,1);if(o.instanceColor)o.getColorAt(i,c);
  for(let j=0;j<count;j++){let k=i*count+j;v.fromBufferAttribute(p,j).applyMatrix4(M);pos.set([v.x,v.y,v.z],k*3);if(n){v.fromBufferAttribute(n,j).applyNormalMatrix(NM);normal.set([v.x,v.y,v.z],k*3);}if(uv)tex.set([uv.getX(j),uv.getY(j)],k*2);
   colors.set([c.r*(col?col.getX(j):1),c.g*(col?col.getY(j):1),c.b*(col?col.getZ(j):1),col?.itemSize===4?col.getW(j):1],k*4);
  }
  for(let j=0;j<ic;j++)idx[i*ic+j]=i*count+(index?index.getX(j):j);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('normal',new T.BufferAttribute(normal,3));g.setAttribute('uv',new T.BufferAttribute(tex,2));g.setAttribute('color',new T.BufferAttribute(colors,4));g.setIndex(new T.BufferAttribute(idx,1));if(!n)g.computeVertexNormals();
 return g;
}
function snapshot(T,source,root,camera,sky){
 source.updateMatrixWorld(true);camera.updateMatrixWorld(true);
 const scene=new T.Scene(),geometries=[],materials=[],materialCache=new Map();
 let triangles=0,skipped=0,instances=0;
 const meshes=[];root.traverseVisible(o=>{
  if(!o.isMesh||!o.geometry?.attributes.position)return;
  if(o.userData?.selectionProxy||o.userData?.formaWeatherPreview||/selection|preview.*cursor|brush|gizmo|underlay/i.test(o.name))return;
  const ms=Array.isArray(o.material)?o.material:[o.material];
  if(ms.some(m=>!m?.isMeshStandardMaterial&&!m?.isMeshBasicMaterial)){skipped++;return;}
  if(o.isSkinnedMesh){skipped++;return;}
  if(o.isInstancedMesh&&ms.length>1){skipped++;return;}
  const g=o.geometry;triangles+=(g.index?.count||g.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);
  meshes.push(o);
 });
 const limit=isMobile()?250000:1250000;
 if(triangles>limit)throw Error('Сцена слишком тяжёлая для текущего режима: '+Math.round(triangles/1000)+' тыс. треугольников. Для первого теста оставьте один дуб.');
 const cloneMat=(m,instanced)=>{
  const key=m.uuid+'|'+instanced;if(materialCache.has(key))return materialCache.get(key);
  let p=m.isMeshStandardMaterial?m.clone():new T.MeshStandardMaterial({color:m.color,map:m.map,roughness:1,alphaTest:m.alphaTest,transparent:m.transparent,opacity:m.opacity,side:m.side});
  if(instanced)p.vertexColors=true;p.onBeforeCompile=()=>{};p.customProgramCacheKey=()=>'';materials.push(p);materialCache.set(key,p);return p;
 };
 try{
 for(const o of meshes){
  const g=o.isInstancedMesh?bakeInstances(T,o):o.geometry.clone();geometries.push(g);
  if(o.isInstancedMesh)instances+=o.count;
  const c=g.attributes.color;
  if(c&&c.itemSize===3){const a=new Float32Array(c.count*4);for(let i=0;i<c.count;i++)a.set([c.getX(i),c.getY(i),c.getZ(i),1],i*4);g.setAttribute('color',new T.BufferAttribute(a,4));}
  const m=Array.isArray(o.material)?o.material.map(x=>cloneMat(x,!!o.isInstancedMesh)):cloneMat(o.material,!!o.isInstancedMesh);
  const mesh=new T.Mesh(g,m);mesh.matrixAutoUpdate=false;mesh.matrix.copy(o.matrixWorld);mesh.name=o.name;scene.add(mesh);
 }
 source.traverseVisible(o=>{
  if(!o.isDirectionalLight&&!o.isPointLight&&!o.isSpotLight&&!o.isRectAreaLight)return;
  const l=o.name==='sun'&&o.isDirectionalLight&&o.intensity>.3?(()=>{const direction=o.position.clone().sub(o.target.position).normalize(),distance=70,size=2.8,light=new T.RectAreaLight(o.color,o.intensity*distance*distance/(size*size),size,size);light.position.copy(direction.multiplyScalar(distance)).add(o.target.position);light.lookAt(o.target.position);scene.add(light);return null;})():o.clone();if(!l)return;l.position.setFromMatrixPosition(o.matrixWorld);l.quaternion.copy(o.getWorldQuaternion(new T.Quaternion()));if(o.target){l.target=new T.Object3D();l.target.position.setFromMatrixPosition(o.target.matrixWorld);scene.add(l.target);}scene.add(l);
 });
 const env=sky.texture;scene.environment=env;scene.background=env;scene.environmentIntensity=.82;scene.backgroundIntensity=1;
 const cam=camera.clone();cam.updateMatrixWorld(true);
 return {scene,cam,triangles,instances,skipped,dispose(){for(const g of geometries)g.dispose();for(const m of materials)m.dispose();env.dispose();}};
 }catch(e){for(const g of geometries)g.dispose();for(const m of materials)m.dispose();throw e;}
}
export function createPathTraceMode(T,{renderer,scene,root,camera,canvas,profile='balanced',onClose=()=>{},onFailure=()=>{}}){
 let alive=true,pt=null,snap=null,sky=null,denoise=null,denoiseQuad=null,raf=0,loading=true,finished=false,building=false,cleaned=false,resultBlob=null;
 const oldRatio=renderer.getPixelRatio(),oldTone=renderer.toneMapping,oldExposure=renderer.toneMappingExposure;
 const ui=document.createElement('div');ui.style.cssText='position:fixed;inset:0;z-index:100000;background:transparent;touch-action:none;display:flex;align-items:flex-end;justify-content:center;padding:12px;pointer-events:auto;';
 const panel=document.createElement('div');panel.style.cssText='width:min(440px,96vw);background:#22262df5;color:#eee;border:1px solid #777;border-radius:12px;padding:12px;font:13px system-ui;box-shadow:0 10px 45px #0005;';
 panel.innerHTML='<strong style="font-size:15px">FORMA · РЕНДЕР ВИДЕОКАРТОЙ</strong><div data-msg style="margin:8px 0">Подготовка сцены…</div><progress value="0" max="64" style="width:100%;height:8px"></progress><div style="display:flex;gap:8px;margin-top:10px"><button data-close style="flex:1;padding:12px">В редактор</button><button data-save disabled style="flex:1;padding:12px">Сохранить PNG</button></div><small style="display:block;margin-top:8px;color:#bbb">Накопительный GPU-рендер · адаптивное качество</small>';
 ui.append(panel);document.body.append(ui);const msg=panel.querySelector('[data-msg]'),bar=panel.querySelector('progress'),save=panel.querySelector('[data-save]');
 const target=profile==='high'?96:32;bar.max=target;
 function cleanup(){if(cleaned)return;cleaned=true;
  // v0.0.23 public dispose has a legacy quad name; release the real resources.
  if(pt){try{pt.dispose()}catch{try{pt._quad?.material?.dispose();pt._quad?.dispose();pt._pathTracer?.dispose();}catch{}}try{pt._lowResPathTracer?.dispose();}catch{}}
  denoise?.dispose();denoiseQuad?.dispose();if(snap)snap.dispose();else sky?.texture?.dispose();
 }
 function close(){if(!alive)return;alive=false;cancelAnimationFrame(raf);ui.remove();if(!building)cleanup();renderer.toneMapping=oldTone;renderer.toneMappingExposure=oldExposure;if(!renderer.getContext().isContextLost())renderer.setPixelRatio(oldRatio);onClose();}
 panel.querySelector('[data-close]').onclick=close;
 save.onclick=()=>{const download=b=>{if(!b)return;const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='FORMA-GPU-R75.png';a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);};if(resultBlob)download(resultBlob);else if(pt?.samples>=1&&!renderer.getContext().isContextLost())canvas.toBlob(download,'image/png');};
 function error(e){loading=false;finished=true;console.warn('FORMA GPU R75',e);const reason=e?.message||String(e);close();onFailure(reason);}
 const handle={close,get active(){return alive;},get samples(){return pt?.samples||0;}};
 (async()=>{try{
  if(!renderer.capabilities.isWebGL2||!renderer.extensions.has('EXT_color_buffer_float'))throw Error('GPU не поддерживает необходимые WebGL2 HDR-буферы');
  const {WebGLPathTracer,DenoiseMaterial}=await import('three-gpu-pathtracer');const {FullScreenQuad}=await import('three/addons/postprocessing/Pass.js');if(!alive)return;
  msg.textContent='Загрузка фотографического HDRI…';sky=await loadSkyR73(T,scene);if(!alive){sky.texture.dispose();return;}
  msg.textContent='Подготовка полигонов и материалов…';await nextFrame();if(!alive)return;
  snap=snapshot(T,scene,root,camera,sky);
  msg.textContent='Построение BVH: '+Math.round(snap.triangles/1000)+' тыс. треугольников…';await nextFrame();if(!alive)return;
  building=true;
  pt=new WebGLPathTracer(renderer);pt.bounces=profile==='high'?5:3;pt.transmissiveBounces=3;pt.multipleImportanceSampling=true;pt.tiles.set(2,2);pt.renderScale=profile==='high'?.75:.45;pt.textureSize.set(profile==='high'?1024:512,profile==='high'?1024:512);pt.minSamples=1;pt.renderDelay=0;pt.fadeDuration=0;pt.rasterizeScene=false;pt.filterGlossyFactor=.25;
  renderer.setPixelRatio(Math.min(oldRatio,profile==='high'?1:0.85));pt.setScene(snap.scene,snap.cam);denoise=new DenoiseMaterial({sigma:1.5,threshold:.045,kSigma:1.5});denoiseQuad=new FullScreenQuad(denoise);building=false;
  if(!alive){cleanup();return;}
  renderer.toneMapping=T.ACESFilmicToneMapping;loading=false;
  function tick(){if(!alive||finished)return;try{
   if(renderer.getContext().isContextLost())throw Error('WebGL отключён');pt.renderSample();const n=Math.floor(pt.samples);bar.value=n;save.disabled=n<1;
   msg.textContent=pt.isCompiling?'Компиляция GPU-шейдера…':'Сэмплы '+n+' / '+target+' · '+Math.round(snap.triangles/1000)+' тыс. треуг. · '+snap.instances+' инстансов · '+sky.label+(snap.skipped?' · пропущено спец. объектов: '+snap.skipped:'');
   if(n>=target){if(profile==='high'){denoise.map=pt.target.texture;denoiseQuad.render(renderer);}finished=true;save.disabled=true;canvas.toBlob(b=>{if(!alive)return;if(!b||renderer.getContext().isContextLost()){error(Error('Не удалось сохранить кадр GPU'));return;}resultBlob=b;cleanup();pt=null;snap=null;save.disabled=false;msg.textContent+=' · готово, память освобождена';},'image/png');return;}raf=requestAnimationFrame(tick);
  }catch(e){error(e);}}
  raf=requestAnimationFrame(tick);
 }catch(e){building=false;if(!alive){cleanup();return;}error(e);}})();
 return handle;
}
