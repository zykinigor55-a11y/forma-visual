import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {mkdirSync} from 'node:fs';
mkdirSync('plux-v31/verified-v316',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:390,height:860},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const res=await page.goto('https://plux-v17-friends-preview.onrender.com/?v=3161&visual=1',{waitUntil:'domcontentloaded',timeout:60000});
 assert.equal(res.status(),200);
 await page.waitForFunction(()=>!!window.PLUXOrbsV314&&!!window.PLUXThemesV31,{timeout:30000});
 await page.evaluate(()=>{
   const home=document.getElementById('screen-home');
   for(const other of document.querySelectorAll('.screen'))if(other!==home)other.hidden=true;
   home.hidden=false;home.style.removeProperty('display');
 });
 await page.waitForTimeout(1200);
 const state=()=>page.evaluate(()=>{
   const B=e=>{const r=e.getBoundingClientRect();return{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}};
   const home=document.getElementById('screen-home'),scene=document.getElementById('home-scene');
   const mascot=document.getElementById('home-mascot'),poster=document.getElementById('home-mascot-image');
   const videos=[...mascot.querySelectorAll('video')].map(e=>({
     rect:B(e),fit:getComputedStyle(e).objectFit,mask:getComputedStyle(e).maskImage.slice(0,180),
     readyState:e.readyState,src:e.currentSrc||e.src
   }));
   const buttons=['open-chat-quick','open-voice-quick','open-create-quick'].map(id=>{
     const b=document.getElementById(id),img=b.querySelector('img.plux314-orb-art');
     return{id,filter:img?getComputedStyle(img).filter:null,icon:!!b.querySelector('.plux126-glyph,.plux124-chrome')};
   });
   return{home:B(home),scene:B(scene),mascot:B(mascot),poster:B(poster),
     posterReady:poster.complete&&poster.naturalWidth>0,
     posterFit:getComputedStyle(poster).objectFit,
     posterMask:getComputedStyle(poster).maskImage,
     scenePosition:getComputedStyle(scene).position,
     videos,buttons,theme:document.documentElement.dataset.pluxTheme,
     hasCss:!!document.querySelector('link[href*="mascot-fullscreen-v316.css"]'),
     background:getComputedStyle(document.body).backgroundColor};
 });
 const first=await state();console.log('PLUX316_GEOMETRY '+JSON.stringify(first));
 assert.equal(first.hasCss,true);
 assert.equal(first.background,'rgb(0, 0, 0)');
 assert(first.home.h>=840&&first.scene.h>=840&&first.mascot.h>=840,'V30 full-screen mascot stage');
 assert(Math.abs(first.home.y-first.scene.y)<=1&&Math.abs(first.home.y-first.mascot.y)<=1,'stage starts at top');
 assert.equal(first.scenePosition,'absolute','the scene is a full-screen layer, not a flex item');
 assert(first.poster.h>=840&&first.posterReady&&first.posterFit==='contain','full-screen uncropped picture');
 assert(first.posterMask.includes('radial-gradient'),'video rectangle is softened');
 assert(first.videos.every(v=>v.rect.h>=840&&v.fit==='contain'&&v.mask.includes('radial-gradient')),
   'both animated state videos are full-height, uncropped, blended at edges');
 await page.screenshot({path:'plux-v31/verified-v316/emerald-fullscreen.png',fullPage:true});
 for(const [id,label] of [['ruby','red'],['azure','blue'],['solar','yellow']]){
   await page.evaluate(theme=>window.PLUXThemesV31.set(theme),id);
   await page.waitForTimeout(190);
   const a=await state();console.log('PLUX316_THEME_'+label+' '+JSON.stringify({scene:a.scene,mascot:a.mascot,poster:a.poster,colors:a.buttons}));
   assert(a.buttons.every(b=>b.filter.includes('plux31-pigment-'+id)&&b.icon),'theme orbs and icons unchanged');
   assert(a.scene.h>=840&&a.poster.h>=840,'drop stays full-screen after theme change');
   await page.screenshot({path:'plux-v31/verified-v316/'+label+'-fullscreen.png',fullPage:true});
 }
 console.log('PLUX316_PASS fullscreen V30 video layer, object-fit contain, feathered OLED edges, themed buttons');
 console.log('PLUX316_ERRORS '+JSON.stringify(errors.slice(0,6)));
 assert.equal(errors.length,0);
}finally{await browser.close()}
