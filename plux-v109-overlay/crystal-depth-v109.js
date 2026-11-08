/* PLUX Crystal Depth V10.9 — reusable scalable optic shells, no canvas or video changes. */
(()=>{
'use strict';
const NS='http://www.w3.org/2000/svg';
const root=document.getElementById('app');
if(!root)return;
const sprite=document.createElementNS(NS,'svg');
sprite.setAttribute('aria-hidden','true');
sprite.setAttribute('width','0');sprite.setAttribute('height','0');
sprite.style.cssText='position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
sprite.innerHTML=[
'<defs>',
'<linearGradient id="cd109-edge" x1="5%" y1="6%" x2="94%" y2="98%">',
'<stop offset="0" stop-color="#fff" stop-opacity=".98"/>',
'<stop offset=".15" stop-color="#dbffff" stop-opacity=".87"/>',
'<stop offset=".37" stop-color="#708e9d" stop-opacity=".44"/>',
'<stop offset=".56" stop-color="#eaffff" stop-opacity=".8"/>',
'<stop offset=".76" stop-color="#aa88df" stop-opacity=".85"/>',
'<stop offset=".90" stop-color="#7deccc" stop-opacity=".94"/>',
'<stop offset="1" stop-color="#fdffff" stop-opacity=".92"/>',
'</linearGradient>',
'<linearGradient id="cd109-sheen" x1="0" y1="0" x2="1" y2="1">',
'<stop offset="0" stop-color="#fff" stop-opacity=".89"/>',
'<stop offset=".23" stop-color="#dffefe" stop-opacity=".51"/>',
'<stop offset=".68" stop-color="#fff" stop-opacity=".03"/>',
'<stop offset="1" stop-color="#ac8fff" stop-opacity=".2"/>',
'</linearGradient>',
'<linearGradient id="cd109-under" x1="0" y1="0" x2="1" y2="0">',
'<stop offset="0" stop-color="#33ffbb" stop-opacity=".1"/>',
'<stop offset=".42" stop-color="#c9fff3" stop-opacity=".84"/>',
'<stop offset=".72" stop-color="#9ee9ed" stop-opacity=".44"/>',
'<stop offset="1" stop-color="#c896ff" stop-opacity=".43"/>',
'</linearGradient>',
'<radialGradient id="cd109-wall" cx="28%" cy="17%" r="102%">',
'<stop offset="0" stop-color="#f8ffff" stop-opacity=".40"/>',
'<stop offset=".25" stop-color="#a7f5f7" stop-opacity=".18"/>',
'<stop offset=".6" stop-color="#4b8c9e" stop-opacity=".09"/>',
'<stop offset=".81" stop-color="#6c6caa" stop-opacity=".16"/>',
'<stop offset="1" stop-color="#1cf1af" stop-opacity=".27"/>',
'</radialGradient>',
'</defs>',
'<symbol id="cd109-orb" viewBox="0 0 120 120">',
'<path d="M60 2a58 58 0 1 0 0 116a58 58 0 1 0 0-116ZM60 14a46 46 0 1 1 0 92a46 46 0 1 1 0-92Z" fill="url(#cd109-wall)" fill-rule="evenodd"/>',
'<circle cx="60" cy="60" r="56" fill="none" stroke="url(#cd109-edge)" stroke-width="4.6"/>',
'<circle cx="60" cy="60" r="50" fill="none" stroke="#e9ffff" stroke-opacity=".24" stroke-width="4.2"/>',
'<circle cx="60" cy="60" r="47" fill="none" stroke="url(#cd109-edge)" stroke-width="1.35" stroke-opacity=".77"/>',
'<path d="M15 64C13 37 31 15 59 12C75 10 83 17 91 24" fill="none" stroke="url(#cd109-sheen)" stroke-width="6.6" stroke-linecap="round"/>',
'<path d="M24 90C32 110 77 117 98 87" fill="none" stroke="url(#cd109-under)" stroke-width="5.1" stroke-linecap="round"/>',
'<path d="M17 49Q17 25 40 17" fill="none" stroke="#f4ffff" stroke-opacity=".59" stroke-width="1.9" stroke-linecap="round"/>',
'<ellipse cx="40" cy="19" rx="11" ry="3.9" transform="rotate(-26 40 19)" fill="#faffff" fill-opacity=".43"/>',
'<ellipse cx="91" cy="98" rx="10" ry="2.4" transform="rotate(-29 91 98)" fill="#adfff0" fill-opacity=".35"/>',
'</symbol>',
'<symbol id="cd109-square" viewBox="0 0 120 120">',
'<rect x="3.7" y="3.7" width="112.6" height="112.6" rx="30" fill="url(#cd109-wall)"/>',
'<rect x="3.8" y="3.8" width="112.4" height="112.4" rx="30" fill="none" stroke="url(#cd109-edge)" stroke-width="4.6"/>',
'<rect x="11" y="11" width="98" height="98" rx="23.7" fill="none" stroke="#d6fbff" stroke-opacity=".39" stroke-width="4.6"/>',
'<rect x="15" y="15" width="90" height="90" rx="20" fill="none" stroke="url(#cd109-edge)" stroke-opacity=".66" stroke-width="1.25"/>',
'<path d="M17 47V39C17 26 27 16 43 16H79" stroke="url(#cd109-sheen)" stroke-width="6.8" stroke-linecap="round" fill="none"/>',
'<path d="M19 86Q21 102 41 105H82" stroke="url(#cd109-under)" stroke-width="4.5" stroke-linecap="round" fill="none"/>',
'<path d="M100 34Q107 47 105 64" stroke="#eaffff" stroke-opacity=".52" stroke-width="3.1" stroke-linecap="round" fill="none"/>',
'<ellipse cx="36" cy="14" rx="14" ry="2.4" fill="#f7ffff" fill-opacity=".49"/>',
'</symbol>',
'<symbol id="cd109-pill" viewBox="0 0 320 92">',
'<rect x="3" y="3" width="314" height="86" rx="43" fill="url(#cd109-wall)"/>',
'<rect x="3" y="3" width="314" height="86" rx="43" fill="none" stroke="url(#cd109-edge)" stroke-width="4.2"/>',
'<rect x="10" y="10" width="300" height="72" rx="36" fill="none" stroke="#e2ffff" stroke-opacity=".41" stroke-width="4.8"/>',
'<rect x="15" y="15" width="290" height="62" rx="30" fill="none" stroke="url(#cd109-edge)" stroke-opacity=".70" stroke-width="1.4"/>',
'<path d="M18 38Q19 16 44 13H199" stroke="url(#cd109-sheen)" stroke-width="6.2" stroke-linecap="round" fill="none"/>',
'<path d="M27 70Q45 82 101 80H249" stroke="url(#cd109-under)" stroke-width="4.4" stroke-linecap="round" fill="none"/>',
'<path d="M298 25Q310 43 302 65" stroke="#efffff" stroke-opacity=".45" stroke-width="3.2" stroke-linecap="round" fill="none"/>',
'</symbol>',
'<symbol id="cd109-card" viewBox="0 0 220 125">',
'<rect x="3.5" y="3.5" width="213" height="118" rx="26" fill="url(#cd109-wall)"/>',
'<rect x="3.5" y="3.5" width="213" height="118" rx="26" fill="none" stroke="url(#cd109-edge)" stroke-width="4.4"/>',
'<rect x="11.5" y="11.5" width="197" height="102" rx="20" fill="none" stroke="#e2ffff" stroke-opacity=".37" stroke-width="4.8"/>',
'<rect x="16" y="16" width="188" height="93" rx="17" fill="none" stroke="url(#cd109-edge)" stroke-opacity=".56" stroke-width="1.4"/>',
'<path d="M19 45V33Q20 16 48 16H122" fill="none" stroke="url(#cd109-sheen)" stroke-width="6.6" stroke-linecap="round"/>',
'<path d="M24 91Q27 108 49 109H167" stroke="url(#cd109-under)" stroke-width="4.5" stroke-linecap="round" fill="none"/>',
'</symbol>'
].join('');
document.body.appendChild(sprite);
function kind(el){
 if(el.id==='open-voice-quick'||el.id==='voice-toggle')return 'orb';
 if(el.classList.contains('nav-button')||el.classList.contains('glass-icon')||
    el.classList.contains('action-round')||el.classList.contains('voice-option')||
    el.classList.contains('big-voice-mic')||el.classList.contains('back-glass')||
    el.classList.contains('chat-send'))return 'square';
 if(el.classList.contains('mode-card'))return 'card';
 return 'pill';
}
const selectors=[
 '#screen-home .glass-icon','#screen-home .speech-glass',
 '#screen-home .quick-actions>.action-round','#screen-home .bottom-nav',
 '#screen-home .bottom-nav>.nav-button','#screen-voice .back-glass',
 '#screen-voice .voice-option','#screen-voice .big-voice-mic',
 '#screen-voice .text-access','.screen-modes .mode-card',
 '.screen-modes .back-glass','.screen-chat .back-glass',
 '.screen-chat .chat-send','.screen-chat #chat-attach',
 '.screen-create .back-glass','.screen-create .create-action',
 '#prefs .back-glass','#prefs .create-action','#prefs .sound-preview',
 '#feature-dialog .back-glass','#feature-dialog .create-action',
 '#continue-onboard'
].join(',');
function install(){
 document.querySelectorAll(selectors).forEach(el=>{
  if(el.classList.contains('cd109-vessel')||el.id==='home-mascot')return;
  const shape=el.classList.contains('bottom-nav')?'pill':kind(el);
  el.classList.add('cd109-vessel','cd109-'+shape);
  const optic=document.createElement('span');
  optic.className='cd109-optics';optic.setAttribute('aria-hidden','true');
  optic.innerHTML='<svg xmlns="'+NS+'" viewBox="'+(shape==='orb'||shape==='square'?'0 0 120 120':shape==='card'?'0 0 220 125':'0 0 320 92')+'" preserveAspectRatio="none"><use href="#cd109-'+shape+'"/></svg>';
  el.insertBefore(optic,el.firstChild);
  if(shape==='orb'&&(el.id==='open-voice-quick'||el.id==='voice-toggle')){
   const energy=document.createElement('span');energy.className='cd109-energy';
   energy.setAttribute('aria-hidden','true');el.insertBefore(energy,optic);
  }
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();