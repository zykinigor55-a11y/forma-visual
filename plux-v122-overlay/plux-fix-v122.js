/* PLUX V12.2 — one icon per tile; remove obsolete credential row, keep older API field invisible for JS compatibility. */
(() => {
'use strict';
const grid=document.querySelector('#screen-modes .mode-grid');
if(grid) {
  [...grid.querySelectorAll('button.mode-card')].forEach(button=>{
    const title=button.querySelector('strong')?.textContent?.trim()||'';
    const subtitle=button.querySelector('small')?.textContent?.trim()||'';
    if(title)button.setAttribute('aria-label',[title,subtitle].filter(Boolean).join('. '));
    button.dataset.artworkSource='single-2k-atlas';
    button.querySelectorAll('.mode-emblem,strong,small,.plux-mode-liquid,.plux115-liquid').forEach(node=>node.remove());
  });
}
const prefs=document.getElementById('prefs');
const code=document.getElementById('demo-code');
if(prefs && code){
  code.type='hidden';code.style.display='none';
  prefs.querySelector('label[for="demo-code"]')?.remove();
  prefs.querySelector('.dialog-mini')?.remove();
}
for(const id of ['open-chat-quick','open-voice-quick','open-create-quick']){
 const button=document.getElementById(id);if(!button)continue;
 button.querySelectorAll(':scope>.plux113-steel-mic,:scope>.plux113-fluid,:scope>.plux115-liquid,:scope>.cd109-optics,:scope>.cd109-energy').forEach(n=>n.remove());
}
})();