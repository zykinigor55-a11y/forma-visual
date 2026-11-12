export type Zone="facade"|"roof"|"plinth"|"frames";
export type Finish="cedar"|"thermo"|"fiber"|"brick"|"titanium"|"graphite"|"slate"|"ivory"|"bronze";
export type MaterialInfo={id:Finish;name:string;manufacturer:string;sku:string;color:string;price:number;category:string;roughness:number;metalness:number;};
export type Config={width:number;height:number;depth:number;panelWidth:number;gap:number;orientation:"vertical"|"horizontal";zoneMaterials:Record<Zone,Finish>};
export type Opening={x0:number;x1:number;y0:number;y1:number};
export const ZONES:Zone[]=["facade","roof","plinth","frames"];
export const ZONE_NAME:Record<Zone,string>={facade:"Фасад",roof:"Кровля",plinth:"Цоколь",frames:"Окна"};
export const MATERIALS:MaterialInfo[]=[
{id:"cedar",name:"Cedar / Natural",manufacturer:"FORMA Materials",sku:"WD-103",color:"#ab886b",price:5400,category:"Древесина",roughness:.78,metalness:0},
{id:"thermo",name:"Thermo Ash / Umber",manufacturer:"Nord Wood",sku:"WD-218",color:"#786052",price:6900,category:"Древесина",roughness:.76,metalness:0},
{id:"fiber",name:"Mineral / Chalk",manufacturer:"FORMA Materials",sku:"FC-204",color:"#cfcac1",price:3600,category:"Фиброцемент",roughness:.88,metalness:0},
{id:"brick",name:"Limestone / Sand",manufacturer:"Nord Stone",sku:"BR-031",color:"#bcaa95",price:4800,category:"Кирпич",roughness:.92,metalness:0},
{id:"titanium",name:"Titanium / Satin",manufacturer:"Metal Form",sku:"MT-018",color:"#8a9296",price:6200,category:"Металл",roughness:.42,metalness:.62},
{id:"graphite",name:"Graphite / Matte",manufacturer:"Metal Form",sku:"MT-027",color:"#464c51",price:5800,category:"Металл",roughness:.57,metalness:.42},
{id:"slate",name:"Slate / Graphite",manufacturer:"Nord Stone",sku:"ST-006",color:"#626568",price:7100,category:"Камень",roughness:.94,metalness:0},
{id:"ivory",name:"Plaster / Ivory",manufacturer:"FORMA Materials",sku:"PL-002",color:"#e1dbd0",price:2900,category:"Штукатурка",roughness:.95,metalness:0},
{id:"bronze",name:"Champagne / Brushed",manufacturer:"Metal Form",sku:"MT-044",color:"#928473",price:7700,category:"Металл",roughness:.4,metalness:.66}
];
export const getMaterial=(id:string)=>MATERIALS.find(m=>m.id===id)||MATERIALS[0];
export const INITIAL:Config={width:10.8,height:3.65,depth:8.2,panelWidth:.165,gap:.012,orientation:"vertical",zoneMaterials:{facade:"cedar",roof:"graphite",plinth:"slate",frames:"graphite"}};
export const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
export function subtractOpenings(panel:Opening,openings:Opening[]):Opening[]{
 let parts=[panel];
 for(const opening of openings){
  const next:Opening[]=[];
  for(const p of parts){
   const x0=Math.max(p.x0,opening.x0),x1=Math.min(p.x1,opening.x1);
   const y0=Math.max(p.y0,opening.y0),y1=Math.min(p.y1,opening.y1);
   if(x1<=x0||y1<=y0){next.push(p);continue}
   next.push({x0:p.x0,x1:p.x1,y0:p.y0,y1:y0},{x0:p.x0,x1:p.x1,y0:y1,y1:p.y1},{x0:p.x0,x1:x0,y0,y1},{x0:x1,x1:p.x1,y0,y1});
  }
  parts=next.filter(p=>p.x1-p.x0>.002&&p.y1-p.y0>.002);
 }
 return parts;
}
export function frontOpenings(w:number,h:number):Array<Opening&{kind:"window"|"door";key:string}>{
 const def=[{key:"Window_01",x:-w*.325,cy:h*.50,ww:Math.min(2.05,w*.21),hh:h*.65,kind:"window" as const},
 {key:"Door_Entry",x:-w*.025,cy:h*.34,ww:Math.min(1.0,w*.12),hh:h*.68,kind:"door" as const},
 {key:"Window_02",x:w*.29,cy:h*.50,ww:Math.min(2.4,w*.24),hh:h*.65,kind:"window" as const}];
 return def.map(o=>({...o,x0:o.x-o.ww/2,x1:o.x+o.ww/2,y0:Math.max(.08,o.cy-o.hh/2),y1:Math.min(h-.14,o.cy+o.hh/2)}));
}
export function panelParts(w:number,h:number,pw:number,gap:number,orientation:Config["orientation"],holes:Opening[]):Opening[]{
 const vertical=orientation==="vertical",length=vertical?w:h,step=Math.max(.03,pw+gap),count=Math.min(240,Math.ceil(length/step));
 const result:Opening[]=[];
 for(let i=0;i<count;i++){
  const start=i*step;
  const a=vertical?{x0:-w/2+start,x1:Math.min(w/2,-w/2+start+pw),y0:0,y1:h}:{x0:-w/2,x1:w/2,y0:start,y1:Math.min(h,start+pw)};
  if(a.x1<=a.x0||a.y1<=a.y0)continue;
  result.push(...subtractOpenings(a,holes));
 }
 return result;
}
export function estimate(config:Config){
 const front=frontOpenings(config.width,config.height);
 const openingsArea=front.reduce((acc,p)=>acc+(p.x1-p.x0)*(p.y1-p.y0),0);
 const gross=config.width*config.height,net=Math.max(0,gross-openingsArea);
 const pieces=panelParts(config.width,config.height,config.panelWidth,config.gap,config.orientation,front);
 const actualCoverage=pieces.reduce((s,p)=>s+(p.x1-p.x0)*(p.y1-p.y0),0);
 const material=getMaterial(config.zoneMaterials.facade);
 return {gross,net,pieces:pieces.length,actualCoverage,illustrativeCost:Math.ceil(net*material.price),material};
}
