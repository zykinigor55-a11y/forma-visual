import{readFileSync,readdirSync}from'node:fs';import{join}from'node:path';
const dir=process.argv[2]||'plux-published';
for(const f of ['index.html','app.js']){
 const s=readFileSync(join(dir,f),'utf8');
 const re=/color|palet|цвет|greeting-title|speech-glass|audio|music|плеер/gi;
 const snippets=[];let m;
 while((m=re.exec(s))&&snippets.length<85){
  const start=Math.max(0,m.index-95),end=Math.min(s.length,m.index+125);
  const text=s.slice(start,end).replace(/\s+/g,' ').replace(/data:image[^"']{100,}/g,'[inline-image]');
  if(!snippets.some(x=>x===text))snippets.push(text);
 }
 console.log('V31_UI_INSPECT '+f+' '+JSON.stringify(snippets));
}

for(const f of ['index.html','app.js']){
 const data=readFileSync(join(dir,f),'utf8');
 const tokens=['<nav','bottom-nav','tab-bar','nav-item','nav-home','data-screen','color-options','color-palette','color-picker','speech-glass','palette','hue-rotate','plux-color'];
 for(const token of tokens){
   const index=data.indexOf(token);
   if(index>=0) console.log('V31_TARGET '+f+' '+token+': '+JSON.stringify(data.slice(Math.max(0,index-180),Math.min(data.length,index+1150))));
 }
}

for(const f of ['index.html','app.js']){
 const data=readFileSync(join(dir,f),'utf8');
 let i=0;
 for(const token of ['id="screen-settings"','id="screen-profile"','palette','swatch','color-grid','color-chip','colour','hueRotate','hue-rotate','цвет','#screen-settings','data-color','data-hue','localStorage.setItem']){
  let at=data.indexOf(token);
  if(at>=0){console.log('V31_PALETTE '+f+' '+token+' '+JSON.stringify(data.slice(Math.max(0,at-240),Math.min(data.length,at+1550))));i++}
  if(i>=12)break;
 }
}

for(const name of readdirSync(dir).filter(f=>/\.(?:js|css)$/.test(f))){
 if(name.includes('plux-live-')||name==='app.js')continue;
 const data=readFileSync(join(dir,name),'utf8');
 if(data.length>250000)continue;
 const matches=[...data.matchAll(/(?:палитр|цвет кап|синий|красный|color-palette|data-color|setColor|hue-rotate|swatch|color-choice|hueRotate)/gi)].slice(0,6);
 if(matches.length)console.log('V31_COLOR_FILE '+name+' '+JSON.stringify(matches.map(m=>data.slice(Math.max(0,m.index-100),Math.min(data.length,m.index+260)).replace(/\s+/g,' '))));
}
