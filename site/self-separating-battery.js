import {Emergence} from './self-separating-battery-emergence.mjs?v=5';
import {updateDepthUI,formationWall} from './self-separating-battery-depth-ui.mjs?v=5';
import {initialState,reduce,caption,PHASES,PAPER_POSE,HOME,anchorFor,showingPaper,openingSchedule,OPENING_END} from './self-separating-battery-model.mjs?v=5';
const $=id=>document.getElementById(id),all=s=>[...document.querySelectorAll(s)];
const query=new URLSearchParams(location.search),media=matchMedia('(prefers-reduced-motion: reduce)');
let state=initialState(media.matches||query.has('reduced')),scene=null,emergence=null,loaded=false,fallbackMode=false;
let openingTime=0,lastTime=0,introRAF=0,beatId=null,lastCaption='';

// ————— Figures —————
const FIGURES={
 1:{size:[1276,414],title:'Three architectures',caption:'Panel a: layered electrodes rolled into a cylindrical cell. Panel b: an earlier ordered, double-gyroid Li–S architecture. Panel c: the nonperiodic carbon, polymer and SEI architecture of this paper. The caption explains that domains which appear isolated form continuous networks through the monolith.',alt:'Original Figure 1: a, layered electrodes rolled into a cylindrical cell; b, an earlier ordered double-gyroid battery; c, this paper’s nonperiodic carbon, separator and cathode networks. Panel labels and scale bars preserved.'},
 2:{size:[1431,702],title:'How the device is built',caption:'Co-assembly of a block copolymer with resols; pyrolysis under nitrogen to porous carbon; electropolymerization of AQEDOT onto the carbon; SEI formation between carbon and polymer. Chemical structures and the ~100 nm inset scale are preserved.',alt:'Original Figure 2: co-assembled hybrid, porous carbon after pyrolysis, electropolymerized PAQEDOT coating and SEI formation, with chemical structures and magnified pore insets.'},
 5:{size:[1125,794],title:'Electrochemical processing',caption:'a, initial discharge of carbon against an external lithium chip; b, a lower-potential discharge then oxidation of the carbon; c, reduction of PAQEDOT against lithium; d, charging the device in electrolyte. Each inset shows which leads the instrument holds.',alt:'Original Figure 5: four potential–capacity curves with inset diagrams of the vial, device, lithium chip and instrument terminals for each processing step.'},
 6:{size:[1428,753],title:'What the device can do',caption:'a, the set-up; b and d, open-circuit holds; c, the first three discharges of the initial device; e and f, a later processing iteration. Capacity axes are per gram of PAQEDOT.',alt:'Original Figure 6: photograph of the set-up, open-circuit voltage holds over five hours, and discharge curves for two device iterations.'}
};
const figureViews=Object.fromEntries(Object.keys(FIGURES).map(k=>[k,{zoom:1,x:0,y:0}]));
const figureNumber=()=>Number(state.display);
function loadFigure(n){
 const img=$('paper-image'),f=FIGURES[n],src=`assets/self-separating-battery/figure-${n}.jpg`;
 if(!img.src.endsWith(src)){img.src=src;[img.width,img.height]=f.size;img.alt=f.alt;}
 $('paper-original').href=src;
}
function saveFigure(){if(showingPaper(state)){const v=figureViews[state.display],p=$('paper-viewport');v.x=p.scrollLeft;v.y=p.scrollTop;}}
function sizeFigure(){
 if(!showingPaper(state))return;
 const p=$('paper-viewport'),img=$('paper-image'),v=figureViews[state.display],[w,h]=FIGURES[state.display].size;
 const fit=Math.min(p.clientWidth,p.clientHeight*(w/h),w*1.6);
 img.style.width=Math.max(1,fit*v.zoom)+'px';
 $('figure-out').disabled=v.zoom<=1;$('figure-in').disabled=v.zoom>=4;
 $('figure-help').textContent=v.zoom===1?'Original figure · Tait et al. 2026':'Drag or scroll to inspect · '+Math.round(v.zoom*100)+'%';
}
function zoomFigure(factor){
 const p=$('paper-viewport'),v=figureViews[state.display],old=v.zoom;
 const center=[(p.scrollLeft+p.clientWidth/2)/p.scrollWidth,(p.scrollTop+p.clientHeight/2)/p.scrollHeight];
 v.zoom=factor===0?1:Math.max(1,Math.min(4,v.zoom*factor));if(v.zoom===old)return;
 sizeFigure();p.scrollTo(center[0]*p.scrollWidth-p.clientWidth/2,center[1]*p.scrollHeight-p.clientHeight/2);saveFigure();
}
function stageRect(el){const s=$('scene-stage').getBoundingClientRect(),r=el.getBoundingClientRect();return {x:r.left-s.left,y:r.top-s.top,w:r.width,h:r.height};}

