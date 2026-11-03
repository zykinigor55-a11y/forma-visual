/** Registered surface boundaries in the 1448 × 1086 architectural photograph.
 * Each plane stops at the glazing/frame. Timber accent panels remain natural.
 * The upper wall continues behind transparent balcony glass; its reflections
 * stay in the photograph and retain their luminance during the albedo transfer.
 */
type Point=readonly[number,number];
const faces:readonly (readonly Point[])[]=[
 [[232,450],[272,440],[272,772],[232,772]],
 [[371,420],[417,407],[417,773],[371,773]],
 [[459,398],[506,384],[506,773],[459,773]],
 [[506,384],[533,392],[533,485],[515,488],[515,553],[567,546],[567,773],[506,773]],
 [[756,354],[814,342],[997,397],[997,493],[756,528]],
 [[823,568],[906,558],[906,774],[823,774]],
 [[969,551],[1060,540],[1097,551],[1097,774],[969,774]],
 [[1298,574],[1367,589],[1367,774],[1298,774]],
];
const occlusions:readonly (readonly Point[])[]=[
 // Balcony's top rail and uprights; transparent glass does not become paint.
 [[514,487],[922,427],[1048,454],[1048,458],[922,431],[514,491]],
 [[919,429],[925,429],[925,506],[919,507]],
 [[1040,454],[1047,455],[1047,493],[1040,494]],
 // Foreground loungers and fire, not part of the wall.
 [[988,775],[1068,738],[1126,738],[1131,749],[1097,798],[988,798]],
 [[1170,775],[1233,739],[1298,739],[1303,751],[1273,798],[1170,798]],
 // Entire projecting roof slab, including snow and soffit.
 [[509,552],[1098,481],[1398,541],[1398,571],[1097,512],[510,593]],
];
function inside(x:number,y:number,p:readonly Point[]){let hit=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
export function facadeCoverage(x:number,y:number,rgb:readonly number[]=[180,160,140]){
 x*=1448;y*=1086;
 if(!faces.some(p=>inside(x,y,p))||occlusions.some(p=>inside(x,y,p)))return 0;
 // Leaves and flower stems can occlude the lower facade in summer and spring.
 if(y>690&&rgb[1]>rgb[0]*1.05&&rgb[1]>rgb[2]*1.12)return 0;
 return 1;
}
const reflectance:Record<string,number>={plaster:216,brick:135,wood:168,stone:194};
const natural:Record<string,readonly number[]>={plaster:[235,215,195],brick:[180,120,90],wood:[220,160,105],stone:[210,195,178]};
function transfer(rgb:readonly number[],material:string,target:readonly number[],night:boolean):number[]{
 const luminance=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
 const shade=luminance/(reflectance[material]||216);
 const base=natural[material]||natural.plaster;
 const neutral=rgb.map((v,c)=>v/base[c]),mean=neutral.reduce((a,b)=>a+b,0)/3;
 return target.map((v,c)=>{
  const value=Math.max(0,v*shade*(1+(neutral[c]/(mean||1)-1)*(night?.65:.12)));
  // Soft photographic highlight shoulder preserves joints/grain under a
  // downlight when a dark natural material is changed to a pale finish.
  return Math.round(value>210?210+(value-210)*45/(45+value-210):value);
 });
}
export function recolorFacadePixel(rgb:readonly number[],material:string,color:string,night=false):number[]{
 if(color==='original')return [...rgb];
 return transfer(rgb,material,[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)),night);
}
const masks=new Map<string,Uint32Array>();
export function facadeSurfacePixels(width:number,height:number){
 const key=`${width}x${height}`;let mask=masks.get(key);if(mask)return mask;
 const indices:number[]=[];
 for(let y=Math.floor(height*.31);y<height*.72;y++)for(let x=Math.floor(width*.158);x<width*.947;x++)if(facadeCoverage((x+.5)/width,(y+.5)/height))indices.push((y*width+x)*4);
 mask=Uint32Array.from(indices);masks.set(key,mask);if(masks.size>2)masks.delete(masks.keys().next().value!);return mask;
}
export function recolorFacade(data:Uint8ClampedArray,width:number,height:number,material:string,color:string,night=false){
 if(color==='original')return;
 const target=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
 for(const i of facadeSurfacePixels(width,height)){
  const rgb=[data[i],data[i+1],data[i+2]],y=Math.floor(i/4/width)/height*1086,x=(i/4%width)/width*1448;
  if(y>690&&rgb[1]>rgb[0]*1.05&&rgb[1]>rgb[2]*1.12)continue;
  const out=transfer(rgb,material,target,night);
  // Fire is an emissive, antialiased foreground object. Preserve its bright
  // core and soft edges continuously rather than cutting a polygon-shaped hole.
  let emission=0;
  if(x>826&&x<892&&y>706){
   const base=natural[material]||natural.plaster;
   emission=Math.max(0,Math.min(1,Math.max((rgb[0]-rgb[2]-(base[0]-base[2]+30))/70,(Math.min(rgb[0],rgb[1])-235)/20,Math.min(1,Math.max(0,(Math.min(rgb[0],rgb[1])-195)/25))*Math.min(1,Math.max(0,(rgb[0]-rgb[2]-45)/35)))));
  }
  for(let c=0;c<3;c++)data[i+c]=Math.round(out[c]*(1-emission)+rgb[c]*emission);
 }
}
