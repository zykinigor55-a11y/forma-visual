/* FORMA · three real Norway spruce growth profiles.
   Edits the EXISTING selected GLB object (not a second tree), with
   lightweight exact-height presets and original PBR needles / bark.
*/
export const SPRUCE_STAGES=Object.freeze([
 Object.freeze({id:'young',name:'Молодая · низкая',age:12,height:5,diameter:2.7,ratio:.54}),
 Object.freeze({id:'ordinary',name:'Обычная · как сейчас',age:48,height:16,diameter:9,ratio:.5625}),
 Object.freeze({id:'century',name:'Вековая · мощная',age:115,height:28,diameter:13.5,ratio:.482})
]);
export function spruceStage(value){
 return SPRUCE_STAGES.find(p=>p.id===value)||SPRUCE_STAGES[1];
}
export function spruceStageForAge(age){
 const n=Number(age);
 return n<=22?'young':n>=100?'century':'ordinary';
}
export function normalizeSpruceGrowth(raw){
 const data=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 const preset=spruceStage(data.type??data.stage);
 const valid=Number.isFinite(Number(data.age))&&data.age!==null&&data.age!==''&&Number(data.age)>=3&&Number(data.age)<=350;
 return {type:preset.id,...(valid?{age:Math.round(Number(data.age))}:{})};
}
export function spruceDimensions(height,stage){
 const p=spruceStage(stage);
 const h=Math.max(2,Math.min(40,Number(height)||p.height));
 return {height:h,diameter:Math.round(Math.max(.5,Math.min(30,h*p.ratio))*10)/10};
}
export function spruceGrowthMarkup(growth,object={}){
 const g=normalizeSpruceGrowth(growth);
 const p=spruceStage(g.type);
 const age=g.age??p.age;
 const h=Number(object.height)||p.height;
 return '<section class="spruce-native-editor" aria-label="Изменение самой 3D-ели">'+
 '<h3>ЕЛЬ · ВОЗРАСТ И ФОРМА</h3>'+
 '<label for="spruceType">Тип ели</label>'+
 '<select id="spruceType">'+SPRUCE_STAGES.map(x=>'<option value="'+x.id+'"'+(x.id===p.id?' selected':'')+'>'+x.name+'</option>').join('')+'</select>'+
 '<label for="spruceAge">Возраст, лет</label>'+
 '<input id="spruceAge" type="number" inputmode="numeric" min="3" max="350" step="1" value="'+age+'">'+
 '<label for="spruceHeight">Высота, м</label>'+
 '<input id="spruceHeight" type="number" inputmode="decimal" min="2" max="40" step=".5" value="'+h+'">'+
 '<small>Молодая — узкая и низкая. Обычная — исходная GLB. Вековая — с широкой нижней кроной и более мощным стволом. Материал родной хвои остаётся без изменений.</small>'+
 '</section>';
}
export function mountSpruceGrowth(el,object,{onCommit=()=>{}}={}){
 const type=el.querySelector('#spruceType');
 const age=el.querySelector('#spruceAge');
 const height=el.querySelector('#spruceHeight');
 if(!type||!age||!height)return null;
 function apply(){
  const nAge=Number(age.value),nHeight=Number(height.value);
  if(age.value===''||height.value===''||!Number.isFinite(nAge)||!Number.isFinite(nHeight)||
   nAge<3||nAge>350||nHeight<2||nHeight>40)return;
  onCommit({spruce:{type:type.value,age:Math.round(nAge)},height:nHeight});
 }
 type.addEventListener('change',()=>{
  const p=spruceStage(type.value);
  age.value=String(p.age);height.value=String(p.height);apply();
 });
 age.addEventListener('change',()=>{
  const n=Number(age.value);
  if(Number.isFinite(n)&&age.value!==''&&n>=3&&n<=350)type.value=spruceStageForAge(n);
  apply();
 });
 height.addEventListener('change',apply);
 return {getValue:()=>({
  spruce:normalizeSpruceGrowth({type:type.value,age:age.value}),
  height:Number(height.value)
 })};
}
