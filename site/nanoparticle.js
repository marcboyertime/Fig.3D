import {initialState,reduce,VIEWS,ease} from './nanoparticle-state.mjs?v=20261002-6';
import {representative,siteDescription,bindingSites,add,mul} from './nanoparticle-model.mjs?v=20261002-6';
import {fallbackSVG} from './nanoparticle-fallback.mjs?v=20261002-6';
import {ParticleScene} from './nanoparticle-scene.mjs?v=20261002-6';
import {OPENING_BEATS,OPENING_STARTS,OPENING_END,openingPhase} from './nanoparticle-opening.mjs?v=20261002-6';
import {Annotations} from './annotations.mjs';
const $=id=>document.getElementById(id), reduced=matchMedia('(prefers-reduced-motion: reduce)');
const forceReduced=new URLSearchParams(location.search).get('motion')==='reduce';
let state=initialState(reduced.matches||forceReduced),scene,failed=false,elapsed=0,lastTime=0,phase=-1;
const names={atop:'Atop',bridge:'Bridge',hollow:'Fourfold hollow',fcc:'FCC hollow',hcp:'HCP hollow'};
function caption(kicker,title,copy){$('caption-kicker').textContent=kicker;$('caption-title').textContent=title;$('caption-copy').textContent=copy;}
function action(event,{camera=true}={}){
 $('explorer').dataset.lastAction=event.type+':'+(event.value||'');$('explorer').dataset.actions=($('explorer').dataset.actions||'').split('|').slice(-7).concat(event.type+':'+(event.value||'')).join('|');const inputTime=performance.now();const wasIntro=state.intro,wasStacking=state.stacking;state=reduce(state,event);if(wasIntro&&!state.intro)finishIntro();
 update();if(scene)scene.inputTime=inputTime;scene?.setState(state);
 if(!camera||!scene)return;
 if(event.type==='view'){
  if(state.view==='size')scene.overview(true);
  else if(state.view==='surfaces')scene.overview();
  else if(state.view==='neighbors')scene.focusAtom(state.selected);
  else scene.focusFace(state.faceId,true);
 }
 if(event.type==='site'&&wasStacking)scene.focusFace(state.faceId,true);
 if(event.type==='face')scene.focusFace(state.faceId,state.view==='binding');
 if(event.type==='atom'||event.type==='shortcut')scene.focusAtom(state.selected);
 if(event.type==='reset')scene.overview();
 if(event.type==='stacking'){if(state.stacking)scene.focusStacking();else scene.focusFace(state.faceId,true);}
}
function finishIntro(){ if($('intro-transport').contains(document.activeElement))queueMicrotask(()=>$('particle').focus({preventScroll:true})); if(scene)scene.travel=null; $('paper').hidden=true;$('shape-traces').style.display='none';$('intro-transport').hidden=true;$('scene-badge').hidden=false;$('explore-controls').hidden=false;scene?.setIntro(0); }
function update(){
 if(failed)$('fallback-graphic').innerHTML=fallbackSVG(state);
 $('explorer').dataset.view=state.view;$('explorer').dataset.paused=String(state.paused);$('explorer').dataset.cutaway=state.cutaway;$('explorer').dataset.intro=String(state.intro);$('explorer').dataset.shells=state.model.shells;$('explorer').dataset.selected=state.selected||'';
 document.querySelectorAll('.view-tabs [data-view]').forEach(b=>{const on=b.dataset.view===state.view;b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1;});$('inspection').setAttribute('aria-labelledby','tab-'+state.view);
 $('explore-controls').hidden=state.intro;
 $('face-controls').hidden=!['surfaces','binding'].includes(state.view);$('neighbor-controls').hidden=state.view!=='neighbors';$('size-controls').hidden=state.view!=='size';$('binding-controls').hidden=state.view!=='binding';
 document.querySelectorAll('[data-face]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.face.split(':')[0]===state.faceId.split(':')[0]));
 $('scene-help').firstChild.textContent=failed?'Use the view and site controls below':state.view==='surfaces'?'Drag to turn · select a face':'Drag to turn · select an atom';
 if(state.intro)return;
 const m=state.model,face=m.facets.find(f=>f.id===state.faceId);
 if(state.view==='surfaces')caption('TWO SURFACE PATTERNS',face.family==='100'?'A square terrace':'A triangular terrace',face.family==='100'?'Look along this {100} face: the atoms form a square grid. Turn the particle to see how the terrace meets its neighbors.':'On this {111} face, the atoms form a close-packed triangular pattern. The same crystal can expose both arrangements.');
 if(state.view==='neighbors'){
  const a=m.byId.get(state.selected);if(a){caption('SAME CRYSTAL · DIFFERENT SURROUNDINGS',siteDescription(a),a.cn===12?'Twelve nearest neighbors surround this interior atom. The cutaway makes them visible; hidden atoms still count.':`This atom has ${a.cn} nearest neighbors in the ideal particle. The highlighted atoms are the actual neighbors calculated from its position.`);$('neighbor-count').textContent=a.cn;$('neighbor-dots').innerHTML='<circle cx="52" cy="52" r="6" fill="#d1e1ff"/>'+Array.from({length:12},(_,i)=>{const t=i*Math.PI/6;return `<circle cx="${52+37*Math.cos(t)}" cy="${52+37*Math.sin(t)}" r="4.5" fill="${i<a.cn?'#a4bfff':'none'}" stroke="${i<a.cn?'#a4bfff':'#4b5265'}" stroke-width="1.4"/>`;}).join('');}
  $('cutaway').setAttribute('aria-pressed',state.cutaway);$('cutaway').innerHTML=(state.cutaway?'Restore the surface':'Show inside')+' <span aria-hidden="true">↗</span>';
  document.querySelectorAll('[data-atom]').forEach(b=>b.setAttribute('aria-pressed',state.selected===representative(m,b.dataset.atom,state.faceId).id));
 }
 if(state.view==='size'){
  caption('LESS SIZE · MORE SURFACE','Small changes the balance','The outside grows with area; the interior grows with volume. Smaller particles put a larger share of their atoms at the surface.');
  $('shells').value=m.shells;$('shell-count').textContent=m.shells;$('total-atoms').textContent=m.atoms.length.toLocaleString();$('surface-percent').innerHTML=(m.surfaceFraction*100).toFixed(1)+'<span>%</span>';$('surface-exact').textContent=`${m.surfaceCount.toLocaleString()} surface atoms / ${m.atoms.length.toLocaleString()} total`;
  $('fraction-bar').firstElementChild.style.width=(m.surfaceFraction*100)+'%';$('fraction-bar').setAttribute('aria-label',`${m.surfaceCount} of ${m.atoms.length} atoms are at the surface`);
 }
 if(state.view==='binding'){
  const sites=bindingSites(m,state.faceId),site=sites[state.site];caption('GEOMETRY BEFORE CHEMISTRY',names[state.site],({atop:'The marker sits over one surface atom. This is one possible adsorption position, not a predicted active site.',bridge:'Between two neighboring atoms, the marker encounters a different local arrangement.',hollow:'Four surface atoms surround this opening in the square terrace.',fcc:'Three surface atoms surround this hollow. An atom lies directly beneath it in the third layer.',hcp:'The same triangular opening, but an atom lies directly beneath it in the second layer.'})[state.site]);
  const signature=Object.keys(sites).join(',');if($('binding-choices').dataset.signature!==signature){$('binding-choices').dataset.signature=signature;$('binding-choices').replaceChildren(...Object.keys(sites).map(k=>{const b=document.createElement('button');b.textContent=names[k];b.dataset.site=k;b.addEventListener('click',()=>action({type:'site',value:k}));return b;}));}
  document.querySelectorAll('[data-site]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.site===state.site));$('stacking').hidden=!['fcc','hcp'].includes(state.site);$('stacking').setAttribute('aria-pressed',state.stacking);$('stacking').textContent=state.stacking?'Restore the terrace ↙':'Reveal underlying layers ↗';$('binding-detail').textContent=state.stacking?`${state.site==='hcp'?'Second':'Third'} layer aligned below the hollow. The opening changes visibility only.`:`${site.atomIds.length} surface atom${site.atomIds.length>1?'s frame':' frames'} this position. The diamond marks a location, not a molecule.`;
 }
 $('scene-label').hidden=true;
 notesFor();
}

// Callouts in the scene: the face, atom or binding site the caption is talking about carries its own label.
let notes=null,noteKey='';
const SITE_NOTES={atop:'Directly above one surface atom',bridge:'Between two neighbouring atoms',hollow:'In the gap among four atoms',fcc:'Over a gap with no atom in the layer below',hcp:'Over an atom in the layer below'};
function worldRadius(){const c=scene.camera;return (c.top-c.bottom)/scene.height;}
function facing(p){const c=scene.camera.position,t=scene.pose.target,d=[c.x-t[0],c.y-t[1],c.z-t[2]],n=Math.hypot(...d),q=Math.hypot(...p)||1;return (p[0]*d[0]+p[1]*d[1]+p[2]*d[2])/(n*q);}
function atAtom(a,r=.56){return ()=>{if(!scene||!a)return null;const pr=scene.project(a.p);return {x:pr.x,y:pr.y,r:r/worldRadius(),visible:pr.z<1&&(a.cn===12||facing(a.p)>-.05)};};}
function atPoint(p,r=0){return ()=>{if(!scene)return null;const pr=scene.project(p);return {x:pr.x,y:pr.y,r:r?r/worldRadius():0};};}
function notesFor(){
 if(!scene||failed)return;
 if(!notes){
  notes=new Annotations($('scene-stage'),{className:'particle-notes is-plated',compactWidth:520,avoid:()=>{if(!scene||!state.model)return[];const c=scene.project([0,0,0]),R=state.model.radius??(state.model.radius=Math.max(...state.model.atoms.map(a=>Math.hypot(...a.p))));return[{x:c.x,y:c.y,r:R*.95/worldRadius()}];}});
 }
 if(state.intro){if(noteKey!=='intro'){noteKey='intro';notes.hide();}return;}
 const m=state.model,list=[],gold='#e9c46a',blue='#9fc0ff',violet='#c9b4f0';
 if(state.view==='surfaces'){
  const face=m.facets.find(f=>f.id===state.faceId),centre=representative(m,'face',state.faceId);
  list.push({id:'face',title:face.family==='100'?'{100} face':'{111} face',note:face.family==='100'?'A square grid: each atom has 8 neighbours':'Close-packed triangles: each atom has 9',tone:face.family==='100'?'#d6dcec':violet,at:atAtom(centre),dir:[1,-.6],dist:40,phone:'note'});
  const other=m.facets.filter(f=>f.family!==face.family).sort((a,b)=>facing(b.center)-facing(a.center))[0];
  if(other){const a=representative(m,'face',other.id);list.push({id:'other',title:other.family==='100'?'{100} face':'{111} face',note:'The other pattern on the same crystal',tone:'#b8ad8f',at:atAtom(a),dir:[-1,.6],dist:40,phone:false});}
  const corner=representative(m,'corner');list.push({id:'corner',title:'Corner atom',note:'Only 5 neighbours: the most exposed',tone:gold,at:atAtom(corner),dir:[1,.7],dist:30,phone:false});
 }
 if(state.view==='neighbors'&&state.selected){
  const a=m.byId.get(state.selected);
  list.push({id:'atom',title:siteDescription(a),note:a.cn===12?'12 neighbours: fully surrounded':`${a.cn} neighbours, ${12-a.cn} missing compared with the inside`,tone:blue,at:atAtom(a,.6),dir:[1,-.65],dist:46,phone:'note',live:true});
  const nb=a.neighbors.map(id=>m.byId.get(id)).sort((x,y)=>facing(y.p)-facing(x.p))[0];
  if(nb)list.push({id:'neighbour',title:'Nearest neighbour',note:'Touching it: one of the bonds counted',tone:'#759fe5',at:atAtom(nb,.5),dir:[-1,.6],dist:40,phone:false});
 }
 if(state.view==='size'){
  list.push({id:'surface',title:'Surface atoms',note:`${(m.surfaceFraction*100).toFixed(0)}% of all ${m.atoms.length.toLocaleString()} at this size`,tone:gold,at:atAtom(representative(m,'edge')),dir:[1,-.6],dist:40,live:true,phone:'note'});
 }
 if(state.view==='binding'){
  const site=bindingSites(m,state.faceId)[state.site];
  if(site)list.push({id:'site',title:`${names[state.site]} site`,note:SITE_NOTES[state.site],tone:violet,at:atPoint(add(site.p,mul(site.normal,1.52)),.42),dir:[1,-.6],dist:40,phone:'note'});
  if(site&&state.stacking&&site.underlying){const u=m.byId.get(site.underlying);list.push({id:'under',title:'Atom in the layer below',note:state.site==='hcp'?'Sits right under the site':'Offset from the site',tone:'#e4d9ff',at:atAtom(u,.5),dir:[-1,.6],dist:40,phone:false});}
 }
 const key=JSON.stringify(list.map(x=>[x.id,x.title,x.note]))+state.selected+state.faceId;
 if(key!==noteKey){noteKey=key;notes.show(list);}
}
function advance(now){
 if(!state.intro||state.paused){lastTime=0;return;}
 // The first-visit page opening holds this clock until the stage has appeared.
 if(window.Fig3DOpening?.holding){lastTime=0;return;}
 if(lastTime)elapsed+=Math.min(60,now-lastTime);lastTime=now;
 const seconds=elapsed/1000,p=openingPhase(seconds),modelTime=seconds-OPENING_STARTS[2];
 if(p!==phase){phase=p;caption(...OPENING_BEATS[p].copy);
  if(p===2){scene.moveTo({...scene.home,yaw:1.02,elevation:.5},3200);}
  if(p>=3){const kind=OPENING_BEATS[p].site;state=reduce(state,{type:'intro',patch:{view:'neighbors',selected:representative(state.model,kind).id}});update();scene.setState(state);scene.focusAtom(state.selected);}
 }
 if(seconds<OPENING_STARTS[3]){const transition=ease(modelTime/5);$('paper').style.opacity=1-transition;$('paper').style.transform=`perspective(1100px) rotateX(${transition*15}deg) scale(${1-transition*.14})`;$('paper').style.pointerEvents=transition>.5?'none':'';scene.setIntro(modelTime<3?1:1-ease((modelTime-3)/2.5));drawTraces(seconds,transition);}
 else{$('paper').hidden=true;$('shape-traces').style.display='none';scene.setIntro(0);$('scene-badge').hidden=false;}
 if(seconds>=OPENING_END){state=reduce(state,{type:'explore'});finishIntro();update();caption('YOUR EXPLORER','Choose an atom','Choose an atom to see its neighbors. Turn the particle, or use the site shortcuts to compare face, edge, corner and interior.');scene.setState(state);scene.overview();}
}
function drawTraces(seconds,t){
 const stage=$('scene-stage').getBoundingClientRect();$('shape-traces').setAttribute('viewBox',`0 0 ${stage.width} ${stage.height}`);
 for(const [panel,id,fid,source] of [['a','square-trace','100:1,0,0',[[.594,.526],[.719,.489],[.836,.528],[.711,.584]]],['c','triangle-trace','111:1,1,1',[[.686,.432],[.576,.607],[.813,.603]]]]){
  const r=$('paper-'+panel).getBoundingClientRect(),face=state.model.facets.find(f=>f.id===fid),dest=face.vertices.map(p=>scene.project(add(p,mul(face.normal,.64))));
  const pts=source.map((p,i)=>{const a={x:r.left-stage.left+p[0]*r.width,y:r.top-stage.top+p[1]*r.height};return [a.x+(dest[i].x-a.x)*t,a.y+(dest[i].y-a.y)*t];});
  const path=$(id);path.setAttribute('d','M'+pts.map(p=>p.join(',')).join('L')+'Z');path.style.strokeDashoffset=1-ease((seconds-OPENING_STARTS[1])/2.5);path.style.opacity=1-ease((seconds-OPENING_STARTS[2]-3)/2.5);
 }
}
function failure(){if(failed)return;failed=true;state=reduce(state,{type:'explore'});finishIntro();$('fallback').hidden=false;$('scene-stage').dataset.fallback=true;$('particle').tabIndex=-1;$('return').hidden=true;document.querySelector('.camera-controls').hidden=true;document.querySelector('.touch-help').hidden=true;document.querySelectorAll('[data-camera]').forEach(b=>b.disabled=true);update();}
try{if(new URLSearchParams(location.search).has('fallback'))throw Error('Requested static fallback');scene=new ParticleScene($('particle'),{onAtom:id=>action({type:'atom',value:id}),onFace:id=>action({type:'face',value:id}),onInterrupt:()=>{if(state.intro){state=reduce(state,{type:'explore'});finishIntro();update();scene?.setState(state);}},onHover:a=>{if(state.intro)return;const label=$('scene-label');if(a){label.textContent=`${siteDescription(a)} · ${a.cn} neighbors`;label.hidden=false;}else label.hidden=true;},onFrame:advance,onFailure:failure});scene.setState(state);if(state.intro)scene.setIntro(1);else finishIntro();}catch(error){console.warn('Nanoparticle static fallback:',error.message);failure();}
update();
// Reviewing the source never restarts the opening or changes the selected model.
// The native modal provides focus containment, Escape and return to the opener.
let resumeAfterPaper=false;
$('paper-open').addEventListener('click',()=>{
 resumeAfterPaper=!state.paused;
 if(resumeAfterPaper)action({type:'pause'},{camera:false});
 lastTime=0;scene?.stop();$('paper-dialog').showModal();
});
$('paper-close').addEventListener('click',()=>$('paper-dialog').close());
$('paper-dialog').addEventListener('close',()=>{
 lastTime=0;
 if(resumeAfterPaper&&state.paused)action({type:'pause'},{camera:false});
 resumeAfterPaper=false;scene?.wake();
});
$('explore-now').addEventListener('click',()=>action({type:'explore'},{camera:false}));$('intro-pause').addEventListener('click',()=>{action({type:'pause'},{camera:false});$('intro-pause').textContent=state.paused?'Resume':'Pause';$('intro-pause').setAttribute('aria-label',state.paused?'Resume opening':'Pause opening');scene?.wake();});
document.querySelectorAll('.view-tabs [data-view]').forEach(b=>{b.addEventListener('click',()=>action({type:'view',value:b.dataset.view}));b.addEventListener('keydown',e=>{let i=VIEWS.indexOf(state.view);if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();i=e.key==='Home'?0:e.key==='End'?3:(i+(e.key==='ArrowRight'?1:3))%4;action({type:'view',value:VIEWS[i]});$('tab-'+VIEWS[i]).focus();}});});
document.querySelectorAll('[data-face]').forEach(b=>b.addEventListener('click',()=>action({type:'face',value:b.dataset.face})));
document.querySelectorAll('[data-atom]').forEach(b=>b.addEventListener('click',()=>action({type:'shortcut',value:b.dataset.atom})));
$('cutaway').addEventListener('click',()=>action({type:'cutaway'},{camera:false}));$('return').addEventListener('click',()=>{scene?.interrupt();scene?.overview();});
$('stacking').addEventListener('click',()=>action({type:'stacking'}));$('shells').addEventListener('input',e=>action({type:'shells',value:Number(e.target.value)},{camera:false}));
document.querySelectorAll('[data-camera]').forEach(b=>b.addEventListener('click',()=>{if(!scene)return;const k=b.dataset.camera;scene.interrupt();if(k==='up')scene.orbit(0,-28);if(k==='down')scene.orbit(0,28);if(k==='in')scene.zoom(.85);if(k==='out')scene.zoom(1.18);if(k==='reset')scene.overview(state.view==='size');}));
reduced.addEventListener('change',e=>{state={...state,reduced:e.matches};if(e.matches){state={...state,intro:false};finishIntro();scene&&(scene.travel=null);update();scene?.setState(state);}});
window.addEventListener('pagehide',()=>scene?.stop());window.addEventListener('pageshow',()=>scene?.wake());
