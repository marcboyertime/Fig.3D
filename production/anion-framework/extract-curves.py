"""Read the energy points of main-text Figures 2 and 3 straight from the vector drawing in the publisher PDF.

Figure 2 (right panels): every NEB image is a filled circle; its centre is the bbox centre. The y axis is
calibrated on the printed frame (0.0 and 0.5 eV) and its four ticks (0.1-0.4 eV). Path position is the image
index scaled to 0..1, as the paper plots it (evenly spaced, 19.33 pt or 9.90 pt apart).
Figure 3: bcc squares and fcc diamonds, calibrated on the printed x ticks (25-70 Å³) and y ticks (0-1.0 eV).
The hcp hexagons are built from many small gradient pieces, so hcp barriers come from the SI curves instead
(digitize-si.py) and are checked against the paper's text (0.40, 0.20, 0.19 eV at 40 Å³).
Output: site/assets/anion-framework/curves.json
Run: python3 production/anion-framework/extract-curves.py   (needs PyMuPDF)
"""
import json, pathlib
import pymupdf as fitz
ROOT = pathlib.Path(__file__).resolve().parents[2]
PDF = ROOT / 'production/anion-framework/sources/wang-2015.pdf'
OUT = ROOT / 'site/assets/anion-framework/curves.json'
page = fitz.open(PDF)[2]
DRAW = page.get_drawings()
GREEN, RED, BLUE = (0.052, 0.506, 0.251), (0.931, 0.13, 0.141), (0.225, 0.327, 0.645)
def same(a, b): return a is not None and all(abs(x - y) < 2e-3 for x, y in zip(a, b))
def circles(rect, colour):
    pts = set()
    for d in DRAW:
        r = d['rect']
        if rect.contains(r) and 2 < r.width < 3.5 and ''.join(i[0] for i in d['items']) == 'cccccccc' and same(d.get('fill'), colour):
            pts.add((round((r.x0 + r.x1) / 2, 3), round((r.y0 + r.y1) / 2, 3)))
    return sorted(pts)
def ticks(rect):
    return sorted(round(d['rect'].y0, 3) for d in DRAW if rect.contains(d['rect']) and ''.join(i[0] for i in d['items']) == 'l'
                  and d['rect'].height < .01 and 1.5 < d['rect'].width < 2.5)
PANELS = {  # frame (x0, top, x1, bottom) as printed, top = 0.5 eV and bottom = 0.0 eV
 'a': (fitz.Rect(318, 48, 486, 170), 57.98, 166.23),
 'b': (fitz.Rect(318, 182, 486, 302), 190.41, 298.66),
 'c': (fitz.Rect(318, 314, 486, 436), 323.52, 431.77),
}
result = {'source': 'Wang et al., Nat. Mater. 14, 1026 (2015); vector markers of Figures 2 and 3 read with PyMuPDF', 'figure2': {}, 'figure3': {}}
for key, colour, panel, name, desc in [
    ('bcc_TT', GREEN, 'a', 'bcc (T–T)', 'T1 → T2 through the shared face'),
    ('fcc_TOT', GREEN, 'b', 'fcc (T–O–T)', 'T1 → O1 → T2'),
    ('hcp_TOT', GREEN, 'c', 'hcp (T–O–T)', 'T1 → O1 → T2, in the a–b plane'),
    ('hcp_OO', RED, 'c', 'hcp (O–O)', 'O1 → O2 along c'),
    ('hcp_TT', BLUE, 'c', 'hcp (T–T)', 'T1 → T3 along c')]:
    rect, top, bottom = PANELS[panel]
    t = ticks(rect)
    assert len(t) == 4 and all(abs((bottom - y) / (bottom - top) * .5 - v) < 1e-3 for y, v in zip(t, [.4, .3, .2, .1])), (key, t)
    pts = circles(rect, colour)
    xs = [x for x, _ in pts]; step = (xs[-1] - xs[0]) / (len(xs) - 1)
    assert max(abs((b - a) - step) for a, b in zip(xs, xs[1:])) < .02, key   # evenly spaced images
    e = lambda y: round((bottom - y) / (bottom - top) * .5, 4)
    rec = {'name': name, 'path': desc, 'volume_A3': 40.0, 'panel': 'Figure 2' + panel, 'image_spacing_pt': round(step, 3),
           'points': [{'image': i + 1, 'energy_eV': e(y)} for i, (x, y) in enumerate(pts)]}
    if key in ('hcp_OO', 'hcp_TT'):  # drawn over half the panel's axis; keep where it sits on the shared axis
        full = (482.31 - 323.89)
        rec['axis_span'] = [round((xs[0] - 323.89) / full, 4), round((xs[-1] - 323.89) / full, 4)]
    energies = [p['energy_eV'] for p in rec['points']]
    rec['barrier_eV'] = round(max(energies) - min(energies), 4)
    result['figure2'][key] = rec
    print(f"{key:8s} {len(pts):2d} images  barrier {rec['barrier_eV']:.3f} eV  " + ' '.join(f'{v:.3f}' for v in energies))
