/** Sculpted open U-section gutters with external brackets and end caps.
 * Group is aligned to actual eave x/z. Gutter fall is intentionally subtle
 * (4 mm per metre) toward its own downpipe connection.
 */
export function addOpenEaveGutter(T,building,{
 x=0,y=3,z=0,length=7,axis='z',fallToward=1,material
}={}){
 const span=Math.max(.35,Number(length)||1),radius=.115,metal=material||
  new T.MeshStandardMaterial({color:'#444C4E',metalness:.62,roughness:.47,side:T.DoubleSide});
 const parent=new T.Group();parent.name='architectural-open-gutter';
 parent.position.set(x,y,z);
 // Local positive Z is along the length. A 4mm/m pitch makes the outlet
 // terminal lower; rotate Y for an X-directed hip-roof gutter.
 parent.rotation.order='YXZ';
 if(axis==='x')parent.rotation.y=Math.PI*.5;
 parent.rotation.x=(fallToward>=0?1:-1)*.004;
 const u=new T.Shape();
 for(let i=0;i<=24;i++){
  const a=Math.PI+i*Math.PI/24;
  const xx=radius*Math.cos(a),yy=radius*Math.sin(a);
  if(!i)u.moveTo(xx,yy);else u.lineTo(xx,yy);
 }
 for(let i=24;i>=0;i--){
  const a=Math.PI+i*Math.PI/24;
  const inner=radius-.013;
  u.lineTo(inner*Math.cos(a),inner*Math.sin(a));
 }
 u.closePath();
 const extruded=new T.ExtrudeGeometry(u,{depth:span,bevelEnabled:false,steps:1,curveSegments:24});
 extruded.translate(0,0,-span/2);
 const gutter=new T.Mesh(extruded,metal);
 gutter.castShadow=true;gutter.receiveShadow=true;
 gutter.userData.architecturePart='gutter';
 gutter.userData.section='open-semicircular';
 gutter.userData.fallMmPerMeter=4;
 parent.add(gutter);
 const cap=new T.Shape();
 cap.moveTo(-radius,0);
 for(let i=1;i<=24;i++){
  const a=Math.PI+i*Math.PI/24;
  cap.lineTo(radius*Math.cos(a),radius*Math.sin(a));
 }
 cap.closePath();
 for(const end of [-1,1]){
  const cover=new T.Mesh(new T.ShapeGeometry(cap),metal);
  cover.position.z=end*span/2;
  cover.material.side=T.DoubleSide;
  cover.castShadow=true;
  cover.userData.architecturePart='gutter-end-cap';
  parent.add(cover);
 }
 const clamp=new T.MeshStandardMaterial({color:'#596367',metalness:.61,roughness:.47});
 const count=Math.max(2,Math.ceil(span/.9));
 for(let j=0;j<=count;j++){
  const along=-span/2+span*j/count;
  const hanger=new T.Mesh(new T.BoxGeometry(.024,.080,.044),clamp);
  hanger.position.set(0,-.052,along);
  hanger.castShadow=true;
  hanger.userData.architecturePart='gutter-hanger';
  parent.add(hanger);
 }
 building.add(parent);
 return parent;
}
