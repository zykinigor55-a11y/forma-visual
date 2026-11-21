/* FORMA | Architectural wall openings and measured house plans.
 * All dimensions are meters. A window must be a true empty wall aperture,
 * never tinted glass painted over a solid box. Geometry is independent of
 * Three.js so exact plans can be validated and reused for PDF measurements.
 */
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const finite=(n,fallback)=>Number.isFinite(Number(n))?Number(n):fallback;
export const NEW_HOUSE_STYLES=Object.freeze(['modular','logcabin','bungalow','duplex','panoramic','tiny']);

export function buildingHeights({archStyle='barn',type='house',width=8,roofRise=null}={}){
 const w=Math.max(2,finite(width,8));
 let eave=3.5;
 if(type==='garage'||type==='carport')eave=2.85;
 else if(type==='gazebo'||type==='pergola')eave=2.9;
 else if(type==='greenhouse')eave=2.65;
 else if(type==='bath')eave=3.05;
 else if(['duplex'].includes(archStyle))eave=5.9;
 else if(['barn','classic','timber','brick','chalet','cottage','mediterranean'].includes(archStyle))eave=4.3;
 else if(archStyle==='tiny')eave=3.15;
 else if(archStyle==='bungalow')eave=3.25;
 else if(archStyle==='modular')eave=3.22;
 else if(archStyle==='logcabin')eave=3.55;
 else if(archStyle==='panoramic')eave=3.75;
 else if(archStyle==='aframe')eave=.65;
 const rise=archStyle==='aframe'
  ? clamp(finite(roofRise,w*.74),4.2,8)
  : clamp(finite(roofRise,Math.min(w*.22,2)),.5,4);
 return {eave,rise,base:.48,total:eave+rise};
}
export function validateMeasuredBuilding({width,height,roofRise=null}={}){
 const w=Number(width),d=Number(height);
 if(!Number.isFinite(w)||!Number.isFinite(d)||w<2||d<2||w>500||d>500)
  return {valid:false,reason:'Задайте реальные размеры здания от 2 до 500 метров'};
 if(roofRise!==null&&roofRise!==undefined&&(!Number.isFinite(Number(roofRise))||Number(roofRise)<0))
  return {valid:false,reason:'Высота кровли должна быть неотрицательной'};
 return {valid:true,width:w,depth:d,footprintArea:w*d};
}
export function facadeOpeningSchedule({width=8,depth=7,height=3.5,style='barn',type='house'}={}){
 const w=Math.max(2,finite(width,8)),d=Math.max(2,finite(depth,7));
 const maxTop=Math.max(2.35,finite(height,3.5)-.16),floor=.48;
 const largeGlazing=['barn','modern','japandi','panoramic','modular','hightech'].includes(style);
 const doorWidth=clamp(w*.135,.80,1.15),doorX=w>=5?w*.29:w*.22;
 const doorHeight=Math.min(2.15,maxTop-floor-.10);
 const door=(x)=>({kind:'door',x,width:doorWidth,bottom:floor,height:doorHeight});
 const window=(x,width,bottom,height,panoramic=largeGlazing)=>({
  kind:'window',x,width,bottom,height,panoramic
 });
 const winHeight=largeGlazing?Math.min(2.35,maxTop-1):Math.min(1.45,maxTop-1.4);
 const winBottom=largeGlazing?.70:1.27;
 const winWidth=Math.min(largeGlazing?2.15:1.22,w*.21);
 const result={front:[],rear:[],left:[],right:[]};
 if(type==='garage'){
  result.front.push({kind:'garage',x:0,width:Math.min(w*.69,4.45),bottom:floor,height:Math.min(2.16,maxTop-floor-.10)});
  result.rear.push(window(-w*.11,Math.min(w*.22,1.4),1.3,1.0,false));
 }else if(style==='duplex'&&w>=6){
  result.front.push(door(-w*.28),door(w*.28));
  const upperY=Math.min(3.75,maxTop-1.4);
  result.front.push(window(-w*.28,Math.min(w*.18,1.55),upperY,1.30,false),
                    window(w*.28,Math.min(w*.18,1.55),upperY,1.30,false));
  result.rear.push(window(-w*.26,Math.min(w*.22,1.65),1.3,1.55,false),
                   window(w*.26,Math.min(w*.22,1.65),1.3,1.55,false));
 }else{
  result.front.push(door(doorX));
  if(style==='panoramic'){
   result.front.push(window(-w*.19,Math.min(w*.47,w*.58),.62,Math.min(2.65,maxTop-.72),true));
  }else{
   const count=w>=7.2?2:1;
   for(let i=0;i<count;i++){
    const x=count===1?-w*.24:-w*.30+i*w*.27;
    result.front.push(window(x,winWidth,winBottom,winHeight));
   }
  }
  result.rear.push(window(-w*.12,Math.min(largeGlazing?2.1:1.4,w*.26),winBottom,winHeight));
 }
 if(d>4){
  const sideH=Math.min(largeGlazing?2:1.4,maxTop-1.30);
  for(const side of ['left','right'])
   result[side].push(window(-d*.08,Math.min(style==='panoramic'?d*.52:1.4,d*.26),
    largeGlazing?.82:1.3,sideH,largeGlazing));
 }
 // Clamp and reject openings that would break load-bearing corner piers.
 for(const [side,openings] of Object.entries(result)){
  const span=side==='front'||side==='rear'?w:d,margin=Math.min(.16,span*.07);
  result[side]=openings.map(o=>{
   const maxWidth=span-2*margin;
   const width=Math.min(o.width,maxWidth);
   const x=clamp(o.x,-span/2+margin+width/2,span/2-margin-width/2);
   const bottom=clamp(o.bottom,floor,maxTop-.3);
   return {...o,x,width,bottom,height:Math.min(o.height,maxTop-bottom)};
  }).filter(o=>o.width>.16&&o.height>.2);
 }
 return result;
}
export function wallPatches(width,baseY,topY,openings=[]){
 const w=Math.max(.5,finite(width,4)),minY=finite(baseY,.48),maxY=Math.max(minY+.05,finite(topY,3));
 const holes=openings.map(o=>({
  left:clamp(o.x-o.width/2,-w/2,w/2),right:clamp(o.x+o.width/2,-w/2,w/2),
  bottom:clamp(o.bottom,minY,maxY),top:clamp(o.bottom+o.height,minY,maxY)
 })).filter(o=>o.right-o.left>1e-5&&o.top-o.bottom>1e-5);
 const xs=[-w/2,w/2,...holes.flatMap(o=>[o.left,o.right])].sort((a,b)=>a-b);
 const patches=[];
 for(let i=0;i<xs.length-1;i++){
  const a=xs[i],b=xs[i+1],mid=(a+b)/2;
  if(b-a<1e-6)continue;
  const relevant=holes.filter(o=>mid>o.left+1e-7&&mid<o.right-1e-7);
  const ys=[minY,maxY,...relevant.flatMap(o=>[o.bottom,o.top])].sort((a,b)=>a-b);
  for(let j=0;j<ys.length-1;j++){
   const low=ys[j],high=ys[j+1];
   if(high-low<1e-6)continue;
   const ym=(low+high)/2;
   if(relevant.some(o=>ym>o.bottom+1e-7&&ym<o.top-1e-7))continue;
   patches.push({x:(a+b)/2,y:(low+high)/2,width:b-a,height:high-low});
  }
 }
 return patches;
}


