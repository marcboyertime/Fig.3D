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
