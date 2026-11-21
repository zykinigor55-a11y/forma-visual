import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const output='assets/landscape-screenshots';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader',
 '--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox'
]});
const results=[];
try{
 const page=await browser.newPage({viewport:{width:1200,height:940},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',message=>{
  if(message.type()==='error'&&/WebGLProgram|VALIDATE_STATUS|shader|GL_INVALID_OPERATION/i.test(message.text()))errors.push(message.text());
 });
 const samples=[
  ['night-on','globe','night',1],
  ['night-off','globe','night',0],
  ['day','globe','day',1],
  ['black-3-bands','square-bollard','night',1],
  ['open-frame','garden-lantern','night',1]
 ];
 for(const [name,id,mode,brightness] of samples){
  const url='http://127.0.0.1:3000/forma-luminaire-01-render.html?id='+id+'&mode='+mode+'&brightness='+brightness;
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
  if(response?.status()!==200)throw Error('HTTP '+response?.status()+' '+name);
  await page.waitForFunction(()=>window.FORMA_LAMP_READY===true,null,{timeout:95000});
  await page.waitForTimeout(150);
  const data=await page.evaluate(()=>{
   const canvas=document.querySelector('canvas');
   const sw=240,sh=188;
   const c=document.createElement('canvas');c.width=sw;c.height=sh;
   const ctx=c.getContext('2d',{willReadFrequently:true});
   ctx.drawImage(canvas,0,0,sw,sh);
   const pix=ctx.getImageData(0,0,sw,sh).data;
   let sum=0,count=0;
   // Terrain near the globe's foot, excluding the spherical projected form.
   for(let y=145;y<179;y++)for(let x=63;x<177;x++){
    const idx=(y*sw+x)*4;
    const r=pix[idx],g=pix[idx+1],b=pix[idx+2];
    sum+=.2126*r+.7152*g+.0722*b;count++;
   }
   return {proof:window.FORMA_LAMP_PROOF,groundLuminance:Math.round(sum/count*100)/100};
  });
  if(data.proof.fixtureId!==id||!data.proof.webgl)throw Error('Invalid 3D instance '+name);
  if(id==='globe'){
   if(!data.proof.globeOptics?.diffuseShell||data.proof.sphereCastsShadow!==false)
    throw Error('Globe optical model is not physical '+JSON.stringify(data.proof));
   if(mode==='night'&&brightness===1&&data.proof.lightIntensity<=0)
    throw Error('Sphere has no real environment emitter');
   if(brightness===0&&data.proof.lightIntensity!==0)
    throw Error('Globe dimmer does not turn off the actual lamp');
  }
  const file=output+'/lighting-v6-'+name+'-actual-WebGL.png';
  await page.locator('canvas').screenshot({path:file,animations:'disabled',timeout:90000});
  const size=(await fs.stat(file)).size;
  if(size<10000)throw Error('PNG empty '+name+' '+size);
  results.push({name,id,mode,brightness,file,size,
   groundLuminance:data.groundLuminance,proof:data.proof});
  console.log('WEBGL PROOF',name,JSON.stringify({size,groundLuminance:data.groundLuminance,
   lightIntensity:data.proof.lightIntensity,castShadow:data.proof.sphereCastsShadow}));
 }
 const on=results.find(x=>x.name==='night-on'),off=results.find(x=>x.name==='night-off');
 if(on.groundLuminance<=off.groundLuminance+3)
  throw Error('Sphere has no visible real illumination on landscape test floor: '+on.groundLuminance+' vs '+off.groundLuminance);
 if(errors.length)throw Error('Shader or browser errors: '+errors.join(' | ').slice(0,2000));
 await fs.writeFile(output+'/lighting-v6-globe-night-optics-proof.json',JSON.stringify({
  source:'real DOM.RENDER authored Three.js WebGL; user-supplied sphere reference; never AI-generated',
  verifiedBrightGround:on.groundLuminance>off.groundLuminance+3,
  shadowFreeOpalShell:true,results,errors,timestamp:new Date().toISOString()
 },null,2)+'\n');
 console.log('GLOBE LIGHT SCATTER AND GROUND EMISSION SUCCESS');
}finally{await browser.close();}
