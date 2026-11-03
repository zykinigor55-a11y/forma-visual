import {readdir,readFile,stat,unlink} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const pnpm=join(process.cwd(),'node_modules/.pnpm');
const name=(await readdir(pnpm)).find(x=>x.startsWith('sharp@'));
if(!name)throw new Error('The installed image encoder is unavailable.');
const packageRoot=join(pnpm,name,'node_modules/sharp');
const pkg=JSON.parse(await readFile(join(packageRoot,'package.json'),'utf8'));
const {default:sharp}=await import(pathToFileURL(join(packageRoot,pkg.module||pkg.main)).href);
const directory=join(process.cwd(),'public/images/demo');
let count=0,total=0;
for(const filename of await readdir(directory)){
 if(!filename.endsWith('.png'))continue;
 const input=join(directory,filename),output=input.replace(/\.png$/,'.webp');
 await sharp(input).webp({quality:90,effort:5}).toFile(output);
 total+=(await stat(output)).size;await unlink(input);count++;
}
console.log(JSON.stringify({optimized:count,outputMiB:Number((total/1024/1024).toFixed(2))}));