# Figure 3 — bcc squares and fcc diamonds
X25, XSTEP, Y0, YPER = 346.73, 19.71, 614.84, (614.84 - 517.58) / 1.0
for key, colour, shape, size in [('bcc_TT', (0.047, 0.505, 0.251), 're', 4.4), ('fcc_TOT', (0.931, 0.12, 0.141), 'llll', 6.2)]:
    pts = set()
    for d in DRAW:
        r = d['rect']
        if not fitz.Rect(340.8, 500, 540, 620).contains(r) or not same(d.get('fill'), colour): continue
        if ''.join(i[0] for i in d['items']) != shape or abs(r.width - size) > .3: continue
        cx, cy = (r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2
        if cx > 470 and cy < 545: continue  # legend
        pts.add((round(25 + (cx - X25) / XSTEP * 5, 2), round((Y0 - cy) / YPER, 4)))
    result['figure3'][key] = [{'volume_A3': v, 'barrier_eV': b} for v, b in sorted(pts)]
    print('Figure 3', key, sorted(pts))
# hcp hexagons: each is drawn from many small gradient pieces. Pieces in one marker's column are merged into
# clusters; a whole hexagon is 4.3 x 5.0 pt. hcp (T-O-T) hexagons sit under the fcc diamonds and show only their top
# part, so their centres read about 0.01 eV high; they are kept as an approximate check, flagged as such.
COLS = [(28.5, 360.53), (34.0, 382.21), (40.0, 405.78), (46.6, 432.0), (54.0, 460.97), (62.1, 492.82), (70.8, 527.07)]
def bluish(c): r, g, b = c; return (b > r + .05 and b > g + .05) or (abs(r - g) < .05 and abs(g - b) < .05 and r > .3)
result['figure3']['hcp_hexagons'] = []
for vol, cx in COLS:
    rects = sorted((d['rect'] for d in DRAW if d.get('fill') and d['rect'].width < 7 and d['rect'].height < 7 and abs((d['rect'].x0 + d['rect'].x1) / 2 - cx) < 3.2
                    and d['rect'].y0 > 500 and d['rect'].y1 < 620 and bluish(d['fill']) and not (d['rect'].x0 > 470 and d['rect'].y1 < 545)), key=lambda r: r.y0)
    clusters = []
    for r in rects:
        if clusters and r.y0 < clusters[-1].y1 + .6: clusters[-1] |= r
        else: clusters.append(fitz.Rect(r))
    for c in clusters:
        if c.width < 3.5 or c.height > 6: continue  # fragments, and the star-and-label clutter at 40 Å³
        result['figure3']['hcp_hexagons'].append({'volume_A3': vol, 'barrier_eV': round((Y0 - (c.y0 + c.y1) / 2) / YPER, 3), 'whole': c.height > 4.6})
print('Figure 3 hcp hexagons', [(h['volume_A3'], h['barrier_eV'], h['whole']) for h in result['figure3']['hcp_hexagons']])
OUT.write_text(json.dumps(result, indent=1))
