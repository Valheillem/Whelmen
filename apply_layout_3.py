import re
with open('src/scenes/Game.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Names rewrite
old_names = '''            const isLocal = pos === 0;
            const displayName = isLocal ? 'YOU' : `PLAYER ${pid}`;
            char.nameT = this.add.text(pos === 1 || pos === 3 ? 0 : (pos === 0 ? -150 : 60), pos === 2 ? 180 : (pos === 0 ? 120 : 0), displayName, {
                fontFamily: '"Outfit", sans-serif',
                fontSize: '18px',
                fontWeight: '800',
                color: '#ffffff'
            });
            if (pos === 1) { char.nameT.setAngle(-90); char.nameT.setPosition(-30, 150); }
            if (pos === 3) { char.nameT.setAngle(90); char.nameT.setPosition(150, 0); }'''

new_names = '''            const isLocal = pos === 0;
            const displayName = isLocal ? 'YOU' : `PLAYER ${pid}`;
            let nx = 0, ny = 0;
            if (pos === 0) { nx = -150; ny = 110; }
            else if (pos === 1) { nx = -10; ny = 20; }
            else if (pos === 2) { nx = 100; ny = -30; }
            else if (pos === 3) { nx = 70; ny = 20; }

            char.nameT = this.add.text(nx, ny, displayName, {
                fontFamily: '"Outfit", sans-serif',
                fontSize: '18px',
                fontWeight: '800',
                color: '#ffffff'
            });'''
code = code.replace(old_names, new_names)

# 2. Shields rewrite
old_shields = '''            const pIdx = this.playerIds.indexOf(pid);
            if (pIdx === 0) {
                // Bottom
                char.shieldG.fillRoundedRect(-80, 120, 140, 24, 6);
                char.shieldG.strokeRoundedRect(-80, 120, 140, 24, 6);
                char.shieldT.setPosition(-70, 124);
            } else if (pIdx === 2 || pIdx === 1) {
                // Top or side
                char.shieldG.fillRoundedRect(80, 0, 140, 24, 6);
                char.shieldG.strokeRoundedRect(80, 0, 140, 24, 6);
                char.shieldT.setPosition(90, 4);
            } else {
                char.shieldG.fillRoundedRect(80, 0, 140, 24, 6);
                char.shieldG.strokeRoundedRect(80, 0, 140, 24, 6);
                char.shieldT.setPosition(90, 4);
            }'''

new_shields = '''            const pos = this.getPlayerPositionIndex(pid);
            let sx = 0, sy = 0;
            if (pos === 0) { sx = 10; sy = 110; }
            else if (pos === 1) { sx = -10; sy = 45; }
            else if (pos === 2) { sx = 100; sy = -55; }
            else if (pos === 3) { sx = 70; sy = 45; }

            char.shieldG.fillRoundedRect(sx, sy, 140, 24, 6);
            char.shieldG.strokeRoundedRect(sx, sy, 140, 24, 6);
            char.shieldT.setPosition(sx + 10, sy + 4);'''
code = code.replace(old_shields, new_shields)

# 3. primedSpellPanel move
old_panel = "this.primedSpellPanel = this.add.container(80, h - 350).setVisible(false);"
new_panel = "this.primedSpellPanel = this.add.container(20, h - 180).setVisible(false);"
code = code.replace(old_panel, new_panel)

with open('src/scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(code)
