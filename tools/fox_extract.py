#!/usr/bin/env python3
"""Cut the Fox Family sprites out of the supplied magenta GIFs.

    python3 tools/fox_extract.py            # writes art/fox-*.webp
    python3 tools/fox_extract.py --review D # also writes review sheets into D

The bundle (art/src/fox/) is nine-frame animated GIFs on a magenta key that is
not uniform (green runs 3..87) with antialiased, magenta-tinted edges. So:

1. Key: a pixel is background when it is clearly magenta (red and blue both
   well above green and bright).
2. Separate: the family stands in one row; Papa and Mama touch where Mama's
   tail crosses Papa's trouser leg, and the twins touch hands while cheering.
   Those joins are cut along a fixed column, and each piece is given to the
   character whose column it sits in. Small loose strokes (motion lines) go.
3. Clean: the outermost pixel ring (where the fringe lives) is eroded away,
   any purple cast left near the edge is removed (red and blue pulled down to
   green), and the transparent area is filled with the nearest kept colour so
   nothing purple bleeds back in when the picture is scaled.
4. Upscale x2 (colour and alpha separately) and save as webp with alpha.

check() then fails if any visible pixel of any output still looks magenta.
"""
import os
import sys

import numpy as np
from PIL import Image, ImageSequence
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art', 'src', 'fox')
OUT = os.path.join(ROOT, 'art')
UP = 2


def frames(name):
    im = Image.open(os.path.join(SRC, name))
    return [np.asarray(f.convert('RGB')).astype(np.int16) for f in ImageSequence.Iterator(im)]


def key(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return (np.minimum(r, b) - g > 70) & (r > 140) & (b > 140)


def is_magenta(rgb):
    """any purple cast at all: red and blue both clearly above green"""
    r, g, b = rgb[..., 0].astype(int), rgb[..., 1].astype(int), rgb[..., 2].astype(int)
    return (np.minimum(r, b) - g > 20) & (np.maximum(r, b) > 90)


def cutout(a, keep):
    """a: RGB frame, keep: bool mask of this sprite's pixels -> RGBA image (upscaled)."""
    solid = keep.copy()
    # tiny enclosed holes (the hinge of a pair of glasses) were magenta, not see-through: fill them
    holes = ndimage.binary_fill_holes(keep) & ~keep
    lab, n = ndimage.label(holes)
    if n:
        sizes = ndimage.sum(holes, lab, range(1, n + 1))
        keep = keep | np.isin(lab, 1 + np.flatnonzero(sizes < 40))
    fg = ndimage.binary_erosion(keep, iterations=1)
    # drop specks left by the erosion
    lab, n = ndimage.label(fg)
    if n:
        sizes = ndimage.sum(fg, lab, range(1, n + 1))
        fg = np.isin(lab, 1 + np.flatnonzero(sizes >= 40))
    rgb = a.astype(np.float32).copy()
    # filled holes take the colour of the nearest real pixel
    _, (iy, ix) = ndimage.distance_transform_edt(~(solid & fg), return_indices=True)
    rgb = rgb[iy, ix]
    # despill everywhere: nothing in this family is purple, so wherever red and blue both
    # sit above green the magenta has leaked in; pull them down to green
    ex = np.clip(np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1], 0, None)
    rgb[..., 0] -= ex
    rgb[..., 2] -= ex
    alpha = ndimage.gaussian_filter(fg.astype(np.float32), 0.55)
    alpha = np.clip((alpha - 0.18) / 0.64, 0, 1)
    ys, xs = np.nonzero(fg)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    pad = 2
    y0, x0 = max(0, y0 - pad), max(0, x0 - pad)
    y1, x1 = min(a.shape[0], y1 + pad), min(a.shape[1], x1 + pad)
    rgb, alpha = rgb[y0:y1, x0:x1], alpha[y0:y1, x0:x1]
    size = ((x1 - x0) * UP, (y1 - y0) * UP)
    col = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).resize(size, Image.LANCZOS)
    c = np.asarray(col).astype(np.int16)  # Lanczos can ring a little purple back in: despill again
    ex = np.clip(np.minimum(c[..., 0], c[..., 2]) - c[..., 1], 0, None)
    c[..., 0] -= ex
    c[..., 2] -= ex
    col = Image.fromarray(np.clip(c, 0, 255).astype(np.uint8))
    al = Image.fromarray((alpha * 255).astype(np.uint8)).resize(size, Image.LANCZOS)
    col.putalpha(al)
    return col, (x0, y0, x1, y1)


