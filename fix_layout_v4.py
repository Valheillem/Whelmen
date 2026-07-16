with open('src/scenes/Game.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Fix local player container - less shift
code = code.replace(
    "if (pos === 0) { containerX = w / 2 - 40; containerY = h - 195; } // Bottom",
    "if (pos === 0) { containerX = w / 2 - 20; containerY = h - 195; } // Bottom"
)
# Also fix top player to match
code = code.replace(
    "else if (pos === 2) { containerX = w / 2 - 40; containerY = 30; } // Top (mirrors bottom)",
    "else if (pos === 2) { containerX = w / 2 - 20; containerY = 30; } // Top (mirrors bottom)"
)

# 2. Fix fan directions for all non-local players + fix curve directions
old_hand_render = '''            let x = 0, y = 0, angle = 0;
            if (pos === 0) {
                x = -totalW / 2 + index * spaceX;
                y = 90 + curveY;
                angle = rotDeg;
            } else if (pos === 2) {
                x = -totalW / 2 + index * spaceX;
                y = 20 + curveY;
                angle = 180 - rotDeg;
            } else if (pos === 1) {
                y = -totalW / 2 + index * spaceX;
                x = 0 + curveY;
                angle = 90 - rotDeg;
            } else if (pos === 3) {
                y = -totalW / 2 + index * spaceX;
                x = 80 - curveY;
                angle = -90 + rotDeg;
            }'''

new_hand_render = '''            let x = 0, y = 0, angle = 0;
            if (pos === 0) {
                x = -totalW / 2 + index * spaceX;
                y = 90 + curveY;
                angle = rotDeg;
            } else if (pos === 2) {
                x = -totalW / 2 + index * spaceX;
                y = 20 - curveY;
                angle = 180 + rotDeg;
            } else if (pos === 1) {
                y = -totalW / 2 + index * spaceX;
                x = 30 + curveY;
                angle = 90 + rotDeg;
            } else if (pos === 3) {
                y = -totalW / 2 + index * spaceX;
                x = 50 - curveY;
                angle = -90 - rotDeg;
            }'''
code = code.replace(old_hand_render, new_hand_render)

# 3. Fix names: remove local player name, reposition others
old_names = '''            const isLocal = pos === 0;
            const displayName = isLocal ? 'YOU' : `PLAYER ${pid}`;
            let nx = 0, ny = 0;
            if (pos === 0) { nx = -150; ny = 160; }
            else if (pos === 1) { nx = -10; ny = -60; }
            else if (pos === 2) { nx = -60; ny = -40; }
            else if (pos === 3) { nx = 70; ny = -60; }'''

new_names = '''            const isLocal = pos === 0;
            const displayName = isLocal ? '' : `PLAYER ${pid}`;
            let nx = 0, ny = 0;
            if (pos === 0) { nx = -150; ny = 160; }
            else if (pos === 1) { nx = 10; ny = -totalW / 2 - 40; }
            else if (pos === 2) { nx = -totalW / 2 - 100; ny = 10; }
            else if (pos === 3) { nx = 30; ny = -totalW / 2 - 40; }'''
# But totalW isn't available there yet... we need a different approach.
# Let me just use fixed offsets that are far enough away.

new_names = '''            const isLocal = pos === 0;
            const displayName = isLocal ? '' : `PLAYER ${pid}`;
            let nx = 0, ny = 0;
            if (pos === 0) { nx = 0; ny = 0; }
            else if (pos === 1) { nx = 10; ny = -180; }
            else if (pos === 2) { nx = -160; ny = 10; }
            else if (pos === 3) { nx = 30; ny = -180; }'''
code = code.replace(old_names, new_names)

# 4. Fix shield positions to match new name positions
old_shields = '''            let sx = 0, sy = 0;
            if (pos === 0) { sx = 0; sy = 155; }
            else if (pos === 1) { sx = 0; sy = -90; }
            else if (pos === 2) { sx = -60; sy = -70; }
            else if (pos === 3) { sx = 10; sy = -90; }'''

new_shields = '''            let sx = 0, sy = 0;
            if (pos === 0) { sx = 0; sy = 155; }
            else if (pos === 1) { sx = 80; sy = -180; }
            else if (pos === 2) { sx = -160; sy = 35; }
            else if (pos === 3) { sx = 100; sy = -180; }'''
code = code.replace(old_shields, new_shields)

with open('src/scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(code)

# Bump cache
for fname in ['index.html', 'index_test.html']:
    with open(fname, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace('v=1.2.38', 'v=1.2.39')
    with open(fname, 'w', encoding='utf-8') as f:
        f.write(c)

print("Done!")
