# Engineering state — Fig.3D

Snapshot: 30 September 2026. This is a stable local prototype handoff, not a public release or a claim of final visual approval. Development stopped at the user's request to conserve Codex usage and continue in Claude. No implementation workers remain editing this snapshot.

## Run the exact package

From the extracted `Fig3D-Claude-Handoff` directory:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory site
```

Open `http://127.0.0.1:4173/`. The other routes are `/battery.html` and `/diffusion.html`. Use HTTP, not `file://`, because the app uses ES modules. Any ordinary static HTTP server is suitable. Python 3 is needed only for this example server; it is not a runtime application dependency. If that port is occupied, choose another. The package does not depend on the original Mac directory or on a running Codex session.

A modern browser with WebGL is required for the 3D experience. Cross-document view transitions are progressive enhancement; normal links are retained. JavaScript, the Three.js browser bundle, source image and Sora font are all local. No install, build, account, API key, backend, live AI call or network service is required to run the main site. Outbound source links naturally require internet access.

## Architecture and file map

The current implementation is plain HTML/CSS/JavaScript ES modules. Astro/MDX/TypeScript is a longer-term proposal, not installed architecture. Do not rewrite frameworks while simultaneously changing the science and design.

| Files | Responsibility |
| --- | --- |
| `site/index.html`, `styles.css`, `app.js` | Library homepage, collection features, source/model and planned-topic dialogs, analytical teaser drawing. |
| `hero.js` | Source figure framing, stage timeline, source-anchor-to-spatial transition, Canvas image/text overlay, controls, inspection, keyboard/pointer rotation and animated SVG connectors. |
| `hero-renderer.js` | Three.js orthographic renderer, physical sphere materials, lighting, edges, site rings and translucent oxygen tetrahedron. |
| `hop-model.mjs` | Pure 1-TM divacancy geometry, coordination shells, path, triangular windows and timeline. |
| `battery.html`, `battery.css`, `battery.js` | Battery page, controls, selected composition/mode, reaction/graph/readout synchronization, continuous directional animation and explanations. |
| `battery-model.mjs` | Pure charge/discharge bookkeeping, route bounds, honeycomb geometry and graphite occupancy weights. |
| `battery-scene.mjs` | Shared actual Three.js cell/graphite objects; camera dive/return; damped bounded drag; dynamic component labels and selection. |
| `battery-teaser.js` | Purpose-composed clean homepage scene using the battery renderer with labels and interaction disabled. Fixed composition, short motion bursts, entire teaser is a normal link. |
| `visual-language.css` | Shared self-hosted Sora typography, transitions, reduced-motion rules and responsive refinements. Loaded after each page's CSS. |
| `navigation-motion.js` | Early `pagereveal` observer for actual native cross-document transitions. `data-navigation-motion` exposes observed status for QA. No navigation interception. |
| `diffusion.html`, `preview.css`, `preview.js`, `model.mjs` | Preserved standalone spherical-diffusion model preview. It is not the homepage hero. |
| `*-verification.mjs` | Meaningful model and controller checks. See below. |
| `assets/battery-three-r128.min.js` | Bundled Three.js r128, MIT. Both homepage and battery use it. |
| `assets/fonts/` | Self-hosted Sora variable TTF and SIL OFL license. |
| `references/` | Untouched user references, native paper image/PDF, scientific audit, current hero record and source checksums. |
| `context/space/` | Fifteen exported project/companion planning Pages, including original claim ledger and future roadmap. Historical status statements are annotated. |
| `evidence/` | Current screenshots, focused console check results and historical diffusion reference fixtures. |

There is no package.json, bundler, lockfile, node_modules or npm dependency needed. Node.js is used only to execute verification scripts. Existing CSS contains several successive override sections; inspect the cascade before changing it. That is maintenance debt, not a reason for a wholesale redesign.

## Current experience

**Homepage:** a broad materials-science library. On ordinary arrival the actual paper figure holds, focuses on one layered 1-TM glyph, aligns its Li/TM/vacancy actors, unfolds into ideal geometry, reveals oxygen coordination, then moves one Li along A→T→B. Approximate total duration: 19 seconds. Figure-to-motion scrub, pause/replay, direct spatial access, rotation/reset and species inspection are available. Reduced motion starts statically. The three Layered/Spinel/DRX columns are comparisons, never a time sequence.

The source is the native 1500×850 image extracted unchanged from PDF page 2, not a screenshot of a journal page. Zoom is capped at 0.95 CSS pixels per native pixel before mesh takeover. No AI enhancement or re-creation. The two headline connectors draw by their actual SVG path lengths; the active connector has a stronger stroke and arrowhead. Mobile uses a right-side route to avoid the text. The new battery feature contains real clean 3D geometry, no cropped module UI, screenshot collage, generated generic battery or labels.

