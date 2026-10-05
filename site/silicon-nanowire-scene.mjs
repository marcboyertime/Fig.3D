// The wire, rebuilt in place every frame its displayed state changes.
// Everything the reader changes glides: the scene keeps its own displayed values and eases them
// toward the requested state, so tabs, sliders and the cutaway move instead of jumping.
import {LENGTH,TAU,HOME,section,outer,zAt,orbit,ease,clamp,smooth} from './silicon-nanowire-model.mjs';
const T=window.THREE;
const lin=hex=>new T.Color(hex).convertSRGBToLinear();
// Colours follow Figure 5's own scale: blue = crystalline silicon (c≈0), red = lithiated (c≈1),
// with the paper's warm transition band at the reaction front.
export const PALETTE={crystal:'#4f7be0',front:'#e8b44e',lithiated:'#d4553b',mutedShell:'#8e97ab',mutedCore:'#55638a',tension:'#ffb27a',compression:'#9fc2ff'};
const C={crystal:lin(0x2a54c2),front:lin(0xd99a2b),lith:lin(0xb93421),mShell:lin(0x4d5568),mCore:lin(0x2b3757)};
const R=144,A=96,HALF=R/2;
const approach=(v,t,dt,rate)=>Math.abs(t-v)<1e-4?t:v+(t-v)*(1-Math.exp(-dt*rate));

