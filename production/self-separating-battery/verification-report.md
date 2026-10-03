# Verification — An interwoven battery

Local implementation, 3 October 2026. Earlier sections describe the first Codex revisions; the latest section, “Redesign (3 October 2026, second revision)”, supersedes them where they differ.

## Scientific and geometric checks

- Native Figure 1 and Figure 2 JPEGs were extracted from the supplied PDF, preserving their embedded resolution, panel identities, chemistry drawings and scale bars. Provenance includes SHA256 hashes.
- The source ledger distinguishes the older ordered gyroid example from this paper’s nonperiodic architecture; proposed SEI formation from directly imaged growth; and topology from performance prediction.
- The shipped scalar field partitions into carbon, SEI, cathode and pore without overlapping or missing grid samples. The pre-SEI deposited coating occupies exactly the union of final SEI + cathode domains in the explanatory construction.
- Independently re-read all binary geometry, checked hashes, finite positions/normals, bounds, face indices, outward normal agreement and positive signed volumes.
- Dominant components of carbon, coating, cathode, SEI and pore span all three axes. Thin-layer sampling limits and tiny secondary components are documented explicitly; this is not a claim of exact microstructural reconstruction.
- Raw network paths span opposite faces through their own phase. Displayed paths are simplified/rounded only after scalar-field checks, then independently rechecked at a finer sampling step. Cutaway and visibility controls do not change the scientific field or path registry.
- State checks cover deposition before SEI, paper return, selection/reset state, reduced motion, 100 cut-face area partitions and 90 screen-space rotation cases.

Evidence: `verification/geometry-verification.json`, `geometry-check.txt`, `state-check.txt`, the source claim ledger and `geometry-check.json`.

## Browser interaction and layout

Tested in the available Codex Chromium browser:

- All architecture/material choices and four fabrication stage controls; optional stage geometry loads on demand.
- Cutaway endpoints, carbon/cathode route isolation, interface entry, ion motion pause/resume and explicit camera controls.
- Actual horizontal, vertical and diagonal pointer drags. A near-surface pore moved right with a rightward pointer drag; drag release did not select a material. The independent screen-space test covers additional yaw/elevation poses.
- Paper figure switching and close/Escape: camera yaw, selected phase and cut were preserved, and keyboard focus returned to the opening button.
- Opening pause held the source and caption while other review work continued. Explore and direct controls interrupt it. Opening captions are held for 10, 13 and 12 seconds; fabrication does not autoplay.
- Collection teaser → module navigation and browser back/forward were exercised; forward navigation was checked after the page settled.
- Keyboard rotation and ArrowRight tab navigation, plus native focusable tabs/controls. No page-level suppression of vertical touch scrolling; the canvas declares `pan-y pinch-zoom` and only locks horizontal touch drags.
- Actual CSS viewport widths of 390, 768, 1440 and 1920 px: no horizontal document overflow. Phone exploration keeps the 3D stage above the controls while scrolling. Desktop keeps the inspection area beside the scene.
- Forced WebGL fallback and the same reduced-motion initialization path via documented development query switches `?fallback` / `?reduced`. Source imagery and explanatory copy remain available.
- No JavaScript console errors during the tested controls.

Evidence includes `paper-return.json`, `pointer-drag.json`, `fabrication-controls.json`, `responsive.json`, and screenshots in `verification/`.

## Visual production and performance

- Two editable Blender reference scenes use the same generated buffers as the browser: assembled architecture and isolated carbon. The collection image is composed from this geometry, not clipped module UI.
- Fixed an incorrect mesh-normal orientation and a cloned clipping-plane reference during visual review. The final surfaces have smooth pore walls, sharp sample boundaries and correctly colored cut faces.
- The local interface animation measured approximately 120 frames/s, with a 9.3 ms 95th-percentile interval, at the observed 1920 × 1080 browser viewport. These are requestAnimationFrame intervals on the available desktop, not GPU timer measurements or a cross-device performance guarantee.
- Initial assets conservatively total about 1.90 MB when individually gzip-compressed, including both source figures, font and Three.js. The Python development server serves uncompressed bytes. Template and pre-SEI deposition meshes are deferred until first use.
- Rendering stops for hidden/offscreen scenes and settles to on-demand rendering when no motion is needed. Pixel ratio is capped at 1.7.

