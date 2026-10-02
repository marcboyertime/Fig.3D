"""Lossless, native-pixel panel extraction; never repaint scientific source images."""
from pathlib import Path
from PIL import Image
import hashlib,json
root=Path(__file__).resolve().parents[2]
p=root/'site/references/nanoparticle/kang-2024-figure-1.png'
im=Image.open(p)
# Native source is 1503 x 1646. Keep complete panel letters and 100 nm bars.
rects={'a':(0,0,498,494),'c':(1008,0,1503,494)}
for panel,rect in rects.items():im.crop(rect).save(root/f'site/assets/nanoparticle/kang-panel-{panel}.webp',lossless=True)
(root/'site/references/nanoparticle/provenance.json').write_text(json.dumps({'source':'https://www.nature.com/articles/s41467-024-47994-y','doi':'10.1038/s41467-024-47994-y','figure':1,'license':'CC BY 4.0','license_url':'https://creativecommons.org/licenses/by/4.0/','authors':'Kang et al.','year':2024,'original_size':im.size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'changes':'Lossless native-resolution rectangular crops of complete panels a and c. No resampling, retouching or enhancement. Animated outlines are separate explanatory overlays.','crop_rectangles':rects},indent=2))
