/* R67 photo assets: same-origin first, optional official CC0 CDN.
 * Atomic update of shared texture objects; no individual leaf/wood patches.
 * No change to geometry or measured project coordinates.
 */
const DIR='./assets/landscape-photo/r67/';
const barkBase='https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/bark_brown_01/';
const hdrRemote='https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloppenheim_03_puresky_1k.hdr';
const barkState=new WeakMap(),skyState=new WeakMap();
const ready=()=>window.dispatchEvent(new Event('forma-foliage-texture-ready'));
async function loadTexture(T,file){
 const loader=new T.TextureLoader();
 try{return await loader.loadAsync(new URL(DIR+file,document.baseURI).href);}
 catch{return await loader.loadAsync(barkBase+file);}
}
export function upgradeOakPhotoMaps(T,maps){
 if(barkState.has(T))return;
 barkState.set(T,'loading');
 const files=['bark_brown_01_diff_1k.jpg','bark_brown_01_nor_gl_1k.jpg','bark_brown_01_rough_1k.jpg'];
 Promise.all(files.map(f=>loadTexture(T,f))).then(textures=>{
  const targets=[maps.bark,maps.normal,maps.rough];
  // Existing material references are retained, including every branch and age.
  for(let i=0;i<3;i++){
   targets[i].image=textures[i].image;targets[i].needsUpdate=true;
   targets[i].userData.source='Poly Haven Bark Brown 01 CC0';
  }
  for(const t of textures)t.dispose();
  barkState.set(T,'photo');window.FORMA_OAK_BARK_R67='photo';ready();
 }).catch(async error=>{
  // Bundled oak is already in this repository. Borrow only its bark map,
  // never its geometry or atlas foliage. Retain procedural relief if missing.
  try{
   const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
   const gltf=await new GLTFLoader().loadAsync(new URL('./assets/landscape-models/oak-terraintale-cc0.glb',document.baseURI).href);
   const candidates=[];gltf.scene.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material])if(m?.map&&!m.transparent&&!(m.alphaTest>0))candidates.push(m)});
   const m=candidates.find(x=>/bark|trunk|wood/i.test(x.name||''))||(candidates.length===1?candidates[0]:null);
   if(!m)throw Error('No unambiguous bark material in local GLB');
   const a=[m.map,m.normalMap,m.roughnessMap],b=[maps.bark,maps.normal,maps.rough];
   for(let i=0;i<a.length;i++){if(a[i]?.image){b[i].image=a[i].image;b[i].needsUpdate=true;b[i].userData.source='Bundled TerrainTale oak CC0';}}
   barkState.set(T,'bundled');window.FORMA_OAK_BARK_R67='bundled';ready();
  }catch(e){barkState.set(T,'fallback');window.FORMA_OAK_BARK_R67='procedural';console.warn('FORMA photo bark fallback',e);}
 });
}
export function photographicHDR(T,renderer,{time,weather,onReady=()=>{}}={}){
 if(time!=='day'||!['sunny','after-rain'].includes(weather)||!renderer.extensions.has('EXT_color_buffer_float'))return null;
 let s=skyState.get(renderer);
 if(s)return s.texture||null;
 s={status:'loading',texture:null};skyState.set(renderer,s);
 import('three/addons/loaders/RGBELoader.js').then(async({RGBELoader})=>{
  const l=new RGBELoader().setDataType(T.HalfFloatType);
  let t;try{t=await l.loadAsync(new URL(DIR+'kloppenheim_03_puresky_1k.hdr',document.baseURI).href);}catch{t=await l.loadAsync(hdrRemote);}
  // Measured radiance: cap isolated solar hotspots to avoid double counting
  // the user-controlled directional sunlight. Sky probe remains scene fill.
  const a=t.image.data;let sum=0,n=0;for(let i=0;i<a.length;i+=4){const y=.2126*T.DataUtils.fromHalfFloat(a[i])+.7152*T.DataUtils.fromHalfFloat(a[i+1])+.0722*T.DataUtils.fromHalfFloat(a[i+2]);if(Number.isFinite(y)&&y>0&&y<30){sum+=y;n++;}}
  const gain=0.65/Math.max(.04,n?sum/n:1);
  for(let i=0;i<a.length;i+=4)for(let j=0;j<3;j++){const v=T.DataUtils.fromHalfFloat(a[i+j]);a[i+j]=T.DataUtils.toHalfFloat(Math.max(0,Math.min(2.2,Number.isFinite(v)?v*gain:0)));}
  t.mapping=T.EquirectangularReflectionMapping;t.colorSpace=T.LinearSRGBColorSpace;t.needsUpdate=true;
  const generator=new T.PMREMGenerator(renderer);
  try{s.target=generator.fromEquirectangular(t);s.texture=s.target.texture;s.status='photo';}
  finally{t.dispose();generator.dispose();}
  onReady();ready();
 }).catch(e=>{s.status='fallback';console.warn('FORMA photo HDR fallback',e);});
 return null;
}
