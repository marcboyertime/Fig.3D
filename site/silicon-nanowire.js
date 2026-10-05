import {initialState,reduce,FIGURES,HOME,section,contour,outer,zAt,clamp,TAU} from './silicon-nanowire-model.mjs';
import {WireScene} from './silicon-nanowire-scene.mjs';
import {PaperEmergence} from './silicon-nanowire-opening.mjs';
const $=id=>document.getElementById(id),all=s=>[...document.querySelectorAll(s)],BASE='assets/silicon-nanowire/';
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),params=new URLSearchParams(location.search);
let state=initialState(reduced.matches||params.has('reduced')),scene,emergence,openingElapsed=0,openingPhase=0,openingStop,playStop,failed=false;
const paperMemory={};let paperZoom=1,previousFigure='5';
const copy={
 shape:['CRYSTAL ORIENTATION · FIGURES 3 & 5','One front, two very different directions','Lithium transforms the outside first. The remaining silicon core tapers along the wire, while expansion across it depends on crystal orientation.'],
 stress:['INTERNAL MISMATCH · FIGURE S10','The stress changes sign','At first, the expanding outer region is held back. Later, growth farther inside stretches the already transformed shell. Surface compression gives way to tension near the indent.'],
 cracks:['OBSERVATION MEETS MODEL · FIGURES 2 & 5','A shrinking core changes the balance','The authors observed cracks behind the advancing front where the crystalline core had disappeared. Their model explains how a surface indent can become unstable as central compression diminishes.']
};
const deep={
 shape:`<h3>Read the crystal directions</h3><p>x₁ = [1 −1 0], x₂ = [1 1 −1], and the wire axis x₃ = [112]. These three directions are perpendicular. The moving section is normal to the wire axis: the (112) plane.</p><p>The paper finds much greater transverse expansion along x₁. Looking along x₁ hides that width; looking along x₂ reveals it. Figure 3g–h demonstrates this with the same experimental wire.</p><h3>Why the core tapers</h3><p>In the end-fed experiment, transformation near the outer surface advances ahead of the center. A section closer to the Li-supplied end has a smaller residual core. Move the section to see this relationship in the same geometry.</p><h3>What the colors mean</h3><p>In Lithium mode, blue denotes the Li-deficient core and amber the Li-rich product. The source defines c relative to the fully lithiated state at Li/Si = 3.75. Our two-region coloring explains that distinction; it does not calculate the concentration field.</p>`,
 stress:`<h3>Expansion is not elastic strain</h3><p>The newly transformed material has a larger preferred shape. Because it remains attached to surrounding material, it cannot expand freely in every direction. The mismatch produces elastic stress and plastic deformation.</p><p class="formula">dε = dεᶜ + dεᵉ + dεᵖ</p><p>The paper separates chemical, elastic and plastic strain. Its 150% and 40% transverse chemical-strain coefficients were fitted to shape; they are not measured diameter changes.</p><h3>No applied force does not mean no stress</h3><svg viewBox="0 0 310 112" role="img" aria-label="Internal tension and compression can balance without external force"><path d="M40 24H270V88H40Z" fill="#19253b" stroke="#526685"/><path d="M110 40H65m0 0 9-5m-9 5 9 5M200 40H245m0 0-9-5m9 5-9 5" fill="none" stroke="#efb17b" stroke-width="2"/><path d="M65 72H110m0 0-9-5m9 5-9 5M245 72H200m0 0 9-5m-9 5 9 5" fill="none" stroke="#a1c2ff" stroke-width="2"/><text x="155" y="44" fill="#efb17b" text-anchor="middle" font-size="12">tension</text><text x="155" y="76" fill="#a1c2ff" text-anchor="middle" font-size="12">compression</text></svg><p>Local tensile and compressive stresses can coexist while their resultant balances. These equal-length arrows show signs, not calculated magnitudes or a solved equilibrium field.</p><h3>Two different stress measures</h3><p>σ₁₁ is the normal stress along x₁: positive is tension, negative is compression. Von Mises stress combines the deviatoric stress components into a nonnegative scalar used in the paper’s plasticity model. It has no tension/compression sign.</p><h3>How the authors modeled the front</h3><p>They assigned D₁₁/D₂₂ ≈ 100 to reproduce orientation-dependent interface motion. This is an effective numerical construction—not an independent measurement of intrinsic lithium diffusivity. The supplement explicitly distinguishes the actual moving two-phase interface from its single-field numerical surrogate.</p>`,
 cracks:`<h3>What was actually seen?</h3><p>Figure 2e–i records a growing crack behind the reaction front. The lithium map and mass-thickness line scans distinguish the residual silicon core from the central crack. Figure 1 compares swollen wires in solid and liquid electrochemical cells.</p><h3>What does Figure 5 explain?</h3><p>At the post-necking stage, σ₁₁ is tensile near the surface indent and compressive through the center. Further transformation reduces the central compressive region. The authors interpret this as permitting unstable growth of the indent toward a crack.</p><h3>What it does not predict here</h3><p>Our wire does not split at a made-up concentration or stress threshold. The observed crack is shown in the original microscopy; the evolving 3D object explains the geometry surrounding it. No fracture law, loading rate or failure probability is calculated.</p><p>This result concerns the particular crystalline nanowires studied here. It is not a universal prediction for every silicon particle, amorphous anode or cycling condition.</p>`
};
function dispatch(a){if(a.type!=='progress'||!a.playing)interrupt(false);state=reduce(state,a);sync();}
function interrupt(render=true){openingStop?.();openingStop=null;state={...state,opening:false};if(emergence?.active){emergence.interrupt();state={...state,display:'model'};}else emergence?.cancel();if(render)sync();}
function setPaper(key){
 if(state.display!=='model'){paperMemory[state.display]={zoom:paperZoom,left:$('paper-viewport').scrollLeft,top:$('paper-viewport').scrollTop};}
 interrupt(false);state=reduce(state,{type:'display',value:key});if(key!=='model'){previousFigure=key;paperZoom=paperMemory[key]?.zoom||1;}sync();if(key!=='model')requestAnimationFrame(()=>{const m=paperMemory[key];if(m){$('paper-viewport').scrollLeft=m.left;$('paper-viewport').scrollTop=m.top;}});
}
async function enterModel(opening=false){
 if(state.display==='model'){interrupt();return;}
 const source=state.display;paperMemory[source]={zoom:paperZoom,left:$('paper-viewport').scrollLeft,top:$('paper-viewport').scrollTop};
 if(!scene||state.reduced||paperZoom!==1){state={...state,display:'model',opening:false};sync();return;}
 if(opening){state={...state,progress:.22,open:false};scene.setState(state);}
 $('opening-text').textContent='From the section into the wire';
 emergence.paused=false;try{await emergence.run($('paper-image'),{opening,onSwap:()=>{state={...state,display:'model'};sync();},onDone:()=>{if(opening&&state.opening){state={...state,open:true};sync();openingPhase=2;openingElapsed=0;startGrowth();}else {state={...state,opening:false};sync();}}});}catch(error){emergence.cancel();state={...state,display:'model',opening:false};sync();console.warn('Fig.3D: paper transition unavailable',error);}
}
function startOpening(){if(state.reduced||failed)return;openingStop=scene.animate((now,dt)=>{if(!state.opening)return false;if(state.openingPaused||emergence?.active)return true;openingElapsed+=dt;if(openingPhase===0&&openingElapsed>7){openingPhase=1;enterModel(true);return false;}return true;});}
function startGrowth(){openingStop=scene.animate((now,dt)=>{if(!state.opening)return false;if(state.openingPaused)return true;openingElapsed+=dt;state={...state,progress:.22+.26*clamp(openingElapsed/9)};sync(false);if(openingElapsed>=11){state={...state,opening:false};sync();return false;}return true;});}
function updatePaper(){if(state.display==='model')return;const f=FIGURES[state.display];if(!f)return;const im=$('paper-image');if(!im.src.endsWith(f.file)){im.src=BASE+f.file;im.width=f.width;im.height=f.height;im.alt=f.title+'. '+f.caption;}
 $('paper-title').textContent=f.title;$('paper-caption').textContent=f.caption;im.style.maxWidth=paperZoom===1?'100%':'none';im.style.maxHeight=paperZoom===1?'100%':'none';im.style.width=paperZoom===1?'auto':`${f.width*paperZoom*.55}px`;im.style.height='auto';$('paper-viewport').style.alignItems=paperZoom===1?'center':'flex-start';$('paper-viewport').style.justifyContent=paperZoom===1?'center':'flex-start';
}
function sync(full=true){
 scene?.setState(state);const paper=state.display!=='model';$('paper').hidden=!paper;$('stage').classList.toggle('source-active',paper);$('stage').classList.toggle('field-mises',state.field==='mises');
 $('opening-controls').hidden=!state.opening;$('camera-controls').hidden=paper||state.opening||failed;$('opening-pause').textContent=state.openingPaused?'Resume':'Pause';$('opening-pause').setAttribute('aria-label',state.openingPaused?'Resume opening':'Pause opening');
 all('[data-display]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.display===state.display)));all('[data-question]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.question===state.question)));
 document.querySelector('[data-display="s10"]').hidden=state.question!=='stress'&&state.display!=='s10';
 $('progress').value=state.progress*100;$('progress-value').value=Math.round(state.progress*100)+'%';$('slice').value=state.slice*100;$('slice-value').value=Math.round(state.slice*100)+'%';$('slice-position').textContent=Math.round(state.slice*100)+'%' ;
 $('play').textContent=state.playing?'Ⅱ':'▶';$('play').setAttribute('aria-label',state.playing?'Pause lithiation':state.progress>=1?'Replay lithiation':'Play lithiation');const stress=state.question==='stress';$('progress').disabled=stress;$('play').disabled=stress||paper||failed;$('transport').hidden=stress;
 $('shape-controls').hidden=stress;$('mobile-slice').hidden=stress||paper;$('stress-controls').hidden=state.field!=='normal';$('cut').textContent=state.open?'Close the wire':'Open the wire';$('cut').setAttribute('aria-pressed',String(state.open));$('cut').hidden=failed;all('[data-angle]').forEach(b=>b.disabled=failed);$('field').value=state.field;
 all('[data-stress]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.stress===state.stressStage)));
 if(full){const [k,title,text]=copy[state.question];$('view-kicker').textContent=k;$('view-title').textContent=title;$('view-copy').textContent=text;$('deep-copy').innerHTML=deep[state.question];
  if(state.field==='mises'){$('view-title').textContent='Yielding has no tension sign';$('view-copy').textContent='The paper’s von Mises field highlights distortional stress and plastic yielding. It is a nonnegative measure—not a map of tension versus compression.';}
  if(state.field==='lithium'){$('view-title').textContent='The core is last to transform';$('view-copy').textContent='Blue marks the Li-deficient core; amber marks the transformed region. Move the section along the wire to see how that core tapers behind the front.';}
  if(state.field==='normal'&&state.stressStage==='early'){$('view-title').textContent='First, the shell is held back';$('view-copy').textContent='The outer region transforms and wants to expand. Its surroundings constrain it: the source model shows surface compression and central tension before necking.';}
  legend();reference();updatePaper();
 }
 $('mode-note').textContent=state.field==='normal'?`σ₁₁ along x₁ · ${state.stressStage==='early'?'before':'after'} necking · sign only`:state.field==='mises'?'Geometry for context · field in source panel':state.field==='lithium'?'Illustrative Li-rich shell / Li-deficient core':'Schematic reconstruction · Fig. 5a–d';
 drawSection();managePlay();
}
function legend(){const f=state.field;
 $('legend').innerHTML=f==='lithium'?'<span>Normalized lithium · two-region illustration</span><div class="bar"></div><div class="ends"><span>Core · c ≈ 0</span><span>Shell · c ≈ 1</span></div>':f==='normal'?'<div class="key"><span><i style="background:#efb17b"></i>Tension · pulls apart</span><span><i style="background:#a1c2ff"></i>Compression · pushes together</span></div>':f==='mises'?'<span>Original σ<sub>eq</sub> field · GPa</span><p class="small">Printed scale: 0–3.3 GPa. The model assumes a 3 GPa yield stress. A fixed reported stage, not a new calculation.</p>':'<div class="key"><span><i style="background:#9cb2d8"></i>Crystalline Si</span><span><i style="background:#dfb78a"></i>Lithiated region</span></div>';
}
function reference(){const q=state.question,f=state.field;$('reference-inset').hidden=q==='shape';if(q==='shape')return;
 let file,caption,key;
 if(q==='cracks'){file='crack-observation.jpeg';caption='Figure 2e–i · observed crack behind the advancing front. Open the full figure ↗';key='2';}
 else if(f==='mises'){file='von-mises.jpeg';caption='Figure 5e · published post-necking field. Colors belong to the original calculation. Open Figure 5 ↗';key='5';}
 else {file=state.stressStage==='early'?'stress-early.png':'stress-late.png';caption=`Figure S10${state.stressStage==='early'?'b':'d'} · published ${state.stressStage==='early'?'pre':'post'}-necking normal-stress section. Inspect profiles & axes ↗`;key='s10';}
 $('reference-image').src=BASE+file;$('reference-image').alt=caption;$('reference-caption').textContent=caption;$('reference-open').dataset.figure=key;
}
function drawSection(){const {d,outer:out,core:inside}=contour(state.progress,state.slice),cx=150,cy=94,k=43;
 const path=pts=>'M'+pts.map(([x,y])=>`${(cx+k*x).toFixed(2)},${(cy-k*y).toFixed(2)}`).join('L')+'Z';const li=state.field==='lithium',norm=state.field==='normal';
 let svg=`<defs><linearGradient id="shell-grad" x2="0.8" y2="1"><stop stop-color="${li?'#f4ba6e':norm?'#9da8bb':'#e1bd95'}"/><stop offset="1" stop-color="${li?'#cf8138':norm?'#61718b':'#90643f'}"/></linearGradient><marker id="t-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0L5 2.5 0 5Z" fill="#f2b078"/></marker><marker id="c-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0L5 2.5 0 5Z" fill="#a7c8ff"/></marker></defs>`;
 svg+=`<path d="${path(out)}" fill="url(#shell-grad)" stroke="#e5cfb666" stroke-width=".8"/>`;
 if(d.q<.9999)svg+=`<path d="${path(inside)}" fill="${li?'#3679de':'#90a8cd'}" stroke="#d1def2" stroke-width=".7"/>`;
 svg+=`<circle cx="${cx}" cy="${cy}" r="${k}" fill="none" stroke="#e5e9f4" stroke-opacity=".7" stroke-dasharray="3 4" stroke-width="1"/>`;
 svg+='<path d="M22 187H76M22 187V148" stroke="#899ab7" fill="none"/><text x="85" y="192" fill="#b9c7de" font-size="19">x₁ [1 −1 0]</text><text x="16" y="139" fill="#b9c7de" font-size="19">x₂ [1 1 −1]</text>';
 if(norm){const late=state.stressStage==='late',y=cy-k*d.b*(1-d.n)-8;
  for(const [yy,tens] of [[y,late],[cy,!late]]){const color=tens?'#f2b078':'#a7c8ff',m=tens?'t':'c';svg+=`<path d="M${tens?cx-6:cx-52} ${yy}H${tens?cx-52:cx-6}M${tens?cx+6:cx+52} ${yy}H${tens?cx+52:cx+6}" stroke="${color}" stroke-width="2" fill="none" marker-end="url(#${m}-arrow)"/>`;}
 }
 $('section-svg').innerHTML=svg;$('section-svg').setAttribute('aria-label',`Section ${Math.round(state.slice*100)} percent from the supplied end. ${d.q<.001?'Round pristine silicon':d.q>.999?'Transformed dumbbell with no residual core':'Transformed shell around a residual silicon core'}.`);$('section-note').textContent=norm?'Arrows: σ₁₁ sign along x₁':'Dashed circle · pristine outline';
}
function managePlay(){if(!scene)return;if(!state.playing){playStop?.();playStop=null;return;}if(playStop)return;playStop=scene.animate((now,dt)=>{if(!state.playing)return false;const p=clamp(state.progress+dt/24);state={...state,progress:p,playing:p<1};sync(false);return state.playing;});}
function labels(sc){if(state.display!=='model')return;const d=section(state.progress,state.slice),a=sc.project([d.cx,.02,d.z]),b=sc.project([-d.a*.8,-.12,d.z]);for(const [id,v] of [['label-core',a],['label-shell',b]]){const el=$(id);el.hidden=state.field==='normal'||state.field==='mises'||(id==='label-core'&&(!state.open||d.q>.98))||(id==='label-shell'&&d.q<.001);el.style.left=clamp(v.x+(id==='label-core'?12:-30),8,sc.width-el.offsetWidth-10)+'px';el.style.top=clamp(v.y+(id==='label-core'?-42:26),40,sc.height-36)+'px';}}

