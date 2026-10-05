import {LENGTH,TAU,HOME,section,outer,core,zAt,orbit,ease,clamp} from './silicon-nanowire-model.mjs';
const T=window.THREE,linear=hex=>new T.Color(hex).convertSRGBToLinear();
const colors={core:0x4b6386,shell:0x8f6748,li0:0x285fc2,li1:0xf1ab54,muted:0x8290a5};
export class WireScene{
 constructor(canvas,callbacks={}){
  this.canvas=canvas;this.cb=callbacks;this.pose={...HOME};this.width=1;this.height=1;this.animators=new Set();this.active=true;this.raf=0;this.last=0;this.frameTimes=[];this.dpr=Math.min(devicePixelRatio,1.75);
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
  this.renderer.outputEncoding=T.sRGBEncoding;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.86;this.renderer.localClippingEnabled=true;
  this.scene=new T.Scene();this.camera=new T.OrthographicCamera(-10,10,6,-6,.1,150);
  this.group=new T.Group();this.scene.add(this.group);this.clip=new T.Plane(new T.Vector3(0,-1,0),0);this.clipX=new T.Plane(new T.Vector3(-1,0,0),0);
  this.light();
  this.shellMat=new T.MeshStandardMaterial({color:linear(colors.shell),metalness:.42,roughness:.31,side:T.DoubleSide,clippingPlanes:[this.clip,this.clipX],clipIntersection:true});
  this.coreMat=new T.MeshStandardMaterial({color:linear(colors.core),metalness:.30,roughness:.4,side:T.DoubleSide,clippingPlanes:[this.clip,this.clipX],clipIntersection:true});
  // At the pristine front core and outer surface coincide: resolve depth without changing coordinates.
  this.coreMat.polygonOffset=true;this.coreMat.polygonOffsetFactor=-1;this.coreMat.polygonOffsetUnits=-1;
  this.capShellMat=this.shellMat.clone();this.capShellMat.clippingPlanes=[];this.capShellMat.roughness=.78;this.capShellMat.metalness=.08;
  this.capCoreMat=this.coreMat.clone();this.capCoreMat.clippingPlanes=[];this.capCoreMat.roughness=.72;this.capCoreMat.metalness=.08;
  for(const [key,mat] of [['shell',this.shellMat],['core',this.coreMat],['cutShell',this.capShellMat],['cutCore',this.capCoreMat],['endShell',this.capShellMat],['endCore',this.capCoreMat],['cutSideShell',this.capShellMat],['cutSideCore',this.capCoreMat]]){this[key]=new T.Mesh(new T.BufferGeometry(),mat);this.group.add(this[key]);}
  this.sliceGroup=new T.Group();this.group.add(this.sliceGroup);
  const ringMat=new T.LineBasicMaterial({color:linear(0xd3def8),transparent:true,opacity:.85});this.ring=new T.LineLoop(new T.BufferGeometry(),ringMat);this.sliceGroup.add(this.ring);
  this.sliceFill=new T.Mesh(new T.BufferGeometry(),new T.MeshBasicMaterial({color:linear(0xc7d9ff),transparent:true,opacity:.10,side:T.DoubleSide,depthWrite:false}));this.sliceGroup.add(this.sliceFill);
  this.arrows=new T.Group();this.group.add(this.arrows);
  this.install();new ResizeObserver(()=>this.resize()).observe(canvas.parentElement);this.observer=new IntersectionObserver(e=>{this.active=e[0].isIntersecting;if(this.active)this.wake();else this.stop();});this.observer.observe(canvas);
  document.addEventListener('visibilitychange',()=>{this.last=0;if(document.hidden)this.stop();else this.wake();});canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.stop();this.cb.failure?.();});this.resize();
 }
 light(){
  this.scene.add(new T.HemisphereLight(0xe0e8ff,0x161b26,.50));
  for(const [color,intensity,pos] of [[0xffffff,1.65,[4,9,7]],[0x9aafff,.60,[-9,2,-3]],[0xffe2ba,1.5,[5,5,-10]]]){const l=new T.DirectionalLight(color,intensity);l.position.set(...pos);this.scene.add(l);}
  const studio=new T.Scene();studio.background=new T.Color(0x171c27);
  for(const [pos,w,h,c,power] of [[[0,8,3],6,14,0xffffff,2],[[7,1,-4],4,12,0xffdfbd,1.5],[[-6,3,5],5,10,0xbacaff,1.2]]){const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:c,side:T.DoubleSide}));m.material.color.multiplyScalar(power);m.position.set(...pos);m.lookAt(0,0,0);studio.add(m);}
  const pm=new T.PMREMGenerator(this.renderer);this.env=pm.fromScene(studio,.03);this.scene.environment=this.env.texture;pm.dispose();studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
 }
 setState(s){
  const old=this.state;this.state=s;
  if(!old||old.progress!==s.progress)this.build();
  const planes=s.open?[this.clip,this.clipX]:[];this.shellMat.clippingPlanes=planes;this.coreMat.clippingPlanes=planes;this.cutShell.visible=this.cutCore.visible=this.cutSideShell.visible=this.cutSideCore.visible=s.open;
  const li=s.field==='lithium',muted=['normal','mises'].includes(s.field);
  for(const m of [this.shellMat,this.capShellMat])m.color.copy(linear(li?colors.li1:muted?colors.muted:colors.shell));
  for(const m of [this.coreMat,this.capCoreMat])m.color.copy(linear(li?colors.li0:colors.core));
  this.makeSlice();this.makeArrows();this.wake();
 }
 geometry(p,indices){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));if(indices)g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();return g;}
 replace(mesh,g){mesh.geometry.dispose();mesh.geometry=g;}
 build(){
  const radial=128,axial=80,pp=this.state.progress,op=[],cp=[],ids=[],cuts=[],cutc=[],ci=[],side=[],sidec=[],ep=[],ec=[],ei=[];
  for(let j=0;j<=axial;j++){
   const d=section(pp,j/axial);for(let i=0;i<=radial;i++){const th=TAU*i/radial,[x,y]=outer(th,d),[cx,cy]=core(th,d);op.push(x,y,d.z);cp.push(cx,cy,d.z);}
   cuts.push(0,0,d.z,d.a,0,d.z);cutc.push(0,.004,d.z,d.cx,.004,d.z);side.push(0,0,d.z,0,d.b*(1-d.n),d.z);sidec.push(.004,0,d.z,.004,d.cy,d.z);
   if(j<axial){ci.push(2*j,2*j+1,2*j+3,2*j,2*j+3,2*j+2);for(let i=0;i<radial;i++){const a=j*(radial+1)+i,b=a+radial+1;ids.push(a,b+1,a+1,a,b,b+1);}}
  }
  for(const s of [0,1]){const d=section(pp,s),base=ep.length/3;ep.push(0,0,d.z);ec.push(0,0,d.z+(s===0?.006:-.006));for(let i=0;i<=radial;i++){const [x,y]=outer(TAU*i/radial,d),[cx,cy]=core(TAU*i/radial,d);ep.push(x,y,d.z);ec.push(cx,cy,d.z+(s===0?.006:-.006));if(i<radial)ei.push(base,base+i+1,base+i+2);}}
  this.replace(this.shell,this.geometry(op,ids));this.replace(this.core,this.geometry(cp,ids));this.replace(this.cutShell,this.geometry(cuts,ci));this.replace(this.cutCore,this.geometry(cutc,ci));this.replace(this.cutSideShell,this.geometry(side,ci));this.replace(this.cutSideCore,this.geometry(sidec,ci));this.replace(this.endShell,this.geometry(ep,ei));this.replace(this.endCore,this.geometry(ec,ei));
  // End caps share the same longitudinal opening, so their upper halves cannot conceal the cut.
  this.endShell.material=this.shellMat;this.endCore.material=this.coreMat;
  this.canvas.dataset.progress=String(pp);this.canvas.dataset.rendered='true';
 }
 makeSlice(){const d=section(this.state.progress,this.state.slice),pts=[];for(let i=0;i<160;i++){const [x,y]=outer(TAU*i/160,d);pts.push(new T.Vector3(x*1.04,y*1.04,d.z));}this.replace(this.ring,new T.BufferGeometry().setFromPoints(pts));const p=[0,0,d.z],ids=[];for(const v of pts)p.push(v.x,v.y,v.z);for(let i=0;i<160;i++)ids.push(0,i+1,(i+1)%160+1);this.replace(this.sliceFill,this.geometry(p,ids));this.sliceGroup.visible=true;this.canvas.dataset.slice=String(this.state.slice);}
 makeArrows(){while(this.arrows.children.length){const o=this.arrows.children[0];this.arrows.remove(o);o.traverse(x=>{x.geometry?.dispose();if(Array.isArray(x.material))x.material.forEach(m=>m.dispose());else x.material?.dispose();});}
  if(this.state.field!=='normal')return;const d=section(this.state.progress,this.state.slice),late=this.state.stressStage==='late';
  const add=(y,tension)=>{for(const sign of [-1,1]){const start=tension?sign*.12:sign*1.35,dir=tension?sign:-sign;const ar=new T.ArrowHelper(new T.Vector3(dir,0,0),new T.Vector3(start,y,d.z+.075),1.12,tension?0xf2b37c:0x94b7ff,.23,.14);this.arrows.add(ar);}};
  add(d.b*(1-d.n)+.14,late);add(0,!late);
 }
 resize(){const r=this.canvas.getBoundingClientRect();if(r.width<10||r.height<10)return;this.width=r.width;this.height=r.height;this.renderer.setPixelRatio(this.dpr);this.renderer.setSize(r.width,r.height,false);this.updateCamera();this.wake();}
 halfHeightFor(p){return p.halfHeight*Math.max(1,.95/(this.width/this.height));}
 basis(p=this.pose){const cy=Math.cos(p.yaw),sy=Math.sin(p.yaw),ce=Math.cos(p.elevation),se=Math.sin(p.elevation);return {forward:new T.Vector3(sy*ce,se,cy*ce),right:new T.Vector3(cy,0,-sy),up:new T.Vector3(-sy*se,ce,-cy*se)};}
 updateCamera(){const p=this.pose,h=this.halfHeightFor(p),a=this.width/this.height;Object.assign(this.camera,{left:-h*a,right:h*a,top:h,bottom:-h});this.camera.updateProjectionMatrix();this.camera.position.copy(this.basis().forward).multiplyScalar(40);this.camera.up.set(0,1,0);this.camera.lookAt(0,0,0);this.camera.updateMatrixWorld();this.canvas.dataset.yaw=String(p.yaw);this.canvas.dataset.elevation=String(p.elevation);}
 project(pos){const p=new T.Vector3(...pos).project(this.camera);return {x:(p.x+1)*this.width/2,y:(1-p.y)*this.height/2,z:p.z};}
 worldPerPixel(p=this.pose){return 2*this.halfHeightFor(p)/this.height;}
 moveTo(p,duration=850){let yaw=p.yaw;while(yaw-this.pose.yaw>Math.PI)yaw-=TAU;while(yaw-this.pose.yaw< -Math.PI)yaw+=TAU;this.travel={from:{...this.pose},to:{...p,yaw},start:performance.now(),duration:this.state?.reduced?0:duration};this.wake();}
 animate(fn){this.animators.add(fn);this.wake();return ()=>this.animators.delete(fn);}
 renderNow(){this.updateCamera();this.renderer.render(this.scene,this.camera);this.cb.labels?.(this);const landmark=this.project([0,0,7]);this.canvas.dataset.landmark=JSON.stringify(landmark);}
 frame(now){this.raf=0;if(!this.active||document.hidden)return;const dt=this.last?Math.min(.08,(now-this.last)/1000):0;this.last=now;const begin=performance.now();
  for(const fn of this.animators)if(fn(now,dt)===false)this.animators.delete(fn);
  if(this.travel){const t=this.travel,u=this.state?.reduced?1:clamp((now-t.start)/t.duration),v=ease(u);for(const k of ['yaw','elevation','halfHeight'])this.pose[k]=t.from[k]+(t.to[k]-t.from[k])*v;if(u>=1)this.travel=null;}
  this.renderNow();this.frameTimes.push(performance.now()-begin);this.canvas.dataset.frameMs=JSON.stringify(this.frameTimes.slice(-60));if(this.frameTimes.length>180)this.frameTimes.shift();if(this.travel||this.animators.size)this.raf=requestAnimationFrame(t=>this.frame(t));else this.last=0;
 }
 wake(){if(!this.raf&&this.active&&!document.hidden)this.raf=requestAnimationFrame(t=>this.frame(t));}
 stop(){cancelAnimationFrame(this.raf);this.raf=0;this.last=0;}
 install(){
  const c=this.canvas;
  c.addEventListener('pointerdown',e=>{if(e.button!==0)return;this.cb.interrupt?.();this.travel=null;this.drag={x:e.clientX,y:e.clientY,kind:e.pointerType,locked:false};if(e.pointerType!=='touch')c.setPointerCapture(e.pointerId);});
  c.addEventListener('pointermove',e=>{if(!this.drag)return;const d=this.drag,dx=e.clientX-d.x,dy=e.clientY-d.y;if(d.kind==='touch'&&!d.locked){if(Math.abs(dx)<6&&Math.abs(dy)<6)return;if(Math.abs(dy)>Math.abs(dx)){this.drag=null;return;}d.locked=true;c.setPointerCapture(e.pointerId);}
   this.pose=orbit(this.pose,dx,d.kind==='touch'?0:dy,this.width,this.height);d.x=e.clientX;d.y=e.clientY;this.cb.camera?.();this.wake();});
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])c.addEventListener(ev,()=>this.drag=null);
  c.addEventListener('wheel',e=>{if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();this.cb.interrupt?.();this.pose.halfHeight=clamp(this.pose.halfHeight*Math.exp(e.deltaY*.001),3.3,12);this.wake();},{passive:false});
  c.addEventListener('keydown',e=>{const map={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down','+':'in','=':'in','-':'out',Home:'reset'};if(map[e.key]){e.preventDefault();this.cb.interrupt?.();this.control(map[e.key]);}});
 }
 control(action){this.travel=null;if(action==='reset')this.moveTo(HOME);else if(action==='in'||action==='out'){this.pose.halfHeight=clamp(this.pose.halfHeight*(action==='in'?.88:1.12),3.3,12);}else this.pose=orbit(this.pose,action==='left'?-40:action==='right'?40:0,action==='up'?-30:action==='down'?30:0,this.width,this.height);this.cb.camera?.();this.wake();}
}
