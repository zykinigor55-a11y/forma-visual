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
