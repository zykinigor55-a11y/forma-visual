/* PLUX V11.9 Black Crystal: one animated optical material on all real controls. */
(()=>{
 'use strict';
 const root=document.getElementById('app');if(!root)return;
 document.documentElement.classList.add('plux119-black-crystal');
 const selectors=[
 '#screen-home .home-head .glass-icon','#screen-home .speech-glass','#screen-home .quick-actions>.action-round','#screen-home .bottom-nav','#screen-home .bottom-nav>.nav-button',
 '#screen-modes .back-glass','#screen-modes .mode-card',
 '#screen-voice .back-glass','#screen-voice .voice-option','#screen-voice .big-voice-mic','#screen-voice .text-access',
 '#screen-chat .back-glass','#screen-chat .chat-inputbar','#screen-chat #chat-attach','#screen-chat .chat-send',
 '#screen-create .back-glass','#screen-create .create-chips>button','#screen-create .create-input','#screen-create #create-art-button',
 '#screen-onboard .name-field','#screen-onboard #continue-onboard','#screen-onboard .plux116-sound',
 '#prefs .back-glass','#prefs .create-action','#prefs .plux-balance-launch','#prefs .sound-preview',
 '#feature-dialog .back-glass','#feature-dialog .create-action','#plux-balance-dialog .plux-balance-close'
 ].join(',');
 function skin(el){
  if(el.classList.contains('plux119-glass'))return;
  el.classList.add('plux119-glass');
  for(const old of el.querySelectorAll(':scope>.plux115-liquid,:scope>.plux-mode-liquid,:scope>.plux113-fluid,:scope>.plux118-aura'))old.remove();
  const light=document.createElement('span');light.className='plux119-light';light.setAttribute('aria-hidden','true');el.insertBefore(light,el.firstChild);
 }
 function update(){root.querySelectorAll(selectors).forEach(skin)}
 update();
 const observer=new MutationObserver(list=>{
  if(list.some(item=>Array.from(item.addedNodes).some(node=>node.nodeType===1&&!node.classList?.contains('plux119-light'))))update();
 });
 observer.observe(root,{childList:true,subtree:true});
 const pointers=new Map();
 function release(id){const b=pointers.get(id);if(b)b.classList.remove('plux119-holding');pointers.delete(id)}
 root.addEventListener('pointerdown',e=>{
  const b=e.target.closest?.('button.plux119-glass');if(!b||!root.contains(b))return;
  b.classList.add('plux119-holding');pointers.set(e.pointerId,b);
 },{passive:true,capture:true});
 for(const eventName of ['pointerup','pointercancel'])window.addEventListener(eventName,e=>release(e.pointerId),{passive:true,capture:true});
 window.addEventListener('blur',()=>{for(const id of pointers.keys())release(id)});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)for(const id of pointers.keys())release(id)});
})();