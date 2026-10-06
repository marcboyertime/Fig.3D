// Keeps the page in step with the Blender film: the caption steps, readouts,
// live profile and hairline labels all read the same solved field the film
// was rendered from (assets/diffusion-film/film.json), one entry per frame.
import {Annotations} from './annotations.mjs';
const $ = id => document.getElementById(id);
const video = $('film-video');
const stage = video.closest('.film-stage');
const steps = [...document.querySelectorAll('#film-steps li')];
const scrub = $('film-scrub');
const radiusInput = $('radius');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const D = 1e-16;
const POSTER_FRAME = 72;   // the poster shows this frame, so playback starts there
let data = null, frame = -1, userPaused = reduceMotion.matches, onScreen = true, scrubbing = false;

function radiusNm() { return Number(radiusInput?.value || 50); }

function frameFromTime(seconds) {
  return Math.min(data.frames - 1, Math.max(0, Math.floor(seconds * data.fps + 1e-3))) % data.frames;
}

function drawProfile(c) {
  const pts = c.map((v, i) => `${(28 + i / (c.length - 1) * 324).toFixed(1)},${(64 - v * 58).toFixed(1)}`);
  const line = `M${pts.join('L')}`;
  $('film-profile-line').setAttribute('d', line);
  $('film-profile-fill').setAttribute('d', `${line}L352,64L28,64Z`);
}

// The film's camera, as set up in blender/diffusion/scene.py, so a point on the cut face can be found on screen in
// any frame: the hairline labels sit exactly on the contour they name.
const CAMERA = {frames: 384, dist: 4.55, elev: 21 * Math.PI / 180, lens: 58 / 36, target: [0, 0, -0.04]};
function project(f, p) {
  const t = 2 * Math.PI * f / CAMERA.frames, az = -Math.PI / 4 + Math.PI / 12 * Math.sin(t), el = CAMERA.elev + Math.PI / 45 * Math.sin(2 * t + .6);
  const c = [CAMERA.dist * Math.cos(el) * Math.cos(az), CAMERA.dist * Math.cos(el) * Math.sin(az), CAMERA.dist * Math.sin(el)];
  const sub = (a, b) => a.map((v, i) => v - b[i]), dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], unit = a => { const n = Math.hypot(...a); return a.map(v => v / n); };
  const fwd = unit(sub(CAMERA.target, c)), right = unit(cross(fwd, [0, 0, 1])), up = cross(right, fwd), v = sub(p, c), z = dot(v, fwd);
  return [.5 + CAMERA.lens * dot(v, right) / z, .5 - CAMERA.lens * dot(v, up) / z];
}
// A point on the left cut face (the plane x = 0) at radius x along the labelled direction.
const RAY = .62, onFace = (f, x) => project(f, [0, -x * Math.cos(RAY), x * Math.sin(RAY)]);
const notes = new Annotations(stage, {className: 'film-notes', compactWidth: 420});
function toStage([x, y]) {
  const w = stage.clientWidth, h = stage.clientHeight, side = Math.min(w, h);
  return {x: (w - side) / 2 + x * side, y: (h - side) / 2 + y * side};
}
// Where the half-full contour crosses the labelled direction, or null when the whole face is above or below half.
function halfLine(f) {
  const c = data.c[f];
  for (let i = c.length - 1; i > 0; i--) {
    const a = c[i - 1], b = c[i];
    if ((a - .5) * (b - .5) <= 0 && a !== b) return (i - 1 + (.5 - a) / (b - a)) / (c.length - 1);
  }
  return null;
}
let notePhase = '';
function placeLabels(f) {
  const goingIn = f < data.half, phase = goingIn ? 'in' : 'out';
  if (phase !== notePhase) {
    notePhase = phase;
    notes.show([
      {id: 'surface', title: 'Surface', note: goingIn ? 'Held full, so lithium enters here' : 'Held empty, so lithium leaves here', tone: '#c9d5f5',
        at: () => frame >= 0 ? {...toStage(onFace(frame, 1))} : null, home: () => toStage([.0, .07]), dir: [1, 0], dist: -6},
      {id: 'half', title: 'Half-full line', note: goingIn ? 'Moves in as lithium spreads' : 'Moves in as lithium drains', tone: '#9db5ff',
        at: () => { if (frame < 0) return null; const x = halfLine(frame); return x === null || x < .04 || x > .97 ? {x: 0, y: 0, visible: false} : {...toStage(onFace(frame, x)), r: 3}; },
        home: () => toStage([.0, .9]), dir: [1, 0], dist: -6},
      {id: 'centre', title: 'Center', note: goingIn ? 'Farthest in, so it fills last' : 'Farthest in, so it empties last', tone: '#c9d5f5',
        at: () => frame >= 0 ? toStage(onFace(frame, 0)) : null, home: () => toStage([.5, .93]), dir: [1, 0], dist: -12, phone: false}
    ], {stagger: 420});
  }
  notes.frame();
}

