(()=>{
  const menu=document.querySelector('#menu-button'),nav=document.querySelector('#navigation');
  if(menu&&nav){menu.addEventListener('click',()=>{const opened=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(opened));menu.setAttribute('aria-label',opened?'Закрыть меню':'Открыть меню');});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');}));}
  const blocks=document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}}),{rootMargin:'0px 0px 50px 0px',threshold:.025});blocks.forEach(b=>obs.observe(b));}
  else blocks.forEach(b=>b.classList.add('visible'));
  const vid=document.querySelector('#hero-video');
  if(vid){if(window.matchMedia('(max-width:700px)').matches){vid.poster='assets/hero-mobile-poster.webp';}const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const net=navigator.connection;
    if(reduce||net?.saveData){vid.pause();vid.removeAttribute('autoplay');}
    else{const onPlay=()=>{const p=vid.play();if(p&&p.catch)p.catch(()=>{});};vid.addEventListener('canplay',onPlay,{once:true});if(vid.readyState>=3)onPlay();}
    document.addEventListener('visibilitychange',()=>{if(document.hidden)vid.pause();else if(!reduce&&!net?.saveData)vid.play().catch(()=>{});});
  }
})();

// One-time brand intro. Lettering is live HTML, never baked into AI video.
(()=>{
  const el=document.getElementById('brand-intro'); if(!el) return;
  const film=document.getElementById('brand-intro-film');
  const title=el.querySelector('.brand-intro-lockup');
  let dismissed=false;
  const close=()=>{if(dismissed)return;dismissed=true;title.classList.add('is-visible');setTimeout(()=>{el.classList.add('is-gone');film.pause();setTimeout(()=>el.remove(),850)},500);try{sessionStorage.setItem('katyaIntroSeenV5','1')}catch(e){}};
  document.getElementById('intro-skip')?.addEventListener('click',close);
  let seen=false;try{seen=sessionStorage.getItem('katyaIntroSeenV5')==='1'}catch(e){}
  if(seen||matchMedia('(prefers-reduced-motion: reduce)').matches){el.remove();return;}
  const show=()=>title.classList.add('is-visible');
  film.addEventListener('timeupdate',()=>{if(film.currentTime>=3.5)show();},{passive:true});
  film.addEventListener('ended',close,{once:true});
  film.addEventListener('error',close,{once:true});
  const p=film.play();if(p&&p.catch)p.catch(close);
  setTimeout(()=>{if(el.isConnected)close()},8000);
})();