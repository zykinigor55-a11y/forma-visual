/* R89: ten distinct turf preview profiles, dimensions in metres. */
export const LAWN_PROFILES=Object.freeze({
 formal:{name:'Партерный',description:'Плотный, тонколистный, низкая стрижка 2–4 см',height:.032,variation:.22,width:.0014,lean:.20,density:1.65,tile:1.05,palette:['#53683e','#60794a','#6b8051','#4b6239'],patch:.07},
 universal:{name:'Универсальный',description:'Обычный садовый газон, 4–7 см',height:.055,variation:.35,width:.0024,lean:.30,density:1.15,tile:1.05,palette:['#626e43','#778254','#81905f','#4f613b'],patch:.18},
 shade:{name:'Теневой',description:'Более широкая и мягкая трава, 6–10 см',height:.082,variation:.31,width:.0035,lean:.38,density:.92,tile:1.25,palette:['#52664b','#647652','#76865d','#43593c'],patch:.25},
 meadow:{name:'Луговой',description:'Разнотравье, неоднородные пучки 10–22 см',height:.16,variation:.55,width:.0028,lean:.48,density:.75,tile:1.5,palette:['#717d4c','#84905f','#a0a076','#586d42'],patch:.39},
 striped:{name:'Полосы от косилки',description:'Стриженый газон 3–5 см, чередование направления укладки',height:.044,variation:.18,width:.0022,lean:.46,density:1.45,tile:1.05,palette:['#526b43','#627b4d','#708657','#4c633e'],patch:.08,photo:'formal',stripes:1.25},
 forest:{name:'Лесной',description:'Травы, осоки и широколистные растения, 5–25 см',height:.105,variation:.66,width:.0032,lean:.53,density:.82,tile:1.5,palette:['#4c6544','#697c4d','#778658','#40563b'],patch:.48,photo:'shade',herbs:'forest'},
 clover:{name:'С клевером',description:'Тройчатые листья и белые соцветия клевера, 4–12 см',height:.060,variation:.44,width:.0024,lean:.33,density:1.05,tile:1.05,palette:['#4c7044','#648253','#718b59','#405d3e'],patch:.25,photo:'universal',herbs:'clover'},
 wheat:{name:'Поле сухих колосьев',description:'Золотистые зрелые злаки, 55–95 см, сухие стебли и ости',height:.76,variation:.25,width:.006,lean:.25,density:1,tile:1.2,palette:['#a68b55','#c0a36b','#988050','#d1b781'],patch:.20,photo:'meadow',crop:true},
 dandelion:{name:'С жёлтыми одуванчиками',description:'Газон с жёлтыми цветами и зубчатыми листьями одуванчика',height:.065,variation:.40,width:.0024,lean:.33,density:1.10,tile:1.05,palette:['#526b43','#647b4d','#718558','#435e3b'],patch:.24,photo:'universal',flowers:'yellow'},
 dandelionPuff:{name:'С пушистыми одуванчиками',description:'Газон с белыми семенными головками и тонкими парашютиками',height:.065,variation:.40,width:.0024,lean:.33,density:1.10,tile:1.05,palette:['#526b43','#647b4d','#718558','#435e3b'],patch:.24,photo:'universal',flowers:'puff'}
});
export function lawnBlade(profile,x,z,r,hRandom){
 const field=.5+.5*Math.sin(x*1.75+Math.sin(z*1.07))*Math.cos(z*1.21+Math.sin(x*.63));
 return {height:profile.height*(1+(hRandom-.5)*2*profile.variation)*(1-profile.patch+profile.patch*field),width:profile.width*(.65+.70*r),lean:profile.height*profile.lean*(.45+.8*r)};
}
