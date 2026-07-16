import re
with open('src/scenes/Game.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Fix left and right hand fan directions
old_fan = '''            } else if (pos === 1) {
                y = -totalW / 2 + index * spaceX;
                x = 30 - curveY;
                angle = 90 - rotDeg;
            } else if (pos === 3) {
                y = -totalW / 2 + index * spaceX;
                x = 50 + curveY;
                angle = -90 + rotDeg;
            }'''

new_fan = '''            } else if (pos === 1) {
                y = -totalW / 2 + index * spaceX;
                x = 30 - curveY;
                angle = 90 + rotDeg;
            } else if (pos === 3) {
                y = -totalW / 2 + index * spaceX;
                x = 50 + curveY;
                angle = -90 - rotDeg;
            }'''
code = code.replace(old_fan, new_fan)

# 2. Move left and right hand containers down to h/2
code = code.replace(
    "else if (pos === 1) { containerX = 40; containerY = h / 2 - 50; } // Left",
    "else if (pos === 1) { containerX = 40; containerY = h / 2; } // Left"
)
code = code.replace(
    "else if (pos === 3) { containerX = w - 195; containerY = h / 2 - 50; } // Right",
    "else if (pos === 3) { containerX = w - 195; containerY = h / 2; } // Right"
)

# 3. Move top player's name to nx = -130
code = code.replace(
    "else if (pos === 2) { nx = -160; ny = 10; }",
    "else if (pos === 2) { nx = -130; ny = 10; }"
)

with open('src/scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(code)

# Bump cache to 1.2.41
for fname in ['index.html', 'index_test.html']:
    with open(fname, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace('v=1.2.40', 'v=1.2.41')
    with open(fname, 'w', encoding='utf-8') as f:
        f.write(c)