# ---------- the family row ----------
# columns (in source pixels) that split the row into the four characters
SPLIT_PAPA_MAMA = 152   # Mama's tail meets Papa's trouser leg here (rows 200..320)
SPLIT_TWINS = 367       # the twins' hands meet here when they cheer
CAST = ['papa', 'mama', 'twin-blue', 'twin-rust']


def split_family(a):
    fg = ~key(a)
    fg[:, :8] = fg[:, -8:] = False
    fg[:8] = fg[-8:] = False
    cut = fg.copy()
    cut[200:320, SPLIT_PAPA_MAMA - 2:SPLIT_PAPA_MAMA + 3] = False
    cut[:, SPLIT_TWINS - 1:SPLIT_TWINS + 2] = False
    lab, n = ndimage.label(cut)
    sizes = ndimage.sum(cut, lab, range(1, n + 1))
    cents = ndimage.center_of_mass(cut, lab, range(1, n + 1))
    bounds = [0, SPLIT_PAPA_MAMA, 270, SPLIT_TWINS, a.shape[1]]
    masks = {c: np.zeros_like(fg) for c in CAST}
    for i in range(n):
        if sizes[i] < 300:  # motion lines, wiggles, specks
            continue
        cx = cents[i][1]
        who = CAST[int(np.searchsorted(bounds, cx) - 1)]
        masks[who] |= lab == i + 1
    # the cut columns: dark pixels are shared ink and go back to both sides; the rest of the
    # band (the tip of Mama's tail, the twins' fingers) goes to whoever it touches
    ink = (a.sum(-1) < 330) & fg
    for who, lo, hi in [('papa', SPLIT_PAPA_MAMA - 3, SPLIT_PAPA_MAMA + 3), ('mama', SPLIT_PAPA_MAMA - 3, SPLIT_PAPA_MAMA + 3),
                        ('twin-blue', SPLIT_TWINS - 2, SPLIT_TWINS + 2), ('twin-rust', SPLIT_TWINS - 2, SPLIT_TWINS + 2)]:
        m = masks[who]
        band = np.zeros_like(m)
        band[:, lo:hi + 1] = True
        near = ndimage.binary_dilation(m, iterations=3) & fg & band
        give = near & ink if who == 'papa' else near
        masks[who] = m | give
    return masks


# which frame of which take gives each pose (chosen from the review sheets)
POSES = {
    # take a, frame 0: everyone at rest
    'mama-idle': ('family_take_a.gif', 0, 'mama'),
    'twin-blue-idle': ('family_take_a.gif', 0, 'twin-blue'),
    'twin-blue-talk': ('family_take_a.gif', 1, 'twin-blue'),
    'twin-blue-excited': ('family_take_a.gif', 2, 'twin-blue'),
    'twin-blue-cheer': ('family_take_a.gif', 4, 'twin-blue'),
    'twin-blue-cheer2': ('family_take_a.gif', 5, 'twin-blue'),
    'twin-blue-joy': ('family_take_a.gif', 7, 'twin-blue'),
    'twin-rust-idle': ('family_take_a.gif', 0, 'twin-rust'),
    'twin-rust-talk': ('family_take_a.gif', 1, 'twin-rust'),
    'twin-rust-excited': ('family_take_a.gif', 2, 'twin-rust'),
    'twin-rust-cheer': ('family_take_a.gif', 4, 'twin-rust'),
    'twin-rust-cheer2': ('family_take_a.gif', 5, 'twin-rust'),
    'twin-rust-joy': ('family_take_a.gif', 7, 'twin-rust'),
}

