import re
with open('src/ui/DuelHistory.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace hardcoded coords in DuelHistory
old_log = '''    drawActionLog() {
        const w = this.scene.scale.width;
        this.titleText = this.scene.add.text(w - 370, 25, 'DUEL HISTORY:', {
            fontFamily: '"Inter", sans-serif',
            fontSize: '13px',
            fontWeight: '600',
            color: '#1a1a1a',
            letterSpacing: 1
        });

        this.scene.allLogTextLines = [];
        this.scene.logContainer = this.scene.add.container(w - 370, 50);

        // Drawer backing
        const logBg = this.scene.add.graphics();
        logBg.fillStyle(0x1a1410, 0.8);
        logBg.lineStyle(1, 0x4a4a4a, 0.25);
        logBg.fillRoundedRect(0, 0, 340, 380, 8);
        logBg.strokeRoundedRect(0, 0, 340, 380, 8);
        this.scene.logContainer.add(logBg);

        // Scrolling container for log lines
        this.scene.logScrollContainer = this.scene.add.container(0, 0);
        this.scene.logContainer.add(this.scene.logScrollContainer);

        // Mask to restrict visible area to the inside of the history box
        // Viewport bounds: X = w - 370 + 8, Y = 50 + 10, Width = 324, Height = 360
        const maskShape = this.scene.make.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.fillRoundedRect(w - 370 + 8, 50 + 10, 324, 360, 8);'''

new_log = '''    drawActionLog() {
        const w = this.scene.scale.width;
        const h = this.scene.scale.height;
        this.titleText = this.scene.add.text(20, h - 425, 'DUEL HISTORY:', {
            fontFamily: '"Inter", sans-serif',
            fontSize: '13px',
            fontWeight: '600',
            color: '#ffffff',
            letterSpacing: 1
        });

        this.scene.allLogTextLines = [];
        this.scene.logContainer = this.scene.add.container(20, h - 400);

        // Drawer backing
        const logBg = this.scene.add.graphics();
        logBg.fillStyle(0x1a1410, 0.8);
        logBg.lineStyle(1, 0x4a4a4a, 0.25);
        logBg.fillRoundedRect(0, 0, 340, 380, 8);
        logBg.strokeRoundedRect(0, 0, 340, 380, 8);
        this.scene.logContainer.add(logBg);

        // Scrolling container for log lines
        this.scene.logScrollContainer = this.scene.add.container(0, 0);
        this.scene.logContainer.add(this.scene.logScrollContainer);

        // Mask to restrict visible area to the inside of the history box
        // Viewport bounds: X = 20 + 8, Y = h - 400 + 10, Width = 324, Height = 360
        const maskShape = this.scene.make.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.fillRoundedRect(28, h - 390, 324, 360, 8);'''
code = code.replace(old_log, new_log)

with open('src/ui/DuelHistory.js', 'w', encoding='utf-8') as f:
    f.write(code)


with open('src/scenes/Game.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Remove DuelHistory hiding in Game.js
code = code.replace('''        if (this.playerIds.length > 2) {
            this.duelHistory.setVisible(false);
        }''', '')

# 2. Fix primedSpellPanel position
code = code.replace("this.primedSpellPanel = this.add.container(20, h - 180).setVisible(false);", "this.primedSpellPanel = this.add.container(w - 460, h - 180).setVisible(false);")

# 3. Update Hand Mana Y offset for Bottom player (pos 0) from 20 to -20
# There are two places: updatePlayerHandDisplay and animateCardMovement
code = code.replace('''            if (pos === 0) {
                x = -totalW / 2 + index * spaceX;
                y = 20;
                angle = 0;''', '''            if (pos === 0) {
                x = -totalW / 2 + index * spaceX;
                y = -20;
                angle = 0;''')

# 4. Fix Names placement further outward
old_names = '''            let nx = 0, ny = 0;
            if (pos === 0) { nx = -100; ny = 175; }
            else if (pos === 1) { nx = 10; ny = -40; }
            else if (pos === 2) { nx = 120; ny = -60; }
            else if (pos === 3) { nx = 50; ny = -40; }'''

new_names = '''            let nx = 0, ny = 0;
            if (pos === 0) { nx = -100; ny = 140; }
            else if (pos === 1) { nx = 10; ny = -80; }
            else if (pos === 2) { nx = 100; ny = -110; }
            else if (pos === 3) { nx = 20; ny = -80; }'''
code = code.replace(old_names, new_names)

# 5. Fix Shields placement further outward
old_shields = '''            let sx = 0, sy = 0;
            if (pos === 0) { sx = 0; sy = 170; }
            else if (pos === 1) { sx = 0; sy = -70; }
            else if (pos === 2) { sx = 110; sy = -90; }
            else if (pos === 3) { sx = 40; sy = -70; }'''

new_shields = '''            let sx = 0, sy = 0;
            if (pos === 0) { sx = 0; sy = 135; }
            else if (pos === 1) { sx = 0; sy = -110; }
            else if (pos === 2) { sx = 90; sy = -140; }
            else if (pos === 3) { sx = 10; sy = -110; }'''
code = code.replace(old_shields, new_shields)

with open('src/scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(code)
