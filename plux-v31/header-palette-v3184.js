/* PLUX 31.8.4: mirror the palette trigger from the existing profile button.
   Do not move/rebuild other header controls, cognition core or brand. */
(()=>{
 "use strict";
 const head=document.querySelector("#screen-home .home-head");
 const profile=head?.querySelector("#open-profile");
 const palette=head?.querySelector("#plux-theme-trigger");
 if(!head||!profile||!palette)return;
 let scheduled=false;
 function sync(){
  scheduled=false;
  const h=head.getBoundingClientRect();
  const p=profile.getBoundingClientRect();
  if(h.width<100||p.width<20)return;
  const inset=Math.max(0,Math.round(p.left-h.left));
  const y=Math.round(p.top-h.top+(p.height-palette.getBoundingClientRect().height)/2);
  head.style.setProperty("--plux3184-palette-right",inset+"px");
  head.style.setProperty("--plux3184-palette-top",Math.max(0,y)+"px");
 }
 function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(sync)}}
 schedule();
 window.addEventListener("resize",schedule,{passive:true});
 window.addEventListener("orientationchange",schedule,{passive:true});
 window.addEventListener("pageshow",schedule);
 if(typeof ResizeObserver!=="undefined"){
  const ro=new ResizeObserver(schedule);ro.observe(head);ro.observe(profile);
 }
 window.PLUXPaletteSymmetryV3184={sync:schedule};
})();