# props: (gif, frame, x range of the objects to keep, in source pixels)
# objects are kept whole when their bounding box centre falls in the range
PROPS = {
    'table': ('home_furniture_sheet.gif', 0, (0, 508)),
    'chair-a': ('home_furniture_sheet.gif', 1, (0, 250)),
    'chair-b': ('home_furniture_sheet.gif', 1, (250, 508)),
    'mug-stripes': ('home_furniture_sheet.gif', 2, (120, 260)),
    'fruit': ('home_furniture_sheet.gif', 2, (260, 508)),
    'sofa': ('home_furniture_sheet.gif', 3, (0, 508)),
    'shelf': ('home_furniture_sheet.gif', 4, (60, 508)),
    'lamp': ('home_furniture_sheet.gif', 5, (0, 230)),
    'plant': ('home_furniture_sheet.gif', 5, (230, 508)),
    'rug': ('home_furniture_sheet.gif', 6, (0, 508)),
    'fireplace': ('home_furniture_sheet.gif', 7, (0, 508)),
    'window': ('home_furniture_sheet.gif', 8, (0, 508)),
    'suitcase': ('suitcase.gif', 0, (0, 508)),
    'suitcase-tilt-r': ('suitcase.gif', 1, (90, 412)),
    'suitcase-tilt-l': ('suitcase.gif', 2, (90, 412)),
    'calendar-0': ('suitcase.gif', 3, (0, 508)),
    'calendar-1': ('suitcase.gif', 4, (0, 508)),
    'calendar-2': ('suitcase.gif', 5, (0, 508)),
    'calendar-3': ('suitcase.gif', 5, (0, 508)),
    'mug-fox': ('suitcase.gif', 6, (0, 508)),
    'table-set': ('table_set.gif', 0, (0, 508)),
    # outside the cottage
    'cottage': ('cottage_exterior.gif', 0, (0, 508)),
    'cottage-open': ('cottage_exterior.gif', 2, (0, 508)),
    'mailbox': ('cottage_exterior.gif', 3, (0, 508)),
    'mailbox-open': ('cottage_exterior.gif', 4, (0, 508)),
    'robin': ('cottage_exterior.gif', 5, (0, 508)),
    'hydrangea': ('cottage_exterior.gif', 6, (0, 280, 50, 400)),
    'butterfly-a': ('cottage_exterior.gif', 6, (280, 360, 0, 140)),
    'butterfly-b': ('cottage_exterior.gif', 6, (360, 440, 0, 100)),
    'gate': ('cottage_exterior.gif', 7, (0, 508)),
    'gate-open': ('cottage_exterior.gif', 8, (0, 508)),
    # packing
    'case-closed': ('bedroom_background.gif', 1, (0, 508)),
    'case-open': ('bedroom_background.gif', 3, (0, 508)),
    'case-full': ('bedroom_background.gif', 4, (0, 508)),
    'pack-sweaters': ('bedroom_background.gif', 6, (40, 230, 70, 200)),
    'pack-socks': ('bedroom_background.gif', 6, (170, 280, 150, 260)),
    'pack-toothbrush': ('bedroom_background.gif', 6, (285, 390, 40, 175)),
    'pack-notebook': ('bedroom_background.gif', 6, (275, 390, 175, 280)),
    'pack-thermos': ('bedroom_background.gif', 6, (395, 480, 100, 245)),
    'pack-shirt': ('bedroom_background.gif', 6, (30, 165, 185, 270)),
    'pack-duck': ('bedroom_background.gif', 7, (180, 280, 150, 260)),
}


# Papa comes from his own sheet (papa_sheet_5.gif): the only Papa with the locked ponytail, square glasses
# that read blue, and arms that move. The family takes' Papa keeps his hands in his pockets throughout.
PAPA = {'papa-idle': 0, 'papa-oh': 1, 'papa-talk': 2, 'papa-happy': 3, 'papa-wide': 4, 'papa-laugh': 5, 'papa-blink': 6}


def solo(src, fi):
    a = frames(src)[fi]
    fg = ~key(a)
    fg[:, :3] = fg[:, -3:] = False
    fg[:3] = fg[-3:] = False
    lab, n = ndimage.label(fg)
    sizes = ndimage.sum(fg, lab, range(1, n + 1))
    return cutout(a, np.isin(lab, 1 + np.flatnonzero(sizes >= 300)))


