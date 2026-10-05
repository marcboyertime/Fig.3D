// The model leaves the page from the printed wire of Figure 5a.
// 1. The real figure zooms until panel a's wire sits exactly where the model will be drawn at PAPER_POSE
//    (pose, scale and origin come from a silhouette fit, not from matching boxes by eye).
// 2. The same pixels become a textured page inside the WebGL scene, so nothing visibly swaps.
// 3. A copy of panel a in front dissolves, revealing the shaded model in its place.
// 4. The page tips back and dims while the camera turns from the paper's viewpoint to the working view.
import {PAPER_POSE,PANEL_A,FIGURES,clamp,ease} from './silicon-nanowire-model.mjs';
const T=window.THREE;
export const PROFILE={zoom:2600,reveal:1500,lift:3200};
export class PaperEmergence{
 constructor(scene,stage){this.scene=scene;this.stage=stage;this.active=false;this.paused=false;this.loader=new T.TextureLoader();}
 texture(src){return this.textures??=new Promise((resolve,reject)=>this.loader.load(src,t=>{t.encoding=T.sRGBEncoding;t.minFilter=T.LinearMipmapLinearFilter;t.anisotropy=4;resolve(t);},undefined,reject));}
 plan(){
  const s=this.scene,W=s.width,H=s.height,f=FIGURES['5'],box=PANEL_A.box,boxH=box[3]-box[1];
  // Panel a at most 1.8× its native pixels and never taller than 70% of the stage.
  const S=Math.min(1.8,H*.7/boxH,W*.6/(box[2]-box[0])),unit=PANEL_A.unit*S;
  const aspect=Math.max(1,1.02/(W/H)),pose={...PAPER_POSE,halfHeight:H/(2*unit)/aspect};
  const final={x:W/2-PANEL_A.origin[0]*S,y:H/2-PANEL_A.origin[1]*S,w:f.width*S,h:f.height*S};
  return {pose,final,S};
 }
 async run(img,{toPose,onSwap,onDone,timing=PROFILE}){
  this.cancel();const token=this.token=Symbol();
  const texture=await this.texture(img.currentSrc||img.src);if(token!==this.token)return;
  const stage=this.stage.getBoundingClientRect(),r=img.getBoundingClientRect();
  this.from={x:r.left-stage.left,y:r.top-stage.top,w:r.width,h:r.height};
  Object.assign(this,this.plan());this.toPose={...toPose};this.timing=timing;this.elapsed=0;this.map=texture;this.onSwap=onSwap;this.onDone=onDone;this.active=true;this.userHasCamera=false;
  const el=document.createElement('div');el.className='emerge-transit';el.setAttribute('aria-hidden','true');
  Object.assign(el.style,{left:this.from.x+'px',top:this.from.y+'px',width:this.from.w+'px',height:this.from.h+'px'});
  const copy=new Image();copy.src=img.currentSrc||img.src;copy.alt='';
  const f=FIGURES['5'],b=PANEL_A.box,focus=document.createElement('div');focus.className='emerge-focus';
  Object.assign(focus.style,{left:b[0]/f.width*100+'%',top:b[1]/f.height*100+'%',width:(b[2]-b[0])/f.width*100+'%',height:(b[3]-b[1])/f.height*100+'%'});
  el.append(copy,focus);this.stage.append(el);this.transit=el;this.focus=focus;this.stage.classList.add('is-emerging');
  this.stop=this.scene.animate((now,dt)=>this.frame(dt));
 }
 get duration(){const t=this.timing;return t.zoom+t.reveal+t.lift;}
 frame(dt){
  if(!this.active)return false;if(!this.paused)this.elapsed+=Math.min(dt,.25)*1000;
  const {zoom,reveal,lift}=this.timing,t=this.elapsed,sc=this.scene;
  if(t<zoom){const u=ease(clamp(t/zoom)),a=this.from,b=this.final,k=(a.w+(b.w-a.w)*u)/a.w;
   this.transit.style.transform=`translate(${(b.x-a.x)*u}px,${(b.y-a.y)*u}px) scale(${k})`;
   this.focus.style.opacity=String(clamp(t/(zoom*.3))*(1-clamp((t-zoom*.75)/(zoom*.25))*.7));return true;}
  if(!this.page)this.swap();
  this.front.material.opacity=1-ease(clamp((t-zoom)/reveal));this.front.visible=this.front.material.opacity>0;
  const l=clamp((t-zoom-reveal)/lift),u=ease(l);
  this.pageGroup.quaternion.setFromAxisAngle(this.axis,-1.42*u);
  const fade=1-ease(clamp((l-.2)/.8));this.page.material.opacity=fade;this.page.material.color.setScalar(.3+.7*fade);this.page.visible=fade>0;
  if(!this.userHasCamera){const a=this.pose,b=this.toPose,p=sc.pose;for(const k of ['yaw','elevation','halfHeight'])p[k]=a[k]+(b[k]-a[k])*u;sc.dirty=true;}
  if(t>=zoom+reveal+lift){this.finish();return false;}
  return true;
 }
 swap(){
  const sc=this.scene,p=this.pose;sc.travel=null;sc.pose={...p};sc.updateCamera();
  const {right,up,forward}=sc.basis(p),k=sc.worldPerPixel(p),cx=sc.width/2,cy=sc.height/2,f=this.final,n=[FIGURES['5'].width,FIGURES['5'].height],a=PANEL_A.box;
  const world=(x,y,depth)=>new T.Vector3().addScaledVector(right,(x-cx)*k).addScaledVector(up,(cy-y)*k).addScaledVector(forward,depth);
  const q=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(right,up,forward));
  const plane=(x,y,w,h,depth,uv)=>{const g=new T.PlaneGeometry(w*k,h*k);if(uv){const at=g.attributes.uv;for(let i=0;i<at.count;i++)at.setXY(i,uv[0]+at.getX(i)*(uv[2]-uv[0]),1-uv[3]+at.getY(i)*(uv[3]-uv[1]));}
   const m=new T.Mesh(g,new T.MeshBasicMaterial({map:this.map,toneMapped:false,transparent:true,depthWrite:false}));m.quaternion.copy(q);m.position.copy(world(x+w/2,y+h/2,depth));m.frustumCulled=false;return m;};
  // Hinge on the bottom edge of panel a, on a page plane behind the model.
  const pivot=world(f.x+f.w*((a[0]+a[2])/2/n[0]),f.y+f.h*(a[3]/n[1]),-12);
  this.axis=right.clone();this.pageGroup=new T.Group();this.pageGroup.position.copy(pivot);sc.scene.add(this.pageGroup);
  this.page=plane(f.x,f.y,f.w,f.h,-12);this.page.position.sub(pivot);this.page.renderOrder=-1;this.pageGroup.add(this.page);
  const s=f.w/n[0];this.front=plane(f.x+a[0]*s,f.y+a[1]*s,(a[2]-a[0])*s,(a[3]-a[1])*s,12,[a[0]/n[0],a[1]/n[1],a[2]/n[0],a[3]/n[1]]);this.front.material.depthTest=false;this.front.renderOrder=10;sc.scene.add(this.front);
  this.onSwap?.();sc.renderNow();this.transit.remove();this.transit=null;
 }
 // A drag or key hands the camera to the reader; the page clears quickly and the opening does not resume.
 yieldCamera(){if(!this.active)return;this.userHasCamera=true;if(!this.page)this.elapsed=this.timing.zoom;this.elapsed=Math.max(this.elapsed,this.timing.zoom+this.timing.reveal+this.timing.lift*.75);}
 finish(){if(!this.active)return;if(!this.page&&this.transit)this.swap();const done=this.onDone;this.clear();if(!this.userHasCamera)this.scene.pose={...this.toPose};this.scene.wake();done?.();}
 clear(){
  this.active=false;this.stop?.();this.stop=null;this.transit?.remove();this.transit=null;
  if(this.pageGroup){this.scene.scene.remove(this.pageGroup);this.page.geometry.dispose();this.page.material.dispose();}
  if(this.front){this.scene.scene.remove(this.front);this.front.geometry.dispose();this.front.material.dispose();}
  this.page=this.front=this.pageGroup=null;this.stage.classList.remove('is-emerging');this.onDone=null;this.scene.wake();
 }
 cancel(){this.token=null;if(this.active)this.clear();}
}
