import{readFileSync}from'node:fs';import{join}from'node:path';const dir=process.argv[2]||'plux-published';
for(const file of ['index.html','app.js']){
const s=readFileSync(join(dir,file),'utf8'),patterns=[/цвет/ig,/palette/ig,/color-picker/ig,/hue/ig,/swatch/ig,/filter:/ig,/theme/ig,/tint/ig,/mascot/ig];
const items=[];
for(const re of patterns){let m,n=0;while((m=re.exec(s))&&n++<7){const st=Math.max(0,m.index-130),ed=Math.min(s.length,m.index+240);items.push({key:re.source,ctx:s.slice(st,ed).replace(/\s+/g,' ')})}}
console.log('V31_PALETTE_'+file+' '+JSON.stringify(items).slice(0,13000));
}