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
  fall:['#bca67b','#b4a76f','#98855c']}),
 maple:Object.freeze({latin:"Acer platanoides",crown:"broad palmately lobed crown with clear branching forks",leafLengthCm:12,leafWidthCm:11,leafRoughness:0.72,barkBump:0.025,twigFrequency:1.34,shade:'#375a2e',sunlit:'#90ae58',fall:["#ca813f","#b15434","#d7a24a"]}),
 linden:Object.freeze({latin:"Tilia cordata",crown:"heart-leaved dense domed crown with small pendant branchlets",leafLengthCm:6,leafWidthCm:5,leafRoughness:0.71,barkBump:0.024,twigFrequency:1.3,shade:'#486c36',sunlit:'#a0b669',fall:["#c6ac4c","#a48b3f","#d5bd65"]}),
 willow:Object.freeze({latin:"Salix babylonica",crown:"long drooping flexible hanging canopy strands",leafLengthCm:12,leafWidthCm:1.3,leafRoughness:0.73,barkBump:0.023,twigFrequency:1.48,shade:'#586c3a',sunlit:'#aabd76',fall:["#b6a15c","#c9b96e","#847448"]}),
 rowan:Object.freeze({latin:"Sorbus aucuparia",crown:"airily pinnate leaflets and fine secondary branchlets",leafLengthCm:5,leafWidthCm:2,leafRoughness:0.73,barkBump:0.019,twigFrequency:1.4,shade:'#45653c',sunlit:'#94a75b',fall:["#bf9548","#b66d3f","#dda953"]}),
 apple:Object.freeze({latin:"Malus domestica",crown:"gnarled orchard branch crown and oval leaf clusters",leafLengthCm:8,leafWidthCm:5,leafRoughness:0.72,barkBump:0.034,twigFrequency:1.22,shade:'#476637',sunlit:'#95a25b',fall:["#bca454","#cc8c48","#877345"]}),
 sakura:Object.freeze({latin:"Prunus serrulata",crown:"fine lateral twigs and ovate serrated leaves",leafLengthCm:9,leafWidthCm:4,leafRoughness:0.71,barkBump:0.023,twigFrequency:1.35,shade:'#4b653d',sunlit:'#9eb170',fall:["#bc904d","#a9713d","#c9a465"]}),
 ash:Object.freeze({latin:"Fraxinus excelsior",crown:"compound pinnate leaflets and high clear open crown",leafLengthCm:7,leafWidthCm:3,leafRoughness:0.72,barkBump:0.028,twigFrequency:1.41,shade:'#32562d',sunlit:'#83a258',fall:["#aa9141","#b8a253","#6c6a34"]}),
 aspen:Object.freeze({latin:"Populus tremula",crown:"small round fluttering leaves with pale tall trunk",leafLengthCm:5,leafWidthCm:4.5,leafRoughness:0.68,barkBump:0.019,twigFrequency:1.55,shade:'#527c3b',sunlit:'#b9cf83',fall:["#dec064","#ba973e","#9f8245"]}),
 juniper:Object.freeze({latin:"Juniperus horizontalis",crown:"low creeping scale-needled cushion with flat layered branchlets",leafLengthCm:1.6,leafWidthCm:0.4,leafRoughness:0.77,barkBump:0.015,twigFrequency:1.52,shade:'#345b4d',sunlit:'#7a9f83'}),
 barberry:Object.freeze({latin:"Berberis thunbergii",crown:"spiny irregular burgundy shrubs with tiny oval leaves",leafLengthCm:3,leafWidthCm:1.5,leafRoughness:0.72,barkBump:0.012,twigFrequency:1.5,shade:'#472e36',sunlit:'#a15e62',fall:["#8b4d42","#b36b4c","#6d3a40"]}),
 dogwood:Object.freeze({latin:"Cornus alba",crown:"arching red winter stems and mid green broad leaves",leafLengthCm:8,leafWidthCm:4.5,leafRoughness:0.74,barkBump:0.02,twigFrequency:1.48,shade:'#48683c',sunlit:'#9fb278',fall:["#b88743","#c2a362","#a06d41"]}),
 'thuja-globe':Object.freeze({latin:"Thuja occidentalis",crown:"densely branched upright small-scale evergreen sprays",leafLengthCm:1.5,leafWidthCm:0.4,leafRoughness:0.77,barkBump:0.012,twigFrequency:1.49,shade:'#275141',sunlit:'#548366'}),
 lavender:Object.freeze({latin:"Lavandula angustifolia",crown:"fine silver-green narrow leaves on long spike stems",leafLengthCm:3,leafWidthCm:0.4,leafRoughness:0.78,barkBump:0.009,twigFrequency:1.48,shade:'#637364',sunlit:'#adb29d'}),
 boxwood:Object.freeze({latin:"Buxus sempervirens",crown:"small rounded evergreen leaves attached to dense woody twigs",leafLengthCm:2.5,leafWidthCm:1.5,leafRoughness:0.74,barkBump:0.014,twigFrequency:1.45,shade:'#32522c',sunlit:'#739257'}),
 fern:Object.freeze({latin:"Dryopteris filix-mas",crown:"separate arching pinnate fronds from a basal crown",leafLengthCm:26,leafWidthCm:3,leafRoughness:0.77,barkBump:0.009,twigFrequency:1.45,shade:'#346846',sunlit:'#91ae73',fall:["#a6995a","#b2a579","#817347"]}),
 periwinkle:Object.freeze({latin:"Vinca minor",crown:"evergreen creeping runners with opposing oval leaves",leafLengthCm:4,leafWidthCm:2.5,leafRoughness:0.7,barkBump:0.008,twigFrequency:1.3,shade:'#2f6545',sunlit:'#81ad7c'}),
 'wild-shrub':Object.freeze({latin:"Mixed native woodland shrub",crown:"uneven understory stems with small leaves and open negative space",leafLengthCm:6,leafWidthCm:3,leafRoughness:0.74,barkBump:0.017,twigFrequency:1.34,shade:'#3e6136',sunlit:'#93ad66',fall:["#af874c","#c1a363","#8a6f46"]})
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
