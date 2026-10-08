"""Read the minimum-energy paths of Supplementary Figures S4-S6 (bcc, fcc, hcp at seven volumes per S).

The SI figures are raster images (matplotlib output embedded in the PDF), so the points are found by colour:
each volume has its own exact line/marker colour (legend). Lines are 1-2 px wide and the markers are discs
about 12 px across, so a morphological opening removes the lines and leaves the markers. A marker hidden
under another is filled in from its mirror image across the middle of the path (every path is symmetric:
it runs between two equivalent sites), and the end points are 0 eV by definition (the figures' zero).
Checks: each curve's highest point is compared with the vector markers of main-text Figure 3.
Output: site/assets/anion-framework/volume-paths.json
Run: python3 production/anion-framework/digitize-si.py   (needs PyMuPDF, numpy, scipy, Pillow)
"""
import io, json, pathlib
import numpy as np, pymupdf as fitz
from PIL import Image
from scipy import ndimage
ROOT = pathlib.Path(__file__).resolve().parents[2]
SI = ROOT / 'production/anion-framework/sources/wang-2015-si.pdf'
OUT = ROOT / 'site/assets/anion-framework/volume-paths.json'
VOLUMES = [28.5, 34.0, 40.0, 46.6, 54.0, 62.1, 70.8]
COLOURS = [(255, 0, 0), (213, 43, 0), (170, 85, 0), (128, 128, 0), (85, 170, 0), (42, 213, 0), (0, 255, 0)]
doc = fitz.open(SI)
def image(page, xref):
    pix = fitz.Pixmap(doc, xref)
    if pix.alpha: pix = fitz.Pixmap(pix, 0)
    if pix.n > 3: pix = fitz.Pixmap(fitz.csRGB, pix)
    return np.asarray(Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGB')).astype(int)
# panel: (page index, xref, frame x0, x1, y0(top), y1(bottom), x range, y range, volumes shown)
PANELS = {
 'bcc_TT':  (6, 62, 135.5, 832.5, 29.5, 494.5, (1, 9), (.8, -.4), 7, 'Figure S4'),
 'fcc_TOT': (7, 74, 135.5, 832.5, 29.5, 494.5, (1, 17), (.8, -.4), 7, 'Figure S5'),
 'hcp_TOT': (8, 86, 87, 535, 19, 318, (1, 17), (.8, -.4), 7, 'Figure S6a'),
 'hcp_TT':  (8, 88, None, 532, 19, 316.5, (1, 9), (.8, -.4), 7, 'Figure S6b'),
 'hcp_OO':  (8, 90, 110.5, 808.5, 29.5, 494.5, (1, 9), (1.2, 0.0), 3, 'Figure S6c'),
}
result = {'source': 'Wang et al., Nat. Mater. 14, 1026 (2015), Supplementary Figures S4-S6, read by colour from the embedded raster images',
          'volumes_A3': VOLUMES, 'paths': {}}
def discs(r):
    yy, xx = np.mgrid[-r:r + 1, -r:r + 1]; return (xx ** 2 + yy ** 2) <= r * r
for key, (page, xref, x0, x1, y0, y1, (n0, n1), (top, bottom), nv, label) in PANELS.items():
    a = image(page, xref)
    small = a.shape[1] < 700          # S6a and S6b are embedded at a smaller size: markers about 8 px across
    disc, full, least = (discs(2), 34, 10) if small else (discs(3), 60, 20)
    if x0 is None:  # left frame edge hidden behind markers: find the dark column nearest the y axis labels
        dark = (a.sum(2) < 150)
        cand = [x for x in range(40, 140) if dark[int(y0):int(y1), x].mean() > .35]; x0 = cand[0] + .5 if cand else 88
    px = lambda i: x0 + (i - n0) * (x1 - x0) / (n1 - n0)
    ev = lambda y: top + (y - y0) * (bottom - top) / (y1 - y0)
    n = n1 - n0 + 1; series = []
    dist = np.stack([np.sqrt(((a - np.array(c)) ** 2).sum(2)) for c in COLOURS[:nv]])
    cls = dist.argmin(0); close = dist.min(0) < 28
    for v in range(nv):
        mask = (cls == v) & close
        core = ndimage.binary_opening(mask, structure=disc)
        lab, k = ndimage.label(core)
        found = {}
        for j in range(1, k + 1):
            ys, xs = np.nonzero(lab == j)
            cx, cy, area = xs.mean(), ys.mean(), len(xs)
            i = round(n0 + (cx - x0) * (n1 - n0) / (x1 - x0))
            if abs(px(i) - cx) > 6 or area < least: continue
            if i not in found or area > found[i][1]: found[i] = (cy, area)
        # Higher volumes in S5 and S6a were computed with half as many images (every other position on the axis).
        parity = {i % 2 for i, (cy, area) in found.items() if area > full and i not in (n0, n1)}
        sparse = n > 9 and len(parity) == 1
        pts = []
        for i in range(n0, n1 + 1):
            mirror = n0 + n1 - i
            if sparse and i not in (n0, n1) and i % 2 not in parity: continue
            src = 'marker'
            if i in (n0, n1): e, src = 0.0, 'end (0 by definition)'
            elif i in found and found[i][1] > full: e = ev(found[i][0])
            elif mirror in found and found[mirror][1] > full: e, src = ev(found[mirror][0]), 'mirror'
            else:
                # Marker hidden under another: read the curve's own line in a 3 px column through the image position.
                col = (cls == v) & close; x = int(round(px(i)))
                ys = np.nonzero(col[:, x - 1:x + 2].any(1))[0]
                ys = ys[(ys > y0 + 2) & (ys < y1 - 2)]
                if len(ys) >= 2 and ys.max() - ys.min() < 8: e, src = ev(float(np.median(ys))), 'line'
                elif i in found: e, src = ev(found[i][0]), 'partial marker'
                else: e, src = None, 'hidden'
            pts.append({'image': i, 'energy_eV': None if e is None else round(e, 3), 'from': src})
        series.append({'volume_A3': VOLUMES[v], 'points': pts})
    result['paths'][key] = {'figure': label, 'images': n, 'eV_per_px': round((top - bottom) / (y1 - y0), 5), 'series': series}
    for s in series:
        es = [p['energy_eV'] for p in s['points'] if p['energy_eV'] is not None]
        hidden = sum(p['energy_eV'] is None for p in s['points'])
        print(f"{key:8s} {s['volume_A3']:5.1f}  max {max(es):6.3f}  min {min(es):6.3f}  hidden {hidden}  " + ' '.join('—' if p['energy_eV'] is None else f"{p['energy_eV']:.2f}" for p in s['points']))
# Fill what no pixel shows, from what the paper states, and say so on each point.
FIG3 = json.loads((ROOT / 'site/assets/anion-framework/curves.json').read_text())['figure3']
for key, path in result['paths'].items():
    for s in path['series']:
        for p in s['points']:
            if p['energy_eV'] is not None: continue
            if key in ('bcc_TT', 'hcp_TT') and s['volume_A3'] >= 62.1:
                p['energy_eV'], p['from'] = 0.0, 'flat: the SI caption states no barrier for V ≥ 62.1 Å³'
            elif key in FIG3 and p['image'] == (path['images'] + 1) // 2:
                ref = min(FIG3[key], key=lambda r: abs(r['volume_A3'] - s['volume_A3']))
                p['energy_eV'], p['from'] = ref['barrier_eV'], 'Figure 3 barrier (the curve peaks here)'
            elif key == 'hcp_TOT' and p['image'] == (path['images'] + 1) // 2:
                hx = [h for h in FIG3['hcp_hexagons'] if abs(h['volume_A3'] - s['volume_A3']) < .2 and h['barrier_eV'] > .3]
                p['energy_eV'], p['from'] = round(hx[0]['barrier_eV'] - .008, 3), 'Figure 3 hexagon, partly hidden under the fcc diamond (±0.01 eV)'
        s['points'] = [p for p in s['points'] if p['energy_eV'] is not None]
        es = [p['energy_eV'] for p in s['points']]
        s['barrier_eV'] = round(max(es) - min(es), 3)
        s['site_energy_eV'] = s['points'][len(s['points']) // 2]['energy_eV'] if key.endswith('TOT') else None
# Cross-check against the vector markers of Figure 3
worst = 0
for key in ('bcc_TT', 'fcc_TOT'):
    for ref in FIG3[key]:
        s = min(result['paths'][key]['series'], key=lambda q: abs(q['volume_A3'] - ref['volume_A3']))
        d = abs(s['barrier_eV'] - ref['barrier_eV']); worst = max(worst, d)
        print(f"check {key} {ref['volume_A3']:5.1f}: SI {s['barrier_eV']:.3f}  Fig. 3 {ref['barrier_eV']:.3f}  diff {d:.3f}")
for h in FIG3['hcp_hexagons']:
    if not h['whole']: continue
    s = min(result['paths']['hcp_TT']['series'], key=lambda q: abs(q['volume_A3'] - h['volume_A3']))
    d = abs(s['barrier_eV'] - h['barrier_eV']); worst = max(worst, d)
    print(f"check hcp_TT  {h['volume_A3']:5.1f}: SI {s['barrier_eV']:.3f}  Fig. 3 {h['barrier_eV']:.3f}  diff {d:.3f}")
result['check_vs_figure3_max_diff_eV'] = round(worst, 3)
assert worst < .015, worst
OUT.write_text(json.dumps(result, indent=1))
