/* PLUX V31: exact, bounded CORS allowlist.
 * Keeps V30 production origin and permits the v31 isolated preview only.
 * No wildcard and no requests from unknown origins.
 */
const ALLOWED=new Set([
  'https://plux-v12-2-2k-fixed.onrender.com',
  'https://plux-v17-friends-preview.onrender.com'
]);
export function appOrigin(req){
  const origin=String(req?.headers?.origin||'');
  return ALLOWED.has(origin)?origin:null;
}
export function isAppOrigin(origin){return ALLOWED.has(String(origin||''))}
