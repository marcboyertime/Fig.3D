# Fast ion diffusion companion: production

Source material and tools behind `site/fast-ion-diffusion.html`, a companion to He, Zhu & Mo, *Nat. Commun.* 8, 15893 (2017).

Scientific notes and the claim ledger are in `site/references/fast-ion-diffusion/scientific-notes.md`. Checks and their results are in `verification-report.md`.

| Path | What it is |
|---|---|
| `sources/` | The paper and SI PDFs as supplied (hashes in `source-manifest.json`) |
| `extract-figures.py` | Rasterises Figures 1–4 and the panel crops unchanged from the PDF, writes `figures.json` |
| `extract-curves.py` | Reads Fig. 3b, 3e, 4c and 4d markers from the PDF vectors, writes `curves.json` |
| `garnet.py` | Cubic LLZO (Ia-3d) Wyckoff orbits and helpers (ASE) |
| `registration/fit_inset.py` | Fits the channel to the 13 oxygens of the Fig. 3b inset (3.22 px RMS); `overlay.py` draws the check image |
| `export-scene.py` | Writes `llzo-scene.json`: channel sites, five ions, cages, ZrO₆, La, branch sites, whole cell, paper pose |
| `model/fig4_model.py`, `model/rerun.py` | Re-runs the paper's 1D model (Methods eqs 6–8) for K = 1–7 eV·Å, writes `fig4-model.json` |
| `render-card.mjs` | Renders the homepage card from the live model |
| `verification/browser-check.mjs` | 45 browser checks of every control, the opening, reduced motion, no-WebGL and phone layout |
| `verification/record-review.mjs` | Desktop and phone review videos on a virtual clock |

Rebuild (Python 3 with pymupdf, ase, spglib, scipy, Pillow):

```sh
python3 production/fast-ion-diffusion/extract-figures.py
python3 production/fast-ion-diffusion/extract-curves.py
python3 production/fast-ion-diffusion/registration/fit_inset.py
python3 production/fast-ion-diffusion/export-scene.py
python3 production/fast-ion-diffusion/model/rerun.py
node site/fast-ion-diffusion-verification.mjs
python3 -m http.server 4173 --directory site &   # then
node production/fast-ion-diffusion/verification/browser-check.mjs
```

Page addresses: `?intro` replays the first-visit opening, `?no-opening` skips it, `?reduced` forces reduced motion, `?no-webgl` shows the fallback. State can be set with `question`, `compare`, `framework`, `occupancy`, `context`, `landscape`, `K`, `progress`, `display` and `select=ion:3`.
