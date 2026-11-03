import {parseImage} from './validation.ts';
export function createWorkspaceGuard(){
 let version=0;
 return {invalidate(){version++;},async run<T>(operation:()=>Promise<T>,apply:(value:T)=>void):Promise<T|null>{
  const started=version,value=await operation();
  if(started!==version)return null;
  apply(value);return value;
 }};
}
export function imageForStorage(original:string):string{parseImage(original);return original;}
