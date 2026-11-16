/* FORMA SIGNATURE · persistent appearance control, no render/editor logic touched. */
(() => {
  'use strict';
  const KEY='forma-signature-theme-v1';
  const root=document.documentElement;
  const buttons=()=>Array.from(document.querySelectorAll('[data-forma-theme-switch]'));
  const svgSun='<svg class="fa-theme-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></svg>';
  const svgMoon='<svg class="fa-theme-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.7 8.7 0 1 0 20.5 14.5Z"/></svg>';
  let mode=root.dataset.formaTheme==='light'?'light':'dark';
  function updateButtons(){
    for(const b of buttons()){
      b.setAttribute('aria-pressed',String(mode==='light'));
      const label=mode==='light'?'Включить тёмную тему':'Включить светлую тему';
      b.setAttribute('aria-label',label);b.title=label;
      b.dataset.currentTheme=mode;
    }
  }
  function setMode(value,persist=true){
    mode=value==='light'?'light':'dark';
    root.dataset.formaTheme=mode;
    root.style.colorScheme=mode;
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.content=mode==='dark'?'#101013':'#f4f0e9';
    if(persist)try{localStorage.setItem(KEY,mode)}catch{}
    updateButtons();
    document.dispatchEvent(new CustomEvent('forma:themechange',{detail:{theme:mode}}));
  }
  function makeButton(context){
    const b=document.createElement('button');
    b.type='button';b.className='fa-theme-switch';
    if(context==='flow')b.classList.add('fa-theme-switch-in-flow');
    b.dataset.formaThemeSwitch='true';
    b.innerHTML='<span class="fa-theme-switch-label">ТЕМА</span><span class="fa-theme-switch-track">'+svgMoon+svgSun+'<span class="fa-theme-switch-knob"></span></span>';
    b.addEventListener('click',()=>setMode(mode==='dark'?'light':'dark'));
    return b;
  }
  function mount(){
    const header=document.querySelector('.top-actions');
    if(header&&!header.querySelector('[data-forma-theme-switch]'))header.prepend(makeButton('header'));
    const mobile=document.querySelector('.mobile-header-actions');
    if(mobile&&!mobile.querySelector('[data-forma-theme-switch]'))mobile.prepend(makeButton('mobile'));
    const cabinet=document.querySelector('#cabinetThemeHost');
    if(cabinet&&!cabinet.querySelector('[data-forma-theme-switch]'))cabinet.append(makeButton('cabinet'));
    const flow=document.querySelector('#faFlowBackdrop .fa-flow-head-actions');
    if(flow&&!flow.querySelector('[data-forma-theme-switch]'))flow.prepend(makeButton('flow'));
    const pro=document.querySelector('.fa-pro-backdrop .fa-pro-head');
    if(pro&&!pro.querySelector('[data-forma-theme-switch]'))pro.append(makeButton('pro'));
    updateButtons();
  }
  let queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;mount()});
  }
  const start=()=>{
    setMode(mode,false);
    mount();
    const observer=new MutationObserver(mutations=>{
      if(mutations.some(m=>Array.from(m.addedNodes).some(n=>n.nodeType===1&&(
        n.id==='faFlowBackdrop'||n.classList?.contains('fa-pro-backdrop')||
        n.querySelector?.('#faFlowBackdrop,.fa-pro-backdrop')
      ))))schedule();
    });
    observer.observe(document.body,{childList:true,subtree:true});
  };
  window.FORMA_THEME={get:()=>mode,set:value=>setMode(value),toggle:()=>setMode(mode==='light'?'dark':'light')};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();