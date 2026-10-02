/* PART I — THE SCIENTIFIC PROBLEM */
(function () {
  'use strict';
  const WC = window.WC;
  const { ev, call, reviewer, term: T, src, ref, go, link, widget, check, rig, eq, concept, claims } = WC;

  /* Four-state strip drawn inline: prepared → activated → working → recovered. */
  function fourStates() {
    const st = (x, label, sub, body) => `<g transform="translate(${x} 0)"><rect x="0" y="22" width="150" height="104" rx="8" style="fill:var(--surface);stroke:var(--rule-strong)"/>${body}<text x="75" y="146" text-anchor="middle" class="svg-title">${label}</text><text x="75" y="162" text-anchor="middle" class="svg-text">${sub}</text></g>`;
    const oxide = `<g>${[[40, 60, 20], [80, 52, 18], [110, 78, 17], [60, 94, 19], [100, 108, 12]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" style="fill:var(--st-asm-bg);stroke:var(--st-asm)"/>`).join('')}<text x="75" y="16" text-anchor="middle" class="svg-text">CuₓO + pores</text></g>`;
    const act = `<g>${[[42, 62, 15], [78, 56, 14], [108, 80, 13], [62, 96, 14], [99, 106, 9]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" style="fill:var(--copper-soft);stroke:var(--copper)"/>`).join('')}<path d="M30 70 L55 52 M70 50 L92 64 M50 90 L74 104" style="stroke:var(--copper);stroke-width:.8;fill:none"/><text x="75" y="16" text-anchor="middle" class="svg-text">Cu, shrunken</text></g>`;
    const work = `<g>${[[42, 62, 15], [78, 56, 14], [108, 80, 13], [62, 96, 14], [99, 106, 9]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" style="fill:var(--copper-soft);stroke:var(--copper)"/>`).join('')}${[[34, 48], [52, 50], [70, 44], [88, 46], [118, 70], [120, 90], [50, 110], [78, 100]].map(([x, y]) => `<g><circle cx="${x}" cy="${y}" r="3" style="fill:var(--ink-2)"/><circle cx="${x + 4}" cy="${y - 3}" r="2.4" style="fill:var(--steel)"/></g>`).join('')}<text x="75" y="16" text-anchor="middle" class="svg-text">Cu + adsorbed CO, bias on</text></g>`;
    const rec = `<g>${[[42, 62, 15], [78, 56, 14], [108, 80, 13], [62, 96, 14], [99, 106, 9]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" style="fill:var(--copper-soft);stroke:var(--st-asm);stroke-width:3"/>`).join('')}<text x="75" y="16" text-anchor="middle" class="svg-text">Cu + oxide skin?</text></g>`;
    const arrow = (x) => `<path d="M${x} 74 l14 0 m-5 -5 l5 5 l-5 5" style="stroke:var(--muted);fill:none;stroke-width:1.5"/>`;
    return `<figure class="wide" style="margin:1.4rem 0"><div class="chart" style="overflow-x:auto"><svg viewBox="0 0 700 172" role="img" aria-label="Four states of one catalyst: as-prepared copper oxide, activated copper after reduction, working copper with adsorbed CO under bias, and recovered copper that may carry an air-formed oxide skin.">${st(0, 'As prepared', 'precatalyst (oxide)', oxide)}${arrow(156)}${st(176, 'Activated', 'endpoint of reduction', act)}${arrow(332)}${st(352, 'Working', 'operando, under bias', work)}${arrow(508)}${st(528, 'Recovered', 'postmortem, bias off', rec)}</svg></div><figcaption class="small muted ui">Conceptual schematic, not a micrograph. Each box is a different physical object, and each measurement answers questions about only one of them.</figcaption></figure>`;
  }

  /* ---------------- Lesson 1 ---------------- */
  WC.lesson({
    id: 'transform', part: 'problem', short: 'Why catalysts transform', minutes: 12,
    title: 'Why catalysts <em>transform</em>',
    lede: 'The copper you prepare is not the copper that makes n-propanol. Under the conditions of electroreduction, the material loses oxygen, rearranges and binds reactants. This proposal lives in the gap between those states.',
    goals: ['The four states of a catalyst (prepared, activated, working, recovered) and why each needs its own evidence.', 'Why copper oxides cannot survive strongly reducing potentials, and why surfaces restructure.', 'Why “transformation” does not mean “memory loss”.'],
    concepts: ['c-postmortem', 'c-retention'],
    body: () => `
<p>Start with the proposal’s first sentence: <q>A catalyst is not necessarily the material that enters the reactor.</q> ${src('P01')} Here “catalyst” means the surface that actually carries out the reaction. What you weigh, spray and heat is a <em>precatalyst</em>: a starting material that becomes something else once the electrochemistry begins.</p>
${call('care', '<p>If activation completely rewrote copper, then how you made the precursor would not matter and synthesis research on precursors would be wasted. If activation changed nothing, the choice of activation would not matter. The project asks which of these is true, or whether the answer depends on both. That is only a question because catalysts transform.</p>', { side: true })}
${concept({
  title: 'Prepared, activated, working and recovered are four different objects',
  intuition: `<p>Think of the precursor as a starting draft. Electroreduction edits it. Some sentences may survive word-for-word, some may be rewritten, and the editor (the activation conditions) may change which ones survive. Then, when you take the electrode out of the reactor to look at it, air edits it again.</p><p>So “what does the catalyst look like?” has at least four answers, one per state.</p>`,
  diagram: fourStates(),
  formal: `<dl class="ui small"><dt><strong>Precatalyst (as prepared)</strong></dt><dd>The Joule-heated copper oxide on carbon paper before any electrochemistry.</dd><dt><strong>Activation endpoint</strong></dt><dd>The state after the shared current–time program under CO or N₂, before the common test.</dd><dt><strong>Working (operando) state</strong></dt><dd>The surface present while bias is applied and CO is reacting. Only operando methods observe it directly.</dd><dt><strong>Recovered (postmortem) state</strong></dt><dd>What you can image after bias is removed and the sample is transferred. Handling can change it.</dd></dl>`,
  example: `<p>Yang et al. followed copper nanoparticles during CO₂ electroreduction with operando electron microscopy and X-ray spectroscopy ${ref(4)}. Under bias, a 7 nm particle ensemble became <em>metallic copper nanograins</em>. After electrolysis and exposure to air, the same material oxidized completely into single-crystal Cu₂O nanocubes. A postmortem image alone would have shown the wrong material.</p>`,
  counter: `<p>Transformation does not mean the precursor is forgotten. Song et al. made copper oxides by flash Joule heating and found ≈10 nm intragrain features inside ≈35 nm grains were “substantially transferred” to the working copper, with selectivity and morphology retained after 330 h at 100 mA cm⁻² ${ref(1)}. Change and inheritance can happen together.</p>`,
  why: `<p>Every measurement in this project is attached to one of these states. Diffraction before activation tells you about the precursor; diffraction at the endpoint tells you what activation produced; products tell you about the working state, indirectly; TEM tells you about a recovered companion. Claims must stay attached to the state that was measured.</p>`,
  check: 'q-states',
})}

<h2><span class="h-num">1.1</span>Why copper oxide cannot stay oxide</h2>
<p>CO electroreduction on copper runs at strongly negative (reducing) potentials. Copper oxides are thermodynamically unstable there: electrons and protons (or water) remove their oxygen, leaving metallic copper. That is why an oxide precursor must be <em>activated</em> before it can be compared as a copper catalyst.</p>
${call('bgd', `<p>Standard tabulated potentials put the Cu₂O/Cu couple near +0.47 V and the CuO/Cu₂O couple near +0.67 V on the reversible hydrogen electrode scale. CO reduction to multicarbon products typically runs well below 0 V on that scale, so the driving force to reduce the oxide is large. Kinetics, local pH and transport decide how fast and how completely it happens. Whether traces of oxidized copper persist during operation, and whether they matter, is debated in the wider literature. The proposal does not depend on that debate: it measures oxide fractions rather than assuming them.</p>`)}
${rig(`<p>For the couple Cu₂O + 2H⁺ + 2e⁻ → 2Cu + H₂O, the Nernst equation gives E = E° − (RT/2F) ln(1/a<sub>H⁺</sub>²), which on the RHE scale removes the pH term. At an applied potential E<sub>app</sub> &lt; E°, the reduction is favorable by ΔG = −2F(E° − E<sub>app</sub>) per Cu₂O. With E° ≈ 0.47 V<sub>RHE</sub> and E<sub>app</sub> ≈ −0.6 V<sub>RHE</sub>, that is roughly −200 kJ mol⁻¹. This is a thermodynamic statement only; it says nothing about which microstructure forms, which is a kinetic question.</p>`, 'thermodynamics')}

<h2><span class="h-num">1.2</span>Why surfaces restructure, not only reduce</h2>
<p>Three effects make copper rearrange during and after reduction:</p>
<ul>
<li><strong>Oxygen leaves, volume collapses.</strong> A copper atom takes up roughly 40–45% less volume in the metal than in its oxides (lesson 2 shows the arithmetic). The solid must open pores, crack or shrink.</li>
<li><strong>Atoms are mobile.</strong> Copper surface atoms move readily at room temperature, especially where they have few neighbors (edges, boundaries, small particles).</li>
<li><strong>Adsorbates change what is stable.</strong> CO binds strongly to copper. Li et al. report that strong CO interaction with under-coordinated copper can make N₂-reduced surfaces restructure once CO operation starts, eliminating surface grain boundaries ${ref(2)}.</li>
</ul>
${reviewer('If copper restructures this easily, how can any precursor feature be inherited?', 'Restructuring is local and kinetic, not total. Song et al. observed nanoscale grain features retained after 330 h of operation. Whether a feature survives depends on its size, the boundaries that pin it, and the conditions; whether the activation gas changes that is exactly what the proposal tests.')}
${call('mis', `<p><strong>“The XRD of the as-made electrode tells me the catalyst’s structure.”</strong> It tells you the precatalyst’s phases and coherent-domain sizes. The working catalyst is a different object. That is why the proposal measures before activation, at its endpoint and after operation ${src('P04')}.</p>`)}

<h2><span class="h-num">1.3</span>What is established and what is proposed</h2>
${claims([
  ['est', 'Copper-oxide-derived catalysts transform during electroreduction, and recovered samples can differ from the working state (Yang et al. ' + ref(4) + ').'],
  ['est', 'Precursor nanostructure can be substantially inherited under one activation protocol in a CO-fed MEA (Song et al. ' + ref(1) + ').'],
  ['est', 'The gas present during oxide reduction changed the resulting copper surface in a flow cell (Li et al. ' + ref(2) + ').'],
  ['hyp', 'Activation-created features do not uniformly erase precursor architecture; retention depends on the activation gas ' + src('P02') + '.'],
  ['unres', 'Which precursor features survive, and whether activation and precursor history interact, in this MEA and preparation route.'],
])}
${check('q-transform-why')}
`,
  });

  /* ---------------- Lesson 2 ---------------- */
  WC.lesson({
    id: 'oxide', part: 'problem', short: 'Copper oxide → working copper', minutes: 15,
    title: 'Copper oxide → <em>working copper</em>',
    lede: 'Why start from copper nitrate and a Joule-heated copper oxide at all? Because the oxide-to-metal step is where history can be written into the catalyst, and where activation can rewrite it.',
    goals: ['Four reasons to use a copper-oxide precursor, and which are established versus background.', 'What happens chemically from nitrate to oxide to copper.', 'How precursor structure could be inherited, transformed or erased, and why postmortem structure may differ from the operando state.'],
    concepts: ['c-precursor', 'c-retention', 'c-postmortem'],
    body: () => `
<p>The route in the proposal is: spray copper nitrate on carbon paper, Joule-heat it into a copper oxide, activate it electrochemically into copper, then operate it under CO ${src('P03')}. Each arrow is a transformation that can create, keep or destroy structure.</p>

<h2><span class="h-num">2.1</span>Why a copper-oxide precursor?</h2>
${claims([
  ['est', '<strong>It follows a route shown to transmit structure.</strong> Song et al. used flash Joule heating with rapid cooling to make copper-oxide precatalysts whose nanoscale features were inherited by the working copper ' + ref(1) + '. Building on that route makes the inheritance half of the question concrete.'],
  ['bgd', '<strong>Nitrate solutions are easy to automate.</strong> A dissolved salt sprays uniformly and decomposes cleanly on heating, which suits a robotic coater. This is general processing knowledge, not a claim from the cited papers.'],
  ['bgd', '<strong>Fast heating and quenching can freeze non-equilibrium microstructure.</strong> Short, hot, quickly cooled treatments limit coarsening, so grain and subgrain structure can be set by the thermal history.'],
  ['bgd', '<strong>The oxide-to-metal step is an opportunity.</strong> Removing oxygen forces the solid to rebuild locally. That is where activation conditions, such as the gas present, can act.'],
])}
${call('care', '<p>A PI will ask “why not just deposit copper metal?” Because then there is no reduction step for activation to act on, and the inheritance question disappears. The oxide is the medium through which processing history can reach the working catalyst.</p>', { side: true })}

<h2><span class="h-num">2.2</span>From nitrate to oxide to copper</h2>
<p>On heating, copper nitrate decomposes to copper oxide, releasing nitrogen oxides and oxygen. On a carbon support at high temperature, carbon can also pull oxygen away, so the product may be a mixture of CuO, Cu₂O and even some Cu. The proposal therefore treats the phase fractions as <em>measured outcomes</em> rather than assuming a composition from the recipe ${src('P04')}.</p>
${eq('2 Cu(NO<sub>3</sub>)<sub>2</sub> <span class="up">→</span> 2 CuO + 4 NO<sub>2</sub> + O<sub>2</sub>', 'Textbook thermal decomposition, shown as background. The real phase mixture on Joule-heated carbon paper is measured by diffraction.')}
<p>Activation then reduces the oxide toward copper. The oxygen has to leave, and the volume per copper atom drops sharply:</p>
<div class="table-wrap"><table><thead><tr><th>Phase</th><th class="num">Molar mass (g mol⁻¹)</th><th class="num">Density (g cm⁻³)</th><th class="num">Volume per Cu (cm³ mol⁻¹)</th><th class="num">Change on reducing to Cu</th></tr></thead><tbody>
<tr><td>CuO</td><td class="num">79.55</td><td class="num">6.31</td><td class="num">12.6</td><td class="num">−44%</td></tr>
<tr><td>Cu₂O</td><td class="num">143.09</td><td class="num">6.0</td><td class="num">11.9</td><td class="num">−41%</td></tr>
<tr><td>Cu</td><td class="num">63.55</td><td class="num">8.96</td><td class="num">7.1</td><td class="num">—</td></tr></tbody></table></div>
<p class="small muted ui">${ev('bgd')} Arithmetic from standard densities. It explains why reduction creates porosity and new interfaces; it does not predict the resulting microstructure.</p>

<h2><span class="h-num">2.3</span>Follow the transformation</h2>
<p>Use the explorer below to step through the stages, switch the activation gas, and compare three conceptual pathways. Every picture is a <em>possibility</em> the experiment is designed to tell apart, not a predicted outcome.</p>
${widget('pathway')}
${call('mis', '<p><strong>“The N₂ pathway preserves grain boundaries.”</strong> In Li et al., N₂ reduction produced a grain-boundary-rich surface, but it restructured into nanobumps during later CO operation ' + ref(2) + '. An activation endpoint is not a final working state.</p>')}
${rig(`<p>“Inheritance” can mean several physically different things, and they should not be lumped together:</p><ul><li><strong>Pseudomorphic retention:</strong> outer particle shape and the aggregate network persist while the interior becomes porous copper.</li><li><strong>Microstructural templating:</strong> boundaries or defects in the oxide set where copper grains nucleate and how they are oriented, so a grain-size contrast survives.</li><li><strong>Connectivity retention:</strong> the network of contacts between particles (electron pathways, mechanical integrity) persists even if grains change.</li></ul><p>“Erasure” can likewise happen by coarsening and Ostwald ripening, surface diffusion smoothing out boundaries, or adsorbate-driven reconstruction. The proposal’s measurements (oxide fraction, coherent-domain dimensions, particle connectivity, selected grain/subgrain TEM) are chosen to see these separately ${src('P04')}.</p>`, 'what inheritance could mean')}
${reviewer('Why do you need structure at three stages rather than just after testing?', 'With only the final state, “never different” and “different, then converged during operation” look identical. The activation endpoint separates what activation did from what operation did; the precursor measurement confirms there was a contrast to inherit.')}
${check('q-oxide-volume')}
${check('q-oxide-why')}
`,
  });

  /* ---------------- Lesson 3 ---------------- */
  WC.lesson({
    id: 'whyco', part: 'problem', short: 'Why CO → n-propanol?', minutes: 12,
    title: 'Why CO → <em>n-propanol</em>?',
    lede: 'The reaction is chosen to make the materials question measurable, not because it is the industrial endpoint. CO strips away one step; n-propanol demands two carbon–carbon couplings.',
    goals: ['Why CO electroreduction is the model reaction and what that costs.', 'Why n-propanol is a useful, structure-sensitive and difficult product.', 'Why product ratios are not unique mechanistic fingerprints.'],
    concepts: ['c-co', 'c-propanol'],
    body: () => `
<h2><span class="h-num">3.1</span>CO is the model reaction</h2>
<p>On copper, multicarbon products from CO₂ are widely understood to form through adsorbed CO. Feeding CO directly removes the CO₂-to-CO step from the comparison. The proposal states the trade-off plainly: <q>CO reduction is the model reaction; transfer to CO₂ reduction is not assumed.</q> ${src('P01')}</p>
${claims([
  ['est', 'Both motivating studies measured n-propanol from CO reduction: Song in an MEA ' + ref(1) + ', Li in a flow cell ' + ref(2) + '.'],
  ['bgd', 'In alkaline CO₂ electrolysis, CO₂ reacts with hydroxide to form carbonate, which complicates the local environment and crossover. CO feeds avoid that particular complication. This is field background, not a claim from the cited papers.'],
  ['prop', 'All electrodes, regardless of activation gas, are tested under CO in identical MEA tests ' + src('P03') + '.'],
  ['unres', 'Whether any interaction found with CO transfers to CO₂ feeds. Not claimed.'],
])}
${call('asm', '<p>That studying CO isolates the chemistry relevant to how copper structure shapes C–C coupling, and that a CO-fed result is valuable without CO₂ transfer. It also assumes CO can be handled safely, which requires professionally reviewed interlocks for unattended operation ' + src('P10') + '.</p>', { side: true })}

<h2><span class="h-num">3.2</span>Why n-propanol is scientifically useful</h2>
${concept({
  title: 'A three-carbon product is a demanding probe',
  intuition: `<p>Making a two-carbon product needs one carbon–carbon bond. Making n-propanol needs two, so two CO-derived pieces must meet a third on the surface before something else (hydrogen evolution, desorption as ethylene or ethanol) wins. That makes n-propanol unusually sensitive to how crowded and how varied the surface sites are.</p>`,
  diagram: `<div class="chart"><svg viewBox="0 0 620 150" role="img" aria-label="Schematic: two CO-derived C1 units couple into a C2 intermediate, which couples with a third C1 unit to give a C3 product, n-propanol. Competing exits: ethylene and ethanol from C2, hydrogen from water."><defs><marker id="ah" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" style="fill:var(--muted)"/></marker></defs>
  <g class="svg-label"><circle cx="40" cy="45" r="16" style="fill:var(--steel-soft);stroke:var(--steel)"/><text x="40" y="49" text-anchor="middle">C₁</text><circle cx="40" cy="105" r="16" style="fill:var(--steel-soft);stroke:var(--steel)"/><text x="40" y="109" text-anchor="middle">C₁</text>
  <path d="M60 50 L150 72 M60 100 L150 80" style="stroke:var(--muted);fill:none" marker-end="url(#ah)"/><rect x="155" y="58" width="70" height="36" rx="8" style="fill:var(--copper-soft);stroke:var(--copper)"/><text x="190" y="81" text-anchor="middle">C₂*</text>
  <circle cx="300" cy="30" r="16" style="fill:var(--steel-soft);stroke:var(--steel)"/><text x="300" y="34" text-anchor="middle">C₁</text>
  <path d="M230 76 L360 76 M300 47 L360 70" style="stroke:var(--muted);fill:none" marker-end="url(#ah)"/><rect x="365" y="56" width="110" height="40" rx="8" style="fill:var(--patina-soft);stroke:var(--patina)"/><text x="420" y="80" text-anchor="middle">n-propanol (C₃)</text>
  <path d="M190 95 L190 128" style="stroke:var(--muted);fill:none" marker-end="url(#ah)"/><text x="200" y="140" class="svg-text">exit as ethylene or ethanol (C₂)</text>
  <text x="490" y="40" class="svg-text">competing: H₂ from water</text></g></svg></div><p class="small muted ui">Bookkeeping schematic, not a mechanism. Real pathways involve hydrogenated intermediates and are debated.</p>`,
  formal: `<p>From CO, with protons written for electron bookkeeping (in alkaline cells water supplies the hydrogen):</p>${eq('3 CO + 12 H<sup>+</sup> + 12 e<sup>−</sup> <span class="up">→</span> CH<sub>3</sub>CH<sub>2</sub>CH<sub>2</sub>OH + 2 H<sub>2</sub>O', '12 electrons per n-propanol. Ethanol and ethylene each need 8 from CO; hydrogen needs 2.')}`,
  example: `<p>Li et al. reported 23% Faradaic efficiency to n-propanol at an n-propanol partial current density of 11 mA cm⁻² on CO-activated copper with adparticles ${ref(2)}. Song et al. reported ≈35% n-propanol Faradaic efficiency in an MEA on Joule-heated, quenched precursors ${ref(1)}. Both attribute part of the selectivity to surface features: adparticles (supported by DFT) or grain interfaces (supported by CO-concentration dependence).</p>`,
  counter: `<p>A high n-propanol fraction does not identify a site. Different surfaces can give similar product distributions, and one surface can change its distribution with current, CO pressure or local pH. Product ratios are diagnostic, not unique fingerprints ${src('P05')}.</p>`,
  why: `<p>Because n-propanol is sensitive to surface environment and is already linked to precursor history (Song) and activation gas (Li), it is the most likely product in which a synthesis × activation interaction would show. Its volatility and tendency to cross the membrane also make it hard to count, which is why lesson 11 is about product accounting.</p>`,
  check: 'q-propanol',
})}
${reviewer('Why not study ethylene, the main multicarbon product?', 'Ethylene, ethanol and hydrogen are all measured and reported. The primary outcome is n-propanol because the precedents that motivate the interaction question link precursor structure and activation gas to n-propanol specifically. Changing the target to ethylene would change the question.')}
${call('mis', '<p><strong>“More n-propanol means more grain boundaries.”</strong> That is one interpretation in one system ' + ref(1) + '. The proposal does not assume finer grains are better and does not promise a direction for the effect ' + src('P02') + '.</p>')}
${check('q-co')}
`,
  });

  /* ---------------- Lesson 4 ---------------- */
  WC.lesson({
    id: 'prior', part: 'problem', short: 'What prior work found', minutes: 15,
    title: 'What prior work <em>already discovered</em>',
    lede: 'Two papers set up the question. Song showed inheritance under one activation; Li showed activation gas matters, in a different reactor and without varying the precursor. Neither tested both together.',
    goals: ['Exactly what Song et al. established and what they did not.', 'Exactly what Li et al. established about CO versus N₂ reduction.', 'The supporting roles of Yang, Xu and Soni.'],
    concepts: ['c-song', 'c-li'],
    body: () => `
<p>The summaries below were checked against the published abstracts. The <a href="#sources">Scientific foundation</a> page has the full card for each paper, including which proposal sentences depend on it.</p>
<h2><span class="h-num">4.1</span>Song et al. 2025: inheritance under one activation</h2>
<div class="grid-2">
<div>${claims([
  ['est', 'Flash Joule heating with rapid cooling made copper-oxide precatalysts; <strong>temperature ramp rate</strong> controlled morphology, giving ≈10 nm intragrain features within ≈35 nm grains.'],
  ['est', 'Those features were substantially transferred to the copper formed during CO electroreduction in an MEA.'],
  ['est', '≈35% n-propanol Faradaic efficiency; selectivity and morphology retained after 330 h at 100 mA cm⁻².'],
  ['est', 'At similar faceting, smaller grains showed n-propanol selectivity that rose with CO concentration. The authors interpret this as grain interfaces contributing to CO coverage and C₁–C₂ coupling.'],
])}</div>
<div><h3 class="lab">What it does not establish</h3><ul class="small ui">
<li>Whether a different activation would preserve, erase or amplify the contrast. Activation was held to one protocol ${src('P01')}.</li>
<li>That <strong>heating dwell</strong> produces a contrast. Song varied ramp rate; the proposal varies dwell at fixed peak temperature and cooling.</li>
<li>A specific active site. The grain-interface account is an interpretation.</li>
<li>Transfer to CO₂ or to other cells.</li></ul></div></div>
${call('unres', '<p><strong>Will two dwell times produce a reproducible precursor contrast?</strong> This is not inherited from Song and is the first thing the pilot must show. If it does not, the thermal variable has to change before the interaction can be tested. It is a <em>pilot-dependent design choice</em>, not a known result.</p>')}

<h2><span class="h-num">4.2</span>Li et al. 2018: the gas during reduction matters</h2>
<div class="grid-2">
<div>${claims([
  ['est', 'An oxide precatalyst reduced <strong>under CO</strong> formed Cu adparticles; the catalyst gave 23% n-propanol Faradaic efficiency at 11 mA cm⁻² n-propanol partial current density.'],
  ['est', 'Reduced <strong>under N₂</strong> (inert control), the surface formed no adparticles but was rich in grain boundaries.'],
  ['est', 'During subsequent CO reduction, the N₂-derived surface restructured: grain boundaries were eliminated and ≈7.5 nm nanobumps formed, without adparticles.'],
  ['est', 'DFT suggested adparticles strengthen CO binding and stabilize C₂ intermediates.'],
])}</div>
<div><h3 class="lab">What it does not establish</h3><ul class="small ui">
<li>That the gas effect appears in an MEA, with a Joule-heated precursor. It was a flow cell ${src('P01')}.</li>
<li>That N₂-created structure persists. It restructured under CO.</li>
<li>Any interaction with precursor history. The precursor was not varied.</li>
<li>That the DFT mechanism operates here.</li></ul></div></div>
${call('key', '<p>Put the two side by side and a tension appears. Song credits grain interfaces for n-propanol. Li’s N₂ route produced a grain-boundary-rich surface, which then lost its boundaries under CO. So whether boundary-rich architecture survives depends on what happens during and after activation. That is the proposal’s question in miniature.</p>')}

<h2><span class="h-num">4.3</span>Supporting papers</h2>
<div class="table-wrap"><table><thead><tr><th>Paper</th><th>What it shows</th><th>Why it is cited</th><th>Not established for this project</th></tr></thead><tbody>
<tr><td>${ref(4)}</td><td>Cu nanoparticles became metallic nanograins under CO₂ reduction, then oxidized completely to Cu₂O nanocubes after air exposure.</td><td>Postmortem samples can mislead; check air-free transfer against deliberate exposure.</td><td>Anything about CO feeds or MEAs; that air-free transfer recovers the operando state.</td></tr>
<tr><td>${ref(5)}</td><td>In CO-fed MEAs, GDE flooding and anode-derived iridium contamination drove excess hydrogen evolution; anolyte pH drift from acetate and ethanol oxidation limited long runs.</td><td>Device effects can mimic catalyst effects: test wetting, contamination, crossover.</td><td>Anything about precursor history or activation.</td></tr>
<tr><td>${ref(3)}</td><td>A seven-robot platform fabricated, characterized and tested up to 90 GDEs per campaign for CO₂ electrolysis, more than 3× faster than manual work.</td><td>Robotic gas-fed testing exists to build on.</td><td>CO, n-propanol, or decisions about destructive assays.</td></tr>
</tbody></table></div>
${reviewer('Isn’t your project just Song plus Li?', 'It is the experiment neither ran: precursor history crossed with activation gas, structure followed through three stages, and the product interaction tested with independent preparations and then validated on a new one. Each paper varied one factor. The interaction is only visible when both vary.')}
${check('q-song')}
${check('q-li')}
`,
  });

  /* ---------------- Lesson 5 ---------------- */
  WC.lesson({
    id: 'question', part: 'problem', short: 'The unanswered question', minutes: 12,
    title: 'The <em>unanswered</em> question',
    lede: '“Does activation overwrite precursor structure, or can both histories shape the working catalyst?” Here is what each possible answer would look like, and why the project needs a self-driving lab to find out efficiently.',
    goals: ['The outcome patterns the experiment can distinguish: inheritance, overwrite, additive, gas-dependent retention, later erasure, structure without product relevance.', 'The two hypotheses, word for word, and why they are tested independently.', 'Why this is a materials project and an autonomy project at once.'],
    concepts: ['c-retention', 'c-aims'],
    body: () => `
<p>The materials question has more than two answers. Precursor contrasts can survive, vanish, or survive under one gas and not the other, and they can vanish later during operation. The explorer shows each pattern as it would appear at the three measurement stages.</p>
${widget('archetypes')}

<h2><span class="h-num">5.1</span>The two hypotheses, verbatim</h2>
<div class="claims">
${WC.claim('hyp', '<strong>Materials (H1).</strong> <q>Activation-created features do not uniformly erase precursor architecture: I predict gas-dependent retention of structural and product contrasts.</q> ' + src('P02'))}
${WC.claim('hyp', '<strong>Autonomy (H2).</strong> <q>Separately, adaptive characterization and replication will reach a specified precision on the synthesis–activation interaction curve at lower resource cost, without worse validation error or calibration.</q> ' + src('P02'))}
${WC.claim('prop', '<q>The two hypotheses will be tested independently.</q> A great controller does not prove a catalyst mechanism; a strong catalyst result does not show the controller helped.')}
</div>
${call('mis', '<p><strong>“H1 predicts that CO activation is better.”</strong> No. H1 predicts that how much of the precursor contrast survives depends on the gas. CO could be better, worse or equal on average and H1 could still be true or false.</p>', { side: true })}

<h2><span class="h-num">5.2</span>Why the question needs a self-driving lab</h2>
<p>Answering it well takes many independent preparations, measurements at three stages, slow liquid analysis, and destructive microscopy that must be done on companion electrodes. Every one of those costs time and specimens, and their information arrives with delays. Deciding which of them to buy next, a new condition, an independent repeat, or a structural assay, is the decision problem the self-driving lab studies ${src('P01')} ${src('P07')}.</p>
${call('key', '<p><strong>Neither half is bolted on.</strong> The materials question supplies a real target (the interaction curve θ) with real costs, delays and imperfect companions. The autonomy question supplies a principled way to decide which expensive evidence to collect. Without the materials question, the controller would be optimizing a toy; without the controller, the materials study would be a fixed design that cannot adapt its spending.</p>')}
${reviewer('What if the answer is simply “activation erases everything”?', 'Then precursor contrasts converge under both gases, θ is flat, and if the uncertainty is inside predeclared bounds that is a clean negative: processing history of this kind is irrelevant to this output. The autonomy hypothesis remains testable because learning a flat curve precisely and cheaply is still a defined task.')}
${check('q-question-pattern')}
${check('q-independent')}
`,
  });

  /* ---------------- Quiz bank: Part I ---------------- */
  WC.q({ id: 'q-states', lesson: 'transform', concepts: ['c-postmortem'], q: 'A TEM image taken after testing and air transfer shows Cu₂O nanocubes. What can you conclude about the working catalyst?', choices: ['It was Cu₂O nanocubes during operation.', 'Nothing directly: the recovered state may differ from the operando state, as Yang et al. showed for copper.', 'It was metallic copper, because oxides always reduce.'], correct: 1, explain: 'A recovered sample answers questions about the recovered state. Yang et al. saw metallic nanograins under bias become Cu₂O nanocubes after air exposure.' });
  WC.q({ id: 'q-transform-why', lesson: 'transform', concepts: ['c-retention'], q: 'Which statement best describes the relationship between transformation and inheritance?', choices: ['Any transformation erases precursor structure.', 'Transformation and inheritance can coexist; how much survives is an experimental question.', 'Inheritance is impossible because copper atoms are mobile.'], correct: 1, explain: 'Song et al. observed inherited nanoscale features in copper that had fully transformed from oxide.' });
  WC.q({ id: 'q-oxide-volume', lesson: 'oxide', concepts: ['c-precursor'], q: 'Roughly how much does the volume per copper atom drop when CuO is reduced to Cu?', choices: ['About 5%', 'About 20%', 'About 40–45%'], correct: 2, explain: 'About 12.6 cm³ per mol Cu in CuO versus 7.1 in Cu, a drop of about 44%. The solid must open pores and rebuild interfaces.' });
  WC.q({ id: 'q-oxide-why', lesson: 'oxide', concepts: ['c-precursor'], q: 'Why does the project start from a copper oxide rather than depositing copper metal?', choices: ['Oxides are better catalysts than copper.', 'The oxide-to-metal reduction is the step through which processing history can be inherited and through which activation conditions can act.', 'Copper metal cannot be sprayed.'], correct: 1, explain: 'Without a reduction step there is no activation for the gas to act on and no inheritance to test.' });
  WC.q({ id: 'q-propanol', lesson: 'whyco', concepts: ['c-propanol'], q: 'How many electrons are transferred to make one n-propanol from CO?', choices: ['6', '8', '12'], correct: 2, explain: '3 CO + 12 H⁺ + 12 e⁻ → C₃H₇OH + 2 H₂O. Ethanol and ethylene from CO need 8.' });
  WC.q({ id: 'q-co', lesson: 'whyco', concepts: ['c-co'], q: 'Which is the best justification for using CO rather than CO₂ as the feed?', choices: ['CO electrolyzers are closer to commercialization.', 'CO removes the CO₂-to-CO step and its carbonate side chemistry, isolating the coupling chemistry; transfer to CO₂ is explicitly not assumed.', 'CO gives higher current density in every reactor.'], correct: 1, explain: 'The choice serves the materials question. The proposal does not claim CO₂ transfer or a commercial advantage.' });
  WC.q({ id: 'q-song', lesson: 'prior', concepts: ['c-song'], q: 'Which of these did Song et al. NOT establish?', choices: ['Precatalyst nanostructure was substantially inherited by the working copper.', 'Selectivity and morphology were retained after 330 h at 100 mA cm⁻².', 'Whether a different activation gas would erase the inherited contrast.'], correct: 2, explain: 'Song held activation to one protocol, which is exactly the gap the proposal fills.' });
  WC.q({ id: 'q-li', lesson: 'prior', concepts: ['c-li'], q: 'In Li et al., what happened to the grain-boundary-rich surface formed under N₂ once CO reduction began?', choices: ['It stayed unchanged.', 'It restructured: grain boundaries were eliminated and ≈7.5 nm nanobumps formed, without adparticles.', 'It converted into adparticles identical to the CO-reduced sample.'], correct: 1, explain: 'This is why the activation endpoint and the working state must be measured separately.' });
  WC.q({ id: 'q-question-pattern', lesson: 'question', concepts: ['c-retention'], q: 'Precursor contrasts are equal at the activation endpoint under both gases, but after the CO test they have vanished under both. Which pattern is this?', choices: ['Gas-dependent retention', 'Later erasure during operation, with no gas dependence', 'Additive effects'], correct: 1, explain: 'Activation preserved the contrast, operation erased it, and the gas made no difference. Only the three-stage design can see this.' });
  WC.q({ id: 'q-independent', lesson: 'question', concepts: ['c-aims'], q: 'Why are the two hypotheses tested independently?', choices: ['Because they use different equipment.', 'Because evidence for one does not support the other: a good controller does not prove the catalyst result, and vice versa.', 'Because NSF requires two aims.'], correct: 1, explain: 'Each has its own evidence and its own failure modes.' });
})();
