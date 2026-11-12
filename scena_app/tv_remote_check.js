
(function(){
  // D-pad navigation across visible clickable elements in the locally hosted UI.
  const selector='button:not([disabled]),a[href],summary,input[type="range"],.upload-card';
  const valid=el=>{let r=el.getBoundingClientRect(),css=getComputedStyle(el);return r.width>0&&r.height>0&&css.visibility!=='hidden'&&css.display!=='none';};
  const options=()=>Array.from(document.querySelectorAll(selector)).filter(valid);
  document.addEventListener('keydown',function(e){
    if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;
    if(!matchMedia('(min-width:900px) and (min-aspect-ratio:4/3)').matches)return;
    const cur=document.activeElement;
    if(cur&&cur.tagName==='INPUT'&&cur.type==='range')return;
    if(cur&&['INPUT','TEXTAREA'].includes(cur.tagName))return;
    let els=options(); if(!els.length)return;
    const here=cur&&els.includes(cur)?cur:els[0];
    const a=here.getBoundingClientRect(),cx=a.left+a.width/2,cy=a.top+a.height/2;
    const dx=e.key==='ArrowLeft'?-1:e.key==='ArrowRight'?1:0;
    const dy=e.key==='ArrowUp'?-1:e.key==='ArrowDown'?1:0;
    let pick=null,best=Infinity;
    for(const el of els){if(el===here)continue;let r=el.getBoundingClientRect();
      let vx=r.left+r.width/2-cx,vy=r.top+r.height/2-cy;
      let forward=vx*dx+vy*dy,perp=Math.abs(vx*dy-vy*dx);
      if(forward<=6)continue;
      let score=forward+perp*2.3; if(score<best){best=score;pick=el;}
    }
    if(pick){e.preventDefault();pick.focus();pick.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'});}
  },true);
  window.addEventListener('load',()=>{
    if(matchMedia('(min-width:900px) and (min-aspect-ratio:4/3)').matches){
      const first=document.querySelector('.bottom-nav button'); if(first)first.focus();
    }
  });
})();
