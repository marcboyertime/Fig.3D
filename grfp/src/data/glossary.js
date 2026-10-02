/* Glossary = the original guide's 71 entries, plus entries this rebuild needs.
   Where an addition replaces an original definition, the replacement is stricter. */
window.WC = window.WC || {};
(function () {
  const add = [
    ['Particle', 'A physically separate piece of solid, as seen in SEM or TEM. One particle can contain many grains, and its size is not the crystallite or grain size.', ['particles']],
    ['Aggregate', 'Particles stuck together by necks or sintering; an agglomerate is held more loosely. Aggregates set porosity and electronic pathways in a coated electrode.', ['agglomerate', 'aggregates']],
    ['Crystallite', 'Often used to mean the X-ray coherent-scattering domain: the region that diffracts in phase. Its size from peak broadening (e.g., Scherrer analysis) is usually smaller than or equal to the grain size, because subgrains, twins, faults and strain also break coherence.', ['crystallite size', 'coherent-domain dimensions']],
    ['Grain', 'A region of one crystal orientation bounded by grain boundaries. A grain may contain subgrains or twins, so grain size, crystallite size and particle size are three different numbers.', ['grains', 'grain size']],
    ['Intragrain domain', 'A smaller region inside a grain separated by low-angle boundaries, twins or other defects. Song et al. describe ≈10 nm intragrain features inside ≈35 nm grains. The proposal calls these grain/subgrain structures.', ['intragrain feature', 'subgrain', 'intragrain domains']],
    ['Porosity', 'Empty space within and between particles and aggregates. It controls where liquid and gas can go, so it links architecture to wetting, flooding and CO access.', []],
    ['Interparticle contact', 'A neck or junction where particles touch. Contacts carry electrons and hold the layer together; they can sinter during heating or open during reduction.', ['connectivity', 'particle connectivity', 'neck']],
    ['Surface roughness', 'How much real surface exists per geometric area. Often estimated electrochemically from double-layer capacitance (an ECSA proxy). Rougher is not automatically more selective.', ['roughness', 'roughness factor']],
    ['ECSA', 'Electrochemically active surface area, usually estimated from double-layer capacitance. Clark et al. recommend reporting rates normalized both to geometric area and to ECSA.', ['electrochemically active surface area']],
    ['Scherrer analysis', 'Estimating coherent-domain size from diffraction peak width. Instrumental broadening and microstrain also widen peaks, so the number is an estimate of coherent-domain size, never a grain-boundary density.', ['scherrer']],
    ['Flash Joule heating', 'Heating a sample very quickly by passing a large current through a resistive support, then cooling it rapidly. Song et al. used it with rapid cooling to quench copper-oxide precatalysts.', ['fjh']],
    ['Ramp rate', 'How fast temperature rises during heating. Song et al. used ramp rate to control precatalyst morphology; the proposal instead varies dwell at fixed peak temperature and cooling.', []],
    ['Precatalyst', 'The material placed in the reactor before it transforms into the working catalyst. Here, the Joule-heated copper oxide.', ['pre-catalyst', 'precatalysts']],
    ['Operando', 'Measured while the catalyst works under realistic reaction conditions, with products measured at the same time. In situ means in the reaction environment; ex situ means removed from it.', ['in situ', 'ex situ']],
    ['Postmortem', 'Characterization after the experiment, after bias is removed and the sample is recovered. It can differ from the working state, for example by re-oxidation in air.', ['postmortem characterization', 'post-mortem']],
    ['Galvanostatic', 'Controlling current and letting potential float. Equal current across electrodes does not mean equal cathode potential.', ['current control']],
    ['Cathode potential', 'The electrode potential at the copper side, measured against a reference electrode. MEA cell voltage includes the anode, membrane and resistive losses, so it is not the cathode potential.', ['equal potential']],
    ['GDE', 'Gas-diffusion electrode: a porous support that brings gas reactant to the catalyst from one side while the electrolyte or membrane contacts the other.', ['gas diffusion electrode', 'gas-diffusion electrode']],
    ['Flooding', 'Liquid filling the pores of a gas-diffusion electrode, starving the catalyst of gas and favoring hydrogen. Xu et al. identified flooding as a main degradation cause in CO MEAs.', []],
    ['Local pH', 'The pH right at the catalyst surface, which can differ greatly from the bulk electrolyte because reduction produces hydroxide. Architecture and current both change it.', []],
    ['Adparticle', 'A small cluster of atoms sitting on a larger surface. Li et al. found Cu adparticles after reducing an oxide under CO, not under N₂.', ['adparticles']],
    ['Nanobumps', 'In Li et al., ≈7.5 nm undulations that formed when the grain-boundary-rich, N₂-reduced surface restructured during CO reduction.', ['nanobump']],
    ['Charge balance', 'Checking that the Faradaic efficiencies of all measured products sum to about 100%. A shortfall means missed products, losses, or unaccounted processes.', ['faradaic balance']],
    ['Difference of differences', 'The interaction contrast in a 2×2 design: (gas effect at one dwell) − (gas effect at the reference dwell). Zero means the gas effect does not depend on dwell on this scale.', ['difference-of-differences', 'dod']],
    ['Pseudoreplication', 'Treating repeated measurements of the same independent unit as if they were independent units. Ten images of one electrode are not ten preparations.', ['pseudoreplicate']],
    ['Blocking', 'Arranging runs so nuisance factors like day or reactor channel are balanced across treatments rather than aligned with one.', ['balanced', 'day and channel']],
    ['Acquisition function', 'The score a controller uses to rank possible next actions. Here: expected reduction in integrated posterior variance of θ per unit cost.', ['acquisition']],
    ['Gaussian process', 'A flexible probabilistic model for an unknown function that gives a mean prediction and an uncertainty band. A common choice for this kind of controller; the proposal does not commit to one model family.', ['gp']],
    ['Heteroskedastic', 'Noise that varies across inputs. Binois et al. show replication is most valuable where noise is large.', ['heteroskedasticity']],
    ['IMSPE', 'Integrated mean-squared prediction error: prediction variance averaged over the input domain. The proposal’s integrated variance of θ is the same idea applied to the interaction curve.', ['integrated mean squared prediction error']],
    ['Latency', 'Delay between starting an action and receiving its result. Online GC returns in minutes; liquid NMR in hours to days; facility TEM in days or weeks.', ['delay']],
    ['Inline proxy', 'A fast, usually non-destructive measurement taken on the same specimen (mass, sheet resistance, optical image, a quick diffraction pattern). Cheap and immediate, but less specific than a destructive assay.', ['inline proxies', 'proxy']],
    ['Reference archive', 'The separate, policy-independent replicated grid of preparations with paired structural and product data, failures and costs, used for replay.', ['reference library', 'replay library', 'archive']],
    ['Commissioning pilot', 'Early experiments that establish safe operation, reproducibility, recovery and real costs. They define the domain but are not used to pick a flattering benchmark.', ['pilot']],
    ['Equivalence bound', 'A predeclared smallest effect that would matter scientifically. If the whole uncertainty interval lies inside ±bound, the effects are declared equivalent.', ['equivalence bounds', 'meaningful bounds', 'tost']],
    ['Mediator', 'A variable on the causal path from treatment to outcome. If architecture changes CO access, which changes output, CO access mediates the architectural effect.', ['mediators']],
    ['Self-driving laboratory', 'A laboratory where a model’s decisions choose the next physical experiment, which robots execute, and the results update the model in a closed loop.', ['sdl', 'autonomous laboratory']],
    ['Anion-exchange membrane', 'A membrane that conducts hydroxide ions, common in alkaline CO MEAs. Liquid products such as alcohols and acetate can cross it toward the anode.', ['aem']],
    ['Quantitative NMR', 'NMR with an internal standard and acquisition settings that make peak areas proportional to concentration. Used for liquid products such as n-propanol, ethanol and acetate.', ['qnmr']],
  ];
  const base = (WC.glossaryBase || []).map((g) => ({ term: g.term, def: g.def, src: g.src, alias: [] }));
  const byTerm = new Map(base.map((g) => [g.term.toLowerCase(), g]));
  add.forEach(([term, def, alias]) => {
    const k = term.toLowerCase();
    if (byTerm.has(k)) { const g = byTerm.get(k); g.def = def; g.alias = alias; }
    else { const g = { term, def, alias, src: '' }; byTerm.set(k, g); base.push(g); }
  });
  // Aliases for original entries
  const al = { 'Faradaic efficiency': ['fe'], 'Partial current density': ['partial current', 'j'], 'MEA': ['membrane-electrode assembly', 'membrane electrode assembly'], 'θ(t)': ['theta', 'interaction curve'], 'XRD / diffraction': ['xrd', 'diffraction'], 'Coherent domain': ['coherent domains'], 'Companion electrode': ['companion', 'companions'], 'Destructive assay': ['destructive'], 'Replay': ['retrospective replay'], 'Posterior': ['posterior uncertainty'], 'Integrated posterior variance': ['integrated variance'], 'Hierarchical model': ['hierarchical joint model'], 'Prospective campaign': ['prospective'], 'Grain boundary': ['grain boundaries'], 'Reduction endpoint': ['activation endpoint'], 'Main effect': ['main effects'], 'Late window': ['late-window'], 'n-Propanol': ['propanol', 'n-propanol'] };
  base.forEach((g) => { if (al[g.term]) g.alias = (g.alias || []).concat(al[g.term]); });
  base.sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }));
  WC.glossary = base;
})();
