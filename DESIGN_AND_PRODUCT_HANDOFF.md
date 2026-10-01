# Fig.3D — design and product handoff

## The whole idea

Fig.3D is intended to become a browsable library/publication of useful interactive scientific visualizations, animations and paper companions across materials science. It helps someone see a difficult structure, mechanism or relationship, manipulate it meaningfully, and return to the underlying science with better understanding. A reader should be able to find the particular visual they need; eventual search belongs to a sufficiently populated library. The user explicitly rejected positioning it as a course, guided curriculum, lesson plan or sequence everyone must follow.

Batteries, electrochemistry, energy materials and nanomaterials are initial interests because they supply the first useful examples. They do not define the brand or its eventual boundaries. Materials science includes structures, properties, transport, mechanisms and transformations. Wider scientific domains were left as future possibilities, not a committed expansion schedule. Fig.3D is not just this landing page, one battery model or a lithium visualization.

Its purpose is to make the missing spatial, temporal or causal information in a difficult figure visible. The opening should demonstrate that promise directly: an actual complicated paper figure becomes a clear, recognizable depiction of the same phenomenon in depth and motion. A generic attractive scientific object cannot substitute for that explanatory transformation.

The original blueprint describes a companion relationship: **physical intuition → correct terminology → explorable model → experimental observable → the paper's actual claim**. The reader should understand and be able to question the argument, not simply admire moving atoms. Original audience proposals included advanced undergraduates, new graduate students and experimental researchers entering an unfamiliar area, with instructors and journal clubs as reuse audiences. These are useful editorial starting points, not evidence from audience testing.

## What was decided, proposed and deferred

**Decided:** Fig.3D is the name; a broad collection of individual visualizations is the product; blue/dark-purple surrounding design is preferred; meaningful 3D and purposeful motion matter; sources and assumptions must remain accessible; human expert review is optional and never required for release; the current work is local only.

**Current concrete work:** a homepage that demonstrates a paper-to-spatial-mechanism transformation, a foundational “How a battery works” visualization, a preserved spherical-diffusion preview and a planned impedance teaser. The older paper-specific flagship is Companion 001 — Lithium Pathways in Rocksalt Cathodes. Its original HTML is preserved; its full feature set is not newly release-verified by the small homepage hop.

**Proposed operating model:** build one excellent companion at a time. Select a specific scientific confusion, an interaction that resolves it, an anchor source and a verification method. Maintain a research/project Space, a versioned code repository and a public static publication as distinct homes. Use approved prose and code at runtime rather than a live language model.

**Future editorial ideas:** particle diffusion, electrochemical impedance, nucleation/nanocrystal growth, porous electrode transport and structural transformations. Each needs a bounded model and sources before production. Do not turn a brainstorming list into promised releases or fake finished cards.

**Deferred platform ideas:** arbitrary PDF uploads, live AI tutors, accounts, subscriptions, automatic publishing, large-scale search and newsletters. Selected-state links, correction history, contribution guidance and RSS are smaller future options. None is implemented or needed to run the current package.

**Proposed technical foundation:** Astro with Markdown/MDX, TypeScript, selectively loaded Three.js, SVG/plots and offline reference calculations. The actual portable prototype is simpler static HTML/CSS/JS. Do not assume that proposal requires an immediate rewrite. GitHub plus Cloudflare Pages, with GitHub Pages as an alternative, was a hosting proposal; no repository, domain, hosting setup or public release is confirmed.

## Aesthetic intent and actual user feedback

The user wants something sleek, futuristic, bold, elegant, distinctive and image-led. Minimal text should make a clear eye path through the page. Scientific visuals need to be compelling in their own right and make the science easier to understand. The broad aesthetic reference was https://nanotechenergy.com/; it is inspiration, not a template or a source of scientific claims.

The user dislikes dashboards full of cards/panels, scattered competing text, obvious generated-image filler and generic type. They rejected the olive/lime/yellow-green homepage palette and preferred blue and dark purple. Species can retain purposeful/authentic colors; do not recolor a source figure to satisfy branding at the expense of identity. Sora is the current self-hosted font. It was chosen as a refined readable alternative to generic Arial, not as an irrevocable brand contract.

Headline artificial periods were rejected; the homepage says “Turn figures into understanding”. The main headline words should connect to their corresponding visuals through professional, characterful arrows. Weak thin squiggles were rejected. The user specifically wants to see the lines drawing, not an arrow that appears all at once or a static curve mislabeled as animation. Current code measures actual path length, strengthens stroke/head and presents one connector at a time. Mobile arrows route around the text.

