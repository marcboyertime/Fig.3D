"""Annotated before/after boards for the method write-up.

board(out, panels, notes, title)
  panels: list of dicts {src, crop:(x0,y0,x1,y1)|None, label, marks:[(x0,y0,x1,y1,n)] in source px}
  notes:  list of (n, text) printed under the panels
Panels are scaled to a common height and placed side by side on a near-black board.
"""
from PIL import Image, ImageDraw, ImageFont
import textwrap

BG = (11, 14, 21)
INK = (232, 237, 248)
MUTED = (150, 162, 186)
AMBER = (255, 181, 71)
GREEN = (126, 214, 160)
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'


def f(size, bold=False):
    return ImageFont.truetype(BOLD if bold else FONT, size)


def badge(d, x, y, n, color):
    r = 15
    d.ellipse([x - r, y - r, x + r, y + r], fill=color)
    d.text((x, y), str(n), font=f(17, True), fill=BG, anchor='mm')


def board(out, panels, notes, title, height=560, width_cap=None):
    imgs = []
    for p in panels:
        im = Image.open(p['src']).convert('RGB')
        x0, y0 = 0, 0
        if p.get('crop'):
            x0, y0 = p['crop'][0], p['crop'][1]
            im = im.crop(p['crop'])
        k = height / im.height
        if width_cap and im.width * k > width_cap:
            k = width_cap / im.width
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        d = ImageDraw.Draw(im)
        color = GREEN if p.get('good') else AMBER
        for (a, b, c, e, n) in p.get('marks', []):
            box = [(a - x0) * k, (b - y0) * k, (c - x0) * k, (e - y0) * k]
            d.rectangle(box, outline=color, width=3)
            badge(d, box[0], box[1], n, color)
        imgs.append((im, p))
    pad, gap = 36, 28
    W = sum(i.width for i, _ in imgs) + gap * (len(imgs) - 1) + 2 * pad
    wrap = max(60, int((W - 2 * pad - 50) / 10.2))
    note_lines = []
    for n, t in notes:
        lines = textwrap.wrap(t, wrap)
        note_lines.append((n, lines))
    notes_h = sum(len(l) * 27 + 12 for _, l in note_lines)
    H = pad + 44 + 34 + max(i.height for i, _ in imgs) + 30 + notes_h + pad
    canvas = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(canvas)
    d.text((pad, pad), title, font=f(28, True), fill=INK)
    x, y = pad, pad + 44
    for im, p in imgs:
        d.text((x, y), p['label'], font=f(18, True), fill=GREEN if p.get('good') else MUTED)
        canvas.paste(im, (x, y + 34))
        d.rectangle([x - 1, y + 33, x + im.width, y + 34 + im.height], outline=(40, 48, 66), width=1)
        x += im.width + gap
    y = pad + 44 + 34 + max(i.height for i, _ in imgs) + 30
    for n, lines in note_lines:
        if n is not None:
            badge(d, pad + 15, y + 13, n, AMBER if isinstance(n, int) else GREEN)
        for i, line in enumerate(lines):
            d.text((pad + 44, y + i * 27), line, font=f(19), fill=INK)
        y += len(lines) * 27 + 12
    canvas.save(out, quality=90)
    return out