**Battery:** graphite/oxide whole cell and graphite interior are implemented. Continuous markers show net selected direction at a fixed composition. They do not consume inventory or restart a finite discharge state. The slider independently chooses graphite x in [0.300,0.600]; oxide x is 1.20 minus graphite x on equal host amounts. Charge reverses direction, source/load, energy copy and active electrochemical roles without altering composition. Scene labels expose these roles; phones retain role plus polarity sign. Quiet Pause motion remains; prominent Play/Replay/speed UI is removed. Dive/return uses the same graphite geometry, not a separate unrelated illustration.

Anode means oxidation and cathode means reduction here. Graphite remains the negative electrode and oxide the positive electrode; roles swap on charging. Do not accidentally restore conventional discharge naming as if it were the active charging role.

**Other collection entries:** diffusion is a usable older model preview; impedance is a declared planned experience with a simple illustrative RC curve. They are not completed releases. The full original rocksalt visualizer is preserved as a reference and has not been rebuilt or fully validated.

## Scientific contract and provenance

Read `site/references/hop-scientific-audit.md` and `site/battery-notes.md` before scientific edits. They include primary source links, exact coordinates/equations and limits.

The hero uses one ideal cubic 1-TM divacancy environment: A=(0,0,0), B=(1,1,0), C=(1,0,1), D=(0,1,1), T=(0.5,0.5,0.5), in a/2 units. A/B have six O neighbors; T has four; the endpoint union contains 10 unique O. Endpoint octahedra share an edge, while T face-shares with each. C is a second vacancy and D is fixed TM. T is a hollow site, not a second Li atom. Timing and sizes are illustrative; no barrier, rate, exact saddle or universal percolation claim is made.

Graphite uses four finite aligned honeycomb sheets, 96 carbon positions and 132 bonds per sheet, 39 representative gallery sites. It does not solve real AB/AA registry transitions, staging or composition-dependent crystallography. Site opacity is a fractional population encoding linked to x, not an atomistically stoichiometric periodic supercell. Counterions, solvent, SEI, kinetic rates, voltage, capacity, heat, structural relaxation and actual particle trajectories are omitted.

Source figure: Hau et al., *Disordered Rocksalts as High-Energy and Earth-Abundant Li-Ion Cathodes*, Advanced Materials 37 (2025), 2502766, DOI https://doi.org/10.1002/adma.202502766. Author PDF: https://perssongroup.lbl.gov/papers/hau-2025_disordered_rocksalts.pdf. The paper states Creative Commons Attribution; keep attribution and mark geometry as an adaptation. The PDF is included. The supplied screenshot and original HTML are unchanged and checksummed. The original app's unsupported energy/barrier/threshold claims remain historical source material, not approved Fig.3D claims.

Three.js is r128 under MIT; see `site/assets/battery-three-LICENSE.txt`. Sora is under SIL Open Font License; see `site/assets/fonts/OFL-Sora.txt`, sourced from https://github.com/google/fonts/tree/main/ofl/sora. Other primary sources are linked in the two audit/model records. No new rights or trademark clearance is claimed. Generated editorial imagery and old module screenshots were rejected and are deliberately excluded from this package; none is a runtime dependency.

Human expert review is optional and never a release gate. Source traceability, explicit model assumptions, independent/invariant checks, critique and browser semantics still matter. AI agreement and these tests are not empirical validation or peer review.

## Focused verification actually performed

Run from the package root (Node installed):

```sh
node site/hop-verification.mjs
node site/hero-controller-verification.mjs
node site/battery-verification.mjs
node site/battery-controller-verification.mjs
```

