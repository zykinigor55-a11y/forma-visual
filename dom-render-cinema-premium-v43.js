/* ДОМ.РЕНДЕР · Cinema premium profiles v43. Physical equipment is a VISUAL reference, not actual camera capture. */
(function(){
'use strict';
const api=window.DOM_RENDER_ANIMATION;
if(!api)return;
const lookup=(items,id)=>items.find(x=>x.id===id)||items[0];
const c=api.cameras, l=api.lenses, m=api.moves, g=api.grades;
const camera=[
 {...lookup(c,'alexa35'),name:'ARRI ALEXA 35',tag:'SUPER 35',desc:'Точные полутона и мягкие света'},
 {...lookup(c,'alexamini'),name:'ARRI ALEXA Mini LF',tag:'LARGE FORMAT',desc:'Кинематографичный объём пространства'},
 {...lookup(c,'venice2'),name:'Sony VENICE 2',tag:'8.6K FULL FRAME',desc:'Чистая глубина и точная передача цвета'},
 {...lookup(c,'vraptor'),name:'RED V-RAPTOR [X]',tag:'8K VISTA VISION',desc:'Высокая детализация архитектуры'},
 {...lookup(c,'komodox'),name:'Canon EOS C400',tag:'6K FULL FRAME',desc:'Естественный свет и достоверные фактуры',prompt:'Canon EOS C400 inspired full-frame cinema colors, clean architectural detail, realistic skin of materials, restrained tonal contrast and softly rolled highlights. Do not change architectural geometry.'},
 {...lookup(c,'ursa'),name:'Blackmagic URSA Cine 12K LF',tag:'LARGE FORMAT',desc:'Широкий диапазон света и микрофактура'}
];
const lensNames=[
 ['ultra14','18 мм','ULTRA WIDE','Общий план дома и окружения',18],
 ['shift24','25 мм','WIDE','Выразительная архитектурная перспектива',25],
 ['cine35','35 мм','NATURAL WIDE','Универсальный план фасада',35],
 ['cine50','47 мм','NORMAL','Нейтральное кадрирование',47],
 ['portrait85','75 мм','PORTRAIT','Спокойное выделение фасада',75],
 ['macro100','95 мм','TELE','Детали и умеренная компрессия',95]
];
const lens=lensNames.map(([id,name,tag,desc,mm])=>({
 ...lookup(l,String(id)),name:String(name),tag:String(tag),desc:String(desc),
 prompt:'ARRI Signature Prime '+name+' cinema prime look, precise natural rectilinear rendering at '+mm+'mm on a large-format sensor. Keep existing windows, roof and all facade contours fixed. Professional smooth focus and soft highlights without inventing material detail.'
}));
const moves=[
 {...lookup(m,'orbit'),name:'Orbit',tag:'Облёт по дуге',desc:'Мягкая дуга вокруг дома'},
 {...lookup(m,'dolly'),name:'Dolly In',tag:'Плавный наезд',desc:'Постепенное приближение'},
 {...lookup(m,'drone'),name:'Dolly Out',tag:'Плавный отъезд',desc:'Раскрытие дома и окружения',prompt:'Smooth slow physical dolly-out from the building, revealing only already visible exterior context; consistent building massing, no newly invented sides or facade openings.',preview:'dolly'},
 {...lookup(m,'slider'),name:'Truck',tag:'Проезд вбок',desc:'Параллельно фасаду'},
 {...lookup(m,'crane'),name:'Crane Up',tag:'Вертикальный подъём',desc:'Плавное раскрытие кровли'},
 {...lookup(m,'walk'),name:'Fly-by',tag:'Диагональный пролёт',desc:'Кинематографичная траектория',prompt:'One continuous smooth diagonal fly-by across the supplied house view, with subtly changing viewpoint and gentle parallax only where geometry is already visually supported. No invented hidden walls, roofs or windows.',preview:'walk'}
];
const grades=[
 {id:'neutral',name:'Clean',tag:'Нейтральный',desc:'Чистая оптика без эффекта',prompt:'Clean optical glass; no diffusion, no stylized flare, physically plausible contrast and true-to-reference neutral material colors.'},
 {id:'filmic',name:'Black Pro-Mist 1/8',tag:'Soft Highlights',desc:'Лёгкое свечение в бликах',prompt:'Subtle Tiffen Black Pro-Mist 1/8 inspired optical diffusion, mild halation ONLY around existing bright light sources. Preserve sharp building geometry, realistic contrast and authentic surface materials.'},
 {id:'contrast',name:'Glimmerglass 1/4',tag:'Gentle Glow',desc:'Мягкий свет и полутон',prompt:'Light Glimmerglass 1/4 inspired gentle optical diffusion in specular highlights, fine controlled glow and mild reduction of digital harshness; sharp vertical architectural lines remain unchanged.'},
 {id:'warm',name:'CPL',tag:'Polarizer',desc:'Контроль отражений на стекле',prompt:'Circular polarizer inspired natural reduction of glare in appropriate outdoor reflections, balanced blue sky and believable real-world window reflection. Never erase glazing or alter facade openings.'},
 {id:'cool',name:'ND 0.9',tag:'3 Stops',desc:'Нейтральное затемнение',prompt:'Neutral density ND 0.9 inspired optical exposure reduction with naturally controlled highlights, no false color cast and no blocked architectural shadows.'},
 {id:'bw',name:'Blue Streak',tag:'Anamorphic',desc:'Тонкий горизонтальный блик',prompt:'Subtle blue streak anamorphic-inspired flare only when existing visible bright lights warrant it. Very restrained and never add invented lights, neon or structural elements.'}
];
c.splice(0,c.length,...camera);
l.splice(0,l.length,...lens);
m.splice(0,m.length,...moves);
g.splice(0,g.length,...grades);
api.defaults.lens='cine35';
api.defaults.motion='orbit';
api.version='43';
const panel=document.getElementById('animationPanel');
if(panel){
 const info=[
  ['animCameras','6 профессиональных кинокамер'],
  ['animLenses','6 кинообъективов ARRI Signature Prime'],
  ['animMoves','6 режиссёрских движений'],
  ['animGrades','6 настоящих типов оптических фильтров']
 ];
 for(const [id,label] of info){const sec=document.getElementById(id)?.closest('.anim-section');const summary=sec?.querySelector('.anim-section-title small');if(summary)summary.textContent=label;}
 const section=document.getElementById('animGrades')?.closest('.anim-section');
 const header=section?.querySelector('.anim-section-title strong');
 if(header)header.textContent='Оптические фильтры';
 const top=panel.querySelector('.anim-hero p');
 if(top)top.textContent='Реальные кинокамеры, оптика, движения и фильтры для профессиональной архитектурной анимации.';
}
})();