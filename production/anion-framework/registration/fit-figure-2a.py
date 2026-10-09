"""Fit the viewpoint of the printed Figure 2a render (bcc sulfur, T1 -> T2).

The ten sulfur sphere centres are found in site/assets/anion-framework/figure-2a-render.webp (402 x 284 px, a
native-resolution crop of the embedded render) and matched to an ideal bcc cell at 40 A^3 per S. An orthographic
camera (rotation, scale, offset) is fitted by least squares. Output: registration/figure-2a-fit.json, read by
build-scene.py. Run from the repository root.
"""
import json, numpy as np
from pathlib import Path
from PIL import Image
from scipy import ndimage, optimize
from scipy.spatial.transform import Rotation

ROOT = Path.cwd()
IMG = ROOT / 'site/assets/anion-framework/figure-2a-render.webp'
OUT = ROOT / 'production/anion-framework/registration/figure-2a-fit.json'
A = 80.0 ** (1 / 3)  # bcc conventional cell holds 2 S; 40 A^3 each

im = np.asarray(Image.open(IMG).convert('RGB')).astype(float)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
mask = (r > 170) & (g > 160) & (r - b > 45)
yy, xx = np.mgrid[-6:7, -6:7]
op = ndimage.binary_opening(mask, structure=(xx ** 2 + yy ** 2) <= 36)
lab, n = ndimage.label(op)
blobs = []
for i in range(1, n + 1):
    ys, xs = np.nonzero(lab == i)
    blobs.append((xs.mean(), ys.mean(), len(xs)))
assert len(blobs) == 10, blobs

# Crystal fractional coordinates of each printed sphere (right-hand cube; the far-left sphere is the body centre of the
# cube to its left). Assigned by position; the fit residual below confirms the assignment.
GUESS = {(0, 1, 1): (96, 25), (0, 0, 1): (195, 43), (1, 1, 1): (270, 20), (1, 0, 1): (380, 35),
         (0, 1, 0): (94, 228), (0, 0, 0): (193, 263), (1, 1, 0): (268, 208), (1, 0, 0): (376, 242),
         (.5, .5, .5): (236, 132), (-.5, .5, .5): (45, 147)}
pairs = []
for frac, (gx, gy) in GUESS.items():
    bx, by, area = min(blobs, key=lambda p: (p[0] - gx) ** 2 + (p[1] - gy) ** 2)
    pairs.append((frac, (bx, by), area))

def to_three(f):  # crystal a, b, c -> three.js x, -z, y (c axis up)
    a, b_, c = np.asarray(f, float) * A
    return np.array([a, c, -b_])

X = np.array([to_three(f) for f, _, _ in pairs])
P = np.array([p for _, p, _ in pairs])
# The sphere at (0,1,0) is half hidden behind the green polyhedra, so its visible centroid is biased: half weight.
W = np.array([.5 if f == (0, 1, 0) else 1.0 for f, _, _ in pairs])

PIVOT = X.mean(0)  # centroid of the ten spheres; the camera looks at it

def project(params, X):
    """Pinhole camera at distance D (A) from PIVOT. s is px per A at the pivot's depth; (tx, ty) is the pivot in px."""
    rot, s, tx, ty, D = Rotation.from_rotvec(params[:3]), params[3], params[4], params[5], params[6]
    cam = rot.apply(X - PIVOT)  # camera frame: x right, y up, z toward viewer
    k = s * D / (D - cam[:, 2])
    return np.c_[tx + k * cam[:, 0], ty - k * cam[:, 1]]

def resid(params):
    return ((project(params, X) - P) * W[:, None]).ravel()

def fit(fixed_D=None):
    best = None
    for seed in Rotation.random(64, random_state=2):
        for D in ([fixed_D] if fixed_D else [8, 15, 30]):
            p0 = np.r_[seed.as_rotvec(), 48, 200, 140, D]
            lo = [-np.inf] * 3 + [1, -np.inf, -np.inf, (fixed_D or 3) - (1e-6 if fixed_D else 0)]
            hi = [np.inf] * 3 + [500, np.inf, np.inf, fixed_D or 500]
            res = optimize.least_squares(resid, p0, bounds=(lo, hi))
            if best is None or res.cost < best.cost:
                best = res
    return best.x

# VESTA draws in perspective: an orthographic camera leaves 6.3 px rms (10.5 px worst) on the back spheres,
# a pinhole camera 1.4 px. The page therefore uses a perspective camera at the fitted distance.
ortho = fit(fixed_D=1e5)
p = fit()
err = np.hypot(*(project(p, X) - P).T)
err_ortho = np.hypot(*(project(ortho, X) - P).T)
rot = Rotation.from_rotvec(p[:3])
q = rot.as_quat()  # x, y, z, w: crystal (three.js frame) -> camera
axes = {k: rot.apply(to_three(v) / A).round(3).tolist() for k, v in {'a': (1, 0, 0), 'b': (0, 1, 0), 'c': (0, 0, 1)}.items()}

# Which face-sharing T sites sit where the printed T1 and T2 labels and green streak are.
tsites = {'(0,1/2,1/4)': (0, .5, .25), '(0,1/2,3/4)': (0, .5, .75), '(0,1/4,1/2)': (0, .25, .5), '(0,3/4,1/2)': (0, .75, .5)}
tproj = {k: project(p, np.array([to_three(v)]))[0].round(1).tolist() for k, v in tsites.items()}

out = {
    'image': 'site/assets/anion-framework/figure-2a-render.webp', 'image_px': [im.shape[1], im.shape[0]],
    'cell_A': A, 'volume_per_S_A3': 40.0,
    'quaternion_crystal_to_camera': q.tolist(), 'pivot_A': PIVOT.tolist(), 'camera_distance_A': p[6],
    'px_per_A_at_pivot': p[3], 'pivot_px': p[4:6].tolist(),
    'rms_px': float(np.sqrt((err ** 2).mean())), 'max_px': float(err.max()),
    'orthographic_rms_px': float(np.sqrt((err_ortho ** 2).mean())), 'orthographic_max_px': float(err_ortho.max()),
    'rms_A': float(np.sqrt((err ** 2).mean()) / p[3]),
    'per_sphere_px': {str(f): round(float(e), 2) for (f, _, _), e in zip(pairs, err)},
    'projected_axes_camera': axes, 'projected_T_sites_px': tproj,
}
OUT.write_text(json.dumps(out, indent=1))
print(json.dumps(out, indent=1))
