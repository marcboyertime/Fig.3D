import {sliceStats,formationConfiguration} from './self-separating-battery-depth.mjs?v=2';
const T=window.THREE;
export class DepthScene{
 constructor(host){
  this.host=host;this.root=new T.Group();host.scene.add(this.root);this.groups={};this.labels=[];
  for(const key of ['connectivity','length','formation']){this.groups[key]=new T.Group();this.root.add(this.groups[key]);}
  this.mats={};for(const [k,c] of Object.entries({carbon:0x303b4e,cathode:0x5988ee,sei:0xe9c78b,li:0xc2c9d3,wire:0x98afdd})){this.mats[k]=new T.MeshStandardMaterial({color:new T.Color(c).convertSRGBToLinear(),metalness:.32,roughness:.37,envMapIntensity:.45});}
  const size=41*41;this.tiles=new T.InstancedMesh(new T.PlaneGeometry(6/40*.985,6/40*.985),new T.MeshBasicMaterial({side:T.DoubleSide}),size);this.groups.connectivity.add(this.tiles);this.tiles.position.set(3.0,0,0);this.tiles.scale.setScalar(.62);this.tiles.rotation.y=-.08;
  this.sliceFrame=this.lines([[-3,-3,0],[3,-3,0],[3,3,0],[-3,3,0],[-3,-3,0]],0xe9c78b);this.groups.connectivity.add(this.sliceFrame);this.sliceFrame.scale.setScalar(.66);this.sliceFrame.position.x=-2.15;
  this.layered=new T.Group();this.groups.length.add(this.layered);
  this.low=this.box(5.3,.34,3.2,'carbon');this.mid=this.box(5.3,1,3.2,'sei');this.high=this.box(5.3,.34,3.2,'cathode');this.layered.add(this.low,this.mid,this.high);
  this.measure=new T.Group();this.groups.length.add(this.measure);
  const baseline=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(5.34,1.4,3.24)),new T.LineBasicMaterial({color:0x9caecc,transparent:true,opacity:.33}));this.groups.length.add(baseline);
  this.cell=new T.Group();this.groups.formation.add(this.cell);this.cell.position.set(1.5,0,0);
  this.formCarbon=this.box(2.2,1,2.3,'carbon');this.formCarbon.position.y=-.54;
  this.formSei=this.box(2.2,.16,2.3,'sei');this.formSei.position.y=.04;
  this.formPoly=this.box(2.2,.62,2.3,'cathode');this.formPoly.position.y=.43;
  this.cell.add(this.formCarbon,this.formSei,this.formPoly);
  this.lithium=this.box(.6,2.15,1.6,'li');this.lithium.position.set(-2.8,-.2,0);this.groups.formation.add(this.lithium);
  this.liquid=new T.Mesh(new T.BoxGeometry(7.5,2.75,3.7),new T.MeshPhysicalMaterial({color:0x779cc6,transparent:true,opacity:.045,roughness:.2,metalness:0,depthWrite:false,side:T.DoubleSide}));this.liquid.position.y=-.72;this.groups.formation.add(this.liquid);
  this.bathEdge=this.lines([[-3.75,1,-1.85],[-3.75,-2.1,-1.85],[3.75,-2.1,-1.85],[3.75,1,-1.85]],0x677d9e);this.groups.formation.add(this.bathEdge);
  this.instrument=this.box(.95,.38,.6,'wire');this.groups.formation.add(this.instrument);
  this.terminals={};
  for(const [key,y] of [['carbon',-.55],['cathode',.46]]){
   const terminal=this.box(.5,.12,.22,key);terminal.position.set(key==='carbon'?.17:2.83,y,1.1);this.groups.formation.add(terminal);this.terminals[key]=terminal;
  }
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
   const config=formationConfiguration(s.formation),changed=this.formationKey!==config.key;
   this.formationKey=config.key;this.config=config;
   this.instrument.visible=config.circuit!=='none';this.instrument.position.set(.1,2.6,0);
   this.formSei.visible=config.interphase;this.formPoly.position.y=config.interphase?.43:.27;
   this.lithium.visible=config.externalLi;this.liquid.visible=config.bath;this.bathEdge.visible=config.bath;
   this.host.canvas.dataset.formation=config.key;this.host.canvas.dataset.contact=config.contact||'none';this.host.canvas.dataset.bath=String(config.bath);this.host.canvas.dataset.externalLi=String(config.externalLi);
   if(changed){
    this.clear(this.connection);
    const carbon=[.17,-.55,1.1],polymer=[2.83,.46,1.1];
    if(config.circuit==='external-li'){
     const at=config.contact==='carbon'?carbon:polymer;
     this.connection.add(this.wire([[-2.8,.88,0],[-2.8,2.3,0],[-.38,2.6,0]]));
     const wire=this.wire([[.58,2.6,0],[config.contact==='carbon'?.1:3.2,2.2,1.1],at]);
     wire.material.color.setHex(config.contact==='carbon'?0x9caccc:0x8daeff).convertSRGBToLinear();this.connection.add(wire);
    }else if(config.contact==='both'){
     for(const [at,x,key] of [[carbon,-.6,'carbon'],[polymer,3.25,'cathode']]){const wire=this.wire([at,[x,1.5,1.1],[x,2.3,0],[key==='carbon'?-.38:.58,2.6,0]]);wire.material.color.setHex(key==='carbon'?0x9caccc:0x8daeff).convertSRGBToLinear();this.connection.add(wire);}
    }
    this.processStart=performance.now();
   }
   // Contact highlight follows the actual connected electrode, never just the caption.
   for(const key of ['carbon','cathode','sei']){this.mats[key].emissive.copy(this.mats[key].color);this.mats[key].emissiveIntensity=config.emphasis===key?.22:.015;}
   const activeLabel=config.contact==='carbon'?'Carbon connected':config.contact==='cathode'?'Polymer connected':config.circuit==='charger'?'Both device leads · charger':config.circuit==='load'?'Both device leads · load':'Direct carbon–polymer contact';
   this.labels=[[activeLabel,config.circuit==='external-li'?[config.contact==='carbon'?.2:2.9,-1.55,1.7]:[1.4,3.35,0]],[config.externalLi?'External Li':config.bath?'Electrolyte bath':config.interphase?'Bath removed':'No separating interphase',config.externalLi?[-2.8,1.5,0]:[.2,-2.55,1.8]]];
   this.tick(performance.now());
  }
 }
 tick(now){
  if(!this.root.visible||!this.groups.formation.visible)return false;
  const t=this.host.state?.reduced?1:Math.min(1,(now-this.processStart)/850),u=t*t*(3-2*t);
  // Reveal the proposed interphase only when entering its formation state.
  this.formSei.scale.y=this.config.key==='form-sei'?Math.max(.001,u):1;
  this.formSei.position.y=-.04+.08*this.formSei.scale.y;
  this.formPoly.position.y=this.config.interphase?.27+.16*(this.config.key==='form-sei'?u:1):.27;
  for(const wire of this.connection.children)wire.geometry.setDrawRange(0,Math.floor(wire.geometry.index.count*u/3)*3);
  return t<1;
 }
 home(topic){return topic==='connectivity'?{yaw:.18,elevation:.2,halfHeight:5.15,target:[.3,0,0]}:topic==='formation'?{yaw:.28,elevation:.3,halfHeight:4.45,target:[.1,.35,0]}:{yaw:.6,elevation:.38,halfHeight:3.6,target:[0,0,0]};}
}
