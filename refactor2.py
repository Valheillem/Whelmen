import re

with open('src/scenes/Game.js', 'r', encoding='utf-8') as f:
    code = f.read()

# I will replace drawPlayerStats and drawAIStats with drawAllStats
code = re.sub(r'    drawPlayerStats\(\) \{.*?\n    }\n\n    createTopRightUI\(\) \{', 
              r'    createTopRightUI() {', code, flags=re.DOTALL)
code = re.sub(r'    drawAIStats\(\) \{.*?\n    }\n\n', '', code, flags=re.DOTALL)

# In create(), replace this.drawPlayerStats() and this.drawAIStats() with this.drawAllStats()
code = code.replace('this.drawPlayerStats();\n        this.drawAIStats();', 'this.drawAllStats();')

# Generate drawAllStats
draw_all_stats = '''
    getPlayerPositionIndex(pid) {
        const localId = this.myRole === 'host' || this.mode !== 'online' ? 'player' : this.myRole;
        if (pid === localId) return 0;
        
        let localIdx = this.playerIds.indexOf(localId);
        if (localIdx === -1) localIdx = 0; // Fallback
        let pidIdx = this.playerIds.indexOf(pid);
        
        // Return 0 for bottom, 1 for left, 2 for top, 3 for right
        let diff = (pidIdx - localIdx + this.playerIds.length) % this.playerIds.length;
        if (this.playerIds.length === 2 && diff === 1) return 2; // In 1v1, opponent is top
        return diff;
    }

    drawAllStats() {
        const w = this.scale.width;
        const h = this.scale.height;
        this.playerGroups = {};

        this.playerIds.forEach(pid => {
            const char = this.players[pid];
            const pos = this.getPlayerPositionIndex(pid);
            
            let containerX = 0, containerY = 0;
            if (pos === 0) { containerX = 0; containerY = h - 195; } // Bottom
            else if (pos === 1) { containerX = 40; containerY = h / 2 - 150; } // Left
            else if (pos === 2) { containerX = 0; containerY = 30; } // Top
            else if (pos === 3) { containerX = w - 195; containerY = h / 2 - 150; } // Right

            const zone = this.add.container(containerX, containerY);
            
            char.shieldG = this.add.graphics();
            zone.add(char.shieldG);

            char.shieldT = this.add.text(0, 0, '', {
                fontFamily: '"Outfit", sans-serif',
                fontSize: '16px',
                fontWeight: '700',
                color: '#a67032'
            });
            zone.add(char.shieldT);

            // Name highlight
            char.nameHighlightG = this.add.graphics();
            zone.add(char.nameHighlightG);
            
            const isLocal = pos === 0;
            const displayName = isLocal ? 'YOU' : `PLAYER ${pid}`;
            char.nameT = this.add.text(pos === 1 || pos === 3 ? 0 : 60, pos === 2 ? 180 : (pos === 0 ? -60 : 0), displayName, {
                fontFamily: '"Outfit", sans-serif',
                fontSize: '18px',
                fontWeight: '800',
                color: '#ffffff'
            });
            if (pos === 1) { char.nameT.setAngle(-90); char.nameT.setPosition(-30, 150); }
            if (pos === 3) { char.nameT.setAngle(90); char.nameT.setPosition(150, 0); }
            
            zone.add(char.nameT);

            this.playerGroups[pid] = { zone: zone, handGroup: null, boardGroup: null };
        });
    }

    updateTurnHighlights() {
        this.playerIds.forEach(pid => {
            const char = this.players[pid];
            const pos = this.getPlayerPositionIndex(pid);
            char.nameHighlightG.clear();
            if (this.turn === pid) {
                char.nameHighlightG.fillStyle(0xd4af37, 0.4);
                char.nameHighlightG.fillRoundedRect(char.nameT.x - 10, char.nameT.y - 10, char.nameT.width + 20, char.nameT.height + 20, 6);
            }
        });
    }
'''

code = code.replace('    createTopRightUI() {', draw_all_stats + '\n    createTopRightUI() {')

with open('src/scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated drawAllStats in Game.js")
