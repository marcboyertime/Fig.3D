"""Export the LLZO local environment and the five-ion event for the page.

Everything is in Å, centred on the channel, in the crystal's Cartesian frame. The camera pose that
reproduces the Fig. 3b inset (registration/fit-inset.json) is exported as `paperView`.
Output: site/assets/fast-ion-diffusion/llzo-scene.json
"""
import sys, json, pathlib
import numpy as np
from scipy.spatial.transform import Rotation
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE / 'registration'))
from garnet import *
from fit_inset import walks, anions
F = json.load(open(HERE / 'registration/fit-inset.json'))
cost, wi, v, nO = F['results'][0]
walk = walks()[wi]                        # T1 O1 T2 O2 T3 O3 (fractional, unwrapped)
P3 = anions(walk); c3 = P3.mean(0); D = np.array(F['dots'])
Rcam = Rotation.from_rotvec(v[:3]).as_matrix()
def to_inset(X):
    q = (np.asarray(X) - c3) @ Rcam.T
    return np.c_[q[:, 0], -q[:, 1]] * v[3] + D.mean(0) + np.array(v[4:6])

# Extend: O0 before T1 (the one whose projection lies up-left, where the first streak starts) and T4 after O3.
T1, O3 = walk[0][1], walk[-1][1]
idx, pos, dd = nearest(T1, G48G, 4)
cands = [p for p, d in zip(pos, dd) if d < 2.1 and np.linalg.norm((p - walk[1][1]) * A) > .1]
streak1_start = np.array([32.5, 142.5])   # white end of the first streak in the inset (px, native)
O0 = min(cands, key=lambda p: np.linalg.norm(to_inset(cart([p]))[0] - streak1_start))
idx, pos, dd = nearest(O3, T24D, 2)
T4 = [p for p, d in zip(pos, dd) if np.linalg.norm((p - walk[-2][1]) * A) > .1][0]
chain = [('O', O0)] + walk + [('T', T4)]
names = ['O0', 'T1', 'O1', 'T2', 'O2', 'T3', 'O3', 'T4']
C = cart(np.array([p for _, p in chain]))
centre = C.mean(0)

def split(i, toward):  # the 96h position inside O-site i that lies toward neighbouring T site `toward`
    g = chain[i][1]; ids, pos, dd = nearest(g, H96H, 2)
    t = cart([chain[toward][1]])[0]
    return cart([min(pos, key=lambda p: np.linalg.norm(cart([p])[0] - t))])[0]

# Five ions: every ion advances one site along the channel (He et al.: T-site Li hop into the
# neighbouring O sites while the O-site Li hop on into the next T sites). Starting sites and
# directions are read from the registered inset streaks (white = first NEB image).
H = {('O0', 'T1'): split(0, 1), ('O1', 'T1'): split(2, 1), ('O2', 'T3'): split(4, 5), ('O3', 'T3'): split(6, 5), ('O3', 'T4'): split(6, 7)}
site = {n: C[i] for i, n in enumerate(names)}
ions = [
 {'id': 1, 'from': 'O0', 'to': 'T1', 'start': H[('O0', 'T1')], 'end': site['T1']},
 {'id': 2, 'from': 'O1', 'to': 'T2', 'start': H[('O1', 'T1')], 'end': site['T2']},
 {'id': 3, 'from': 'T2', 'to': 'O2', 'start': site['T2'], 'end': H[('O2', 'T3')]},
 {'id': 4, 'from': 'T3', 'to': 'O3', 'start': site['T3'], 'end': H[('O3', 'T3')]},
 {'id': 5, 'from': 'O3', 'to': 'T4', 'start': H[('O3', 'T4')], 'end': site['T4']},
]
# checks: no Li–Li pair closer than the endpoint pairs during straight-line interpolation
s = np.linspace(0, 1, 201)
traj = np.array([[ion['start'] + (ion['end'] - ion['start']) * t for ion in ions] for t in s])
dmin = min(np.linalg.norm(traj[k, i] - traj[k, j]) for k in range(len(s)) for i in range(5) for j in range(i + 1, 5))
print('min Li–Li during interpolation', round(dmin, 3), 'Å; hop lengths', [round(float(np.linalg.norm(i['end'] - i['start'])), 3) for i in ions])

# Framework: anions coordinating every chain site; ZrO6 and La within reach of the channel.
def coord(i):
    k, p = chain[i]; ids, pos, dd = nearest(p, OX, 4 if k == 'T' else 6); return [cart([q])[0] for q in pos], dd
anion_pts, poly = [], []
def add(pt):
    for j, q in enumerate(anion_pts):
        if np.linalg.norm(q - pt) < .05: return j
    anion_pts.append(pt); return len(anion_pts) - 1
