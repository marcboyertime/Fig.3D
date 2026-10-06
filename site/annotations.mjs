// Anchored annotations shared by every visual on the site.
// A callout is a small ring or pin on the thing it names, a hairline that bends into a short shelf, and a title with
// an optional one-line explanation. The ring is redrawn on its anchor every frame, so a callout rides a moving ion,
// a turning model or a growing front; the text block eases when it has to change side.
//
//   const notes = new Annotations(stageElement);
//   notes.show([{id:'li', title:'Lithium ion', note:'Leaves graphite', tone:'#80f3d0', at:()=>({x,y,r}), dir:[1,-.6]}]);
//   notes.frame();   // optional: call after the page renders so rings never lag the picture by a frame
//
// Spec fields
//   id        stable key; showing the same id again keeps the callout in place and swaps its text if it changed
//   title     short name of the thing (required); note: one short line saying what it does or why it matters
//   at()      anchor in stage pixels: {x,y} plus optional r (ring radius around the object) and visible:false
//   dir       preferred direction from anchor to text, [dx,dy] in screen space; dist: extra reach in px
//   tone      CSS colour of ring, line and title
//   fade()    optional 0..1 multiplier the page controls (for example a camera transition)
//   phone     false hides it when the stage is narrow; 'note' keeps its note there too
//   home()    optional fixed point for the words; the line then swings to follow a moving anchor
//   priority  lower places first and wins collisions (default: order given)
//   live      text that follows a slider: swap it without the blur
//   onSelect  makes the text a button (hover previews, click pins); select(id) marks one as pressed
// Options: avoid() returns circles {x,y,r} or rects {x,y,w,h} the words should stay off (usually the model itself).
// The first callouts wait for the page's staged opening to finish and for the stage to be on screen.
const SVG='http://www.w3.org/2000/svg';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=t=>1-Math.pow(1-clamp(t,0,1),3),smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const reducedQuery=matchMedia('(prefers-reduced-motion: reduce)');

