import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:390,height:860},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const res=await page.goto('https://plux-v17-friends-preview.onrender.com/?mobile=1&v=3183',{waitUntil:'domcontentloaded',timeout:60000});
 assert.equal(res.status(),200);
 await page.waitForFunction(()=>!!window.PLUXVideoHubV318&&!!window.PLUXCognitionV318&&!!window.PLUXDustV318&&!!window.PLUXThemesV31,{timeout:35000});
 await page.evaluate(()=>{
   const home=document.getElementById('screen-home');
   for(const other of document.querySelectorAll('.screen'))if(other!==home){other.hidden=true;other.style.setProperty('display','none','important')}
   for(const selector of ['#screen-onboard','#plux127-intro','#onboarding-screen','.onboard-overlay']){
    for(const other of document.querySelectorAll(selector)){other.hidden=true;other.style.setProperty('display','none','important')}
   }
   home.hidden=false;home.style.setProperty('display','flex','important');
   window.PLUXDustV318.sync();
 });
 await page.waitForTimeout(350);
 const state=()=>page.evaluate(()=>{
  const rect=x=>{const r=x.getBoundingClientRect();return [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]};
  const home=document.querySelector('#screen-home'),logo=document.querySelector('#plux318-cognition');
  const video=document.querySelector('#plux-videos-open');
  const orbs=['open-chat-quick','open-voice-quick','open-create-quick'].map(id=>{
   const el=document.getElementById(id),art=el?.querySelector('.plux314-orb-art');
   return {id,exists:!!el,filter:art?getComputedStyle(art).filter:null,dust:el?.querySelectorAll('.plux17-microdust-dot,.plux318-particle-extra').length||0};
  });
  return {header:rect(document.querySelector('#screen-home .home-head')),logo:logo?rect(logo):null,
   logoText:logo?.innerText,videoTab:video?rect(video):null,
   ambient:home.querySelectorAll('.plux318-ambient-spark').length,orbs,
   theme:document.documentElement.dataset.pluxTheme,nav:home.querySelectorAll('.bottom-nav>.nav-button').length};
 });
 const headerAudit=await page.evaluate(()=>[...document.querySelector('#screen-home .home-head').querySelectorAll('img,svg,h1,h2,strong,span,div')].slice(0,35).map(n=>({tag:n.tagName,id:n.id,class:String(n.className?.baseVal||n.className||'').slice(0,80),src:(n.getAttribute('src')||'').slice(0,90),text:(n.textContent||'').trim().slice(0,25),visible:getComputedStyle(n).visibility,display:getComputedStyle(n).display,rect:[Math.round(n.getBoundingClientRect().width),Math.round(n.getBoundingClientRect().height)]})));
 console.log('PLUX318_HEADER_AUDIT '+JSON.stringify(headerAudit));
 const s=await state();console.log('PLUX318_LIVE_HOME '+JSON.stringify(s));
 assert(s.logo&&s.logo[2]>=70&&s.logo[2]<=95,'compact cognition logo mounted');
 const legacy=await page.evaluate(()=>{
   const box=document.querySelector('#screen-home .home-head .branding');
   return {visible:box?getComputedStyle(box).visibility:'absent',opacity:box?getComputedStyle(box).opacity:'0'};
 });
 console.log('PLUX318_LEGACY_LOGO '+JSON.stringify(legacy));
 assert(legacy.visible==='hidden'||Number(legacy.opacity)===0,'old large logo is invisible');
 assert(!s.logoText?.includes('INTELLIGENCE')&&!s.logoText?.includes('PLUX'),'AI orbit without branding text');
 assert(s.videoTab&&s.videoTab[2]>30,'video tab mounted and visible');
 assert(s.nav>=6,'five original tabs and new video tab');
 assert(s.ambient>=25,'animated ambient particles present');
 assert(s.orbs.every(x=>x.exists&&x.dust>=20),'all three glass orbs have particles');
 await page.evaluate(()=>window.PLUXThemesV31.set('ruby'));
 await page.waitForTimeout(620);
 const red=await state();console.log('PLUX318_THEME_RUBY '+JSON.stringify(red));
 assert(red.orbs.every(x=>x.filter?.includes('hue-rotate(195deg)')),'orb pigments changed with theme');
 await page.evaluate(()=>window.PLUXVideoHubV318.open());
 const videoOpen=await page.evaluate(()=>!document.getElementById('plux-video-panel').hidden);
 assert(videoOpen,'video panel opens');
 await page.evaluate(()=>window.PLUXVideoHubV318.close());
 console.log('PLUX318_PASS live video tab, cognition, orbs, particles and recoloring');
 console.log('PLUX318_PAGE_ERRORS '+JSON.stringify(errors.slice(0,12)));
}finally{await browser.close()}
