import {createHopRenderer} from './hero-renderer.js';
import {BEATS, DURATION, HOP_REPLAY_AT, sequence, beatAt, clamp, easeInOut, easeOut} from './hero-timeline.mjs';

const $ = s => document.querySelector(s);
const hero = $('.home-hero'), frameEl = $('#hero-frame'), stageEl = $('.hero-stage');
const paper = $('#hero-paper'), pctx = paper.getContext('2d'), overlay = $('#hero-canvas'), ctx = overlay.getContext('2d');
const slider = $('#hero-progress'), play = $('#hero-play'), replay = $('#hero-replay'), caption = $('#hero-stage'), kicker = $('#hero-kicker'), resetButton = $('#hero-reset');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let gpu; try { gpu = createHopRenderer($('#hero-gl')); } catch { gpu = null; }

// The untouched Figure 1 (a pixel-identical lossless WebP; the PNG is the fallback).
const source = new Image(), SOURCE_PNG = 'references/hau-2025-figure-1-original.png';
source.decoding = 'async'; source.src = 'assets/hau-2025-figure-1.webp';
const FIGURE = {w: 1500, h: 850}, GLYPH = {x: 74, y: 322, w: 275, h: 240};
// Printed positions of the glyph's actors, in native figure pixels.
const ANCHORS = {li: [142, 384], b: [262, 388], c: [239, 399], tm: [215, 488], t: [213, 414]};
const DESCRIPTIONS = {
 li: 'Li⁺ moves between two octahedral sites. Each has six oxygen neighbors.',
 oxygen: 'Four oxygen atoms surround the tetrahedral site. Three of them form each window lithium squeezes through.',
 tm: 'One transition-metal ion shares a face with the tetrahedral site. That count of one is the “1-TM” in the figure.',
 sites: 'Dashed rings are empty octahedral sites: the destination and a second vacancy. The small ring is the tetrahedral site.',
};

let t = 0, playing = false, userPaused = false, wasAuto = false, last = 0, frame = 0, inView = true;
let yaw = 0, pitch = 0, viewTween = null, selection = '', hover = '', pointer = null, dragged = false, hitAreas = [];
let size = {w: 0, h: 0, dpr: 1, frame: {x: 0, y: 0, w: 1, h: 1}, unit: 100, narrow: false, stacked: false};
let shownBeat = '', shownText = '', shownKicker = '', project = null, figureBox = null;

// ---------- Layout ----------
function measure() {
 const c = stageEl.getBoundingClientRect(), f = frameEl.getBoundingClientRect();
 const dpr = Math.min(devicePixelRatio || 1, 2), w = c.width, h = c.height;
 if (!w || !h) return false;
 const fr = {x: f.left - c.left, y: f.top - c.top, w: f.width, h: f.height};
 const narrow = hero.getBoundingClientRect().width < 701;
 // Stacked layouts (phones, portrait tablets) put the headline above the stage: words get underlines, not arrows.
 const stacked = f.top >= $('.hero-copy').getBoundingClientRect().bottom - 1;
 for (const cv of [paper, overlay]) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
 pctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
 // One model unit (a/2) in CSS pixels, sized so the whole oxygen context fits the frame.
 const unit = Math.min(fr.h * (narrow ? .37 : .42), fr.w * (narrow ? .28 : .3));
 size = {w, h, dpr, frame: fr, unit, narrow, stacked};
 gpu?.layout(w, h, fr, unit, dpr);
 paintCard();
 return true;
}

