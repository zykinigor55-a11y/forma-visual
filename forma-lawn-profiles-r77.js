/* R77: four distinct turf preview profiles, dimensions in metres. */
export const LAWN_PROFILES=Object.freeze({
 formal:{name:'Партерный',description:'Плотный, тонколистный, низкая стрижка 2–4 см',height:.032,variation:.22,width:.0014,lean:.20,density:1.65,tile:1.05,palette:['#53683e','#60794a','#6b8051','#4b6239'],patch:.07},
 universal:{name:'Универсальный',description:'Обычный садовый газон, 4–7 см',height:.055,variation:.35,width:.0024,lean:.30,density:1.15,tile:1.05,palette:['#626e43','#778254','#81905f','#4f613b'],patch:.18},
 shade:{name:'Теневой',description:'Более широкая и мягкая трава, 6–10 см',height:.082,variation:.31,width:.0035,lean:.38,density:.92,tile:1.25,palette:['#52664b','#647652','#76865d','#43593c'],patch:.25},
 meadow:{name:'Луговой',description:'Разнотравье, неоднородные пучки 10–22 см',height:.16,variation:.55,width:.0028,lean:.48,density:.75,tile:1.5,palette:['#717d4c','#84905f','#a0a076','#586d42'],patch:.39}
});
export function lawnBlade(profile,x,z,r,hRandom){
 const field=.5+.5*Math.sin(x*1.75+Math.sin(z*1.07))*Math.cos(z*1.21+Math.sin(x*.63));
 return {height:profile.height*(1+(hRandom-.5)*2*profile.variation)*(1-profile.patch+profile.patch*field),width:profile.width*(.65+.70*r),lean:profile.height*profile.lean*(.45+.8*r)};
}
