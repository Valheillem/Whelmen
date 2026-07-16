import re

with open('src/scenes/Game.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update updatePlayerBoardDisplay
board_display_regex = r'    updatePlayerBoardDisplay\(pid\) \{[\s\S]*?    pGroup\.boardGroup\.add\(cardObj\);\n        \}\);\n    \}'

board_display_replacement = '''    updatePlayerBoardDisplay(pid) {
        if (!pid) return;
        const char = this.players[pid];
        const pos = this.getPlayerPositionIndex(pid);
        const pGroup = this.playerGroups[pid];
        
        if (pGroup.boardGroup) {
            pGroup.boardGroup.destroy(true);
        }

        pGroup.boardGroup = this.add.group();

        const w = this.scale.width;
        const h = this.scale.height;
        const centerX = w / 2 - 20;
        const centerY = h / 2 - 40;

        const uniqueElements = [...new Set(char.board)];
        const spaceX = 75;

        uniqueElements.forEach((el, elIndex) => {
            const count = char.board.filter(b => b === el).length;
            const indicesForEl = [];
            char.board.forEach((bEl, i) => { if (bEl === el) indicesForEl.push(i); });

            let x = 0, y = 0, angle = 0;
            if (pos === 0) {
                x = centerX - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
                y = centerY + 160;
                angle = 0;
            } else if (pos === 1) {
                x = centerX + 180;
                y = centerY - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
                angle = 90;
            } else if (pos === 2) {
                x = centerX - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
                y = centerY - 160;
                angle = 180;
            } else if (pos === 3) {
                x = centerX - 180;
                y = centerY - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
                angle = -90;
            }

            const cardObj = this.add.image(x, y, `card_${el}`).setScale(0.8).setAngle(angle);

            let badgeBg, badgeTxt;
            if (count > 1) {
                let bx = x + 25, by = y - 35;
                if (pos === 1) { bx = x + 35; by = y + 25; }
                else if (pos === 2) { bx = x - 25; by = y + 35; }
                else if (pos === 3) { bx = x - 35; by = y - 25; }

                badgeBg = this.add.circle(bx, by, 12, 0xff0000).setDepth(10);
                badgeTxt = this.add.text(bx, by, count.toString(), {
                    fontFamily: '"Outfit", sans-serif',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#ffffff'
                }).setOrigin(0.5).setDepth(11);
            }

            const isLocal = pid === (this.myRole === 'host' || this.mode !== 'online' ? 'player' : this.myRole);
            if (isLocal) {
                cardObj.setInteractive({ useHandCursor: true });
                const selectedCount = indicesForEl.filter(i => this.selectedBoardMana.includes(i)).length;
                if (selectedCount > 0) {
                    cardObj.setTint(selectedCount === count ? 0x88ff88 : 0xffff88);
                    if (pos === 0) cardObj.y -= 15;
                    else if (pos === 1) cardObj.x -= 15;
                    else if (pos === 2) cardObj.y += 15;
                    else if (pos === 3) cardObj.x += 15;
                    
                    if (badgeBg) {
                        if (pos === 0) { badgeBg.y -= 15; badgeTxt.y -= 15; }
                        else if (pos === 1) { badgeBg.x -= 15; badgeTxt.x -= 15; }
                        else if (pos === 2) { badgeBg.y += 15; badgeTxt.y += 15; }
                        else if (pos === 3) { badgeBg.x += 15; badgeTxt.x += 15; }
                    }
                }

                cardObj.on('pointerdown', () => {
                    if (this.phase === 'discard' || this.phase === 'discard_request_active') {
                        this.discardCardFromZone('board', indicesForEl[0], pid);
                    } else if (this.phase === 'action' && this.turn === pid) {
                        if (selectedCount < count) {
                            const toSelect = indicesForEl.find(i => !this.selectedBoardMana.includes(i));
                            this.selectedBoardMana.push(toSelect);
                        } else {
                            indicesForEl.forEach(i => {
                                const idx = this.selectedBoardMana.indexOf(i);
                                if (idx > -1) this.selectedBoardMana.splice(idx, 1);
                            });
                        }
                        this.updatePlayerBoardDisplay(pid);
                        this.updateComboPreview();
                    }
                });
            }

            // DO NOT ADD TO pGroup.zone because we are using global center coordinates!
            pGroup.boardGroup.add(cardObj);
            if (badgeBg) pGroup.boardGroup.add(badgeBg);
            if (badgeTxt) pGroup.boardGroup.add(badgeTxt);
        });
    }'''

code = re.sub(board_display_regex, board_display_replacement, code)

# 2. Update playHandCardToBoard
play_regex = r'        // Apply state changes to calculate target layout\s*this\.player\.hand\.splice\(index, 1\);\s*this\.player\.board\.push\(el\);\s*const targetX = pGroup\.zone\.x \+ 60 \+ \(this\.player\.board\.length - 1\) \* 90;\s*const targetY = pGroup\.zone\.y - 30;'

play_replacement = '''        // Apply state changes to calculate target layout
        this.player.hand.splice(index, 1);
        this.player.board.push(el);

        const w = this.scale.width;
        const h = this.scale.height;
        const centerX = w / 2 - 20;
        const centerY = h / 2 - 40;
        const pos = this.getPlayerPositionIndex(localId);

        const uniqueElements = [...new Set(this.player.board)];
        const elIndex = uniqueElements.indexOf(el);
        const spaceX = 75;

        let targetX = 0, targetY = 0;
        if (pos === 0) {
            targetX = centerX - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
            targetY = centerY + 160;
        } else if (pos === 1) {
            targetX = centerX + 180;
            targetY = centerY - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
        } else if (pos === 2) {
            targetX = centerX - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
            targetY = centerY - 160;
        } else if (pos === 3) {
            targetX = centerX - 180;
            targetY = centerY - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
        }'''

code = re.sub(play_regex, play_replacement, code)

# 3. Update animateCardMovement
anim_regex = r'            if \(zone === \'board\'\) \{\s*const count = Math\.max\(0, char\.board\.length - 1\);\s*let x = 0, y = 0;\s*const startX = 60;\s*const spaceX = 90;\s*if \(pos === 0 \|\| pos === 2\) \{\s*x = zx \+ startX \+ count \* spaceX;\s*y = zy \+ \(pos === 0 \? -30 : 110\);\s*\} else \{\s*y = zy \+ startX \+ count \* spaceX;\s*x = zx \+ \(pos === 1 \? 110 : -110\);\s*\}\s*return \{ x, y \};\s*\}'

anim_replacement = '''            if (zone === 'board') {
                const centerX = w / 2 - 20;
                const centerY = h / 2 - 40;
                const uniqueElements = [...new Set(char.board)];
                let elIndex = uniqueElements.indexOf(element);
                if (elIndex === -1) elIndex = 0;
                const spaceX = 75;

                let x = 0, y = 0;
                if (pos === 0) {
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
                }
                return { x, y };
            }'''

code = re.sub(anim_regex, anim_replacement, code)


with open('src/scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated board mana stacking logic and positioning")
