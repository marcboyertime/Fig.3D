/* PART II — THE MATERIALS EXPERIMENT */
(function () {
  'use strict';
  const WC = window.WC;
  const { ev, call, reviewer, term: T, src, ref, go, link, widget, check, rig, eq, concept, claims } = WC;

  /* ---------------- Lesson 6 ---------------- */
  WC.lesson({
    id: 'synthesis', part: 'materials', short: 'Making the precursor', minutes: 14,
    title: 'Making the <em>precursor</em>',
    lede: 'A robot sprays copper nitrate onto carbon paper; current through the paper heats it in seconds; a calibrated trace records what temperature the sample actually saw. Dwell is the knob. Microstructure is what you hope the knob changes.',
    goals: ['What Joule heating does and why the temperature trace, not the electrical setting, is the record.', 'Which thermal variables are fixed, which is varied, and which the proposal leaves open.', 'Why dwell is an input and microstructure an outcome, and why that distinction is the first pilot gate.'],
    concepts: ['c-joule'],
    body: () => `
<p><q>I will robotically spray copper nitrate on carbon paper and apply Joule heating [1], recording calibrated temperature traces.</q> ${src('P03')} Joule heating means passing current through a resistive path, here the carbon paper itself, so it heats from within. Heating takes seconds rather than the minutes or hours of a furnace, and when the current stops, the thin paper cools quickly.</p>
${call('care', '<p>Fast heating and fast cooling limit how long atoms have to rearrange. That is what lets thermal history set a fine, non-equilibrium microstructure in the oxide, and it is what makes heating history a meaningful “synthesis” variable for the interaction.</p>', { side: true })}
<h2><span class="h-num">6.1</span>What is fixed, varied and open</h2>
${claims([
  ['prop', '<strong>Varied:</strong> heating dwell, two levels in the pilot ' + src('P03') + '.'],
  ['prop', '<strong>Fixed:</strong> peak temperature and cooling ' + src('P03') + '.'],
  ['prop', '<strong>Recorded:</strong> calibrated temperature traces, so the actual history, not the setpoint, enters the data.'],
  ['pilot', '<strong>Not specified:</strong> the peak temperature, the two dwell values, the ramp rate, loading, and the spray program. These are set in the pilot.'],
  ['est', '<strong>Precedent:</strong> Song et al. controlled morphology through ramp rate in flash Joule heating with rapid cooling ' + ref(1) + '. The proposal’s choice of dwell is new for this route.'],
])}
${widget('thermal')}
${concept({
  title: 'Dwell is an input; microstructure is an outcome',
  intuition: '<p>Baking time is an input; how done the bread is is an outcome. Two loaves baked the same time can come out differently if the oven is uneven, and doubling the time does not double anything in particular. Dwell works the same way: it gives atoms time at temperature, and several things can happen in that time.</p>',
  formal: '<p>Let the thermal program be the input vector (ramp, peak T, dwell, cooling). The precursor state is a set of measured descriptors: oxide phase fractions, coherent-domain dimensions, particle connectivity and porosity, grain/subgrain structure, loading. A longer dwell can change several descriptors at once: grain coarsening, carbothermal reduction of CuO toward Cu₂O or Cu on the carbon support, neck growth between particles, and changes to the support itself.</p>',
  example: '<p>Song et al. found that ramp rate set ≈10 nm intragrain features within ≈35 nm grains ' + ref(1) + '. That is the kind of microstructural contrast the pilot hopes dwell will create.</p>',
  counter: '<p>Two dwells might produce the same grain size if growth saturates at the peak temperature, or differ mainly in oxide fraction rather than architecture. Then a “dwell effect” would really be a phase effect. That is why the proposal measures oxide fractions and only accepts a cooling-history comparison with matched oxide fractions ' + src('P04') + '.</p>',
  why: '<p>The materials hypothesis needs a precursor contrast to exist before activation can preserve or erase it. Whether two dwells create a reproducible contrast, and of what kind, is the first thing Year 1 must establish ' + src('P10') + '.</p>',
  check: 'q-dwell',
})}
${rig(`<p>A common textbook model for normal grain growth at constant temperature is ${eq('D² − D₀² = k₀ exp(−Q/RT) · t', 'D grain size, D₀ initial size, Q an activation energy, t time at temperature. Background, not a claim about this system.')} Two consequences matter here. First, at fixed T, the change in D² grows linearly with dwell, so doubling dwell does not double D. Second, the rate depends exponentially on temperature: with Q ≈ 150 kJ mol⁻¹ near 1000 K, a 3% temperature error (30 K) changes the rate by roughly exp(Q·ΔT/RT²) ≈ 1.7×. A small, unrecorded temperature difference between heating runs could easily masquerade as a dwell effect. That is the quantitative reason to record calibrated traces instead of trusting electrical power.</p>`, 'why the trace matters')}
<h2><span class="h-num">6.2</span>Controls born at this step</h2>
<ul>
<li><strong>Heated-support control.</strong> Carbon paper heated without copper checks whether heating changes the support itself (its surface chemistry or how liquid wets it), which would change the electrode even with identical copper ${src('P04')}.</li>
<li><strong>Loading.</strong> More copper per area changes current per catalyst mass, local pH and transport. A preparation difference in loading must not be mistaken for architecture.</li>
<li><strong>Independent runs.</strong> Each coating/heating run is a replicate; repeated measurements of one sheet are not ${src('P03')}.</li>
</ul>
${reviewer('Why vary dwell instead of ramp rate, which Song showed works?', 'Dwell is easy to automate and plausibly changes coarsening and phase at fixed peak temperature and cooling. But it is not proven for this route. If two dwells do not give a reproducible structural contrast, the pilot would have to switch the thermal variable, for example to ramp rate as in Song. That pivot belongs in a conversation with an adviser, not in a silent rewrite.')}
${call('mis', '<p><strong>“Longer dwell means larger grains.”</strong> Plausible, not guaranteed. It may also change oxide fraction, porosity or contacts. The proposal treats every one of these as a measurement ' + src('P03') + '.</p>')}
${check('q-trace')}
`,
  });

  /* ---------------- Lesson 7 ---------------- */
  WC.lesson({
    id: 'activation', part: 'materials', short: 'What activation means', minutes: 16,
    title: 'What <em>activation</em> actually means',
    lede: 'Activation is the electrochemical reduction of the oxide precatalyst into copper, under a shared current program, with either CO or N₂ present. Same electrons in does not mean same copper out.',
    goals: ['The physical events during activation under CO and under N₂.', 'Why equal charge does not imply equal reduction, and why equal current does not imply equal cathode potential.', 'Why the activation endpoint is not the final working state.'],
    concepts: ['c-activation', 'c-charge'],
    body: () => `
<p><q>A pilot will cross two dwell times, at fixed peak temperature and cooling, with CO or N2 activation. Total flow and the current–time program will be shared; all electrodes then enter identical CO-fed membrane-electrode-assembly (MEA) tests.</q> ${src('P03')}</p>
<h2><span class="h-num">7.1</span>What happens, physically</h2>
<div class="grid-2"><div><h3 class="lab">Under CO</h3><ul class="small ui"><li>Oxide reduces; oxygen leaves as water/hydroxide; volume shrinks.</li><li>Fresh copper is born in contact with CO, which adsorbs strongly. In Li’s flow cell this produced Cu adparticles ${ref(2)}.</li><li>CO itself reduces to products, consuming part of the current. These products are collected separately ${src('P05')}.</li><li>Hydrogen evolution takes some current.</li></ul></div>
<div><h3 class="lab">Under N₂</h3><ul class="small ui"><li>Oxide reduces; volume shrinks.</li><li>No adsorbing reactant; in Li, the surface became grain-boundary-rich ${ref(2)}.</li><li>Current not used by oxide reduction goes mostly to hydrogen evolution.</li><li>The electrode first meets CO when the common test starts, and may restructure then (as Li’s did).</li></ul></div></div>
${call('key', '<p>Only the <strong>gas during activation</strong> differs. Flow and the current–time program are shared, and every electrode is tested under CO afterward. If the test feed differed, a product difference would just mean one electrode was given reactant.</p>')}

<h2><span class="h-num">7.2</span>Equal charge is not equal reduction</h2>
${concept({
  title: 'Charge is shared among processes',
  intuition: '<p>A fixed number of electrons flows into each electrode. Oxide reduction is only one place they can go. Hydrogen evolution takes some; under CO, CO reduction takes some more. Two electrodes can receive identical charge and end up reduced to different extents.</p>',
  formal: `<p>Total charge Q = ∫ I dt = Q<sub>oxide</sub> + Q<sub>H₂</sub> + Q<sub>CO red</sub> + Q<sub>capacitive</sub>. Full reduction of the oxide needs Q<sub>full</sub> = F·n<sub>Cu</sub>·(2x<sub>CuO</sub> + x<sub>Cu₂O</sub>), where x are the copper fractions in each oxide: two electrons per Cu from CuO, one from Cu₂O. Equal Q guarantees nothing about Q<sub>oxide</sub>/Q<sub>full</sub>.</p>`,
  example: '<p>Use the calculator below: with the same program, an N₂ electrode that sends 60% of its charge to hydrogen and a CO electrode that sends 30% to hydrogen and 45% to CO reduction reach very different reduction fractions.</p>',
  counter: '<p>If the program passes far more charge than Q<sub>full</sub>, both electrodes may reach complete reduction despite different partitions. Then equal endpoints are plausible, but they still have to be checked, not assumed ' + src('P03') + '.</p>',
  why: '<p>If the two gases leave different residual oxide, an apparent “gas effect on structure” could simply be a difference in how far reduction went. That is why the proposal says <q>equal charge alone will not establish equal conversion</q> and checks endpoints structurally.</p>',
  check: 'q-charge',
})}
${widget('charge')}

<h2><span class="h-num">7.3</span>Equal current is not equal potential</h2>
<p>Activation is current-controlled (galvanostatic). The cathode potential then floats to whatever value lets the set current flow. Under CO, extra reactions are available to carry the current, so the potential can settle at a different value than under N₂, where hydrogen evolution and oxide reduction must carry it. Surface area, local pH and transport shift it too. The driving force for oxide reduction is therefore not guaranteed equal across gases.</p>
${rig(`<p>In an MEA, the measured cell voltage is roughly V<sub>cell</sub> = E<sub>anode</sub> − E<sub>cathode</sub> + I·R<sub>Ω</sub> plus transport losses. Without a reliable reference electrode at the cathode, V<sub>cell</sub> cannot be decomposed, so “equal cell voltage” would not mean equal cathode potential either. The proposal reports voltage and checks the endpoint structurally rather than claiming matched potentials ${src('P05')}.</p>`, 'what voltage you can measure')}
${reviewer('Why not activate at a controlled potential instead of a shared current program?', 'A shared current program is reproducible and does not need a reliable cathode reference in an MEA, which is hard. Potential control would equalize driving force but let current and charge differ. Each choice leaves something unequal; the proposal chooses shared current and measures the endpoint. Whether a potential-controlled variant should be added is a design question to discuss with an adviser.')}
${call('dist', '<p><strong>Did the gas change structure, or only how far reduction went?</strong> Measure oxide fraction at the endpoint. If the gases leave different residual oxide, extend the N₂ (or CO) activation until oxide fractions match and see whether the structural and product contrasts persist. If they vanish once reduction is matched, the “gas effect” was a reduction-extent effect.</p>')}

<h2><span class="h-num">7.4</span>The endpoint is not the working state</h2>
<p>After activation the gas switches to CO for the common test. An N₂-activated electrode meets CO for the first time at that moment. In Li’s flow cell, that is when the N₂-derived grain boundaries were eliminated and nanobumps formed ${ref(2)}. So a gas effect could be large at the start of the test and fade. That is why the proposal measures an early product window as well as the primary late window, and characterizes structure after operation as well as at the activation endpoint ${src('P04')} ${src('P05')}.</p>
${call('asm', '<p>That a comparable reduction endpoint can be reached and verified under both gases, and that the activation products can be physically collected apart from the test products ' + src('P03') + ' ' + src('P05') + '.</p>')}
${check('q-potential')}
${check('q-endpoint')}
`,
  });

  /* ---------------- Lesson 8 ---------------- */
  WC.lesson({
    id: 'twobytwo', part: 'materials', short: 'The 2×2 experiment', minutes: 18,
    title: 'The 2×2 experiment: an interaction is a <em>difference of differences</em>',
    lede: 'Two dwells crossed with two gases gives four cells. A main effect asks “does this factor help on average?” An interaction asks “does one factor’s effect depend on the other?” The proposal is about the second.',
    goals: ['How the four pilot cells are built and what is held constant.', 'How to compute both main effects and the interaction by hand.', 'Why an interaction is not a main effect, and why lines need not cross to interact.'],
    concepts: ['c-interaction', 'c-pilot'],
    body: () => `
<div class="table-wrap"><table><thead><tr><th><span class="sr-only">Precursor</span></th><th>Activated in N₂</th><th>Activated in CO</th></tr></thead><tbody>
<tr><th scope="row">Dwell t₀ (reference)</th><td>m(t₀, N₂)</td><td>m(t₀, CO)</td></tr>
<tr><th scope="row">Dwell t₁</th><td>m(t₁, N₂)</td><td>m(t₁, CO)</td></tr></tbody></table></div>
<p>Each cell is the mean late-window n-propanol partial current density of independently prepared electrodes in that condition. Peak temperature, cooling, total flow, the current–time program and the CO test are shared ${src('P03')}. Independent coating/heating runs are replicated, with day and reactor channel balanced across cells.</p>
${concept({
  title: 'Main effect versus interaction',
  intuition: '<p>Suppose CO activation adds 5 mA cm⁻² whichever precursor you use. That is a main effect: useful, but it says nothing about precursor history. Now suppose CO adds 8 to one precursor and 2 to the other. The benefit of CO depends on how the precursor was made. That dependence is the interaction.</p>',
  formal: `${eq('gas effect at dwell t: g(t) = m(t, CO) − m(t, N₂)')}${eq('interaction Δ = g(t₁) − g(t₀) = [m(t₁,CO) − m(t₁,N₂)] − [m(t₀,CO) − m(t₀,N₂)]', 'A difference of differences. Swap the roles of the factors and you get the same number: the dwell effect under CO minus the dwell effect under N₂.')}<p>Main effects in a balanced 2×2 are averages over the other factor: gas main effect = ½[g(t₀) + g(t₁)], dwell main effect = ½[(m(t₁,N₂) − m(t₀,N₂)) + (m(t₁,CO) − m(t₀,CO))].</p>`,
  example: '<p>N₂: 14 at t₀, 14 at t₁. CO: 28 at t₀, 18 at t₁. Gas effect at t₀ = 14; at t₁ = 4. Δ = 4 − 14 = −10. CO helps at both dwells (positive gas main effect), but much less at t₁: a strong interaction.</p>',
  counter: '<p>N₂: 12 and 16. CO: 18 and 22. Both factors help, but the gas effect is 6 at both dwells, so Δ = 0. Two real effects, no interaction. Lines on the plot are parallel.</p>',
  why: '<p>The materials hypothesis predicts gas-dependent retention of precursor contrasts. In a 2×2, that is precisely a nonzero difference of differences in structure and in products. θ(t) in Aim 2 generalizes Δ to a whole curve of dwells ' + go('theta', 'Lesson 19') + '.</p>',
  check: 'q-dod',
})}
${widget('twobytwo')}
${call('mis', '<p><strong>“No crossing lines, no interaction.”</strong> Any non-parallel pattern on this additive scale is an interaction. Crossing (a ranking reversal) is just the most dramatic kind.</p>', { side: true })}
${rig(`<p>Write the four cell means as a regression with centered (±½) codes D for dwell and G for gas:</p>${eq('m = β₀ + β<sub>D</sub>·D + β<sub>G</sub>·G + β<sub>DG</sub>·D·G')}<p>With ±½ coding, β<sub>D</sub> and β<sub>G</sub> are the main effects defined above and β<sub>DG</sub> equals the difference of differences Δ. With 0/1 dummy coding, β<sub>D</sub> and β<sub>G</sub> instead become “simple effects” at the reference level, a frequent source of confusion when reading regression output.</p><p><strong>Scale matters.</strong> The proposal defines the interaction on the additive scale of partial current density. On a log scale (ratios), the same data can show a different interaction or none. Choosing the scale after seeing which one looks interesting is a forking-paths error, so the scale is fixed in advance ${src('P07')}.</p><p><strong>Precision.</strong> If each cell has n independent preparations with preparation-level standard deviation σ, the four cell means are independent and Var(Δ̂) = 4σ²/n, so SE(Δ̂) = 2σ/√n. An interaction is estimated with twice the standard error of a single cell mean, which is why interactions need more replication than main effects ${go('replication', 'Lesson 13')}.</p>`, 'regression view and precision')}
${reviewer('Why only two dwells in the pilot?', 'Because the pilot’s job is to validate the assays, estimate preparation variance and check that a precursor contrast exists. Two levels give one interaction contrast. Aim 2 then expands dwell and gas composition within the tested window and learns θ(t) as a curve.')}
${check('q-dod-num')}
${check('q-main')}
`,
  });

  /* ---------------- Lesson 9 ---------------- */
  WC.lesson({
    id: 'structure', part: 'materials', short: 'What structure means', minutes: 18,
    title: 'What “structure” actually <em>means</em>',
    lede: 'Particle, aggregate, crystallite, grain, grain boundary, intragrain domain, porosity, connectivity, roughness. Each is a different object at a different scale, seen by different instruments. Conflating them is the easiest way to lose a PI’s trust.',
    goals: ['Each structural term, its scale and what it is not.', 'Which instrument sees which feature, and each instrument’s blind spots.', 'Why diffraction width alone cannot identify grain boundaries.'],
    concepts: ['c-structure'],
    body: () => `
<p>The proposal names specific descriptors: <q>oxide fractions, coherent-domain dimensions and particle connectivity</q> from diffraction and microscopy, plus blinded TEM of <q>selected surface and grain/subgrain structures</q> ${src('P04')}. Click through the explorer to see where each lives in an electrode and what can observe it.</p>
${widget('grains')}
${concept({
  title: 'Crystallite size is not grain size',
  intuition: '<p>X-rays measure how far order extends coherently. Anything that breaks that order (a grain boundary, but also a twin, a stacking fault, a low-angle subgrain boundary or strain) shortens the coherent domain. So the XRD “crystallite size” is a lower bound-ish proxy, not a count of grains.</p>',
  formal: `<p>Scherrer analysis relates peak breadth β (radians, after removing instrumental broadening) to a volume-weighted coherent-domain size L: L = Kλ/(β cos θ), with K ≈ 0.9. Strain also broadens peaks; Williamson–Hall analysis separates them approximately: β cos θ = Kλ/L + 4ε sin θ. Neither gives grain-boundary density, boundary character or where boundaries sit.</p>`,
  example: '<p>Song et al. describe ≈10 nm intragrain features inside ≈35 nm grains ' + ref(1) + '. A diffraction-derived size might sit near the smaller of those numbers, because intragrain features interrupt coherence, even though the grains are larger.</p>',
  counter: '<p>A sample of large, nearly perfect grains with high microstrain can show broad peaks and a small apparent “crystallite size.” Read naively, it would be called fine-grained when it is not.</p>',
  why: '<p>The hypothesis is about architecture surviving activation. If a diffraction width change were reported as “more grain boundaries,” a reviewer would rightly object. The proposal says it directly: <q>diffraction width alone cannot identify boundaries.</q></p>',
  check: 'q-xrd',
})}
<h2><span class="h-num">9.1</span>Instruments and what they cannot see</h2>
<div class="table-wrap"><table><thead><tr><th>Method</th><th>Sees well</th><th>Blind spots and risks</th><th>Role here</th></tr></thead><tbody>
<tr><td>XRD</td><td>Phases and their fractions; coherent-domain size; microstrain; averaged over a large volume</td><td>No location; no boundary density; weak for thin surface layers and small minority phases</td><td>Oxide fraction before activation and at the endpoint; coherent-domain dimensions</td></tr>
<tr><td>SEM</td><td>Particles, aggregates, surface porosity, cracks, coverage of fibers</td><td>Grains inside particles usually invisible; surface only</td><td>Particle connectivity and morphology across stages</td></tr>
<tr><td>TEM / HRTEM, diffraction in TEM</td><td>Grains, subgrains, twins, lattice fringes, local phase</td><td>Tiny sampled area; beam and sample preparation can alter copper; destructive; needs air-free transfer</td><td>Blinded, selected grain/subgrain and surface structure on companions</td></tr>
<tr><td>Orientation mapping (4D-STEM and related)</td><td>Grain orientations and boundary character</td><td>Specialized, slow, small areas</td><td>Not named in the proposal; a possible extension (background)</td></tr>
<tr><td>Double-layer capacitance (ECSA proxy)</td><td>Electrochemically accessible area, roughness</td><td>Depends on wetting; not structure-specific</td><td>Not named in the proposal; useful context for roughness and wetting (background)</td></tr>
<tr><td>ICP-OES</td><td>Element amounts: copper loading, contaminants such as iridium from the anode</td><td>No structure, no location</td><td>Loading and contamination checks ${src('P04')}</td></tr></tbody></table></div>
${call('mis', '<p><strong>“Blinded TEM gives a representative picture.”</strong> Blinding prevents the analyst’s expectations from steering what is measured. Representativeness is a separate problem, addressed by sampling several fields and particles and pairing TEM with bulk diffraction.</p>', { side: true })}
${reviewer('Your XRD crystallite size decreased after activation. Did grain-boundary density increase?', 'Not necessarily. Peak width reflects coherent-domain size, microstrain and instrument broadening, and it is a volume average. A smaller coherent domain can come from smaller grains, more subgrains or twins, or more strain. Boundaries need TEM-based evidence, which the proposal adds on selected, blinded companions.')}
${check('q-term')}
`,
  });

  /* ---------------- Lesson 10 ---------------- */
  WC.lesson({
    id: 'journey', part: 'materials', short: 'Following one electrode', minutes: 18,
    title: 'Following <em>one electrode</em> through the experiment',
    lede: 'Follow a single electrode from bare carbon paper to postmortem microscopy. At each step: what is recorded, how long it takes, what can go wrong, and what you still do not know. Then meet its companion.',
    goals: ['The sequence of physical steps and the data each produces.', 'Why postmortem copper characterization is dangerous and what air-free transfer does and does not fix.', 'Why companion electrodes are needed, and why they add uncertainty that must be measured.'],
    concepts: ['c-postmortem', 'c-companion'],
    body: () => `
${widget('journey')}
<h2><span class="h-num">10.1</span>Why postmortem copper is dangerous</h2>
<p>Every structural measurement of copper in this project happens after the bias is turned off. That creates three problems:</p>
<ol><li><strong>Air re-oxidizes copper.</strong> Yang et al. watched metallic copper nanograins under bias become single-crystal Cu₂O nanocubes after electrolysis and air exposure ${ref(4)}.</li><li><strong>Relaxation without bias.</strong> Without the reducing potential and adsorbed CO, surfaces can rearrange even without oxygen.</li><li><strong>Preparation and the beam.</strong> Cutting, thinning and the electron beam itself can alter copper.</li></ol>
${concept({
  title: 'Air-free transfer versus deliberate exposure',
  intuition: '<p>You cannot prove a protected transfer changed nothing. You can test whether exposure matters: treat one sample with protected transfer and a sibling with deliberate air exposure. If they look the same, handling is probably not dominating at your sensitivity. If they differ, you have measured the size of the artifact.</p>',
  formal: '<p>Let S<sub>op</sub> be the operando structure, S<sub>af</sub> the air-free recovered structure and S<sub>ex</sub> the deliberately exposed one. The control estimates S<sub>ex</sub> − S<sub>af</sub>, the handling effect. It cannot estimate S<sub>af</sub> − S<sub>op</sub>, the bias-removal effect. Only operando methods address that, and the proposal makes operando beamtime optional ' + src('P10') + '.</p>',
  example: '<p><q>Air-free transfer will be checked against deliberate exposure [4].</q> ' + src('P04') + '</p>',
  counter: '<p>If both protected and exposed samples show the same Cu₂O shell, the protected transfer failed, or oxidation happened before transfer. A “no difference” result is only informative if the protected transfer is shown to work on a positive control.</p>',
  why: '<p>All structure–performance claims rest on recovered states. The control bounds one source of error and keeps the interpretation honest about the rest.</p>',
  check: 'q-airfree',
})}
<h2><span class="h-num">10.2</span>Companion electrodes</h2>
<p>TEM consumes the specimen. Some other assays perturb it: wetting a surface with liquid, for instance. The performance electrode must stay intact for its test, or has already been changed by it. So the proposal uses <q>identically prepared companions, with mismatch estimated experimentally</q> ${src('P04')}. A companion shares the processing history. It is not the same object.</p>
${widget('companion')}
${call('unres', '<p><strong>How companions are made is a design choice the proposal leaves open.</strong> Cut from the same heated sheet as the performance electrode, they share that run’s exact thermal history but may sit at different places on a nonuniformly heated sheet. Made in separate runs, they add run-to-run variation. Which gives smaller, better-characterized mismatch is a pilot question.</p>')}
${reviewer('Why should I believe the TEM of an electrode you did not test?', 'Only as much as measured companion consistency justifies. The proposal estimates mismatch, for example by assaying pairs of companions from the same run, and carries it into the model, so a companion assay narrows uncertainty about the tested electrode only as much as it should.')}
${call('mis', '<p><strong>“Identically prepared means identical.”</strong> It means same recipe and run. Loading, local temperature and microstructure still vary. Treating a companion as the tested electrode is a hidden assumption a reviewer will find.</p>')}
${check('q-companion')}
`,
  });

  /* ---------------- Lesson 11 ---------------- */
  WC.lesson({
    id: 'products', part: 'materials', short: 'Product measurement', minutes: 20,
    title: 'Product measurement: <em>count the product</em>, not just the current',
    lede: 'Gas chromatography for gases, liquid collection and quantitative NMR for liquids, and a set of checks for what goes missing. The primary outcome is a rate: late-window n-propanol partial current density at fixed total current.',
    goals: ['How GC and quantitative NMR fit together, and where products get lost.', 'How partial current density relates to Faradaic efficiency, and why ratios can mislead.', 'Why early and late windows are separate, and what a 50-hour test can and cannot show.'],
    concepts: ['c-products', 'c-partial', 'c-windows', 'c-50h'],
    body: () => `
<p><q>The primary outcome is late-window n-propanol partial current density at fixed total current in a two-hour screen; an early window tests evolution.</q> ${src('P05')}</p>
<h2><span class="h-num">11.1</span>The measurement chain</h2>
<div class="chart wide"><svg viewBox="0 0 760 210" role="img" aria-label="Measurement chain: the MEA cathode outlet gas goes to online GC for hydrogen, ethylene and other gases; liquid from the cathode side and the anolyte (which receives crossover) is collected and analyzed by quantitative NMR for n-propanol, ethanol and acetate. Losses: volatile alcohols in the gas stream, crossover to the anode where alcohols can be oxidized, collection delay.">
<defs><marker id="ah2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" style="fill:var(--muted)"/></marker></defs>
<rect x="10" y="60" width="150" height="90" rx="8" style="fill:var(--copper-soft);stroke:var(--copper)"/><text x="85" y="95" text-anchor="middle" class="svg-title">MEA</text><text x="85" y="113" text-anchor="middle" class="svg-text">Cu cathode | membrane</text><text x="85" y="128" text-anchor="middle" class="svg-text">| anode</text>
<path d="M160 80 L270 50" style="stroke:var(--muted);fill:none" marker-end="url(#ah2)"/><text x="200" y="52" class="svg-text">outlet gas</text>
<rect x="275" y="20" width="170" height="56" rx="8" style="fill:var(--surface);stroke:var(--rule-strong)"/><text x="360" y="44" text-anchor="middle" class="svg-title">Online GC</text><text x="360" y="62" text-anchor="middle" class="svg-text">H₂, C₂H₄, CO … minutes</text>
<path d="M160 125 L270 160" style="stroke:var(--muted);fill:none" marker-end="url(#ah2)"/><text x="170" y="165" class="svg-text">cathode liquid + anolyte</text>
<rect x="275" y="130" width="170" height="56" rx="8" style="fill:var(--surface);stroke:var(--rule-strong)"/><text x="360" y="154" text-anchor="middle" class="svg-title">Liquid collection</text><text x="360" y="172" text-anchor="middle" class="svg-text">per window, timed</text>
<path d="M445 158 L530 158" style="stroke:var(--muted);fill:none" marker-end="url(#ah2)"/>
<rect x="535" y="130" width="200" height="56" rx="8" style="fill:var(--surface);stroke:var(--rule-strong)"/><text x="635" y="154" text-anchor="middle" class="svg-title">Quantitative NMR</text><text x="635" y="172" text-anchor="middle" class="svg-text">n-propanol, ethanol, acetate · hours–days</text>
<rect x="500" y="20" width="235" height="80" rx="8" style="fill:var(--st-unres-bg);stroke:var(--st-unres);stroke-dasharray:4 3"/><text x="617" y="40" text-anchor="middle" class="svg-title" style="fill:var(--st-unres)">Where product goes missing</text><text x="512" y="60" class="svg-text">· volatile alcohol carried off in gas</text><text x="512" y="75" class="svg-text">· crossover → anode oxidation (Xu)</text><text x="512" y="90" class="svg-text">· holdup delays · outlet flow ≠ inlet</text>
</svg></div>
<p>Gases leave with the outlet stream and are measured by online gas chromatography within minutes. Liquid products accumulate on the cathode side and, after crossing the membrane, in the anolyte; they are collected for each window and quantified by NMR with an internal standard, which may take hours or days to queue. The proposal checks <q>volatile-product recovery, collection delay, outlet flow and crossover</q> ${src('P05')}. Xu et al. found ethanol oxidized at the anode of CO MEAs, one concrete way crossover destroys product ${ref(5)}.</p>
${call('bgd', '<p>Outlet flow differs from inlet flow because CO is consumed and products are added. Computing gas-product rates from GC concentration times inlet flow can therefore be biased; measuring outlet flow avoids that.</p>', { side: true })}
<h2><span class="h-num">11.2</span>Faradaic efficiency and partial current</h2>
${eq('FE<sub>i</sub> = n<sub>i</sub> · F · N<sub>i</sub> / Q', 'n_i electrons per molecule (12 for n-propanol from CO), F = 96 485 C mol⁻¹, N_i moles of product detected in the window, Q charge passed in the window.')}
${eq('j<sub>i</sub> = |j<sub>total</sub>| × FE<sub>i</sub>', 'Partial current density: the share of current density that went into product i. It is computed, not measured with a separate wire.')}
<p>At fixed total current, partial current and FE carry the same information. Partial current density is the absolute rate of making n-propanol per area, which is what “production” means. Divide by n<sub>i</sub>F to get a molar rate.</p>
${widget('accounting')}
${call('mis', '<p><strong>“C₃/C₂ went up, so the catalyst got better.”</strong> The ratio can rise because C₂ fell while n-propanol also fell. Ratios are diagnostic; absolute production, charge balance and voltage stay reported ' + src('P05') + '.</p>')}
<h2><span class="h-num">11.3</span>Early and late windows</h2>
<p>The catalyst may still be changing during the two-hour screen, especially an N₂-activated electrode meeting CO for the first time ${ref(2)}. Pooling the whole run would average two different catalysts. The late window reflects a more settled state and is the primary outcome; the early window tests evolution. Because liquids take time to reach the collector, collection delay must be known or products land in the wrong window.</p>
${widget('collection')}
<h2><span class="h-num">11.4</span>What 50 hours can and cannot show</h2>
${claims([
  ['prop', 'Selected 50-hour tests assess whether a contrast persists beyond the screen, under the same operating conditions ' + src('P05') + '.'],
  ['est', 'Song et al. ran 330 h at 100 mA cm⁻² with retained morphology and selectivity, in their system ' + ref(1) + '. Xu et al. traced performance loss in CO MEAs over runs beyond 100 h to flooding, anode contamination and anolyte drift, not only the catalyst ' + ref(5) + '.'],
  ['unres', 'Industrial lifetime, behavior at other currents, and slow device failure modes. Not claimed.'],
])}
${reviewer('Why is partial current density, not Faradaic efficiency, the primary outcome?', 'At fixed total current they are proportional, so the comparison is the same. Partial current density states the quantity that matters, the absolute rate of making n-propanol, and it stays meaningful if a later study varies current. Ratios like C₃/C₂ remain diagnostics because they can rise while production falls.')}
${check('q-partial')}
${check('q-recovery')}
${check('q-windows')}
`,
  });

  /* ---------------- Lesson 12 ---------------- */
  WC.lesson({
    id: 'alternatives', part: 'materials', short: 'Alternative explanations', minutes: 18,
    title: 'Alternative explanations and <em>controls</em>',
    lede: 'An electrode is not an idealized copper crystal. Wetting, CO access, oxide fraction, contamination, local pH, the reactor and product recovery can all produce a “structure effect” that is not about catalyst structure, or can be the very way structure acts.',
    goals: ['The causal role of each variable: manipulated, controlled, measured, mediator, confounder, latent, artifact.', 'Which control constrains which alternative.', 'Why a transport effect can be a mediator rather than an artifact.'],
    concepts: ['c-roles', 'c-alternatives'],
    body: () => `
<p><q>Heated-support controls, loading, ICP-OES contamination checks and wetting/CO-access tests constrain alternative pathways [5]. … Transport can mediate a structural effect rather than invalidate it.</q> ${src('P04')}</p>
${widget('causal')}
${concept({
  title: 'Mediator or confounder? It depends on the cause',
  intuition: '<p>Suppose electrodes with one precursor flood more. If they flood because their architecture is more hydrophilic, flooding is <em>how</em> the architecture affects output: a mediator. If they flood because they happened to be assembled on a worse day, flooding is a nuisance that biases the comparison: a confounder. Same variable, different role.</p>',
  formal: '<p>In a causal graph with treatment X (processing), outcome Y (products) and a third variable W: W is a mediator if X → W → Y; a confounder if W → X and W → Y (or W varies with treatment assignment for reasons outside the treatment); a collider if X → W ← Y. Adjusting for a mediator removes part of the real effect; failing to adjust for a confounder biases it; adjusting for a collider creates bias.</p>',
  example: '<p>Architecture changes porosity, porosity changes CO access, CO access changes n-propanol output. Regressing output on CO access and calling the remainder “the structural effect” would discard the part of the effect that works through transport.</p>',
  counter: '<p>Xu et al. found anode-derived iridium contamination drove excess hydrogen evolution in CO MEAs ' + ref(5) + '. If iridium contamination differed between conditions because of cell assembly, its effect on products is not a structural effect at all.</p>',
  why: '<p>The proposal deliberately keeps both interpretations available: some controls remove nuisance pathways, others measure possible mediators. A reviewer will ask which is which.</p>',
  check: 'q-mediator',
})}
<h2><span class="h-num">12.1</span>What each control constrains</h2>
<div class="table-wrap"><table><thead><tr><th>Alternative</th><th>How it could imitate a structure effect</th><th>Check in the proposal</th><th>What would distinguish it</th></tr></thead><tbody>
<tr><td>Support changes</td><td>Heating alters the carbon paper’s wetting or surface chemistry</td><td>Heated-support controls</td><td>Bare heated paper behaves differently from unheated, and the difference tracks dwell</td></tr>
<tr><td>Loading</td><td>More copper per area changes current per site, local pH, transport</td><td>Loading measured</td><td>The effect disappears when compared at matched loading</td></tr>
<tr><td>Oxide fraction</td><td>Phase, not architecture, differs between dwells or endpoints</td><td>Diffraction at each stage; cooling-history route accepted only at matched oxide fraction</td><td>Effect persists when oxide fraction is matched by another route</td></tr>
<tr><td>Contamination</td><td>Metals (e.g., Ir from the anode, per Xu) change hydrogen evolution</td><td>ICP-OES contamination checks</td><td>Contaminant levels differ systematically between conditions</td></tr>
<tr><td>Wetting / flooding</td><td>Pores fill with liquid, starving CO, favoring H₂</td><td>Wetting and CO-access tests</td><td>Differences in flooding indicators, and whether architecture explains them</td></tr>
<tr><td>CO access / local pH</td><td>Transport limits change coverage and pH at the surface</td><td>CO-access tests</td><td>Effect changes with CO partial pressure or flow (background method)</td></tr>
<tr><td>Reactor / day</td><td>A channel or day performs differently</td><td>Day and channel balanced</td><td>Effect aligns with channel or day rather than treatment</td></tr>
<tr><td>Product recovery</td><td>Missing liquid product looks like low selectivity</td><td>Recovery, delay, outlet flow, crossover checks</td><td>Charge balance closes poorly in one condition</td></tr></tbody></table></div>
${call('unres', '<p><strong>Local pH is hard to measure directly in an MEA.</strong> The proposal does not name a local-pH measurement. Its influence is constrained indirectly through matched current, loading and transport checks. A reviewer may press on this; acknowledge it.</p>')}
${reviewer('A matched-oxide cooling-history control: how does that challenge the architectural interpretation?', 'It reaches a different architecture by a different thermal route while matching oxide fraction. If the structure–performance relationship learned from dwell also predicts the cooling-history samples, architecture is a better explanation than something specific to dwell. If it fails, the dwell effect is probably carried by something else. Matching oxide fraction does not match everything (wetting, strain, surface chemistry), so it challenges rather than proves.')}
${check('q-alt')}
`,
  });

  /* ---------------- Lesson 13 ---------------- */
  WC.lesson({
    id: 'replication', part: 'materials', short: 'Replication & pseudoreplication', minutes: 14,
    title: 'What counts as <em>another experiment</em>?',
    lede: 'A new image, a new GC injection, a new electrode cut from the same sheet, and a new coating/heating run answer different questions. For a claim about processing, only the last is a replicate.',
    goals: ['How to count independent preparations in a nested design.', 'Why more fields per electrode improve structural description but saturate as evidence about processing.', 'How blocking by day and channel protects comparisons.'],
    concepts: ['c-pseudorep'],
    body: () => `
<p><q>Independent coating/heating runs will be replicated, with day and channel balanced. Pilot variance and a predeclared meaningful interaction will determine confirmatory replication.</q> ${src('P03')}</p>
${widget('nested')}
${concept({
  title: 'Pseudoreplication',
  intuition: '<p>Asking one person the same question ten times is not a survey of ten people. Ten microscopy fields of one electrode tell you about that electrode; they say nothing new about whether another heating run would give the same electrode.</p>',
  formal: '<p>Define the experimental unit as the smallest unit to which a treatment is independently applied: here, a coating/heating run (and its assigned activation). Observations nested within a unit share its random deviation, so they are correlated. Treating them as independent understates the standard error and inflates significance.</p>',
  example: '<p>4 heated sheets × 3 coupons × 10 fields × 5 GC injections = 600 numbers, but 4 independent precursor preparations.</p>',
  counter: '<p>If a question is about measurement repeatability (how noisy is GC?), then repeated injections are the right replicate. The replicate depends on the claim.</p>',
  why: '<p>The 2×2 interaction is a claim about processing, so its uncertainty must be computed from independent preparations. Aim 2’s “repeat” action is defined as an independent preparation for the same reason.</p>',
  check: 'q-pseudo',
})}
${widget('variance')}
<h2><span class="h-num">13.1</span>Blocking and randomization</h2>
<p>If all CO-activated electrodes ran on Monday on channel 1 and all N₂ on Tuesday on channel 2, any day or channel difference would be indistinguishable from the gas effect. Balancing day and channel across conditions (blocking), and randomizing the order within a block, keeps those nuisance effects from aligning with a treatment ${src('P03')}.</p>
${call('mis', '<p><strong>“Not significant, so the conditions are the same.”</strong> With few preparations, a real interaction can easily be non-significant. Equivalence needs an interval inside predeclared meaningful bounds ' + go('evidence', 'Lesson 14') + '.</p>', { side: true })}
${reviewer('How many replicates will you run?', 'The proposal deliberately does not fix a number: it depends on preparation-level variance that does not exist yet. The pilot estimates that variance; the meaningful interaction is declared before confirmatory data; replication is sized so the interval for the interaction can resolve that size.')}
${check('q-pseudo-num')}
`,
  });

  /* ---------------- Lesson 14 ---------------- */
  WC.lesson({
    id: 'evidence', part: 'materials', short: 'What would convince us', minutes: 18,
    title: 'What result would <em>convince</em> us?',
    lede: 'Three different claims sit on three rungs: a processing effect, a structural interpretation, and a specific catalytic mechanism. Each rung needs evidence the rung below does not. This ladder is the spine of every answer you give.',
    goals: ['The evidence needed for each rung of the claim ladder.', 'How the proposal reads support, equivalence, limited relevance and unresolved results.', 'Why validation on a new preparation is part of the decisive test.'],
    concepts: ['c-ladder', 'c-falsify'],
    body: () => `
${widget('ladder')}
<h2><span class="h-num">14.1</span>Reading the result: four verdicts</h2>
<div class="claims">
${WC.claim('prop', '<q>Gas-dependent retention with a replicated product interaction supports co-design.</q> ' + src('P06'))}
${WC.claim('prop', '<q>Equivalent structural and product contrasts across activation gases argue against that interaction within predeclared meaningful bounds.</q>')}
${WC.claim('prop', '<q>Retained structure with convergent products limits its relevance to the measured output; imprecise results remain unresolved.</q>')}
</div>
<p>The crucial distinction is between “equivalent” and “unresolved.” Both can produce a non-significant test. They differ in how wide the uncertainty is compared with the effect that would matter.</p>
${widget('interval')}
${concept({
  title: 'No significant difference is not equivalence',
  intuition: '<p>A blurry photo that does not show a scratch is not proof the car is unscratched. You need a photo sharp enough that a scratch of meaningful size would have been visible.</p>',
  formal: '<p>Declare a smallest meaningful interaction δ before confirmatory data. Estimate the interaction with an interval (for example 90% for two one-sided tests). If the whole interval lies inside (−δ, +δ), declare equivalence. If it lies wholly outside 0 and beyond a bound, the interaction is supported. Anything else is unresolved.</p>',
  example: '<p>Estimate −1 mA cm⁻², interval (−2, 0), δ = 3: equivalent. Estimate −1, interval (−7, 5), δ = 3: unresolved, even though 0 is inside and the test is “not significant.”</p>',
  counter: '<p>A precise, tiny but nonzero interaction (interval 0.4 to 0.8 with δ = 3) is statistically different from zero yet practically equivalent. Significance and importance are different questions.</p>',
  why: '<p>It lets the proposal report an informative negative, rather than turning every null into “more work needed.”</p>',
  check: 'q-equiv',
})}
<h2><span class="h-num">14.2</span>The decisive comparison</h2>
<p><q>The decisive comparison tests whether the precursor contrast changes with activation, then validates a predicted structure–performance response in a new preparation.</q> ${src('P05')} Two steps: estimate the difference of differences with independent preparations, then use the structure–performance relationship to predict an electrode that was not used to build it. The second step separates a reproducible relationship from a story fitted to the data that produced it.</p>
${call('key', '<p><q>A processing interaction alone cannot establish a specific active-site mechanism.</q> Keep your claims on the rung your evidence reaches.</p>')}
${reviewer('What would make you abandon the structural hypothesis?', 'Equivalent contrasts across gases within the declared bounds; structural retention without any product interaction; or a matched-oxide cooling-history control that breaks the structure–performance relationship. An imprecise result abandons nothing; it is reported as unresolved.')}
${check('q-ladder')}
${check('q-verdict')}
`,
  });

  /* ---------------- Quiz bank: Part II ---------------- */
  WC.q({ id: 'q-dwell', lesson: 'synthesis', concepts: ['c-joule'], q: 'Two dwell times produce electrodes with the same grain size but different CuO/Cu₂O ratios. What has the dwell manipulation mainly changed?', choices: ['Architecture', 'Phase composition, which the interpretation must now account for', 'Nothing important'], correct: 1, explain: 'Dwell is a bundle of possible changes. Here it changed phase, which is why oxide fractions are measured and matched-oxide controls are required.' });
  WC.q({ id: 'q-trace', lesson: 'synthesis', concepts: ['c-joule'], q: 'Why record calibrated temperature traces instead of the electrical power setting?', choices: ['Power determines temperature exactly.', 'Contact resistance, emissivity and sheet nonuniformity make temperature vary at fixed power, and microstructural kinetics depend exponentially on temperature.', 'Temperature traces are required by NSF.'], correct: 1, explain: 'A small unrecorded temperature difference could masquerade as a dwell effect.' });
  WC.q({ id: 'q-charge', lesson: 'activation', concepts: ['c-charge'], q: 'Two electrodes receive identical charge during activation. Which statement is correct?', choices: ['They are reduced to the same extent.', 'They may be reduced to different extents, because charge splits among oxide reduction, hydrogen evolution and (under CO) CO reduction, and starting oxide fractions can differ.', 'The CO electrode is always more reduced.'], correct: 1, explain: 'Equal charge is an imposed history; the endpoint must be checked structurally.' });
  WC.q({ id: 'q-potential', lesson: 'activation', concepts: ['c-activation'], q: 'Under the same current program, why might a CO-fed and an N₂-fed cathode sit at different potentials?', choices: ['Because CO is heavier than N₂.', 'Under galvanostatic control the potential adjusts to whatever reactions can carry the current, and CO reduction offers additional pathways.', 'They cannot; same current means same potential.'], correct: 1, explain: 'Equal current is not equal driving force. The proposal reports voltage and checks endpoints rather than claiming equal potential.' });
  WC.q({ id: 'q-endpoint', lesson: 'activation', concepts: ['c-activation'], q: 'Why might an N₂-activated electrode change most at the start of the common CO test?', choices: ['Because the N₂ is still flowing.', 'It meets CO for the first time then; in Li et al., an N₂-derived surface restructured once CO operation began.', 'Because the current is higher in the test.'], correct: 1, explain: 'That is one reason for an early window and for post-operation structure.' });
  WC.q({ id: 'q-dod', lesson: 'twobytwo', concepts: ['c-interaction'], q: 'CO activation adds 6 mA cm⁻² at both dwells. What is the interaction?', choices: ['6', '12', '0'], correct: 2, explain: 'The gas effect is the same at both dwells, so the difference of differences is zero. That is a gas main effect.' });
  WC.q({ id: 'q-dod-num', lesson: 'twobytwo', concepts: ['c-interaction', 'c-pilot'], type: 'num', answer: -6, tol: 0.01, q: 'Cell means (mA cm⁻²): t₀/N₂ = 10, t₀/CO = 18, t₁/N₂ = 12, t₁/CO = 14. Compute Δ = g(t₁) − g(t₀).', explain: 'g(t₁) = 14 − 12 = 2; g(t₀) = 18 − 10 = 8; Δ = 2 − 8 = −6.' });
  WC.q({ id: 'q-main', lesson: 'twobytwo', concepts: ['c-interaction'], q: 'Lines on the interaction plot do not cross but are clearly not parallel. Is there an interaction on this scale?', choices: ['No, only crossing lines show interactions.', 'Yes, any non-parallel pattern is an interaction; crossing is a ranking reversal.', 'Only if p < 0.05.'], correct: 1, explain: 'Parallel lines mean equal gas effects at both dwells. Anything else is an interaction on the additive scale.' });
  WC.q({ id: 'q-xrd', lesson: 'structure', concepts: ['c-structure'], q: 'What does the Scherrer “crystallite size” from XRD measure?', choices: ['The grain size seen in TEM', 'The coherent-scattering domain size, which defects, subgrains, twins and strain can shorten', 'The particle size seen in SEM'], correct: 1, explain: 'Crystallite (coherent-domain) size, grain size and particle size are three different quantities.' });
  WC.q({ id: 'q-term', lesson: 'structure', concepts: ['c-structure'], q: 'Which feature is a property of how particles connect rather than of their crystals?', choices: ['Intragrain domain', 'Interparticle contact (connectivity)', 'Coherent domain'], correct: 1, explain: 'Connectivity describes necks and contacts between particles, which carry electrons and hold the layer together.' });
  WC.q({ id: 'q-airfree', lesson: 'journey', concepts: ['c-postmortem'], q: 'Protected and deliberately air-exposed samples look identical in TEM. What have you learned?', choices: ['The TEM shows the operando structure.', 'At this sensitivity, air handling is not dominating; the effect of removing bias is still unknown.', 'Air-free transfer is unnecessary.'], correct: 1, explain: 'The control estimates the handling effect, not the bias-removal effect. Only operando methods address the latter.' });
  WC.q({ id: 'q-companion', lesson: 'journey', concepts: ['c-companion'], q: 'As companion mismatch grows, what happens to a companion TEM measurement’s value for predicting the tested electrode?', choices: ['Nothing; TEM is precise.', 'It falls, because the measurement increasingly describes the companion rather than the tested electrode.', 'It rises, because more variability means more information.'], correct: 1, explain: 'A precise measurement of the wrong object is still about the wrong object. Mismatch must be measured and modeled.' });
  WC.q({ id: 'q-partial', lesson: 'products', concepts: ['c-partial'], type: 'num', answer: 45, tol: 0.5, q: 'Total current density 150 mA cm⁻², n-propanol Faradaic efficiency 30%. What is the n-propanol partial current density in mA cm⁻²?', explain: 'j = 150 × 0.30 = 45 mA cm⁻².' });
  WC.q({ id: 'q-recovery', lesson: 'products', concepts: ['c-products'], q: 'Only 70% of the n-propanol produced reaches the NMR tube because some evaporates and some crosses to the anode. What happens to the apparent FE?', choices: ['It is unaffected.', 'It is underestimated by 30% of its true value, and charge balance falls short.', 'It is overestimated.'], correct: 1, explain: 'Missed product reads as lower selectivity. Recovery checks and charge balance catch this.' });
  WC.q({ id: 'q-windows', lesson: 'products', concepts: ['c-windows'], q: 'Why is liquid collection delay important for early and late windows?', choices: ['It only affects the total.', 'If liquids take time to reach the collector, product made early can be counted in the late window, blurring evolution.', 'NMR cannot measure delayed samples.'], correct: 1, explain: 'Characterizing delay keeps each window’s products assigned to the right time.' });
  WC.q({ id: 'q-mediator', lesson: 'alternatives', concepts: ['c-roles'], q: 'Architecture changes porosity, which changes CO access, which changes output. You regress output on CO access and call the residual “the structural effect.” What went wrong?', choices: ['Nothing; that isolates structure.', 'CO access is a mediator here; adjusting for it removes part of the real structural effect.', 'You should have adjusted for output instead.'], correct: 1, explain: 'Transport can mediate a structural effect rather than invalidate it.' });
  WC.q({ id: 'q-alt', lesson: 'alternatives', concepts: ['c-alternatives'], q: 'Which check addresses contamination from the anode, like the iridium Xu et al. identified?', choices: ['Heated-support control', 'ICP-OES contamination checks', 'Blinded TEM'], correct: 1, explain: 'ICP-OES measures elemental contaminants; Ir contamination drove excess hydrogen evolution in CO MEAs.' });
  WC.q({ id: 'q-pseudo', lesson: 'replication', concepts: ['c-pseudorep'], q: '4 independent heated sheets, 3 coupons per sheet, 10 microscopy fields per coupon, 5 GC injections per test. How many independent precursor preparations?', choices: ['4', '12', '600'], correct: 0, explain: 'Coupons, fields and injections are nested within sheets. They describe each preparation more precisely but are not new preparations.' });
  WC.q({ id: 'q-pseudo-num', lesson: 'replication', concepts: ['c-pseudorep'], type: 'num', answer: 3, tol: 0, q: 'Three electrodes, each from its own heating run, are each imaged in 40 TEM fields. How many independent preparations support a processing claim?', explain: 'Three. The 120 fields are nested measurements.' });
  WC.q({ id: 'q-equiv', lesson: 'evidence', concepts: ['c-falsify'], q: 'Interaction estimate 0.5 mA cm⁻², 90% interval (−6, 7), meaningful bound ±3. Verdict?', choices: ['Equivalent: no interaction.', 'Unresolved: the interval includes both 0 and meaningful values.', 'Supported interaction.'], correct: 1, explain: 'Non-significance is not equivalence. The interval is too wide to decide.' });
  WC.q({ id: 'q-ladder', lesson: 'evidence', concepts: ['c-ladder'], q: 'You have a replicated product interaction plus matching structural differences at the activation endpoint. Which claim is supported?', choices: ['A specific active site', 'A processing interaction with a supported structural interpretation, not a mechanism', 'Nothing beyond correlation'], correct: 1, explain: 'A mechanism needs site-sensitive evidence (e.g., operando spectroscopy, isotopes, kinetics), which this is not.' });
  WC.q({ id: 'q-verdict', lesson: 'evidence', concepts: ['c-falsify'], q: 'Structure differs between gases, but late-window n-propanol is equivalent within bounds. What does the proposal conclude?', choices: ['H1 supported', 'Retained structure with convergent products limits its relevance to the measured output', 'The structural measurement must be wrong'], correct: 1, explain: 'It bounds relevance to this output and window; it does not say structure never matters.' });
})();
