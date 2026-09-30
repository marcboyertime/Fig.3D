# Fig.3D Scientific Visuals Guide

Fig.3D is a materials science publication that combines polished scientific imagery with explanations that help readers build and test a mental model. Its scope is materials science broadly, drawing on courses, textbooks, and research papers. Electrochemistry, batteries, energy materials, and nanomaterials are initial editorial interests, and "How a battery works" is the first module; they do not define the boundaries or identity of the site. This guide recommends a teaching approach, a selective tool stack, and a production sequence beginning with that battery module. It incorporates the requested linked sliders, explanatory labels, purposeful motion, and progression from fundamentals to deeper understanding.

The central recommendation is to connect a documented scientific model to every view of a lesson. The scene, graph, labels, and numerical readouts should describe the same state. Strong visual design makes that relationship legible; sources, independent checks, and learner testing establish what the explanation actually supports.

This is an initial research synthesis, with tool information checked in late September 2026. The recommendations below are proposed choices for Fig.3D. The cited studies did not evaluate this exact publication or prove that any particular tool guarantees understanding.

## What the learning evidence supports

**Link the representations.** An experiment with 72 vocational students found better domain knowledge for an integrated design with dynamically linked representations than for separate, unlinked representations, particularly in the more complex material. Because several design features changed together, this does not isolate linking as the sole cause. For Fig.3D, a selected particle shell should also select its position on the concentration graph; units, colors, and time should agree. [Van der Meij and de Jong](https://research.utwente.nl/en/publications/supporting-students-learning-with-multiple-representations-in-a-d/)

**Begin with an understandable default.** PhET researchers conducted more than 200 think-aloud interviews and documented how complex openings and unfamiliar controls could distract learners from the science. Their work supports simple starting states, familiar direct manipulation, and immediate feedback. They also observed learners constructing incorrect explanations from incidental visual details. Fig.3D should therefore audit the meaning of colors, spacing, arrows, and motion as carefully as the calculations. [PhET interface research](https://phet.colorado.edu/publications/PhET_Interviews_II.pdf)

**Make motion explain a change.** A meta-analysis of 61 experiments found a small average advantage for animation over static graphics, with substantial variation. It does not establish universal superiority. Use animation to reveal a mechanism, changing relationship, or temporal response; retain still views for inspection and comparison. [Berney and Bétrancourt](https://www.sciencedirect.com/science/article/pii/S0360131516301336)

**Provide a clear spatial starting point.** A cell-biology study found that interactive 3D helped students with higher spatial ability while disadvantaging those with lower spatial ability. The implication for our crystal lessons is to begin with one site, then a hop, then connected paths, with a stable camera and a reset. This is a design inference across subjects, not evidence about the exact cathode example. [Huk](https://onlinelibrary.wiley.com/doi/full/10.1111/j.1365-2729.2006.00180.x)

**Let readers revisit meaningful stages.** Two short lightning-animation experiments found transfer benefits from learner-controlled segmentation. For Fig.3D, provide pause, scrub, replay, and clear stages such as insertion, gradient formation, and relaxation. The wider evidence is mixed, so playback controls alone should not be treated as a proven learning intervention. [Mayer and Chandler](https://tecfa.unige.ch/tecfa/teaching/methodo/Mayer_Chandler01.pdf)

**Connect labels to causal explanation.** Eye-tracking research found that cues could redirect attention without reliably improving conceptual understanding. Identify the selected object, then explain the relationship that matters. A label identifying a steep gradient becomes useful when it also connects that gradient to flux under the declared model. Essential identities should remain visible; deeper labels should work on hover, focus, and tap. [De Koning and colleagues](https://repub.eur.nl/pub/15347), [W3C guidance](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html)

**Address the wrong mental model explicitly.** In an electrochemistry study, conceptual-change instruction helped address misconceptions about electron flow through solutions, while the animations did not appear to affect test responses. The charge-pathway lesson should explain how electronic transport, ionic transport, and interfacial reactions connect. Merely displaying moving dots is insufficient. [Sanger and Greenbowe](https://eric.ed.gov/?id=EJ608705)

**Evaluate understanding separately from enjoyment.** A small study using 3Blue1Brown calculus videos found learning alongside overestimation of the visuals' effectiveness. It had limited sample sizes and no randomized static comparison. For Fig.3D, enjoyment, successful control use, explanation quality, and transfer to a new example should be separate measures. [Bos and Wigmans](https://research-portal.uu.nl/ws/files/277569149/Dynamic_Visualization_in_Animated_Mathematics_Videos_Students_Experiences_and_Learning_Outcomes.pdf)

## What learners and creators report online

These sources provide useful qualitative feedback from self-selected audiences. They do not establish how common a preference is or prove instructional effectiveness.

- Readers of Bartosz Ciechanowski's bicycle article praised its progression from fundamentals toward the complete system. Readers discussing his engine article valued rotation and forward/backward playback for inspecting how parts fit. These support a design with deliberate sequencing and freely inspectable states. [Bicycle discussion](https://news.ycombinator.com/item?id=35343495), [Engine discussion](https://news.ycombinator.com/item?id=26991300)
- Some 3Blue1Brown viewers describe needing an outline, more foundational material, or formal practice to turn intuition into usable knowledge. Preserve a visible conceptual sequence and optional prerequisite explanations. [Linear algebra discussion](https://www.reddit.com/r/3Blue1Brown/comments/1edev7h/hard_to_follow_and_understand_the_linear_algebra/), [Discussion of learning outcomes](https://www.reddit.com/r/3Blue1Brown/comments/1suol9s/does_watching_a_maths_video_actually_teach_you/)
- Bret Victor's original account proposes an explanation that remains useful when read normally, with interaction serving questions raised by the prose. Amit Patel similarly argues from his own audience experience that interaction should support the explanation. These are influential creator perspectives, not controlled experiments. [Victor](https://worrydream.com/ExplorableExplanations/), [Patel](https://simblob.blogspot.com/2018/05/thoughts-on-explorable-explanations.html)

## The proposed Fig.3D interaction standard

Start with one question, one legible object, and one obvious control. Add detail progressively while keeping free exploration available. Optional prediction prompts can help readers notice a relationship; assessment does not need to interrupt the published lesson.

For the homepage, the chosen demonstration is a static 2D scientific figure that transforms into the same phenomenon in 3D and motion. Preserve the identity of its objects throughout the transition so that the added depth and time explain something the flat view leaves implicit. Use one clear materials-science example and brief supporting text. A battery cutaway belongs with the first module, while the homepage communicates the broader publication's purpose. An original figure-style schematic should be identified honestly, without implying it came from a published paper.

All linked views should share physical time, model parameters, sampled results, and selected scientific object. A radius slider should update the field, profile, and relevant readouts together. Playback speed is a viewing preference and must not change physical behavior. When a parameter changes, explicitly restart the example or explain which state is preserved.

Use hover to preview an explanation and click or tap to pin it. Provide equivalent keyboard selection and dismissal. Keep labels from covering the relevant feature, and do not hide essential meaning behind hover. Use fixed, meaningful quantitative color limits; distinguish species colors from concentration scales. [W3C guidance](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html), [Scientific colour maps](https://www.fabiocrameri.ch/colourmaps/)

The publication can retain its dark, sleek visual identity while individual scientific figures use the contrast, lighting, and color necessary for interpretation. Lighting or bloom must not change the apparent meaning of a quantitative field. Clearly identify a conceptual schematic, a continuum calculation, or an atomistic trajectory.

## A selective tool stack

These recommendations are for full scientific companions. They do not require rebuilding the lightweight landing page.

| Role | Recommended resource | Why and limits |
| --- | --- | --- |
| Scientific reference calculations | [NumPy](https://numpy.org/) and [SciPy](https://docs.scipy.org/doc/scipy/reference/generated/scipy.integrate.solve_ivp.html) | Reproducible numerical calculations on a normal CPU. Both use BSD licenses. Solver choice does not validate the equations or boundary conditions. |
| Spatial scenes | [Three.js](https://github.com/mrdoob/three.js) | MIT licensed web rendering for geometry, cutaways, cameras, and selection. Current WebGL rendering requires WebGL2; provide a useful fallback. Add [React Three Fiber](https://github.com/pmndrs/react-three-fiber) only if React is already useful to the product. |
| Linked graphs | SVG with selected [D3](https://d3js.org/) modules | ISC licensed scales, axes, paths, and interaction. Keep one owner for each rendered element. Plain SVG is sufficient for many small plots. |
| Browser verification | [Playwright](https://playwright.dev/docs/browsers) | Apache licensed automation for controls, screenshots, responsive behavior, and reduced motion. Automated WebKit checks do not fully replace actual Safari or mobile testing. |
| Crystal data and geometry | [pymatgen](https://pymatgen.org/) and [spglib](https://spglib.readthedocs.io/en/stable/) | MIT and BSD licensed tools for structures, periodic geometry, and symmetry. Record occupancy and tolerances. Because pymatgen can use spglib, agreement between them is not an independent symmetry check. |
| Scientific colors | [Scientific colour maps](https://www.fabiocrameri.ch/colourmaps/) | Versioned MIT licensed color maps with diagnostic material. Match map type to data and retain units and scale limits. |

The research confirmed built-in image generation and local visualization/game-asset/playtest skills are available. The bundled runtimes include NumPy and Playwright. SciPy and the more specialized scientific packages were absent from that Python bundle; this does not establish their absence from every project or environment. No installation or account configuration was performed.

## Atomistic simulations and molecular dynamics

For an atomic lesson, begin with the material, scientific question, and source data. A published trajectory with documented provenance is a useful first asset. Molecular dynamics can support lessons about thermal motion, hopping, local coordination, and mean-square displacement. Its validity depends on the potential or electronic-structure method, system preparation, sampling, and analysis.

| Tool | Recommended use | Practical constraint |
| --- | --- | --- |
| [ASE](https://docs.ase-lib.org/ase/md.html) | Structure and trajectory I/O, building systems, orchestrating calculators | LGPL licensed. The selected calculator supplies the forces; ASE does not make an arbitrary potential scientifically valid. |
| [LAMMPS](https://www.lammps.org/) | Generating justified classical atomistic trajectories | GPL licensed. Small demonstrations may run on CPU; realistic systems and durations may need substantial compute and careful potential validation. |
| [OVITO](https://www.ovito.org/manual/licenses/index.html) | Inspecting and analyzing structures and trajectories | Free Basic binaries and the free Python module are available; Pro GUI is paid. Check the current Mac requirements before installation. |
| [VESTA](https://jp-minerals.org/vesta/en/download.html) | Additional visual inspection of cells, polyhedra, and volumetric data | Freeware with redistribution and acknowledgment conditions. Useful inspection evidence, not proof of a migration mechanism. |

Preserve species, atom identities, cell vectors, coordinates, units, timestamps, method, temperature, ensemble, and source citation. Use unwrapped coordinates for displacement analysis; wrapping into a periodic cell must not create false jumps. [LAMMPS diffusion analysis](https://docs.lammps.org/Howto_diffusion.html), [MSD coordinate treatment](https://docs.lammps.org/compute_msd.html)

For the existing lithium-hop idea, verify the actual crystal structure, occupancy, periodic neighbors, and proposed path. Interpolating between plausible sites does not establish a barrier or preferred migration pathway. Also, an atomistic self-diffusion coefficient cannot automatically be substituted for a continuum battery model's chemical diffusivity.

## Optional tools that should solve a specific need

- **[PyBaMM](https://github.com/pybamm-team/PyBaMM)** provides a second implementation for particle diffusion and a later route into battery models. It is BSD licensed. Match assumptions and parameter sets when using it for comparison, and export browser data from offline calculations. [Particle tutorial](https://docs.pybamm.org/en/pybamm-v26.7.1.0/source/examples/notebooks/creating_models/3-negative-particle-problem.html)
- **[Blender](https://www.blender.org/)** can create deliberate camera sequences, lighting, cutaways, and editorial renders from validated geometry. It is GPL software; output rights are separate. Check Mac/GPU requirements. **[Molecular Nodes](https://extensions.blender.org/add-ons/molecularnodes/)** is more specialized toward molecular/biological workflows, with an experimental Python API, and is not a necessary default for crystal materials.
- **[Manim Community](https://docs.manim.community/en/stable/)** is MIT licensed and useful for authored mathematical animation and exported video. It is separate from the interactive web runtime and introduces rendering/typesetting dependencies.
- **[impedance.py](https://github.com/ECSHackWeek/impedance.py)** is an MIT licensed option for later circuit-fitting and consistency checks. Its latest published package release found in this research was from 2023, so check compatibility before adoption. A consistency test cannot identify a unique mechanism. Begin an introductory EIS lesson with independently checked RC equations.
- **[SymPy](https://www.sympy.org/en/index.html)** can assist with algebra and derivations; **[Spector.js](https://github.com/BabylonJS/Spector.js)** can diagnose WebGL draw calls and shaders. Neither validates the physical model.
- Generative image, video, and mesh tools can support editorial art, visual concepts, textures, and nonquantitative props. Their output should not determine lattice topology, trajectories, numerical plots, or scientific labels. Tripo capabilities are available through skills, but authentication was not tested and cloud use can require credits. No additional generative subscription is needed for the first diffusion companion.

## Scientific data sources

Prefer source files attached to the paper or experiment under discussion. Preserve provenance and distinguish measured structures from relaxed computed ones.

- **[Crystallography Open Database](https://cod.psdi.ac.uk/)** provides crystal structures under CC0; retain the record and original publication.
- **[Materials Project](https://docs.materialsproject.org/downloading-data/using-the-api/getting-started)** provides computed materials data. API use requires an account key; inspect the applicable data license and provenance, including contributed records.
- **[Materials Cloud Archive](https://archive.materialscloud.org/information)** provides published computational datasets with persistent records. Licenses are record specific.

## The first companion should explain how a battery works

The user's latest choice is to begin with a foundational battery explanation, building understanding while practicing the visual format. This supersedes the earlier suggestion to begin with particle diffusion. Diffusion and impedance remain useful later companions.

The proposed opening question is: **How does a chemical reaction inside a battery power something outside it?** Choose a specific cell chemistry before assigning species, reaction equations, or electrode behavior. Build the explanation in a small sequence:

1. Introduce the two electrodes, electrolyte, separator where applicable, and external circuit with one clear view.
2. Connect a load and distinguish the paths of electronic and ionic transport. Use persistent species identities and charge bookkeeping that agree with the selected chemistry.
3. Zoom into the electrode interfaces to explain how reactions connect the two transport paths. Let a reader select each part for a short explanation.
4. Return to the whole cell and link the local events to delivered electrical energy. Add deeper discussion of potential, chemical driving force, and charging only after the initial model is clear.

This first lesson can use a carefully sourced schematic. Decorative particle speeds must not imply calculated rates, and showing separate pathways must not imply that electrochemical processes happen in a disconnected sequence. Useful early controls are pause, step, replay, and selected-object explanations. Introduce quantitative sliders only when their physical meaning and response model are defined.

The documented misconception about electron flow through electrolyte is directly relevant. A small pilot should check whether readers can explain what crosses the external circuit, what moves through electrolyte, and what happens at an interface. [Electrochemistry study](https://eric.ed.gov/?id=EJ608705)

## A later particle diffusion pilot

The proposed question is: **Why can the surface and center of an active-material particle have different concentrations?**

1. Define an idealized sphere with constant diffusivity, radial symmetry, uniform initial concentration, and a specified insertion pulse followed by rest. State units, boundary conditions, parameter range, and omitted physics. This is one teaching model, not a complete battery simulator.
2. Build an offline numerical reference. Check mass balance, center symmetry, imposed surface flux, concentration bounds, and mesh/time convergence. Compare selected cases with an analytic or manufactured solution and an independently configured calculation. The characteristic timescale is proportional to radius squared divided by diffusivity within this model.
3. Show one paused cutaway beside its concentration profile. Time scrubbing updates both. Selecting a shell identifies its radial location and concentration on the graph. Reveal radius and diffusivity controls after the basic picture is clear.
4. Choose what stays fixed when particle size changes. Equal surface flux, equal current, and equal C-rate answer different questions. Never silently switch between those comparisons. After insertion stops, the fixed total amount redistributes during rest; during continuing insertion, the average concentration continues changing.
5. Check keyboard/touch controls, linked state, extremes, reset, reduced motion, resizing, and rendering fallback. Capture reproducible visual states at known physical times.
6. Observe 4–6 intended readers thinking aloud. Look for confusion about surface versus center, concentration versus flux, color, time, and control behavior. Revise before making efficacy claims. An optional later comparison with a matched static lesson can examine explanation and transfer; a small pilot remains exploratory.

The [PyBaMM particle tutorial](https://docs.pybamm.org/en/pybamm-v26.7.1.0/source/examples/notebooks/creating_models/3-negative-particle-problem.html) is a relevant reference formulation. The proposed pilot is a design recommendation rather than a validated instructional protocol.

## Release evidence

A companion is ready within a declared scope when its claims have sources, its model passes independent checks, its visual encoding matches that model, and its controls work across the supported inputs and layouts. Readers should be able to explain the central mechanism and interpret a changed example; appreciation alone is insufficient evidence of that result.

Human expert review remains optional under the project's established policy. Independent calculations, adversarial critique, visual inspection, and learner feedback each answer different questions. Agreement among AI systems is not empirical validation, and no single package or renderer guarantees scientific correctness or complete understanding.

The next implementation step is to inspect the site's existing dependencies and define the objects, reactions, charge bookkeeping, and visual claims for the foundational battery lesson. Add a numerical scientific environment when a quantitative lesson requires it. The checked particle calculation and linked graph are a later implementation target. Add specialized packages when a chosen lesson or source dataset requires them.
