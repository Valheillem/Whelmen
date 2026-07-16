import re

with open('src/scenes/Game.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Container pos===0 to w/2
code = code.replace("if (pos === 0) { containerX = 0; containerY = h - 195; } // Bottom",
                    "if (pos === 0) { containerX = w / 2; containerY = h - 195; } // Bottom")

# 2. Name position
code = code.replace("char.nameT = this.add.text(pos === 1 || pos === 3 ? 0 : 60, pos === 2 ? 180 : (pos === 0 ? -60 : 0)",
                    "char.nameT = this.add.text(pos === 1 || pos === 3 ? 0 : (pos === 0 ? -150 : 60), pos === 2 ? 180 : (pos === 0 ? 140 : 0)")

# 3. Shield position
code = code.replace("char.shieldG.fillRoundedRect(80, 150, 140, 24, 6);", "char.shieldG.fillRoundedRect(-80, 140, 140, 24, 6);")
code = code.replace("char.shieldG.strokeRoundedRect(80, 150, 140, 24, 6);", "char.shieldG.strokeRoundedRect(-80, 140, 140, 24, 6);")
code = code.replace("char.shieldT.setPosition(90, 154);", "char.shieldT.setPosition(-70, 144);")

# 4. updatePlayerHandDisplay
old_hand = '''        char.hand.forEach((el, index) => {
            let x = 0, y = 0, angle = 0;
            if (pos === 0 || pos === 2) {
                x = startX + index * spaceX;
                y = pos === 0 ? 80 : 0;
                angle = pos === 0 ? 0 : 180;
            } else {
                y = startX + index * spaceX;
                x = pos === 1 ? 0 : 0;
                angle = pos === 1 ? 90 : -90;
            }'''
new_hand = '''        const totalW = Math.max(0, (char.hand.length - 1) * spaceX);
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
code = code.replace(old_hand, new_hand)

# 5. animateCardMovement hand coords
old_anim_hand = '''            if (zone === 'hand') {
                const count = Math.max(0, char.hand.length - 1);
                let x = 0, y = 0;
                const startX = 60;
                const spaceX = pos === 0 ? 90 : 60;
                if (pos === 0 || pos === 2) {
                    x = zx + startX + count * spaceX;
                    y = zy + (pos === 0 ? 80 : 0);
                } else {
                    y = zy + startX + count * spaceX;
                    x = zx + (pos === 1 ? 0 : 0);
                }
                return { x, y };
            }'''
new_anim_hand = '''            if (zone === 'hand') {
                const count = Math.max(0, char.hand.length - 1);
                let x = 0, y = 0;
                const spaceX = pos === 0 ? 90 : 60;
                const totalW = count * spaceX;
                if (pos === 0) {
                    x = zx - totalW / 2 + count * spaceX;
                    y = zy + 90;
                } else if (pos === 2) {
                    x = zx + 150 - totalW / 2 + count * spaceX;
                    y = zy + 20;
                } else if (pos === 1) {
                    y = zy + 150 - totalW / 2 + count * spaceX;
                    x = zx + 0;
                } else if (pos === 3) {
                    y = zy + 150 - totalW / 2 + count * spaceX;
                    x = zx + 80;
                }
                return { x, y };
            }'''
code = code.replace(old_anim_hand, new_anim_hand)

# 6. animateCardMovement board coords
old_anim_board = '''                if (pos === 0) {
                    x = centerX - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
                    y = centerY + 160;
                } else if (pos === 1) {
                    x = centerX + 180;
                    y = centerY - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
                } else if (pos === 2) {
                    x = centerX - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
                    y = centerY - 160;
                } else if (pos === 3) {
                    x = centerX - 180;
                    y = centerY - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
                }'''
new_anim_board = '''                if (pos === 0) {
                    x = centerX - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
                    y = centerY + 70;
                } else if (pos === 1) {
                    x = centerX - 110;
                    y = centerY - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
                } else if (pos === 2) {
                    x = centerX - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
                    y = centerY - 110;
                } else if (pos === 3) {
                    x = centerX + 80;
                    y = centerY - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
                }'''
code = code.replace(old_anim_board, new_anim_board)

# 7. opponent draw visibility
old_tex = '''        const start = getZoneCoords(fromStr, who);
        const end = getZoneCoords(toStr, who);

        const card = this.add.image(start.x, start.y, `card_${element}`)
            .setScale(0.8)
            .setDepth(3000);'''
new_tex = '''        const start = getZoneCoords(fromStr, who);
        const end = getZoneCoords(toStr, who);
        
        const isLocal = who === (this.myRole === 'host' || this.mode !== 'online' ? 'player' : this.myRole);
        let tex = `card_${element}`;
        if (!isLocal && toStr === 'hand' && fromStr === 'deck') {
            tex = 'card_back';
        }

        const card = this.add.image(start.x, start.y, tex)
            .setScale(0.8)
            .setDepth(3000);'''
code = code.replace(old_tex, new_tex)

# 8. HOW TO PLAY button move
old_btn = '''        this.btnHowToPlay = this.createActionButton(w - 180, h - 250, 'HOW TO PLAY', () => this.handleHowToPlayOption());
        this.btnSpellBook = this.createActionButton(w - 180, h - 190, 'SPELL BOOK', () => this.handleSpellBookOption());'''
new_btn = '''        const btnHowToPlayTop = this.add.text(w - 150, 25, 'HOW TO PLAY', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '16px',
            fontWeight: '600',
            color: '#ffffff',
            backgroundColor: 'rgba(13,11,28,0.85)',
            padding: { left: 8, right: 8, top: 4, bottom: 4 }
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
        btnHowToPlayTop.on('pointerover', () => { btnHowToPlayTop.setColor('#000000'); btnHowToPlayTop.setBackgroundColor('#ffffff'); });
        btnHowToPlayTop.on('pointerout', () => { btnHowToPlayTop.setColor('#ffffff'); btnHowToPlayTop.setBackgroundColor('rgba(13,11,28,0.85)'); });
        btnHowToPlayTop.on('pointerdown', () => this.handleHowToPlayOption());
        this.btnHowToPlay = btnHowToPlayTop;

        this.btnSpellBook = this.createActionButton(w - 180, h - 190, 'SPELL BOOK', () => this.handleSpellBookOption());'''
code = code.replace(old_btn, new_btn)


with open('src/scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(code)
