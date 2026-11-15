/* Mask convention here: alpha 0 preserves source, alpha 255 replaces it. */
export function compositePixels(base,edited,mask){
 if(base.length!==edited.length||base.length!==mask.length||base.length%4)throw Error('Размеры изображений и маски не совпадают');
 const out=new Uint8ClampedArray(base);
 for(let i=0;i<base.length;i+=4){const a=mask[i+3]/255;if(!a)continue;for(let c=0;c<3;c++)out[i+c]=Math.round(base[i+c]*(1-a)+edited[i+c]*a);out[i+3]=base[i+3];}
 return out;
}
export function itemBounds(item){
 if(item.kind==='path')return {x:Math.min(...item.points.map(p=>p.x)),y:Math.min(...item.points.map(p=>p.y)),right:Math.max(...item.points.map(p=>p.x)),bottom:Math.max(...item.points.map(p=>p.y))};
 // Include room for contact shadows, entirely visible in the editor mask.
 return {x:Math.max(0,item.x-item.w*.65),y:Math.max(0,item.y-item.h*1.05),right:Math.min(1,item.x+item.w*.65),bottom:Math.min(1,item.y+item.h*.14)};
}
export function cropBounds(items,width,height){
 if(!items.length||!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1)throw Error('Нет области для обработки');
 const boxes=items.map(itemBounds),pad=.035;
 const x=Math.max(0,Math.floor((Math.min(...boxes.map(b=>b.x))-pad)*width)), y=Math.max(0,Math.floor((Math.min(...boxes.map(b=>b.y))-pad)*height));
 const right=Math.min(width,Math.ceil((Math.max(...boxes.map(b=>b.right))+pad)*width)),bottom=Math.min(height,Math.ceil((Math.max(...boxes.map(b=>b.bottom))+pad)*height));
 return {x,y,width:right-x,height:bottom-y};
}
export async function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Не удалось открыть изображение'));im.src=src;});}
export function canvas(width,height){const c=document.createElement('canvas');c.width=width;c.height=height;return c;}
export function assertFraming(width,height,expectedWidth,expectedHeight){
 if(!width||!height||Math.abs((width/height)/(expectedWidth/expectedHeight)-1)>.035)throw Error('AI изменил пропорции кадра. Результат не применён, чтобы не исказить изображение.');
}
export async function composeMasked(baseURL,editedURL,maskCanvas,crop=null,frame=null){
 const [base,edited]=await Promise.all([loadImage(baseURL),loadImage(editedURL)]),w=base.naturalWidth,h=base.naturalHeight;
 const output=canvas(w,h),ctx=output.getContext('2d',{willReadFrequently:true});ctx.drawImage(base,0,0);
 const region=crop||{x:0,y:0,width:w,height:h};
 assertFraming(edited.naturalWidth,edited.naturalHeight,frame?.width||region.width,frame?.height||region.height);
 const replacement=canvas(region.width,region.height),rc=replacement.getContext('2d',{willReadFrequently:true});
 if(frame){const sx=edited.naturalWidth/frame.width,sy=edited.naturalHeight/frame.height;rc.drawImage(edited,frame.x*sx,frame.y*sy,region.width*sx,region.height*sy,0,0,region.width,region.height);}
 else rc.drawImage(edited,0,0,region.width,region.height);
 const selection=canvas(region.width,region.height),sc=selection.getContext('2d',{willReadFrequently:true});
 // Rescale selection to source dimensions before extracting the crop.
 const full=canvas(w,h);full.getContext('2d').drawImage(maskCanvas,0,0,w,h);sc.drawImage(full,region.x,region.y,region.width,region.height,0,0,region.width,region.height);
 const original=ctx.getImageData(region.x,region.y,region.width,region.height),fresh=rc.getImageData(0,0,region.width,region.height),mask=sc.getImageData(0,0,region.width,region.height);
 original.data.set(compositePixels(original.data,fresh.data,mask.data));ctx.putImageData(original,region.x,region.y);
 return output.toDataURL('image/png');
}
