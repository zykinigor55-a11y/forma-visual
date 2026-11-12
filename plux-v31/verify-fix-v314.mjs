import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {mkdirSync} from 'node:fs';

const URL='https://plux-v17-friends-preview.onrender.com/?ui-check=3141';
mkdirSync('plux-v31/smoke-v314',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try {
 const page=await browser.newPage({viewport:{width:390,height:860},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const res=await page.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
 assert.equal(res?.status(),200);
 await page.waitForFunction(()=>!!window.PLUXOrbsV314&&!!window.PLUXThemesV31,{timeout:30000});
 // Move to the same active home state the user's screenshot shows.
 await page.evaluate(()=>{
   const home=document.getElementById('screen-home');
   for(const s of document.querySelectorAll('.screen'))if(s!==home)s.hidden=true;
   home.hidden=false;
   home.style.removeProperty('display');
 });
 await page.waitForTimeout(1100);
 const inspect=()=>page.evaluate(()=>{
   const home=document.getElementById('screen-home'),scene=document.getElementById('home-scene');
   const mascot=document.getElementById('home-mascot'),poster=document.getElementById('home-mascot-image');
   const bounds=e=>{const r=e.getBoundingClientRect();return [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]};
   const quick=['open-chat-quick','open-voice-quick','open-create-quick'].map(id=>{
     const b=document.getElementById(id),img=b.querySelector('img.plux314-orb-art');
     return {id,button:bounds(b),layer:img?bounds(img):null,
      url:img?.currentSrc?.slice(-50),background:getComputedStyle(b).backgroundImage,
      computedFilter:img?getComputedStyle(img).filter:null,inlineFilter:img?.style.filter,
      microdust:!!b.querySelector('.plux17-microdust-field'),
      glyph:!!b.querySelector('.plux126-glyph,.plux124-chrome')};
   });
   return {viewport:[innerWidth,innerHeight],home:bounds(home),scene:bounds(scene),mascot:bounds(mascot),
     poster:bounds(poster),posterLoaded:poster.complete&&poster.naturalWidth>0,
     theme:document.documentElement.dataset.pluxTheme,quick};
 });
 const before=await inspect();console.log('PLUX314_RESTORED '+JSON.stringify(before));
 assert(before.home[3]>=820,'home fills device viewport: no black gap');
 assert(before.scene[3]>=200,'mascot scene has space above the bottom controls');
 assert(before.mascot[3]>=200,'mascot display area is non-zero');
 assert(before.poster[3]>=200&&before.posterLoaded,'original V30 mascot poster is loaded and displayed');
 assert(before.quick.every(x=>x.layer&&x.layer[2]>50&&x.layer[3]>50),'glass shells render in all three controls');
 assert(before.quick.every(x=>x.microdust&&x.glyph),'original icons and microdust remain intact');
 await page.screenshot({path:'plux-v31/smoke-v314/home-restored-emerald.png',fullPage:true});
 for(const [id,color] of [['azure','blue'],['ruby','red'],['solar','yellow']]){
   await page.evaluate(theme=>window.PLUXThemesV31.set(theme),id);
   await page.waitForTimeout(230);
   const state=await inspect();
   console.log('PLUX314_ORBS_'+color.toUpperCase()+' '+JSON.stringify(state.quick));
   assert.equal(state.theme,id);
   assert(state.quick.every(x=>x.computedFilter.includes('plux31-pigment-'+id)),
     'all original crystal shells take correct '+color+' pigment');
   assert(state.quick.every(x=>x.background==='none'),
     'old baked-in emerald orb is hidden instead of doubling');
   assert(state.quick.every(x=>x.glyph),'original icons stay visible');
   assert(state.mascot[3]>=200,'mascot remains visible after theme switch');
   await page.screenshot({path:'plux-v31/smoke-v314/home-'+color+'.png',fullPage:true});
 }
 console.log('PLUX314_CHECK_PASS: full-size V30 drop, three separately colored glass orbs, icons and microdust preserved');
 console.log('PLUX314_PAGE_ERRORS '+JSON.stringify(errors.slice(0,12)));
 assert.equal(errors.length,0,'No JavaScript runtime errors');
}finally{await browser.close()}
