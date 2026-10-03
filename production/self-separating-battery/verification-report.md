# Verification — An interwoven battery

Local implementation, 3 October 2026. Branch: `codex/self-separating-battery`. No push or public deployment.

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
