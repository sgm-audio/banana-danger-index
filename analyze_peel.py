"""Analyze the banana peel reference image for canvas replication."""
from PIL import Image
import numpy as np

img = Image.open("banana peel.jpg").convert("RGB")
arr = np.array(img)
h, w, _ = arr.shape
print(f"Size: {w}x{h}")

# Find bounding box of non-white pixels
mask = np.any(arr < 200, axis=2)
rows, cols = np.where(mask)
y1, y2 = int(rows.min()), int(rows.max())
x1, x2 = int(cols.min()), int(cols.max())
print(f"Bounding box: ({x1},{y1}) to ({x2},{y2})")

peel = arr[y1:y2+1, x1:x2+1]
ph, pw, _ = peel.shape
print(f"Crop: {pw}x{ph}")

# Shape analysis - scan rows for width
print("\n=== SHAPE (pixel widths per row) ===")
for y in range(0, ph, max(1, ph // 15)):
    row = peel[y]
    non_white = np.any(row < 200, axis=1)
    if non_white.any():
        left = int(np.where(non_white)[0][0])
        right = int(np.where(non_white)[0][-1])
        width = right - left
        center_px = row[(left + right) // 2]
        print(f"  y={y:4d}: left={left:4d}, right={right:4d}, width={width:4d}, center=rgb({center_px[0]},{center_px[1]},{center_px[2]})")

# Vertical slice analysis at 10 key x-positions
print("\n=== VERTICAL PROFILES at key x positions ===")
for x_pct in [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95]:
    x = int(pw * x_pct)
    if x >= pw: x = pw - 1
    col = peel[:, x]
    non_white = np.any(col < 200, axis=1)
    if non_white.any():
        top = int(np.where(non_white)[0][0])
        bot = int(np.where(non_white)[0][-1])
        mid_color = col[(top + bot) // 2]
        print(f"  x={x:4d} ({x_pct:.0%}): top={top:4d}, bot={bot:4d}, height={bot-top:4d}, mid=rgb({mid_color[0]},{mid_color[1]},{mid_color[2]})")

# Extract the 5 key color zones
print("\n=== COLOR ANALYSIS ===")
peel_pixels = peel.reshape(-1, 3)
# Remove near-white background
bg = (peel_pixels[:, 0] > 248) & (peel_pixels[:, 1] > 248) & (peel_pixels[:, 2] > 248)
peel_only = peel_pixels[~bg]
print(f"Peel pixels: {len(peel_only)}")

# Find highlight yellow (brightest)
bright = peel_only[(peel_only[:, 0] > 245) & (peel_only[:, 1] > 215) & (peel_only[:, 2] < 130)]
if len(bright) > 0:
    avg = bright.mean(axis=0).astype(int)
    print(f"Highlight yellow: rgb({avg[0]},{avg[1]},{avg[2]}) #{avg[0]:02x}{avg[1]:02x}{avg[2]:02x}")

# Mid yellow
mid = peel_only[(peel_only[:, 0] > 220) & (peel_only[:, 1] > 175) & (peel_only[:, 1] < 230) & (peel_only[:, 2] < 120)]
if len(mid) > 0:
    avg = mid.mean(axis=0).astype(int)
    print(f"Mid yellow:       rgb({avg[0]},{avg[1]},{avg[2]}) #{avg[0]:02x}{avg[1]:02x}{avg[2]:02x}")

# Dark yellow
dark = peel_only[(peel_only[:, 0] > 180) & (peel_only[:, 0] < 235) & (peel_only[:, 1] > 140) & (peel_only[:, 1] < 210) & (peel_only[:, 2] < 100)]
if len(dark) > 0:
    avg = dark.mean(axis=0).astype(int)
    print(f"Dark yellow:      rgb({avg[0]},{avg[1]},{avg[2]}) #{avg[0]:02x}{avg[1]:02x}{avg[2]:02x}")

# Inner/white part
inner = peel_only[(peel_only[:, 0] > 240) & (peel_only[:, 1] > 230) & (peel_only[:, 2] > 180)]
if len(inner) > 0:
    avg = inner.mean(axis=0).astype(int)
    print(f"Inner cream:      rgb({avg[0]},{avg[1]},{avg[2]}) #{avg[0]:02x}{avg[1]:02x}{avg[2]:02x}")

# Brown spots
brown = peel_only[(peel_only[:, 0] < 170) & (peel_only[:, 1] < 130) & (peel_only[:, 2] < 100)]
if len(brown) > 0:
    avg = brown.mean(axis=0).astype(int)
    print(f"Brown spots:      rgb({avg[0]},{avg[1]},{avg[2]}) #{avg[0]:02x}{avg[1]:02x}{avg[2]:02x}")
    # Find locations of brown spots
    brown_mask = (peel[:,:,0] < 170) & (peel[:,:,1] < 130) & (peel[:,:,2] < 100)
    ys, xs = np.where(brown_mask)
    if len(ys) > 10:
        print(f"  Brown spot count: {len(ys)}")
        # Cluster them
        spot_coords = list(zip(xs, ys))
        # Show a few representative spots
        for i in range(min(5, len(spot_coords))):
            ix = xs[i]
            iy = ys[i]
            c = peel[iy, ix]
            print(f"  Spot at ({ix},{iy}): rgb({c[0]},{c[1]},{c[2]})")

# Shadow underneath
print("\n=== SHADOW (gray area under peel) ===")
shadow = peel_only[(peel_only[:, 0] > 150) & (peel_only[:, 0] < 220) & (peel_only[:, 1] > 150) & (peel_only[:, 1] < 220) & (peel_only[:, 2] > 150) & (peel_only[:, 2] < 220)]
if len(shadow) > 0:
    avg = shadow.mean(axis=0).astype(int)
    print(f"Shadow gray:      rgb({avg[0]},{avg[1]},{avg[2]}) #{avg[0]:02x}{avg[1]:02x}{avg[2]:02x}")

# Horizontal color gradient (left to right)
print("\n=== HORIZONTAL COLOR GRADIENT ===")
for x_pct in [0.1, 0.3, 0.5, 0.7, 0.9]:
    x = int(pw * x_pct)
    if x >= pw: x = pw - 1
    # Sample middle 60% of vertical area
    y_top = int(ph * 0.2)
    y_bot = int(ph * 0.8)
    strip = peel[y_top:y_bot, x]
    avg = strip.mean(axis=0).astype(int)
    print(f"  x={x:4d} ({x_pct:.0%}): avg=rgb({avg[0]},{avg[1]},{avg[2]})")

# Stem analysis
print("\n=== STEM (leftmost pixels) ===")
stem_region = peel[:, :int(pw*0.12), :]
stem_mask = (stem_region[:,:,0] < 180) & (stem_region[:,:,1] < 160) & (stem_region[:,:,2] < 100)
if stem_mask.any():
    stem_px = stem_region[stem_mask]
    avg = stem_px.mean(axis=0).astype(int)
    print(f"  Average stem: rgb({avg[0]},{avg[1]},{avg[2]})")
    ys, xs = np.where(stem_mask)
    print(f"  Stem pixels: {len(ys)}")
    # Show extremes
    print(f"  Stem x range: {xs.min()} to {xs.max()}")
    print(f"  Stem y range: {ys.min()} to {ys.max()}")

# Brown tip analysis
print("\n=== BROWN TIP (rightmost pixels) ===")
tip_region = peel[:, int(pw*0.75):, :]
tip_mask = (tip_region[:,:,0] < 200) & (tip_region[:,:,1] < 180) & (tip_region[:,:,2] < 140) & (tip_region[:,:,0] > 40)
if tip_mask.any():
    tip_px = tip_region[tip_mask]
    avg = tip_px.mean(axis=0).astype(int)
    print(f"  Average tip: rgb({avg[0]},{avg[1]},{avg[2]})")
    ys, xs = np.where(tip_mask)
    print(f"  Tip pixels: {len(ys)}")

PYEOF
