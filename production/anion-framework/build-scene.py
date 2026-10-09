"""Geometry for the anion-framework companion: site/assets/anion-framework/scene.json.

Everything here is exact geometry, not simulation output:
  * ideal bcc, fcc and hcp sulfur lattices at 40 A^3 per S (the paper's reference volume), with every tetrahedral (T)
    and octahedral (O) site in a display block, which sites share a face, and the paths of the paper's Figure 2;
  * Li10GeP2S12 (Kamaya et al. 2011, via pymatgen's test structure) and its sulfur sublattice matched to a bcc
    supercell (2 x 2 x 3 of a/2, a/2, c/3), reproducing the paper's Table S1 (R = 0.58 A);
  * Li2S (antifluorite, a = 5.76 A as in Table S1): an exact fcc sulfur lattice with every T site filled.
Coordinates are in angstroms in the three.js frame: x = crystal a, y = crystal c (up), z = -crystal b.
Run from the repository root.
"""
import itertools, json, math
from pathlib import Path
import numpy as np
from scipy import optimize
from scipy.optimize import linear_sum_assignment

ROOT = Path.cwd()
OUT = ROOT / 'site/assets/anion-framework/scene.json'
FIT = json.loads((ROOT / 'production/anion-framework/registration/figure-2a-fit.json').read_text())
V0 = 40.0

def three(v):  # crystal cartesian (a, b, c axes) -> three.js frame
    x, y, z = v
    return [x, z, -y]

def r3(v, n=4):
    return [round(float(x), n) for x in v]

def dedupe(points, tol=1e-3):
    out = []
    for p in points:
        if not any(np.linalg.norm(p - q) < tol for q in out):
            out.append(p)
    return out

def build_sites(S, sites_frac_cart, n_vert, cutoff):
    """For each candidate site, its n_vert nearest S (all inside the block) and the face-sharing links."""
    sites = []
    for kind, p in sites_frac_cart:
        d = np.linalg.norm(S - p, axis=1)
        idx = np.argsort(d)[:n_vert[kind]]
        if d[idx].max() > cutoff[kind]:
            continue  # a vertex lies outside the display block
        sites.append({'kind': kind, 'p': p, 'verts': sorted(int(i) for i in idx), 'r': float(d[idx].mean())})
    links = []
    for i, j in itertools.combinations(range(len(sites)), 2):
        shared = sorted(set(sites[i]['verts']) & set(sites[j]['verts']))
        if len(shared) == 3:
            kinds = ''.join(sorted(sites[i]['kind'] + sites[j]['kind'], reverse=True))  # 'TT', 'TO', 'OO'
            links.append({'a': i, 'b': j, 'face': shared, 'kind': kinds})
    return sites, links

def faces_of(verts, S):
    """Triangular faces of a convex polyhedron given its vertex indices (tetrahedron or octahedron)."""
    from scipy.spatial import ConvexHull
    P = S[verts]
    hull = ConvexHull(P)
    faces = []
    for simplex in hull.simplices:
        tri = [verts[k] for k in simplex]
        # orient outward
        a, b, c = S[tri]
        n = np.cross(b - a, c - a)
        if np.dot(n, a - P.mean(0)) < 0:
            tri = [tri[0], tri[2], tri[1]]
        faces.append([int(t) for t in tri])
    # an octahedron's hull is 8 triangles; coplanar splits do not occur for these regular shapes
    return faces

def doorway(S, face):
    c = S[face].mean(0)
    return float(np.linalg.norm(S[face] - c, axis=1).mean())

# ————— Ideal lattices —————
def bcc_block(n=(2, 2, 2)):
    a = (2 * V0) ** (1 / 3)
    pts = []
    for i, j, k in itertools.product(*(range(m + 1) for m in n)):
        pts.append(np.array([i, j, k], float) * a)
    for i, j, k in itertools.product(*(range(m) for m in n)):
        pts.append((np.array([i, j, k]) + .5) * a)
    S = np.array(pts)
    cand = []
    base = [(.5, .25, 0), (.5, .75, 0), (.25, .5, 0), (.75, .5, 0)]
    for i, j, k in itertools.product(*(range(m + 1) for m in n)):
        for f in base:
            for perm in [(0, 1, 2), (2, 0, 1), (1, 2, 0)]:
                v = np.array([f[perm.index(0)], f[perm.index(1)], f[perm.index(2)]])
                cand.append(('T', (np.array([i, j, k]) + v) * a))
    cand = [(k, p) for k, p in cand if np.all(p >= -1e-6) and np.all(p <= np.array(n) * a + 1e-6)]
    cand = dedupe_sites(cand)
    return a, S, cand, {'T': 4}, {'T': .56 * a + .01}

