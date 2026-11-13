/**
 * ДОМ.ПРИМЕРКА: isolated server-side staging API.
 * Node >=22, experimental built-in SQLite. Not a production service.
 * Enable explicitly with PRIMERKA_STAGING_ENABLED=true.
 */
import {DatabaseSync} from 'node:sqlite';
import {randomBytes, randomUUID, createHash, scryptSync, timingSafeEqual} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=dirname(fileURLToPath(import.meta.url));
const DB_PATH=process.env.PRIMERKA_DB_PATH || resolve(ROOT,'data','portal.sqlite');
const COOKIE='primerka_session';
const SESSION_AGE=14*24*60*60;
const attempts=new Map();
let db=null;

function database(){
 if(db)return db;
 mkdirSync(dirname(DB_PATH),{recursive:true,mode:0o700});
 const d=new DatabaseSync(DB_PATH);
 d.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
 d.exec([
 'CREATE TABLE IF NOT EXISTS organizations(id TEXT PRIMARY KEY,name TEXT NOT NULL,status TEXT NOT NULL DEFAULT "pending",created_at TEXT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,role TEXT NOT NULL,organization_id TEXT REFERENCES organizations(id),created_at TEXT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at INTEGER NOT NULL)',
 'CREATE TABLE IF NOT EXISTS products(id TEXT PRIMARY KEY,organization_id TEXT NOT NULL REFERENCES organizations(id),category TEXT NOT NULL,name TEXT NOT NULL,sku TEXT NOT NULL,price REAL,unit TEXT NOT NULL,color TEXT NOT NULL,image_data TEXT,created_at TEXT NOT NULL,UNIQUE(organization_id,sku))',
 'CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),name TEXT NOT NULL,photo_data TEXT,selected_ids TEXT NOT NULL,created_at TEXT NOT NULL)',
 'CREATE INDEX IF NOT EXISTS idx_products_org ON products(organization_id)',
 'CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id)',
 'CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)'
 ].join(';')+';');
 db=d;return db;
}
function fail(status,message){const e=Error(message);e.status=status;throw e}
function okText(v,max){return typeof v==='string'&&v.trim().length>0&&v.trim().length<=max}
function accountEmail(v){return typeof v==='string'&&v.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)}
function ipKey(req){return String(req.socket?.remoteAddress||'unknown').slice(0,80)}
function limit(req,kind,max=12){
 const now=Date.now(),key=ipKey(req)+':'+kind;
 const item=attempts.get(key);
 if(attempts.size>3000){for(const [k,v] of attempts){if(now-v.since>900000)attempts.delete(k)}}
 if(!item||now-item.since>900000){attempts.set(key,{since:now,count:1});return}
 item.count++;if(item.count>max)fail(429,'Слишком много попыток. Повторите позднее.');
}
function passHash(password,salt=randomBytes(16).toString('hex')){
 return 'scrypt:'+salt+':'+scryptSync(password,salt,64,{N:16384,r:8,p:1}).toString('hex');
}
function passVerify(password,stored){
 try{const [alg,salt,hex]=stored.split(':');if(alg!=='scrypt')return false;
 const found=scryptSync(password,salt,64,{N:16384,r:8,p:1});
 return timingSafeEqual(found,Buffer.from(hex,'hex'))}catch{return false}
}
function sha(token){return createHash('sha256').update(token).digest('hex')}
function cookieToken(req){
 const header=String(req.headers.cookie||'');const match=header.match(/(?:^|;\s*)primerka_session=([A-Za-z0-9_-]{30,200})(?:;|$)/);
 return match?match[1]:null;
}
function findUser(req){
 const token=cookieToken(req);if(!token)return null;
 const d=database(),row=d.prepare('SELECT u.id,u.email,u.role,u.organization_id,o.name AS company,o.status AS company_status FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN organizations o ON o.id=u.organization_id WHERE s.token_hash=? AND s.expires_at>?').get(sha(token),Math.floor(Date.now()/1000));
 return row||null;
}
function userById(id){return database().prepare('SELECT u.id,u.email,u.role,u.organization_id,o.name AS company,o.status AS company_status FROM users u LEFT JOIN organizations o ON o.id=u.organization_id WHERE u.id=?').get(id)||null}
function requireUser(req){const user=findUser(req);if(!user)fail(401,'Войдите в личный кабинет');return user}
function requireManufacturer(req){const u=requireUser(req);if(u.role!=='manufacturer_admin'||u.company_status!=='approved'||!u.organization_id)fail(403,'Требуется подтверждённый кабинет производителя');return u}
function issueSession(res,userId,req){
 const token=randomBytes(32).toString('base64url');
 database().prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(sha(token),userId,Math.floor(Date.now()/1000)+SESSION_AGE);
 const secure=req.socket?.encrypted||String(req.headers['x-forwarded-proto']||'').toLowerCase()==='https';
 res.setHeader('Set-Cookie',COOKIE+'='+token+'; HttpOnly; Path=/api/primerka; SameSite=Strict; Max-Age='+SESSION_AGE+(secure?'; Secure':''));
}
function clearSession(res,req){
 const token=cookieToken(req);if(token)database().prepare('DELETE FROM sessions WHERE token_hash=?').run(sha(token));
 res.setHeader('Set-Cookie',COOKIE+'=; HttpOnly; Path=/api/primerka; SameSite=Strict; Max-Age=0');
}
function safeUser(u){if(!u)return null;return {id:u.id,email:u.email,role:u.role,organizationId:u.organization_id||null,company:u.company||null,companyStatus:u.company_status||null}}
function json(res,status,data){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.end(JSON.stringify(data))}
async function body(req){
 const pieces=[];let len=0;for await(const chunk of req){len+=chunk.length;if(len>700000)fail(413,'Слишком большой запрос');pieces.push(chunk)}
 try{const parsed=JSON.parse(Buffer.concat(pieces).toString('utf8'));if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))fail(400,'Неверный JSON');return parsed}catch(e){if(e.status)throw e;fail(400,'Неверный JSON')}
}
function checkMutation(req){
 const origin=req.headers.origin;
 if(origin){let host;try{host=new URL(origin).host}catch{fail(403,'Неверный Origin')}if(host!==req.headers.host)fail(403,'Запрос с другого сайта запрещён')}
 if(req.headers['sec-fetch-site']==='cross-site')fail(403,'Запрос с другого сайта запрещён');
 if(!['POST','DELETE','PATCH'].includes(req.method))fail(405,'Метод не поддерживается');
}
function allowedImage(v){
 if(v===undefined||v===null||v==='')return null;
 if(typeof v!=='string'||v.length>440000||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v))fail(400,'Некорректная миниатюра');
 return v;
}
function productView(row){
 return {id:row.id,brand:row.brand,category:row.category,name:row.name,sku:row.sku,price:row.price,unit:row.unit,color:row.color,image:row.image_data,organizationId:row.organization_id};
}
function approvedProducts(d){
 return d.prepare('SELECT p.*,o.name AS brand FROM products p JOIN organizations o ON o.id=p.organization_id WHERE o.status=? ORDER BY p.created_at DESC LIMIT 300').all('approved').map(productView);
}
export async function handlePrimerkaApi(req,res){
 if(!req.url?.startsWith('/api/primerka/'))return false;
 try{
  if(process.env.PRIMERKA_STAGING_ENABLED!=='true')fail(503,'Тестовая серверная версия не включена');
  const d=database();
  const url=new URL(req.url,'http://localhost');
  const path=url.pathname.slice('/api/primerka'.length);
  if(req.method==='GET'&&path==='/status'){json(res,200,{online:true,staging:true,user:safeUser(findUser(req))});return true}
  if(req.method==='POST'&&path==='/signup'){
   checkMutation(req);limit(req,'signup',8);
   const p=await body(req);const email=String(p.email||'').trim().toLowerCase(),password=p.password,companyName=String(p.companyName||'').trim();
   if(!accountEmail(email)||typeof password!=='string'||password.length<12||password.length>128)fail(400,'Укажите email и пароль не короче 12 символов');
   const manufacturer=p.role==='manufacturer';if(manufacturer&&!okText(companyName,110))fail(400,'Укажите название компании');
   if(p.role!=='customer'&&!manufacturer)fail(400,'Неверный тип аккаунта');
   if(d.prepare('SELECT id FROM users WHERE email=?').get(email))fail(409,'Этот email уже зарегистрирован');
   const id=randomUUID(),oid=manufacturer?randomUUID():null,now=new Date().toISOString(),role=manufacturer?'manufacturer_pending':'customer';
   d.exec('BEGIN IMMEDIATE');
   try{
    if(manufacturer)d.prepare('INSERT INTO organizations(id,name,status,created_at) VALUES(?,?,"pending",?)').run(oid,companyName,now);
    d.prepare('INSERT INTO users(id,email,password_hash,role,organization_id,created_at) VALUES(?,?,?,?,?,?)').run(id,email,passHash(password),role,oid,now);
    d.exec('COMMIT');
   }catch(e){d.exec('ROLLBACK');if(String(e.message).includes('UNIQUE'))fail(409,'Этот email уже зарегистрирован');throw e}
   issueSession(res,id,req);
   json(res,201,{user:safeUser(userById(id)),message:manufacturer?'Компания ожидает подтверждения':'Аккаунт создан'});
   return true;
  }
  if(req.method==='POST'&&path==='/login'){
   checkMutation(req);limit(req,'login',14);
   const p=await body(req);const email=String(p.email||'').trim().toLowerCase();
   if(!accountEmail(email)||typeof p.password!=='string')fail(401,'Неверная почта или пароль');
   const row=d.prepare('SELECT id,password_hash FROM users WHERE email=?').get(email);
   if(!row||!passVerify(p.password,row.password_hash))fail(401,'Неверная почта или пароль');
   issueSession(res,row.id,req);json(res,200,{user:safeUser(userById(row.id))});return true;
  }
  if(req.method==='POST'&&path==='/logout'){
   checkMutation(req);clearSession(res,req);json(res,200,{success:true});return true;
  }
  if(req.method==='GET'&&path==='/me'){json(res,200,{user:safeUser(requireUser(req))});return true}
  if(req.method==='GET'&&path==='/products'){json(res,200,{products:approvedProducts(d)});return true}
  if(req.method==='GET'&&path==='/my/products'){
   const u=requireUser(req);if(!u.organization_id)fail(403,'Только для производителей');
   const rows=d.prepare('SELECT p.*,o.name AS brand FROM products p JOIN organizations o ON o.id=p.organization_id WHERE p.organization_id=? ORDER BY p.created_at DESC LIMIT 300').all(u.organization_id);
   json(res,200,{products:rows.map(productView)});return true;
  }
  if(req.method==='POST'&&path==='/products'){
   checkMutation(req);limit(req,'product',180);const u=requireManufacturer(req),p=await body(req);
   const cats=['Фасад','Кровля','Цоколь','Окна','Софиты'];
   if(!okText(p.name,110)||!okText(p.sku,60)||!cats.includes(p.category))fail(400,'Проверьте название, артикул и категорию');
   const price=(p.price===''||p.price===null||p.price===undefined)?null:Number(p.price);
   if(price!==null&&(!Number.isFinite(price)||price<0||price>1e8))fail(400,'Неверная цена');
   const units=['м²','шт.','пог. м','комплект'];
   if(!units.includes(p.unit))fail(400,'Неверная единица измерения');
   if(!/^#[0-9a-f]{6}$/i.test(p.color||''))fail(400,'Неверный цвет');
   const id=randomUUID();
   try{d.prepare('INSERT INTO products(id,organization_id,category,name,sku,price,unit,color,image_data,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)').run(id,u.organization_id,p.category,p.name.trim(),p.sku.trim(),price,p.unit,p.color,allowedImage(p.image),new Date().toISOString())}catch(e){if(String(e.message).includes('UNIQUE'))fail(409,'Такой артикул у вашей компании уже есть');throw e}
   const row=d.prepare('SELECT p.*,o.name AS brand FROM products p JOIN organizations o ON o.id=p.organization_id WHERE p.id=?').get(id);
   json(res,201,{product:productView(row)});return true;
  }
  const del=path.match(/^\/products\/([0-9a-f-]{36})$/);
  if(req.method==='DELETE'&&del){
   checkMutation(req);const u=requireManufacturer(req);
   const result=d.prepare('DELETE FROM products WHERE id=? AND organization_id=?').run(del[1],u.organization_id);
   if(!result.changes)fail(404,'Материал не найден в вашем каталоге');
   json(res,200,{success:true});return true;
  }
  if(req.method==='GET'&&path==='/projects'){
   const u=requireUser(req);if(u.role!=='customer')fail(403,'Только для клиентов');
   const rows=d.prepare('SELECT id,name,photo_data,selected_ids,created_at FROM projects WHERE user_id=? ORDER BY created_at DESC LIMIT 30').all(u.id);
   json(res,200,{projects:rows.map(x=>({id:x.id,name:x.name,photo:x.photo_data,selectedIds:JSON.parse(x.selected_ids),createdAt:x.created_at}))});return true;
  }
  if(req.method==='POST'&&path==='/projects'){
   checkMutation(req);limit(req,'projects',90);const u=requireUser(req);
   if(u.role!=='customer')fail(403,'Только для клиентов');
   const p=await body(req),ids=p.selectedIds;
   if(!okText(p.name,100)||!Array.isArray(ids)||ids.length>30||ids.some(x=>typeof x!=='string'||x.length>80))fail(400,'Неверные данные проекта');
   if(d.prepare('SELECT COUNT(*) AS n FROM projects WHERE user_id=?').get(u.id).n>=30)fail(409,'Достигнут лимит 30 проектов');
   const photo=allowedImage(p.photo);
   const id=randomUUID(),now=new Date().toISOString();
   d.prepare('INSERT INTO projects(id,user_id,name,photo_data,selected_ids,created_at) VALUES(?,?,?,?,?,?)').run(id,u.id,p.name.trim(),photo,JSON.stringify(ids),now);
   json(res,201,{project:{id,name:p.name.trim(),selectedIds:ids,createdAt:now}});return true;
  }
  if(req.method==='POST'&&path==='/admin/approve'){
   checkMutation(req);limit(req,'admin',30);
   const token=req.headers['x-primerka-admin-key'],secret=process.env.PRIMERKA_ADMIN_KEY;
   if(!secret||secret.length<24)fail(503,'Ключ администратора не настроен');
   const left=Buffer.from(String(token||'')),right=Buffer.from(secret);
   if(left.length!==right.length||!timingSafeEqual(left,right))fail(403,'Доступ запрещён');
   const p=await body(req);
   if(typeof p.organizationId!=='string'||typeof p.approved!=='boolean')fail(400,'Укажите организацию и решение');
   const org=d.prepare('SELECT id FROM organizations WHERE id=?').get(p.organizationId);
   if(!org)fail(404,'Организация не найдена');
   const approved=p.approved;
   d.exec('BEGIN IMMEDIATE');
   try{d.prepare('UPDATE organizations SET status=? WHERE id=?').run(approved?'approved':'rejected',p.organizationId);
   d.prepare('UPDATE users SET role=? WHERE organization_id=?').run(approved?'manufacturer_admin':'manufacturer_pending',p.organizationId);d.exec('COMMIT')}catch(e){d.exec('ROLLBACK');throw e}
   json(res,200,{success:true,organizationId:p.organizationId,status:approved?'approved':'rejected'});return true;
  }
  json(res,404,{error:'API не найдено'});return true;
 }catch(e){const status=Number.isInteger(e.status)?e.status:500;if(status===500)console.error('[primerka]',e);json(res,status,{error:status===500?'Ошибка сервера':e.message});return true}
}
