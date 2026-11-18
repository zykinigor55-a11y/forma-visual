/* FORMA botanical PBR. Deterministic botanical palettes, physically
 * defensible leaf energy/roughness and grayscale bump relief.
 * No third-party textures or images need to be shipped to the client. */
export const BOTANICAL_PHOTO_PROFILES=Object.freeze({
 birch:Object.freeze({latin:'Betula pendula',crown:'airy pendant small-leaf sprays',leafLengthCm:4.5,leafWidthCm:3.4,
  leafRoughness:.68,barkBump:.022,twigFrequency:1.35,shade:'#476d39',sunlit:'#b3cf65',fall:['#ad8735','#d7b44d','#827d32']}),
 oak:Object.freeze({latin:'Quercus robur',crown:'deep lobed foliage on articulated lateral shoots',leafLengthCm:9,leafWidthCm:5.5,
  leafRoughness:.78,barkBump:.045,twigFrequency:1.5,shade:'#294c27',sunlit:'#7e9950',fall:['#8a6638','#bd8d45','#61502d']}),
 spirea:Object.freeze({latin:'Spiraea japonica',crown:'arching stems, fine small leaflets; non-spherical',leafLengthCm:3,leafWidthCm:1.8,
  leafRoughness:.71,barkBump:.012,twigFrequency:1.7,shade:'#3e6633',sunlit:'#a6b66f',fall:['#8f9458','#b29f4d','#776c48']}),
 pine:Object.freeze({latin:'Pinus sylvestris',crown:'mature open tiers, fine needle clusters',leafRoughness:.76,barkBump:.032,
  twigFrequency:1.25,shade:'#335442',sunlit:'#749261'}),
 spruce:Object.freeze({latin:'Picea abies',crown:'full tapered tiered conifer, fine dark needles',leafRoughness:.77,barkBump:.038,
  twigFrequency:1.25,shade:'#213c31',sunlit:'#4a6c4b'}),
 hydrangea:Object.freeze({latin:'Hydrangea paniculata',crown:'broad leaves on staggered branching stems',leafLengthCm:11,leafWidthCm:7,
  leafRoughness:.73,barkBump:.014,twigFrequency:1.35,shade:'#567448',sunlit:'#a5b57c'}),
 ninebark:Object.freeze({latin:'Physocarpus opulifolius',crown:'irregular multi-stem reddish lobed shrub',leafLengthCm:6,leafWidthCm:5,
  leafRoughness:.73,barkBump:.023,twigFrequency:1.35,shade:'#553d33',sunlit:'#ac7654',
  fall:['#b5834b','#8c7142','#6d4d35']}),
 hosta:Object.freeze({latin:'Hosta plantaginea',crown:'basal broad-heart leaves and short petioles',leafLengthCm:22,leafWidthCm:13,
  leafRoughness:.62,barkBump:.009,twigFrequency:1.1,shade:'#3f6553',sunlit:'#a8c1a0',
  fall:['#acaa7c','#b2a579','#849376']}),
 'ornamental-grass':Object.freeze({latin:'Miscanthus sinensis',crown:'fine upright arching leaf blades from a dense basal tussock',leafLengthCm:85,leafWidthCm:.7,
  leafRoughness:.78,barkBump:.004,twigFrequency:1.6,shade:'#607151',sunlit:'#b5b78a',
  fall:['#bca67b','#b4a76f','#98855c']})
});
export function botanicalPhotoProfile(id){
 return BOTANICAL_PHOTO_PROFILES[id]||{
  latin:'',crown:'species-correct true 3D terminal foliage',
  leafLengthCm:6,leafWidthCm:4,leafRoughness:.75,barkBump:.019,
  twigFrequency:1.18,shade:'#42613c',sunlit:'#92aa69'
 };
}
export function normalizeFoliagePalette(id,season='summer'){
 const p=botanicalPhotoProfile(id);
 return Object.freeze({
  shade:p.shade,sunlit:p.sunlit,fall:season==='autumn'?(p.fall||['#8c7939','#be9d53','#706c41']):null,
  roughness:p.leafRoughness
 });
}
export function foliageMaterial(T,id,{physical=true}={}){
 const p=botanicalPhotoProfile(id);
 const C=physical?T.MeshPhysicalMaterial:T.MeshStandardMaterial;
 return new C({
  color:'#ffffff',metalness:0,roughness:p.leafRoughness,
  side:T.DoubleSide,depthWrite:true,
  // Real waxy leaves have a restrained outer coat; avoid shiny plastic.
  ...(physical?{clearcoat:.065,clearcoatRoughness:.82}:{}),
  emissive:'#23321b',emissiveIntensity:.015
 });
}
export function barkReliefCanvas(colorCanvas,id){
 if(!colorCanvas?.getContext)return null;
 const source=colorCanvas.getContext('2d',{willReadFrequently:true});
 const w=colorCanvas.width,h=colorCanvas.height;
 const rgb=source.getImageData(0,0,w,h),height=colorCanvas.ownerDocument.createElement('canvas');
 height.width=w;height.height=h;
 const dest=height.getContext('2d'),out=dest.createImageData(w,h);
 for(let i=0;i<rgb.data.length;i+=4){
  const luminance=(rgb.data[i]*.22+rgb.data[i+1]*.69+rgb.data[i+2]*.09);
  const wave=(Math.sin((i/4%w)*.12)+Math.sin((i/4%w)*.34))*5;
  const gray=Math.max(0,Math.min(255,Math.round(luminance+wave)));
  out.data[i]=out.data[i+1]=out.data[i+2]=gray;out.data[i+3]=255;
 }
 dest.putImageData(out,0,0);
 return height;
}