Evidence: `desktop-performance.json`, `asset-budget.json`, `renders/`, and `interwoven-battery.blend`.

## Existing-module regression checks

All passed:

- Homepage hero controller.
- Battery model and battery controller.
- Rocksalt hop geometry/storyboard.
- Nanoparticle geometry/state/interaction checks (286,795 assertions).

Reports are in `verification/*regression.txt`.

## Limits of this review

No physical phone/touch-device test, full screen-reader audit, measured 200% browser-zoom pass, independent human comprehension study or external scientific expert review was performed. Viewport tests do not substitute for those checks. The reduced-motion development query exercises the same initial state without changing the user’s OS preference.

The module explains geometry and intended transport roles. It does not calculate conductivity, physical trajectories, electrochemical kinetics, capacity, current or battery performance. The paper’s capacity-fading limitation is retained. Public reproduction rights for the original figures require separate consideration before deployment; the arXiv non-exclusive distribution license is not a Creative Commons reuse grant.

## Follow-up: in-place figures and Go deeper (3 October 2026)

The modal paper viewer is replaced by a persistent same-stage switch. Comparing figures leaves the renderer mounted, suspends its motion, and preserves camera/selection/cut. Each figure retains zoom and pan. Deliberate comparison ends the optional opening without resetting the camera. The advanced mode returns to the original overview pose and scientific state.

Added three advanced 3D compositions (linked volume/section, adjustable ionic slab, and processing/operating connections), a normalized scaling graph, accessible HTML evidence charts, and a sourced reading layer. Figures 5 and 6 are native extractions and appear contextually; they are not initial image requests.

Checks completed:

- All 41 slice masks and four-neighbor component counts match an independent SciPy reference generated from the shipped binary field. A synthetic detour fixture demonstrates separate 2D patches joined outside the plane.
- Resistance/diffusion scaling, capacity denominator arithmetic, repeated paper comparison and advanced-to-overview state preservation pass the new pure-model verification.
- Browser round trip through advanced topics and figures restored camera yaw 0.5080, elevation 0.3900, carbon selection and a 100% cut. Processing state and evidence selection survive paper comparison. Phone figure magnification (256%) and pan return exactly.
- Exercised all processing stages, slice endpoints, thickness extremes, evidence modes, Figure 1/2/5/6 switching, figure enlargement, Escape return, arrow-key topic navigation, and the fallback/reduced-motion paths.
- Existing interwoven model checks, homepage hero, battery controller, hop and nanoparticle regressions pass. No library upgrade or changes to their pages were required.
- Corrected narrow-desktop camera framing so the paired volume and section fit inside the stage; final evidence is `verification/depth-final.png`.
- Desktop and phone-sized browser layouts were inspected; actual tested widths and further evidence are saved in `verification/depth-browser.json` and screenshots. No new physical-phone, screen-reader or human-comprehension study is claimed.

The new mathematics is explicitly an ideal comparison, not a fit to this device. The evidence view is based on discrete reported values; it does not invent intermediate cycles or a voltage-time trace. The source ledger documents the distinction between observation, derivation and proposed mechanism.

## Follow-up: feedback-driven presentation corrections (3 October 2026)

The initial paper beat selects **Figure 1**; the automatic model reveal selects **3D model**. The same source selector controls manual comparison. The paper now lays back as the mounted live view rises from its panel anchor: 2.4 seconds during the opening, 1.4 seconds on manual returns. The model pose and scientific selection remain unchanged. Keyboard/drag input shortens the remaining presentation to 180 ms; selecting another figure cancels it immediately. Reduced motion switches directly, and the WebGL fallback truthfully labels itself **Static view**. Hidden/offscreen paper-lift animations pause.