- Hop geometry and 1,001 sequence fixtures pass: parity, 6/4 coordination, ten oxygens, shared triangular faces/edge, divacancy plane, endpoints and face crossings.
- Hero production controller with DOM/renderer fixtures passes autoplay, reduced-motion static start, explicit play, preference-change pause, end scrubbing and replay. This fixture does not exercise actual WebGL rendering or SVG path drawing.
- Battery model passes 2,002 mode/state cases, independent inventory/reaction equations, conservation, role/source/load reversal, path bounds and graphite ring/bond/gallery geometry. Maximum conservation residual 3.552713678800501e−15.
- Battery production controller with stub renderer passes fixed-composition continuous motion, direction reversal, slider coupling, mode-switch continuity, dive/return, reduced-motion static arrival and explicit Resume, preference-change/hidden-tab pause.
- Actual browser inspected at 1280×900 and 390×844. Phone document width is 390 (no horizontal page overflow). Current hero/source/teaser, cell and graphite screenshots are included.
- Actual charge toggle preserved 0.450/0.750 and swapped scene/side-panel roles and energy direction. Slider Home gave 0.300/0.900 with corresponding reactions. Continuous frames did not change readouts.
- Actual horizontal and vertical drags were visually checked against the front interlayer geometry/label; its projected movement followed the hand. Full pointer trajectories and a device matrix were not recorded.
- Actual graphite entry and return, keyboard Enter component selection and hero species/arrow-key inspection worked. Camera interpolation was visually inspected, not quantitatively timed.
- Actual cross-document navigation on battery→collection and teaser→battery emitted `running` then `finished` in `data-navigation-motion`. Browser back/forward and a broad cross-browser matrix remain untested in this final pass.
- SVG drawing was read from the actual browser: at progress 0.100 path length 263.301 and remaining dash 19.5038; at 0.120 remaining dash 0 and arrowhead present. This is browser-observed drawing state, not only CSS inspection. No video timing capture is included.
- No error-level browser logs were observed in final desktop/mobile review tabs.
- Earlier diffusion reference comparison passed against an independent 80-shell finite-volume calculation; largest absolute error 0.0001097. Historical fixture and script are preserved under `evidence/historical-diffusion/`. It compares saved samples, not freshly evaluated production output, and was not rerun as part of this last stabilization pass.

Actual command output and packaging checks are in `evidence/focused-checks.txt` and `evidence/package-integrity.json`. Claims above are bounded by their named fixture/browser scopes; they do not make the whole original rocksalt app release-verified.

## Known limitations and continuation priorities

1. Preserve the overall homepage. User said the rest of the front page was looking pretty great before these last arrow/teaser changes. They have not approved the final artifact. Judge the current connector character and clean teaser with design skill; do not restart the whole layout or regress to rejected screenshots/gradient blobs.
2. Review the complete 19-second source-to-mesh transition in real time on the receiving environment. Current screenshots document key states but cannot prove every frame, depth ordering or visual continuity. At small screens outer coordination context approaches scene edges; extreme user rotations and uncommon aspect ratios are not exhaustively checked.
3. Browser reduced-motion behavior was tested by controller media-query fixtures, not an actual OS preference/device sweep. GPU loss, WebGL unavailable behavior, keyboard traversal/screen reader semantics, zoom and contrast need full release-level accessibility review. Battery graceful degradation should be inspected if WebGL is unavailable; homepage has a static-source fallback.
4. Cross-document transitions depend on browser support. Back/forward restoration and engines other than the Codex Chromium-based review browser remain pending. No automated browser test harness or recorded video is shipped.
5. The preserved diffusion page's model notes still mention a previous hero; update that stale wording when continuing that entry. It is an older standalone preview, not the current homepage mechanism. Sora/shared navigation refinements apply to homepage and battery, not comprehensively to this older route.
6. Complete the formal source packet and claim ledger for each publishable visualization, mapping code/checks to claims. The exported Space ledger is historical and unverified; newer audit scope resolves only the local hop subset. Do not silently mark full rocksalt/spinel/percolation functionality as verified.
7. Broader rocksalt companion questions remain: spinel occupancy/lithiation state, random graph/channel definitions, physical-vs-teaching sliders, finite-size/seeding effects, global connectivity and unsupported source-app barriers. Follow the original companion backlog and current audit. No invented numerical scientific inputs.
8. Repository, deployment, domain/name checks, release report, corrections/contribution pages, a finished multi-entry library and future content are not established. Keep local until explicitly requested to publish.

## Context completeness and missing material

The portable Space export includes Home, Blueprint, Scientific Standard, Design System, Engineering, Backlog, Launch, Companions, Companion 001 and all six child records. It preserves broader audience, future content, possible architecture and release philosophy. Later user feedback overrides older course/lesson/curriculum framing: visible product language should be library, visualization or companion. Battery is an entry point, not the whole brand.

The source conversation link is recorded in these exports. The previously named `Fig3D-Project-Blueprint-No-Human-Review-Required.md`, `Fig3D-Launch-Pack-No-Human-Review-Required.zip` and distinct `rocksalt-li-pathways-improved.html` were not recovered as separate original bytes. The actual supplied `rocksalt-li-pathways (4).html` is included unchanged under its package reference name. Do not claim the distinct older downloads are present. No necessary runtime file is missing; these are historical context gaps.

Use the accompanying START_HERE and DESIGN_AND_PRODUCT_HANDOFF for the user's narrative priorities. Exports are evidence and planning history; they are not independent authorization to publish, contact people or run automations.
