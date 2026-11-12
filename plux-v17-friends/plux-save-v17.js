/* PLUX v17 — phone save utility for images & MP4 in modern browsers.
 * Direct download first, Android share sheet as fallback. Native APK MediaStore
 * saving requires a separate Capacitor plugin; this module does not pretend otherwise.
 */
(()=>{
 'use strict';
 if(window.PLUXSaveV17)return;
 const allowed=/^(image\/(png|jpeg|webp)|video\/mp4|application\/pdf)$/;
 function message(text){
  const n=document.getElementById('plux129-notice');
  if(n){n.textContent=text;n.classList.add('visible');setTimeout(()=>n.classList.remove('visible'),5200);}
  else window.alert(text);
 }
 function downloadBlob(blob,name){
   const url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download=name;a.rel='noopener noreferrer';
   a.style.display='none';document.body.append(a);
   a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),90000);
 }
 async function save(source,filename='PLUX-file.png',requested='image/png'){
   const name=String(filename).replace(/[^a-zA-Zа-яА-Я0-9_.-]/g,'_').slice(0,120);
   try{
     if(typeof source!=='string'||!(source.startsWith('https://')||source.startsWith('data:')||source.startsWith('blob:')))throw Error('Нет файла для сохранения');
     let blob;
     if(source.startsWith('data:')){
       const m=/^data:([^;]+);base64,(.*)$/s.exec(source);
       if(!m||!allowed.test(m[1]))throw Error('Неизвестный формат файла');
       const binary=atob(m[2]),b=new Uint8Array(binary.length);
       for(let i=0;i<binary.length;i++)b[i]=binary.charCodeAt(i);
       blob=new Blob([b],{type:m[1]});
     }else{
       const res=await fetch(source,{mode:'cors',credentials:'omit'});
       if(!res.ok)throw Error('Не удалось загрузить файл ('+res.status+')');
       blob=await res.blob();
     }
     if(!blob.size)throw Error('Пустой файл');
     if(blob.size>80*1024*1024)throw Error('Файл больше 80 МБ');
     const type=blob.type.split(';')[0]||requested;
     if(!allowed.test(type))throw Error('Неподдерживаемый формат '+type);
     const file=new File([blob],name,{type,lastModified:Date.now()});
     if(window.Capacitor?.isNativePlatform?.()){
       const saver=window.Capacitor?.Plugins?.PLUXMediaSaver;
       if(saver?.saveBase64){
         // Optional native plugin; never assume it is installed in test APK.
         const encoded=await new Promise((resolve,reject)=>{
           const r=new FileReader();r.onerror=()=>reject(Error('Ошибка чтения файла'));
           r.onload=()=>resolve(String(r.result).split(',')[1]);r.readAsDataURL(blob);
         });
         await saver.saveBase64({data:encoded,mimeType:type,fileName:name});
         message('Сохранено в галерею телефона');return true;
       }
     }
     // On Android, navigator.share can expose a system Save/Files destination.
     if(navigator.canShare?.({files:[file]})&&navigator.share){
       await navigator.share({files:[file],title:name});
       return true;
     }
     downloadBlob(blob,name);
     message('Файл передан браузеру для сохранения. Проверь папку «Загрузки».');
     return true;
   }catch(e){
     // For a remote video stream, a same-origin blob may be unavailable due to CORS.
     // Try the server-side attachment route without inventing a successful download.
     if(source.startsWith('https://')){
       const a=document.createElement('a');
       a.href=source+(source.includes('?')?'&':'?')+'download=1';
       a.target='_blank';a.rel='noopener noreferrer';a.download=name;
       document.body.append(a);a.click();a.remove();
       message('Открыл файл для скачивания. Если загрузка не началась, выбери «Скачать» в браузере.');
     }else message(String(e?.message||'Не удалось сохранить.').slice(0,180));
     return false;
   }
 }
 window.PLUXSaveV17={save,downloadBlob};
})();