// ---------- Figure layer ----------
// Fit the whole figure in the frame, then zoom (geometrically) until the 1-TM glyph fills the centre.
function figureTransform(zoom) {
 const f = size.frame, fit = Math.min(f.w / FIGURE.w, f.h / FIGURE.h);
 const end = Math.min(.95, f.h * .6 / GLYPH.h, f.w * .55 / GLYPH.w);
 const scale = fit * Math.pow(end / fit, zoom);
 const gx = GLYPH.x + GLYPH.w / 2, gy = GLYPH.y + GLYPH.h / 2;
 const fitX = f.x + (f.w - FIGURE.w * fit) / 2 + gx * fit, fitY = f.y + (f.h - FIGURE.h * fit) / 2 + gy * fit;
 const cx = fitX + (f.x + f.w / 2 - fitX) * zoom, cy = fitY + (f.y + f.h / 2 - fitY) * zoom;
 return {scale, x: cx - gx * scale, y: cy - gy * scale};
}
const toScreen = (tr, [x, y]) => [tr.x + x * tr.scale, tr.y + y * tr.scale];
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const glyphRect = tr => ({x: tr.x + GLYPH.x * tr.scale, y: tr.y + GLYPH.y * tr.scale, w: GLYPH.w * tr.scale, h: GLYPH.h * tr.scale});
// The 1-TM glyph on its patch of white paper, with the accent frame drawing around it once spotlit.
function drawCard(g2d, tr, g, spot) {
 roundRect(g2d, g.x, g.y, g.w, g.h, 4); g2d.save(); g2d.clip(); g2d.drawImage(source, tr.x, tr.y, FIGURE.w * tr.scale, FIGURE.h * tr.scale); g2d.restore();
 if (spot <= 0) return;
 const w = g.w + 6, h = g.h + 6, r = 6, per = 2 * (w + h) - 8 * r + 2 * Math.PI * r;
 g2d.save(); g2d.globalAlpha *= Math.min(1, spot * 3); g2d.strokeStyle = '#8fa8ff'; g2d.lineWidth = 1.5; g2d.lineCap = 'round';
 g2d.setLineDash([per * spot, per]); roundRect(g2d, g.x - 3, g.y - 3, w, h, r); g2d.stroke(); g2d.restore();
}
function drawPaper(q) {
 pctx.clearRect(0, 0, size.w, size.h); figureBox = null;
 // Once the page has lifted away the layer is empty: take it out of compositing rather than rely on an empty bitmap
 // (an accelerated canvas can keep presenting an older frame, which would bring the whole page back).
 const live = source.complete && source.naturalWidth && q.paper > 0;
 paper.style.visibility = live ? '' : 'hidden';
 if (!live) return;
 const tr = figureTransform(q.zoom), W = FIGURE.w * tr.scale, H = FIGURE.h * tr.scale, g = glyphRect(tr), f = size.frame;
 // The rest of the figure dims under a spotlight, stays faintly in view through the zoom, then clears.
 const rest = (1 - .62 * q.spot - .24 * q.zoom) * q.ghost;
 figureBox = {x: tr.x, y: tr.y, w: W, h: H, glyph: g, rest};
 // A short fade-in when the story (re)starts, so the white page never pops onto the dark hero.
 const base = playing && !reduced.matches ? q.intro : 1;
 if (rest > .003) {
  // Keep the page inside the frame while it zooms, so it never spills over the headline.
  pctx.save(); pctx.beginPath(); pctx.rect(f.x, f.y, f.w, f.h); pctx.clip();
  pctx.globalAlpha = base * rest; roundRect(pctx, tr.x, tr.y, W, H, 3); pctx.clip(); pctx.drawImage(source, tr.x, tr.y, W, H);
  pctx.restore();
  // As the camera closes in, the page's edges soften into the background instead of stopping at the frame.
  // (Erased outside the clip, so no antialiased sliver survives along the frame edge.)
  if (q.zoom > 0) {
   pctx.save(); pctx.globalCompositeOperation = 'destination-out';
   pctx.translate(f.x + f.w / 2, f.y + f.h / 2); pctx.scale(f.w / 2, f.h / 2);
   const vignette = pctx.createRadialGradient(0, 0, .42, 0, 0, .98);
   vignette.addColorStop(0, 'rgba(0,0,0,0)'); vignette.addColorStop(1, `rgba(0,0,0,${Math.min(1, q.zoom * 2.4)})`);
   pctx.fillStyle = vignette; pctx.fillRect(-1.1, -1.1, 2.2, 2.2); pctx.restore();
  }
 }
 pctx.save(); pctx.globalAlpha = base; drawCard(pctx, tr, g, q.spot); pctx.restore();
}
// The zoomed card, painted once per layout for the 3D scene, where it lays back as the atoms lift off.
const cardCanvas = document.createElement('canvas');
function paintCard() {
 if (!gpu || !(source.complete && source.naturalWidth)) return;
 const tr = figureTransform(1), g = glyphRect(tr), pad = 8, k = Math.min(3, size.dpr * 1.5);
 const rect = {x: g.x - pad, y: g.y - pad, w: g.w + 2 * pad, h: g.h + 2 * pad};
 cardCanvas.width = Math.round(rect.w * k); cardCanvas.height = Math.round(rect.h * k);
 const c = cardCanvas.getContext('2d');
 c.setTransform(cardCanvas.width / rect.w, 0, 0, cardCanvas.height / rect.h, 0, 0); c.translate(-rect.x, -rect.y); c.imageSmoothingQuality = 'high';
 drawCard(c, tr, g, 1);
 gpu.setCard(cardCanvas, rect);
}

