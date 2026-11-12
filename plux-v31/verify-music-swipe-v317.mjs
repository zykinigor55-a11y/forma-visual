import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const url='https://plux-v17-friends-preview.onrender.com/?test=music-v3171';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:390,height:860},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  const originalPlay=HTMLMediaElement.prototype.play,
   originalPause=HTMLMediaElement.prototype.pause,
   originalLoad=HTMLMediaElement.prototype.load;
  function fakeState(el,playing){
   el.__pluxFakePlaying=playing;
   if(!Object.hasOwn(el,'paused')){
    Object.defineProperty(el,'paused',{configurable:true,get(){return !this.__pluxFakePlaying}});
   }
  }
  HTMLMediaElement.prototype.play=function(){
   if(this.tagName!=='AUDIO')return originalPlay.call(this);
   fakeState(this,true);this.dispatchEvent(new Event('play'));this.dispatchEvent(new Event('playing'));return Promise.resolve();
  };
  HTMLMediaElement.prototype.pause=function(){
   if(this.tagName!=='AUDIO')return originalPause.call(this);
   fakeState(this,false);this.dispatchEvent(new Event('pause'));
  };
  HTMLMediaElement.prototype.load=function(){if(this.tagName==='AUDIO')return;return originalLoad.call(this)};
 });
 const radio={stations:[
  {id:'radio-1',title:'Радио Север',country:'Россия',stream:'https://radio.example.net/one.mp3'},
  {id:'radio-2',title:'Радио Вечер',country:'Россия',stream:'https://radio.example.net/two.mp3'},
  {id:'radio-3',title:'Радио Волна',country:'Россия',stream:'https://radio.example.net/three.mp3'}
 ]};
 const tracks={tracks:[
  {id:'song-1',title:'Музыка А',artist:'Исполнитель 1',stream:'https://cdn.example.net/one.mp3'},
  {id:'song-2',title:'Музыка Б',artist:'Исполнитель 2',stream:'https://cdn.example.net/two.mp3'}
 ]};
 await page.route('**/api/music/radio*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(radio)}));
 await page.route('**/api/music/trending*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(tracks)}));
 await page.route('**/api/music/search*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(tracks)}));
 const resp=await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
 assert.equal(resp.status(),200);
 await page.waitForFunction(()=>!!window.PLUXMusicV31?.debug&&!!window.PLUXThemesV31,{timeout:30000});
 const ui=await page.evaluate(()=>{
  const home=document.getElementById('screen-home');
  for(const other of document.querySelectorAll('.screen'))if(other!==home){
   other.hidden=true;other.style.setProperty('display','none','important');
  }
  for(const sel of ['#screen-onboard','#plux127-intro','#onboarding-screen','.onboard-overlay'])
   document.querySelectorAll(sel).forEach(e=>{e.hidden=true;e.style.setProperty('display','none','important')});
  home.hidden=false;home.style.setProperty('display','flex','important');
  const mini=window.PLUXMusicV31.debug.mini;mini.hidden=false;
  return {bars:window.PLUXMusicV31.debug.equalizer.children.length,swipe:mini.title,
    className:mini.className,eqColor:getComputedStyle(window.PLUXMusicV31.debug.equalizer).color};
 });
 console.log('PLUX317_INITIAL '+JSON.stringify(ui));
 assert.equal(ui.bars,8,'eight equalizer bars');
 assert(ui.swipe.includes('влево'),'discoverable swipe title');
 // Use a mock station catalog. No real stream is played or downloaded.
 await page.evaluate(()=>window.PLUXMusicV31.open());
 await page.waitForSelector('.plux31-music-dialog .plux31-result:nth-child(3)',{timeout:15000});
 await page.locator('.plux31-music-dialog .plux31-result').first().click();
 let state=await page.evaluate(()=>window.PLUXMusicV31.state());
 assert.deepEqual([state.title,state.source,state.index,state.count],['Радио Север','radio',0,3]);
 assert.equal(state.playing,true,'playing indicator follows audio play event');
 await page.evaluate(()=>{
   const mini=window.PLUXMusicV31.debug.mini;
   const start=new Touch({identifier:3,target:mini,clientX:260,clientY:730});
   mini.dispatchEvent(new TouchEvent('touchstart',{touches:[start],changedTouches:[start],bubbles:true}));
   const end=new Touch({identifier:3,target:mini,clientX:130,clientY:733});
   mini.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[end],bubbles:true}));
 });
 state=await page.evaluate(()=>window.PLUXMusicV31.state());
 assert.equal(state.title,'Радио Вечер','swipe LEFT changes to next station');
 await page.evaluate(()=>{
   const mini=window.PLUXMusicV31.debug.mini;
   const start=new Touch({identifier:5,target:mini,clientX:120,clientY:725});
   mini.dispatchEvent(new TouchEvent('touchstart',{touches:[start],changedTouches:[start],bubbles:true}));
   const end=new Touch({identifier:5,target:mini,clientX:270,clientY:728});
   mini.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[end],bubbles:true}));
 });
 state=await page.evaluate(()=>window.PLUXMusicV31.state());
 assert.equal(state.title,'Радио Север','swipe RIGHT changes to previous station');
 await page.evaluate(()=>{
   const mini=window.PLUXMusicV31.debug.mini;
   const st=new Touch({identifier:7,target:mini,clientX:260,clientY:600});
   mini.dispatchEvent(new TouchEvent('touchstart',{touches:[st],changedTouches:[st],bubbles:true}));
   const en=new Touch({identifier:7,target:mini,clientX:207,clientY:780});
   mini.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[en],bubbles:true}));
 });
 assert.equal((await page.evaluate(()=>window.PLUXMusicV31.state())).title,'Радио Север','vertical scrolling does not change station');
 const theme=await page.evaluate(()=>{
  const el=window.PLUXMusicV31.debug.equalizer;
  const result=[];
  for(const id of ['emerald','azure','ruby','solar']){
   window.PLUXThemesV31.set(id);
   result.push({id,color:getComputedStyle(el).color,bars:getComputedStyle(el.firstElementChild).animationName,
     miniPlaying:window.PLUXMusicV31.debug.mini.classList.contains('plux31-is-playing')});
  }
  return result;
 });
 console.log('PLUX317_THEMES '+JSON.stringify(theme));
 assert.equal(new Set(theme.map(x=>x.color)).size,4,'equalizer color follows drop across themes');
 assert(theme.every(x=>x.miniPlaying&&x.bars==='plux31-eq-dance'),'bars animate when actually playing');
 // Browsing Audius does not corrupt the currently playing RADIO swipe queue.
 await page.evaluate(()=>window.PLUXMusicV31.open());
 await page.locator('.plux31-music-dialog [data-source="tracks"]').click();
 await page.waitForFunction(()=>document.querySelector('.plux31-music-dialog .plux31-result')?.textContent.includes('Музыка А'));
 await page.evaluate(()=>window.PLUXMusicV31.next());
 assert.equal((await page.evaluate(()=>window.PLUXMusicV31.state())).title,'Радио Вечер','radio queue survives switching the search tab to Audius');
 await page.locator('.plux31-music-dialog .plux31-result').first().click();
 assert.equal((await page.evaluate(()=>window.PLUXMusicV31.state())).source,'tracks','newly selected Audius queue replaces the radio queue');
 await page.evaluate(()=>window.PLUXMusicV31.next());
 assert.equal((await page.evaluate(()=>window.PLUXMusicV31.state())).title,'Музыка Б','Audius tracks also skip');
 const paused=await page.evaluate(()=>{
   window.PLUXMusicV31.debug.audio.pause();
   const eq=window.PLUXMusicV31.debug.equalizer;
   return {playing:window.PLUXMusicV31.debug.mini.classList.contains('plux31-is-playing'),
     animation:getComputedStyle(eq.firstElementChild).animationName};
 });
 assert.equal(paused.playing,false);
 assert.equal(paused.animation,'none','equalizer stops on pause');
 console.log('PLUX317_PASS swipe radio and Audius, preserve selected queue, keep vertical scroll, 8 bars color-synced and pause-aware');
 console.log('PLUX317_ERRORS '+JSON.stringify(errors.slice(0,8)));
 assert.equal(errors.length,0,'no JavaScript runtime errors');
}finally{await browser.close()}
