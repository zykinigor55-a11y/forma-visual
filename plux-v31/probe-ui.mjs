import{readFileSync}from'node:fs';import{join}from'node:path';
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
