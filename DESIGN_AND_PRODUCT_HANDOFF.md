# Fig.3D — design and product handoff

## Living preferences — update with each round of feedback

This is the living product/design guide, not only a historical handoff. At the user's explicit request (3 October 2026), record every new critique, preference and improvement here in the same work session. Fold durable principles into the guide, date concrete examples, and distinguish requested work from verified implementation. Read this section before future design or interaction changes. Earlier implementation/status claims below describe their original handoff and may be superseded by current code and verification reports.

### 5 October 2026 — silicon nanowire companion: user critique of the first version

Marcky reviewed the Codex-built silicon nanowire companion (PR #9) and said: **“nothing looks smooth, page looks cluttered, unnatural navigation. need you to fix and fully take to next level.”** Observed in the browser before the rebuild: the opening zoom spilled outside its frame and landed a 3D section at the wrong size over panel d; two stacked rows of tabs plus a figure row, zoom buttons, “Enter the wire”, “Explore now” and “Pause” all competed under the stage; every control change (question, field, stress stage, slider) snapped the geometry and camera instead of moving.

Durable principles taken from this:
- **One navigation row.** Questions and the figure/model switch share one toolbar above the stage, as on the interwoven battery page. Offer only the figures relevant to the current question. Controls for the stage (zoom, camera, opening) live in the stage’s own bottom bar, never as a second button row.
- **Nothing snaps.** Every state change the reader causes is shown as motion: the model eases its geometry, cut and colours toward the requested state, and the camera travels. Tab changes glide to that question’s reported state and give the reader’s own state back on return.
- **Register on the printed object, measured.** The model must leave the page from the exact printed object, fitted numerically (silhouette fit of pose, scale and length), not placed by eye or by matching boxes.
- **Use the paper’s own picture conventions.** Colour by the paper’s scale (Fig. 5: red lithiated, blue crystalline, warm front) and cut the way the paper cuts (Fig. 5b lid), so model and figure compare at a glance.
- **Less text on screen at once.** During the opening, the figure caption and controls step back; one caption per beat.

### 5 October 2026 — annotated method package and practical review loop

The user supplied `fig3d-method.zip` in response to our questions to Claude. The complete package is preserved unchanged under [context/fig3d-method](context/fig3d-method/), including the [detailed answers](context/fig3d-method/method/README.md), eight annotated comparison boards, the original playbook, and six helper scripts. Read the answers and inspect the relevant boards before designing another companion. They document the reasoning behind the user-endorsed result, not merely its final styling. Code references describe upstream commit `defeef0`; the package is not a current-site test report.

**Apply these lessons:**
- Review source → previous version → intermediate attempt → final at comparable scale. Identify the explanatory/compositional fault before adjusting materials or adding effects.
- For figure emergence, measure native-image landmarks, fit projection and pose, and report residual alignment error. Preserve position, size and color through the DOM/WebGL handover. A matching outline does not establish reconstructed internal geometry. Orthographic-fit agreement is supporting evidence, not proof; independently validate fitting methods before generalizing to irregular objects.
- Diagnose rendering in order: color pipeline, exposure, individual lights, reflection environment, then material response. Compare lightness as well as hue. Inspect the actual renderer version and conversion behavior; do not blindly copy manual sRGB conversions or scene-specific numerical settings.
- Map each scientific claim to the visual change that communicates it, its source, and what it must not imply. Pair apparatus and magnified mechanism when both scales are necessary. Check intermediate motion and carrier directions, not only final states.
- Review contact sheets first for composition and distinct states, then full-size images for typography, edges and labels. Write a defect list, fix it, and repeat the affected checks. DOM overlap tests miss SVG labels, bad wrapping, misleading paths and weak visual hierarchy.
- Recompose phone views and camera framing. An in-bounds desktop layout shrunk onto a phone can still conceal the explanation. Keep controls and the resulting change readily visible together.
- Review stills before costly motion recordings, then inspect transition frames and handover. Virtual-clock captures show authored timing only; independently measure real-time interaction and rendering. Keep observed defects, author-reported checks and untested behavior separate.

**Carry forward the author's remaining observations as a review backlog, not newly reproduced bugs:** the page-lift edge sliver; cathode route whose endpoints are hidden; pendant/label collision; undersized initial figure; displaced Device label; underdeveloped Interface circuit; phone Formation controls separated from the scene; card vignette edge. Reproduce against the current version before fixing. Real-device performance, touch, actual browser zoom, OS reduced motion, screen readers, contrast, other browsers and independent learner understanding remain unestablished by this package.

**Reuse limits:** preserve the supplied files as reference evidence. Browser helpers have sandbox-specific Playwright imports, Python helpers have Linux font and absolute input/output paths, and board regeneration depends on lost raw captures. Adapt tools to the permitted local tooling when needed; do not execute archive scripts blindly or treat them as portable installed tools. No helper was executed during this import. The original boards survive even where intermediate renders cannot be reproduced.

### 4 October 2026 — user-endorsed craft benchmark

The user reviewed Opus’s interwoven-battery redesign and supplied its production account, saying **“now THAT is the kind of work i want to see.”** Preserve [the supplied playbook](context/Opus-Interwoven-Battery-Playbook.md) as the concrete reference for future work. This is explicit approval of the direction and level of craft, not evidence that every behavior or scientific claim is verified.

- Start with the paper and a claim ledger. Source fidelity should drive distinct, understandable visual states.
- Measure figure geometry and camera correspondence. Register the live model to the printed object so it appears to emerge from the paper; preserve recognizable landmarks throughout the transition.
- Use source-consistent material colors, controlled neutral lighting, readable depth, and deliberate surface response. Blue/violet branding does not restrict scientific material colors.
- Pace explanations for reading and inspection; allow immediate interruption and quick, state-preserving figure/model comparisons. Treat the playbook’s timing values as starting points, not universal rules.
- Every explanatory step must visibly communicate what changes. Linked apparatus and magnified mechanism views are a strong example; changing only the caption is insufficient.
- Inspect every meaningful state at actual desktop and phone sizes. Use contact sheets, motion recordings, and repeated corrections for framing, typography, labels, transitions, and scientific meaning. Functional tests alone do not establish visual quality.
- Automate checks for control/content agreement, overlap, overflow, input direction, interruption, rapid switching, and state preservation. Test animated mechanisms as well as geometry and static end states.
- Keep verification claims precise: virtual-clock recordings assess authored choreography, not real-time performance; viewport approximation does not replace actual browser zoom; software-rendered desktop checks do not establish physical-phone behavior.

Apply the method with judgment. Do not copy this paper’s apparatus, palette, or exact choreography into unrelated modules. The standard is careful scientific explanation and visibly refined execution, not additional effects or complexity.

### 3 October 2026 — paper companions and depth of explanation

- **Controls must tell the truth about the visible state.** Starting with a source figure is intentional. Figure 1 must be selected while Figure 1 is visible; a “3D model” selection must correspond to the model. Opening timelines, manual selection, reduced motion and interruption all need the same display state. Never hide a second, contradictory state behind an intro overlay.
- **Let the visual emerge from the paper.** The user specifically loves the homepage rocksalt figure-to-model lift. Carry that visual continuity into companion openings and returns from source figures: maintain a recognizable anchor, reveal depth, then hand over the live scene. A generic crossfade is insufficient. Preserve the camera and inspection state on comparison returns; do not claim a generated geometry reconstructs the photographed specimen. Motion must be interruptible and have a reduced-motion alternative.
- **Figures must stay one action away in the same viewing area.** Rapid source/model comparison is a core product interaction, not a footer link. Preserve source zoom and pan as well as model state. Do not reset the explanation when consulting the paper.
- **Going deeper means new explanatory visuals and rigorous reasoning**, from foundations to the paper's actual argument. It cannot be the shallow scene with extra prose. Each distinct scientific step must produce an observable, meaningful change in the scene.
- **Audit adjacent states side by side.** The user caught “Form SEI” and “Prepare” showing effectively identical bath/circuit visuals. Show the actual difference: which device electrode is connected to external lithium, what the treatment changes, when the external lithium is removed, and when the two device leads are connected. Split compound steps when one image cannot represent their different circuits. Caption changes alone do not meet the requirement.
- **Deeper text must be discoverable next to the interaction.** “Build the explanation” was buried below a large empty gap. Put a clear contextual entry beside the current controls and bring the explanation closer to its visual. Do not depend on accidental scrolling to reveal essential content; avoid solving this by adding a crowded dashboard.
- **Pace introductions for reading.** The nanoparticle opening was too fast. Use adequate dwell time, discreet pause, immediate exploration and easy return to the source. Inspect timing at actual reading speed, not only in screenshots.
- **Craft is an acceptance requirement.** Inspect every distinct state, its scientific meaning, labels, camera, transition, spacing and responsive layout. Exercise rapid switching, keyboard access and reduced motion. Functional buttons and passing unit tests do not demonstrate visual quality or explanatory clarity.

Implemented locally in this revision: correct opening selection; interruptible paper-lift transition; five distinct formation/preparation/operation circuits; contextual access to the closer reading section; bounded mobile labels. The module verification report records browser checks and remaining test limits. This is not a claim of final user approval or public deployment.

### 3 October 2026 — interwoven battery redesign brief (Marcky)

Requested in one brief that asked for world-class quality, not suggestions. Durable principles:

- **Art direction.** Near-black backgrounds, blue and dark-violet accents in the interface, purposeful material colours, Sora type. No dashboards, cards, tiny labels, excess dividers, gratuitous glow, cartoonish objects, periods on headlines, “not to scale” captions, or olive/lime colours.
- **Use the paper's palette.** When a companion is built from a figure, the model's materials take that figure's colours so the reader can compare them at a glance (here grey carbon, blue PAQEDOT, green SEI, red template).
- **Reading flow.** Every state answers, in order: what am I looking at, what changed, why it matters, what to do next. Essential explanation sits beside the visual, not below the fold.
- **Paper → feature → depth → exploration.** The original figure comes first, then a recognisable feature is isolated, then depth and mechanism, then live exploration. The model must land *on* the printed object (registration, not a crossfade) and the page must lie back in 3D, not as flat stacked layers.
- **Openings.** Play automatically with reading time and a discreet pause. Repeated comparisons use shorter transitions. Any reader input on the stage hands control over and it is never taken back. Respect reduced motion.
- **Source figures.** One action away, in the same viewing area, at native resolution and unaltered. Preserve model orientation, zoom, material, cut and advanced state, and each figure's zoom and pan. The selected button must always match what is visible, including mid-transition and under rapid clicking.
- **Science.** Verify every statement against the source. Label observation, derivation, illustration and proposed mechanism differently. Never invent kinetics, thicknesses, performance or certainty.
- **Formation must show the circuit.** Which electrode is addressed, which leads the instrument holds, when external lithium is used, when the device's own leads are used, and why the device is in or above the liquid. Adjacent states must look different, and each must differ in the scene, not only the caption.
- **Go deeper builds from basics to the paper's argument with new visuals** (Connections, Length scales, Formation, Evidence).
- **Interaction.** Correct drag sign, bounded elevation, reset, click distinct from drag, keyboard, touch, and phone scrolling that is never trapped.
- **Verification is part of the deliverable.** Scientific, interaction, visual (390/768/1440/1920 and 200% zoom), performance and regression checks across every page, an “understanding” check with the prose hidden, and precise statements of what could not be tested.
- **Deployment waits for an explicit instruction.**

Status of this brief (requested → implemented → verified → remaining) is kept in `production/self-separating-battery/verification-report.md`, section “Redesign (3 October 2026, second revision)”. Remaining limits: Safari, Firefox, a real phone, screen readers and a human comprehension study were not available; all browser evidence is headless Chromium with a software (SwiftShader) renderer, so motion timing and frame rates on real GPUs were not measured.

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

## 2026-10-05 · Silicon nanowire companion: source-first spatial reasoning

The user requested a complete Liu et al. (2011) paper companion focused on Figure 5, linked to experimental Figures 1–3. The central payoff is orientation → anisotropic transformation → tapered core/shell → stress redistribution → observed damage. Preserve a genuinely 3D whole wire and an exactly linked movable section, natural hand-following orbit, accessible controls, same-stage source switching, reading-paced paper emergence and an interruptible opening.

Prefer usable source simulation outputs. When only rendered supplementary movies/panels are public, use a declared bounded geometric reconstruction. Never make up quantitative stress, kinetics or fracture thresholds for visual impact. Assigned diffusivity anisotropy is an effective interface-motion surrogate; fitted chemical strain is distinct from measured dimensional change. Normal stress must identify its component and crystal axis; von Mises stress is unsigned. Keep colors stable and source panels unaltered. Explain unfamiliar concepts locally and provide deeper methods without crowding the main scene.

Quality must be established separately for source fidelity, implementation and likely viewer inference. Model checks cannot substitute for real browser inspection. Preserve exact evidence and mark untested states/devices explicitly. The October 5 browser review was interrupted by a browser URL-policy block; consult the module verification report before claiming complete visual acceptance. The module is a reviewable local change, not a public deployment.
