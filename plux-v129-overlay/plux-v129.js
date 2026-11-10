/* PLUX V12.9 — OLED attachment picker and Nano Banana image generation */
(() => {
  'use strict';
  const base='https://pluh-voice-demo.onrender.com';
  const form=document.getElementById('chat-form');
  const attach=document.getElementById('chat-attach');
  const screen=document.getElementById('screen-chat');
  const createButton=document.getElementById('create-art-button');
  const createScreen=document.getElementById('screen-create');
  if(!form||!attach||!screen||!createButton||!createScreen)return;
  const uploads=[];
  const allowed=new Set(['image/png','image/jpeg','image/webp','application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain','text/markdown']);
  const label=(type)=>type==='application/pdf'?'PDF':type.includes('wordprocessingml')?'DOCX':type.startsWith('image/')?'Фото':'Текст';
  const notify=msg=>{
    let n=document.getElementById('plux129-notice');
    if(!n){n=document.createElement('div');n.id='plux129-notice';n.className='plux129-notice';n.setAttribute('role','status');document.body.append(n)}
    n.textContent=msg;n.classList.add('visible');clearTimeout(notify.timer);
    notify.timer=setTimeout(()=>n.classList.remove('visible'),4200);
  };
  const icon=(name)=>({
    camera:'<path d="M4 7h4l2-3h4l2 3h4v13H4z"/><circle cx="12" cy="13" r="4"/>',
    image:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m4 18 6-6 4 4 2-2 5 5"/>',
    file:'<path d="M7 2h8l5 5v15H7z M15 2v6h5 M10 13h7 M10 17h7"/>',
    close:'<path d="M5 5 19 19 M19 5 5 19"/>'
  })[name]||'';
  const svg=n=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" aria-hidden="true">'+icon(n)+'</svg>';
  const picker=document.createElement('div');picker.className='plux129-layer';picker.hidden=true;
  picker.innerHTML='<div class="plux129-shade" data-close></div><section class="plux129-sheet" role="dialog" aria-modal="true" aria-label="Прикрепить файл"><header><strong>Прикрепить к сообщению</strong><button type="button" class="plux129-x" data-close aria-label="Закрыть">'+svg('close')+'</button></header><div class="plux129-choices"><button type="button" data-pick="camera">'+svg('camera')+'<span>Камера</span></button><button type="button" data-pick="photo">'+svg('image')+'<span>Галерея</span></button><button type="button" data-pick="document">'+svg('file')+'<span>Документ</span></button></div><p>До 3 файлов. Фото, PDF, DOCX и текст. Файлы обрабатываются при отправке и не сохраняются на сервере.</p></section>';
  document.body.append(picker);
  const selectFile=document.createElement('input');selectFile.type='file';selectFile.hidden=true;
  const selectPhoto=document.createElement('input');selectPhoto.type='file';selectPhoto.accept='image/*';selectPhoto.multiple=true;selectPhoto.hidden=true;
  const selectCamera=document.createElement('input');selectCamera.type='file';selectCamera.accept='image/*';selectCamera.capture='environment';selectCamera.hidden=true;
  selectFile.accept='.pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown';selectFile.multiple=true;
  document.body.append(selectFile,selectPhoto,selectCamera);
  const tray=document.createElement('div');tray.id='plux129-attachments';tray.className='plux129-attachments';tray.hidden=true;
  form.parentNode.insertBefore(tray,form);
  const closePicker=()=>{picker.hidden=true;document.body.classList.remove('plux129-picker-open')};
  const openPicker=()=>{picker.hidden=false;document.body.classList.add('plux129-picker-open')};
  attach.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();openPicker()},{capture:true});
  picker.addEventListener('click',e=>{
    if(e.target.closest('[data-close]')){closePicker();return}
    const action=e.target.closest('[data-pick]')?.dataset.pick;
    if(!action)return;
    closePicker();
    (action==='camera'?selectCamera:action==='photo'?selectPhoto:selectFile).click();
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!picker.hidden)closePicker()});
  const readUrl=file=>new Promise((resolve,reject)=>{
    const reader=new FileReader();reader.onload=()=>resolve(reader.result);
    reader.onerror=()=>reject(Error('Не удалось прочитать файл.'));reader.readAsDataURL(file);
  });
  const compress=async file=>{
    if(!file.type.startsWith('image/'))return await readUrl(file);
    const objectUrl=URL.createObjectURL(file);
    try{
      const img=new Image();
      await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('Формат изображения не поддерживается браузером.'));img.src=objectUrl});
      const scale=Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight));
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
      canvas.getContext('2d',{alpha:false}).drawImage(img,0,0,canvas.width,canvas.height);
      return canvas.toDataURL('image/jpeg',.80);
    }finally{URL.revokeObjectURL(objectUrl)}
  };
  function render(){
    tray.replaceChildren();tray.hidden=!uploads.length;
    uploads.forEach((item,index)=>{
      const node=document.createElement('div');node.className='plux129-chip';
      if(item.mime.startsWith('image/')){
        const img=document.createElement('img');img.src=item.dataUrl;img.alt='';node.append(img);
      }else{const type=document.createElement('b');type.textContent=label(item.mime);node.append(type)}
      const title=document.createElement('span');title.textContent=item.name;node.append(title);
      const remove=document.createElement('button');remove.type='button';remove.setAttribute('aria-label','Убрать '+item.name);remove.textContent='×';
      remove.addEventListener('click',()=>{uploads.splice(index,1);render()});node.append(remove);tray.append(node);
    });
  }
  async function chosen(event){
    const files=[...(event.target.files||[])];event.target.value='';
    for(const file of files){
      if(uploads.length>=3){notify('Не больше трёх вложений за сообщение.');break}
      let mime=file.type;
      if(!mime&&/\.pdf$/i.test(file.name))mime='application/pdf';
      if(!mime&&/\.docx$/i.test(file.name))mime='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      if(!mime&&/\.(txt|md)$/i.test(file.name))mime='text/plain';
      if(!allowed.has(mime)){notify('Этот формат не поддерживается.');continue}
      if(file.size>6*1024*1024){notify('Файл «'+file.name+'» больше 6 МБ.');continue}
      try{
        const dataUrl=await compress(file);
        if(dataUrl.length>8*1024*1024){notify('Слишком большой файл: '+file.name);continue}
        uploads.push({name:file.name||'Фото.jpg',mime:mime.startsWith('image/')?'image/jpeg':mime,dataUrl});
        render();
      }catch(e){notify(e.message||'Не удалось прикрепить файл.')}
    }
  }
  for(const input of [selectFile,selectPhoto,selectCamera])input.addEventListener('change',e=>{void chosen(e)});
  window.PLUXMediaV129={
    hasAttachments:()=>uploads.length>0,
    takeAttachments:()=>{const result=uploads.map(x=>({...x}));uploads.length=0;render();return result},
    notice:notify
  };
  const prompt=document.getElementById('image-prompt');
  const result=document.createElement('section');result.className='plux129-result';result.hidden=true;
  createButton.insertAdjacentElement('afterend',result);
  createButton.addEventListener('click',async e=>{
    e.preventDefault();e.stopImmediatePropagation();
    if(createButton.disabled)return;
    const description=prompt?.value.trim()||'';
    if(description.length<3){notify('Сначала опиши изображение.');prompt?.focus();return}
    const selected=createScreen.querySelector('.create-chips .selected')?.dataset.style||'Реализм';
    const styles={'Реализм':'realism','Арт':'art','3D':'3d','Анимация':'animation'};
    createButton.disabled=true;createButton.setAttribute('aria-busy','true');
    createButton.textContent='Создаю изображение…';
    result.hidden=false;result.replaceChildren();
    const progress=document.createElement('p');progress.className='plux129-generating';progress.textContent='Nano Banana создаёт изображение. Запрос может занять около минуты.';
    result.append(progress);
    try{
      const response=await fetch(base+'/api/image',{method:'POST',mode:'cors',credentials:'omit',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({prompt:description,style:styles[selected]||'realism'}),signal:AbortSignal.timeout(125000)});
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw Error(data.error||'Не удалось создать изображение');
      const src=data.image||data.url;
      if(!src)throw Error('Генератор не вернул файл.');
      const image=document.createElement('img');image.src=src;image.alt='Результат генерации Nano Banana';
      result.replaceChildren(image);
      const action=document.createElement('a');action.className='plux129-save';action.textContent='Сохранить изображение';
      action.href=src;
      if(src.startsWith('data:'))action.download='PLUX_Nano_Banana.png';
      else{action.target='_blank';action.rel='noopener noreferrer'}
      result.append(action);
      const animate=document.createElement('button');
      animate.type='button';
      animate.className='plux17-animate plux17-animate-create';
      animate.textContent='Сделать видео';
      animate.addEventListener('click',()=>{
        if(!window.PLUXVideoV16?.open){notify('Генератор видео недоступен.');return}
        window.PLUXVideoV16.open({
          imageDataUrl:src.startsWith('data:')?src:null,
          imageUrl:!src.startsWith('data:')?src:null,
          name:'Изображение ПЛЮХ',
          prompt:'Анимировать исходную картинку. Сохрани композицию, материалы, лица и архитектуру. Плавный кинематографичный пролёт камеры, естественное движение окружающей среды.'
        });
      });
      result.append(animate);
      result.scrollIntoView({block:'nearest',behavior:'smooth'});
    }catch(e){progress.textContent=e?.name==='TimeoutError'?'Сервер долго отвечает. Проверь баланс — генерация могла быть оплачена.':String(e.message||'Ошибка генерации');result.classList.add('plux129-error')}
    finally{createButton.disabled=false;createButton.removeAttribute('aria-busy');createButton.innerHTML='Создать <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#ico-star"></use></svg>'}
  },{capture:true});
})();