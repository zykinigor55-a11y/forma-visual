import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {normalizeSettings,type Settings} from './prompts';

export type Variant={id:string;key:string;settings:Settings;createdAt:string;prompt:string};
export type ProjectRow={id:string;owner:string;title:string;source_key:string;settings:string;variants:string;created_at:string;updated_at:string};
export function bindings(){
 const e=env as Cloudflare.Env&{GEMINI_API_KEY?:string;GEMINI_MODEL?:string;GENERATION_ENABLED?:string;GENERATION_MONTHLY_LIMIT?:string};
 return e;
}
export async function identity(){return getChatGPTUser();}
export async function ownedProject(id:string,owner:string):Promise<ProjectRow|null>{
 if(!/^[a-f0-9-]{36}$/.test(id))return null;
 return await bindings().DB!.prepare('SELECT * FROM projects WHERE id = ? AND owner = ?').bind(id,owner).first<ProjectRow>();
}
export function serialize(row:ProjectRow){
 const variants=JSON.parse(row.variants) as Variant[];
 return {id:row.id,title:row.title,settings:normalizeSettings(JSON.parse(row.settings)),createdAt:row.created_at,updatedAt:row.updated_at,
 source:`/api/studio?action=asset&id=${row.id}&kind=source`,
 variants:variants.map(v=>({id:v.id,settings:v.settings,createdAt:v.createdAt,prompt:v.prompt,url:`/api/studio?action=asset&id=${row.id}&kind=${v.id}`}))};
}
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});}
export function month(){return new Date().toISOString().slice(0,7);}
export function monthlyLimit(){const n=Number(bindings().GENERATION_MONTHLY_LIMIT||5);return Number.isInteger(n)&&n>0&&n<=1000?n:5;}