The latest scope constraint is crucial: **the user said the rest of the front page was looking pretty great.** Preserve the overall design. Remaining review should target the arrows, purposeful battery teaser and battery corrections rather than resetting the visual direction. No final user approval of this exact packaged revision has been recorded.

## Homepage mechanism: what must remain recognizable

The user supplied a screenshot of Figure 1 from Hau et al. and a corresponding Claude-created rocksalt HTML. The screenshot was an example of a complicated figure, not permission to paste page headers and journal chrome into the hero. The actual native figure was located in the paper PDF and extracted unchanged; original screenshot and HTML are separately preserved. Native figure resolution is 1500×850. Do not aggressively enlarge a poor raster, invent missing image details or claim an AI reconstruction is the original.

The sequence now begins automatically on arrival, without requiring an initial drag/click. Visitors can watch and scroll. It first shows the full figure, then focuses on one local 1-TM hop, maintains correspondence of Li, TM and vacancy sites as they unfold, adds meaningful oxygen surroundings, and animates one lithium hop. It must remain one continuous explanatory idea rather than a disconnected crossfade to unrelated art. The original Layered, Spinel and DRX columns compare different ordering types; they must not become a temporal phase-change animation.

The ideal local divacancy geometry is source-audited and explicitly not an experimentally reconstructed structure. Two endpoint octahedral sites, a tetrahedral intermediate, two gate sites and oxygen coordination must be distinguished. Site rings represent empty sites; they are not additional atoms. Motion speed is illustrative, not kinetics. Consult the exact audit before changing the geometry.

The user rejected soft Canvas gradient spheres as cartoonish. The current version uses actual Three.js meshes, physical materials and lighting. Preserve real spatial construction and improve any remaining material/lighting issues with art direction rather than more generic glow.

Interaction follows the explanation: inspect species/sites, rotate, reset, scrub or play the hop. Hover has focus/tap equivalents. Quiet pause/replay and a reduced-motion static fallback remain. Avoid scroll hijacking, default endless camera autorotation, a hero control dashboard or motion that hides its scientific meaning.

## Battery teaser and navigation

The original generated cylindrical cutaway was rejected as a generic picture that did not demonstrate Fig.3D. A later cropped screenshot of the module was also rejected, even though it showed the real app. The user wants a deliberately composed clean 3D scene that invites exploration, with no module controls, labels or UI chrome pasted into the homepage.

The current teaser renders the actual battery geometry without labels or controls and uses a short motion burst. It is a normal link into the module. It should feel like entering the same scientific world, with coherent type, materials and motion. Shared native page transitions were implemented and observed completing in the review browser. Keep normal URLs, keyboard and new-tab behavior, back/forward compatibility and reduced motion. Do not introduce arbitrary navigation delays or interaction interception for a decorative effect.

## Battery interaction contract

The user asked for a beautiful actual 3D cell overview and a complete graphite interior, not a flat diagram relabeled as 3D. The current model shows graphite on the left, electrolyte/separator between electrodes, oxide on the right and an external electron circuit. It illustrates two paths coupled by electrode reactions.

Charge/discharge is an easy prominent toggle with persistent mode text. It must reverse ionic/electronic transport, source versus load, energy explanation and active reaction roles while preserving the chosen composition. Material identity/polarity remain fixed. Anode is oxidation, cathode reduction, so the roles swap on charge; make them visible directly on the scene, not only buried in an explanation. Phone labels use role plus polarity sign; full descriptions remain accessible.

The user's final preference supersedes earlier finite-playback ideas: directional markers move continuously at a fixed independently selected composition. No finite discharge that simply stops, and no hidden loop that refills inventory. Keep a discreet Pause motion for accessibility, not prominent Play/Replay/speed controls. Composition slider x=0.300–0.600 may remain because it changes the actual linked explanatory state. Scene occupancy encoding, graph, formulas and readouts must agree.

Drag should follow the hand horizontally and vertically, with damping. On 2026-10-01 the user asked for a full 360° turn: yaw is now unbounded (with release momentum and arrow-key rotation), while elevation stays bounded so the model never flips upside down. Reset takes the short way back. On phones, sideways swipes turn the cell and vertical swipes scroll the page. The earlier opposite horizontal response was explicitly rejected. “Go inside graphite” should move into the same layered hexagonal structure, explain entry/exit through an edge into/between galleries, and offer a clear return. Do not present an attractive lattice detached from the cell explanation.

Labels and controls need space, coherent hierarchy and readable typography. Duplicated Previous/Next/01-of-04 navigation and excessive divider lines were removed. Prominent “Conceptual schematic · not to scale” marketing captions were rejected; necessary assumptions belong in concise source/model disclosures. Do not add fake future component buttons.

