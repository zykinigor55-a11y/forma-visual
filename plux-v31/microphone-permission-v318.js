/* PLUX V31.8 — ask Android for RECORD_AUDIO before WebRTC getUserMedia.
 * No permissions are requested until the user starts recording.
 */
(()=>{
"use strict";
if(window.PLUXMicPermissionV318)return;
const media=navigator.mediaDevices;
const native=()=>window.Capacitor?.isNativePlatform?.()===true;
const plugin=()=>window.Capacitor?.Plugins?.PLUXMicrophonePermission;
function notice(message){
 const voice=document.getElementById("screen-voice");
 if(!voice)return;
 let n=voice.querySelector(".plux318-mic-notice");
 if(!n){n=document.createElement("div");n.className="plux318-mic-notice";n.setAttribute("role","alert");voice.append(n)}
 n.textContent=message;n.hidden=false;
}
async function requestNative(){
 if(!native())return true;
 const m=plugin();
 if(!m?.requestMicrophone){
  // Old APK: avoid fake success, let WebView decide and show Android settings if denied.
  return true;
 }
 const res=await m.requestMicrophone();
 if(res?.granted!==true)throw Error("Микрофон не разрешён. Открой настройки Android → PLUX → Разрешения.");
 return true;
}
if(media&&typeof media.getUserMedia==="function"){
 const original=media.getUserMedia.bind(media);
 try{
  media.getUserMedia=async constraints=>{
   if(!constraints?.audio)return original(constraints);
   try{
    await requestNative();
    const stream=await original(constraints);
    const alert=document.querySelector("#screen-voice .plux318-mic-notice");
    if(alert)alert.hidden=true;
    return stream;
   }catch(e){
    const name=String(e?.name||"");
    if(/NotAllowed|PermissionDenied/i.test(name))
     notice("Микрофон запрещён. Разреши его в настройках Android → Приложения → PLUX → Разрешения → Микрофон.");
    else if(/NotFound|DevicesNotFound/i.test(name))
     notice("Микрофон устройства не обнаружен. Проверь подключение и попробуй ещё раз.");
    else if(/NotReadable|TrackStart/i.test(name))
     notice("Микрофон занят другим приложением. Закрой диктофон или звонок и повтори.");
    else notice(String(e?.message||"Не удалось подключить микрофон").slice(0,200));
    throw e;
   }
  };
 }catch{
  // Some older browsers do not allow overriding getUserMedia; native permission can
  // still be requested on the direct click path through a capturing listener below.
 }
}
const selector="#screen-voice button, #open-voice-quick";
document.addEventListener("click",e=>{
 const b=e.target?.closest?.(selector);
 if(!b||!native()||!plugin()?.requestMicrophone)return;
 // Prewarm permission for actual mic action only, never on app load.
 const hint=(String(b.id||"")+" "+String(b.className||"")+" "+String(b.getAttribute("aria-label")||"")).toLowerCase();
 if(b.id!=="open-voice-quick"&&!/mic|micro|голос|говор|запис/.test(hint))return;
 void requestNative().catch(err=>notice(String(err.message||err)));
},true);
window.PLUXMicPermissionV318={request:requestNative};
})();