def dedupe_sites(cand):
    out = []
    for k, p in cand:
        if not any(k == k2 and np.linalg.norm(p - p2) < 1e-3 for k2, p2 in out):
            out.append((k, p))
    return out

def fcc_block(n=(2, 2, 2)):
    a = (4 * V0) ** (1 / 3)
    pts = []
    for i, j, k in itertools.product(*(range(2 * m + 1) for m in n)):
        if (i + j + k) % 2 == 0:
            pts.append(np.array([i, j, k], float) * a / 2)
    S = np.array(pts)
    cand = []
    for i, j, k in itertools.product(*(range(2 * m) for m in n)):
        cand.append(('T', (np.array([i, j, k]) + .5) * a / 2))
    for i, j, k in itertools.product(*(range(2 * m + 1) for m in n)):
        if (i + j + k) % 2 == 1:
            cand.append(('O', np.array([i, j, k], float) * a / 2))
    return a, S, cand, {'T': 4, 'O': 6}, {'T': math.sqrt(3) / 4 * a + .01, 'O': a / 2 + .01}

def hcp_block(n=(3, 3, 2)):
    a = (V0 * 4 / math.sqrt(3) / math.sqrt(8 / 3)) ** (1 / 3)  # ideal c/a; V per atom = sqrt(3)/4 a^2 c
    c = a * math.sqrt(8 / 3)
    a1, a2, a3 = np.array([a, 0, 0]), np.array([-a / 2, a * math.sqrt(3) / 2, 0]), np.array([0, 0, c])
    frac = lambda f: f[0] * a1 + f[1] * a2 + f[2] * a3
    pts, cand = [], []
    for i, j, k in itertools.product(range(-1, n[0] + 1), range(-1, n[1] + 1), range(0, n[2] + 1)):
        for f in [(0, 0, 0), (1 / 3, 2 / 3, .5)]:
            if k + f[2] <= n[2]:
                pts.append(frac((i + f[0], j + f[1], k + f[2])))
        for f in [(2 / 3, 1 / 3, .25), (2 / 3, 1 / 3, .75)]:
            cand.append(('O', frac((i + f[0], j + f[1], k + f[2]))))
        for f in [(0, 0, 3 / 8), (0, 0, 5 / 8), (1 / 3, 2 / 3, 1 / 8), (1 / 3, 2 / 3, 7 / 8)]:
            cand.append(('T', frac((i + f[0], j + f[1], k + f[2]))))
    S = np.array(pts)
    # keep a roughly round block in the a-b plane
    centre = frac((n[0] / 2 - .25, n[1] / 2 - .25, 0))[:2]
    keep = np.linalg.norm(S[:, :2] - centre, axis=1) < 1.45 * a * max(n[:2]) / 2
    S = S[keep]
    return (a, c), S, cand, {'T': 4, 'O': 6}, {'T': .613 * a + .01, 'O': .708 * a + .01}

def lattice(name):
    cell, S, cand, nv, cut = {'bcc': bcc_block, 'fcc': fcc_block, 'hcp': hcp_block}[name]()
    sites, links = build_sites(S, cand, nv, cut)
    return cell, S, sites, links

def nearest_site(sites, p, kind=None):
    return min((i for i, s in enumerate(sites) if kind is None or s['kind'] == kind), key=lambda i: np.linalg.norm(sites[i]['p'] - p))

def link_between(links, i, j):
    for l in links:
        if {l['a'], l['b']} == {i, j}:
            return l
    raise KeyError((i, j))

def path_through(S, sites, links, ids):
    """Polyline site -> shared-face centroid -> site ... The paper's NEB images run close to this line; the page
    interpolates along it, it is not the calculated path."""
    pts, faces = [sites[ids[0]]['p']], []
    for i, j in zip(ids, ids[1:]):
        l = link_between(links, i, j)
        faces.append(l['face'])
        pts += [S[l['face']].mean(0), sites[j]['p']]
    return pts, faces

