'use strict';
// The user's chosen cultural heritage is descriptive context, not a substitute
// for visually adjustable facial features; no default stereotyped morphology.
function buildPrompt(input={}) {
  const p=input.params||{};
  const str=(value,max=140)=>String(value??'').replace(/[\r\n\0]/g,' ').trim().slice(0,max);
  const num=(value,lo,hi)=>Math.round(Math.max(lo,Math.min(hi,Number(value)||0)));
  const hair={buzz:'very short buzzcut',short:'neat short haircut',parted:'side-parted hairstyle',bob:'bob haircut',long:'long loose hair',curly:'natural curls',bun:'hair in a bun'};
  const teeth={natural:'natural realistic teeth',even:'neatly aligned teeth',gap:'small natural gap between front teeth',uneven:'slightly uneven teeth',aged:'slight enamel discoloration',damaged:'visibly damaged teeth'};
  const background=p.background==='transparent'?'neutral plain studio backdrop for later background removal':'soft warm neutral seamless studio background';
  const pose={front:'full frontal view',quarter:'three-quarter view',side:'side profile'}[p.pose]||'full frontal view';
  const expression={neutral:'neutral composed expression',smile:'natural smile',serious:'serious expression'}[p.expression]||'neutral composed expression';
  const clothes={casual:'simple modern casual clothing',smart:'tailored smart outfit',coat:'elegant overcoat',dress:'contemporary dress',work:'workwear outfit',sport:'technical sportswear'}[p.outfit]||'neutral modern clothing';
  const markNames={scar:'subtle scar',freckles:'freckles',acne:'natural acne blemishes',mole:'mole',wrinkle:'wrinkles',spot:'pigmentation spot'};
  const marks=Array.isArray(input.marks)?input.marks.slice(0,30).map(m=>`${markNames[m.type]||'skin detail'} near (${num(Number(m.x)/600*100,0,100)}%, ${num(Number(m.y)/720*100,0,100)}%) intensity ${num(m.strength,0,100)}%`).join('; '):'';
  const reference=!!input.referenceImage;
  const garment=!!input.clothingImage;
  return [
    'Create a SINGLE photorealistic professional digital-human character photograph for production character reference.',
    'One person only, visible full body with complete head and footwear, natural anatomy, realistic skin pores, textured fabric, professional restrained studio lighting, sharply focused, premium editorial photography.',
    `Appearance request: visual age ${num(p.age,1,100)} years; approximate height ${num(p.height,110,230)} cm; body fullness ${num(p.body,0,100)}/100; muscularity ${num(p.muscle,0,100)}/100.`,
    `Skin-lightness control ${num(p.skin,0,100)}/100 (0=lightest, 100=deepest), undertone ${str(p.undertone,20)}. This setting takes precedence over any cultural labels.`,
    `Facial settings (0..100): face width ${num(p.faceWidth,0,100)}, jaw definition ${num(p.jaw,0,100)}, nose width ${num(p.nose,0,100)}, eye size ${num(p.eyes,0,100)}, lip fullness ${num(p.mouth,0,100)}.`,
    `Hair: ${hair[p.hairStyle]||'natural hairstyle'}, length ${num(p.hairLength,0,100)}/100, density ${num(p.hairDensity,0,100)}/100, gray hair ${num(p.grey,0,100)}%, color ${/^#[0-9a-f]{6}$/i.test(p.hairColor)?p.hairColor:'#3f322d'}.`,
    `Teeth: ${teeth[p.teeth]||teeth.natural}; smile strength ${num(p.smile,0,100)}/100; expression ${expression}.`,
    `Camera: ${pose}. Clothing: ${clothes}. Background: ${background}.`,
    p.origin&&p.origin!=='Не указано'?`Self-described cultural/national background: ${str(p.origin,100)}. Do not stereotype physical appearance based on it.`:'',
    p.originNote?`Additional self-described background: ${str(p.originNote,150)}.`:'',
    reference?'Use the first supplied image as the primary identity reference. Preserve the same recognizable individual and distinctive facial features. Only make explicitly requested adjustments; avoid replacing the person with a new random face.':'Create a wholly original fictional person.',
    garment?'Use the additional garment photo to dress this same character. Preserve garment material, shape, colors, trims and any visible pattern as closely as possible.':'',
    marks?`Local skin details requested from the editor (positions are approximate in the normalized figure): ${marks}. Keep them natural and not exaggerated.`:'',
    input.instruction?`USER-REQUESTED REFINEMENT: ${str(input.instruction,450)}.`:'',
    'No watermarks, no text, no logos, no collages, no duplicated limbs. Keep consistent identity within the result.',
  ].filter(Boolean).join('\n');
}
module.exports={buildPrompt};
