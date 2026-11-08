/** PLUX V10.7 — original quiet glass micro-ASMR sounds via Web Audio.
 * No external audio samples, no continuous ambience, and no autoplay.
 */
let enabled=true;
try{enabled=localStorage.getItem('plux_sfx_enabled')!=='off'}catch{}
let context=null;const recent=new Map();
const profiles={
 tap:{frequencies:[620,930],duration:.16,level:.022,noise:.12},
 bubble:{frequencies:[490,730],duration:.28,level:.031,noise:.22},
 open:{frequencies:[520,780,1040],duration:.34,level:.027,noise:.16},
 close:{frequencies:[650,440],duration:.24,level:.024,noise:.12},
 listen:{frequencies:[390,585,780],duration:.41,level:.032,noise:.18},
 send:{frequencies:[560,840],duration:.27,level:.026,noise:.20},
 success:{frequencies:[590,790,1180],duration:.40,level:.032,noise:.18},
 notification:{frequencies:[730,1095],duration:.30,level:.026,noise:.10},
 happy:{frequencies:[520,695,1040],duration:.38,level:.029,noise:.15},
 error:{frequencies:[420,330],duration:.24,level:.019,noise:.07}
};
function getContext(){
 if(!context){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;context=new C({latencyHint:'interactive'})}
 if(context.state==='suspended')void context.resume().catch(()=>{});
 return context;
}
export function isSoundEnabled(){return enabled}
export function setSoundEnabled(on){
 enabled=Boolean(on);
 try{localStorage.setItem('plux_sfx_enabled',enabled?'on':'off')}catch{}
 return enabled;
}
function tone(ctx,f,start,duration,level,index){
 const oscillator=ctx.createOscillator(),amp=ctx.createGain(),filter=ctx.createBiquadFilter();
 oscillator.type=index===0?'sine':'triangle';
 oscillator.frequency.setValueAtTime(f,start);
 oscillator.frequency.exponentialRampToValueAtTime(f*(index===0?.9:1.07),start+duration);
 filter.type='lowpass';filter.frequency.value=1900;filter.Q.value=.6;
 amp.gain.setValueAtTime(.00001,start);
 amp.gain.exponentialRampToValueAtTime(Math.max(.00002,level),start+Math.min(.028,duration*.13));
 amp.gain.exponentialRampToValueAtTime(.00001,start+duration);
 oscillator.connect(filter);filter.connect(amp);amp.connect(ctx.destination);
 oscillator.start(start);oscillator.stop(start+duration+.02);
 oscillator.onended=()=>{try{oscillator.disconnect();filter.disconnect();amp.disconnect()}catch{}};
}
function softAir(ctx,start,duration,level){
 const n=Math.ceil(ctx.sampleRate*duration),buffer=ctx.createBuffer(1,n,ctx.sampleRate);
 const data=buffer.getChannelData(0);
 for(let i=0;i<n;i++)data[i]=Math.random()*2-1;
 const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
 source.buffer=buffer;filter.type='lowpass';filter.frequency.value=740;filter.Q.value=.35;
 gain.gain.setValueAtTime(.00001,start);
 gain.gain.exponentialRampToValueAtTime(Math.max(.00002,level),start+duration*.24);
 gain.gain.exponentialRampToValueAtTime(.00001,start+duration);
 source.connect(filter);filter.connect(gain);gain.connect(ctx.destination);
 source.start(start);source.stop(start+duration+.01);
 source.onended=()=>{try{source.disconnect();filter.disconnect();gain.disconnect()}catch{}};
}
export function playSfx(name='tap',gain=1){
 if(!enabled||document.hidden)return false;
 const spec=profiles[name]||profiles.tap,now=performance.now();
 if(now-(recent.get(name)||-1e9)<130)return false;
 recent.set(name,now);
 try{
  const ctx=getContext();if(!ctx)return false;
  const start=ctx.currentTime+.009,g=Math.max(0,Math.min(gain,1.3));
  spec.frequencies.forEach((f,i)=>tone(ctx,f,start+i*.035,spec.duration*(i?.72:1),spec.level*g/(1+i*.9),i));
  if(spec.noise)softAir(ctx,start+.005,Math.min(.16,spec.duration*.58),spec.level*spec.noise*g);
  return true;
 }catch(err){console.info('PLUX soft sound unavailable',err?.name);return false}
}
export function installInterfaceSfx(){
 document.addEventListener('click',event=>{
  const button=event.target?.closest?.('button');
  if(!button||!enabled||button.id==='sound-preview')return;
  const id=button.id;let name='tap';
  if(id==='home-mascot')name='happy';
  else if(button.classList.contains('chat-send'))name='send';
  else if(id==='open-notifications')name='notification';
  else if(id==='open-voice-quick'||id==='speech-button')name='listen';
  else if(id==='voice-toggle')name=button.classList.contains('live')?'close':'listen';
  else if(['voice-end','voice-back','chat-back','prefs-close','feature-close','feature-done'].includes(id))name='close';
  else if(id==='continue-onboard')name=document.getElementById('user-name')?.value.trim()?'success':'error';
  else if(id==='create-art-button')name=document.getElementById('image-prompt')?.value.trim()?'open':'error';
  else if(id==='prefs-save')name='success';
  else if(button.classList.contains('mode-card')||['create','modes'].includes(button.dataset.go))name='open';
  playSfx(name);
 },{capture:true,passive:true});
}