for i, (k, p) in enumerate(chain):
    pts, dd = coord(i); poly.append({'site': names[i], 'kind': k, 'anions': [add(q) for q in pts], 'distances': [round(float(x), 3) for x in dd]})
zr, la = [], []
for S, out, rad in [(ZR, zr, 5.2), (LA, la, 4.6)]:
    for f in S:
        for sh in np.array(np.meshgrid(*[[-1, 0, 1]] * 3)).reshape(3, -1).T:
            x = cart([f + sh + np.floor(chain[3][1])])[0]
            if np.min(np.linalg.norm(C - x, axis=1)) < rad and not any(np.linalg.norm(x - y) < .05 for y in out): out.append(x)
zr_oct = []
for x in zr:
    ids, pos, dd = nearest(x / A, OX, 6); zr_oct.append({'centre': x, 'anions': [add(cart([q])[0]) for q in pos]})
# La–O within 2.7 Å among the anions already present (La is drawn as a sphere only)
# Other Li sites that touch the channel (share a face with a chain site): markers only.
branch = []
for i, (k, p) in enumerate(chain):
    S, n = (G48G, 4) if k == 'T' else (T24D, 2)
    ids, pos, dd = nearest(p, S, n)
    for q in pos:
        x = cart([q])[0]
        if np.min(np.linalg.norm(C - x, axis=1)) > .1 and not any(np.linalg.norm(x - b['p']) < .05 for b in branch):
            branch.append({'kind': 'O' if k == 'T' else 'T', 'p': x})

# Whole conventional cell around the channel for the context view.
cf = np.array(chain[3][1])
def wrap(S): return cart((S - cf + .5) % 1 + cf - .5)
cell = {'a': A, 'origin': (cart([cf - .5])[0]), 'zr': wrap(ZR), 'la': wrap(LA), 'o': wrap(OX), 'T': wrap(T24D), 'O': wrap(G48G)}

from scipy.spatial import ConvexHull
def faces(ids):
    P = np.array([anion_pts[i] for i in ids]); h = ConvexHull(P); c = P.mean(0); out = []
    for t in h.simplices:
        a, b, d = P[t]; n = np.cross(b - a, d - a)
        if n @ (a - c) < 0: t = t[[0, 2, 1]]   # outward winding
        out.append([int(ids[k]) for k in t])
    return out
for q in poly: q['faces'] = faces(q['anions'])
for z in zr_oct: z['faces'] = faces(z['anions'])
def R(x): return np.round(np.asarray(x) - centre, 4).tolist()
quat = Rotation.from_matrix(Rcam).as_quat().tolist()
scene = {
 'source': 'Cubic LLZO (Ia-3d) rebuilt from Wyckoff positions; channel and viewpoint registered to the Fig. 3b inset of He, Zhu & Mo (2017)',
 'units': 'Å', 'a': A,
 'sites': [{'name': n, 'kind': k, 'p': R(C[i])} for i, (n, (k, _)) in enumerate(zip(names, chain))],
 'ions': [{'id': i['id'], 'from': i['from'], 'to': i['to'], 'start': R(i['start']), 'end': R(i['end'])} for i in ions],
 'anions': R(np.array(anion_pts)), 'polyhedra': poly,
 'zr': [{'p': R(z['centre']), 'anions': z['anions'], 'faces': z['faces']} for z in zr_oct], 'la': R(np.array(la)) if la else [],
 'branch': [{'kind': b['kind'], 'p': R(b['p'])} for b in branch],
 'cell': {'a': A, 'origin': R(cell['origin']), **{k: R(cell[k]) for k in ['zr', 'la', 'o', 'T', 'O']}},
 'paperView': {'quaternion_crystal_to_camera': quat, 'note': 'camera x right, y up = rows of the fitted rotation; orthographic', 'scale_px_per_A_in_inset': round(v[3], 3), 'rms_px': round(float(np.sqrt(cost)), 2), 'inset_px': [579, 265],
               'inset_centre_A': R(c3), 'inset_dots_centre_px': D.mean(0).round(2).tolist(), 'offset_px': np.round(v[4:6], 3).tolist()},
 'checks': {'min_li_li_A': round(float(dmin), 3)},
}
out = ROOT / 'site/assets/fast-ion-diffusion/llzo-scene.json'
out.write_text(json.dumps(scene, separators=(',', ':')))
print('anions', len(anion_pts), 'zr', len(zr), 'la', len(la), 'branch', len(branch), 'bytes', out.stat().st_size)
print('T–O-site distances:', [round(float(np.linalg.norm(C[i + 1] - C[i])), 3) for i in range(7)])
print('inset px of ion starts/ends', [(np.round(to_inset([i['start']])[0]).tolist(), np.round(to_inset([i['end']])[0]).tolist()) for i in ions])