// ————— State and display —————
function dispatch(action){
 const before=state;
 if((action.type==='view'||action.type==='depth'||action.type==='depth-enter'||action.type==='depth-exit')&&showingPaper(state)){saveFigure();state=reduce(state,{type:'display',value:'model'});}
 state=reduce(state,action);
 if(before.opening&&!state.opening)endOpening();
 if(action.type==='pause'){emergence?.hold(state.paused);$('opening-pause').setAttribute('aria-pressed',String(state.paused));}
 render();scene?.setState(state);
}
function setCaption(c){const signature=c.join('|');if(signature===lastCaption)return;lastCaption=signature;$('caption-kicker').textContent=c[0];$('caption-title').textContent=c[1];$('caption-copy').textContent=c[2];$('caption-copy').hidden=!c[2];$('caption-note').textContent=c[3]||'';}
function render(){
 const paper=showingPaper(state);
 document.body.classList.toggle('exploring',!state.opening);
 $('explorer').classList.toggle('showing-paper',paper);$('explorer').dataset.topic=state.deep?.topic||'';
 $('scene-content').inert=paper;$('scene-content').setAttribute('aria-hidden',String(paper));
 $('paper-view').hidden=!paper;$('figure-tools').hidden=!paper||state.opening;$('paper-details').hidden=!paper||state.opening;$('controls').hidden=paper||!!state.deep;
 if(paper){loadFigure(state.display);sizeFigure();}
 all('[data-display]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.display===state.display)));
 $('display-model').hidden=fallbackMode;
 all('[data-view]').forEach(b=>{const on=b.dataset.view===state.view;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});$('inspection').setAttribute('aria-labelledby','tab-'+state.view);
 all('[data-architecture]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.architecture===state.architecture)));all('[data-stage]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.stage===state.stage)));all('[data-layer]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.layer===state.layer)));all('[data-route]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.route===state.route)));
 const layered=state.view==='architecture'&&state.architecture==='layered',network=state.view!=='interface'&&!layered;
 $('architecture-controls').hidden=state.view!=='architecture';$('fabrication-controls').hidden=state.view!=='fabrication';$('interface-controls').hidden=state.view!=='interface';
 $('material-controls').hidden=state.view==='fabrication';$('cut-controls').hidden=!network;$('route-controls').hidden=state.view!=='architecture'||!network;
 $('cut').value=Math.round(state.cut*100);$('cut-readout').textContent=state.cut===0?'Whole':state.cut>=.99?'Through the middle':Math.round(state.cut*50)+'% of the way in';
 $('transport').textContent=state.reduced?'Motion reduced':state.transport?'Pause motion':'Resume motion';$('transport').setAttribute('aria-pressed',String(!state.transport));$('transport').disabled=state.reduced;
 $('stage-process').textContent={hybrid:'Block copolymer + resols → co-assembled hybrid',carbon:'N₂ + heat → porous carbon',cathode:'AQEDOT → electropolymerized PAQEDOT',sei:'External Li + electrolyte → interphase'}[state.stage];
 document.querySelector('[data-layer=sei]').lastChild.textContent=layered?'Separator':'SEI';
 renderKey();
 if(paper&&!state.opening){const f=FIGURES[state.display];setCaption([`ORIGINAL FIGURE ${state.display} · TAIT ET AL. 2026`,f.title,'','']);$('paper-caption').textContent=f.caption;}
 else if(!state.opening&&!state.deep)setCaption(caption(state));
 updateDepthUI(state,{setCaption,dispatch,fallback:fallbackMode});
 $('controls').hidden=paper||!!state.deep;
 $('opening-controls').hidden=!state.opening;$('opening-pause').textContent=state.paused?'Resume':'Pause';$('opening-pause').setAttribute('aria-label',state.paused?'Resume the opening':'Pause the opening');
 $('controls').classList.toggle('dimmed',state.opening);
 $('depth-toggle').disabled=!loaded&&!fallbackMode;
 $('scene-help').textContent=fallbackMode?'The 3D view is unavailable; figures and explanations remain':state.deep?.topic==='evidence'?'Original Figure 6 with marks at reported values':state.deep?'Drag to turn · arrow keys rotate':state.view==='interface'?'Drag to turn · select a layer':'Drag to turn · select a material';
}
// Moving carriers drawn in the scene: the key names them so the motion reads without the caption.
const CARRIERS={li:{swatch:'#f3c36a',name:'Li⁺ ion'},e:{swatch:'#e9eef8',name:'Electron'}};
function renderKey(){
 const d=state.deep,paper=showingPaper(state);let keys=[];
 if(!d&&state.view==='fabrication')keys=state.stage==='hybrid'?['precursor','template']:state.stage==='carbon'?['carbon']:state.stage==='cathode'?['carbon','cathode']:['carbon','sei','cathode'];
 else if(!d&&state.view==='architecture')keys=['carbon','sei','cathode'];
 else if(d?.topic==='connectivity')keys=['carbon','sei','cathode'];
 else if(!d&&state.view==='interface')keys=['li','e'];
 else if(d?.topic==='length')keys=['li'];
 const layered=state.view==='architecture'&&state.architecture==='layered'&&!d;
 const signature=keys.join()+layered;if($('scene-key').dataset.signature===signature)return;$('scene-key').dataset.signature=signature;
 $('scene-key').hidden=!keys.length||paper;
 $('scene-key').replaceChildren(...keys.map(k=>{const s=document.createElement('span'),i=document.createElement('i');const item=PHASES[k]||CARRIERS[k];i.style.background=item.swatch;s.append(i,document.createTextNode(k==='sei'&&layered?'Separator':k==='carbon'&&layered?'Anode':k==='cathode'&&layered?'Cathode':item.name));return s;}));
}