function show(f) {
  if (!data) return;
  frame = f;
  const goingIn = f < data.half;
  const sinceSwitch = (f % data.half) * data.tauHalf / data.half;      // tau since the surface switched
  const seconds = sinceSwitch * (radiusNm() * 1e-9) ** 2 / D;
  $('film-phase').textContent = goingIn ? 'going in' : 'coming out';
  $('film-time').textContent = `${seconds.toFixed(1)} s`;
  $('film-fill').textContent = `${Math.round(data.fill[f] * 100)}%`;
  steps.forEach(li => li.classList.toggle('is-active', f >= Number(li.dataset.from) && f < Number(li.dataset.to)));
  drawProfile(data.c[f]);
  placeLabels(f);
  if (!scrubbing) scrub.value = f;
}

function setTimeNote() {
  const r = radiusNm();
  const half = data ? data.tauHalf * (r * 1e-9) ** 2 / D : 0;
  $('film-time-note').textContent = `Time since the surface last switched. For a ${r} nm particle with D = 10⁻¹⁶ m²/s, each half of the loop takes ${half.toFixed(half < 10 ? 1 : 0)} s. Change the radius below and this clock rescales.`;
}

function track() {
  if (!data) return;
  const step = (now, meta) => {
    const f = frameFromTime(meta ? meta.mediaTime : video.currentTime);
    if (f !== frame) show(f);
    schedule();
  };
  const schedule = () => {
    if ('requestVideoFrameCallback' in video) video.requestVideoFrameCallback(step);
    else requestAnimationFrame(() => step(0, null));
  };
  schedule();
}

function setToggle() {
  const paused = video.paused;
  $('film-toggle').setAttribute('aria-pressed', String(paused));
  $('film-toggle-label').textContent = paused ? 'Play' : 'Pause';
}
// The first-visit page opening holds the film until it has appeared.
function play() { if (ready && data && !userPaused && onScreen && !document.hidden && !window.Fig3DOpening?.holding) video.play().catch(() => { userPaused = true; setToggle(); }); }

$('film-toggle').addEventListener('click', () => {
  userPaused = !video.paused ? true : false;
  if (userPaused) video.pause(); else { onScreen = true; play(); }
});
video.addEventListener('play', setToggle);
video.addEventListener('pause', setToggle);
scrub.addEventListener('input', () => {
  scrubbing = true;
  userPaused = true; video.pause();
  const f = Number(scrub.value);
  video.currentTime = (f + .5) / data.fps;
  show(f);
  scrubbing = false;
});
radiusInput?.addEventListener('input', () => { setTimeNote(); if (frame >= 0) show(frame); });
new IntersectionObserver(entries => {
  onScreen = entries[0].isIntersecting;
  if (onScreen) play(); else video.pause();
}, {threshold: .25}).observe(stage);
document.addEventListener('visibilitychange', () => document.hidden ? video.pause() : play());

// Start on the poster frame, and only play once that seek has landed.
let ready = false;
function startAtPoster() {
  video.addEventListener('seeked', () => { ready = true; play(); }, {once: true});
  video.currentTime = (POSTER_FRAME + .5) / 24;
}
if (video.readyState >= 1) startAtPoster();
else video.addEventListener('loadedmetadata', startAtPoster, {once: true});

fetch('assets/diffusion-film/film.json').then(r => r.json()).then(json => {
  data = json;
  setTimeNote();
  show(frameFromTime(video.currentTime || 0));
  track();
  setToggle();
  play();
});

addEventListener('fig3d:stage', play);
