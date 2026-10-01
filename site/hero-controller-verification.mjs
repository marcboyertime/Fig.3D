// Runs the real homepage hero controller (hero.js) against a small fake DOM and a stub 3D renderer.
// Checks playback, captions, reduced motion, auto-pause, inspection, connectors and fallbacks. Visual QA is separate.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import * as timeline from './hero-timeline.mjs';
const {BEATS, DURATION, HOP_REPLAY_AT, INTERACTIVE_AT, beatAt, readingTime} = timeline;
const code = fs.readFileSync(new URL('./hero.js', import.meta.url), 'utf8').replace(/^import .*\n/gm, '')
 + '\n;globalThis.__hero = {get t() { return t; }, get playing() { return playing; }};';

const rect = (left, top, width, height) => ({left, top, width, height, right: left + width, bottom: top + height, x: left, y: top});
const LAYOUTS = {
 // Two columns: the headline beside the stage, connectors drawn from its words.
 desktop: {'.home-hero': rect(0, 0, 1512, 982), '.hero-copy': rect(72, 176, 488, 420), '#hero-frame': rect(640, 176, 800, 453), '.hero-stage': rect(580, 112, 932, 527),
  '#hero-canvas': rect(580, 112, 932, 527), '#figure-word': rect(300, 250, 120, 80), '#understanding-word': rect(72, 330, 328, 80)},
 // Stacked: the stage sits under the headline, so words underline themselves instead.
 phone: {'.home-hero': rect(0, 0, 390, 1200), '.hero-copy': rect(20, 114, 350, 306), '#hero-frame': rect(9, 446, 372, 335), '.hero-stage': rect(11, 410, 368, 379),
  '#hero-canvas': rect(11, 410, 368, 379), '#figure-word': rect(20, 180, 110, 50), '#understanding-word': rect(20, 230, 220, 50)},
};
const context2d = () => new Proxy({globalAlpha: 1}, {
 get(target, key) {
  if (key in target) return target[key];
  if (key === 'measureText') return s => ({width: String(s).length * 7});
  if (key === 'createRadialGradient' || key === 'createLinearGradient') return () => ({addColorStop() {}});
  return () => {};
 },
 set(target, key, value) { target[key] = value; return true; },
});

