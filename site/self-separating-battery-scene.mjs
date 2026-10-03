import {DepthScene} from './self-separating-battery-depth-scene.mjs?v=5';
import {PHASES,HOME,orbit,ease,clamp,meshNames,intervals,clipScalar,showingPaper} from './self-separating-battery-model.mjs?v=5';
const T=window.THREE,BASE='assets/self-separating-battery/';
const linear=hex=>new T.Color(hex).convertSRGBToLinear();
function fromBinary(buffer){
 const h=new Uint32Array(buffer,0,2),n=h[0],f=h[1],g=new T.BufferGeometry();
 g.setAttribute('position',new T.BufferAttribute(new Float32Array(buffer,8,n*3),3));
 g.setAttribute('normal',new T.BufferAttribute(new Float32Array(buffer,8+n*12,n*3),3));
 g.setIndex(new T.BufferAttribute(new Uint32Array(buffer,8+n*24,f*3),1));g.computeBoundingSphere();return g;
}
// A gently curved slab between two heights: the enlarged local wall of the Interface view.
export const wallHeight=(x,z)=>.14*Math.sin(x*.83)+.13*Math.cos(z*1.1);
function patchGeometry(low,high,w=5.3,d=3.3){
 const p=[],ids=[],nx=48,nz=30;
 for(const y of [low,high])for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++){const x=-w/2+w*i/nx,z=-d/2+d*j/nz;p.push(x,y+wallHeight(x,z),z);}
 const at=(layer,i,j)=>layer*(nx+1)*(nz+1)+i*(nz+1)+j,o=(nx+1)*(nz+1);
 for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const a=at(0,i,j),b=at(0,i+1,j),c=at(0,i+1,j+1),dd=at(0,i,j+1);ids.push(a,b,c,a,c,dd,a+o,c+o,b+o,a+o,dd+o,c+o);}
 for(let i=0;i<nx;i++)for(const j of [0,nz]){const a=at(0,i,j),b=at(0,i+1,j),c=at(1,i+1,j),dd=at(1,i,j);if(j===0)ids.push(a,dd,c,a,c,b);else ids.push(a,b,c,a,c,dd);}
 for(let j=0;j<nz;j++)for(const i of [0,nx]){const a=at(0,i,j),b=at(0,i,j+1),c=at(1,i,j+1),dd=at(1,i,j);if(i===0)ids.push(a,b,c,a,c,dd);else ids.push(a,dd,c,a,c,b);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ids);g.computeVertexNormals();return g;
}
export function phaseMaterial(key,extra={}){
 const look={carbon:{metalness:.18,roughness:.6,envMapIntensity:.55},cathode:{metalness:.06,roughness:.36,envMapIntensity:.7},sei:{metalness:0,roughness:.48,envMapIntensity:.45,emissive:linear(0x16301f),emissiveIntensity:.2},template:{metalness:.04,roughness:.5,envMapIntensity:.4},precursor:{metalness:.04,roughness:.5,envMapIntensity:.4}}[key];
 return new T.MeshStandardMaterial({color:linear(PHASES[key].color),side:T.DoubleSide,...look,...extra});
}

