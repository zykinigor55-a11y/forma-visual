/* PLUX V10.6: four frame-matched loops + one one-shot; H.264 540×960 24fps. */
import {spawnSync} from 'node:child_process';
import {mkdirSync,statSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const dir=process.argv[2]||'public/assets/videos';
const dest=process.argv[3]||'public/assets/videos-v106';
const FF=process.env.PLUX_FFMPEG||'ffmpeg';
const W=540,H=960,FPS=24,FRAME=W*H*3/2;
const inputs=[['01_idle',22,true],['02_listening',12,true],['03_thinking',2,true],['04_talking',5,true],['05_happy',0,false]];
mkdirSync(dest,{recursive:true});
function run(args,options={}){
 const o=spawnSync(FF,['-nostdin','-hide_banner','-loglevel','error','-y',...args],{maxBuffer:256*1024*1024,...options});
 if(o.error||o.status!==0)throw Error('ffmpeg: '+(o.error?.message||o.stderr?.toString('utf8')||o.status));
 return o.stdout;
}
for(const [name,start,loop] of inputs){
 const input=join(dir,name+'.mp4'),out=join(dest,name+'.mp4');
 if(!loop){
  run(['-i',input,'-vf','scale='+W+':'+H+':flags=lanczos,fps='+FPS,
    '-an','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p',
    '-profile:v','main','-level','3.1','-movflags','+faststart',out]);
 }else{
  const raw=run(['-i',input,'-vf','scale='+W+':'+H+':flags=lanczos,fps='+FPS+',format=yuv420p',
    '-f','rawvideo','-pix_fmt','yuv420p','pipe:1']);
  const decoded=Math.floor(raw.byteLength/FRAME),count=decoded-start;
  if(count<50)throw Error(name+' too short');
  const frames=Buffer.allocUnsafe(count*FRAME);
  raw.copy(frames,0,start*FRAME,decoded*FRAME);
  const first=frames.subarray(0,FRAME);
  const blend=Math.min(12,Math.floor(count/6));
  for(let t=0;t<blend;t++){
   const index=count-blend+t;
   const a=t/(blend-1),w=a*a*(3-2*a),remaining=1-w;
   const pos=index*FRAME;
   if(t===blend-1){first.copy(frames,pos);continue}
   for(let k=0;k<FRAME;k++)frames[pos+k]=Math.round(frames[pos+k]*remaining+first[k]*w);
  }
  run(['-f','rawvideo','-pix_fmt','yuv420p','-s:v',W+'x'+H,'-r',String(FPS),
    '-i','pipe:0','-an','-c:v','libx264','-preset','veryfast','-crf','20',
    '-profile:v','main','-level','3.1','-pix_fmt','yuv420p','-g','48','-movflags','+faststart',out],
    {input:frames});
 }
 const bytes=statSync(out).size;
 if(bytes<50000)throw Error(name+' output invalid');
 console.log('PLUX V10.6 '+name+': '+Math.round(bytes/1024)+' KiB'+(loop?' seamless':' one-shot'));
}
writeFileSync(join(dest,'manifest.json'),JSON.stringify({version:'10.6',fps:24,width:W,height:H,seamless:['idle','listening','thinking','talking'],oneShot:['happy']}));