// ---------- Labels ----------
// Callouts in the site-wide style (see annotations.mjs): a ring on the atom or site, a hairline that bends into a
// short shelf, a title in the thing's colour and, on wider stages, one muted line saying what it is.
const titleFont = () => `500 ${size.narrow ? 11.5 : 13}px Sora, Arial, sans-serif`;
const noteFont = () => `400 ${size.narrow ? 10.5 : 11.5}px Sora, Arial, sans-serif`;
const labelSide = {};
// Greedy placement: each label tries its preferred side, then the mirrored and vertical sides, and takes the first
// spot inside the stage that is clear of labels already placed and, if possible, of the atoms too. A label keeps its
// side while that side still works, so nothing hops back and forth as the model turns.
function placeLabels(items, obstacles) {
 const boxes = [], reach = size.narrow ? 14 : 30, shelf = size.narrow ? 8 : 11, gap = 5;
 const inside = b => b.x >= 3 && b.x + b.w <= size.w - 3 && b.y >= 3 && b.y + b.h <= size.h - 3;
 const free = b => !boxes.some(o => b.x < o.x + o.w + 6 && b.x + b.w + 6 > o.x && b.y < o.y + o.h + 4 && b.y + b.h + 4 > o.y);
 const open = b => !obstacles.some(c => Math.hypot(Math.max(b.x, Math.min(c.x, b.x + b.w)) - c.x, Math.max(b.y, Math.min(c.y, b.y + b.h)) - c.y) < c.r + 2);
 const clear = b => inside(b) && free(b) && open(b), usable = b => inside(b) && free(b);
 return items.filter(i => i.p && i.opacity > .01).map(item => {
  const {p, dir} = item, note = size.narrow ? '' : item.note || '';
  ctx.font = titleFont(); const tw = ctx.measureText(item.text).width; ctx.font = noteFont(); const nw = note ? ctx.measureText(note).width : 0;
  const w = Math.max(tw, nw), h = note ? 31 : 16;
  const sides = item.home ? [dir] : [dir, [-dir[0], dir[1]], [dir[0], -dir[1]], [-dir[0], -dir[1]], [.35, -1], [.35, 1]];
  const geometry = d => {
   const len = Math.hypot(d[0], d[1]) || 1, ux = d[0] / len, uy = d[1] / len, side = ux < -.2 ? -1 : 1;
   const h = item.home, ex = h ? h.x : p.x + ux * (p.r + reach), ey = h ? h.y : p.y + uy * (p.r + reach), sx = ex + side * shelf, tx = sx + side * gap;
   const hl = Math.hypot(ex - p.x, ey - p.y) || 1, fx = h ? (ex - p.x) / hl : ux, fy = h ? (ey - p.y) / hl : uy;
   return {from: [p.x + fx * (p.r + 5), p.y + fy * (p.r + 5)], elbow: [ex, ey], to: [sx, ey], tx, ty: ey + 4.5, side, note, box: {x: side > 0 ? tx - 2 : tx - w - 2, y: ey - 9, w: w + 4, h}};
  };
  const kept = labelSide[item.key];
  let side = kept !== undefined && usable(geometry(sides[kept]).box) ? kept : sides.findIndex(d => clear(geometry(d).box));
  if (side < 0) side = sides.findIndex(d => usable(geometry(d).box));
  if (side < 0) side = 0;
  labelSide[item.key] = side;
  const g = geometry(sides[side]);
  // Last resort: slide the text back inside the stage.
  const dx = Math.max(3 - g.box.x, Math.min(0, size.w - 3 - g.box.x - g.box.w));
  g.tx += dx; g.box.x += dx; g.to[0] += dx; boxes.push(g.box);
  return {...item, ...g};
 });
}
function drawLabel({text, note, opacity, color = '#d5ddf3', p, from, elbow, to, tx, ty, side}) {
 ctx.save(); ctx.globalAlpha = opacity; ctx.strokeStyle = color; ctx.lineWidth = 1;
 ctx.globalAlpha = opacity * .85; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 3, 0, Math.PI * 2); ctx.stroke();
 ctx.globalAlpha = opacity * .6; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(...from); ctx.lineTo(...elbow); ctx.lineTo(...to); ctx.stroke();
 ctx.globalAlpha = opacity; ctx.textAlign = side < 0 ? 'right' : 'left'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(8,10,18,.9)';
 ctx.font = titleFont(); ctx.lineWidth = 4; ctx.strokeText(text, tx, ty); ctx.fillStyle = color; ctx.fillText(text, tx, ty);
 if (note) { ctx.font = noteFont(); ctx.strokeText(note, tx, ty + 15); ctx.fillStyle = '#9aa6bf'; ctx.fillText(note, tx, ty + 15); }
 ctx.restore();
}
function drawLabels(q, pts) {
 ctx.clearRect(0, 0, size.w, size.h);
 if (!pts) return;
 const inspect = hover || selection, c = pts.center, away = p => [p.x - c.x, p.y - c.y - 1e-3];
 // Sides are chosen afresh each time the labels come in.
 if (q.labels <= 0 && !inspect) for (const k in labelSide) delete labelSide[k];
 const obstacles = [pts.li, pts.tm, ...pts.oxygen.filter(o => o.visible)];
 placeLabels([
  {key: 'li', p: size.narrow ? null : pts.li, text: 'Lithium ion', opacity: q.labels, dir: [-1, -.7], color: '#bfeec4'},
  {key: 'b', p: pts.b, text: 'Empty octahedral site', opacity: q.labels * (1 - clamp((q.hop - .8) / .15)), dir: away(pts.b)},
  {key: 't', p: pts.t, text: 'Tetrahedral site', opacity: q.labels * (1 - clamp((q.hop - .25) / .1) + clamp((q.hop - .7) / .1)), dir: [-1, .9], color: '#c9e6d0'},
  {key: 'tm', p: pts.tm, text: 'Transition metal', opacity: Math.max(q.tm, inspect === 'tm' ? 1 : 0), dir: [.9, -.3], color: '#e3c6f5'},
  {key: 'c', p: inspect === 'sites' ? pts.c : null, text: 'Second vacancy', opacity: 1, dir: away(pts.c)},
 ], obstacles).forEach(drawLabel);
}

