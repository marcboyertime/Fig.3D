# Liu 2011 · silicon nanowire companion

The browser module is `site/silicon-nanowire.html`, linked from the homepage collection. It uses the existing static ES-module stack, Sora and isolated Three.js r128 dependency. No new browser dependencies or build step.

## Run

From the repository root:

```sh
python3 -m http.server 8790 --bind 127.0.0.1 --directory site
```

Open http://127.0.0.1:8790/silicon-nanowire.html. `?reduced` exercises the static-entry path and `?no-webgl` exercises the fallback. The CSS media query and live preference listener also honor the actual OS reduced-motion preference.

## Files and boundaries

- `silicon-nanowire-model.mjs`: deterministic schematic geometry and state reducer.
- `silicon-nanowire-scene.mjs`: state-driven rendering. Displayed values ease toward the requested state every frame; the lid (upper half, as in Fig. 5b) and the main body index the same vertex buffers, so there is no clipping and no seam. Geometry is generated, not an imported decorative model.
- `silicon-nanowire-opening.mjs`: original Figure 5 zooms until panel a's printed wire sits exactly on the model at the fitted pose, the same pixels hand over to WebGL, panel a dissolves to reveal the model and the page tips away.
- `registration/fit-panel-a.py`: silhouette fit of the model to the printed wire of Fig. 5a (pose, scale, origin and length; IoU 0.905), with `panel-a-overlay.png` (red = print, green = model).
- `silicon-nanowire.js`: one state shared by the wire, section, captions, controls and original figures.
- `site/references/silicon-nanowire/scientific-notes.md`: claim ledger and bounded model specification.
- `sources/`: archived PDFs and public supplement inventory. Rendered-page PNGs/text are local extraction intermediates and ignored by Git.
- `verification-report.md`: executed checks, evidence and explicit unfinished browser acceptance.

## Reproduce assets

Install PyMuPDF and Pillow in a temporary Python environment. Run `python production/silicon-nanowire/extract-figures.py`. The original embedded image bytes and source PDFs have SHA-256 hashes in `source-manifest.json`. Crops preserve panel identities; full figures retain all scales and axes.

The collection card is rendered from the live WebGL model: `node production/silicon-nanowire/render-card.mjs` (server on :4173), then convert `card-2x.png` to 1200×900 WebP at quality 92. The older Blender route below used the first version's geometry and palette and is kept for reference:

```sh
node production/silicon-nanowire/export-geometry.mjs
/Applications/Blender.app/Contents/MacOS/Blender --background --python production/silicon-nanowire/render-teaser.py
```

Convert `teaser.png` to `site/assets/silicon-nanowire/collection.webp` with Pillow at quality 92. An editable `silicon-nanowire.blend` is included. This is editorial artwork, not evidence that the WebGL renderer or browser interactions were verified.

## Model checks

```sh
node site/silicon-nanowire-verification.mjs
node site/silicon-nanowire-controller-verification.mjs
```

The first verifies geometry and mathematical orbit behavior; the second runs the real controller against a small fake DOM and renderer. Neither replaces browser inspection, proves physical kinetics or validates a stress solver. The explorer does not claim those calculations.

## Browser review

`verification/browser/tour.mjs <w> <h> <prefix> [dpr]` captures every state on a virtual clock (rAF, `performance.now` and CSS animations are stepped). `verification/browser/record-review.mjs desktop|phone out.mp4` records review videos at authored speed. Both need a server on :4173 serving `site/`. Headless SwiftShader is slow: a stills tour takes 10–20 minutes, a video about a second per frame.
