"""Read-only native image extraction from the user-supplied arXiv PDF.
python extract_figures.py /path/to/2604.26222.pdf
Requires pypdf. Does not modify or reauthor the PDF.
"""
import sys,hashlib,json
from pathlib import Path
from pypdf import PdfReader
source=Path(sys.argv[1]);root=Path(__file__).resolve().parents[2];out=root/'site/assets/self-separating-battery';reader=PdfReader(source)
for number,page in [(1,13),(2,15),(5,23),(6,24)]:
    image=reader.pages[page].images[0]
    assert image.data[:2]==b'\xff\xd8','Expected native JPEG'
    (out/f'figure-{number}.jpg').write_bytes(image.data)
    print(f'Figure {number}: PDF page {page+1}, {len(image.data)} bytes, SHA256 {hashlib.sha256(image.data).hexdigest()}')
print('PDF SHA256',hashlib.sha256(source.read_bytes()).hexdigest())
