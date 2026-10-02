/* The eight cited papers. Summaries were checked against each paper's published
   abstract and indexed summaries in October 2026; publisher full texts were not
   reachable from the build environment, so figure-level numbers are limited to
   those stated in abstracts. Verify against the PDFs before quoting numbers. */
window.WC = window.WC || {};
WC.refs = [
  {
    short: 'Song 2025', authors: 'J.-Y. Song et al. (Sargent group)', title: 'Copper Catalysts Inherit and Retain Precatalyst Morphology in Extended CO Electroreduction to n-Propanol',
    journal: 'Adv. Mater. 37, e08900 (2025)', url: 'https://doi.org/10.1002/adma.202508900',
    studied: 'Whether nanoscale architecture built into a copper-oxide precatalyst survives electroreduction and shapes n-propanol selectivity during CO electroreduction.',
    system: 'Copper-oxide precatalysts made by flash Joule heating with rapid cooling; temperature ramp rate used to control morphology; tested in a membrane-electrode-assembly (MEA) CO electrolyzer.',
    found: [
      'Ramp rate controlled morphology, giving ≈10 nm intragrain features within ≈35 nm grains.',
      'These features were substantially transferred to the Cu catalyst formed during CO electroreduction.',
      '≈35% Faradaic efficiency to n-propanol, among the highest C₃ selectivities reported for monometallic Cu.',
      'Selectivity and morphology were retained after 330 h at 100 mA cm⁻².',
      'Catalysts with similar faceting but smaller grains showed n-propanol selectivity that increased with CO concentration; the authors interpret grain interfaces as contributing to CO coverage and C₁–C₂ coupling.',
    ],
    why: 'It is the synthesis half of the motivation and the source of the coating-and-Joule-heating route. It shows a precursor contrast can be inherited, under one activation protocol.',
    not: [
      'Whether a different activation (gas, schedule) would preserve, erase or amplify the inherited contrast. Activation was not the varied factor.',
      'That heating dwell (the proposal’s knob) produces a contrast. Song varied ramp rate.',
      'A unique active site. Their grain-interface account is an interpretation supported by correlations and CO-concentration dependence, not a site-resolved proof.',
      'Transfer to CO₂ feeds, or to other reactors and loadings.',
    ],
    sentences: ['P01S02', 'P03S01', 'P05S02'],
  },
  {
    short: 'Li 2018', authors: 'J. Li et al. (Sargent group)', title: 'Copper adparticle enabled selective electrosynthesis of n-propanol',
    journal: 'Nat. Commun. 9, 4614 (2018)', url: 'https://www.nature.com/articles/s41467-018-07032-0',
    studied: 'How the gas present while an oxide precatalyst is first reduced changes the copper surface, and how that surface affects n-propanol from CO.',
    system: 'Oxide-derived Cu reduced in situ under CO or under N₂ (inert control), tested for CO reduction in an alkaline flow cell.',
    found: [
      'Reduction under CO produced Cu adparticles; the resulting catalyst gave 23% n-propanol Faradaic efficiency at 11 mA cm⁻² n-propanol partial current density.',
      'Reduction under N₂ produced no adparticles but a surface rich in grain boundaries.',
      'During subsequent CO reduction, the N₂-derived surface restructured: grain boundaries were eliminated and ≈7.5 nm “nanobumps” formed, without adparticles.',
      'DFT calculations suggested adparticles raise CO binding and stabilize C₂ intermediates, favoring C₁–C₂ coupling.',
    ],
    why: 'It is the activation half of the motivation: the gas present during activation changed the resulting surface. It also shows the activation endpoint is not the final working state, which is why the proposal measures both.',
    not: [
      'That the same gas effect occurs in an MEA, with a Joule-heated precursor, at the proposal’s current.',
      'That an N₂-created structure persists; it restructured under CO.',
      'Any interaction with precursor history; the precursor was not varied.',
      'That the DFT mechanism is the operative one in this project.',
    ],
    sentences: ['P01S03'],
  },
  {
    short: 'Soni 2026', authors: 'A. Soni et al.', title: 'Accelerated optimization of gas diffusion electrodes for CO₂ electrolyzers',
    journal: 'Matter 9, 102519 (2026)', url: 'https://doi.org/10.1016/j.matt.2025.102519',
    studied: 'Whether a robotic platform can fabricate, characterize and test gas-diffusion electrodes fast enough to accelerate electrolyzer development.',
    system: '“AdaCarbon,” seven coordinated robots that fabricate, characterize and test up to 90 GDEs for CO₂ electrolysis per campaign; Cu–Ag catalysts with Nafion–Sustainion ionomer bilayers.',
    found: [
      'Identified formulations that raised ethylene selectivity at industrial current densities.',
      'Reported more than 3-fold acceleration over manual workflows.',
    ],
    why: 'Evidence that gas-fed robotic electrode testing is real infrastructure to build on, so the proposal does not claim to invent electrode automation.',
    not: [
      'Anything about CO feeds, n-propanol or precursor–activation interactions.',
      'Cost-aware choices between making, measuring and repeating, or handling of destructive assays.',
      'That the proposer’s host has this platform.',
    ],
    sentences: ['P01S05'],
  },
  {
    short: 'Yang 2023', authors: 'Y. Yang et al. (P. Yang group)', title: 'Operando studies reveal active Cu nanograins for CO₂ electroreduction',
    journal: 'Nature 614, 262–269 (2023)', url: 'https://doi.org/10.1038/s41586-022-05540-0',
    studied: 'What copper nanoparticle catalysts actually look like during CO₂ electroreduction, compared with after it.',
    system: 'Cu nanoparticle ensembles (7 nm and 18 nm) studied by operando electrochemical liquid-cell 4D-STEM and time-resolved X-ray spectroscopy during CO₂ reduction.',
    found: [
      'The 7 nm ensemble evolved into metallic Cu nanograins under reaction conditions.',
      'After electrolysis and air exposure, the same material oxidized completely to single-crystal Cu₂O nanocubes.',
      'A higher fraction of metallic nanograins correlated with higher C₂₊ selectivity (about sixfold higher for 7 nm than 18 nm).',
    ],
    why: 'The clearest warning that a recovered, air-exposed sample can look nothing like the working catalyst. It motivates air-free transfer checked against deliberate exposure.',
    not: [
      'Anything specific to CO feeds, MEAs or Joule-heated precursors.',
      'That air-free transfer recovers the operando state; it only reduces one artifact.',
    ],
    sentences: ['P04S03'],
  },
  {
    short: 'Xu 2023', authors: 'Q. Xu et al. (Seger group)', title: 'Identifying and alleviating the durability challenges in membrane-electrode-assembly devices for high-rate CO electrolysis',
    journal: 'Nat. Catal. 6, 1042–1051 (2023)', url: 'https://doi.org/10.1038/s41929-023-01034-y',
    studied: 'Why MEA devices for high-rate CO electrolysis lose performance over time.',
    system: 'Alkaline CO-fed MEA electrolyzers studied with operando wide-angle X-ray scattering and electrolyte monitoring.',
    found: [
      'Cathode gas-diffusion-electrode flooding and iridium contamination from the anode were the two main causes of excessive hydrogen evolution.',
      'More PTFE in the GDE and an alkaline-stable Ni-based anode partly alleviated them.',
      'Over long runs the anolyte pH kept dropping because of cathodic acetate formation and anodic ethanol oxidation; compensating for it maintained >70% C₂₊ Faradaic efficiency for 136 h.',
    ],
    why: 'It shows that in exactly this kind of device, performance changes can come from flooding, contamination and electrolyte drift rather than from the catalyst’s structure. That is the basis for wetting/CO-access tests, ICP-OES contamination checks and attention to crossover.',
    not: [
      'Anything about precursor history or activation gas.',
      'That these are the only non-structural pathways in the proposer’s cell.',
    ],
    sentences: ['P04S05'],
  },
  {
    short: 'Ament 2021', authors: 'S. Ament et al. (SARA)', title: 'Autonomous materials synthesis via hierarchical active learning of nonequilibrium phase diagrams',
    journal: 'Sci. Adv. 7, eabg4930 (2021)', url: 'https://doi.org/10.1126/sciadv.abg4930',
    studied: 'Whether an autonomous system can map synthesis phase diagrams by choosing both what to synthesize and what to characterize.',
    system: 'SARA: lateral-gradient laser spike annealing for parallel synthesis, rapid optical spectroscopy to detect phase transitions, nested (hierarchical) active-learning loops with end-to-end uncertainty; demonstrated on Bi₂O₃.',
    found: [
      'Mapped synthesis phase boundaries for Bi₂O₃ with orders-of-magnitude acceleration, including conditions that kinetically stabilize δ-Bi₂O₃ at room temperature.',
    ],
    why: 'Prior art for autonomous selection of synthesis and characterization together, so the proposal cannot claim that combination as new.',
    not: [
      'Decisions involving delayed, destructive assays or companion specimens; SARA’s optical characterization is fast and non-destructive.',
      'Electrocatalysis, activation or product measurement.',
    ],
    sentences: ['P07S04'],
  },
  {
    short: 'Binois 2019', authors: 'M. Binois, J. Huang, R. B. Gramacy, M. Ludkovski', title: 'Replication or exploration? Sequential design for stochastic simulation experiments',
    journal: 'Technometrics 61, 7–23 (2019)', url: 'https://arxiv.org/abs/1710.03206',
    studied: 'When a sequential design should repeat an existing input (replicate) versus try a new one (explore).',
    system: 'Lookahead sequential design based on integrated mean-squared prediction error (IMSPE) with a heteroskedastic Gaussian-process surrogate; applied to stochastic simulators (inventory management, epidemiology).',
    found: [
      'Replication can be beneficial both statistically and computationally, especially where noise varies across the input space.',
      'A lookahead criterion can decide adaptively between replicating and exploring.',
    ],
    why: 'Prior art for treating “repeat” as a decision that competes with “explore,” and for integrated-variance criteria like the one the proposal uses.',
    not: [
      'Physical experiments with preparation variability, companions, destructive assays or delays.',
      'Any claim about materials. The guide’s sandbox is not an implementation of this paper.',
    ],
    sentences: ['P07S04', 'P08S01'],
  },
  {
    short: 'Clark 2018', authors: 'E. L. Clark et al.', title: 'Standards and Protocols for Data Acquisition and Reporting for Studies of the Electrochemical Reduction of Carbon Dioxide',
    journal: 'ACS Catal. 8, 6560–6570 (2018)', url: 'https://doi.org/10.1021/acscatal.8b01340',
    studied: 'Why CO₂-reduction activity data are hard to compare across labs, and what procedures make them reproducible.',
    system: 'A protocols-and-reporting paper for CO₂ electroreduction studies.',
    found: [
      'Recommends measuring catalysts free of impurity artifacts and accounting for mass-transport effects.',
      'Recommends reporting rates normalized both to geometric area and to electrochemically active surface area, with standardized product-quantification and reporting practices.',
    ],
    why: 'Supports careful product accounting and reporting in the product-measurement chain.',
    not: [
      'A complete recovery, delay and crossover protocol for a CO-fed MEA; that has to be built and validated in the proposer’s cell.',
    ],
    sentences: ['P05S02'],
  },
];
