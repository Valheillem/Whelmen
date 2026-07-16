import re
with open('src/scenes/Game.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Revert left and right container Y back to h/2 - 50
code = code.replace(
    "else if (pos === 1) { containerX = 40; containerY = h / 2; } // Left",
    "else if (pos === 1) { containerX = 40; containerY = h / 2 - 50; } // Left"
)
code = code.replace(
    "else if (pos === 3) { containerX = w - 195; containerY = h / 2; } // Right",
    "else if (pos === 3) { containerX = w - 195; containerY = h / 2 - 50; } // Right"
)

with open('src/scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(code)

# Bump cache to 1.2.42
for fname in ['index.html', 'index_test.html']:
    with open(fname, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace('v=1.2.41', 'v=1.2.42')
    with open(fname, 'w', encoding='utf-8') as f:
        f.write(c)