// ---------- Connectors ----------
const connectors = {figure: $('#figure-connector'), model: $('#model-connector')};
// A single smooth arc from just after the word to a point `gap` short of the target. It leaves nearly level
// and arrives at no more than ~34°, so the head always reads as pointing into its target.
function connectorGeometry(word, target, gap, heroRect) {
 const a = word.getBoundingClientRect();
 const S = [a.right - heroRect.left + 12, a.top - heroRect.top + a.height * .56];
 const P = target;
 const theta = Math.atan2(P[1] - S[1], P[0] - S[0]), a0 = theta * .25, a1 = Math.max(-.6, Math.min(.6, theta * 1.3));
 const dir = [Math.cos(a1), Math.sin(a1)], tip = [P[0] - dir[0] * gap, P[1] - dir[1] * gap], E = [tip[0] - dir[0] * 5, tip[1] - dir[1] * 5];
 const k = Math.hypot(E[0] - S[0], E[1] - S[1]) * .38;
 const c1 = [S[0] + Math.cos(a0) * k, S[1] + Math.sin(a0) * k], c2 = [E[0] - dir[0] * k, E[1] - dir[1] * k];
 return {d: `M${S[0]} ${S[1]}C${c1[0]} ${c1[1]},${c2[0]} ${c2[1]},${E[0]} ${E[1]}`, S, E, tip, dir};
}
let stageRect = {left: 0, top: 0};
function drawConnector(g, state, geometry) {
 const [line, head, dot, ink] = [g.querySelector('.line'), g.querySelector('.head'), g.querySelector('.dot'), $(`#${g.id}-ink`)];
 const draw = reduced.matches && !playing ? (state.draw > 0 ? 1 : 0) : state.draw;
 if (!geometry || draw <= 0 || state.fade <= 0) { g.style.opacity = '0'; return; }
 g.style.opacity = String(state.fade);
 line.setAttribute('d', geometry.d);
 const [sx, sy] = geometry.S, [tx, ty] = geometry.tip, [ux, uy] = geometry.dir;
 ink?.setAttribute('x1', sx); ink?.setAttribute('y1', sy); ink?.setAttribute('x2', tx); ink?.setAttribute('y2', ty);
 const L = line.getTotalLength(), lineP = clamp(draw / .9), headP = easeOut(clamp((draw - .8) / .2));
 line.style.strokeDasharray = `${L} ${L}`; line.style.strokeDashoffset = String(L * (1 - lineP));
 // A narrow filled head with a shallow notch: tip, wing, notch, wing.
 const k = .55 + .45 * headP, len = 9.5 * k, half = 3.8 * k, notch = 6.6 * k, bx = tx - ux * len, by = ty - uy * len;
 head.setAttribute('d', headP > 0 ? `M${tx} ${ty}L${bx - uy * half} ${by + ux * half}L${tx - ux * notch} ${ty - uy * notch}L${bx + uy * half} ${by - ux * half}Z` : '');
 head.style.opacity = String(headP);
 dot.setAttribute('cx', sx); dot.setAttribute('cy', sy); dot.setAttribute('r', String(2.4 * easeOut(clamp(draw / .12))));
}
function drawConnectors(q, pts) {
 const hr = hero.getBoundingClientRect(); stageRect = stageEl.getBoundingClientRect();
 const ox = stageRect.left - hr.left, oy = stageRect.top - hr.top;
 const svg = $('.hero-connectors'); svg.setAttribute('viewBox', `0 0 ${hr.width} ${hr.height}`);
 let fig = null, mod = null;
 if (figureBox && q.figureConnector.draw > 0 && !size.stacked) {
  // "figures" points at the figure's visible left edge, then slides to the glyph as the spotlight lands on it.
  const f = size.frame, g = figureBox.glyph, word = $('#figure-word').getBoundingClientRect();
  const edge = [Math.max(f.x, figureBox.x), Math.max(figureBox.y + 24, Math.min(figureBox.y + figureBox.h - 24, word.top + word.height * .56 - stageRect.top))];
  const onGlyph = [g.x, g.y + g.h * .5];
  const k = easeInOut(q.spot);
  fig = connectorGeometry($('#figure-word'), [edge[0] + (onGlyph[0] - edge[0]) * k + ox, edge[1] + (onGlyph[1] - edge[1]) * k + oy], 7, hr);
 }
 if (pts && q.modelConnector.draw > 0 && !size.stacked) mod = connectorGeometry($('#understanding-word'), [pts.a.x + ox, pts.a.y + oy], pts.a.r + 9, hr);
 drawConnector(connectors.figure, q.figureConnector, fig);
 drawConnector(connectors.model, q.modelConnector, mod);
}
// Stacked layouts: the word underlines itself while its picture is introduced, instead of a long arrow.
const words = {figure: $('#figure-word'), model: $('#understanding-word')};
function markWords(q) {
 const mark = c => size.stacked ? (reduced.matches && !playing ? (c.draw > 0 ? 1 : 0) : c.draw) * c.fade : 0;
 words.figure.style.setProperty('--mark', mark(q.figureConnector).toFixed(3));
 words.model.style.setProperty('--mark', mark(q.modelConnector).toFixed(3));
}

