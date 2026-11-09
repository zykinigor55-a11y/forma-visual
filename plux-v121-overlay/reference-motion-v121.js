/* PLUX 12.1 — Tools navigation, focus-safe touch micro-interactions.
   Preserve all existing navigation handlers and app functionality. */
(() => {
  'use strict';
  const modes = document.getElementById('screen-modes');
  const homeDock = document.querySelector('#screen-home .bottom-nav');
  if (!modes || !homeDock) return;

  for (const c of modes.querySelectorAll('.mode-card')) {
    const title = c.querySelector('strong')?.textContent?.trim() || '';
    const sub = c.querySelector('small')?.textContent?.trim() || '';
    c.setAttribute('aria-label', [title,sub].filter(Boolean).join('. '));
  }
  let nav = modes.querySelector('.tools-dock-v121');
  if (!nav) {
    nav = document.createElement('nav');
    nav.className = 'tools-dock-v121';
    nav.setAttribute('aria-label','Навигация PLUX');
    for (const original of homeDock.querySelectorAll('.nav-button')) {
      const button = original.cloneNode(true);
      button.classList.toggle('selected', button.dataset.go === 'modes');
      if (button.dataset.go === 'modes') button.setAttribute('aria-current','page');
      else button.removeAttribute('aria-current');
      button.addEventListener('click', () => {
        const target = document.querySelector(`#screen-home .nav-button[data-go="${button.dataset.go}"]`);
        if (target) target.click();
      });
      nav.appendChild(button);
    }
    modes.appendChild(nav);
  }

  const activePointers=new Map();
  const release=(id)=>{
    const item=activePointers.get(id);
    if(item)item.classList.remove('plux121-held');
    activePointers.delete(id);
  };
  nav.addEventListener('pointerdown', e=>{
    const btn=e.target.closest('.nav-button');
    if(!btn)return;
    btn.classList.add('plux121-held');activePointers.set(e.pointerId,btn);
  },{passive:true});
  for(const type of ['pointerup','pointercancel']){
    window.addEventListener(type,e=>release(e.pointerId),{passive:true,capture:true});
  }
  window.addEventListener('blur',()=>{
    for(const id of activePointers.keys())release(id);
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)for(const id of activePointers.keys())release(id);
  });
})();