export class NetworkScene{
 constructor(canvas,callbacks){
  this.canvas=canvas;this.cb=callbacks;this.pose=structuredClone(HOME);this.width=1;this.height=1;this.active=true;this.visible=!document.hidden;
  this.raf=0;this.time=0;this.last=0;this.frameTimes=[];this.materials={};this.meshes={};this.capMeshes={};this.localMeshes={};this.slabMeshes={};this.ready=false;this.travel=null;this.fades=[];this.animators=new Set();
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
  Object.assign(this.renderer,{outputEncoding:T.sRGBEncoding,toneMapping:T.ACESFilmicToneMapping,toneMappingExposure:.86,localClippingEnabled:true});
  this.renderer.setClearColor(0x080a12,0);this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
  this.scene=new T.Scene();this.camera=new T.OrthographicCamera(-5,5,5,-5,.1,100);
  this.network=new T.Group();this.local=new T.Group();this.slab=new T.Group();this.scene.add(this.network,this.local,this.slab);this.local.visible=false;this.slab.visible=false;
  this.clip=new T.Plane(new T.Vector3(0,0,-1),3.01);
  this.lighting();
  for(const k of ['carbon','cathode','sei','template']){
   this.materials[k]=phaseMaterial(k,{clippingPlanes:[this.clip],clipShadows:true});
   const cap=new T.Mesh(new T.BufferGeometry(),phaseMaterial(k,{roughness:.72,metalness:0,envMapIntensity:.35}));cap.userData.phase=k;this.capMeshes[k]=cap;this.network.add(cap);
  }
  this.buildInterface();
  this.ray=new T.Raycaster();this.pointer=new T.Vector2();this.dpr=Math.min(devicePixelRatio,1.75);this.installEvents();
  new ResizeObserver(()=>this.resize()).observe(canvas);
  this.observer=new IntersectionObserver(e=>{this.active=e[0].isIntersecting;if(this.active)this.wake();else this.stop();});this.observer.observe(canvas);
  document.addEventListener('visibilitychange',()=>{this.visible=!document.hidden;this.last=0;if(this.visible)this.wake();else this.stop();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.stop();this.cb.onFailure();});this.resize();
 }
 lighting(){
  // Neutral studio light keeps grey carbon grey and blue cathode blue; the room stays dark.
  const studio=new T.Scene();studio.background=new T.Color(0x15181f);
  for(const [p,w,h,c,power] of [[[0,8,5],7,10,0xffffff,2.2],[[-8,1,1],6,9,0xc9d6ff,1.1],[[4,4,-7],6,10,0xfff1e2,1.8],[[4,-5,3],5,3,0x8090a8,.4]]){const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:c,side:T.DoubleSide}));m.material.color.multiplyScalar(power);m.position.set(...p);m.lookAt(0,0,0);studio.add(m);}
  const pmrem=new T.PMREMGenerator(this.renderer);this.environment=pmrem.fromScene(studio,.04);this.scene.environment=this.environment.texture;pmrem.dispose();studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
  this.scene.add(new T.HemisphereLight(0xe4ebff,0x15171d,.32));
  const key=new T.DirectionalLight(0xffffff,1.3);key.position.set(5,10,8);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-6,right:6,top:6,bottom:-6,near:.1,far:40});key.shadow.bias=-.00015;key.shadow.normalBias=.015;
  const fill=new T.DirectionalLight(0xb9c8ff,.55);fill.position.set(-9,3,3);
  const rim=new T.DirectionalLight(0xfff0de,1.25);rim.position.set(3,5,-9);
  this.scene.add(key,fill,rim);
 }
 buildInterface(){
  // Enlarged local wall: same identities and order as the network (carbon | SEI | PAQEDOT).
  this.layers={carbon:[-1.05,-.32],sei:[-.32,-.13],cathode:[-.13,.55]};
  for(const [k,[lo,hi]] of Object.entries(this.layers)){
   const mesh=new T.Mesh(patchGeometry(lo,hi),phaseMaterial(k));mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.phase=k;this.localMeshes[k]=mesh;this.local.add(mesh);
   const slab=new T.Mesh(new T.BoxGeometry(5.4,hi-lo,3.5),phaseMaterial(k));slab.position.y=(lo+hi)/2;slab.castShadow=true;slab.receiveShadow=true;slab.userData.phase=k;this.slabMeshes[k]=slab;this.slab.add(slab);
  }
  // External circuit drawn as a fine wire from the carbon's tab to the polymer's tab.
  const wireMat=new T.MeshStandardMaterial({color:linear(0xb9c3d6),metalness:.7,roughness:.3});
  const route=[[-2.65,-.7,0],[-3.25,-.7,0],[-3.25,1.65,0],[-2.25,1.65,0],[-1.6,1.65,0],[-1.6,.62,0]];
  this.circuit=new T.CatmullRomCurve3(route.map(p=>new T.Vector3(...p)),false,'catmullrom',.05);
  this.local.add(new T.Mesh(new T.TubeGeometry(this.circuit,120,.042,10,false),wireMat));
  for(const [x,y,k] of [[-2.72,-.7,'carbon'],[-1.6,.6,'cathode']]){const tab=new T.Mesh(new T.BoxGeometry(.2,.12,.36),phaseMaterial(k,{roughness:.4}));tab.position.set(x,y,0);this.local.add(tab);}
  this.ions=[];this.electrons=[];
  const ionMat=new T.MeshStandardMaterial({color:linear(0xf3c36a),emissive:linear(0x6d4a12),emissiveIntensity:.5,metalness:.2,roughness:.3});
  for(let i=0;i<3;i++){const o=new T.Mesh(new T.SphereGeometry(.1,20,14),ionMat);this.local.add(o);this.ions.push(o);}
  const eMat=new T.MeshBasicMaterial({color:0xe6eeff});for(let i=0;i<9;i++){const o=new T.Mesh(new T.SphereGeometry(.045,12,8),eMat);this.local.add(o);this.electrons.push(o);}
 }
 async load(){
  const request=async name=>{const r=await fetch(BASE+name);if(!r.ok)throw Error('Missing geometry '+name);return r;};
  this.meta=await (await request('geometry.json')).json();
  const results=await Promise.all(['carbon','cathode','sei'].map(async name=>[name,fromBinary(await (await request(name+'.bin')).arrayBuffer())]));
  this.field=new Float32Array(await (await request('field.bin')).arrayBuffer());
  for(const [name,g] of results)this.addMesh(name,g);
  this.ready=true;this.resize();return this.meta;
 }
 addMesh(name,g){
  const phase=name==='deposited'?'cathode':name,m=new T.Mesh(g,this.materials[phase].clone());
  m.material.clippingPlanes=[this.clip];m.userData.phase=phase;m.castShadow=true;m.receiveShadow=true;this.meshes[name]=m;this.network.add(m);
 }
 resize(){const r=this.canvas.parentElement.getBoundingClientRect();if(r.width<10||r.height<10)return;this.width=r.width;this.height=r.height;this.renderer.setPixelRatio(this.dpr);this.renderer.setSize(r.width,r.height,false);this.updateCamera();if(this.ready&&this.visible)this.renderNow();this.cb.onResize?.(this);this.wake();}
 // Orthographic camera: the half height in world units is widened on narrow stages.
 halfHeightFor(p){return p.halfHeight*Math.max(1,.98/(this.width/this.height));}
 basis(p=this.pose){const ce=Math.cos(p.elevation),se=Math.sin(p.elevation),cy=Math.cos(p.yaw),sy=Math.sin(p.yaw);return {forward:new T.Vector3(sy*ce,se,cy*ce),right:new T.Vector3(cy,0,-sy),up:new T.Vector3(-sy*se,ce,-cy*se)};}
 updateCamera(camera=this.camera,p=this.pose){const a=this.width/this.height,h=this.halfHeightFor(p);Object.assign(camera,{left:-h*a,right:h*a,top:h,bottom:-h});camera.updateProjectionMatrix();const {forward}=this.basis(p);camera.position.set(...p.target).addScaledVector(forward,30);camera.up.set(0,1,0);camera.lookAt(...p.target);camera.updateMatrixWorld();}
 project(p,pose){const camera=pose?this.camera.clone():this.camera;if(pose)this.updateCamera(camera,pose);const v=new T.Vector3(...p).project(camera);return {x:(v.x+1)*this.width/2,y:(1-v.y)*this.height/2,z:v.z};}
 // Screen box of the sample cube from a given pose (used to register printed cubes).
 sampleBox(pose){const xs=[],ys=[];for(const x of [-3,3])for(const y of [-3,3])for(const z of [-3,3]){const p=this.project([x,y,z],pose);xs.push(p.x);ys.push(p.y);}return {x0:Math.min(...xs),y0:Math.min(...ys),x1:Math.max(...xs),y1:Math.max(...ys)};}
 worldPerPixel(p=this.pose){return 2*this.halfHeightFor(p)/this.height;}
 moveTo(pose,duration=900){let yaw=pose.yaw;while(yaw-this.pose.yaw>Math.PI)yaw-=Math.PI*2;while(yaw-this.pose.yaw< -Math.PI)yaw+=Math.PI*2;this.travel={from:structuredClone(this.pose),to:{...structuredClone(pose),yaw},start:performance.now(),duration:this.state?.reduced?0:duration};this.wake();}
 homePose(){if(this.state?.deep)return this.deep.home(this.state.deep.topic);return this.state?.view==='interface'?{yaw:.34,elevation:.26,halfHeight:3.15,target:[.1,.3,0]}:this.state?.architecture==='layered'&&this.state?.view==='architecture'?{yaw:.65,elevation:.45,halfHeight:3.6,target:[0,0,0]}:structuredClone(HOME);}
 home(){this.resize();this.moveTo(this.homePose());}
 async ensureMesh(name){
  this.pending??={};if(this.meshes[name])return;if(this.pending[name])return this.pending[name];
  this.cb.onLoading?.(true);this.pending[name]=(async()=>{const r=await fetch(BASE+name+'.bin');if(!r.ok)throw Error('Missing '+name);this.addMesh(name,fromBinary(await r.arrayBuffer()));})();
  try{await this.pending[name];this.setState(this.state);}catch(e){this.cb.onFailure(e);}finally{this.cb.onLoading?.(false);}
 }
 geometryState(s=this.state){return s.deep?{...s,view:'architecture',architecture:'network',layer:'all',route:null,cut:s.deep.topic==='connectivity'?2*(1-s.deep.slice/40):0}:s;}
 setState(s){
  const previous=this.state;this.state=s;if(!this.ready)return;
  const hold=x=>showingPaper(x)||x.paused;
  if(hold(s)&&!(previous&&hold(previous)))this.holdAt=performance.now();
  if(!hold(s)&&previous&&hold(previous)){const delay=performance.now()-this.holdAt;if(this.travel)this.travel.start+=delay;for(const f of this.fades)f.start+=delay;}
  const real=s;this.deep??=real.deep?new DepthScene(this):null;this.deep?.update(real.deep);
  s=this.geometryState(s);const prior=previous&&this.geometryState(previous);
  const connectivity=real.deep?.topic==='connectivity';
  this.network.position.x=connectivity?-2.15:0;this.network.scale.setScalar(connectivity?.66:1);
  const local=!real.deep&&s.view==='interface',slab=!real.deep&&s.view==='architecture'&&s.architecture==='layered';
  this.network.visible=(!real.deep||connectivity)&&!local&&!slab;this.local.visible=local;this.slab.visible=slab;
  // Figure 2 colours for the co-assembled hybrid: the blue resol-rich domain becomes carbon.
  const hybrid=s.view==='fabrication'&&s.stage==='hybrid';
  for(const m of [this.meshes.carbon,this.capMeshes.carbon])if(m)m.material.color.copy(linear(PHASES[hybrid?'precursor':'carbon'].color));
  const names=meshNames(s),show=k=>s.layer==='all'||s.layer===k;for(const name of names)if(!this.meshes[name])this.ensureMesh(name);
  for(const [name,m] of Object.entries(this.meshes))this.visibility(m,names.includes(name)&&show(m.userData.phase),previous);
  for(const [k,m] of Object.entries(this.localMeshes))m.visible=show(k);
  for(const [k,m] of Object.entries(this.slabMeshes))m.visible=show(k);
  this.clip.constant=(3.005-s.cut*3)*this.network.scale.x;
  if(!prior||prior.cut!==s.cut||prior.stage!==s.stage||prior.view!==s.view||prior.architecture!==s.architecture||!!real.deep!==!!previous?.deep)this.makeCap();else for(const [k,m] of Object.entries(this.capMeshes))m.visible=s.cut>0&&show(k)&&m.userData.used;
  if(real.route!==previous?.route)this.makeRoute();
  if(this.routeGroup)this.routeGroup.visible=!real.deep;
  if(previous&&(real.view!==previous.view||real.architecture!==previous.architecture||real.deep?.topic!==previous.deep?.topic||!!real.deep!==!!previous.deep))this.home();
  this.updateMarkers(this.time);this.wake();
 }
 visibility(mesh,on,previous){
  if(mesh.userData.targetVisible===on)return;mesh.userData.targetVisible=on;
  this.fades=this.fades.filter(f=>f.mesh!==mesh);
  if(!previous||this.state.reduced){mesh.visible=on;mesh.material.opacity=1;mesh.material.transparent=false;return;}
  const from=mesh.visible?mesh.material.opacity:0;mesh.visible=true;mesh.material.transparent=true;mesh.material.depthWrite=true;this.fades.push({mesh,from,to:on?1:0,start:performance.now()});
 }
 makeCap(){
  const s=this.geometryState(),m=this.meta,n=m.n,z=3-s.cut*3;const kz=(z+3)/m.step,k0=clamp(Math.floor(kz),0,n-2),alpha=clamp(kz-k0,0,1),sample=(i,j)=>this.field[(i*n+j)*n+k0]*(1-alpha)+this.field[(i*n+j)*n+k0+1]*alpha;
  const arrays=Object.fromEntries(Object.keys(this.capMeshes).map(k=>[k,[]]));
  if(s.cut>0&&this.network.visible){const regions=intervals(s,m);for(let i=0;i<n-1;i++)for(let j=0;j<n-1;j++){
   const xy=(a,b)=>[-3+a*m.step,-3+b*m.step,sample(a,b)],p=[xy(i,j),xy(i+1,j),xy(i+1,j+1),xy(i,j+1)];
   for(const tri of [[p[0],p[1],p[2]],[p[0],p[2],p[3]]])for(const [name,lo,hi] of regions){let poly=clipScalar(tri,lo,true);poly=clipScalar(poly,hi,false);for(let t=1;t<poly.length-1;t++)for(const v of [poly[0],poly[t],poly[t+1]])arrays[name].push(v[0],v[1],z+.002);}
  }}
  for(const [k,mesh] of Object.entries(this.capMeshes)){mesh.geometry.dispose();const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(arrays[k],3));g.computeVertexNormals();mesh.geometry=g;mesh.userData.used=arrays[k].length>0;mesh.visible=s.cut>0&&(s.layer==='all'||s.layer===k)&&mesh.userData.used;}
  const hybrid=s.view==='fabrication'&&s.stage==='hybrid';this.capMeshes.carbon.material.color.copy(linear(PHASES[hybrid?'precursor':'carbon'].color));
 }
 makeRoute(){
  if(this.routeGroup){this.network.remove(this.routeGroup);this.routeGroup.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});this.routeGroup=null;}
  if(!this.state.route)return;
  const points=this.meta.paths[this.state.route].map(p=>new T.Vector3(...p)),curve=new T.CurvePath();
  for(let i=1;i<points.length;i++)curve.add(new T.LineCurve3(points[i-1],points[i]));
  // Drawn over the material it travels through, so the hidden part of the route stays legible.
  const group=new T.Group(),mat=new T.MeshBasicMaterial({color:0xffe2a8,depthTest:false,depthWrite:false,transparent:true,opacity:.95});
  group.add(new T.Mesh(new T.TubeGeometry(curve,points.length*3,.045,8,false),mat));
  for(const p of [points[0],points.at(-1)]){const end=new T.Mesh(new T.SphereGeometry(.11,16,12),mat.clone());end.position.copy(p);group.add(end);}
  group.renderOrder=5;group.traverse(o=>o.renderOrder=5);this.routeGroup=group;this.network.add(group);
 }
 updateMarkers(t){
  // Discharge: Li⁺ crosses carbon → SEI → PAQEDOT; electrons leave carbon, travel the
  // external wire and enter the polymer. Speeds are illustrative, not physical.
  const [cLo,cHi]=this.layers.carbon,pHi=this.layers.cathode[1];
  this.ions.forEach((m,i)=>{const q=(t*.11+i/3)%1,x=-.6+i*1.25,z=1.72;m.position.set(x,cLo+.2+q*(pHi-cLo-.42)+wallHeight(x,z),z);m.visible=this.state?.layer==='all';});
  this.electrons.forEach((m,i)=>{const lane=Math.floor(i/3),q=(t*.09+(i%3)/3)%1;let p;
   if(lane===0){const x=1.9-q*4.4,z=1.72;p=[x,-.72+wallHeight(x,z),z];}
   else if(lane===1){const c=this.circuit.getPoint(q);p=[c.x,c.y,c.z];}
   else{const x=-1.4+q*3.3,z=1.72;p=[x,.22+wallHeight(x,z),z];}
   m.position.set(...p);m.visible=this.state?.layer==='all'||(lane===0&&this.state?.layer==='carbon')||(lane===2&&this.state?.layer==='cathode');});
   }
 interrupt(){this.travel=null;this.cb.onInterrupt();}
 turn(dx,dy){this.interrupt();this.pose=orbit(this.pose,dx,dy);this.updateCamera();this.wake();}
 zoom(f){this.interrupt();this.moveTo({...this.pose,halfHeight:clamp(this.pose.halfHeight*f,2,7.5)},220);}
 pick(x,y){
  if(!this.ready||this.state.deep)return;const r=this.canvas.getBoundingClientRect();this.pointer.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);
  const targets=this.state.view==='interface'?Object.values(this.localMeshes):this.state.architecture==='layered'&&this.state.view==='architecture'?Object.values(this.slabMeshes):[...Object.values(this.meshes),...Object.values(this.capMeshes)];
  const hit=this.ray.intersectObjects(targets.filter(m=>m.visible)).find(h=>!this.network.visible||h.point.z<=this.clip.constant+.003);if(hit)this.cb.onSelect(hit.object.userData.phase);
 }
 installEvents(){
  const c=this.canvas;
  c.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary)return;this.drag={id:e.pointerId,x:e.clientX,y:e.clientY,lx:e.clientX,ly:e.clientY,moved:false,locked:false,touch:e.pointerType==='touch'};if(e.pointerType!=='touch')c.setPointerCapture(e.pointerId);});
  c.addEventListener('pointermove',e=>{const d=this.drag;if(!d||d.id!==e.pointerId)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;
   if(!d.moved&&Math.hypot(dx,dy)>6){d.moved=true;if(d.touch&&Math.abs(dy)>Math.abs(dx)){this.drag=null;return;}d.locked=true;c.setPointerCapture(e.pointerId);this.interrupt();}
   if(d.locked){this.turn(e.clientX-d.lx,d.touch?0:e.clientY-d.ly);c.style.cursor='grabbing';}d.lx=e.clientX;d.ly=e.clientY;});
  const end=e=>{const d=this.drag;if(!d||d.id!==e.pointerId)return;this.drag=null;c.style.cursor='';if(c.hasPointerCapture(e.pointerId))c.releasePointerCapture(e.pointerId);if(e.type==='pointerup'&&!d.moved){this.interrupt();this.pick(e.clientX,e.clientY);}};
  c.addEventListener('pointerup',end);c.addEventListener('pointercancel',end);c.addEventListener('lostpointercapture',()=>{this.drag=null;c.style.cursor='';});
  c.addEventListener('keydown',e=>{const actions={ArrowLeft:()=>this.turn(-28,0),ArrowRight:()=>this.turn(28,0),ArrowUp:()=>this.turn(0,-28),ArrowDown:()=>this.turn(0,28),'+':()=>this.zoom(.85),'=':()=>this.zoom(.85),'-':()=>this.zoom(1.18),Home:()=>{this.interrupt();this.home();}};if(actions[e.key]){e.preventDefault();actions[e.key]();}});
 }
 // Presentation animators (paper emergence, process reveals) register here so that the
 // render loop keeps running only while something actually changes.
 animate(fn){this.animators.add(fn);this.wake();return ()=>this.animators.delete(fn);}
 renderNow(){this.updateCamera();this.renderer.render(this.scene,this.camera);}
 render=now=>{
  this.raf=0;if(!this.active||!this.visible||!this.ready||(showingPaper(this.state)&&!this.animators.size))return;
  const rawDt=this.last?(now-this.last)/1000:0,dt=Math.min(.25,rawDt);this.last=now;let changing=false;
  if(this.travel&&!this.state.paused){const p=this.travel,t=p.duration?clamp((now-p.start)/p.duration,0,1):1,u=ease(t);for(const key of ['yaw','elevation','halfHeight'])this.pose[key]=p.from[key]+u*(p.to[key]-p.from[key]);this.pose.target=p.from.target.map((v,i)=>v+u*(p.to.target[i]-v));if(t===1)this.travel=null;else changing=true;}
  if(!this.state.deep&&this.state.view==='interface'&&this.state.transport&&!this.state.reduced&&!this.state.paused){this.time+=dt;this.updateMarkers(this.time);changing=true;}
  for(const f of this.fades){const u=clamp((now-f.start)/240,0,1);f.mesh.material.opacity=f.from+(f.to-f.from)*ease(u);if(u===1){f.mesh.visible=f.to>0;f.mesh.material.transparent=false;f.mesh.material.opacity=1;}else changing=true;}
  this.fades=this.fades.filter(f=>now-f.start<240);
  for(const fn of [...this.animators])if(fn(now,dt))changing=true;else this.animators.delete(fn);
  if(this.deep?.tick(now,dt))changing=true;
  this.renderNow();
  const d=this.canvas.dataset;d.yaw=this.pose.yaw.toFixed(4);d.elevation=this.pose.elevation.toFixed(4);d.rendered='true';
  if(changing&&this.wasChanging&&rawDt>0){this.frameTimes.push(rawDt*1000);if(this.frameTimes.length>240)this.frameTimes.shift();if(this.frameTimes.length>30){d.fps=(1000/(this.frameTimes.reduce((a,b)=>a+b,0)/this.frameTimes.length)).toFixed(1);d.frameP95=[...this.frameTimes].sort((a,b)=>a-b)[Math.floor(this.frameTimes.length*.95)].toFixed(1);}}
  this.wasChanging=changing;this.cb.onFrame?.(this);if(changing)this.wake();
 };
 wake(){this.visible=!document.hidden;if(!this.active){const r=this.canvas.getBoundingClientRect();this.active=r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;}if(!this.raf&&this.active&&this.visible&&this.state&&(!showingPaper(this.state)||this.animators.size))this.raf=requestAnimationFrame(this.render);}
 stop(){cancelAnimationFrame(this.raf);this.raf=0;this.last=0;this.wasChanging=false;}
}
