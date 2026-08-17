"""
Repack oversized horizontal-strip spritesheets into multi-row grids.
Target: both dimensions ≤ MAX_DIM (4096px).

Phaser's spritesheet loader reads frames left-to-right, top-to-bottom,
so a grid layout is fully compatible with no game code changes needed.

Usage: python repack_spritesheets.py
"""

import math
import os
from PIL import Image

MAX_DIM = 4096
ASSETS_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets', 'spritesheets')

# Only the spritesheets currently loaded by the game (from Game.js spriteMeta)
SPRITE_META = [
    {'key': 'fire_arrow',    'w': 600,  'h': 320, 'f': 8},
    {'key': 'explosion_3',   'w': 496,  'h': 496, 'f': 8},
    {'key': 'earth_shield',  'w': 720,  'h': 720, 'f': 8},
    {'key': 'water1',        'w': 320,  'h': 180, 'f': 48},
    {'key': 'slash_2',       'w': 496,  'h': 496, 'f': 5},
    {'key': 'fire_spell',    'w': 640,  'h': 360, 'f': 8},
    {'key': 'earth_fissure', 'w': 800,  'h': 480, 'f': 8},
    {'key': 'wind_spell',    'w': 640,  'h': 360, 'f': 12},
    {'key': 'water6',        'w': 450,  'h': 300, 'f': 12},
    {'key': 'flame',         'w': 640,  'h': 640, 'f': 12},
    {'key': 'magic2',        'w': 496,  'h': 496, 'f': 6},
    {'key': 'slash_7',       'w': 496,  'h': 496, 'f': 10},
    {'key': 'water_shield',  'w': 720,  'h': 720, 'f': 8},
    {'key': 'typhoon',       'w': 800,  'h': 800, 'f': 12},
    {'key': 'ground_hit',    'w': 1200, 'h': 800, 'f': 8},
    {'key': 'leaf_shield',   'w': 720,  'h': 720, 'f': 16},
]


def needs_repack(meta):
    """Check if the horizontal strip exceeds MAX_DIM."""
    strip_width = meta['w'] * meta['f']
    return strip_width > MAX_DIM


def compute_grid(frame_w, frame_h, frame_count):
    """
    Compute optimal grid dimensions (cols, rows) such that:
      cols * frame_w <= MAX_DIM
      rows * frame_h <= MAX_DIM
      cols * rows >= frame_count
    """
    max_cols = MAX_DIM // frame_w
    if max_cols < 1:
        raise ValueError(f"Single frame {frame_w}px exceeds MAX_DIM {MAX_DIM}px — downscaling required")

    cols = min(max_cols, frame_count)
    rows = math.ceil(frame_count / cols)

    total_height = rows * frame_h
    if total_height > MAX_DIM:
        raise ValueError(
            f"Grid {cols}x{rows} = {cols * frame_w}x{total_height} exceeds MAX_DIM. "
            f"Frame size {frame_w}x{frame_h} with {frame_count} frames cannot fit in {MAX_DIM}x{MAX_DIM}."
        )

    return cols, rows


def extract_frames_from_image(img, frame_w, frame_h, frame_count):
    """Extract individual frames from a spritesheet image (handles both strip and grid layouts)."""
    img_w, img_h = img.size
    src_cols = img_w // frame_w
    
    frames = []
    for i in range(frame_count):
        src_col = i % src_cols
        src_row = i // src_cols
        x = src_col * frame_w
        y = src_row * frame_h
        frame = img.crop((x, y, x + frame_w, y + frame_h))
        frames.append(frame)
    
    return frames


def repack_spritesheet(meta):
    """Repack a single spritesheet from horizontal strip to grid layout."""
    key = meta['key']
    frame_w, frame_h, frame_count = meta['w'], meta['h'], meta['f']
    
    src_path = os.path.join(ASSETS_DIR, f'{key}.png')
    if not os.path.exists(src_path):
        print(f"  SKIP {key}.png -- file not found")
        return False

    img = Image.open(src_path)
    orig_w, orig_h = img.size
    
    # Check if already within limits
    if orig_w <= MAX_DIM and orig_h <= MAX_DIM:
        print(f"  OK   {key}.png -- already {orig_w}x{orig_h}, within {MAX_DIM}px limit")
        return False

    cols, rows = compute_grid(frame_w, frame_h, frame_count)
    new_w = cols * frame_w
    new_h = rows * frame_h
    
    print(f"  PACK {key}.png -- {orig_w}x{orig_h} -> {new_w}x{new_h} ({cols}cols x {rows}rows)")
    
    # Extract frames
    frames = extract_frames_from_image(img, frame_w, frame_h, frame_count)
    img.close()
    
    # Build new grid image
    new_img = Image.new('RGBA', (new_w, new_h), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        col = i % cols
        row = i // cols
        new_img.paste(frame, (col * frame_w, row * frame_h))
    
    # Backup original, then save
    backup_path = os.path.join(ASSETS_DIR, f'{key}_original_strip.png')
    if not os.path.exists(backup_path):
        os.rename(src_path, backup_path)
        print(f"         Backed up original to {key}_original_strip.png")
    else:
        os.remove(src_path)
    
    new_img.save(src_path, 'PNG', optimize=True)
    new_img.close()
    
    # Verify
    verify = Image.open(src_path)
    vw, vh = verify.size
    verify.close()
    assert vw <= MAX_DIM, f"Output width {vw} exceeds {MAX_DIM}!"
    assert vh <= MAX_DIM, f"Output height {vh} exceeds {MAX_DIM}!"
    print(f"         Verified: {vw}x{vh} OK")
    
    return True


def main():
    print(f"Repacking spritesheets to fit within {MAX_DIM}x{MAX_DIM}px...")
    print(f"Assets directory: {os.path.abspath(ASSETS_DIR)}")
    print()
    
    repacked = 0
    skipped = 0
    errors = 0
    
    for meta in SPRITE_META:
        if not needs_repack(meta):
            strip_w = meta['w'] * meta['f']
            print(f"  OK   {meta['key']}.png -- strip width {strip_w}px, within limit")
            skipped += 1
            continue
        
        try:
            if repack_spritesheet(meta):
                repacked += 1
            else:
                skipped += 1
        except Exception as e:
            print(f"  ERR  {meta['key']}.png -- {e}")
            errors += 1
    
    print()
    print(f"Done! Repacked: {repacked}, Skipped: {skipped}, Errors: {errors}")


if __name__ == '__main__':
    main()
