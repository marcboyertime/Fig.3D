import {depthContent,formationSteps,scaling,capacity} from './self-separating-battery-depth.mjs?v=2';
const $=id=>document.getElementById(id),format=n=>Number(n.toFixed(4)).toString();
const axes='<path d="M48 16V164H390" fill="none" stroke="#5b6d89"/><g fill="#adbad0" font-size="18"><text x="18" y="23">4×</text><text x="23" y="168">0</text><text x="44" y="185">0</text><text x="212" y="185">1</text><text x="382" y="185">2</text><text x="334" y="208">L / L₀</text></g>';
function scalePlot(r){const x=q=>48+171*q,y=q=>164-36*q,curve=fn=>Array.from({length:41},(_,i)=>{const q=i/20;return (i?'L':'M')+x(q).toFixed(2)+','+y(fn(q)).toFixed(2);}).join(' ');return `<svg viewBox="0 0 420 220" role="img" aria-label="At thickness ratio ${r.toFixed(2)}, resistance ratio is ${r.toFixed(2)} and diffusion time ratio is ${format(r*r)}. Resistance is linear; diffusion time is quadratic.">${axes}<path d="${curve(q=>q)}" fill="none" stroke="#9dbbff" stroke-width="3"/><path d="${curve(q=>q*q)}" fill="none" stroke="#bc9cff" stroke-width="3" stroke-dasharray="6 4"/><path d="M${x(r)} 18V164" stroke="#8191ae" stroke-dasharray="3 5"/><circle cx="${x(r)}" cy="${y(r)}" r="5" fill="#9dbbff"/><circle cx="${x(r)}" cy="${y(r*r)}" r="5" fill="#bc9cff"/></svg>`;}
function evidencePlot(kind){
 if(kind==='voltage')return `<div class="evidence-heading"><p class="eyebrow">FIGURE 6b · REPORTED VOLTAGE HOLD</p><h3>Can the device keep charge separated?</h3></div><div class="voltage-chart" role="img" aria-label="The paper reports more than 3.5 volts after five hours at open circuit."><div class="voltage-wire"></div><div class="voltage-meter"><strong>&gt;3.5 V</strong><span>after 5 hours</span></div><div class="voltage-leads"><span>Carbon lead</span><span>Polymer lead</span></div></div><p class="evidence-foot">No intended external current. A sustained voltage and a repeatable capacity are different measurements.</p>`;
 return `<div class="evidence-heading"><p class="eyebrow">FIGURE 6c · INITIAL BCP-DERIVED DEVICE</p><h3>How much charge comes back?</h3></div><div class="capacity-chart" role="img" aria-label="First discharge 120 milliamp hours per gram of PAQEDOT; third approximately 27.5. Theoretical capacity 132. The third value is calculated from 20.8 percent of theoretical capacity."><div class="capacity-unit">mAh / g PAQEDOT</div><div class="capacity-rows"><div class="capacity-limit"><span>Theory 132</span></div><div class="capacity-row"><div><span>Discharge 1</span><strong>120</strong></div><div class="capacity-track"><i style="width:80%"></i></div></div><div class="capacity-row"><div><span>Discharge 3</span><strong>≈27.5</strong></div><div class="capacity-track"><i style="width:${capacity.third/150*100}%"></i></div></div><div class="capacity-axis"><span>0</span><span>50</span><span>100</span><span>150</span></div></div></div><p class="evidence-foot">Third discharge: 20.8% of the theoretical capacity, or about 22.9% of the first discharge. Both use polymer mass.</p>`;
}
let previousTopic=null,previousEvidence=null;
export function updateDepthUI(state,setCaption){
 const d=state.deep,active=!!d,paper=state.paper;
 $('overview-tabs').hidden=active;$('depth-tabs').hidden=!active;$('depth-controls').hidden=!active||paper;$('depth-reading').hidden=!active;
 $('depth-reading-link').hidden=!active;
 $('depth-toggle').textContent=active?'← Back to overview':'Go deeper ↗';$('depth-toggle').setAttribute('aria-expanded',String(active));
 $('depth-labels').hidden=!active||paper||d?.topic==='evidence';
 $('evidence-view').hidden=!active||paper||d?.topic!=='evidence';
 $('scene-stage').classList.toggle('showing-evidence',active&&d.topic==='evidence'&&!paper);
 $('scene-key').hidden=active&&!['connectivity','formation'].includes(d.topic);
 if(active&&['connectivity','formation'].includes(d.topic)){
  const keys=d.topic==='formation'&&d.formation===0?['carbon','cathode']:['carbon','sei','cathode'];
  $('scene-key').replaceChildren(...keys.map(k=>{const span=document.createElement('span'),i=document.createElement('i');i.className=k;span.append(i,document.createTextNode({carbon:'Carbon',sei:'SEI',cathode:'PAQEDOT'}[k]));return span;}));
 }
 $('network').setAttribute('aria-label',active?({connectivity:'A three-dimensional network with a movable cross-section and its detached sampled plane.',length:'An ideal ion-conducting slab with adjustable thickness and fixed area.',formation:'Material layers, external lithium and electrical connections at each processing state.',evidence:'Published observations'})[d.topic]+' Arrow keys rotate; plus and minus zoom.':'Connected carbon, cathode and SEI networks. Drag to rotate. Arrow keys rotate; plus and minus zoom; Home resets.');
 $('display-model').textContent=document.body.classList.contains('is-fallback')?'Static view':active?'Visual':'3D model';
 const extra=active&&(d.topic==='formation'||d.topic==='evidence'),ref=d?.topic==='evidence'?6:5;
 $('display-reference').hidden=!extra;$('display-reference').dataset.display=String(ref);$('display-reference').textContent='Figure '+ref;
 $('explorer').classList.toggle('in-depth',active);document.body.classList.toggle('reading-depth',active);
 document.querySelector('.paper-context').hidden=active;
 if(!active){previousTopic=null;return;}
 const content=depthContent[d.topic],step=formationSteps[d.formation];
 $('depth-reading-preview').textContent=content.sections[0][0];
 document.querySelectorAll('[data-depth-topic]').forEach(b=>{const on=b.dataset.depthTopic===d.topic;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});
 $('inspection').setAttribute('aria-labelledby','depth-'+d.topic);
 for(const t of ['slice','length','formation','evidence'])$('depth-'+t+'-controls').hidden=(t==='slice'?'connectivity':t)!==d.topic;
 $('depth-slice').value=d.slice;$('slice-count').textContent=Math.round(d.slice/40*100)+'% through';
 $('depth-length-slider').value=d.length;$('length-value').textContent=d.length.toFixed(2);
 document.querySelectorAll('[data-formation]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.formation)===d.formation));
 document.querySelectorAll('[data-evidence]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.evidence===d.evidence));
 if(!paper){setCaption(d.topic==='formation'?[content.kicker,step.title,step.copy,step.note]:[content.kicker,content.title,content.copy,content.note]);$('scene-content').inert=d.topic==='evidence';$('scene-content').setAttribute('aria-hidden',String(d.topic==='evidence'));}
 if(d.topic==='length'){const q=scaling(d.length);$('depth-scaling').innerHTML=`<p><span class="scale-resistance">Resistance R / R₀</span><strong>${format(q.resistance)}×</strong></p><p><span class="scale-diffusion">Diffusion time t / t₀</span><strong>${format(q.diffusion)}×</strong></p>`;$('scaling-plot').innerHTML=scalePlot(d.length);}
 if(d.topic==='evidence'&&previousEvidence!==d.evidence){$('evidence-view').innerHTML=evidencePlot(d.evidence);previousEvidence=d.evidence;}
 if(previousTopic!==d.topic){$('depth-argument').replaceChildren(...content.sections.map(([title,copy])=>{const section=document.createElement('section'),h=document.createElement('h3'),p=document.createElement('p');h.textContent=title;p.textContent=copy;section.append(h,p);return section;}));$('depth-source').textContent=content.source;previousTopic=d.topic;}
}
export function depthFrame(scene,state){
 if(!state.deep||state.paper)return;
 const d=scene.deep;if(!d)return;
 [...$('depth-labels').children].forEach((el,i)=>{const label=d.labels[i];el.hidden=!label;if(label){const p=scene.project(label[1]);el.textContent=label[0];const half=Math.min(scene.width/2,el.getBoundingClientRect().width/2+8);el.style.left=Math.max(half,Math.min(scene.width-half,p.x))+'px';el.style.top=Math.max(20,Math.min(scene.height-62,p.y))+'px';}});
 if(state.deep.topic==='connectivity'&&d.stats){const n=d.stats.components;$('slice-stat').textContent=`${n} separate carbon ${n===1?'patch':'patches'} in this sampled plane. Rotate the volume to look beyond the slice.`;}
}
