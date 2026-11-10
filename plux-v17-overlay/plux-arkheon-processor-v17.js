/* PLUX V17: streaming PCM16 at 24kHz for Arkheon Realtime.
 * AudioWorklet lives on the same origin and never sends unencrypted audio.
 */
class PluxArkheonCapture extends AudioWorkletProcessor {
  constructor(){
    super();
    this.phase=0;this.step=sampleRate/24000;
    this.frames=[];this.framesMax=1024;
    this.stopped=false;
    this.port.onmessage=e=>{if(e.data==="stop"){this.stopped=true;this.frames=[]}};
  }
  process(inputs,outputs){
    const outs=outputs?.[0];
    if(outs)for(const channel of outs)channel.fill(0);
    if(this.stopped)return false;
    const input=inputs?.[0]?.[0];
    if(!input?.length)return true;
    let position=this.phase;
    while(position<input.length){
      const i=Math.floor(position),fraction=position-i;
      const a=input[i]||0,b=input[Math.min(i+1,input.length-1)]||0;
      const value=Math.max(-1,Math.min(1,a+(b-a)*fraction));
      const pcm=value<0?Math.round(value*32768):Math.round(value*32767);
      this.frames.push(pcm);
      if(this.frames.length>=this.framesMax){
        const samples=new Int16Array(this.frames);
        this.port.postMessage(samples.buffer,[samples.buffer]);
        this.frames=[];
      }
      position+=this.step;
    }
    this.phase=position-input.length;
    return true;
  }
}
registerProcessor("plux-arkheon-capture",PluxArkheonCapture);
