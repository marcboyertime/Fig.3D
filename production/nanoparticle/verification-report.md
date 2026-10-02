# Inside a nanoparticle — verification report

Local review build, 2 October 2026. Updated locally for reading pace and source access. Branch `codex/nanoparticle-surfaces`, based on `c0cd7a4c55e607c7646b51bcf858ddd63b510b40`. No public deployment or dependency upgrade.

## Reading-time and source-view update

The opening now holds captions for 8–12 seconds and hands over at about 55 seconds. The persistent **View paper figure** button opens enlarged panels a/c plus a link to complete Figure 1. Browser checks confirmed that source viewing freezes an active opening, Escape restores focus and resumes it, an already paused opening stays paused, and an interior selection/cutaway/camera survives the round trip. The source modal fits a 390px viewport without horizontal overflow. See `verification/pacing-review.json` and `paper-viewer-*.jpg`.

The current pure-model and timing suite passes 286,795 assertions, including a reading budget of at most 180 words/minute plus an orientation second per caption. The original `opening-review.mp4` records the earlier 20-second version and is retained as historical visual evidence, not evidence of the current pacing.

## Delivered

One live Three.js scene with the paper-to-model opening, four directly accessible views, coordinate-derived atom selection, cutaways, shell comparison, adsorption geometry and published formation-energy context. The homepage gains a composed collection render. The existing static architecture, Sora font and navigation transitions are retained.

The editable [Blender scene](inside-a-nanoparticle.blend) contains opening, face, neighbors and binding compositions. [The generator](build_blender.py) reads the same exported coordinates as the scientific model; [README](README.md) gives reproduction commands. Four reference renders are in `renders/`. The [scientific notes](../../site/references/nanoparticle/scientific-notes.md) record provenance, assumptions, units, limitations and claim-to-source mappings.

## Checks completed

| Area | Evidence and result |
|---|---|
| Independent geometry | ASE 3.29.0 independently generated all eight sizes and distance-based neighbor lists. Every coordinate set and every atom's neighbor set matched. See `ase-verification.json`. |
| Pure scientific model and state | 286,776 assertions passed: counts, distances, symmetry, facet planes, coordination distributions, all adsorption-site geometries, FCC/HCP stacking, exact surface fractions, visibility invariance, and interaction state. See `verification/model-check.txt`. |
| Rotation | Independent projection checks cover horizontal, vertical and diagonal motion across 15 orientations. Actual browser drags tracked a selected near-surface landmark in both axes and diagonally, without changing selection. See `verification/screen-space-drag.json`. |
| Browser controls | All four views, face/edge/corner/interior shortcuts, keyboard camera movement, zoom/reset, rapid selections, interrupted moves, cutaway/restore, shell endpoints and hollow stacking were exercised. Selecting a new binding site now restores the hidden layers. |
| Size | 3 shells: 147 atoms, 62.6% surface. 10 shells: 3,871 atoms, 25.9% surface. Camera scale remained fixed; exact numerator/denominator remained available. See `verification/size-ui-check.json`. |
| Opening | Recorded the full approximately 20-second live sequence and handoff. Pausing then choosing Explore releases the camera correctly. The user can interrupt without restarting the sequence. See `verification/opening-review.mp4` and eight retained keyframes. |
| Responsive layout | Rendered at 390, 768, 1440 and 1920 CSS pixels, waiting for the actual canvas resize. No document overflow; captions use 17–19px. Screenshots and measurements are in `verification/layout-*.jpg` and `responsive-final.json`. |
| Reduced motion / fallback | The explicit reduced-motion entry skips automatic travel. Injected WebGL initialization failure retains an annotated coordinate-derived SVG and working scientific controls, including the 12-neighbor interior explanation. Camera controls are unavailable in this mode. |
| Navigation | Collection entry, browser back to `index.html#collection`, and forward to the module worked. See `verification/navigation.json`. |
| Existing regressions | Homepage controller, hop geometry/storyboard, battery model and battery controller checks passed. Their logs are retained in `verification/`. |

Browser review found and corrected paused-camera state, event bubbling from the view container, stale canvas painting after resize, visibility recovery after viewport changes, and retained stacking when switching adsorption positions. No module JavaScript errors were observed in the final exercised paths; the injected fallback intentionally emits a warning.

## Visual and performance evidence

The browser and Blender compositions were compared for silhouette, spatial landmarks, selected neighborhoods and stacking. The browser has brighter reflections than Cycles; neither is a quantitative gold optical simulation. Selection uses a ring and connectors as well as color; surface selection has a polygon outline. The adsorption marker is a diamond, visually distinct from the atoms. The first-party figure panels preserve their identities and scale bars.

On the available Apple M4 Pro desktop, the default particle's final neighbor transition showed about 120 fps requestAnimationFrame cadence at 1200 × 1000 and DPR 1, with 9.2ms input-to-render-submission feedback. A previous maximum-size run measured about 117 fps. These are observed browser scheduling/submission measurements, **not GPU-completion timings or a guarantee for other hardware**. See `verification/performance-final.json`.

The cold initial module dependency set is approximately **401 KB compressed**, including Three.js, Sora and both lossless source crops. This is a gzip estimate; the local Python server itself serves uncompressed text. The full source figure, production data and Blender files are deferred or outside the runtime. See `verification/asset-budget.json`.

## Remaining acceptance limits

- A physical phone, native touch/pointer cancellation, and the 30 fps phone target have not been verified. Responsive desktop emulation does not establish those results.
- Actual 200% browser zoom could not be controlled in the available in-app surface. Narrow reflow was tested; real browser zoom remains a manual check.
- The reduced-motion branch was exercised through `?motion=reduce`; an OS preference toggle and a screen-reader session remain untested.
- The visual affordances support comparing neighbors, terrace geometry and surface fractions. A learner test with the explanatory prose hidden, and independent expert review of the explanation, have **not** been performed. No learning-effectiveness claim is made.

Ready for local design and scientific review, with the above checks still required before treating every acceptance criterion as complete. “World class” remains a design standard to assess through that review, not a claim inferred from passing code tests.

## Preview

From the repository root: `python3 -m http.server 8780 --bind 127.0.0.1 --directory site`, then open `http://127.0.0.1:8780/nanoparticle.html`. Optional inspection URLs: `?motion=reduce` and `?fallback=1`.