// ---------- Scene ----------
function view(q) {
 // The printed glyph is read in the basis view; the model turns as it unfolds, then drifts a little.
 // Most of the turn happens while the atoms lift off the card, so parallax shows their depth.
 return {yaw: yaw - .3 + .64 * q.unfold + .2 * q.drift, pitch: pitch - .08 * q.unfold};
}
function render() {
 if (!size.w && !measure()) return;
 const q = sequence(t / DURATION), inspect = hover || selection;
 drawPaper(q);
 let pts = null;
 if (gpu) {
  const v = view(q), tr = figureTransform(q.zoom);
  const glyph = q.unfold < 1 ? {scale: tr.scale, anchors: Object.fromEntries(Object.entries(ANCHORS).map(([k, p]) => [k, toScreen(tr, p)]))} : null;
  // The model's bounding box is off-centre about the tetrahedral site; these offsets balance it in the frame.
  pts = gpu.update({...v, offsetX: -.17, offsetY: -.14, unfold: q.unfold, glyph, card: q.card, tilt: q.tilt, lens: q.lens, atoms: q.atoms, hop: q.hop, oxygen: q.oxygen, context: q.context, edges: q.edges, route: q.route, tm: q.tm, selection: inspect});
  gpu.render();
 }
 project = pts;
 drawLabels(q, q.atoms > 0 ? pts : null);
 drawConnectors(q, q.unfold > .6 ? pts : null);
 markWords(q);
 hitAreas = pts && q.interactive ? [
  {type: 'li', ...pts.li}, {type: 'tm', ...pts.tm}, {type: 'sites', ...pts.b}, {type: 'sites', ...pts.c}, {type: 'sites', ...pts.t, r: Math.max(pts.t.r, 12)},
  ...pts.oxygen.filter(o => o.visible).map(o => ({type: 'oxygen', ...o})),
 ].sort((a, b) => a.z - b.z) : [];
 updatePanel(q);
}