out = {'source': 'production/anion-framework/build-scene.py', 'volume_per_S_A3': V0, 'lattices': {}}
for name in ['bcc', 'fcc', 'hcp']:
    cell, S, sites, links = lattice(name)
    centre = S.mean(0)
    if name == 'bcc':
        a = cell
        # The paper's T1 and T2 (Fig. 2a; registration/fit-figure-2a.py): (0,1/2,1/4) and (0,3/4,1/2) on the face x = 0
        # of the cube in its drawing. In this block that cube starts at x = a.
        o = np.array([a, 0, 0])
        t1, t2 = nearest_site(sites, o + np.array([0, .5, .25]) * a), nearest_site(sites, o + np.array([0, .75, .5]) * a)
        paths = {'TT': [t1, t2]}
    elif name == 'fcc':
        a = cell
        # O1 at the body centre of the first cube; T1, T2 two tetrahedra that each share a face with it and an edge
        # with each other, so the path bends at O1 as Figure 2b draws it.
        o1 = nearest_site(sites, np.array([.5, .5, .5]) * a, 'O')
        t1 = nearest_site(sites, np.array([.25, .25, .25]) * a, 'T')
        t2 = nearest_site(sites, np.array([.75, .25, .25]) * a, 'T')
        paths = {'TOT': [t1, o1, t2]}
    else:
        a, c = cell
        mid = S.mean(0)
        # T1 -> O1 -> T2 in the a-b plane, T1 -> T3 along c (face-sharing pair), O1 -> O2 along c (Figure 2c).
        Ts = [i for i, s in enumerate(sites) if s['kind'] == 'T']
        Os = [i for i, s in enumerate(sites) if s['kind'] == 'O']
        o1 = min((i for i in Os if abs(sites[i]['p'][2] - .25 * c) < .01), key=lambda i: np.linalg.norm(sites[i]['p'][:2] - mid[:2]))
        o2 = next(i for i in Os if np.linalg.norm(sites[i]['p'] - sites[o1]['p'] - np.array([0, 0, c / 2])) < .01)
        nb = [l for l in links if o1 in (l['a'], l['b']) and l['kind'] == 'TO']
        tn = [l['a'] if l['b'] == o1 else l['b'] for l in nb]
        same = [(i, j) for i, j in itertools.combinations(tn, 2) if abs(sites[i]['p'][2] - sites[j]['p'][2]) < .01 and sites[i]['p'][2] > sites[o1]['p'][2]]
        t1, t2 = same[0]
        t3 = next(l['a'] if l['b'] == t1 else l['b'] for l in links if t1 in (l['a'], l['b']) and l['kind'] == 'TT')
        paths = {'TOT': [t1, o1, t2], 'TT': [t1, t3], 'OO': [o1, o2]}
    P = {}
    for key, ids in paths.items():
        pts, faces = path_through(S, sites, links, ids)
        P[key] = {'sites': ids, 'points': [r3(three(p - centre)) for p in pts], 'faces': faces,
                  'doorway_A': [round(doorway(S, f), 3) for f in faces],
                  'length_A': round(float(sum(np.linalg.norm(q - p) for p, q in zip(pts, pts[1:]))), 3)}
    for s in sites:
        s['faces'] = faces_of(s['verts'], S)
    # Context links: which T sites can be reached from which without passing an O site, and how the network splits.
    T = [i for i, s in enumerate(sites) if s['kind'] == 'T']
    parent = {i: i for i in T}
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]; x = parent[x]
        return x
    for l in links:
        if l['kind'] == 'TT':
            parent[find(l['a'])] = find(l['b'])
    clusters = {}
    for i in T:
        clusters.setdefault(find(i), []).append(i)
    sizes = sorted((len(v) for v in clusters.values()), reverse=True)
    out['lattices'][name] = {
        'cell_A': r3(np.atleast_1d(cell)),
        'S': [r3(three(p - centre)) for p in S],
        'sites': [{'kind': s['kind'], 'p': r3(three(s['p'] - centre)), 'verts': s['verts'], 'faces': s['faces'],
                   'S_distance_A': round(s['r'], 3)} for s in sites],
        'links': links,
        'paths': P,
        'tt_clusters': sizes[:6], 'tt_cluster_count': len(sizes), 'T_count': len(T),
    }
    print(name, 'S', len(S), 'sites', len(sites), 'T', len(T), 'O', len(sites) - len(T), 'links', len(links),
          {k: (v['doorway_A'], v['length_A']) for k, v in P.items()}, 'TT clusters', sizes[:6], len(sizes))

