with open('src/scenes/Game.js', 'r', encoding='utf-8') as f:
    code = f.read()

old_hand = '''        const totalW = Math.max(0, (char.hand.length - 1) * spaceX);
        char.hand.forEach((el, index) => {
            let x = 0, y = 0, angle = 0;
            if (pos === 0) {
                x = -totalW / 2 + index * spaceX;
                y = 90;
                angle = 0;
            } else if (pos === 2) {
                x = 150 - totalW / 2 + index * spaceX;
                y = 20;
                angle = 180;
            } else if (pos === 1) {
                y = 150 - totalW / 2 + index * spaceX;
                x = 0;
                angle = 90;
            } else if (pos === 3) {
                y = 150 - totalW / 2 + index * spaceX;
                x = 80;
                angle = -90;
            }'''

new_hand = '''        const count = char.hand.length;
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

assert old_hand in code, "ERROR: old hand text not found!"
code = code.replace(old_hand, new_hand)

# Also fix the hover tweens to work with curved y
code = code.replace(
    "y: pos === 0 ? y - 30 : y,",
    "y: y - 30,"
)
code = code.replace(
    "y: pos === 0 ? y : y,",
    "y: y,"
)

with open('src/scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(code)

# Bump cache
for fname in ['index.html', 'index_test.html']:
    with open(fname, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace('v=1.2.36', 'v=1.2.37')
    with open(fname, 'w', encoding='utf-8') as f:
        f.write(c)

print("Done!")
