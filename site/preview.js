import {concentration, particleState} from './model.mjs';

const $ = id => document.getElementById(id);
let currentState = particleState(50);
let updateField = () => {};
let selectedPart = 'core';
function explainPart(part = selectedPart) {
  selectedPart = part;
  document.querySelectorAll('[data-part]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.part === part)));
  $('part-explanation').textContent = part === 'core'
    ? `Core — farthest from the surface. Its relative concentration is ${concentration(0,currentState.tau).toFixed(3)} at this radius and elapsed time.`
    : 'Surface — held at a relative concentration of 1.000 for every radius. This boundary condition drives diffusion into the sphere.';
}
document.querySelectorAll('[data-part]').forEach(button => {
  for (const event of ['pointerenter','focus','click']) button.addEventListener(event, () => explainPart(button.dataset.part));
});

function updateParticle() {
  const radius = Number($('radius').value);
  currentState = particleState(radius);
  $('radius-value').innerHTML = `${radius} <span>nm</span>`;
  $('scale-value').innerHTML = `${currentState.relativeTime.toFixed(2)}<span>×</span>`;
  const visualRadius = 70 + radius * .7;
  $('particle-outline').setAttribute('r', visualRadius);
  $('radius-line').setAttribute('d', `M280 168H${280 + visualRadius}`);
  $('radius-label').setAttribute('x', 280 + visualRadius / 2);
  document.querySelector('.surface-marker').style.left = `${(280 + visualRadius) / 560 * 100}%`;
  explainPart();
  $('surface-pointer').setAttribute('d', `M${280 + visualRadius * .72} ${168 - visualRadius * .72}L443 47H496`);
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
  $('field-canvas').setAttribute('aria-label', `Rotating cutaway of a spherical particle with radius ${radius} nanometers, at two seconds. Color shows the same concentration field as the radial cross section below. The view rotates; time remains fixed. Drag to rotate the view.`);
  updateField();
}
$('radius').addEventListener('input', updateParticle);
updateParticle();

// A scientific point-cloud view of the same analytical concentration field.
// Points lie on the outer sphere and two orthogonal viewing planes. The missing
// quarter exposes interior values; it is not a different diffusion boundary.
const canvas = $('field-canvas');
const ctx = canvas.getContext('2d', {alpha:false});
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let paused = motionPreference.matches;
let visible = true;
let width = 0, height = 0, yaw = -.62, pitch = -.23;
let dragStart = null, frame = null, previousTime = 0, phase = 0;
const samples = [];
let contourRadii = [];
const goldenAngle = Math.PI * (3 - Math.sqrt(5));
for (let i = 0; i < 6500; i++) {
  const y = 1 - (i + .5) / 6500 * 2;
  const ring = Math.sqrt(1 - y * y), angle = i * goldenAngle;
  const x = Math.cos(angle) * ring, z = Math.sin(angle) * ring;
  if (x > 0 && z > 0) continue;
  samples.push({x,y,z,r:1,surface:true,c:1});
}
for (let a = -1; a <= 1; a += .029) {
  for (let b = .014; b <= 1; b += .029) {
    const radius = Math.hypot(a,b);
    if (radius >= 1) continue;
    samples.push({x:0,y:a,z:b,r:radius,surface:false,c:0});
    samples.push({x:b,y:a,z:0,r:radius,surface:false,c:0});
  }
}
function setMotionLabel() {
  $('motion-toggle').setAttribute('aria-pressed', String(paused));
  $('motion-toggle').setAttribute('aria-label', paused ? 'Resume rotation' : 'Pause rotation');
  $('motion-label').textContent = paused ? 'Resume rotation' : 'Pause rotation';
}
function renderField() {
  if (!ctx || !width || !height) return;
  ctx.fillStyle = '#080a12'; ctx.fillRect(0,0,width,height);
  const compact = width < 660;
  const centerX = width * (compact ? .49 : .51), centerY = height * (compact ? .5 : .5);
  const size = Math.min(width * .385, height * .435) * (.8 + currentState.radiusNm * .004);
  const cy = Math.cos(yaw + Math.sin(phase) * .15), sy = Math.sin(yaw + Math.sin(phase) * .15);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const transformed = samples.map(point => {
    const x = point.x * cy + point.z * sy;
    const z0 = -point.x * sy + point.z * cy;
    const y = point.y * cp - z0 * sp;
    const z = point.y * sp + z0 * cp;
    return {point,x,y,z};
  }).sort((a,b) => a.z - b.z);
  for (const {point,x,y,z} of transformed) {
    const perspective = 4.4 / (4.4 - z);
    const sx = centerX + x * size * perspective, sy = centerY + y * size * perspective;
    const shade = point.surface ? .34 + .6 * Math.max(0, -.34*x - .48*y + .8*z) : .78;
    const depth = .48 + .52 * (z + 1) / 2;
    const strength = Math.min(1, .3 + shade * depth);
    const low = [72,62,150], high = [160,188,255];
    const rgb = low.map((v,i) => Math.round((v + (high[i] - v) * point.c) * strength));
    ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    const dot = (point.surface ? 1.7 : 2.3) * perspective * Math.max(.75, size / 260);
    ctx.fillRect(sx-dot/2,sy-dot/2,dot,dot);
  }
  // Three great-circle arcs provide a spatial reference on the sphere's surface.
  ctx.lineWidth = .65;
  for (const latitude of [-.62,0,.62]) {
    const ring = Math.sqrt(1-latitude*latitude);
    let drawing = false;
    ctx.beginPath();
    for (let i=0;i<=150;i++) {
      const angle=i/150*Math.PI*2, px=Math.cos(angle)*ring, pz=Math.sin(angle)*ring;
      if(px>0&&pz>0){drawing=false;continue;}
      const x=px*cy+pz*sy,z0=-px*sy+pz*cy,y=latitude*cp-z0*sp,z=latitude*sp+z0*cp;
      const perspective=4.4/(4.4-z),screenX=centerX+x*size*perspective,screenY=centerY+y*size*perspective;
      if(!drawing){ctx.moveTo(screenX,screenY);drawing=true;}else{ctx.lineTo(screenX,screenY);}
    }
    ctx.strokeStyle='rgba(135,161,232,.19)';ctx.stroke();
  }
  // Iso-concentration contours on the two cut faces, at the same 20/40/60/80% levels as the cross section below.
  const project = (px, py, pz) => {
    const x=px*cy+pz*sy,z0=-px*sy+pz*cy,y=py*cp-z0*sp,z=py*sp+z0*cp,perspective=4.4/(4.4-z);
    return [centerX+x*size*perspective, centerY+y*size*perspective];
  };
  // Each face is drawn only while it faces the viewer (its outward normal, +x or +z, points toward the camera).
  ctx.lineWidth = 1.1;
  const faces = [[(r,t)=>[0,r*Math.cos(t),r*Math.sin(t)], -sy*cp], [(r,t)=>[r*Math.sin(t),r*Math.cos(t),0], cy*cp]];
  for (const radius of contourRadii) {
    for (const [face, facing] of faces) {
      if (facing <= 0) continue;
      ctx.strokeStyle = `rgba(223,230,255,${(.6*Math.min(1,facing*2)).toFixed(3)})`;
      ctx.beginPath();
      for (let i=0;i<=60;i++){const [sx,sy2]=project(...face(radius,i/60*Math.PI));i?ctx.lineTo(sx,sy2):ctx.moveTo(sx,sy2);}
      ctx.stroke();
    }
  }
}
function tick(time) {
  frame = null;
  if (paused || !visible || document.hidden) return;
  if (time - previousTime > 42) {
    const elapsed = Math.min(time - previousTime,100);
    previousTime=time;
    if (!dragStart) phase += elapsed*.00015;
    renderField();
  }
  frame=requestAnimationFrame(tick);
}
function schedule() {
  if (!frame && !paused && visible && !document.hidden) frame=requestAnimationFrame(tick);
}
function resize() {
  const bounds=canvas.getBoundingClientRect();
  width=bounds.width;height=bounds.height;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
  ctx?.setTransform(dpr,0,0,dpr,0,0);
  renderField();schedule();
}
updateField=()=>{
  for(const point of samples) if(!point.surface) point.c=concentration(point.r,currentState.tau);
  contourRadii=[.2,.4,.6,.8].filter(level=>concentration(0,currentState.tau)<level).map(level=>{let lo=0,hi=1;for(let n=0;n<40;n++){const mid=(lo+hi)/2;concentration(mid,currentState.tau)<level?lo=mid:hi=mid;}return (lo+hi)/2;});
  renderField();
};
updateField();setMotionLabel();
if(ctx){new ResizeObserver(resize).observe(canvas);new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:0}).observe(canvas);}
$('motion-toggle').addEventListener('click',()=>{paused=!paused;setMotionLabel();schedule();});
motionPreference.addEventListener('change',event=>{paused=event.matches;setMotionLabel();schedule();});
document.addEventListener('visibilitychange',schedule);
canvas.addEventListener('keydown',event=>{const rotations={ArrowLeft:[-.1,0],ArrowRight:[.1,0],ArrowUp:[0,-.1],ArrowDown:[0,.1]};if(!rotations[event.key])return;event.preventDefault();yaw+=rotations[event.key][0];pitch=Math.max(-1,Math.min(1,pitch+rotations[event.key][1]));renderField();});
canvas.addEventListener('pointerdown',event=>{if(event.pointerType==='touch')return;dragStart={x:event.clientX,y:event.clientY,yaw,pitch};canvas.setPointerCapture(event.pointerId);});
canvas.addEventListener('pointermove',event=>{if(!dragStart)return;yaw=dragStart.yaw+(event.clientX-dragStart.x)*.006;pitch=Math.max(-1,Math.min(1,dragStart.pitch+(event.clientY-dragStart.y)*.005));renderField();});
for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>{dragStart=null;});

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
