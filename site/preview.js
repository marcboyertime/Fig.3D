import {concentration, particleState} from './model.mjs';
import {Annotations, svgPoint} from './annotations.mjs';

const $ = id => document.getElementById(id);
let currentState = particleState(50);
// Callouts on the cross section: the surface sets the boundary, the core shows how far lithium has got.
const stage = document.querySelector('.particle-stage'), svg = $('particle');
const notes = new Annotations(stage, {className: 'particle-notes', compactWidth: 380});
let visualRadius = 105;
function explainParts() {
  const core = concentration(0, currentState.tau);
  notes.show([
    {id: 'surface', title: 'Surface, c = c<sub>s</sub>', note: 'Held full: lithium enters here', tone: '#c9d5f5', live: true,
      at: () => svgPoint(svg, 280 + visualRadius * .72, 168 - visualRadius * .72, stage), dir: [1, -.6], dist: 0},
    {id: 'core', title: `Core, c = ${core.toFixed(2)} c<sub>s</sub>`, note: core > .9 ? 'Nearly full already' : core > .4 ? 'Filling, but behind the surface' : 'Barely reached yet', tone: '#9db5ff', live: true,
      at: () => svgPoint(svg, 280, 168, stage), dir: [-1, .55], dist: 30 + visualRadius * .25, phone: 'note'}
  ], {stagger: 300});
}
function updateParticle() {
  const radius = Number($('radius').value);
  currentState = particleState(radius);
  $('radius-value').innerHTML = `${radius} <span>nm</span>`;
  $('scale-value').innerHTML = `${currentState.relativeTime.toFixed(2)}<span>×</span>`;
  visualRadius = 70 + radius * .7;
  $('particle-outline').setAttribute('r', visualRadius);
  $('radius-line').setAttribute('d', `M280 168H${280 + visualRadius}`);
  $('radius-label').setAttribute('x', 280 + visualRadius / 2);
  const low = [23, 36, 69], high = [125, 156, 255];
  const stops = [];
  for (let i = 0; i <= 60; i++) {
    const c = concentration(i / 60, currentState.tau);
    const rgb = low.map((v, j) => Math.round(v + (high[j] - v) * c));
    stops.push(`<stop offset="${i / 60 * 100}%" stop-color="rgb(${rgb.join(',')})"/>`);
  }
  $('concentration-gradient').innerHTML = stops.join('');
  // Iso-concentration rings at 20/40/60/80% of the surface value; c(x) rises monotonically, so bisection finds each radius.
  $('particle-contours').innerHTML = [.2, .4, .6, .8].map(level => {
    if (concentration(0, currentState.tau) >= level) return '';
    let lo = 0, hi = 1;
    for (let n = 0; n < 40; n++) { const mid = (lo + hi) / 2; concentration(mid, currentState.tau) < level ? lo = mid : hi = mid; }
    return `<circle cx="280" cy="168" r="${((lo + hi) / 2 * visualRadius).toFixed(2)}" fill="none" stroke="#dfe6ff" stroke-opacity=".45"/>`;
  }).join('');
  const points = Array.from({length:101}, (_, i) => `${34 + i * 5.04},${99 - concentration(i / 100, currentState.tau) * 84}`);
  const path = `M${points.join('L')}`;
  $('profile-curve').setAttribute('d', path);
  $('profile-fill').setAttribute('d', `${path}L538,99L34,99Z`);
  $('particle-desc').textContent = `Circular cross section at radius ${radius} nanometers. At fixed diffusivity and elapsed time, characteristic diffusion time is ${currentState.relativeTime.toFixed(2)} times the value for a 50 nanometer particle. Color shows normalized concentration from zero to one, with rings at 20, 40, 60 and 80 percent; not measured cathode data. Displayed particle size is schematic.`;
}
$('radius').addEventListener('input', () => { updateParticle(); explainParts(); });
updateParticle(); explainParts();

const concepts = {
  diffusion: {title:'How far does lithium have to go?', intro:'A concentration profile connects a small physical object to an abstract transport equation. The first new companion planned for Fig.3D.', list:['Meet an active-material particle and distinguish its surface from its interior.','Predict how changing particle size changes diffusion time under a declared model.','Link a cutaway view to its radial concentration profile.','See why a simple particle model does not predict whole-cell performance.']},
  charge: {title:'One battery. Two paths for charge.', intro:'Battery diagrams often put arrows everywhere. This companion will separate the paths before putting them back together.', list:['Trace ionic transport through the electrolyte and electronic transport through the external circuit.','Connect the two paths through oxidation and reduction at the electrodes.','Follow the changes between charging and discharging.','Keep charge transport distinct from the motion of a particular atom.']},
  impedance: {title:'What is an impedance spectrum saying?', intro:'Before interpreting a semicircle, build the signal that creates it. Begin with a deliberately simple electrical model.', list:['Connect a sinusoidal voltage to the amplitude and phase of a responding current.','Translate that response into real and imaginary impedance.','Connect Nyquist and Bode representations of the same model.','Understand why an equivalent-circuit fit alone does not establish a physical mechanism.']}
};
document.querySelectorAll('[data-concept]').forEach(button=>button.addEventListener('click',()=>{
  const item=concepts[button.dataset.concept];
  $('concept-title').textContent=item.title;
  $('concept-intro').textContent=item.intro;
  $('concept-list').replaceChildren(...item.list.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
  $('concept-dialog').showModal();
}));
$('model-open').addEventListener('click',()=>$('model-dialog').showModal());
document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close();});
});