function failure(){failed=true;$('stage').classList.add('webgl-failed');$('fallback').hidden=false;$('scene-labels').hidden=true;state={...state,opening:false,playing:false};$('opening-controls').hidden=true;$('camera-controls').hidden=true;}
try{if(params.has('no-webgl'))throw Error('Requested fallback');scene=new WireScene($('wire'),{labels,interrupt:()=>{interrupt(false);state={...state,display:'model'};sync();},camera:()=>all('[data-angle]').forEach(b=>b.setAttribute('aria-pressed','false')),failure});emergence=new PaperEmergence(scene,$('stage'));}catch(e){console.warn('Fig.3D: static fallback',e);failure();}
all('[data-question]').forEach(b=>b.addEventListener('click',()=>dispatch({type:'question',value:b.dataset.question})));
all('[data-display]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.display==='model'&&state.display!=='model'){interrupt(false);enterModel();}else setPaper(b.dataset.display);}));
$('paper-return').addEventListener('click',()=>{interrupt(false);enterModel();});
$('explore').addEventListener('click',()=>{interrupt(false);if(state.display!=='model')enterModel();else sync();});
$('opening-pause').addEventListener('click',()=>{state={...state,openingPaused:!state.openingPaused};if(emergence)emergence.paused=state.openingPaused;sync();});
$('progress').addEventListener('input',e=>dispatch({type:'progress',value:e.target.value/100}));$('slice').addEventListener('input',e=>dispatch({type:'slice',value:e.target.value/100}));$('play').addEventListener('click',()=>dispatch({type:'play'}));$('cut').addEventListener('click',()=>dispatch({type:'open'}));
$('field').addEventListener('change',e=>{dispatch({type:'field',value:e.target.value});if(e.target.value==='normal')dispatch({type:'stress-stage',value:state.stressStage});});
all('[data-stress]').forEach(b=>b.addEventListener('click',()=>dispatch({type:'stress-stage',value:b.dataset.stress})));
all('[data-camera]').forEach(b=>b.addEventListener('click',()=>{interrupt();scene?.control(b.dataset.camera);}));
all('[data-angle]').forEach(b=>b.addEventListener('click',()=>{interrupt();const poses={oblique:HOME,end:{yaw:0,elevation:0,halfHeight:3.5},x1:{yaw:Math.PI/2,elevation:0,halfHeight:7.8},x2:{yaw:0,elevation:Math.PI/2-.0001,halfHeight:7.6}};scene?.moveTo(poses[b.dataset.angle]);all('[data-angle]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));}));
$('reference-open').addEventListener('click',e=>setPaper(e.currentTarget.dataset.figure));
$('paper-plus').addEventListener('click',()=>{interrupt(false);paperZoom=clamp(paperZoom+.5,1,3);sync();});$('paper-minus').addEventListener('click',()=>{interrupt(false);paperZoom=clamp(paperZoom-.5,1,3);sync();});$('paper-fit').addEventListener('click',()=>{interrupt(false);paperZoom=1;sync();});
$('stage').addEventListener('pointerdown',e=>{if(emergence?.active&&!e.target.closest('button')){interrupt();}},{capture:true});
addEventListener('keydown',e=>{if(e.key==='Escape'&&state.display!=='model'){e.preventDefault();setPaper('model');}});
reduced.addEventListener('change',e=>{interrupt(false);state=reduce(state,{type:'reduced',value:e.matches});sync();});
addEventListener('pagehide',()=>{state={...state,playing:false};playStop?.();scene?.stop();});
addEventListener('pageshow',()=>scene?.wake());
const sliceControl=document.querySelector('.slice-control');const phoneLayout=matchMedia('(max-width:760px)');function placeSlice(){if(phoneLayout.matches)$('mobile-slice').append(sliceControl);else $('shape-controls').prepend(sliceControl);}phoneLayout.addEventListener('change',placeSlice);placeSlice();
sync();startOpening();