# ————— Registered viewpoint of Figure 2a —————
bcc = out['lattices']['bcc']
a = (2 * V0) ** (1 / 3)
_, Sb, _, _, _ = bcc_block()
centre_bcc = Sb.mean(0)
# FIT's frame: right-hand cube at the origin, three.js axes. Our block: that cube starts at x = a (crystal a).
shift = three(np.array([a, 0, 0]) - centre_bcc)
out['paperView'] = {
    'figure': 'figure-2a-render', 'quaternion_crystal_to_camera': FIT['quaternion_crystal_to_camera'],
    'pivot_A': r3(np.array(FIT['pivot_A']) + np.array(shift)), 'camera_distance_A': FIT['camera_distance_A'],
    'px_per_A_at_pivot': FIT['px_per_A_at_pivot'], 'pivot_px': FIT['pivot_px'], 'image_px': FIT['image_px'],
    'rms_px': FIT['rms_px'], 'rms_A': FIT['rms_A'],
}

# ————— Li10GeP2S12 —————
lg = json.loads((ROOT / 'production/anion-framework/structures/Li10GeP2S12.pymatgen.json').read_text())
A_L, C_L = 8.69407, 12.5994
L = np.diag([A_L, A_L, C_L])
fr = lambda f: np.asarray(f) @ L
S_frac = np.array([s['abc'] for s in lg['sites'] if s['species'][0]['element'] == 'S']) % 1.0
bcc_small = np.diag([A_L / 2, A_L / 2, C_L / 3])
grid = np.array([(i + di, j + dj, k + dk) for i in range(2) for j in range(2) for k in range(3) for di, dj, dk in [(0, 0, 0), (.5, .5, .5)]])
B_frac0 = (grid @ bcc_small) @ np.linalg.inv(L)  # 24 bcc points in LGPS fractional coordinates

def pbc_d(fa, fb):
    d = fa[:, None, :] - fb[None, :, :]
    d -= np.round(d)
    return np.linalg.norm(d @ L, axis=2), d

def rms_for(shift):
    D, _ = pbc_d(S_frac, (B_frac0 + shift) % 1.0)
    r, c = linear_sum_assignment(D ** 2)
    return math.sqrt((D[r, c] ** 2).mean()), c

best = None
for sx, sy, sz in itertools.product(np.linspace(0, .5, 9), np.linspace(0, .5, 9), np.linspace(0, 1 / 3, 9)):
    res = optimize.minimize(lambda v: rms_for(v)[0], [sx, sy, sz], method='Nelder-Mead', options={'xatol': 1e-6, 'fatol': 1e-8})
    if best is None or res.fun < best.fun:
        best = res
R, assign = rms_for(best.x)
B_frac = (B_frac0 + best.x) % 1.0
print('LGPS bcc match R =', round(R, 3), 'A (paper Table S1: 0.58 A); shift', best.x.round(4))
# Display: one conventional cell, S atoms inside it (fractional 0..1). Each S moves to its own matched bcc point,
# taken as the image nearest to it.
D, dvec = pbc_d(S_frac, B_frac)
centre_L = fr([.5, .5, .5])
lg_S, lg_B, disp = [], [], []
for i, f in enumerate(S_frac):
    j = assign[i]
    d = -dvec[i, j]  # from S to its bcc point, minimum image
    p, q = fr(f), fr(f + d)
    lg_S.append(r3(three(p - centre_L))); lg_B.append(r3(three(q - centre_L))); disp.append(float(np.linalg.norm(q - p)))
# Periodic images of S near the cell faces so the PS4 / GeS4 tetrahedra on the boundary are complete.
def cation_tetra(f):
    d = S_frac[None, :, :] - np.asarray(f)[None, None, :]
    d = d[0]; d -= np.round(d)
    dist = np.linalg.norm(d @ L, axis=1)
    idx = np.argsort(dist)[:4]
    return [r3(three(fr(np.asarray(f) + d[k]) - centre_L)) for k in idx], float(dist[idx].mean())
tetra = []
for s in lg['sites']:
    el = [x['element'] for x in s['species']]
    if 'Li' in el:
        continue
    kind = 'GeP' if 'Ge' in el else 'P'
    verts, r = cation_tetra(s['abc'])
    tetra.append({'kind': kind, 'centre': r3(three(fr(s['abc']) - centre_L)), 'verts': verts, 'occ': {x['element']: x['occu'] for x in s['species']}})
# bcc T sites of the matched (tetragonal) lattice and how far each LGPS Li site is from the nearest one.
bT = []
for i, j, k in itertools.product(range(-1, 3), range(-1, 3), range(-1, 4)):
    for f in [(.5, .25, 0), (.5, .75, 0), (.25, .5, 0), (.75, .5, 0)]:
        for perm in [(0, 1, 2), (2, 0, 1), (1, 2, 0)]:
            v = np.array([f[perm.index(0)], f[perm.index(1)], f[perm.index(2)]])
            bT.append(((np.array([i, j, k]) + v) @ bcc_small) @ np.linalg.inv(L) + best.x)
