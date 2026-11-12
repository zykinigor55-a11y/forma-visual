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
  // V31.8.4: visual, lossless validation. Keep full pasted prompts so the user
  // can edit them rather than silently discarding architectural instructions.
  const maxPromptChars=1300;
  let createBusy=false;
  const counterFooter=document.createElement('div');
  counterFooter.className='plux3184-prompt-footer';
  counterFooter.innerHTML='<span class="plux3184-prompt-hint" id="plux3184-prompt-hint">Минимум 3 символа</span><div class="plux3184-prompt-right"><button class="plux3184-prompt-shorten" type="button" hidden>Сократить</button><output class="plux3184-prompt-count" id="plux3184-prompt-count" for="image-prompt">0 / 1300</output></div>';
  const countOutput=counterFooter.querySelector('.plux3184-prompt-count');
  const counterHint=counterFooter.querySelector('.plux3184-prompt-hint');
  const shortenButton=counterFooter.querySelector('.plux3184-prompt-shorten');
  if(prompt){
    const promptContainer=prompt.closest('.create-prompt-wrap')||prompt;
    promptContainer.insertAdjacentElement('afterend',counterFooter);
    const ariaHint=prompt.getAttribute('aria-describedby');
    prompt.setAttribute('aria-describedby',[ariaHint,'plux3184-prompt-count','plux3184-prompt-hint'].filter(Boolean).join(' '));
  }
  function updatePromptCounter(){
    const count=prompt?.value?.length||0;
    const trimmed=prompt?.value?.trim()?.length||0;
    const over=count>maxPromptChars;
    const near=count>=1100&&!over;
    counterFooter.classList.toggle('plux3184-near',near);
    counterFooter.classList.toggle('plux3184-over',over);
    countOutput.value=count+' / '+maxPromptChars;
    countOutput.textContent=count+' / '+maxPromptChars;
    counterHint.textContent=over
      ?'Слишком длинное описание: убери '+(count-maxPromptChars)+' симв.'
      :trimmed<3?'Минимум 3 символа'
      :near?'Приближаешься к лимиту':'Описание готово к генерации';
    shortenButton.hidden=!over;
    createButton.disabled=createBusy||trimmed<3||over;
    createButton.setAttribute('aria-describedby',over?'plux3184-prompt-hint':'plux3184-prompt-count');
    return {count,over,valid:trimmed>=3&&!over};
  }
  shortenButton.addEventListener('click',()=>{
    if(!prompt)return;
    // Explicit user action: never lose the rest of a long prompt automatically.
    let text=prompt.value.slice(0,maxPromptChars);
    if(/[\uD800-\uDBFF]$/.test(text))text=text.slice(0,-1);
    prompt.value=text;
    prompt.dispatchEvent(new Event('input',{bubbles:true}));
    prompt.focus();
    notify('Описание сокращено до 1300 символов.');
  });
  prompt?.addEventListener('input',updatePromptCounter);
  prompt?.addEventListener('change',updatePromptCounter);
  updatePromptCounter();
  // PLUX V17: explicit image edit mode with an actual reference image.
  const editor=document.createElement('section');
  editor.className='plux17-editor';
  editor.innerHTML='<div class="plux17-modebar"><button type="button" class="active" data-mode="create">✦ Создать с нуля</button><button type="button" data-mode="edit">▧ Редактировать фото</button></div><label class="plux17-upload" for="plux17-source">＋ Загрузить своё фото <small>JPG / PNG / WEBP · до 4 МБ</small></label><input id="plux17-source" type="file" accept="image/jpeg,image/png,image/webp" hidden><div class="plux17-preview" hidden><img alt="Ваше фото для редактирования"><div><strong>Исходная фотография</strong><small>Будут изменены только указанные элементы</small><button type="button">Удалить фото</button></div></div>';
  const before=prompt?.closest('.create-prompt-wrap')||prompt;
  (before?.parentNode||createScreen).insertBefore(editor,before||createScreen.firstChild);
  const source=editor.querySelector('input');
  const preview=editor.querySelector('.plux17-preview');
  const modes=Array.from(editor.querySelectorAll('[data-mode]'));
  let editMode=false,referenceImage='';
  function updateMode(mode){
    editMode=mode==='edit';
    modes.forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
    source.closest('.plux17-editor').classList.toggle('plux17-editing',editMode);
    if(prompt)prompt.placeholder=editMode?'Например, замени фон на сосновый лес. Сам дом, ракурс и геометрию сохрани без изменений…':'Опиши, что хочешь создать…';
  }
  modes.forEach(b=>b.addEventListener('click',()=>updateMode(b.dataset.mode)));
  const clear=()=>{referenceImage='';source.value='';preview.hidden=true;preview.querySelector('img').removeAttribute('src');updateMode('create')};
  preview.querySelector('button').addEventListener('click',clear);
  source.addEventListener('change',async()=>{
    const file=source.files?.[0];
    if(!file)return;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>4*1024*1024){notify('Выберите JPG, PNG или WEBP до 4 МБ.');source.value='';return}
    try{
      const blobUrl=URL.createObjectURL(file);
      const img=new Image();
      try{
        await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=blobUrl});
        const factor=Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight));
        const canvas=document.createElement('canvas');canvas.width=Math.round(img.naturalWidth*factor);canvas.height=Math.round(img.naturalHeight*factor);
        if(!canvas.width||!canvas.height||canvas.width*canvas.height>10000000)throw Error('Слишком большое фото');
        canvas.getContext('2d',{alpha:false}).drawImage(img,0,0,canvas.width,canvas.height);
        referenceImage=canvas.toDataURL('image/jpeg',.82);
        if(referenceImage.length>5_700_000)throw Error('Сожмите фото до 4 МБ');
        preview.querySelector('img').src=referenceImage;preview.hidden=false;updateMode('edit');
      }finally{URL.revokeObjectURL(blobUrl)}
    }catch(e){notify(e.message||'Не удалось загрузить фото');clear()}
  });
  const descriptions={
    'Реализм':['Фотореализм','Как настоящее фото'],
    'Арт':['Иллюстрация','Художественный рисунок'],
    '3D':['3D-рендер','Объёмная графика'],
    'Анимация':['Мультстиль','Кадр мультфильма']
  };
  createScreen.querySelectorAll('.create-chips [data-style]').forEach(chip=>{
    const d=descriptions[chip.dataset.style];
    if(!d)return;
    chip.replaceChildren();
    const label=document.createElement('span');label.textContent=d[0];
    const hint=document.createElement('small');hint.textContent=d[1];
    chip.append(label,hint);
    chip.setAttribute('aria-label',d.join(' — '));
  });
  const result=document.createElement('section');result.className='plux129-result';result.hidden=true;
  createButton.insertAdjacentElement('afterend',result);
  createButton.addEventListener('click',async e=>{
    e.preventDefault();e.stopImmediatePropagation();
    if(createButton.disabled)return;
    const description=prompt?.value.trim()||'';
    const counterState=updatePromptCounter();
    if(counterState.over){notify('Слишком длинное описание. Сократи его до 1300 символов.');prompt?.focus();return}
    if(description.length<3){notify(editMode?'Опиши, что изменить на фото.':'Сначала опиши изображение.');prompt?.focus();return}
    if(editMode&&!referenceImage){notify('Загрузи фото, которое нужно отредактировать.');source.click();return}
    const selected=createScreen.querySelector('.create-chips .selected')?.dataset.style||'Реализм';
    const styles={'Реализм':'realism','Арт':'art','3D':'3d','Анимация':'animation'};
    createBusy=true;createButton.disabled=true;createButton.setAttribute('aria-busy','true');
    createButton.textContent='Создаю изображение…';
    result.hidden=false;result.classList.remove('plux129-error');result.replaceChildren();
    // Same visual component as the GPT Image 2 Chat card (pixel-identical).
    const ui=window.PLUXGenerationProgressV3188?.mount?.(result,{
      kind:"image",model:"Nano Banana 2.1",edit:editMode
    })||null;
    const progress=ui?ui.root:document.createElement('p');
    if(!ui){
      progress.className='plux129-generating';
      progress.textContent=editMode?'Редактируем фотографию…':'Создаём изображение…';
      result.append(progress);
    }
    try{
      const response=await fetch(base+'/api/image',{method:'POST',mode:'cors',credentials:'omit',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({prompt:description,style:styles[selected]||'realism',referenceImage:editMode?referenceImage:undefined}),signal:AbortSignal.timeout(125000)});
      const raw=await response.text();
      let data={};try{data=JSON.parse(raw)}catch{}
      if(!response.ok){
        const detail=typeof data.error==='string'?data.error:'';
        const messages={
          401:'Не прошла авторизация провайдера генерации (401). Проверьте API-ключ на сервере.',
          402:'У провайдера не хватает средств или кредитов (402).',
          403:'Генерация запрещена для текущего ключа или проекта (403).',
          404:'Сервер ПЛЮХ не поддерживает /api/image (404). Нужно подключить генератор на Render.',
          405:'На сервере нет рабочего обработчика POST /api/image (405).',
          413:'Слишком большой запрос. Попробуй фото меньшего размера (413).',
          429:'Провайдер ограничил частоту запросов или баланс (429).',
          500:'Внутренняя ошибка сервера генерации (500).',
          502:'Ошибка связи сервера с провайдером изображений (502).',
          503:'Сервис генерации пока не настроен или временно недоступен (503).'
        };
        // Keep the provider error returned by our backend. Generic HTTP 502 hid API Market failures.
        throw Error(detail ? detail+' (HTTP '+response.status+')' : (messages[response.status]||'Ошибка генерации (HTTP '+response.status+')'));
      }
      if(!raw.trim())throw Error('Сервер вернул пустой ответ. Проверь обработчик /api/image.');
      const src=data.image||data.url;
      if(!src)throw Error('Генератор не вернул файл.');
      const image=document.createElement('img');image.alt=editMode?'Отредактированная фотография':'Сгенерированное изображение';
      // 100% is shown only after actual image bytes have been loaded.
      ui?.state('Загружаю готовое изображение…');ui?.setProgress(93);
      await new Promise((resolve,reject)=>{
        image.onload=()=>image.naturalWidth>0?resolve():reject(Error('Изображение оказалось пустым.'));
        image.onerror=()=>reject(Error('Готовое изображение не удалось загрузить. Проверь интернет.'));
        image.src=src;
        if(image.complete&&image.naturalWidth>0)resolve();
      });
      ui?.finish();
      result.replaceChildren(image);
      const action=document.createElement('button');action.type='button';action.className='plux129-save';action.textContent='Сохранить на телефон';
      action.addEventListener('click',()=>window.PLUXSaveV17?.save(src,'PLUX-'+Date.now()+'.png','image/png')||notify('Скачивание недоступно. Открой изображение в браузере.'));
      result.append(action);result.scrollIntoView({block:'nearest',behavior:'smooth'});
    }catch(e){
      const msg=e?.name==='TimeoutError'?'Сервер долго отвечает. Генерация могла быть оплачена. Не отправляй запрос повторно сразу.':String(e.message||'Ошибка генерации');
      if(ui)ui.fail(msg);else progress.textContent=msg;
      result.classList.add('plux129-error');
    }
    finally{createBusy=false;updatePromptCounter();createButton.removeAttribute('aria-busy');createButton.innerHTML='Создать <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#ico-star"></use></svg>'}
  },{capture:true});
})();