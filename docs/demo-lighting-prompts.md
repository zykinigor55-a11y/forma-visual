# Prepared lighting photographs

These assets are made with the built-in image generation tool. They are example photographs, not live user generations. No API key was used or enabled in the application.

## House targets

Each existing `public/images/demo/{material}-{season}.webp` is the edit target, for plaster/brick/wood/stone and spring/summer/autumn/winter. Each target receives two separate lighting-only edits, saved as `{material}-{season}-evening.webp` and `{material}-{season}-night.webp`.

Prompt template:

> Use case: lighting-weather. Asset type: professional architectural photography lighting plate for a configurator. Edit target: attached house photograph. Change ONLY time of day and artificial lighting to [EVENING: late evening blue hour with soft lavender blue sky, a trace of sunset warmth / NIGHT: clear night, deep blue night sky, soft moonlight, professionally exposed bright HDR architectural night photography]. Every window has bright inviting warm white 3000K interior lighting with natural room depth, lamps, furniture silhouettes, subtle reflections. Not orange rectangles; realistic glass and luminous rooms. Recessed warm roof/soffit strip lights and downlights illuminate the facade, terrace, steps and nearby landscape. Foreground, trees and ground remain clearly readable in soft cool ambient sky illumination, excellent shadow detail. Delicate warm spill from house lights onto site. Real architectural photograph, no blanket dark filter. Keep exactly the same camera, 4:3 full framing, house geometry, window outlines and all object positions; preserve same material, same season, same trees, loungers and firebowl at same pixel locations. Do not move or zoom house. No UI, no text, no people, no watermark.

## Landscape targets

Each `background-{environment}-{season}.webp` is edited separately for garden/village/lake and every season. Results add `-evening` or `-night` before the extension.

Prompt template:

> Use case: lighting-weather. Edit target: attached empty landscape background photograph. Change only lighting to [EVENING: late evening blue hour, soft lavender blue sky, gentle sunset warmth at horizon / NIGHT: night with deep blue sky, cool soft moonlight and excellent exposure / visible landscape details]. Professional real architectural landscape photography. The empty central clearing and foreground receive realistic soft warm white 3000K illumination from an off-camera house to the right and gentle landscaping lights, with subtle warm pools around path and trees. For lake: soft warm illuminated reflections on the lake water, keeping realistic blue water and cold ambient reflection. Keep this an empty landscape, no house or building in central clearing. Preserve exact same camera, 4:3 framing, horizon, positions of trees, rocks, ground, water and paths. Preserve the selected season exactly. Do not recompose. Clearly readable surroundings, no crushed black shadows, no artificial uniform orange glow, no text, no watermark, no UI, no people. Landscape will be behind the illuminated house in an architectural visualization.

Color transfer and weather remain deterministic browser effects. The color mask follows the registered main facade planes. It excludes windows, frames, opaque balcony rails, the projecting roof slab, timber accents and loungers; material grain/joints and light remain visible. Reflections on glass in front of an opaque wall retain their photographed detail. This is a fixed-house demonstration, not a universal segmentation system for arbitrary uploads.

## Weather photographs

Built-in image generation performs lighting/weather edits of the clear daytime plaster house and the empty season-specific lake/village/garden photographs. Outputs are encoded directly into `public/images/weather/{house|lake|village|garden}-{season}-{cloudy|fog|rain}.webp`; generated source PNGs stay outside the public tree.

Shared prompt constraints: change only weather and its natural illumination; preserve the selected season, plant colors and existing snow/ice; neutral daytime with artificial lighting off; exact original camera, perspective, 4:3 full composition, no movement/zoom/crop. Keep every house opening, roof, terrace, piece of furniture and landscape contour at its original pixel position for registered compositing. Landscape targets keep the clearing empty and retain only original distant residential buildings. Premium photographic realism, no UI, text, watermark or stylization.

- **Cloudy:** solid layered grey cloud cover, no blue sky or sun patches. Fully diffuse neutral skylight; remove hard tree shadows and sunbeams from facade/ground. Natural contrast, clear air, no mist/rain, dry terrace.
- **Fog:** volumetric depth; distant trees/horizon substantially disappear, middle-distance trees soften, foreground house/trees retain fine detail. Wisps low near ground/water; white-grey clouded sky, diffuse illumination, no hard sun shadows. Never a uniform white veil, no rain.
- **Rain:** moderate photographic rain under thick grey clouds, no blue sky or direct sun. Darkened wet timber/stone, wet terrace/paths, shallow small puddles, splashes, subtle reflected facade/trees in paving, varied-depth fine rain rather than evenly spaced long lines. Lake has small rain ripples. Winter rain is a cold thaw with wet snow/slush. Keep sheltered interior dry, fire bowl small/subtle.

Material and time choices are composed from these prepared photos and registered clear-lighting photographs. This is a fixed-house illustrative configurator, not a new live API generation for every combination.