# props cut by box rather than by object (things touching their neighbours on the sheet):
# (gif, frame, x0, y0, x1, y1, keep) where keep optionally narrows the pixels kept
BUNDLE = 'twins_bedroom_day.gif'  # the big sheet: frame 6 props, frame 7 curtains opening
BOXED = {
    'pinecone': (BUNDLE, 6, 9, 12, 70, 83, None),
    'car': (BUNDLE, 6, 45, 11, 250, 133, 'largest'),
    'train': (BUNDLE, 6, 255, 30, 497, 124, None),          # without its smoke
    'train-smoke': (BUNDLE, 6, 290, 0, 400, 40, 'light'),
    'pan': (BUNDLE, 6, 0, 144, 156, 218, 'largest'),
    'pan-cake': (BUNDLE, 6, 110, 176, 211, 225, 'largest'),      # a pancake cooking in the pan
    'pancake': (BUNDLE, 6, 246, 124, 332, 172, 'yellow'),   # the one flying off the third pan
    'plate-stack': (BUNDLE, 6, 314, 171, 418, 226, None),
    'bear': (BUNDLE, 6, 415, 128, 506, 228, None),
    'bear-bowtie': (BUNDLE, 6, 448, 182, 478, 202, 'red'),
    'bowl': (BUNDLE, 6, 2, 223, 120, 322, 'largest'),
}
for _r in range(3):          # the curtains opening, 9 steps, read left to right, top to bottom
    for _c in range(3):
        BOXED[f'curtain-{_r * 3 + _c}'] = (BUNDLE, 7, [14, 182, 349][_c], [5, 108, 217][_r], [158, 326, 494][_c], [99, 206, 311][_r], None)  # (sills only: a pink smear lies under each)


def boxed(name):
    src, fi, x0, y0, x1, y1, keep = BOXED[name]
    a = frames(src)[fi]
    m = np.zeros(a.shape[:2], bool)
    m[y0:y1, x0:x1] = True
    m &= ~key(a)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    if keep == 'yellow':
        m &= ndimage.binary_dilation((r > 170) & (g > 120) & (b < 140), iterations=2)
    if keep == 'red':
        m &= ndimage.binary_dilation((r > 150) & (g < 110) & (b < 110), iterations=1)
    if keep == 'light':
        m &= ndimage.binary_dilation((r > 185) & (g > 175) & (b > 165), iterations=1)
    lab, n = ndimage.label(m)
    if n:
        sizes = ndimage.sum(m, lab, range(1, n + 1))
        m = np.isin(lab, 1 + (np.array([np.argmax(sizes)]) if keep == 'largest' else np.flatnonzero(sizes >= 30)))
    return cutout(a, m if keep in ('red', 'yellow', 'light') else no_shadow(a, m))


def no_shadow(a, m):
    """props are painted with a hatched purple cast shadow, which looks like a smear once the prop stands
    somewhere else (a case on a bed): drop those strokes, keep the object"""
    r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
    hatch = (np.minimum(r, b) - g > 22) & (np.abs(r - b) < 70)
    m = m & ~ndimage.binary_dilation(hatch, iterations=1)
    lab, n = ndimage.label(m)
    if n:  # keep the object, not the crumbs the strokes leave behind
        sizes = ndimage.sum(m, lab, range(1, n + 1))
        m = np.isin(lab, 1 + np.flatnonzero(sizes >= max(60, sizes.max() * 0.02)))
    return m


def prop(name):
    src, fi, rng = PROPS[name]
    lo, hi = rng[:2]
    ylo, yhi = rng[2:] if len(rng) > 2 else (0, 9999)
    a = frames(src)[fi].copy()
    if name == 'calendar-3':  # the bundle stops at two lit moons: light the third by copying the second day's cell
        a[115:262, 304:376] = a[115:262, 226:298]
    fg = ~key(a)
    fg[:, :3] = fg[:, -3:] = False
    fg[:3] = fg[-3:] = False
    lab, n = ndimage.label(fg)
    keep = np.zeros_like(fg)
    for j, sl in enumerate(ndimage.find_objects(lab)):
        size = int((lab[sl] == j + 1).sum())
        cx, cy = (sl[1].start + sl[1].stop) / 2, (sl[0].start + sl[0].stop) / 2
        if size >= 300 and lo <= cx < hi and ylo <= cy < yhi:
            keep |= lab == j + 1
    return cutout(a, no_shadow(a, keep))


