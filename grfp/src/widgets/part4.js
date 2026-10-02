/* Part IV widgets: outcome verdicts, feasibility gates, teach-back. */
(function () {
  'use strict';
  const WC = window.WC;
  const { esc, $, $$ } = WC;

  /* ===================== Outcome verdicts ===================== */
  const H1Q = [
    ['pi', 'Product interaction (late window)', [['beyond', 'Interval beyond the meaningful bound'], ['equiv', 'Interval inside ±bound'], ['wide', 'Interval straddles the bound']]],
    ['sr', 'Structural retention', [['gasdep', 'Gas-dependent'], ['same', 'Same under both gases'], ['unclear', 'Endpoints not comparable']]],
    ['val', 'Prediction on a new preparation', [['pass', 'Validated'], ['fail', 'Failed'], ['none', 'Not yet run']]],
  ];
  const H2Q = [
    ['cost', 'Cost to V ≤ τ² vs best baseline', [['lower', 'Clearly lower'], ['similar', 'Similar / overlapping'], ['higher', 'Higher']]],
    ['cal', 'Validation error and calibration', [['ok', 'Within limits'], ['bad', 'Outside limits']]],
    ['pros', 'Prospective campaigns', [['agree', 'Agree with replay'], ['few', 'Too few to tell'], ['disagree', 'Contradict replay']]],
  ];
  function h1(s) {
    if (s.sr === 'unclear') return ['unres', 'Unresolved', 'Reduction endpoints differ, so a gas effect on structure cannot be separated from a difference in how far reduction went. Match endpoints first.'];
    if (s.pi === 'wide') return ['unres', 'Unresolved', 'The product interaction could be zero or meaningful. Report it as unresolved and size more independent preparations from the observed variance.'];
    if (s.pi === 'equiv' && s.sr === 'same') return ['est', 'Argues against H1', 'Equivalent structural and product contrasts across gases: activation does not change what the precursor retains, within the declared bounds and window.'];
    if (s.pi === 'equiv' && s.sr === 'gasdep') return ['asm', 'Limits relevance', 'Structure retention depends on gas but output does not: the retained feature does not matter for late-window n-propanol here.'];
    if (s.pi === 'beyond' && s.sr === 'same') return ['asm', 'Processing interaction without structural support', 'A real product interaction (rung 1), but the measured structure does not explain it. Look at mediators that were not measured, such as wetting or surface chemistry.'];
    if (s.pi === 'beyond' && s.sr === 'gasdep') {
      if (s.val === 'pass') return ['hyp', 'Supports H1 (co-design)', 'Gas-dependent retention, a replicated product interaction, and a validated prediction on new material. Claim: processing interaction with an architectural interpretation (rung 2), not a mechanism.'];
      if (s.val === 'fail') return ['asm', 'Interaction supported; structural account weakened', 'The interaction is real, but the structure–performance relationship did not predict new material. The architectural interpretation needs revision.'];
      return ['hyp', 'Supports H1, pending validation', 'Gas-dependent retention with a replicated product interaction supports co-design. The decisive validation on a new preparation is still to run.'];
    }
    return ['unres', 'Unresolved', '—'];
  }
  function h2(s) {
    if (s.cal === 'bad') return ['est', 'Argues against H2', 'Whatever its cost, the policy’s θ fails validation error or calibration limits. A narrow but wrong posterior is not a win.'];
    if (s.pros === 'disagree') return ['unres', 'Replay not confirmed', 'Physical campaigns contradict replay, so replay advantages may reflect archive coverage or idealized delays. Report both; trust the prospective result for physical claims.'];
    if (s.cost === 'similar') return ['unres', 'Unresolved', 'Unresolved comparisons are not wins. The adaptive policy is not shown to be cheaper.'];
    if (s.cost === 'higher') return ['est', 'Argues against H2', 'Simpler strategies reach the same validated precision more cheaply. Check the structural ablation: did characterization add information at all?'];
    if (s.pros === 'few') return ['unres', 'Supported in replay; physical claim unresolved', 'Lower cost in replay, but too few prospective campaigns to claim physical superiority. Uncertainty must match the number of physical campaigns.'];
    return ['hyp', 'Supports H2', 'Lower cost to the validated precision target than both baselines, in replay and prospective campaigns, with error and calibration in limits.'];
  }
  WC.widgets.outcomes = function (el) {
    const s1 = { pi: 'beyond', sr: 'gasdep', val: 'none' }, s2 = { cost: 'lower', cal: 'ok', pros: 'few' };
    const block = (Q, st, h) => Q.map(([k, n, opts]) => `<div style="margin:.5rem 0"><div class="small muted">${n}</div><div class="seg" role="group" aria-label="${esc(n)}">${opts.map(([v, l]) => `<button data-h="${h}" data-k="${k}" data-v="${v}" aria-pressed="${st[k] === v}">${l}</button>`).join('')}</div></div>`).join('');
    el.innerHTML = `<div class="panel"><div class="panel-head"><h2 class="p-title">Choose what you observed; get the verdict</h2>${WC.ev('prop', 'Interpretation rules from the proposal')}</div>
<div class="panel-body"><div class="grid-2"><section><h3 class="lab">H1 · materials</h3><div data-q1></div><div class="readout" data-v1 aria-live="polite"></div></section><section><h3 class="lab">H2 · autonomy</h3><div data-q2></div><div class="readout" data-v2 aria-live="polite"></div></section></div></div></div>`;
    function draw() {
      $('[data-q1]', el).innerHTML = block(H1Q, s1, 1); $('[data-q2]', el).innerHTML = block(H2Q, s2, 2);
      const a = h1(s1), b = h2(s2);
      const v1 = $('[data-v1]', el), v2 = $('[data-v2]', el);
      v1.className = 'readout' + (a[0] === 'unres' ? ' warn' : a[0] === 'hyp' ? '' : ' neutral'); v1.innerHTML = `${WC.ev(a[0], a[1])}<p style="margin:.4rem 0 0">${a[2]}</p>`;
      v2.className = 'readout' + (b[0] === 'unres' ? ' warn' : b[0] === 'hyp' ? '' : ' neutral'); v2.innerHTML = `${WC.ev(b[0], b[1])}<p style="margin:.4rem 0 0">${b[2]}</p>`;
    }
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-h]'); if (!b) return; (b.dataset.h === '1' ? s1 : s2)[b.dataset.k] = b.dataset.v; draw(); const f = $(`[data-h="${b.dataset.h}"][data-k="${b.dataset.k}"][data-v="${b.dataset.v}"]`, el); f && f.focus(); });
    draw();
  };

  /* ===================== Feasibility gates ===================== */
  const GATES = [
    ['Y1', 'Precursor contrast', 'Do two dwells give a reproducible structural contrast across independent heating runs?', 'XRD/SEM/TEM on independent runs; temperature traces.', 'Change the thermal variable (e.g., ramp rate as in Song) or widen the dwell gap before testing the interaction.'],
    ['Y1', 'Comparable reduction endpoints', 'Do both gases reach a verifiable, comparable reduction state under the shared program?', 'Endpoint XRD on companions; residual oxide.', 'Adjust the program (longer activation) or treat reduction extent as a measured covariate; discuss potential control.'],
    ['Y1', 'Product recovery', 'Can n-propanol and other liquids be recovered and assigned to windows reliably?', 'Spike recovery, charge balance, measured delay, anolyte analysis.', 'Redesign collection; widen windows; until fixed, no primary outcome is trustworthy.'],
    ['Y1', 'Companion consistency', 'Are companions similar enough to inform the tested electrode?', 'Assay pairs of companions from the same run.', 'Use companions only for coarse descriptors; let the controller price TEM accordingly.'],
    ['Y1', 'Throughput and interfaces', 'Can one station produce enough independent preparations per week?', 'Timed pilot campaigns; instrument queue times.', 'Reduce the domain; lengthen campaigns; prioritize the 2×2 over expansion.'],
    ['Y2', 'Safety commissioning', 'Are CO interlocks, detection and shutoffs reviewed and approved for unattended operation?', 'Institutional review and commissioning.', 'Run attended only; throughput falls; autonomy is limited to scheduled hours.'],
    ['Y2', 'Closed loop and archive', 'Does the scheduler execute, recover from faults, and build the policy-independent archive?', 'Uptime, fault logs, archive completeness.', 'Narrow the archive grid; report coverage limits.'],
    ['Y3', 'Prospective tests and persistence', 'Do predictions hold on new batches and conditions? Does the interaction persist for 50 h?', 'Holdouts; interleaved campaigns; selected 50-hour runs.', 'Report reproducibility and transfer separately; scope persistence claims to what was measured.'],
  ];
  WC.widgets.gates = function (el) {
    let i = 0;
    el.innerHTML = `<div class="panel"><div class="panel-head"><h2 class="p-title">Feasibility gates</h2>${WC.ev('feas')}</div><div class="panel-body"><div class="term-list" role="group" aria-label="Gates">${GATES.map((g, k) => `<button data-g="${k}" aria-pressed="${k === 0}"><span class="mono small">${g[0]}</span> ${g[1]}</button>`).join('')}</div><div data-d aria-live="polite"></div></div></div>`;
    const d = $('[data-d]', el);
    const draw = () => { const g = GATES[i]; $$('[data-g]', el).forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.g === i))); d.innerHTML = `<div class="grid-2" style="margin-top:.6rem"><div><h3 class="lab">${g[0]} · ${g[1]}</h3><p><strong>Question:</strong> ${g[2]}</p><p class="small"><strong>How it is tested:</strong> ${g[3]}</p><p class="small muted">Pass thresholds are pilot-dependent and not stated in the proposal.</p></div><div><h3 class="lab">${WC.ev('unres', 'If it fails · options to discuss')}</h3><p class="small">${g[4]}</p></div></div>`; };
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-g]'); if (b) { i = +b.dataset.g; draw(); } });
    draw();
  };

  /* ===================== Teach-back ===================== */
  const MUST = {
    t30: ['catalyst transforms', 'Song: inheritance, one activation', 'Li: gas matters', 'cross precursor × gas', 'make / measure / repeat', 'cheaper to a precise answer'],
    t2m: ['three-stage structure', 'shared current program; equal charge ≠ equal reduction', 'late-window n-propanol partial current', 'difference of differences', 'controls (support, loading, ICP-OES, wetting)', 'θ(t)', 'cost per variance reduction', 'validation and calibration gate', 'replay + prospective'],
    tmse: ['oxide → Cu volume loss', 'crystallite ≠ grain', 'air-free vs exposed transfer', 'companions with measured mismatch', 'matched-oxide cooling control', 'claim ceiling: no active site'],
    tsdl: ['θ is a curve, not a maximum', 'heterogeneous actions with latency', 'pending results in the posterior', 'hierarchical joint model', 'policy-independent archive, pay to reveal', 'baselines share everything', 'validation-gated score'],
    tnsf: ['intellectual merit: an untested interaction', 'falsifiable, predeclared interpretation', 'feasibility: staged, one station first', 'safety non-negotiable', 'your preparation, accurately', 'broader impacts: open infrastructure + module + rubric'],
  };
  WC.widgets.teachback = function (el) {
    el.innerHTML = `<div class="panel"><div class="panel-head"><h2 class="p-title">Teach it back</h2><span class="small muted">Drafts save automatically</span></div><div class="panel-body">${WC.teachPrompts.map((t) => `<section style="padding:1rem 0;border-top:1px solid var(--rule)"><h3 class="lab" style="margin-top:0">${esc(t.title)}</h3><p class="small muted">${esc(t.hint)}</p><label class="sr-only" for="tb-${t.id}">${esc(t.title)}</label><textarea id="tb-${t.id}" data-tb="${t.id}" placeholder="Write it from memory first.">${esc(WC.state.teach[t.id] || '')}</textarea>
<details style="margin-top:.5rem"><summary>Check against the must-mention list</summary><div style="margin-top:.4rem">${MUST[t.id].map((m) => `<label class="check-row"><input type="checkbox"> <span>${esc(m)}</span></label>`).join('')}</div></details>
<details style="margin-top:.3rem"><summary>Show a model version</summary><p style="margin-top:.5rem">${esc(t.model)}</p></details></section>`).join('')}</div></div>`;
    $$('[data-tb]', el).forEach((t) => t.addEventListener('input', () => { WC.state.teach[t.dataset.tb] = t.value; WC.saveSoon(); }));
  };
})();
