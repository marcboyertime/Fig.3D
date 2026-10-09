"""Rasterise Figures 1-5 of Wang et al. (2015) unchanged from the publisher PDF, plus the panels the page uses.

The article is not open access (© 2015 Macmillan Publishers Limited). Figures are shown unchanged, at native
resolution, with a copyright line and a link to the paper, on the same footing as the silicon nanowire page.
The PDFs themselves are not committed (sources/.gitignore); source-manifest.json records their hashes.
Output: site/assets/anion-framework/figure-*.webp and figures.json (sizes, clips, hashes).
Run: python3 production/anion-framework/extract-figures.py   (needs PyMuPDF and Pillow)
"""
import hashlib, io, json, pathlib
import pymupdf as fitz
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / 'production/anion-framework/sources/wang-2015.pdf'
SI = ROOT / 'production/anion-framework/sources/wang-2015-si.pdf'
OUT = ROOT / 'site/assets/anion-framework'; OUT.mkdir(parents=True, exist_ok=True)
docs = {'paper': fitz.open(SRC), 'si': fitz.open(SI)}
CLIPS = {
 'figure-1': ('paper', 1, fitz.Rect(60, 46, 530, 326)),
 'figure-2': ('paper', 2, fitz.Rect(108, 46, 552, 452)),
 'figure-3': ('paper', 2, fitz.Rect(300, 498, 552, 645)),
 'figure-4': ('paper', 3, fitz.Rect(70, 46, 525, 430)),
 'figure-5': ('paper', 4, fitz.Rect(306, 48, 556, 200)),
 # Rows of Figure 2 shown beside the linked plots
 'figure-2a': ('paper', 2, fitz.Rect(108, 46, 552, 182)),
 'figure-2b': ('paper', 2, fitz.Rect(108, 182, 552, 314)),
 'figure-2c': ('paper', 2, fitz.Rect(108, 314, 552, 452)),
 # Panel a's render alone, at its embedded native resolution (401 px), for the opening's zoom
 'figure-2a-render': ('paper', 2, fitz.Rect(135.4, 65.2, 266.5, 157.9)),
 # Supplementary figures used as references for the volume question
}
SCALES = {'figure-2a-render': 401 / 131.1, 'figure-1': 220 / 72, 'figure-4': 220 / 72}
SCALE = 220 / 72 * 1.5  # the embedded renders are 220 ppi; 1.5x keeps vector text crisp at 2x zoom
meta = {'source': SRC.name, 'source_sha256': hashlib.sha256(SRC.read_bytes()).hexdigest(),
        'si_sha256': hashlib.sha256(SI.read_bytes()).hexdigest(),
        'rights': '© 2015 Macmillan Publishers Limited. Reproduced unchanged with attribution; not repainted.', 'figures': {}}
for name, (which, page, clip) in CLIPS.items():
    s = SCALES.get(name, SCALE)
    pix = docs[which][page].get_pixmap(matrix=fitz.Matrix(s, s), clip=clip, alpha=False)
    img = Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGB')
    path = OUT / f'{name}.webp'
    img.save(path, 'WEBP', quality=90, method=6)
    meta['figures'][name] = {'doc': which, 'page': page + 1, 'clip_pt': [round(v, 2) for v in clip], 'scale': round(s, 4),
                             'width': img.width, 'height': img.height, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    print(name, img.size, path.stat().st_size // 1024, 'KB')
(OUT / 'figures.json').write_text(json.dumps(meta, indent=1))
