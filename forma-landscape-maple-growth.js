// Design presets, not an exact biological age prediction.
export const MAPLE_STAGES=[
 {age:18,name:'Молодой',height:10,diameter:6,trunk:.022,branches:18,curve:1,spread:1,leafDensity:1},
 {age:45,name:'Взрослый',height:17,diameter:12,trunk:.034,branches:20,curve:1.22,spread:1.22,leafDensity:1.13},
 {age:110,name:'Вековой',height:23,diameter:19,trunk:.048,branches:23,curve:1.48,spread:1.48,leafDensity:1.25}
];
const anchors=[{age:5,name:'Саженец',height:3.5,diameter:1.8,trunk:.014,branches:9,curve:.66,spread:.78,leafDensity:.68},...MAPLE_STAGES];
export function normalizeMapleGrowth(value){
 const n=Number(value?.age);return {age:Number.isFinite(n)&&n>=5?Math.min(110,Math.round(n)):18};
}
export function mapleProfile(value){
 const {age}=normalizeMapleGrowth(value);const upper=anchors.findIndex(x=>x.age>=age);
 if(upper<=0)return {...anchors[0],age};
 const a=anchors[upper-1],b=anchors[upper],t=(age-a.age)/(b.age-a.age),out={age,name:age<30?'Молодой':age<85?'Взрослый':'Вековой'};
 for(const key of ['height','diameter','trunk','branches','curve','spread','leafDensity'])out[key]=a[key]+(b[key]-a[key])*t;
 out.branches=Math.round(out.branches);return out;
}
export function mapleDimensions(value){const p=mapleProfile(value);return {height:Math.round(p.height*10)/10,diameter:Math.round(p.diameter*10)/10};}
export function mapleGrowthMarkup(object){
 const {age}=normalizeMapleGrowth(object.maple);
 return '<section class="roof-garland-editor" id="mapleGrowth"><strong>КЛЁН · ВОЗРАСТ И ФОРМА</strong><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin:8px 0">'+MAPLE_STAGES.map(p=>'<button type="button" data-maple-age="'+p.age+'" aria-pressed="'+(age===p.age)+'" style="min-height:44px;padding:5px;font-size:12px;'+(age===p.age?'border:1px solid #c9ae85;background:#514839':'')+'">'+p.name+'</button>').join('')+'</div><label for="mapleAge">Возраст <output id="mapleAgeValue">'+age+' лет</output></label><input id="mapleAge" type="range" min="5" max="110" step="1" value="'+age+'" style="width:100%"><small id="mapleAgeHint">Высота '+Number(object.height||10).toFixed(1)+' м · крона '+Number(object.diameter||6).toFixed(1)+' м</small><small>При изменении возраста перестраиваются ствол, ветви и листва. Модель обновляется после отпускания ползунка. Размеры можно уточнить ниже.</small></section>';
}
export function mountMapleGrowth(el,object,onCommit){
 const slider=el.querySelector('#mapleAge'),out=el.querySelector('#mapleAgeValue'),hint=el.querySelector('#mapleAgeHint');if(!slider)return;
 slider.addEventListener('input',()=>{const age=Number(slider.value),d=mapleDimensions({age});out.textContent=age+' лет';hint.textContent='Высота '+d.height+' м · крона '+d.diameter+' м';});
 slider.addEventListener('change',()=>onCommit({age:Number(slider.value)}));
 el.querySelectorAll('[data-maple-age]').forEach(b=>b.addEventListener('click',()=>onCommit({age:Number(b.dataset.mapleAge)})));
}
