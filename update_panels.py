import re

# 1. Update Game.js
with open('src/scenes/Game.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix primedSpellPanel position
code = code.replace("this.primedSpellPanel = this.add.container(w - 460, h - 180).setVisible(false);", "this.primedSpellPanel = this.add.container(w - 550, h - 180).setVisible(false);")

# Update viewportHeight in Game.js scrolling functions
code = code.replace("const viewportHeight = 360;", "const viewportHeight = 180;")
code = code.replace("const maxHandleTravel = 360 - handleHeight;", "const maxHandleTravel = 180 - handleHeight;")

with open('src/scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(code)

# 2. Update DuelHistory.js
with open('src/ui/DuelHistory.js', 'r', encoding='utf-8') as f:
    code = f.read()

old_draw = '''    drawActionLog() {
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
        maskShape.fillRoundedRect(28, h - 390, 324, 360, 8);
        const mask = maskShape.createGeometryMask();
        this.scene.logScrollContainer.setMask(mask);'''

new_draw = '''    drawActionLog() {
        const w = this.scene.scale.width;
        const h = this.scene.scale.height;
        this.titleText = this.scene.add.text(60, h - 225, 'DUEL HISTORY:', {
            fontFamily: '"Inter", sans-serif',
            fontSize: '13px',
            fontWeight: '600',
            color: '#ffffff',
            letterSpacing: 1
        });

        this.scene.allLogTextLines = [];
        this.scene.logContainer = this.scene.add.container(60, h - 200);

        // Drawer backing
        const logBg = this.scene.add.graphics();
        logBg.fillStyle(0x1a1410, 0.8);
        logBg.lineStyle(1, 0x4a4a4a, 0.25);
        logBg.fillRoundedRect(0, 0, 240, 200, 8);
        logBg.strokeRoundedRect(0, 0, 240, 200, 8);
        this.scene.logContainer.add(logBg);

        // Scrolling container for log lines
        this.scene.logScrollContainer = this.scene.add.container(0, 0);
        this.scene.logContainer.add(this.scene.logScrollContainer);

        // Mask to restrict visible area to the inside of the history box
        // Viewport bounds: X = 60 + 8, Y = h - 200 + 10, Width = 224, Height = 180
        const maskShape = this.scene.make.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.fillRoundedRect(68, h - 190, 224, 180, 8);
        const mask = maskShape.createGeometryMask();
        this.scene.logScrollContainer.setMask(mask);'''

code = code.replace(old_draw, new_draw)

code = code.replace("const relativeX = pointer.x - 20;", "const relativeX = pointer.x - 60;")
code = code.replace("const relativeY = pointer.y - (h - 400);", "const relativeY = pointer.y - (h - 200);")
code = code.replace("if (relativeX >= 0 && relativeX <= 340 && relativeY >= 0 && relativeY <= 380)", "if (relativeX >= 0 && relativeX <= 240 && relativeY >= 0 && relativeY <= 200)")
code = code.replace("if (relativeX >= 320 && relativeX <= 338 && relativeY >= 10 && relativeY <= 370)", "if (relativeX >= 220 && relativeX <= 238 && relativeY >= 10 && relativeY <= 190)")
code = code.replace("const viewportHeight = 360;", "const viewportHeight = 180;")
code = code.replace("wordWrap: { width: 305 }", "wordWrap: { width: 205 }")

old_update_scroll = '''    updateScrollbar() {
        if (!this.scene.logScrollbarGraphics) return;

        this.scene.logScrollbarGraphics.clear();

        const viewportHeight = 360;
        const totalHeight = this.getLogTotalHeight();

        if (totalHeight <= viewportHeight) return;

        const handleHeight = Math.max(30, (viewportHeight / totalHeight) * viewportHeight);
        const maxScroll = viewportHeight - totalHeight;
        
        let scrollRatio = 0;
        if (maxScroll < 0) {
            scrollRatio = this.scene.logScrollContainer.y / maxScroll;
        }

        const handleTravel = viewportHeight - handleHeight;
        const handleY = 10 + (scrollRatio * handleTravel);

        this.scene.logScrollbarGraphics.fillStyle(0x333333, 0.8);
        this.scene.logScrollbarGraphics.fillRoundedRect(328, 10, 6, viewportHeight - 20, 3);

        this.scene.logScrollbarGraphics.fillStyle(0xa67032, 0.9);
        this.scene.logScrollbarGraphics.fillRoundedRect(328, handleY, 6, handleHeight, 3);
    }'''

new_update_scroll = '''    updateScrollbar() {
        if (!this.scene.logScrollbarGraphics) return;

        this.scene.logScrollbarGraphics.clear();

        const viewportHeight = 180;
        const totalHeight = this.getLogTotalHeight();

        if (totalHeight <= viewportHeight) return;

        const handleHeight = Math.max(30, (viewportHeight / totalHeight) * viewportHeight);
        const maxScroll = viewportHeight - totalHeight;
        
        let scrollRatio = 0;
        if (maxScroll < 0) {
            scrollRatio = this.scene.logScrollContainer.y / maxScroll;
        }

        const handleTravel = viewportHeight - handleHeight;
        const handleY = 10 + (scrollRatio * handleTravel);

        this.scene.logScrollbarGraphics.fillStyle(0x333333, 0.8);
        this.scene.logScrollbarGraphics.fillRoundedRect(228, 10, 6, viewportHeight - 20, 3);

        this.scene.logScrollbarGraphics.fillStyle(0xa67032, 0.9);
        this.scene.logScrollbarGraphics.fillRoundedRect(228, handleY, 6, handleHeight, 3);
    }'''

code = code.replace(old_update_scroll, new_update_scroll)

with open('src/ui/DuelHistory.js', 'w', encoding='utf-8') as f:
    f.write(code)