PAPER = np.array([240, 226, 196], np.float32)  # the book's paper


def unmix_onto_paper(a):
    """A painting whose edges fade into the magenta key: estimate how much key is mixed into each
    pixel (m, from how far red and blue rise above green), take the key back out, and lay what is
    left over paper. The corners then fade into paper like a printed vignette."""
    K = np.array([248, 3, 246], np.float32)
    c = a.astype(np.float32)
    m = np.clip((np.minimum(c[..., 0], c[..., 2]) - c[..., 1] + 2) / 140, 0, 1)
    m = ndimage.grey_dilation(m, size=3)
    m = ndimage.gaussian_filter(m, 1.0)
    f = (c - m[..., None] * K) / np.maximum(1 - m[..., None], 0.08)
    f = np.clip(f, 0, 255)
    # what is left of the picture fades out where the key was strong
    vis = np.clip((1 - m) * 1.15 - 0.15, 0, 1)[..., None]
    return (f * vis + PAPER * (1 - vis)).astype(np.uint8)


def bedroom(out):
    """the attic bedroom: its painting fades into magenta at the top corners and along the sides.
    Crop to 16:9 from the bottom (the floor is wanted, the ceiling is not) and fade the rest onto paper."""
    a = frames('bedroom_background.gif')[0]
    h, w = a.shape[:2]
    a = a[:h - 3, 8:w - 8]
    h, w = a.shape[:2]
    keep_h = int(round(w * 9 / 16))
    a = unmix_onto_paper(a[h - keep_h:])
    img = Image.fromarray(a).resize((w * UP, keep_h * UP), Image.LANCZOS)
    p = os.path.join(OUT, out)
    img.save(p, 'JPEG', quality=88)
    return p


# full paintings with no key: (gif, frames to keep, file name); several frames become an animated background
SCENES = {
    'cottage-road': (BUNDLE, [1]),
    'living-gifts': ('living_room_gifts.gif', range(9)),    # the presents wiggle and sparkle; they never open
    'twins-night': ('twins_bedroom_night.gif', range(9)),   # clouds drift, the moon changes: one look per night
    'station': ('station_background.gif', range(9)),        # chimney smoke drifts
    'bedroom-day': ('bedroom_day_background.gif', range(9)),  # sunlight shifts on the floor
    'dining': ('dining_background.gif', [0]),               # a day-to-night time-lapse: daytime only
}


def scene(name):
    src, idx = SCENES[name]
    fr = frames(src)
    out = []
    for i in idx:
        a = fr[i][1:-1, 1:-1].astype(np.uint8)  # (the outermost pixel ring is GIF edge noise)
        img = Image.fromarray(a).resize(((a.shape[1]) * UP, (a.shape[0]) * UP), Image.LANCZOS)
        p = os.path.join(OUT, f'bg-fox-{name}' + (f'-{i}' if len(idx) > 1 else '') + '.jpg')
        img.save(p, 'JPEG', quality=86)
        out.append(p)
    return out


def background(name, src, out):
    """a full painted room, letterboxed on magenta: crop to the picture and save as jpg"""
    a = frames(src)[0]
    k = key(a)
    rows = np.nonzero(k.mean(1) < 0.5)[0]
    cols = np.nonzero(k.mean(0) < 0.5)[0]
    y0, y1, x0, x1 = rows.min() + 2, rows.max() - 1, cols.min() + 2, cols.max() - 1
    img = Image.fromarray(a[y0:y1, x0:x1].astype(np.uint8))
    img = img.resize((img.width * UP, img.height * UP), Image.LANCZOS)
    p = os.path.join(OUT, out)
    img.save(p, 'JPEG', quality=88)
    return p


def save(img, name):
    p = os.path.join(OUT, f'fox-{name}.webp')
    img.save(p, 'WEBP', quality=88, alpha_quality=100, method=6)
    return p


