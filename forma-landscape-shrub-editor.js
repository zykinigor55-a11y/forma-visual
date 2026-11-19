/* Small, species-safe edit panel for already planted shrubs.
 * All changes are real-world dimensions or variations stored in the 2D/3D project.
 * Mesh details are never falsely described as separately editable GLB flowers.
 */
export const SHRUB_PRESETS=Object.freeze({young:.7,normal:1,adult:1.3});
export function shrubSizePreset(height,diameter,id){
 const mult=SHRUB_PRESETS[id];
 if(!Number.isFinite(mult)||!Number.isFinite(Number(height))||!Number.isFinite(Number(diameter)))return null;
 return {height:Math.round(Math.max(.2,Math.min(6,Number(height)*mult))*100)/100,
  diameter:Math.round(Math.max(.2,Math.min(10,Number(diameter)*mult))*100)/100};
}
export function shrubEditorMarkup({id,variant=1,real=false,loading=false,failed=false,season='summer'}={}){
 const picked=Math.max(1,Math.min(3,Math.round(Number(variant)||1)));
 const type=String(id||'кустарник').replace(/[<>&"]/g,'');
 return '<div class="forma-shrub-editor" aria-label="Редактор кустарника">'+
  '<strong>РЕДАКТОР КУСТАРНИКА</strong><small>'+type+'</small>'+
  '<p class="forma-shrub-status">'+(real?'✓ Подключён GLB':loading?'Загружаем модель GLB…':failed?'⚠ Ошибка загрузки GLB':'3D-геометрия растения')+
  (season!=='summer'?' · сезонный вид':'')+'</p>'+
  '<label>Возраст / размер</label><div class="forma-shrub-buttons">'+
  [['young','Молодой'],['normal','Обычный'],['adult','Взрослый']].map(([key,text])=>'<button type="button" data-shrub-size="'+key+'">'+text+'</button>').join('')+
  '</div><label>Вариант внешнего вида</label><div class="forma-shrub-buttons">'+
  [1,2,3].map(x=>'<button type="button" data-shrub-variant="'+x+'" aria-pressed="'+(x===picked)+'" class="'+(x===picked?'active':'')+'">№ '+x+'</button>').join('')+
  '</div><small>Ниже можно точно указать высоту, ширину и поворот. У готовой GLB меняется ракурс исходной формы, её цветы и ветки не редактируются отдельно.</small>'+
  '<button class="forma-shrub-focus" type="button" id="shrubFocus">Приблизить куст</button>'+
  (failed?'<button type="button" id="shrubRetry">Загрузить GLB повторно</button>':'')+
  '</div>';
}
