"""Read the plotted points of Fig. 3b, 3e and 4c straight from the vector drawing in the author PDF.

Each marker is a filled circle; its centre is the bbox centre. Axis calibration uses the printed
tick marks (also vector strokes) and their labels. Output: site/assets/fast-ion-diffusion/curves.json.
Run: python3 production/fast-ion-diffusion/extract-curves.py  (needs PyMuPDF)
"""
import json, pathlib, statistics
import pymupdf as fitz
ROOT = pathlib.Path(__file__).resolve().parents[2]
PDF = ROOT / 'production/fast-ion-diffusion/sources/he-zhu-mo-2017.pdf'
doc = fitz.open(PDF)

def markers(page, rect, colour):
    out = {}
    for d in page.get_drawings():
        r = d['rect']
        if d.get('fill') and rect.contains(r) and d['items'][0][0] == 'c' and all(abs(a - b) < 1e-3 for a, b in zip(d['fill'], colour)):
            out[(round((r.x0 + r.x1) / 2, 2), round((r.y0 + r.y1) / 2, 2))] = (r.width, r.height)
    pts = []
    for x, y in sorted(out):  # the same marker is painted twice (fill, then stroke); keep one per position
        if not pts or abs(x - pts[-1][0]) > .5: pts.append((x, y))
    return pts

def ticks(page, rect, x0):
    ys = sorted({round(d['rect'].y0, 2) for d in page.get_drawings() if rect.contains(d['rect']) and d['items'][0][0] == 'l'
                 and abs(d['rect'].x0 - x0) < .05 and d['rect'].height < .01 and 1 < d['rect'].width < 2.5})
    return ys

def calibrate(ys, values):
    # least-squares line through (tick y, label value)
    n = len(ys); my = sum(ys) / n; mv = sum(values) / n
    k = sum((y - my) * (v - mv) for y, v in zip(ys, values)) / sum((y - my) ** 2 for y in ys)
    resid = max(abs(mv + k * (y - my) - v) for y, v in zip(ys, values))
    return (lambda y: mv + k * (y - my)), k, resid

result = {'source': 'He, Zhu & Mo, Nat. Commun. 8, 15893 (2017), author PDF; vector markers read with PyMuPDF', 'panels': {}}
p = doc[3]
GREEN, RED = (0.28235000371932983, 0.4705899953842163, 0.3647100031375885), (0.9254900217056274, 0.10980000346899033, 0.14117999374866486)
for key, rect, colour, x0, desc in [
    ('3b', fitz.Rect(255, 60, 380, 162), GREEN, 258.95, 'Energy profile of concerted migration (eV) vs concerted migration path (NEB images, unitless), LLZO'),
    ('3e', fitz.Rect(255, 185, 380, 284), RED, 258.97, 'Energy landscape of single-ion migration (eV) vs position along migration path (unitless), LLZO, T-O-T')]:
    ys = ticks(p, rect.__class__(rect.x0, rect.y0, rect.x1, rect.y1 + 2), x0)
    f, k, resid = calibrate(ys, [round(i * .2, 1) for i in range(len(ys))][::-1])
    pts = markers(p, rect, colour)
    xs = [x for x, _ in pts]
    result['panels'][key] = {
        'description': desc,
        'points': [{'image': i, 's': round((x - xs[0]) / (xs[-1] - xs[0]), 4), 'energy_eV': round(f(y), 4)} for i, (x, y) in enumerate(pts)],
        'calibration': {'ticks_pt': ys, 'pt_per_eV': round(-1 / k, 3), 'tick_residual_eV': round(resid, 5)},
        'accuracy_eV': round(0.05 / (-1 / k) * 10, 4),  # ±0.05 pt marker-centre uncertainty → eV, generous x10
        'x_spacing_pt': sorted({round(b - a, 2) for a, b in zip(xs, xs[1:])}),
    }
# Fig. 4c/4d: triangles (landscape a, green) and circles (landscape b, red). Triangle centre = vertex centroid.
def shapes(page, rect, colour):
    LEGENDS = [d['rect'] for d in page.get_drawings() if d.get('fill') == (1.0, 1.0, 1.0) and 50 < d['rect'].width < 60]
    pts = []
    for d in page.get_drawings():
        r = d['rect']
        if not (d.get('fill') and rect.contains(r) and all(abs(a - b) < 1e-3 for a, b in zip(d['fill'], colour)) and r.width < 2.5): continue
        if d['items'][0][0] == 'l':
            v = [it[1] for it in d['items']]; c = (sum(q.x for q in v) / len(v), sum(q.y for q in v) / len(v))
        else:
            c = ((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2)
        if any(L.contains(fitz.Point(*c)) for L in LEGENDS): continue  # legend symbols
        if not any(abs(c[0] - q[0]) < .5 and abs(c[1] - q[1]) < .5 for q in pts): pts.append(c)
    return sorted(pts)
p5 = doc[4]
def lin(a0, a1, v0, v1): return lambda t: v0 + (t - a0) * (v1 - v0) / (a1 - a0)
panels4 = {
 '4c': dict(rect=fitz.Rect(276, 56, 364, 134), y=lin(132.3, 58.31, 0, 2.0), x=lin(280.0, 359.9, 0, 3.0), xunit='Å (concerted migration path)', note='x calibrated from tick-label centres (±0.05 Å); y from tick strokes'),
 '4d': dict(rect=fitz.Rect(416, 56, 512, 134), y=lin(135.96, 54.47, 0, 2.0), x=lin(421.15, 499.72, 2, 6), xunit='K (eV Å)', note='x and y from tick strokes'),
}
for key, c in panels4.items():
    entry = {'note': c['note'], 'x_unit': c['xunit'], 'y_unit': 'eV', 'series': {}}
    for name, colour in [('landscape_a', GREEN), ('landscape_b', RED)]:
        entry['series'][name] = [[round(c['x'](x), 3), round(c['y'](y), 4)] for x, y in shapes(p5, c['rect'], colour)]
    result['panels'][key] = entry

out = ROOT / 'site/assets/fast-ion-diffusion/curves.json'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(result, indent=1))
for k, v in result['panels'].items():
    if 'series' in v: print(k, {n: (len(a), max(q[1] for q in a)) for n, a in v['series'].items()}); continue
    print(k, len(v['points']), 'max', max(p['energy_eV'] for p in v['points']), v['calibration'], v['x_spacing_pt'])
    print([p['energy_eV'] for p in v['points']])
