import {DepthScene} from './self-separating-battery-depth-scene.mjs?v=2';
import {PHASES,orbit,ease,clamp,meshNames,intervals,clipScalar} from './self-separating-battery-model.mjs?v=2';
const T=window.THREE,BASE='assets/self-separating-battery/';
const HOME={yaw:.7,elevation:.39,halfHeight:4.7,target:[0,0,0]};
function fromBinary(buffer){const h=new Uint32Array(buffer,0,2),n=h[0],f=h[1],g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(buffer,8,n*3),3));g.setAttribute('normal',new T.BufferAttribute(new Float32Array(buffer,8+n*12,n*3),3));g.setIndex(new T.BufferAttribute(new Uint32Array(buffer,8+n*24,f*3),1));g.computeBoundingSphere();return g;}
function patchGeometry(low,high,w=5.3,d=3.3){
 const p=[],ids=[],nx=48,nz=30;
 const h=(x,z)=>.14*Math.sin(x*.83)+.13*Math.cos(z*1.1);
 for(const y of [low,high])for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++){const x=-w/2+w*i/nx,z=-d/2+d*j/nz;p.push(x,y+h(x,z),z);}
 const at=(layer,i,j)=>layer*(nx+1)*(nz+1)+i*(nz+1)+j;
 for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const a=at(0,i,j),b=at(0,i+1,j),c=at(0,i+1,j+1),dd=at(0,i,j+1),o=(nx+1)*(nz+1);ids.push(a,b,c,a,c,dd,a+o,c+o,b+o,a+o,dd+o,c+o);}
 for(let i=0;i<nx;i++)for(const j of [0,nz]){const a=at(0,i,j),b=at(0,i+1,j),c=at(1,i+1,j),dd=at(1,i,j);if(j===0)ids.push(a,dd,c,a,c,b);else ids.push(a,b,c,a,c,dd);}
 for(let j=0;j<nz;j++)for(const i of [0,nx]){const a=at(0,i,j),b=at(0,i,j+1),c=at(1,i,j+1),dd=at(1,i,j);if(i===0)ids.push(a,b,c,a,c,dd);else ids.push(a,dd,c,a,c,b);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ids);g.computeVertexNormals();return g;
}
export class NetworkScene{
 constructor(canvas,callbacks){
  this.canvas=canvas;this.cb=callbacks;this.pose=structuredClone(HOME);this.width=1;this.height=1;this.active=true;this.visible=!document.hidden;this.raf=0;this.time=0;this.last=0;this.frameTimes=[];this.materials={};this.meshes={};this.capMeshes={};this.localMeshes={};this.slabMeshes={};this.ready=false;this.travel=null;this.fades=[];
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance',preserveDrawingBuffer:true});this.renderer.outputEncoding=T.sRGBEncoding;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.94;this.renderer.setClearColor(0x080a12,0);this.renderer.localClippingEnabled=true;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
  this.scene=new T.Scene();this.camera=new T.OrthographicCamera(-5,5,5,-5,.1,100);this.network=new T.Group();this.local=new T.Group();this.slab=new T.Group();this.scene.add(this.network,this.local,this.slab);this.local.visible=false;this.slab.visible=false;
  this.clip=new T.Plane(new T.Vector3(0,0,-1),3.01);
  const studio=new T.Scene();studio.background=new T.Color(0x182039);
  for(const [p,w,h,c,power] of [[[0,8,5],6,10,0xe6edff,2.3],[[-8,1,1],7,9,0xbecfff,1.5],[[4,4,-7],6,10,0xe4d8ff,2.2],[[4,-5,3],5,3,0x7b8eaf,.5]]){const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:c,side:T.DoubleSide}));m.material.color.multiplyScalar(power);m.position.set(...p);m.lookAt(0,0,0);studio.add(m);}
  const pmrem=new T.PMREMGenerator(this.renderer);this.environment=pmrem.fromScene(studio,.04);this.scene.environment=this.environment.texture;pmrem.dispose();studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
  this.scene.add(new T.HemisphereLight(0xc5d5ff,0x161b29,.45));
  for(const [p,c,power] of [[[4,9,8],0xe2e9ff,1.5],[[-8,3,2],0xaebfff,.7],[[3,4,-8],0xe0d4ff,1.7]]){const l=new T.DirectionalLight(c,power);l.position.set(...p);if(p[0]===4){l.castShadow=true;l.shadow.mapSize.set(1024,1024);Object.assign(l.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.1,far:35});l.shadow.bias=-.00015;l.shadow.normalBias=.015;}this.scene.add(l);}
  for(const [k,s] of Object.entries(PHASES)){this.materials[k]=new T.MeshStandardMaterial({color:new T.Color(s.color).convertSRGBToLinear(),metalness:k==='carbon'?.38:.22,roughness:k==='carbon'?.43:.34,envMapIntensity:.3,side:T.DoubleSide,clippingPlanes:[this.clip],clipShadows:true});this.capMeshes[k]=new T.Mesh(new T.BufferGeometry(),new T.MeshStandardMaterial({color:new T.Color(s.color).convertSRGBToLinear(),metalness:.12,roughness:.6,side:T.DoubleSide}));this.capMeshes[k].userData.phase=k;this.network.add(this.capMeshes[k]);}
  // An enlarged local interface, with the same material identities and layer order.
  for(const [k,lo,hi] of [['carbon',-1.05,-.32],['sei',-.32,-.15],['cathode',-.15,.55]]){
   const mat=this.materials[k].clone();mat.clippingPlanes=[];const mesh=new T.Mesh(patchGeometry(lo,hi),mat);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.phase=k;this.localMeshes[k]=mesh;this.local.add(mesh);
   const sm=new T.Mesh(new T.BoxGeometry(5.4,hi-lo,3.5),mat.clone());sm.position.y=(lo+hi)/2;sm.castShadow=true;sm.receiveShadow=true;sm.userData.phase=k;this.slabMeshes[k]=sm;this.slab.add(sm);
  }
  this.ions=[];this.electrons=[];
  const ionMat=new T.MeshStandardMaterial({color:new T.Color(0xffc766).convertSRGBToLinear(),emissive:0x765221,emissiveIntensity:.4,metalness:.3,roughness:.25});
  for(let i=0;i<1;i++){const o=new T.Mesh(new T.SphereGeometry(.115,20,14),ionMat);this.local.add(o);this.ions.push(o);}
  const eMat=new T.MeshBasicMaterial({color:0xe2eaff});for(let i=0;i<6;i++){const o=new T.Mesh(new T.SphereGeometry(.047,12,8),eMat);this.local.add(o);this.electrons.push(o);}
  this.ray=new T.Raycaster();this.pointer=new T.Vector2();this.dpr=Math.min(devicePixelRatio,1.7);this.installEvents();new ResizeObserver(()=>this.resize()).observe(canvas);this.observer=new IntersectionObserver(e=>{this.active=e[0].isIntersecting;if(this.active)this.wake();else this.stop();});this.observer.observe(canvas);
  document.addEventListener('visibilitychange',()=>{this.visible=!document.hidden;this.last=0;if(this.visible)this.wake();else this.stop();});canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.stop();this.cb.onFailure();});this.resize();
 }
 async load(){
  const request=async name=>{const r=await fetch(BASE+name);if(!r.ok)throw Error('Missing geometry '+name);return r;};
  this.meta=await (await request('geometry.json')).json();
  const results=await Promise.all(['carbon','cathode','sei'].map(async name=>[name,fromBinary(await (await request(name+'.bin')).arrayBuffer())]));
  this.field=new Float32Array(await (await request('field.bin')).arrayBuffer());
  for(const [name,g] of results){const m=new T.Mesh(g,this.materials[name==='deposited'?'cathode':name].clone());m.material.clippingPlanes=[this.clip];m.userData.phase=name==='deposited'?'cathode':name;m.castShadow=true;m.receiveShadow=true;this.meshes[name]=m;this.network.add(m);}
  this.ready=true;this.resize();return this.meta;
 }
 resize(){const r=this.canvas.parentElement.getBoundingClientRect();if(r.width<10||r.height<10)return;this.width=r.width;this.height=r.height;this.renderer.setPixelRatio(this.dpr);this.renderer.setSize(r.width,r.height,false);this.updateCamera();if(this.ready&&this.visible)this.renderer.render(this.scene,this.camera);this.wake();}
 updateCamera(){const p=this.pose,a=this.width/this.height,h=p.halfHeight*Math.max(1,.98/a);Object.assign(this.camera,{left:-h*a,right:h*a,top:h,bottom:-h});this.camera.updateProjectionMatrix();this.camera.position.set(p.target[0]+30*Math.sin(p.yaw)*Math.cos(p.elevation),p.target[1]+30*Math.sin(p.elevation),p.target[2]+30*Math.cos(p.yaw)*Math.cos(p.elevation));this.camera.lookAt(...p.target);this.camera.updateMatrixWorld();}
 project(p){const v=new T.Vector3(...p).project(this.camera);return {x:(v.x+1)*this.width/2,y:(1-v.y)*this.height/2,z:v.z};}
 moveTo(pose,duration=900){let yaw=pose.yaw;while(yaw-this.pose.yaw>Math.PI)yaw-=Math.PI*2;while(yaw-this.pose.yaw< -Math.PI)yaw+=Math.PI*2;this.travel={from:structuredClone(this.pose),to:{...pose,yaw},start:performance.now(),duration:this.state?.reduced?0:duration};this.wake();}
 home(){if(this.state?.deep){this.moveTo(this.deep.home(this.state.deep.topic));return;}this.moveTo(this.state?.view==='interface'?{yaw:.65,elevation:.36,halfHeight:3.45,target:[0,-.1,0]}:this.state?.architecture==='layered'?{yaw:.65,elevation:.45,halfHeight:3.6,target:[0,0,0]}:structuredClone(HOME));}
 async ensureMesh(name){
  this.pending??={};if(this.meshes[name])return;if(this.pending[name])return this.pending[name];
  this.cb.onLoading?.(true);this.pending[name]=(async()=>{const r=await fetch(BASE+name+'.bin');if(!r.ok)throw Error('Missing '+name);const g=fromBinary(await r.arrayBuffer()),m=new T.Mesh(g,this.materials[name==='deposited'?'cathode':name].clone());m.material.clippingPlanes=[this.clip];m.userData.phase=name==='deposited'?'cathode':name;m.castShadow=true;m.receiveShadow=true;this.meshes[name]=m;this.network.add(m);})();
  try{await this.pending[name];this.setState(this.state);}catch(e){this.cb.onFailure(e);}finally{this.cb.onLoading?.(false);}
 }
 setState(s){const previous=this.state;this.state=s;if(!this.ready)return;
  if((s.paper||s.paused)&&!(previous?.paper||previous?.paused))this.holdAt=performance.now();if(!(s.paper||s.paused)&&(previous?.paper||previous?.paused)){const delay=performance.now()-this.holdAt;if(this.travel)this.travel.start+=delay;for(const f of this.fades)f.start+=delay;}

  const real=s,prior=previous;this.deep??=real.deep?new DepthScene(this):null;this.deep?.update(real.deep);
  s=this.geometryState(s);const previousGeometry=previous?this.geometryState(previous):previous;
  this.network.position.x=real.deep?.topic==='connectivity'?-2.15:0;this.network.scale.setScalar(real.deep?.topic==='connectivity'?.66:1);
  const local=!real.deep&&s.view==='interface',slab=!real.deep&&s.view==='architecture'&&s.architecture==='layered';this.network.visible=(!real.deep||real.deep.topic==='connectivity')&&!local&&!slab;this.local.visible=local;this.slab.visible=slab;
  const names=meshNames(s),show=k=>s.layer==='all'||s.layer===k;for(const name of names)if(!this.meshes[name])this.ensureMesh(name);
  for(const [name,m] of Object.entries(this.meshes))this.visibility(m,names.includes(name)&&show(m.userData.phase),previous);
  for(const [k,m] of Object.entries(this.localMeshes))m.visible=show(k);
  for(const [k,m] of Object.entries(this.slabMeshes))m.visible=show(k);
  this.clip.constant=(3.005-s.cut*3)*this.network.scale.x;if(!previousGeometry||previousGeometry.cut!==s.cut||previousGeometry.stage!==s.stage||previousGeometry.view!==s.view||previousGeometry.architecture!==s.architecture||!!real.deep!==!!prior?.deep)this.makeCap();else for(const [k,m] of Object.entries(this.capMeshes))m.visible=s.cut>0&&show(k);
  if(real.route!==previous?.route)this.makeRoute();
  if(this.routeMesh)this.routeMesh.visible=!real.deep;
  if(previous&&(real.view!==previous.view||real.architecture!==previous.architecture||real.deep?.topic!==previous.deep?.topic))this.home();
  this.updateMarkers(this.time);
  this.wake();
 }
 visibility(mesh,on,previous){
  if(mesh.userData.targetVisible===on)return;mesh.userData.targetVisible=on;
  this.fades=this.fades.filter(f=>f.mesh!==mesh);
  if(!previous||this.state.reduced){mesh.visible=on;mesh.material.opacity=1;mesh.material.transparent=false;return;}
  const from=mesh.visible?mesh.material.opacity:0;mesh.visible=true;mesh.material.transparent=true;this.fades.push({mesh,from,to:on?1:0,start:performance.now()});
 }
 geometryState(s=this.state){return s.deep?{...s,view:'architecture',architecture:'network',layer:'all',route:null,cut:s.deep.topic==='connectivity'?2*(1-s.deep.slice/40):0}:s;}
 makeCap(){
  const s=this.geometryState(),m=this.meta,n=m.n,z=3-s.cut*3;const kz=(z+3)/m.step,k0=clamp(Math.floor(kz),0,n-2),alpha=clamp(kz-k0,0,1),sample=(i,j)=>this.field[(i*n+j)*n+k0]*(1-alpha)+this.field[(i*n+j)*n+k0+1]*alpha;
  const arrays=Object.fromEntries(Object.keys(PHASES).map(k=>[k,[]]));
  if(s.cut>0&&this.network.visible){const regions=intervals(s,m);for(let i=0;i<n-1;i++)for(let j=0;j<n-1;j++){
   const xy=(a,b)=>[-3+a*m.step,-3+b*m.step,sample(a,b)],p=[xy(i,j),xy(i+1,j),xy(i+1,j+1),xy(i,j+1)];
   for(const tri of [[p[0],p[1],p[2]],[p[0],p[2],p[3]]])for(const [name,lo,hi] of regions){let poly=clipScalar(tri,lo,true);poly=clipScalar(poly,hi,false);for(let t=1;t<poly.length-1;t++)for(const v of [poly[0],poly[t],poly[t+1]])arrays[name].push(v[0],v[1],z+.002);}
  }}
  for(const [k,mesh] of Object.entries(this.capMeshes)){mesh.geometry.dispose();const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(arrays[k],3));g.computeVertexNormals();mesh.geometry=g;mesh.visible=s.cut>0&&(s.layer==='all'||s.layer===k);}
 }
 makeRoute(){if(this.routeMesh){this.network.remove(this.routeMesh);this.routeMesh.geometry.dispose();this.routeMesh.material.dispose();this.routeMesh=null;}if(!this.state.route)return;const points=this.meta.paths[this.state.route].map(p=>new T.Vector3(...p));const curve=new T.CurvePath();for(let i=1;i<points.length;i++)curve.add(new T.LineCurve3(points[i-1],points[i]));const mat=new T.MeshBasicMaterial({color:0xf5e2b9,clippingPlanes:[this.clip],depthTest:false,depthWrite:false});this.routeMesh=new T.Mesh(new T.TubeGeometry(curve,points.length*2,.035,6,false),mat);this.routeMesh.renderOrder=5;this.routeMesh.userData.phase=this.state.route;this.network.add(this.routeMesh);}
 updateMarkers(t){
  for(let i=0;i<this.ions.length;i++){const m=this.ions[i],q=((t*.12+i/3)%1),x=0,z=1.76;const h=.14*Math.sin(x*.83)+.13*Math.cos(z*1.1);m.position.set(x,1.1-q*2.65+h,z);m.visible=this.state?.layer==='all';}
  for(let i=0;i<this.electrons.length;i++){const top=i<3,q=(t*.1+i/3)%1,x=top?2.45-q*4.9:-2.45+q*4.9,z=1.74,y=top?.23:-.72,h=.14*Math.sin(x*.83)+.13*Math.cos(z*1.1);this.electrons[i].position.set(x,y+h,z);this.electrons[i].visible=this.state?.layer==='all'||this.state?.layer===(top?'cathode':'carbon');}
 }
 interrupt(){this.travel=null;this.cb.onInterrupt();}
 turn(dx,dy){this.interrupt();this.pose=orbit(this.pose,dx,dy);this.updateCamera();this.wake();}
 zoom(f){this.interrupt();this.moveTo({...this.pose,halfHeight:clamp(this.pose.halfHeight*f,2,7)},220);}
 pick(x,y){if(!this.ready||this.state.deep)return;const r=this.canvas.getBoundingClientRect();this.pointer.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);const targets=this.state.view==='interface'?Object.values(this.localMeshes):this.state.architecture==='layered'&&this.state.view==='architecture'?Object.values(this.slabMeshes):[...Object.values(this.meshes),...Object.values(this.capMeshes)];const hit=this.ray.intersectObjects(targets.filter(m=>m.visible)).find(h=>!this.network.visible||h.point.z<=this.clip.constant+.003);if(hit)this.cb.onSelect(hit.object.userData.phase);}
 installEvents(){const c=this.canvas;c.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary)return;this.drag={id:e.pointerId,x:e.clientX,y:e.clientY,lx:e.clientX,ly:e.clientY,moved:false,locked:false,touch:e.pointerType==='touch'};if(e.pointerType!=='touch')c.setPointerCapture(e.pointerId);});c.addEventListener('pointermove',e=>{const d=this.drag;if(!d||d.id!==e.pointerId)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;if(!d.moved&&Math.hypot(dx,dy)>6){d.moved=true;if(d.touch&&Math.abs(dy)>Math.abs(dx)){this.drag=null;return;}d.locked=true;c.setPointerCapture(e.pointerId);this.interrupt();}if(d.locked){this.turn(e.clientX-d.lx,d.touch?0:e.clientY-d.ly);c.style.cursor='grabbing';}d.lx=e.clientX;d.ly=e.clientY;});const end=e=>{const d=this.drag;if(!d||d.id!==e.pointerId)return;this.drag=null;c.style.cursor='grab';if(c.hasPointerCapture(e.pointerId))c.releasePointerCapture(e.pointerId);if(e.type==='pointerup'&&!d.moved){this.interrupt();this.pick(e.clientX,e.clientY);}};c.addEventListener('pointerup',end);c.addEventListener('pointercancel',end);c.addEventListener('lostpointercapture',()=>{this.drag=null;c.style.cursor='grab';});c.addEventListener('keydown',e=>{const actions={ArrowLeft:()=>this.turn(-28,0),ArrowRight:()=>this.turn(28,0),ArrowUp:()=>this.turn(0,-28),ArrowDown:()=>this.turn(0,28),'+':()=>this.zoom(.85),'=':()=>this.zoom(.85),'-':()=>this.zoom(1.18),Home:()=>{this.interrupt();this.home();}};if(actions[e.key]){e.preventDefault();actions[e.key]();}});}
 render=(now)=>{
  this.raf=0;if(!this.active||!this.visible||!this.ready||this.state?.paper)return;const rawDt=this.last?(now-this.last)/1000:0,dt=Math.min(.05,rawDt);this.last=now;let changing=false;
  if(this.travel&&!this.state.paused){const p=this.travel,t=p.duration?clamp((now-p.start)/p.duration,0,1):1,u=ease(t);for(const key of ['yaw','elevation','halfHeight'])this.pose[key]=p.from[key]+u*(p.to[key]-p.from[key]);this.pose.target=p.from.target.map((v,i)=>v+u*(p.to.target[i]-v));if(t===1)this.travel=null;else changing=true;}
  if(!this.state?.deep&&this.state?.view==='interface'&&this.state.transport&&!this.state.reduced){this.time+=dt;this.updateMarkers(this.time);changing=true;}
  for(const f of this.fades){const u=clamp((now-f.start)/240,0,1);f.mesh.material.opacity=f.from+(f.to-f.from)*ease(u);if(u===1){f.mesh.visible=f.to>0;f.mesh.material.transparent=false;f.mesh.material.opacity=1;}else changing=true;}this.fades=this.fades.filter(f=>now-f.start<240);
  if(this.deep?.tick(now))changing=true;
  this.updateCamera();this.renderer.render(this.scene,this.camera);this.canvas.dataset.yaw=this.pose.yaw.toFixed(4);this.canvas.dataset.elevation=this.pose.elevation.toFixed(4);this.canvas.dataset.rendered='true';if(changing&&this.wasChanging&&rawDt>0){this.frameTimes.push(rawDt*1000);if(this.frameTimes.length>180)this.frameTimes.shift();if(this.frameTimes.length>30){this.canvas.dataset.fps=(1000/(this.frameTimes.reduce((a,b)=>a+b,0)/this.frameTimes.length)).toFixed(1);this.canvas.dataset.frameP95=[...this.frameTimes].sort((a,b)=>a-b)[Math.floor(this.frameTimes.length*.95)].toFixed(1);}}this.wasChanging=changing;this.cb.onFrame?.(this);if(changing)this.wake();
 };
 wake(){this.visible=!document.hidden;if(!this.active){const r=this.canvas.getBoundingClientRect();this.active=r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;}if(!this.raf&&this.active&&this.visible&&!this.state?.paper)this.raf=requestAnimationFrame(this.render);}
 stop(){cancelAnimationFrame(this.raf);this.raf=0;this.last=0;this.wasChanging=false;}
}
