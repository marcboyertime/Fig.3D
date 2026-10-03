import {hiddenConnection,formationConfiguration} from './self-separating-battery-depth.mjs?v=5';
import {phaseMaterial} from './self-separating-battery-scene.mjs?v=5';
import {PHASES} from './self-separating-battery-model.mjs?v=5';
import {FormationBench} from './self-separating-battery-formation.mjs?v=5';
const T=window.THREE,linear=hex=>new T.Color(hex).convertSRGBToLinear();
const SECTION_X=3.05,SECTION_SCALE=.62,VOLUME_X=-2.15,VOLUME_SCALE=.66;
export class DepthScene{
 constructor(host){
  this.host=host;this.root=new T.Group();host.scene.add(this.root);this.groups={};this.labels=[];
  for(const key of ['connectivity','length','formation']){this.groups[key]=new T.Group();this.root.add(this.groups[key]);}
  // Connections: the sampled plane, its frame on the volume, and the route that joins two patches.
  const n=41;this.tiles=new T.InstancedMesh(new T.PlaneGeometry(6/40*.97,6/40*.97),new T.MeshBasicMaterial({side:T.DoubleSide,toneMapped:false}),n*n);
  this.section=new T.Group();this.section.position.set(SECTION_X,0,0);this.section.scale.setScalar(SECTION_SCALE);this.section.rotation.y=-.12;this.section.add(this.tiles);this.groups.connectivity.add(this.section);
  this.sliceFrame=this.lines([[-3,-3,0],[3,-3,0],[3,3,0],[-3,3,0],[-3,-3,0]],0xffe2a8);this.sliceFrame.scale.setScalar(VOLUME_SCALE);this.sliceFrame.position.x=VOLUME_X;this.groups.connectivity.add(this.sliceFrame);
  this.connection=new T.Group();this.groups.connectivity.add(this.connection);this.marks=new T.Group();this.marks.position.z=.02;this.section.add(this.marks);
  // Length scales: an ideal ion-conducting slab between two electrode plates.
  this.layered=new T.Group();this.groups.length.add(this.layered);
  this.low=new T.Mesh(new T.BoxGeometry(5.3,.34,3.2),phaseMaterial('carbon'));this.high=new T.Mesh(new T.BoxGeometry(5.3,.34,3.2),phaseMaterial('cathode'));
  this.mid=new T.Mesh(new T.BoxGeometry(5.3,1,3.2),new T.MeshPhysicalMaterial({color:linear(0x9fb8d8),transparent:true,opacity:.34,roughness:.2,metalness:0,depthWrite:false}));
  this.midEdges=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(5.3,1,3.2)),new T.LineBasicMaterial({color:0xc9d8f0,transparent:true,opacity:.5}));
  this.layered.add(this.low,this.high,this.mid,this.midEdges);
  this.areaFace=new T.Mesh(new T.PlaneGeometry(5.3,3.2),new T.MeshBasicMaterial({color:0xdfe8ff,transparent:true,opacity:.16,side:T.DoubleSide,depthWrite:false}));this.areaFace.rotation.x=-Math.PI/2;this.groups.length.add(this.areaFace);
  this.areaEdge=new T.LineSegments(new T.EdgesGeometry(new T.PlaneGeometry(5.3,3.2)),new T.LineBasicMaterial({color:0xe6eeff}));this.areaEdge.rotation.x=-Math.PI/2;this.groups.length.add(this.areaEdge);
  this.measure=new T.Group();this.groups.length.add(this.measure);
  this.reference=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(5.36,1.4,3.26)),new T.LineBasicMaterial({color:0xffe2a8,transparent:true,opacity:.35}));this.groups.length.add(this.reference);
  this.ionsLength=[];const ionMat=new T.MeshStandardMaterial({color:linear(0xf3c36a),emissive:linear(0x6d4a12),emissiveIntensity:.5,roughness:.3});
  for(let i=0;i<5;i++){const o=new T.Mesh(new T.SphereGeometry(.07,14,10),ionMat);this.groups.length.add(o);this.ionsLength.push(o);}
  this.bench=new FormationBench(host);this.groups.formation.add(this.bench.group);
  this.time=0;
 }
 lines(points,color,opacity=1){return new T.Line(new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p))),new T.LineBasicMaterial({color,transparent:opacity<1,opacity}));}
 clear(group){for(const o of [...group.children]){o.traverse?.(c=>{c.geometry?.dispose();c.material?.dispose();});group.remove(o);}}
 update(s){
  this.root.visible=!!s;this.state=s;if(!s)return;
  for(const [k,g] of Object.entries(this.groups))g.visible=k===s.topic;
  this.labels=[];
  if(s.topic==='connectivity')this.updateConnectivity(s);
  if(s.topic==='length')this.updateLength(s);
  if(s.topic==='formation'){const step=formationConfiguration(s.formation);this.bench.update(step,{reduced:this.host.state?.reduced});}
 }
 updateConnectivity(s){
  const {field,meta}=this.host,n=meta.n,k=s.slice;
  if(this.k!==k){
   this.k=k;this.link=hiddenConnection(field,n,k);const m=new T.Matrix4(),color=new T.Color();
   const linked=this.link?new Set([this.link.from,this.link.to]):new Set();
   for(let i=0;i<n;i++)for(let j=0;j<n;j++){
    const value=field[(i*n+j)*n+k],phase=value<=0?'carbon':value<meta.seiThreshold?'sei':value<meta.outerThreshold?'cathode':null;
    const label=this.link?.labels[i*n+j];
    m.makeTranslation(-3+i*meta.step,-3+j*meta.step,0);this.tiles.setMatrixAt(i*n+j,m);
    color.set(phase?{carbon:'#4f535b',sei:'#79c49d',cathode:'#1c5f9e'}[phase]:'#0b0f18');if(phase==='carbon'&&linked.has(label))color.set('#9298a3');color.convertSRGBToLinear();
    this.tiles.setColorAt(i*n+j,color);
   }
   this.tiles.instanceMatrix.needsUpdate=true;this.tiles.instanceColor.needsUpdate=true;
   this.clear(this.connection);this.clear(this.marks);
   if(this.link){
    const toVolume=([i,j,kk])=>new T.Vector3((-3+i*meta.step)*VOLUME_SCALE+VOLUME_X,(-3+j*meta.step)*VOLUME_SCALE,(-3+kk*meta.step)*VOLUME_SCALE);
    const raw=this.link.path.map(toVolume),smooth=raw.map((p,i)=>i===0||i===raw.length-1?p:p.clone().add(raw[i-1]).add(raw[i+1]).multiplyScalar(1/3));
    const curve=new T.CatmullRomCurve3(smooth,false,'centripetal'),mat=new T.MeshBasicMaterial({color:0xffe2a8,depthTest:false,depthWrite:false,transparent:true,toneMapped:false});
    const tube=new T.Mesh(new T.TubeGeometry(curve,Math.max(40,raw.length*4),.05,10,false),mat);tube.renderOrder=6;this.connection.add(tube);
    for(const p of [smooth[0],smooth.at(-1)]){const dot=new T.Mesh(new T.SphereGeometry(.085,16,12),mat.clone());dot.position.copy(p);dot.renderOrder=6;this.connection.add(dot);}
    // Matching marks on the detached plane.
    for(const v of [this.link.path[0],this.link.path.at(-1)]){const ring=new T.Mesh(new T.RingGeometry(.16,.24,28),new T.MeshBasicMaterial({color:0xffe2a8,toneMapped:false,side:T.DoubleSide}));ring.position.set(-3+v[0]*meta.step,-3+v[1]*meta.step,0);this.marks.add(ring);}
    this.connectionPeak=toVolume(this.link.path.reduce((a,b)=>Math.abs(b[2]-k)>Math.abs(a[2]-k)?b:a));
   }
  }
  this.sliceFrame.position.z=(-3+k*meta.step)*VOLUME_SCALE+.01;
  const narrow=this.host.width<620,side=this.link?.path.some(p=>p[2]>k)?'behind':'in front of';
  this.labels=[{id:'volume',text:narrow?'Volume':'3D volume',at:[VOLUME_X,2.9,0],kind:'title'},{id:'plane',text:narrow?'Flattened section':'The same section, flattened',at:[SECTION_X,2.9,0],kind:'title'}];
  if(this.link)this.labels.push({id:'route',text:narrow?`Joined ${this.link.maxOffset} samples ${side} the cut`:`Highlighted patches join ${this.link.maxOffset} samples ${side} the cut`,at:[VOLUME_X,-2.55,0],kind:'route'});
 }
 updateLength(s){
  const h=1.4*s.length;this.mid.scale.y=h;this.midEdges.scale.y=h;this.low.position.y=-h/2-.17;this.high.position.y=h/2+.17;
  this.areaFace.position.y=h/2+.345;this.areaEdge.position.y=h/2+.346;
  this.clear(this.measure);const x=3.0,z=1.75;
  this.measure.add(this.lines([[x,-h/2,z],[x,h/2,z]],0xffe2a8));for(const y of [-h/2,h/2])this.measure.add(this.lines([[x-.16,y,z],[x+.16,y,z]],0xffe2a8));
  this.labels=[{id:'L',text:'L',at:[x+.34,0,z],kind:'symbol-l',align:'start'},{id:'A',text:'A  fixed area',at:[0,h/2+.36,0],kind:'symbol-a'},{id:'cathode',text:'Cathode',at:[-2.85,h/2+.17,1.6],kind:'quiet',align:'end'},{id:'ion',text:'Ion conductor',at:[-2.85,0,1.6],kind:'quiet',align:'end'},{id:'anode',text:'Anode',at:[-2.85,-h/2-.17,1.6],kind:'quiet',align:'end'}];
 }
 tick(now,dt=0){
  if(!this.root.visible)return false;
  if(this.groups.formation.visible)return this.bench.tick(now);
  if(this.groups.length.visible&&!this.host.state?.reduced&&!this.host.state?.paused){
   // Ions cross the slab; speed is illustrative (the graph, not this motion, carries the scaling).
   this.time+=dt;const h=1.4*this.state.length;this.ionsLength.forEach((o,i)=>{const q=(this.time*.18+i/5)%1;o.position.set(-1.8+i*.9,-h/2+q*h,.4-(i%2)*.8);});return true;}
  if(this.groups.length.visible){const h=1.4*this.state.length;this.ionsLength.forEach((o,i)=>o.position.set(-1.8+i*.9,-h/2+((i*.37)%1)*h,.4-(i%2)*.8));}
  return false;
 }
 home(topic){
  const portrait=this.host.width/this.host.height<.95;
  if(topic==='connectivity')return portrait?{yaw:.2,elevation:.22,halfHeight:5.6,target:[.4,0,0]}:{yaw:.2,elevation:.22,halfHeight:4.9,target:[.35,.2,0]};
  if(topic==='formation'){
   // Matches the stylesheet: at 560px and below the magnified wall moves under the bench.
   if(!matchMedia('(max-width:560px)').matches){const a=this.host.width/this.host.height;return a<1.15?{yaw:.3,elevation:.16,halfHeight:3.4*Math.min(1.25,1.15/a),target:[2.1,.7,0]}:{yaw:.3,elevation:.16,halfHeight:3.4,target:[1.55,.7,0]};}
   // Phone: the bench fills the stage width and sits at the top; the magnified wall takes the lower part.
   const halfHeight=3.5,visible=halfHeight*Math.max(1,.98/(this.host.width/this.host.height));
   return {yaw:.3,elevation:.16,halfHeight,target:[.1,4.35-visible,0]};
  }
  return {yaw:.6,elevation:.36,halfHeight:3.6,target:[.2,0,0]};
 }
}
