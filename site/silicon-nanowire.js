import {initialState,reduce,FIGURES,DISPLAYS,HOME,VIEWS,section,outer,contour,frontAt,clamp,smooth} from './silicon-nanowire-model.mjs';
import {WireScene,PALETTE} from './silicon-nanowire-scene.mjs';
import {PaperEmergence,PROFILE} from './silicon-nanowire-opening.mjs';
const $=id=>document.getElementById(id),all=s=>[...document.querySelectorAll(s)],BASE='assets/silicon-nanowire/';
const reducedQuery=matchMedia('(prefers-reduced-motion: reduce)'),params=new URLSearchParams(location.search);
let state=initialState(reducedQuery.matches||params.has('reduced')),scene=null,emergence=null,failed=false,openingStop=null,playStop=null;
const figureViews=Object.fromEntries(Object.keys(FIGURES).map(k=>[k,{zoom:1,x:0,y:0}]));

// ————— Words —————
const CAPTIONS={
 swelling:{kicker:'Figures 3 & 5 · anisotropic swelling',title:'Fat in one direction,\nthin in the other',copy:'Lithium converts the wire from the outside in, starting where it enters. Each section swells 2.6 times along x₁ but barely along x₂, while the crystalline core left inside tapers toward the lithium.',note:'An explanatory geometry fitted to the printed wire of Figure 5a. The progression is illustrative, not physical time.'},
 early:{kicker:'Figure S10b · before necking',title:'First, the new shell\nis squeezed',copy:'Freshly lithiated silicon wants to expand but stays bonded to the crystal it grew from. The surface is held in compression and the centre is pulled into tension.',note:'Arrows show the sign of σ₁₁, the normal stress along x₁, never its size. The values live in the original panel.'},
 late:{kicker:'Figure S10d · after necking',title:'Then the indent\nis pulled open',copy:'As the core itself lithiates and expands, it stretches the shell that formed first. The stress flips: tension at the surface indent, compression in the centre.',note:'Arrows show the sign of σ₁₁, the normal stress along x₁, never its size. The values live in the original panel.'},
 mises:{kicker:'Figure 5e · von Mises stress',title:'Yielding has\nno sign',copy:'Von Mises stress measures how hard the material is being distorted, in any direction. Most of the lithiated shell reaches the model’s 3 GPa yield stress, so it flows. It cannot tell tension from compression.',note:'The field itself is the authors’ calculation, shown in the original panel. The wire here only locates the section.'},
 fracture:{kicker:'Figures 2, 3 & 5f · fracture',title:'The crack opens\nwhere the indent pulls',copy:'Behind the front, where the crystalline core is used up, the authors saw cracks run along the wire. Their model explains why: nothing in the centre is compressed any more to hold the indent shut.',note:'The white path redraws the authors’ schematic in Figure 5f. Nothing here predicts when, or whether, a crack forms.'}
};
const OPENING=[
 {id:'paper',kicker:'Liu et al. 2011 · Figure 5',title:'The authors simulated\na swelling wire',copy:'Panel a colours the wire by its lithium content. Red has reacted; blue is still crystalline silicon. Lithium enters at the wide end.'},
 {id:'emerge',kicker:'Figure 5a, given depth',title:'The same wire,\nnow in three dimensions',copy:'It keeps the printed angle while the page tips away. From here on it is a model you can turn.'},
 {id:'open',kicker:'Figure 5b · inside',title:'Inside, a tapering\ncrystalline core',copy:'Lithium converts the outside first. The blue silicon left inside narrows toward the end where lithium enters.'},
 {id:'sweep',kicker:'Figure 5d · one section',title:'Fat in one direction,\nthin in the other',copy:'Each cross-section swells 2.6 times along x₁ but barely along x₂. The crystal sets the shape, not the camera.'}
];
const readingTime=b=>Math.max(5.5,(b.title.length+b.copy.length)/15+1.2);
const REFERENCES={
 early:{file:'stress-early.png',figure:'s10',caption:'Figure S10b · the authors’ σ₁₁ section before necking. Open Figure S10 ↗'},
 late:{file:'stress-late.png',figure:'s10',caption:'Figure S10d · the authors’ σ₁₁ section after necking. Open Figure S10 ↗'},
 mises:{file:'von-mises.jpeg',figure:'5',caption:'Figure 5e · the authors’ von Mises field, 0 to 3.3 GPa. Open Figure 5 ↗'},
 fracture:{file:'crack-observation.jpeg',figure:'2',caption:'Figure 2e–i · red arrows mark the reaction front; a crack grows behind it as the silicon core is used up. Open Figure 2 ↗'}
};
const DEPTH={
 swelling:[['Which directions are x₁, x₂ and x₃?','The wire grows along x₃ = [112]. Across it, x₁ = [1<span class="bar">1</span>0] and x₂ = [11<span class="bar">1</span>] are perpendicular, and the moving section is the (112) plane. Looking along x₁ hides the swelling; looking along x₂ shows all of it. Figure 3g–h does exactly this with one real wire: 180 nm wide, then 485 nm after tilting.'],
  ['Why does the core taper?','Lithium arrives from one end and converts the outside of the wire before the centre. A section near the lithium has a smaller crystalline core than one further along. Move the section to see it.'],
  ['What do the colours mean?','They follow Figure 5’s own scale: red where c ≈ 1, fully lithiated at Li/Si = 3.75, and blue where c ≈ 0, crystalline silicon. The warm band marks the front. The model uses two regions to explain that contrast; it does not calculate the concentration field.'],
  ['How did the authors make it swell unevenly?','They gave lithium a diffusivity about 100 times higher along x₁ than x₂, and fitted transverse chemical strains of 150% and 40% so the simulated shape matched the experiments. These are modelling choices, not measured properties of silicon.']],
 stress:[['Expansion is not elastic strain','Newly lithiated silicon has a larger preferred shape. Because it stays attached to its neighbours it cannot take that shape freely, and the mismatch appears as elastic stress and plastic flow. The paper splits the strain into three parts:<span class="formula">dε = dεᶜ + dεᵉ + dεᵖ</span>'],
  ['Stress without any load','Nothing pushes on the wire, so across any plane the stresses must add up to zero. Tension somewhere has to be balanced by compression elsewhere. That is why the surface and the centre always carry opposite signs.'],
  ['Two different stress measures','σ₁₁ is the normal stress along x₁: positive pulls apart, negative pushes together. Von Mises stress combines all the distortional components into one positive number, used to decide where the material yields. It has no sign.']],
 fracture:[['What was actually seen?','In Figure 2e–i a crack grows behind the reaction front as the residual silicon core is used up. Electron-loss maps and line scans tell the crack apart from the remaining core. Figure 3h shows a crack along the middle of a tilted wire.'],
  ['What does Figure 5f explain?','After necking, σ₁₁ is tensile at the surface indent and compressive in the centre. The tension drives the indent deeper; the compression resists it. As the core is used up, the compressed region shrinks and the indent can grow unstably into a crack.'],
  ['What this does not predict','The wire here never splits at a made-up threshold. No fracture law, rate or probability is calculated. The result concerns these crystalline nanowires, not every silicon anode.']]
};