function mount({reduce = false, layout = 'desktop', gpu = true, image = 'load'} = {}) {
 const rects = LAYOUTS[layout], nodes = new Map(), updates = [];
 const node = selector => {
  if (!nodes.has(selector)) {
   const children = new Map();
   nodes.set(selector, {
    id: selector.replace(/^#/, ''), textContent: '', innerHTML: '', value: '0', hidden: false, disabled: false, dataset: {}, attrs: {}, events: {},
    style: {props: {}, setProperty(k, v) { this.props[k] = v; }},
    addEventListener(n, f) { (this.events[n] ||= []).push(f); },
    fire(n, e = {}) { (this.events[n] || []).forEach(f => f(e)); },
    setAttribute(n, v) { this.attrs[n] = String(v); },
    getBoundingClientRect: () => rects[selector] || rect(0, 0, 0, 0),
    getContext: context2d,
    querySelector(s) { if (!children.has(s)) children.set(s, node(`${selector} ${s}`)); return children.get(s); },
    getTotalLength: () => 100,
    // Caption swaps finish at once here; the controller only needs the sequence of texts.
    animate: () => ({cancel() {}, set onfinish(f) { f(); }}),
    focus() {}, showModal() {}, close() {},
   });
  }
  return nodes.get(selector);
 };
 const species = ['li', 'oxygen', 'tm', 'sites'].map(k => { const b = node(`[data-inspect=${k}]`); b.dataset.inspect = k; return b; });
 const media = {matches: reduce, addEventListener(_, f) { this.change = f; }};
 const document = {hidden: false, events: {}, querySelector: node, querySelectorAll: s => s === '[data-inspect]' ? species : [],
  addEventListener(n, f) { this.events[n] = f; }, createElement: () => ({width: 0, height: 0, getContext: context2d})};
 let pending = null, frames = 0, io = null, image$ = null;
 class FakeImage { constructor() { image$ = this; this.events = {}; this.complete = false; this.naturalWidth = 0; } addEventListener(n, f) { this.events[n] = f; } }
 class IntersectionObserver { constructor(f) { io = f; } observe() {} }
 const point = (x, y, r = 8, z = 0) => ({x, y, r, z});
 const renderer = {
  layout() {}, setCard() {}, render() {},
  update(s) {
   updates.push(s);
   return {li: point(300, 260, 14), tm: point(330, 330, 13), t: point(320, 280, 5), a: point(260, 250, 14), b: point(380, 270, 14), c: point(360, 300, 14),
    center: point(320, 280), oxygen: Array.from({length: 10}, (_, i) => ({...point(220 + 22 * i, 200 + 9 * i, 8), visible: s.oxygen > .5}))};
  },
 };
 const sandbox = {
  document, window: {IntersectionObserver}, IntersectionObserver, ResizeObserver: class { observe() {} }, Image: FakeImage,
  matchMedia: () => media, performance: {now: () => 0}, devicePixelRatio: 2, console,
  requestAnimationFrame: f => { pending = f; return ++frames; },
  createHopRenderer: () => { if (!gpu) throw new Error('WebGL unavailable'); return renderer; },
  ...timeline,
 };
 vm.runInNewContext(code, sandbox);
 if (image === 'load') { image$.complete = true; image$.naturalWidth = 1500; image$.events.load(); }
 else { image$.events.error(); image$.events.error(); }
 let now = 1000;
 const app = {
  node, media, document, species, updates, state: sandbox.__hero,
  get scheduled() { return !!pending; },
  // Advance animation frames by `ms` each until `until` returns true (or nothing is scheduled).
  run(ms = 40, until = () => false, limit = 2000) { for (let i = 0; i < limit && pending && !until(); i++) { const f = pending; pending = null; now += ms; f(now); } },
  frame() { const f = pending; pending = null; now += 40; f?.(now); },
  seek(seconds) { node('#hero-progress').value = String(Math.round(seconds / DURATION * 1000)); node('#hero-progress').fire('input'); },
  click(selector) { node(selector).fire('click'); },
  intersect(isIntersecting) { io([{isIntersecting}]); },
  caption: () => node('#hero-stage').textContent,
  play: () => node('#hero-play'),
 };
 return app;
}

// ---------- Arrival ----------
{
 const app = mount();
 assert.equal(app.state.playing, true, 'The story plays on a normal arrival');
 assert.ok(app.scheduled);
 assert.equal(app.play().dataset.state, 'pause'); assert.equal(app.play().attrs['aria-label'], 'Pause animation'); assert.equal(app.play().attrs['aria-pressed'], 'true');
 assert.equal(app.caption(), BEATS[0].caption); assert.equal(app.node('#hero-kicker').textContent, BEATS[0].kicker);
 assert.equal((app.node('.hero-ticks').innerHTML.match(/<i /g) || []).length, BEATS.length - 1, 'One scrubber tick per beat change');
}
{
 const app = mount({reduce: true});
 assert.equal(app.state.playing, false, 'Reduced motion arrives on a still frame');
 assert.equal(app.scheduled, false);
 assert.equal(app.play().dataset.state, 'play'); assert.equal(app.play().attrs['aria-label'], 'Play animation');
 assert.equal(app.caption(), BEATS[0].caption);
 app.click('#hero-play');
 assert.equal(app.state.playing, true, 'An explicit Play opts into motion'); assert.ok(app.scheduled);
}

// ---------- A full run: every caption in order, each on screen long enough to read ----------
{
 const app = mount();
 const shown = [];
 const watch = () => { const text = app.caption(); if (shown.at(-1)?.text !== text) shown.push({text, at: app.state.t}); };
 app.run(40, () => (watch(), false));
 watch();
 assert.deepEqual(shown.map(s => s.text), BEATS.map(b => b.caption), 'Captions follow the storyboard');
 shown.slice(0, -1).forEach((s, i) => {
  const onScreen = shown[i + 1].at - s.at;
  assert.ok(onScreen >= readingTime(s.text) - .1, `"${s.text}" was up ${onScreen.toFixed(2)} s, needs ${readingTime(s.text).toFixed(2)} s`);
 });
 assert.equal(app.state.t, DURATION); assert.equal(app.state.playing, false, 'The story stops at its end (no loop)');
 assert.equal(app.scheduled, false, 'Nothing animates after the story ends');
 assert.equal(app.play().dataset.state, 'again'); assert.equal(app.play().attrs['aria-label'], 'Play the lithium hop again');
 assert.equal(app.node('#hero-progress').value, '1000');
 // Play at the end repeats only the hop, from rest at A in the finished scene.
 app.click('#hero-play'); app.frame();
 assert.equal(app.state.playing, true);
 const u = app.updates.at(-1);
 assert.ok(app.state.t - HOP_REPLAY_AT < .05 && u.hop < 1e-6 && u.oxygen === 1 && u.edges === 1, 'Replaying the hop starts at A with the scene built');
 assert.equal(app.caption(), beatAt(HOP_REPLAY_AT).caption);
}

// ---------- Reduced-motion preference, scrubbing and replay ----------
{
 const app = mount();
 app.run(40, () => app.state.t > 3);
 app.media.matches = true; app.media.change();
 assert.equal(app.state.playing, false, 'Turning on reduced motion pauses');
 app.frame(); assert.equal(app.scheduled, false, 'and stops frame scheduling');
 app.seek(DURATION / 2);
 assert.ok(Math.abs(app.state.t - DURATION / 2) < .03); assert.equal(app.caption(), beatAt(DURATION / 2).caption);
 app.seek(DURATION);
 assert.equal(app.play().dataset.state, 'again'); assert.equal(app.caption(), BEATS.at(-1).caption);
 app.click('#hero-replay');
 assert.equal(app.state.t, 0); assert.equal(app.node('#hero-progress').value, '0');
 assert.equal(app.state.playing, false, 'Replay keeps the reduced-motion preference'); assert.equal(app.caption(), BEATS[0].caption);
}
{
 const app = mount();
 app.run(40, () => app.state.t > 2);
 app.node('#hero-progress').fire('focus');
 assert.equal(app.state.playing, false, 'Focusing the scrubber pauses');
 app.click('#hero-replay');
 assert.equal(app.state.t, 0); assert.equal(app.state.playing, true, 'Replay plays from the start');
}

// ---------- Auto-pause: hidden tab and scrolled-away hero ----------
{
 const app = mount();
 app.run(40, () => app.state.t > 1);
 app.document.hidden = true; app.document.events.visibilitychange();
 assert.equal(app.state.playing, false, 'A hidden tab pauses'); app.frame(); assert.equal(app.scheduled, false);
 app.document.hidden = false; app.document.events.visibilitychange();
 assert.equal(app.state.playing, true, 'and resumes on return');
 app.intersect(false); assert.equal(app.state.playing, false, 'Scrolling the hero away pauses');
 app.intersect(true); assert.equal(app.state.playing, true, 'and scrolling back resumes');
 app.click('#hero-play'); assert.equal(app.state.playing, false);
 app.intersect(false); app.intersect(true);
 app.document.hidden = true; app.document.events.visibilitychange(); app.document.hidden = false; app.document.events.visibilitychange();
 assert.equal(app.state.playing, false, 'A reader’s own pause survives scrolling and tab switches');
}

// ---------- Inspection ----------
{
 const app = mount();
 const tm = app.species.find(b => b.dataset.inspect === 'tm');
 tm.fire('mouseenter');
 assert.equal(app.caption(), BEATS[0].caption, 'Hovering a key entry does nothing before the model is explorable');
 tm.fire('click');
 assert.equal(app.state.t, DURATION, 'Selecting a species jumps to the explorable model'); assert.equal(app.state.playing, false);
 assert.match(app.caption(), /1-TM/); assert.equal(tm.attrs['aria-pressed'], 'true');
 assert.ok(app.species.filter(b => b !== tm).every(b => b.attrs['aria-pressed'] === 'false'));
 assert.equal(app.updates.at(-1).selection, 'tm');
 tm.fire('click');
 assert.equal(app.caption(), BEATS.at(-1).caption, 'Selecting it again clears the selection'); assert.equal(tm.attrs['aria-pressed'], 'false');
 assert.equal(app.node('#hero-reset').hidden, true);
 app.node('#hero-canvas').fire('keydown', {key: 'ArrowRight', preventDefault() {}});
 assert.equal(app.node('#hero-reset').hidden, false, 'Rotating the model offers a reset');
 assert.ok(Math.abs(app.updates.at(-1).yaw - app.updates.at(-2).yaw - .15) < 1e-9);
}
{
 const app = mount();
 app.node('#hero-canvas').fire('keydown', {key: 'ArrowLeft', preventDefault() {}});
 assert.ok(app.state.t >= INTERACTIVE_AT, 'Keyboard rotation also jumps to the explorable model');
}

// ---------- Connectors (side by side) and underlines (stacked) ----------
// The scrubber moves in 1/1000ths of the run, so compare opacities with a small tolerance.
const opacity = (app, which) => { const v = Number(app.node(`#${which}-connector`).style.opacity); return v < .002 ? '0' : v > .998 ? '1' : String(v); };
const mark = (app, word) => Number(app.node(`#${word}-word`).style.props['--mark']).toFixed(3);
const at = id => BEATS.find(b => b.id === id).start;
{
 const app = mount();
 app.seek(2.5); assert.equal(opacity(app, 'figure'), '1', '“figures” points at the figure'); assert.equal(opacity(app, 'model'), '0');
 assert.match(app.node('#figure-connector .line').attrs.d, /^M[\d.]+ [\d.]+C/);
 app.seek(at('lift') + .3); assert.equal(opacity(app, 'figure'), '0', 'and lets go as the card lifts');
 app.seek(at('oxygen') + .5); assert.equal(opacity(app, 'model'), '1', '“understanding” points at the model');
 app.seek(at('depart') + .7); assert.equal(opacity(app, 'model'), '0', 'and lets go before lithium moves');
 assert.equal(mark(app, 'figure'), '0.000'); assert.equal(mark(app, 'understanding'), '0.000');
}
{
 const app = mount({layout: 'phone'});
 for (const time of [2.5, at('oxygen') + .5]) { app.seek(time); assert.equal(opacity(app, 'figure'), '0'); assert.equal(opacity(app, 'model'), '0', 'Stacked layouts draw no long arrows'); }
 app.seek(2.5); assert.equal(mark(app, 'figure'), '1.000', 'Stacked layouts underline the word instead');
 app.seek(at('oxygen') + .5); assert.equal(mark(app, 'understanding'), '1.000'); assert.equal(mark(app, 'figure'), '0.000');
}

// ---------- Fallbacks ----------
{
 const app = mount({gpu: false});
 assert.equal(app.play().hidden, true); assert.equal(app.node('#hero-replay').hidden, true); assert.equal(app.node('#hero-progress').disabled, true);
 assert.match(app.caption(), /3D is unavailable/); assert.equal(app.state.playing, false);
}
{
 const app = mount({image: 'error'});
 assert.equal(app.state.t, DURATION); assert.equal(app.state.playing, false);
 assert.match(app.caption(), /source figure/i, 'A missing figure still leaves the model to explore');
}
console.log(`PASS: autoplay and reduced-motion arrival, explicit play, ${BEATS.length} captions in storyboard order with reading time, stop at end, hop-only replay, preference-change pause, scrubbing, replay, hidden-tab and scroll-away pause/resume that respect a reader's pause, species inspection and keyboard entry, connectors side by side and underlines when stacked, WebGL and image fallbacks. Real controller, stub renderer.`);
