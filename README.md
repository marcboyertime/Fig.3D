# Fig.3D

A library of interactive scientific visualizations and paper companions for materials science.

The current prototype is a static site in `site/` (plain HTML/CSS/ES modules, bundled Three.js r128, no build step):

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory site
```

Then open `http://127.0.0.1:4173/`, `/battery.html` or `/diffusion.html`.

Focused checks (Node only):

```sh
node site/hop-verification.mjs
node site/hero-controller-verification.mjs
node site/battery-verification.mjs
node site/battery-controller-verification.mjs
```

Project context lives in `START_HERE.md`, `ENGINEERING_STATE.md`, `DESIGN_AND_PRODUCT_HANDOFF.md` and `context/`. Screenshots and check output from the handoff are in `evidence/`.

## Since the Codex handoff (30 September 2026)

The handoff documents describe the package as it arrived. Since then:

- `site/rocksalt.html` is a corrected, Fig.3D-styled working copy of the original rocksalt companion, and the collection links to it. The original under `site/references/` is unchanged. The corrections and slider readings are recorded in `context/space/Companion-001/Claim-Trace-2026-09-30.md`, and the percolation sweep is in `evidence/rocksalt-percolation/`.
- `site/diffusion.html` uses the dark collection design throughout, with calculated iso-concentration rings.
- The homepage serves `site/assets/hau-2025-figure-1.webp`, a lossless, pixel-identical copy of the source PNG (provenance is in the JSON beside it), and falls back to the PNG.
- axe-core reports no violations on any page at 1280px or 390px in headless Chromium. Real-device and non-Chromium checks are still pending.
