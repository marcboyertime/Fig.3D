/* PART IV — DEFENDING THE PROPOSAL */
(function () {
  'use strict';
  const WC = window.WC;
  const { ev, call, reviewer, term: T, src, ref, go, link, widget, check, rig, eq, concept, claims } = WC;
  const card = (rows) => `<div class="table-wrap"><table><tbody>${rows.map(([k, v]) => `<tr><th scope="row" style="width:11rem">${k}</th><td>${v}</td></tr>`).join('')}</tbody></table></div>`;

  /* ---------------- Lesson 23 ---------------- */
  WC.lesson({
    id: 'aim1', part: 'defense', short: 'Aim 1 in plain English', minutes: 10,
    title: 'Aim 1 in <em>plain English</em>',
    lede: '“Determine what activation allows a precursor to retain.” Make two kinds of copper oxide, switch each on in two different gases, test all four the same way, and find out whether the difference between the precursors survives differently depending on the gas.',
    goals: ['Aim 1 in one breath and in one minute.', 'Exactly what it contributes, and what it does not.'],
    concepts: ['c-aims', 'c-pilot'],
    body: () => `
<h2><span class="h-num">23.1</span>In one breath</h2>
<p class="home-q" style="font-size:1.15rem">I make copper-oxide precursors with two heating histories, activate each in CO or N₂ under the same electrical program, test all of them under CO, and ask whether the difference between the precursors in structure and in n-propanol output depends on the activation gas.</p>
<h2><span class="h-num">23.2</span>The aim on one card</h2>
${card([
  ['Question', 'Does activation overwrite precursor structure, or can both histories shape the working catalyst? ' + src('P01')],
  ['Manipulated', 'Heating dwell (two levels) × activation gas (CO, N₂) ' + src('P03')],
  ['Held fixed', 'Peak temperature, cooling, total flow, current–time program, the CO-fed MEA test'],
  ['Measured', 'Thermal traces; oxide fractions, coherent-domain dimensions, connectivity before activation, at its endpoint and after operation; blinded TEM on companions; products by GC and quantitative NMR in early and late windows; voltage; charge balance ' + src('P04') + ' ' + src('P05')],
  ['Primary outcome', 'Late-window n-propanol partial current density at fixed total current'],
  ['Controls', 'Heated support, loading, ICP-OES contamination, wetting/CO access, air-free versus exposed transfer, matched-oxide cooling-history route, separate activation-product collection'],
  ['Replication', 'Independent coating/heating runs, day and channel balanced; confirmatory n from pilot variance and a predeclared meaningful interaction'],
  ['Decisive test', 'A replicated difference of differences, then a predicted structure–performance response validated on a new preparation'],
  ['Claim ceiling', 'A processing interaction and, with structural evidence, an architectural interpretation. Not a specific active site.'],
])}
<h2><span class="h-num">23.3</span>What Aim 1 contributes</h2>
${claims([
  ['prop', 'The first crossed test, in this system, of whether precursor history and activation gas interact in the working copper. Song varied one; Li varied the other.'],
  ['prop', 'A three-stage structural record (precursor, endpoint, post-operation) that locates where a contrast survives or vanishes.'],
  ['prop', 'A validated measurement chain (recovery, delay, crossover, companions, air-free transfer) that Aim 2 depends on.'],
  ['unres', 'Whether the answer generalizes to other precursors, currents or to CO₂. Not claimed.'],
])}
${call('mis', '<p><strong>“Aim 1 will find the best copper catalyst.”</strong> Aim 1 tests an interaction. A recipe ranking may fall out of the data, but it is not the target.</p>', { side: true })}
${reviewer('If you only had the pilot, what could you claim?', 'An estimate of the interaction with its uncertainty, a check that the precursor contrast exists and that reduction endpoints are comparable, and the variance needed to size the confirmatory study. The pilot is designed to tell you whether the confirmatory experiment is worth running and how big it must be.')}
${check('q-aim1')}
`,
  });

  /* ---------------- Lesson 24 ---------------- */
  WC.lesson({
    id: 'aim2', part: 'defense', short: 'Aim 2 in plain English', minutes: 10,
    title: 'Aim 2 in <em>plain English</em>',
    lede: '“Build a laboratory that chooses what to make, measure, or repeat.” Then prove, fairly, whether those choices learn the synthesis–activation interaction more cheaply than simpler strategies, without becoming confidently wrong.',
    goals: ['Aim 2 in one breath and in one minute.', 'Exactly what it contributes, and what it does not.'],
    concepts: ['c-aims', 'c-acquisition'],
    body: () => `
<h2><span class="h-num">24.1</span>In one breath</h2>
<p class="home-q" style="font-size:1.15rem">I build a lab that, after each experiment, decides whether the next unit of effort should go to a new condition, an independent repeat, or a slow structural measurement on a companion electrode, choosing whichever most reduces uncertainty about the interaction curve per unit cost, and I test whether that beats simpler strategies on the same budget.</p>
<h2><span class="h-num">24.2</span>The aim on one card</h2>
${card([
  ['Target', 'θ(t): the CO-versus-N₂ effect on late-window output at dwell t, minus that effect at a reference dwell ' + src('P07')],
  ['Domain', 'Dwell and activation-gas composition, expanded only within the validated window'],
  ['Model', 'A hierarchical joint model of processing, structure and performance, with preparation, reactor, assay and companion variation; direct processing paths retained'],
  ['Actions', 'New preparation–activation pair; independent repeat; validated structural assay. Calibrations and safety checks always run.'],
  ['Decision rule', 'Expected reduction in integrated posterior variance of θ per resource cost (preparation, instrument occupancy, analysis, delay), on a fixed grid with fixed weights ' + src('P08')],
  ['Execution', 'Scheduler drives coating/heating, cassettes, gas switching and testing; delayed results update later batches'],
  ['Evaluation', 'Policy-independent replicated archive with pay-to-reveal replay and hidden validation; space-filling and adaptive baselines sharing everything; primary score = cost to V(D) ≤ τ², gated by validation error and calibration; ablation of structural inputs; prospective interleaved campaigns; condition and preparation holdouts ' + src('P09')],
])}
<h2><span class="h-num">24.3</span>What Aim 2 contributes</h2>
${claims([
  ['est', 'Adaptive choice of characterization (SARA ' + ref(6) + ') and of replication versus exploration (Binois ' + ref(7) + ') already exist.'],
  ['prop', 'A tested answer to when delayed, destructive assays on imperfect companions are worth buying, in a real materials loop.'],
  ['prop', 'An evaluation protocol for autonomy that cannot mark its own exam: shared target, policy-independent archive, hidden validation, prospective campaigns.'],
  ['unres', 'Whether adaptivity wins here. That is the hypothesis, and a negative result is reportable.'],
])}
${call('mis', '<p><strong>“Aim 2 is applying machine learning to Aim 1’s data.”</strong> Aim 2 decides which data Aim 1 collects, and is judged on whether those decisions were efficient and honest.</p>', { side: true })}
${reviewer('What happens if adaptive measurement does not beat the baseline?', 'Then the autonomy hypothesis is not supported for this problem, and that is reported with its uncertainty. The ablation then says whether characterization added information at all. Knowing when expensive characterization is not worth automating is useful to the field.')}
${check('q-aim2')}
`,
  });

  /* ---------------- Lesson 25 ---------------- */
  WC.lesson({
    id: 'falsify', part: 'defense', short: 'What would falsify each hypothesis', minutes: 14,
    title: 'What would <em>falsify</em> each hypothesis',
    lede: 'A hypothesis you cannot lose is not a hypothesis. Here are the observations that would support, reject or leave each one unresolved, and how they combine.',
    goals: ['Support, rejection and unresolved outcomes for H1 and for H2.', 'Why the two verdicts are independent.'],
    concepts: ['c-falsify'],
    body: () => `
${widget('outcomes')}
<div class="table-wrap"><table><thead><tr><th><span class="sr-only">Hypothesis</span></th><th>Supports</th><th>Argues against</th><th>Unresolved</th></tr></thead><tbody>
<tr><th scope="row">H1 (materials)</th><td>Gas-dependent structural retention and a replicated product interaction beyond the meaningful bound; prediction validated on a new preparation</td><td>Structural and product contrasts equivalent across gases within bounds; or structure retained but products converge (limits relevance)</td><td>Intervals that include zero and meaningful values; endpoints not comparable; precursor contrast not reproducible</td></tr>
<tr><th scope="row">H2 (autonomy)</th><td>Lower cost to V ≤ τ² than both baselines, with validation error and calibration within limits, in replay and prospective campaigns</td><td>No cost advantage, or an advantage only with worse error or calibration</td><td>Differences within the uncertainty of the few physical campaigns run</td></tr></tbody></table></div>
${call('key', '<p>The verdicts are independent. All four combinations are possible and publishable: H1 supported with H2 unsupported means the science was real but cheap strategies found it as efficiently; H1 rejected with H2 supported means the controller efficiently established an informative negative.</p>')}
${reviewer('Can’t you always say “not significant, more work needed”?', 'No. Meaningful bounds are declared before confirmatory data. An interval inside them is a negative result for H1; only an interval that straddles a bound is unresolved, and then it is reported as unresolved, not as support.')}
${check('q-falsify')}
`,
  });

  /* ---------------- Lesson 26 ---------------- */
  WC.lesson({
    id: 'feasibility', part: 'defense', short: 'Feasibility and failure modes', minutes: 14,
    title: 'Feasibility gates and <em>failure modes</em>',
    lede: 'Build one reliable loop before multiplying it. Each year has a gate; each gate has a test; a failed gate changes the plan rather than quietly breaking it.',
    goals: ['The major feasibility gates and how each is tested.', 'What the proposal says, and does not say, about fallbacks.', 'What you would physically be doing.'],
    concepts: ['c-feasibility'],
    body: () => `
<p><q>Year 1 validates precursor reproducibility, recovery, throughput and interfaces; Year 2 closes the physical loop and builds the reference library; Year 3 tests new batches and persistence.</q> ${src('P10')}</p>
${widget('gates')}
${call('unres', '<p><strong>Fallbacks are not specified.</strong> The proposal does not lay out an alternative research program if a gate fails. The responses in the explorer are reasonable options to discuss with an adviser, labeled as such, not commitments of the proposal.</p>')}
${claims([
  ['asm', 'A host with gas-fed testing and shared microscopy/NMR, and access agreements. “I will seek a host” ' + src('P10') + '.'],
  ['prop', 'Professionally reviewed interlocks and commissioning before unattended CO operation.'],
  ['prop', 'Operando beamtime is optional; the core claims do not depend on it, and are scoped accordingly.'],
  ['feas', 'Preparation: nanomaterials synthesis (Yushin group); robotic coating, electrochemistry and ICP-OES (Lila Sciences) ' + src('P10') + '. Speak only to what you have actually done.'],
])}
${reviewer('Three years for an SDL and the science. Isn’t that too much?', 'It would be if the robot came first. Year 1 is ordinary careful bench science that produces the pilot result and validated assays even without automation. Year 2 extends one station rather than building a fleet. Each year ends with something publishable if the next slips.')}
${check('q-gate')}
`,
  });

  /* ---------------- Lesson 27 ---------------- */
  WC.lesson({
    id: 'novelty', part: 'defense', short: 'Novelty map', minutes: 12,
    title: 'The <em>novelty</em> map',
    lede: 'What is established, what is proposed, and how to say the difference without overclaiming. A reviewer who knows SARA and Song will test this first.',
    goals: ['Which components are prior art and which are new.', 'Why this is a materials-science project and an autonomy project at once.'],
    concepts: ['c-novelty'],
    body: () => `
<div class="table-wrap"><table><thead><tr><th>Component</th><th>Established by</th><th>What this project adds</th></tr></thead><tbody>
<tr><td>Precursor architecture inherited by working Cu</td><td>${ev('est')} Song ${ref(1)}</td><td>${ev('prop')} Tests whether inheritance depends on activation gas, with dwell as the thermal knob</td></tr>
<tr><td>Activation gas changes the reduced Cu surface</td><td>${ev('est')} Li ${ref(2)} (flow cell)</td><td>${ev('prop')} Crossed with precursor history, in an MEA, with three-stage structure</td></tr>
<tr><td>Recovered Cu can differ from operando Cu</td><td>${ev('est')} Yang ${ref(4)}</td><td>${ev('prop')} Air-free versus deliberate-exposure control as routine</td></tr>
<tr><td>Device effects in CO MEAs (flooding, contamination, anolyte drift)</td><td>${ev('est')} Xu ${ref(5)}</td><td>${ev('prop')} Treated as alternative pathways or mediators with explicit checks</td></tr>
<tr><td>Robotic gas-fed electrode testing</td><td>${ev('est')} Soni ${ref(3)}</td><td>${ev('prop')} Extended to activation-gas switching and a make/measure/repeat loop</td></tr>
<tr><td>Choosing synthesis and characterization autonomously</td><td>${ev('est')} SARA ${ref(6)}</td><td>${ev('prop')} With delayed, destructive assays on imperfect companions</td></tr>
<tr><td>Replicate versus explore</td><td>${ev('est')} Binois ${ref(7)}</td><td>${ev('prop')} In a physical loop with preparation variance and delay in cost</td></tr>
<tr><td>Interaction curve as shared target for decisions and scoring</td><td>—</td><td>${ev('prop')} θ(t), integrated variance, validation-gated cost score</td></tr>
<tr><td>Policy-independent replay with hidden validation</td><td>—</td><td>${ev('prop')} As a fairness protocol for SDL benchmarks</td></tr></tbody></table></div>
${concept({
  title: 'Why the two halves belong together',
  intuition: '<p>The materials question is expensive to answer well because its best evidence is slow, destructive and indirect. The autonomy question is only meaningful with a real target that has those properties. Each makes the other worth doing.</p>',
  formal: '<p>The materials hypothesis is a statement about θ. The decision rule is defined on θ’s uncertainty. The benchmark is scored on θ’s validated precision. One quantity links the science, the decisions and the evaluation ' + src('P07') + '.</p>',
  example: '<p>Whether to buy TEM on a companion is simultaneously a materials question (does this structure carry information about the product interaction?) and an autonomy question (is it worth its cost and delay?).</p>',
  counter: '<p>Swap θ for “maximize n-propanol” and the two halves come apart: the controller would optimize a recipe, and the materials question would be answered, if at all, by accident.</p>',
  why: '<p>A reviewer from either community should find the other half necessary, not decorative.</p>',
  check: 'q-novel',
})}
<h2><span class="h-num">27.1</span>How to say it</h2>
<div class="grid-2"><div>${call('mis', '<ul><li>“The first autonomous catalyst lab.”</li><li>“We invent active learning for characterization.”</li><li>“We will identify the active site.”</li><li>“This will work for CO₂ electrolyzers.”</li></ul>', { title: 'Avoid' })}</div><div>${call('key', '<ul><li>“Song showed inheritance under one activation; Li showed activation matters in another reactor; we test whether they interact.”</li><li>“SARA and Binois choose measurements and replicates; we test those choices when assays are delayed, destructive and on imperfect companions.”</li><li>“We claim a processing interaction and, with structural evidence, an architectural interpretation.”</li></ul>', { title: 'Say' })}</div></div>
`,
  });

  /* ---------------- Lesson 28 ---------------- */
  WC.lesson({
    id: 'impact', part: 'defense', short: 'Broader impacts', minutes: 8,
    title: 'Broader <em>impacts</em>',
    lede: 'Share experimental judgment, not just a dataset. Reusable infrastructure, failure-preserving data, and a laptop module where students decide whether to make, measure or repeat.',
    goals: ['Each broader-impact commitment and its status.', 'How the education module mirrors Aim 2 and how it will be assessed.'],
    concepts: ['c-aims'],
    body: () => `
${claims([
  ['prop', 'Support electrified chemical synthesis and reusable autonomous-research infrastructure ' + src('P11') + '. No deployment or climate benefit is claimed.'],
  ['prop', 'Subject to host agreements, release nonproprietary interfaces, fixtures, calibrations and datasets that preserve failures and sample histories.'],
  ['prop', '“Build the Experiment, Not Just the Model”: a laptop module that replays the campaign without robots or hazardous gases. Students choose make, measure or repeat under a budget.'],
  ['prop', 'Seek a course partner; pilot with about twenty students; assess with a pre/post rubric on confounders, uncertainty and decision quality.'],
  ['prop', 'An undergraduate mentee helps curate documentation and exercises.'],
  ['unres', 'No course partner, cohort, release permission or mentee is confirmed yet. Twenty students is a pilot scale, not a powered study.'],
])}
${call('key', '<p>The module is Aim 2 made teachable: the same decision (which evidence is worth its cost), the same honesty rules (pay before you reveal, hidden validation). Several interactives in this guide, like the replay archive and the decision sandbox, are prototypes of that experience, built on synthetic data.</p>')}
${reviewer('How is this different from releasing a dataset?', 'A dataset lets students fit a model. A replay module with costs and hidden validation makes them decide what to collect and live with the consequences, which is the skill autonomous science needs and conventional coursework rarely trains. The rubric checks whether that reasoning improves.')}
`,
  });

  /* ---------------- Lesson 29 ---------------- */
  WC.lesson({
    id: 'teachback', part: 'defense', short: 'Explain it yourself', minutes: 30,
    title: 'Explain the whole project <em>yourself</em>',
    lede: 'Write each version from memory before opening the model. Then check it against the must-mention list and the claim ladder. Your drafts are saved and exported with your notes.',
    goals: ['The project at five lengths and for five audiences.'],
    concepts: ['c-aims', 'c-novelty'],
    body: () => `
${widget('teachback')}
<p>Then go to <a href="#defense">Oral defense</a> and answer ten questions aloud with the timer.</p>
`,
  });

  /* ---------------- Quiz bank: Part IV ---------------- */
  WC.q({ id: 'q-aim1', lesson: 'aim1', concepts: ['c-aims'], q: 'What is Aim 1’s primary outcome?', choices: ['C₃/C₂ ratio over the whole test', 'Late-window n-propanol partial current density at fixed total current', 'TEM grain size'], correct: 1, explain: 'Ratios are diagnostic; structure is measured to interpret the outcome.' });
  WC.q({ id: 'q-aim2', lesson: 'aim2', concepts: ['c-aims'], q: 'Which baseline isolates the value of choosing when to measure and repeat?', choices: ['Space-filling design', 'Adaptive synthesis–activation search with fixed characterization/replication', 'A manual technician'], correct: 1, explain: 'It adapts conditions but not measurement or replication, so beating it isolates exactly the proposed contribution.' });
  WC.q({ id: 'q-falsify', lesson: 'falsify', concepts: ['c-falsify'], q: 'H1 is rejected (equivalent contrasts) and H2 is supported. Is that a coherent outcome?', choices: ['No, H2 depends on H1.', 'Yes: the controller learned a flat θ to the target precision more cheaply. Both are reportable results.', 'Only if replay was used.'], correct: 1, explain: 'The hypotheses are tested independently.' });
  WC.q({ id: 'q-gate', lesson: 'feasibility', concepts: ['c-feasibility'], q: 'Which gate must pass before the interaction can be tested at all?', choices: ['Operando beamtime', 'A reproducible precursor contrast between the two dwells', 'Parallel stations'], correct: 1, explain: 'With no contrast, there is nothing for activation to preserve or erase.' });
  WC.q({ id: 'q-novel', lesson: 'novelty', concepts: ['c-novelty'], q: 'Which claim would a careful reviewer accept?', choices: ['This is the first autonomous lab to choose characterization.', 'This tests autonomous choices among make, measure and repeat when assays are delayed, destructive and on imperfect companions.', 'This identifies the n-propanol active site.'], correct: 1, explain: 'SARA and Binois are prior art for the general ideas; the bounded extension is the contribution.' });
})();
