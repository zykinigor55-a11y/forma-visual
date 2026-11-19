/* FORMA · simple, per-tree Scots pine controls.
 * Only age, real-world height and crown type are exposed.
 * The 3D renderer reshapes native GLB geometry rather than overlaying
 * differently-colored procedural branches and needles.
 */
export const PINE_TYPES=Object.freeze([
 Object.freeze({id:'solitary',label:'Одиночная · раскидистая',ratio:.52}),
 Object.freeze({id:'forest',label:'Лесная · стройная',ratio:.38}),
 Object.freeze({id:'garden',label:'Садовая · густая снизу',ratio:.60})
]);
export const PINE_GROWTH_DEFAULTS=Object.freeze({
 age:40,pineType:'solitary',branchDensity:75,needleDensity:110,
 crownBase:40,crownSpread:100,irregularity:18,seed:1
});
export const PINE_GROWTH_RANGES=Object.freeze({
 branchDensity:[0,200,5],needleDensity:[0,250,5],
 crownBase:[20,65,1],crownSpread:[70,140,5],irregularity:[0,40,1]
});
// Retained for compatibility with saved projects and older integrations.
// There are no preset buttons in the new pine editor.
export const PINE_GROWTH_PRESETS=Object.freeze([
 Object.freeze({name:'Одиночная',age:40,pineType:'solitary'}),
 Object.freeze({name:'Лесная',age:40,pineType:'forest'}),
 Object.freeze({name:'Садовая',age:40,pineType:'garden'})
]);
function bounded(v,min,max,defaultValue){
 if(v===null||v===undefined||v===''||!Number.isFinite(Number(v)))return defaultValue;
 return Math.max(min,Math.min(max,Number(v)));
}
export function normalizePineGrowth(input){
 const raw=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
 const pineType=PINE_TYPES.some(p=>p.id===raw.pineType)?raw.pineType:PINE_GROWTH_DEFAULTS.pineType;
 const out={age:Math.round(bounded(raw.age,3,150,PINE_GROWTH_DEFAULTS.age)),pineType};
 for(const [key,[min,max]] of Object.entries(PINE_GROWTH_RANGES)){
  out[key]=Math.round(bounded(raw[key],min,max,PINE_GROWTH_DEFAULTS[key]));
 }
 out.seed=Math.round(bounded(raw.seed,1,99999,PINE_GROWTH_DEFAULTS.seed));
 return out;
}
export function pineGrowthEquals(a,b){
 const x=normalizePineGrowth(a),y=normalizePineGrowth(b);
 return Object.keys(x).every(k=>x[k]===y[k]);
}
export function pineDimensions(height,age,type){
 const h=bounded(height,2,40,14);
 const t=PINE_TYPES.find(p=>p.id===type)||PINE_TYPES[0];
 const maturity=.73+.27*Math.min(1,Math.max(0,(Number(age)-3)/55));
 return {height:h,diameter:Math.round(Math.max(.5,Math.min(30,h*t.ratio*maturity))*10)/10};
}
export function pineGrowthMarkup(growth,instance={}){
 const p=normalizePineGrowth(growth),h=Number(instance.height)||14;
 return '<section class="pine-growth-editor pine-native-editor" aria-label="Изменение самой 3D-сосны">'+
  '<h3>СОСНА · ВОЗРАСТ И ФОРМА</h3>'+
  '<label for="pineAge">Возраст, лет</label>'+
  '<input id="pineAge" type="number" inputmode="numeric" min="3" max="150" step="1" value="'+p.age+'">'+
  '<label for="pineHeight">Высота, м</label>'+
  '<input id="pineHeight" type="number" inputmode="decimal" min="2" max="40" step=".5" value="'+h+'">'+
  '<label for="pineType">Тип сосны</label>'+
  '<select id="pineType">'+PINE_TYPES.map(t=>'<option value="'+t.id+'"'+(t.id===p.pineType?' selected':'')+'>'+t.label+'</option>').join('')+'</select>'+
  '<small>Меняется исходная GLB-модель: ветви развиваются снизу кроны, хвоя сохраняет родную фактуру и цвет. Значения сохраняются после изменения поля.</small>'+
  '</section>';
}
export function mountPineGrowth(el,object,{onCommit=()=>{}}={}){
 const age=el.querySelector('#pineAge'),height=el.querySelector('#pineHeight'),type=el.querySelector('#pineType');
 if(!age||!height||!type)return;
 function apply(){
  if(age.value.trim()===''||height.value.trim()==='')return;
  const a=Number(age.value),h=Number(height.value);
  if(!Number.isFinite(a)||!Number.isFinite(h)||a<3||a>150||h<2||h>40)return;
  const pine=normalizePineGrowth({...object.pine,age:a,pineType:type.value});
  onCommit({pine,height:h});
 }
 age.addEventListener('change',apply);
 height.addEventListener('change',apply);
 type.addEventListener('change',apply);
 return {getValue:()=>({pine:normalizePineGrowth({...object.pine,age:age.value,pineType:type.value}),height:Number(height.value)})};
}
