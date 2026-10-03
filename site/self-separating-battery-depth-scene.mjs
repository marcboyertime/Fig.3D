import {sliceStats} from './self-separating-battery-depth.mjs?v=1';
const T=window.THREE;
export class DepthScene{
 constructor(host){
  this.host=host;this.root=new T.Group();host.scene.add(this.root);this.groups={};this.labels=[];
  for(const key of ['connectivity','length','formation']){this.groups[key]=new T.Group();this.root.add(this.groups[key]);}
  this.mats={};for(const [k,c] of Object.entries({carbon:0x586579,cathode:0x5988ee,sei:0xe9c78b,li:0xc2c9d3,wire:0x98afdd})){this.mats[k]=new T.MeshStandardMaterial({color:new T.Color(c).convertSRGBToLinear(),metalness:.32,roughness:.37,envMapIntensity:.45});}
  const size=41*41;this.tiles=new T.InstancedMesh(new T.PlaneGeometry(6/40*.985,6/40*.985),new T.MeshBasicMaterial({side:T.DoubleSide}),size);this.groups.connectivity.add(this.tiles);this.tiles.position.set(3.0,0,0);this.tiles.scale.setScalar(.62);this.tiles.rotation.y=-.08;
  this.sliceFrame=this.lines([[-3,-3,0],[3,-3,0],[3,3,0],[-3,3,0],[-3,-3,0]],0xe9c78b);this.groups.connectivity.add(this.sliceFrame);this.sliceFrame.scale.setScalar(.66);this.sliceFrame.position.x=-2.15;
  this.layered=new T.Group();this.groups.length.add(this.layered);
  this.low=this.box(5.3,.34,3.2,'carbon');this.mid=this.box(5.3,1,3.2,'sei');this.high=this.box(5.3,.34,3.2,'cathode');this.layered.add(this.low,this.mid,this.high);
  this.measure=new T.Group();this.groups.length.add(this.measure);
  const baseline=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(5.34,1.4,3.24)),new T.LineBasicMaterial({color:0x9caecc,transparent:true,opacity:.33}));this.groups.length.add(baseline);
  this.cell=new T.Group();this.groups.formation.add(this.cell);this.cell.position.set(-1.7,0,0);
  this.formCarbon=this.box(2.2,1,2.3,'carbon');this.formCarbon.position.y=-.54;
  this.formSei=this.box(2.2,.16,2.3,'sei');this.formSei.position.y=.04;
  this.formPoly=this.box(2.2,.62,2.3,'cathode');this.formPoly.position.y=.43;
  this.cell.add(this.formCarbon,this.formSei,this.formPoly);
  this.lithium=this.box(.6,2.15,1.6,'li');this.lithium.position.set(2.7,-.2,0);this.groups.formation.add(this.lithium);
  this.liquid=new T.Mesh(new T.BoxGeometry(7.5,2.75,3.7),new T.MeshPhysicalMaterial({color:0x779cc6,transparent:true,opacity:.11,roughness:.2,metalness:0,depthWrite:false,side:T.DoubleSide}));this.liquid.position.y=-.72;this.groups.formation.add(this.liquid);
  this.bathEdge=this.lines([[-3.75,1,-1.85],[-3.75,-2.1,-1.85],[3.75,-2.1,-1.85],[3.75,1,-1.85]],0x677d9e);this.groups.formation.add(this.bathEdge);
  this.instrument=this.box(.95,.38,.6,'wire');this.groups.formation.add(this.instrument);
  this.connection=new T.Group();this.groups.formation.add(this.connection);
 }
 box(w,h,d,key){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),this.mats[key]);mesh.castShadow=true;mesh.receiveShadow=true;return mesh;}
 lines(points,color){return new T.Line(new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p))),new T.LineBasicMaterial({color}));}
 clear(group){for(const o of [...group.children]){o.geometry?.dispose();o.material?.dispose();group.remove(o);}}
 wire(points){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal');return new T.Mesh(new T.TubeGeometry(curve,60,.027,8,false),this.mats.wire.clone());}
 update(s){
  this.root.visible=!!s;if(!s)return;
  for(const [k,g] of Object.entries(this.groups))g.visible=k===s.topic;
  this.labels=[];
  if(s.topic==='connectivity'){
   if(this.k!==s.slice){this.k=s.slice;const {field,meta}=this.host,n=meta.n,m=new T.Matrix4(),color=new T.Color();for(let i=0;i<n;i++)for(let j=0;j<n;j++){const value=field[(i*n+j)*n+s.slice],k=value<=0?'carbon':value<meta.seiThreshold?'sei':value<meta.outerThreshold?'cathode':null;m.makeTranslation(-3+i*meta.step,-3+j*meta.step,0);this.tiles.setMatrixAt(i*n+j,m);color.setHex(k?{carbon:0x343f51,sei:0xe9c78b,cathode:0x5988ee}[k]:0x101725);this.tiles.setColorAt(i*n+j,color.convertSRGBToLinear());}this.tiles.instanceMatrix.needsUpdate=true;this.tiles.instanceColor.needsUpdate=true;this.stats=sliceStats(field,n,s.slice);}
   this.sliceFrame.position.z=(-3+s.slice*this.host.meta.step)*.66+.01;
   this.labels=[['3D volume',[-2.15,2.65,0]],['Same section',[3.0,2.65,0]]];
  }
  if(s.topic==='length'){
   const h=1.4*s.length;this.mid.scale.y=h;this.low.position.y=-h/2-.17;this.high.position.y=h/2+.17;
   this.clear(this.measure);this.measure.add(this.lines([[3.15,-h/2,1.65],[3.15,h/2,1.65]],0xffdb9e));
   for(const y of [-h/2,h/2])this.measure.add(this.lines([[2.96,y,1.65],[3.34,y,1.65]],0xffdb9e));
   this.labels=[['L = '+s.length.toFixed(2)+' L₀',[3.3,0,1.7]],['Fixed area A',[0,h/2+.85,0]]];
  }
  if(s.topic==='formation'){
   const k=s.formation;this.instrument.visible=k>0;this.instrument.position.set(k===3?-1.5:.3,2.6,0);this.formSei.visible=k>0;this.formPoly.position.y=k>0?.43:.27;this.lithium.visible=k===1||k===2;this.liquid.visible=k===1||k===2;this.bathEdge.visible=k===1||k===2;this.clear(this.connection);
   if(k===1||k===2){const y=k===1?-.6:.7;this.connection.add(this.wire([[-1.7,y,0],[-1.7,2.2,0],[.3,2.6,0],[2.7,2.2,0],[2.7,.9,0]]));}
   if(k===3){this.connection.add(this.wire([[-2.8,-.6,0],[-3.4,2,0],[-1.5,2.6,0],[.3,2,0],[-.6,.6,0]]));}
   this.labels=k===0?[['Carbon',[-1.7,-1.65,1.2]],['PAQEDOT',[-1.7,1.2,0]]]:k===3?[['External load',[-1.5,3.0,0]],['SEI between electrodes',[-1.7,-1.65,1.2]]]:[['Controlled current',[.3,3.2,0]],['External Li',[2.7,1.4,0]]];
  }
 }
 home(topic){return topic==='connectivity'?{yaw:.18,elevation:.2,halfHeight:5.15,target:[.3,0,0]}:topic==='formation'?{yaw:.34,elevation:.24,halfHeight:4.6,target:[0,.1,0]}:{yaw:.6,elevation:.38,halfHeight:3.6,target:[0,0,0]};}
}
