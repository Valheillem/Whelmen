import re
import os

with open('scenes/Game.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Add getLocalPlayerId method
def add_method(match):
    return match.group(0) + '''\n    getLocalPlayerId() {\n        return this.mode === 'online' ? this.myRole : 'player';\n    }\n'''
code = re.sub(r'init\(data\) \{[\s\S]*?\}\n', add_method, code)

# Fix Object.defineProperty
code = re.sub(r"Object\.defineProperty\(this, 'player', \{.*?\}\);", "Object.defineProperty(this, 'player', { configurable: true, get: () => this.players[this.getLocalPlayerId()] });", code)
code = re.sub(r"Object\.defineProperty\(this, 'ai', \{.*?\}\);", "Object.defineProperty(this, 'ai', { configurable: true, get: () => { const local = this.getLocalPlayerId(); const oppId = this.playerIds.find(p => p !== local) || this.playerIds[1]; return this.players[oppId]; }});", code)

# Fix isLocal check
code = code.replace("const isLocal = who === (this.myRole === 'host' || this.mode !== 'online' ? 'player' : this.myRole);", "const isLocal = who === this.getLocalPlayerId();")

# Fix inline ternary
code = code.replace("this.myRole === 'host' || this.mode !== 'online' ? 'player' : this.myRole", "this.getLocalPlayerId()")
code = code.replace("this.myRole === \"host\" || this.mode !== \"online\" ? \"player\" : this.myRole", "this.getLocalPlayerId()")

# Replace string literal checks
code = code.replace("who === 'player'", "who === this.getLocalPlayerId()")
code = code.replace("this.turn === 'player'", "this.turn === this.getLocalPlayerId()")
code = code.replace("defender === 'player'", "defender === this.getLocalPlayerId()")
code = code.replace("attacker === 'player'", "attacker === this.getLocalPlayerId()")
code = code.replace("player === 'player'", "player === this.getLocalPlayerId()")
code = code.replace("p === 'player'", "p === this.getLocalPlayerId()")

with open('scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(code)

with open('systems/CombatSystem.js', 'r', encoding='utf-8') as f:
    combat = f.read()

combat = combat.replace("this.scene.myRole === 'host' || this.scene.mode !== 'online' ? 'player' : this.scene.myRole", "this.scene.getLocalPlayerId()")
combat = combat.replace('this.scene.myRole === "host" || this.scene.mode !== "online" ? "player" : this.scene.myRole', "this.scene.getLocalPlayerId()")
combat = combat.replace("who === 'player'", "who === this.scene.getLocalPlayerId()")
combat = combat.replace("this.scene.turn === 'player'", "this.scene.turn === this.scene.getLocalPlayerId()")
combat = combat.replace("defender === 'player'", "defender === this.scene.getLocalPlayerId()")
combat = combat.replace("attacker === 'player'", "attacker === this.scene.getLocalPlayerId()")

with open('systems/CombatSystem.js', 'w', encoding='utf-8') as f:
    f.write(combat)

print('Done')
