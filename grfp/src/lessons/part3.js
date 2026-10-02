/* PART III — THE SELF-DRIVING LAB */
(function () {
  'use strict';
  const WC = window.WC;
  const { ev, call, reviewer, term: T, src, ref, go, link, widget, check, rig, eq, concept, claims } = WC;

  /* ---------------- Lesson 15 ---------------- */
  WC.lesson({
    id: 'hardware', part: 'sdl', short: 'What physically gets automated', minutes: 14,
    title: 'What physically gets <em>automated</em>',
    lede: 'A self-driving lab is hardware, software and safety engineering before it is an algorithm. Here is the physical station the proposal describes, what is robotic, what stays manual or shared, and what you would actually build.',
    goals: ['The stations in the loop and which are automated, manual or shared facilities.', 'Where data come from and how long each takes.', 'What you would physically be doing in Years 1–3.'],
    concepts: ['c-hardware'],
    body: () => `
<p><q>A scheduler executes robotic coating/heating, cassette handling, gas switching and testing; delayed results update subsequent batches. Calibrations and safety checks are mandatory.</q> ${src('P08')}</p>
${widget('station')}
${claims([
  ['est', 'Robotic gas-fed electrode testing exists: Soni et al.’s seven-robot platform fabricated, characterized and tested up to 90 GDEs per campaign for CO₂ electrolysis ' + ref(3) + '.'],
  ['prop', 'Robotic coating and Joule heating, cassette handling, gas switching and MEA testing, driven by one scheduler ' + src('P08') + '.'],
  ['prop', 'Extend one station before parallelizing ' + src('P10') + '.'],
  ['asm', 'A host lab with existing gas-fed testing and shared microscopy and NMR will be found. The proposal says “seek”; nothing is confirmed ' + src('P10') + '.'],
  ['pilot', 'Which assays are automated versus manual, the cassette design, and the instrument interfaces. Not specified.'],
])}
${call('mis', '<p><strong>“Self-driving means every instrument is robotic.”</strong> The defining feature is that the model’s decision changes the next physical experiment. Facility TEM and a shared NMR can stay manual if their interfaces and delays are recorded honestly ' + src('P08') + '.</p>', { side: true })}
<h2><span class="h-num">15.1</span>What you would physically be doing</h2>
<div class="table-wrap"><table><thead><tr><th>Period</th><th>Bench and build work</th><th>Software and analysis</th></tr></thead><tbody>
<tr><td>Year 1</td><td>Tune spray coating and Joule heating; calibrate temperature measurement; design and machine a cassette; validate GC and NMR recovery with spikes; run the 2×2 pilot by hand and with partial automation; measure companion mismatch.</td><td>Instrument drivers; a sample database with lineage (sheet → coupons → tests → assays); variance-component estimates from the pilot.</td></tr>
<tr><td>Year 2</td><td>Integrate gas switching and cassette handling with the test station; commission CO interlocks with safety staff; collect the policy-independent reference archive.</td><td>Scheduler, joint model, acquisition function; replay harness that reveals only paid-for data.</td></tr>
<tr><td>Year 3</td><td>Run prospective campaigns interleaved across days; new preparations and held-out conditions; selected 50-hour tests.</td><td>Benchmarking against baselines; ablations; write-up and data release.</td></tr></tbody></table></div>
<p class="small muted ui">${ev('bgd', 'Interpretation')} Built from the proposal’s three-year plan ${src('P10')}. The split of tasks is a plausible reading, not a commitment in the text.</p>
${reviewer('What does your robot do that a technician following a design of experiments would not?', 'A technician executes a list chosen in advance. The SDL changes the next experiment based on what it has learned, including whether to spend effort on a new condition, an independent repeat or a slow structural assay, and it plans around results still in flight. Whether that adaptivity is worth anything is Aim 2’s hypothesis, tested against fixed and adaptive baselines on the same budget.')}
${call('asm', '<p>Unattended CO operation requires professionally reviewed interlocks and commissioning ' + src('P10') + '. CO is toxic and odorless; detection, ventilation and automatic shutoff are institutional requirements, not optimizer settings. This guide contains no operating setpoints or safety procedure.</p>')}
${check('q-sdl')}
`,
  });

  /* ---------------- Lesson 16 ---------------- */
  WC.lesson({
    id: 'loops', part: 'sdl', short: 'Fast loop vs slow loop', minutes: 15,
    title: 'Fast loop versus <em>slow loop</em>',
    lede: 'Gas products arrive in minutes, liquid products in hours or days, facility microscopy in days or weeks. A lab that waits for everything before deciding mostly waits. A scheduler lets decisions proceed on the information that exists, and folds in the rest when it arrives.',
    goals: ['Which information is immediate and which arrives with latency.', 'Why the system must choose the next experiment before all previous results return.', 'How cheap inline proxies differ from destructive companion assays.'],
    concepts: ['c-latency'],
    body: () => `
<div class="table-wrap"><table><thead><tr><th>Information</th><th>Typical latency</th><th>Destroys the specimen?</th><th>Tells you about</th></tr></thead><tbody>
<tr><td>Temperature trace, loading, optical image</td><td>Immediate</td><td>No</td><td>The preparation as made</td></tr>
<tr><td>Quick precursor diffraction</td><td>About an hour</td><td>No</td><td>Phases, coherent-domain size</td></tr>
<tr><td>Voltage, online GC (gases)</td><td>Minutes, during the test</td><td>No</td><td>Hydrogen, ethylene; the electrode’s health</td></tr>
<tr><td>Quantitative NMR (liquids, incl. n-propanol)</td><td>Hours to days (shared queue)</td><td>No (sample)</td><td>The primary outcome</td></tr>
<tr><td>Post-operation XRD/SEM</td><td>Hours</td><td>Perturbs (removed from cell)</td><td>Post-operation phases and morphology</td></tr>
<tr><td>Blinded TEM on companions</td><td>Days to weeks</td><td>Yes</td><td>Grain/subgrain and surface structure, locally</td></tr></tbody></table></div>
<p class="small muted ui">${ev('pilot', 'Illustrative latencies')} The proposal names the assays and the existence of delay, not the times.</p>
${widget('timeline')}
${concept({
  title: 'Deciding with results still in flight',
  intuition: '<p>If you have ordered an experiment, you know you will learn something about that condition even before you know the answer. A good scheduler counts that future information when choosing the next experiment, so it does not order the same thing twice.</p>',
  formal: '<p>In a linear-Gaussian model, the posterior covariance after an observation depends on <em>where</em> and <em>how noisily</em> you observe, not on the value you will see. So the controller can condition its uncertainty on pending experiments exactly, before their results return, and choose the next action against that “planned” covariance. The posterior mean updates only when the value arrives. For non-Gaussian models, the same idea is approximated by imagining (“fantasizing”) the pending results.</p>',
  example: '<p>Two electrodes at dwell t₃ are in the NMR queue. Without accounting for them, the controller sees high uncertainty at t₃ and orders a third. Conditioning on the pending pair, it sees that t₃ is already covered and picks t₅ instead.</p>',
  counter: '<p>If the model is badly wrong about how informative a pending assay is (for example, the TEM link is weaker than assumed), conditioning on it will make the controller overconfident until the result arrives. That is one reason the proposal validates the assay link before relying on it.</p>',
  why: '<p><q>Delayed results update subsequent batches.</q> ' + src('P08') + ' Delay is also counted in cost: an informative assay that takes three weeks may lose to a slightly less informative one that takes a day.</p>',
  check: 'q-pending',
})}
${call('key', '<p><strong>Inline proxies versus destructive companions.</strong> A proxy measured on the tested electrode (mass, a quick diffraction pattern, voltage) is cheap, immediate and about the right object, but less specific. A destructive assay on a companion is specific and slow, and it describes a different object. The controller weighs both, and their costs, against the same target.</p>')}
${reviewer('Why not just wait for all results before choosing the next experiment?', 'Because the slowest results take days or weeks, so the lab would sit idle most of the time, and channel time is the scarce resource. The model can account for pending experiments exactly in a linear-Gaussian setting and approximately otherwise, so it can keep the station busy without duplicating work.')}
${check('q-latency')}
`,
  });

  /* ---------------- Lesson 17 ---------------- */
  WC.lesson({
    id: 'actions', part: 'sdl', short: 'Make / measure / repeat', minutes: 13,
    title: '<em>Make</em>, <em>measure</em>, <em>repeat</em>',
    lede: 'Three verbs, each a physical bundle of jobs with its own cost, latency and kind of information. Calibrations, controls and safety checks are not on the menu: they always run.',
    goals: ['Exactly what each action is, physically.', 'What each action costs and what it tells the model.', 'How equipment faults differ from material failures.'],
    concepts: ['c-actions'],
    body: () => `
<p><q>The controller selects a new preparation–activation pair, independent repeat or validated structural assay…</q> ${src('P08')}</p>
${widget('actions')}
${claims([
  ['prop', '<strong>Make</strong>: a new preparation–activation pair at a condition (dwell, gas composition) not yet tested, within the validated window.'],
  ['prop', '<strong>Repeat</strong>: an independent coating/heating run at an already-tested condition. A new GC injection or image is not a repeat.'],
  ['prop', '<strong>Measure</strong>: a validated structural assay on a companion (or a post-test specimen). It costs a specimen, instrument time, analysis and delay.'],
  ['prop', '<strong>Not choices:</strong> calibrations, compulsory controls and safety checks are scheduled for every policy and charged to every policy ' + src('P08') + '.'],
])}
<h2><span class="h-num">17.1</span>When things fail</h2>
<p><q>Equipment faults invalidate measurements; reproducible material failures remain feasibility outcomes.</q> ${src('P08')}</p>
${widget('failures')}
${call('mis', '<p><strong>“Delete failed runs so they don’t bias the model.”</strong> Deleting reproducible delamination at one preparation makes a fragile recipe look good. Material failures are data about feasibility; only equipment faults are removed, and they are logged.</p>', { side: true })}
${reviewer('Isn’t “repeat” just replication you would do anyway?', 'In a fixed design, yes. Here repeat competes for budget with new conditions and assays. Repeating is worth it when the uncertainty about θ is dominated by noise at a tested condition; exploring is worth it when it is dominated by untested regions. Binois et al. study exactly this trade-off for stochastic simulators.')}
${check('q-repeat')}
${check('q-failure')}
`,
  });

  /* ---------------- Lesson 18 ---------------- */
  WC.lesson({
    id: 'model', part: 'sdl', short: 'What the model believes', minutes: 16,
    title: 'What the model <em>believes</em>',
    lede: 'The model holds a best guess and an uncertainty for the quantity it is learning. The uncertainty is the part that decides experiments. It is also the part that can be confidently wrong.',
    goals: ['What a posterior mean and posterior uncertainty are, intuitively and formally.', 'What “hierarchical joint model” means, level by level.', 'Why better prediction from structural data is not proof of causal mediation, and what counts as leakage.'],
    concepts: ['c-posterior', 'c-mediation'],
    body: () => `
${concept({
  title: 'Posterior uncertainty',
  intuition: '<p>Before data, the model allows many plausible curves. Each measurement rules some out. The spread of curves that remain is the posterior uncertainty. It is narrow near good data and wide far from it.</p>',
  formal: '<p>With prior p(f) and data D, the posterior is p(f | D) ∝ p(D | f) p(f). For Gaussian priors and noise it is Gaussian, with mean μ(t) and variance σ²(t) at each input. A 95% pointwise interval is μ ± 1.96σ. It describes uncertainty about the <em>expected</em> response, not the spread of individual electrodes, and it is only as trustworthy as the model assumptions.</p>',
  example: '<p>Click to add synthetic observations in the explorer below and watch the band pinch around them.</p>',
  counter: '<p>A model with too-short memory (small length-scale) or too-small noise will show a narrow band that misses the truth. That is why the proposal checks calibration: do nominal 95% intervals actually contain held-out values about 95% of the time?</p>',
  why: '<p>The controller’s job is to shrink posterior uncertainty about θ cheaply. If the uncertainty is miscalibrated, the controller optimizes the wrong thing. The primary score therefore requires validation error and calibration limits, not just narrow intervals ' + src('P09') + '.</p>',
  check: 'q-posterior',
})}
${widget('posterior')}
<h2><span class="h-num">18.1</span>A hierarchical joint model, level by level</h2>
<p><q>A hierarchical joint model will link processing, structure and performance, including preparation/reactor variation and measurement error.</q> ${src('P07')}</p>
<div class="table-wrap"><table><thead><tr><th>Level</th><th>What varies</th><th>Why it must be modeled</th></tr></thead><tbody>
<tr><td>Condition (dwell, gas)</td><td>The expected response m(t, a) and θ(t)</td><td>The target</td></tr>
<tr><td>Preparation (heating run)</td><td>Run-to-run deviation</td><td>The replicate level for processing claims</td></tr>
<tr><td>Specimen (performance vs companion)</td><td>Companion mismatch</td><td>Lets a companion assay inform the tested electrode, with the right uncertainty</td></tr>
<tr><td>Reactor channel and day</td><td>Block effects</td><td>Prevents equipment drift from looking like chemistry</td></tr>
<tr><td>Measurement</td><td>Assay noise (GC, NMR, TEM fields)</td><td>Nested measurements are not new preparations</td></tr></tbody></table></div>
<p><strong>Joint</strong> means structure and performance are modeled together, so a structural assay can sharpen predictions of performance through a learned relationship. The <a href="#notes">refinement notes</a> add a crucial constraint: direct processing-to-performance paths are kept, so the model does not force every effect through a measured structural descriptor.</p>
${call('unres', '<p>The two pages commit to the structure of the model, not to a kernel, priors, or an identifiability analysis ' + src('P07') + '. The explorers in this guide use a simple Gaussian-process-like model for teaching; they are not the research model.</p>')}
${concept({
  title: 'Prediction is not mediation',
  intuition: '<p>Ice-cream sales predict sunburn. That does not mean ice cream causes sunburn; sunshine causes both. A structural descriptor that predicts n-propanol output may simply share a cause with it.</p>',
  formal: '<p>Predictive value: p(Y | X, S) is sharper than p(Y | X). Mediation: part of the effect of X on Y flows through S, so intervening on S (holding X) would change Y. The first can hold without the second when a common cause (e.g., dwell changes both grain structure and loading) drives S and Y.</p>',
  example: '<p>If removing structural inputs (the ablation) makes θ predictions worse, structure carries information. To argue it mediates, the proposal uses an independent route to the structure (the matched-oxide cooling-history comparison).</p>',
  counter: '<p>A descriptor with no predictive value can still be a mediator if it is measured too noisily or on a mismatched companion. Weak prediction is not proof of irrelevance either.</p>',
  why: '<p><q>Pretest companion data can inform predictions without proving mediation; post-test data support interpretation.</q> ' + src('P07') + '</p>',
  check: 'q-mediation',
})}
${call('mis', '<p><strong>Leakage.</strong> Using a post-test measurement of an electrode to “predict” that same electrode’s test result is not a prediction. The record must store when each measurement became available, and replay must respect it.</p>')}
${reviewer('Does a Gaussian process prove a mechanism?', 'No model fit proves a mechanism. A GP (or any surrogate) summarizes what the data say about a response and how uncertain that is. Mechanistic claims need interventions and site-sensitive evidence, which is why the claim ladder caps what a processing interaction can support.')}
`,
  });

  /* ---------------- Lesson 19 ---------------- */
  WC.lesson({
    id: 'theta', part: 'sdl', short: 'θ(t): what is learned', minutes: 18,
    title: 'θ(t): the quantity being <em>learned</em>',
    lede: 'One curve ties the materials hypothesis, the controller and the benchmark together. It asks, at each heating dwell, whether the benefit of activating in CO rather than N₂ is different from what it is at a reference dwell.',
    goals: ['How g(t) and θ(t) are built from the two response curves.', 'Why θ(t) = 0 everywhere means no synthesis–activation interaction relative to the reference.', 'How the 2×2 pilot is one point on this curve, and what “integrated posterior variance” measures.'],
    concepts: ['c-theta'],
    body: () => `
<div class="table-wrap"><table><tbody>
<tr><th scope="row">t</th><td>Heating dwell, a preparation variable. <strong>Not</strong> time spent operating the catalyst.</td></tr>
<tr><th scope="row">a</th><td>Activation-gas composition (pilot: CO or N₂).</td></tr>
<tr><th scope="row">m(t, a)</th><td>Expected late-window n-propanol partial current density at dwell t after activation in gas a, under the shared test.</td></tr>
<tr><th scope="row">t<sub>ref</sub></th><td>A reference dwell fixed before confirmatory evaluation.</td></tr></tbody></table></div>
${eq('g(t) = m(t, CO) − m(t, N<sub>2</sub>)', 'The activation (gas) effect at dwell t.')}
${eq('θ(t) = g(t) − g(t<sub>ref</sub>)', 'How much that gas effect differs from its value at the reference dwell. θ(t_ref) = 0 by definition.')}
${concept({
  title: 'Why subtracting the reference isolates the interaction',
  intuition: '<p>Imagine CO always adds the same boost, whatever the dwell. Then every g(t) is the same number, and subtracting g(t<sub>ref</sub>) gives zero everywhere. A boost that is the same for every precursor tells you nothing about precursor history, so θ ignores it. Only a boost that changes with dwell survives the subtraction.</p>',
  formal: '<p>Decompose m(t, a) = μ + D(t) + G(a) + I(t, a), with I(t, a) the interaction. Then g(t) = G(CO) − G(N₂) + I(t, CO) − I(t, N₂). The first part is constant in t and cancels in θ, as does the dwell main effect D(t), which appears in both gases. θ(t) = [I(t,CO) − I(t,N₂)] − [I(t<sub>ref</sub>,CO) − I(t<sub>ref</sub>,N₂)]: pure interaction, measured relative to the reference.</p>',
  example: '<p>Pilot with dwells t₀ = t<sub>ref</sub> and t₁: θ(t₁) = g(t₁) − g(t₀), which is exactly the 2×2 difference of differences from lesson 8. The pilot is one point on θ.</p>',
  counter: '<p>Both gases get better with longer dwell by the same amount: m rises with t for both, the lines stay parallel, g is constant, θ = 0. A large dwell effect is not an interaction.</p>',
  why: '<p><q>This interaction curve is the common target for decisions and scoring.</q> ' + src('P07') + ' The controller cannot claim success by finding a high-yield recipe; it has to learn this curve.</p>',
  check: 'q-theta-zero',
})}
${widget('theta')}
${rig(`<p><strong>Integrated posterior variance.</strong> Fix a grid {t<sub>i</sub>} and nonnegative weights w<sub>i</sub> summing to one before confirmatory data:</p>${eq('V(D) = Σ<sub>i</sub> w<sub>i</sub> · Var[θ(t<sub>i</sub>) | D]', 'D is the data acquired so far. Each variance is about the expected interaction, not the spread of individual electrodes.')}<p><strong>Reference covariance.</strong> Every θ(t<sub>i</sub>) shares the term g(t<sub>ref</sub>), so Var θ(t<sub>i</sub>) = Var g(t<sub>i</sub>) + Var g(t<sub>ref</sub>) − 2 Cov(g(t<sub>i</sub>), g(t<sub>ref</sub>)), and the θ values are correlated with each other. Uncertainty at the reference dwell propagates into the whole curve, so it pays to measure the reference well.</p><p><strong>Why fix the grid and weights?</strong> Otherwise a method could look better by emphasizing regions that turned out easy. All policies share them ${src('P08')}.</p><p><strong>Scale.</strong> θ is defined on the additive scale of partial current density. A ratio scale would ask a different question; the scale is fixed in advance.</p>`, 'integrated variance and the reference')}
${call('unres', '<p>The reference dwell, grid, weights, gas compositions beyond CO and N₂, and the precision threshold τ² are not given numerically in the proposal ' + src('P08') + '. They are set before confirmatory evaluation.</p>', { side: true })}
${check('q-theta-t')}
${check('q-theta-num')}
`,
  });

  /* ---------------- Lesson 20 ---------------- */
  WC.lesson({
    id: 'acquisition', part: 'sdl', short: 'Cost-aware selection', minutes: 22,
    title: 'Cost-aware <em>experimental selection</em>',
    lede: 'Score every possible next action by how much it is expected to shrink uncertainty about θ, divided by what it costs. Make, measure and repeat then compete on one scale, and an expensive assay has to earn its place.',
    goals: ['What the acquisition function computes, conceptually and formally.', 'How noise, assay reliability, companion mismatch, cost and unexplored uncertainty change the recommended action.', 'Why characterization can improve prediction without proving mediation.'],
    concepts: ['c-acquisition', 'c-actions'],
    body: () => `
${eq('U(action) = [ V(D) − E{ V(D ∪ new observations) | action } ] / c(action)', 'Expected reduction in integrated posterior variance of θ, per unit of declared resource cost (preparation, instrument occupancy, analysis, delay).')}
<p>Read it as “uncertainty removed per unit of effort.” An action can win by removing a lot of uncertainty, or by being cheap. It does not need to produce the best catalyst. The toy below computes this exactly for a small linear-Gaussian model so you can watch the trade-offs.</p>
${widget('sandbox')}
${concept({
  title: 'When is an expensive structural measurement worth buying?',
  intuition: '<p>A TEM measurement is worth buying when it tells you more about θ, per unit cost, than anything else you could do. That needs three things: the structural descriptor must actually track performance (a validated link), the companion must resemble the tested electrode, and the full cost, including waiting, must not be crushing.</p>',
  formal: '<p>In the toy, a structural assay at condition i observes g(t<sub>i</sub>) with noise variance r<sub>meas</sub> = σ<sub>link</sub>² + σ<sub>c</sub>², where σ<sub>link</sub>² = s²(1 − ρ²)/ρ² from the assay–performance correlation ρ, and σ<sub>c</sub> is companion mismatch. A paired performance test has variance r<sub>test</sub> = σ<sub>e</sub>². The assay wins when its variance reduction per cost beats the best make or repeat. As ρ falls or σ<sub>c</sub> grows, r<sub>meas</sub> explodes and the assay stops being worth buying regardless of how precise the instrument is.</p>',
  example: '<p>Set reliability high, mismatch low and cost moderate in the sandbox: MEASURE wins. Drop reliability to 0.4: MAKE or REPEAT takes over.</p>',
  counter: '<p>A sophisticated, expensive assay with a weak link to θ should be bought rarely or never. “Expensive assays must earn their use” ' + src('P08') + '. And a cheap assay is not automatically informative either.</p>',
  why: '<p>This is the bounded autonomy contribution: <q>Adaptive characterization and replication exist [6,7]; here the challenge is delayed, destructive assays on imperfectly matched companions.</q> ' + src('P07') + '</p>',
  check: 'q-expensive',
})}
${claims([
  ['est', 'SARA chose both synthesis and characterization actions with hierarchical active learning, using fast, non-destructive optical spectroscopy ' + ref(6) + '.'],
  ['est', 'Binois et al. decide between replicating and exploring with a lookahead integrated-variance (IMSPE) criterion and heteroskedastic GPs, for stochastic simulators ' + ref(7) + '.'],
  ['prop', 'Extend such choices to delayed, destructive assays on imperfect companions, toward θ, with costs that include delay ' + src('P07') + ' ' + src('P08') + '.'],
  ['sim', 'The sandbox is a teaching model: seven grid points, a known assay link, one action per day. It is not the research acquisition algorithm.'],
])}
${call('key', '<p><strong>Characterization can improve prediction without proving mediation.</strong> If structure sharpens predictions of θ, the controller should buy it. That says structure carries information, not that structure causes the product change ' + go('model', 'Lesson 18') + '.</p>')}
${reviewer('Why is this more than Bayesian optimization?', 'Bayesian optimization looks for the best input. Here the goal is a precise curve, θ(t), so the criterion is integrated variance, not expected improvement. The action space includes measuring and repeating, with different costs and latencies, and success is gated by validation error and calibration, not just a narrower posterior.')}
${check('q-acq')}
`,
  });

  /* ---------------- Lesson 21 ---------------- */
  WC.lesson({
    id: 'replay', part: 'sdl', short: 'Replay vs prospective', minutes: 16,
    title: 'Replay versus <em>prospective</em> experiments',
    lede: 'Replay lets many policies face the same recorded evidence cheaply. It is honest only if the archive was collected independently of any policy and a policy can see only what it paid for. Even then, replay cannot make a new electrode.',
    goals: ['The four kinds of data: commissioning pilot, reference archive, hidden validation, prospective campaigns.', 'Why the archive must be policy-independent and how pay-to-reveal works.', 'Why repeated replay is not repeated physical synthesis.'],
    concepts: ['c-replay'],
    body: () => `
<div class="table-wrap"><table><thead><tr><th>Data</th><th>What it is</th><th>What it is for</th><th>What it must not be used for</th></tr></thead><tbody>
<tr><td>Commissioning pilot</td><td>Early runs to establish safe conditions, reproducibility, reduction checks, recovery, precision, real costs</td><td>Defining the bounded domain and realistic costs</td><td>Choosing a benchmark that flatters a favored policy</td></tr>
<tr><td>Reference archive</td><td>A separate, fixed, replicated grid of independent preparations with paired structural and product data, failures, timestamps and costs</td><td>Replay: comparing policies on identical finite evidence</td><td>Being generated by, or scored only where, the adaptive policy chose</td></tr>
<tr><td>Hidden validation preparations</td><td>Independent preparations reserved before replay, with all their images, windows and companions</td><td>Scoring error and calibration of θ</td><td>Guiding any policy’s choices</td></tr>
<tr><td>Prospective campaigns</td><td>New physical experiments run by each policy, interleaved across days</td><td>Testing real execution, new material, real delays and faults</td><td>Being run sequentially so one policy gets a better week</td></tr></tbody></table></div>
<p class="small muted ui">From the proposal ${src('P09')} and the <a href="#notes">refinement notes</a>, §3.</p>
${widget('replay')}
${concept({
  title: 'Why replay is useful but not sufficient',
  intuition: '<p>Replay is like a flight simulator built from recorded flights. You can compare pilots cheaply and fairly, but only on situations that were recorded, and no number of simulator hours is a real landing.</p>',
  formal: '<p>A replay run is a policy interacting with a finite archive A: at each step it selects an action whose result exists in A and has not been consumed, pays its recorded cost, and receives the recorded value, available only after the recorded latency. Many seeds give a distribution over policy behavior on A, not over new physical experiments. Generalization beyond A needs prospective data.</p>',
  example: '<p>A policy wants a third repeat at a condition with two archived preparations. Replay must refuse: that preparation was never made.</p>',
  counter: '<p>A fixed-grid policy may happen to match the archive’s grid. That is a known coverage limitation of a finite archive, which is why new conditions are also tested prospectively.</p>',
  why: '<p><q>Replay reveals only acquired measurements; independent validation preparations remain hidden.</q> ' + src('P09') + ' And building the archive costs real bench time; it is not free.</p>',
  check: 'q-replay',
})}
${reviewer('Why isn’t replay enough to show the SDL works?', 'Replay re-reads existing measurements. It cannot create a new preparation, reproduce real delays and failures, or test conditions the archive never recorded, and many seeds are many algorithm runs over one finite evidence set. Prospective campaigns interleaved across days, plus condition and preparation holdouts, test what replay cannot.')}
${call('mis', '<p><strong>“1000 replay seeds means 1000 experiments.”</strong> It means 1000 runs of the algorithm over the same physical evidence. Uncertainty about physical performance should reflect the number of physical campaigns ' + src('P09') + '.</p>', { side: true })}
${check('q-policyind')}
`,
  });

  /* ---------------- Lesson 22 ---------------- */
  WC.lesson({
    id: 'benchmark', part: 'sdl', short: 'Benchmarking autonomy fairly', minutes: 18,
    title: 'Benchmarking autonomy <em>fairly</em>',
    lede: 'Do not let the controller mark its own exam. Same domain, same starting data, same models, same compulsory controls, same budget; scored on cost to a precision threshold, but only if the answer is also accurate and honestly uncertain.',
    goals: ['The baselines and what must be shared.', 'The primary score and why validation error and calibration gate it.', 'What condition and preparation holdouts each test, and what pseudoreplication and leakage look like in a split.'],
    concepts: ['c-holdout', 'c-aims'],
    body: () => `
<div class="table-wrap"><table><thead><tr><th>Policy</th><th>What it chooses</th><th>Shared by all</th></tr></thead><tbody>
<tr><td>Space-filling design</td><td>A fixed plan spread across the declared domain</td><td rowspan="3">Candidate domain, models, starting data, compulsory controls, cost definition and budget ${src('P09')}</td></tr>
<tr><td>Adaptive synthesis–activation search</td><td>Which conditions to make; characterization and replication on a fixed schedule</td></tr>
<tr><td>Full controller (proposed)</td><td>New conditions, independent repeats and validated structural assays</td></tr></tbody></table></div>
<p>The middle baseline matters most. Beating it isolates the value of choosing when to measure and when to repeat, which is the proposal’s actual claim.</p>
${eq('Primary score = accumulated cost to reach V(D) ≤ τ²', 'Subject to predeclared validation-error and calibration limits on θ. A narrow but wrong posterior fails. Policies that never reach τ² within budget are reported as such.')}
${claims([
  ['prop', 'Validation uses reserved independent preparations, whose own sampling uncertainty and shared-reference covariance are propagated. Validation results score policies; they do not feed back into them.'],
  ['prop', '<q>Condition and preparation holdouts distinguish transfer from reproducibility.</q> ' + src('P09')],
  ['prop', '<q>Removing structural inputs tests their value; unresolved comparisons are not wins.</q>'],
  ['pilot', 'τ², the error and calibration limits, cost weights and the number of campaigns. Report uncombined costs and sensitivity to weights.'],
])}
${widget('holdout')}
${reviewer('If the adaptive policy wins by a small margin in two prospective campaigns, have you shown it is better?', 'No. With two campaigns the uncertainty in the difference is large; the comparison would be reported as unresolved. The claim scales with the number of physical campaigns, interleaved across days so drift is shared.')}
${call('mis', '<p><strong>“The controller reached a narrower posterior, so it won.”</strong> Narrowness without accuracy is overconfidence. The score requires the same θ to pass validation-error and calibration limits.</p>', { side: true })}
${check('q-holdout')}
${check('q-score')}
`,
  });

  /* ---------------- Quiz bank: Part III ---------------- */
  WC.q({ id: 'q-sdl', lesson: 'hardware', concepts: ['c-hardware'], q: 'What makes a laboratory self-driving rather than merely automated?', choices: ['A robotic arm is visible.', 'No person ever enters the room.', 'Model-selected actions change the next executed physical experiment.'], correct: 2, explain: 'Manual facility steps and human commissioning can coexist with a genuine closed loop.' });
  WC.q({ id: 'q-pending', lesson: 'loops', concepts: ['c-latency'], q: 'In a linear-Gaussian model, why can the controller account for an experiment whose result has not arrived?', choices: ['Because it can guess the result exactly.', 'Because the posterior covariance depends on where and how noisily you observe, not on the observed value.', 'It cannot; it must wait.'], correct: 1, explain: 'Planned covariance can be computed before results return; only the mean waits.' });
  WC.q({ id: 'q-latency', lesson: 'loops', concepts: ['c-latency'], q: 'Which typically arrives last?', choices: ['Online GC of ethylene', 'Quantitative NMR of n-propanol', 'Facility TEM of a companion'], correct: 2, explain: 'GC returns in minutes, NMR in hours to days, facility TEM in days to weeks.' });
  WC.q({ id: 'q-repeat', lesson: 'actions', concepts: ['c-actions'], q: 'Which counts as a REPEAT action?', choices: ['Re-injecting the same gas sample into the GC', 'A new coating/heating run at an already-tested condition', 'Imaging ten more TEM fields'], correct: 1, explain: 'A repeat is an independent preparation; the others are nested measurements.' });
  WC.q({ id: 'q-failure', lesson: 'actions', concepts: ['c-actions'], q: 'One dwell setting delaminates in three of three independent runs. How should it be treated?', choices: ['Delete as failed runs.', 'Record as a reproducible material failure: a feasibility outcome the model keeps.', 'Assign zero n-propanol and continue.'], correct: 1, explain: 'Equipment faults invalidate measurements; reproducible material failures are evidence about feasibility.' });
  WC.q({ id: 'q-posterior', lesson: 'model', concepts: ['c-posterior'], q: 'A model’s 95% intervals contain held-out values only 60% of the time. What is wrong?', choices: ['Nothing; intervals are approximate.', 'It is miscalibrated (overconfident); its uncertainty cannot be trusted for decisions or scoring.', 'It needs more replay seeds.'], correct: 1, explain: 'Calibration is a gate on the primary score.' });
  WC.q({ id: 'q-mediation', lesson: 'model', concepts: ['c-mediation'], q: 'Adding companion TEM data improves θ predictions. What does that establish?', choices: ['Grain structure causes the n-propanol interaction.', 'The structural data carry predictive information about θ; mediation needs separate evidence.', 'TEM is the best assay.'], correct: 1, explain: 'Prediction is association. The matched-oxide cooling-history route is one way to probe mediation.' });
  WC.q({ id: 'q-theta-zero', lesson: 'theta', concepts: ['c-theta'], q: 'CO activation adds 7 mA cm⁻² at every dwell. What is θ(t)?', choices: ['7 at every dwell', '0 at every dwell', '7 at the reference, 0 elsewhere'], correct: 1, explain: 'A constant gas benefit cancels when g(t_ref) is subtracted.' });
  WC.q({ id: 'q-theta-t', lesson: 'theta', concepts: ['c-theta'], q: 'In θ(t), what is t?', choices: ['Electrolysis time', 'Heating dwell, a preparation variable', 'Time since the last NMR'], correct: 1, explain: 'The response is late-window output; t indexes how the precursor was made.' });
  WC.q({ id: 'q-theta-num', lesson: 'theta', concepts: ['c-theta'], type: 'num', answer: -5, tol: 0.01, q: 'At the reference dwell, CO-activated = 20 and N₂-activated = 12. At dwell t, CO = 15 and N₂ = 12. What is θ(t)?', explain: 'g(t_ref) = 8, g(t) = 3, θ(t) = 3 − 8 = −5.' });
  WC.q({ id: 'q-expensive', lesson: 'acquisition', concepts: ['c-acquisition'], q: 'Companion mismatch becomes very large. What happens to the value of a precise TEM assay in the acquisition function?', choices: ['It rises, because TEM is precise.', 'It collapses, because the measurement no longer speaks to the tested electrode.', 'Unchanged; cost is the only factor.'], correct: 1, explain: 'Effective noise is link noise plus mismatch; instrument precision cannot fix the wrong object.' });
  WC.q({ id: 'q-acq', lesson: 'acquisition', concepts: ['c-acquisition'], q: 'What does the proposal’s acquisition rule maximize?', choices: ['Predicted n-propanol output', 'Expected reduction in integrated posterior variance of θ per resource cost', 'Number of experiments per day'], correct: 1, explain: 'The same target, θ, drives decisions and scoring.' });
  WC.q({ id: 'q-replay', lesson: 'replay', concepts: ['c-replay'], q: 'During replay, a policy asks for a TEM measurement the archive never collected. What should happen?', choices: ['Interpolate one from similar specimens.', 'Refuse: replay reveals only recorded, paid-for measurements. It would need a prospective experiment.', 'Reveal a validation specimen instead.'], correct: 1, explain: 'Replay cannot create unrecorded data or touch validation.' });
  WC.q({ id: 'q-policyind', lesson: 'replay', concepts: ['c-replay'], q: 'Why must the reference archive be policy-independent?', choices: ['To save money.', 'An archive collected where a favored policy chose to go would flatter that policy in replay.', 'Because NSF requires it.'], correct: 1, explain: 'Every policy must face the same finite evidence, collected on a fixed plan.' });
  WC.q({ id: 'q-holdout', lesson: 'benchmark', concepts: ['c-holdout'], q: 'A model predicts a fresh preparation of a recipe it has seen. Which holdout is this?', choices: ['Preparation holdout: tests reproducibility', 'Condition holdout: tests transfer', 'Not a holdout'], correct: 0, explain: 'A condition holdout withholds a whole recipe; a preparation holdout withholds a fresh batch of a known one.' });
  WC.q({ id: 'q-score', lesson: 'benchmark', concepts: ['c-aims'], q: 'Policy X reaches the variance threshold at half the cost of Y, but its intervals cover validation values only 50% of the time. Who wins?', choices: ['X', 'Neither: X fails the calibration gate; Y wins only if it passes its own gates', 'Y automatically'], correct: 1, explain: 'Cost to threshold counts only when validation error and calibration limits on θ are met.' });
})();
