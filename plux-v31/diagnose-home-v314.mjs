import {chromium} from 'playwright-core';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const URL='https://plux-v17-friends-preview.onrender.com/?debug=3141';
try {
 const page=await browser.newPage({viewport:{width:390,height:860},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const bad=[];
 page.on('pageerror',e=>bad.push('JS '+e.message));
 page.on('response',r=>{if(r.status()>=400&&/assets|png|webp|mp4|js|css/.test(r.url()))bad.push(r.status()+' '+r.url().slice(0,150))});
 await page.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForTimeout(5000);
 const snapshot=await page.evaluate(()=>{
  const q=e=>{if(!e)return null;const c=getComputedStyle(e),r=e.getBoundingClientRect(),parent=e.parentElement;
  return {tag:e.tagName,id:e.id,cls:typeof e.className==='string'?e.className.slice(0,130):'',text:e.textContent.trim().slice(0,80),
    r:[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)],display:c.display,position:c.position,zIndex:c.zIndex,filter:c.filter,opacity:c.opacity,visibility:c.visibility,
    overflow:c.overflow,transform:c.transform,background:c.backgroundImage.slice(0,160),src:e.currentSrc||e.src||e.getAttribute('src'),poster:e.poster,
    natW:e.naturalWidth,natH:e.naturalHeight,readyState:e.readyState,hidden:e.hidden,
    par:parent?.id||parent?.className?.toString().slice(0,70)};
  };
  const selectors=['#screen-home','#screen-home .home-head','#screen-home .scene-home','#home-scene','#home-mascot','#home-mascot-image','#home-state-video',
  '#home-mascot video','#home-mascot img','#screen-home .scene-home .mascot-hit',
  '#screen-home .scene-home .plux31-home-ambient','#screen-home .home-bottom',
  '#screen-home .quick-actions','#open-voice-quick','#open-chat-quick','#open-create-quick','#greeting-title','#greeting-subtitle','#screen-home .bottom-nav'];
  const out={viewport:[window.innerWidth,window.innerHeight,devicePixelRatio],screen:selectors.map(x=>({s:x,v:q(document.querySelector(x))})),
    media:[...document.querySelectorAll('#screen-home img,#screen-home video')].map(q).slice(0,40),
    mascotCandidates:[...document.querySelectorAll('[id*="mascot"],[class*="mascot"],[id*="scene"],[class*="scene"]')].slice(0,55).map(q),
    theme:document.documentElement.dataset.pluxTheme, v31:!!window.PLUXColorsV31, ready:document.readyState, body:document.body.getAttribute('class')};
  const quick=['#open-chat-quick','#open-voice-quick','#open-create-quick'];
  out.quickByTheme=['emerald','azure','ruby'].map(id=>{
   window.PLUXThemesV31?.set(id);
   return {theme:id,quick:quick.map(x=>q(document.querySelector(x)))};
  });
  return out;
 });
 console.log('PLUX314_PROBE '+JSON.stringify(snapshot).slice(0,42000));
 console.log('PLUX314_ERRORS '+JSON.stringify(bad).slice(0,8000));
 await page.screenshot({path:'plux-v31/home-broken-before-fix.png',fullPage:true});
}finally{await browser.close()}
