/* Source upload lives inside the Materials workspace, separate from a texture upload. */
const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href=new URL('./forma-detail-workspace.css',import.meta.url).href;document.head.append(stylesheet);
export function mountMaterialsSource({id,controls}){
 if(id!=='materials'||!controls||controls.querySelector('#fsMaterialsSource'))return;
 const card=document.createElement('section');card.className='fs-material-source';
 card.innerHTML='<h2>Ваш исходный кадр</h2><p>Загрузите фото, рендер или скриншот, на котором нужно заменить материал. Фактуру поверхности выбирайте отдельно ниже.</p><label class="fs-file">Загрузить свой исходник<input id="fsMaterialsSource" type="file" accept="image/png,image/jpeg,image/webp"></label><p class="fs-material-source-status" role="status" aria-live="polite"></p>';
 controls.prepend(card);const input=card.querySelector('input'),status=card.querySelector('[role="status"]');
 input.addEventListener('change',async()=>{
  const file=input.files?.[0];if(!file)return;const bridge=window.FORMA_ART_BRIDGE;
  try{
   if(bridge.snapshot()?.busy)throw Error('Дождитесь завершения обработки кадра.');
   if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Выберите PNG, JPG или WebP');
   if(file.size>14*1024*1024)throw Error('Максимальный размер — 14 МБ');
   input.disabled=true;status.textContent='Загружаем исходный кадр…';await bridge.uploadFile(file);
   status.textContent='Исходник загружен. Выделите поверхность и выберите материал ниже.';
  }catch(error){status.textContent=error.message||'Не удалось загрузить изображение';}
  finally{input.disabled=false;input.value='';}
 });
}
document.addEventListener('forma:workspace-open',event=>mountMaterialsSource(event.detail));
