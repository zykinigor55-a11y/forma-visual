/* FORMA ATELIER / main studio navigation.
 * Purpose-drawn, legible at 30–34 px. Neutral graphite + brushed bronze,
 * one self-contained SVG per button; no remote sprites, fonts or bitmaps.
 */
const PATHS=Object.freeze({
 project:'<path d="M9 17h12l4 4h14v16H9z" fill="url(#METAL)" stroke="#f1ddba" stroke-width="1.6"/><path d="M9 17v-5h13l4 5M13 25h22" fill="none" stroke="#ffebc8" stroke-width="1.65"/>',
 build:'<path d="M8 22l16-12 16 12-16 10z" fill="url(#METAL)" stroke="#f1d9b2" stroke-width="1.65"/><path d="M12 24v12l12 6V31l12-7v12l-12 6" fill="url(#METAL)" stroke="#e8caa1" stroke-width="1.5"/><path d="M28 32l5-3v7l-5 2z" fill="#252b29" stroke="#d9bc91" stroke-width="1.15"/>',
 interior:'<path d="M11 9h26v28H11z" fill="none" stroke="#e6c598" stroke-width="2"/><path d="M12 24l12 6 12-6M24 30v7" fill="none" stroke="#f5dfbe" stroke-width="1.5"/><path d="M14 26h12v6H14zM26 29h8v5h-8z" fill="url(#METAL)" stroke="#f0d0a2" stroke-width="1.3"/><path d="M18 18h12" stroke="#b9a082" stroke-width="2"/>',
 materials:'<path d="M24 8 40 17 24 26 8 17z" fill="url(#METAL)" stroke="#f2dab6" stroke-width="1.65"/><path d="m8 24 16 9 16-9M8 31l16 9 16-9" fill="none" stroke="#cba783" stroke-width="2.8" stroke-linejoin="round"/><path d="M13 16l11-6" stroke="#fff0c9" stroke-width="1.6" opacity=".8"/>',
 trees:'<path d="M17 35V14" stroke="#e8c99d" stroke-width="2.4"/><path d="m17 9-9 15 4-1-6 10h23l-6-10 4 1z" fill="url(#METAL)" stroke="#f1d7af" stroke-width="1.6"/><path d="M36 38V23" stroke="#c39b70" stroke-width="2"/><path d="M30 27c-4-8 3-13 7-9 7-3 10 6 5 10 1 5-10 10-12-1z" fill="url(#METAL)" stroke="#e7cda7" stroke-width="1.25"/><path d="M9 39h31" stroke="#d4b089" stroke-width="1.7"/>',
 atmosphere:'<circle cx="28" cy="17" r="7" fill="url(#METAL)" stroke="#f0dbb8" stroke-width="1.5"/><path d="M28 5v4M40 17h-4M17 8l3 3M39 7l-3 4" stroke="#ead3a7" stroke-width="1.6"/><path d="M12 33c-1-8 7-12 12-9 4-7 14-4 15 3 8 3 5 12-2 12H16c-8 0-10-5-4-6z" fill="url(#METAL)" stroke="#f2d9b2" stroke-width="1.8"/>',
 animation:'<rect x="9" y="13" width="30" height="25" rx="3" fill="#31343a" stroke="#d6b48a" stroke-width="1.8"/><path d="M20 18 33 25 20 32z" fill="url(#METAL)" stroke="#ffebc8" stroke-width="1.6"/><path d="M12 9h5M22 9h5M32 9h5M12 42h5M22 42h5M32 42h5" stroke="#c9a780" stroke-width="2"/>',
 gallery:'<path d="M12 10h28v26H12z" fill="#242a2c" stroke="#baa181" stroke-width="1.8"/><rect x="8" y="14" width="28" height="26" rx="2" fill="url(#METAL)" stroke="#f0d5ac" stroke-width="1.6"/><circle cx="28" cy="21" r="3" fill="#fff0c9"/><path d="m11 35 9-10 5 6 5-5 4 9z" fill="#635342" stroke="#efdbb9" stroke-width="1.2"/>',
 settings:'<path d="M9 13h30M9 24h30M9 35h30" stroke="#d4b28b" stroke-width="2.2" stroke-linecap="round"/><circle cx="19" cy="13" r="4.3" fill="url(#METAL)" stroke="#f6e1bc" stroke-width="1.4"/><circle cx="31" cy="24" r="4.3" fill="url(#METAL)" stroke="#f6e1bc" stroke-width="1.4"/><circle cx="23" cy="35" r="4.3" fill="url(#METAL)" stroke="#f6e1bc" stroke-width="1.4"/>',
 nodes:'<path d="M19 15h10v17M19 15v17h10" fill="none" stroke="#d3ac7f" stroke-width="2.4" stroke-linejoin="round"/><rect x="8" y="9" width="13" height="12" rx="2" fill="url(#METAL)" stroke="#eed3ad" stroke-width="1.5"/><rect x="27" y="27" width="13" height="12" rx="2" fill="url(#METAL)" stroke="#eed3ad" stroke-width="1.5"/><circle cx="19" cy="32" r="3" fill="#f3d9b5"/>',
 tools:'<path d="M28 9a9 9 0 0 0-9 12L8 32a6 6 0 0 0 8 8l11-11a9 9 0 0 0 12-12l-8 7-7-7z" fill="url(#METAL)" stroke="#f0d5ad" stroke-width="1.6"/><circle cx="13" cy="35" r="2.3" fill="#292e2c" stroke="#ffe5b8" stroke-width="1.1"/>',
 check:'<path d="M24 7 39 14v12c0 9-7 14-15 17C16 40 9 35 9 26V14z" fill="url(#METAL)" stroke="#efdbb5" stroke-width="1.7"/><path d="m16 25 6 6 12-13" fill="none" stroke="#292e2b" stroke-width="3.1" stroke-linecap="round" stroke-linejoin="round"/>'
});
const ALIASES=Object.freeze({render:'build',environment:'build',landscape:'trees',plant:'trees','landscape-project':'trees',variants:'gallery',frames:'gallery',parameters:'settings',scenario:'nodes',scenarios:'nodes',workflow:'nodes',pro:'tools',models:'tools',plan:'gallery',preview:'atmosphere',image3d:'build'});
let instance=0;
export function mainNavIcon(name){
 const key=ALIASES[name]||name;
 const shape=PATHS[key]||PATHS.tools;
 const id=++instance,metal='forma-nav-bronze-'+id,shade='forma-nav-shade-'+id;
 return '<svg xmlns="http://www.w3.org/2000/svg" class="lp-3d-icon forma-premium-icon forma-main-nav-icon" data-forma-rev="main-atelier-v3" width="48" height="48" viewBox="0 0 48 48" focusable="false" aria-hidden="true">'+
 '<defs><linearGradient id="'+metal+'" x1="0" y1="0" x2="0.8" y2="1">'+
 '<stop offset="0" stop-color="#f1debe"/><stop offset=".34" stop-color="#c4a27b"/><stop offset=".74" stop-color="#987655"/><stop offset="1" stop-color="#635343"/></linearGradient>'+
 '<linearGradient id="'+shade+'" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#404348"/><stop offset="1" stop-color="#292c30"/></linearGradient></defs>'+
 '<rect x="2.2" y="2.2" width="43.6" height="43.6" rx="10.4" fill="url(#'+shade+')" stroke="#7c7060" stroke-width="1.1"/>'+
 '<path d="M9 6h27" stroke="#e4c9a1" opacity=".5" stroke-width=".8" stroke-linecap="round"/>'+
 '<g stroke-linecap="round" stroke-linejoin="round">'+shape.replaceAll('url(#METAL)','url(#'+metal+')')+'</g>'+
 '</svg>';
}
export const MAIN_NAV_KEYS=Object.freeze(Object.keys(PATHS));