def check(paths):
    bad = 0
    for p in paths:
        im = np.asarray(Image.open(p).convert('RGBA'))
        vis = im[..., 3] > 24
        # (backgrounds are checked whole: they are opaque paintings and nothing in them is purple)
        rgb = im[..., :3].astype(int)
        blue = ndimage.binary_dilation(rgb[..., 2] > rgb[..., 0] + 40, iterations=3)  # blue glasses next to orange fur blend to mauve
        mag = is_magenta(im[..., :3]) & vis & ~blue
        if p.endswith('.jpg'):  # an opaque painting may have mauve skies and pink flowers: only key-strength magenta counts
            mag = (np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1] > 120) & (rgb[..., 0] > 200)
        if mag.sum():
            bad += 1
            print(f'  MAGENTA LEFT: {os.path.basename(p)}: {int(mag.sum())} px')
    return bad


def anchor(box, ref):
    """where the reference point (source pixels) falls inside a cut-out (sprite pixels)"""
    return [round((ref[0] - box[0]) * UP, 1), round((ref[1] - box[1]) * UP, 1)]


def main():
    review = sys.argv[sys.argv.index('--review') + 1] if '--review' in sys.argv else None
    written = []
    takes = {}
    poses = {}  # pose -> [anchor x, anchor y, the character's standing height], all in sprite pixels
    refs = {}
    for pose, (src, fi, who) in POSES.items():
        if src not in takes:
            takes[src] = frames(src)
        if (src, who) not in refs:  # the idle frame's feet, bottom centre: every pose of this character hangs from it
            _, b0 = cutout(takes[src][0], split_family(takes[src][0])[who])
            refs[src, who] = ((b0[0] + b0[2]) / 2, b0[3] - 2, (b0[3] - b0[1] - 4) * UP)
        a = takes[src][fi]
        img, box = cutout(a, split_family(a)[who])
        rx, ry, h = refs[src, who]
        poses[pose] = anchor(box, (rx, ry)) + [h]
        written.append(save(img, pose))
    _, b0 = solo('papa_sheet_5.gif', 0)
    rx, ry, h = (b0[0] + b0[2]) / 2, b0[3] - 2, (b0[3] - b0[1] - 4) * UP
    for name, fi in PAPA.items():
        img, box = solo('papa_sheet_5.gif', fi)
        poses[name] = anchor(box, (rx, ry)) + [h]
        written.append(save(img, name))
    with open(os.path.join(ROOT, 'src', '40-fox-poses.js'), 'w') as f:
        f.write('// written by tools/fox_extract.py: for every pose, where the feet are in the picture\n')
        f.write('// (x, y) and how tall the character stands, all in picture pixels\n')
        f.write('const FOX_POSES = {\n')
        for k, v in poses.items():
            f.write(f"  '{k}': [{v[0]}, {v[1]}, {v[2]}],\n")
        f.write('};\n')
    for name in PROPS:
        written.append(save(prop(name)[0], name))
    boxes = {}
    for name in BOXED:
        img, box = boxed(name)
        boxes[name] = box
        written.append(save(img, name))
    # where the bow tie sits on the bear (so it can flutter in place), in bear-picture pixels
    bb, tb = boxes['bear'], boxes['bear-bowtie']
    with open(os.path.join(ROOT, 'src', '40-fox-poses.js'), 'a') as f:
        f.write(f"const FOX_BOWTIE = [{(tb[0] - bb[0]) * UP}, {(tb[1] - bb[1]) * UP}];  // its top-left on the bear picture\n")
    bgs = [background('kitchen', 'kitchen_background.gif', 'bg-fox-kitchen.jpg'), bedroom('bg-fox-bedroom.jpg')]
    for name in SCENES:
        bgs += scene(name)
    if review:
        os.makedirs(review, exist_ok=True)
        for src in ['family_take_a.gif', 'family_take_b.gif']:
            fr = frames(src)
            for who in CAST:
                cells = [cutout(a, split_family(a)[who])[0] for a in fr]
                w = max(c.width for c in cells); h = max(c.height for c in cells)
                sheet = Image.new('RGBA', (w * 9, h), (200, 220, 200, 255))
                for i, c in enumerate(cells):
                    sheet.alpha_composite(c, (i * w + (w - c.width) // 2, h - c.height))
                sheet.convert('RGB').save(os.path.join(review, f'{src[:-4]}-{who}.png'))
    bad = check(written + bgs)
    print(f'wrote {len(written)} sprites; {bad} with magenta left')
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
