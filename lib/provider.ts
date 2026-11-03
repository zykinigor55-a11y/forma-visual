export function finalGeneratedImage(reply:unknown):{mimeType:string;data:string}{
 const data=reply as {candidates?:{finishReason?:string;content?:{parts?:{thought?:boolean;inlineData?:{mimeType?:string;data?:string}}[]}}[]};
 for(const candidate of data?.candidates||[]){
  if(candidate.finishReason&&candidate.finishReason!=='STOP')continue;
  const image=candidate.content?.parts?.find(p=>p.thought!==true&&p.inlineData?.data)?.inlineData;
  if(image?.data&&image.mimeType)return {data:image.data,mimeType:image.mimeType};
 }
 throw new Error('Google не вернул итоговое изображение. Попробуйте другой исходник или настройки.');
}