The previously near-identical Form SEI and Prepare scenes were corrected after returning to the supplied PDF, pp.23–25. Five explicit views now show deposition, carbon-connected SEI treatment, polymer-connected reduction, charging with both device leads in electrolyte, and operation outside the bath. A pure process configuration drives lithium/bath/interphase visibility and circuit topology. The actual Three.js wire endpoints are tested, not just the captions. The short interphase reveal is an explanatory proposal, not a physical growth simulation.

A contextual **Build the explanation** link is visible beside the controls, names the opening reasoning topic, and focuses/scrolls to the reading section. The previous 70px gap is reduced to 24px, and the evidence stage is more compact. Mobile scrolling does not leave the sticky scene covering the reading destination.

Verification for this revision:

- Both interwoven verification scripts pass, including all 41 independent slice fixtures, 90 screen-space orbit cases, scalar cut invariants and five actual rendered processing circuits.
- Observed Figure 1 selected during the paused opening and automatic selection of the model after the source beat. Exercised manual comparison, rapid model→figure interruption, keyboard interruption, reduced motion, and WebGL fallback. No application console errors were reported.
- Measured unchanged paper-return pose: yaw 0.2800, elevation 0.1320 before/after. Processing selection remains intact.
- Captured the paper lift at multiple intermediate frames and inspected each processing configuration. Representative lift frames are retained; these were captured before shortening the manual duration, without changing the keyframe composition.
- Checked 390, 768, 1280, 1440 and 1920px layouts. Fixed a transient mobile overflow from labels retaining desktop positions during resize; clipped their container and clamped their measured widths. Rapid resize and keyboard rotation no longer caused horizontal overflow.
- At the inspected 1440×1000 evidence view, the reading entry began at y=612 and the reading section at y=766. The mobile reading link moved focus to the section, with the scene above the viewport.
- Source/scene transitions preserve live state and original image pixels; the CSS paper/canvas presentation is not a reconstruction of the specimen. This revision did not re-run a physical-phone performance benchmark, screen-reader study, 200% zoom audit or comprehension study. Prior review limits still apply.

Persistent instructions: `AGENTS.md` now points future agents to the living preferences section in `DESIGN_AND_PRODUCT_HANDOFF.md` and requires updating it with new feedback in the same session. No public deployment.

## Redesign (3 October 2026, second revision)

Branch `claude/project-thread-2hyatd`. Not merged or deployed. All browser evidence is headless Chromium 1440×1000 unless stated, with the SwiftShader software renderer; there was no GPU, Safari, Firefox, real phone or screen reader in this environment.

### Requested → implemented

| Requested | Implemented |
|---|---|
| Paper → feature → depth → live exploration, spatially coherent | The printed cube of Figure 1c is measured and the model is posed to match it; the figure zooms until that cube matches the model's box (capped at about 1.35× native pixels), hands over to the same pixels as a textured page inside the 3D scene, a front copy of the printed cube dissolves to reveal the shaded model in place, and the page tips back about the cube's base while the camera turns. Figure 2's four cubes register the same way for Fabrication. |
| Opening with reading time, pause, hand-over | Four beats timed at ≥ 15 characters per second (about 41 s). Pause holds the clock and the emergence. Any pointer, wheel or key input on the stage ends it, and it never resumes. |
| Truthful selection, state preserved | One `display` value drives the buttons and the stage. Model camera, material, cut, advanced topic/step and each figure's zoom and pan survive comparisons. |
| Paper palette, art direction | Materials take the paper's colours; neutral lighting; Sora; no cards or headline periods. Labels sit in the scene with leaders where needed. |
| Formation shows the circuit | Six states (Deposit, Form SEI, Plate & strip, Reduce polymer, Charge, Operate). A bench with vial, liquid, Li chip, both device leads, instrument terminals and cables to the leads in use, plus a magnified wall showing SEI, plating, de-doping, filled or emptied pendants and anion return. The device is raised above the liquid in Operate. |
| Go deeper builds from basics | Connections (volume + flattened section + joining route), Length scales (ideal slab, R ∝ L, t ∝ L²), Formation, Evidence (original Figure 6 panels with marks). Each has a reading accordion with sources. |
| Science labelled | Claim ledger in `site/references/self-separating-battery/scientific-notes.md`, section “Redesign — claim mapping”. |

