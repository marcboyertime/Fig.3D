# Inside a nanoparticle — production source

The website is `../../site/nanoparticle.html`. Serve `site/` over HTTP; it needs no build or runtime service.

## Reproduce

1. `node production/nanoparticle/export-model.mjs` writes coordinate datasets from the browser's pure model.
2. Install ASE 3.29.0 in a Python virtual environment, then `python production/nanoparticle/verify_ase.py`. This independently constructs every size and compares every coordinate and nearest-neighbor set.
3. `blender -b --factory-startup --python production/nanoparticle/build_blender.py` produces the editable `.blend` and four reference compositions. Tested with Blender 5.2.2, Cycles / Metal, 32 samples and denoising. Use CPU if Metal is unavailable.
4. `node site/nanoparticle-verification.mjs` checks geometry, site registry, state and screen-space rotation.

`inside-a-nanoparticle.blend` contains four named scenes: opening, face, neighbors, binding. Each has an editable orthographic camera and studio lights. Atom objects share one sphere mesh. Their custom properties preserve coordinate IDs, coordination and neighbor IDs. The scene does not calculate adsorption or particle dynamics.

The four renders are visual references, not frames replacing the browser explorer. The browser uses the same geometry with instanced meshes and different realtime lighting. The color and exposure can differ between Cycles/AgX and Three/ACES; compare depth, silhouette and spatial composition as well as color.

`geometry-*.json` is a generated validation/export artifact, not a browser payload. Each includes positions in a/2 units, stable IDs, actual neighbors, facets and adsorption geometry. Edit the JavaScript scientific model, then regenerate; do not edit coordinates manually in Blender to improve appearance.

The source-image preparation script performs only native-pixel, lossless panel cropping and records a SHA-256 plus crop coordinates. Original Figure 1 is retained in `site/references/nanoparticle/`.