// ————— Display state —————
const showingPaper=()=>state.display!=='model';
function figureFor(key){const f=FIGURES[key],img=$('paper-image'),src=BASE+f.file;if(!img.src.endsWith(src)){img.src=src;img.width=f.width;img.height=f.height;img.alt=`Original ${f.title}. ${f.caption}`;}$('paper-original').href=src;$('paper-caption').textContent=f.caption;}
function saveFigure(){if(showingPaper()){const v=figureViews[state.display],p=$('paper-viewport');v.x=p.scrollLeft;v.y=p.scrollTop;}}
function sizeFigure(){
 if(!showingPaper())return;
 const p=$('paper-viewport'),img=$('paper-image'),v=figureViews[state.display],f=FIGURES[state.display];
 const fit=Math.min(p.clientWidth,p.clientHeight*(f.width/f.height),f.width*1.6);
 img.style.width=Math.max(1,fit*v.zoom)+'px';p.classList.toggle('zoomed',v.zoom>1);
 $('figure-out').disabled=v.zoom<=1;$('figure-in').disabled=v.zoom>=4;
 $('figure-help').textContent=v.zoom===1?'Original figure · Liu et al. 2011':'Drag or scroll to inspect · '+Math.round(v.zoom*100)+'%';
}
function zoomFigure(factor){
 const p=$('paper-viewport'),v=figureViews[state.display],old=v.zoom;
 const c=[(p.scrollLeft+p.clientWidth/2)/p.scrollWidth,(p.scrollTop+p.clientHeight/2)/p.scrollHeight];
 v.zoom=factor===0?1:Math.max(1,Math.min(4,v.zoom*factor));if(v.zoom===old)return;
 sizeFigure();p.scrollTo(c[0]*p.scrollWidth-p.clientWidth/2,c[1]*p.scrollHeight-p.clientHeight/2);saveFigure();
}