## Scientific trust and explanatory design

Three questions are separate: does the model support the claim, does the code implement the model, and will viewers infer only what sources/model support? A screenshot answers neither of the first two. Tests and AI consensus cannot establish empirical validation.

The working standard is source traceability → explicit model specification → independent reference/fixture checks → invariant/model checks → adversarial critique → browser/visual semantic checks → versioned publication decision. Human expert review is an optional additional label with exact scope/version. It must not become a release blocker simply because no expert was recruited.

Classify claims as reported, derived, schematic or hypothetical. Keep representation type separate from verification status. Label source-traced/model-checked/release-verified only when evidence actually supports the exact scope; expert-reviewed only when a human review occurred. Never present invented barrier curves, universal channel activity or hand-picked percolation thresholds as literature results.

Link meaningful representations: selected structure, graph, controls, units, displayed values and explanatory text should describe one coherent state. Distinguish a view preference from a physical parameter. A camera change should not change a transport calculation. Quantitative colors need stable scales/units; species colors should retain identity. Motion should reveal a mechanism or relationship, not serve as scientific evidence by itself.

Learn/Explore/Verify is a useful depth pattern: approachable default, meaningful exploration, and accessible sources/limits. It does not require course-like navigation or forced prerequisite progression. Offer definitions and deeper reasoning where helpful; visitors may enter through an individual visualization. Use 2D/SVG when it explains better; Fig.3D does not mean every object must be 3D.

## Wider research and tool possibilities preserved here

The Scientific Visuals Guide preserves the earlier research synthesis: linked multiple representations, simple initial states, learner-controlled segmentation, causal labels, misconception-aware design and separate measures of engagement versus understanding. Research citations support bounded recommendations, not a guarantee this product teaches effectively. Some guide wording predates the final collection framing; apply the later product decisions above.

It also preserves optional tools for future companions: NumPy/SciPy reference calculations, SVG/D3 plots, pymatgen/spglib crystallography, ASE/LAMMPS trajectories, OVITO/VESTA inspection, Blender, Manim, PyBaMM, impedance.py, SymPy and scientific color maps. These are options to solve a concrete need, not required installs or current dependencies. Data can come from a paper's supporting material, COD, Materials Project or Materials Cloud with exact provenance/license. Generative assets may support nonquantitative editorial work; they must not determine scientific topology, trajectories or numerical results.

For atomistic material, preserve species/atom identity, cell vectors, units, timestamps, methods, potentials, temperature/ensemble, wrapping conventions and source citation. An interpolated hop is not molecular dynamics, a barrier calculation or a physical diffusion coefficient. Offline validated calculations can feed a lightweight browser publication without live AI or computational services.

## Original project Space and roadmap

The project headquarters was organized as Home, Project Blueprint, Scientific Verification Standard, Design System, Engineering, Ideas & Backlog, Launch Plan and Companions. Companion 001 contains Rocksalt Visualizer, Scientific Audit, Model Assumptions, Claim Ledger, Verification Tasks and Next Steps. All fifteen content Pages are exported in `context/space/` with links and historical status caveats. The Space itself is not needed to run this package.

The full rocksalt companion aims to connect one local coordination environment to pathway classification, network connectivity and interpretation of the paper's evidence. It has unresolved broader spinel occupancy, graph, composition/order-slider and finite-size questions. The homepage's local-hop audit is substantial progress for a narrow scope; it does not settle all of that companion.

Launch planning calls for a versioned source packet and claim ledger, verified model/implementation, browser/editorial checks, rights/attribution, corrections path and publication approval. Naming/domain/handle availability was raised but not resolved. Outreach to instructors or journal clubs is a future task, not authorized here. No business/monetization model has been committed merely by mentioning future subscriptions as deferred.

## How to continue without losing context

Begin with the existing artifact and evidence, not a fresh boilerplate project. Review the remaining items in ENGINEERING_STATE, then make a bounded iteration with clearly improved scientific meaning and visual quality. Keep the user in the loop concisely and act on routine reversible work without repeated confirmation. Do not keep broad testing/research running after relevant checks pass unless a real change or unresolved issue justifies it. The user's explicit reason for this handoff is to conserve Codex usage and continue in Claude.

This package includes everything recovered and assembled for the current implementation and broader project planning, but not a fabricated complete historical archive. Earlier named blueprint/launch ZIP downloads and a distinct improved rocksalt HTML remain unrecovered as original bytes. The current supplied HTML is present unchanged. The raw complete original conversation is not bundled; source links and the fifteen Page exports preserve recoverable planning context. When a record is missing, state the gap rather than inventing a decision.
