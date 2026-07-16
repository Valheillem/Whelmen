with open('src/scenes/Game.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update container positions:
#    - Move local player (pos 0) left to center on sigil
#    - Center top player (pos 2) to mirror local player
old_containers = '''            if (pos === 0) { containerX = w / 2; containerY = h - 195; } // Bottom
            else if (pos === 1) { containerX = 40; containerY = h / 2 - 150; } // Left
            else if (pos === 2) { containerX = 0; containerY = 30; } // Top
            else if (pos === 3) { containerX = w - 195; containerY = h / 2 - 150; } // Right'''

new_containers = '''            if (pos === 0) { containerX = w / 2 - 40; containerY = h - 195; } // Bottom
            else if (pos === 1) { containerX = 40; containerY = h / 2 - 150; } // Left
            else if (pos === 2) { containerX = w / 2 - 40; containerY = 30; } // Top (mirrors bottom)
            else if (pos === 3) { containerX = w - 195; containerY = h / 2 - 150; } // Right'''
code = code.replace(old_containers, new_containers)

# 2. Update hand rendering: tighter spacing, fix angles for top/right
old_hand_render = '''        pGroup.handGroup = this.add.group();
        const startX = 60;
        const spaceX = pos === 0 ? 90 : 60;

        const count = char.hand.length;
        const totalW = Math.max(0, (count - 1) * spaceX);
        const middle = (count - 1) / 2;
        const curveAmount = 6;
        const rotAmount = 4;

        char.hand.forEach((el, index) => {
            const t = index - middle;
            const curveY = Math.abs(t) * Math.abs(t) * curveAmount;
            const rotDeg = t * rotAmount;

            let x = 0, y = 0, angle = 0;
            if (pos === 0) {
                x = -totalW / 2 + index * spaceX;
                y = 90 + curveY;
                angle = rotDeg;
            } else if (pos === 2) {
                x = 150 - totalW / 2 + index * spaceX;
                y = 20 - curveY;
                angle = 180 + rotDeg;
            } else if (pos === 1) {
                y = 150 - totalW / 2 + index * spaceX;
                x = 0 - curveY;
                angle = 90 + rotDeg;
            } else if (pos === 3) {
                y = 150 - totalW / 2 + index * spaceX;
                x = 80 + curveY;
                angle = -90 + rotDeg;
            }'''

new_hand_render = '''        pGroup.handGroup = this.add.group();
        const startX = 60;
        const spaceX = pos === 0 ? 55 : 40;

        const count = char.hand.length;
        const totalW = Math.max(0, (count - 1) * spaceX);
        const middle = (count - 1) / 2;
        const curveAmount = 4;
        const rotAmount = 5;

        char.hand.forEach((el, index) => {
            const t = index - middle;
            const curveY = Math.abs(t) * Math.abs(t) * curveAmount;
            const rotDeg = t * rotAmount;

            let x = 0, y = 0, angle = 0;
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
code = code.replace(old_hand_render, new_hand_render)

# 3. Fix name positions so they don't clip into the hand
old_names = '''            let nx = 0, ny = 0;
            if (pos === 0) { nx = -150; ny = 110; }
            else if (pos === 1) { nx = -10; ny = 20; }
            else if (pos === 2) { nx = 100; ny = -30; }
            else if (pos === 3) { nx = 70; ny = 20; }'''

new_names = '''            let nx = 0, ny = 0;
            if (pos === 0) { nx = -150; ny = 160; }
            else if (pos === 1) { nx = -10; ny = -60; }
            else if (pos === 2) { nx = -60; ny = -40; }
            else if (pos === 3) { nx = 70; ny = -60; }'''
code = code.replace(old_names, new_names)

# 4. Fix shield positions to match names
old_shields = '''            let sx = 0, sy = 0;
            if (pos === 0) { sx = 0; sy = 135; }
            else if (pos === 1) { sx = 0; sy = -110; }
            else if (pos === 2) { sx = 90; sy = -140; }
            else if (pos === 3) { sx = 10; sy = -110; }'''

new_shields = '''            let sx = 0, sy = 0;
            if (pos === 0) { sx = 0; sy = 155; }
            else if (pos === 1) { sx = 0; sy = -90; }
            else if (pos === 2) { sx = -60; sy = -70; }
            else if (pos === 3) { sx = 10; sy = -90; }'''
code = code.replace(old_shields, new_shields)

# 5. Update the animation start position to match new spacing
code = code.replace(
    "const handSpaceX = posIndex === 0 ? 90 : 60;",
    "const handSpaceX = posIndex === 0 ? 55 : 40;"
)

with open('src/scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(code)

# Bump cache
for fname in ['index.html', 'index_test.html']:
    with open(fname, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace('v=1.2.37', 'v=1.2.38')
    with open(fname, 'w', encoding='utf-8') as f:
        f.write(c)

print("Done!")