/** Survey-space roof drainage. Pitched-roof downpipes attach to the
 * supporting side wall under a real eave, NOT across the front windows.
 * For a gable/hip roof, use two diagonally opposite outlet corners so
 * each independent eave run has a short downpipe run and sensible fall.
 * Flat roof downpipes are on the rear facade, below parapet scuppers.
 */
export function rainwaterDrainPlan({width=8,depth=7,roof='gable',style='barn'}={}){
 const w=Math.max(2,finite(width,8)),d=Math.max(2,finite(depth,7));
 const overhang=style==='chalet'?Math.min(1.2,Math.min(w,d)*.16):
  style==='cottage'?Math.min(.75,Math.min(w,d)*.09):
  Math.min(.42,Math.max(.22,Math.min(w,d)*.055));
 const gutterRadius=.115;
 if(roof==='flat'){
  return [-1,1].map(side=>({
   facade:'rear',side,end:-1,
   pipeX:side*(w*.5-Math.min(.45,w*.15)),
   pipeZ:-d*.5-.18,
   outletX:side*(w*.5-Math.min(.45,w*.15)),
   outletZ:-d*.5-overhang+.065,
   overhang,gutterRadius,pipeBottom:.68
  }));
 }
 const cornerInset=Math.min(.55,Math.max(.30,d*.08));
 return [-1,1].map(side=>{
  const end=side; // opposite ends reduce rainwater travel distance
  return {
   facade:side<0?'left':'right',side,end,
   pipeX:side*(w*.5+.175),
   pipeZ:end*(d*.5-cornerInset),
   outletX:side*(w*.5+overhang+.145),
   outletZ:end*(d*.5+overhang-.10),
   overhang,gutterRadius,pipeBottom:.68
  };
 });
}
/** Style-specific trim is a real assembled profile surrounding measured voids.
 * Modern: narrow powder-coated aluminum. Classic/timber: substantial casing.
 */
export function windowTrimProfile(style='barn'){
 const understated=['modern','hightech','panoramic','modular','barn','japandi'].includes(style);
 const timber=['scandi','timber','logcabin','chalet','tiny','bungalow'].includes(style);
 return {
  width:understated?.042:timber?.090:.112,
  depth:understated?.030:.046,
  material:understated?'#333E42':timber?'#9B856D':'#C3BCB0',
  recessedWindowMm:110,
  revealDepth:.16,
  sillProjection:.062,
  sillSlopeRadians:.075
 };
}
