// Keeps the page in step with the Blender film: the caption steps, readouts,
// live profile and hairline labels all read the same solved field the film
// was rendered from (assets/diffusion-film/film.json), one entry per frame.
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

function placeLabels(f) {
  const w = stage.clientWidth, h = stage.clientHeight;
  // The video is square and covers the stage; map frame fractions to pixels.
  const side = Math.min(w, h), ox = (w - side) / 2, oy = (h - side) / 2;
  const at = ([x, y]) => [ox + x * side, oy + y * side];
  const [sx, sy] = at(data.anchors.surface[f]);
  const [cx, cy] = at(data.anchors.centre[f]);
  const elbowX = sx - side * .055, elbowY = sy - side * .075, endX = ox + side * .03;
  $('leader-surface').setAttribute('d', `M${sx},${sy}L${elbowX},${elbowY}H${endX}`);
  $('dot-surface').setAttribute('cx', sx); $('dot-surface').setAttribute('cy', sy);
  const tagS = $('tag-surface');
  tagS.style.transform = `translate(${endX}px, ${elbowY - 22}px)`;
  const bottom = oy + side * .925;
  $('leader-centre').setAttribute('d', `M${cx},${cy}V${bottom}`);
  $('dot-centre').setAttribute('cx', cx); $('dot-centre').setAttribute('cy', cy);
  const tagC = $('tag-centre');
  tagC.style.transform = `translate(${cx - tagC.offsetWidth / 2}px, ${bottom + 4}px)`;
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
function play() { if (!userPaused && onScreen && !document.hidden) video.play().catch(() => { userPaused = true; setToggle(); }); }

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
new ResizeObserver(() => frame >= 0 && placeLabels(frame)).observe(stage);

video.addEventListener('loadedmetadata', () => { if (video.currentTime === 0) video.currentTime = (POSTER_FRAME + .5) / 24; }, {once: true});
if (video.readyState >= 1 && video.currentTime === 0) video.currentTime = (POSTER_FRAME + .5) / 24;

fetch('assets/diffusion-film/film.json').then(r => r.json()).then(json => {
  data = json;
  setTimeNote();
  show(frameFromTime(video.currentTime || 0));
  track();
  setToggle();
  play();
});
