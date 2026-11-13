/* ДОМ.ПРИМЕРКА · server-connected staging UI, no production auth promises */
(function() {
'use strict';
const API='/api/primerka';
const $=id=>document.getElementById(id);
const localKey='dom-primerka-selection-v2';
let user=null,online=false,products=[],mine=[],selected=[],photo='',filter='Все',projects=[];
const cats=['Все','Фасад','Кровля','Цоколь','Окна','Софиты'];
const samples=[
 {id:'demo-a',brand:'Демо-каталог',category:'Фасад',name:'Терракотовый кирпич',sku:'DEMO-01',color:'#b87657',demo:true},
 {id:'demo-b',brand:'Демо-каталог',category:'Фасад',name:'Светлая штукатурка',sku:'DEMO-02',color:'#d7d0bb',demo:true},
 {id:'demo-c',brand:'Демо-каталог',category:'Кровля',name:'Графитовая кровля',sku:'DEMO-03',color:'#404949',demo:true},
 {id:'demo-d',brand:'Демо-каталог',category:'Цоколь',name:'Темный камень',sku:'DEMO-04',color:'#625b55',demo:true}
];
let timer;
const el=(tag,text,klass)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=String(text);if(klass)x.className=klass;return x};
function notify(text){const t=$('toast');t.textContent=text;t.hidden=false;clearTimeout(timer);timer=setTimeout(()=>t.hidden=true,4000)}
function route(){let target=location.hash.slice(1);if(!['home','customer','supplier'].includes(target))target='home';
 document.querySelectorAll('[data-page]').forEach(x=>x.hidden=x.dataset.page!==target);
 document.querySelectorAll('[data-nav]').forEach(x=>x.classList.toggle('on',x.dataset.nav===target));
 window.scrollTo(0,0);renderGate()}
function remember(){try{localStorage.setItem(localKey,JSON.stringify({selected,photo}))}catch{notify('Нет места в памяти браузера для фотографии')}}
try{const x=JSON.parse(localStorage.getItem(localKey)||'null');if(x){selected=Array.isArray(x.selected)?x.selected.filter(y=>typeof y==='string').slice(0,30):[];photo=typeof x.photo==='string'&&x.photo.startsWith('data:image/')?x.photo:''}}catch{}
const css=el('style');
css.textContent='.accountbtn{border:1px solid #cbd7ca;background:white;color:#1d3e2c;border-radius:10px;padding:9px 12px;font-weight:700;font-size:12px;cursor:pointer}.statusbar{font-size:12px;color:#4c6955;display:flex;align-items:center;gap:9px}.statusbar b{max-width:170px;display:inline-block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.authshade{position:fixed;inset:0;z-index:100;background:#15291c99;display:none;align-items:center;justify-content:center;padding:16px}.authshade.show{display:flex}.authbox{background:white;border-radius:20px;padding:27px;max-width:440px;width:100%;max-height:95vh;overflow-y:auto;box-shadow:0 24px 90px #0d1e1250}.authbox h2{margin:8px 0 10px}.authbox p{font-size:12px;color:#617167}.authbox .field{margin-top:13px}.authswitch{display:flex;gap:8px;margin:16px 0}.authswitch button{flex:1;padding:10px;border-radius:10px;border:1px solid #d3dfd3;background:#fff}.authswitch button.active{background:#315b42;color:white}.authactions{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:18px}.authbox input{font-size:14px}.workspace .gate{margin:0 0 18px;padding:18px;background:#f1f5ee;border:1px solid #ccdfd0;border-radius:14px;color:#355946;font-size:13px}.workspace .gate[hidden]{display:none}.history{margin-top:17px}.history-item{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #e5e9e2;padding:13px 0}.history-item strong{display:block;font-size:12px}.history-item small{display:block;color:#789087;margin-top:5px}.auth-unavailable{background:#fff5e7;color:#805c36;border-radius:12px;padding:14px;margin-top:15px;font-size:12px}body.is-guest #materialForm,body.is-guest #supplierList,body.is-guest #csvButton{display:none}body.is-pending #materialForm,body.is-pending #supplierList,body.is-pending #csvButton{display:none}body.is-customer #materialForm,body.is-customer #supplierList,body.is-customer #csvButton{display:none}@media(max-width:680px){.accountbtn{padding:8px 9px}.statusbar b{max-width:95px}}';
document.head.append(css);
const nav=document.querySelector('header .wrap');
const account=el('button','Войти','accountbtn');account.type='button';account.onclick=()=>showAuth('login');nav.append(account);
const accountStatus=el('span',undefined,'statusbar');account.after(accountStatus);
const shade=el('div',undefined,'authshade');shade.id='authShade';shade.setAttribute('role','dialog');shade.setAttribute('aria-modal','true');shade.setAttribute('aria-label','Вход или регистрация');
shade.innerHTML='<div class="authbox"><div class="between"><h2 id="authTitle">Вход</h2><button type="button" class="accountbtn" id="closeAuth" aria-label="Закрыть">✕</button></div><p>Тестовый кабинет. Настоящая почтовая проверка ещё не подключена — используйте только тестовые данные.</p><div class="authswitch"><button type="button" id="loginTab" class="active">Войти</button><button type="button" id="signupTab">Регистрация</button></div><form id="authForm"><label class="field">Email<input name="email" type="email" autocomplete="email" required maxlength="254"></label><label class="field">Пароль — от 12 символов<input name="password" type="password" autocomplete="current-password" required minlength="12" maxlength="128"></label><div id="signupFields" hidden><label class="field">Я регистрируюсь как<select name="role" id="newRole"><option value="customer">Частный клиент</option><option value="manufacturer">Производитель</option></select></label><label class="field" id="companyField" hidden>Название компании<input name="companyName" maxlength="110" id="newCompany" placeholder="Наименование организации"></label></div><div class="authactions"><button type="submit" id="authSubmit" class="button">Войти</button><small id="authError" style="color:#9f4233"></small></div></form></div>';
document.body.append(shade);
let authMode='login';
function showAuth(mode){if(!online){notify('Сервер авторизации не включён');return}changeAuth(mode);shade.classList.add('show');shade.querySelector('input[name=email]').focus()}
function changeAuth(mode){authMode=mode;const signup=mode==='signup';$('authTitle').textContent=signup?'Создать аккаунт':'Войти в кабинет';$('signupFields').hidden=!signup;$('authSubmit').textContent=signup?'Зарегистрироваться':'Войти';$('loginTab').className=signup?'':'active';$('signupTab').className=signup?'active':'';$('authError').textContent='';shade.querySelector('input[name=password]').autocomplete=signup?'new-password':'current-password'}
$('loginTab').onclick=()=>changeAuth('login');$('signupTab').onclick=()=>changeAuth('signup');$('closeAuth').onclick=()=>shade.classList.remove('show');
shade.addEventListener('click',e=>{if(e.target===shade)shade.classList.remove('show')});document.addEventListener('keydown',e=>{if(e.key==='Escape')shade.classList.remove('show')});
$('newRole').onchange=()=>{$('companyField').hidden=$('newRole').value!=='manufacturer';$('newCompany').required=$('newRole').value==='manufacturer'};
async function request(path,method='GET',data=null){
 const options={method,credentials:'same-origin',headers:{'Accept':'application/json'}};
 if(data!==null){options.headers['Content-Type']='application/json';options.body=JSON.stringify(data)}
 let res;try{res=await fetch(API+path,options)}catch{throw Error('Нет связи с сервером ДОМ.ПРИМЕРКА')}
 let payload;try{payload=await res.json()}catch{throw Error('Некорректный ответ сервера')}
 if(!res.ok)throw Error(payload.error||'Ошибка запроса');
 return payload;
}
function toggleAccount(){account.textContent=user?'Выйти':'Войти';account.onclick=user?async()=>{try{await request('/logout','POST',{});user=null;mine=[];projects=[];renderAll();notify('Вы вышли')}catch(e){notify(e.message)}}:()=>showAuth('login');accountStatus.replaceChildren();if(user){const text=el('b',user.email);accountStatus.append(text)}}
$('authForm').onsubmit=async e=>{
 e.preventDefault();const form=e.target,fd=new FormData(form),data={email:String(fd.get('email')).trim(),password:String(fd.get('password'))};
 if(authMode==='signup'){data.role=fd.get('role');if(data.role==='manufacturer')data.companyName=String(fd.get('companyName')).trim()}
 $('authSubmit').disabled=true;$('authError').textContent='';
 try{const result=await request(authMode==='signup'?'/signup':'/login','POST',data);user=result.user;shade.classList.remove('show');form.reset();await reloadData();notify(result.message||'Вход выполнен');if(user.role==='manufacturer_pending'||user.role==='manufacturer_admin')location.hash='#supplier';else location.hash='#customer'}
 catch(err){$('authError').textContent=err.message}finally{$('authSubmit').disabled=false}
};
function paint(p){const a=el('span',undefined,'swatch');a.style.setProperty('--c',/^#[0-9a-f]{6}$/i.test(p.color||'')?p.color:'#b6af9f');if(p.image&&p.image.startsWith('data:image/')){const i=el('img');i.src=p.image;i.alt='Текстура '+p.name;a.append(i)}return a}
function price(p){return p.price!==null&&p.price!==undefined&&p.price!==''&&Number.isFinite(Number(p.price))?Number(p.price).toLocaleString('ru-RU')+' ₽ / '+p.unit:'Цена по запросу'}
function available(){return samples.concat(products)}
function renderFilters(){const box=$('filters');box.replaceChildren();cats.forEach(c=>{const b=el('button',c,'tab'+(c===filter?' current':''));b.type='button';b.onclick=()=>{filter=c;renderFilters();renderCatalog()};box.append(b)})}
function renderCatalog(){const box=$('customerList');box.replaceChildren();const list=available().filter(p=>filter==='Все'||p.category===filter);if(!list.length){box.append(el('div','В этой категории пока нет товаров.','empty'));return}list.forEach(p=>{const yes=selected.includes(p.id),b=el('button',undefined,'item'+(yes?' chosen':''));b.type='button';b.setAttribute('aria-pressed',yes?'true':'false');b.append(paint(p));const info=el('span',undefined,'detail');info.append(el('strong',p.name),el('small',p.brand+' · '+p.category+' · '+p.sku),el('small',p.demo?'Демо — пример, не товар':price(p)));b.append(info,el('span',yes?'✓':'＋'));b.onclick=()=>{selected=yes?selected.filter(x=>x!==p.id):selected.concat(p.id);remember();renderCatalog();renderSelection()};box.append(b)})}
function renderSelection(){const box=$('chosenList');box.replaceChildren();const chosen=available().filter(p=>selected.includes(p.id));$('nSelected').textContent=chosen.length+' выбрано';box.className=chosen.length?'':'empty';if(!chosen.length){box.textContent='Выберите материалы справа.';return}chosen.forEach(p=>{const row=el('div',undefined,'item');row.append(paint(p));const text=el('span',undefined,'detail');text.append(el('strong',p.name),el('small',p.brand+' · '+p.sku));row.append(text);box.append(row)})}
function renderPhoto(){const box=$('preview');box.replaceChildren();if(photo){const image=el('img');image.src=photo;image.alt='Загруженное фото дома';box.append(image);$('photoStatus').textContent='Фото загружено'}else{box.append(el('span','Здесь появится фото вашего дома'));$('photoStatus').textContent='Нет фотографии'}}
function renderSupplier(){const box=$('supplierList');box.replaceChildren();$('nSupplier').textContent=mine.length+' позиций';box.className=mine.length?'catalog-grid':'empty';if(!mine.length){box.textContent='Здесь появятся ваши материалы после добавления.';return}mine.forEach(p=>{const c=el('article',undefined,'catalog-card');c.append(paint(p),el('strong',p.name),el('small',p.brand+' · '+p.sku),el('small',price(p)));const b=el('button','Удалить');b.type='button';b.onclick=async()=>{if(!confirm('Удалить материал из своего каталога?'))return;try{await request('/products/'+encodeURIComponent(p.id),'DELETE');await reloadData();notify('Материал удалён')}catch(e){notify(e.message)}};c.append(b);box.append(c)})}
function renderGate(){const supplierPage=document.querySelector('[data-page=supplier]'),main=supplierPage.querySelector('.columns');const companyInput=document.querySelector('#materialForm input[name=brand]');if(companyInput){companyInput.value=user?.company||'';companyInput.readOnly=!!user?.company;}let gate=$('supplierGate');if(!gate){gate=el('div',undefined,'gate');gate.id='supplierGate';main.before(gate)}
 const approved=online&&user&&user.role==='manufacturer_admin'&&user.companyStatus==='approved';
 document.body.classList.toggle('is-guest',!user||!online);document.body.classList.toggle('is-pending',!!user&&user.role==='manufacturer_pending');document.body.classList.toggle('is-customer',!!user&&user.role==='customer');
 if(!online)gate.textContent='Серверная часть отключена. Включите тестовый API, чтобы загружать каталоги компаний.';
 else if(!user)gate.textContent='Зарегистрируйтесь как производитель, чтобы создать личный каталог. Подтверждение компании обязательно.';
 else if(user.role==='customer')gate.textContent='Это профессиональный раздел. Для теста нужен отдельный аккаунт производителя.';
 else if(!approved)gate.textContent='Компания «'+(user.company||'')+'» ожидает подтверждения администратором. Публикация материалов пока недоступна.';
 gate.hidden=!!approved;main.hidden=!approved;
 const hint=$('customerHint')||el('div',undefined,'gate');if(!hint.id){hint.id='customerHint';document.querySelector('[data-page=customer] .columns').before(hint)}
 hint.hidden=!!user;hint.textContent=online?'Каталог можно просматривать без регистрации. Чтобы сохранить проект в личном кабинете, войдите или создайте аккаунт.':'Серверная версия отключена. Пока можно просматривать демонстрационные позиции и фото только в браузере.';
}
function renderHistory(){let box=$('projectHistory');if(!box){box=el('div',undefined,'box history');box.id='projectHistory';document.querySelector('[data-page=customer] .stack').append(box)}box.replaceChildren();box.append(el('h2','Мои сохранённые проекты'));if(!user||user.role!=='customer'){box.append(el('p','После входа в аккаунт здесь будут ваши проекты.','tiny'));return}if(!projects.length){box.append(el('p','Пока нет сохранённых проектов.','tiny'));return}
 projects.forEach(p=>{const row=el('div',undefined,'history-item');const info=el('div');info.append(el('strong',p.name),el('small',new Date(p.createdAt).toLocaleString('ru-RU')+' · '+p.selectedIds.length+' материалов'));const b=el('button','Открыть','accountbtn');b.type='button';b.onclick=()=>{selected=p.selectedIds.filter(id=>available().some(x=>x.id===id));photo=p.photo||'';remember();renderPhoto();renderSelection();renderCatalog();notify('Проект открыт')};row.append(info,b);box.append(row)})}
function renderAll(){toggleAccount();renderFilters();renderCatalog();renderSelection();renderPhoto();renderSupplier();renderHistory();renderGate()}
async function reloadData(){if(!online){renderAll();return}
 const publicResult=await request('/products');products=publicResult.products||[];
 if(user&&user.organizationId){const own=await request('/my/products');mine=own.products||[]}else mine=[];
 if(user&&user.role==='customer'){const results=await request('/projects');projects=results.projects||[]}else projects=[];
 renderAll();
}
function validFile(f,max){if(!f)return false;if(!['image/jpeg','image/png','image/webp'].includes(f.type)){notify('Только JPG, PNG и WebP');return false}if(f.size>max*1048576){notify('Максимум '+max+' МБ');return false}return true}
function thumb(f,done){const i=new Image(),url=URL.createObjectURL(f);i.onload=()=>{try{let max=1100;const c=document.createElement('canvas'),scale=Math.min(1,max/Math.max(i.width,i.height));c.width=Math.max(1,Math.floor(i.width*scale));c.height=Math.max(1,Math.floor(i.height*scale));const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(i,0,0,c.width,c.height);let out=c.toDataURL('image/jpeg',.66);if(out.length>420000){c.width=Math.max(1,Math.floor(c.width*.68));c.height=Math.max(1,Math.floor(c.height*.68));ctx.drawImage(i,0,0,c.width,c.height);out=c.toDataURL('image/jpeg',.60)}if(out.length>420000)throw Error('Фото слишком подробно для тестового хранения — уменьшите файл');done(null,out)}catch(e){done(e)}finally{URL.revokeObjectURL(url)}};i.onerror=()=>{URL.revokeObjectURL(url);done(Error('Не удалось прочитать фото'))};i.src=url}
$('photo').onchange=e=>{const f=e.target.files?.[0];if(!validFile(f,8))return;thumb(f,(err,data)=>{if(err)return notify(err.message);photo=data;remember();renderPhoto();notify('Фото подготовлено')});e.target.value=''};
$('saveSelection').onclick=async()=>{if(!user){showAuth('signup');return}if(user.role!=='customer'){notify('Проекты доступны в кабинете клиента');return}if(!photo&&!selected.length){notify('Загрузите фотографию или выберите материал');return}
 const name='Мой дом · '+new Date().toLocaleDateString('ru-RU'),ids=selected.filter(x=>!x.startsWith('demo-'));
 try{await request('/projects','POST',{name,photo,selectedIds:ids});await reloadData();notify('Проект сохранён в вашем кабинете')}catch(e){notify(e.message)}};
$('clearSelection').onclick=()=>{if(!confirm('Очистить текущие фото и материалы?'))return;photo='';selected=[];remember();renderPhoto();renderSelection();renderCatalog()};
$('materialForm').onsubmit=async e=>{e.preventDefault();if(!user||user.role!=='manufacturer_admin'){notify('Дождитесь подтверждения компании');return}
 const form=e.target,values=new FormData(form),file=form.elements.image.files[0];
 if(file&&!validFile(file,3))return;
 const p={name:String(values.get('name')||'').trim(),sku:String(values.get('sku')||'').trim(),category:String(values.get('category')),unit:String(values.get('unit')),color:String(values.get('color')),price:String(values.get('price')||'')};
 const submit=async()=>{const button=form.querySelector('button[type=submit]');button.disabled=true;try{await request('/products','POST',p);form.reset();await reloadData();notify('Материал опубликован в общем каталоге')}catch(e){notify(e.message)}finally{button.disabled=false}};
 if(file)thumb(file,(err,image)=>{if(err)notify(err.message);else{p.image=image;submit()}});else submit()};
$('csvButton').onclick=()=>{if(!mine.length){notify('Каталог пока пуст');return}const escape=v=>'"'+String(v??'').replaceAll('"','""')+'"';const rows=[['Компания','Категория','Название','Артикул','Цена','Единица']];mine.forEach(p=>rows.push([p.brand,p.category,p.name,p.sku,p.price,p.unit]));const csv='\uFEFF'+rows.map(r=>r.map(escape).join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=el('a');a.href=url;a.download='dom-primerka-catalog.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),500)};
async function init(){try{const status=await request('/status');online=true;user=status.user;await reloadData()}catch(e){online=false;renderAll();const note=el('div','Серверный тестовый режим выключен. Для регистрации и общего каталога нужен PRIMERKA_STAGING_ENABLED=true.','auth-unavailable');document.querySelector('[data-page=home] .hero .cta').after(note)}}
window.addEventListener('hashchange',route);route();init();
})();
