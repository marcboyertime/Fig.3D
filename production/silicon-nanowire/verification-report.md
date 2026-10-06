# Verification report

## 2026-10-05 rebuild (Claude)

Executed: `node site/silicon-nanowire-verification.mjs` (adds Fig. 5a registration box within 4 native px, question presets and return) and `node site/silicon-nanowire-controller-verification.mjs` (rewritten for the new controller: truthful figure/model buttons, state preserved across figures, per-question figures and source panels, opening beats and hand-over, no-WebGL section). Both pass.

Browser: three rounds of virtual-clock stills in headless Chromium (SwiftShader) at 1512×982 and 390×844 (2×), covering the first-visit build-in, the opening, every question and stress stage, the three straight-on views, closed/open, play extremes and every figure. Review videos are recorded with `verification/browser/record-review.mjs`.

Continuous recording caught a freeze that the stills had missed. When the opening reached its section sweep, the opening's per-frame `setState` woke the render loop, and the frame then scheduled a second chain. The number of renders doubled every frame. `WireScene.frame` no longer schedules a frame when one is already pending. A headless rerun stepped frame by frame through the sweep to confirm the fix: each frame of the sweep now takes about 0.3 s to capture instead of doubling.

Not tested: Safari, Firefox, a real phone or touch hand-feel, real GPU frame rates, screen readers, browser zoom. Virtual-clock captures show authored timing only.

---

## Earlier report (Codex, first version)

# Verification report · 2026-10-05

## Delivery state

Implementation and collection integration are complete on `codex/silicon-nanowire`, based on `origin/main` at `defeef0`. Local preview: http://127.0.0.1:8790/silicon-nanowire.html. **Final visual acceptance is incomplete** because the browser connection stalled and subsequently the browser URL policy explicitly blocked access to the local preview. No workaround was used. Public deployment has not occurred.

## Scientific representation

Read the full main paper, its 18-page supporting methods and relevant original figure panels; inspected a frame of supporting Movie 010 and the public supplement inventory. The archive provides rendered movies rather than reusable nodal meshes/stress fields. The chosen implementation is an explicit schematic geometry reconstruction.

Verified the crystallographic axes from the native figures, distinguishing transverse σ11 from axial stress. The original S10b/d sections support the early/late stress signs. The FE final relative widths (2.62 and 1.14) set the final illustrative section extents; intermediate shapes, neck depth and progression are authored. Assigned diffusivity anisotropy and fitted chemical strain are explained as source modeling choices. Quantitative von Mises stress remains in the original source panel. Cracking is shown in the microscopy, never triggered by an invented threshold.

Full claim mapping and assumptions: `site/references/silicon-nanowire/scientific-notes.md`. No expert review or empirical model validation is claimed.

## Executed automated checks — PASS

- `silicon-nanowire-verification.mjs`: 3,131 progress/slice states; finite, centrally symmetric contours; pristine circle; final source-target extents; positive section area; core containment; ordered tapered front; right-handed orthogonal crystal directions; slice coordinates; source/model state preservation; range clamps; 30 screen-space orbit-direction cases.
- `silicon-nanowire-controller-verification.mjs`: real controller with fake DOM/renderer. Selected figure agrees with content; source comparison preserves progression and slice; play advances and pause stops; early/late returns remain coherent; von Mises and crack views show their corresponding original panels; x2 inspection direction; paper zoom ends the opening; no-WebGL section remains usable. This is not browser execution.
- Syntax checks for the controller, opening and renderer.
- Existing homepage and battery controller suites passed.
- Existing interwoven geometry and depth suites passed, including source-mapped processing, 41 independent slice fixtures and source/model state contracts.
- Existing nanoparticle suite: 286,795 assertions passed.
- Existing battery suite: 2,002 states passed with max conservation residual 3.56×10⁻¹⁵ (that bookkeeping claim belongs to the battery module, not the new wire).
- Existing rocksalt hop suite passed.

## Actual browser evidence acquired before the block

Codex in-app Chromium preview; desktop 1440×1000 and phone-sized 390px layout. Saved screenshots:

- `verification/browser/desktop-intermediate.jpg`: actual live quarter-cut wire, linked section and controls.
- `verification/browser/phone-intermediate.jpg`: actual recomposed narrow layout, wire above section and nearby slice control.
- `verification/browser/opening-paper.jpg`: original Figure 5 opening.

The paper lift was also inspected at an intermediate frame before the connection failed. Accessibility output confirmed that reduced entry selected the 3D model, the opening selected Figure 5, the page exposed labeled sliders and controls, and the initial rendered state was 48% progression / 40% slice.

Visual review caught a flat-looking half-cut, tiny section labels and overlapping narrow-layout labels. The design was revised to a quarter cutaway, larger section and separate phone scene/section areas. Later refinements—short mobile question names, pristine depth-ordering, source native-image packaging and the collection link—have automated/static checks but have **not** received a final browser screenshot pass.

## Additional inspected assets

Native source crack crop and S10d inset were visually inspected to confirm panel identities and axes. The Blender collection render was inspected, its initial clipped composition corrected, and the corrected full-wire composition inspected again. The editable scene and generator are supplied. It uses vertices exported from the same pure evaluator as the browser.

## Remaining visual acceptance work

When browser access is available, capture pristine, final dumbbell, moved slice, each field and both stress stages; inspect their captions and labels at actual size. Exercise rapid source returns, mid-transition interruption, pause/resume, close/open, all camera shortcuts, keyboard-only use, reduced motion and WebGL fallback. Repeat at 390, 768, 1440 and 1920 pixels and 200% browser zoom. Check the new homepage link and native return navigation.

Physical phone touch behavior, screen-reader usability, GPU timing, real frame rates and final page-transition continuity have not been measured. Mathematical drag-direction tests are evidence of the orbit convention, not a substitute for hand-feel testing. No claim of 60fps, comprehensive accessibility certification or completed world-class visual acceptance is made.
