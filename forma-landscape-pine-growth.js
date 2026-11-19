/* FORMA · per-instance Scots pine growth settings.
 * Zero density disables EXTRA growth while retaining the licensed base GLB.
 * Values are percentages and are stored per tree in the normalized project.
 */
export const PINE_GROWTH_DEFAULTS=Object.freeze({
 branchDensity:75,needleDensity:110,crownBase:40,crownSpread:100,irregularity:18,seed:1
});
export const PINE_GROWTH_RANGES=Object.freeze({
 branchDensity:[0,200,5],
 needleDensity:[0,250,5],
 crownBase:[20,65,1],
 crownSpread:[70,140,5],
 irregularity:[0,40,1]
});
export const PINE_GROWTH_PRESETS=Object.freeze([
 Object.freeze({name:'Естественная',branchDensity:75,needleDensity:110,crownBase:40,crownSpread:100,irregularity:18}),
 Object.freeze({name:'Пышная',branchDensity:145,needleDensity:240,crownBase:30,crownSpread:125,irregularity:21}),
 Object.freeze({name:'Лесная взрослая',branchDensity:110,needleDensity:155,crownBase:50,crownSpread:118,irregularity:35}),
 Object.freeze({name:'Высокая редкая',branchDensity:25,needleDensity:40,crownBase:62,crownSpread:95,irregularity:27}),
 Object.freeze({name:'Декоративная',branchDensity:170,needleDensity:245,crownBase:25,crownSpread:110,irregularity:10}),
 Object.freeze({name:'Без добавок',branchDensity:0,needleDensity:0,crownBase:40,crownSpread:100,irregularity:18})
]);
const clamp=(v,min,max,base)=>v===null||v===undefined||v===''||!Number.isFinite(Number(v))
 ?base:Math.max(min,Math.min(max,Number(v)));
export function normalizePineGrowth(value){
 const raw=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
 const out={};
 for(const [key,[min,max]] of Object.entries(PINE_GROWTH_RANGES)){
  out[key]=Math.round(clamp(raw[key],min,max,PINE_GROWTH_DEFAULTS[key]));
 }
 out.seed=Math.round(clamp(raw.seed,1,99999,PINE_GROWTH_DEFAULTS.seed));
 return out;
}
export function pineGrowthEquals(a,b){
 const x=normalizePineGrowth(a),y=normalizePineGrowth(b);
 return Object.keys(x).every(key=>x[key]===y[key]);
}
export function pineGrowthMarkup(value){
 const p=normalizePineGrowth(value);
 const controls=[
  ['branchDensity','Дополнительные ветки','%', 'Больше настоящих боковых побегов'],
  ['needleDensity','Дополнительная хвоя','%', 'Текстурированные пучки хвои на ветках'],
  ['crownBase','Начало новых ветвей','%', 'Доля высоты от земли'],
  ['crownSpread','Размах новых ветвей','%', 'Ширина и естественная форма кроны'],
  ['irregularity','Природная асимметрия','%', 'Разброс длины и направления веток']
 ];
 return '<section class="pine-growth-editor" aria-label="Параметры ветвей и хвои сосны">'+
  '<h3>ВЕТВИ · ХВОЯ · ФОРМА</h3>'+
  '<small>Меняйте выбранную сосну. Исходная PBR-модель коры и хвои сохраняется.</small>'+
  controls.map(([id,label,unit,hint])=>{
   const [min,max,step]=PINE_GROWTH_RANGES[id];
   return '<div class="pine-growth-control">'+
    '<label for="pineGrow-'+id+'">'+label+' <output id="pineGrowOut-'+id+'">'+p[id]+unit+'</output></label>'+
    '<input id="pineGrow-'+id+'" data-pine-growth="'+id+'" type="range" min="'+min+'" max="'+max+'" step="'+step+'" value="'+p[id]+'" aria-label="'+label+'">'+
    '<small>'+hint+'</small></div>';
  }).join('')+
  '<div class="pine-growth-presets" aria-label="Варианты кроны">'+
   PINE_GROWTH_PRESETS.map((p,i)=>'<button type="button" data-pine-growth-preset="'+i+'">'+p.name+'</button>').join('')+
  '</div><div class="pine-growth-footer">'+
  '<button type="button" id="pineNaturalRandom">↻ Сделать естественнее</button>'+
  '<button type="button" id="pineGrowthReset">Сбросить густоту</button></div>'+
  '<small>После отпускания ползунка изменения сохраняются. Ctrl+Z — отменить.</small></section>';
}
export function mountPineGrowth(el,object,{onPreview=()=>{},onCommit=()=>{}}={}){
 const original=normalizePineGrowth(object?.pine);
 let current={...original};
 let lastPreview=null;
 function preview(){
  el.querySelectorAll('[data-pine-growth]').forEach(input=>{
   const field=input.dataset.pineGrowth;current[field]=Number(input.value);
   const output=el.querySelector('#pineGrowOut-'+field);
   if(output)output.textContent=current[field]+'%';
  });
  lastPreview=normalizePineGrowth(current);
  onPreview(lastPreview);
 }
 function commit(){
  const next=normalizePineGrowth(current);
  onCommit(next);
 }
 for(const input of el.querySelectorAll('[data-pine-growth]')){
  input.addEventListener('input',preview);
  input.addEventListener('change',commit);
 }
 function apply(values){
  current=normalizePineGrowth(values);
  for(const input of el.querySelectorAll('[data-pine-growth]'))input.value=String(current[input.dataset.pineGrowth]);
  preview();commit();
 }
 el.querySelectorAll('[data-pine-growth-preset]').forEach(button=>button.addEventListener('click',()=>{
  const preset=PINE_GROWTH_PRESETS[Number(button.dataset.pineGrowthPreset)];
  if(preset)apply({...current,...preset});
 }));
 el.querySelector('#pineGrowthReset')?.addEventListener('click',()=>apply(PINE_GROWTH_DEFAULTS));
 el.querySelector('#pineNaturalRandom')?.addEventListener('click',()=>{
  const seed=current.seed===99999?1:current.seed+1;
  apply({...current,seed});
 });
 return {getValue:()=>normalizePineGrowth(current)};
}
