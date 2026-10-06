"""Re-run Fig. 4 with the convention that reproduces the printed panels, compare, and export for the page.

Convention found by comparison (fig4_model.py): a 12 Å periodic cell (two 6 Å cells), minimum-image
distances, each ion pair counted once. Output: site/assets/fast-ion-diffusion/fig4-model.json
"""
import json, pathlib, numpy as np
from fig4_model import mep, phi, coulomb
ROOT = pathlib.Path(__file__).resolve().parents[3]
printed = json.load(open(ROOT / 'site/assets/fast-ion-diffusion/curves.json'))['panels']
MODE, HALF = 'mic', True
out = {'model': 'He, Zhu & Mo 2017, Methods eqs (6)-(8) and Fig. 4: four ions, two 6 Å cells, Ea = 0.6 eV',
       'convention': 'periodic 12 Å cell, minimum-image distances, each pair counted once (chosen because it reproduces Fig. 4c/4d; see comparison)',
       'reaction_coordinate': 'mean ion displacement (Å); every ion is relaxed at fixed mean displacement (constrained minimisation, equivalent to the MEP here)',
       'K': [], 'comparison': {}}
def run(K, land, n=31):
    start, p = mep(K, land, MODE, HALF, n)
    rows = []
    for s, e, x in p:
        rows.append({'s': round(s, 4), 'E': round(e, 5), 'x': [round(v, 4) for v in x], 'phi': [round(float(phi(np.array([v]), land)[0]), 5) for v in x], 'coulomb': round(coulomb(x, K, MODE) / 2, 5)})
    return rows
# comparison with printed 4c (K = 3)
for land, key in [('a', 'landscape_a'), ('b', 'landscape_b')]:
    rows = run(3.0, land, 61)
    s = np.array([r['s'] for r in rows]); E = np.array([r['E'] for r in rows])
    pts = np.array(printed['4c']['series'][key])
    err = np.abs(np.interp(pts[:, 0].clip(0, 3), s, E) - pts[:, 1])
    out['comparison']['4c_' + land] = {'max_abs_error_eV': round(float(err.max()), 4), 'rms_eV': round(float(np.sqrt((err ** 2).mean())), 4), 'model_barrier': round(float(E.max()), 4), 'printed_barrier': round(float(pts[:, 1].max()), 4)}
for land, key in [('a', 'landscape_a'), ('b', 'landscape_b')]:
    pts = printed['4d']['series'][key]
    errs = [abs(max(r['E'] for r in run(K, land, 31)) - b) for K, b in pts]
    out['comparison']['4d_' + land] = {'max_abs_error_eV': round(max(errs), 4)}
print(json.dumps(out['comparison'], indent=1))
for K in [round(k, 2) for k in np.arange(1.0, 7.01, 0.25)]:
    out['K'].append({'K': K, 'a': run(K, 'a', 25), 'b': run(K, 'b', 25)})
(ROOT / 'site/assets/fast-ion-diffusion/fig4-model.json').write_text(json.dumps(out, separators=(',', ':')))
