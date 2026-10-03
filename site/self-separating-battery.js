import {updateDepthUI,depthFrame} from './self-separating-battery-depth-ui.mjs?v=1';
import {initialState,reduce,caption,PHASES} from './self-separating-battery-model.mjs?v=2';
const $=id=>document.getElementById(id),all=s=>[...document.querySelectorAll(s)];
const media=matchMedia('(prefers-reduced-motion: reduce)');let state=initialState(media.matches||new URLSearchParams(location.search).has('reduced')),scene=null,openingStart=0,openingTime=0,lastTime=0,introRAF=0,loaded=false,paperFigure=1,lastCaption='',introLift=false;
const opening=[{end:10000,title:'A different way\nto arrange a battery',copy:'Figure 1 compares stacked sheets with connected three-dimensional networks. The right-hand structure is the subject of this paper.',kicker:'START WITH THE PAPER',source:true},{end:23000,title:'Those pockets\nare connected',copy:'The apparent islands in a flat picture belong to networks that continue through the volume. Turn the model to reveal the depth the figure cannot show.',kicker:'FIGURE 1c → AN EXPLANATORY MODEL',source:false},{end:35000,title:'The interface\nseparates them',copy:'The blue cathode follows the carbon’s pores. A thin SEI lies between them. Explore each material separately, or see how the researchers form this interface.',kicker:'TWO ELECTRODES · ONE INTERFACE',source:false}];
function dispatch(action){if((action.type==='view'||action.type==='depth')&&state.paper)leavePaper();const before=state;state=reduce(state,action);if(before.opening&&!state.opening)endOpening();update();scene?.setState(state);}
function setCaption(c){const signature=c.join('|');if(signature===lastCaption)return;lastCaption=signature;$('caption-kicker').textContent=c[0];$('caption-title').textContent=c[1];$('caption-copy').textContent=c[2];$('caption-note').textContent=c[3]||'';}
function update(){document.body.classList.toggle('exploring',!state.opening);
 $('explorer').classList.toggle('showing-paper',state.paper);
 $('scene-content').inert=state.paper;
 $('scene-content').setAttribute('aria-hidden',String(state.paper));
 $('paper-view').hidden=!state.paper;
 $('figure-tools').hidden=!state.paper;
 $('paper-details').hidden=!state.paper;
 $('controls').hidden=state.paper;
 all('[data-display]').forEach(b=>b.setAttribute('aria-pressed',state.paper?b.dataset.display===String(paperFigure):b.dataset.display==='model'));
 all('[data-view]').forEach(b=>{const on=b.dataset.view===state.view;b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1;});$('inspection').setAttribute('aria-labelledby','tab-'+state.view);
 all('[data-architecture]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.architecture===state.architecture));all('[data-stage]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.stage===state.stage));all('[data-layer]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.layer===state.layer));all('[data-route]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.route===state.route));
 const network=state.view!=='interface'&&!(state.view==='architecture'&&state.architecture==='layered');
 $('architecture-controls').hidden=state.view!=='architecture';$('fabrication-controls').hidden=state.view!=='fabrication';$('interface-controls').hidden=state.view!=='interface';$('material-controls').hidden=state.view==='fabrication';$('cut-controls').hidden=!network;$('route-controls').hidden=state.view!=='architecture'||!network;
 $('cut').value=Math.round(state.cut*100);$('cut-readout').textContent=state.cut===0?'Whole':state.cut===1?'Half cut':'Partial cut';
 $('transport').textContent=state.reduced?'Motion reduced':state.transport?'Pause ion motion':'Show ion motion';$('transport').setAttribute('aria-pressed',state.transport&&!state.reduced);$('transport').disabled=state.reduced;
 $('stage-process').textContent={hybrid:'Block copolymer + resols → co-assembly',carbon:'Nitrogen + heat → porous carbon',cathode:'AQEDOT → electropolymerized PAQEDOT',sei:'External Li + electrolyte → electrochemical processing'}[state.stage];
 const keys=state.view==='fabrication'?state.stage==='hybrid'?['carbon','template']:state.stage==='carbon'?['carbon']:state.stage==='cathode'?['carbon','cathode']:['carbon','sei','cathode']:['carbon','sei','cathode'];
 $('scene-key').replaceChildren(...keys.map(k=>{const s=document.createElement('span'),i=document.createElement('i');i.className=k;s.append(i,document.createTextNode(k==='carbon'&&state.view==='fabrication'&&state.stage==='hybrid'?'Precursor':PHASES[k].name));return s;}));
 const layered=state.view==='architecture'&&state.architecture==='layered';if(layered)$('scene-key').querySelector('.sei').parentElement.lastChild.textContent='Separator';document.querySelector('[data-layer=sei]').lastChild.textContent=layered?'Separator':'SEI';
 $('ion-label').hidden=state.view!=='interface'||state.layer!=='all';$('scene-annotation').hidden=state.view!=='interface';$('scene-annotation').textContent='Enlarged local interface';$('opening-controls').hidden=!state.opening||state.paper;$('opening-pause').textContent=state.paused?'Resume':'Pause';$('opening-pause').setAttribute('aria-label',state.paused?'Resume opening':'Pause opening');
 if(state.paper)setCaption(['ORIGINAL FIGURE '+paperFigure,({1:'From layers to networks',2:'How the interface forms',5:'Prepare the device electrochemically',6:'Test what the device can do'})[paperFigure],paperCopy[paperFigure],'']);else if(!state.opening)setCaption(caption(state));
 $('controls').style.opacity=state.opening?'.65':'1';
 updateDepthUI(state,setCaption);
 $('depth-toggle').disabled=!loaded&&!document.body.classList.contains('is-fallback');
 all('[data-display]').forEach(b=>b.setAttribute('aria-pressed',state.paper?b.dataset.display===String(paperFigure):b.dataset.display==='model'));
 $('scene-help').textContent=document.body.classList.contains('is-fallback')?'Original figures and explanations':state.deep?(state.deep.topic==='evidence'?'Published observations':'Drag to turn · arrow keys rotate'):'Drag to turn · select a material';
}
function endOpening(){cancelAnimationFrame(introRAF);introRAF=0;$('source-opening').hidden=true;$('source-opening').classList.add('leaving');$('source-opening').setAttribute('aria-hidden','true');$('opening-controls').hidden=true;scene?.wake();}
function intro(now){
 introRAF=0;if(!state.opening)return;
 const r=$('scene-stage').getBoundingClientRect(),onscreen=r.bottom>0&&r.top<innerHeight;
 if(!state.paused&&!state.paper&&!document.hidden&&onscreen){if(lastTime)openingTime+=Math.min(now-lastTime,80);const beat=opening.find(b=>openingTime<b.end);if(!beat){state={...state,opening:false};endOpening();update();scene?.setState(state);return;}setCaption([beat.kicker,beat.title,beat.copy,beat.source?'Tait et al. · arXiv:2604.26222v1 · 2026':'One illustrative geometry; the original figures are always available above.']);$('source-opening').classList.toggle('leaving',!beat.source);$('source-opening').setAttribute('aria-hidden',!beat.source);
  $('source-opening').classList.toggle('focused',openingTime>7800);if(openingTime>10000&&!introLift){introLift=true;scene?.moveTo({...scene.pose,yaw:scene.pose.yaw-.12},2000);}if(openingTime>23000&&openingTime<24500){const v=Math.min(.56,(openingTime-23000)/1400*.56);state={...state,cut:v};scene?.setState(state);$('cut').value=Math.round(v*100);$('cut-readout').textContent='Partial cut';}
 }
 lastTime=now;introRAF=requestAnimationFrame(intro);
}
function startOpening(){if(state.opening){lastTime=0;introRAF=requestAnimationFrame(intro);}else endOpening();}
function fallback(error){console.warn('3D fallback:',error?.message||'context lost');state={...state,opening:false};endOpening();scene?.stop();$('loading').hidden=true;$('fallback').hidden=false;document.body.classList.add('is-fallback');$('scene-help').textContent='Original figures and explanations';all('[data-camera],#cut,#depth-slice,[data-route]').forEach(b=>b.disabled=true);update();}
all('[data-view]').forEach(b=>b.addEventListener('click',()=>dispatch({type:'view',value:b.dataset.view})));
$('explorer').querySelector('[role=tablist]').addEventListener('keydown',e=>{const keys=['ArrowLeft','ArrowRight','Home','End'];if(!keys.includes(e.key))return;e.preventDefault();const tabs=all('[data-view]'),index=tabs.indexOf(document.activeElement),n=e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[n].focus();tabs[n].click();});
for(const [attr,type] of [['architecture','architecture'],['stage','stage'],['layer','layer'],['route','route']])all(`[data-${attr}]`).forEach(b=>b.addEventListener('click',()=>dispatch({type,value:b.dataset[attr]})));
$('cut').addEventListener('input',e=>dispatch({type:'cut',value:e.target.value/100}));$('explore').addEventListener('click',()=>dispatch({type:'explore'}));$('opening-pause').addEventListener('click',()=>dispatch({type:'pause'}));$('transport').addEventListener('click',()=>dispatch({type:'transport'}));
all('[data-camera]').forEach(b=>b.addEventListener('click',()=>{dispatch({type:'explore'});const a=b.dataset.camera;({left:()=>scene?.turn(-32,0),right:()=>scene?.turn(32,0),up:()=>scene?.turn(0,-32),down:()=>scene?.turn(0,32),in:()=>scene?.zoom(.84),out:()=>scene?.zoom(1.2),reset:()=>scene?.home()})[a]();}));
const paperCopy={1:'Figure 1. Panel a: layered electrodes rolled into a cylindrical cell. Panel b: an earlier ordered, double-gyroid Li–S architecture. Panel c: the nonperiodic carbon / polymer / SEI architecture explored here. The caption explains that domains which appear isolated also form continuous networks through the monolith.',2:'Figure 2. Co-assembly produces an organic hybrid; heating under nitrogen produces a porous carbon scaffold. AQEDOT is electropolymerized directly onto the carbon. Electrochemical processing then generates a separating SEI between carbon and PAQEDOT. The chemical structures and scale bars are preserved in the original figure.'};
// Keep the renderer mounted and preserve its pose, cutaway, selection and motion phase.
// Each figure also retains its magnification and pan position during comparison.
const figureSizes={1:[1276,414],2:[1431,702],5:[1125,794],6:[1428,753]};
const figureViews=Object.fromEntries(Object.keys(figureSizes).map(k=>[k,{zoom:1,x:0,y:0}]));
paperCopy[5]='Figure 5. Electrochemical preparation: initial carbon discharge against external lithium; lower-potential treatment followed by carbon oxidation; polymer reduction against lithium; and full-device charging in electrolyte. Panels a and b normalize capacity to carbon mass, while panel c uses PAQEDOT mass.';
paperCopy[6]='Figure 6. The paper compares open-circuit holds with cycling measurements. Panels b–d describe the initial device; e–f show a later processing iteration. Capacity axes use PAQEDOT mass. The figure preserves the separate experiments and their original axes.';
function saveFigure(){if(state.paper){const v=figureViews[paperFigure],p=$('paper-viewport');v.x=p.scrollLeft;v.y=p.scrollTop;}}
function sizeFigure(){
 if(!state.paper)return;
 const p=$('paper-viewport'),img=$('paper-image'),v=figureViews[paperFigure];
 const fit=Math.min(p.clientWidth,p.clientHeight*(figureSizes[paperFigure][0]/figureSizes[paperFigure][1]));
 img.style.width=Math.max(1,fit*v.zoom)+'px';
 $('figure-out').disabled=v.zoom<=1;$('figure-in').disabled=v.zoom>=4;
 $('figure-help').textContent=v.zoom===1?'Original paper figure':'Scroll to inspect · '+Math.round(v.zoom*100)+'%';
}
function leavePaper(){saveFigure();state=reduce(state,{type:'paper',value:false});lastTime=0;}
function switchDisplay(value){
 saveFigure();
 // Choosing a comparison view hands control over without restarting the camera.
 if(state.opening){state={...state,opening:false,paused:false};endOpening();}
 if(value==='model')leavePaper();
 else{
  paperFigure=Number(value);
  const img=$('paper-image');img.src=`assets/self-separating-battery/figure-${paperFigure}.jpg`;
  [img.width,img.height]=figureSizes[paperFigure];
  img.alt=paperCopy[paperFigure];
  $('paper-original').href=img.src;
  state=reduce(state,{type:'paper',value:true});
 }
 update();sizeFigure();
 if(state.paper){const v=figureViews[paperFigure];$('paper-viewport').scrollTo(v.x,v.y);}
 scene?.setState(state);if(state.paper)scene?.stop();
}
all('[data-display]').forEach(b=>b.addEventListener('click',()=>switchDisplay(b.dataset.display)));
$('display-switch').addEventListener('keydown',e=>{
 if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
 e.preventDefault();const buttons=all('[data-display]').filter(b=>!b.hidden),i=buttons.indexOf(document.activeElement);
 const n=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
 buttons[n].focus();buttons[n].click();
});
$('paper-view').addEventListener('keydown',e=>{if(e.key==='Escape'){switchDisplay('model');$('display-model').focus({preventScroll:true});}});
all('[data-paper]').forEach(b=>b.addEventListener('click',()=>{
 switchDisplay(b.dataset.paper);$('display-figure-'+paperFigure).focus({preventScroll:true});
 $('display-switch').scrollIntoView({behavior:state.reduced?'instant':'smooth',block:'start'});
}));
function zoomFigure(factor){
 const p=$('paper-viewport'),v=figureViews[paperFigure],old=v.zoom;
 const center=[(p.scrollLeft+p.clientWidth/2)/p.scrollWidth,(p.scrollTop+p.clientHeight/2)/p.scrollHeight];
 v.zoom=factor===0?1:Math.max(1,Math.min(4,v.zoom*factor));if(v.zoom===old)return;
 sizeFigure();p.scrollTo(center[0]*p.scrollWidth-p.clientWidth/2,center[1]*p.scrollHeight-p.clientHeight/2);saveFigure();
}
$('figure-in').addEventListener('click',()=>zoomFigure(1.6));$('figure-out').addEventListener('click',()=>zoomFigure(1/1.6));$('figure-fit').addEventListener('click',()=>zoomFigure(0));
new ResizeObserver(sizeFigure).observe($('paper-viewport'));
$('paper-image').addEventListener('load',()=>{if(state.paper){sizeFigure();const v=figureViews[paperFigure];$('paper-viewport').scrollTo(v.x,v.y);}});
let overviewPose=null;
$('depth-toggle').addEventListener('click',()=>{
 saveFigure();
 if(state.deep){dispatch({type:'depth-exit'});if(overviewPose)scene?.moveTo(overviewPose,650);}
 else{overviewPose=scene?structuredClone(scene.pose):null;dispatch({type:'depth-enter'});}
});
all('[data-depth-topic]').forEach(b=>b.addEventListener('click',()=>dispatch({type:'depth',action:{type:'topic',value:b.dataset.depthTopic}})));
$('depth-tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=all('[data-depth-topic]'),i=tabs.indexOf(document.activeElement),n=e.key==='Home'?0:e.key==='End'?3:(i+(e.key==='ArrowRight'?1:-1)+4)%4;tabs[n].focus();tabs[n].click();});
for(const [id,type] of [['depth-slice','slice'],['depth-length-slider','length']])$(id).addEventListener('input',e=>dispatch({type:'depth',action:{type,value:e.target.value}}));
for(const type of ['formation','evidence'])all(`[data-${type}]`).forEach(b=>b.addEventListener('click',()=>dispatch({type:'depth',action:{type,value:b.dataset[type]}})));
media.addEventListener('change',()=>{state={...state,reduced:media.matches,transport:!media.matches,opening:false};endOpening();update();scene?.setState(state);});
update();
try{if(new URLSearchParams(location.search).has('fallback'))throw Error('Requested accessible fallback');const {NetworkScene}=await import('./self-separating-battery-scene.mjs?v=2');scene=new NetworkScene($('network'),{onInterrupt:()=>{if(state.opening)dispatch({type:'explore'});},onSelect:key=>{if(key!=='template'&&state.view!=='fabrication')dispatch({type:'layer',value:key});},onFailure:fallback,onLoading:busy=>{$('loading').hidden=!busy;},onFrame:s=>{depthFrame(s,state);if(!state.deep&&state.view==='interface'){const p=s.project(s.ions[0].position.toArray());$('ion-label').style.left=p.x+'px';$('ion-label').style.top=(p.y-21)+'px';}}});await scene.load();loaded=true;$('loading').hidden=true;update();scene.setState(state);startOpening();}catch(error){fallback(error);}
