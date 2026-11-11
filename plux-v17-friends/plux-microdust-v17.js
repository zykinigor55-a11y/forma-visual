/* PLUX v17 — Crystal Microdust. Decorative only; no changes to mic/camera/chat functionality. */
(()=>{
  'use strict';
  if(window.PLUXMicrodustV17)return;
  const config=[
    {id:'open-chat-quick',kind:'keyboard',count:15},
    {id:'open-voice-quick',kind:'microphone',count:18},
    {id:'open-create-quick',kind:'camera',count:16}
  ];
  const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  // Stable pseudo-random placement; prevents jumps during page navigation.
  function noise(n){const v=Math.sin(n*127.1+31.77)*43758.5453123;return v-Math.floor(v)}
  function add(button,opt){
    if(button.querySelector('.plux17-microdust-field'))return;
    button.classList.add('plux17-microdust-button','plux17-microdust-'+opt.kind);
    const field=document.createElement('span');
    field.className='plux17-microdust-field';
    field.setAttribute('aria-hidden','true');
    const ring=opt.kind==='camera';
    for(let i=0;i<opt.count;i++){
      const t=noise((i+1)*19+opt.count),r=Math.sqrt(noise(i*31+opt.count*11))*.34;
      const angle=t*Math.PI*2, x=50+Math.cos(angle)*r*100, y=50+Math.sin(angle)*r*100;
      const dot=document.createElement('i');
      dot.className='plux17-microdust-dot';
      const size=(.7+noise(i*17+opt.count)*1.45).toFixed(2);
      dot.style.cssText='--dust-x:'+x.toFixed(2)+'%;--dust-y:'+y.toFixed(2)+'%;--dust-size:'+size+'px;--dust-shift:'+((noise(i*49+1)-.5)*15).toFixed(1)+'px;--dust-time:'+(7+noise(i*11+4)*10).toFixed(2)+'s;--dust-delay:'+(-noise(i*23+7)*15).toFixed(2)+'s;--dust-alpha:'+(0.27+noise(i*13+2)*.48).toFixed(2);
      if(ring)dot.style.setProperty('--dust-spin',(noise(i*17+5)*14-7).toFixed(2)+'deg');
      field.append(dot);
    }
    // Dust stays behind the original visible icon and never steals touch events.
    button.insertBefore(field,button.firstChild);
    button.addEventListener('pointerdown',()=>{
      if(reduce?.matches)return;
      button.classList.remove('plux17-microdust-touch');
      void button.offsetWidth;button.classList.add('plux17-microdust-touch');
    },{passive:true});
    button.addEventListener('animationend',e=>{
      if(e.animationName==='plux17-dust-touch')button.classList.remove('plux17-microdust-touch');
    });
  }
  function mount(){
    for(const item of config){
      const target=document.getElementById(item.id);
      if(target)add(target,item);
    }
  }
  mount();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  // Handle buttons re-rendered during onboarding without heavy frame listeners.
  const observer=new MutationObserver(()=>{
    if(config.some(o=>!document.getElementById(o.id)?.querySelector('.plux17-microdust-field')))mount();
  });
  if(document.body)observer.observe(document.body,{childList:true,subtree:true});
  window.PLUXMicrodustV17={mount,version:'17.0.0'};
})();