"""Regenerate independent four-neighbor slice fixtures with NumPy/SciPy.
Run from any directory. The JS verification compares all results independently.
"""
from pathlib import Path
import json
import numpy as np
from scipy.ndimage import label
root = Path(__file__).resolve().parents[2]
assets = root / 'site/assets/self-separating-battery'
meta = json.loads((assets / 'geometry.json').read_text())
field = np.fromfile(assets / 'field.bin', dtype='<f4').reshape((meta['n'],) * 3)
checks = []
for k in range(meta['n']):
    mask = field[:, :, k] <= 0
    _, count = label(mask)
    checks.append(dict(slice=k, components=int(count), occupied=int(mask.sum()), samples=int(mask.size)))
output = Path(__file__).parent / 'verification/depth-slice-reference.json'
output.write_text(json.dumps(dict(method='Independent scipy.ndimage.label, 2D four-neighbor connectivity; little-endian field reread from disk', checks=checks), indent=2) + '\n')
print(f'Wrote {len(checks)} independently labeled slices to {output}')
