// The model emerges from the printed figure inside one projection.
// 1. The figure zooms until the printed cube matches the model's on-screen box.
// 2. The same pixels are handed to a textured page inside the WebGL scene (no visible swap).
// 3. A front copy of the printed cube dissolves, revealing the shaded model in its place.
// 4. The page lays back under the model while the camera turns from the paper's viewpoint.
// Presentation only: scientific state is untouched and the camera ends where it was asked to.
import {PAPER_POSE,easeInOut,clamp} from './self-separating-battery-model.mjs?v=5';
const T=window.THREE;
export const PROFILES={
 opening:{zoom:2600,reveal:1300,lift:3000,hold:500},
 return:{zoom:560,reveal:340,lift:760,hold:0}
};
export class Emergence{
 constructor(scene,stage){this.scene=scene;this.stage=stage;this.loader=new T.TextureLoader();this.textures={};this.active=false;this.paused=false;}
 texture(src){return this.textures[src]??=new Promise((resolve,reject)=>this.loader.load(src,t=>{t.encoding=T.sRGBEncoding;t.minFilter=T.LinearMipmapLinearFilter;t.anisotropy=4;this.scene.renderer?.initTexture?.(t);resolve(t);},undefined,reject));}
 // Registration framing: the printed cube is shown at most ~1.35× its native pixels.
 plan({imageRect,natural,anchor,toPose}){
  const s=this.scene,home={...PAPER_POSE,halfHeight:toPose.halfHeight};
  const box=s.sampleBox(home),homeWidth=box.x1-box.x0,nativeWidth=anchor[2]-anchor[0];
  const width=Math.min(homeWidth,nativeWidth*1.35),pose={...PAPER_POSE,halfHeight:toPose.halfHeight*homeWidth/width,target:[0,0,0]};
  const b=s.sampleBox(pose),scaleNow=imageRect.w/natural[0],k=(b.x1-b.x0)/((anchor[2]-anchor[0])*scaleNow);
  const w=imageRect.w*k,h=imageRect.h*k,cx=(anchor[0]+anchor[2])/2/natural[0],cy=(anchor[1]+anchor[3])/2/natural[1];
  const final={x:(b.x0+b.x1)/2-cx*w,y:(b.y0+b.y1)/2-cy*h,w,h};
  return {pose,final,box:b};
 }
 visible(rect,anchor,natural){const k=rect.w/natural[0],x0=rect.x+anchor[0]*k,y0=rect.y+anchor[1]*k,x1=rect.x+anchor[2]*k,y1=rect.y+anchor[3]*k;return x0>=-2&&y0>=-2&&x1<=this.scene.width+2&&y1<=this.scene.height+2;}
 async run({src,natural,imageRect,anchor,toPose,profile='opening',onSwap,onDone}){
  this.cancel();const run=this.token=Symbol();
  const texture=await this.texture(src);if(this.token!==run)return;
  const s=this.scene,timing=PROFILES[profile],plan=this.plan({imageRect,natural,anchor,toPose});
  this.active=true;this.timing=timing;this.elapsed=0;this.toPose=structuredClone(toPose);this.onDone=onDone;this.userHasCamera=false;
  // DOM transit: the visible figure, scaled about its own corner towards the registered rect.
  const transit=document.createElement('div');transit.className='emerge-transit';transit.setAttribute('aria-hidden','true');
  Object.assign(transit.style,{left:imageRect.x+'px',top:imageRect.y+'px',width:imageRect.w+'px',height:imageRect.h+'px'});
  const img=new Image();img.src=src;img.alt='';const focus=document.createElement('div');focus.className='emerge-focus';
  Object.assign(focus.style,{left:anchor[0]/natural[0]*100+'%',top:anchor[1]/natural[1]*100+'%',width:(anchor[2]-anchor[0])/natural[0]*100+'%',height:(anchor[3]-anchor[1])/natural[1]*100+'%'});
  transit.append(img,focus);this.stage.append(transit);this.transit=transit;this.focus=focus;
  this.zoom={from:imageRect,to:plan.final};this.layout=plan;this.anchor=anchor;this.natural=natural;this.map=texture;this.onSwap=onSwap;
  this.stage.classList.add('is-emerging');
  this.stop=s.animate((now,dt)=>this.frame(dt));
 }
 frame(dt){
  if(!this.active)return false;
  if(!this.paused&&!document.hidden)this.elapsed+=Math.min(dt,.25)*1000;
  const {zoom,reveal,lift,hold}=this.timing,t=this.elapsed;
  if(t<zoom){const u=easeInOut(t/zoom),a=this.zoom.from,b=this.zoom.to,k=(a.w+(b.w-a.w)*u)/a.w;
   this.transit.style.transform=`translate(${(b.x-a.x)*u}px,${(b.y-a.y)*u}px) scale(${k})`;
   this.focus.style.opacity=String(Math.min(1,t/(zoom*.35))*(1-clamp((t-zoom*.82)/(zoom*.18),0,1)*.6));
   return true;}
  if(!this.page)this.swap();
  const r=clamp((t-zoom)/reveal,0,1);this.front.material.opacity=1-easeInOut(r);this.front.visible=r<1;
  const l=clamp((t-zoom-reveal)/lift,0,1),u=easeInOut(l);
  if(!this.userHasCamera){const a=this.layout.pose,b=this.toPose,p=this.scene.pose;for(const key of ['yaw','elevation','halfHeight'])p[key]=a[key]+(b[key]-a[key])*u;p.target=a.target.map((v,i)=>v+(b.target[i]-v)*u);}
  // The page tips back about the printed cube's base and dims as it recedes.
  this.pageGroup.quaternion.setFromAxisAngle(this.axis,-1.45*easeInOut(l));
  const fade=1-easeInOut(clamp((l-.25)/.75,0,1));this.page.material.opacity=fade;this.page.material.color.setScalar(.35+.65*fade);this.page.visible=fade>0;
  if(t>=zoom+reveal+lift+hold){this.finish();return false;}
  return true;
 }
 swap(){
  const s=this.scene,p=this.layout.pose;s.travel=null;s.pose=structuredClone(p);s.updateCamera();
  const {right,up,forward}=s.basis(p),k=s.worldPerPixel(p),cx=s.width/2,cy=s.height/2;
  const world=(x,y,depth)=>new T.Vector3(...p.target).addScaledVector(right,(x-cx)*k).addScaledVector(up,(cy-y)*k).addScaledVector(forward,depth);
  const f=this.zoom.to,a=this.anchor,n=this.natural,q=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(right,up,forward));
  // Hinge at the bottom edge of the printed cube, on the page plane behind the model.
  const pivot=world(f.x+f.w*((a[0]+a[2])/2/n[0]),f.y+f.h*(a[3]/n[1]),-7);
  this.axis=right.clone();this.pageGroup=new T.Group();this.pageGroup.position.copy(pivot);s.scene.add(this.pageGroup);
  const plane=(x,y,w,h,depth,uv)=>{const g=new T.PlaneGeometry(w*k,h*k);if(uv){const at=g.attributes.uv;for(let i=0;i<at.count;i++)at.setXY(i,uv[0]+at.getX(i)*(uv[2]-uv[0]),1-uv[3]+at.getY(i)*(uv[3]-uv[1]));}
   const m=new T.Mesh(g,new T.MeshBasicMaterial({map:this.map,toneMapped:false,transparent:true,depthWrite:false}));m.quaternion.copy(q);m.position.copy(world(x+w/2,y+h/2,depth));return m;};
  this.page=plane(f.x,f.y,f.w,f.h,-7);this.page.position.sub(pivot);this.page.renderOrder=-1;this.pageGroup.add(this.page);
  const ax=f.x+f.w*a[0]/n[0],ay=f.y+f.h*a[1]/n[1],aw=f.w*(a[2]-a[0])/n[0],ah=f.h*(a[3]-a[1])/n[1];
  this.front=plane(ax,ay,aw,ah,7,[a[0]/n[0],a[1]/n[1],a[2]/n[0],a[3]/n[1]]);this.front.material.depthTest=false;this.front.renderOrder=10;s.scene.add(this.front);
  this.onSwap?.();s.renderNow();
  this.transit.remove();this.transit=null;
 }
 // A deliberate drag or key press hands the camera to the reader; the page clears quickly.
 yieldCamera(){if(!this.active)return;this.userHasCamera=true;if(!this.page){this.elapsed=this.timing.zoom;}const z=this.timing.zoom+this.timing.reveal,rest=this.timing.lift;this.elapsed=Math.max(this.elapsed,z+rest*.72);this.timing={...this.timing,hold:0};}
 hold(paused){this.paused=paused;}
 finish(){if(!this.active)return;if(!this.page&&this.transit)this.swap();this.clear();if(!this.userHasCamera){this.scene.pose=structuredClone(this.toPose);}const done=this.onDone;this.onDone=null;done?.();}
 clear(){
  this.active=false;this.stop?.();this.stop=null;this.transit?.remove();this.transit=null;
  if(this.pageGroup){this.scene.scene.remove(this.pageGroup);this.page.geometry.dispose();this.page.material.dispose();}
  if(this.front){this.scene.scene.remove(this.front);this.front.geometry.dispose();this.front.material.dispose();}
  this.page=this.front=this.pageGroup=null;this.stage.classList.remove('is-emerging');this.scene.wake();
 }
 cancel(){this.token=null;if(this.active)this.clear();this.onDone=null;}
}
