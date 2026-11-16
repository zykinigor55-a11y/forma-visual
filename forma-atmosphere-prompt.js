import {ATMOSPHERE_SCENARIOS} from './forma-atmosphere-scenes.js';
export function authoredAtmospherePrompt(a,vegetation,{preserveScene=true}={}){
 const s=ATMOSPHERE_SCENARIOS.find(v=>v.id===a.scenario)||ATMOSPHERE_SCENARIOS[0];
 const seasons={summer:'Growing-season deciduous foliage, species-appropriate green leaves and existing evergreen plants.',autumn:'Convert the existing vegetation to a natural autumn season: amber/rust leaves, plausible leaf litter on existing ground and intact evergreens. Keep planting positions and ground geometry.',winter:'Convert to a credible winter: bare deciduous twigs, conifers retaining needles, believable snow/frost on pre-existing surfaces without changing their shapes.',preserve:'Retain the existing vegetation season while changing light to blue hour.'};
 const disabled=a.vegetation==='none'||a.foreground===0;
 const plants=disabled?'Do not add any new plants. Reconstruct existing bark, foliage, shrubs and grass photo-realistically while keeping all their original roots and silhouettes.':
 `BOTANICAL SPECIES: ${vegetation.prompt}
FRONT-TO-BACK COMPOSITION: A physical, photographically realistic first spatial layer must be visible, NOT only a green-tinted image or a leafy graphic border. Detect existing foreground trunks and shrubs first. If found, keep their base, location, silhouette and depth ordering; re-render them with true bark fissures, age variation, knots, branch taper, fine twigs, individual season-accurate leaves and needles. If a different species was explicitly selected, reinterpret that same anchored tree as that species without moving its trunk base or changing the site layout.
TRUNK AMOUNT ${a.trunks}/100: if absent, introduce one mature, clearly readable near-lens tree trunk along one side of the frame, with its long vertical section visible and naturally clipped branches. The trunk may exit top and bottom of image and must read as a three-dimensional rooted tree rather than hanging foliage. Use an asymmetric layout; never add mirrored trees.
SHRUB AMOUNT ${a.shrubs}/100: one or two naturally irregular, dimensional near-camera shrubs may enter from bottom-left or bottom-right if there is ground or planting available. Reconstruct pre-existing shrubs in place first. Resolve twig anatomy, individual leaves, branch gaps and variable foliage density. No uniform hedge spheres.
FOREGROUND DENSITY ${a.foreground}/70: let near foliage and shrubs occupy only peripheral image areas; house remains the main subject and doorways, roof, main windows stay legible.
GROUND CONTACT ${a.grounding}/100: roots and stems must connect to physically visible soil with matching camera perspective, scale, contact shadows, diffuse ground light and same sunlight direction. If soil is outside frame, let the trunk/plant continue naturally beyond image edge, never float above paving or grow on roofs. Accurate occlusion between near foliage, architecture and distance. Rebuild full volumetric plants rather than preserving flat PNG cutouts.`;
 return `ART-DIRECTED ARCHITECTURAL PHOTOGRAPH — SCENARIO ${s.name}, ONE COMPLETED IMAGE.
SOURCE LOCK: Keep EXACT approved architectural geometry, roof, all openings, walls, materials, site layout, existing planting anchors, furniture and original camera position, perspective, field of view and framing. No crop, zoom, different viewpoint or redesigned house.
SEASON: ${seasons[s.season]} DAYPART: ${s.daypart}. These are the user's explicit selected changes and can differ from the original image; keep the original geographic setting. ${preserveScene?'Preserve other site and climate cues.':'Respect any explicit scene weather and sun direction where supplied.'}
LIGHT: ${s.light}
EXPOSURE: ${s.exposure}
COMPOSITION: ${s.composition}
LENS: ${s.optics}
${plants}
AERIAL DEPTH: ${a.depth}/40. Three real depth planes: textured trunks and shrubs close to lens, crisp architectural hero in middle ground, existing background softened by distance without fake fog.
LENS VIGNETTE: ${a.vignette}/30. Optical slight corner falloff only, no black gradient frame, no overdarkened facade.
EXPOSURE CONTROL: overall mood strength ${a.strength}/100; contrast ${a.contrast}/30, saturation ${a.saturation}/30, warmth ${a.temperature}/30; apply globally with local physical light response rather than a flat tint.
OPTICS: building sharp and detailed; foreground defocus ${a.dof}/100 only where natural camera distance supports it. Physically plausible glow ${a.bloom}/30 on real existing highlights; fine grain ${a.grain}/20. No filter-only change, pasted vegetation, black bars or resized camera. Winter plants cannot have summer green deciduous leaves; blue hour must preserve subject visibility. No exterior shrubs or trees added to an indoor image.`;
}
