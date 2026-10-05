// Screen-registered paper-to-volume transition. The source remains original pixels.
import {section,outer,HOME,clamp,ease} from './silicon-nanowire-model.mjs';
const T=window.THREE;
export class PaperEmergence{
 constructor(scene,stage){this.scene=scene;this.stage=stage;this.token=0;this.active=false;this.paused=false;}
 async run(img,{opening=false,onSwap=()=>{},onDone=()=>{}}={}){
  this.cancel();const token=++this.token,sc=this.scene,box=this.stage.getBoundingClientRect(),r=img.getBoundingClientRect();
  const src=img.currentSrc||img.src,texture=await new T.TextureLoader().loadAsync(src);if(token!==this.token){texture.dispose();return;}
  texture.encoding=T.sRGBEncoding;this.texture=texture;const isFive=src.includes('figure-5');
  this.active=true;this.elapsed=0;this.onDone=onDone;this.onSwap=onSwap;this.opening=opening;this.savedPose={...sc.pose};this.oldOpen=sc.state.open;
  const natural=[img.naturalWidth,img.naturalHeight];this.natural=natural;
  const anchor=isFive?[49,390,312,539]:[0,0,...natural];
  const from={x:r.left-box.left,y:r.top-box.top,w:r.width,h:r.height};
  const targetW=Math.min(sc.width*.67,(anchor[2]-anchor[0])*1.45),d=section(sc.state.progress,0),h=d.a*sc.height/targetW;
  this.paperPose=isFive?{yaw:0,elevation:0,halfHeight:h/Math.max(1,.95/(sc.width/sc.height))}:{...sc.pose};
  const scale=targetW/(anchor[2]-anchor[0]),w=natural[0]*scale,hh=natural[1]*scale;
  this.final=isFive?{x:sc.width/2-(anchor[0]+anchor[2])/2*scale,y:sc.height/2-(anchor[1]+anchor[3])/2*scale,w,h:hh}:from;
  this.zoomFrom=from;this.anchor=anchor;this.timings=opening?[1900,1400,2300]:[380,300,650];
  const el=document.createElement('div');el.className='emerge-transit';Object.assign(el.style,{left:from.x+'px',top:from.y+'px',width:from.w+'px',height:from.h+'px'});const copy=new Image();copy.src=src;copy.alt='';el.append(copy);
  if(isFive){const focus=document.createElement('div');focus.className='emerge-focus';Object.assign(focus.style,{left:anchor[0]/natural[0]*100+'%',top:anchor[1]/natural[1]*100+'%',width:(anchor[2]-anchor[0])/natural[0]*100+'%',height:(anchor[3]-anchor[1])/natural[1]*100+'%'});el.append(focus);this.focus=focus;}
  this.stage.append(el);this.transit=el;this.stage.classList.add('is-emerging');this.stop=sc.animate((now,dt)=>this.frame(dt));
 }
 frame(dt){if(!this.active)return false;if(!this.paused)this.elapsed+=dt*1000;const [zoom,reveal,lift]=this.timings,t=this.elapsed,sc=this.scene;
  if(t<zoom){const u=ease(clamp(t/zoom)),a=this.zoomFrom,b=this.final;this.transit.style.transform=`translate(${(b.x-a.x)*u}px,${(b.y-a.y)*u}px) scale(${1+(b.w/a.w-1)*u})`;if(this.focus)this.focus.style.opacity=String(clamp(t/500));return true;}
  if(!this.page)this.swap();
  const u=ease(clamp((t-zoom)/reveal));this.front.material.opacity=1-u;
  const v=ease(clamp((t-zoom-reveal)/lift));this.page.rotation.x=-1.38*v;this.page.material.opacity=1-v;this.page.material.color.setScalar(1-.6*v);
  for(const k of ['yaw','elevation','halfHeight'])sc.pose[k]=this.paperPose[k]+(this.savedPose[k]-this.paperPose[k])*v;
  if(t>=zoom+reveal+lift){const done=this.onDone;this.cancel();sc.pose={...this.savedPose};done();return false;}return true;
 }
 swap(){const sc=this.scene,p=this.paperPose;sc.pose={...p};sc.travel=null;sc.updateCamera();const {right,up,forward}=sc.basis(),k=sc.worldPerPixel(),r=this.final;
  const q=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(right,up,forward));
  const plane=(r,depth,uv)=>{const g=new T.PlaneGeometry(r.w*k,r.h*k);if(uv){const a=g.attributes.uv;for(let i=0;i<a.count;i++)a.setXY(i,uv[0]+a.getX(i)*(uv[2]-uv[0]),1-uv[3]+a.getY(i)*(uv[3]-uv[1]));}
   const m=new T.Mesh(g,new T.MeshBasicMaterial({map:this.texture,toneMapped:false,transparent:true,depthWrite:false,side:T.DoubleSide}));m.quaternion.copy(q);m.position.copy(right).multiplyScalar((r.x+r.w/2-sc.width/2)*k).addScaledVector(up,(sc.height/2-r.y-r.h/2)*k).addScaledVector(forward,depth);sc.scene.add(m);return m;};
  this.page=plane(r,-10);const a=this.anchor,n=this.natural,s=r.w/n[0];this.front=plane({x:r.x+a[0]*s,y:r.y+a[1]*s,w:(a[2]-a[0])*s,h:(a[3]-a[1])*s},10,[a[0]/n[0],a[1]/n[1],a[2]/n[0],a[3]/n[1]]);this.front.material.depthTest=false;this.front.renderOrder=10;this.transit.remove();this.transit=null;this.onSwap();
 }
 cancel(){this.token++;this.active=false;this.stop?.();this.stop=null;this.transit?.remove();this.transit=null;for(const k of ['page','front']){if(this[k]){this.scene.scene.remove(this[k]);this[k].geometry.dispose();this[k].material.dispose();this[k]=null;}}this.texture?.dispose();this.texture=null;this.stage.classList.remove('is-emerging');this.scene.wake();}
 interrupt(){if(!this.active)return;const done=this.onDone;this.cancel();done?.();}
}
