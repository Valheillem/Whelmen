import re
import os

with open('src/scenes/Game.js', 'r', encoding='utf-8') as f:
    code = f.read()

# I will just write some regex replacements to generalize the methods
# First, updatePlayerLifeDisplay & updateAILifeDisplay
code = re.sub(
    r'    updatePlayerLifeDisplay\(\) \{.*?\}\n\n    updateAILifeDisplay\(\) \{.*?\}',
    '''    updatePlayerLifeDisplay(pid) {
        if (!pid) return;
        const char = this.players[pid];
        char.life = char.hand.length + char.board.length;
    }''',
    code,
    flags=re.DOTALL
)

# Replace updateShieldDisplay
code = re.sub(
    r'    updateShieldDisplay\(who\) \{.*?\}',
    '''    updateShieldDisplay(pid) {
        if (!pid) return;
        const char = this.players[pid];
        if (!char.shieldG) return;
        char.shieldG.clear();
        if (char.shield > 0) {
            char.shieldG.fillStyle(0xa67032, 0.15);
            char.shieldG.lineStyle(2, 0xa67032, 0.7);
            
            const pIdx = this.playerIds.indexOf(pid);
            if (pIdx === 0) {
                // Bottom
                char.shieldG.fillRoundedRect(80, 150, 140, 24, 6);
                char.shieldG.strokeRoundedRect(80, 150, 140, 24, 6);
                char.shieldT.setPosition(90, 154);
            } else if (pIdx === 2 || pIdx === 1) {
                // Top or side
                char.shieldG.fillRoundedRect(80, 0, 140, 24, 6);
                char.shieldG.strokeRoundedRect(80, 0, 140, 24, 6);
                char.shieldT.setPosition(90, 4);
            } else {
                char.shieldG.fillRoundedRect(80, 0, 140, 24, 6);
                char.shieldG.strokeRoundedRect(80, 0, 140, 24, 6);
                char.shieldT.setPosition(90, 4);
            }
            char.shieldT.setText(`🛡️ SHIELD: ${char.shield}`);
        } else {
            char.shieldT.setText('');
        }
    }''',
    code,
    flags=re.DOTALL
)

with open('src/scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated simple methods in Game.js")