let lastCaption='';
function caption(){
 if(state.opening&&state.beat!=null)return OPENING[state.beat];
 if(showingPaper()){const f=FIGURES[state.display];return {kicker:'Liu et al. 2011 · '+f.title.split(' · ')[0],title:f.heading,copy:'',note:''};}
 return CAPTIONS[state.question==='stress'?state.stress:state.question];
}
function sync(){
 scene?.setState(state);
 const paper=showingPaper(),c=caption(),stage=$('stage');
 stage.classList.toggle('showing-paper',paper);stage.classList.toggle('opening',state.opening);document.body.classList.toggle('exploring',!state.opening);
 // Caption: one source of words for whatever is visible.
 const key=c.kicker+c.title;
 if(key!==lastCaption){$('caption-kicker').textContent=c.kicker;$('caption-title').textContent=c.title;$('caption-copy').textContent=c.copy;$('caption-copy').hidden=!c.copy;const el=document.querySelector('.caption');el.classList.remove('changing');void el.offsetWidth;if(lastCaption&&!state.reduced)el.classList.add('changing');lastCaption=key;}
 $('caption-note').textContent=paper?'':c.note||'';
 $('paper-details').hidden=!paper||state.opening;$('controls').classList.toggle('dimmed',paper||state.opening);
 if(paper){figureFor(state.display);sizeFigure();}
 // Toolbar
 all('[data-question]').forEach(b=>{const on=b.dataset.question===state.question;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});
 $('inspection').setAttribute('aria-labelledby','tab-'+state.question);
 const offered=DISPLAYS[state.question];
 all('[data-display]').forEach(b=>{b.hidden=!offered.includes(b.dataset.display)&&b.dataset.display!==state.display;b.setAttribute('aria-pressed',String(b.dataset.display===state.display));});
 // Controls
 const q=state.question;
 $('swelling-controls').hidden=q!=='swelling';$('stress-controls').hidden=q!=='stress';$('cut-row').hidden=q!=='swelling'||failed||(state.view!=null&&state.view!=='oblique');
 all('[data-stress]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.stress===state.stress)));
 all('[data-view]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.view===state.view));b.disabled=failed;});
 $('progress').value=(state.progress*100).toFixed(1);$('progress-value').value=Math.round(state.progress*100)+'%';
 $('slice').value=(state.slice*100).toFixed(1);$('slice-value').value=Math.round(state.slice*100)+'%';
 $('play').setAttribute('aria-label',state.playing?'Pause lithiation':state.progress>=1?'Replay lithiation':'Play lithiation');$('play').innerHTML=state.playing?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z"/></svg>':'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9.5-5.5z"/></svg>';$('play').disabled=failed;
 $('cut').textContent=state.open?'Close the wire':'Open the wire';$('cut').setAttribute('aria-pressed',String(state.open));
 const ref=q==='stress'?REFERENCES[state.stress]:q==='fracture'?REFERENCES.fracture:null;$('reference').hidden=!ref;
 if(ref){if(!$('reference-image').src.endsWith(ref.file))$('reference-image').src=BASE+ref.file;$('reference-image').alt=ref.caption.replace(/ Open.*$/,'');$('reference-caption').textContent=ref.caption;$('reference-open').dataset.figure=ref.figure;}
 // Stage furniture
 $('opening-controls').hidden=!state.opening;$('opening-pause').textContent=state.openingPaused?'Resume':'Pause';$('opening-pause').setAttribute('aria-pressed',String(state.openingPaused));
 $('figure-tools').hidden=!paper||state.opening;$('camera-controls').hidden=paper||state.opening||failed;$('scene-help').hidden=paper||state.opening||failed;
 sceneKey();depth();
 if(failed)drawSection(state.progress,state.slice,0);
 managePlay();
}
function sceneKey(){
 const q=state.question,dot=(c,t)=>`<span><i style="background:${c}"></i>${t}</span>`;
 const arrow=(c,inward)=>`<svg class="arrow" viewBox="0 0 22 10" aria-hidden="true"><path d="${inward?'M1 5h6M15 5h6M7 5 4 2.6M7 5 4 7.4M15 5l3-2.4M15 5l3 2.4':'M3 5h16M3 5l3-2.4M3 5l3 2.4M19 5l-3-2.4M19 5l-3 2.4'}" stroke="${c}" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`;
 $('scene-key').innerHTML=q==='stress'&&state.stress!=='mises'?`<span>${arrow(PALETTE.tension,false)}Tension</span><span>${arrow(PALETTE.compression,true)}Compression</span><span style="color:#97a3ba">sign only</span>`:q==='stress'?'<span style="color:#aab4c8">Field shown in the original panel</span>':dot(PALETTE.crystal,'Crystalline Si')+dot(PALETTE.front,'Reaction front')+dot(PALETTE.lithiated,'Lithiated LiₓSi');
 $('scene-key').style.opacity=state.opening&&state.beat<2?0:1;
}
let depthKey='';
function depth(){const q=state.question==='stress'?'stress':state.question;if(q===depthKey)return;depthKey=q;$('depth-argument').innerHTML=DEPTH[q].map(([h,p])=>`<details><summary>${h}</summary><p>${p}</p></details>`).join('');}

// ————— The linked section, drawn from the displayed (eased) state —————
const mix=(a,b,t)=>{const pa=[1,3,5].map(i=>parseInt(a.slice(i,i+2),16)),pb=[1,3,5].map(i=>parseInt(b.slice(i,i+2),16));return '#'+pa.map((v,i)=>Math.round(v+(pb[i]-v)*t).toString(16).padStart(2,'0')).join('');};
function surfaceColour(q,muted){const u=smooth(0,.16,q);let c=q<=0?PALETTE.crystal:u<.5?mix(PALETTE.crystal,PALETTE.front,u*2):mix(PALETTE.front,PALETTE.lithiated,(u-.5)*2);return mix(c,PALETTE.mutedShell,muted);}
let sectionKey='';
function drawSection(p,s,muted,arrows=state.question==='stress'&&state.stress!=='mises'?1:0,notch=state.question==='fracture'?1:0){
 const key=[p.toFixed(4),s.toFixed(4),muted.toFixed(3),arrows,notch,state.stress].join();if(key===sectionKey)return;sectionKey=key;
 const {d,outer:out,core:inside}=contour(p,s,180),k=40,path=pts=>'M'+pts.map(([x,y])=>`${(k*x).toFixed(1)},${(-k*y).toFixed(1)}`).join('L')+'Z';
 let svg=`<path d="${path(out)}" fill="${surfaceColour(d.q,muted)}"/>`;
 if(d.q<.9999)svg+=`<path d="${path(inside)}" fill="${mix(PALETTE.crystal,PALETTE.mutedCore,muted)}"/>`;
 svg+=`<circle r="${k}" fill="none" stroke="#e5e9f4" stroke-opacity=".75" stroke-dasharray="3 4"/>`;
 svg+='<g stroke="#8f9cb6" stroke-width="1" fill="none"><path d="M-138 88h34M-138 88v-30"/><path d="M-104 88l-5-3M-104 88l-5 3M-138 58l-3 5M-138 58l3 5"/></g><text x="-98" y="92" fill="#b9c5dc" font-size="12">x₁</text><text x="-144" y="51" fill="#b9c5dc" font-size="12">x₂</text>';
 const top=-k*outer(Math.PI/2,d)[1];
 if(arrows){const late=state.stress!=='early';const motif=(y,t)=>{const c=t?PALETTE.tension:PALETTE.compression,h=5,l=22,g=4;const a=(sg)=>{const x0=sg*(h+g),x1=sg*(h+g+l),tip=t?x1:x0,tail=t?x0:x1,dir=Math.sign(tip-tail);return `<path d="M${tail} ${y}H${tip}M${tip} ${y}l${-dir*6} -4M${tip} ${y}l${-dir*6} 4" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round"/>`;};return a(-1)+a(1)+`<rect x="${-h}" y="${y-h}" width="${2*h}" height="${2*h}" fill="none" stroke="${c}" stroke-width="1.6"/>`;};svg+=motif(top+10,late)+motif(0,!late);}
 if(notch)svg+=`<path d="M-8 ${top-1}L0 ${top+17}L8 ${top-1}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linejoin="round"/>`;
 $('section-svg').innerHTML=svg;$('section-position').value=Math.round(s*100)+'%';
 $('section-svg').setAttribute('aria-label',`Section ${Math.round(s*100)} percent of the way from where lithium enters. ${d.q<.001?'Round, pristine silicon':d.q>.999?'Fully lithiated dumbbell with no crystalline core':'Lithiated shell around a crystalline core elongated along x₂'}.`);
}

// ————— Labels anchored to the model —————
const LABELS=Object.fromEntries(all('[data-label]').map(el=>[el.dataset.label,el]));
function placeLabels(sc){
 const v=sc.view,q=state.question,show={},at={};
 const free=state.view==='oblique'||state.view==null,s0=v.trim;
 if(!state.opening||state.beat>=2){
  if(q==='swelling'&&free){
   const sShell=Math.min(.95,s0+.1),dS=section(v.progress,sShell),[x,y]=outer(-Math.PI/4,dS);at.shell=[x,y,dS.z,14,10];show.shell=dS.q>.05;
   // The core label rides the exposed core inside the cut, where it is about half its pristine size.
   let sc2=null;for(let i=0;i<=60;i++){const s=s0+(1-s0)*i/60,d=section(v.progress,s);if(d.q>.25&&d.q<.75){sc2=s;break;}}
   if(sc2!=null&&v.open>.6){const d=section(v.progress,sc2);at.core=[d.cx*.55,.02,d.z,10,-34];show.core=true;}
   const sf=Math.min(.97,frontAt(v.progress)),dF=section(v.progress,sf),pf=outer(Math.PI*.62,dF);at.front=[pf[0],pf[1],dF.z,-20,-34];show.front=v.progress>.03&&sf<.96;
   const dE=section(v.progress,0);at.supply=[0,-outer(Math.PI/2,dE)[1],dE.z,-60,26];show.supply=v.trim<.02;
  }
  if(q==='fracture'&&free){const s=Math.min(.95,s0+.2),d=section(v.progress,s);at.neck=[.3,outer(Math.PI/2,d)[1]+.05,d.z,70,-36];show.neck=v.neck>.6;}
  if(q==='stress'&&state.stress!=='mises'&&free){const d=section(v.progress,v.trim),top=outer(Math.PI/2,d)[1],late=state.stress!=='early';
   LABELS.tension.textContent='Tension';LABELS.compression.textContent='Compression';
   at[late?'tension':'compression']=[.62,top-.2,d.z,0,-11];at[late?'compression':'tension']=[.62,0,d.z,0,-11];show.tension=show.compression=v.arrows>.6;}
 }
 for(const [k,el] of Object.entries(LABELS)){
  const on=!!show[k]&&!showingPaper();el.classList.toggle('on',on);if(!at[k])continue;
  const [x,y,z,dx,dy]=at[k],p=sc.project([x,y,z]),w=el.offsetWidth,h=el.offsetHeight;
  const left=clamp(p.x+dx,8,sc.width-w-8),top=clamp(p.y+dy,8,sc.height-h-60);
  el.style.transform=`translate(${left.toFixed(1)}px,${top.toFixed(1)}px)`;
 }
}
function onFrame(sc){
 const v=sc.view;drawSection(v.progress,v.slice,v.muted);
 $('section').classList.toggle('off',state.opening&&state.beat<3);
 placeLabels(sc);
}

// ————— Actions —————
function stopOpening(){
 if(!state.opening)return;openingStop?.();openingStop=null;
 if(emergence?.active){emergence.yieldCamera();emergence.finish();}
 state=reduce(state,{type:'stop-opening'});state.beat=null;scene?.moveTo(HOME,700);
}
function dispatch(action){
 if(state.opening)stopOpening();
 const before=state;state=reduce(state,action);
 if(action.type==='question'&&before.question!==state.question){scene?.moveTo(HOME);state.view='oblique';}
 if(action.type==='view'&&scene)scene.moveTo(VIEWS[state.view]);
 if(before.display!==state.display&&before.display!=='model')saveFigure();
 sync();
}
function setDisplay(key){
 if(state.opening)stopOpening();
 if(key===state.display){sync();return;}
 saveFigure();state=reduce(state,{type:'display',value:key});sync();
 if(key!=='model')requestAnimationFrame(()=>{const v=figureViews[key];$('paper-viewport').scrollTo(v.x,v.y);});else scene?.wake();
}
function managePlay(){
 if(!scene||!state.playing){playStop?.();playStop=null;return;}if(playStop)return;
 playStop=scene.animate((now,dt)=>{if(!state.playing){playStop=null;return false;}const p=clamp(state.progress+dt/18);state={...state,progress:p,playing:p<1};
  $('progress').value=(p*100).toFixed(1);$('progress-value').value=Math.round(p*100)+'%';scene.setState(state);if(!state.playing){playStop=null;sync();return false;}return true;});
}

// ————— The opening: one visible change per beat, paced for reading —————
// The figure's reading clock waits until most of the stage is on screen, so nobody misses the hand-over.
let stageInView=false;if(typeof IntersectionObserver==='function')new IntersectionObserver(e=>{stageInView=e[0].intersectionRatio>=.6;},{threshold:[0,.6,1]}).observe($('stage'));else stageInView=true;
// On a first visit the page builds in first (CSS); the figure's reading clock starts once the stage has arrived.
const BUILD_IN=document.documentElement.classList.contains('build-in')?5.6:0;
// Any pointer, key, wheel or touch input skips the build-in to its end, as on the other modules.
if(BUILD_IN){const skip=()=>{for(const an of document.getAnimations())if(/^build-/.test(an.animationName||''))an.finish();for(const ev of ['pointerdown','keydown','wheel','touchstart'])removeEventListener(ev,skip,true);};for(const ev of ['pointerdown','keydown','wheel','touchstart'])addEventListener(ev,skip,{capture:true,passive:true});}
function startOpening(){
 if(!state.opening||!scene)return;
 const durations=OPENING.map(readingTime);durations[0]+=BUILD_IN;let beat=0,t=0,emerging=false;
 durations[1]=(PROFILE.zoom+PROFILE.reveal+PROFILE.lift)/1000+.6;
 emergence.texture($('paper-image').currentSrc||$('paper-image').src).catch(()=>{});
 let elapsed=0;state.beat=0;state.progress=.45;state.open=false;state.slice=.12;sync();
 const enter=b=>{beat=b;t=0;state.beat=b;
  if(b===1){emerging=true;emergence.run($('paper-image'),{toPose:HOME,onSwap:()=>{state.display='model';sync();},onDone:()=>{emerging=false;}}).catch(()=>{emerging=false;state.display='model';sync();});}
  if(b===2){state.open=true;}
  if(b===3){state.slice=.12;}
  sync();};
 openingStop=scene.animate((now,dt)=>{
  if(!state.opening)return false;if(state.openingPaused||(beat===0&&!stageInView))return true;
  t+=dt;elapsed+=dt;$('opening-progress').style.setProperty('--p',clamp(elapsed/durations.reduce((a,b)=>a+b,0)).toFixed(3));
  if(beat===3){state.slice=.12+.5*smooth(.4,durations[3]-1.4,t);scene.setState(state);$('slice').value=(state.slice*100).toFixed(1);$('slice-value').value=Math.round(state.slice*100)+'%';}
  if(t>=durations[beat]&&!(beat===1&&emerging)){if(beat<OPENING.length-1)enter(beat+1);else{state=reduce(state,{type:'stop-opening'});state.beat=null;openingStop=null;sync();return false;}}
  return true;});
 enter(0);
}

// ————— Wiring —————
function failure(){failed=true;$('stage').classList.add('webgl-failed');$('fallback').hidden=false;$('scene-labels').hidden=true;state={...state,opening:false,playing:false,display:state.display};}
try{if(params.has('no-webgl'))throw Error('Requested fallback');
 scene=new WireScene($('wire'),{frame:onFrame,interrupt:()=>{if(state.opening)stopOpening();if(state.view!=null){state=reduce(state,{type:'free-camera'});sync();}},camera:()=>{},failure,home:()=>VIEWS[state.view]??HOME});
 emergence=new PaperEmergence(scene,$('stage'));
}catch(e){console.warn('Fig.3D: static fallback',e);failure();}
all('[data-question]').forEach(b=>b.addEventListener('click',()=>dispatch({type:'question',value:b.dataset.question})));
$('explorer').querySelector('.tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=all('[data-question]'),i=tabs.indexOf(document.activeElement),n=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[n].focus();tabs[n].click();});
all('[data-display]').forEach(b=>b.addEventListener('click',()=>setDisplay(b.dataset.display)));
all('[data-stress]').forEach(b=>b.addEventListener('click',()=>dispatch({type:'stress',value:b.dataset.stress})));
all('[data-view]').forEach(b=>b.addEventListener('click',()=>dispatch({type:'view',value:b.dataset.view})));
all('[data-camera]').forEach(b=>b.addEventListener('click',()=>{if(state.opening)stopOpening();if(b.dataset.camera!=='reset'&&state.view!=null){state=reduce(state,{type:'free-camera'});sync();}scene?.control(b.dataset.camera);}));
$('progress').addEventListener('input',e=>dispatch({type:'progress',value:e.target.value/100}));
$('slice').addEventListener('input',e=>dispatch({type:'slice',value:e.target.value/100}));
$('play').addEventListener('click',()=>dispatch({type:'play'}));
$('cut').addEventListener('click',()=>dispatch({type:'open'}));
$('reference-open').addEventListener('click',e=>setDisplay(e.currentTarget.dataset.figure));
$('explore').addEventListener('click',()=>{stopOpening();sync();});
$('opening-pause').addEventListener('click',()=>{state={...state,openingPaused:!state.openingPaused};if(emergence)emergence.paused=state.openingPaused;sync();});
$('figure-in').addEventListener('click',()=>zoomFigure(1.5));$('figure-out').addEventListener('click',()=>zoomFigure(1/1.5));$('figure-fit').addEventListener('click',()=>zoomFigure(0));
{let pan=null;const p=$('paper-viewport');p.addEventListener('pointerdown',e=>{if(state.opening){stopOpening();sync();}if(figureViews[state.display]?.zoom>1&&e.pointerType!=='touch'){pan={x:e.clientX,y:e.clientY,l:p.scrollLeft,t:p.scrollTop};p.setPointerCapture(e.pointerId);p.classList.add('panning');}});p.addEventListener('pointermove',e=>{if(pan){p.scrollLeft=pan.l-(e.clientX-pan.x);p.scrollTop=pan.t-(e.clientY-pan.y);}});const end=()=>{if(pan){pan=null;p.classList.remove('panning');saveFigure();}};p.addEventListener('pointerup',end);p.addEventListener('pointercancel',end);p.addEventListener('scroll',()=>{if(!pan)saveFigure();},{passive:true});}
$('paper-image').addEventListener('load',()=>{if(showingPaper()){sizeFigure();const v=figureViews[state.display];$('paper-viewport').scrollTo(v.x,v.y);}});
// Any input on the stage during the opening hands it over; capture phase reaches the zooming figure too.
$('stage').addEventListener('pointerdown',e=>{if(state.opening&&!e.target.closest('.stage-bar')){stopOpening();sync();}},{capture:true});
$('wire').addEventListener('keydown',()=>{if(state.opening){stopOpening();sync();}});
addEventListener('keydown',e=>{if(e.key==='Escape'&&showingPaper()){e.preventDefault();setDisplay('model');}});
addEventListener('resize',()=>sizeFigure());
reducedQuery.addEventListener('change',e=>{if(state.opening)stopOpening();state=reduce(state,{type:'reduced',value:e.matches});sync();});
addEventListener('pagehide',()=>{state={...state,playing:false};playStop?.();playStop=null;scene?.stop();});
addEventListener('pageshow',()=>scene?.wake());
if(params.has('card'))state.card=true;
window.figState=()=>({...state});
sync();if(state.opening&&scene)startOpening();else if(state.opening){state.opening=false;state.display='model';sync();}
