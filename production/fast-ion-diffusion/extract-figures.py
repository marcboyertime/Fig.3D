"""Rasterise Figures 1-4 of He, Zhu & Mo (2017) unchanged from the author PDF (vector art + embedded renders).

Clips exclude running heads and captions; captions are reproduced as text on the page.
The article is CC BY 4.0, so reproduction with attribution is permitted; nothing is repainted.
Output: site/assets/fast-ion-diffusion/figure-{1..4}.webp (+ crops) and figures.json (sizes, clips, hashes).
"""
import hashlib, io, json, pathlib
import pymupdf as fitz
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / 'production/fast-ion-diffusion/sources/he-zhu-mo-2017.pdf'
OUT = ROOT / 'site/assets/fast-ion-diffusion'; OUT.mkdir(parents=True, exist_ok=True)
doc = fitz.open(SRC)
CLIPS = {
 'figure-1': (1, fitz.Rect(300, 46, 552, 393)),
 'figure-2': (2, fitz.Rect(44, 48, 552, 386)),
 'figure-3': (3, fitz.Rect(56, 52, 540, 297)),
 'figure-4': (4, fitz.Rect(56, 46, 540, 170)),
 # Panels used beside the linked plots
 'figure-3b': (3, fitz.Rect(242, 52, 376, 175)),
 'figure-3e': (3, fitz.Rect(242, 174, 376, 296)),
 'figure-2e': (2, fitz.Rect(214, 172, 366, 268)),
 # Panel b's inset alone, at the embedded render's native resolution (579 px), for the zoom of the opening
 'figure-3b-inset': (3, fitz.Rect(269.688, 72.490, 362.318, 114.874)),
}
SCALES = {'figure-3b-inset': 8}
SCALE = 4  # 288 dpi
meta = {'source': SRC.name, 'source_sha256': hashlib.sha256(SRC.read_bytes()).hexdigest(), 'licence': 'CC BY 4.0', 'figures': {}}
for name, (page, clip) in CLIPS.items():
    pix = doc[page].get_pixmap(matrix=fitz.Matrix(SCALES.get(name, SCALE), SCALES.get(name, SCALE)), clip=clip, alpha=False)
    img = Image.open(io.BytesIO(pix.tobytes('png')))
    path = OUT / f'{name}.webp'
    img.save(path, 'WEBP', quality=92, method=6)
    meta['figures'][name] = {'page': page + 1, 'clip_pt': [round(v, 2) for v in clip], 'width': img.width, 'height': img.height, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    print(name, img.size, path.stat().st_size // 1024, 'KB')
(OUT / 'figures.json').write_text(json.dumps(meta, indent=1))
