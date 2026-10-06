"""Find the garnet channel and viewpoint that reproduce the Fig. 3b inset of He, Zhu & Mo (2017).

The inset shows the coordinating O anions (yellow) of six consecutive Li sites T–O–T–O–T–O.
For every 6-site walk through the T/O network we take the union of its coordinating O atoms,
then fit an orthographic camera (rotation, scale, offset) so the projected O atoms land on the
13 yellow dots detected in the inset (chamfer distance, many random starts). The walk/pose with the
lowest residual is the registration used by the page.
"""
import sys, json, itertools, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.optimize import minimize
from scipy.spatial.transform import Rotation
HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from garnet import *

def dots(path):
    im = np.asarray(Image.open(path).convert('RGB')).astype(float)
    y = (im[..., 0] > 200) & (im[..., 1] > 180) & (im[..., 2] < 120)
    lab, n = ndimage.label(y)
    cs = ndimage.center_of_mass(y, lab, range(1, n + 1)); sz = ndimage.sum(y, lab, range(1, n + 1))
    return np.array([(c[1], c[0]) for c, s in zip(cs, sz) if s > 40]), im.shape

def walks():
    # start at T site 0; walk T->g->T->g->T->g ; enumerate turn choices (symmetry makes T0 general)
    t0 = T24D[0]
    out = []
    def rec(seq, cur, kind, depth):
        if depth == 6: out.append(seq); return
        S = G48G if kind == 'T' else T24D
        idx, pos, dd = nearest(cur, S, 4 if kind == 'T' else 2)
        for p, d in zip(pos, dd):
            if d > 2.1: continue
            if any(np.linalg.norm((p - q) * A) < .1 for _, q in seq): continue
            rec(seq + [('O' if kind == 'T' else 'T', p)], p, 'O' if kind == 'T' else 'T', depth + 1)
    rec([('T', t0)], t0, 'T', 1)
    return out

def anions(walk):
    pts = []
    for kind, p in walk:
        idx, pos, dd = nearest(p, OX, 4 if kind == 'T' else 6)
        for q in pos:
            if not any(np.linalg.norm((q - r) * A) < .1 for r in pts): pts.append(q)
    return cart(np.array(pts))

def fit(P3, D, starts=400, seed=0):
    rng = np.random.default_rng(seed)
    c3 = P3.mean(0); P = P3 - c3; dc = D.mean(0)
    def proj(v):
        R = Rotation.from_rotvec(v[:3]).as_matrix(); q = P @ R.T
        return np.c_[q[:, 0], -q[:, 1]] * v[3] + dc + v[4:6]
    def cost(v):
        Q = proj(v)
        d = np.linalg.norm(D[:, None] - Q[None], axis=2)
        return np.mean(np.min(d, axis=1) ** 2)
    best = None
    for k in range(starts):
        v0 = np.r_[Rotation.random(random_state=rng.integers(1e9)).as_rotvec(), 48, 0, 0]
        r = minimize(cost, v0, method='Powell', options={'maxiter': 4000, 'xtol': 1e-4, 'ftol': 1e-6})
        if best is None or r.fun < best.fun: best = r
    return best, proj

if __name__ == '__main__':
    D, shape = dots(sys.argv[1])
    results = []
    for wi, w in enumerate(walks()):
        P3 = anions(w)
        r, proj = fit(P3, D, starts=int(sys.argv[2]) if len(sys.argv) > 2 else 60, seed=wi)
        results.append((r.fun, wi, r.x.tolist(), len(P3)))
        print(wi, ''.join(k for k, _ in w), 'n_O', len(P3), 'rms px', round(np.sqrt(r.fun), 2), flush=True)
    results.sort()
    print('best', results[0][:2], 'rms', np.sqrt(results[0][0]))
    json.dump({'results': results, 'dots': D.tolist(), 'shape': shape[:2]}, open(HERE / 'fit-inset.json', 'w'))
