import sharp from '../node_modules/.pnpm/sharp@0.35.4_@types+node@22.19.19/node_modules/sharp/dist/index.mjs';
import {mkdir} from 'node:fs/promises';
const [source,key]=process.argv.slice(2);if(!source?.startsWith('/workspace/scratch/')||!source.endsWith('.png')||!/^((house|lake|garden|village)-(spring|summer|autumn|winter)-(cloudy|rain|fog))$/.test(key))throw Error('Invalid image asset');
await mkdir('public/images/weather',{recursive:true});await sharp(source).resize(1448,1086,{fit:'fill'}).webp({quality:89,effort:5}).toFile(`public/images/weather/${key}.webp`);
console.log(key);
