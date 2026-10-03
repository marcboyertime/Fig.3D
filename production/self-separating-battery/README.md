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

- The optional 35-second opening starts on the native Figure 1, concentrates on its right-hand architecture, then reveals the 3D model and cuts it open. Captions hold for 10, 13 and 12 seconds. Explore, selection or dragging interrupts the sequence. Pause and the source viewer suspend its clock.
- Architecture compares a layered stack with the nonperiodic network. Isolate phases, change the cut depth or reveal a checked route inside an electrode network.
- Fabrication keeps four directly selectable stages: Template, Carbon, Coating and Separation. It does not advance while the reader is inspecting the text.
- Interface enlarges a local carbon–SEI–polymer patch. One labeled Li⁺ marker traverses the interphase; smaller electron markers remain in their electrode layers. Motion is illustrative.
- Both paper figures are always accessible. Closing the viewer preserves camera, material selection and cut. Full-resolution originals have separate image links.
- Phone layouts keep the scene visible while the reader uses its controls. Horizontal touch gestures rotate; vertical gestures retain page scrolling. Keyboard and explicit camera buttons are provided.

## Files

- `site/self-separating-battery-model.mjs`: pure state, phase intervals, captions, orbit convention and cross-section clipping.
- `site/self-separating-battery-scene.mjs`: renderer, lighting, camera, picking, phase meshes, cut caps and illustrative transport.
- `site/self-separating-battery.js`: controller, reading-paced opening, controls, paper dialog and reduced-motion handling.
- `site/assets/self-separating-battery`: native figures, generated geometry, scalar field and the composed collection image.
- `site/references/self-separating-battery/scientific-notes.md`: claim ledger, chemistry context, mathematical assumptions, topology limits and image rights.
- `interwoven-battery.blend`: editable Blender 5.2 reference studio; the same generated mesh buffers supply Blender and the browser.
- `renders`: architecture and carbon-scaffold reference compositions. The collection image comes from the architecture render, not a screenshot of controls.
- `verification`: scientific, state, interaction, layout, performance and regression evidence.

## Regenerate and check

Install NumPy, SciPy and scikit-image in an isolated Python environment. The implementation was generated with NumPy 2.5.3, SciPy 1.18.1 and scikit-image 0.26.0. These are production-time tools, not browser dependencies.

```sh
python production/self-separating-battery/generate_geometry.py
python production/self-separating-battery/verify_geometry.py
node site/self-separating-battery-verification.mjs
```

For native figure extraction, install pypdf and run `extract_figures.py` with the original PDF path. The exact input/output hashes are in the provenance packet. The supplied PDF remains external to the repository.

For the editable reference:

```sh
blender -b --factory-startup --python production/self-separating-battery/build_blender.py
```

The script uses Cycles / Metal on the available Mac and renders two 1200 × 900 compositions. Use CPU if Metal is unavailable. There is no generated movie replacing the live scene.

## Review boundaries

This is an illustrative geometry, not reconstructed microscopy or a transport/power calculation. Dominant phase connectivity is verified and small sampling components are documented. The SEI formation sequence represents the authors’ proposed interpretation. The experimental device's capacity fading and limited cyclability are preserved in the explanation.

No deployment or push is included. The source figures are under the arXiv non-exclusive distribution license, not CC BY; public reproduction rights have not been independently cleared. See scientific notes before publication.
