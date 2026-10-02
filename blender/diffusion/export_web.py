"""Write the small data file the page uses to stay in step with the film.

    python3 export_web.py field.json anchors-0-384.json ../../site/assets/diffusion-film/film.json

Per film frame: concentration at 41 radii (for the live profile), surface
value, average fill, and where the centre and a surface point land on screen
(x, y as fractions of the frame, y from the top) for the hairline labels.
"""
import json, sys
import numpy as np

field, anchors, out = sys.argv[1:4]
f = json.load(open(field)); a = json.load(open(anchors))['anchors']
c = np.array(f['c']); xs = np.linspace(0, 1, c.shape[1]); xw = np.linspace(0, 1, 41)
web = {
    'fps': f['fps'], 'frames': f['frames'], 'half': f['half'], 'tauHalf': f['tauHalf'],
    'c': [[round(float(v), 3) for v in np.interp(xw, xs, row)] for row in c],
    'surface': [round(v, 3) for v in f['surface']],
    'fill': [round(v, 3) for v in f['fill']],
    'anchors': {k: [[round(p[k][0], 4), round(1 - p[k][1], 4)] for p in a] for k in ('centre', 'surface')},
}
json.dump(web, open(out, 'w'), separators=(',', ':'))
print(out, len(json.dumps(web, separators=(',', ':'))) // 1024, 'KB')
