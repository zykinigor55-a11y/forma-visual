'use client';
import {useEffect,useRef,useState} from 'react';
import {Loader2} from 'lucide-react';
import {type Settings} from '@/lib/prompts';
import {demoSignature,demoLabel} from '@/lib/demo';
import {renderDemo} from '@/lib/demo-renderer';

export default function DemoCanvas({settings,thumbnail=false}:{settings:Settings;thumbnail?:boolean}){
 const ref=useRef<HTMLCanvasElement>(null),[state,setState]=useState('loading'),[error,setError]=useState('');
 const signature=demoSignature(settings);
 useEffect(()=>{
  let cancelled=false;setState('loading');setError('');
  // Draw into a temporary canvas so an old request cannot repaint a newer selection.
  const buffer=document.createElement('canvas');
  renderDemo(buffer,settings,thumbnail).then(()=>{if(cancelled||!ref.current)return;const canvas=ref.current;canvas.width=buffer.width;canvas.height=buffer.height;canvas.getContext('2d')?.drawImage(buffer,0,0);setState('ready');}).catch(e=>{if(!cancelled){setState('error');setError((e as Error).message);}});
  return()=>{cancelled=true;};
 },[signature]);
 return <div className={`demo-canvas ${thumbnail?'demo-thumbnail':''}`}><canvas ref={ref} role="img" aria-label={'Дом-пример: '+demoLabel(settings)} data-scene={signature} data-render-status={state}/>{state==='loading'&&!thumbnail&&<div className="demo-loading"><Loader2 size={18} className="spin"/>Обновляем вид…</div>}{error&&<div className="demo-load-error" role="alert">{error}</div>}</div>;
}
