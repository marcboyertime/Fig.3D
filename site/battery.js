import {batteryState,reverseProgress} from './battery-model.mjs';
import {BatteryScene} from './battery-scene.mjs';
const $=id=>document.getElementById(id),reduced=matchMedia('(prefers-reduced-motion:reduce)');
let lastSelectionKey='';
let mode='discharge',progress=.5,inside=false,playing=!reduced.matches,phase=.25,state=batteryState(.5),pinned=null,previewed=null,scene=null,lastTime=null;
const info={
  negative:()=>({title:'Graphite · negative electrode',copy:mode==='discharge'?'Lithium leaves the graphite while oxidation supplies electrons to the external circuit. Graphite is the anode in this mode.':'Lithium enters graphite while the host accepts electrons supplied by the charger. Graphite is the cathode in this mode.'}),
  positive:()=>({title:'Cobalt oxide · positive electrode',copy:mode==='discharge'?'Lithium insertion is coupled to electron acceptance by the oxide host. This is reduction: the positive electrode is the cathode.':'Lithium leaves the oxide as the host is oxidized. Electrons are withdrawn through the charger. The positive electrode is the anode.'}),
  separator:()=>({title:'Separate solids. Connect ions.',copy:'This porous film prevents direct electronic contact between the electrodes. Electrolyte in its pores carries ions; electrons take the external circuit.'}),
  electrolyte:()=>({title:'The ionic path',copy:'Lithium ions travel through the electrolyte between the electrode surfaces. The liquid also contains counterions and solvent, omitted from this view.'}),
  circuit:()=>({title:'The electronic path',copy:mode==='discharge'?'Electrons leave graphite, transfer energy through the load, and reach the oxide. Conventional current points the opposite way.':'The charging source removes electrons from the oxide side and supplies them to the graphite side. Electrons stay in the electronic conductors.'}),
  load:()=>({title:mode==='discharge'?'The load receives energy':'The charger supplies energy',copy:mode==='discharge'?'The coupled cell reaction lowers chemical free energy, allowing electrical energy to be delivered to a load.':'An external source drives the reverse reaction and raises the cell’s stored chemical free energy. Its negative terminal connects to graphite.'}),
  carbon:()=>({title:'A host made of carbon sheets',copy:'Each sheet is a hexagonal network of bonded carbon atoms. Lithium is accommodated between the sheets; the carbon framework is retained during insertion.'}),
  gallery:()=>({title:'Intercalation means “between”',copy:mode==='discharge'?'Lithium leaves interlayer galleries and exits at an exposed edge. Electronic charge is carried through the conducting host and circuit.':'Lithium enters through an exposed edge and occupies sites between carbon sheets. Electron acceptance by the host accompanies this insertion.'}),
  edge:()=>({title:mode==='discharge'?'The way out':'The way in',copy:'The highlighted path reaches a gallery at its exposed edge and runs parallel to the sheets. It does not pass through an intact carbon hexagon. Surface films and local barriers are omitted.'}),
  lithium:()=>({title:'Lithium in the galleries',copy:'The visible population follows the graphite’s average lithium content x. Real graphite has composition-dependent staging and ordering; this simplified view shows the interlayer locations.'})
};
function selection(){
  const key=previewed||pinned,item=key&&info[key]?info[key]():null;
  const nextKey=`${mode}:${key||'energy'}`;if(nextKey!==lastSelectionKey&&!reduced.matches){const panel=document.querySelector('.selection');panel.classList.remove('is-changing');void panel.offsetWidth;panel.classList.add('is-changing');}lastSelectionKey=nextKey;
  $('selection-kicker').textContent=item?(pinned===key?'PINNED EXPLANATION':'LOOK CLOSER'):'FOLLOW THE ENERGY';
  $('part-title').textContent=item?.title||(mode==='discharge'?'Chemical → electrical':'Electrical → chemical');
  $('part-copy').textContent=item?.copy||(mode==='discharge'?'During discharge, the coupled chemical reaction delivers electrical energy to the load.':'During charge, the external source drives lithium back into graphite, storing chemical energy in the cell.');
  $('clear-selection').hidden=!pinned;scene?.select(key);
}
// Hover previews wait a beat before showing, and a little longer before clearing, so a pointer sweeping across the scene does not flicker the panel.
let hoverTimer=0;
function onPart(key,pin){
  clearTimeout(hoverTimer);
  if(pin){pinned=pinned===key?null:key;previewed=null;selection();return;}
  if(key===previewed)return;hoverTimer=setTimeout(()=>{previewed=key;selection();},key?(previewed?60:140):260);
}
function view(){
  $('cell-view').toggleAttribute('aria-current',!inside);$('graphite-view').toggleAttribute('aria-current',inside);
  if(!inside)$('cell-view').setAttribute('aria-current','page');else $('graphite-view').setAttribute('aria-current','page');
  $('view-eyebrow').textContent=inside?'INSIDE THE NEGATIVE ELECTRODE':'THE WHOLE CELL';
  $('view-title').innerHTML=inside?(mode==='discharge'?'Between the sheets<br>Out through an edge':'Through an edge<br>Between the sheets'):'Two paths<br>One reaction';
  $('view-copy').textContent=inside?(mode==='discharge'?'Graphite releases lithium from its interlayer galleries. Its carbon framework remains in place.':'Graphite accepts lithium into its interlayer galleries. This reversible insertion is called intercalation.'):(mode==='discharge'?'Lithium ions cross the electrolyte. Electrons take the external circuit. The electrode reactions connect their journeys.':'The charging source reverses the coupled reactions. Lithium returns to graphite as electrons arrive through the external circuit.');
  $('dive').textContent=inside?'Return to the cell':'Go inside graphite';
  $('scene-hint').textContent=inside?'Lithium occupies the interlayer galleries.':'Two paths, coupled at the electrodes.';
  $('lithium-key').textContent=inside?'Intercalated lithium':'Lithium ions';$('electron-key').hidden=inside;$('carbon-key').hidden=!inside;
  $('cell-canvas').setAttribute('aria-label',inside?'Three-dimensional hexagonal carbon sheets, with lithium in the interlayer galleries. A highlighted path enters or exits through an exposed edge. Drag or use the arrow keys to rotate.':'Three-dimensional graphite and cobalt oxide cell. Lithium ions cross the electrolyte; electrons travel through the external circuit. Drag or use the arrow keys to rotate.');
  selection();
}
function setView(value){inside=value;pinned=null;previewed=null;scene?.setView(inside,reduced.matches);view();}
const formula=(x,host)=>`<span class="term">Li<sub>${x.toFixed(2)}</sub>${host}</span>`;
function renderState(){
  state=batteryState(progress,mode);scene?.setState(state);
  $('progress').value=String(Math.round(state.negative*1000));$('progress-label').textContent=state.negative.toFixed(3);
  $('negative-readout').textContent=state.negative.toFixed(3);$('positive-readout').textContent=state.positive.toFixed(3);
  const x=50+524*progress,y=v=>225-203*v,start=batteryState(0,mode),end=batteryState(1,mode);
  for(const name of ['negative','positive']){
    $(`${name}-line`).setAttribute('d',`M50 ${y(start[name])}L574 ${y(end[name])}`);
    $(`${name}-dot`).setAttribute('cx',x);$(`${name}-dot`).setAttribute('cy',y(state[name]));
    // Name each line at the end where the two are furthest apart: above the upper line, below the lower one.
    const atEnd=Math.abs(end.negative-end.positive)>=Math.abs(start.negative-start.positive),v=atEnd?end[name]:start[name],upper=v>=(atEnd?Math.max(end.negative,end.positive):Math.max(start.negative,start.positive));
    const tag=$(`${name}-chart-label`);tag.setAttribute('x',atEnd?566:58);tag.setAttribute('text-anchor',atEnd?'end':'start');tag.setAttribute('y',y(v)+(upper?-14:28));
  }
  $('chart-cursor').setAttribute('d',`M${x} 22V225`);
  const xi=state.extent.toFixed(2),ions=`<span class="term">+ ${xi} Li<sup>+</sup></span> <span class="term">+ ${xi} e<sup>−</sup></span>`,arrow='<span class="rx-arrow">→</span>',c='C<sub>6</sub>',oxide='CoO<sub>2</sub>';
  // Each term, and the arrow with the term after it, stays on one line when the equation wraps on a phone.
  const yields=t=>`<span class="term">${arrow}${t}</span>`;
  $('negative-reaction').innerHTML=mode==='discharge'?`${formula(.60,c)} ${yields(formula(state.negative,c))} ${ions}`:`${formula(.30,c)} ${ions} ${yields(formula(state.negative,c))}`;
  $('positive-reaction').innerHTML=mode==='discharge'?`${formula(.60,oxide)} ${ions} ${yields(formula(state.positive,oxide))}`:`${formula(.90,oxide)} ${yields(formula(state.positive,oxide))} ${ions}`;
}
function renderMode(){
  document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
  $('mode-label').textContent=mode==='discharge'?'DISCHARGING':'CHARGING';$('mode-label').classList.toggle('charging',mode==='charge');
  $('negative-role').textContent=mode==='discharge'?'Anode · oxidation':'Cathode · reduction';$('positive-role').textContent=mode==='discharge'?'Cathode · reduction':'Anode · oxidation';
  $('negative-reaction-label').textContent=`GRAPHITE · ${mode==='discharge'?'OXIDATION':'REDUCTION'}`;$('positive-reaction-label').textContent=`COBALT OXIDE · ${mode==='discharge'?'REDUCTION':'OXIDATION'}`;
  $('inventory-copy').textContent=mode==='discharge'?'Lithium leaves graphite and enters cobalt oxide. One electron moves through the circuit for every lithium ion transferred.':'Lithium leaves cobalt oxide and returns to graphite. The charger reverses the electron transfer at the same time.';
  view();renderState();playback();
}
function playback(){
  $('motion-toggle').textContent=playing?'Pause motion':'Resume motion';$('motion-toggle').setAttribute('aria-pressed',String(playing));
  $('playback-status').textContent=`${playing?'Motion on':'Motion paused'}. ${mode==='charge'?'Charging':'Discharging'} direction at fixed graphite composition ${state.negative.toFixed(3)}.`;
}
function changeMode(value){if(value===mode)return;progress=reverseProgress(progress);mode=value;renderMode();}
$('motion-toggle').addEventListener('click',()=>{playing=!playing;lastTime=null;playback();});
$('progress').addEventListener('input',e=>{const x=Number(e.target.value)/1000,d=(.60-x)/.30;progress=Math.max(0,Math.min(1,mode==='discharge'?d:1-d));renderState();playback();});
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>changeMode(b.dataset.mode)));
$('dive').addEventListener('click',()=>setView(!inside));$('cell-view').addEventListener('click',()=>setView(false));$('graphite-view').addEventListener('click',()=>setView(true));
$('reset-camera').addEventListener('click',()=>scene?.resetCamera(reduced.matches));$('clear-selection').addEventListener('click',()=>{pinned=null;previewed=null;selection();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){pinned=null;previewed=null;selection();}});
reduced.addEventListener('change',()=>{if(reduced.matches){playing=false;scene?.setView(inside,true);playback();}});
document.addEventListener('visibilitychange',()=>{lastTime=null;});
try{scene=new BatteryScene($('cell-canvas'),$('scene-labels'),onPart);}catch(error){$('scene-fallback').hidden=false;$('cell-canvas').hidden=true;document.querySelector('.camera-controls').hidden=true;console.warn('Battery 3D view unavailable:',error);}
renderMode();
function frame(now){
  const dt=lastTime===null?16:Math.min(60,now-lastTime);lastTime=now;
  if(playing&&!document.hidden){phase+=state.direction*dt/7000;scene?.setFlow(phase);}
  if(!document.hidden)scene?.render(dt);requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
