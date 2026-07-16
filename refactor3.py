import re

with open('src/scenes/Game.js', 'r', encoding='utf-8') as f:
    code = f.read()

# I will replace updatePlayerHandDisplay, updateAIHandDisplay, updatePlayerBoardDisplay, updateAIBoardDisplay
# Note: they are currently very large functions. I will replace them entirely using regex.

hand_display_regex = r'    updatePlayerHandDisplay\(\) \{.*?\n    updateAIHandDisplay\(\) \{.*?\n    }\n'
board_display_regex = r'    updatePlayerBoardDisplay\(\) \{.*?\n    updateAIBoardDisplay\(\) \{.*?\n    }\n'

hand_replacement = '''    updatePlayerHandDisplay(pid) {
        if (!pid) return;
        const char = this.players[pid];
        const pos = this.getPlayerPositionIndex(pid);
        const pGroup = this.playerGroups[pid];
        
        if (pGroup.handGroup) {
            pGroup.handGroup.destroy(true);
        }

        pGroup.handGroup = this.add.group();
        const startX = 60;
        const spaceX = pos === 0 ? 90 : 60;

        char.hand.forEach((el, index) => {
            let x = 0, y = 0, angle = 0;
            if (pos === 0 || pos === 2) {
                x = startX + index * spaceX;
                y = pos === 0 ? 80 : 0;
                angle = pos === 0 ? 0 : 180;
            } else {
                y = startX + index * spaceX;
                x = pos === 1 ? 0 : 0;
                angle = pos === 1 ? 90 : -90;
            }

            const isLocal = pid === (this.myRole === 'host' || this.mode !== 'online' ? 'player' : this.myRole);
            const tex = isLocal ? `card_${el}` : 'card_back';
            const scaleAmt = isLocal ? 0.8 : 0.55;

            const cardObj = this.add.image(x, y, tex).setScale(scaleAmt).setAngle(angle);

            if (isLocal) {
                cardObj.setInteractive({ useHandCursor: true });
                const incoming = this.playerIncomingHandCards || 0;
                if (index >= char.hand.length - incoming) {
                    cardObj.setAlpha(0);
                }

                cardObj.on('pointerdown', () => {
                    if (this.phase === 'discard' || this.phase === 'discard_request_active') {
                        this.discardCardFromZone('hand', index, pid);
                    } else if (this.phase === 'action' && !this.manaPlacedThisTurn && this.turn === pid) {
                        this.playHandCardToBoard(index);
                    }
                });

                cardObj.on('pointerover', () => {
                    this.playSound('click');
                    this.tweens.add({
                        targets: cardObj,
                        y: pos === 0 ? 60 : y,
                        scaleX: 0.88,
                        scaleY: 0.88,
                        duration: 100,
                        ease: 'Quad.easeOut'
                    });
                });

                cardObj.on('pointerout', () => {
                    this.tweens.add({
                        targets: cardObj,
                        y: pos === 0 ? 80 : y,
                        scaleX: 0.8,
                        scaleY: 0.8,
                        duration: 100,
                        ease: 'Quad.easeOut'
                    });
                });
            }

            pGroup.zone.add(cardObj);
            pGroup.handGroup.add(cardObj);
        });
    }

'''

board_replacement = '''    updatePlayerBoardDisplay(pid) {
        if (!pid) return;
        const char = this.players[pid];
        const pos = this.getPlayerPositionIndex(pid);
        const pGroup = this.playerGroups[pid];
        
        if (pGroup.boardGroup) {
            pGroup.boardGroup.destroy(true);
        }

        pGroup.boardGroup = this.add.group();
        const startX = 60;
        const spaceX = 90;

        char.board.forEach((el, index) => {
            let x = 0, y = 0, angle = 0;
            if (pos === 0 || pos === 2) {
                x = startX + index * spaceX;
                y = pos === 0 ? -30 : 110;
                angle = pos === 0 ? 0 : 180;
            } else {
                y = startX + index * spaceX;
                x = pos === 1 ? 110 : -110;
                angle = pos === 1 ? 90 : -90;
            }

            const cardObj = this.add.image(x, y, `card_${el}`).setScale(0.8).setAngle(angle);

            const isLocal = pid === (this.myRole === 'host' || this.mode !== 'online' ? 'player' : this.myRole);
            if (isLocal) {
                cardObj.setInteractive({ useHandCursor: true });
                if (this.selectedBoardMana.includes(index)) {
                    cardObj.setTint(0x88ff88);
                    cardObj.y -= 15;
                } else {
                    cardObj.clearTint();
                }

                cardObj.on('pointerdown', () => {
                    if (this.phase === 'discard' || this.phase === 'discard_request_active') {
                        this.discardCardFromZone('board', index, pid);
                    } else if (this.phase === 'action' && this.turn === pid) {
                        const idx = this.selectedBoardMana.indexOf(index);
                        if (idx > -1) {
                            this.selectedBoardMana.splice(idx, 1);
                        } else {
                            this.selectedBoardMana.push(index);
                        }
                        this.updatePlayerBoardDisplay(pid);
                        this.updateComboPreview();
                    }
                });
            }

            pGroup.zone.add(cardObj);
            pGroup.boardGroup.add(cardObj);
        });
    }

'''

code = re.sub(hand_display_regex, hand_replacement, code, flags=re.DOTALL)
code = re.sub(board_display_regex, board_replacement, code, flags=re.DOTALL)

with open('src/scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated updatePlayerHandDisplay and updatePlayerBoardDisplay")