// ————— Opening —————
const schedule=openingSchedule();
function endOpening(){cancelAnimationFrame(introRAF);introRAF=0;beatId=null;$('opening-controls').hidden=true;$('opening-progress').style.setProperty('--p','1');}
function startOpening(){if(!state.opening)return endOpening();lastTime=0;introRAF=requestAnimationFrame(intro);}
function intro(now){
 introRAF=0;if(!state.opening)return;
 const r=$('scene-stage').getBoundingClientRect(),onscreen=r.bottom>80&&r.top<innerHeight-80;
 // The first-visit page opening holds this clock until the stage has appeared.
 if(!state.paused&&!document.hidden&&onscreen&&!window.Fig3DOpening?.holding){
  const beat=schedule.find(b=>openingTime<b.end);
  // Hold the clock at the hand-over until the model can actually appear.
  const waiting=beat?.emerge&&!loaded;
  if(lastTime&&!waiting)openingTime+=Math.min(now-lastTime,250)/1000;
  if(!beat){finishOpening();return;}
  if(beat.id!==beatId){beatId=beat.id;enterBeat(beat);}
  if(beat.cut!==undefined&&state.cut<beat.cut){const v=Math.min(beat.cut,(openingTime-beat.start)/1.8*beat.cut);if(v>state.cut){state=reduce(state,{type:'cut',value:v,opening:true});scene?.setState(state);$('cut').value=Math.round(v*100);$('cut-readout').textContent=Math.round(v*50)+'% of the way in';}}
  $('opening-progress').style.setProperty('--p',String(openingTime/OPENING_END));
 }
 lastTime=now;introRAF=requestAnimationFrame(intro);
}
function enterBeat(beat){
 setCaption([beat.kicker,beat.title,beat.copy,beat.display==='1'?'Original figure, unaltered · arXiv:2604.26222v1':'']);
 if(beat.emerge)beginEmergence({profile:'opening',toPose:structuredClone(HOME),opening:true});
 if(beat.layer&&state.layer!==beat.layer){state=reduce(state,{type:'layer',value:beat.layer,opening:true});render();scene?.setState(state);}
}
function finishOpening(){
 // The guided sequence ends by restoring every material, without moving the camera.
 state=reduce(state,{type:'layer',value:'all'});state={...state,opening:false,paused:false};
 endOpening();render();scene?.setState(state);
}
// Any deliberate input hands control to the reader; the opening never takes it back.
function interruptOpening(){if(state.opening)dispatch({type:'explore'});}

