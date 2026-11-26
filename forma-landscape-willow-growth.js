// Authoring presets, not a botanical age prediction.
export const WILLOW_STAGES=Object.freeze([
 {age:10,name:'Молодая',height:5,diameter:4,trunk:.025,limbs:8,drop:.36,spread:.88},
 {age:35,name:'Взрослая',height:11,diameter:9,trunk:.044,limbs:14,drop:.60,spread:1},
 {age:75,name:'Старая',height:17,diameter:18,trunk:.058,limbs:18,drop:.66,spread:1.10}
]);
export function normalizeWillowGrowth(v){const age=Number(v?.age);return {age:Number.isFinite(age)&&age>=5?Math.min(100,Math.round(age)):35};}
export function willowProfile(v){const {age}=normalizeWillowGrowth(v),a=age<=35?WILLOW_STAGES[0]:WILLOW_STAGES[1],b=age<=35?WILLOW_STAGES[1]:WILLOW_STAGES[2],t=Math.max(0,Math.min(1,(age-a.age)/(b.age-a.age))),p={age};for(const k of ['height','diameter','trunk','limbs','drop','spread'])p[k]=a[k]+(b[k]-a[k])*t;p.limbs=Math.round(p.limbs);return p;}
export function willowDimensions(v){const p=willowProfile(v);return {height:Math.round(p.height*10)/10,diameter:Math.round(p.diameter*10)/10};}
export function willowGrowthMarkup(o){const {age}=normalizeWillowGrowth(o.willow);return '<section class="roof-garland-editor"><strong>ИВА · ВОЗРАСТ И ФОРМА</strong><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin:8px 0">'+WILLOW_STAGES.map(p=>'<button type="button" data-willow-age="'+p.age+'" aria-pressed="'+(age===p.age)+'" style="min-height:44px;padding:5px;font-size:12px;'+(age===p.age?'border:1px solid #c9ae85;background:#514839':'')+'">'+p.name+'</button>').join('')+'</div><small>'+age+' лет · '+Number(o.height).toFixed(1)+' × '+Number(o.diameter).toFixed(1)+' м. Меняются размеры, ствол, крона и побеги.</small></section>';}
export function mountWillowGrowth(el,o,commit){el.querySelectorAll('[data-willow-age]').forEach(b=>b.onclick=()=>commit({age:Number(b.dataset.willowAge)}));}
