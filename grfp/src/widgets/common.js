/* Shared SVG helpers for widgets. Charts read colors from CSS custom properties,
   so they follow the theme; widgets call WC.onRedraw to repaint on theme change. */
(function () {
  'use strict';
  const WC = window.WC;
  const S = (WC.svg = {});
  S.css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888';
  S.lin = (d0, d1, r0, r1) => { const k = (r1 - r0) / ((d1 - d0) || 1); const f = (x) => r0 + (x - d0) * k; f.inv = (y) => d0 + (y - r0) / k; return f; };
  S.ticks = (a, b, n = 5) => {
    const span = b - a || 1, step0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= n) || 10 * mag;
    const out = []; for (let v = Math.ceil(a / step) * step; v <= b + 1e-9; v += step) out.push(+v.toFixed(10));
    return out;
  };
  S.path = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
  S.area = (top, bot) => S.path(top) + bot.slice().reverse().map((p) => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('') + 'Z';
  /* frame({w,h,m,x:[a,b],y:[a,b],xl,yl,xt,yt,xfmt,yfmt,zero}) → {x,y,svgOpen,axes} */
  S.frame = function (o) {
    const m = Object.assign({ t: 14, r: 14, b: 38, l: 48 }, o.m || {});
    const x = S.lin(o.x[0], o.x[1], m.l, o.w - m.r), y = S.lin(o.y[0], o.y[1], o.h - m.b, m.t);
    const xt = o.xt || S.ticks(o.x[0], o.x[1], 5), yt = o.yt || S.ticks(o.y[0], o.y[1], 4);
    const xf = o.xfmt || ((v) => v), yf = o.yfmt || ((v) => v);
    let g = '';
    yt.forEach((v) => { g += `<line class="gridline" x1="${m.l}" x2="${o.w - m.r}" y1="${y(v)}" y2="${y(v)}"/><text class="svg-text" x="${m.l - 6}" y="${y(v) + 3.5}" text-anchor="end">${xfEsc(yf(v))}</text>`; });
    xt.forEach((v) => { g += `<line class="axis" x1="${x(v)}" x2="${x(v)}" y1="${o.h - m.b}" y2="${o.h - m.b + 4}"/><text class="svg-text" x="${x(v)}" y="${o.h - m.b + 16}" text-anchor="middle">${xfEsc(xf(v))}</text>`; });
    g += `<line class="axis" x1="${m.l}" x2="${o.w - m.r}" y1="${o.h - m.b}" y2="${o.h - m.b}"/>`;
    if (o.zero && o.y[0] < 0 && o.y[1] > 0) g += `<line x1="${m.l}" x2="${o.w - m.r}" y1="${y(0)}" y2="${y(0)}" stroke="${S.css('--ink-2')}" stroke-width="1.2"/>`;
    if (o.xl) g += `<text class="svg-label" x="${(m.l + o.w - m.r) / 2}" y="${o.h - 4}" text-anchor="middle">${o.xl}</text>`;
    if (o.yl) g += `<text class="svg-label" transform="translate(12 ${(m.t + o.h - m.b) / 2}) rotate(-90)" text-anchor="middle">${o.yl}</text>`;
    return { x, y, m, axes: g };
  };
  function xfEsc(s) { return WC.esc(String(s)); }
  S.svg = (w, h, inner, label) => `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${WC.esc(label || '')}" preserveAspectRatio="xMidYMid meet">${inner}</svg>`;
  /* Little helper to wire a slider with an <output>. */
  S.slider = (id, label, min, max, step, val, unit = '') => `<label class="ctl" for="${id}"><span class="ctl-row"><span>${label}</span><output id="${id}-o" for="${id}">${val}${unit}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${val}"></label>`;
  /* Voronoi cells inside a convex polygon by half-plane clipping. Deterministic. */
  S.clip = function (poly, a, b, c) { // keep a*x+b*y <= c
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      const fp = a * p[0] + b * p[1] - c, fq = a * q[0] + b * q[1] - c;
      if (fp <= 0) out.push(p);
      if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) { const t = fp / (fp - fq); out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]); }
    }
    return out;
  };
  S.voronoi = function (seeds, boundary) {
    return seeds.map((s, i) => {
      let cell = boundary.slice();
      seeds.forEach((t, j) => {
        if (i === j || cell.length < 3) return;
        const a = t[0] - s[0], b = t[1] - s[1];
        const c = (t[0] * t[0] + t[1] * t[1] - s[0] * s[0] - s[1] * s[1]) / 2;
        cell = S.clip(cell, a, b, c);
      });
      return cell;
    });
  };
  S.circlePoly = (cx, cy, r, n = 28, wob = 0, rand) => Array.from({ length: n }, (_, k) => { const t = (2 * Math.PI * k) / n; const rr = r * (1 + (wob && rand ? (rand() - .5) * wob : 0)); return [cx + rr * Math.cos(t), cy + rr * Math.sin(t)]; });
  S.polyPath = (p) => p.length ? 'M' + p.map((q) => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join('L') + 'Z' : '';
  S.centroid = (p) => { let x = 0, y = 0; p.forEach((q) => { x += q[0]; y += q[1]; }); return [x / p.length, y / p.length]; };
  S.shrink = (p, k) => { const c = S.centroid(p); return p.map((q) => [c[0] + (q[0] - c[0]) * k, c[1] + (q[1] - c[1]) * k]); };
})();
