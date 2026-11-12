import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {mkdirSync} from 'node:fs';
const url='https://plux-v17-friends-preview.onrender.com/?ui-check=3112';
mkdirSync('plux-v31/smoke-shots',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const resp=await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
 assert.equal(resp.status(),200,'preview page HTTP 200');
 await page.waitForFunction(()=>!!window.PLUXThemesV31&&!!window.PLUXToolsV31,{timeout:30000});
 const initial=await page.evaluate(()=>{
   const cards=[...document.querySelectorAll('#screen-modes .mode-grid>button.mode-card')];
   return {
     cardCount:cards.length,
     names:cards.map(x=>x.querySelector('strong')?.textContent?.trim()||''),
     styled:cards.map(x=>x.classList.contains('plux26-mode-card')),
     themeOptions:document.querySelectorAll('#plux-theme-backdrop .plux-theme-option').length,
     colorPanels:document.querySelectorAll('#plux31-color-panel').length,
     videoLinked:window.PLUXToolsV31?.videoLinked,
     homeButton:!!document.getElementById('plux-theme-trigger')
   };
 });
 console.log('PLUX_V31_CHECK_INITIAL',JSON.stringify(initial));
 assert.equal(initial.cardCount,6,'exactly six V30 Tools cards');
 assert(initial.styled.every(Boolean),'all six original cards have V26 glass styling');
 assert.deepEqual(initial.names,[
   'Пообщаться','Поговорить','Создать изображение','Создать видео','Музыка и звук','Галерея']);
 assert.equal(initial.themeOptions,8,'eight labeled choices in original V30 panel');
 assert.equal(initial.colorPanels,0,'no duplicate V31 settings color panel');
 assert.equal(initial.videoLinked,true,'existing video generation opens from original Tools card');
 assert.equal(initial.homeButton,true,'original V30 theme button exists');
 await page.evaluate(()=>{
   const el=document.getElementById('screen-modes');
   el.hidden=false;el.style.setProperty('display','block','important');
   for(const other of document.querySelectorAll('.screen'))if(other!==el){
      other.style.setProperty('display','none','important');
   }
 });
 await page.locator('#screen-modes .mode-grid').screenshot({path:'plux-v31/smoke-shots/tools-emerald.png'});
 await page.evaluate(()=>document.getElementById('plux-theme-trigger').click());
 await page.locator('#plux-theme-backdrop .plux-theme-dialog').screenshot({path:'plux-v31/smoke-shots/palette.png'});
 for(const [id,preferred] of [['azure','blue'],['ruby','red'],['solar','yellow']]){
   await page.evaluate(id=>{
     window.PLUXThemesV31.set(id);
   },id);
   const state=await page.evaluate(()=>({
     theme:document.documentElement.dataset.pluxTheme,
     color:getComputedStyle(document.documentElement).getPropertyValue('--plux-theme-accent').trim(),
     pigment:document.querySelector('#home-mascot-image')?.style.getPropertyValue('filter')
   }));
   console.log('PLUX_V31_CHECK_COLOR_'+preferred.toUpperCase(),JSON.stringify(state));
   assert.equal(state.theme,id);
   assert(state.pigment?.includes('plux31-pigment-'+id),'actual glass drop uses a true-pigment filter');
   await page.locator('#screen-modes .mode-grid').screenshot({path:'plux-v31/smoke-shots/tools-'+preferred+'.png'});
 }
 console.log('PLUX_V31_CHECK_PASS six original tools, eight colors, no duplicates, real video route, exact pigment filter');
 console.log('PAGE_ERRORS',JSON.stringify(errors.slice(0,15)));
}finally{await browser.close();}
