/** PLUX 13.1 — bespoke premium soft-glass ASMR; original procedural audio, no sample licensing.
 * Safe: no autoplay, no network, persists existing sound toggle and volume settings.
 * Compatible with the existing playSfx / setSoundEnabled / installInterfaceSfx imports.
 */
let enabled=true;
try{enabled=localStorage.getItem('plux_sfx_enabled')!=='off'}catch{}
let ctx=null,master=null,installed=false;
const recent=new Map();
const reduceMotion=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
const specs={
 tap:         {notes:[[780,0,.10,.18],[1170,.023,.13,.07]],air:.025,noisePitch:1100,down:.94,limit:95},
 bubble:      {notes:[[380,0,.18,.23],[545,.055,.19,.14],[835,.105,.17,.06]],air:.09,noisePitch:670,down:1.23,limit:220},
 theme:       {notes:[[425,0,.22,.30],[650,.08,.29,.23],[980,.15,.32,.10]],air:.065,noisePitch:1400,down:1.31,limit:360},
 open:        {notes:[[480,0,.17,.11],[720,.072,.24,.13],[960,.118,.26,.08]],air:.07,noisePitch:1200,down:1.09,limit:180},
 close:       {notes:[[580,0,.15,.13],[415,.055,.15,.09]],air:.045,noisePitch:820,down:.78,limit:170},
 listen:      {notes:[[392,0,.27,.12],[587,.05,.32,.11],[784,.1,.29,.08]],air:.06,noisePitch:600,down:1.06,limit:220},
 send:        {notes:[[610,0,.20,.12],[920,.052,.21,.10]],air:.085,noisePitch:1750,down:1.18,limit:240},
 success:     {notes:[[523,0,.31,.16],[784,.11,.31,.13],[1047,.22,.38,.08]],air:.025,noisePitch:1650,down:1.01,limit:440},
 notification:{notes:[[740,0,.26,.13],[988,.15,.34,.10]],air:.02,noisePitch:1500,down:1.01,limit:650},
 happy:       {notes:[[520,0,.21,.10],[695,.065,.24,.13],[1040,.13,.30,.09]],air:.03,noisePitch:1350,down:1.12,limit:320},
 error:       {notes:[[315,0,.13,.08],[260,.07,.12,.06]],air:.018,noisePitch:430,down:.91,limit:310},
 file:        {notes:[[400,0,.15,.08],[740,.06,.19,.09]],air:.07,noisePitch:1500,down:1.18,limit:170},
 image:       {notes:[[650,0,.24,.13],[975,.09,.32,.10],[1300,.19,.39,.06]],air:.055,noisePitch:2000,down:1.09,limit:400},
 type:        {notes:[[930,0,.033,.019]],air:0,noisePitch:1000,down:.89,limit:60}
};
function volume(){
  let setting=55;
  try{setting=Number(localStorage.getItem('plux_v125_volume')??55)}catch{}
  return Math.max(0,Math.min(100,Number.isFinite(setting)?setting:55))/100;
}
function audio(){
  const C=window.AudioContext||window.webkitAudioContext;
  if(!C)return null;
  if(!ctx){
    ctx=new C({latencyHint:'interactive'});
    master=ctx.createGain();
    // The numbers above are quiet by design; cap the entire UI effects bus.
    master.gain.value=.21;
    master.connect(ctx.destination);
  }
  if(ctx.state==='suspended')void ctx.resume().catch(()=>{});
  return ctx;
}
function tone(c,start,f,duration,level,pitch,kind){
  const osc=c.createOscillator(),amp=c.createGain(),cut=c.createBiquadFilter();
  osc.type=kind==='type'?'sine':kind==='error'?'triangle':'sine';
  osc.frequency.setValueAtTime(f,start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(80,f*pitch),start+duration);
  cut.type='lowpass';cut.frequency.value=kind==='type'?1750:2600;cut.Q.value=.45;
  const peak=Math.max(.00003,Math.min(.23,level));
  amp.gain.setValueAtTime(.00001,start);
  amp.gain.exponentialRampToValueAtTime(peak,start+Math.min(.015,duration*.17));
  amp.gain.exponentialRampToValueAtTime(Math.max(.00001,peak*.42),start+duration*.36);
  amp.gain.exponentialRampToValueAtTime(.00001,start+duration);
  osc.connect(cut);cut.connect(amp);amp.connect(master);
  osc.start(start);osc.stop(start+duration+.02);
  osc.onended=()=>{try{osc.disconnect();cut.disconnect();amp.disconnect()}catch{}};
}
const noiseCache=new Map();
function softAir(c,start,length,level,frequency){
  const sampleRate=c.sampleRate,cacheKey=Math.round(length*100)/100;
  let buffer=noiseCache.get(cacheKey);
  if(!buffer){
    buffer=c.createBuffer(1,Math.ceil(sampleRate*Math.max(.05,length)),sampleRate);
    const data=buffer.getChannelData(0);
    // Layered uniform noise softened by a resonant low pass, not a harsh 'white hiss'.
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(.6+.4*Math.sin(i*9.3/sampleRate));
    noiseCache.set(cacheKey,buffer);
  }
  const src=c.createBufferSource(),filt=c.createBiquadFilter(),amp=c.createGain();
  src.buffer=buffer;filt.type='lowpass';filt.frequency.value=frequency;filt.Q.value=.5;
  amp.gain.setValueAtTime(.00001,start);
  amp.gain.exponentialRampToValueAtTime(Math.max(.00002,level),start+Math.min(.065,length*.32));
  amp.gain.exponentialRampToValueAtTime(.00001,start+length);
  src.connect(filt);filt.connect(amp);amp.connect(master);
  src.start(start);src.stop(start+length+.005);
  src.onended=()=>{try{src.disconnect();filt.disconnect();amp.disconnect()}catch{}};
}
export function isSoundEnabled(){return enabled}
export function setSoundEnabled(on){
  enabled=Boolean(on);
  try{localStorage.setItem('plux_sfx_enabled',enabled?'on':'off')}catch{}
  if(!enabled&&ctx?.state==='running')void ctx.suspend().catch(()=>{});
  return enabled;
}
export function playSfx(name='tap',intensity=1){
  if(!enabled||document.hidden)return false;
  const spec=specs[name]||specs.tap,now=performance.now();
  if(now-(recent.get(name)||-1e9)<spec.limit)return false;
  recent.set(name,now);
  try{
    const c=audio();if(!c)return false;
    const g=volume()*Math.min(1.3,Math.max(0,intensity))*(window.speechSynthesis?.speaking?.33:1);
    if(g===0)return false;
    const start=c.currentTime+.01;
    spec.notes.forEach(([frequency,delay,duration,level])=>{
      tone(c,start+delay,frequency,duration,level*g,spec.down,name);
    });
    if(spec.air)softAir(c,start+.006,Math.min(.25,spec.notes.at(-1)[2]*.8),spec.air*g,spec.noisePitch);
    return true;
  }catch{return false}
}
export function installInterfaceSfx(){
  if(installed)return;installed=true;
  document.addEventListener('click',event=>{
    const b=event.target?.closest?.('button');
    if(!b||!enabled||b.id==='sound-preview')return;
    let name='tap';
    const id=b.id;
    if(b.classList.contains('plux-theme-orb'))name='theme';
    else if(id==='home-mascot')name='happy';
    else if(b.classList.contains('chat-send'))name='send';
    else if(b.dataset.pick)name='file';
    else if(id==='open-notifications')name='notification';
    else if(id==='open-voice-quick'||id==='speech-button')name='listen';
    else if(id==='voice-toggle')name=b.classList.contains('live')?'close':'listen';
    else if(['voice-end','voice-back','chat-back','prefs-close','feature-close','feature-done'].includes(id))name='close';
    else if(id==='continue-onboard')name=document.getElementById('user-name')?.value.trim()?'success':'error';
    else if(id==='create-art-button')name=document.getElementById('image-prompt')?.value.trim()?'image':'error';
    else if(id==='prefs-save')name='success';
    else if(b.classList.contains('mode-card')||['create','modes'].includes(b.dataset.go))name='open';
    playSfx(name);
  },{capture:true,passive:true});
}