// ————— Paper ⇄ model transitions —————
function beginEmergence({profile,toPose,opening=false}){
 const figure=figureNumber(),anchor=anchorFor(state,figure),img=$('paper-image');
 if(!scene||!loaded||!anchor||state.reduced||!img.complete){switchToModel();return false;}
 const rect=stageRect(img);
 if(!emergence.visible(rect,anchor,FIGURES[figure].size)){switchToModel();return false;}
 saveFigure();$('scene-stage').classList.add('emerging-from-paper');
 emergence.hold(state.paused);
 emergence.run({src:img.currentSrc||img.src,natural:FIGURES[figure].size,imageRect:rect,anchor,toPose,profile,
  onSwap:()=>{state=reduce(state,{type:'display',value:'model',opening});render();scene.setState(state);$('scene-stage').classList.remove('emerging-from-paper');},
  onDone:()=>{$('scene-stage').classList.remove('emerging-from-paper');}});
 return true;
}
function switchToModel(){saveFigure();state=reduce(state,{type:'display',value:'model'});render();scene?.setState(state);}
function switchDisplay(value){
 if(value===state.display)return;
 if(state.opening){state={...state,opening:false,paused:false};endOpening();}
 if(emergence?.active)emergence.finish();
 if(value==='model'){
  const pose=scene?structuredClone(scene.pose):null;
  if(!(pose&&beginEmergence({profile:'return',toPose:pose})))switchToModel();
  return;
 }
 saveFigure();state=reduce(state,{type:'display',value});render();
 const v=figureViews[value];$('paper-viewport').scrollTo(v.x,v.y);
 scene?.setState(state);
}

// ————— Scene overlays: labels and the leader to the magnified wall —————
const labelEls=new Map(),wallY=x=>.14*Math.sin(x*.83)+.13*Math.cos(1.65*1.1);
function placeLabels(s){
 const host=$('scene-labels'),items=[],d=state.deep;
 if(!showingPaper(state)&&!state.opening||!showingPaper(state)){
  if(d&&s.deep)items.push(...(d.topic==='formation'?s.deep.bench.anchors():s.deep.labels).map(l=>({...l,at:s.deep.bench&&d.topic==='formation'?l.at:l.at})));
  if(!d&&state.view==='interface'){const L=s.layers;items.push({id:'i-carbon',text:'Carbon',at:[2.75,(L.carbon[0]+L.carbon[1])/2+wallY(2.65),1.65],kind:'phase',align:'start'},{id:'i-sei',text:'SEI',at:[2.75,(L.sei[0]+L.sei[1])/2+wallY(2.65),1.65],kind:'phase',align:'start'},{id:'i-poly',text:'PAQEDOT',at:[2.75,(L.cathode[0]+L.cathode[1])/2+wallY(2.65),1.65],kind:'phase',align:'start'},{id:'i-circuit',text:'External circuit',at:[-3.25,1.95,0],kind:'quiet'});}
 }
 const seen=new Set();
 for(const item of items){
  let el=labelEls.get(item.id);if(!el){el=document.createElement('span');labelEls.set(item.id,el);host.append(el);}
  seen.add(item.id);el.textContent=item.text;el.className='label '+(item.kind||'')+(item.align?' align-'+item.align:'');
  const p=s.project(item.at),w=el.offsetWidth,half=item.align==='start'?0:item.align==='end'?w:w/2;
  const x=Math.max(8+half,Math.min(s.width-8-(w-half),p.x)),y=Math.max(14,Math.min(s.height-40,p.y));
  el.style.transform=`translate(${(x-half).toFixed(1)}px,${(y-11).toFixed(1)}px)`;el.hidden=false;
 }
 for(const [id,el] of labelEls)if(!seen.has(id))el.hidden=true;
 // Hairline from the device to the magnified wall: the two views show one place.
 const leader=$('leader').firstElementChild,wall=$('formation-wall');
 if(d?.topic==='formation'&&s.deep&&!wall.hidden){
  const b=s.deep.bench,p=s.project([b.device.position.x+.43,b.device.position.y,0]),w=stageRect(wall),portrait=s.width<s.height*.95;
  const tx=portrait?Math.min(w.x+w.w*.5,p.x+40):w.x,ty=portrait?w.y:w.y+w.h*.45;
  leader.setAttribute('d',portrait?`M${p.x} ${p.y}V${(p.y+ty)/2}H${tx}V${ty}`:`M${p.x} ${p.y}H${(p.x+tx)/2}V${ty}H${tx}`);leader.parentElement.style.display='';
 }else leader.parentElement.style.display='none';
}