### Verified

- `node site/self-separating-battery-verification.mjs`: deposition→SEI order, cut invariance, figure/model display truth and exact return, registration anchors per state, opening beats ≥ reading time, hand-over not retaken, reduced motion, 90 screen-space drag cases, 100 cut-face partitions. **Pass.**
- `node site/self-separating-battery-depth-verification.mjs`: 41 slices against SciPy fixtures; in 30 slices the joining route steps only through 6-neighbour carbon, leaves the plane and lands on the other patch; six Formation rows; the cables actually built in Three.js join the named terminal and lead; external Li only in half-cell steps; device immersed until Operate. **Pass.**
- Regressions: hop, hero controller, battery, battery controller, nanoparticle. **All pass**; those pages' files are unchanged.
- Browser interaction suite (`verification/browser/interaction.mjs`, log `interaction.log`), 27 checks, **all pass**: the selected button matched the visible content in 60 samples across the opening; pause holds; a drag at 3 s, 12 s and 17 s into the opening hands over and is not taken back; dragging right decreases yaw; elevation stops at ±1.08; arrow keys rotate and move tabs; click (without drag) isolates a material; reset; Figure 2 keeps its zoom after visiting Figure 1; cut, material, view, yaw, elevation and zoom return exactly; Formation step survives Figure 5; leaving Go deeper restores the overview and camera; Escape returns; 18 rapid display switches settle on the last choice with no leftover transition; selection stays truthful through a Figure 2 → model emergence; reduced-motion preference; renderer fallback keeps figures and all Go deeper text.
- Layout audit (`verification/browser/layout.mjs`) at 390×844, 600×900, 768×1024, 1440×1000 and 1920×1080 across 25 states each: no label collisions, no labels outside the stage or under the magnified wall, no horizontal overflow. 200% zoom was approximated as a 720×500 CSS viewport at device scale 2 and inspected visually.
- Prose-hidden pass: stage captures with all explanatory text hidden (`verification/browser/prose-hidden.jpg`). Judged by the author, not by independent readers. It led to a carrier key (Li⁺ ion, Electron) in the Interface and Length views, because the moving dots were otherwise unnamed without the caption.
- Bugs found and fixed by these checks: a second figure-to-model return crashed (a field shadowed the texture loader), Escape only worked with focus inside the figure, a drag during the zoom phase of the opening did not reach the stage, phone Formation hid the bench under the magnified wall, and several label overlaps.

### Performance

Frame intervals in SwiftShader are not representative of a GPU: idle frames are 16.7 ms, but a full WebGL redraw at 1440 px costs roughly 0.6–1.2 s on this CPU, so emergences run slower in wall-clock time here. The emergence clock caps each step at 250 ms so motion never jumps. Review videos were therefore recorded on a virtual clock (the page's `requestAnimationFrame` and `performance.now` stepped at 1/24 s per captured frame), which shows motion at its authored speed. GPU frame rates on real devices were **not measured**.

### Not verified

Safari, Firefox, physical phones and touch gestures (vertical touch scrolling is implemented by releasing vertical touch drags to the page but was not exercised with a real finger), screen readers, real browser zoom, GPU performance, and comprehension by independent readers. Public reproduction rights for the original figures remain as stated above.
