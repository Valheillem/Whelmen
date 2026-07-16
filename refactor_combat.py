import re
import os

with open('src/systems/CombatSystem.js', 'r', encoding='utf-8') as f:
    combat_code = f.read()

# Replace assignments in CombatSystem.js
combat_code = re.sub(
    r'const char = who === \'player\' \? this\.scene\.player : this\.scene\.ai;',
    r'const char = this.scene.players[who];',
    combat_code
)
combat_code = re.sub(
    r'const state = who === \'player\' \? this\.scene\.player : this\.scene\.ai;',
    r'const state = this.scene.players[who];',
    combat_code
)
combat_code = re.sub(
    r'let defChar = defender === \'player\' \? this\.scene\.player : this\.scene\.ai;',
    r'let defChar = this.scene.players[defender];',
    combat_code
)
combat_code = re.sub(
    r'let attChar = attacker === \'player\' \? this\.scene\.player : this\.scene\.ai;',
    r'let attChar = this.scene.players[attacker];',
    combat_code
)
combat_code = re.sub(
    r'const defChar = defender === \'player\' \? this\.scene\.player : this\.scene\.ai;',
    r'const defChar = this.scene.players[defender];',
    combat_code
)
combat_code = re.sub(
    r'const attChar = attacker === \'player\' \? this\.scene\.player : this\.scene\.ai;',
    r'const attChar = this.scene.players[attacker];',
    combat_code
)
# Fix check `if (who === 'player')` to check if it's the local player
combat_code = re.sub(
    r'if \(who === \'player\'\) \{',
    r'if (who === (this.scene.myRole === "host" || this.scene.mode !== "online" ? "player" : this.scene.myRole)) {',
    combat_code
)
combat_code = re.sub(
    r'if \(who === \'player\' && char\.shield > 90\)',
    r'if (who === (this.scene.myRole === "host" || this.scene.mode !== "online" ? "player" : this.scene.myRole) && char.shield > 90)',
    combat_code
)

with open('src/systems/CombatSystem.js', 'w', encoding='utf-8') as f:
    f.write(combat_code)

print("Updated CombatSystem.js")

with open('src/systems/SynergySystem.js', 'r', encoding='utf-8') as f:
    synergy_code = f.read()

# Replace global debuffs in SynergySystem.js
synergy_code = re.sub(
    r'this\.scene\.player\.status\.([a-zA-Z0-9_]+) = ([0-9]+); this\.scene\.ai\.status\.\1 = \2;',
    r'this.scene.playerIds.forEach(pid => this.scene.players[pid].status.\1 = \2);',
    synergy_code
)

with open('src/systems/SynergySystem.js', 'w', encoding='utf-8') as f:
    f.write(synergy_code)

print("Updated SynergySystem.js")
