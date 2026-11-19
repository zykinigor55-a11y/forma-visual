/* Responsive metre-accurate pine controls. No GLB mutation or document writes during dragging. */
export const PINE_SIZE_PRESETS=Object.freeze([
 {name:'Молодая',height:5,diameter:2.5},
 {name:'Подросшая',height:9,diameter:4.5},
 {name:'Взрослая',height:14,diameter:7},
 {name:'Крупная',height:20,diameter:10}
]);
export function pineCrownAtHeight(height,ratio){
 const h=Number(height),r=Number(ratio);
 if(!Number.isFinite(h)||!Number.isFinite(r)||h<=0||r<=0)return null;
 return Math.max(.5,Math.min(30,Math.round(h*r*10)/10));
}
export function pineSizeMarkup(object,locked=true){
 const h=Number(object.height)||14,d=Number(object.diameter)||7;
 return '<section class="pine-scale-editor" aria-label="Размеры 3D-сосны">'+
  '<strong>СОСНА · РАЗМЕРЫ В МЕТРАХ</strong>'+
  '<small>Ползунки меняют дерево прямо в 3D. Отпустите ползунок, чтобы сохранить.</small>'+
  '<label for="pineScaleHeight">Высота <output id="pineScaleHeightOut">'+h.toFixed(1)+' м</output></label>'+
  '<input id="pineScaleHeight" aria-label="Высота сосны" type="range" min="2" max="40" step=".5" value="'+h+'">'+
  '<label for="pineScaleCrown">Диаметр кроны <output id="pineScaleCrownOut">'+d.toFixed(1)+' м</output></label>'+
  '<input id="pineScaleCrown" aria-label="Диаметр кроны сосны" type="range" min=".5" max="30" step=".5" value="'+d+'">'+
  '<label class="pine-scale-lock" for="pineScaleLock"><input id="pineScaleLock" type="checkbox" '+(locked?'checked':'')+'> Сохранять пропорции дерева</label>'+
  '<div class="pine-scale-presets">'+PINE_SIZE_PRESETS.map(p=>
    '<button type="button" data-pine-height="'+p.height+'" data-pine-crown="'+p.diameter+'">'+p.name+' · '+p.height+' м</button>'
   ).join('')+'</div>'+
  '<button type="button" class="pine-scale-reset" id="pineScaleReset">Сбросить · 14 × 7 м</button>'+
  '<small>Ширина и высота сохраняются в генплане. Ctrl+Z отменяет последнее изменение.</small>'+
  '</section>';
}
export function mountPineSizing(el,object,{locked=true,onLock=()=>{},onPreview=()=>{},onCommit=()=>{},onInvalid=()=>{}}={}){
 const hField=el.querySelector('[data-prop="height"]'),dField=el.querySelector('[data-prop="diameter"]');
 const hSlider=el.querySelector('#pineScaleHeight'),dSlider=el.querySelector('#pineScaleCrown');
 const hOut=el.querySelector('#pineScaleHeightOut'),dOut=el.querySelector('#pineScaleCrownOut');
 const lock=el.querySelector('#pineScaleLock');
 if(!hField||!dField||!hSlider||!dSlider||!hOut||!dOut||!lock)return;
 let ratio=(Number(object.diameter)||7)/(Number(object.height)||14);
 function preview(){
  const height=Number(hField.value),diameter=Number(dField.value);
  if(!Number.isFinite(height)||!Number.isFinite(diameter)||
   height<2||height>40||diameter<.5||diameter>30)return false;
  hOut.textContent=height.toFixed(1)+' м';
  dOut.textContent=diameter.toFixed(1)+' м';
  onPreview({height,diameter});
  return true;
 }
 function setSize(height,diameter){
  hField.value=String(height);dField.value=String(diameter);
  hSlider.value=String(height);dSlider.value=String(diameter);
  preview();
 }
 function heightInput(raw){
  if(raw==='')return;
  const height=Number(raw);
  if(!Number.isFinite(height)||height<=0)return;
  hField.value=raw;hSlider.value=raw;
  if(lock.checked){
   const d=pineCrownAtHeight(height,ratio);
   if(d!==null){dField.value=String(d);dSlider.value=String(d)}
  }
  preview();
 }
 function crownInput(raw){
  dField.value=raw;dSlider.value=raw;preview();
 }
 function commit(){
  if(!preview()){onInvalid();return}
  onCommit();
 }
 function updateLock(){
  locked=lock.checked;
  if(locked){
   const h=Number(hField.value),d=Number(dField.value);
   if(Number.isFinite(h)&&h>0&&Number.isFinite(d)&&d>0)ratio=d/h;
  }
  dField.disabled=locked;dSlider.disabled=locked;
  onLock(locked);
 }
 hSlider.addEventListener('input',()=>heightInput(hSlider.value));
 hSlider.addEventListener('change',commit);
 dSlider.addEventListener('input',()=>crownInput(dSlider.value));
 dSlider.addEventListener('change',commit);
 hField.addEventListener('input',()=>heightInput(hField.value));
 hField.addEventListener('change',commit);
 dField.addEventListener('input',()=>crownInput(dField.value));
 dField.addEventListener('change',commit);
 lock.addEventListener('change',updateLock);
 el.querySelectorAll('[data-pine-height]').forEach(button=>button.addEventListener('click',()=>{
  setSize(Number(button.dataset.pineHeight),Number(button.dataset.pineCrown));commit();
 }));
 el.querySelector('#pineScaleReset')?.addEventListener('click',()=>{setSize(14,7);commit()});
 updateLock();
}
