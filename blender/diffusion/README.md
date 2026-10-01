# Diffusion film

The looping film at the top of `site/diffusion.html`, made in Blender 5.0 (the `bpy` Python module, Cycles on CPU).

1. `python3 solve.py field.json` solves constant-D diffusion in a sphere while the surface concentration switches between 1 and 0 every half loop (Crank–Nicolson on u = r·c). It checks itself against the series solution used by `site/model.mjs` (max error ~5e-6) and keeps cycling until the loop is periodic, so the last frame joins the first.
2. `python3 scene.py field.json frames/ --size 960 --samples 16` builds the scene and renders 384 transparent PNG frames (16 s at 24 fps). The cut faces read the solved field from a data texture; the hairlines are the 20/40/60/80 % contours; each bead keeps a fixed rank and sits where the cumulative amount from the center reaches it, so the beads follow the field. About 14 s a frame on four CPU cores.
3. `sh encode.sh frames/ ../../site/assets/diffusion-film` composites onto the page color `#080a12` and writes the MP4 and WebM files plus the poster.
4. `python3 export_web.py field.json frames/anchors-0-384.json ../../site/assets/diffusion-film/film.json` writes the per-frame data the page uses for its captions, readouts, live profile and labels.

`pip install bpy` needs Python 3.11.
