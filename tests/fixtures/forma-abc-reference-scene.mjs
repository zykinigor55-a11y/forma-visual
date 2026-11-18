/* Synthetic visual QA fixture, not a new user catalogue asset.
 * Reuses the house, plants, groundcover, pond and lighting already available. */
import {freshProject,normalizeProject} from '../../forma-landscape-project-core.js';
const plant=(id,catalogId,type,x,y,height,diameter,variant=1)=>({id,catalogId,type,x,y,height,diameter,rotation:0,variant});
const polygon=(id,catalogId,type,points,width=1.2)=>({id,catalogId,type,points,width});
export function buildABCReferenceScene(time='day'){
 const base=freshProject();
 base.title='FORMA · ABC quality reference';
 base.site={width:44,height:48,orientation:0,boundary:null};
 base.house={...base.house,x:22,y:25,width:12,height:9,archStyle:'barn',roof:'gable',roofRise:2.5,rotation:0};
 base.objects=[
  plant('qa-pine','pine','trees',5,12,13.5,6.8,2),
  plant('qa-spruce','spruce','trees',39,18,12.2,5.8,1),
  plant('qa-birch','birch','trees',7,37,12.5,6.2,2),
  plant('qa-oak','oak','trees',38,38,14,8,3),
  plant('qa-juniper','juniper','shrubs',8,22,.8,2.3),
  plant('qa-hydrangea','hydrangea','shrubs',33,12,1.5,2.1),
  plant('qa-spirea','spirea','shrubs',13,14,.8,1.45),
  plant('qa-thuja','thuja-globe','shrubs',35,32,1.4,1.7),
  polygon('qa-pond','natural','ponds',[
   {x:32,y:2},{x:40,y:4},{x:42,y:9},{x:37,y:13},{x:31,y:9}
  ]),
  polygon('qa-paving','concrete-pavers','pavers',[
   {x:22,y:30},{x:22,y:34},{x:24,y:39},{x:24,y:45}
  ],1.6),
  plant('qa-lamp','bollard','lights',24,37,.7,.25)
 ];
 base.atmosphere={time,season:'summer',weather:'sunny'};
 return normalizeProject(base);
}
