import re

with open('src/scenes/Game.js', 'r', encoding='utf-8') as f:
    code = f.read()

cast_spell_regex = r'        // Visual spell fire from player center to AI center.*?\}\);'

cast_spell_replacement = '''        // Target Selection
        const localPlayer = this.myRole === 'host' || this.mode !== 'online' ? 'player' : this.myRole;
        const opponents = this.playerIds.filter(p => p !== localPlayer);
        
        const finishCast = (targetId) => {
            this.duelHistory.logMessage(`${localPlayer.toUpperCase()} casts: ${spell.name} targeting ${targetId.toUpperCase()}!`);
            
            // Simple visual from local to target
            const w = this.scale.width;
            const h = this.scale.height;
            const targetPos = this.getPlayerPositionIndex(targetId);
            let tx = w/2, ty = h/2;
            if (targetPos === 1) { tx = 50; ty = h/2; }
            else if (targetPos === 2) { tx = w/2; ty = 50; }
            else if (targetPos === 3) { tx = w-50; ty = h/2; }
            
            this.triggerSpellVisual(spell, w / 2, h - 50, tx, ty, () => {
                this.combat.initiateAttack(localPlayer, targetId, spell);
            });
        };

        if (opponents.length === 1) {
            finishCast(opponents[0]);
        } else {
            // Need to select an opponent
            this.duelHistory.logMessage(`Select target for ${spell.name}...`);
            this.showTargetSelection(opponents, finishCast);
        }'''

code = re.sub(cast_spell_regex, cast_spell_replacement, code, flags=re.DOTALL)

# Add showTargetSelection function
target_selection_func = '''
    showTargetSelection(opponents, onSelect) {
        const w = this.scale.width;
        const h = this.scale.height;
        
        this.targetSelectionGroup = this.add.group();
        
        const bg = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.7).setInteractive();
        this.targetSelectionGroup.add(bg);
        
        const title = this.add.text(w/2, h/2 - 100, 'SELECT TARGET', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '32px',
            fontWeight: '800',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.targetSelectionGroup.add(title);
        
        opponents.forEach((oppId, i) => {
            const btnBg = this.add.rectangle(w/2, h/2 - 30 + i * 60, 200, 50, 0x222222).setInteractive({useHandCursor: true});
            btnBg.setStrokeStyle(2, 0xa67032);
            
            const btnText = this.add.text(w/2, h/2 - 30 + i * 60, `Target ${oppId.toUpperCase()}`, {
                fontFamily: '"Outfit", sans-serif',
                fontSize: '20px',
                fontWeight: '700',
                color: '#ffffff'
            }).setOrigin(0.5);
            
            btnBg.on('pointerdown', () => {
                this.targetSelectionGroup.destroy(true);
                onSelect(oppId);
            });
            
            this.targetSelectionGroup.add(btnBg);
            this.targetSelectionGroup.add(btnText);
        });
    }
'''

code = code.replace('    // --- COMBAT RESOLUTION & REACTION WINDOW ---', target_selection_func + '\n    // --- COMBAT RESOLUTION & REACTION WINDOW ---')

# We also need to fix `updatePlayerHandDisplay` and `updatePlayerBoardDisplay` in refactor3.py where it hardcoded 'player' in discardCardFromZone
# Let's replace 'player' with the local pid where relevant.
code = code.replace("this.discardCardFromZone('hand', index, 'player');", "this.discardCardFromZone('hand', index, pid);")
code = code.replace("this.discardCardFromZone('board', index, 'player');", "this.discardCardFromZone('board', index, pid);")


with open('src/scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated cast spell target selection")
