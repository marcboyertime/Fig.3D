/* Part I widgets: transformation pathway explorer, outcome archetypes. */
(function () {
  'use strict';
  const WC = window.WC;
  const { esc, $, $$, rng } = WC;
  const S = WC.svg;

  /* ---------- Microstructure drawing ---------- */
  // Draw one particle cross-section with Voronoi grains.
  function particle(o) {
    const r = rng(o.seed);
    const bound = S.circlePoly(o.cx, o.cy, o.r, 36, o.wob || .12, r);
    const seeds = [];
    let tries = 0;
    while (seeds.length < o.n && tries < 2000) {
      tries++;
      const a = r() * 2 * Math.PI, d = Math.sqrt(r()) * o.r * .95;
      seeds.push([o.cx + d * Math.cos(a), o.cy + d * Math.sin(a)]);
    }
    const cells = S.voronoi(seeds, bound);
    let g = '';
    const fill = o.fill, stroke = o.stroke;
    cells.forEach((c, i) => {
      if (c.length < 3) return;
      const shade = .82 + (((i * 37) % 10) / 10) * .18;
      g += `<path d="${S.polyPath(c)}" style="fill:${fill};fill-opacity:${shade.toFixed(2)};stroke:${stroke};stroke-width:${o.gbw || 1.1}"/>`;
      if (o.intra) {
        const ce = S.centroid(c), ang = (i * 1.7) % Math.PI;
        const L = Math.min(9, o.r / 4);
        g += `<line x1="${(ce[0] - L * Math.cos(ang)).toFixed(1)}" y1="${(ce[1] - L * Math.sin(ang)).toFixed(1)}" x2="${(ce[0] + L * Math.cos(ang)).toFixed(1)}" y2="${(ce[1] + L * Math.sin(ang)).toFixed(1)}" style="stroke:${stroke};stroke-width:.7;stroke-dasharray:2 2"/>`;
      }
    });
    if (o.pores) for (let k = 0; k < o.pores; k++) { const a = r() * 6.28, d = Math.sqrt(r()) * o.r * .7; g += `<circle cx="${(o.cx + d * Math.cos(a)).toFixed(1)}" cy="${(o.cy + d * Math.sin(a)).toFixed(1)}" r="${(1.5 + r() * 2.5).toFixed(1)}" style="fill:var(--surface);stroke:${stroke};stroke-width:.5"/>`; }
    if (o.skin) g += `<path d="${S.polyPath(bound)}" style="fill:none;stroke:var(--st-asm);stroke-width:${o.skin}"/>`;
    else g += `<path d="${S.polyPath(bound)}" style="fill:none;stroke:${stroke};stroke-width:1.6"/>`;
    if (o.ad) for (let k = 0; k < o.ad; k++) { const p = bound[Math.floor(r() * bound.length)]; g += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.6" style="fill:var(--copper);stroke:var(--surface);stroke-width:.6"/>`; }
    if (o.bumps) for (let k = 0; k < bound.length; k += 2) { const p = bound[k]; g += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.4" style="fill:${fill};stroke:${stroke};stroke-width:.8"/>`; }
    if (o.co) for (let k = 0; k < o.co; k++) { const p = bound[Math.floor(r() * bound.length)]; const dx = (p[0] - o.cx) / o.r, dy = (p[1] - o.cy) / o.r; g += `<g><circle cx="${(p[0] + dx * 5).toFixed(1)}" cy="${(p[1] + dy * 5).toFixed(1)}" r="2.2" style="fill:var(--ink-2)"/><circle cx="${(p[0] + dx * 9).toFixed(1)}" cy="${(p[1] + dy * 9).toFixed(1)}" r="2" style="fill:var(--steel)"/></g>`; }
    return g;
  }

  const STAGES = [
    { id: 'coat', n: '1', t: 'Nitrate coating', sub: 'Cu(NO₃)₂ sprayed on carbon paper' },
    { id: 'oxide', n: '2', t: 'Joule-heated CuₓO', sub: 'precatalyst, two dwell times' },
    { id: 'act', n: '3', t: 'Activation endpoint', sub: 'after shared current program' },
    { id: 'work', n: '4', t: 'Working Cu', sub: 'under bias, CO feed' },
    { id: 'rec', n: '5', t: 'Recovered Cu', sub: 'postmortem, bias off' },
  ];
  const SCEN = {
    inherit: { label: 'Precursor dominates', d: 'Both gases keep the dwell contrast.' },
    gasdep: { label: 'Gas-dependent retention', d: 'One gas keeps the contrast, the other erodes it. Which gas does which is not known; the picture arbitrarily shows CO keeping it.' },
    erase: { label: 'Activation overwrites', d: 'Both precursors converge to the same copper under either gas.' },
  };
  // Grain counts per precursor per stage given scenario & gas.
  function grains(stage, scen, gas, which) {
    const fine = which === 'A';
    if (stage === 'oxide') return { n: fine ? 30 : 9, intra: fine };
    const keep = scen === 'inherit' || (scen === 'gasdep' && gas === 'CO');
    if (keep) return { n: fine ? 26 : 9, intra: fine, seedShift: 0 };
    if (scen === 'gasdep') return { n: fine ? 16 : 12, intra: false, seedShift: 0 };
    return { n: 13, intra: false, seedShift: 99 };
  }
  function contrast(stage, scen, gas) {
    if (stage === 'coat') return ['none yet', 'Both coatings are the same salt film; the dwell contrast is created in the next step.'];
    if (stage === 'oxide') return ['large', 'The two dwell times are intended to create different oxide microstructures. Whether they do is the first pilot gate.'];
    const keep = scen === 'inherit' || (scen === 'gasdep' && gas === 'CO');
    if (keep) return ['retained', 'The fine/coarse difference survives into the copper.'];
    if (scen === 'gasdep') return ['reduced', 'The difference is eroded under this gas.'];
    return ['none', 'Both precursors converge to the same copper.'];
  }
  const INFO = {
    coat: {
      phys: 'A robot sprays copper nitrate solution onto carbon paper; solvent evaporates and leaves a salt film. Loading (mass per area) is set here and must be measured, because a loading difference can masquerade as a structural one.',
      meas: 'Mass gain, optical images, ICP-OES on digested reference coupons for copper loading.',
      ev: [['prop', 'Robotic spray of copper nitrate on carbon paper.'], ['pilot', 'Nozzle program and loading are not fixed in the proposal.']],
    },
    oxide: {
      phys: 'Current through the carbon paper heats it in seconds. Nitrate decomposes to copper oxide; grains nucleate and grow; the quench freezes the microstructure. The longer dwell gives more time for coarsening and phase change.',
      meas: 'Calibrated temperature trace; XRD for phase fractions and coherent-domain size; SEM for particles and porosity; selected TEM for grains and subgrains.',
      ev: [['est', 'Joule heating with rapid cooling can set nanoscale grain structure (Song, via ramp rate).'], ['pilot', 'That two dwell times at fixed peak temperature give a reproducible contrast.']],
    },
    act: {
      phys: 'Under the shared current–time program, oxygen leaves the oxide (≈40–45% volume loss per Cu). Under CO, CO adsorbs on fresh copper and also reduces to products; under N₂, the current goes to oxide reduction and hydrogen evolution.',
      meas: 'XRD (residual oxide), SEM, companion TEM, all on recovered samples. Activation products are collected separately.',
      ev: [['est', 'In Li’s flow cell, CO reduction gave adparticles; N₂ gave grain-boundary-rich copper.'], ['hyp', 'Retention of the dwell contrast depends on the gas.'], ['unres', 'Whether endpoints reach comparable reduction; equal charge does not guarantee it.']],
    },
    work: {
      phys: 'All electrodes now run under CO at the same total current. Adsorbed CO can keep reshaping the surface. In Li, the N₂-derived boundary-rich surface restructured into nanobumps under CO.',
      meas: 'Products (GC for gases, quantitative NMR for liquids) in early and late windows; voltage. Structure is not observed directly unless operando methods (optional) are used.',
      ev: [['est', 'Li: N₂-derived surface restructured during subsequent CO operation (flow cell).'], ['unres', 'Whether this happens in the MEA, and how fast.']],
    },
    rec: {
      phys: 'Bias is removed and the electrode is taken out. Without protection, copper can oxidize in air; Yang et al. saw metallic nanograins become Cu₂O nanocubes. Air-free transfer reduces this but does not recreate the working state.',
      meas: 'XRD, SEM, blinded TEM after air-free transfer, compared with a deliberately air-exposed control.',
      ev: [['est', 'Recovered copper can differ from the operando state (Yang).'], ['prop', 'Air-free transfer checked against deliberate exposure.']],
    },
  };

  WC.widgets.pathway = function (el) {
    const st = { stage: 'act', gas: 'CO', scen: 'gasdep', air: 'free' };
    el.innerHTML = `<div class="panel">
<div class="panel-head"><h2 class="p-title">Precursor → working catalyst</h2>${WC.ev('sim', 'Conceptual pathways · not predicted outcomes')}</div>
${WC.simBanner('Conceptual schematic · grain pictures illustrate possibilities, not measured or predicted microstructures')}
<div class="panel-body">
  <div class="stage-strip" role="group" aria-label="Choose a stage">${STAGES.map((s) => `<button class="stage-card" data-stage="${s.id}" aria-pressed="false"><span class="st-n">STAGE ${s.n}</span><span class="st-t">${s.t}</span><svg viewBox="0 0 120 54" aria-hidden="true" data-thumb="${s.id}"></svg></button>`).join('')}</div>
  <div class="controls" style="margin-top:1rem">
    <div><div class="small muted" id="pw-gas-l">Activation gas</div><div class="seg" role="group" aria-labelledby="pw-gas-l"><button data-gas="CO">CO</button><button data-gas="N2">N₂</button></div></div>
    <div><div class="small muted" id="pw-scen-l">Conceptual pathway</div><div class="seg" role="group" aria-labelledby="pw-scen-l">${Object.entries(SCEN).map(([k, v]) => `<button data-scen="${k}">${v.label}</button>`).join('')}</div></div>
    <div data-airwrap><div class="small muted" id="pw-air-l">Transfer after test (affects stage 5)</div><div class="seg" role="group" aria-labelledby="pw-air-l"><button data-air="free">Air-free</button><button data-air="exposed">Air-exposed</button></div></div>
  </div>
  <div class="chart" data-big></div>
  <div class="readout" data-read aria-live="polite"></div>
  <div class="grid-2" data-info></div>
</div>
<div class="panel-foot">Precursor A = shorter dwell, drawn with finer grains and dashed intragrain features; precursor B = longer dwell, coarser grains. That a shorter dwell gives finer grains is a teaching assumption, not a result.</div></div>`;
    const big = $('[data-big]', el), read = $('[data-read]', el), info = $('[data-info]', el);
    function draw() {
      $$('[data-stage]', el).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.stage === st.stage)));
      $$('[data-gas]', el).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.gas === st.gas)));
      $$('[data-scen]', el).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.scen === st.scen)));
      $$('[data-air]', el).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.air === st.air)));
      
      const W = 640, H = 250;
      let g = '';
      ['A', 'B'].forEach((which, k) => {
        const cx = 160 + k * 320, cy = 120;
        g += `<text x="${cx}" y="18" text-anchor="middle" class="svg-title">Precursor ${which} · ${which === 'A' ? 'shorter dwell' : 'longer dwell'}</text>`;
        g += drawStage(st.stage, which, cx, cy, st);
      });
      big.innerHTML = S.svg(W, H, g, `Stage ${st.stage}: precursors A and B under ${st.gas} activation, ${SCEN[st.scen].label} pathway.`);
      const c = contrast(st.stage, st.scen, st.gas);
      read.innerHTML = `<strong>A–B structural contrast at this stage: ${c[0]}.</strong> ${c[1]} ${['act', 'work', 'rec'].includes(st.stage) ? `<span class="muted">Pathway shown: ${SCEN[st.scen].d}</span>` : ''}`;
      const I = INFO[st.stage];
      info.innerHTML = `<div><h3 class="lab">What happens physically</h3><p>${I.phys}</p><h3 class="lab">What can observe it</h3><p>${I.meas}</p></div><div><h3 class="lab">Status of these claims</h3>${I.ev.map((e) => WC.claim(e[0], e[1])).join('')}${st.stage === 'rec' ? `<p class="small" style="margin-top:.6rem">${st.air === 'exposed' ? 'Thick outline: an air-formed oxide shell. A TEM of this sample would mostly report the handling, not the catalyst.' : 'Thin outline: protected transfer limits oxidation, but the sample is still not under bias. The proposal checks this against deliberate exposure.'}</p>` : ''}${st.stage === 'work' && st.gas === 'N2' ? '<p class="small" style="margin-top:.6rem">Bumps on the outline echo Li et al.: an N₂-derived, boundary-rich surface reshaping once CO operation begins. Whether that happens in this MEA is unknown.</p>' : ''}</div>`;
    }
    function drawStage(stage, which, cx, cy, s) {
      if (stage === 'coat') {
        let g = '';
        for (let i = 0; i < 7; i++) g += `<circle cx="${cx - 105 + i * 35}" cy="${cy + 40}" r="15" style="fill:var(--sunk);stroke:var(--rule-strong)"/>`;
        g += `<rect x="${cx - 120}" y="${cy - 4}" width="240" height="26" rx="6" style="fill:var(--steel-soft);stroke:var(--steel)"/><text x="${cx}" y="${cy + 13}" text-anchor="middle" class="svg-label">Cu(NO₃)₂ salt film</text><text x="${cx}" y="${cy + 78}" text-anchor="middle" class="svg-text">carbon fibers</text>`;
        return g;
      }
      const gr = grains(stage, s.scen, s.gas, which);
      const isOx = stage === 'oxide';
      const seed = (which === 'A' ? 11 : 23) + (gr.seedShift || 0);
      const base = { cx, cy, r: isOx ? 92 : 80, n: gr.n, intra: gr.intra, seed, fill: isOx ? 'var(--st-asm-bg)' : 'var(--copper-soft)', stroke: isOx ? 'var(--st-asm)' : 'var(--copper)', pores: isOx ? 0 : 9 };
      if (stage === 'act') { if (s.gas === 'CO') base.ad = 10; else { base.gbw = 1.4; } }
      if (stage === 'work' || stage === 'rec') { base.co = stage === 'work' ? 14 : 0; if (s.gas === 'N2') base.bumps = true; else base.ad = 8; }
      if (stage === 'rec') base.skin = s.air === 'exposed' ? 7 : 2.2;
      return particle(base) + (isOx ? `<text x="${cx}" y="${cy + 112}" text-anchor="middle" class="svg-text">copper oxide grains</text>` : `<text x="${cx}" y="${cy + 102}" text-anchor="middle" class="svg-text">${stage === 'act' ? (s.gas === 'CO' ? 'Cu + adparticles (Li, CO)' : 'Cu, boundary-rich (Li, N₂)') : stage === 'work' ? 'Cu with adsorbed CO' : 'recovered Cu'}</text>`);
    }
    function thumbs() {
      $$('[data-thumb]', el).forEach((svg) => {
        const id = svg.dataset.thumb;
        if (id === 'coat') { svg.innerHTML = `<rect x="10" y="18" width="100" height="14" rx="4" style="fill:var(--steel-soft);stroke:var(--steel)"/>${[20, 45, 70, 95].map((x) => `<circle cx="${x}" cy="42" r="8" style="fill:var(--sunk);stroke:var(--rule-strong)"/>`).join('')}`; return; }
        const isOx = id === 'oxide';
        svg.innerHTML = particle({ cx: 34, cy: 27, r: 22, n: 12, seed: 11, fill: isOx ? 'var(--st-asm-bg)' : 'var(--copper-soft)', stroke: isOx ? 'var(--st-asm)' : 'var(--copper)', skin: id === 'rec' ? 3 : 0, co: id === 'work' ? 6 : 0 }) + particle({ cx: 86, cy: 27, r: 22, n: 5, seed: 23, fill: isOx ? 'var(--st-asm-bg)' : 'var(--copper-soft)', stroke: isOx ? 'var(--st-asm)' : 'var(--copper)', skin: id === 'rec' ? 3 : 0, co: id === 'work' ? 6 : 0 });
      });
    }
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.stage) st.stage = b.dataset.stage;
      else if (b.dataset.gas) st.gas = b.dataset.gas;
      else if (b.dataset.scen) st.scen = b.dataset.scen;
      else if (b.dataset.air) st.air = b.dataset.air;
      else return;
      draw();
    });
    thumbs(); draw();
  };

  /* ---------- Outcome archetypes ---------- */
  const ARCH = [
    { id: 'gasdep', label: 'Gas-dependent retention', s: { CO: [1, .85, .8], N2: [1, .2, .15] }, p: { AN: 12, BN: 12.5, AC: 14, BC: 20 },
      mean: 'The dwell contrast survives under one gas and fades under the other, in structure and in products. This is the pattern H1 predicts.', h1: ['support', 'Supports H1, if replicated with independent preparations and the interval excludes the meaningful bound.'] },
    { id: 'inherit', label: 'Precursor dominates', s: { CO: [1, .9, .85], N2: [1, .9, .85] }, p: { AN: 11, BN: 17, AC: 12, BC: 18 },
      mean: 'Both gases preserve the contrast equally. Synthesis matters; activation gas does not change how much.', h1: ['against', 'Argues against H1’s gas dependence (precursor main effect only), if contrasts are equivalent within bounds.'] },
    { id: 'erase', label: 'Activation overwrites', s: { CO: [1, .05, 0], N2: [1, .05, 0] }, p: { AN: 13, BN: 13, AC: 16, BC: 16 },
      mean: 'Both precursors converge under either gas. A gas main effect can remain, but precursor history is irrelevant to this output.', h1: ['against', 'Argues against H1 within bounds; processing history of this kind does not matter here.'] },
    { id: 'additive', label: 'Additive effects', s: { CO: [1, .6, .55], N2: [1, .6, .55] }, p: { AN: 10, BN: 14, AC: 16, BC: 20 },
      mean: 'Dwell and gas each shift output, by the same amounts regardless of the other. Two useful main effects, no interaction.', h1: ['against', 'Argues against H1 (no interaction), even though both factors matter.'] },
    { id: 'later', label: 'Later erasure', s: { CO: [1, .8, .1], N2: [1, .8, .1] }, p: { AN: 13, BN: 13.4, AC: 15, BC: 15.3 },
      mean: 'Activation keeps the contrast, but operation erases it. The early product window might still show a difference; the late window does not.', h1: ['limits', 'Not support for H1 in the late window. The early window and the post-operation structure explain why.'] },
    { id: 'structonly', label: 'Structure without product relevance', s: { CO: [1, .85, .8], N2: [1, .2, .15] }, p: { AN: 12, BN: 12, AC: 15, BC: 15 },
      mean: 'Structure retention depends on gas, but n-propanol output does not. The retained feature does not matter for this product at this current.', h1: ['limits', 'Partial: gas-dependent structural retention without a product interaction. It bounds relevance to the measured output.'] },
    { id: 'imprecise', label: 'Imprecise result', s: { CO: [1, .7, .6], N2: [1, .4, .35] }, p: { AN: 12, BN: 13.5, AC: 14, BC: 18 }, err: 3.2,
      mean: 'The point estimates hint at an interaction, but the uncertainty spans both zero and meaningful values.', h1: ['unresolved', 'Unresolved. Not evidence for or against H1; more independent preparations are needed.'] },
  ];
  WC.widgets.archetypes = function (el) {
    let cur = 'gasdep';
    el.innerHTML = `<div class="panel"><div class="panel-head"><h2 class="p-title">What each answer would look like</h2>${WC.ev('sim')}</div>${WC.simBanner()}
<div class="panel-body"><div class="term-list" role="group" aria-label="Outcome pattern">${ARCH.map((a) => `<button data-a="${a.id}" aria-pressed="false">${a.label}</button>`).join('')}</div>
<div class="grid-2"><div><h3 class="lab">Structural contrast A − B at each stage</h3><div class="chart" data-s></div><div class="legend"><span><span class="sw" style="background:var(--c-co)"></span>● CO-activated</span><span style="color:var(--c-n2)"><span class="sw dash"></span><span style="color:var(--ink-2)">■ N₂-activated</span></span></div></div>
<div><h3 class="lab">Late-window n-propanol (mA cm⁻², invented)</h3><div class="chart" data-p></div><div class="legend"><span><span class="sw" style="background:var(--c-n2)"></span>N₂-activated</span><span><span class="sw" style="background:var(--c-co)"></span>CO-activated</span></div></div></div>
<div class="readout" data-r aria-live="polite"></div></div></div>`;
    const sEl = $('[data-s]', el), pEl = $('[data-p]', el), rEl = $('[data-r]', el);
    function draw() {
      const a = ARCH.find((x) => x.id === cur);
      $$('[data-a]', el).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.a === cur)));
      // Structure chart
      const W = 320, H = 200;
      const f = S.frame({ w: W, h: H, x: [0, 2], y: [0, 1.1], xt: [0, 1, 2], yt: [0, .5, 1], xfmt: (v) => ['precursor', 'endpoint', 'after test'][v], yfmt: (v) => v === 1 ? 'full' : v === 0 ? 'none' : 'half', m: { l: 40, b: 30 } });
      let g = f.axes;
      [['CO', 'var(--c-co)', ''], ['N2', 'var(--c-n2)', '6 4']].forEach(([k, c, d]) => {
        const pts = a.s[k].map((v, i) => [f.x(i), f.y(v)]);
        g += `<path d="${S.path(pts)}" style="fill:none;stroke:${c};stroke-width:2.4" stroke-dasharray="${d}"/>`;
        pts.forEach((p) => { g += k === 'CO' ? `<circle cx="${p[0]}" cy="${p[1]}" r="4.5" style="fill:${c}"/>` : `<rect x="${p[0] - 4}" y="${p[1] - 4}" width="8" height="8" style="fill:${c}"/>`; });
        if (a.err) pts.slice(1).forEach((p) => { g += `<line x1="${p[0] + (k === 'CO' ? -6 : 6)}" x2="${p[0] + (k === 'CO' ? -6 : 6)}" y1="${f.y(Math.min(1.1, a.s[k][1] + .3))}" y2="${f.y(Math.max(0, a.s[k][1] - .3))}" style="stroke:${c};stroke-width:1.2"/>`; });
      });
      sEl.innerHTML = S.svg(W, H, g, `Structural contrast for ${a.label}: CO ${a.s.CO.join(', ')}; N2 ${a.s.N2.join(', ')}.`);
      // Product chart: grouped bars
      const f2 = S.frame({ w: W, h: H, x: [0, 2], y: [0, 24], xt: [], yt: [0, 10, 20], m: { l: 36, b: 30 } });
      let h = f2.axes;
      const groups = [['A (short)', a.p.AN, a.p.AC], ['B (long)', a.p.BN, a.p.BC]];
      groups.forEach((gr, i) => {
        const x0 = 70 + i * 130;
        [[gr[1], 'var(--c-n2)'], [gr[2], 'var(--c-co)']].forEach(([v, c], j) => {
          const x = x0 + j * 44;
          h += `<rect x="${x}" y="${f2.y(v)}" width="38" height="${f2.y(0) - f2.y(v)}" style="fill:${c}" rx="2"/><text x="${x + 19}" y="${f2.y(v) - 4}" text-anchor="middle" class="svg-text">${v}</text>`;
          if (a.err) h += `<line x1="${x + 19}" x2="${x + 19}" y1="${f2.y(v + a.err)}" y2="${f2.y(Math.max(0, v - a.err))}" style="stroke:var(--ink);stroke-width:1.2"/>`;
        });
        h += `<text x="${x0 + 41}" y="${H - 12}" text-anchor="middle" class="svg-label">${gr[0]}</text>`;
      });
      pEl.innerHTML = S.svg(W, H, h, `Products for ${a.label}: A N2 ${a.p.AN}, A CO ${a.p.AC}, B N2 ${a.p.BN}, B CO ${a.p.BC}.`);
      const dod = (a.p.BC - a.p.BN) - (a.p.AC - a.p.AN);
      const tag = { support: 'hyp', against: 'est', limits: 'asm', unresolved: 'unres' }[a.h1[0]];
      rEl.className = 'readout' + (a.h1[0] === 'unresolved' ? ' warn' : a.h1[0] === 'support' ? '' : ' neutral');
      rEl.innerHTML = `<p style="margin:0 0 .4rem"><strong>${a.label}.</strong> ${a.mean}</p><p style="margin:0 0 .4rem">Difference of differences in products: (${a.p.BC} − ${a.p.BN}) − (${a.p.AC} − ${a.p.AN}) = <strong>${WC.signed(dod, 1)}</strong> mA cm⁻²${a.err ? ', with an uncertainty wide enough to include 0 and large values' : ''}.</p><p style="margin:0">${WC.ev(tag, a.h1[0] === 'support' ? 'Would support H1' : a.h1[0] === 'against' ? 'Would argue against H1' : a.h1[0] === 'limits' ? 'Partial / bounded' : 'Unresolved')} ${a.h1[1]}</p>`;
    }
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (b) { cur = b.dataset.a; draw(); } });
    draw();
    return WC.onRedraw(draw);
  };
})();