bT = np.array(bT)
inside = np.all((bT > -1e-6) & (bT < 1 - 1e-6), axis=1)
bT = dedupe([p for p in bT[inside]])
li = []
for s in lg['sites']:
    if s['species'][0]['element'] != 'Li':
        continue
    f = np.asarray(s['abc'])
    d = np.array(bT) - f; d -= np.round(d)
    dist = np.linalg.norm(d @ L, axis=1)
    k = int(np.argmin(dist))
    li.append({'p': r3(three(fr(f) - centre_L)), 'occ': s['species'][0]['occu'], 'label': s.get('label', 'Li'),
               'to_bcc_T_A': round(float(dist[k]), 3), 'bcc_T': r3(three(fr(f + d[k]) - centre_L))})
dists = [x['to_bcc_T_A'] for x in li]
print('LGPS Li sites -> nearest bcc T site: min %.2f, median %.2f, max %.2f A' % (min(dists), float(np.median(dists)), max(dists)))
# bcc lattice edges (conventional cells of the matched supercell), drawn like the red lines of Figure 1a
B_all = np.array(lg_B)
edges = []
cellpts = {}
for i, j, k in itertools.product(range(3), range(3), range(4)):
    cellpts[(i, j, k)] = three(np.array([i, j, k]) @ bcc_small + best.x @ L - centre_L)
for (i, j, k), p in cellpts.items():
    for di, dj, dk in [(1, 0, 0), (0, 1, 0), (0, 0, 1)]:
        q = cellpts.get((i + di, j + dj, k + dk))
        if q is not None:
            edges.append([r3(p), r3(q)])
cell_box = []
corners = {(i, j, k): r3(three(fr([i, j, k]) - centre_L)) for i in (0, 1) for j in (0, 1) for k in (0, 1)}
for (i, j, k), p in corners.items():
    for di, dj, dk in [(1, 0, 0), (0, 1, 0), (0, 0, 1)]:
        q = corners.get((i + di, j + dj, k + dk))
        if q:
            cell_box.append([p, q])
bT_three = [r3(three(fr(p) - centre_L)) for p in bT]
# T-T face-sharing links of the matched lattice: in bcc every T site has four face-sharing T neighbours at a*sqrt(2)/4
tt = []
for i, j in itertools.combinations(range(len(bT_three)), 2):
    d = np.linalg.norm(np.array(bT_three[i]) - np.array(bT_three[j]))
    if d < .38 * A_L / 2 + .05:
        tt.append([i, j])
out['lgps'] = {
    'cell_A': [A_L, A_L, C_L], 'source': 'Kamaya et al., Nat. Mater. 10, 682 (2011), P4_2/nmc; pymatgen test structure',
    'match': {'bcc_cell_A': [A_L / 2, A_L / 2, C_L / 3], 'supercell': [2, 2, 3], 'R_A': round(R, 3), 'paper_R_A': .58,
              'max_displacement_A': round(max(disp), 3), 'shift_frac': r3(best.x)},
    'S': lg_S, 'S_bcc': lg_B, 'displacement_A': [round(x, 3) for x in disp], 'tetra': tetra, 'li': li,
    'bcc_edges': edges, 'cell_edges': cell_box, 'bcc_T': bT_three, 'bcc_TT': tt,
}
print('LGPS bcc T sites in cell', len(bT_three), 'TT links', len(tt))

# ————— Li2S (antifluorite) —————
a2 = 5.76
c2 = np.array([.5, .5, .5]) * a2
S2 = [np.array(f) * a2 for f in itertools.product([0, .5, 1], repeat=3) if (sum(int(2 * x) for x in f) % 2 == 0)]
Li2 = [(np.array(f) + .25) * a2 for f in itertools.product([0, .5], repeat=3)]
O2 = [np.array(f) * a2 for f in itertools.product([0, .5, 1], repeat=3) if (sum(int(2 * x) for x in f) % 2 == 1)]
out['li2s'] = {'cell_A': a2, 'volume_per_S_A3': a2 ** 3 / 4, 'S': [r3(three(p - c2)) for p in S2],
               'li': [r3(three(p - c2)) for p in Li2], 'O_empty': [r3(three(p - c2)) for p in O2]}
print('Li2S S', len(S2), 'Li', len(Li2), 'empty O', len(O2), 'V/S', round(a2 ** 3 / 4, 2))
OUT.write_text(json.dumps(out, separators=(',', ':')))
print('wrote', OUT, OUT.stat().st_size, 'bytes')