// ---------- Panel ----------
const ticks = $('.hero-ticks');
ticks.innerHTML = BEATS.slice(1).map(b => `<i style="left:${(b.start / DURATION * 100).toFixed(3)}%"></i>`).join('');
// Captions cross-fade: the old line lifts away quickly, then the new one settles in.
const swaps = new WeakMap();
function setText(el, text, animate) {
 if (el.dataset.text === text) return;
 el.dataset.text = text;
 swaps.get(el)?.cancel(); swaps.delete(el);
 if (el.textContent === text) return;
 if (!animate || !el.animate || reduced.matches) { el.textContent = text; return; }
 const out = el.animate([{opacity: 1, transform: 'none'}, {opacity: 0, transform: 'translateY(-3px)'}], {duration: 160, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards'});
 swaps.set(el, out);
 out.onfinish = () => {
  el.textContent = text; out.cancel();
  swaps.set(el, el.animate([{opacity: 0, transform: 'translateY(5px)'}, {opacity: 1, transform: 'none'}], {duration: 380, easing: 'cubic-bezier(.22,.75,.2,1)'}));
 };
}
function updatePanel(q) {
 const beat = beatAt(q.t), inspect = hover || selection;
 const text = inspect ? DESCRIPTIONS[inspect] : beat.caption;
 if (text !== shownText) { setText(caption, text, playing || !!inspect); shownText = text; }
 if (beat.kicker !== shownKicker) { setText(kicker, beat.kicker, playing); shownKicker = beat.kicker; }
 shownBeat = beat.id;
 const value = Math.round(t / DURATION * 1000);
 if (String(value) !== slider.value) slider.value = String(value);
 slider.style.setProperty('--progress', `${value / 10}%`);
 slider.setAttribute('aria-valuetext', `${Math.round(value / 10)} percent. ${beat.caption}`);
 overlay.setAttribute('aria-label', q.interactive
  ? `Ideal 1-TM rocksalt geometry. Lithium ${q.hop < .5 ? 'approaches' : q.hop < 1 ? 'leaves' : 'has reached'} ${q.hop < 1 ? 'the tetrahedral site between two octahedral sites' : 'the vacant octahedral site'}. Drag or use arrow keys to rotate.`
  : 'Figure 1 from Hau et al. comparing layered, spinel and disordered rocksalt structures. The view focuses on the layered 1-TM hop.');
 resetButton.hidden = !(Math.abs(yaw) > .01 || Math.abs(pitch) > .01);
 document.querySelectorAll('[data-inspect]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.inspect === selection)));
 hero.dataset.beat = beat.id;
}
function controls() {
 const end = t >= DURATION;
 play.setAttribute('aria-pressed', String(playing));
 play.setAttribute('aria-label', playing ? 'Pause animation' : end ? 'Play the lithium hop again' : 'Play animation');
 play.dataset.state = playing ? 'pause' : end ? 'again' : 'play';
}

// ---------- Playback ----------
function schedule() { if (!frame) frame = requestAnimationFrame(tick); }
function tick(now) {
 frame = 0;
 let busy = false;
 if (playing) {
  if (last) t = Math.min(DURATION, t + Math.min(now - last, 80) / 1000);
  last = now; busy = true;
  if (t >= DURATION) { playing = false; last = 0; controls(); }
 }
 if (viewTween) {
  const k = clamp((now - viewTween.start) / 380), e = easeInOut(k);
  yaw = viewTween.yaw * (1 - e); pitch = viewTween.pitch * (1 - e); busy = true;
  if (k >= 1) { viewTween = null; yaw = pitch = 0; }
 }
 render();
 if (busy && (playing || viewTween)) schedule();
}
function start() { playing = true; userPaused = false; last = 0; controls(); schedule(); }
function pause(byUser = true) { playing = false; last = 0; if (byUser) userPaused = true; controls(); }
function seek(time) { pause(); t = clamp(time / DURATION) * DURATION; controls(); render(); }
function ensureInteractive() { if (!sequence(t / DURATION).interactive) { pause(); t = DURATION; controls(); } }

play.addEventListener('click', () => { if (playing) pause(); else { if (t >= DURATION) t = HOP_REPLAY_AT; start(); } });
replay.addEventListener('click', () => { t = 0; yaw = pitch = 0; selection = hover = ''; last = 0; slider.value = '0'; if (reduced.matches) pause(); else start(); render(); });
slider.addEventListener('input', () => seek(Number(slider.value) / 1000 * DURATION));
slider.addEventListener('focus', () => pause());
resetButton.addEventListener('click', () => { if (reduced.matches) { yaw = pitch = 0; render(); } else { viewTween = {start: performance.now(), yaw, pitch}; schedule(); } overlay.focus?.(); });
document.querySelectorAll('[data-inspect]').forEach(b => {
 const key = b.dataset.inspect;
 b.addEventListener('click', () => { ensureInteractive(); selection = selection === key ? '' : key; hover = ''; pause(); render(); });
 b.addEventListener('mouseenter', () => { if (!sequence(t / DURATION).interactive) return; hover = key; render(); });
 b.addEventListener('mouseleave', () => { hover = ''; render(); });
 b.addEventListener('focus', () => { if (!sequence(t / DURATION).interactive) return; hover = key; render(); });
 b.addEventListener('blur', () => { hover = ''; render(); });
});

// ---------- Pointer and keyboard ----------
const at = e => { const r = overlay.getBoundingClientRect(); return {x: e.clientX - r.left, y: e.clientY - r.top}; };
const hitTest = p => [...hitAreas].reverse().find(a => Math.hypot(a.x - p.x, a.y - p.y) < Math.max(a.r, 14))?.type || '';
overlay.addEventListener('pointerdown', e => { if (!sequence(t / DURATION).interactive) return; pointer = {...at(e), id: e.pointerId}; dragged = false; viewTween = null; pause(); });
overlay.addEventListener('pointermove', e => {
 if (!sequence(t / DURATION).interactive) return;
 const p = at(e);
 if (pointer) {
  const dx = p.x - pointer.x, dy = p.y - pointer.y;
  if (Math.abs(dx) + Math.abs(dy) > 3) dragged = true;
  if (e.pointerType !== 'touch' || Math.abs(dx) > Math.abs(dy)) { yaw += dx * .008; pitch = Math.max(-1.1, Math.min(1.1, pitch + dy * .006)); }
  pointer = {...p, id: e.pointerId}; render();
 } else if (e.pointerType !== 'touch') {
  const next = hitTest(p); overlay.style.cursor = next ? 'pointer' : 'grab';
  if (next !== hover) { hover = next; render(); }
 }
});
overlay.addEventListener('pointerup', e => { if (!pointer) return; if (!dragged) { selection = hitTest(at(e)); hover = ''; render(); } pointer = null; });
overlay.addEventListener('pointercancel', () => { pointer = null; });
overlay.addEventListener('pointerleave', () => { pointer = null; if (hover) { hover = ''; render(); } });
overlay.addEventListener('keydown', e => {
 if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(e.key)) return;
 e.preventDefault(); ensureInteractive(); pause();
 if (e.key === 'Home') { yaw = pitch = 0; }
 else { yaw += e.key === 'ArrowLeft' ? -.15 : e.key === 'ArrowRight' ? .15 : 0; pitch = Math.max(-1.1, Math.min(1.1, pitch + (e.key === 'ArrowUp' ? -.12 : e.key === 'ArrowDown' ? .12 : 0))); }
 render();
});

// ---------- Lifecycle ----------
reduced.addEventListener('change', () => { if (reduced.matches) pause(); });
document.addEventListener('visibilitychange', () => { last = 0; if (document.hidden && playing) { pause(false); userPaused = false; wasAuto = true; } else if (!document.hidden && wasAuto) { wasAuto = false; if (!userPaused && !reduced.matches && inView) start(); } });
// Pause the story while the hero is scrolled away, and pick it up again on return.
if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => {
 inView = entry.isIntersecting;
 if (!inView && playing) { pause(false); wasAuto = true; }
 else if (inView && wasAuto && !userPaused && !document.hidden) { wasAuto = false; start(); }
}, {threshold: .2}).observe(hero);
new ResizeObserver(() => { if (measure()) render(); }).observe(stageEl);
if (document.fonts?.ready) document.fonts.ready.then(() => { if (measure()) render(); });
function begin() {
 measure();
 if (!gpu) {
  render(); play.hidden = replay.hidden = true; slider.disabled = true;
  caption.textContent = '3D is unavailable in this browser, so this is the original figure'; return;
 }
 if (!reduced.matches) start(); else controls();
 render();
}
source.addEventListener('load', begin);
source.addEventListener('error', () => {
 if (!source.src.endsWith('.png')) { source.src = SOURCE_PNG; return; }
 t = DURATION; begin(); pause(false); caption.textContent = 'The source figure didn’t load, but the 3D model is here to explore';
});
if (source.complete && source.naturalWidth) begin();
const notes = $('#hero-notes-dialog');
$('#hero-notes').addEventListener('click', () => { pause(); notes.showModal(); });
notes.querySelector('.dialog-close').addEventListener('click', () => notes.close());
