import re

with open('src/scenes/Game.js', 'r', encoding='utf-8') as f:
    code = f.read()

anim_regex = r'    animateCardMovement\(element, fromStr, toStr, who = \'player\', onComplete = null\) \{.*?\n    \}\n'

anim_replacement = '''    animateCardMovement(element, fromStr, toStr, who = 'player', onComplete = null) {
        if (!element) {
            if (onComplete) onComplete();
            return;
        }
        
        if (toStr === 'hand') {
            if (who === 'player') {
                this.playerIncomingHandCards = (this.playerIncomingHandCards || 0) + 1;
            } else {
                this.aiIncomingHandCards = (this.aiIncomingHandCards || 0) + 1;
            }
        } else if (toStr === 'board') {
            if (who === 'player') {
                this.playerIncomingBoardCards = (this.playerIncomingBoardCards || 0) + 1;
            } else {
                this.aiIncomingBoardCards = (this.aiIncomingBoardCards || 0) + 1;
            }
        }
        
        const w = this.scale.width;
        const h = this.scale.height;
        
        const getZoneCoords = (zone, player) => {
            if (zone === 'deck') return { x: w / 2 - 180, y: h / 2 + 35 };
            if (zone === 'discard') return { x: w / 2 + 140, y: h / 2 + 35 };
            
            // Map who parameter ('player' / 'ai') to a pid
            let pid = player;
            if (player === 'player') {
                pid = this.myRole === 'host' || this.mode !== 'online' ? 'player' : this.myRole;
            } else if (player === 'ai') {
                pid = this.playerIds.find(p => p !== (this.myRole === 'host' || this.mode !== 'online' ? 'player' : this.myRole)) || this.playerIds[1];
            }
            // If they passed a direct pid (like guest1) it stays as is
            
            const char = this.players[pid];
            const pGroup = this.playerGroups[pid];
            if (!char || !pGroup || !pGroup.zone) return { x: w / 2, y: h / 2 };
            
            const pos = this.getPlayerPositionIndex(pid);
            const zx = pGroup.zone.x;
            const zy = pGroup.zone.y;
            
            if (zone === 'hand') {
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
            }
            if (zone === 'board') {
                const count = Math.max(0, char.board.length - 1);
                let x = 0, y = 0;
                const startX = 60;
                const spaceX = 90;
                if (pos === 0 || pos === 2) {
                    x = zx + startX + count * spaceX;
                    y = zy + (pos === 0 ? -30 : 110);
                } else {
                    y = zy + startX + count * spaceX;
                    x = zx + (pos === 1 ? 110 : -110);
                }
                return { x, y };
            }
            return { x: w / 2, y: h / 2 };
        };

        const start = getZoneCoords(fromStr, who);
        const end = getZoneCoords(toStr, who);

        const card = this.add.image(start.x, start.y, `card_${element}`)
            .setScale(0.8)
            .setDepth(3000);

        this.tweens.add({
            targets: card,
            x: end.x,
            y: end.y,
            duration: 400,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                if (toStr === 'hand') {
                    if (who === 'player') {
                        this.playerIncomingHandCards = Math.max(0, this.playerIncomingHandCards - 1);
                    } else {
                        this.aiIncomingHandCards = Math.max(0, this.aiIncomingHandCards - 1);
                    }
                    this.updatePlayerHandDisplay(who);
                } else if (toStr === 'board') {
                    if (who === 'player') {
                        this.playerIncomingBoardCards = Math.max(0, this.playerIncomingBoardCards - 1);
                    } else {
                        this.aiIncomingBoardCards = Math.max(0, this.aiIncomingBoardCards - 1);
                    }
                    this.updatePlayerBoardDisplay(who);
                }

                if (onComplete) onComplete();
                card.destroy();
            }
        });
    }
'''

code = re.sub(anim_regex, anim_replacement, code, flags=re.DOTALL)

with open('src/scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated animateCardMovement")
