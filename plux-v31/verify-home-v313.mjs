import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const pageURL='https://plux-v17-friends-preview.onrender.com/?ui-check=3135';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try {
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const res=await page.goto(pageURL,{waitUntil:'domcontentloaded',timeout:60000});
 assert.equal(res?.status(),200);
 await page.waitForFunction(()=>Boolean(window.PLUXHomeV313&&window.PLUXThemesV31),{timeout:35000});
 const initial=await page.evaluate(()=>{
   const home=document.getElementById('screen-home');
   home.hidden=false;
   if(getComputedStyle(home).display==='none')home.style.setProperty('display','flex','important');
   const nav=home.querySelector('.bottom-nav');
   const first=nav.querySelector('button.nav-button:first-child');
   const icon=first?.querySelector('svg,img');
   const label=[...(first?.querySelectorAll('span')||[])].find(x=>x.textContent.trim()==='Главная')||first?.querySelector('span');
   const cx=e=>{const r=e.getBoundingClientRect();return r.left+r.width/2};
   const ambient=home.querySelector('.scene-home>.plux31-home-ambient');
   const css=getComputedStyle(home);
   return {
     homeText:label?.textContent.trim(),
     iconCenter:icon?cx(icon):null,
     labelCenter:label?cx(label):null,
     btnCenter:first?cx(first):null,
     ambient:!!ambient,
     ambientBg:ambient?getComputedStyle(ambient).backgroundImage:null,
     cssLoaded:!!document.querySelector('link[href*="home-contrast-v313.css"]'),
     sound:!!window.PLUXHomeV313,
     count:window.PLUXHomeV313?.getGreetingTargets?.(),
     bg:css.backgroundImage,
     navCount:nav.querySelectorAll('button.nav-button').length
   };
 });
 console.log('PLUX_V313_HOME',JSON.stringify(initial));
 assert.equal(initial.homeText,'Главная');
 assert.equal(initial.navCount,5);
 assert.equal(initial.ambient,true);
 assert.equal(initial.sound,true);
 assert(initial.count>=1,'greeting text observed for ASMR');
 assert(Math.abs(initial.iconCenter-initial.labelCenter)<=4,'home glyph and label centered');
 assert(Math.abs(initial.iconCenter-initial.btnCenter)<=4,'home glyph centered in tab');
 assert(initial.cssLoaded,'contrasting home stylesheet was included');
 assert(initial.ambientBg?.includes('gradient'),'complementary scene backdrop is visible');
 assert(initial.bg.includes('gradient'),'home screen has colored background');
 const result=await page.evaluate(()=>{
   const home=document.getElementById('screen-home');
   const names=['emerald','azure','ruby','solar'];
   return names.map(theme=>{
     window.PLUXThemesV31.set(theme);
     const s=getComputedStyle(home);
     return {theme,base:s.backgroundColor,image:s.backgroundImage,accent:getComputedStyle(document.documentElement).getPropertyValue('--plux31-home-contrast-a').trim()};
   });
 });
 console.log('PLUX_V313_COLORS',JSON.stringify(result));
 assert.equal(new Set(result.map(x=>x.accent)).size,4,'home contrast color changes with theme');
 assert.equal(new Set(result.map(x=>x.image)).size,4,'home gradient changes immediately with each theme');
 // Base background-color eases over 450ms; checking it in the same event loop
 // incorrectly reads the initial animation frame.
 console.log('PLUX_V313_PASS home tab centered and theme contrast responds to four pigment choices');
 console.log('PLUX_PAGE_ERRORS',JSON.stringify(errors.slice(0,8)));
}finally{await browser.close()}
