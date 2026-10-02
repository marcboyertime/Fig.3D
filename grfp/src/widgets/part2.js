/* Part II widgets. All numbers are teaching values unless stated otherwise. */
(function () {
  'use strict';
  const WC = window.WC;
  const { esc, $, $$, rng, gauss, fmt, signed, clamp } = WC;
  const S = WC.svg;
  const bindSliders = (el, ids, fn) => ids.forEach((id) => { const i = $('#' + id, el); i.addEventListener('input', fn); });
  const val = (el, id) => +$('#' + id, el).value;
  const out = (el, id, txt) => { const o = $('#' + id + '-o', el); if (o) o.textContent = txt; };
  let wid = 0;
  const pfx = () => 'w' + (++wid);

  /* ===================== Thermal profile ===================== */
  WC.widgets.thermal = function (el) {
    const p = pfx();
    el.innerHTML = `<div class="panel"><div class="panel-head"><h2 class="p-title">Programmed versus recorded heating</h2>${WC.ev('sim')}</div>${WC.simBanner('Toy thermal model · invented temperatures and times · the proposal gives no setpoints')}
<div class="panel-body"><div class="controls">${S.slider(p + 'da', 'Dwell, precursor A (s)', 0.5, 6, 0.5, 1, '')}${S.slider(p + 'db', 'Dwell, precursor B (s)', 0.5, 12, 0.5, 5, '')}${S.slider(p + 'pk', 'Peak temperature (°C) · fixed in the pilot', 600, 1100, 10, 900, '')}${S.slider(p + 'err', 'Unrecorded temperature error on run A (°C)', -60, 60, 5, 0, '')}</div>
<div class="chart" data-c></div><div class="legend"><span><span class="sw" style="background:var(--c-co)"></span>A programmed</span><span><span class="sw" style="background:var(--c-n2)"></span>B programmed</span><span style="color:var(--c-co)"><span class="sw dash"></span><span style="color:var(--ink-2)">A as actually reached (with error)</span></span></div>
<div class="grid-3" data-m style="margin-top:.8rem"></div><div class="readout" data-r aria-live="polite"></div></div>
<div class="panel-foot">“Thermal dose” here is ∫exp(−Q/RT)dt with Q = 150 kJ mol⁻¹, a textbook stand-in for how much coarsening a history allows. It shows sensitivity, not a prediction of grain size.</div></div>`;
    const c = $('[data-c]', el), m = $('[data-m]', el), r = $('[data-r]', el);
    const ramp = 400, tau = 1.2, R = 8.314, Q = 150e3;
    function prof(dwell, peak, err) {
      const tUp = (peak - 25) / ramp, pts = [];
      for (let t = 0; t <= 20; t += 0.02) {
        let T;
        if (t < tUp) T = 25 + ramp * t;
        else if (t < tUp + dwell) T = peak;
        else T = 25 + (peak - 25) * Math.exp(-(t - tUp - dwell) / tau);
        if (err && t >= tUp * 0.6) T += err * (t < tUp + dwell ? 1 : Math.exp(-(t - tUp - dwell) / tau));
        pts.push([t, T]);
      }
      return pts;
    }
    const dose = (pts) => pts.reduce((a, [, T]) => a + Math.exp(-Q / (R * (T + 273.15))) * 0.02, 0);
    function draw() {
      const da = val(el, p + 'da'), db = val(el, p + 'db'), pk = val(el, p + 'pk'), er = val(el, p + 'err');
      out(el, p + 'da', da + ' s'); out(el, p + 'db', db + ' s'); out(el, p + 'pk', pk + ' °C'); out(el, p + 'err', (er > 0 ? '+' : '') + er + ' °C');
      const A = prof(da, pk), B = prof(db, pk), Ae = prof(da, pk, er);
      const tmax = Math.min(20, (pk - 25) / ramp + Math.max(da, db) + 6);
      const W = 720, H = 260;
      const f = S.frame({ w: W, h: H, x: [0, tmax], y: [0, 1200], yt: [0, 300, 600, 900, 1200], xl: 'time (s)', yl: 'temperature (°C)' });
      const P = (pts) => S.path(pts.filter(([t]) => t <= tmax).map(([t, T]) => [f.x(t), f.y(T)]));
      let g = f.axes;
      const tUp = (pk - 25) / ramp;
      g += `<rect x="${f.x(tUp)}" y="${f.m.t}" width="${f.x(tUp + da) - f.x(tUp)}" height="${H - f.m.b - f.m.t}" style="fill:var(--copper-soft);opacity:.6"/><rect x="${f.x(tUp)}" y="${f.m.t}" width="${f.x(tUp + db) - f.x(tUp)}" height="${H - f.m.b - f.m.t}" style="fill:var(--steel-soft);opacity:.45"/>`;
      g += `<path d="${P(B)}" style="fill:none;stroke:var(--c-n2);stroke-width:2.2"/><path d="${P(A)}" style="fill:none;stroke:var(--c-co);stroke-width:2.2"/>`;
      if (er) g += `<path d="${P(Ae)}" style="fill:none;stroke:var(--c-co);stroke-width:1.6" stroke-dasharray="5 4"/>`;
      g += `<text class="svg-text" x="${f.x(tUp) + 4}" y="${f.m.t + 12}">dwell</text>`;
      c.innerHTML = S.svg(W, H, g, `Temperature programs: A dwell ${da} s, B dwell ${db} s, peak ${pk} °C${er ? `, A actually ${er > 0 ? 'hotter' : 'cooler'} by ${Math.abs(er)} °C` : ''}.`);
      const dA = dose(A), dB = dose(B), dAe = dose(Ae);
      m.innerHTML = `<div class="stat"><small>Thermal dose B ÷ A</small><b>${fmt(dB / dA, 2)}×</b><span>the intended contrast</span></div><div class="stat${Math.abs(dAe / dA - 1) > 0.25 ? ' hi' : ''}"><small>A with error ÷ A as planned</small><b>${fmt(dAe / dA, 2)}×</b><span>from an unrecorded ${Math.abs(er)} °C</span></div><div class="stat"><small>Error as share of contrast</small><b>${dB / dA > 1.0001 ? fmt((100 * Math.abs(dAe / dA - 1)) / (dB / dA - 1), 0) + '%' : '—'}</b><span>of the B−A difference</span></div>`;
      const big = dB / dA > 1.0001 && Math.abs(dAe / dA - 1) > 0.3 * (dB / dA - 1);
      r.className = 'readout' + (big ? ' warn' : '');
      r.innerHTML = er === 0 ? 'Move the temperature-error slider. A few tens of degrees, invisible in the electrical setting, can change the thermal dose by as much as the dwell difference you are trying to study. This is why the trace, not the setpoint, is the record.' : big ? `An unrecorded ${Math.abs(er)} °C error changes A’s thermal dose by ${fmt(100 * Math.abs(dAe / dA - 1), 0)}%, a large fraction of the intended dwell contrast. Without a calibrated trace, run-to-run temperature scatter would be indistinguishable from a dwell effect.` : `At this error the dose changes by ${fmt(100 * Math.abs(dAe / dA - 1), 0)}%, small next to the dwell contrast. Larger errors, or a smaller dwell difference, would change that.`;
    }
    bindSliders(el, [p + 'da', p + 'db', p + 'pk', p + 'err'], draw);
    draw();
    return WC.onRedraw(draw);
  };

  /* ===================== Charge partition ===================== */
  WC.widgets.charge = function (el) {
    const p = pfx();
    el.innerHTML = `<div class="panel"><div class="panel-head"><h2 class="p-title">Equal charge, unequal reduction</h2>${WC.ev('sim')}</div>${WC.simBanner('Charge-accounting toy · invented loading, current and partitions · not a kinetic model')}
<div class="panel-body"><div class="controls">${S.slider(p + 'L', 'Copper loading (mg cm⁻²)', 0.1, 1.5, 0.05, 0.5)}${S.slider(p + 'f', 'Share of copper as CuO (rest Cu₂O)', 0, 100, 5, 70, '%')}${S.slider(p + 'j', 'Activation current density (mA cm⁻²)', 2, 40, 1, 10)}${S.slider(p + 't', 'Activation duration (s)', 30, 600, 10, 200)}</div>
<div class="grid-2"><div><h3 class="lab">N₂ during activation</h3>${S.slider(p + 'hn', 'Share of current to H₂ evolution', 0, 95, 5, 55, '%')}</div><div><h3 class="lab">CO during activation</h3>${S.slider(p + 'hc', 'Share to H₂ evolution', 0, 90, 5, 25, '%')}${S.slider(p + 'cc', 'Share to CO reduction products', 0, 90, 5, 45, '%')}</div></div>
<div class="chart" data-c style="margin-top:.8rem"></div><div class="legend"><span><span class="sw" style="background:var(--copper)"></span>oxide reduction</span><span><span class="sw" style="background:var(--steel)"></span>H₂ evolution</span><span><span class="sw" style="background:var(--patina)"></span>CO reduction (collected separately)</span><span><span class="sw" style="background:var(--rule-strong)"></span>left over after oxide is gone</span></div>
<div class="readout" data-r aria-live="polite"></div></div>
<div class="panel-foot">Assumes each process takes a constant share until the oxide is used up; real oxide reduction is usually front-loaded and its share changes with time. The point survives: charge passed does not fix the endpoint.</div></div>`;
    const c = $('[data-c]', el), r = $('[data-r]', el);
    function draw() {
      const L = val(el, p + 'L'), f = val(el, p + 'f') / 100, j = val(el, p + 'j'), t = val(el, p + 't');
      let hn = val(el, p + 'hn') / 100, hc = val(el, p + 'hc') / 100, cc = val(el, p + 'cc') / 100;
      if (hc + cc > 0.95) { cc = 0.95 - hc; $('#' + p + 'cc', el).value = Math.round(cc * 100); }
      out(el, p + 'L', L.toFixed(2)); out(el, p + 'f', Math.round(f * 100) + '%'); out(el, p + 'j', j); out(el, p + 't', t);
      out(el, p + 'hn', Math.round(hn * 100) + '%'); out(el, p + 'hc', Math.round(hc * 100) + '%'); out(el, p + 'cc', Math.round(cc * 100) + '%');
      const F = 96485, nCu = (L / 1000) / 63.546;
      const Qfull = F * nCu * (2 * f + (1 - f));
      const Q = (j / 1000) * t;
      const arms = [['N₂', 1 - hn, hn, 0], ['CO', 1 - hc - cc, hc, cc]].map(([name, so, sh, sc]) => {
        const qo = Math.min(Q * so, Qfull);
        const frac = qo / Qfull;
        // once oxide is consumed its share is redistributed: shown as "left over"
        const over = Q * so - qo;
        return { name, qo, qh: Q * sh, qc: Q * sc, over, frac };
      });
      const W = 720, H = 150, x0 = 70, x1 = 700, scale = (x1 - x0) / Math.max(Q, Qfull * 1.05);
      let g = '';
      arms.forEach((a, i) => {
        const y = 22 + i * 58; let x = x0;
        g += `<text class="svg-title" x="8" y="${y + 20}">${a.name}</text>`;
        [[a.qo, 'var(--copper)'], [a.over, 'var(--rule-strong)'], [a.qh, 'var(--steel)'], [a.qc, 'var(--patina)']].forEach(([q, col]) => { if (q > 1e-6) { g += `<rect x="${x}" y="${y}" width="${q * scale}" height="28" style="fill:${col}"/>`; x += q * scale; } });
        g += `<text class="svg-text" x="${x0}" y="${y + 42}">oxide reduced: ${fmt(100 * a.frac, 0)}%</text>`;
      });
      g += `<line x1="${x0 + Qfull * scale}" x2="${x0 + Qfull * scale}" y1="12" y2="138" style="stroke:var(--ink);stroke-dasharray:4 3"/><text class="svg-text" x="${x0 + Qfull * scale + 4}" y="12">charge for full reduction = ${fmt(Qfull, 2)} C cm⁻²</text>`;
      c.innerHTML = S.svg(W, H, g, `Both electrodes pass ${fmt(Q, 2)} C per square centimetre. N2: ${fmt(100 * arms[0].frac, 0)}% of oxide reduced. CO: ${fmt(100 * arms[1].frac, 0)}% reduced.`);
      const d = Math.abs(arms[0].frac - arms[1].frac);
      r.className = 'readout' + (d > 0.1 ? ' warn' : '');
      r.innerHTML = `Both electrodes passed <strong>${fmt(Q, 2)} C cm⁻²</strong>. Full reduction needs <strong>${fmt(Qfull, 2)} C cm⁻²</strong> (2 e⁻ per Cu from CuO, 1 from Cu₂O). Endpoints: N₂ <strong>${fmt(100 * arms[0].frac, 0)}%</strong> reduced, CO <strong>${fmt(100 * arms[1].frac, 0)}%</strong>. ${d > 0.1 ? 'Same charge, different copper: a structural difference between gases here could just be residual oxide.' : 'Endpoints are similar here, but only because the program passed enough charge or the partitions happen to match. It still has to be checked.'}`;
    }
    bindSliders(el, ['L', 'f', 'j', 't', 'hn', 'hc', 'cc'].map((k) => p + k), draw);
    draw();
    return WC.onRedraw(draw);
  };

  /* ===================== 2×2 calculator ===================== */
  const PRESETS = {
    none: ['No effects', [12, 12, 12, 12]],
    precursor: ['Precursor only', [10, 10, 16, 16]],
    activation: ['Activation only', [10, 16, 10, 16]],
    additive: ['Additive effects', [10, 16, 14, 20]],
    interaction: ['Interaction', [10, 16, 12, 24]],
    reversal: ['Ranking reversal', [10, 18, 16, 12]],
    erasure: ['Activation erasure', [10, 15, 16, 15]],
  };
  WC.widgets.twobytwo = function (el) {
    const p = pfx();
    let v = PRESETS.interaction[1].slice(), mode = 'explore', quiz = null, score = [0, 0];
    el.innerHTML = `<div class="panel"><div class="panel-head"><h2 class="p-title">Build a 2×2 result</h2>${WC.ev('sim')}</div>${WC.simBanner('Teaching data · invented mean values without noise · not an expected experimental effect')}
<div class="panel-body"><div class="seg" role="tablist" aria-label="Mode"><button role="tab" data-mode="explore" aria-selected="true">Explore</button><button role="tab" data-mode="predict" aria-selected="false">Predict before reveal</button></div>
<div data-explore><div class="term-list" role="group" aria-label="Scenario presets" style="margin-top:.8rem">${Object.entries(PRESETS).map(([k, [n]]) => `<button data-preset="${k}" aria-pressed="${k === 'interaction'}">${n}</button>`).join('')}</div></div>
<div class="grid-2" style="margin-top:.8rem;align-items:start"><div><div class="matrix" role="group" aria-label="Cell means, late-window n-propanol partial current density in milliamps per square centimetre"><span></span><span class="mh">Activated in N₂</span><span class="mh">Activated in CO</span>
<span class="rlab">Precursor A<br><small class="muted">dwell t₀ (ref)</small></span>${cell(p, 0, 'n2', 'A · N₂')}${cell(p, 1, 'co', 'A · CO')}
<span class="rlab">Precursor B<br><small class="muted">dwell t₁</small></span>${cell(p, 2, 'n2', 'B · N₂')}${cell(p, 3, 'co', 'B · CO')}</div><p class="small muted" style="margin-top:.4rem">mA cm⁻², late-window n-propanol partial current density.</p></div>
<div><div class="chart" data-c></div><div class="legend"><span><span class="sw" style="background:var(--c-n2)"></span>■ N₂-activated</span><span><span class="sw" style="background:var(--c-co)"></span>● CO-activated</span></div></div></div>
<div data-metrics></div><div data-predict hidden></div></div></div>`;
    function cell(p, i, cls, lab) { return `<div class="cell ${cls}"><label class="sr-only" for="${p}c${i}">${lab}</label><input id="${p}c${i}" type="number" min="0" max="60" step="1" inputmode="numeric"><small>${lab}</small></div>`; }
    const inputs = [0, 1, 2, 3].map((i) => $(`#${p}c${i}`, el));
    const c = $('[data-c]', el), met = $('[data-metrics]', el), pr = $('[data-predict]', el);
    function calc(a) {
      const [nA, cA, nB, cB] = a;
      const gA = cA - nA, gB = cB - nB;
      return { gA, gB, dod: gB - gA, prec: ((nB - nA) + (cB - cA)) / 2, act: (gA + gB) / 2 };
    }
    function classify(a, k) {
      const tol = 0.5;
      const anyP = Math.abs(k.prec) > tol || Math.abs(a[2] - a[0]) > tol, anyA = Math.abs(k.act) > tol;
      if (Math.abs(k.dod) <= tol) {
        if (!anyP && !anyA) return 'No effect of either factor, and no interaction.';
        if (anyP && anyA) return 'Two main effects and no interaction: the gas changes output by the same amount at both dwells. Parallel lines.';
        if (anyP) return 'A precursor main effect only. Activation gas does not matter, so it cannot change the precursor contrast.';
        return 'An activation main effect only. CO helps (or hurts) equally at both dwells; precursor history is irrelevant to this output.';
      }
      const revN = Math.sign(a[2] - a[0]), revC = Math.sign(a[3] - a[1]);
      if (revN && revC && revN !== revC) return 'A ranking reversal: which precursor is better depends on the activation gas. The strongest kind of interaction.';
      if (Math.abs(a[3] - a[1]) <= tol && Math.abs(a[2] - a[0]) > tol) return 'Activation erasure: the precursor contrast present after N₂ vanishes after CO. The interaction is the size of the erased contrast.';
      if (Math.abs(a[2] - a[0]) <= tol && Math.abs(a[3] - a[1]) > tol) return 'The precursor contrast appears only after CO activation: CO reveals or creates it.';
      return 'An interaction: the gas effect differs between precursors, so the precursor contrast depends on activation. Lines are not parallel even if they do not cross.';
    }
    function drawChart(a, hideNums) {
      const W = 360, H = 240;
      const max = Math.max(30, ...a) + 4;
      const f = S.frame({ w: W, h: H, x: [0, 1], y: [0, max], xt: [0, 1], xfmt: (x) => (x ? 'B (t₁)' : 'A (t₀)'), yl: 'mA cm⁻²', m: { l: 44, r: 40, b: 30 } });
      let g = f.axes;
      const L = (y0, y1, col, dash, mark) => {
        let s = `<path d="M${f.x(0)},${f.y(y0)} L${f.x(1)},${f.y(y1)}" style="fill:none;stroke:${col};stroke-width:2.6" stroke-dasharray="${dash}"/>`;
        [[0, y0], [1, y1]].forEach(([x, y]) => { s += mark === 'c' ? `<circle cx="${f.x(x)}" cy="${f.y(y)}" r="5" style="fill:${col}"/>` : `<rect x="${f.x(x) - 5}" y="${f.y(y) - 5}" width="10" height="10" style="fill:${col}"/>`; if (!hideNums) s += `<text class="svg-text" x="${f.x(x) + (x ? 10 : 10)}" y="${f.y(y) + (mark === 'c' ? -8 : 16)}" text-anchor="start">${y}</text>`; });
        return s;
      };
      g += L(a[0], a[2], 'var(--c-n2)', '7 4', 's') + L(a[1], a[3], 'var(--c-co)', '', 'c');
      return S.svg(W, H, g, `Interaction plot. A: N2 ${a[0]}, CO ${a[1]}. B: N2 ${a[2]}, CO ${a[3]}.`);
    }
    function drawExplore() {
      inputs.forEach((inp, i) => { if (document.activeElement !== inp) inp.value = v[i]; });
      const k = calc(v);
      c.innerHTML = drawChart(v);
      met.innerHTML = `<div class="grid-3" style="margin-top:1rem"><div class="stat"><small>Precursor main effect</small><b>${signed(k.prec)}</b><span>½[(B−A)<sub>N₂</sub> + (B−A)<sub>CO</sub>] = ½[(${v[2]}−${v[0]}) + (${v[3]}−${v[1]})]</span></div><div class="stat"><small>Activation main effect</small><b>${signed(k.act)}</b><span>½[g(A) + g(B)] = ½[${signed(k.gA, 0)} ${k.gB < 0 ? '−' : '+'} ${Math.abs(k.gB)}]</span></div><div class="stat hi"><small>Interaction Δ</small><b>${signed(k.dod)}</b><span>g(B) − g(A) = (${v[3]}−${v[2]}) − (${v[1]}−${v[0]})</span></div></div><div class="readout" aria-live="polite">${classify(v, k)}</div>`;
      $$('[data-preset]', el).forEach((b) => b.setAttribute('aria-pressed', String(PRESETS[b.dataset.preset][1].every((x, i) => x === v[i]))));
    }
    function newQuiz() {
      const r = Math.random;
      const base = 8 + Math.floor(r() * 8);
      const a = [base, base + Math.floor(r() * 12) - 2, base + Math.floor(r() * 10) - 3, 0];
      a[3] = Math.max(2, a[2] + Math.floor(r() * 16) - 4);
      quiz = a;
    }
    function drawPredict(revealed) {
      if (!quiz) newQuiz();
      inputs.forEach((inp, i) => { inp.value = quiz[i]; });
      const k = calc(quiz);
      c.innerHTML = drawChart(quiz);
      met.innerHTML = '';
      pr.hidden = false;
      pr.innerHTML = `<div class="predict-box"><p><strong>Predict before you calculate on paper:</strong> what is the interaction Δ = g(B) − g(A) for these four cells?</p><div class="check-num"><label class="sr-only" for="${p}pred">Your predicted interaction</label><input id="${p}pred" type="number" step="1"><button class="btn btn-sm btn-primary" data-reveal>Reveal</button><button class="btn btn-sm" data-next>New cells</button><span class="small muted">Score this session: ${score[0]}/${score[1]}</span></div><div data-fb aria-live="polite"></div></div>`;
      const fb = $('[data-fb]', pr);
      $('[data-reveal]', pr).addEventListener('click', () => {
        const g = parseFloat($(`#${p}pred`, pr).value);
        if (!Number.isFinite(g)) { fb.innerHTML = '<p class="muted small">Enter a number first.</p>'; return; }
        const ok = Math.abs(g - k.dod) < 0.01; score[1]++; if (ok) score[0]++;
        fb.innerHTML = `<p style="margin-top:.6rem"><strong style="color:${ok ? 'var(--patina)' : 'var(--st-unres)'}">${ok ? '✓ Correct.' : '✕ Not quite.'}</strong> g(A) = ${quiz[1]} − ${quiz[0]} = ${k.gA}; g(B) = ${quiz[3]} − ${quiz[2]} = ${k.gB}; Δ = ${k.gB} − ${signed(k.gA, 0).replace('+', '')} = <strong>${signed(k.dod, 0)}</strong>. Main effects: precursor ${signed(k.prec)}, activation ${signed(k.act)}. ${classify(quiz, k)}</p>`;
      });
      $('[data-next]', pr).addEventListener('click', () => { newQuiz(); drawPredict(); });
    }
    function draw() { if (mode === 'explore') { pr.hidden = true; drawExplore(); } else drawPredict(); }
    inputs.forEach((inp, i) => inp.addEventListener('input', () => { if (mode !== 'explore') return; const x = clamp(Math.round(+inp.value || 0), 0, 60); v[i] = x; drawExplore(); }));
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-preset]');
      if (b) { v = PRESETS[b.dataset.preset][1].slice(); drawExplore(); return; }
      const m = e.target.closest('[data-mode]');
      if (m) { mode = m.dataset.mode; $$('[data-mode]', el).forEach((x) => x.setAttribute('aria-selected', String(x === m))); $('[data-explore]', el).hidden = mode !== 'explore'; inputs.forEach((x) => { x.readOnly = mode !== 'explore'; }); draw(); }
    });
    draw();
    return WC.onRedraw(draw);
  };

  /* ===================== Grain terminology explorer ===================== */
  const FEATS = {
    particle: { n: 'Particle', def: 'A physically separate piece of solid. One particle can contain many grains.', scale: 'Tens to hundreds of nanometers in typical catalyst layers (illustrative).', meas: ['SEM', 'TEM'], pit: 'Particle size from SEM is not crystallite size from XRD and not grain size from TEM.', here: 'Morphology and connectivity are tracked across stages.' },
    aggregate: { n: 'Aggregate', def: 'Particles fused or stuck together. Aggregates set the pore network and electron pathways of the layer.', scale: 'Up to micrometers.', meas: ['SEM'], pit: 'An aggregate can look like one large particle at low magnification.', here: 'Part of “particle connectivity” in the proposal.' },
    crystallite: { n: 'Crystallite (coherent domain)', def: 'The region that diffracts X-rays in phase. Grain boundaries, subgrain boundaries, twins, faults and strain all interrupt it.', scale: 'Often similar to or smaller than grain size.', meas: ['XRD'], pit: 'Peak width also reflects microstrain and instrument broadening. It never gives boundary density.', here: '“Coherent-domain dimensions” from diffraction.' },
    grain: { n: 'Grain', def: 'A region of one crystal orientation, bounded by grain boundaries.', scale: '≈35 nm grains in Song et al. (their system).', meas: ['TEM', 'Orientation mapping'], pit: 'Grains are rarely visible in SEM; TEM samples few of them.', here: 'Selected, blinded TEM of grain/subgrain structure.' },
    boundary: { n: 'Grain boundary', def: 'The interface between grains of different orientation. Undercoordinated atoms there can bind adsorbates differently.', scale: 'About one atomic layer thick; density matters, not size.', meas: ['TEM', 'Orientation mapping'], pit: '“Diffraction width alone cannot identify boundaries” (P04). Song interprets grain interfaces as contributing to CO coverage; Li saw N₂-derived boundaries eliminated under CO.', here: 'The architectural feature most tied to the motivating papers.' },
    intragrain: { n: 'Intragrain domain', def: 'A smaller region inside a grain, separated by low-angle boundaries, twins or other defects.', scale: '≈10 nm intragrain features inside ≈35 nm grains in Song et al.', meas: ['TEM', 'XRD (indirectly)'], pit: 'Intragrain features shorten coherent domains, so XRD can “see” them without saying what they are.', here: 'The proposal’s “grain/subgrain structures”.' },
    roughness: { n: 'Surface roughness', def: 'Real surface area per geometric area; the bumpiness of the exposed surface.', scale: 'Atomic steps to nanometer features.', meas: ['Double-layer capacitance (ECSA)', 'SEM', 'TEM'], pit: 'More area can raise current without changing selectivity, and capacitance depends on wetting.', here: 'Not a named descriptor in the proposal; relevant context for normalization.' },
    porosity: { n: 'Porosity', def: 'Empty space within and between particles. It sets where gas and liquid can reach.', scale: 'Nanometers to micrometers.', meas: ['SEM', 'Cross-section imaging', 'Gas sorption'], pit: 'Porosity links architecture to wetting and CO access, so it can be a mediator.', here: 'Reduction creates porosity (≈40–45% volume loss per Cu).' },
    contact: { n: 'Interparticle contact', def: 'Necks where particles touch. They carry electrons and hold the layer together; heating can sinter them and reduction can open them.', scale: 'Nanometers.', meas: ['SEM', 'TEM', 'Electrical resistance'], pit: 'Loss of contact can look like loss of activity.', here: '“Particle connectivity” tracked at three stages.' },
  };
  const LENSES = { SEM: ['particle', 'aggregate', 'porosity', 'contact', 'roughness'], XRD: ['crystallite'], TEM: ['particle', 'grain', 'boundary', 'intragrain', 'contact', 'roughness'] };
  WC.widgets.grains = function (el) {
    let sel = 'grain', lens = null;
    el.innerHTML = `<div class="panel"><div class="panel-head"><h2 class="p-title">Grain terminology explorer</h2>${WC.ev('sim', 'Conceptual schematic')}</div>
<div class="panel-body"><p class="small muted">Click a term to highlight it in the drawing, or pick an instrument to see what it can observe. Not to scale; not a micrograph.</p>
<div class="term-list" role="group" aria-label="Structural terms">${Object.entries(FEATS).map(([k, f]) => `<button data-f="${k}" aria-pressed="false">${f.n}</button>`).join('')}</div>
<div class="btn-row"><span class="small muted">Instrument lens:</span><div class="seg" role="group" aria-label="Instrument lens">${Object.keys(LENSES).map((k) => `<button data-l="${k}" aria-pressed="false">${k}</button>`).join('')}<button data-l="" aria-pressed="true">None</button></div></div>
<div class="chart" data-c></div><div data-d aria-live="polite"></div></div></div>`;
    const c = $('[data-c]', el), d = $('[data-d]', el);
    // Build the static drawing once.
    const r = rng(5);
    const parts = [[150, 200, 62], [262, 170, 58], [230, 285, 52], [110, 315, 48], [345, 255, 46]];
    let gAgg = '', gPores = '', gContacts = '', idx = 0;
    gPores += [[192, 255, 18], [300, 222, 14], [168, 268, 10], [300, 300, 12]].map(([x, y, rr]) => `<circle class="f-por" cx="${x}" cy="${y}" r="${rr}"/>`).join('');
    parts.forEach(([x, y, rr], k) => {
      const bound = S.circlePoly(x, y, rr, 30, 0.12, r);
      const seeds = Array.from({ length: 5 + (k % 3) }, () => { const a = r() * 6.28, dd = Math.sqrt(r()) * rr * 0.85; return [x + dd * Math.cos(a), y + dd * Math.sin(a)]; });
      S.voronoi(seeds, bound).forEach((cell) => { idx++; gAgg += `<path class="f-grain${idx === 3 ? ' f-grain-one' : ''}" d="${S.polyPath(cell)}"/>`; });
      gAgg += `<path class="f-part${k === 0 ? ' f-part-one' : ''}" d="${S.polyPath(bound)}"/>`;
    });
    [[205, 182], [246, 228], [168, 262], [300, 268], [130, 262]].forEach(([x, y]) => { gContacts += `<ellipse class="f-con" cx="${x}" cy="${y}" rx="9" ry="6"/>`; });
    // Magnified particle
    const R2 = 120, cx = 600, cy = 230;
    const bound2 = S.circlePoly(cx, cy, R2, 60, 0.07, rng(9));
    const rough = bound2.map((q, i) => { const k2 = i % 2 ? 1.035 : 0.985; return [cx + (q[0] - cx) * k2, cy + (q[1] - cy) * k2]; });
    const seeds2 = [[560, 170], [650, 180], [610, 250], [540, 270], [680, 270], [600, 320], [520, 210]];
    const cells2 = S.voronoi(seeds2, bound2);
    let gMag = '';
    cells2.forEach((cell, i) => {
      gMag += `<path class="f-grain2${i === 2 ? ' f-grain-one' : ''}" d="${S.polyPath(cell)}"/>`;
      const ce = S.centroid(cell);
      const sub = [[ce[0] - 14, ce[1] - 10], [ce[0] + 14, ce[1] - 6], [ce[0] + 2, ce[1] + 14]];
      S.voronoi(sub, cell).forEach((sc, j) => { gMag += `<path class="f-intra${i === 2 && j === 0 ? ' f-cryst' : ''}" d="${S.polyPath(sc)}"/>`; });
    });
    gMag += cells2.map((cell) => `<path class="f-gb" d="${S.polyPath(cell)}"/>`).join('');
    gMag += `<path class="f-rough" d="${S.polyPath(rough)}"/>`;
    const svgBase = `<defs><clipPath id="mag-clip"><path d="${S.polyPath(bound2)}"/></clipPath></defs>
<rect x="20" y="360" width="400" height="34" rx="17" class="f-fiber"/><text class="svg-text" x="220" y="382" text-anchor="middle">carbon fiber</text>
<g>${gPores}</g><g>${gAgg}</g><g>${gContacts}</g>
<path class="f-agg" d="M60 210 C70 120 330 100 380 220 C410 300 300 360 180 360 C90 362 52 300 60 210 Z"/>
<line x1="${150 + 40}" y1="${200 - 40}" x2="${cx - R2 + 10}" y2="${cy - 80}" style="stroke:var(--rule-strong);stroke-dasharray:3 3"/><line x1="${150 + 40}" y1="${200 + 40}" x2="${cx - R2 + 10}" y2="${cy + 80}" style="stroke:var(--rule-strong);stroke-dasharray:3 3"/>
<g>${gMag}</g><text class="svg-text" x="${cx}" y="${cy + R2 + 26}" text-anchor="middle">one particle, magnified</text><text class="svg-text" x="220" y="80" text-anchor="middle">aggregate on a carbon fiber</text>`;
    const style = `<style>
.gx .f-grain,.gx .f-grain2{fill:var(--copper-soft);stroke:var(--copper);stroke-width:.8}
.gx .f-intra{fill:none;stroke:var(--copper);stroke-width:.6;stroke-dasharray:2 2;opacity:.7}
.gx .f-gb{fill:none;stroke:var(--copper);stroke-width:1.2}
.gx .f-part{fill:none;stroke:var(--copper);stroke-width:1.6}
.gx .f-rough{fill:none;stroke:var(--copper);stroke-width:1.4}
.gx .f-por{fill:var(--surface);stroke:var(--rule-strong);stroke-dasharray:2 2}
.gx .f-con{fill:var(--copper);opacity:.35}
.gx .f-agg{fill:none;stroke:transparent;stroke-width:2}
.gx .f-fiber{fill:var(--sunk);stroke:var(--rule-strong)}
.gx.s-particle .f-part-one,.gx.s-aggregate .f-agg{stroke:var(--st-hyp);stroke-width:3.5;stroke-dasharray:6 4}
.gx.s-grain .f-grain-one{fill:var(--st-hyp-bg);stroke:var(--st-hyp);stroke-width:2.5}
.gx.s-boundary .f-gb{stroke:var(--st-hyp);stroke-width:3.2}
.gx.s-intragrain .f-intra{stroke:var(--st-hyp);stroke-width:1.8;opacity:1}
.gx.s-crystallite .f-cryst{fill:var(--st-hyp-bg);stroke:var(--st-hyp);stroke-width:2.2;stroke-dasharray:none;opacity:1}
.gx.s-roughness .f-rough{stroke:var(--st-hyp);stroke-width:3.4}
.gx.s-porosity .f-por{fill:var(--st-hyp-bg);stroke:var(--st-hyp);stroke-width:2;stroke-dasharray:none}
.gx.s-contact .f-con{fill:var(--st-hyp);opacity:1}
.gx.dim > g, .gx.dim > path, .gx.dim > rect { opacity: .55 }
</style>`;
    function draw() {
      $$('[data-f]', el).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.f === sel)));
      $$('[data-l]', el).forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.l || null) === lens)));
      const f = FEATS[sel];
      c.innerHTML = `${style}<svg class="gx s-${sel}" viewBox="0 0 760 410" role="img" aria-label="Schematic electrode with ${esc(f.n)} highlighted.">${svgBase}</svg>`;
      const visible = lens ? LENSES[lens] : null;
      d.innerHTML = `<div class="grid-2" style="margin-top:.6rem"><div><h3 class="lab">${esc(f.n)}</h3><p>${f.def}</p><p class="small"><strong>Scale:</strong> ${f.scale}</p><p class="small"><strong>In this proposal:</strong> ${f.here}</p></div><div><h3 class="lab">Observed by</h3><p>${f.meas.map((m) => `<span class="chip">${esc(m)}</span>`).join(' ')}</p><h3 class="lab">Pitfall</h3><p class="small">${f.pit}</p>${visible ? `<div class="readout ${visible.includes(sel) ? '' : 'warn'}"><strong>${lens} lens:</strong> ${visible.includes(sel) ? `${lens} can observe this.` : `${lens} cannot observe this directly.`} It sees: ${visible.map((k) => FEATS[k].n).join(', ')}.</div>` : ''}</div></div>`;
    }
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-f]'); if (b) { sel = b.dataset.f; draw(); return; }
      const l = e.target.closest('[data-l]'); if (l) { lens = l.dataset.l || null; if (lens && !LENSES[lens].includes(sel)) sel = LENSES[lens][0]; draw(); }
    });
    draw();
  };

  /* ===================== Journey of one electrode ===================== */
  const STEPS = [
    { t: 'Coat', time: 'hour 0', do: 'The robot sprays copper nitrate onto a labeled carbon-paper sheet and dries it.', data: ['Sheet ID and spray program', 'Mass gain (loading)'], lat: 'immediate', risk: 'Uneven spray; loading drift between runs.', unk: 'Whether loading is uniform across the sheet.', ev: 'prop' },
    { t: 'Joule heat', time: 'hour 0.1', do: 'Current through the sheet heats it in seconds at the assigned dwell; the pyrometer or thermocouple records the trace.', data: ['Calibrated temperature trace'], lat: 'immediate', risk: 'Hot spots; contact resistance changes the reached temperature.', unk: 'Microstructure produced (only inferred so far).', ev: 'prop' },
    { t: 'Fast checks', time: 'hour 1', do: 'Quick, non-destructive proxies: mass, optical image, possibly a quick diffraction pattern of the precursor. Coupons are cut: one performance electrode and its companions.', data: ['Precursor phases (XRD)', 'Optical/SEM morphology', 'Companion coupons reserved'], lat: 'about an hour', risk: 'Coupons from different sheet regions differ (companion mismatch).', unk: 'Grain/subgrain structure (needs TEM).', ev: 'prop' },
    { t: 'Activate', time: 'hours 2–2.5', do: 'The electrode goes into the MEA by cassette. Under the shared current–time program it is reduced with CO or N₂ at the assigned flow. Activation products are collected separately.', data: ['Voltage during activation', 'Activation products (separate)'], lat: 'live', risk: 'Different gases leave different residual oxide; voltage differs between gases.', unk: 'The reduction endpoint, unless a companion is activated and pulled for XRD.', ev: 'prop' },
    { t: 'CO test', time: 'hours 2.5–4.5', do: 'Gas switches to CO for every electrode. A two-hour screen at fixed total current, with early and late collection windows.', data: ['Online GC (gases) each few minutes', 'Voltage', 'Liquid samples per window'], lat: 'GC within minutes', risk: 'Flooding, leaks, collection delay putting products in the wrong window.', unk: 'Liquid products, including n-propanol, until NMR runs.', ev: 'prop' },
    { t: 'Liquid NMR', time: 'hours to days later', do: 'Liquid samples join the quantitative NMR queue (often a shared instrument).', data: ['n-Propanol, ethanol, acetate amounts', 'Faradaic efficiencies, charge balance'], lat: 'hours–days', risk: 'Evaporation in storage; crossover product missed in the anolyte.', unk: 'The primary outcome until this returns.', ev: 'prop' },
    { t: 'Recover', time: 'hour ~5', do: 'The MEA is opened. The electrode is moved by air-free transfer for post-operation XRD/SEM; a sibling is deliberately air-exposed as a control.', data: ['Post-operation phases and morphology'], lat: 'hours', risk: 'Re-oxidation; relaxation without bias (Yang).', unk: 'The operando structure: never observed directly here.', ev: 'prop' },
    { t: 'TEM', time: 'days to weeks', do: 'Selected companions (endpoint or post-operation) go to blinded TEM at a shared facility.', data: ['Grain/subgrain and surface structure (selected fields)'], lat: 'days–weeks', risk: 'Sampling few fields; beam damage; companion ≠ tested electrode.', unk: 'How representative the fields are.', ev: 'prop' },
    { t: 'Join records', time: 'whenever data arrive', do: 'All data link to the sheet ID: thermal trace, loading, coupons, activation, products, structure, failures, costs, timestamps.', data: ['A complete lineage record'], lat: '—', risk: 'Broken lineage makes replication counts and holdouts impossible to audit.', unk: '—', ev: 'prop' },
  ];
  WC.widgets.journey = function (el) {
    let i = 0;
    el.innerHTML = `<div class="panel"><div class="panel-head"><h2 class="p-title">Electrode E-017, start to finish</h2>${WC.ev('pilot', 'Timings illustrative · set in the pilot')}</div>
<div class="panel-body"><div class="seg" role="tablist" aria-label="Steps" style="flex-wrap:wrap">${STEPS.map((s, k) => `<button role="tab" data-s="${k}" aria-selected="${k === 0}">${k + 1}. ${s.t}</button>`).join('')}</div><div data-d style="margin-top:1rem" aria-live="polite"></div>
<div class="btn-row"><button class="btn btn-sm" data-prev>← Previous step</button><button class="btn btn-sm btn-primary" data-next>Next step →</button></div></div></div>`;
    const d = $('[data-d]', el);
    const ALL = ['Temperature trace', 'Loading', 'Precursor XRD', 'Activation voltage', 'GC gases', 'NMR liquids (n-propanol)', 'Post-operation XRD/SEM', 'Companion TEM'];
    const avail = (k) => ({ 'Temperature trace': k >= 1, Loading: k >= 0, 'Precursor XRD': k >= 2, 'Activation voltage': k >= 3, 'GC gases': k >= 4, 'NMR liquids (n-propanol)': k >= 5, 'Post-operation XRD/SEM': k >= 6, 'Companion TEM': k >= 7 });
    function draw() {
      const s = STEPS[i], a = avail(i);
      $$('[data-s]', el).forEach((b) => b.setAttribute('aria-selected', String(+b.dataset.s === i)));
      d.innerHTML = `<div class="grid-2"><div><div class="kicker" style="margin-bottom:.3rem"><span>Step ${i + 1} of ${STEPS.length}</span><span class="k-part">${s.time}</span></div><h3 class="lab" style="margin-top:0">What you physically do</h3><p>${s.do}</p><h3 class="lab">Data recorded</h3><ul>${s.data.map((x) => `<li>${x}</li>`).join('')}</ul><p class="small"><strong>Latency:</strong> ${s.lat}</p><h3 class="lab">What can go wrong</h3><p class="small">${s.risk}</p><h3 class="lab">Still unknown at this point</h3><p class="small">${s.unk}</p></div>
<div><h3 class="lab">Knowledge state after this step</h3>${ALL.map((x) => `<div class="concept-hit ${a[x] ? 'hit' : 'miss'}"><span class="mk" aria-hidden="true">${a[x] ? '✓' : '…'}</span><span>${x}${a[x] ? '' : ' <span class="muted small">(pending)</span>'}</span></div>`).join('')}<p class="small muted" style="margin-top:.6rem">At step 5 the electrode has been tested but its primary outcome, n-propanol, is still unknown. A self-driving lab must often choose its next experiment in that state (lesson 16).</p></div></div>`;
    }
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-s]'); if (b) { i = +b.dataset.s; draw(); return; }
      if (e.target.closest('[data-prev]')) { i = Math.max(0, i - 1); draw(); }
      if (e.target.closest('[data-next]')) { i = Math.min(STEPS.length - 1, i + 1); draw(); }
    });
    draw();
  };

  /* ===================== Companion electrode ===================== */
  WC.widgets.companion = function (el) {
    const p = pfx();
    el.innerHTML = `<div class="panel"><div class="panel-head"><h2 class="p-title">How much does a companion tell you?</h2>${WC.ev('sim')}</div>${WC.simBanner('Synthetic specimens · a linear-Gaussian toy, not the proposal’s model')}
<div class="panel-body"><div class="controls">${S.slider(p + 'm', 'Preparation variability between siblings (companion mismatch)', 0, 2, 0.05, 0.4)}${S.slider(p + 'a', 'Assay error (TEM descriptor)', 0.05, 1, 0.05, 0.2)}</div>
<div class="grid-2"><div><div class="chart" data-pair></div></div><div><div class="chart" data-c></div></div></div>
<div class="grid-3" data-m style="margin-top:.6rem"></div><div class="readout" data-r aria-live="polite"></div></div>
<div class="panel-foot">Each tested electrode has a true structural descriptor s. Its companion has s + δ (mismatch, SD set by the first slider) and is measured with assay error. Conditions A and B differ in mean s by 2 units; within-condition spread of s is 0.6. Values are dimensionless.</div></div>`;
    const pair = $('[data-pair]', el), c = $('[data-c]', el), mEl = $('[data-m]', el), r = $('[data-r]', el);
    const R = rng(42);
    const base = Array.from({ length: 40 }, (_, k) => ({ cond: k % 2, u: gauss(R) * 0.6, dz: gauss(R), ez: gauss(R) }));
    function draw() {
      const sm = val(el, p + 'm'), sa = val(el, p + 'a');
      out(el, p + 'm', sm.toFixed(2)); out(el, p + 'a', sa.toFixed(2));
      const pts = base.map((b) => { const s = (b.cond ? 1 : -1) + b.u; return { s, z: s + b.dz * sm + b.ez * sa, cond: b.cond }; });
      const W = 340, H = 260;
      const f = S.frame({ w: W, h: H, x: [-4, 4], y: [-3, 3], xt: [-4, -2, 0, 2, 4], yt: [-2, 0, 2], xl: 'companion assay result', yl: 'tested electrode’s true s', m: { l: 46, b: 40 } });
      let g = f.axes + `<path d="M${f.x(-3)},${f.y(-3)} L${f.x(3)},${f.y(3)}" style="stroke:var(--rule-strong);stroke-dasharray:4 3"/>`;
      pts.forEach((q) => { const x = f.x(clamp(q.z, -4, 4)), y = f.y(q.s); g += q.cond ? `<circle cx="${x}" cy="${y}" r="4" style="fill:var(--c-co);opacity:.85"/>` : `<rect x="${x - 3.5}" y="${y - 3.5}" width="7" height="7" style="fill:var(--c-n2);opacity:.85"/>`; });
      c.innerHTML = S.svg(W, H, g, 'Scatter of companion assay results against the true descriptor of the tested electrode.') + `<div class="legend"><span>■ <span class="muted">condition A</span></span><span>● <span class="muted">condition B</span></span><span class="muted">dashed: perfect agreement</span></div>`;
      // Two-electrode picture with mismatch
      const prt = (cx, seedShift, label, col) => {
        const rr = rng(77);
        const seeds = Array.from({ length: 9 }, () => [cx + (rr() - 0.5) * 100, 120 + (rr() - 0.5) * 100]);
        const rr2 = rng(200 + seedShift);
        const sd = seeds.map((q) => [q[0] + (rr2() - 0.5) * 60 * sm, q[1] + (rr2() - 0.5) * 60 * sm]);
        const bnd = S.circlePoly(cx, 120, 58, 32, 0.08, rng(3));
        return S.voronoi(sd, bnd).map((cc) => `<path d="${S.polyPath(cc)}" style="fill:var(--copper-soft);stroke:var(--copper);stroke-width:1"/>`).join('') + `<path d="${S.polyPath(bnd)}" style="fill:none;stroke:${col};stroke-width:2"/><text class="svg-label" x="${cx}" y="200" text-anchor="middle">${label}</text>`;
      };
      pair.innerHTML = S.svg(340, 260, `<text class="svg-title" x="170" y="22" text-anchor="middle">Same run, same recipe</text>${prt(85, 0, 'performance electrode', 'var(--copper)')}${prt(255, 1, 'companion', 'var(--st-hyp)')}<text class="svg-text" x="85" y="222" text-anchor="middle">→ MEA test (products)</text><text class="svg-text" x="255" y="222" text-anchor="middle">→ TEM (destroyed)</text>`, 'Performance electrode and companion drawn with grain patterns that diverge as mismatch grows.');
      const vs = 1 + 0.36, vw = 0.36; // total var of s, within-condition var
      const R2 = vs / (vs + sm * sm + sa * sa);
      const postSD = Math.sqrt(vs * (1 - R2));
      const dprime = 2 / Math.sqrt(vw + sm * sm + sa * sa);
      mEl.innerHTML = `<div class="stat ${R2 > 0.7 ? 'ok' : R2 < 0.4 ? 'hi' : ''}"><small>Variance of s explained</small><b>${fmt(100 * R2, 0)}%</b><span>by one companion assay</span></div><div class="stat"><small>Remaining SD of s</small><b>${fmt(postSD, 2)}</b><span>prior SD ${fmt(Math.sqrt(vs), 2)}</span></div><div class="stat"><small>Separation of A vs B</small><b>${fmt(dprime, 1)}</b><span>d′ from companions</span></div>`;
      r.className = 'readout' + (R2 < 0.4 ? ' warn' : '');
      r.innerHTML = sm < 0.15 ? 'With nearly identical siblings, the companion’s precise TEM almost pins down the tested electrode. The assay error, not mismatch, limits you.' : R2 > 0.6 ? `Mismatch is noticeable but the companion still carries most of the information (${fmt(100 * R2, 0)}%). The model should widen uncertainty accordingly, not ignore it.` : `Mismatch now dominates. A very precise TEM of the companion says little about the tested electrode (${fmt(100 * R2, 0)}% of variance), so its value to the controller collapses, however sophisticated the instrument. Notice that improving assay error barely helps.`;
    }
    bindSliders(el, [p + 'm', p + 'a'], draw);
    draw();
    return WC.onRedraw(draw);
  };

  /* ===================== Product accounting ===================== */
  WC.widgets.accounting = function (el) {
    const p = pfx();
    el.innerHTML = `<div class="panel"><div class="panel-head"><h2 class="p-title">Product accounting</h2>${WC.ev('sim')}</div>${WC.simBanner('Invented Faradaic efficiencies · not expected results')}
<div class="panel-body"><div class="controls">${S.slider(p + 'j', 'Total current density (mA cm⁻²)', 20, 400, 10, 150)}${S.slider(p + 'pr', 'n-Propanol FE (true)', 0, 60, 1, 25, '%')}${S.slider(p + 'et', 'Ethanol FE (true)', 0, 50, 1, 15, '%')}${S.slider(p + 'c2', 'Ethylene FE (true)', 0, 60, 1, 30, '%')}${S.slider(p + 'h2', 'H₂ FE (true)', 0, 70, 1, 20, '%')}${S.slider(p + 'rec', 'Liquid-product recovery', 40, 100, 1, 85, '%')}</div>
<div class="chart" data-c></div><div class="legend"><span><span class="sw" style="background:var(--patina)"></span>n-propanol</span><span><span class="sw" style="background:var(--st-hyp)"></span>ethanol</span><span><span class="sw" style="background:var(--copper)"></span>ethylene</span><span><span class="sw" style="background:var(--steel)"></span>H₂</span><span><span class="sw" style="background:var(--rule-strong)"></span>unaccounted</span></div>
<div class="grid-4" data-m style="margin-top:.6rem"></div><div class="readout" data-r aria-live="polite"></div>
<div class="btn-row"><button class="btn btn-sm" data-trap>Show the ratio trap</button></div><div data-trapout></div></div>
<div class="panel-foot">Electrons per molecule from CO: n-propanol 12, ethanol 8, ethylene 8, H₂ 2. Molar rate = j·FE/(nF). Recovery here applies to the liquid alcohols (evaporation, crossover); gases are assumed fully captured.</div></div>`;
    const c = $('[data-c]', el), m = $('[data-m]', el), r = $('[data-r]', el);
    function draw() {
      const j = val(el, p + 'j'), pr = val(el, p + 'pr') / 100, et = val(el, p + 'et') / 100, c2 = val(el, p + 'c2') / 100, h2 = val(el, p + 'h2') / 100, rec = val(el, p + 'rec') / 100;
      out(el, p + 'j', j); ['pr', 'et', 'c2', 'h2', 'rec'].forEach((k) => out(el, p + k, Math.round(val(el, p + k)) + '%'));
      const sumT = pr + et + c2 + h2;
      const ap = { pr: pr * rec, et: et * rec, c2, h2 };
      const sumA = ap.pr + ap.et + ap.c2 + ap.h2;
      const W = 720, H = 120, x0 = 120, x1 = 700, sc = (x1 - x0) / Math.max(1, sumT);
      const bar = (y, vals, label) => {
        let x = x0, g = `<text class="svg-label" x="8" y="${y + 19}">${label}</text>`;
        vals.forEach(([v, col, lab]) => { if (v > 0.001) { g += `<rect x="${x}" y="${y}" width="${v * sc}" height="28" style="fill:${col}"/>`; if (v * sc > 34) g += `<text x="${x + 4}" y="${y + 18}" class="svg-text" style="fill:var(--surface)">${Math.round(v * 100)}%</text>`; x += v * sc; } });
        if (x0 + 1 * sc <= x1 + 1) g += `<line x1="${x0 + sc}" x2="${x0 + sc}" y1="${y - 4}" y2="${y + 32}" style="stroke:var(--ink);stroke-dasharray:3 3"/>`;
        return g;
      };
      let g = bar(14, [[pr, 'var(--patina)'], [et, 'var(--st-hyp)'], [c2, 'var(--copper)'], [h2, 'var(--steel)'], [Math.max(0, 1 - sumT), 'var(--rule-strong)']], 'true');
      g += bar(66, [[ap.pr, 'var(--patina)'], [ap.et, 'var(--st-hyp)'], [ap.c2, 'var(--copper)'], [ap.h2, 'var(--steel)'], [Math.max(0, 1 - sumA), 'var(--rule-strong)']], 'measured');
      c.innerHTML = S.svg(W, H, g, `True FE sum ${Math.round(sumT * 100)}%; measured sum ${Math.round(sumA * 100)}%.`);
      const F = 96485;
      const rate = (jj, n) => (jj / 1000) / (n * F) * 3600 * 1e6; // µmol h⁻¹ cm⁻²
      const jPr = j * pr, jPrA = j * ap.pr;
      const c3c2 = pr / Math.max(1e-9, et + c2), c3c2A = ap.pr / Math.max(1e-9, ap.et + ap.c2);
      m.innerHTML = `<div class="stat ok"><small>n-Propanol partial current</small><b>${fmt(jPr, 1)}</b><span>mA cm⁻² true · ${fmt(jPrA, 1)} measured</span></div><div class="stat"><small>n-Propanol rate</small><b>${fmt(rate(jPr, 12), 0)}</b><span>µmol h⁻¹ cm⁻² (true)</span></div><div class="stat ${Math.abs(1 - sumA) > 0.08 ? 'hi' : ''}"><small>Unaccounted current</small><b>${fmt(100 * (1 - sumA), 0)}%</b><span>${fmt(j * (1 - sumA), 1)} mA cm⁻² of ${j}</span></div><div class="stat"><small>C₃/C₂ (FE basis)</small><b>${fmt(c3c2, 2)}</b><span>measured ${fmt(c3c2A, 2)}</span></div>`;
      const notes = [];
      if (sumT > 1.001) notes.push(`<strong>The true FEs sum to ${Math.round(sumT * 100)}%.</strong> That is impossible; real data like this signal a calibration or flow error.`);
      if (rec < 0.98) notes.push(`Losing ${Math.round((1 - rec) * 100)}% of liquids makes n-propanol FE read ${fmt(100 * ap.pr, 1)}% instead of ${fmt(100 * pr, 1)}%, and the charge balance shows ${fmt(100 * (1 - sumA), 0)}% missing. Because ethylene is a gas and is not lost, the measured C₃/C₂ ratio is distorted too (${fmt(c3c2A, 2)} vs ${fmt(c3c2, 2)}).`);
      notes.push(`j<sub>n-propanol</sub> = ${j} × ${fmt(pr, 2)} = ${fmt(jPr, 1)} mA cm⁻². Divided by 12F, that is ${fmt(rate(jPr, 12), 0)} µmol of n-propanol per hour per cm².`);
      r.className = 'readout' + (sumT > 1.001 || rec < 0.9 ? ' warn' : '');
      r.innerHTML = notes.join(' ');
    }
    bindSliders(el, ['j', 'pr', 'et', 'c2', 'h2', 'rec'].map((k) => p + k), draw);
    $('[data-trap]', el).addEventListener('click', () => {
      $('[data-trapout]', el).innerHTML = `<div class="table-wrap"><table><thead><tr><th>Hypothetical condition</th><th class="num">n-PrOH FE</th><th class="num">C₂ FE (EtOH+C₂H₄)</th><th class="num">C₃/C₂</th><th class="num">j<sub>n-PrOH</sub> at 100 mA cm⁻²</th></tr></thead><tbody><tr><td>X</td><td class="num">30%</td><td class="num">50%</td><td class="num">0.60</td><td class="num">30</td></tr><tr><td>Y</td><td class="num">20%</td><td class="num">20%</td><td class="num">1.00</td><td class="num">20</td></tr></tbody></table></div><p class="small">Y has the “better” ratio and makes a third less n-propanol. The rest of Y’s charge went to hydrogen. This is why ratios stay diagnostic and absolute production stays primary.</p>`;
    });
    draw();
    return WC.onRedraw(draw);
  };

  /* ===================== Collection delay & windows ===================== */
  WC.widgets.collection = function (el) {
    const p = pfx();
    el.innerHTML = `<div class="panel"><div class="panel-head"><h2 class="p-title">Early and late windows, with collection delay</h2>${WC.ev('sim')}</div>${WC.simBanner('Toy model · invented rates · window boundaries are not specified in the proposal')}
<div class="panel-body"><div class="controls">${S.slider(p + 'ev', 'How the catalyst evolves during the test', -10, 10, 1, 6)}${S.slider(p + 'd', 'Liquid transport delay (min)', 0, 40, 1, 15)}${S.slider(p + 'h', 'Mixing / holdup time constant (min)', 1, 30, 1, 8)}</div>
<div class="chart" data-c></div><div class="legend"><span><span class="sw" style="background:var(--c-theta)"></span>true production rate</span><span style="color:var(--c-co)"><span class="sw dash"></span><span style="color:var(--ink-2)">rate arriving at the collector</span></span></div>
<div class="grid-2" data-m style="margin-top:.6rem"></div><div class="readout" data-r aria-live="polite"></div></div>
<div class="panel-foot">Negative evolution means output falls during the test (e.g., restructuring away from a selective state); positive means it rises. Windows: early 10–40 min, late 80–120 min, for illustration only.</div></div>`;
    const c = $('[data-c]', el), m = $('[data-m]', el), r = $('[data-r]', el);
    function draw() {
      const ev = val(el, p + 'ev'), d = val(el, p + 'd'), h = val(el, p + 'h');
      out(el, p + 'ev', (ev > 0 ? '+' : '') + ev); out(el, p + 'd', d + ' min'); out(el, p + 'h', h + ' min');
      const T = 160, dt = 0.5, n = T / dt;
      const rate = (t) => (t > 120 ? 0 : 10 + ev * (1 - Math.exp(-t / 25)));
      const tr = [], ar = [];
      let tank = 0;
      for (let k = 0; k <= n; k++) {
        const t = k * dt;
        tr.push([t, rate(t)]);
        const inflow = t - d >= 0 ? rate(t - d) : 0;
        tank += (inflow - tank) * (dt / h);
        ar.push([t, tank]);
      }
      const integ = (arr, a, b) => arr.filter(([t]) => t >= a && t < b).reduce((s, [, v]) => s + v * dt, 0) / (b - a);
      const W = 720, H = 240, f = S.frame({ w: W, h: H, x: [0, T], y: [0, 22], xt: [0, 20, 40, 60, 80, 100, 120, 140, 160], yt: [0, 5, 10, 15, 20], xl: 'minutes since the CO test started', yl: 'rate (a.u.)' });
      let g = `<rect x="${f.x(10)}" y="${f.m.t}" width="${f.x(40) - f.x(10)}" height="${H - f.m.b - f.m.t}" style="fill:var(--steel-soft)"/><rect x="${f.x(80)}" y="${f.m.t}" width="${f.x(120) - f.x(80)}" height="${H - f.m.b - f.m.t}" style="fill:var(--copper-soft)"/><text class="svg-text" x="${f.x(25)}" y="${f.m.t + 12}" text-anchor="middle">early</text><text class="svg-text" x="${f.x(100)}" y="${f.m.t + 12}" text-anchor="middle">late (primary)</text>` + f.axes;
      g += `<path d="${S.path(tr.map(([t, v]) => [f.x(t), f.y(v)]))}" style="fill:none;stroke:var(--c-theta);stroke-width:2.4"/><path d="${S.path(ar.map(([t, v]) => [f.x(t), f.y(v)]))}" style="fill:none;stroke:var(--c-co);stroke-width:2" stroke-dasharray="6 4"/><line x1="${f.x(120)}" x2="${f.x(120)}" y1="${f.m.t}" y2="${H - f.m.b}" style="stroke:var(--ink-2);stroke-dasharray:2 3"/><text class="svg-text" x="${f.x(121)}" y="${f.m.t + 26}">current off</text>`;
      c.innerHTML = S.svg(W, H, g, 'True versus collected product rate with early and late windows.');
      const tE = integ(tr, 10, 40), aE = integ(ar, 10, 40), tL = integ(tr, 80, 120), aL = integ(ar, 80, 120);
      const tail = ar.filter(([t]) => t >= 120).reduce((s, [, v]) => s + v * dt, 0);
      m.innerHTML = `<div class="stat"><small>Early window</small><b>${fmt(aE, 1)}</b><span>measured vs true ${fmt(tE, 1)} (${signed(100 * (aE / tE - 1), 0)}%)</span></div><div class="stat hi"><small>Late window (primary)</small><b>${fmt(aL, 1)}</b><span>measured vs true ${fmt(tL, 1)} (${signed(100 * (aL / tL - 1), 0)}%)</span></div>`;
      const bad = Math.abs(aE / tE - 1) > 0.1 || Math.abs(aL / tL - 1) > 0.05;
      r.className = 'readout' + (bad ? ' warn' : '');
      r.innerHTML = `${bad ? 'Uncorrected delay shifts product into the wrong window.' : 'With little delay, windows read close to the truth.'} ${ev > 0 ? 'Output rises during the test, so a lagging collector under-reads the late window.' : ev < 0 ? 'Output falls during the test, so a lagging collector over-reads the late window with earlier, higher production.' : ''} ${Math.round(tail)} units still arrive after the current stops: product that belongs to the run but not to any window unless collection continues. This is why the proposal checks “collection delay”.`;
    }
    bindSliders(el, [p + 'ev', p + 'd', p + 'h'], draw);
    draw();
    return WC.onRedraw(draw);
  };

  /* ===================== Causal pathway explorer ===================== */
  const NODES = {
    thermal: { x: 10, y: 20, t: ['Thermal processing', '(heating dwell)'], roles: [['Manipulated', 'Set by design in the pilot.']], ex: 'The synthesis factor of the 2×2. Its effects can travel through several of the paths shown, which is why each path needs its own check.', dist: 'Randomize dwell across sheets; record the actual trace.' },
    support: { x: 10, y: 120, t: ['Heated support', 'changes'], roles: [['Alternative explanation', 'If heating alters the carbon paper rather than the copper.']], ex: 'Heating can change the carbon paper’s surface and wetting independently of the copper.', dist: 'Heated-support control: heat bare paper at each dwell and compare wetting and performance with copper-free baselines.' },
    loading: { x: 10, y: 215, t: ['Loading'], roles: [['Controlled / measured', 'Set by spray, measured per sheet.'], ['Confounder', 'If it differs systematically between conditions.']], ex: 'Copper per area changes current per site, local pH and transport. If dwell runs happened to have different loading, loading would masquerade as architecture.', dist: 'Measure loading on every sheet; compare at matched loading; include it in the model.' },
    activation: { x: 10, y: 320, t: ['Activation gas', '(CO or N₂)'], roles: [['Manipulated', 'Set by design; flow and current program shared.']], ex: 'The activation factor of the 2×2.', dist: 'Randomize gas across sheets within day/channel blocks.' },
    precursor: { x: 190, y: 20, t: ['Precursor phase,', 'structure, connectivity'], roles: [['Measured', 'XRD, SEM, selected TEM before activation.'], ['Mediator', 'Of the thermal effect on everything downstream.']], ex: 'What the dwell actually produced. A contrast must exist here for there to be anything to inherit.', dist: 'Characterize before activation; confirm a reproducible contrast across independent runs.' },
    endpoint: { x: 190, y: 190, t: ['Activation endpoint', '(reduction extent, architecture)'], roles: [['Measured on companions', 'XRD for residual oxide, SEM, TEM.'], ['Mediator', 'If gas changes architecture.'], ['Confounder', 'If gas only changes how far reduction went.']], ex: 'The same measured difference can mean a real architectural effect of the gas, or merely incomplete reduction under one gas.', dist: 'Measure oxide fraction at the endpoint; extend activation to match oxide fraction and see whether the contrast persists.' },
    working: { x: 370, y: 100, t: ['Working Cu', '(latent, under bias)'], roles: [['Latent', 'Never observed directly without operando methods.'], ['Mediator', 'The thing the hypothesis is ultimately about.']], ex: 'The structure that actually makes products. Everything you know about it is inferred from endpoint and recovered measurements and from products.', dist: 'Optional operando measurements; otherwise bracket it between endpoint and post-operation states.' },
    recovered: { x: 370, y: 10, t: ['Recovered structure', '(postmortem XRD/TEM)'], roles: [['Measured proxy', 'Of the working state.'], ['Measurement artifact', 'Air exposure, bias removal, beam damage.']], ex: 'Recovered samples can differ from the working state (Yang: nanograins → Cu₂O nanocubes in air).', dist: 'Air-free transfer checked against deliberate exposure; compare with endpoint measurements.' },
    wetting: { x: 370, y: 210, t: ['Wetting / flooding'], roles: [['Mediator', 'If architecture changes porosity and hydrophobicity.'], ['Confounder', 'If caused by assembly or support differences.']], ex: 'Flooding starves the catalyst of CO and favors hydrogen (Xu). Its role depends entirely on what caused it.', dist: 'Wetting tests on companions or controls; check whether wetting differences track architecture or assembly.' },
    ionomer: { x: 190, y: 400, t: ['Ionomer / assembly', 'variation'], roles: [['Nuisance / confounder', 'Unless standardized and balanced.']], ex: 'How ionomer and membrane are applied changes interfaces. Not part of the hypothesis.', dist: 'Standardize; balance by day and channel; record.' },
    coaccess: { x: 370, y: 310, t: ['CO access'], roles: [['Mediator', 'Architecture → porosity → CO access.'], ['Confounder', 'If flow or flooding differ for unrelated reasons.']], ex: '“Transport can mediate a structural effect rather than invalidate it.”', dist: 'CO-access tests; vary CO partial pressure or flow (background method) and see whether the contrast tracks transport.' },
    ph: { x: 550, y: 310, t: ['Local pH'], roles: [['Latent', 'Hard to measure in an MEA.'], ['Mediator or confounder', 'Depends on cause.']], ex: 'Reduction makes hydroxide at the surface; architecture, loading and current change the local pH, which shifts product selectivity.', dist: 'Match current and loading; acknowledge it cannot be measured directly here.' },
    contam: { x: 550, y: 10, t: ['Contamination', '(e.g., Ir from anode)'], roles: [['Alternative explanation', 'Can change hydrogen evolution independently of structure.']], ex: 'Xu et al. identified anode-derived iridium contamination as a main cause of excess hydrogen in CO MEAs.', dist: 'ICP-OES of electrolyte and electrodes; check whether contamination tracks condition.' },
    reactor: { x: 550, y: 410, t: ['Reactor channel / day'], roles: [['Blocked nuisance', 'Balanced across conditions.']], ex: 'A channel or a day can perform differently. Balanced, it adds noise; aligned with a treatment, it adds bias.', dist: 'Block by day and channel; include as random effects; check residuals by block.' },
    products: { x: 550, y: 160, t: ['True product', 'formation'], roles: [['Latent outcome', 'What the electrode actually makes.']], ex: 'Only observed through the collection and analysis chain.', dist: '—' },
    recovery: { x: 730, y: 300, t: ['Recovery, crossover,', 'collection delay'], roles: [['Measurement artifact', 'Changes what you count, not what was made.']], ex: 'Volatile loss, crossover to the anode (where Xu saw ethanol oxidized) and delay all distort the measured outcome.', dist: 'Spike recovery, charge balance, measured delay and outlet flow; analyze anolyte.' },
    measured: { x: 730, y: 160, t: ['Measured late-window', 'j(n-propanol)'], roles: [['Measured outcome', 'The primary response.']], ex: 'Everything else on this map either causes it, mediates it, or distorts it.', dist: '—' },
  };
  const EDGES = [['thermal', 'precursor'], ['thermal', 'support'], ['precursor', 'endpoint'], ['activation', 'endpoint'], ['endpoint', 'working'], ['working', 'products'], ['working', 'recovered', 'alt'], ['products', 'measured'], ['recovery', 'measured', 'alt'], ['endpoint', 'wetting'], ['support', 'wetting'], ['ionomer', 'wetting'], ['wetting', 'coaccess'], ['ionomer', 'coaccess'], ['coaccess', 'products'], ['loading', 'ph'], ['loading', 'products'], ['working', 'ph'], ['ph', 'products'], ['contam', 'products'], ['reactor', 'products']];
  const PATHS = {
    structural: { n: 'Structural route', e: [['thermal', 'precursor'], ['precursor', 'endpoint'], ['activation', 'endpoint'], ['endpoint', 'working'], ['working', 'products'], ['products', 'measured']], d: 'The hypothesis: processing and activation shape the working copper, which shapes products.' },
    transport: { n: 'Transport as mediator', e: [['thermal', 'precursor'], ['precursor', 'endpoint'], ['endpoint', 'wetting'], ['wetting', 'coaccess'], ['coaccess', 'products'], ['products', 'measured']], d: 'Architecture works by changing wetting and CO access. Still a real effect of processing; do not adjust it away.' },
    nuisance: { n: 'Nuisance routes', e: [['ionomer', 'wetting'], ['wetting', 'coaccess'], ['coaccess', 'products'], ['contam', 'products'], ['reactor', 'products'], ['loading', 'products'], ['support', 'wetting'], ['products', 'measured']], d: 'Assembly, contamination, reactor, loading and support changes can produce output differences unrelated to catalyst structure.' },
    artifact: { n: 'Measurement artifacts', e: [['recovery', 'measured'], ['working', 'recovered']], d: 'What you count (recovery, delay, crossover) and what you image (air, bias removal) can differ from what happened.' },
  };
  WC.widgets.causal = function (el) {
    let sel = 'wetting', path = 'transport';
    el.innerHTML = `<div class="panel"><div class="panel-head"><h2 class="p-title">Causal pathway explorer</h2>${WC.ev('bgd', 'Teaching causal map')}</div>
<div class="panel-body"><p class="small muted">Select a route to highlight it, then select any box (click, or Tab and Enter) to see its role. Roles depend on context: several boxes have more than one.</p>
<div class="seg" role="group" aria-label="Highlight a route">${Object.entries(PATHS).map(([k, v]) => `<button data-p="${k}" aria-pressed="${k === path}">${v.n}</button>`).join('')}</div>
<div class="chart" data-c style="margin-top:.7rem;overflow-x:auto"></div><div class="readout neutral" data-pd></div><div data-d aria-live="polite"></div></div>
<div class="panel-foot">A simplified map assembled for teaching from the proposal’s controls and the cited papers. A real analysis would justify each arrow. Dashed arrows: measurement relationships rather than physical causes.</div></div>`;
    const c = $('[data-c]', el), d = $('[data-d]', el), pd = $('[data-pd]', el);
    const NW = 158, NH = 46;
    function draw() {
      const on = new Set((PATHS[path] ? PATHS[path].e : []).map((e) => e.join('>')));
      let g = `<defs><marker id="dag-a" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" style="fill:var(--rule-strong)"/></marker><marker id="dag-a2" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" style="fill:var(--copper)"/></marker></defs>`;
      EDGES.forEach(([a, b, alt]) => {
        const A = NODES[a], B = NODES[b];
        const ax = A.x + NW / 2, ay = A.y + NH / 2, bx = B.x + NW / 2, by = B.y + NH / 2;
        const dx = bx - ax, dy = by - ay;
        const tx = Math.abs(dx) / (NW / 2 + 4), ty = Math.abs(dy) / (NH / 2 + 4);
        const s = 1 / Math.max(tx, ty);
        const x2 = bx - dx * s, y2 = by - dy * s, x1 = ax + dx * s, y1 = ay + dy * s;
        const hot = on.has(a + '>' + b);
        g += `<path class="dag-edge${hot ? ' on' : ''}${alt ? ' alt' : ''}" d="M${x1},${y1} L${x2},${y2}" marker-end="url(#${hot ? 'dag-a2' : 'dag-a'})"/>`;
      });
      Object.entries(NODES).forEach(([k, n]) => {
        g += `<g class="dag-node${k === sel ? ' sel' : ''}" tabindex="0" role="button" aria-pressed="${k === sel}" aria-label="${esc(n.t.join(' '))}: ${esc(n.roles.map((r) => r[0]).join(', '))}" data-n="${k}"><rect x="${n.x}" y="${n.y}" width="${NW}" height="${NH}" rx="8"/>${n.t.map((line, i) => `<text x="${n.x + NW / 2}" y="${n.y + (n.t.length === 1 ? 27 : 19 + i * 15)}" text-anchor="middle">${esc(line)}</text>`).join('')}</g>`;
      });
      c.innerHTML = `<svg viewBox="0 0 900 460" style="min-width:640px" role="group" aria-label="Causal map of processing, structure, transport and measurement">${g}</svg>`;
      pd.innerHTML = PATHS[path] ? `<strong>${PATHS[path].n}.</strong> ${PATHS[path].d}` : '';
      const n = NODES[sel];
      d.innerHTML = `<div class="grid-2" style="margin-top:.6rem"><div><h3 class="lab">${esc(n.t.join(' '))}</h3><p>${n.ex}</p></div><div><h3 class="lab">Role(s)</h3>${n.roles.map(([r, why]) => `<p class="small" style="margin:.2rem 0"><span class="chip">${esc(r)}</span> ${why}</p>`).join('')}<h3 class="lab">What experiment would distinguish it?</h3><p class="small">${n.dist}</p></div></div>`;
      $$('.dag-node', c).forEach((g2) => {
        g2.addEventListener('click', () => { sel = g2.dataset.n; draw(); const f = $(`.dag-node[data-n="${sel}"]`, c); f && f.focus(); });
        g2.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sel = g2.dataset.n; draw(); const f = $(`.dag-node[data-n="${sel}"]`, c); f && f.focus(); } });
      });
      $$('[data-p]', el).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.p === path)));
    }
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-p]'); if (b) { path = b.dataset.p; draw(); } });
    draw();
  };

  /* ===================== Nested replication exercise ===================== */
  WC.widgets.nested = function (el) {
    const p = pfx();
    el.innerHTML = `<div class="panel"><div class="panel-head"><h2 class="p-title">Count the independent preparations</h2>${WC.ev('sim', 'Exercise')}</div>
<div class="panel-body"><p>A pilot produces: <strong>4 independent heated sheets</strong>, <strong>3 coupons per sheet</strong>, <strong>10 microscopy fields per coupon</strong>, <strong>5 GC injections per test</strong>.</p>
<div class="nest" aria-hidden="true">
<div class="nest-level"><b>Heated sheets (independent runs)</b><div class="dots">${'<span class="dot ind"></span>'.repeat(4)}</div></div>
<div class="nest-level"><b>Coupons (3 per sheet)</b><div class="dots">${'<span class="dot"></span>'.repeat(12)}</div></div>
<div class="nest-level"><b>Fields (10 per coupon)</b><div class="dots">${'<span class="dot" style="width:6px;height:6px"></span>'.repeat(120)}</div></div>
<div class="nest-level"><b>GC injections (5 per test)</b><div class="dots">${'<span class="dot" style="width:6px;height:6px"></span>'.repeat(60)}</div></div></div>
<p class="sr-only">Four sheets; twelve coupons; one hundred twenty fields; sixty GC injections if every coupon is tested.</p>
<div class="check-num" style="margin-top:.8rem"><label for="${p}n">How many independent precursor preparations?</label><input id="${p}n" type="number" min="0" step="1" style="width:7rem"><button class="btn btn-sm btn-primary" data-ok>Check</button></div><div data-fb aria-live="polite"></div>
<h3 class="lab">Which level is the replicate? It depends on the claim.</h3><div class="seg" role="group" aria-label="Claim">${[['proc', 'Processing effect'], ['elec', 'Coupon-to-coupon variation'], ['field', 'Local heterogeneity'], ['gc', 'GC repeatability']].map(([k, n], i) => `<button data-q="${k}" aria-pressed="${i === 0}">${n}</button>`).join('')}</div><div class="readout neutral" data-qd style="margin-top:.6rem"></div></div></div>`;
    const Q = {
      proc: 'For “dwell × gas changes n-propanol output,” the unit is the heated sheet: n = 4 (split across conditions, fewer per cell). Everything below it is nested.',
      elec: 'For “how different are coupons cut from one sheet?” (companion mismatch), coupons are the replicates: 12 coupons, nested in 4 sheets.',
      field: 'For “how heterogeneous is one coupon?”, fields are replicates within a coupon. Ten fields describe that coupon well; they do not make it ten coupons.',
      gc: 'For “how repeatable is the GC?”, injections are replicates. This is about the instrument, not the catalyst.',
    };
    const fb = $('[data-fb]', el), qd = $('[data-qd]', el);
    qd.textContent = Q.proc;
    $('[data-ok]', el).addEventListener('click', () => {
      const v = +$(`#${p}n`, el).value;
      const ok = v === 4;
      fb.innerHTML = `<p style="margin-top:.5rem"><strong style="color:${ok ? 'var(--patina)' : 'var(--st-unres)'}">${ok ? '✓ Four.' : `✕ ${Number.isFinite(v) ? v : 'That'} is not the count of independent preparations.`}</strong> ${ok ? '' : v === 12 ? 'Twelve counts coupons, which share a sheet’s heating run. ' : v >= 120 ? 'That counts nested measurements as if each were a new synthesis: pseudoreplication. ' : ''}Only the four heating runs are independent applications of the processing treatment. Coupons, fields and injections improve how precisely each preparation is described.</p>`;
      if (WC.state) { const q = WC.state.quiz['q-pseudo'] = WC.state.quiz['q-pseudo'] || { n: 0, right: 0 }; q.n++; if (ok) q.right++; q.last = ok; q.ts = Date.now(); WC.save(); }
    });
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-q]'); if (b) { $$('[data-q]', el).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); qd.textContent = Q[b.dataset.q]; } });
  };

  /* ===================== Variance components ===================== */
  WC.widgets.variance = function (el) {
    const p = pfx();
    el.innerHTML = `<div class="panel"><div class="panel-head"><h2 class="p-title">Where precision comes from</h2>${WC.ev('sim')}</div>${WC.simBanner('Teaching variance components · not estimates for this system')}
<div class="panel-body"><div class="controls">${S.slider(p + 'n', 'Independent sheets per 2×2 cell', 2, 12, 1, 3)}${S.slider(p + 'm', 'Coupons tested per sheet', 1, 4, 1, 1)}${S.slider(p + 'f', 'Measurements per coupon (fields, windows)', 1, 50, 1, 10)}</div>
<div class="chart" data-c></div><div class="grid-3" data-m style="margin-top:.6rem"></div><div class="readout" data-r aria-live="polite"></div></div>
<div class="panel-foot">σ<sub>sheet</sub> = 3, σ<sub>coupon</sub> = 1.5, σ<sub>measurement</sub> = 2 (mA cm⁻²). SE(cell mean) = √(σ<sub>s</sub>²/n + σ<sub>c</sub>²/(nm) + σ<sub>e</sub>²/(nmf)); SE(Δ) = 2·SE(cell mean) for four independent cells.</div></div>`;
    const c = $('[data-c]', el), m = $('[data-m]', el), r = $('[data-r]', el);
    const ss = 3, sc = 1.5, se = 2;
    const SE = (n, mm, f) => 2 * Math.sqrt(ss * ss / n + sc * sc / (n * mm) + se * se / (n * mm * f));
    function draw() {
      const n = val(el, p + 'n'), mm = val(el, p + 'm'), f = val(el, p + 'f');
      out(el, p + 'n', n); out(el, p + 'm', mm); out(el, p + 'f', f);
      const W = 720, H = 220, F = S.frame({ w: W, h: H, x: [1, 50], y: [0, 8], xt: [1, 10, 20, 30, 40, 50], yt: [0, 2, 4, 6, 8], xl: 'measurements per coupon', yl: 'SE of interaction Δ' });
      let g = F.axes;
      const pts = Array.from({ length: 50 }, (_, k) => [F.x(k + 1), F.y(SE(n, mm, k + 1))]);
      const naive = Array.from({ length: 50 }, (_, k) => [F.x(k + 1), F.y(Math.min(8, 2 * Math.sqrt((ss * ss + sc * sc + se * se) / (n * mm * (k + 1)))))]);
      const floor = 2 * ss / Math.sqrt(n);
      g += `<line x1="${F.x(1)}" x2="${F.x(50)}" y1="${F.y(floor)}" y2="${F.y(floor)}" style="stroke:var(--st-unres);stroke-dasharray:5 4"/><text class="svg-text" x="${F.x(50)}" y="${F.y(floor) - 5}" text-anchor="end">floor set by sheets: 2σ_sheet/√n = ${fmt(floor, 2)}</text>`;
      g += `<path d="${S.path(pts)}" style="fill:none;stroke:var(--c-theta);stroke-width:2.6"/><path d="${S.path(naive)}" style="fill:none;stroke:var(--c-co);stroke-width:1.8" stroke-dasharray="6 4"/><circle cx="${F.x(f)}" cy="${F.y(SE(n, mm, f))}" r="5" style="fill:var(--c-theta)"/>`;
      c.innerHTML = S.svg(W, H, g, `Standard error of the interaction versus measurements per coupon, with ${n} sheets per cell.`) + `<div class="legend"><span><span class="sw" style="background:var(--c-theta)"></span>correct SE (respects nesting)</span><span style="color:var(--c-co)"><span class="sw dash"></span><span style="color:var(--ink-2)">naive SE (treats every measurement as independent)</span></span></div>`;
      const cur = SE(n, mm, f), nv = 2 * Math.sqrt((ss * ss + sc * sc + se * se) / (n * mm * f));
      m.innerHTML = `<div class="stat ok"><small>SE(Δ), correct</small><b>${fmt(cur, 2)}</b><span>mA cm⁻²</span></div><div class="stat hi"><small>SE(Δ), pseudoreplicated</small><b>${fmt(nv, 2)}</b><span>${fmt(cur / nv, 1)}× too optimistic</span></div><div class="stat"><small>Total measurements</small><b>${4 * n * mm * f}</b><span>from ${4 * n} independent sheets</span></div>`;
      r.innerHTML = `Past a few measurements per coupon, the curve flattens onto the floor set by sheet-to-sheet variation. Only more independent sheets lower that floor: going from ${n} to ${n * 2} sheets per cell would cut it to ${fmt(2 * ss / Math.sqrt(2 * n), 2)}. Treating ${4 * n * mm * f} measurements as independent claims precision the experiment does not have.`;
    }
    bindSliders(el, [p + 'n', p + 'm', p + 'f'], draw);
    draw();
    return WC.onRedraw(draw);
  };

  /* ===================== Claim ladder ===================== */
  const RUNGS = [
    { n: 'Processing effect', d: 'The precursor contrast in products changes with activation gas: a synthesis × activation interaction in the measured output.', items: [
      ['r1a', 'Independent coating/heating runs in every cell, day and channel balanced'],
      ['r1b', 'Product accounting validated: recovery, delay, crossover, charge balance'],
      ['r1c', 'Interaction interval excludes the predeclared meaningful bound'],
      ['r1d', 'Activation products kept separate from the test products'] ] },
    { n: 'Structural interpretation', d: 'The interaction is carried, at least in part, by architecture that survives (or not) depending on gas.', items: [
      ['r2a', 'Structural contrasts at the activation endpoint and after operation, gas-dependent in the same way'],
      ['r2b', 'Oxide fraction matched or accounted for (reduction extent is not the explanation)'],
      ['r2c', 'Alternatives constrained: loading, heated support, contamination, wetting/CO access'],
      ['r2d', 'Matched-oxide cooling-history route consistent with the structure–performance relationship'],
      ['r2e', 'Prediction validated on a new, independent preparation'] ] },
    { n: 'Specific catalytic mechanism', d: 'A particular site (e.g., a boundary type or adparticle) and pathway produce n-propanol. Not promised by the proposal.', items: [
      ['r3a', 'Operando or site-sensitive evidence of the proposed site under reaction conditions'],
      ['r3b', 'Mechanism-specific tests (e.g., isotope labeling, kinetic orders, CO partial-pressure dependence) that discriminate pathways'],
      ['r3c', 'Competing mechanisms explicitly excluded, not just one consistent story'] ] },
  ];
  WC.widgets.ladder = function (el) {
    const checked = new Set();
    el.innerHTML = `<div class="panel"><div class="panel-head"><h2 class="p-title">The claim ladder</h2>${WC.ev('prop', 'Interpretation rules from the proposal')}</div>
<div class="panel-body"><p class="small muted">Tick the evidence you have (hypothetically). The ladder shows the highest claim it licenses. Each rung requires every item on it and on the rungs below.</p>
<div class="btn-row"><span class="small muted">Scenarios:</span><button class="btn btn-sm" data-sc="products">Replicated product interaction only</button><button class="btn btn-sm" data-sc="good">A strong outcome of this proposal</button><button class="btn btn-sm" data-sc="tem">Beautiful TEM, no replication</button><button class="btn btn-sm" data-sc="clear">Clear</button></div>
<div class="ladder" data-l></div><div class="readout" data-r aria-live="polite"></div></div></div>`;
    const L = $('[data-l]', el), r = $('[data-r]', el);
    const SC = { products: ['r1a', 'r1b', 'r1c', 'r1d'], good: ['r1a', 'r1b', 'r1c', 'r1d', 'r2a', 'r2b', 'r2c', 'r2d', 'r2e'], tem: ['r2a', 'r3a'], clear: [] };
    function level() { let lv = 0; for (let i = 0; i < RUNGS.length; i++) { if (RUNGS[i].items.every(([k]) => checked.has(k))) lv = i + 1; else break; } return lv; }
    function draw() {
      const lv = level();
      L.innerHTML = RUNGS.map((rg, i) => `<div class="rung${i < lv ? ' reached' : ''}"><span class="rn">${i + 1}</span><div><h3 class="lab">${rg.n}${i < lv ? ' · supported' : ''}</h3><p>${rg.d}</p>${rg.items.map(([k, t]) => `<label class="check-row"><input type="checkbox" data-k="${k}"${checked.has(k) ? ' checked' : ''}><span>${t}</span></label>`).join('')}</div></div>`).join('');
      const missing = lv < 3 ? RUNGS[lv].items.filter(([k]) => !checked.has(k)).map(([, t]) => t) : [];
      const stray = RUNGS.slice(lv + 1).some((rg) => rg.items.some(([k]) => checked.has(k)));
      r.className = 'readout' + (lv === 0 ? ' warn' : '');
      r.innerHTML = `<strong>Strongest supported claim: ${lv === 0 ? 'none yet' : RUNGS[lv - 1].n.toLowerCase()}.</strong> ${lv < 3 ? `To reach “${RUNGS[lv].n.toLowerCase()}” you still need: ${missing.join('; ')}.` : 'All three rungs. This goes beyond what the proposal promises.'}${stray ? ' Evidence ticked on a higher rung does not count until the rungs below are complete: a striking micrograph without a replicated processing effect supports no general claim.' : ''}`;
    }
    L.addEventListener('change', (e) => { const k = e.target.dataset.k; if (!k) return; e.target.checked ? checked.add(k) : checked.delete(k); draw(); const f = $(`[data-k="${k}"]`, L); f && f.focus(); });
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-sc]'); if (b) { checked.clear(); SC[b.dataset.sc].forEach((k) => checked.add(k)); draw(); } });
    draw();
  };

  /* ===================== Equivalence interval ===================== */
  WC.widgets.interval = function (el) {
    const p = pfx();
    el.innerHTML = `<div class="panel"><div class="panel-head"><h2 class="p-title">Supported, equivalent or unresolved?</h2>${WC.ev('sim')}</div>${WC.simBanner('Invented estimates · the meaningful bound is not specified in the proposal')}
<div class="panel-body"><div class="btn-row"><span class="small muted">Examples:</span><button class="btn btn-sm" data-ex="sup">Supported</button><button class="btn btn-sm" data-ex="eq">Equivalent</button><button class="btn btn-sm" data-ex="un">Unresolved</button><button class="btn btn-sm" data-ex="tiny">Nonzero but negligible</button></div>
<div class="controls">${S.slider(p + 'e', 'Interaction estimate (mA cm⁻²)', -10, 10, 0.5, -1)}${S.slider(p + 'w', 'Interval half-width', 0.5, 10, 0.5, 6)}${S.slider(p + 'b', 'Predeclared meaningful bound ±δ', 1, 8, 0.5, 3)}</div>
<div class="chart" data-c></div><div class="readout" data-r aria-live="polite"></div></div></div>`;
    const c = $('[data-c]', el), r = $('[data-r]', el);
    const EX = { sup: [6, 2, 3], eq: [-0.5, 1.5, 3], un: [1, 6, 3], tiny: [0.6, 0.3, 3] };
    function draw() {
      const e = val(el, p + 'e'), w = val(el, p + 'w'), b = val(el, p + 'b');
      out(el, p + 'e', signed(e, 1)); out(el, p + 'w', '±' + w); out(el, p + 'b', '±' + b);
      const lo = e - w, hi = e + w;
      const W = 720, H = 120, x = S.lin(-15, 15, 30, 690);
      let g = `<rect x="${x(-b)}" y="20" width="${x(b) - x(-b)}" height="60" style="fill:var(--patina-soft)"/><text class="svg-text" x="${x(0)}" y="16" text-anchor="middle">equivalence region ±${b}</text>`;
      for (let t = -15; t <= 15; t += 5) g += `<line x1="${x(t)}" x2="${x(t)}" y1="84" y2="89" class="axis"/><text class="svg-text" x="${x(t)}" y="103" text-anchor="middle">${t}</text>`;
      g += `<line x1="30" x2="690" y1="84" y2="84" class="axis"/><line x1="${x(0)}" x2="${x(0)}" y1="20" y2="84" style="stroke:var(--ink-2);stroke-dasharray:3 3"/>`;
      g += `<line x1="${x(Math.max(-15, lo))}" x2="${x(Math.min(15, hi))}" y1="50" y2="50" style="stroke:var(--ink);stroke-width:4"/><circle cx="${x(e)}" cy="50" r="7" style="fill:var(--copper)"/>`;
      c.innerHTML = S.svg(W, H, g, `Interval from ${fmt(lo, 1)} to ${fmt(hi, 1)}; equivalence bounds plus or minus ${b}.`);
      let v, cls = '', tag;
      if (lo > -b && hi < b) { if (lo > 0 || hi < 0) { v = 'Statistically nonzero but practically equivalent: the whole interval sits inside the bounds, so the interaction is too small to matter.'; } else v = 'Equivalent: the whole interval sits inside ±δ. This argues against a meaningful interaction, an informative negative.'; tag = 'est'; }
      else if (lo >= b || hi <= -b) { v = 'Supported: the whole interval lies beyond a meaningful bound. With replication and controls, this supports the interaction (rung 1).'; tag = 'hyp'; }
      else if (lo > 0 || hi < 0) { v = 'Detected but not shown to be meaningful: the interval excludes zero yet overlaps the equivalence region. Unresolved on importance.'; tag = 'unres'; cls = ' warn'; }
      else { v = 'Unresolved: the interval includes zero and meaningful values. “Not significant” here does not mean “no interaction.” More independent preparations are needed.'; tag = 'unres'; cls = ' warn'; }
      r.className = 'readout' + cls;
      r.innerHTML = `${WC.ev(tag, tag === 'hyp' ? 'Supports H1' : tag === 'est' ? 'Informative negative' : 'Unresolved')} Interval [${fmt(lo, 1)}, ${fmt(hi, 1)}]. ${v}`;
    }
    bindSliders(el, [p + 'e', p + 'w', p + 'b'], draw);
    el.addEventListener('click', (ev) => { const bt = ev.target.closest('[data-ex]'); if (!bt) return; const [e, w, b] = EX[bt.dataset.ex]; $('#' + p + 'e', el).value = e; $('#' + p + 'w', el).value = w; $('#' + p + 'b', el).value = b; draw(); });
    draw();
    return WC.onRedraw(draw);
  };
})();
