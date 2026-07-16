with open('src/scenes/Game.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Fix left/right fan directions - edges should go AWAY from sigil, cards face toward sigil
old_fan = '''            let x = 0, y = 0, angle = 0;
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

new_fan = '''            let x = 0, y = 0, angle = 0;
            if (pos === 0) {
                x = -totalW / 2 + index * spaceX;
                y = 90 + curveY;
                angle = rotDeg;
            } else if (pos === 2) {
                x = -totalW / 2 + index * spaceX;
                y = 20 - curveY;
                angle = 180 - rotDeg;
            } else if (pos === 1) {
                y = -totalW / 2 + index * spaceX;
                x = 30 - curveY;
                angle = 90 - rotDeg;
            } else if (pos === 3) {
                y = -totalW / 2 + index * spaceX;
                x = 50 + curveY;
                angle = -90 + rotDeg;
            }'''
code = code.replace(old_fan, new_fan)

# 2. Reduce rotation amount for smoother fan (outer cards less extreme)
code = code.replace("const rotAmount = 5;", "const rotAmount = 3;")

# 3. Move left/right containers down to center on sigil
code = code.replace(
    "else if (pos === 1) { containerX = 40; containerY = h / 2 - 150; } // Left",
    "else if (pos === 1) { containerX = 40; containerY = h / 2 - 50; } // Left"
)
code = code.replace(
    "else if (pos === 3) { containerX = w - 195; containerY = h / 2 - 50; } // Right",
    "else if (pos === 3) { containerX = w - 195; containerY = h / 2 - 50; } // Right"
)
# If the above didn't match (maybe it's still -150 for right):
code = code.replace(
    "else if (pos === 3) { containerX = w - 195; containerY = h / 2 - 150; } // Right",
    "else if (pos === 3) { containerX = w - 195; containerY = h / 2 - 50; } // Right"
)

# 4. Move left/right player names to ny = -150
old_names = '''            let nx = 0, ny = 0;
            if (pos === 0) { nx = 0; ny = 0; }
            else if (pos === 1) { nx = 10; ny = -180; }
            else if (pos === 2) { nx = -160; ny = 10; }
            else if (pos === 3) { nx = 30; ny = -180; }'''

new_names = '''            let nx = 0, ny = 0;
            if (pos === 0) { nx = 0; ny = 0; }
            else if (pos === 1) { nx = 10; ny = -150; }
            else if (pos === 2) { nx = -160; ny = 10; }
            else if (pos === 3) { nx = 30; ny = -150; }'''
code = code.replace(old_names, new_names)

# 5. Move shields to match names
old_shields = '''            let sx = 0, sy = 0;
            if (pos === 0) { sx = 0; sy = 155; }
            else if (pos === 1) { sx = 80; sy = -180; }
            else if (pos === 2) { sx = -160; sy = 35; }
            else if (pos === 3) { sx = 100; sy = -180; }'''

new_shields = '''            let sx = 0, sy = 0;
            if (pos === 0) { sx = 0; sy = 155; }
            else if (pos === 1) { sx = 80; sy = -150; }
            else if (pos === 2) { sx = -160; sy = 35; }
            else if (pos === 3) { sx = 100; sy = -150; }'''
code = code.replace(old_shields, new_shields)

with open('src/scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(code)

# 6. Extend Duel History width by 50% (240 -> 360)
with open('src/ui/DuelHistory.js', 'r', encoding='utf-8') as f:
    dh = f.read()

# Panel size: 240 -> 360
dh = dh.replace("logBg.fillRoundedRect(0, 0, 240, 200, 8);", "logBg.fillRoundedRect(0, 0, 360, 200, 8);")
dh = dh.replace("logBg.strokeRoundedRect(0, 0, 240, 200, 8);", "logBg.strokeRoundedRect(0, 0, 360, 200, 8);")

# Mask width: 224 -> 344
dh = dh.replace("maskShape.fillRoundedRect(68, h - 190, 224, 180, 8);", "maskShape.fillRoundedRect(68, h - 190, 344, 180, 8);")

# Hit test bounds: 240 -> 360
dh = dh.replace("if (relativeX >= 0 && relativeX <= 240 && relativeY >= 0 && relativeY <= 200)", "if (relativeX >= 0 && relativeX <= 360 && relativeY >= 0 && relativeY <= 200)")

# Scrollbar area: 220-238 -> 340-358
dh = dh.replace("if (relativeX >= 220 && relativeX <= 238 && relativeY >= 10 && relativeY <= 190)", "if (relativeX >= 340 && relativeX <= 358 && relativeY >= 10 && relativeY <= 190)")

# Word wrap: 205 -> 325
dh = dh.replace("wordWrap: { width: 205 }", "wordWrap: { width: 325 }")

# Scrollbar position: 228 -> 348
dh = dh.replace("this.scene.logScrollbarGraphics.fillRoundedRect(228, 10, 6, viewportHeight - 20, 3);", "this.scene.logScrollbarGraphics.fillRoundedRect(348, 10, 6, viewportHeight - 20, 3);")
dh = dh.replace("this.scene.logScrollbarGraphics.fillRoundedRect(228, handleY, 6, handleHeight, 3);", "this.scene.logScrollbarGraphics.fillRoundedRect(348, handleY, 6, handleHeight, 3);")

with open('src/ui/DuelHistory.js', 'w', encoding='utf-8') as f:
    f.write(dh)

# Bump cache
for fname in ['index.html', 'index_test.html']:
    with open(fname, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace('v=1.2.39', 'v=1.2.40')
    with open(fname, 'w', encoding='utf-8') as f:
        f.write(c)

print("Done!")
