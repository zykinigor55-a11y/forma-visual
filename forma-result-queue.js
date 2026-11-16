/* One review per generated frame; gallery membership is an explicit choice. */
export function createReviewQueue(){
 const entries=[];let active=null;
 return {
  add(entry){const known=entries.find(x=>x.image===entry.image);if(known){Object.assign(known,entry);return known;}const item={...entry,decision:null};entries.push(item);return item;},
  next(){active=entries.find(x=>x.decision===null)||null;return active;},
  activate(image){active=entries.find(x=>x.image===image)||null;return active;},
  async decide(choice){const item=active;if(!item)return;if(choice==='save'){await item.onSave?.();item.decision='saved';}else item.decision='later';return item;},
  get active(){return active;},get pending(){return entries.filter(x=>x.decision===null).length;}
 };
}
export const inGallery=render=>!!render?.id&&render.gallerySaved!==false;