// ————— Wiring —————
function fallback(error){
 console.warn('3D fallback:',error?.message||'context lost');fallbackMode=true;emergence?.cancel();
 scene?.stop();$('loading').hidden=true;$('fallback').hidden=false;document.body.classList.add('is-fallback');
 if(state.opening)endOpening();
 state={...state,opening:false,paused:false,display:state.display==='model'?'1':state.display};
 all('[data-camera],#cut,#depth-slice,#depth-length-slider,[data-route],[data-layer],[data-architecture]').forEach(b=>b.disabled=true);render();
}
all('[data-view]').forEach(b=>b.addEventListener('click',()=>dispatch({type:'view',value:b.dataset.view})));
function tabKeys(container,selector,activate){container.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=all(selector).filter(b=>!b.hidden),i=tabs.indexOf(document.activeElement),n=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[n].focus();activate(tabs[n]);});}
tabKeys($('overview-tabs'),'[data-view]',b=>b.click());tabKeys($('depth-tabs'),'[data-depth-topic]',b=>b.click());tabKeys($('display-switch'),'[data-display]',b=>b.click());
for(const [attr,type] of [['architecture','architecture'],['stage','stage'],['layer','layer'],['route','route']])all(`[data-${attr}]`).forEach(b=>b.addEventListener('click',()=>{if(emergence?.active)emergence.finish();dispatch({type,value:b.dataset[attr]});}));
$('cut').addEventListener('input',e=>dispatch({type:'cut',value:e.target.value/100}));
// Any reader input on the stage during the opening or an emergence hands control over for good.
for(const type of ['pointerdown','wheel'])$('scene-stage').addEventListener(type,e=>{
 if(e.target.closest('.stage-bar'))return;
 if(emergence?.active)emergence.yieldCamera();
 if(state.opening)interruptOpening();
},{passive:true,capture:true});
$('explore').addEventListener('click',()=>{if(emergence?.active)emergence.finish();if(showingPaper(state)&&state.opening){state={...state,opening:false,paused:false};endOpening();beginEmergence({profile:'return',toPose:structuredClone(HOME)})||switchToModel();render();return;}dispatch({type:'explore'});});
$('opening-pause').addEventListener('click',()=>dispatch({type:'pause'}));
$('transport').addEventListener('click',()=>dispatch({type:'transport'}));
all('[data-camera]').forEach(b=>b.addEventListener('click',()=>{interruptOpening();emergence?.yieldCamera();const a=b.dataset.camera;({left:()=>scene?.turn(-32,0),right:()=>scene?.turn(32,0),up:()=>scene?.turn(0,-32),down:()=>scene?.turn(0,32),in:()=>scene?.zoom(.84),out:()=>scene?.zoom(1.2),reset:()=>scene?.home()})[a]();}));
all('[data-display]').forEach(b=>b.addEventListener('click',()=>switchDisplay(b.dataset.display)));
// Escape returns from any original figure to the model, unless a text field or open menu owns the key.
document.addEventListener('keydown',e=>{if(e.key!=='Escape'||fallbackMode||!showingPaper(state)||e.target.closest?.('input,textarea,select,details[open] summary'))return;const inside=$('explorer').contains(document.activeElement);switchDisplay('model');if(inside)$('display-model').focus({preventScroll:true});});
all('[data-paper]').forEach(b=>b.addEventListener('click',()=>{switchDisplay(b.dataset.paper);$('display-figure-'+b.dataset.paper)?.focus({preventScroll:true});$('explorer').scrollIntoView({behavior:state.reduced?'instant':'smooth',block:'start'});}));
$('figure-in').addEventListener('click',()=>zoomFigure(1.6));$('figure-out').addEventListener('click',()=>zoomFigure(1/1.6));$('figure-fit').addEventListener('click',()=>zoomFigure(0));
// Pan an enlarged figure by dragging, as well as by scrolling.
{let pan=null;const p=$('paper-viewport');p.addEventListener('pointerdown',e=>{if(figureViews[state.display]?.zoom>1&&e.pointerType!=='touch'){pan={x:e.clientX,y:e.clientY,l:p.scrollLeft,t:p.scrollTop};p.setPointerCapture(e.pointerId);p.classList.add('panning');}});p.addEventListener('pointermove',e=>{if(pan){p.scrollLeft=pan.l-(e.clientX-pan.x);p.scrollTop=pan.t-(e.clientY-pan.y);}});const end=()=>{if(pan){pan=null;p.classList.remove('panning');saveFigure();}};p.addEventListener('pointerup',end);p.addEventListener('pointercancel',end);p.addEventListener('scroll',()=>{if(!pan)saveFigure();},{passive:true});}
new ResizeObserver(sizeFigure).observe($('paper-viewport'));
$('paper-image').addEventListener('load',()=>{if(showingPaper(state)){sizeFigure();const v=figureViews[state.display];$('paper-viewport').scrollTo(v.x,v.y);}});
let overviewPose=null;
$('depth-toggle').addEventListener('click',()=>{
 if(emergence?.active)emergence.finish();
 if(state.deep){dispatch({type:'depth-exit'});if(overviewPose)scene?.moveTo(overviewPose,650);}
 else{overviewPose=scene?structuredClone(scene.pose):null;if(state.opening){state={...state,opening:false};endOpening();}dispatch({type:'depth-enter'});}
});
all('[data-depth-topic]').forEach(b=>b.addEventListener('click',()=>dispatch({type:'depth',action:{type:'topic',value:b.dataset.depthTopic}})));
for(const [id,type] of [['depth-slice','slice'],['depth-length-slider','length']])$(id).addEventListener('input',e=>dispatch({type:'depth',action:{type,value:e.target.value}}));
all('[data-evidence]').forEach(b=>b.addEventListener('click',()=>dispatch({type:'depth',action:{type:'evidence',value:b.dataset.evidence}})));
$('wall-replay').addEventListener('click',()=>{formationWall()?.replay();});
media.addEventListener('change',()=>{emergence?.finish();state={...state,reduced:media.matches,transport:!media.matches,opening:false,display:state.display};endOpening();render();scene?.setState(state);});
document.addEventListener('keydown',e=>{if(e.key===' '&&state.opening&&document.activeElement===document.body){e.preventDefault();dispatch({type:'pause'});}});
// Read-only test hooks used by the browser checks in production/self-separating-battery/verification.
Object.defineProperty(window,'figState',{get:()=>state});Object.defineProperty(window,'figPose',{get:()=>scene&&structuredClone(scene.pose)});
render();
if(state.opening)setCaption([schedule[0].kicker,schedule[0].title,schedule[0].copy,'Original figure, unaltered · arXiv:2604.26222v1']);
startOpening();
try{
 if(query.has('fallback'))throw Error('Requested accessible fallback');
 if(!window.THREE)await new Promise(r=>addEventListener('load',r,{once:true}));
 if(!window.THREE)throw Error('Three.js unavailable');
 const timer=setTimeout(()=>{if(!loaded)$('loading').hidden=false;},600);
 const {NetworkScene}=await import('./self-separating-battery-scene.mjs?v=5');
 scene=new NetworkScene($('network'),{
  onInterrupt:()=>{emergence?.yieldCamera();interruptOpening();},
  onSelect:key=>{if(key!=='template'&&state.view!=='fabrication')dispatch({type:'layer',value:state.layer===key?'all':key});},
  onFailure:fallback,onLoading:busy=>{$('loading').hidden=!busy;},onFrame:placeLabels});
 emergence=new Emergence(scene,$('scene-stage'));
 await scene.load();clearTimeout(timer);loaded=true;$('loading').hidden=true;
 if(state.display==='model')scene.pose=structuredClone(HOME);
 emergence.texture('assets/self-separating-battery/figure-1.jpg').catch(()=>{});emergence.texture('assets/self-separating-battery/figure-2.jpg').catch(()=>{});
 render();scene.setState(state);
}catch(error){fallback(error);}
void PAPER_POSE;
