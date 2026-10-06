"""Draw the registered model over the Fig. 3b inset: O anions (cyan rings), Li sites (labels) and 96h split sites."""
import sys, json, pathlib
import numpy as np
from PIL import Image, ImageDraw
from scipy.spatial.transform import Rotation
HERE = pathlib.Path(__file__).resolve().parent; sys.path.insert(0, str(HERE.parent))
from garnet import *
from fit_inset import walks, anions
F = json.load(open(HERE / 'fit-inset.json'))
cost, wi, v, n = F['results'][0]
w = walks()[wi]
P3 = anions(w); c3 = P3.mean(0); D = np.array(F['dots'])
R = Rotation.from_rotvec(v[:3]).as_matrix()
def proj(X):
    q = (np.asarray(X) - c3) @ R.T
    return np.c_[q[:, 0], -q[:, 1]] * v[3] + D.mean(0) + np.array(v[4:6])
im = Image.open(HERE / 'fig3b-inset.png').convert('RGB').resize((579 * 2, 265 * 2))
dr = ImageDraw.Draw(im)
for x, y in proj(P3) * 2: dr.ellipse([x - 14, y - 14, x + 14, y + 14], outline=(0, 160, 255), width=3)
sites = cart(np.array([p for _, p in w]))
for (k, _), (x, y) in zip(w, proj(sites) * 2):
    dr.ellipse([x - 5, y - 5, x + 5, y + 5], fill=(200, 0, 0)); dr.text((x + 8, y + 4), k, fill=(200, 0, 0))
im.save(HERE / 'fig3b-inset-overlay.png')
print('walk', ''.join(k for k, _ in w), 'scale px/Å', round(v[3], 2), 'rms px', round(np.sqrt(cost), 2))
print('site pixels', np.round(proj(sites), 1).tolist())
