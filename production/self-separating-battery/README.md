# An interwoven battery

A local Fig.3D paper companion for Tait et al., arXiv:2604.26222v1, with the main emphasis on Figures 1 and 2.

## Run

From the repository root:

```sh
python3 -m http.server 8780 --bind 127.0.0.1 --directory site
```

Open `http://127.0.0.1:8780/self-separating-battery.html`.

No bundler, account, backend or external runtime request is needed. Three.js r128 and Sora are already vendored in the site. The collection link is in `site/index.html`.

## Experience

- **Opening (about 41 s, paced by reading time).** It starts on the native Figure 1, rests there long enough to read, then the printed cube of Figure 1c zooms to the size of the model and the live model takes its exact place: the page lies back in 3D under it while the camera turns to the working view. The model is then cut open and one material is isolated. Pause holds everything; Explore now, any drag, wheel, key or choice on the stage hands control over for good. Reduced motion skips straight to the model.
- **Paper colours.** Grey carbon, blue PAQEDOT, green SEI, red template and dark-blue precursor follow Figures 1c and 2.
- **Architecture, Fabrication, Interface.** Compare the layered stack with the interwoven network; isolate a material, cut into the volume or trace one connected network. Four fabrication stages each register to their own cube in Figure 2. Interface enlarges a carbon | SEI | PAQEDOT patch where Li⁺ crosses and electrons go around through the external circuit.
- **Figures in place.** The 3D model / Figure buttons switch the same stage. Returning from Figure 1 or 2 replays a short registration back onto the model. Camera, material, cut, advanced state and each figure's zoom and pan are kept. Escape returns to the model.

## Go deeper

- **Connections:** the 3D volume and the same section flattened beside it. Two carbon patches that look separate in the section are joined by a highlighted route that leaves the plane, found by a search through carbon samples only.
- **Length scales:** an ideal slab with fixed area and adjustable thickness L, with resistance ∝ L and diffusion time ∝ L² plotted and derived step by step.
- **Formation:** six states, each one row of data driving two linked views. The bench follows the Figure 5 and 6 insets (vial, liquid, external Li chip, carbon and polymer leads, instrument + and − terminals, cables to the leads actually used, device in or above the liquid). The magnified wall follows the Figure 2 inset (carbon | SEI | PAQEDOT backbone and pendants | pore) and shows what that step changes.
- **Evidence:** the original Figure 6b and 6c panels, unaltered, with marks at reported values (OCP above 3.5 V after 5 h; 120 mAh/g first discharge; third discharge 20.8% of 132 mAh/g, which is 22.9% of the first).

Each topic has a short reading accordion that builds from definitions to the paper's argument, and names its sources.

## Files

- `site/self-separating-battery-model.mjs`: pure state, display (model or Figure 1/2/5/6), registration anchors, opening schedule, phase intervals, captions, orbit and clipping.
- `site/self-separating-battery-scene.mjs`: renderer, lighting, camera, picking, phase meshes, cut caps, interface patch and transport markers.
- `site/self-separating-battery-emergence.mjs`: the figure-to-model registration and lift.
- `site/self-separating-battery-formation.mjs`: the Formation bench (3D) and magnified wall (SVG).
- `site/self-separating-battery-depth*.mjs`: Go deeper data, copy, 3D compositions, UI and checks.
- `site/self-separating-battery.js`: controller, opening, figure switching, labels and fallback. `window.figState` and `window.figPose` are read-only hooks used by the browser checks.
- `site/assets/self-separating-battery`: native figures, generated geometry and scalar field.
- `site/references/self-separating-battery/scientific-notes.md`: claim ledger with observation / derivation / illustration / proposal labels.
- `verification`: scientific, state, interaction, layout, performance and regression evidence.

## Regenerate and check

Install NumPy, SciPy and scikit-image in an isolated Python environment. The implementation was generated with NumPy 2.5.3, SciPy 1.18.1 and scikit-image 0.26.0. These are production-time tools, not browser dependencies.

```sh
python production/self-separating-battery/generate_geometry.py
python production/self-separating-battery/verify_geometry.py
python production/self-separating-battery/verify_depth_slices.py
node site/self-separating-battery-verification.mjs
node site/self-separating-battery-depth-verification.mjs
```

The browser checks (interaction, layout audit, prose-hidden captures) are in `verification/browser/` and run against a local server on port 4173 with Playwright and Chromium.

For native figure extraction, install pypdf and run `extract_figures.py` with the original PDF path. The exact input/output hashes are in the provenance packet. The supplied PDF remains external to the repository.

For the editable reference:

```sh
blender -b --factory-startup --python production/self-separating-battery/build_blender.py
```

The script uses Cycles / Metal on the available Mac and renders two 1200 × 900 compositions. Use CPU if Metal is unavailable. There is no generated movie replacing the live scene.

## Review boundaries

This is an illustrative geometry, not reconstructed microscopy or a transport/power calculation. Dominant phase connectivity is verified and small sampling components are documented. The SEI formation sequence represents the authors’ proposed interpretation. The experimental device's capacity fading and limited cyclability are preserved in the explanation.

No deployment or push is included. The source figures are under the arXiv non-exclusive distribution license, not CC BY; public reproduction rights have not been independently cleared. See scientific notes before publication.
