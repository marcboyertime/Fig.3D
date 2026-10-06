import {depthContent,formationSteps,scaling,capacity,SCALE_COMPARISON} from './self-separating-battery-depth.mjs?v=5';
import {FormationWall} from './self-separating-battery-formation.mjs?v=5';
const $=id=>document.getElementById(id),format=n=>Number(n.toFixed(3)).toString();
// Linear axes from 0 to 2 in L/L₀: resistance is a straight line, diffusion time a parabola.
function scalePlot(r){
 const x=q=>44+165*q,y=q=>162-36*q,curve=fn=>Array.from({length:41},(_,i)=>{const q=i/20;return (i?'L':'M')+x(q).toFixed(1)+','+y(Math.min(fn(q),4.1)).toFixed(1);}).join(' ');
 return `<svg viewBox="0 0 400 200" role="img" aria-label="At thickness ratio ${r.toFixed(2)}, resistance is ${format(r)} times and diffusion time ${format(r*r)} times the reference."><path d="M44 14V162H384" fill="none" stroke="#3c4860"/><path d="M${x(1)} 14V162" stroke="#ffe2a8" stroke-opacity=".35" stroke-dasharray="2 4"/><g fill="#9ba9c2" font-size="12"><text x="22" y="20">4×</text><text x="28" y="166">0</text><text x="${x(1)-3}" y="182">1</text><text x="${x(2)-3}" y="182">2</text><text x="384" y="196" text-anchor="end">L / L₀</text></g><path d="${curve(q=>q)}" fill="none" stroke="#9dc0ff" stroke-width="2"/><path d="${curve(q=>q*q)}" fill="none" stroke="#c4adff" stroke-width="2" stroke-dasharray="5 4"/><path d="M${x(r)} 14V162" stroke="#ffe2a8" stroke-width="1"/><circle cx="${x(r)}" cy="${y(r)}" r="4.5" fill="#9dc0ff"/><circle cx="${x(r)}" cy="${y(Math.min(r*r,4.1))}" r="4.5" fill="#c4adff"/><g font-size="12"><text x="${x(2)-8}" y="${y(2)-8}" fill="#9dc0ff" text-anchor="end">R</text><text x="${x(1.9)}" y="22" fill="#c4adff" text-anchor="end">t</text></g></svg>`;
}
// Evidence: the original panels with hairline annotations at values stated in the text.
// Crop rectangles and axis calibrations are in native Figure 6 pixels.
const PANELS={
 voltage:{crop:[470,0,480,380],kicker:'FIGURE 6b · ORIGINAL',title:'Open circuit for five hours',
  marks:()=>{const y=316-63.56*3.5,x0=562.5-470,x1=935-470;return `<path d="M${x0} ${y}H${x1}" stroke="#ffb547" stroke-width="1.6" stroke-dasharray="5 4"/><text x="${x0+12}" y="${y+18}" fill="#c4790b" font-size="15" font-weight="600">3.5 V</text><circle cx="${x1}" cy="${316-63.56*3.45}" r="6" fill="none" stroke="#ffb547" stroke-width="1.6"/><path d="M${845-470} ${118}h-34" stroke="#ffb547" stroke-width="1.2"/><text x="${845-470-38}" y="122" fill="#c4790b" font-size="13" text-anchor="end">inset: device above liquid</text>`;}},
 capacity:{crop:[940,0,488,380],kicker:'FIGURE 6c · ORIGINAL',title:'Three discharges of the first device',
  marks:()=>{const X=c=>1041.5+2.875*c-940,top=40,bottom=316;return `<path d="M${X(120)} ${top+150}V${bottom}" stroke="#ffb547" stroke-width="1.4" stroke-dasharray="4 4"/><path d="M${X(capacity.third)} ${top+150}V${bottom}" stroke="#ffb547" stroke-width="1.4" stroke-dasharray="4 4"/><text x="${X(120)-6}" y="${top+142}" fill="#c4790b" font-size="13" text-anchor="end">120 reported</text><text x="${X(capacity.third)+6}" y="${bottom-14}" fill="#c4790b" font-size="13">≈ 27.5</text>`;}}
};
function evidencePanel(kind){
 const p=PANELS[kind],[x,y,w,h]=p.crop;
 return `<figure class="evidence-figure"><figcaption><span class="eyebrow">${p.kicker}</span>${p.title}</figcaption><div class="evidence-frame" style="aspect-ratio:${w}/${h}"><div class="evidence-crop" style="background-image:url(assets/self-separating-battery/figure-6.jpg);background-size:${1428/w*100}% ${753/h*100}%;background-position:${x/(1428-w)*100}% ${y/(753-h)*100||0}%"></div><svg viewBox="0 0 ${w} ${h}" aria-hidden="true">${p.marks()}</svg></div></figure>`;
}
function evidenceReadout(kind){
 if(kind==='voltage')return '<p><strong>&gt; 3.5 V</strong> after a five-hour open-circuit hold, reported for the charged device.</p><p class="quiet">Supports lasting electronic separation. It says nothing yet about how much charge comes back.</p>';
 const third=capacity.third,ofFirst=third/capacity.first*100;
 return `<div class="retention"><p><span>Discharge 1</span><strong>120</strong><i style="--w:${120/132*100}%"></i></p><p><span>Discharge 3</span><strong>≈ 27.5</strong><i style="--w:${third/132*100}%"></i></p><p class="theory"><span>Theoretical</span><strong>132</strong><i style="--w:100%"></i></p></div><p class="unit">mAh per gram of PAQEDOT, not of the whole device</p><p>Third discharge: <strong>20.8%</strong> of theoretical, or <strong>${ofFirst.toFixed(1)}%</strong> of the first discharge.</p>`;
}
let wall=null,previousTopic=null,previousEvidence=null,processBuilt=false;
export function formationWall(){return wall;}
function buildProcess(dispatch){
 if(processBuilt)return;processBuilt=true;const host=document.querySelector('#depth-formation-controls .process');
 formationSteps.forEach((step,i)=>{const b=document.createElement('button');b.dataset.formation=String(i);b.innerHTML=`<span class="step-index">${i+1}</span><span class="step-name">${step.name}</span><span class="step-figure">${step.figure.replace('Figure ','Fig. ')}</span>`;b.addEventListener('click',()=>dispatch({type:'depth',action:{type:'formation',value:i}}));host.append(b);});
 host.addEventListener('keydown',e=>{if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const list=[...host.children],i=list.indexOf(document.activeElement),n=(i+(['ArrowDown','ArrowRight'].includes(e.key)?1:-1)+list.length)%list.length;list[n].focus();list[n].click();});
}
export function updateDepthUI(state,{setCaption,dispatch,fallback}){
 const d=state.deep,active=!!d,paper=state.display!=='model';
 buildProcess(dispatch);
 $('overview-tabs').hidden=active;$('depth-tabs').hidden=!active;$('depth-controls').hidden=!active||paper;$('depth-reading').hidden=!active;
 $('depth-toggle').innerHTML=active?'<span aria-hidden="true">←</span> Back to the overview':'Go deeper <span aria-hidden="true">↗</span>';$('depth-toggle').setAttribute('aria-expanded',String(active));
 $('evidence-view').hidden=!active||paper||d?.topic!=='evidence';
 $('scene-stage').classList.toggle('showing-evidence',active&&d.topic==='evidence'&&!paper);
 const formation=active&&d.topic==='formation';
 $('scene-stage').classList.toggle('showing-formation',formation&&!paper);$('formation-wall').hidden=!formation||paper||fallback;
 $('network').setAttribute('aria-label',active?({connectivity:'A three-dimensional network cut by a movable section, beside the same section flattened. A highlighted route joins two carbon patches outside the plane.',length:'An ideal ion-conducting slab of adjustable thickness between two electrode plates, with fixed area.',formation:'The processing vial, the device, its carbon and polymer leads, an external lithium chip and an instrument, connected as in the selected step.',evidence:'Published observations'})[d.topic]+' Arrow keys rotate; plus and minus zoom.':'Connected carbon, cathode and SEI networks. Drag to rotate. Arrow keys rotate; plus and minus zoom; Home resets.');
 const extra=active&&(d.topic==='formation'||d.topic==='evidence'),ref=d?.topic==='evidence'?6:5;
 $('display-reference').hidden=!extra;$('display-reference').dataset.display=String(ref);$('display-reference').textContent='Figure '+ref;$('display-reference').id;
 $('explorer').classList.toggle('in-depth',active);
 const context=document.querySelector('.paper-context');if(context)context.hidden=active;
 if(!active){previousTopic=null;wall?.stop();return;}
 const content=depthContent[d.topic],step=formationSteps[d.formation];
 document.querySelectorAll('[data-depth-topic]').forEach(b=>{const on=b.dataset.depthTopic===d.topic;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});
 $('inspection').setAttribute('aria-labelledby','depth-'+d.topic);
 for(const t of ['slice','length','formation','evidence'])$('depth-'+t+'-controls').hidden=(t==='slice'?'connectivity':t)!==d.topic;
 $('depth-slice').value=d.slice;$('slice-count').textContent=Math.round(d.slice/40*100)+'% through';
 $('depth-length-slider').value=d.length;$('length-value').textContent=d.length.toFixed(2);
 document.querySelectorAll('[data-formation]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.formation)===d.formation)));
 document.querySelectorAll('[data-evidence]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.evidence===d.evidence)));
 if(!paper){setCaption(d.topic==='formation'?[step.figure.toUpperCase()+' · STEP '+(d.formation+1)+' OF '+formationSteps.length,step.title,step.copy,step.note]:[content.kicker,content.title,content.copy,content.note]);$('scene-content').inert=d.topic==='evidence';}
 if(d.topic==='length'){const q=scaling(d.length);$('ratio-r').textContent=format(q.resistance)+'×';$('ratio-t').textContent=format(q.diffusion)+'×';$('scaling-plot').innerHTML=scalePlot(d.length);}
 if(d.topic==='evidence'&&previousEvidence!==d.evidence){$('evidence-view').innerHTML=evidencePanel(d.evidence);$('evidence-readout').innerHTML=evidenceReadout(d.evidence);previousEvidence=d.evidence;}
 if(formation&&!paper){wall??=new FormationWall($('wall-svg'));wall.set(step,{reduced:state.reduced});$('wall-figure').textContent=step.figure+' · magnified wall';$('wall-potential').textContent=step.potential;$('wall-replay').hidden=state.reduced||step.key==='deposited';}else wall?.stop();
 if(previousTopic!==d.topic){$('depth-argument').replaceChildren(...content.sections.map(([title,copy],i)=>{const item=document.createElement('details'),s=document.createElement('summary'),p=document.createElement('p');item.open=i===0;s.textContent=title;p.textContent=copy;item.append(s,p);return item;}));$('depth-source').textContent=content.source;previousTopic=d.topic;}
}
export {SCALE_COMPARISON};