export class Annotations{
  constructor(stage,options={}){
    this.stage=stage;this.options={compactWidth:560,stagger:260,...options};
    this.items=new Map();this.order=[];this.pending=null;this.selected=null;this.last=0;this.raf=0;this.visible=true;
    this.layer=document.createElement('div');this.layer.className='fig-ann';
    this.svg=document.createElementNS(SVG,'svg');this.svg.setAttribute('aria-hidden','true');this.layer.append(this.svg);
    if(options.className)this.layer.classList.add(...options.className.split(' '));
    stage.append(this.layer);
    this.resize();new ResizeObserver(()=>{this.resize();this.kick();}).observe(stage);
    // Wait for the staged opening, then for the stage to be seen, so the first callouts draw in where the reader is looking.
    const opening=window.Fig3DOpening?.done||Promise.resolve();
    this.gate=new Promise(resolve=>{
      opening.then(()=>{
        const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){io.disconnect();setTimeout(resolve,options.gateDelay??350);}},{threshold:.35});
        io.observe(stage);
      });
    });
    this.ready=false;this.gate.then(()=>{this.ready=true;if(this.pending){const p=this.pending;this.pending=null;this.show(...p);}});
    new IntersectionObserver(entries=>{this.visible=entries.some(e=>e.isIntersecting);if(this.visible)this.kick();},{rootMargin:'120px'}).observe(stage);
  }
  get compact(){return this.width<this.options.compactWidth;}
  resize(){
    const r=this.stage.getBoundingClientRect();this.width=r.width;this.height=r.height;
    this.svg.setAttribute('viewBox',`0 0 ${r.width} ${r.height}`);
    this.layer.classList.toggle('is-compact',this.compact);
    for(const item of this.items.values())item.measured=false;
  }
  // Replace the set of callouts. Callouts already showing stay where they are; new ones draw in one after another.
  show(specs,{stagger=this.options.stagger,delay=0}={}){
    specs=specs.filter(Boolean);
    if(!this.ready){this.pending=[specs,{stagger,delay}];return;}
    const now=performance.now(),keep=new Set(specs.map(s=>s.id));
    for(const [id,item] of this.items)if(!keep.has(id))item.leaving=true;
    let n=0;
    specs.forEach((spec,i)=>{
      let item=this.items.get(spec.id);
      if(item&&!item.removed){
        item.leaving=false;
        if(item.spec.title!==spec.title||item.spec.note!==spec.note){item.spec=spec;this.write(item,!spec.live);}else item.spec=spec;
      }else{
        item=this.create(spec);item.start=now+delay+(n++)*stagger;
      }
      item.priority=spec.priority??i;
    });
    this.order=[...this.items.values()];this.kick();
  }
  hide(){this.show([]);}
  select(id){this.selected=id;for(const item of this.items.values())item.label.setAttribute?.('aria-pressed',String(item.spec.id===id));}
  create(spec){
    const g=document.createElementNS(SVG,'g'),lead=document.createElementNS(SVG,'path'),ring=document.createElementNS(SVG,'circle'),pin=document.createElementNS(SVG,'circle');
    g.setAttribute('class','fig-ann-mark');lead.setAttribute('class','lead');lead.setAttribute('pathLength','1');ring.setAttribute('class','ring');pin.setAttribute('class','pin');
    g.append(lead,ring,pin);this.svg.append(g);
    const label=document.createElement(spec.onSelect?'button':'div');label.className='fig-ann-label';
    if(spec.onSelect){
      label.type='button';label.setAttribute('aria-pressed','false');
      label.addEventListener('pointerenter',()=>spec.onSelect(spec.id,false));label.addEventListener('pointerleave',()=>spec.onSelect(null,false));
      label.addEventListener('focus',()=>spec.onSelect(spec.id,false));label.addEventListener('blur',()=>spec.onSelect(null,false));
      label.addEventListener('click',()=>item.spec.onSelect(item.spec.id,true));
    }
    label.innerHTML='<b></b><span></span>';this.layer.append(label);
    const item={spec,g,lead,ring,pin,label,p:0,vis:0,off:null,choice:0,measured:false,leaving:false,start:0};
    this.items.set(spec.id,item);this.write(item,false);return item;
  }
  write(item,swap){
    const {spec,label}=item;label.querySelector('b').innerHTML=spec.title;const note=label.querySelector('span');note.innerHTML=spec.note||'';note.hidden=!spec.note;
    label.dataset.phone=spec.phone===false?'no':spec.phone==='note'?'note':'title';
    if(spec.onSelect)label.setAttribute('aria-label',spec.label||label.textContent);
    const tone=spec.tone||'#c9d5f5';item.g.style.setProperty('--tone',tone);label.style.setProperty('--tone',tone);
    item.measured=false;
    if(swap&&!reducedQuery.matches){label.classList.remove('is-swap');void label.offsetWidth;label.classList.add('is-swap');}
  }
  remove(item){item.g.remove();item.label.remove();item.removed=true;this.items.delete(item.spec.id);}
  kick(){if(!this.raf&&this.visible)this.raf=requestAnimationFrame(t=>{this.raf=0;this.tick(t);});}
  tick(t){
    const dt=this.last?Math.min(64,t-this.last):16;this.last=t;
    const busy=this.layout(t,dt);
    // Keep running while anything is shown: anchors may move without the page telling us.
    if(this.items.size&&(busy||this.order.length))this.kick();else this.last=0;
  }
  frame(){this.layout(performance.now(),0);}
  layout(now,dt){
    const W=this.width,H=this.height;if(!W||!H)return false;
    const reduced=reducedQuery.matches,compact=this.compact,margin=compact?8:12,placed=[],anchors=[];let busy=false;
    const avoid=(this.options.avoid?.()||[]).filter(Boolean);
    const list=[...this.items.values()].sort((a,b)=>a.priority-b.priority);
    // Anchors first, so a text block can avoid sitting on someone else's ring.
    for(const item of list){
      const a=item.spec.at?.();item.a=a&&Number.isFinite(a.x)&&Number.isFinite(a.y)?a:null;
      const hiddenOnPhone=compact&&item.spec.phone===false;
      const fade=item.spec.fade?clamp(item.spec.fade(),0,1):1;
      item.want=!item.leaving&&!hiddenOnPhone&&item.a&&item.a.visible!==false&&fade>.02?fade:0;
      if(item.a&&item.want)anchors.push(item);
    }
    for(const item of list){
      // Appearance: the ring opens, the hairline draws out, then the words arrive.
      if(now>=item.start&&!item.leaving&&item.p<1){item.p=reduced?1:Math.min(1,item.p+dt/760);busy=true;}
      const k=reduced||dt===0?1:1-Math.exp(-dt/(item.leaving?120:160));
      const before=item.vis;item.vis+=(item.want*(now>=item.start?1:0)-item.vis)*k;if(Math.abs(item.vis-before)>.001)busy=true;
      if(item.leaving&&item.vis<.01){this.remove(item);continue;}
      const shown=item.vis>.01&&item.a;
      item.g.style.display=shown?'':'none';item.label.style.visibility=shown?'':'hidden';
      if(!shown)continue;
      if(!item.measured){item.w=item.label.offsetWidth;item.h=item.label.offsetHeight;const b=item.label.querySelector('b');item.titleMid=b.offsetTop+b.offsetHeight/2;item.measured=true;}
      const a=item.a,r=Math.max(0,a.r||0),spec=item.spec;
      // A callout with a home keeps its words near a fixed point while its line follows the moving anchor.
      const h=spec.home?.(),base=h&&Number.isFinite(h.x)&&Number.isFinite(h.y)?h:a,rb=base===a?r:0;
      let [dx,dy]=spec.dir||[1,-.7];const n=Math.hypot(dx,dy)||1;dx/=n;dy/=n;
      const reach=(compact?18:26)+(spec.dist||0)*(compact?.7:1)+rb,shelf=compact?8:12,gap=compact?5:6;
      const box=(ox,oy,side)=>{const ex=base.x+ox,ey=base.y+oy,x=side>0?ex+shelf+gap:ex-shelf-gap-item.w;return {ex,ey,x,y:ey-item.titleMid,w:item.w,h:item.h,side};};
      const candidates=[[dx,dy],[-dx,dy],[dx,-dy],[-dx,-dy],[dx*1.8,dy*1.8],[-dx*1.8,dy*1.8],[dx,dy*.1],[-dx,dy*.1],...(avoid.length?[[dx*3,dy*2],[-dx*3,dy*2],[dx*4.5,dy*1.2],[-dx*4.5,dy*1.2],[dx*6,dy*.6],[-dx*6,dy*.6],[dx*2,dy*4],[-dx*2,dy*4]]:[])].map(([cx,cy])=>{
        const side=Math.abs(cx)<.12?(spec.side||1):Math.sign(cx);let b=box(cx*reach,cy*reach,side);
        // Slide vertically to stay inside the frame; the hairline absorbs the difference.
        const shift=clamp(b.y,margin,H-margin-b.h)-b.y;if(shift)b=box(cx*reach,cy*reach+shift,side);
        return b;
      });
      const score=b=>{
        let s=0;if(b.x<margin)s+=margin-b.x;if(b.x+b.w>W-margin)s+=b.x+b.w-W+margin;
        for(const o of placed){const ox=Math.min(b.x+b.w,o.x+o.w)-Math.max(b.x,o.x)+8,oy=Math.min(b.y+b.h,o.y+o.h)-Math.max(b.y,o.y)+6;if(ox>0&&oy>0)s+=ox*oy*.05+20;}
        // Keep the words off the model where there is room beside it: a small cost per pixel of overlap.
        for(const z of avoid){
          if(z.r){const nx=clamp(z.x,b.x,b.x+b.w),ny=clamp(z.y,b.y,b.y+b.h),d=z.r-Math.hypot(z.x-nx,z.y-ny);if(d>0)s+=d*.35+4;}
          else{const ox=Math.min(b.x+b.w,z.x+z.w)-Math.max(b.x,z.x),oy=Math.min(b.y+b.h,z.y+z.h)-Math.max(b.y,z.y);if(ox>0&&oy>0)s+=ox*oy*.01+4;}
        }
        // Never cover the thing being named.
        {const rr=r+5,nx=clamp(a.x,b.x,b.x+b.w),ny=clamp(a.y,b.y,b.y+b.h);if(Math.hypot(a.x-nx,a.y-ny)<rr)s+=400;}
        for(const o of anchors){if(o===item)continue;const p=o.a,rr=(p.r||3)+4;if(p.x>b.x-rr&&p.x<b.x+b.w+rr&&p.y>b.y-rr&&p.y<b.y+b.h+rr)s+=12;}
        return s;
      };
      // Keep the current side while it still works, so callouts do not flicker between positions.
      let choice=item.choice,best=score(candidates[choice]);
      if(best>0)candidates.forEach((c,i)=>{const s=score(c)+(i===item.choice?0:6);if(s<best-.01){best=s;choice=i;}});
      item.choice=choice;let target=candidates[choice];
      // Out of frame horizontally even at its best: pin the text inside and let the line bend to it.
      if(target.x<margin||target.x+target.w>W-margin){const x=clamp(target.x,margin,W-margin-target.w),d=x-target.x;target={...target,x,ex:target.ex+d};}
      const goal=[target.ex-base.x,target.ey-base.y,target.x-base.x,target.y-base.y,target.side];
      if(!item.off||reduced)item.off=goal.slice();
      else{const f=dt===0?0:1-Math.exp(-dt/150);for(let i=0;i<4;i++){const d=goal[i]-item.off[i];item.off[i]+=d*f;if(Math.abs(d)>.4)busy=true;}item.off[4]=goal[4];}
      placed.push(target);
      const ex=base.x+item.off[0],ey=base.y+item.off[1],lx=base.x+item.off[2],ly=base.y+item.off[3],side=item.off[4];
      const sx=ex+side*shelf,ux=ex-a.x,uy=ey-a.y,len=Math.hypot(ux,uy)||1,start=r>0?r+2.5:3.4;
      const ax=a.x+ux/len*start,ay=a.y+uy/len*start;
      item.lead.setAttribute('d',len>start+2?`M${ax.toFixed(1)} ${ay.toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}H${sx.toFixed(1)}`:`M${ex.toFixed(1)} ${ey.toFixed(1)}H${sx.toFixed(1)}`);
      const p=item.p,ringP=ease(p/.3),lineP=smooth((p-.12)/.5),textP=ease((p-.45)/.55);
      item.lead.style.strokeDashoffset=(1-lineP).toFixed(3);
      item.ring.setAttribute('cx',a.x.toFixed(1));item.ring.setAttribute('cy',a.y.toFixed(1));item.ring.setAttribute('r',((r>0?r+2.5:5.2)*(.6+.4*ringP)).toFixed(2));
      item.pin.setAttribute('cx',a.x.toFixed(1));item.pin.setAttribute('cy',a.y.toFixed(1));item.pin.setAttribute('r',r>0?0:(2.1*ringP).toFixed(2));
      item.g.style.opacity=(item.vis*ringP).toFixed(3);item.g.classList.toggle('has-ring',r>0);
      const pressed=this.selected===spec.id;item.g.classList.toggle('is-pressed',pressed);
      item.label.style.opacity=(item.vis*textP).toFixed(3);
      item.label.style.transform=`translate3d(${Math.round(lx+(1-textP)*side*-6)}px,${Math.round(ly)}px,0)`;
      item.label.classList.toggle('is-left',side<0);
      item.label.style.pointerEvents=spec.onSelect&&item.vis*textP>.6?'auto':'none';
    }
    return busy;
  }
}

// Screen position of a three.js point inside a canvas of the given CSS size. visible is false behind the camera.
export function projectPoint(T,camera,point,width,height,radius=0){
  const v=point.clone().project(camera);const out={x:(v.x*.5+.5)*width,y:(-v.y*.5+.5)*height,visible:v.z<1&&v.z>-1};
  if(radius){
    // Screen radius of a sphere of this world radius at this point.
    const d=camera.position.distanceTo(point),f=height/(2*Math.tan((camera.fov||45)*Math.PI/360));
    out.r=camera.isOrthographicCamera?radius*height/(camera.top-camera.bottom)*camera.zoom:radius*f/d;
  }
  return out;
}

// Position of an SVG user-space point inside a stage element.
export function svgPoint(svg,x,y,stage){
  const m=svg.getScreenCTM();if(!m)return null;const s=stage.getBoundingClientRect();
  return {x:m.a*x+m.c*y+m.e-s.left,y:m.b*x+m.d*y+m.f-s.top};
}
