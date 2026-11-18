/* FORMA | Species-specific growth parameters in real metres.
   Pure botanical rules are testable without Three.js and keep the native 3D
   editable, as opposed to substituting a flat sprite or an AI image. */
export const SHRUB_HEIGHT_M=Object.freeze({
 juniper:.55,hydrangea:1.55,spirea:.85,barberry:1.15,
 dogwood:2.25,'thuja-globe':1.45,lavender:.55,boxwood:.95
});
export function naturalCrown(id,t){
 const f=Math.max(0,Math.min(1,Number(t)||0));
 switch(id){
  case 'pine':return (.24+.79*Math.sin(Math.PI*(f*.78+.09)))*(.88-.17*f);
  case 'spruce':return Math.pow(1-f,.90)*.97+.055;
  case 'birch':return .13+.85*Math.pow(Math.sin(Math.PI*f),.8);
  case 'oak':return .25+.82*Math.pow(Math.sin(Math.PI*f),.32);
  case 'maple':return .15+.90*Math.pow(Math.sin(Math.PI*f),.50);
  case 'linden':return .13+.87*Math.pow(Math.sin(Math.PI*f),.42);
  case 'willow':return .55+.41*Math.pow(Math.sin(Math.PI*f),.35);
  case 'rowan':return .16+.73*Math.pow(Math.sin(Math.PI*f),.63);
  case 'apple':return .26+.78*Math.pow(Math.sin(Math.PI*f),.42);
  case 'sakura':return .24+.83*Math.pow(Math.sin(Math.PI*f),.45);
  default:return .18+.8*Math.sin(Math.PI*f);
 }
}
export function branchTipDrop(id,height,t){
 const h=Math.max(.25,Number(height)||1),f=Math.max(0,Math.min(1,Number(t)||0));
 if(id==='willow')return h*(.18+.19*(1-f));
 if(id==='birch')return h*(.015+.045*(1-f));
 if(id==='spruce')return h*(.02+.03*(1-f));
 return 0;
}
export function botanicalLeafScale(id,height,diameter){
 const ratio=Math.max(.2,Math.min(30,Number(diameter)||1))/Math.max(.25,Number(height)||1);
 if(id==='pine'||id==='spruce')return .55;
 if(id==='willow'||id==='birch'||id==='rowan')return .54;
 if(id==='oak')return .89;
 if(id==='maple')return .80;
 if(id==='lavender'||id==='juniper')return .52;
 return Math.min(1,Math.max(.55,.78+.15*ratio));
}

/* A measured scene may contain hundreds of individual plants. Keep silhouette
   quality high near the camera while bounding instancing costs on mobile. */
export function vegetationQuality(viewWidth,plantCount=1,view='3d'){
 const width=Math.max(200,Number(viewWidth)||1200),count=Math.max(0,Number(plantCount)||0);
 const device=width<=650?.46:width<=1024?.70:1;
 const crowd=count<=3?1:count<=6?.78:count<=12?.50:count<=35?.36:count<=80?.26:.20;
 const overhead=view==='2d'?.82:1;
 return Math.max(.22,Math.min(1,device*crowd*overhead));
}

/* Parametric species leaf silhouettes. Returned outline points are normalized
 * in the leaf plane; the 3D mesh built from them is lightly curved and double
 * sided, never a camera-facing tree billboard. */
export function leafOutline(id,steps=20){
 const n=Math.max(12,Math.min(32,Math.round(steps))),points=[];
 for(let i=0;i<n;i++){
  const a=2*Math.PI*i/n,cs=Math.cos(a),sn=Math.sin(a);
  let width=.44,length=.70,serration=1;
  if(id==='willow'){width=.16;length=1.18}
  else if(id==='birch'){width=.38;length=.69;serration=1+.075*Math.cos(a*14)}
  else if(id==='oak'){width=.51;length=.77;serration=.82+.20*Math.cos(a*6)}
  else if(id==='maple'){width=.68;length=.86;serration=.73+.27*Math.cos(a*5)}
  else if(id==='linden'){width=.65;length=.75;serration=1-.17*Math.exp(-Math.pow((a-Math.PI/2)/.30,2))}
  else if(id==='rowan'){width=.28;length=.72;serration=1+.045*Math.cos(a*12)}
  else if(id==='apple'){width=.46;length=.70}
  else if(id==='sakura'){width=.47;length=.78;serration=1+.05*Math.cos(a*12)}
  else if(id==='hydrangea'){width=.59;length=.73;serration=1+.04*Math.cos(a*14)}
  else if(id==='boxwood'||id==='thuja-globe'){width=.33;length=.42}
  else if(id==='lavender'){width=.11;length=.60}
  if(id==='maple'&&sn<-.50)serration*=.80;
  points.push([cs*width*serration,sn*length*serration]);
 }
 return points;
}
