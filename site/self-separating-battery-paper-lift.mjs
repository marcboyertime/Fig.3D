// Presentation-only paper lift. The live renderer stays mounted; scientific state
// and camera pose are untouched. Cancelling removes every temporary transform.
export class PaperLift {
 constructor(stage,done){
  this.stage=stage;this.done=done;this.animations=[];this.active=false;this.onscreen=true;
  this.observer=new IntersectionObserver(([e])=>{this.onscreen=e.isIntersecting;this.hold();});this.observer.observe(stage);
  document.addEventListener('visibilitychange',()=>this.hold());
 }
 capture(image,figure){
  if(!image?.complete||!image.naturalWidth)return null;
  const stage=this.stage.getBoundingClientRect(),r=image.getBoundingClientRect();
  if(!r.width||!stage.width)return null;
  const rect={x:r.left-stage.left,y:r.top-stage.top,w:r.width,h:r.height};
  // Figure 1c is the nonperiodic architecture, not the older gyroid in panel b.
  const crop=figure===1?[.72,.10,.27,.8]:[.18,.12,.64,.72];
  const x=Math.max(0,rect.x+rect.w*crop[0]),y=Math.max(0,rect.y+rect.h*crop[1]);
  const focus={x,y,w:Math.max(20,Math.min(stage.width-x,rect.w*crop[2])),h:Math.max(20,Math.min(stage.height-y,rect.h*crop[3]))};
  // A zoomed/panned figure may put the corresponding panel outside the viewport.
  if(x>=stage.width||y>=stage.height){focus.x=stage.width*.3;focus.y=stage.height*.3;focus.w=stage.width*.4;focus.h=stage.height*.4;}
  return {src:image.currentSrc||image.src,rect,focus,width:stage.width,height:stage.height};
 }
 start(source,target,{reduced=false,paused=false,duration=1400}={}){
  this.cancel();if(!source||reduced||!target)return;
  this.active=true;this.paused=paused;this.stage.classList.add('is-lifting');this.stage.dataset.transition='paper-lift';
  const {rect:r,focus:f,width:w,height:h}=source;
  const overlay=document.createElement('div');overlay.className='paper-lift';overlay.setAttribute('aria-hidden','true');
  const sheet=document.createElement('div');sheet.className='paper-lift-sheet';
  Object.assign(sheet.style,{left:r.x+'px',top:r.y+'px',width:r.w+'px',height:r.h+'px'});
  const img=document.createElement('img');img.src=source.src;img.alt='';sheet.append(img);
  const outline=document.createElement('div');outline.className='paper-lift-focus';
  Object.assign(outline.style,{left:(f.x-r.x)+'px',top:(f.y-r.y)+'px',width:f.w+'px',height:f.h+'px'});sheet.append(outline);overlay.append(sheet);this.stage.append(overlay);this.overlay=overlay;
  const dx=f.x+f.w/2-w/2,dy=f.y+f.h/2-h/2,scale=Math.max(.2,Math.min(.65,f.w/(w*.72)));
  const easing='cubic-bezier(.22,.7,.15,1)';
  const animate=(el,frames)=>{const a=el.animate(frames,{duration,fill:'both',easing});this.animations.push(a);return a;};
  sheet.style.transformOrigin=`${f.x-r.x+f.w/2}px ${f.y-r.y+f.h*.8}px`;
  animate(sheet,[
   {transform:'perspective(1100px) translate3d(0,0,0) rotateX(0deg)',opacity:1,offset:0},
   {transform:'perspective(1100px) translate3d(0,0,0) rotateX(0deg)',opacity:1,offset:.13},
   {transform:`perspective(1100px) translate3d(${-dx*.65}px,${h*.16}px,-70px) rotateX(62deg) scale(.9)`,opacity:.85,offset:.62},
   {transform:`perspective(1100px) translate3d(${-dx*.8}px,${h*.28}px,-130px) rotateX(72deg) scale(.8)`,opacity:0,offset:1}
  ]);
  animate(outline,[{opacity:0,offset:0},{opacity:1,offset:.13},{opacity:1,offset:.38},{opacity:0,offset:.72},{opacity:0,offset:1}]);
  const finish=animate(target,[
   {transform:`perspective(1100px) translate3d(${dx}px,${dy}px,0) rotateX(38deg) scale(${scale})`,opacity:0,offset:0},
   {transform:`perspective(1100px) translate3d(${dx}px,${dy}px,0) rotateX(38deg) scale(${scale})`,opacity:0,offset:.12},
   {transform:`perspective(1100px) translate3d(${dx*.25}px,${dy*.25-16}px,50px) rotateX(12deg) scale(.78)`,opacity:1,offset:.62},
   {transform:'perspective(1100px) translate3d(0,0,0) rotateX(0deg) scale(1)',opacity:1,offset:1}
  ]);
  finish.onfinish=()=>this.cancel();this.hold();
 }
 hold(paused=this.paused){this.paused=paused;for(const a of this.animations){if(document.hidden||!this.onscreen||paused)a.pause();else a.play();}}
 settle(){
  if(!this.active)return;
  this.paused=false;
  // Keep the current visual pose, then finish the presentation quickly as input
  // takes over. No camera reset or transform snap on the first drag frame.
  for(const a of this.animations){const left=a.effect.getTiming().duration-(a.currentTime||0);a.playbackRate=Math.max(1,left/180);a.play();}
 }
 cancel(){
  const active=this.active;this.active=false;
  for(const a of this.animations){a.onfinish=null;a.cancel();}this.animations=[];
  this.overlay?.remove();this.overlay=null;this.stage.classList.remove('is-lifting');delete this.stage.dataset.transition;
  if(active)this.done?.();
 }
}
