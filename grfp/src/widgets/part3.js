/* Part III widgets: the self-driving lab. */
(function () {
  'use strict';
  const WC = window.WC;
  const { esc, $, $$, rng, gauss, fmt, signed, clamp } = WC;
  const S = WC.svg;
  let wid = 0;
  const pfx = () => 'x' + (++wid);
  const val = (el, id) => +$('#' + id, el).value;
  const out = (el, id, txt) => { const o = $('#' + id + '-o', el); if (o) o.textContent = txt; };
  const bind = (el, ids, fn) => ids.forEach((id) => $('#' + id, el).addEventListener('input', fn));
  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- small linear algebra for Gaussian models ---------- */
  function chol(A) {
    const n = A.length, L = A.map(() => new Array(n).fill(0));
    for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
      let s = A[i][j];
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      L[i][j] = i === j ? Math.sqrt(Math.max(s, 1e-12)) : s / L[j][j];
    }
    return L;
  }
  function solveL(L, b) { const n = b.length, x = new Array(n); for (let i = 0; i < n; i++) { let s = b[i]; for (let k = 0; k < i; k++) s -= L[i][k] * x[k]; x[i] = s / L[i][i]; } return x; }
  function solveLT(L, b) { const n = b.length, x = new Array(n); for (let i = n - 1; i >= 0; i--) { let s = b[i]; for (let k = i + 1; k < n; k++) s -= L[k][i] * x[k]; x[i] = s / L[i][i]; } return x; }

  /* ===================== Station map ===================== */
  const ST = {
    spray: { x: 10, y: 20, t: 'Spray coater', k: 'robotic', d: 'Robot sprays copper nitrate onto labeled carbon paper.', data: 'Spray program, mass gain', lat: 'minutes', build: 'Nozzle path, drying, mass logging.' },
    heater: { x: 190, y: 20, t: 'Joule heater', k: 'robotic', d: 'Clamps the sheet and passes current; a calibrated pyrometer or thermocouple records temperature.', data: 'Temperature trace', lat: 'seconds', build: 'Electrodes, power supply control, temperature calibration.' },
    inline: { x: 370, y: 20, t: 'Inline checks', k: 'robotic', d: 'Balance, camera and possibly a quick diffraction pattern; coupons cut, companions reserved.', data: 'Loading, image, precursor phases', lat: 'about an hour', build: 'Cutting fixture; specimen IDs.' },
    cassette: { x: 550, y: 20, t: 'Cassette handler', k: 'robotic', d: 'Moves electrodes in standardized cassettes into and out of the cell.', data: 'Specimen location, assembly log', lat: 'minutes', build: 'Cassette design that seals reproducibly.' },
    mea: { x: 740, y: 95, t: 'MEA test station', k: 'robotic', d: 'Runs the activation program and the two-hour CO test at fixed total current.', data: 'Voltage, current, timing', lat: 'live', build: 'Power supply/potentiostat control, cell compression, alarms.' },
    gas: { x: 550, y: 160, t: 'Gas manifold', k: 'robotic', d: 'Mass-flow controllers switch CO, N₂ and mixtures at shared total flow.', data: 'Flows, switching times', lat: 'live', build: 'Valves, MFC calibration, leak checks.' },
    gc: { x: 740, y: 215, t: 'Online GC', k: 'robotic', d: 'Samples outlet gas every few minutes.', data: 'H₂, C₂H₄, CO … concentrations', lat: 'minutes', build: 'Calibration gases; outlet-flow measurement.' },
    liquid: { x: 550, y: 275, t: 'Liquid collection', k: 'semi', d: 'Collects cathode liquid and anolyte per window into vials.', data: 'Timed liquid samples', lat: 'per window', build: 'Cooled collection, delay characterization.' },
    nmr: { x: 370, y: 275, t: 'NMR (shared)', k: 'facility', d: 'Quantitative NMR of liquid products with an internal standard.', data: 'n-Propanol, ethanol, acetate', lat: 'hours–days', build: 'Sample-prep protocol, queue interface.' },
    airfree: { x: 190, y: 160, t: 'Air-free transfer', k: 'manual', d: 'Glovebox or sealed holder for recovered electrodes; a sibling is deliberately exposed as a control.', data: 'Transfer log', lat: 'hours', build: 'Transfer holder; exposure control protocol.' },
    tem: { x: 10, y: 160, t: 'TEM (facility)', k: 'facility', d: 'Blinded TEM of selected companions.', data: 'Grain/subgrain and surface images', lat: 'days–weeks', build: 'Blinding scheme; field-selection rules.' },
    sched: { x: 10, y: 275, t: 'Scheduler + model', k: 'software', d: 'Chooses actions, turns them into jobs, folds in delayed results, logs everything with lineage.', data: 'Decisions, costs, timestamps', lat: '—', build: 'Database, drivers, acquisition, replay harness.' },
  };
  const ST_E = [['spray', 'heater'], ['heater', 'inline'], ['inline', 'cassette'], ['cassette', 'mea'], ['gas', 'mea'], ['mea', 'gc'], ['mea', 'liquid'], ['liquid', 'nmr'], ['mea', 'airfree'], ['airfree', 'tem']];
  const KIND = { robotic: 'Automated', semi: 'Semi-automated', manual: 'Manual step', facility: 'Shared facility (manual interface)', software: 'Software' };
  WC.widgets.station = function (el) {
    let sel = 'mea';
    el.innerHTML = `<div class="panel"><div class="panel-head"><h2 class="p-title">The physical loop</h2>${WC.ev('prop', 'Proposed · host not confirmed')}</div>
<div class="panel-body"><p class="small muted">Select a station (click, or Tab then Enter). Solid boxes are automated; dashed are manual or shared-facility steps. The shaded region needs CO interlocks.</p><div class="chart" data-c style="overflow-x:auto"></div><div data-d aria-live="polite"></div></div></div>`;
    const c = $('[data-c]', el), d = $('[data-d]', el);
    const W = 160, H = 46;
    function draw() {
      let g = `<defs><marker id="st-a" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" style="fill:var(--muted)"/></marker></defs><rect x="535" y="80" width="380" height="190" rx="12" style="fill:var(--st-unres-bg);opacity:.55;stroke:var(--st-unres);stroke-dasharray:6 4"/><text class="svg-text" x="905" y="265" text-anchor="end" style="fill:var(--st-unres)">CO zone: detection, ventilation, interlocks</text>`;
      ST_E.forEach(([a, b]) => { const A = ST[a], B = ST[b]; const ax = A.x + W / 2, ay = A.y + H / 2, bx = B.x + W / 2, by = B.y + H / 2; const dx = bx - ax, dy = by - ay; const s = 1 / Math.max(Math.abs(dx) / (W / 2 + 4), Math.abs(dy) / (H / 2 + 4)); g += `<path d="M${ax + dx * s},${ay + dy * s} L${bx - dx * s},${by - dy * s}" style="stroke:var(--muted);stroke-width:1.4;fill:none" marker-end="url(#st-a)"/>`; });
      ['spray', 'heater', 'cassette', 'gas', 'mea'].forEach((k) => { const A = ST[k]; g += `<path d="M${ST.sched.x + W / 2},${ST.sched.y} L${A.x + W / 2},${A.y + H}" style="stroke:var(--patina);stroke-dasharray:2 4;fill:none;opacity:.6"/>`; });
      Object.entries(ST).forEach(([k, s]) => {
        const manual = s.k === 'manual' || s.k === 'facility';
        g += `<g class="station${k === sel ? ' sel' : ''}${manual ? ' manual' : ''}" tabindex="0" role="button" aria-pressed="${k === sel}" aria-label="${esc(s.t)}: ${KIND[s.k]}" data-s="${k}"><rect x="${s.x}" y="${s.y}" width="${W}" height="${H}" rx="8"/><text x="${s.x + W / 2}" y="${s.y + 20}" text-anchor="middle">${esc(s.t)}</text><text x="${s.x + W / 2}" y="${s.y + 36}" text-anchor="middle" style="fill:var(--muted);font-size:10px">${KIND[s.k]}</text></g>`;
      });
      c.innerHTML = `<svg viewBox="0 0 920 335" style="min-width:640px" role="group" aria-label="Station map of the self-driving laboratory">${g}</svg>`;
      const s = ST[sel];
      d.innerHTML = `<div class="grid-2" style="margin-top:.6rem"><div><h3 class="lab">${esc(s.t)} · ${KIND[s.k]}</h3><p>${s.d}</p><p class="small"><strong>Data:</strong> ${s.data} · <strong>Latency:</strong> ${s.lat}</p></div><div><h3 class="lab">What you would build or validate</h3><p class="small">${s.build}</p>${s.k === 'facility' ? '<p class="small muted">Shared facilities stay manual. Their queue delays enter the cost and the scheduler, rather than being hidden.</p>' : ''}</div></div>`;
      $$('.station', c).forEach((n) => { const go = () => { sel = n.dataset.s; draw(); const f = $(`.station[data-s="${sel}"]`, c); f && f.focus(); }; n.addEventListener('click', go); n.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }); });
    }
    draw();
  };

  /* ===================== Delayed-measurement timeline ===================== */
  WC.widgets.timeline = function (el) {
    const p = pfx();
    let policy = 'async', playT = null;
    el.innerHTML = `<div class="panel"><div class="panel-head"><h2 class="p-title">Why the lab needs a scheduler</h2>${WC.ev('sim')}</div>${WC.simBanner('Toy schedule · invented durations: test 3 h, NMR result +24 h, TEM result +5 days for every third electrode')}
<div class="panel-body"><div class="seg" role="group" aria-label="Decision policy"><button data-pol="all" aria-pressed="false">Wait for every result</button><button data-pol="nmr" aria-pressed="false">Wait for NMR only</button><button data-pol="async" aria-pressed="true">Decide with results pending</button></div>
<div class="btn-row">${S.slider(p + 't', 'Time cursor (hours)', 0, 240, 1, 96)}<button class="btn btn-sm" data-play>▶ Play</button></div>
<div class="chart" data-c style="overflow-x:auto"></div><div class="grid-4" data-m></div><div class="readout" data-r aria-live="polite"></div></div>
<div class="panel-foot">Ten days, one test channel. Each experiment occupies the channel for 3 h; GC results come with the test; NMR returns 24 h later; every third experiment sends a companion to TEM, returning 5 days later. Unattended overnight running assumes commissioned interlocks.</div></div>`;
    const c = $('[data-c]', el), m = $('[data-m]', el), r = $('[data-r]', el);
    function simulate(pol) {
      const ex = []; let t = 0, k = 0;
      while (t + 3 <= 240) {
        const e = { k, start: t, end: t + 3, nmr: t + 3 + 24, tem: k % 3 === 2 ? t + 3 + 120 : null };
        ex.push(e); k++;
        let next = e.end;
        if (pol === 'nmr') next = e.nmr;
        if (pol === 'all') next = Math.max(e.nmr, e.tem || 0);
        t = next;
      }
      return ex;
    }
    function draw() {
      const T = val(el, p + 't'); out(el, p + 't', T + ' h (day ' + (Math.floor(T / 24) + 1) + ')');
      $$('[data-pol]', el).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pol === policy)));
      const ex = simulate(policy);
      const W = 900, H = 200, x = S.lin(0, 240, 110, 890);
      const lanes = [['Test channel', 30], ['GC results', 70], ['NMR results', 110], ['TEM results', 150]];
      let g = lanes.map(([n, y]) => `<text class="lane-label svg-label" x="8" y="${y + 14}">${n}</text><line x1="110" x2="890" y1="${y + 26}" y2="${y + 26}" class="gridline"/>`).join('');
      for (let d = 0; d <= 10; d++) g += `<line x1="${x(d * 24)}" x2="${x(d * 24)}" y1="24" y2="184" class="gridline"/><text class="svg-text" x="${x(d * 24)}" y="198" text-anchor="middle">${d === 10 ? '' : 'd' + (d + 1)}</text>`;
      ex.forEach((e) => {
        const past = e.start <= T;
        g += `<rect x="${x(e.start)}" y="32" width="${Math.max(2, x(e.end) - x(e.start) - 1)}" height="20" rx="2" style="fill:${past ? 'var(--copper)' : 'var(--copper-soft)'}"/>`;
        if (e.end <= 240) g += `<circle cx="${x(e.end)}" cy="${82}" r="3" style="fill:${e.end <= T ? 'var(--steel)' : 'var(--rule-strong)'}"/>`;
        if (e.nmr <= 240) g += `<circle cx="${x(e.nmr)}" cy="${122}" r="3.5" style="fill:${e.nmr <= T ? 'var(--patina)' : 'var(--rule-strong)'}"/>`;
        if (e.tem && e.tem <= 240) g += `<rect x="${x(e.tem) - 3.5}" y="${158}" width="7" height="7" style="fill:${e.tem <= T ? 'var(--st-hyp)' : 'var(--rule-strong)'}"/>`;
      });
      g += `<line x1="${x(T)}" x2="${x(T)}" y1="20" y2="186" style="stroke:var(--ink);stroke-width:2"/>`;
      c.innerHTML = `<svg viewBox="0 0 ${W} ${H + 6}" style="min-width:620px" role="img" aria-label="Schedule for ${policy}: ${ex.length} experiments in ten days.">${g}</svg>`;
      const started = ex.filter((e) => e.start <= T);
      const gc = ex.filter((e) => e.end <= T).length, nmr = ex.filter((e) => e.nmr <= T).length, tem = ex.filter((e) => e.tem && e.tem <= T).length;
      const pendNMR = started.filter((e) => e.nmr > T).length, pendTEM = started.filter((e) => e.tem && e.tem > T).length;
      const util = (ex.reduce((s, e) => s + Math.min(e.end, 240) - e.start, 0) / 240) * 100;
      m.innerHTML = `<div class="stat"><small>Experiments in 10 days</small><b>${ex.length}</b></div><div class="stat"><small>Channel busy</small><b>${fmt(util, 0)}%</b></div><div class="stat"><small>Known at cursor</small><b>${gc}·${nmr}·${tem}</b><span>GC · NMR · TEM results</span></div><div class="stat ${pendNMR + pendTEM ? 'hi' : ''}"><small>Pending at cursor</small><b>${pendNMR + pendTEM}</b><span>${pendNMR} NMR, ${pendTEM} TEM</span></div>`;
      r.innerHTML = policy === 'all' ? `Waiting for every result, including TEM, leaves the channel idle ${fmt(100 - util, 0)}% of the time: ${ex.length} experiments in ten days. Safe from duplication, but most of the budget is waiting.` : policy === 'nmr' ? `Waiting only for NMR gives ${ex.length} experiments. TEM results still arrive days after later decisions, so even this policy decides with TEM pending.` : `Deciding with results pending keeps the channel busy: ${ex.length} experiments. At the cursor, ${pendNMR + pendTEM} results are in flight. The controller must count them (planned covariance) so it does not repeat work it has already ordered, and update the mean when they land.`;
    }
    bind(el, [p + 't'], draw);
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pol]'); if (b) { policy = b.dataset.pol; draw(); return; }
      const pl = e.target.closest('[data-play]');
      if (pl) {
        if (playT) { clearInterval(playT); playT = null; pl.textContent = '▶ Play'; return; }
        const s = $('#' + p + 't', el);
        if (reduced()) { s.value = 240; draw(); return; }
        if (+s.value >= 240) s.value = 0;
        pl.textContent = '❚❚ Pause';
        playT = setInterval(() => { if (!el.isConnected) { clearInterval(playT); return; } s.value = Math.min(240, +s.value + 2); draw(); if (+s.value >= 240) { clearInterval(playT); playT = null; pl.textContent = '▶ Play'; } }, 60);
      }
    });
    draw();
    const off = WC.onRedraw(draw);
    return () => { off(); if (playT) clearInterval(playT); };
  };

  /* ===================== Action anatomy ===================== */
  const ACT = {
    make: { n: 'MAKE', jobs: [['Spray coater', 'coat new sheet (with companions)', 0.3], ['Joule heater', 'heat at the new dwell; record trace', 0.1], ['Inline checks', 'loading, image, quick XRD; cut coupons', 1], ['Cassette + gas manifold', 'load; activate under assigned gas', 0.5], ['MEA + GC', 'two-hour CO test, early/late windows', 2.2], ['NMR queue', 'liquid products', 24]], cost: [['Preparation', 2], ['Channel time', 2], ['Analysis', 0.6], ['Delay', 1]], upd: 'Direct, noisy information about m(t, a) at a new condition; through the model, about θ there and nearby.', note: 'Only inside the validated window. Companions should be reserved now, because a later MEASURE needs a sibling from this run.' },
    repeat: { n: 'REPEAT', jobs: [['Spray coater', 'coat a fresh, independent sheet', 0.3], ['Joule heater', 'heat at an already-tested dwell', 0.1], ['Inline checks', 'loading, image; cut coupons', 1], ['Cassette + gas manifold', 'load; activate', 0.5], ['MEA + GC', 'two-hour CO test', 2.2], ['NMR queue', 'liquid products', 24]], cost: [['Preparation', 2], ['Channel time', 2], ['Analysis', 0.6], ['Delay', 1]], upd: 'Reduces noise at a tested condition and teaches the model the preparation-level variance there (heteroskedastic noise).', note: 'A new GC injection or a new image is not a repeat. Neither is a second coupon from the same sheet, for a processing claim.' },
    measure: { n: 'MEASURE', jobs: [['Inventory', 'take a reserved companion from an existing run', 0], ['Activation (if endpoint assay)', 'activate the companion and stop at the endpoint', 0.5], ['Air-free transfer', 'protected transfer; exposure control as scheduled', 2], ['TEM facility', 'blinded imaging of selected fields', 120], ['Analysis', 'blinded quantification', 8]], cost: [['Companion', 1], ['Instrument time', 2.5], ['Analysis', 1.5], ['Delay', 3]], upd: 'Indirect information about θ through the validated structure–performance link, discounted by companion mismatch.', note: 'Only validated assays are on the menu. Value depends on link strength and mismatch, not on instrument sophistication.' },
  };
  WC.widgets.actions = function (el) {
    let a = 'make';
    el.innerHTML = `<div class="panel"><div class="panel-head"><h2 class="p-title">Anatomy of an action</h2>${WC.ev('pilot', 'Durations and costs illustrative')}</div>
<div class="panel-body"><div class="seg" role="tablist" aria-label="Action">${Object.entries(ACT).map(([k, v]) => `<button role="tab" data-a="${k}" aria-selected="${k === a}">${v.n}</button>`).join('')}</div><div data-d style="margin-top:.8rem" aria-live="polite"></div>
<h3 class="lab">Always scheduled, never chosen</h3><p class="small">Instrument calibrations (GC standards, NMR internal standard, temperature), reference/control electrodes, leak and safety checks. Their cost is charged to every policy ${WC.src('P08')}.</p></div></div>`;
    const d = $('[data-d]', el);
    function draw() {
      const v = ACT[a]; const tot = v.cost.reduce((s, [, x]) => s + x, 0);
      $$('[data-a]', el).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.a === a)));
      d.innerHTML = `<div class="grid-2"><div><h3 class="lab">Physical jobs</h3><ol class="small">${v.jobs.map(([s, j, h]) => `<li><strong>${s}:</strong> ${j} <span class="muted mono">${h >= 24 ? fmt(h / 24, 0) + ' d' : h + ' h'}</span></li>`).join('')}</ol><p class="small"><strong>What it updates:</strong> ${v.upd}</p><p class="small muted">${v.note}</p></div>
<div><h3 class="lab">Cost components (illustrative units)</h3>${v.cost.map(([n, x]) => `<div style="display:grid;grid-template-columns:7.5rem 1fr 2.5rem;gap:.5rem;align-items:center;font-size:.8rem"><span>${n}</span><span class="bar-u"><span style="width:${(100 * x) / 8.5}%"></span></span><span class="mono">${x}</span></div>`).join('')}<p class="small" style="margin-top:.5rem"><strong>Total ≈ ${fmt(tot, 1)} units.</strong> The proposal requires cost to include preparation, instrument occupancy, analysis and delay, with weights declared in advance and sensitivity reported.</p></div></div>`;
    }
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (b) { a = b.dataset.a; draw(); } });
    draw();
  };

  /* ===================== Failure classifier ===================== */
  const FAIL = {
    leak: ['A gas line leaks during the test', 'Equipment fault', 'The measurement is invalid. Log it, exclude it from the model, fix the line, and rerun if the action is still worth its cost. It says nothing about the catalyst.'],
    delam: ['One dwell setting delaminates in 3 of 3 independent runs', 'Reproducible material failure', 'A feasibility outcome. Keep it: the model should learn that this region of preparation space fails. Deleting it would reward fragile recipes.'],
    once: ['A single electrode delaminates once', 'Unclassified until repeated', 'One event cannot distinguish a handling accident from a fragile preparation. Record it as a failure with its context; an independent repeat classifies it.'],
    recovery: ['Charge balance closes at 70% for one run', 'Measurement-chain problem', 'The products were not all counted. Check recovery, delay, outlet flow and crossover before using the run. If it recurs for one condition, it may be chemistry (an unmeasured product) and needs investigation.'],
    nul: ['A precise null interaction', 'Valid scientific result', 'Not a failure. An interaction inside the meaningful bounds is an informative negative for H1, and still a well-defined target for Aim 2.'],
  };
  WC.widgets.failures = function (el) {
    let k = 'leak';
    el.innerHTML = `<div class="panel"><div class="panel-head"><h2 class="p-title">Classify the failure before scoring the material</h2></div><div class="panel-body"><div class="term-list" role="group" aria-label="Scenario">${Object.entries(FAIL).map(([id, v]) => `<button data-k="${id}" aria-pressed="${id === k}">${v[0]}</button>`).join('')}</div><div data-d aria-live="polite"></div></div></div>`;
    const d = $('[data-d]', el);
    const draw = () => { const v = FAIL[k]; $$('[data-k]', el).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === k))); d.innerHTML = `<div class="readout ${k === 'leak' || k === 'recovery' ? 'warn' : k === 'nul' ? '' : 'neutral'}"><strong>${v[1]}.</strong> ${v[2]}</div>`; };
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b) { k = b.dataset.k; draw(); } });
    draw();
  };

  /* ===================== Posterior explorer (GP) ===================== */
  WC.widgets.posterior = function (el) {
    const p = pfx();
    const truth = (t) => 3 * Math.sin(5 * t) - 2 * t + 1;
    const R = rng(11);
    let obs = [[0.15, truth(0.15) + gauss(R) * 1.2], [0.45, truth(0.45) + gauss(R) * 1.2]];
    let showTruth = false;
    el.innerHTML = `<div class="panel"><div class="panel-head"><h2 class="p-title">What the model believes</h2>${WC.ev('sim')}</div>${WC.simBanner('Synthetic curve and observations · a Gaussian-process teaching model, not the research model')}
<div class="panel-body"><p class="small muted">Click inside the chart to measure the hidden curve at that dwell (true noise SD = 1.2). Then change what the model <em>assumes</em> and watch calibration.</p>
<div class="controls">${S.slider(p + 'n', 'Assumed noise SD', 0.1, 3, 0.1, 1.2)}${S.slider(p + 'l', 'Assumed smoothness (length-scale)', 0.03, 0.6, 0.01, 0.18)}${S.slider(p + 's', 'Prior SD', 1, 8, 0.5, 4)}</div>
<div class="chart" data-c style="cursor:crosshair"></div><div class="legend"><span><span class="sw" style="background:var(--c-theta)"></span>posterior mean</span><span><span class="sw" style="background:var(--c-band);height:10px"></span>95% pointwise band</span><span>● observations</span>${'<span style="color:var(--c-co)"><span class="sw dash"></span><span style="color:var(--ink-2)">hidden truth (when revealed)</span></span>'}</div>
<div class="btn-row"><button class="btn btn-sm" data-add>Add 5 random observations</button><button class="btn btn-sm" data-truth aria-pressed="false">Reveal hidden curve</button><button class="btn btn-sm" data-reset>Reset</button></div>
<div class="grid-3" data-m></div><div class="readout" data-r aria-live="polite"></div></div></div>`;
    const c = $('[data-c]', el), m = $('[data-m]', el), r = $('[data-r]', el);
    const G = Array.from({ length: 81 }, (_, i) => i / 80);
    const W = 720, H = 260;
    let f;
    function post() {
      const sn = val(el, p + 'n'), l = val(el, p + 'l'), s = val(el, p + 's');
      const k = (a, b) => s * s * Math.exp(-((a - b) ** 2) / (2 * l * l));
      const X = obs.map((o) => o[0]), y = obs.map((o) => o[1]);
      if (!X.length) return G.map(() => [0, s]);
      const K = X.map((a, i) => X.map((b, j) => k(a, b) + (i === j ? sn * sn : 0)));
      const L = chol(K), alpha = solveLT(L, solveL(L, y));
      return G.map((t) => { const ks = X.map((a) => k(t, a)); const mu = ks.reduce((acc, v, i) => acc + v * alpha[i], 0); const v = solveL(L, ks); const vv = s * s - v.reduce((acc, x) => acc + x * x, 0); return [mu, Math.sqrt(Math.max(vv, 1e-9))]; });
    }
    function draw() {
      out(el, p + 'n', val(el, p + 'n').toFixed(1)); out(el, p + 'l', val(el, p + 'l').toFixed(2)); out(el, p + 's', val(el, p + 's').toFixed(1));
      const P = post();
      f = S.frame({ w: W, h: H, x: [0, 1], y: [-10, 10], xt: [0, 0.25, 0.5, 0.75, 1], yt: [-10, -5, 0, 5, 10], xl: 'heating dwell (normalized)', yl: 'g(t) (a.u.)', zero: true });
      let g = f.axes;
      const top = G.map((t, i) => [f.x(t), f.y(clamp(P[i][0] + 1.96 * P[i][1], -10, 10))]), bot = G.map((t, i) => [f.x(t), f.y(clamp(P[i][0] - 1.96 * P[i][1], -10, 10))]);
      g += `<path d="${S.area(top, bot)}" style="fill:var(--c-band)"/><path d="${S.path(G.map((t, i) => [f.x(t), f.y(clamp(P[i][0], -10, 10))]))}" style="fill:none;stroke:var(--c-theta);stroke-width:2.4"/>`;
      if (showTruth) g += `<path d="${S.path(G.map((t) => [f.x(t), f.y(truth(t))]))}" style="fill:none;stroke:var(--c-co);stroke-width:1.8" stroke-dasharray="6 4"/>`;
      obs.forEach(([t, y]) => { g += `<circle cx="${f.x(t)}" cy="${f.y(clamp(y, -10, 10))}" r="4.5" style="fill:var(--ink)"/>`; });
      g += `<rect data-hit x="${f.m.l}" y="${f.m.t}" width="${W - f.m.l - f.m.r}" height="${H - f.m.t - f.m.b}" style="fill:transparent"/>`;
      c.innerHTML = S.svg(W, H, g, `Posterior with ${obs.length} observations.`);
      const meanSD = P.reduce((a, q) => a + q[1], 0) / P.length;
      const cover = G.filter((t, i) => Math.abs(truth(t) - P[i][0]) <= 1.96 * P[i][1]).length / G.length;
      const rmse = Math.sqrt(G.reduce((a, t, i) => a + (truth(t) - P[i][0]) ** 2, 0) / G.length);
      m.innerHTML = `<div class="stat"><small>Observations</small><b>${obs.length}</b></div><div class="stat"><small>Average posterior SD</small><b>${fmt(meanSD, 2)}</b><span>precision</span></div><div class="stat ${cover < 0.8 ? 'hi' : 'ok'}"><small>Band covers truth</small><b>${fmt(100 * cover, 0)}%</b><span>calibration (target ≈95%) · RMSE ${fmt(rmse, 2)}</span></div>`;
      r.className = 'readout' + (cover < 0.8 ? ' warn' : '');
      r.innerHTML = cover < 0.8 ? `The band is narrow but misses the truth over ${fmt(100 - 100 * cover, 0)}% of the range. The model is <strong>confidently wrong</strong>: its assumptions (noise ${val(el, p + 'n') < 1 ? 'too small' : 'or'} smoothness) don’t match the data. A controller using this uncertainty would stop exploring too early. This is why calibration gates the benchmark.` : `The band is wide far from data and pinches near observations. Coverage of ${fmt(100 * cover, 0)}% means the uncertainty is roughly honest here. Precision (band width) and calibration (does the band contain the truth?) are separate checks.`;
      $('[data-hit]', c).addEventListener('click', (e) => {
        const svg = c.querySelector('svg'); const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
        const lp = pt.matrixTransform(svg.getScreenCTM().inverse());
        const t = clamp(f.x.inv(lp.x), 0, 1);
        obs.push([t, truth(t) + gauss(R) * 1.2]); draw();
      });
    }
    bind(el, [p + 'n', p + 'l', p + 's'], draw);
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-add]')) { for (let i = 0; i < 5; i++) { const t = R(); obs.push([t, truth(t) + gauss(R) * 1.2]); } draw(); }
      if (e.target.closest('[data-reset]')) { obs = []; draw(); }
      const tb = e.target.closest('[data-truth]'); if (tb) { showTruth = !showTruth; tb.setAttribute('aria-pressed', String(showTruth)); tb.textContent = showTruth ? 'Hide hidden curve' : 'Reveal hidden curve'; draw(); }
    });
    draw();
    return WC.onRedraw(draw);
  };

  /* ===================== θ(t) explorer ===================== */
  const TH_SC = {
    constant: ['Constant activation benefit', { n0: 12, ns: 4, a: 6, b: 0, shape: 'lin' }],
    dwell: ['Dwell-dependent benefit', { n0: 12, ns: 4, a: 8, b: -7, shape: 'lin' }],
    reversal: ['Ranking reversal', { n0: 10, ns: 8, a: 6, b: -12, shape: 'lin' }],
    peak: ['Benefit peaks at mid dwell', { n0: 12, ns: 2, a: 3, b: 8, shape: 'peak' }],
    dwellonly: ['Big dwell effect, no interaction', { n0: 8, ns: 12, a: 4, b: 0, shape: 'lin' }],
  };
  WC.widgets.theta = function (el) {
    const p = pfx();
    let step = 3, shape = 'lin';
    el.innerHTML = `<div class="panel"><div class="panel-head"><h2 class="p-title">θ(t) explorer</h2>${WC.ev('sim')}</div>${WC.simBanner('Invented response curves · arbitrary normalized dwell · not predicted catalyst behavior')}
<div class="panel-body"><div class="term-list" role="group" aria-label="Scenarios">${Object.entries(TH_SC).map(([k, [n]]) => `<button data-sc="${k}" aria-pressed="false">${n}</button>`).join('')}</div>
<div class="controls">${S.slider(p + 'ns', 'Dwell effect on N₂-activated output', -8, 12, 1, 4)}${S.slider(p + 'a', 'Constant CO benefit', -6, 12, 1, 8)}${S.slider(p + 'b', 'Dwell-dependent part of the CO benefit', -12, 12, 1, -7)}${S.slider(p + 'r', 'Reference dwell t_ref', 0, 1, 0.05, 0)}</div>
<div class="btn-row"><span class="small muted">Build it step by step:</span><div class="seg" role="group" aria-label="Derivation step"><button data-st="1">1 · Two curves</button><button data-st="2">2 · Gas effect g(t)</button><button data-st="3">3 · Subtract g(t_ref)</button></div><label class="small" style="display:flex;gap:.4rem;align-items:center">Shape <select data-shape style="width:auto"><option value="lin">linear</option><option value="sat">saturating</option><option value="peak">peaked</option></select></label></div>
<div class="grid-3"><div><h3 class="lab">1 · m(t, gas)</h3><div class="chart" data-c1></div></div><div><h3 class="lab">2 · g(t) = CO − N₂</h3><div class="chart" data-c2></div></div><div><h3 class="lab">3 · θ(t) = g(t) − g(t_ref)</h3><div class="chart" data-c3></div></div></div>
<div class="readout" data-r aria-live="polite"></div></div>
<div class="panel-foot">The open circle at t₁ = 0.8 marks a 2×2 pilot taken with t₀ = t_ref: θ(t₁) is exactly that pilot’s difference of differences.</div></div>`;
    const c1 = $('[data-c1]', el), c2 = $('[data-c2]', el), c3 = $('[data-c3]', el), r = $('[data-r]', el);
    const sh = (t) => (shape === 'lin' ? t : shape === 'sat' ? 1 - Math.exp(-4 * t) : Math.sin(Math.PI * t));
    function draw() {
      const ns = val(el, p + 'ns'), a = val(el, p + 'a'), b = val(el, p + 'b'), tr = val(el, p + 'r'), n0 = 12;
      out(el, p + 'ns', signed(ns, 0)); out(el, p + 'a', signed(a, 0)); out(el, p + 'b', signed(b, 0)); out(el, p + 'r', tr.toFixed(2));
      $$('[data-st]', el).forEach((x) => x.setAttribute('aria-pressed', String(+x.dataset.st === step)));
      $('[data-shape]', el).value = shape;
      const N = (t) => n0 + ns * t, g = (t) => a + b * sh(t), C = (t) => N(t) + g(t), th = (t) => g(t) - g(tr);
      const T = Array.from({ length: 41 }, (_, i) => i / 40);
      const Wd = 300, Hd = 220;
      const ch = (yr, inner, yl) => { const f = S.frame({ w: Wd, h: Hd, x: [0, 1], y: yr, xt: [0, 0.5, 1], yt: S.ticks(yr[0], yr[1], 4), xl: 'dwell t', yl, zero: true, m: { l: 40, r: 10, b: 36, t: 10 } }); return S.svg(Wd, Hd, f.axes + inner(f), yl); };
      const refLine = (f) => `<line x1="${f.x(tr)}" x2="${f.x(tr)}" y1="${f.m.t}" y2="${Hd - f.m.b}" style="stroke:var(--muted);stroke-dasharray:3 3"/><text class="svg-text" x="${f.x(tr) + 3}" y="${f.m.t + 10}">t_ref</text>`;
      const allM = T.flatMap((t) => [N(t), C(t)]);
      const yr1 = [Math.min(0, Math.floor(Math.min(...allM) / 5) * 5), Math.max(30, Math.ceil(Math.max(...allM) / 5) * 5)];
      c1.innerHTML = ch(yr1, (f) => {
        let s = refLine(f) + `<path d="${S.path(T.map((t) => [f.x(t), f.y(N(t))]))}" style="fill:none;stroke:var(--c-n2);stroke-width:2.4" stroke-dasharray="6 4"/><path d="${S.path(T.map((t) => [f.x(t), f.y(C(t))]))}" style="fill:none;stroke:var(--c-co);stroke-width:2.4"/>`;
        if (step >= 2) [0, 0.25, 0.5, 0.75, 1].forEach((t) => { s += `<line x1="${f.x(t)}" x2="${f.x(t)}" y1="${f.y(N(t))}" y2="${f.y(C(t))}" style="stroke:var(--c-theta);stroke-width:1.6"/>`; });
        s += `<text class="svg-text" x="${Wd - 14}" y="${f.y(C(1)) - 6}" text-anchor="end" style="fill:var(--c-co)">CO</text><text class="svg-text" x="${Wd - 14}" y="${f.y(N(1)) + 14}" text-anchor="end" style="fill:var(--c-n2)">N₂</text>`;
        return s;
      }, 'output');
      const gs = T.map(g), yr2 = [Math.min(-5, Math.floor(Math.min(...gs) / 5) * 5), Math.max(5, Math.ceil(Math.max(...gs) / 5) * 5)];
      c2.innerHTML = step < 2 ? '<p class="small muted" style="padding:2rem 0">Step 2 draws the gap between the curves at each dwell.</p>' : ch(yr2, (f) => refLine(f) + `<line x1="${f.m.l}" x2="${Wd - 10}" y1="${f.y(g(tr))}" y2="${f.y(g(tr))}" style="stroke:var(--muted);stroke-dasharray:2 3"/><path d="${S.path(T.map((t) => [f.x(t), f.y(g(t))]))}" style="fill:none;stroke:var(--c-theta);stroke-width:2.4"/><circle cx="${f.x(tr)}" cy="${f.y(g(tr))}" r="4" style="fill:var(--c-theta)"/><text class="svg-text" x="${f.x(tr) + (tr > .6 ? -8 : 8)}" y="${f.y(g(tr)) + (g(tr) > (yr2[0] + yr2[1]) / 2 ? 16 : -8)}" text-anchor="${tr > .6 ? 'end' : 'start'}">g(t_ref) = ${fmt(g(tr), 1)}</text>`, 'g(t)');
      const ts = T.map(th), yr3 = [Math.min(-5, Math.floor(Math.min(...ts) / 5) * 5), Math.max(5, Math.ceil(Math.max(...ts) / 5) * 5)];
      c3.innerHTML = step < 3 ? '<p class="small muted" style="padding:2rem 0">Step 3 shifts g(t) down by g(t_ref).</p>' : ch(yr3, (f) => refLine(f) + `<path d="${S.path(T.map((t) => [f.x(t), f.y(th(t))]))}" style="fill:none;stroke:var(--c-theta);stroke-width:2.6"/><circle cx="${f.x(0.8)}" cy="${f.y(th(0.8))}" r="5" style="fill:var(--surface);stroke:var(--ink);stroke-width:1.6"/><text class="svg-text" x="${f.x(0.8) - 6}" y="${f.y(th(0.8)) - 9}" text-anchor="end">θ(t₁) = ${fmt(th(0.8), 1)}</text>`, 'θ(t)');
      const maxTh = Math.max(...ts.map(Math.abs));
      let txt;
      if (maxTh < 0.05) txt = `<strong>θ(t) = 0 everywhere.</strong> CO changes output by the same ${fmt(a, 0)} mA cm⁻² at every dwell${Math.abs(ns) > 0 ? `, and output also changes with dwell (by ${signed(ns, 0)}) for both gases` : ''}. Both are main effects, which the subtraction removes. No synthesis × activation interaction.`;
      else txt = `<strong>θ(t) ≠ 0.</strong> The gas effect ranges from ${fmt(Math.min(...gs), 1)} to ${fmt(Math.max(...gs), 1)} across dwell, so the benefit of CO depends on how the precursor was made. θ measures that dependence relative to t_ref (θ(t_ref) = 0 by definition). The constant part of the benefit (${signed(a, 0)}) and the dwell effect shared by both gases (${signed(ns, 0)}) drop out.`;
      if (Math.sign(Math.min(...gs)) !== Math.sign(Math.max(...gs)) && maxTh > 0.05) txt += ' The gas effect changes sign: CO is better at some dwells and worse at others.';
      r.innerHTML = txt;
    }
    bind(el, [p + 'ns', p + 'a', p + 'b', p + 'r'], draw);
    el.addEventListener('click', (e) => {
      const s = e.target.closest('[data-sc]'); if (s) { const v = TH_SC[s.dataset.sc][1]; $('#' + p + 'ns', el).value = v.ns; $('#' + p + 'a', el).value = v.a; $('#' + p + 'b', el).value = v.b; shape = v.shape; $$('[data-sc]', el).forEach((x) => x.setAttribute('aria-pressed', String(x === s))); draw(); return; }
      const st = e.target.closest('[data-st]'); if (st) { step = +st.dataset.st; draw(); }
    });
    $('[data-shape]', el).addEventListener('change', (e) => { shape = e.target.value; draw(); });
    draw();
    return WC.onRedraw(draw);
  };

  /* ===================== Autonomous decision sandbox =====================
     A 7-point linear-Gaussian model of the gas effect g at normalized dwells.
     Expected variance reduction is computed exactly: for an observation of g_i
     with noise variance r, ΔV = Σ_j w_j (AΣe_i)_j² / (Σ_ii + r). */
  WC.widgets.sandbox = function (el) {
    const p = pfx();
    const K = 7, tg = Array.from({ length: K }, (_, i) => i / (K - 1));
    const gTrue = tg.map((t) => 8 - 9 * t + 4 * t * t);
    const W8 = tg.map((_, i) => (i === 0 ? 0 : 1 / (K - 1)));
    let log = [], day = 0, spent = 0, R = rng(2026), obs = [], vHist = [];
    const seedObs = () => { obs = [{ i: 0, kind: 'make', r: null, val: null, due: 0, fault: false, pilot: true }, { i: 0, kind: 'repeat', due: 0, pilot: true }, { i: 2, kind: 'make', due: 0, pilot: true }, { i: 2, kind: 'repeat', due: 0, pilot: true }]; };
    el.innerHTML = `<div class="panel"><div class="panel-head"><h2 class="p-title">Decision sandbox: make, measure or repeat?</h2>${WC.ev('sim')}</div>${WC.simBanner('Toy linear-Gaussian model · not the proposal’s acquisition algorithm · structural link assumed known')}
<div class="panel-body"><div class="controls">${S.slider(p + 'e', 'Experimental noise (SD of a paired test)', 0.5, 6, 0.25, 2.5)}${S.slider(p + 'rho', 'Characterization reliability ρ (assay ↔ performance)', 0.2, 0.98, 0.02, 0.8)}${S.slider(p + 'c', 'Companion mismatch (SD)', 0, 5, 0.25, 0.75)}${S.slider(p + 'mc', 'Structural assay cost', 1, 14, 0.5, 3)}${S.slider(p + 'u', 'Prior uncertainty in the unexplored region (SD)', 1, 12, 0.5, 6)}</div>
<label class="check-row"><input type="checkbox" id="${p}d" checked> Count delay in cost (0.4 units per day of waiting)</label>
<div class="chart" data-c></div><div class="legend"><span><span class="sw" style="background:var(--c-theta)"></span>posterior mean of θ (arrived data)</span><span><span class="sw" style="background:var(--c-band);height:10px"></span>±2 SD</span><span>● arrived</span><span>○ pending</span><span style="color:var(--c-co)"><span class="sw dash"></span><span style="color:var(--ink-2)">hidden truth (optional)</span></span></div>
<div class="action-cards" data-cards></div><div class="readout" data-why aria-live="polite"></div>
<div class="btn-row"><button class="btn btn-primary" data-exec>Execute recommended action →</button><button class="btn btn-sm" data-truth aria-pressed="false">Reveal hidden truth</button><button class="btn btn-sm" data-reset>Reset</button><span class="small mono" data-clock></span></div>
<div class="log" data-log aria-live="polite"></div></div>
<div class="panel-foot">Seven dwells; θ is referenced to the first. Pilot data: two paired tests at dwells 0 and 2. MAKE observes g at an untested dwell; REPEAT at a tested one (cost 4, results in 2 days); MEASURE uses a reserved companion of a tested dwell, observing g with noise variance s²(1−ρ²)/ρ² + mismatch² (results in 6 days). Every fifth action triggers a mandatory calibration (cost 1, not optional). One equipment fault is scripted to show invalidation. Pending results already count in the planned uncertainty; the mean waits for arrival.</div></div>`;
    const c = $('[data-c]', el), cards = $('[data-cards]', el), why = $('[data-why]', el), logEl = $('[data-log]', el), clock = $('[data-clock]', el);
    let showTruth = false;
    function params() {
      const e = val(el, p + 'e'), rho = val(el, p + 'rho'), cm = val(el, p + 'c'), mc = val(el, p + 'mc'), u = val(el, p + 'u'), dly = $('#' + p + 'd', el).checked ? 0.4 : 0;
      out(el, p + 'e', e.toFixed(2)); out(el, p + 'rho', rho.toFixed(2)); out(el, p + 'c', cm.toFixed(2)); out(el, p + 'mc', mc.toFixed(1)); out(el, p + 'u', u.toFixed(1));
      return { e, rho, cm, mc, u, dly };
    }
    function prior(P) { const sd = tg.map((t) => (t <= 0.34 ? 4 : t <= 0.5 ? (4 + P.u) / 2 : P.u)); const l = 0.28; return tg.map((a, i) => tg.map((b, j) => sd[i] * sd[j] * Math.exp(-((a - b) ** 2) / (2 * l * l)))); }
    const noiseOf = (o, P) => (o.kind === 'measure' ? 16 * (1 - P.rho * P.rho) / (P.rho * P.rho) + P.cm * P.cm : P.e * P.e);
    function condition(Sig, mu, i, r, y) {
      const s = Sig[i][i] + r, kcol = Sig.map((row) => row[i]);
      const nS = Sig.map((row, a) => row.map((v, b) => v - (kcol[a] * kcol[b]) / s));
      const nm = mu ? mu.map((m, a) => m + (kcol[a] * (y - mu[i])) / s) : null;
      return [nS, nm];
    }
    const Vof = (Sig) => { let v = 0; for (let j = 1; j < K; j++) v += W8[j] * (Sig[j][j] + Sig[0][0] - 2 * Sig[j][0]); return v; };
    function state(P) {
      let Sp = prior(P), Sa = Sp, mu = new Array(K).fill(0);
      obs.forEach((o) => {
        if (o.fault) return;
        if (o.val == null) o.val = (o.kind === 'measure' ? gTrue[o.i] + gauss(R) * Math.sqrt(noiseOf(o, P)) : gTrue[o.i] + gauss(R) * P.e);
        const r = noiseOf(o, P);
        [Sp] = condition(Sp, null, o.i, r);
        if (o.due <= day) [Sa, mu] = condition(Sa, mu, o.i, r, o.val);
      });
      return { Sp, Sa, mu };
    }
    function candidates(P, Sp) {
      const tested = new Set(obs.filter((o) => !o.fault && o.kind !== 'measure').map((o) => o.i));
      const V0 = Vof(Sp), out2 = [];
      for (let i = 1; i < K; i++) {
        const isT = tested.has(i) || i === 0;
        ['make', 'repeat', 'measure'].forEach((kind) => {
          if (kind === 'make' && isT) return;
          if (kind !== 'make' && !isT) return;
          const r = noiseOf({ kind }, P);
          const [nS] = condition(Sp, null, i, r);
          const dV = V0 - Vof(nS);
          const lat = kind === 'measure' ? 6 : 2;
          const cost = (kind === 'measure' ? P.mc + 1 : 4) + P.dly * lat;
          out2.push({ kind, i, dV, cost, u: dV / cost, lat, r });
        });
      }
      // reference dwell (index 0) can be repeated or measured too
      ['repeat', 'measure'].forEach((kind) => { const r = noiseOf({ kind }, P); const [nS] = condition(Sp, null, 0, r); const dV = V0 - Vof(nS); const lat = kind === 'measure' ? 6 : 2; const cost = (kind === 'measure' ? P.mc + 1 : 4) + P.dly * lat; out2.push({ kind, i: 0, dV, cost, u: dV / cost, lat, r }); });
      return { V0, list: out2 };
    }
    let best = null;
    function draw() {
      const P = params(), st = state(P), cand = candidates(P, st.Sp);
      const byKind = {};
      cand.list.forEach((x) => { if (!byKind[x.kind] || x.u > byKind[x.kind].u) byKind[x.kind] = x; });
      best = cand.list.reduce((a, b) => (b.u > a.u ? b : a), cand.list[0]);
      // chart of θ
      const Wd = 720, Hd = 240;
      const f = S.frame({ w: Wd, h: Hd, x: [0, 1], y: [-14, 10], xt: tg, yt: [-12, -8, -4, 0, 4, 8], xfmt: (t) => 'd' + Math.round(t * 6), xl: 'dwell grid (d0 = reference)', yl: 'θ', zero: true });
      const th = (i) => st.mu[i] - st.mu[0];
      const sdA = (i) => Math.sqrt(Math.max(0, st.Sa[i][i] + st.Sa[0][0] - 2 * st.Sa[i][0]));
      const sdP = (i) => Math.sqrt(Math.max(0, st.Sp[i][i] + st.Sp[0][0] - 2 * st.Sp[i][0]));
      let g = f.axes;
      const top = tg.map((t, i) => [f.x(t), f.y(clamp(th(i) + 2 * sdA(i), -14, 10))]), bot = tg.map((t, i) => [f.x(t), f.y(clamp(th(i) - 2 * sdA(i), -14, 10))]);
      g += `<path d="${S.area(top, bot)}" style="fill:var(--c-band)"/>`;
      tg.forEach((t, i) => { if (sdP(i) < sdA(i) - 0.05) g += `<line x1="${f.x(t)}" x2="${f.x(t)}" y1="${f.y(clamp(th(i) + 2 * sdP(i), -14, 10))}" y2="${f.y(clamp(th(i) - 2 * sdP(i), -14, 10))}" style="stroke:var(--c-theta);stroke-width:5;opacity:.35"/>`; });
      g += `<path d="${S.path(tg.map((t, i) => [f.x(t), f.y(clamp(th(i), -14, 10))]))}" style="fill:none;stroke:var(--c-theta);stroke-width:2.4"/>`;
      if (showTruth) g += `<path d="${S.path(tg.map((t, i) => [f.x(t), f.y(gTrue[i] - gTrue[0])]))}" style="fill:none;stroke:var(--c-co);stroke-width:1.8" stroke-dasharray="6 4"/>`;
      const cnt = {};
      obs.forEach((o) => { if (o.fault) return; const k2 = o.i + ':' + (o.kind === 'measure' ? 'm' : 't'); cnt[k2] = (cnt[k2] || 0) + 1; const off = (cnt[k2] - 1) * 7 * (o.kind === 'measure' ? -1 : 1); const y = Hd - f.m.b - 10 - Math.abs(off); const arrived = o.due <= day; g += o.kind === 'measure' ? `<rect x="${f.x(tg[o.i]) - 4 + (off < 0 ? -8 : 0)}" y="${y - 4}" width="8" height="8" style="fill:${arrived ? 'var(--st-hyp)' : 'var(--surface)'};stroke:var(--st-hyp)"/>` : `<circle cx="${f.x(tg[o.i]) + 8}" cy="${y}" r="4" style="fill:${arrived ? 'var(--ink)' : 'var(--surface)'};stroke:var(--ink)"/>`; });
      g += `<text class="svg-text" x="${f.m.l + 4}" y="${Hd - f.m.b - 30}">● tests  ■ assays  (open = pending)</text>`;
      c.innerHTML = S.svg(Wd, Hd, g, `Posterior of theta after ${obs.length} actions. Recommended next: ${best.kind} at dwell ${best.i}.`);
      const name = { make: 'MAKE', repeat: 'REPEAT', measure: 'MEASURE' };
      const maxU = Math.max(...Object.values(byKind).map((x) => x.u));
      cards.innerHTML = ['make', 'measure', 'repeat'].map((k) => { const x = byKind[k]; if (!x) return `<div class="action-card"><h3 class="lab">${name[k]}</h3><p class="small muted">No candidate (every dwell already tested).</p></div>`; const isB = x === best; return `<div class="action-card${isB ? ' best' : ''}"><h3 class="lab">${name[k]} · d${x.i}${isB ? ' <span class="ev ev-prop"><i>▲</i>Recommended</span>' : ''}</h3><dl><dt>Expected ΔV</dt><dd>${fmt(x.dV, 2)}</dd><dt>Cost (incl. delay)</dt><dd>${fmt(x.cost, 1)}</dd><dt>Latency</dt><dd>${x.lat} d</dd><dt>Noise SD of this observation</dt><dd>${fmt(Math.sqrt(x.r), 2)}</dd><dt>ΔV per cost</dt><dd><strong>${fmt(x.u, 3)}</strong></dd></dl><div class="bar-u" aria-hidden="true"><span style="width:${(100 * x.u) / maxU}%"></span></div><button class="btn btn-sm" data-do="${k}:${x.i}">Do this instead</button></div>`; }).join('');
      // explanation
      const m = byKind.measure, mk = byKind.make, rp = byKind.repeat;
      let ex = `<strong>Recommendation: ${name[best.kind]} at dwell d${best.i}.</strong> `;
      if (best.kind === 'measure') ex += `With reliability ρ = ${P.rho.toFixed(2)} and companion mismatch ${P.cm.toFixed(2)}, an assay observes θ with noise SD ${fmt(Math.sqrt(m.r), 1)}, against ${fmt(P.e, 1)} for a paired test, at cost ${fmt(m.cost, 1)}. It buys more certainty per unit cost even after waiting ${m.lat} days.`;
      else if (best.kind === 'make') ex += `Untested dwells carry most of the remaining uncertainty (prior SD ${P.u.toFixed(1)} in the unexplored region), so a new condition removes the most variance per cost. ${m ? `The assay’s effective noise SD (${fmt(Math.sqrt(m.r), 1)}) makes it ${m.u < best.u / 2 ? 'much ' : ''}less efficient right now.` : ''}`;
      else ex += `Noise at tested conditions now dominates the uncertainty in θ, especially at the reference dwell that every θ value shares. An independent repeat at d${best.i} beats exploring${m ? ` and beats an assay whose effective noise SD is ${fmt(Math.sqrt(m.r), 1)}` : ''}.`;
      ex += ` Planned integrated variance V = ${fmt(cand.V0, 2)} (including pending results).`;
      why.innerHTML = ex;
      clock.textContent = `Day ${day} · spent ${fmt(spent, 1)} units · ${obs.filter((o) => !o.fault && o.due > day).length} pending`;
      logEl.innerHTML = log.length ? log.slice().reverse().map((l) => `<div><b>d${l.d}</b><span>${l.t}</span></div>`).join('') : '<div><b>—</b><span>Pilot loaded: paired tests at d0 (×2) and d2 (×2). Change a slider and watch the recommendation move, or execute it.</span></div>';
    }
    function exec(kind, i) {
      const P = params();
      day += 1;
      const n = log.filter((l) => l.act).length + 1;
      const lat = kind === 'measure' ? 6 : 2;
      const cost = (kind === 'measure' ? P.mc + 1 : 4) + P.dly * lat;
      spent += cost;
      const fault = n === 6;
      obs.push({ i, kind, due: day + lat, fault });
      log.push({ d: day, act: true, t: fault ? `${kind.toUpperCase()} at d${i}: <strong>equipment fault</strong> (gas leak flagged by the pressure check). Measurement invalidated and excluded; cost still spent. Not a material result.` : `${kind.toUpperCase()} at d${i} scheduled (cost ${fmt(cost, 1)}); result due day ${day + lat}. Planned uncertainty updated now.` });
      if (n % 5 === 0) { spent += 1; log.push({ d: day, t: 'Mandatory calibration (GC standards, NMR internal standard, temperature check). Cost 1. Not chosen by the optimizer.' }); }
      obs.filter((o) => !o.fault && !o.pilot && o.due === day).forEach((o) => log.push({ d: day, t: `Result arrived: ${o.kind} at d${o.i}. Posterior mean updated.` }));
      draw();
    }
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-exec]')) { if (best) exec(best.kind, best.i); return; }
      const d = e.target.closest('[data-do]'); if (d) { const [k, i] = d.dataset.do.split(':'); exec(k, +i); return; }
      if (e.target.closest('[data-reset]')) { log = []; day = 0; spent = 0; R = rng(2026); seedObs(); draw(); return; }
      const tb = e.target.closest('[data-truth]'); if (tb) { showTruth = !showTruth; tb.setAttribute('aria-pressed', String(showTruth)); draw(); }
    });
    bind(el, ['e', 'rho', 'c', 'mc', 'u'].map((k) => p + k), () => { obs.forEach((o) => { o.val = null; }); R = rng(2026); draw(); });
    $('#' + p + 'd', el).addEventListener('change', draw);
    seedObs(); draw();
    return WC.onRedraw(draw);
  };

  /* ===================== Replay archive ===================== */
  WC.widgets.replay = function (el) {
    const dw = ['d1 (ref)', 'd2', 'd3', 'd4', 'd5'];
    const gT = [8, 7, 5, 3.5, 3];
    const R = rng(77);
    let arch, budget, ledger, frozen;
    function reset() {
      arch = []; budget = 40; ledger = []; frozen = false;
      for (let prep = 0; prep < 3; prep++) for (let j = 0; j < 5; j++) arch.push({ prep, j, g: +(gT[j] + gauss(R) * 1.5).toFixed(1), s: prep < 2 ? +(0.6 * gT[j] + gauss(R) * 0.8).toFixed(1) : null, fault: prep === 1 && j === 3, bought: false, assay: false });
      for (let j = 0; j < 5; j++) arch.push({ prep: 'V', j, g: +(gT[j] + gauss(R) * 1.5).toFixed(1), val: true });
    }
    el.innerHTML = `<div class="panel"><div class="panel-head"><h2 class="p-title">Pay before you reveal</h2>${WC.ev('sim')}</div>${WC.simBanner('Synthetic archive · each tile is one independent paired preparation (CO and N₂ electrodes) at a dwell')}
<div class="panel-body"><p class="small">Click a tile to buy its recorded performance result (4 units). Bought tiles offer their recorded companion assay (3 units), if one exists. The hatched row is hidden validation: it never guides acquisition and opens only when you freeze.</p>
<div class="replay-grid" data-g role="group" aria-label="Archive tiles"></div>
<div class="btn-row"><button class="btn btn-sm" data-more>Ask for a 4th preparation at d3</button><button class="btn btn-primary btn-sm" data-freeze>Freeze and score against validation</button><button class="btn btn-sm" data-reset>Reset archive</button><span class="small mono" data-b></span></div>
<div class="readout neutral" data-s aria-live="polite"></div><div class="log" data-l></div></div>
<div class="panel-foot">Archive rules from the proposal: policy-independent fixed grid, replicated, with failures, costs and timestamps; replay reveals only acquired measurements; validation preparations stay hidden. This exercise shows access rules, not a benchmark result.</div></div>`;
    const G = $('[data-g]', el), B = $('[data-b]', el), Sx = $('[data-s]', el), L = $('[data-l]', el);
    function draw() {
      let h = '<span></span>' + dw.map((d) => `<span class="rh" style="justify-content:center">${d}</span>`).join('');
      [0, 1, 2, 'V'].forEach((prep) => {
        h += `<span class="rh">${prep === 'V' ? 'Validation' : 'Prep ' + (prep + 1)}</span>`;
        for (let j = 0; j < 5; j++) {
          const t = arch.find((a) => a.prep === prep && a.j === j);
          if (prep === 'V') { h += `<button class="tile val${frozen ? ' open' : ''}" disabled aria-label="Validation preparation at ${dw[j]}${frozen ? `: g = ${t.g}` : ', hidden'}">${frozen ? `<b>g ${t.g}</b>` : '🔒 hidden'}</button>`; continue; }
          if (!t.bought) h += `<button class="tile" data-t="${prep}:${j}" aria-label="Buy performance result, prep ${prep + 1}, ${dw[j]}, 4 units">buy · 4</button>`;
          else if (t.fault) h += `<button class="tile soldout" disabled aria-label="Recorded equipment fault">fault<br><small>invalid</small></button>`;
          else h += `<button class="tile bought${t.assay ? '' : ''}" data-a="${prep}:${j}" ${t.s == null || t.assay ? 'disabled' : ''} aria-label="g = ${t.g}${t.s == null ? ', no companion assay recorded' : t.assay ? `, assay s = ${t.s}` : ', buy companion assay for 3 units'}"><b>g ${t.g}</b><span style="font-size:.6rem">${t.s == null ? 'no assay recorded' : t.assay ? 's ' + t.s : '+assay · 3'}</span></button>`;
        }
      });
      G.innerHTML = h;
      B.textContent = `Budget left: ${budget} units`;
      L.innerHTML = ledger.slice().reverse().map((x) => `<div><b>${x[0]}</b><span>${x[1]}</span></div>`).join('');
    }
    function est() {
      const per = dw.map((_, j) => { const v = arch.filter((a) => a.prep !== 'V' && a.j === j && a.bought && !a.fault).map((a) => a.g); return v.length ? v.reduce((x, y) => x + y) / v.length : null; });
      const val2 = dw.map((_, j) => arch.find((a) => a.prep === 'V' && a.j === j).g);
      return { per, val2 };
    }
    el.addEventListener('click', (e) => {
      const t = e.target.closest('[data-t]');
      if (t && !frozen) { if (budget < 4) { Sx.textContent = 'Not enough budget. Spending stops here; the policy is scored on what it bought.'; return; } const [pr, j] = t.dataset.t.split(':').map(Number); const a = arch.find((x) => x.prep === pr && x.j === j); a.bought = true; budget -= 4; ledger.push(['−4', `Bought performance result, prep ${pr + 1} at ${dw[j]}${a.fault ? ': recorded equipment fault, invalid (cost still spent)' : `: g = ${a.g}`}.`]); Sx.textContent = a.fault ? 'The archive recorded this run as an equipment fault. Replay reproduces the failure and its cost; it cannot quietly substitute a good run.' : 'Revealed only because you paid for it. Neighboring tiles stay hidden.'; draw(); return; }
      const a2 = e.target.closest('[data-a]');
      if (a2 && !frozen) { if (budget < 3) { Sx.textContent = 'Not enough budget for the assay.'; return; } const [pr, j] = a2.dataset.a.split(':').map(Number); const a = arch.find((x) => x.prep === pr && x.j === j); a.assay = true; budget -= 3; ledger.push(['−3', `Bought companion assay for prep ${pr + 1} at ${dw[j]}: s = ${a.s}.`]); Sx.textContent = 'A companion assay recorded in the archive. In the real benchmark its value would enter through the validated structure–performance link.'; draw(); return; }
      if (e.target.closest('[data-more]')) { Sx.textContent = 'Refused. The archive holds three preparations per dwell. A fourth was never made, so replay cannot provide it. Only a prospective experiment can, and it would be new physical evidence, not replay.'; ledger.push(['0', 'Request for an unrecorded 4th preparation refused.']); draw(); return; }
      if (e.target.closest('[data-reset]')) { reset(); Sx.textContent = 'Archive reset. Same recorded values: replaying again is not new synthesis.'; draw(); return; }
      if (e.target.closest('[data-freeze]')) {
        frozen = true; const { per, val2 } = est();
        if (per[0] == null) { Sx.innerHTML = 'Frozen with no data at the reference dwell, so θ cannot be estimated anywhere: every θ value needs g(t_ref). Reset and buy the reference first.'; draw(); return; }
        const rows = dw.slice(1).map((d, k) => { const j = k + 1; const th = per[j] == null ? null : per[j] - per[0]; const tv = val2[j] - val2[0]; return `<tr><td>${d}</td><td class="num">${th == null ? '—' : fmt(th, 1)}</td><td class="num">${fmt(tv, 1)}</td><td class="num">${th == null ? 'not estimated' : signed(th - tv, 1)}</td></tr>`; }).join('');
        Sx.innerHTML = `<p style="margin:0 0 .4rem"><strong>Scored against hidden validation.</strong> Validation is itself one noisy preparation per dwell, so even a perfect policy shows some error.</p><div class="table-wrap" style="margin:.4rem 0"><table><thead><tr><th>Dwell</th><th class="num">Your θ estimate</th><th class="num">Validation θ</th><th class="num">Difference</th></tr></thead><tbody>${rows}</tbody></table></div><p class="small" style="margin:0">Spent ${40 - budget} units. A real benchmark would compare policies by cost to a variance threshold, gated by error and calibration, across many replays and prospective campaigns.</p>`;
        ledger.push(['✓', 'Acquisition frozen; validation opened for scoring only.']);
        draw();
      }
    });
    reset(); draw();
  };

  /* ===================== Holdout builder ===================== */
  WC.widgets.holdout = function (el) {
    let mode = 'random';
    const conds = ['C1', 'C2', 'C3', 'C4', 'C5'];
    const items = ['coupon A', 'coupon B', 'early window', 'late window', 'TEM (companion)'];
    const R = rng(9);
    const rnd = conds.map(() => [0, 1, 2].map(() => items.map(() => R() < 0.25)));
    el.innerHTML = `<div class="panel"><div class="panel-head"><h2 class="p-title">Build a holdout, then check for leakage</h2>${WC.ev('sim', 'Exercise')}</div>
<div class="panel-body"><div class="seg" role="group" aria-label="Split type"><button data-m="random" aria-pressed="true">Random measurements</button><button data-m="prep" aria-pressed="false">Preparation holdout</button><button data-m="cond" aria-pressed="false">Condition holdout</button></div>
<div data-g style="margin-top:.8rem;overflow-x:auto"></div><div class="readout" data-r aria-live="polite"></div></div>
<div class="panel-foot">Five conditions × three independent preparations; each preparation carries two coupons, two product windows and a companion TEM. Test items are marked ▣ and outlined; training items are plain.</div></div>`;
    const Gd = $('[data-g]', el), r = $('[data-r]', el);
    function isTest(ci, pi, ii) { if (mode === 'random') return rnd[ci][pi][ii]; if (mode === 'prep') return pi === 2; return ci === 3; }
    function draw() {
      $$('[data-m]', el).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === mode)));
      let leaks = 0, nTest = 0;
      let h = '<table><thead><tr><th>Condition</th><th>Prep 1</th><th>Prep 2</th><th>Prep 3</th></tr></thead><tbody>';
      conds.forEach((c2, ci) => {
        h += `<tr><th scope="row">${c2}</th>`;
        [0, 1, 2].forEach((pi) => {
          const flags = items.map((_, ii) => isTest(ci, pi, ii));
          const mixed = flags.some(Boolean) && !flags.every(Boolean);
          if (mixed) leaks++; if (flags.some(Boolean)) nTest++;
          h += `<td style="${mixed ? 'background:var(--st-unres-bg)' : ''}">${items.map((it, ii) => `<span class="chip" style="${flags[ii] ? 'border-color:var(--copper);color:var(--copper);font-weight:600' : ''};margin:1px">${flags[ii] ? '▣ ' : ''}${it}</span>`).join('')}${mixed ? '<div class="small" style="color:var(--st-unres);margin-top:.2rem">✕ leak: split inside one preparation</div>' : ''}</td>`;
        });
        h += '</tr>';
      });
      Gd.innerHTML = `<div class="table-wrap" style="margin:0">${h}</tbody></table></div>`;
      r.className = 'readout' + (leaks ? ' warn' : '');
      r.innerHTML = mode === 'random' ? `<strong>${leaks} preparations leak.</strong> Random measurement-level splits put the early window in training and the late window of the same electrode in testing, or a companion’s TEM on the other side. The model is then “predicting” material it has partly seen. This is not a holdout of anything.` : mode === 'prep' ? `<strong>Preparation holdout, no leaks.</strong> All of Prep 3, with every coupon, window and companion, is held out. Every condition is still seen in training through Preps 1–2, so this tests <em>reproducibility on fresh material</em>, not transfer to new recipes.` : `<strong>Condition holdout, no leaks.</strong> Every preparation of C4 is held out, so the model must predict a recipe it has never seen. This tests <em>transfer within the domain</em>. Keep C4 inside the range of trained conditions, or it becomes extrapolation.`;
    }
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-m]'); if (b) { mode = b.dataset.m; draw(); } });
    draw();
  };
})();
