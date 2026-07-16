import re
with open('src/scenes/Game.js', 'r', encoding='utf-8') as f:
    code = f.read()

old_target_call = "this.showTargetSelection(opponents, finishCast);"
new_target_call = "this.enableTapTargeting(opponents, finishCast);"
code = code.replace(old_target_call, new_target_call)

old_showTargetSelection = '''    showTargetSelection(opponents, onSelect) {
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
    }'''

new_enableTapTargeting = '''    enableTapTargeting(opponents, onSelect) {
        const w = this.scale.width;
        const h = this.scale.height;
        
        this.targetSelectionGroup = this.add.group();
        
        // Dim the background slightly to focus attention
        const bg = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.5).setInteractive();
        this.targetSelectionGroup.add(bg);
        
        const title = this.add.text(w/2, h/2, 'TAP AN OPPONENT TO TARGET', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '28px',
            fontWeight: '800',
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        this.targetSelectionGroup.add(title);
        
        opponents.forEach(oppId => {
            const pos = this.getPlayerPositionIndex(oppId);
            let zx = 0, zy = 0, zw = 0, zh = 0;
            if (pos === 1) { zx = 100; zy = h/2; zw = 200; zh = 400; }
            else if (pos === 2) { zx = w/2; zy = 100; zw = 400; zh = 200; }
            else if (pos === 3) { zx = w - 100; zy = h/2; zw = 200; zh = 400; }
            
            const tapZone = this.add.rectangle(zx, zy, zw, zh, 0x55aaff, 0.0);
            tapZone.setInteractive({ useHandCursor: true });
            
            // Glowing border effect
            const border = this.add.graphics();
            border.lineStyle(4, 0x55aaff, 0.8);
            border.strokeRoundedRect(zx - zw/2, zy - zh/2, zw, zh, 15);
            
            this.tweens.add({
                targets: border,
                alpha: 0.2,
                duration: 800,
                yoyo: true,
                repeat: -1
            });
            
            tapZone.on('pointerover', () => {
                tapZone.fillAlpha = 0.2;
            });
            tapZone.on('pointerout', () => {
                tapZone.fillAlpha = 0.0;
            });
            
            tapZone.on('pointerdown', () => {
                this.targetSelectionGroup.destroy(true);
                onSelect(oppId);
            });
            
            this.targetSelectionGroup.add(tapZone);
            this.targetSelectionGroup.add(border);
        });
    }'''

code = code.replace(old_showTargetSelection, new_enableTapTargeting)

with open('src/scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(code)
