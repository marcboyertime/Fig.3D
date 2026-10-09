# Production: Why some crystals let lithium fly

Source build for `site/anion-framework.html`, the companion to Wang et al., *Nature Materials* 14, 1026 (2015), doi:10.1038/nmat4369.

`sources/` holds the article and SI PDFs locally. They are not committed (`sources/.gitignore`); Marcky supplied them on 2026-10-08.

| Script | Output |
|---|---|
| `extract-figures.py` | `site/assets/anion-framework/figure-*.webp`, `figures.json` (clips and hashes) |
| `extract-curves.py` | `curves.json`: Fig. 2 and Fig. 3 points from the PDF's vector markers |
| `digitize-si.py` | `volume-paths.json`: full paths at every volume from SI Figs S4–S6, checked against Fig. 3 |
| `registration/fit-figure-2a.py` | `registration/figure-2a-fit.json`: perspective camera fitted to the ten sulfur spheres of the Fig. 2a render |
| `build-scene.py` | `scene.json`: ideal bcc/fcc/hcp blocks, sites, faces, paths and networks; LGPS (from `structures/`) matched to bcc; Li₂S |
| `verification/record-review.mjs` | Review videos on a virtual clock: `node record-review.mjs desktop|phone|opening out.mp4 [fps]` with `site/` served on :4173 |

Checks: `node site/anion-framework-verification.mjs`. Claims and their sources: `site/references/anion-framework/scientific-notes.md`.