export class WireScene{
 constructor(canvas,callbacks={}){
  this.canvas=canvas;this.cb=callbacks;this.pose={...HOME};this.width=1;this.height=1;this.animators=new Set();this.active=true;this.raf=0;this.last=0;this.dirty=true;
  this.dpr=Math.min(devicePixelRatio,2);
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
  this.renderer.outputEncoding=T.sRGBEncoding;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.8;
  this.scene=new T.Scene();this.camera=new T.OrthographicCamera(-10,10,6,-6,.1,150);
  this.lighting();
  this.view={progress:.45,slice:.4,open:1,trim:0,muted:0,neck:0,arrows:0,ring:1};this.target={...this.view};this.shown={};
  this.buildMeshes();
  new ResizeObserver(()=>this.resize()).observe(canvas.parentElement);
  this.observer=new IntersectionObserver(e=>{this.active=e[0].isIntersecting;if(this.active)this.wake();else this.stop();});this.observer.observe(canvas);
  document.addEventListener('visibilitychange',()=>{this.last=0;if(document.hidden)this.stop();else this.wake();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.stop();this.cb.failure?.();});
  this.install();this.resize();
 }
 lighting(){
  this.scene.add(new T.HemisphereLight(0xe6ecff,0x10131b,.3));
  const key=new T.DirectionalLight(0xffffff,1.45);key.position.set(5,9,8);this.scene.add(key);
  const fill=new T.DirectionalLight(0xb9c8ff,.5);fill.position.set(-9,1,3);this.scene.add(fill);
  const rim=new T.DirectionalLight(0xfff0de,1.05);rim.position.set(3,4,-10);this.scene.add(rim);
  const studio=new T.Scene();studio.background=new T.Color(0x15181f);
  for(const [pos,w,h,c,k] of [[[0,9,4],8,14,0xffffff,1.6],[[8,1,-5],4,12,0xffeedd,1.1],[[-7,3,6],5,10,0xc6d2ff,1]]){const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:c,side:T.DoubleSide}));m.material.color.multiplyScalar(k);m.position.set(...pos);m.lookAt(0,0,0);studio.add(m);}
  const pm=new T.PMREMGenerator(this.renderer);this.env=pm.fromScene(studio,.04);this.scene.environment=this.env.texture;pm.dispose();studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
 }
 // One set of vertex buffers per material; the main body and the lifting wedge index into the same vertices,
 // so the closed wire has no seam and the open one needs no clipping planes.
 buildMeshes(){
  const surfaceMat=(rough)=>new T.MeshStandardMaterial({vertexColors:true,roughness:rough,metalness:.04,envMapIntensity:.55,side:T.DoubleSide});
  this.group=new T.Group();this.scene.add(this.group);
  const shellVerts=(A+1)*(R+1)+2*(R+2),coreVerts=shellVerts,cutVerts=(A+1)*6;
  const buffers=n=>({position:new T.BufferAttribute(new Float32Array(n*3),3).setUsage(T.DynamicDrawUsage),normal:new T.BufferAttribute(new Float32Array(n*3),3).setUsage(T.DynamicDrawUsage),color:new T.BufferAttribute(new Float32Array(n*3),3).setUsage(T.DynamicDrawUsage)});
  this.buf={shell:buffers(shellVerts),core:buffers(coreVerts),cut:buffers(cutVerts)};
  const geometry=(b,index)=>{const g=new T.BufferGeometry();for(const k in b)g.setAttribute(k,b[k]);g.setIndex(index);return g;};
  // Surface quads and end fans, split at y=0: θ∈[0,π) is the upper half, the lid that lifts off (as in Fig. 5b).
  const surf={main:[],wedge:[],all:[]};
  for(let j=0;j<A;j++)for(let i=0;i<R;i++){const a=j*(R+1)+i,b=a+R+1,tri=[a,b+1,a+1,a,b,b+1];(i<HALF?surf.wedge:surf.main).push(...tri);surf.all.push(...tri);}
  const fanBase=(A+1)*(R+1);
  for(const e of [0,1]){const c=fanBase+e*(R+2);for(let i=0;i<R;i++){const tri=e===0?[c,c+1+i,c+2+i]:[c,c+2+i,c+1+i];(i<HALF?surf.wedge:surf.main).push(...tri);surf.all.push(...tri);}}
  // Cut face per section on y=0: shell | core | shell, with their own vertices so the colour boundary stays crisp.
  const cut=[];for(let j=0;j<A;j++)for(const k of [0,2,4]){const a=j*6+k,b=a+6;cut.push(a,b,a+1,a+1,b,b+1);}
  this.geo={shellAll:geometry(this.buf.shell,surf.all),coreAll:geometry(this.buf.core,surf.all),
   shellMain:geometry(this.buf.shell,surf.main),shellWedge:geometry(this.buf.shell,surf.wedge),coreMain:geometry(this.buf.core,surf.main),coreWedge:geometry(this.buf.core,surf.wedge),cut:geometry(this.buf.cut,cut)};
  this.mat={shell:surfaceMat(.46),core:surfaceMat(.42),cut:surfaceMat(.82)};this.mat.cut.metalness=0;
  // Core sits exactly on the pristine surface: pull it forward in depth instead of moving it.
  this.mat.core.polygonOffset=true;this.mat.core.polygonOffsetFactor=-1;this.mat.core.polygonOffsetUnits=-2;
  this.wedgeMat={shell:this.mat.shell.clone(),core:this.mat.core.clone(),cut:this.mat.cut.clone()};for(const m of Object.values(this.wedgeMat)){m.transparent=true;}
  const mesh=(g,m,parent)=>{const o=new T.Mesh(g,m);o.frustumCulled=false;parent.add(o);return o;};
  this.main={shell:mesh(this.geo.shellMain,this.mat.shell,this.group),core:mesh(this.geo.coreMain,this.mat.core,this.group),cut:mesh(this.geo.cut,this.mat.cut,this.group)};
  this.wedge=new T.Group();this.group.add(this.wedge);
  this.wedgeParts={shell:mesh(this.geo.shellWedge,this.wedgeMat.shell,this.wedge),core:mesh(this.geo.coreWedge,this.wedgeMat.core,this.wedge),cut:mesh(this.geo.cut,this.wedgeMat.cut,this.wedge)};
  // The movable section: a crisp band just outside the surface and a faint fill.
  // Its upper arc belongs to the lid and travels and fades with it; across the open cut a chord marks the section instead.
  const ringPos=new T.BufferAttribute(new Float32Array((R+1)*2*3),3).setUsage(T.DynamicDrawUsage),chordPos=new T.BufferAttribute(new Float32Array(4*3),3).setUsage(T.DynamicDrawUsage);
  const band=(pos,index)=>{const g=new T.BufferGeometry();g.setAttribute('position',pos);g.setIndex(index);return g;};
  const ri={upper:[],lower:[]};for(let i=0;i<R;i++){const a=2*i;(i<HALF?ri.upper:ri.lower).push(a,a+1,a+2,a+1,a+3,a+2);}
  this.ringGeo=band(ringPos,ri.lower);this.ringLidGeo=band(ringPos,ri.upper);this.chordGeo=band(chordPos,[0,1,2,1,3,2]);
  const ringMat=()=>new T.MeshBasicMaterial({color:lin(0xe6eeff),transparent:true,opacity:.95,side:T.DoubleSide,depthWrite:false,toneMapped:false});
  const ringMesh=(g,parent)=>{const o=new T.Mesh(g,ringMat());o.frustumCulled=false;o.renderOrder=3;parent.add(o);return o;};
  this.ring=ringMesh(this.ringGeo,this.group);this.ringLid=ringMesh(this.ringLidGeo,this.wedge);this.chord=ringMesh(this.chordGeo,this.group);
  // Sign-only stress marks on the exposed face, drawn like the paper's own ←□→ notation.
  this.arrows=new T.Group();this.group.add(this.arrows);
  this.arrowMat={tension:new T.MeshBasicMaterial({color:lin(0xffb27a),transparent:true,depthTest:false,toneMapped:false}),compression:new T.MeshBasicMaterial({color:lin(0x9fc2ff),transparent:true,depthTest:false,toneMapped:false})};
  // The crack path Figure 5f draws along the surface indent.
  this.neckMat=new T.MeshBasicMaterial({color:0xffffff,transparent:true,depthWrite:false,toneMapped:false});this.neck=new T.Group();this.group.add(this.neck);
 }
 setState(s){
  this.state=s;const stress=s.question==='stress',fracture=s.question==='fracture',axis=s.question==='swelling'&&s.view==='axis',trimmed=stress||fracture||axis;
  Object.assign(this.target,{progress:s.progress,slice:s.slice,open:s.open&&!trimmed&&(s.view==='oblique'||s.view==null)?1:0,trim:trimmed?s.slice:0,muted:stress?1:0,arrows:stress&&s.stress!=='mises'?1:0,neck:fracture?1:0,ring:trimmed||s.card||(s.opening&&s.beat<3)?0:1});
  if(s.reduced||!this.started){Object.assign(this.view,this.target);this.started=true;}
  this.wake();
 }
 // Displayed state eases toward the target; playback drives progress directly so it stays exact.
 step(dt){
  const v=this.view,t=this.target,before=JSON.stringify(v);
  v.progress=this.state?.playing?t.progress:approach(v.progress,t.progress,dt,6);
  v.slice=approach(v.slice,t.slice,dt,7);v.trim=approach(v.trim,t.trim,dt,4.2);
  for(const k of ['muted','arrows','neck','ring'])v[k]=approach(v[k],t[k],dt,6);
  v.open=approach(v.open,t.open,dt,3.6);
  return JSON.stringify(v)!==before;
 }
 settled(){return Object.keys(this.target).every(k=>Math.abs(this.view[k]-this.target[k])<1e-4);}
 // Narrow front band like Fig. 5a: blue until the front passes, a warm band, then red; greyed for stress.
 colorAt(q,out){
  const u=smooth(0,.16,q);
  if(q<=0)out.copy(C.crystal);else if(u<.5)out.copy(C.crystal).lerp(C.front,u*2);else out.copy(C.front).lerp(C.lith,(u-.5)*2);
  return out.lerp(C.mShell,this.view.muted);
 }
 rebuild(){
  const v=this.view,p=v.progress,trim=Math.min(v.trim,.985),muted=v.muted;
  const sp=this.buf.shell.position.array,sc=this.buf.shell.color.array,cp=this.buf.core.position.array,cc=this.buf.core.color.array,xp=this.buf.cut.position.array,xc=this.buf.cut.color.array;
  const col=new T.Color(),coreCol=C.crystal.clone().lerp(C.mCore,muted),ring=[];
  for(let j=0;j<=A;j++){
   const s=trim+(1-trim)*j/A,d=section(p,s);this.colorAt(d.q,col);
   for(let i=0;i<=R;i++){const th=TAU*i/R,[x,y]=outer(th,d),k=3*(j*(R+1)+i);sp[k]=x;sp[k+1]=y;sp[k+2]=d.z;sc[k]=col.r;sc[k+1]=col.g;sc[k+2]=col.b;cp[k]=d.cx*Math.cos(th);cp[k+1]=d.cy*Math.sin(th);cp[k+2]=d.z;cc[k]=coreCol.r;cc[k+1]=coreCol.g;cc[k+2]=coreCol.b;}
   const pts=[[-d.a,0,0],[-d.cx,0,0],[-d.cx,0,1],[d.cx,0,1],[d.cx,0,0],[d.a,0,0]];
   for(let k=0;k<6;k++){const o=3*(j*6+k),c=pts[k][2]?coreCol:col;xp[o]=pts[k][0];xp[o+1]=pts[k][1];xp[o+2]=d.z;xc[o]=c.r;xc[o+1]=c.g;xc[o+2]=c.b;}
  }
  // End fans: the exposed face at the trim and the far end.
  const fanBase=(A+1)*(R+1);
  for(const e of [0,1]){const s=e===0?trim:1,d=section(p,s),c=fanBase+e*(R+2),dz=e===0?.004:-.004;this.colorAt(d.q,col);
   const put=(arr,carr,idx,x,y,z,colour)=>{const k=3*idx;arr[k]=x;arr[k+1]=y;arr[k+2]=z;carr[k]=colour.r;carr[k+1]=colour.g;carr[k+2]=colour.b;};
   put(sp,sc,c,0,0,d.z,col);put(cp,cc,c,0,0,d.z+dz,coreCol);
   for(let i=0;i<=R;i++){const th=TAU*i/R,[x,y]=outer(th,d);put(sp,sc,c+1+i,x,y,d.z,col);put(cp,cc,c+1+i,d.cx*Math.cos(th),d.cy*Math.sin(th),d.z+dz,coreCol);}
  }
  for(const b of Object.values(this.buf))for(const a of Object.values(b))a.needsUpdate=true;
  this.geo.shellAll.computeVertexNormals();this.geo.coreAll.computeVertexNormals();this.geo.cut.computeVertexNormals();
  this.canvas.dataset.progress=p.toFixed(4);this.canvas.dataset.rendered='true';
 }
 updateSlice(){
  const v=this.view,d=section(v.progress,v.slice),arr=this.ringGeo.attributes.position.array;
  for(let i=0;i<=R;i++){const th=TAU*i/R,[x,y]=outer(th,d),r=Math.hypot(x,y)||1,ux=x/r,uy=y/r;const k=6*i;arr[k]=x+ux*.03;arr[k+1]=y+uy*.03;arr[k+2]=d.z;arr[k+3]=x+ux*.1;arr[k+4]=y+uy*.1;arr[k+5]=d.z;}
  this.ringGeo.attributes.position.needsUpdate=true;
  const c=this.chordGeo.attributes.position.array,w=.035,y=.012;c.set([-d.a,y,d.z-w, d.a,y,d.z-w, -d.a,y,d.z+w, d.a,y,d.z+w]);this.chordGeo.attributes.position.needsUpdate=true;
  const o=this.view.open,lid=1-smooth(.3,.95,o),cut=smooth(.15,.6,o);
  for(const [m,k] of [[this.ring,1],[this.ringLid,lid],[this.chord,cut]]){m.material.opacity=.95*v.ring*k;m.visible=v.ring*k>.01;}
  this.canvas.dataset.slice=String(this.state?.slice??v.slice);
 }
 updateWedge(){
  const o=this.view.open,u=ease(clamp(o));
  this.wedge.position.set(0,2.8*u,-.6*u);
  const alpha=1-smooth(.3,.95,o);for(const m of Object.values(this.wedgeMat)){m.opacity=alpha;m.depthWrite=alpha>.98;}
  this.wedge.visible=alpha>.01;this.main.cut.visible=o>.002;this.wedgeParts.cut.visible=o>.002;
 }
 updateArrows(){
  const v=this.view,a=v.arrows;this.arrows.visible=a>.01;for(const m of Object.values(this.arrowMat))m.opacity=a;
  if(!this.arrows.visible)return;
  const late=(this.state?.stress??'late')!=='early',d=section(v.progress,v.trim),key=[late,d.a.toFixed(3),d.b.toFixed(3),d.n.toFixed(3),d.z.toFixed(3)].join();
  if(key===this.arrowKey)return;this.arrowKey=key;
  for(const c of [...this.arrows.children]){this.arrows.remove(c);c.geometry.dispose();}
  const top=outer(Math.PI/2,d)[1];
  const motif=(y,tension)=>{
   const half=.1,len=.62,w=.05,head=.18,hw=.12,gap=.07;
   const add=(sign)=>{const x0=sign*(half+gap),x1=sign*(half+gap+len);const tip=tension?x1:x0,tail=tension?x0:x1,dir=Math.sign(tip-tail);const base=tip-dir*head;
    const s=new T.Shape();s.moveTo(tail,y-w/2);s.lineTo(base,y-w/2);s.lineTo(base,y-hw);s.lineTo(tip,y);s.lineTo(base,y+hw);s.lineTo(base,y+w/2);s.lineTo(tail,y+w/2);s.closePath();return s;};
   const box=new T.Shape();box.moveTo(-half,y-half);box.lineTo(half,y-half);box.lineTo(half,y+half);box.lineTo(-half,y+half);box.closePath();const hole=new T.Path();const ih=half-.035;hole.moveTo(-ih,y-ih);hole.lineTo(-ih,y+ih);hole.lineTo(ih,y+ih);hole.lineTo(ih,y-ih);hole.closePath();box.holes.push(hole);
   for(const s of [add(-1),add(1),box]){const m=new T.Mesh(new T.ShapeGeometry(s),tension?this.arrowMat.tension:this.arrowMat.compression);m.position.z=d.z+.02;m.renderOrder=6;this.arrows.add(m);}
  };
  motif(top-.2,late);motif(0,!late);
 }
 updateNeck(){
  const v=this.view,a=v.neck;this.neck.visible=a>.01;this.neckMat.opacity=a;if(!this.neck.visible)return;
  const key=[v.progress.toFixed(3),v.trim.toFixed(3)].join();if(key===this.neckKey)return;this.neckKey=key;
  for(const c of [...this.neck.children]){this.neck.remove(c);c.geometry.dispose();}
  const s0=v.trim,s1=Math.min(.97,s0+.5),pts=side=>{const out=[];for(let i=0;i<=40;i++){const s=s0+(s1-s0)*i/40,d=section(v.progress,s),w=.2*(1-smooth(.62,1,i/40)),th=Math.acos(clamp(side*w/d.a,-1,1)),y=outer(th,d)[1];out.push(new T.Vector3(side*w,y+.02,d.z));}return out;};
  const tube=points=>{const m=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),60,.022,6,false),this.neckMat);m.renderOrder=5;this.neck.add(m);};
  tube(pts(-1));tube(pts(1));
  const d=section(v.progress,s0),top=outer(Math.PI/2,d)[1],notch=[new T.Vector3(-.2,outer(Math.acos(-.2/d.a),d)[1],d.z+.012),new T.Vector3(0,top-.42,d.z+.012),new T.Vector3(.2,outer(Math.acos(.2/d.a),d)[1],d.z+.012)];
  const m=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(notch,false,'catmullrom',0),40,.022,6,false),this.neckMat);m.renderOrder=5;this.neck.add(m);
 }
 resize(){const r=this.canvas.getBoundingClientRect();if(r.width<10||r.height<10)return;this.width=r.width;this.height=r.height;this.renderer.setPixelRatio(this.dpr);this.renderer.setSize(r.width,r.height,false);this.updateCamera();this.dirty=true;this.wake();}
 // Narrow stages keep the wire's width in view rather than its height.
 halfHeightFor(p){return p.halfHeight*Math.max(1,1.02/(this.width/this.height));}
 basis(p=this.pose){const cy=Math.cos(p.yaw),sy=Math.sin(p.yaw),ce=Math.cos(p.elevation),se=Math.sin(p.elevation);return {forward:new T.Vector3(sy*ce,se,cy*ce),right:new T.Vector3(cy,0,-sy),up:new T.Vector3(-sy*se,ce,-cy*se)};}
 updateCamera(){const p=this.pose,h=this.halfHeightFor(p),a=this.width/this.height,b=this.basis(p);Object.assign(this.camera,{left:-h*a,right:h*a,top:h,bottom:-h});this.camera.updateProjectionMatrix();this.camera.position.copy(b.forward).multiplyScalar(40);this.camera.up.copy(b.up);this.camera.lookAt(0,0,0);this.camera.updateMatrixWorld();this.canvas.dataset.yaw=p.yaw.toFixed(4);this.canvas.dataset.elevation=p.elevation.toFixed(4);}
 project(pos){const p=new T.Vector3(...pos).project(this.camera);return {x:(p.x+1)*this.width/2,y:(1-p.y)*this.height/2,z:p.z};}
 worldPerPixel(p=this.pose){return 2*this.halfHeightFor(p)/this.height;}
 moveTo(p,duration=1100){let yaw=p.yaw;while(yaw-this.pose.yaw>Math.PI)yaw-=TAU;while(yaw-this.pose.yaw< -Math.PI)yaw+=TAU;this.travel={from:{...this.pose},to:{...p,yaw},t:0,duration:this.state?.reduced?0:duration};this.wake();}
 animate(fn){this.animators.add(fn);this.wake();return ()=>this.animators.delete(fn);}
 renderNow(){
  this.updateCamera();
  if(!this.shown.progress||this.shown.progress!==this.view.progress||this.shown.trim!==this.view.trim||this.shown.muted!==this.view.muted){this.rebuild();this.shown={...this.view};}
  this.updateSlice();this.updateWedge();this.updateArrows();this.updateNeck();
  this.renderer.render(this.scene,this.camera);this.cb.frame?.(this);this.dirty=false;
 }
 frame(now){
  this.raf=0;if(!this.active||document.hidden)return;
  const dt=this.last?Math.min(.1,(now-this.last)/1000):1/60;this.last=now;
  for(const fn of [...this.animators])if(fn(now,dt)===false)this.animators.delete(fn);
  if(this.travel){const t=this.travel;t.t+=dt*1000;const u=t.duration?clamp(t.t/t.duration):1,k=ease(u);for(const key of ['yaw','elevation','halfHeight'])this.pose[key]=t.from[key]+(t.to[key]-t.from[key])*k;if(u>=1)this.travel=null;this.dirty=true;}
  if(this.state&&this.step(dt))this.dirty=true;
  if(this.dirty)this.renderNow();
  // An animator may already have woken the loop this frame; never start a second chain.
  if(this.raf)return;
  if(this.travel||this.animators.size||!this.settled())this.raf=requestAnimationFrame(t=>this.frame(t));else this.last=0;
 }
 wake(){this.dirty=true;if(!this.raf&&this.active&&!document.hidden)this.raf=requestAnimationFrame(t=>this.frame(t));}
 stop(){cancelAnimationFrame(this.raf);this.raf=0;this.last=0;}
 install(){
  const c=this.canvas;
  c.addEventListener('pointerdown',e=>{if(e.button!==0)return;this.drag={x:e.clientX,y:e.clientY,kind:e.pointerType,locked:e.pointerType!=='touch',moved:false};if(e.pointerType!=='touch')c.setPointerCapture(e.pointerId);});
  c.addEventListener('pointermove',e=>{if(!this.drag)return;const d=this.drag,dx=e.clientX-d.x,dy=e.clientY-d.y;
   if(!d.locked){if(Math.abs(dx)<6&&Math.abs(dy)<6)return;if(Math.abs(dy)>Math.abs(dx)){this.drag=null;return;}d.locked=true;c.setPointerCapture(e.pointerId);}
   if(!d.moved){d.moved=true;this.travel=null;this.cb.interrupt?.();}
   this.pose=orbit(this.pose,dx,d.kind==='touch'?0:dy,this.width,this.height);d.x=e.clientX;d.y=e.clientY;this.cb.camera?.();this.wake();});
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])c.addEventListener(ev,()=>this.drag=null);
  c.addEventListener('wheel',e=>{if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();this.cb.interrupt?.();this.travel=null;this.pose.halfHeight=clamp(this.pose.halfHeight*Math.exp(e.deltaY*.001),1.8,9);this.cb.camera?.();this.wake();},{passive:false});
  c.addEventListener('keydown',e=>{const map={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down','+':'in','=':'in','-':'out',Home:'reset'};if(map[e.key]){e.preventDefault();this.cb.interrupt?.();this.control(map[e.key]);}});
 }
 control(action){
  if(action==='reset'){this.moveTo(this.cb.home?.()??HOME);return;}
  const p=this.travel?{...this.travel.to}:{...this.pose};let to;
  if(action==='in'||action==='out')to={...p,halfHeight:clamp(p.halfHeight*(action==='in'?.85:1.18),1.8,9)};
  else to=orbit(p,action==='left'?-60:action==='right'?60:0,action==='up'?-45:action==='down'?45:0,this.width,this.height);
  this.moveTo(to,420);this.cb.camera?.();
 }
}
