"""Extract original embedded images, retaining native pixels and source panel identities.
Requires PyMuPDF and Pillow. Run from any directory after downloading the two source PDFs.
The xrefs refer to the archived PDFs; source hashes are recorded in source-manifest.json.
"""
from pathlib import Path
import json, hashlib
import pymupdf
from PIL import Image
ROOT=Path(__file__).resolve().parent
OUT=ROOT.parents[1]/'site/assets/silicon-nanowire'
OUT.mkdir(parents=True,exist_ok=True)
main=pymupdf.open(ROOT/'sources/liu-2011.pdf')
si=pymupdf.open(ROOT/'sources/nl201684d_si_001.pdf')
for name,xref in [('1',106),('2',134),('3',162),('5',196)]:
 d=main.extract_image(xref);(OUT/f'figure-{name}.{d["ext"]}').write_bytes(d['image'])
for name,xref in [('s8',74),('s10',89)]:
 d=si.extract_image(xref);(OUT/f'figure-{name}.{d["ext"]}').write_bytes(d['image'])
Image.open(OUT/'figure-5.jpeg').crop((323,365,666,557)).save(OUT/'von-mises.jpeg',quality=96)
Image.open(OUT/'figure-2.jpeg').crop((0,335,712,791)).save(OUT/'crack-observation.jpeg',quality=96)
a=Image.open(OUT/'figure-s10.jpeg')
a.crop((1290,0,2556,1015)).save(OUT/'stress-early.png')
a.crop((1290,1045,2556,2055)).save(OUT/'stress-late.png')
files=[*ROOT.glob('sources/*.pdf'),*OUT.glob('figure-*.jpeg')]
manifest={str(p.relative_to(ROOT)) if p.is_relative_to(ROOT) else str(p.relative_to(ROOT.parents[1])):{'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size} for p in files}
(ROOT/'source-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
